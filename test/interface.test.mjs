// Exercise real DOM controls with only the GPU replaced. This is not a visual browser test.
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';
import {build} from 'esbuild';
import {createGame,addPlayer,maxHp,step} from '../public/shared/sim.js';
import {TUTORIAL_STEPS} from '../public/shared/tutorial.js';
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
 const key=(k,shiftKey=false,ctrlKey=false)=>dom.dispatchEvent(new dom.KeyboardEvent('keydown',{key:k,shiftKey,ctrlKey,bubbles:true}));
 const release=k=>dom.dispatchEvent(new dom.KeyboardEvent('keyup',{key:k,bubbles:true}));
 const frame=n=>frames.shift()?.(n),save=()=>{$('save').click();return JSON.parse(dom.localStorage.getItem('ironhaven.save.v1')).state;};
 return{dom,$,tool,point,key,release,frame,ticks,save,close:()=>dom.happyDOM.abort()};
}
function starterWorld(){const state=createGame(),player=addPlayer(state);return {state,playerId:player.id};}
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
 const h=harness(starterWorld());try{
  h.$('resume').click();const initial=h.save(),belt=initial.buildings.find(b=>b.type==='belt');h.tool('demolish');h.point('pointerdown',belt.x,belt.z);h.frame(1000);
  assert.equal(h.dom.document.querySelector('[data-type="belt"] .inventory-count').textContent,'1');const resources={...h.save().resources};h.tool('belt');h.point('pointerdown',4,7);h.point('pointerup',4,7);h.frame(1400);const placed=h.save();assert.deepEqual(placed.resources,resources);assert.equal(h.dom.document.querySelector('[data-type="belt"] .inventory-count').textContent,'0');
  h.key('q');const turret=placed.buildings.find(b=>b.type==='turret');h.point('pointerdown',turret.x,turret.z);assert.equal(h.$('upgrade-turret').hidden,false);h.$('upgrade-turret').click();assert.equal(h.save().buildings.find(b=>b.id===turret.id).level,2);
 }finally{await h.close();}
});
test('R rotates the active blueprint without turning a conveyor under the cursor',async()=>{
 const h=harness(starterWorld());try{
  h.$('resume').click();
  h.tool('belt');
  h.point('pointermove',-7,-3);
  h.key('r');
  h.point('pointerdown',3,4);
  h.point('pointerup',3,4);
  const state=h.save();
  assert.equal(state.buildings.find(b=>b.x===-7&&b.z===-3).dir,0);
  assert.equal(state.buildings.find(b=>b.x===3&&b.z===4).dir,1);
 }finally{await h.close();}
});
test('normal drag locks to the belt direction, previews turns, and builds only on release',async()=>{
 const h=harness();try{
  h.$('start-solo').click();h.tool('belt');
  h.point('pointerdown',3,4);h.point('pointermove',6,5);
  assert.equal(h.dom.__view.route.map(c=>`${c.x},${c.z},${c.dir}`).join(';'),'3,4,0;4,4,0;5,4,0;6,4,0');
  h.point('pointermove',5,5);
  assert.equal(h.dom.__view.route.length,3);
  h.key('r');h.point('pointermove',5,7);
  assert.equal(h.dom.__view.route.map(c=>`${c.x},${c.z},${c.dir}`).join(';'),'3,4,0;4,4,0;5,4,1;5,5,1;5,6,1;5,7,1');
  assert.ok(!h.save().buildings.some(b=>b.x===3&&b.z===4));
  h.point('pointerup',5,7);
  const state=h.save();
  assert.equal(state.buildings.find(b=>b.x===5&&b.z===4).dir,1);
  assert.equal(state.buildings.find(b=>b.x===5&&b.z===7).dir,1);
  assert.ok(!state.buildings.some(b=>b.x===6&&b.z===4));
  h.point('pointerdown',3,6);h.key('r',true);h.point('pointermove',6,6);h.key('Escape');h.point('pointerup',6,6);
  assert.ok(!h.save().buildings.some(b=>b.x===3&&b.z===6));
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
 for(let i=0;i<10;i++)h.ticks[0]();h.frame(1400);h.frame(1460);assert.ok(h.dom.__view.followed);s=h.save();assert.ok(s.players[0].x<2&&s.players[0].z<2);assert.ok(h.dom.__view.followed.x<2&&h.dom.__view.followed.z<2);
 }finally{await h.close();}
});
test('free camera stays unlocked while the engineer walks and Space restores follow',async()=>{
 const h=harness();try{
  h.$('start-solo').click();assert.equal(h.$('focus').getAttribute('aria-pressed'),'true');
  h.$('focus').click();h.key('d');h.frame(1000);h.ticks[0]();h.frame(1050);
  assert.equal(h.$('focus').textContent,'Free');assert.equal(h.dom.__view.followed,undefined);assert.ok(h.save().players[0].x>2);
  h.key(' ');h.frame(1100);assert.equal(h.$('focus').textContent,'Follow');assert.ok(h.dom.__view.followed);
  h.key('ArrowLeft');h.frame(1150);assert.equal(h.$('focus').getAttribute('aria-pressed'),'false');
 }finally{await h.close();}
});
test('copy and paste previews a replacement layout and U upgrades a same-type selection',async()=>{
 const saved=starterWorld();saved.state.terrain.trees=[];saved.state.terrain.rocks=[];
 const h=harness(saved);try{
  h.$('resume').click();const belts=h.save().buildings.filter(b=>b.type==='belt');
  const a=belts[1],b=belts[2];
  h.point('pointerdown',a.x,a.z);h.point('pointermove',b.x+6,b.z+6);h.point('pointerup',b.x,b.z);
  assert.match(h.$('area-count').textContent,/2 selected/);
  assert.equal(h.$('upgrade-selection').hidden,false);h.key('u');
  assert.equal(h.save().buildings.find(v=>v.id===a.id).level,2);
  h.key('c',false,true);h.point('pointermove',14,14);h.key('v',false,true);
  assert.equal(h.dom.__view.route.length,2);h.point('pointerdown',14,14);h.point('pointerup',14,14);
  assert.ok(h.save().buildings.some(v=>v.type==='belt'&&v.x===14&&v.z===14));
 }finally{await h.close();}
});
test('selected factory shows materials, buffered output and independent sharing switches',async()=>{
 const saved=starterWorld(),smelter=saved.state.buildings.find(b=>b.type==='smelter');smelter.item='plate';smelter.outputBuffer=['copper'];
 const h=harness(saved);try{
  h.$('resume').click();h.point('pointerdown',smelter.x,smelter.z);h.point('pointerup',smelter.x,smelter.z);h.frame(1000);
  assert.match(h.$('machine-io').textContent,/Iron ore.*iron plates/i);assert.match(h.$('machine-io').textContent,/Copper ore.*copper/i);
  assert.equal(h.$('output-stock').textContent,'Output buffer 2 / 10');
  assert.equal(h.$('output-options').hidden,false);h.$('send-output').click();
  const selected=h.save().buildings.find(b=>b.id===smelter.id);
  assert.equal(selected.sendOutput,true);assert.equal(selected.receiveOutput,false);
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
test('the round HUD forecasts the next bonus and announces activation once',async()=>{
 const h=harness();try{
  assert.ok(h.$('round-bonuses').hidden);
  h.$('start-solo').click();
  assert.equal(h.$('round-bonus-active').textContent,'Active · No bonus yet');
  assert.equal(h.$('round-bonus-next').textContent,'Next · +15% mining speed');
  h.$('early-wave').click();
  for(let i=0;i<62;i++)h.ticks[0]();
  h.frame(1000);h.frame(1400);
  assert.equal(h.$('round-bonus-active').textContent,'Active · +15% mining speed');
  assert.equal(h.$('round-bonus-next').textContent,'Next · +25% smelting speed');
  const announcements=[...h.$('toasts').children].filter(node=>node.textContent.includes('Bonus activated'));
  assert.equal(announcements.length,1);
  assert.match(announcements[0].textContent,/\+15% mining speed/);
 }finally{await h.close();}
});
test('drag-selection moves an area and Shift override asks once before packing invalid drills',async()=>{
 const h=harness(starterWorld());try{
  h.$('resume').click();h.point('pointerdown',-9,-4);h.point('pointermove',-4,-2);h.point('pointerup',-4,-2);assert.equal(h.$('area-tools').hidden,false);assert.ok(h.dom.__view.area.length>1);
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
 const h=harness(starterWorld());try{
  h.$('resume').click();h.key('i');assert.ok(h.$('production-dialog').open);assert.equal(h.$('production-rows').children.length,7);h.$('production-dialog').close();h.key('b');h.frame(1000);assert.match(h.$('building-labels').textContent,/Running|Waiting for inputs/);
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
test('the inspector explains the purple Return port for logistics buildings',async()=>{
 const h=harness();try{
  h.$('start-solo').click();assert.ok(h.$('port-key').hidden);
  h.tool('inserter');assert.ok(!h.$('port-key').hidden);
  assert.match(h.$('port-key').textContent,/RET.*separate return conveyor/);
  h.tool('smelter');assert.ok(h.$('port-key').hidden);
 }finally{await h.close();}
});
test('field training advances through actual movement, placement and deliveries',async()=>{
 const h=harness(undefined,{tutorial:true});try{
  h.$('start-solo').click();assert.ok(!h.$('tutorial-guide').hidden);assert.equal(h.save().paused,false);assert.ok(h.$('early-wave').disabled);
  let frameTime=1000,dir=0;
  const ticks=(n=1)=>{for(let i=0;i<n;i++)h.ticks[0]();h.frame(frameTime+=300);};
  const build=tile=>{
   h.key('q');h.tool(tile.type);
   while(tile.dir!==undefined&&dir!==tile.dir){h.key('r');dir=(dir+1)%4;}
   h.point('pointerdown',tile.x,tile.z);h.point('pointerup',tile.x,tile.z);
  };
  const connect=({x,z})=>{
   h.key('q');h.tool('belt');h.point('pointerdown',x,z,true);h.point('pointermove',0,0,true);h.point('pointerup',0,0,true);
  };
  ticks(5);assert.equal(h.save().tutorialStep,0);
  h.key('d');h.frame(frameTime+=300);ticks(8);h.release('d');h.frame(frameTime+=300);
  assert.equal(h.save().tutorialStep,1);
  assert.match(h.$('tutorial-markers').textContent,/Iron drill/);
  for(const index of [1,2,4,6]){
   assert.equal(h.save().tutorialStep,index);
   for(const tile of TUTORIAL_STEPS[index].tiles)build(tile);
   ticks();
   if(index===2||index===4){
    assert.equal(h.save().tutorialStep,index+1);
    connect(TUTORIAL_STEPS[index+1].markers[0]);ticks(400);
   }
  }
  const trained=h.save();assert.ok(trained.produced.plate>0&&trained.produced.gear>0);
  assert.equal(trained.tutorialStep,7);assert.ok(!h.$('tutorial-finish').hidden);
  h.$('tutorial-finish').click();const finished=h.save();
  assert.equal(finished.tutorialStep,undefined);assert.ok(h.$('tutorial-guide').hidden);
  assert.equal(finished.nextWave-finished.time,100);
 }finally{await h.close();}
});
test('skipping training gives the full kit and restoring a training save keeps its task',async()=>{
 const h=harness(undefined,{tutorial:true});try{
  h.$('skip-tutorial').checked=true;h.$('start-solo').click();assert.ok(h.$('tutorial-guide').hidden);
  const state=h.save(),inventory=state.players[0].inventory;
  assert.deepEqual(state.buildings.map(b=>b.type),['hq']);
  const counts={};for(const b of starterWorld().state.buildings.filter(b=>b.type!=='hq'))counts[b.type]=(counts[b.type]||0)+1;
  assert.deepEqual(Object.fromEntries(Object.entries(inventory).map(([type,items])=>[type,items.length])),counts);
 }finally{await h.close();}
 const old=starterWorld(),resumed=harness(old,{tutorial:true});try{
  resumed.$('resume').click();assert.ok(resumed.$('tutorial-guide').hidden);assert.equal(resumed.save().buildings.length,old.state.buildings.length);
 }finally{await resumed.close();}
 const training=starterWorld();training.state.tutorialStep=2;
 const resumedTraining=harness(training,{tutorial:true});try{
  resumedTraining.$('resume').click();assert.equal(resumedTraining.$('tutorial-title').textContent,'Feed the smelter');
  resumedTraining.$('tutorial-skip').click();assert.equal(resumedTraining.save().tutorialStep,undefined);
  assert.equal(resumedTraining.save().buildings.length,training.state.buildings.length);
 }finally{await resumedTraining.close();}
});
