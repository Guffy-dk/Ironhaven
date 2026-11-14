// Exercise real DOM controls with only the GPU replaced. This is not a visual browser test.
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';
import {build} from 'esbuild';
import {createGame,addPlayer,maxHp,step} from '../public/shared/sim.js';
import {CURRENT_VERSION,displayVersion,RELEASES} from '../public/shared/releases.js';
const html=(await readFile(new URL('../public/index.html',import.meta.url),'utf8')).replace(/<script[^>]*src="\.\/app\.js"[^>]*><\/script>/,'').replace(/<link[^>]+>/g,'');
const bundle=await build({entryPoints:[fileURLToPath(new URL('../public/app.js',import.meta.url))],bundle:true,format:'iife',write:false,plugins:[{name:'gpu-stub',setup(b){b.onResolve({filter:/^\.\/render\.js$/},()=>({path:'renderer',namespace:'qa'}));b.onLoad({filter:/.*/,namespace:'qa'},()=>({contents:`export class View{constructor(){globalThis.__view=this;this.center={x:0,z:0,set(x,y,z){this.x=x;this.z=z;}};this.cursor={visible:false};this.zoom=14;}setTool(t){this.tool=t;}previewRoute(c){this.route=c;}markArea(ids){this.area=ids;}select(b){this.selected=b;}hover(){}sync(){}draw(){}centerBase(){}setZoom(){}setQuality(){}pan(){}follow(p){this.followed={...p};}project(x,z){return{x:x+500,y:z+400,visible:true}}point(x,y){return{x:Math.round(x),z:Math.round(y)}}}` }));}}]});
function harness(saved,{tutorial=false}={}){
 const dom=new Window({url:'https://ironhaven.test/'}),frames=[],ticks=[];
 dom.document.write(html);dom.requestAnimationFrame=f=>(frames.push(f),1);dom.setInterval=f=>(ticks.push(f),ticks.length);dom.setTimeout=()=>1;
 dom.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(t,k)=>k in t?t[k]:()=>{}});
 for(const d of dom.document.querySelectorAll('dialog')){d.showModal=()=>d.setAttribute('open','');d.close=()=>d.removeAttribute('open');}
 if(saved)dom.localStorage.setItem('ironhaven.save.v1',JSON.stringify(saved));
 if(!tutorial)dom.localStorage.setItem('ironhaven.skipTutorial','true');
 dom.eval(bundle.outputFiles[0].text);
 const $=id=>dom.document.getElementById(id),tool=t=>dom.document.querySelector(`[data-type="${t}"]`).click();
 const point=(type,x,z,shift=false)=>$('world').dispatchEvent(new dom.PointerEvent(type,{button:0,clientX:x,clientY:z,shiftKey:shift,bubbles:true}));
 const key=k=>dom.dispatchEvent(new dom.KeyboardEvent('keydown',{key:k,bubbles:true}));
 const frame=n=>frames.shift()?.(n),save=()=>{$('save').click();return JSON.parse(dom.localStorage.getItem('ironhaven.save.v1')).state;};
 return{dom,$,tool,point,key,frame,ticks,save,close:()=>dom.happyDOM.abort()};
}
test('English UI and menu expose current and historical patch notes',async()=>{
 const h=harness();try{assert.equal(h.dom.document.documentElement.lang,'en');assert.equal(h.$('loading').hidden,true);assert.match(h.$('version-label').textContent,new RegExp(displayVersion(CURRENT_VERSION)));h.$('start-patch-notes').click();assert.ok(h.$('patch-dialog').hasAttribute('open'));assert.equal(h.$('patch-history').querySelectorAll('article').length,RELEASES.length);assert.match(h.$('patch-history').textContent,/First light/);h.$('patch-dialog').close();h.$('start-solo').click();h.$('menu').click();h.dom.document.querySelector('#menu-dialog [data-patch-notes]').click();assert.ok(h.$('patch-dialog').hasAttribute('open'));assert.ok(!h.$('menu-dialog').hasAttribute('open'));}finally{await h.close();}
});
test('Shift-click constructs a continuous turning route; Q and Esc cancel building; R rotates in place',async()=>{
 const h=harness();try{
  h.$('start-solo').click();h.tool('belt');h.point('pointerdown',3,4);h.point('pointerup',3,4);
  h.point('pointerdown',6,6,true);assert.ok(h.dom.__view.route.length>=6);h.point('pointerup',6,6,true);
  let s=h.save();for(const[x,z]of[[3,4],[4,4],[5,4],[6,4],[6,5],[6,6]])assert.ok(s.buildings.some(b=>b.type==='belt'&&b.x===x&&b.z===z));
  const corner=s.buildings.find(b=>b.x===6&&b.z===4);assert.equal(corner.dir,1);h.key('q');assert.equal(h.$('tool-hint').hidden,true);assert.equal(h.dom.__view.tool,null);
  h.point('pointermove',6,4);h.key('r');const rotated=h.save().buildings.find(b=>b.id===corner.id);assert.equal(rotated.dir,2);assert.equal(rotated.hp,corner.hp);
  h.tool('wall');h.point('pointerdown',2,8,true);h.point('pointermove',5,8,true);h.key('Escape');h.point('pointerup',5,8,true);s=h.save();assert.ok(!s.buildings.some(b=>b.type==='wall'&&b.x===2&&b.z===8));
 }finally{await h.close();}
});
test('hotbar inventory counts rise on dismantle and fall on free placement; selected turret upgrades',async()=>{
 const h=harness();try{
  h.$('start-solo').click();const initial=h.save(),belt=initial.buildings.find(b=>b.type==='belt');h.tool('demolish');h.point('pointerdown',belt.x,belt.z);h.frame(1000);
  assert.equal(h.dom.document.querySelector('[data-type="belt"] .inventory-count').textContent,'1');const resources={...h.save().resources};h.tool('belt');h.point('pointerdown',4,7);h.frame(1400);const placed=h.save();assert.deepEqual(placed.resources,resources);assert.equal(h.dom.document.querySelector('[data-type="belt"] .inventory-count').textContent,'0');
  h.key('q');const turret=placed.buildings.find(b=>b.type==='turret');h.point('pointerdown',turret.x,turret.z);assert.equal(h.$('upgrade-turret').hidden,false);h.$('upgrade-turret').click();assert.equal(h.save().buildings.find(b=>b.id===turret.id).level,2);
 }finally{await h.close();}
});
test('R rotates the active blueprint without turning a conveyor under the cursor',async()=>{
 const h=harness();try{
  h.$('start-solo').click();
  h.tool('belt');
  h.point('pointermove',-7,-3);
  h.key('r');
  h.point('pointerdown',3,4);
  const state=h.save();
  assert.equal(state.buildings.find(b=>b.x===-7&&b.z===-3).dir,0);
  assert.equal(state.buildings.find(b=>b.x===3&&b.z===4).dir,1);
 }finally{await h.close();}
});
test('damage bars hide at full health; empty ammo and the final 20-second warning are visible',async()=>{
 const state=createGame(),p=addPlayer(state);state.time=80;state.resources.gear=0;const core=state.buildings[0];core.hp=2000;const turret=state.buildings.find(b=>b.type==='turret');turret.ammo=0;
 const h=harness({state,playerId:p.id});try{
  h.$('resume').click();h.frame(1000);assert.ok(h.$('wave-panel').classList.contains('imminent'));assert.equal(h.$('ammo-alert').hidden,false);assert.match(h.$('ammo-alert').textContent,/AMMO EMPTY/);assert.ok(h.$('building-'+core.id).querySelector('.world-health'));assert.match(h.$('building-'+turret.id).textContent,/NO AMMO/);
  h.tool('repair');h.point('pointerdown',0,0);h.point('pointerdown',0,0);h.frame(1400);assert.equal(h.save().buildings[0].hp,maxHp(core));assert.equal(h.$('building-'+core.id),null);
 }finally{await h.close();}
});
test('W+A sends both movement axes and the camera follows the engineer',async()=>{
 const h=harness();try{h.$('start-solo').click();h.key('w');h.key('a');h.frame(1000);let s=h.save();assert.deepEqual(s.players[0].input,{x:0,z:0}); // saves intentionally stop movement
 for(let i=0;i<10;i++)h.ticks[0]();h.frame(1400);assert.ok(h.dom.__view.followed);s=h.save();assert.ok(s.players[0].x<2&&s.players[0].z<2);assert.equal(h.dom.__view.followed.id,s.players[0].id);
 }finally{await h.close();}
});
test('the playfield warning announces its forecast and attack independently of the minimap',async()=>{
 const h=harness();try{
  const warning=h.$('swarm-warning');
  assert.ok(warning.hidden);
  h.$('start-solo').click();
  h.dom.document.querySelector('[data-window-close="map-panel"]').click();
  assert.ok(!warning.hidden);
  assert.equal(warning.dataset.side,'north');
  assert.equal(h.$('swarm-warning-text').textContent,'Next swarm from North');
  assert.equal(h.dom.document.querySelectorAll('#hotbar [data-type="smelter"]').length,1);
  assert.equal(h.dom.document.querySelector('#hotbar [data-type="copperSmelter"]'),null);
 }finally{await h.close();}
 const s=createGame(),p=addPlayer(s);s.nextWave=0;step(s);
 const active=harness({state:s,playerId:p.id});try{
  active.$('resume').click();
  assert.ok(active.$('swarm-warning').classList.contains('urgent'));
  assert.equal(active.$('swarm-warning-text').textContent,'Swarm attacking from North');
 }finally{await active.close();}
});
test('drag-selection moves an area and Shift override asks once before packing invalid drills',async()=>{
 const h=harness();try{
  h.$('start-solo').click();h.point('pointerdown',-9,-4);h.point('pointermove',-4,-2);h.point('pointerup',-4,-2);assert.equal(h.$('area-tools').hidden,false);assert.ok(h.dom.__view.area.length>1);
  h.$('move-selection').click();h.point('pointermove',3,7);h.point('pointerdown',3,7,true);assert.ok(h.$('move-confirm').hasAttribute('open'));assert.match(h.$('move-invalid-list').textContent,/iron deposits/);
  h.$('move-dont-ask').checked=true;h.$('confirm-move').click();assert.equal(h.dom.localStorage.getItem('ironhaven.skipMoveConfirm'),'true');assert.ok(h.save().players[0].inventory.drill.length>0);assert.equal(h.$('area-tools').hidden,true);
  h.$('reset-move-confirm').click();assert.equal(h.dom.localStorage.getItem('ironhaven.skipMoveConfirm'),'');
 }finally{await h.close();}
});
test('panels can be moved, minimized, closed and restored without changing the world',async()=>{
 const h=harness();try{
  h.$('start-solo').click();const before=h.save().buildings.length,handle=h.$('intel').querySelector('.window-handle');
  handle.dispatchEvent(new h.dom.PointerEvent('pointerdown',{button:0,clientX:20,clientY:30,bubbles:true}));h.dom.dispatchEvent(new h.dom.PointerEvent('pointermove',{clientX:100,clientY:100}));h.dom.dispatchEvent(new h.dom.PointerEvent('pointerup',{button:0}));assert.equal(h.$('intel').style.position,'fixed');assert.ok(parseFloat(h.$('intel').style.width)>0);assert.ok(h.dom.localStorage.getItem('ironhaven.windows.v1'));
  h.dom.document.querySelector('[data-window-minimize="intel"]').click();assert.ok(h.$('intel').classList.contains('window-minimized'));h.dom.document.querySelector('[data-window-close="intel"]').click();assert.equal(h.$('intel').hidden,true);h.dom.document.querySelector('[data-window-toggle="intel"]').click();assert.equal(h.$('intel').hidden,false);h.$('reset-windows').click();assert.equal(h.$('intel').style.position,'');assert.equal(h.$('intel').style.width,'');assert.equal(h.save().buildings.length,before);
 }finally{await h.close();}
});
test('production report and bottleneck overlay work, and pre-swarm checkpoints can be retried',async()=>{
 const h=harness();try{
  h.$('start-solo').click();h.key('i');assert.ok(h.$('production-dialog').open);assert.equal(h.$('production-rows').children.length,7);h.$('production-dialog').close();h.key('b');h.frame(1000);assert.match(h.$('building-labels').textContent,/Running|Waiting for inputs/);
  for(let attempt=0;attempt<5;attempt++){h.$('early-wave').click();for(let i=0;i<62;i++)h.ticks[0]();h.$('retry-checkpoint').click();const saved=h.save();assert.equal(saved.wave,0);assert.equal(saved.enemies.length,0);assert.ok(saved.nextWave-saved.time>=19.9);}
  const checkpoints=JSON.parse(h.dom.localStorage.getItem('ironhaven.checkpoints.v1'));assert.ok(checkpoints.length<=3);assert.match(checkpoints[0].label,/Before swarm/);
 }finally{await h.close();}
});
test('logistics units expose editable quotas, presets, filter and wait behavior',async()=>{
 const h=harness();try{
  h.$('start-solo').click();h.tool('splitter');h.point('pointerdown',3,4);h.key('q');h.point('pointerdown',3,4);h.point('pointerup',3,4);assert.equal(h.$('program-building').hidden,false);h.key('e');assert.ok(h.$('program-dialog').open);assert.equal(h.$('quota-machine').value,'1');assert.equal(h.$('quota-forward').value,'1');assert.equal(h.$('quota-return').value,'0');
  h.$('quota-machine').value='2';h.$('quota-forward').value='3';h.$('quota-return').value='1';h.$('program-wait').checked=true;h.$('program-filter').value='ore';assert.equal(h.$('program-buffer').value,'2','buffer select must retain its value');h.$('apply-program').click();const b=h.save().buildings.find(b=>b.x===3&&b.z===4);assert.deepEqual(b.program,{machine:2,forward:3,return:1,bypass:false,filter:'ore',buffer:2});
 }finally{await h.close();}
});
test('new-world tutorial pauses, advances and remembers the skip checkbox; it can be replayed',async()=>{
 const h=harness(undefined,{tutorial:true});try{
  h.$('start-solo').click();assert.ok(h.$('tutorial-dialog').open);assert.equal(h.save().paused,true);assert.match(h.$('tutorial-title').textContent,/expedition/);h.$('tutorial-next').click();assert.equal(h.$('tutorial-step').textContent,'2 / 8');h.$('tutorial-back').click();assert.equal(h.$('tutorial-step').textContent,'1 / 8');h.$('tutorial-dont-show').checked=true;h.$('tutorial-skip').click();assert.equal(h.save().paused,false);assert.equal(h.dom.localStorage.getItem('ironhaven.skipTutorial'),'true');assert.equal(h.$('skip-tutorial').checked,true);
  h.$('restart').click();assert.ok(!h.$('tutorial-dialog').open);h.$('show-tutorial').click();assert.ok(h.$('tutorial-dialog').open);h.$('tutorial-close').click();assert.equal(h.save().paused,false);
 }finally{await h.close();}
});
test('skip checkbox bypasses onboarding and resuming a saved world does not trigger the new-world tutorial',async()=>{
 const h=harness(undefined,{tutorial:true});try{h.$('skip-tutorial').checked=true;h.$('start-solo').click();assert.ok(!h.$('tutorial-dialog').open);assert.equal(h.save().paused,false);}finally{await h.close();}
 const s=createGame(),p=addPlayer(s),resumed=harness({state:s,playerId:p.id},{tutorial:true});try{resumed.$('resume').click();assert.ok(!resumed.$('tutorial-dialog').open);}finally{await resumed.close();}
});
