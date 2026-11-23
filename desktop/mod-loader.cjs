// Only sources/data cross this boundary; mods never get a Node/Electron bridge.
const {readdir,readFile,lstat,mkdir,realpath}=require('node:fs/promises');
const path=require('node:path');
const {Worker}=require('node:worker_threads');
const SOURCE_LIMIT=128*1024;
async function readLimited(file,limit){const stat=await lstat(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>limit)throw Error('Invalid or oversized mod file: '+path.basename(file));return readFile(file,'utf8');}
async function loadModSources(directory){
 await mkdir(directory,{recursive:true});
 let selection;
 try{selection=JSON.parse(await readLimited(path.join(directory,'mod-list.json'),16384));}
 catch(error){if(error.code==='ENOENT')return [];throw error;}
 if(!selection||!Array.isArray(selection.mods)||selection.mods.length>32)throw Error('Invalid mod-list.json');
 const enabled=selection.mods.filter(m=>m.enabled===true);
 if(enabled.some(m=>typeof m.name!=='string'||!/^[-A-Za-z0-9_]+$/.test(m.name))||new Set(enabled.map(m=>m.name)).size!==enabled.length)throw Error('Invalid/duplicate enabled mod name');
 const packs=[];let total=0;
 const root=await realpath(directory);
 for(const entry of enabled){
  const folder=path.join(root,entry.name),stat=await lstat(folder);
  if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('Mods must be ordinary folders named by their info.json name');
  const info=JSON.parse(await readLimited(path.join(folder,'info.json'),16384));
  if(info.name!==entry.name)throw Error('Mod folder and info.json name do not match');
  const files={};
  async function scan(dir,prefix='',depth=0){
   if(depth>8)throw Error('Mod folders are too deeply nested');
   for(const child of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
    const local=path.join(dir,child.name),rel=prefix+child.name;
    if(child.isSymbolicLink())throw Error('Mod symlinks are not supported');
    if(child.isDirectory()){await scan(local,rel+'/',depth+1);continue;}
    if(!child.name.endsWith('.lua'))continue;
    if(Object.keys(files).length>=128)throw Error('Too many Lua files in mod');
    files[rel]=await readLimited(local,SOURCE_LIMIT);total+=Buffer.byteLength(files[rel]);if(total>2*1024*1024)throw Error('Enabled mod sources exceed 2 MiB');
   }
  }
  await scan(folder);packs.push({info,files});
 }
 return packs;
}
async function compileInWorker(seed,packs,workerFile){
 return new Promise((resolve,reject)=>{
  const worker=new Worker(workerFile,{workerData:{seed,packs},resourceLimits:{maxOldGenerationSizeMb:64,maxYoungGenerationSizeMb:16,stackSizeMb:4}});
  let settled=false;const finish=(error,result)=>{if(settled)return;settled=true;clearTimeout(timer);void worker.terminate();error?reject(error):resolve(result);};
  const timer=setTimeout(()=>finish(Error('Mod compilation exceeded its five-second startup budget')),5000);
  worker.once('message',m=>finish(m.error?Error(m.error):null,m.result));worker.once('error',e=>finish(e));worker.once('exit',code=>{if(!settled)finish(Error('Mod compiler exited before returning data ('+code+')'));});
 });
}
function injectModData(html,result){
 const json=JSON.stringify({raw:result.raw,mods:result.mods}).replaceAll('<','\\u003c').replaceAll('>','\\u003e').replaceAll('&','\\u0026');
 return html.replace('</head>',()=>'<script id="ironhaven-mod-data" type="application/json">'+json+'</script></head>');
}
module.exports={loadModSources,compileInWorker,injectModData};
