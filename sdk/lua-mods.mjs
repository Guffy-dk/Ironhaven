import fengari from 'fengari';
import {createHash} from 'node:crypto';
import {MOD_API,STAGES,validateCatalog} from '../public/shared/mod-catalog.js';
import {CURRENT_VERSION} from '../public/shared/releases.js';
const {lua,lauxlib,lualib,to_luastring:ls,to_jsstring:js}=fengari;
const compare=(a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++)if(x[i]!==y[i])return Math.sign(x[i]-y[i]);return 0;};
const matches=(version,op,wanted)=>{if(!op)return true;const n=compare(version,wanted);return ({'=':n===0,'>':n>0,'>=':n>=0,'<':n<0,'<=':n<=0})[op];};
export function orderMods(packs){
 if(!Array.isArray(packs)||packs.length>32)throw Error('At most 32 mods are supported');
 const map=new Map();let bytes=0;
 for(const pack of packs){const p=pack.info;
  if(!p||!/^[-a-zA-Z0-9_]+$/.test(p.name)||p.name==='base'||!/^\d+\.\d+\.\d+$/.test(p.version)||p.ironhaven_version!=='0.20'||p.mod_api!==MOD_API)throw Error('Invalid/incompatible info.json');
  if(map.has(p.name))throw Error('Duplicate mod '+p.name);
  if(!Array.isArray(p.dependencies??[]))throw Error('Invalid dependencies');
  for(const [path,source]of Object.entries(pack.files??{})){
   if(!/^(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.lua$/.test(path)||typeof source!=='string'||source.length>128*1024)throw Error('Invalid mod source: '+path);
   if(/^(control|settings(?:-updates|-final-fixes)?)\.lua$/.test(path))throw Error(path+' is not supported by mod API '+MOD_API);
   bytes+=Buffer.byteLength(source);if(bytes>2*1024*1024)throw Error('Mod sources exceed 2 MiB');
  }
  map.set(p.name,pack);
 }
 const ordered=[],visiting=new Set(),done=new Set();
 function visit(name){
  if(done.has(name))return;if(visiting.has(name))throw Error('Mod dependency cycle at '+name);visiting.add(name);
  const pack=map.get(name);
  const deps=[];
  for(const dep of pack.info.dependencies??['base']){
   if(typeof dep!=='string')throw Error('Invalid dependency');
   const m=dep.match(/^(?:(\?|!)\s*)?([A-Za-z0-9_-]+)(?:\s*(>=|<=|=|>|<)\s*(\d+\.\d+\.\d+))?$/);if(!m)throw Error('Unsupported dependency: '+dep);
   const [,prefix,target,op,wanted]=m,found=target==='base'?{info:{version:CURRENT_VERSION}}:map.get(target);
   if(prefix==='!'){if(found&&matches(found.info.version,op,wanted))throw Error('Conflicting mod '+target);continue;}
   if(!found){if(prefix==='?')continue;throw Error('Missing dependency '+target);}
   if(!matches(found.info.version,op,wanted))throw Error('Dependency version mismatch: '+target);
   if(target!=='base')deps.push(target);
  }
  deps.sort().forEach(visit);visiting.delete(name);done.add(name);ordered.push(pack);
 }
 [...map.keys()].sort().forEach(visit);return ordered;
}
function literal(v){
 if(v===null||v===undefined)return 'nil';if(typeof v==='boolean'||typeof v==='number')return String(v);
 if(typeof v==='string')return '"'+Array.from(new TextEncoder().encode(v),c=>'\\'+String(c).padStart(3,'0')).join('')+'"';
 return '{'+(Array.isArray(v)?v.map(literal):Object.entries(v).map(([k,x])=>'['+literal(k)+']='+literal(x))).join(',')+'}';
}
function readValue(L,index,depth=0,seen=new Set(),budget={n:0}){
 if(depth>20||++budget.n>40000)throw Error('Mod data exceeds structural limits');
 const t=lua.lua_type(L,index);
 if(t===lua.LUA_TNIL)return null;if(t===lua.LUA_TBOOLEAN)return !!lua.lua_toboolean(L,index);
 if(t===lua.LUA_TNUMBER){const n=lua.lua_tonumber(L,index);if(!Number.isFinite(n))throw Error('Non-finite mod number');return n;}
 if(t===lua.LUA_TSTRING){const s=js(lua.lua_tolstring(L,index));if(s.length>8192)throw Error('Mod string is too long');return s;}
 if(t!==lua.LUA_TTABLE)throw Error('Prototype data must contain only serializable values');
 const pointer=lua.lua_topointer(L,index);if(seen.has(pointer))throw Error('Cyclic prototype table');seen.add(pointer);
 const absolute=lua.lua_absindex(L,index),out=Object.create(null);lua.lua_pushnil(L);
 while(lua.lua_next(L,absolute)){
  const keyType=lua.lua_type(L,-2);if(![lua.LUA_TSTRING,lua.LUA_TNUMBER].includes(keyType))throw Error('Unsupported table key');
  const key=keyType===lua.LUA_TSTRING?js(lua.lua_tolstring(L,-2)):String(lua.lua_tonumber(L,-2));
  if(['__proto__','constructor','prototype'].includes(key))throw Error('Reserved prototype key');
  out[key]=readValue(L,-1,depth+1,seen,budget);lua.lua_pop(L,1);
 }
 seen.delete(pointer);const keys=Object.keys(out);return keys.length&&keys.every((_,i)=>Object.hasOwn(out,String(i+1)))?keys.map((_,i)=>out[String(i+1)]):out;
}
export function compileMods(seed,packs){
 const ordered=orderMods(packs),L=lauxlib.luaL_newstate();let instructions=0,current=null;const moduleCache=new Map();
 function run(source,label,results=0){
  if(lauxlib.luaL_loadbufferx(L,ls(source),null,ls(label),ls('t'))!==lua.LUA_OK)throw Error(label+': '+js(lua.lua_tostring(L,-1)));
  if(lua.lua_pcall(L,0,results,0)!==lua.LUA_OK)throw Error(label+': '+js(lua.lua_tostring(L,-1)));
 }
 try{
  lua.lua_atnativeerror(L,state=>{const error=lua.lua_touserdata(state,1);lua.lua_pushstring(state,ls(error?.message??String(error)));return 1;});
  for(const [name,open]of [['_G',lualib.luaopen_base],['table',lualib.luaopen_table],['string',lualib.luaopen_string],['math',lualib.luaopen_math]]){lauxlib.luaL_requiref(L,ls(name),open,1);lua.lua_pop(L,1);}
  run('io=nil; os=nil; debug=nil; package=nil; dofile=nil; loadfile=nil; load=nil; collectgarbage=nil; print=nil; math.random=nil; math.randomseed=nil; string.rep=nil; string.dump=nil; string.format=nil; pcall=nil; xpcall=nil','sandbox');
  lua.lua_sethook(L,()=>{instructions+=1000;if(instructions>1000000)throw Error('Lua instruction budget exceeded');},lua.LUA_MASKCOUNT,1000);
  run(`data={raw=${literal(seed)}}
function data:extend(prototypes)
 for _,p in ipairs(prototypes) do
  assert(type(p.type)=='string' and type(p.name)=='string','Prototype requires type and name')
  self.raw[p.type]=self.raw[p.type] or {}
  assert(not self.raw[p.type][p.name],'Duplicate prototype '..p.name)
  self.raw[p.type][p.name]=p
 end
end
function table.deepcopy(value)
 if type(value)~='table' then return value end
 local out={} for k,v in pairs(value) do out[table.deepcopy(k)]=table.deepcopy(v) end return out
end`,'data bootstrap');
  lua.lua_pushjsfunction(L,()=>{
   const name=js(lauxlib.luaL_checkstring(L,1)),path=name.replaceAll('.','/')+'.lua';
   if(!/^(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.lua$/.test(path)||!Object.hasOwn(current.files,path))throw Error('Unknown local Lua module '+name);
   const key=current.info.name+':'+path;
   if(moduleCache.has(key)){if(moduleCache.get(key)===null)throw Error('Lua module require cycle: '+name);lua.lua_rawgeti(L,lua.LUA_REGISTRYINDEX,moduleCache.get(key));return 1;}
   moduleCache.set(key,null);run(current.files[path],key,1);
   if(lua.lua_isnil(L,-1)){lua.lua_pop(L,1);lua.lua_pushboolean(L,true);}
   lua.lua_pushvalue(L,-1);moduleCache.set(key,lauxlib.luaL_ref(L,lua.LUA_REGISTRYINDEX));return 1;
  });lua.lua_setglobal(L,ls('require'));
  for(const stage of STAGES)for(const pack of ordered){current=pack;if(pack.files?.[stage])run(pack.files[stage],pack.info.name+'/'+stage);}
  lua.lua_getglobal(L,ls('data'));lua.lua_getfield(L,-1,ls('raw'));const raw=JSON.parse(JSON.stringify(readValue(L,-1)));
  for(const [kind,prototypes]of Object.entries(seed))for(const name of Object.keys(prototypes))if(!Object.hasOwn(raw[kind]??{},name))throw Error('Removing shipped prototypes is unsupported: '+name);
  for(const [name,item]of Object.entries(seed.item??{}))if((item.stored!==false)!==(raw.item[name].stored!==false))throw Error('Changing a shipped item storage class is unsupported: '+name);
  const catalog=validateCatalog(raw);
  const mods=ordered.map(p=>({name:p.info.name,version:p.info.version,hash:createHash('sha256').update(JSON.stringify({info:p.info,files:Object.fromEntries(Object.entries(p.files??{}).sort(([a],[b])=>a<b?-1:a>b?1:0))})).digest('hex')}));
  return {raw,catalog,mods};
 }finally{lua.lua_close(L);}
}
