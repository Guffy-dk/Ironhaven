// Exercise real DOM controls with only the GPU replaced. This is not a visual browser test.
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';
import {build} from 'esbuild';
import {createGame,addPlayer,maxHp,step,waveForecast,FINAL_WAVE,SWARM_DIRECTIONS,buildingRadius,command} from '../public/shared/sim.js';
import {TUTORIAL_STEPS} from '../public/shared/tutorial.js';
import {upgradeColor} from '../public/upgrade-colors.js';
import {CURRENT_VERSION,displayVersion,RELEASES} from '../public/shared/releases.js';
const html=(await readFile(new URL('../public/index.html',import.meta.url),'utf8')).replace(/<script[^>]*src="\.\/app\.js"[^>]*><\/script>/,'').replace(/<link[^>]+>/g,'');
const bundle=await build({entryPoints:[fileURLToPath(new URL('../public/app.js',import.meta.url))],bundle:true,format:'iife',write:false,plugins:[{name:'gpu-stub',setup(b){b.onResolve({filter:/^\.\/render\.js$/},()=>({path:'renderer',namespace:'qa'}));b.onLoad({filter:/.*/,namespace:'qa'},()=>({contents:`export class View{constructor(){globalThis.__view=this;this.center={x:0,z:0,set(x,y,z){this.x=x;this.z=z;}};this.cursor={visible:false};this.zoom=14;}setTool(t){this.tool=t;}previewRoute(c){this.route=c;}markArea(ids){this.area=ids;}select(b){this.selected=b;}hover(cell,valid,tool,radius){this.preview={cell,valid,tool,radius};}sync(){}draw(){}centerBase(){}setZoom(d){this.lastZoomDelta=d;}setQuality(){}pan(x,z){this.center.x+=x;this.center.z+=z;}project(x,z){return{x:x+500,y:z+400,visible:true}}point(x,y){return{x:Math.round(x),z:Math.round(y)}}}` }));}}]});
function harness(saved,{tutorial=false,preferences}={}){
 const dom=new Window({url:'https://ironhaven.test/'}),frames=[],ticks=[];
 dom.document.write(html);dom.requestAnimationFrame=f=>(frames.push(f),1);dom.setInterval=f=>(ticks.push(f),ticks.length);dom.setTimeout=()=>1;
 dom.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(t,k)=>k in t?t[k]:()=>{}});
 for(const d of dom.document.querySelectorAll('dialog')){d.showModal=()=>d.setAttribute('open','');d.close=()=>d.removeAttribute('open');}
 if(preferences)dom.localStorage.setItem('ironhaven.preferences.v1',JSON.stringify(preferences));
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
test('graphics menus offer quality controls with Quarry active in the same world',async()=>{
 const h=harness(starterWorld());try{
  h.$('resume').click();h.key(' ');const before=h.save();
  h.$('menu').click();
  assert.equal(h.dom.document.body.dataset.visualStyle,'quarry');
  assert.equal(h.$('visual-style'),null);
  assert.equal(h.$('start-visual-style'),null);
  h.$('quality').click();
  assert.equal(h.dom.document.body.classList.contains('light-graphics'),true);
  assert.deepEqual(h.save(),before);
 }finally{await h.close();}
});
test('building blueprints show turret stats and preview the active radius before placement',async()=>{
 const h=harness(starterWorld());try{
  h.$('resume').click();h.key('x');h.tool('mortar');h.point('pointermove',12,9);
  assert.match(h.$('intel-stats').textContent,/Health.*Damage \/ shot.*Fire interval.*Splash radius/);
  assert.equal(h.dom.__view.preview.radius,buildingRadius({type:'mortar'}));
  assert.deepEqual({...h.dom.__view.preview.cell},{x:12,z:9});
  h.key('q');assert.equal(h.dom.__view.preview.cell,null);
  h.key('z');h.tool('sawmill');h.point('pointermove',10,9);
  assert.match(h.$('blueprint-site').textContent,/trees.*wood\/min/);
  assert.equal(h.dom.__view.preview.radius,buildingRadius({type:'sawmill'}));
 }finally{await h.close();}
});
test('selecting a warehouse sets its recipe export from the inspector',async()=>{
 const saved=starterWorld(),{state,playerId}=saved;
 state.terrain.trees=state.terrain.rocks=[];
 assert.equal(command(state,playerId,{type:'build',building:'storage',x:10,z:1}),null);
 state.resources.steel=3;state.buildings.find(b=>b.type==='storage'&&b.x===10).stock={steel:3};
 const h=harness(saved);try{
  h.$('resume').click();h.point('pointerdown',10,1);h.point('pointerup',10,1);
  assert.equal(h.$('warehouse-options').hidden,false);
  assert.match(h.$('warehouse-stock').textContent,/3 steel/);
  const select=h.$('warehouse-export');select.value='recipe';select.dispatchEvent(new h.dom.Event('change'));
  assert.equal(h.save().buildings.find(b=>b.type==='storage').exportItem,'recipe');
  assert.match(h.$('warehouse-export-status').textContent,/adjacent machine to the east/);
 }finally{await h.close();}
});
test('Space toggles pause and F selects the dismantle tool from any category',async()=>{
 const h=harness(starterWorld());try{
  h.$('resume').click();h.key(' ');assert.ok(h.save().paused);
  h.release(' ');h.key(' ');assert.ok(!h.save().paused);
  const belt=h.save().buildings.find(b=>b.type==='belt');
  h.key('f');assert.equal(h.dom.__view.tool,'demolish');h.point('pointerdown',belt.x,belt.z);
  assert.ok(!h.save().buildings.some(b=>b.id===belt.id));
 }finally{await h.close();}
});
test('category keys swap the hotbar and number keys select a building in that category',async()=>{
 const h=harness();try{
  h.$('start-solo').click();
  const visible=()=>[...h.$('hotbar').children].filter(b=>!b.hidden).map(b=>b.dataset.type);
  assert.ok(visible().includes('smelter'));assert.ok(!visible().includes('turret'));
  h.key('x');h.key('1');assert.equal(h.dom.__view.tool,'turret');assert.ok(!visible().includes('smelter'));
  h.key('v');h.key('1');assert.equal(h.dom.__view.tool,'belt');
  h.key('c');h.key('2');assert.equal(h.dom.__view.tool,'coalGenerator');
 }finally{await h.close();}
});
test('WASD pans only the local camera and normalizes diagonal movement',async()=>{
 const h=harness();try{
  h.$('start-solo').click();h.frame(1000);
  h.key('w');h.frame(1050);const {x,z}=h.dom.__view.center;
  h.key('a');h.frame(1100);
  assert.ok(h.dom.__view.center.x<x&&h.dom.__view.center.z<z);
  assert.ok(Math.abs(Math.hypot(h.dom.__view.center.x-x,h.dom.__view.center.z-z)-.5)<1e-8);
  assert.equal(h.save().players[0].x,undefined);
 }finally{await h.close();}
});
test('the inspector shows existing saved upgrade colors and updates the swatch immediately',async()=>{
 const saved=starterWorld(),belt=saved.state.buildings.find(b=>b.type==='belt');
 belt.level=2;
 const h=harness(saved);try{
  h.$('resume').click();h.point('pointerdown',belt.x,belt.z);h.point('pointerup',belt.x,belt.z);
  const upgradeRow=()=>h.$('intel-stats').querySelector('.upgrade-swatch').parentElement;
  assert.equal(upgradeRow().textContent,'1 / 10');
  assert.ok(upgradeRow().innerHTML.includes(upgradeColor(2)));
  h.key('u');
  assert.equal(upgradeRow().textContent,'2 / 10');
  assert.ok(upgradeRow().innerHTML.includes(upgradeColor(3)));
 }finally{await h.close();}
});
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
test('hotbar inventory starter inventory counts survive dismantle and fall on free placement; selected turret upgrades',async()=>{
 const saved=starterWorld();saved.state.buildings.find(b=>b.type==='turret').type='gunTurret';saved.state.players[0].inventory.belt=[{hp:65,level:1}];const h=harness(saved);try{
  h.$('resume').click();const initial=h.save(),belt=initial.buildings.find(b=>b.type==='belt');h.tool('demolish');h.point('pointerdown',belt.x,belt.z);h.frame(1000);
  assert.equal(h.dom.document.querySelector('[data-type="belt"] .inventory-count').textContent,'1');const resources={...h.save().resources};h.tool('belt');h.point('pointerdown',4,7);h.point('pointerup',4,7);h.frame(1400);const placed=h.save();assert.deepEqual(placed.resources,resources);assert.equal(h.dom.document.querySelector('[data-type="belt"] .inventory-count').textContent,'0');
  h.key('q');const turret=placed.buildings.find(b=>b.type==='gunTurret');h.point('pointerdown',turret.x,turret.z);assert.equal(h.$('upgrade-turret').hidden,false);h.$('upgrade-turret').click();assert.equal(h.save().buildings.find(b=>b.id===turret.id).level,2);
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
 const state=createGame(),p=addPlayer(state);state.time=80;state.resources.gear=0;const core=state.buildings[0];core.hp=2000;const turret=state.buildings.find(b=>b.type==='turret');turret.type='gunTurret';turret.ammo=0;
 const h=harness({state,playerId:p.id});try{
  h.$('resume').click();h.frame(1000);assert.ok(h.$('wave-panel').classList.contains('imminent'));assert.equal(h.$('ammo-alert').hidden,false);assert.match(h.$('ammo-alert').textContent,/AMMO EMPTY/);assert.ok(h.$('building-'+core.id).querySelector('.world-health'));assert.match(h.$('building-'+turret.id).textContent,/NO AMMO/);
  h.tool('repair');h.point('pointerdown',0,0);h.point('pointerdown',0,0);h.frame(1400);assert.equal(h.save().buildings[0].hp,maxHp(core));assert.equal(h.$('building-'+core.id),null);
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
  assert.equal(h.$('output-stock').textContent,'Output buffer 2 / 5');
  assert.equal(h.$('output-options').hidden,false);h.$('send-output').click();
  const selected=h.save().buildings.find(b=>b.id===smelter.id);
  assert.equal(selected.sendOutput,true);assert.equal(selected.receiveOutput,false);
 }finally{await h.close();}
});
test('dragging the barricade tool builds an adjacent vertical row',async()=>{
 const saved=starterWorld();saved.state.buildings=saved.state.buildings.filter(b=>b.type==='hq');saved.state.terrain.trees=[];saved.state.terrain.rocks=[];
 const h=harness(saved);try{
  h.$('resume').click();h.tool('wall');h.point('pointerdown',8,3);h.point('pointermove',8,7);
  assert.equal(h.dom.__view.route.length,5);h.point('pointerup',8,7);
  assert.deepEqual(h.save().buildings.filter(b=>b.type==='wall').map(b=>[b.x,b.z]),[[8,3],[8,4],[8,5],[8,6],[8,7]]);
 }finally{await h.close();}
});
test('the defeat screen returns to the main menu with the saved world intact',async()=>{
 const saved=starterWorld();saved.state.status='defeat';
 const h=harness(saved);try{
  h.$('resume').click();assert.ok(h.$('end-dialog').hasAttribute('open'));assert.ok(h.$('end-continue').hidden);
  h.$('end-main-menu').click();assert.equal(h.$('start-screen').hidden,false);assert.equal(h.$('end-dialog').hasAttribute('open'),false);
  assert.equal(JSON.parse(h.dom.localStorage.getItem('ironhaven.save.v1')).state.status,'defeat');
  assert.equal(h.$('resume').hidden,false);
 }finally{await h.close();}
});
test('the victory screen resumes the same world with further swarms enabled',async()=>{
 const saved=starterWorld();saved.state.wave=FINAL_WAVE;saved.state.status='victory';saved.state.survived=true;
 const h=harness(saved);try{
  h.$('resume').click();assert.equal(h.$('end-continue').hidden,false);
  h.$('end-continue').click();assert.equal(h.$('end-dialog').hasAttribute('open'),false);
  assert.equal(h.$('early-wave').disabled,false);assert.match(h.$('wave-detail').textContent,/SWARM 26/);
  const resumed=h.save();assert.equal(resumed.status,'playing');assert.deepEqual(resumed.buildings,saved.state.buildings);
 }finally{await h.close();}
});
test('the playfield warning announces its forecast and attack independently of the minimap',async()=>{
 const h=harness();try{
  const warning=h.$('swarm-warning');
  assert.ok(warning.hidden);
  h.$('start-solo').click();
  h.dom.document.querySelector('[data-window-close="map-panel"]').click();
  assert.ok(!warning.hidden);
  const side=SWARM_DIRECTIONS[waveForecast(h.save()).side];
  assert.equal(warning.dataset.side,side.toLowerCase());
  assert.equal(h.$('swarm-warning-text').textContent,'Next swarm from '+side);
  assert.equal(h.dom.document.querySelectorAll('#hotbar [data-type="smelter"]').length,1);
  assert.equal(h.dom.document.querySelector('#hotbar [data-type="copperSmelter"]'),null);
 }finally{await h.close();}
 const s=createGame(),p=addPlayer(s);s.nextWave=0;step(s);
 const active=harness({state:s,playerId:p.id});try{
  active.$('resume').click();
  assert.ok(active.$('swarm-warning').classList.contains('urgent'));
  assert.equal(active.$('swarm-warning-text').textContent,'Swarm attacking from '+SWARM_DIRECTIONS[s.waveSide]);
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
  h.$('resume').click();h.key('i');assert.ok(h.$('production-dialog').open);assert.equal(h.$('production-rows').children.length,8);h.$('production-dialog').close();h.key('b');h.frame(1000);assert.match(h.$('building-labels').textContent,/Running|Waiting for inputs/);
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
   h.key('q');h.tool('belt');h.point('pointerdown',x,z,true);const core=h.save().buildings.find(b=>b.type==='hq');h.point('pointermove',core.x,core.z,true);h.point('pointerup',core.x,core.z,true);
  };
  ticks(5);assert.equal(h.save().tutorialStep,0);
  h.key('d');h.frame(frameTime+=300);ticks(8);ticks(8);h.release('d');h.frame(frameTime+=300);
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
  assert.equal(trained.tutorialStep,7);assert.ok(h.$('tutorial-finish').hidden);
  for(const target of [{x:14,z:0},{x:14,z:-6},{x:4,z:-11}]){h.key('l');h.point('pointerdown',target.x,target.z);ticks(160);}
  assert.equal(h.save().tutorialStep,TUTORIAL_STEPS.length-1);assert.ok(!h.$('tutorial-finish').hidden);
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

test('L and Aim light send bearings; Escape and right click cancel without constructing buildings',async()=>{
 const h=harness(starterWorld());try{
  h.$('resume').click();const before=h.save(),count=before.buildings.length;
  h.key('l');assert.match(h.$('tool-hint').textContent,/AIM LIGHT/);
  h.point('pointerdown',20,6);let saved=h.save();
  assert.equal(saved.buildings.length,count);assert.equal(saved.buildings.find(b=>b.type==='hq').lighthouseAim,Math.atan2(20,6));
  h.$('aim-light').click();h.key('Escape');h.point('pointerdown',-20,0);
  assert.equal(h.save().buildings.find(b=>b.type==='hq').lighthouseAim,Math.atan2(20,6));
  h.$('aim-light').click();h.$('world').dispatchEvent(new h.dom.PointerEvent('pointerdown',{button:2,bubbles:true}));
  h.point('pointerdown',-10,0);assert.equal(h.save().buildings.find(b=>b.type==='hq').lighthouseAim,Math.atan2(20,6));
 }finally{await h.close();}
});

test('a player can inspect a live coastal creature and Escape restores colony selection',async()=>{
 const saved=starterWorld();saved.state.enemies=[{id:9500,kind:'guard',x:16,z:4,hp:300,maxHp:300,speed:0,cooldown:0}];
 const h=harness(saved);try{h.$('resume').click();h.point('pointerdown',16,4);assert.equal(h.$('intel-title').textContent,'Shell guard');assert.match(h.$('intel-desc').textContent,/0.65/);assert.ok(h.$('upgrade-turret').hidden);assert.equal(h.$('creature-back').hidden,false);h.key('Escape');assert.equal(h.$('creature-back').hidden,true);assert.equal(h.$('intel-title').textContent,'Lighthouse');}finally{await h.close();}
});


test('new island controls expose automatic light and allow resuming after manual aiming',async()=>{
 const h=harness();try{
  h.$('start-solo').click();assert.equal(h.$('auto-light').hidden,false);
  assert.equal(h.save().buildings.find(b=>b.type==='hq').lighthouseAuto,true);
  h.$('aim-light').click();h.point('pointerdown',20,6);
  assert.equal(h.save().buildings.find(b=>b.type==='hq').lighthouseAuto,false);
  h.$('auto-light').click();assert.equal(h.save().buildings.find(b=>b.type==='hq').lighthouseAuto,true);
 }finally{await h.close();}
});

test('Power category builds a paid local lamp with coverage and fixed-level inspector controls',async()=>{
 const h=harness();try{
  h.$('start-solo').click();h.key('c');h.key('3');assert.equal(h.dom.__view.tool,'lamp');
  h.point('pointermove',6,-2);assert.equal(h.dom.__view.preview.radius,6);
  const before=h.save().resources;h.point('pointerdown',6,-2);h.point('pointerup',6,-2);
  const s=h.save(),lamp=s.buildings.find(b=>b.type==='lamp');assert.ok(lamp);assert.equal(lamp.hp,75);assert.equal(s.resources.plate,before.plate-35);
  h.key('q');h.point('pointerdown',6,-2);assert.equal(h.$('intel-title').textContent,'Harbor lamp');assert.equal(h.$('upgrade-turret').hidden,true);assert.match(h.$('intel-desc').textContent,/Enemies target lamps/);
 }finally{await h.close();}
});


test('Escape cancels construction first, then opens a clean menu and goes back one level',async()=>{
 const h=harness();try{
  h.$('start-solo').click();h.tool('belt');h.key('Escape');assert.equal(h.$('menu-dialog').open,false);
  h.key('Escape');assert.equal(h.$('menu-dialog').open,true);
  assert.equal(h.dom.document.querySelector('[data-menu-page="home"]').hidden,false);
  h.dom.document.querySelector('[data-menu-target="settings"]').click();h.dom.document.querySelector('[data-menu-target="controls"]').click();
  assert.equal(h.$('menu-title').textContent,'Controls');
  const focusedEscape=new h.dom.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true});h.$('pan-speed').dispatchEvent(focusedEscape);assert.equal(focusedEscape.defaultPrevented,true);
  assert.equal(h.$('menu-title').textContent,'Settings');h.key('Escape');assert.equal(h.$('menu-title').textContent,'Colony menu');h.key('Escape');assert.equal(h.$('menu-dialog').open,false);
 }finally{await h.close();}
});
test('pan and zoom preferences affect real camera inputs, persist and leave the shared world unchanged',async()=>{
 const h=harness();let savedPreferences;try{
  h.$('start-solo').click();const before=h.save();h.frame(1000);
  h.$('pan-speed').value='200';h.$('pan-speed').dispatchEvent(new h.dom.Event('input'));
  h.$('zoom-speed').value='50';h.$('zoom-speed').dispatchEvent(new h.dom.Event('input'));
  const x=h.dom.__view.center.x;h.key('d');h.frame(1050);h.release('d');assert.ok(Math.abs(h.dom.__view.center.x-x-1)<1e-9);
  h.$('world').dispatchEvent(new h.dom.WheelEvent('wheel',{deltaY:100}));assert.equal(h.dom.__view.lastZoomDelta,.75);
  h.$('zoom-in').click();assert.equal(h.dom.__view.lastZoomDelta,-1);
  savedPreferences=JSON.parse(h.dom.localStorage.getItem('ironhaven.preferences.v1'));assert.deepEqual(h.save(),before);
 }finally{await h.close();}
 const reopened=harness(undefined,{preferences:savedPreferences});try{assert.equal(reopened.$('pan-speed').value,'200');assert.equal(reopened.$('zoom-speed').value,'50');reopened.$('reset-controls').click();assert.equal(reopened.$('pan-speed').value,'100');}finally{await reopened.close();}
});
test('master volume scales actual sound gain and the mute controls stay in sync',async()=>{
 const h=harness();try{
  const gains=[];h.dom.AudioContext=class{currentTime=0;resume(){}createOscillator(){return{type:'sine',frequency:{},connect(){},start(){},stop(){}};}createGain(){return{gain:{setValueAtTime(v){gains.push(v);},exponentialRampToValueAtTime(){}},connect(){}};}};
  h.$('master-volume').value='50';h.$('master-volume').dispatchEvent(new h.dom.Event('input'));
  h.$('mute-audio').checked=false;h.$('mute-audio').dispatchEvent(new h.dom.Event('change'));h.$('test-audio').click();
  assert.equal(gains.at(-1),.0125);assert.equal(h.$('sound').getAttribute('aria-label'),'Mute sound');
  h.$('sound').click();assert.equal(h.$('mute-audio').checked,true);
  assert.equal(JSON.parse(h.dom.localStorage.getItem('ironhaven.preferences.v1')).audio.masterVolume,.5);
 }finally{await h.close();}
});

test('players can toggle mineral names and upgrade counts without altering the colony',async()=>{
 const saved=starterWorld(),machine=saved.state.buildings.find(b=>b.type==='smelter');machine.level=4;machine.hp=maxHp(machine);
 const h=harness(saved);try{
  h.$('resume').click();h.frame(1000);assert.match(h.$('building-'+machine.id).textContent,/3/);assert.ok(h.$('mineral-labels').children.length>0);
  const before=h.save();h.$('show-levels').checked=false;h.$('show-levels').dispatchEvent(new h.dom.Event('change'));h.$('show-minerals').checked=false;h.$('show-minerals').dispatchEvent(new h.dom.Event('change'));h.frame(1300);
  assert.equal(h.$('building-'+machine.id),null);assert.equal(h.$('mineral-labels').hidden,true);assert.deepEqual(h.save(),before);
  const prefs=JSON.parse(h.dom.localStorage.getItem('ironhaven.preferences.v1'));assert.equal(prefs.interface.buildingLevels,false);assert.equal(prefs.interface.mineralLabels,false);
 }finally{await h.close();}
});
