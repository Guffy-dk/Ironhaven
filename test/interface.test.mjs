// Exercise real DOM controls with only the GPU replaced. This is not a visual browser test.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';
import {build} from 'esbuild';
import {createGame,addPlayer,maxHp} from '../public/shared/sim.js';
import {CURRENT_VERSION,displayVersion,RELEASES} from '../public/shared/releases.js';
const html=(await readFile(new URL('../public/index.html',import.meta.url),'utf8')).replace(/<script[^>]*src="\.\/app\.js"[^>]*><\/script>/,'').replace(/<link[^>]+>/g,'');
const bundle=await build({entryPoints:[new URL('../public/app.js',import.meta.url).pathname],bundle:true,format:'iife',write:false,plugins:[{name:'gpu-stub',setup(b){b.onResolve({filter:/^\.\/render\.js$/},()=>({path:'renderer',namespace:'qa'}));b.onLoad({filter:/.*/,namespace:'qa'},()=>({contents:`export class View{constructor(){globalThis.__view=this;this.center={x:0,z:0,set(x,y,z){this.x=x;this.z=z;}};this.cursor={visible:false};this.zoom=14;}setTool(t){this.tool=t;}previewRoute(c){this.route=c;}select(b){this.selected=b;}hover(){}sync(){}draw(){}centerBase(){}setZoom(){}setQuality(){}pan(){}follow(p){this.followed={...p};}project(x,z){return{x:x+500,y:z+400,visible:true}}point(x,y){return{x:Math.round(x),z:Math.round(y)}}}` }));}}]});
function harness(saved){
 const dom=new Window({url:'https://ironhaven.test/'}),frames=[],ticks=[];
 dom.document.write(html);dom.requestAnimationFrame=f=>(frames.push(f),1);dom.setInterval=f=>(ticks.push(f),ticks.length);dom.setTimeout=()=>1;
 dom.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(t,k)=>k in t?t[k]:()=>{}});
 for(const d of dom.document.querySelectorAll('dialog')){d.showModal=()=>d.setAttribute('open','');d.close=()=>d.removeAttribute('open');}
 if(saved)dom.localStorage.setItem('ironhaven.save.v1',JSON.stringify(saved));
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
