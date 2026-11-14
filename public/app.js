import { View } from './render.js';
import { createGame,addPlayer,removePlayer,command,step,STEP,TYPES,canBuild,FINAL_WAVE,migrateGame,inventoryCount,maxHp,turretStats,TURRET_LEVELS,DIRECTIONAL,planRoute,key,RECIPES,RESOURCE_KEYS,upgradeCost,MAX_UPGRADES,storageCapacity,planMove,LAUNCH_COST,buildingPower,productionSpeed } from './shared/sim.js';
import { CURRENT_VERSION,RELEASE_STAGE,RELEASES,displayVersion } from './shared/releases.js';
import { initWindows } from './windows.js';
import { parseSave } from './shared/saves.js';
import { Lan } from './network.js';
import { icon,RESOURCE_NAMES } from './icons.js';
const $=id=>document.getElementById(id),SAVE='ironhaven.save.v1',NAME='ironhaven.name';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=createGame(),playerId=null,started=false,mode='solo',view,tool=null,dir=0,selected=null,tab='all',lastWave=0,lastEvent=0,ended=false,lowQuality=false,muted=true,audio=null,lastMove='0,0',hover=null,dragging=false,lastBuild='',lastUi=0,lastNet=0,lastSave=0,syncTick=0,pendingDisconnect=false;
const keys=new Set();
let followCamera=true,rowAnchor=null,rowGesture=null,routePlan=null,lastRouteKey='',pointer=null;
let areaIds=[],selectionGesture=null,movingArea=false,pendingMove=null;
initWindows();
$('version-label').textContent=displayVersion(CURRENT_VERSION)+' '+RELEASE_STAGE.toUpperCase();
$('start-patch-notes').textContent=RELEASE_STAGE.toUpperCase()+' '+displayVersion(CURRENT_VERSION)+' · WHAT’S NEW ↗';
$('patch-history').innerHTML=RELEASES.map((r,i)=>`<article class="patch-entry"><div class="patch-version"><strong>${escape(displayVersion(r.version))}</strong>${i===0?'<span class="current-release">CURRENT</span>':''}<time>${escape(r.date)}</time></div><h3>${escape(r.title)}</h3><ul>${r.changes.map(c=>`<li>${escape(c)}</li>`).join('')}</ul></article>`).join('');
for(const b of document.querySelectorAll('[data-patch-notes]'))b.onclick=()=>{$('menu-dialog').close();$('patch-dialog').showModal();};
function toast(text,error=false){const e=document.createElement('div');e.className='toast'+(error?' error':'');e.textContent=text;$('toasts').append(e);setTimeout(()=>e.remove(),4000);}
function tone(freq=440,duration=.08,volume=.025,type='sine'){
 if(muted)return;try{audio||=new AudioContext();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}
}
try{view=new View($('world'));}catch(e){$('loading').innerHTML='<p>3D could not start. Enable WebGL / hardware acceleration in your browser and reload.</p>';throw e;}
function readStorage(key){try{return localStorage.getItem(key);}catch{return null;}}
function writeStorage(key,value){try{localStorage.setItem(key,value);return true;}catch{return false;}}
$('player-name').value=readStorage(NAME)||'Engineer';
if(readStorage(SAVE))$('resume').hidden=false;
document.body.classList.add('at-start');
const TOOL_LIST=['belt','drill','smelter','assembler','sawmill','generator','turret','wall','repair','demolish','copperDrill','copperSmelter','foundry','circuitLab','componentFactory','storage','launchpad'];
const SHORTCUT=['1','2','3','4','5','6','7','8','9','0'];
function costText(type){return Object.entries(TYPES[type].cost).map(([r,n])=>`${n}${r==='wood'?'W':r==='plate'?'P':'⚙'}`).join(' · ')||'FREE';}
function initHotbar(){
 $('hotbar').innerHTML=TOOL_LIST.map((t,i)=>`<button class="build-btn" data-type="${t}" title="${TYPES[t].name} (${SHORTCUT[i]||''})"><span class="key">${SHORTCUT[i]||''}</span>${icon(t)}${!['repair','demolish'].includes(t)?'<span class="inventory-count" title="Buildings in your inventory">0</span>':''}<span class="build-name">${TYPES[t].name}</span><span class="build-cost">${costText(t)}</span></button>`).join('');
 $('hotbar').addEventListener('click',e=>{const b=e.target.closest('[data-type]');if(b&&started)setTool(tool===b.dataset.type?null:b.dataset.type);});
 document.querySelectorAll('[data-tab]').forEach(el=>el.onclick=()=>{tab=el.dataset.tab;updateToolbar();});
}
function updateToolbar(){
 document.querySelectorAll('[data-tab]').forEach(el=>el.classList.toggle('active',el.dataset.tab===tab));
 document.querySelectorAll('.build-btn').forEach(el=>{const t=el.dataset.type,production=['drill','copperDrill',...Object.keys(RECIPES)].includes(t),defense=['turret','wall','repair','demolish'].includes(t),logistics=['belt','generator','sawmill','storage','launchpad','repair','demolish'].includes(t);el.hidden=tab==='production'&&!production||tab==='defense'&&!defense||tab==='logistics'&&!logistics;el.classList.toggle('active',tool===t);const count=inventoryCount(state,playerId,t),badge=el.querySelector('.inventory-count');if(badge){badge.textContent=String(count);badge.classList.toggle('has-stock',count>0);}el.classList.toggle('unaffordable',count===0&&Object.entries(TYPES[t].cost).some(([r,n])=>state.resources[r]<n));});
}
function setTool(t){if(t)clearArea();rowAnchor=null;rowGesture=null;routePlan=null;lastRouteKey='';dragging=false;view.previewRoute([]);tool=t;selected=null;view.select(null);view.setTool(t,dir);$('tool-hint').hidden=!t;updateToolbar();updateInspector();updateHover();if(t)tone(350,.04);}
function updateHover(){
 if(movingArea){previewMove();return;}
 if(rowGesture){refreshRoute();return;}
 if(!hover||!tool){view.cursor.visible=false;if(view.ghost)view.ghost.visible=false;return;}
 let error;if(['repair','demolish'].includes(tool))error=null;else error=canBuild(state,tool,hover.x,hover.z,playerId);
 view.hover(hover,!error,tool);$('coords').textContent=`${hover.x}, ${hover.z}`;
 $('tool-hint').textContent=error||`${TYPES[tool].name} · ${['→ EAST','↓ SOUTH','← WEST','↑ NORTH'][dir]} · Click to ${tool==='demolish'?'clear':tool==='repair'?'repair':'build'} · R rotates · Q / Esc exits`; 
 $('tool-hint').classList.toggle('invalid',!!error);
}
function execute(cmd){
 if(!started)return;
 if(mode==='client'){const host=lan.peers.get('host');if(!lan.send(host,{type:'command',command:cmd}))toast('The connection to the host is closed.',true);return;}
 const error=command(state,playerId,cmd);if(error){toast(error,true);tone(130,.1,.02);return false;}return true;
}
function saveGame(quiet=false){
 if(!started||mode==='client'){if(!quiet)toast('Only the host can save the world.',true);return;}
 const data=JSON.parse(JSON.stringify(state));const p=data.players.find(p=>p.id===playerId);if(p){p.inventory||={};for(const other of data.players)if(other.id!==p.id)for(const[type,items]of Object.entries(other.inventory||{}))(p.inventory[type]||=[]).push(...items);}data.players=p?[{...p,input:{x:0,z:0}}]:[];
 if(!writeStorage(SAVE,JSON.stringify({state:data,playerId}))){if(!quiet)toast('Could not save. Browser storage is disabled or full.',true);return;}
 if(!quiet)toast('World saved in this browser.');$('resume').hidden=false;
}
function startGame(resume=false){
 if(resume){try{const data=parseSave(readStorage(SAVE));state=data.state;playerId=data.playerId;state.paused=false;state.players=state.players.filter(p=>p.id===playerId);state.players[0].input={x:0,z:0};}catch{toast('Could not open the saved world.',true);return false;}}
 else{state=createGame();const p=addPlayer(state,$('player-name').value);playerId=p.id;}
 mode='solo';finishStart();return true;
}
function finishStart(){started=true;ended=false;lastWave=state.wave;lastEvent=0;writeStorage(NAME,$('player-name').value);$('start-screen').hidden=true;document.body.classList.remove('at-start');$('end-dialog').close();setTool(null);focusEngineer(true);updateUi();view.sync(state);tone(520,.15);}
function restart(){
 if(mode==='client'){toast('Only the host can restart the expedition.',true);return;}
 if(mode==='host'){
  const old=state;state=createGame();playerId=addPlayer(state,old.players.find(p=>p.id===playerId)?.name).id;
  for(const peer of lan.peers.values())if(peer.ready&&peer.playerId){const p=addPlayer(state,peer.name);peer.playerId=p.id;lan.send(peer,{type:'welcome',id:p.id,state,version:CURRENT_VERSION});}
  ended=false;lastWave=0;$('end-dialog').close();setTool(null);view.terrainKey='';focusEngineer(true);updateUi();
 }else startGame();
 toast('A new colony has been founded.');
}
const lan=new Lan({
 onPeerOpen(peer){if(lan.role==='client')lan.send(peer,{type:'hello',name:$('player-name').value||readStorage(NAME)||'Engineer',version:CURRENT_VERSION});updatePeers();},
 onMessage(peer,msg){
  if(lan.role==='host'){
   if(msg.type==='hello'&&!peer.playerId){if(msg.version!==CURRENT_VERSION){lan.send(peer,{type:'error',message:'Game versions do not match. Please download the same version.'});return;}const p=addPlayer(state,msg.name);if(!p){lan.drop(peer.id);return;}peer.playerId=p.id;peer.name=p.name;lan.send(peer,{type:'welcome',id:p.id,state,version:CURRENT_VERSION});toast(`${p.name} has joined the colony.`);tone(660,.14);updatePeers();}
   else if(msg.type==='command'&&peer.playerId){const error=command(state,peer.playerId,msg.command);if(error)lan.send(peer,{type:'error',message:error});}
  }else if(lan.role==='client'){
   if(msg.type==='welcome'){if(msg.version!==CURRENT_VERSION){toast('Game versions do not match.',true);return;}state=msg.state;playerId=msg.id;mode='client';finishStart();mode='client';$('lan-dialog').close();toast('Connected! You now share the same world.');pendingDisconnect=false;}
   if(msg.type==='state'&&msg.state){const terrain=msg.state.terrain||state.terrain;state={...msg.state,terrain};}
   if(msg.type==='error')toast(msg.message,true);
  }
 },
 onPeerClose(peer){
  if(mode==='host'&&peer.playerId){removePlayer(state,peer.playerId);toast(`${peer.name} left the colony.`);}
  if(mode==='client'&&peer.id==='host'&&!pendingDisconnect){pendingDisconnect=true;toast('The host disconnected. The world has stopped.',true);state.paused=true;$('join-status').textContent='Disconnected. Ask the host for a new invitation.';}
  updatePeers();
 },onStatus(){updatePeers();}
});
function updatePeers(){
 $('peer-list').innerHTML=[...lan.peers.values()].filter(p=>p.id!=='host').map(p=>`<div class="peer-row"><span>${escape(p.name)} · ${p.ready?'connected':'invitation '+p.id}</span><button data-drop="${p.id}">Remove</button></div>`).join('');
 $('create-invite').disabled=lan.peers.size>=3||mode==='client';
 $('create-invite').textContent=mode==='host'?'Create invitation for next friend ↗':'Open world and create invitation ↗';
 if(started)updateConnection();
}
$('peer-list').onclick=e=>{const id=e.target.dataset.drop;if(id)lan.drop(Number(id));};
function updateConnection(){const n=state.players.length;$('connection').innerHTML=`<i></i> ${mode==='solo'?'SOLO':mode==='host'?`LAN HOST · ${n}/4`:`LAN · ${n}/4`}`;}
function lanError(error){$('lan-error').textContent=error?.message||String(error);}
function showLan(join=false){$('menu-dialog').close();$('lan-error').textContent='';$('lan-dialog').showModal();lanTab(join);updatePeers();}
function lanTab(join){$('host-pane').hidden=join;$('join-pane').hidden=!join;$('lan-host-tab').classList.toggle('active',!join);$('lan-join-tab').classList.toggle('active',join);}
$('lan-host-tab').onclick=()=>lanTab(false);$('lan-join-tab').onclick=()=>lanTab(true);
$('create-invite').onclick=async()=>{
 const btn=$('create-invite');btn.disabled=true;btn.textContent='Finding local connection…';$('lan-error').textContent='';
 try{if(!started)startGame();mode='host';const invite=await lan.invite();$('invite-code').value=invite.code;$('answer-input').value='';$('invite-output').hidden=false;updateConnection();}catch(e){lanError(e);}finally{updatePeers();}
};
$('accept-answer').onclick=async()=>{try{$('lan-error').textContent='';await lan.accept($('answer-input').value);toast('Connecting to your friend…');$('invite-output').hidden=true;}catch(e){lanError(e);}};
$('leave-lan').onclick=()=>{const wasClient=mode==='client';pendingDisconnect=true;lan.close();pendingDisconnect=false;mode='solo';if(wasClient){started=false;state=createGame();playerId=null;$('start-screen').hidden=false;document.body.classList.add('at-start');setTool(null);}$('menu-dialog').close();updateUi();toast(wasClient?'You left the LAN world.':'LAN is closed. You continue solo.');};
$('create-answer').onclick=async()=>{
 if(mode==='host'&&lan.peers.size){lanError(Error('Close your guest connections before joining another world.'));return;}
 const btn=$('create-answer');btn.disabled=true;btn.textContent='Creating answer code…';$('lan-error').textContent='';
 try{pendingDisconnect=true;const code=await lan.join($('offer-input').value);pendingDisconnect=false;$('answer-code').value=code;$('answer-output').hidden=false;$('join-status').textContent='Send the answer to the host and wait here to connect.';}catch(e){pendingDisconnect=false;lanError(e);}finally{btn.disabled=false;btn.innerHTML='Create answer code <span>↗</span>';}
};
for(const button of document.querySelectorAll('[data-copy]'))button.onclick=async()=>{const input=$(button.dataset.copy);try{await navigator.clipboard.writeText(input.value);toast('Code copied.');}catch{input.focus();input.select();if(document.execCommand('copy'))toast('Code copied.');else toast('Select the code and copy it with Ctrl+C.');}};
function updateInspector(){
 const b=state.buildings.find(b=>b.id===selected),type=tool||b?.type||'hq',def=TYPES[type];$('intel').classList.toggle('has-selection',!!b&&!tool);$('rotate-building').hidden=!b||!!tool||!DIRECTIONAL.includes(b.type);$('upgrade-turret').hidden=!b||!!tool;$('launch-colony').hidden=b?.type!=='launchpad'||!!tool;
 if(b){const cost=upgradeCost(b),btn=$('upgrade-turret');btn.textContent=cost?`Upgrade ${b.level||1} / ${MAX_UPGRADES} (U) · ${Object.entries(cost).map(([r,n])=>n+' '+RESOURCE_NAMES[r].toLowerCase()).join(' + ')}`:'Fully upgraded · 10/10';btn.disabled=!cost||Object.entries(cost).some(([r,n])=>state.resources[r]<n);}
 if(b?.type==='launchpad'){$('launch-colony').disabled=mode==='client'||state.wave<FINAL_WAVE||state.enemies.length>0||state.evacuation?.status==='charging'||Object.entries(LAUNCH_COST).some(([r,n])=>state.resources[r]<n);$('launch-colony').textContent=state.evacuation?.status==='charging'?'Evacuation charging…':'Begin evacuation · 30 components + 60 steel + 40 circuits';}
 $('intel-label').textContent=tool?'BLUEPRINT':b?'SELECTED BUILDING':'COLONY STATUS';$('intel-icon').innerHTML=icon(type,28);$('intel-title').textContent=def.name;$('intel-desc').textContent=tool||b?def.desc:'From a single spark to a self-sufficient fortress. Keep production running — and the swarm outside.';
 const row=(a,v,cls='')=>`<div class="stat-row"><span>${a}</span><span class="${cls}">${v}</span></div>`;
 if(tool){$('intel-stats').innerHTML=Object.entries(def.cost).map(([r,n])=>row(RESOURCE_NAMES[r],n,state.resources[r]>=n?'ok':'bad')).join('')+(def.power?row('Power',def.power):'')+(!['repair','demolish'].includes(type)?row('In your inventory',inventoryCount(state,playerId,type),'ok'):'');}
 else{const bb=b||state.buildings.find(b=>b.type==='hq');$('intel-stats').innerHTML=bb?row('Health',`${Math.max(0,Math.ceil(bb.hp))} / ${maxHp(bb)}`)+`<div class="hp-bar"><i style="width:${Math.max(0,bb.hp/maxHp(bb)*100)}%"></i></div>`+row('Status',bb.active?'Operational':'No power',bb.active?'ok':'bad')+(bb.type==='turret'?row('Ammo',bb.ammo,bb.ammo<=3?'bad':'ok')+row('Turret level',turretStats(bb).name)+row('Damage / range',`${turretStats(bb).damage} / ${turretStats(bb).range}`):'')+(bb.input?.length?row('Input buffer',bb.input.length+'/'+(Object.values(RECIPES[bb.type]?.input||{}).reduce((n,v)=>n+v,0)*4||8)):'')+(buildingPower(bb)?row('Power used',buildingPower(bb)):'')+(RECIPES[bb.type]||['drill','copperDrill','sawmill'].includes(bb.type)?row('Production speed',productionSpeed(bb).toFixed(2)+'×'):'')+(bb.type==='generator'?row('Power supplied',Math.round(18*(1+((bb.level||1)-1)*.3))):'')+row('Upgrades',`${(bb.level||1)-1} / ${MAX_UPGRADES}`)+(bb.type==='storage'||bb.type==='hq'?row('Storage / material',storageCapacity(state)):'')+row('Position',`${bb.x}, ${bb.z}`):row('Status','Core destroyed','bad');}
 const recipes={copperDrill:'COPPER ORE → COPPER SMELTER',copperSmelter:'1 COPPER ORE → 1 COPPER',foundry:'3 IRON PLATES → 1 STEEL',circuitLab:'2 COPPER + 1 PLATE → 1 CIRCUIT',componentFactory:'2 STEEL + 2 CIRCUITS + 1 GEAR → 1 COMPONENT',storage:'STORAGE CAPACITY +300 / MATERIAL',launchpad:'8 SWARMS → 90 SEC. FINAL DEFENSE',drill:'IRON ORE → CONVEYOR',smelter:'1 ORE → 1 IRON PLATE',assembler:'2 IRON PLATES → 1 GEAR',turret:'1 GEAR → 12 SHOTS',sawmill:'FOREST → 3 WOOD / 3 SEC.',generator:'1 WOOD / 12 SEC. → 18 POWER'};
 $('recipe').textContent=recipes[type]||'';$('intel-tip').textContent=tool?'R rotates. Q or Esc exits build mode. Blue rocks mark iron deposits.':b?'R rotates directional buildings. U upgrades the selected building. 9 repairs; 0 packs into inventory.':'Choose a building from the hotbar to expand your colony.';
}
function updateUi(){
 $('resources').innerHTML=[...RESOURCE_KEYS,'power'].map(r=>`<div title="${r==='power'?'Colony power':`${Math.floor(state.resources[r])} / ${storageCapacity(state)} stored`} " class="resource ${r==='power'?'power':''} ${r==='power'&&state.power.used>state.power.total?'low':''}">${icon(r,23)}<strong>${r==='power'?`${state.power.used}<span style="font-size:10px;opacity:.5">/${state.power.total}</span>`:`${Math.floor(state.resources[r])}<span style="font-size:8px;opacity:.5">/${storageCapacity(state)}</span>`}</strong><small>${RESOURCE_NAMES[r]}</small></div>`).join('');
 const incoming=state.enemies.length>0,time=Math.max(0,state.nextWave-state.time);$('wave-label').textContent=state.paused?'GAME PAUSED':incoming?'PERIMETER CONTACT':'PREPARE YOUR COLONY';$('wave-title').textContent=incoming?'Swarm attacking':'Next swarm';$('countdown').textContent=incoming?String(state.enemies.length):`${String(Math.floor(time/60)).padStart(2,'0')}:${String(Math.floor(time%60)).padStart(2,'0')}`;
 $('wave-fill').style.width=incoming?'100%':Math.min(100,(1-time/(state.wave===0?100:95))*100)+'%';$('wave-fill').style.background=incoming?'var(--red)':'var(--gold)';$('wave-detail').textContent=`SWARM ${Math.min(8,state.wave+(incoming?0:1))} OF ${FINAL_WAVE}`;$('early-wave').disabled=incoming||state.wave>=8||mode==='client'||!started;$('day').textContent='DAY '+String(1+Math.floor(state.time/180)).padStart(2,'0');$('wave-panel').classList.toggle('imminent',started&&!incoming&&time<=20&&state.wave<FINAL_WAVE);if(state.evacuation?.status==='charging'){$('wave-title').textContent='Final evacuation defense';$('countdown').textContent=Math.ceil(state.evacuation.remaining)+'s';$('wave-detail').textContent='PROTECT CORE + EVACUATION PAD';}else if(state.wave>=FINAL_WAVE&&!incoming){$('wave-title').textContent='Build the evacuation pad';$('countdown').textContent='READY';$('wave-detail').textContent='8 SWARMS SURVIVED';}
 const turrets=state.buildings.filter(b=>b.type==='turret'),dry=turrets.filter(b=>b.ammo===0).length,low=turrets.filter(b=>b.ammo<=3).length,warning=dry>0||state.resources.gear<=2&&turrets.length>0||low>0&&state.resources.gear===0;
 $('ammo-alert').hidden=!warning;$('ammo-alert').textContent=dry?`AMMO EMPTY · ${dry} turret${dry===1?'':'s'} need gears`:`LOW AMMO RESERVE · ${Math.floor(state.resources.gear)} gears`;
 $('ammo-alert').classList.toggle('empty',dry>0);
 const goals=[{text:'An industry that works',sub:`${state.produced.plate} / 10 iron plates delivered`,done:state.produced.plate>=10},{text:'Machines of resistance',sub:`${state.produced.gear} / 5 gears delivered`,done:state.produced.gear>=5},{text:'Keep the swarm outside',sub:`${state.wave} / 8 swarms · ${state.totalKills} hostiles stopped`,done:state.wave>=8&&state.enemies.length===0},{text:'Evacuate the colony',sub:state.evacuation?.status==='charging'?`Hold for ${Math.ceil(state.evacuation.remaining)}s`: `${state.resources.module}/30 components · ${state.resources.steel}/60 steel · ${state.resources.circuit}/40 circuits`,done:state.status==='victory'}];
 $('objectives').innerHTML=goals.map(g=>`<div class="objective ${g.done?'done':''}"><span class="check">${g.done?'✓':''}</span><div>${g.text}<small>${g.sub}</small></div></div>`).join('');
 $('team').innerHTML=state.players.length?`<div class="team-title">ENGINEERS · ${state.players.length}/4</div>`+state.players.map(p=>`<div class="teammate"><span class="avatar">${String(p.color+1).padStart(2,'0')}</span><span>${escape(p.name)}${p.hp<=0?` (${Math.ceil(p.respawn)}s)`:''}</span><span class="role">${p.id===state.players[0]?.id?'HOST':p.id===playerId?'YOU':'GUEST'}</span></div>`).join(''):'';
 $('pause').textContent=state.paused?'▶':'Ⅱ';$('speed').textContent=state.speed+'×';$('save').disabled=mode==='client';$('export-save').disabled=mode==='client';$('menu-save').disabled=mode==='client';$('restart').disabled=mode==='client';$('open-lan').disabled=mode==='client';$('leave-lan').hidden=mode==='solo';$('leave-lan').textContent=mode==='host'?'Close LAN (keep the world)':'Leave LAN world';$('end-restart').disabled=mode==='client';$('end-restart').textContent=mode==='client'?'Waiting for host':'Start a new expedition ↗';$('pause').disabled=mode==='client';$('speed').disabled=mode==='client';updateConnection();updateToolbar();updateInspector();drawMinimap();
 if(state.wave>lastWave){lastWave=state.wave;toast(`Swarm ${state.wave} — ${state.enemies.length} hostiles approaching.`);tone(160,.6,.035,'sawtooth');}
 if(started&&state.status!=='playing'&&!ended){ended=true;$('end-title').textContent=state.status==='victory'?'Ironhaven endures.':'The colony has fallen.';$('end-label').textContent=state.status==='victory'?'EVACUATION COMPLETE. THE COLONY SURVIVES.':'EXPEDITION ENDED';$('end-summary').textContent=`You held out for ${Math.floor(state.time/60)} minutes and stopped ${state.totalKills} hostiles. Your industry delivered ${state.produced.plate} iron plates and ${state.produced.gear} gears.`;$('end-dialog').showModal();saveGame(true);}
}
const mini=$('minimap'),ctx=mini.getContext('2d');
function drawMinimap(){const w=mini.width,h=mini.height,sx=w/56,sz=h/56;ctx.fillStyle='#11262a';ctx.fillRect(0,0,w,h);ctx.fillStyle='#31554b';for(const t of state.terrain.trees)ctx.fillRect((t.x+28)*sx,(t.z+28)*sz,2,2);ctx.fillStyle='#d49264';for(const t of state.terrain.copper||[])ctx.fillRect((t.x+28)*sx,(t.z+28)*sz,2,2);ctx.fillStyle='#789d9e';for(const t of state.terrain.ore)ctx.fillRect((t.x+28)*sx,(t.z+28)*sz,2,2);for(const b of state.buildings){ctx.fillStyle=b.type==='wall'?'#657e71':b.type==='hq'?'#eeb96e':'#abd3ae';ctx.fillRect((b.x+28)*sx,(b.z+28)*sz,b.type==='hq'?5:2,b.type==='hq'?5:2);}ctx.fillStyle='#f5816d';for(const e of state.enemies)ctx.fillRect((e.x+28)*sx,(e.z+28)*sz,2,2);ctx.fillStyle='#ffdc98';for(const p of state.players)ctx.fillRect((p.x+28)*sx-1,(p.z+28)*sz-1,3,3);ctx.strokeStyle='#afc8b750';const cw=view.zoom*1.4,ch=view.zoom;ctx.strokeRect((view.center.x+28-cw/2)*sx,(view.center.z+28-ch/2)*sz,cw*sx,ch*sz);}
mini.onclick=e=>{followCamera=false;const rect=mini.getBoundingClientRect();view.center.set((e.clientX-rect.left)/rect.width*56-28,0,(e.clientY-rect.top)/rect.height*56-28);};
function focusEngineer(snap=false){followCamera=true;const p=state.players.find(p=>p.id===playerId);if(p&&snap)view.center.set(p.x,0,p.z);}
function refreshRoute(){
 if(!rowGesture||!hover)return;
 const start=rowGesture.moved?rowGesture.down:(rowGesture.anchor||rowGesture.down),signature=[tool,start.x,start.z,hover.x,hover.z,dir,state.buildings.length].join(':');
 if(signature!==lastRouteKey){lastRouteKey=signature;routePlan=planRoute(state,tool,start,hover,dir);}
 if(!routePlan)return;
 const grid=new Map(state.buildings.map(b=>[key(b.x,b.z),b])),fresh=routePlan.cells.filter(c=>!grid.has(key(c.x,c.z))).length,packed=Math.min(fresh,inventoryCount(state,playerId,tool)),craft=fresh-packed;
 const missing=Object.entries(TYPES[tool].cost).some(([r,n])=>state.resources[r]<n*craft),error=routePlan.error||(missing?'Not enough materials for the entire route':null);
 view.previewRoute(routePlan.cells,!error);$('tool-hint').classList.toggle('invalid',!!error);$('tool-hint').textContent=error||`${routePlan.cells.length} tiles · ${packed} from inventory · ${Object.entries(TYPES[tool].cost).map(([r,n])=>`${n*craft} ${RESOURCE_NAMES[r].toLowerCase()}`).join(' + ')} · Release to build · Q / Esc cancels`;
 view.cursor.visible=false;if(view.ghost)view.ghost.visible=false;
}
function commitRoute(){
 if(!rowGesture||!hover)return;const start=rowGesture.moved?rowGesture.down:(rowGesture.anchor||rowGesture.down),end={...hover};
 if(execute({type:'buildRow',building:tool,start,end,dir})!==false){rowAnchor={...end,type:tool};tone(700,.06,.02,'triangle');}
 rowGesture=null;routePlan=null;lastRouteKey='';view.previewRoute([]);updateHover();
}
function buildAt(cell){
 if(!cell||!tool||!started)return;const b=state.buildings.find(b=>b.x===cell.x&&b.z===cell.z);
 if(tool==='belt'&&b?.type==='belt'){rowAnchor={...cell,type:tool};toast('Conveyor anchor set. Shift-click an endpoint to extend the route.');return;}
 const cmd=tool==='demolish'||tool==='repair'?{type:tool,x:cell.x,z:cell.z}:{type:'build',building:tool,x:cell.x,z:cell.z,dir,connectFrom:rowAnchor};
 if(execute(cmd)!==false){rowAnchor={...cell,type:tool};tone(tool==='demolish'?190:700,.035,.015,'triangle');}updateHover();
}
$('world').addEventListener('pointermove',e=>{
 pointer={x:e.clientX,y:e.clientY};hover=view.point(e.clientX,e.clientY);
 if(selectionGesture){if(Math.hypot(e.clientX-selectionGesture.screen.x,e.clientY-selectionGesture.screen.y)>5){selectionGesture.moved=true;const box=$('selection-box');box.hidden=false;box.style.left=Math.min(e.clientX,selectionGesture.screen.x)+'px';box.style.top=Math.min(e.clientY,selectionGesture.screen.y)+'px';box.style.width=Math.abs(e.clientX-selectionGesture.screen.x)+'px';box.style.height=Math.abs(e.clientY-selectionGesture.screen.y)+'px';}return;}
 if(rowGesture&&Math.hypot(e.clientX-rowGesture.screen.x,e.clientY-rowGesture.screen.y)>4)rowGesture.moved=true;
 updateHover();
});
$('world').addEventListener('pointerdown',e=>{
 if(e.button===2){setTool(null);return;}if(e.button!==0||!started)return;
 pointer={x:e.clientX,y:e.clientY};hover=view.point(e.clientX,e.clientY);if(!hover)return;
 if(movingArea){placeArea(e.shiftKey);return;}
 if(tool){
  if(e.shiftKey&&['belt','wall'].includes(tool)){rowGesture={down:{...hover},anchor:rowAnchor?.type===tool?{x:rowAnchor.x,z:rowAnchor.z}:null,screen:{x:e.clientX,y:e.clientY},moved:false};lastRouteKey='';refreshRoute();}
  else buildAt(hover);
 }else{selectionGesture={down:{...hover},screen:{x:e.clientX,y:e.clientY},moved:false};const b=state.buildings.find(b=>b.x===hover.x&&b.z===hover.z);selected=b?.id||null;areaIds=b?[b.id]:[];view.select(b);if(b)$('intel').hidden=false;updateAreaTools();updateInspector();}
});
window.addEventListener('pointerup',e=>{if(selectionGesture){const g=selectionGesture;selectionGesture=null;$('selection-box').hidden=true;if(g.moved){const end=view.point(e.clientX,e.clientY)||hover;areaIds=state.buildings.filter(b=>b.x>=Math.min(g.down.x,end.x)&&b.x<=Math.max(g.down.x,end.x)&&b.z>=Math.min(g.down.z,end.z)&&b.z<=Math.max(g.down.z,end.z)).map(b=>b.id);selected=areaIds.length===1?areaIds[0]:null;view.select(state.buildings.find(b=>b.id===selected));updateAreaTools();}return;}if(rowGesture&&e.button===0){hover=view.point(e.clientX,e.clientY)||hover;commitRoute();}});
$('world').addEventListener('contextmenu',e=>e.preventDefault());
$('world').addEventListener('pointerleave',()=>{if(!rowGesture&&!selectionGesture&&!movingArea){pointer=null;hover=null;updateHover();}});
function rotateExisting(){
 const b=hover&&state.buildings.find(b=>b.x===hover.x&&b.z===hover.z&&b.type==='belt')||state.buildings.find(b=>b.id===selected);
 if(!b||!DIRECTIONAL.includes(b.type))return false;
 execute({type:'rotate',x:b.x,z:b.z});lastRouteKey='';tone(550,.04);updateInspector();return true;
}
$('rotate-building').onclick=()=>{const b=state.buildings.find(b=>b.id===selected);if(b)execute({type:'rotate',x:b.x,z:b.z});};
$('launch-colony').onclick=()=>{const b=state.buildings.find(b=>b.id===selected);if(b)execute({type:'launch',x:b.x,z:b.z});};
$('upgrade-turret').onclick=()=>{const b=state.buildings.find(b=>b.id===selected);if(b&&execute({type:'upgrade',x:b.x,z:b.z})!==false){tone(880,.16);updateUi();}};
$('world').addEventListener('wheel',e=>{e.preventDefault();view.setZoom(e.deltaY*.015);},{passive:false});
window.addEventListener('keydown',e=>{
 if(['INPUT','TEXTAREA'].includes(e.target.tagName))return;
 if(e.key==='Escape'||e.key.toLowerCase()==='q'){setTool(null);clearArea();keys.clear();return;}
 if(document.querySelector('dialog[open]'))return;
 if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(!started||e.repeat)return;
 const i=SHORTCUT.indexOf(e.key);if(i>=0)setTool(tool===TOOL_LIST[i]?null:TOOL_LIST[i]);
 if(e.key.toLowerCase()==='r'){if(!rotateExisting()&&tool){dir=(dir+1)%4;view.setTool(tool,dir);lastRouteKey='';updateHover();}}
 if(e.key.toLowerCase()==='m'&&areaIds.length)beginMove();
 if(e.key.toLowerCase()==='u'&&selected)$('upgrade-turret').click();
 if(e.key.toLowerCase()==='p')execute({type:'pause'});if(e.key===' ')focusEngineer(true);if(e.key==='?')$('help-dialog').showModal();
});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();if(started)execute({type:'move',x:0,z:0});});
$('start-solo').onclick=()=>startGame();$('resume').onclick=()=>startGame(true);$('start-lan').onclick=()=>showLan();$('open-lan').onclick=()=>showLan();$('help').onclick=()=>$('help-dialog').showModal();$('menu').onclick=()=>$('menu-dialog').showModal();$('brand').onclick=e=>{e.preventDefault();if(started)$('menu-dialog').showModal();};$('continue').onclick=()=>$('menu-dialog').close();$('pause').onclick=()=>execute({type:'pause'});$('speed').onclick=()=>execute({type:'speed'});$('save').onclick=()=>saveGame();$('menu-save').onclick=()=>saveGame();$('early-wave').onclick=()=>execute({type:'wave'});$('zoom-in').onclick=()=>view.setZoom(-2);$('zoom-out').onclick=()=>view.setZoom(2);$('focus').onclick=()=>focusEngineer(true);$('restart').onclick=()=>{$('menu-dialog').close();restart();};$('end-restart').onclick=restart;
$('quality').onclick=()=>{lowQuality=!lowQuality;view.setQuality(lowQuality);$('quality').textContent='Graphics: '+(lowQuality?'light (no shadows)':'standard');};
function updateSound(){$('sound').innerHTML=icon(muted?'mute':'sound',19);$('sound').setAttribute('aria-label',muted?'Enable sound':'Mute sound');}
$('sound').onclick=()=>{muted=!muted;updateSound();tone(660,.09);};updateSound();
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>b.closest('dialog').close();
function nameplates(){const root=$('nameplates');const ids=new Set(state.players.map(p=>'p'+p.id));for(const el of [...root.children])if(!ids.has(el.id))el.remove();for(const p of state.players){let el=$('p'+p.id);if(!el){el=document.createElement('div');el.id='p'+p.id;el.className='nameplate';root.append(el);}const pos=view.project(p.x,p.z);el.style.left=pos.x+'px';el.style.top=pos.y+'px';el.hidden=!pos.visible;el.textContent=p.name+(p.id===playerId?' · YOU':'')+(p.hp<=0?` · ${Math.ceil(p.respawn)}s`:'');el.classList.toggle('dead',p.hp<=0);}}
function buildingLabels(){
 const root=$('building-labels'),wanted=new Set();
 for(const b of state.buildings){
  const damaged=b.hp<maxHp(b),ammoLow=b.type==='turret'&&(b.ammo<=3||state.resources.gear<=1&&b.ammo<=6);
  if(!damaged&&!ammoLow)continue;
  const pos=view.project(b.x,b.z,b.type==='hq'?2.8:1.65);if(!pos.visible)continue;
  const id='building-'+b.id;wanted.add(id);let el=$(id);if(!el){el=document.createElement('div');el.className='building-label';el.id=id;root.append(el);}
  el.style.left=pos.x+'px';el.style.top=pos.y+'px';
  const content=(damaged?`<span class="world-health ${b.hp/maxHp(b)<.3?'critical':''}" title="${Math.ceil(b.hp)} / ${maxHp(b)} HP"><i style="width:${Math.max(0,b.hp/maxHp(b)*100)}%"></i></span>`:'')+(ammoLow?`<span class="world-ammo ${b.ammo===0?'empty':''}">${b.ammo===0?'NO AMMO':'LOW AMMO · '+b.ammo}</span>`:'');
  if(el.innerHTML!==content)el.innerHTML=content;
 }
 for(const el of [...root.children])if(!wanted.has(el.id))el.remove();
}
function updateAreaTools(){
 $('area-tools').hidden=!areaIds.length;$('area-count').textContent=areaIds.length+' selected';view.markArea(areaIds,state);
}
function clearArea(){areaIds=[];movingArea=false;selectionGesture=null;pendingMove=null;$('selection-box').hidden=true;$('area-tools').hidden=true;view.markArea([],state);view.previewRoute([]);$('tool-hint').hidden=!tool;}
function beginMove(){if(!areaIds.length)return;tool=null;view.setTool(null);movingArea=true;followCamera=false;$('tool-hint').hidden=false;previewMove();}
function movePlan(){if(!hover)return null;const bs=state.buildings.filter(b=>areaIds.includes(b.id));if(!bs.length){clearArea();return null;}const ax=Math.round((Math.min(...bs.map(b=>b.x))+Math.max(...bs.map(b=>b.x)))/2),az=Math.round((Math.min(...bs.map(b=>b.z))+Math.max(...bs.map(b=>b.z)))/2);return{...planMove(state,areaIds,hover.x-ax,hover.z-az),dx:hover.x-ax,dz:hover.z-az};}
function previewMove(){const plan=movePlan();if(!plan)return;view.previewRoute([...plan.valid,...plan.invalid],!plan.error&&!plan.invalid.length);$('tool-hint').classList.toggle('invalid',!!plan.error||plan.invalid.length>0);$('tool-hint').textContent=plan.error||`${plan.valid.length} valid · ${plan.invalid.length} blocked · Click to move · Shift-click packs invalid buildings · Q / Esc cancels`;}
function placeArea(override){const plan=movePlan();if(!plan)return;if(plan.error){toast(plan.error,true);return;}const cmd={type:'moveArea',ids:[...areaIds],dx:plan.dx,dz:plan.dz,override};if(plan.invalid.length&&override&&!readStorage('ironhaven.skipMoveConfirm')){pendingMove=cmd;$('move-confirm-summary').textContent=`Move ${plan.valid.length} buildings and pack ${plan.invalid.length} invalid buildings into inventory?`;$('move-invalid-list').innerHTML=plan.invalid.slice(0,20).map(b=>`<li>${escape(TYPES[b.type].name)}: ${escape(b.reason)}</li>`).join('');$('move-dont-ask').checked=false;$('move-confirm').showModal();return;}if(execute(cmd)!==false){clearArea();toast('Area relocated.');}}
$('move-selection').onclick=beginMove;$('clear-selection').onclick=clearArea;
$('confirm-move').onclick=()=>{if(!pendingMove)return;if($('move-dont-ask').checked)writeStorage('ironhaven.skipMoveConfirm','true');const cmd=pendingMove;$('move-confirm').close();if(execute(cmd)!==false){clearArea();toast('Area relocated. Invalid buildings are in your inventory.');}};
$('reset-move-confirm').onclick=()=>{writeStorage('ironhaven.skipMoveConfirm','');toast('Move confirmations restored.');};
$('export-save').onclick=()=>{if(mode==='client')return;saveGame(true);const text=readStorage(SAVE);if(!text)return;const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Ironhaven-'+CURRENT_VERSION+'-world.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('World backup exported.');};
$('import-save').onclick=()=>$('save-file').click();
$('save-file').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(lan.peers.size)throw Error('Close LAN before importing a world.');const data=parseSave(await file.text());writeStorage(SAVE,JSON.stringify(data));$('menu-dialog').close();startGame(true);toast('World backup imported.');}catch(error){toast(error.message,true);}finally{e.target.value='';}};
const enemyCanvas=$('enemy-health'),enemyCtx=enemyCanvas.getContext('2d');
function enemyHealth(){if(enemyCanvas.width!==innerWidth||enemyCanvas.height!==innerHeight){enemyCanvas.width=innerWidth;enemyCanvas.height=innerHeight;}enemyCtx.clearRect(0,0,innerWidth,innerHeight);for(const e of state.enemies){const p=view.project(e.x,e.z,1.35*(e.brute?1.4:1));if(!p.visible)continue;enemyCtx.fillStyle='#102125ee';enemyCtx.fillRect(p.x-13,p.y-3,26,5);enemyCtx.fillStyle=e.hp/e.maxHp<.3?'#ff6b59':'#d88976';enemyCtx.fillRect(p.x-12,p.y-2,24*Math.max(0,e.hp/e.maxHp),3);}}
// 20 authoritative ticks/second; clients only render received snapshots.
setInterval(()=>{
 if(!started||mode==='client')return;
 for(let i=0;i<state.speed;i++)step(state,STEP);
 if(mode==='host'&&++syncTick%2===0){
  const revision=`${state.terrain.trees.length}:${state.terrain.rocks.length}`,withoutTerrain={...state};delete withoutTerrain.terrain;
  const raw=JSON.stringify({type:'state',state:withoutTerrain});
  for(const peer of lan.peers.values())if(peer.ready&&peer.playerId){if(peer.terrainRevision!==revision){lan.send(peer,{type:'state',state});peer.terrainRevision=revision;}else lan.send(peer,raw);}
 }
},50);
let prev=performance.now();function frame(now){const dt=Math.min(.05,(now-prev)/1000);prev=now;
 if(started){
  const modal=!!document.querySelector('dialog[open]'),x=modal?0:(keys.has('d')?1:0)-(keys.has('a')?1:0),z=modal?0:(keys.has('s')?1:0)-(keys.has('w')?1:0),sprint=!modal&&keys.has('shift'),input=`${x},${z},${sprint}`;
  if(input!==lastMove||mode==='client'&&now-lastNet>500){execute({type:'move',x,z,sprint});lastMove=input;lastNet=now;}
  if(!modal){const cx=(keys.has('arrowright')?1:0)-(keys.has('arrowleft')?1:0),cz=(keys.has('arrowdown')?1:0)-(keys.has('arrowup')?1:0);if(cx||cz){followCamera=false;view.pan(cx*dt*9,cz*dt*9);}}
  if(x||z)followCamera=true;if(followCamera){const p=state.players.find(p=>p.id===playerId);if(p)view.follow(p,dt);}
  if(now-lastSave>30000){lastSave=now;saveGame(true);}view.sync(state);if(areaIds.length)view.markArea(areaIds,state);
 }else{view.sync({...state,time:now/1000});}
 view.draw();nameplates();buildingLabels();enemyHealth();if(pointer&&started){const cell=view.point(pointer.x,pointer.y);if(cell&&(cell.x!==hover?.x||cell.z!==hover?.z)){hover=cell;updateHover();}}if(now-lastUi>200){lastUi=now;updateUi();updateHover();}requestAnimationFrame(frame);
}
initHotbar();updateUi();view.sync(state);view.draw();$('loading').hidden=true;requestAnimationFrame(frame);
window.addEventListener('beforeunload',()=>{if(started&&mode!=='client')saveGame(true);});
