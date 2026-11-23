import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile,mkdtemp,cp,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {compileMods,orderMods} from '../sdk/lua-mods.mjs';
import {catalogSeed} from '../sdk/catalog-seed.mjs';
import {CONTENT} from '../public/shared/content.js';
import {validateCatalog,contentSignature,checkContent} from '../public/shared/mod-catalog.js';
import * as game from '../public/shared/sim.js';
const require=createRequire(import.meta.url),{loadModSources,compileInWorker,injectModData}=require('../desktop/mod-loader.cjs');
const seed=catalogSeed(game,CONTENT);
const info=name=>({name,version:'1.0.0',ironhaven_version:'0.20',mod_api:'1.0',dependencies:['base >= 0.20.2']});
const pack=(name,files={},dependencies)=>({info:{...info(name),...(dependencies?{dependencies}:{})},files});
async function example(){
 const root=await mkdtemp(path.join(tmpdir(),'ironhaven-mod-test-'));
 await cp(new URL('../examples/mods/harbor-machining',import.meta.url),path.join(root,'harbor-machining'),{recursive:true});
 await writeFile(path.join(root,'mod-list.json'),JSON.stringify({mods:[{name:'harbor-machining',enabled:true}]}));
 return {root,packs:await loadModSources(root)};
}
test('real Lua stages run across dependency-ordered mods and local require returns a cached module value',()=>{
 const a=pack('a',{'data.lua':'local p=require("prototypes.test"); assert(p.value==7); assert(require("prototypes.test")==p); data.raw.recipe.smelter.energy_required=p.value','prototypes/test.lua':'return {value=7}','data-updates.lua':'data.raw.recipe.smelter.energy_required=data.raw.recipe.smelter.energy_required+2'});
 const b=pack('b',{'data.lua':'assert(data.raw.recipe.smelter.energy_required==7)','data-final-fixes.lua':'assert(data.raw.recipe.smelter.energy_required==9)'},['a >= 1.0.0']);
 const result=compileMods(seed,[b,a]);assert.equal(result.catalog.recipes.smelter.seconds,9);assert.deepEqual(result.mods.map(m=>m.name),['a','b']);assert.equal(seed.recipe.smelter.energy_required,1.6);
 assert.equal(contentSignature(result.mods),contentSignature(compileMods(seed,[a,b]).mods));
 const changed=structuredClone(a);changed.files['data.lua']+='\n-- changed';assert.notEqual(contentSignature(result.mods),contentSignature(compileMods(seed,[b,changed]).mods));
});
test('dependencies reject missing versions, conflicts, duplicate names and cycles',()=>{
 assert.throws(()=>orderMods([pack('a',{},['missing'])]),/Missing dependency/);
 assert.throws(()=>orderMods([pack('a',{},['base >= 1.0.0'])]),/version mismatch/);
 assert.throws(()=>orderMods([pack('a',{},['! b']),pack('b')]),/Conflicting/);
 assert.throws(()=>orderMods([pack('a'),pack('a')]),/Duplicate/);
 assert.throws(()=>orderMods([pack('a',{},['b']),pack('b',{},['a'])]),/cycle/);
 assert.equal(orderMods([pack('a',{},['? absent >= 1.0.0'])]).length,1);
});
test('Lua cannot access system APIs and invalid/unsupported content cannot partially mutate the seed',()=>{
 const before=JSON.stringify(seed);
 compileMods(seed,[pack('safe',{'data.lua':'assert(os==nil and io==nil and debug==nil and package==nil and load==nil and math.random==nil)'})]);
 assert.throws(()=>compileMods(seed,[pack('runtime',{'control.lua':'script.on_event(1,function() end)'})]),/not supported/);
 assert.throws(()=>compileMods(seed,[pack('invalid',{'data.lua':'data.raw.recipe.smelter.result="missing"'})]),/Unknown recipe result/);
 assert.throws(()=>compileMods(seed,[pack('delete',{'data.lua':'data.raw.item.plate=nil'})]),/Removing shipped/);
 assert.throws(()=>compileMods(seed,[pack('loop',{'data.lua':'while true do end'})]),/budget/);
 assert.throws(()=>compileMods(seed,[pack('path',{'data.lua':'require("../outside")'})]),/Unknown local Lua module/);
 assert.equal(JSON.stringify(seed),before);
});
test('prototype validation rejects free generation, oversized batches and reserved overrides',()=>{
 const raw=structuredClone(seed);raw.recipe.smelter.ingredients={};assert.throws(()=>validateCatalog(raw),/require inputs/);
 raw.recipe.smelter.ingredients={ore:1};raw.recipe.smelter.result_count=6;assert.throws(()=>validateCatalog(raw),/result count/);
 raw.recipe.smelter.result_count=1;raw['assembling-machine'].hq={...raw['assembling-machine'].smelter,name:'hq'};assert.throws(()=>validateCatalog(raw),/Unsupported building override/);
 delete raw['assembling-machine'].hq;raw.item.power={type:'item',name:'power'};assert.throws(()=>validateCatalog(raw),/Power is not an item/);
 delete raw.item.power;raw['assembling-machine'].smelter.graphics.filename='custom.glb';assert.throws(()=>validateCatalog(raw),/Unsupported graphics field/);
});
test('Windows folder loader loads only explicitly enabled Lua folders and rejects path/symlink entries',async()=>{
 const {root,packs}=await example();assert.equal(packs.length,1);assert.ok(packs[0].files['prototypes/machining.lua']);
 await writeFile(path.join(root,'mod-list.json'),JSON.stringify({mods:[{name:'harbor-machining',enabled:false}]}));assert.deepEqual(await loadModSources(root),[]);
 await writeFile(path.join(root,'mod-list.json'),JSON.stringify({mods:[{name:'../outside',enabled:true}]}));await assert.rejects(loadModSources(root),/Invalid/);
 const linked=path.join(root,'linked');await symlink(path.join(root,'harbor-machining'),linked,process.platform==='win32'?'junction':'dir');
 await writeFile(path.join(root,'mod-list.json'),JSON.stringify({mods:[{name:'linked',enabled:true}]}));await assert.rejects(loadModSources(root),/ordinary folders/);
});
test('example mod compiles in the packaged worker, loads into the actual simulation, and binds saves/LAN to content',async()=>{
 const {packs}=await example();
 // The unbundled worker and bundled worker use the same entry; packaging separately verifies the latter.
 const result=await compileInWorker(seed,packs,new URL('../sdk/mod-worker.mjs',import.meta.url));
 assert.equal(result.catalog.recipes['bronze-fitting'].seconds,4.5);
 assert.equal(result.catalog.buildings['fitting-shop'].recipe,'bronze-fitting');
 const html=injectModData('<head></head><body></body>',result);assert.ok(html.includes('ironhaven-mod-data'));assert.ok(!html.includes('<script>'));
 const script=`
 import fs from 'node:fs';import assert from 'node:assert/strict';
 const payload=fs.readFileSync(0,'utf8');globalThis.document={getElementById:id=>id==='ironhaven-mod-data'?{textContent:payload}:null};
 const g=await import('./public/shared/sim.js');const saves=await import('./public/shared/saves.js');const network=await import('./public/network.js');
 const s=g.createGame(417),p=g.addPlayer(s);s.buildings=s.buildings.filter(b=>b.type==='hq');s.terrain.trees=[];s.terrain.rocks=[];s.nextWave=1e9;
 for(const r of g.RESOURCE_KEYS)s.resources[r]=1000;
 assert.equal(g.command(s,p.id,{type:'build',building:'fitting-shop',x:3,z:0}),null);
 assert.equal(g.command(s,p.id,{type:'build',building:'storage',x:4,z:0}),null);
 const machine=s.buildings.find(b=>b.type==='fitting-shop');machine.input=['copper','copper','plate'];
 for(const r of g.RESOURCE_KEYS)s.resources[r]=0;s.resources.power=180;
 for(let i=0;i<100;i++)g.step(s);
 assert.equal(s.resources['bronze-fitting'],1);assert.equal(machine.input.length,0);assert.equal(g.warehouseStock(s.buildings.find(b=>b.type==='storage'),'bronze-fitting'),1);
 const saved=saves.packWorldSave(s,p.id);assert.equal(saves.parseSave(JSON.stringify(saved)).state.resources['bronze-fitting'],1);
 const code=network.encodeCode({type:'offer',sdp:'test'});assert.equal(network.decodeCode(code,'offer').sdp,'test');
 const data=JSON.parse(atob(code.slice(4)));data.content='mismatch';assert.throws(()=>network.decodeCode('IH2.'+btoa(JSON.stringify(data)),'offer'),/content does not match/);
 saved.state.contentSignature='mismatch';assert.throws(()=>saves.parseSave(JSON.stringify(saved)),/content does not match/);
 console.log('actual modded production, warehouse, save and LAN flow passed');`;
 const output=execFileSync(process.execPath,['--input-type=module','-e',script],{cwd:new URL('..',import.meta.url),input:JSON.stringify(result),encoding:'utf8'});
 assert.match(output,/actual modded production/);
});
test('legacy unmodded worlds remain loadable; mod mismatches fail before migration',()=>{
 const s=game.createGame(),p=game.addPlayer(s);delete s.contentSignature;assert.equal(checkContent(s),contentSignature());
 assert.equal(game.migrateGame(s).contentSignature,game.CONTENT_SIGNATURE);
 assert.throws(()=>checkContent({},[{name:'x',version:'1.0.0',hash:'abc'}]),/content does not match/);
 assert.equal(p.id,s.players[0].id);
});
