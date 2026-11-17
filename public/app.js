import {lighthouseBeam,lighthouseHeading,LIGHTHOUSE_REACH,LIGHTHOUSE_CONE} from './shared/lighthouse.js';
import {HOSTILES,hostileKind} from './shared/hostiles.js';
import { View } from './render.js';
import { RenderMotion } from './motion.js';
import { upgradeColor } from './upgrade-colors.js';
import { createGame,createExpedition,addPlayer,removePlayer,command,step,STEP,TYPES,canBuild,FINAL_WAVE,migrateGame,inventoryCount,maxHp,turretStats,usesAmmo,POWER_CAPACITY,DIRECTIONAL,DIRS,planRoute,planBeltDrag,key,RECIPES,RESOURCE_KEYS,upgradeCost,MAX_UPGRADES,storageCapacity,planMove,buildingPower,productionSpeed,plateYield,beltTravelTicks,powerOutput,warehouseCapacity,warehouseStock,roundBonus,repairCost,TURRETS,GENERATORS,SIZE,SWARM_DIRECTIONS,sawmillTrees,sawmillRate,waveForecast,LOGISTICS_TYPES,PROGRAM_ROLES,DEFAULT_PROGRAM,ITEM_KEYS,programFor,logisticsPorts } from './shared/sim.js';
import { CURRENT_VERSION,RELEASE_STAGE,RELEASES,displayVersion } from './shared/releases.js';
import { TUTORIAL_STEPS,tutorialTargets } from './shared/tutorial.js';
import { initWindows } from './windows.js';
import { factoryStatus,STATUS_LABELS,productionReport,stockFlow } from './shared/diagnostics.js';
import { parseSave,packWorldSave } from './shared/saves.js';
import { Lan } from './network.js';
import { icon,RESOURCE_NAMES } from './icons.js';
import { copySetup,planPaste,planGroupUpgrade,hasOutputBuffer,outputCount,OUTPUT_CAPACITY,isPostVictory,canSpawnSwarm,BELT_CAPACITY,conveyorCount,buildingRadius,turretReload } from './shared/sim.js';
const $=id=>document.getElementById(id),SAVE='ironhaven.save.v1',NAME='ironhaven.name';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=createGame(),playerId=null,started=false,mode='solo',view,tool=null,dir=0,selected=null,tab='production',lastWave=0,lastEvent=0,ended=false,lowQuality=false,muted=true,audio=null,hover=null,dragging=false,lastBuild='',lastUi=0,lastSave=0,syncTick=0,pendingDisconnect=false;
const keys=new Set(),motion=new RenderMotion(),renderPoint={x:0,z:0};
let cameraTravel=0,rowAnchor=null,rowGesture=null,routePlan=null,lastRouteKey='',pointer=null;
let areaIds=[],selectionGesture=null,movingArea=false,pendingMove=null,showDiagnostics=false,checkpointCache=null,lastAutoCheckpoint='';
let copiedSetup=[],pasting=false,aimingLight=false;
const CHECKPOINTS='ironhaven.checkpoints.v1';
let programTargetId=null;
initWindows();
$('version-label').textContent=displayVersion(CURRENT_VERSION)+' '+RELEASE_STAGE.toUpperCase();
$('start-patch-notes').textContent=RELEASE_STAGE.toUpperCase()+' '+displayVersion(CURRENT_VERSION)+' · WHAT’S NEW ↗';
$('patch-history').innerHTML=RELEASES.map((r,i)=>`<article class="patch-entry"><div class="patch-version"><strong>${escape(displayVersion(r.version))}</strong>${i===0?'<span class="current-release">CURRENT</span>':''}<time>${escape(r.date)}</time></div><h3>${escape(r.title)}</h3><ul>${r.changes.map(c=>`<li>${escape(c)}</li>`).join('')}</ul></article>`).join('');
for(const b of document.querySelectorAll('[data-patch-notes]'))b.onclick=()=>{$('menu-dialog').close();$('patch-dialog').showModal();};
function toast(text,error=false){const e=document.createElement('div');e.className='toast'+(error?' error':'');e.textContent=text;$('toasts').append(e);setTimeout(()=>e.remove(),4000);}
function tone(freq=440,duration=.08,volume=.025,type='sine'){
 if(muted)return;try{audio||=new AudioContext();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}
}
try{view=new View($('world'));}catch(e){$('loading').innerHTML='<p>3D could not start. 3D graphics could not initialize. Update your graphics driver and restart Ironhaven.</p>';throw e;}
function readStorage(key){try{return localStorage.getItem(key);}catch{return null;}}
function writeStorage(key,value){try{localStorage.setItem(key,value);return true;}catch{return false;}}
setGraphics(readStorage('ironhaven.lightGraphics')==='true');
$('skip-tutorial').checked=readStorage('ironhaven.skipTutorial')==='true';
$('player-name').value=readStorage(NAME)||'Engineer';$('difficulty').value=readStorage('ironhaven.difficulty')||'standard';
if(readStorage(SAVE))$('resume').hidden=false;
document.body.classList.add('at-start');
const CATEGORIES={
 production:{key:'z',tools:['drill','copperDrill','coalMine','smelter','assembler','sawmill','foundry','circuitLab','componentFactory']},
 defense:{key:'x',tools:['turret','gunTurret','mortar','pulseTurret','wall','repair','demolish']},
 power:{key:'c',tools:['generator','coalGenerator']},
 logistics:{key:'v',tools:['belt','storage','inserter','splitter']}
};
const TOOL_LIST=Object.values(CATEGORIES).flatMap(category=>category.tools);
const shortcutFor=type=>type==='demolish'?'F':SHORTCUT[Object.values(CATEGORIES).find(category=>category.tools.includes(type)).tools.indexOf(type)];
function setCategory(category){
 if(tab!==category&&tool)setTool(null);
 tab=category;updateToolbar();
}
const SHORTCUT=['1','2','3','4','5','6','7','8','9','0'];
function costText(type,cost=TYPES[type].cost){
 const abbreviations={wood:'W',plate:'P',gear:'⚙',copper:'Cu',steel:'S',circuit:'Cir',module:'Comp',coal:'Coal'};
 return Object.entries(cost).map(([r,n])=>`${n}${abbreviations[r]}`).join(' · ')||'FREE';
}
function initHotbar(){
 $('hotbar').innerHTML=TOOL_LIST.map((t)=>`<button class="build-btn" data-type="${t}" title="${TYPES[t].name} (${shortcutFor(t)})"><span class="key">${shortcutFor(t)}</span>${icon(t)}${!['repair','demolish'].includes(t)?'<span class="inventory-count" title="Buildings in your inventory">0</span>':''}<span class="build-name">${TYPES[t].name}</span><span class="build-cost">${costText(t)}</span></button>`).join('');
 $('hotbar').addEventListener('click',e=>{const b=e.target.closest('[data-type]');if(b&&started)setTool(tool===b.dataset.type?null:b.dataset.type);});
 document.querySelectorAll('[data-tab]').forEach(el=>el.onclick=()=>setCategory(el.dataset.tab));
}
function updateToolbar(){
 const repair=repairCost(roundBonus(state.wave)),repairLabel=$('hotbar').querySelector('[data-type=repair] .build-cost');
 const repairText=costText('repair',repair);if(repairLabel.textContent!==repairText)repairLabel.textContent=repairText;
 document.querySelectorAll('[data-tab]').forEach(el=>el.classList.toggle('active',el.dataset.tab===tab));
 document.querySelectorAll('.build-btn').forEach(el=>{const t=el.dataset.type;el.hidden=!CATEGORIES[tab].tools.includes(t);el.classList.toggle('active',tool===t);const count=inventoryCount(state,playerId,t),badge=el.querySelector('.inventory-count');if(badge){badge.textContent=String(count);badge.classList.toggle('has-stock',count>0);}el.classList.toggle('unaffordable',count===0&&Object.entries(t==='repair'?repair:TYPES[t].cost).some(([r,n])=>state.resources[r]<n));});
}
function setTool(t){aimingLight=false;$('aim-light').classList.remove('active');pasting=false;if(t||selectionGesture?.trees)clearArea();rowAnchor=null;rowGesture=null;routePlan=null;lastRouteKey='';dragging=false;view.previewRoute([]);tool=t;selected=null;view.select(null);view.setTool(t,dir);$('tool-hint').hidden=!t;updateToolbar();updateInspector();updateHover();if(t)tone(350,.04);}
function beginLightAim(){if(!started)return;setTool(null);clearArea();aimingLight=true;$('aim-light').classList.add('active');updateHover();}
$('aim-light').onclick=()=>aimingLight?setTool(null):beginLightAim();
function updateHover(){
 if(aimingLight){
  $('tool-hint').hidden=false;$('tool-hint').classList.remove('invalid');
  $('tool-hint').textContent='AIM LIGHT · Click a map tile · Esc / right-click cancels · Lit targets: +20% defense range';
  view.hover(hover,true,null);return;
 }
 if(pasting){previewPaste();return;}
 if(movingArea){previewMove();return;}
 if(rowGesture&&refreshRoute())return;
 if(!hover||!tool){view.hover(null,false,tool);return;}
 let error;if(['repair','demolish'].includes(tool))error=null;else error=canBuild(state,tool,hover.x,hover.z,playerId);
 view.hover(hover,!error,tool,buildingRadius({type:tool}));$('coords').textContent=`${hover.x}, ${hover.z}`;
 if(tool==='sawmill'){
  const candidate={type:tool,...hover};
  $('blueprint-site').textContent=`${sawmillTrees(state.terrain,candidate)} trees · ${Math.round(60*sawmillRate(state,candidate))} wood/min`;
 }
 if(tool==='demolish'){$('tool-hint').textContent='Click to dismantle · Shift-drag clears trees · Q / Esc exits';$('tool-hint').classList.remove('invalid');return;}
 $('tool-hint').textContent=error||`${TYPES[tool].name} · ${['→ EAST','↓ SOUTH','← WEST','↑ NORTH'][dir]} · Click to ${tool==='demolish'?'clear':tool==='repair'?'repair':'build'} · ${tool==='belt' ? 'Drag to lay a line · ' : ''}R rotates · Q / Esc exits`;
 if(!error&&TYPES[tool].power>0&&state.power.used+buildingPower({type:tool})>state.power.total){
  $('tool-hint').textContent+=' · Grid shortfall: add generation';
 }
 $('tool-hint').classList.toggle('invalid',!!error);
}
function execute(cmd){
 if(!started)return;
 if(mode==='client'){const host=lan.peers.get('host');if(!lan.send(host,{type:'command',command:cmd}))toast('The connection to the host is closed.',true);return;}
 const error=command(state,playerId,cmd);if(error){toast(error,true);tone(130,.1,.02);return false;}return true;
}
function saveGame(quiet=false){
 if(!started||mode==='client'){if(!quiet)toast('Only the host can save the world.',true);return;}
 const {state:data}=packWorldSave(state,playerId);
 if(!writeStorage(SAVE,JSON.stringify({state:data,playerId}))){if(!quiet)toast('Could not save. Local save storage is unavailable or full.',true);return;}
 if(!quiet)toast('World saved on this device.');$('resume').hidden=false;
}
function newExpedition(name,difficulty){
 const skipTutorial=$('skip-tutorial').checked;
 ({state,playerId}=createExpedition(name,{difficulty,skipTutorial,swarmSeed:crypto.getRandomValues(new Uint32Array(1))[0]}));
 writeStorage('ironhaven.skipTutorial',String(skipTutorial));
 writeStorage(CHECKPOINTS,'[]');checkpointCache=[];lastAutoCheckpoint='';
}
function startGame(resume=false){
 if(resume){try{const data=parseSave(readStorage(SAVE));state=data.state;playerId=data.playerId;state.paused=false;state.players=state.players.filter(p=>p.id===playerId);}catch{toast('Could not open the saved world.',true);return false;}}
 else newExpedition($('player-name').value,$('difficulty').value);
 mode='solo';finishStart();checkpoint(resume?'Resumed world':'Expedition start');return true;
}
function finishStart(){started=true;ended=false;lastWave=state.wave;lastEvent=0;writeStorage(NAME,$('player-name').value);$('difficulty').value=state.difficulty||'standard';writeStorage('ironhaven.difficulty',$('difficulty').value);$('start-screen').hidden=true;document.body.classList.remove('at-start');$('end-dialog').close();clearArea();setTool(null);motion.reset();cameraTravel=0;view.centerBase();updateUi();view.sync(state);tone(520,.15);}
function restart(){
 if(mode==='client'){toast('Only the host can restart the expedition.',true);return;}
 if(mode==='host'){
  newExpedition(state.players.find(p=>p.id===playerId)?.name,state.difficulty);
  for(const peer of lan.peers.values())if(peer.ready&&peer.playerId){const p=addPlayer(state,peer.name);peer.playerId=p.id;lan.send(peer,{type:'welcome',id:p.id,state,version:CURRENT_VERSION});}
  view.terrainKey='';finishStart();checkpoint('Expedition start');
 }else startGame();
 toast('A new colony has been founded.');
}
function returnToStart(){
 if(mode!=='client')saveGame(true);
 pendingDisconnect=true;lan.close();pendingDisconnect=false;
 started=false;ended=false;mode='solo';playerId=null;state=createGame();
 keys.clear();pointer=null;hover=null;copiedSetup=[];
 motion.reset();clearArea();setTool(null);view.centerBase();
 $('end-dialog').close();$('start-screen').hidden=false;document.body.classList.add('at-start');
 $('resume').hidden=!readStorage(SAVE);updateUi();
}
$('end-main-menu').onclick=returnToStart;
$('end-continue').onclick=()=>{if(execute({type:'continueAfterVictory'})===true){updateUi();saveGame(true);}};
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
 const b=state.buildings.find(b=>b.id===selected),type=tool||b?.type||'hq',def=TYPES[type];$('intel').classList.toggle('has-selection',!!b||!!tool&&!!def.hp);$('rotate-building').hidden=!b||!!tool||!DIRECTIONAL.includes(b.type);$('upgrade-turret').hidden=!b||!!tool||b.type==='turret';$('program-building').hidden=!b||!!tool||!LOGISTICS_TYPES.includes(b.type);
 const impact=$('upgrade-impact');impact.hidden=!b||!!tool||!upgradeCost(b);if(!impact.hidden)impact.textContent=upgradeImpact(b);
 if(b){const cost=upgradeCost(b),btn=$('upgrade-turret');btn.textContent=cost?`Upgrade ${b.level||1} / ${MAX_UPGRADES} (U) · ${Object.entries(cost).map(([r,n])=>n+' '+RESOURCE_NAMES[r].toLowerCase()).join(' + ')}`:'Fully upgraded · 10/10';btn.disabled=!cost||Object.entries(cost).some(([r,n])=>state.resources[r]<n);}
 $('program-building').textContent='Program flow (E) ↗';
 $('intel-label').textContent=tool?'BLUEPRINT':b?'SELECTED BUILDING':'COLONY STATUS';$('intel-icon').innerHTML=icon(type,28);$('intel-title').textContent=def.name;$('intel-desc').textContent=def.desc;
 $('port-key').hidden=!LOGISTICS_TYPES.includes(type);
 const outputOptions=$('output-options');outputOptions.hidden=!b||!!tool||!hasOutputBuffer(type);
 const warehouseOptions=$('warehouse-options');
 warehouseOptions.hidden=!b||!!tool||type!=='storage';
 if(!warehouseOptions.hidden){
  const item=b.exportItem,select=$('warehouse-export');
  if(document.activeElement!==select||select.dataset.id!==String(b.id))select.value=item??'';
  select.dataset.id=b.id;
  const direction=['east','south','west','north'][b.dir];
  $('warehouse-export-status').textContent=item==='recipe'?`Feeds the adjacent machine to the ${direction} from this warehouse.`:
   item?`${warehouseStock(b,item)} in this warehouse · output ${direction}`:`Output faces ${direction}. Rotate with R.`;
  const held=RESOURCE_KEYS.filter(item=>warehouseStock(b,item)>0);
  $('warehouse-stock').textContent=held.map(item=>warehouseStock(b,item)+' '+ITEM_NAMES[item]).join(' · ')||'Local stock is empty.';
 }
 if(!outputOptions.hidden){
  const stock=[b.item,...(b.outputBuffer||[])].filter(Boolean).reduce((counts,item)=>(counts[item]=(counts[item]||0)+1,counts),{});
  $('output-stock').textContent=`Output buffer ${outputCount(b)} / ${OUTPUT_CAPACITY}`;
  $('output-stock-items').textContent=Object.entries(stock).map(([item,count])=>`${count} ${ITEM_NAMES[item]}`).join(' · ');
  $('send-output').checked=b.sendOutput===true;$('receive-output').checked=b.receiveOutput===true;
 }
 const inputStatus=$('input-stock');inputStatus.hidden=!b||!!tool||!RECIPES[type];
 if(!inputStatus.hidden){
  const requirements=RECIPES[type].input;
  const materials=type==='smelter'?[['ore',1],['copperOre',1]]:Object.entries(requirements);
  const rows=materials.map(([item,count])=>{
   const held=b.input.filter(value=>value===item).length;
   return `<div class="stat-row"><span>${escape(ITEM_NAMES[item])}</span><span class="${held<count?'bad':'ok'}">${held} / ${count} needed</span></div>`;
  }).join('');
  if(inputStatus.innerHTML!==rows)inputStatus.innerHTML=rows;
 }
 const row=(a,v,cls='')=>`<div class="stat-row"><span>${a}</span><span class="${cls}">${v}</span></div>`;
 const site=$('blueprint-site');site.hidden=tool!=='sawmill';if(site.hidden||!hover)site.textContent='';
 if(tool){const count=inventoryCount(state,playerId,type);$('intel-stats').innerHTML=(count?row('Use from inventory',count,'ok'):Object.entries(def.cost).map(([r,n])=>row(RESOURCE_NAMES[r],n,state.resources[r]>=n?'ok':'bad')).join(''))+blueprintStats(type,row);}
 else{const bb=b||state.buildings.find(b=>b.type==='hq');$('intel-stats').innerHTML=bb?row('Health',`${Math.max(0,Math.ceil(bb.hp))} / ${maxHp(bb)}`)+`<div class="hp-bar"><i style="width:${Math.max(0,bb.hp/maxHp(bb)*100)}%"></i></div>`+row('Status',STATUS_LABELS[factoryStatus(state,bb,new Map(state.buildings.map(v=>[key(v.x,v.z),v])))],bb.active?'ok':'bad')+(usesAmmo(bb.type)?row('Ammo',bb.ammo,bb.ammo<=3?'bad':'ok')+row('Turret level',turretStats(bb).name)+row('Damage / range',`${turretStats(bb).damage} / ${turretStats(bb).range}`):'')+(bb.type==='turret'?row('Ammo','No ammo needed'):'')+(bb.input?.length?row('Input buffer',bb.input.length+'/'+((bb.type==='smelter'?2:Object.values(RECIPES[bb.type]?.input||{}).reduce((n,v)=>n+v,0))*4||8)):'')+(buildingPower(bb)?row('Power used',buildingPower(bb)):'')+(RECIPES[bb.type]||['drill','copperDrill','sawmill'].includes(bb.type)?row('Production speed',productionSpeed(bb,roundBonus(state.wave),state.difficulty).toFixed(2)+'×'):'')+(bb.type==='sawmill'?row('Nearby trees',sawmillTrees(state.terrain,bb))+row('Wood / min',Math.round(60*sawmillRate(state,bb))):'')+(GENERATORS[bb.type]?row('Power supplied',Math.round(GENERATORS[bb.type].power*(1+((bb.level||1)-1)*.3))):'')+(bb.type==='turret'?row('Upgrades','Fixed level'):row('Upgrades',`<i class="upgrade-swatch" aria-hidden="true" style="background:${upgradeColor(bb.level)}"></i>${(bb.level||1)-1} / ${MAX_UPGRADES}`))+(bb.type==='storage'||bb.type==='hq'?row('Storage / material',bb.type==='storage'?warehouseCapacity(bb):storageCapacity(state)):'')+(LOGISTICS_TYPES.includes(bb.type)?row('Plan M / F / R',`${programFor(bb).machine} / ${programFor(bb).forward} / ${programFor(bb).return}`)+row('Batch remaining',bb.remaining||0)+row('Delivered M / F / R',`${bb.shipments?.machine||0} / ${bb.shipments?.forward||0} / ${bb.shipments?.return||0}`)+row('Bypassed',bb.shipments?.bypassed||0):'')+row('Position',`${bb.x}, ${bb.z}`):row('Status','Lighthouse destroyed','bad');}
 const recipes={inserter:'BELT → RECIPE-AWARE CARGO CAPSULE',splitter:'PROGRAMMED MACHINE / FORWARD / RETURN',coalMine:'COAL DEPOSIT → COAL',coalGenerator:'1 COAL / 16 SEC. → 36 POWER',copperDrill:'COPPER ORE → SMELTER',foundry:'3 IRON PLATES → 1 STEEL',circuitLab:'2 COPPER + 1 PLATE → 1 CIRCUIT',componentFactory:'2 STEEL + 2 CIRCUITS + 1 GEAR → 1 COMPONENT',storage:'LOCAL STOCK · SET OUTPUT IN INSPECTOR',drill:'IRON ORE → CONVEYOR',smelter:'Iron ore → Iron plate · Copper ore → Copper',assembler:'2 IRON PLATES → 1 GEAR',turret:'UNLIMITED AMMO · FIXED LEVEL',gunTurret:'16 SHOTS PER GEAR',mortar:'4 SHELLS PER GEAR · WIDE SPLASH',pulseTurret:'8 BURSTS PER GEAR · SHORT RANGE',sawmill:'WOOD OUTPUT SCALES WITH NEARBY TREES',generator:'1 WOOD / 12 SEC. → 18 POWER'};
 $('recipe').textContent=recipes[type]||'';$('intel-tip').textContent=tool?'R rotates. Q or Esc exits build mode. Blue rocks mark iron deposits.':b?'R rotates directional buildings. U upgrades the selected building. F dismantles. Use the Defense category for repairs.':'Choose a building from the hotbar to expand your colony.';
 if(!tool&&type==='belt')$('intel-stats').insertAdjacentHTML('beforeend',row('Cargo',`${conveyorCount(b)} / ${BELT_CAPACITY}`));
}
function blueprintStats(type,row){
 if(!TYPES[type].hp)return '';
 const b={type},radius=buildingRadius(b),generator=GENERATORS[type],recipe=RECIPES[type];
 let stats=row('Health',maxHp(b))+row('Power used',buildingPower(b));
 if(radius)stats+=row(type==='sawmill'?'Work radius':'Range',`${radius} tiles`);
 if(TURRETS.includes(type)){
  const turret=turretStats(b);
  stats+=row('Damage / shot',Number(turret.damage.toFixed(1)))+row('Fire interval',`${turret.interval.toFixed(2)} s`)+
   (usesAmmo(type)?row('Shots / gear',turretReload(b,roundBonus(state.wave))):row('Ammo','Unlimited'));
  if(turret.radius)stats+=row('Splash radius',`${turret.radius} tiles`);
 }
 if(generator)stats+=row('Power supplied',`${powerOutput(b)} / s`)+row('Fuel',`1 ${ITEM_NAMES[generator.fuel]} / ${generator.seconds} s`);
 if(recipe)stats+=row('Base craft time',`${recipe.seconds} s`);
 if(type==='storage')stats+=row('Local capacity',`${warehouseCapacity(b)} / material`);
 if(type==='belt')stats+=row('Cargo capacity',BELT_CAPACITY)+row('Travel time / tile',`${(beltTravelTicks(b)*STEP).toFixed(2)} s`);
 return stats;
}
function upgradeImpact(b){
 const next={...b,level:(b.level||1)+1};
 if(b.type==='smelter')return `Iron plates per ore ${plateYield(b)} → ${plateYield(next)}`;
 if(b.type==='belt'&&beltTravelTicks(b)!==beltTravelTicks(next))return `Belt travel time ${(beltTravelTicks(b)*STEP).toFixed(2)}s → ${(beltTravelTicks(next)*STEP).toFixed(2)}s per tile`;
 if(TURRETS.includes(b.type))return `Damage ${Math.round(turretStats(b).damage)} → ${Math.round(turretStats(next).damage)} per shot`;
 if(GENERATORS[b.type]||b.type==='hq')return `Power ${Math.round(powerOutput(b))} → ${Math.round(powerOutput(next))} per second`;
 if(b.type==='storage')return `Capacity ${warehouseCapacity(b)} → ${warehouseCapacity(next)} per material`;
 if(hasOutputBuffer(b.type)||b.type==='sawmill'||b.type==='inserter')return `Speed ${productionSpeed(b).toFixed(1)}× → ${productionSpeed(next).toFixed(1)}×`;
 return `Health ${maxHp(b)} → ${maxHp(next)}`;
}
function updateSwarmWarning(incoming,time){
 const forecast=waveForecast(state),side=incoming?state.waveSide:forecast.side;
 const direction=SWARM_DIRECTIONS[side],warning=$('swarm-warning');
 const upcoming=canSpawnSwarm(state)&&!incoming;
 warning.hidden=!started||state.status!=='playing'||state.tutorialStep!==undefined||!(incoming||upcoming);
 warning.dataset.side=direction?.toLowerCase()||'';
 warning.classList.toggle('urgent',incoming||time<=20);
 const label=incoming?(direction?'Swarm attacking from '+direction:'Swarm attacking'):'Next swarm from '+direction;
 if(!warning.hidden&&$('swarm-warning-text').textContent!==label)$('swarm-warning-text').textContent=label;
 const hunters=state.enemies.filter(e=>e.coreHunter).length,mutation=state.enemies.find(e=>e.mutation)?.mutation;
 $('wave-direction').textContent=incoming?[state.enemies.length+' hostiles remaining',hunters?hunters+' Beacon hunters':'',mutation?mutation[0].toUpperCase()+mutation.slice(1)+' mutation':''].filter(Boolean).join(' · '):upcoming?forecast.count+' hostiles expected':'';
}
function updateRoundBonuses(){
 const active=roundBonus(state.wave),next=waveForecast(state).bonus;
 const activeText=active?`Active · ${active.label}`:'Active · No bonus yet';
 const nextText=canSpawnSwarm(state)?'Next · '+next.label:'';
 $('round-bonuses').hidden=!started||state.status!=='playing'||state.tutorialStep!==undefined;
 const activeLine=$('round-bonus-active'),nextLine=$('round-bonus-next');
 if(activeLine.textContent!==activeText)activeLine.textContent=activeText;
 if(nextLine.textContent!==nextText)nextLine.textContent=nextText;
 nextLine.hidden=!nextText;
}
function powerBadge(){
 const rate=state.power.total-state.power.used;
 return '<span class="stock-rate '+(rate<0?'negative':'')+'">Reserve '+Math.floor(state.resources.power)+'/'+POWER_CAPACITY+'</span>';
}
function stockBadge(value){
 const rate=Math.round(value*10)/10;
 return '<span class="stock-rate '+(rate>0?'positive':rate<0?'negative':'')+'" title="Net deliveries minus operating consumption per minute">'+(rate>0?'+':'')+rate+'/m</span>';
}
function updateUi(){
 const flow=stockFlow(state);
 if(started&&state.status==='playing'&&ended){ended=false;$('end-dialog').close();}
 $('resources').innerHTML=[...RESOURCE_KEYS,'power'].map(r=>`<div title="${r==='power'?state.power.total+' generated/s · '+state.power.used+' needed/s · '+Math.floor(state.resources.power)+' stored':`${Math.floor(state.resources[r])} / ${storageCapacity(state)} stored`} " class="resource ${r==='power'?'power':''} ${r==='power'&&state.power.used>state.power.total?'low':''}">${icon(r,23)}<strong>${r==='power'?`${state.power.total}<span class="resource-limit">/${state.power.used}</span>`:`${Math.floor(state.resources[r])}<span class="resource-limit">/${storageCapacity(state)}</span>`}</strong><small>${r==='power'?'POWER · GEN / LOAD':RESOURCE_NAMES[r]}</small>${r==='power'?powerBadge():stockBadge(flow[r])}</div>`).join('');
 const incoming=state.enemies.some(e=>!e.training),time=Math.max(0,state.nextWave-state.time);$('wave-label').textContent=state.paused?'GAME PAUSED':incoming?'PERIMETER CONTACT':'PREPARE YOUR COLONY';$('wave-title').textContent=incoming?'Swarm attacking':'Next swarm';$('countdown').textContent=incoming?String(state.enemies.length):`${String(Math.floor(time/60)).padStart(2,'0')}:${String(Math.floor(time%60)).padStart(2,'0')}`;
 $('wave-fill').style.width=incoming?'100%':Math.min(100,(1-time/(state.wave===0?100:95))*100)+'%';$('wave-fill').style.background=incoming?'var(--red)':'var(--gold)';$('wave-detail').textContent=isPostVictory(state)?`SWARM ${state.wave+(incoming?0:1)} · ENDLESS`:`SWARM ${Math.min(FINAL_WAVE,state.wave+(incoming?0:1))} OF ${FINAL_WAVE}`;$('early-wave').disabled=incoming||!canSpawnSwarm(state)||mode==='client'||!started;$('day').textContent='DAY '+String(1+Math.floor(state.time/180)).padStart(2,'0');$('wave-panel').classList.toggle('imminent',started&&!incoming&&time<=20&&canSpawnSwarm(state));
 const turrets=state.buildings.filter(b=>usesAmmo(b.type)),dry=turrets.filter(b=>b.ammo===0).length,low=turrets.filter(b=>b.ammo<=3).length,warning=dry>0||state.resources.gear<=2&&turrets.length>0||low>0&&state.resources.gear===0;
 $('ammo-alert').hidden=!warning;$('ammo-alert').textContent=dry?`AMMO EMPTY · ${dry} turret${dry===1?'':'s'} need gears`:`LOW AMMO RESERVE · ${Math.floor(state.resources.gear)} gears`;
 $('ammo-alert').classList.toggle('empty',dry>0);$('wood-alert').hidden=!started||state.resources.wood>0||!state.buildings.some(b=>b.type==='generator');updateSwarmWarning(incoming,time);updateRoundBonuses();updateTutorial();
 const checkpoints=readCheckpoints(),cp=checkpoints[0],choice=$('checkpoint-choice'),signature=checkpoints.map(c=>c.label+':'+c.time).join(';');if(choice.dataset.history!==signature){choice.dataset.history=signature;choice.innerHTML=checkpoints.length?checkpoints.map((c,i)=>`<option value="${i}">${escape(c.label)} · ${Math.floor(c.time/60)}m ${Math.floor(c.time%60)}s</option>`).join(''):'<option value="0">No checkpoint yet</option>';}$('retry-checkpoint').disabled=mode==='client'||!cp;$('end-retry').disabled=mode==='client'||!cp;$('retry-checkpoint').textContent=cp?'Retry selected checkpoint':'No checkpoint yet';if($('production-dialog').open)renderProduction();
 const goals=[{text:'An industry that works',sub:state.produced.plate+' / 10 iron plates delivered',done:state.produced.plate>=10},{text:'Machines of resistance',sub:state.produced.gear+' / 5 gears delivered',done:state.produced.gear>=5},{text:'Survive the swarms',sub:Math.min(FINAL_WAVE,state.wave)+' / '+FINAL_WAVE+' swarms · '+state.totalKills+' hostiles stopped',done:isPostVictory(state)}];
 $('objectives').innerHTML=goals.map(g=>`<div class="objective ${g.done?'done':''}"><span class="check">${g.done?'✓':''}</span><div>${g.text}<small>${g.sub}</small></div></div>`).join('');
 $('team').innerHTML=state.players.length?`<div class="team-title">ENGINEERS · ${state.players.length}/4</div>`+state.players.map(p=>`<div class="teammate"><span class="avatar">${String(p.color+1).padStart(2,'0')}</span><span>${escape(p.name)}</span><span class="role">${p.id===state.players[0]?.id?'HOST':p.id===playerId?'YOU':'GUEST'}</span></div>`).join(''):'';
 $('pause').textContent=state.paused?'▶':'Ⅱ';$('speed').textContent=state.speed+'×';$('save').disabled=mode==='client';$('export-save').disabled=mode==='client';$('menu-save').disabled=mode==='client';$('restart').disabled=mode==='client';$('open-lan').disabled=mode==='client';$('leave-lan').hidden=mode==='solo';$('leave-lan').textContent=mode==='host'?'Close LAN (keep the world)':'Leave LAN world';$('end-restart').disabled=mode==='client';$('end-restart').textContent=mode==='client'?'Waiting for host':'Start a new expedition ↗';$('pause').disabled=mode==='client';$('speed').disabled=mode==='client';updateConnection();updateToolbar();updateInspector();drawMinimap();
 if(state.wave>lastWave){lastWave=state.wave;toast(`Swarm ${state.wave} · ${state.enemies.length} hostiles · Bonus activated: ${roundBonus(state.wave).label}`);tone(160,.6,.035,'sawtooth');}
 if(started&&state.status!=='playing'&&!ended){ended=true;const won=state.status==='victory';$('end-title').textContent=won?'Ironhaven endures.':'The colony has fallen.';$('end-label').textContent=won?'25 SWARMS SURVIVED':'EXPEDITION ENDED';$('end-summary').textContent=`You held out for ${Math.floor(state.time/60)} minutes and stopped ${state.totalKills} hostiles. Your industry delivered ${state.produced.plate} iron plates and ${state.produced.gear} gears.`;$('end-continue').hidden=!won;$('end-continue').disabled=mode==='client';$('end-dialog').showModal();saveGame(true);}
}
const mini=$('minimap'),ctx=mini.getContext('2d');
function drawMinimap(){const w=mini.width,h=mini.height,sx=w/SIZE,sz=h/SIZE;ctx.fillStyle='#11262a';ctx.fillRect(0,0,w,h);const core=state.buildings.find(b=>b.type==='hq');if(core){const a=Math.PI/2-lighthouseHeading(core);ctx.fillStyle='#eeb96e30';ctx.beginPath();ctx.moveTo((core.x+SIZE/2)*sx,(core.z+SIZE/2)*sz);ctx.ellipse((core.x+SIZE/2)*sx,(core.z+SIZE/2)*sz,LIGHTHOUSE_REACH*sx,LIGHTHOUSE_REACH*sz,0,a-LIGHTHOUSE_CONE,a+LIGHTHOUSE_CONE);ctx.closePath();ctx.fill();}ctx.fillStyle='#31554b';for(const t of state.terrain.trees)ctx.fillRect((t.x+SIZE/2)*sx,(t.z+SIZE/2)*sz,2,2);ctx.fillStyle='#d49264';for(const t of state.terrain.copper||[])ctx.fillRect((t.x+SIZE/2)*sx,(t.z+SIZE/2)*sz,2,2);ctx.fillStyle='#789d9e';for(const t of state.terrain.ore)ctx.fillRect((t.x+SIZE/2)*sx,(t.z+SIZE/2)*sz,2,2);for(const b of state.buildings){ctx.fillStyle=b.type==='wall'?'#657e71':b.type==='hq'?'#eeb96e':'#abd3ae';ctx.fillRect((b.x+SIZE/2)*sx,(b.z+SIZE/2)*sz,b.type==='hq'?5:2,b.type==='hq'?5:2);}ctx.fillStyle='#f5816d';for(const e of state.enemies)ctx.fillRect(Math.max(0,Math.min(w-2,(e.x+SIZE/2)*sx)),Math.max(0,Math.min(h-2,(e.z+SIZE/2)*sz)),2,2);ctx.fillStyle='#6e8993';for(const t of state.terrain.coal||[])ctx.fillRect((t.x+SIZE/2)*sx,(t.z+SIZE/2)*sz,2,2);ctx.strokeStyle='#afc8b750';const cw=view.zoom*1.4,ch=view.zoom;ctx.strokeRect((view.center.x+SIZE/2-cw/2)*sx,(view.center.z+SIZE/2-ch/2)*sz,cw*sx,ch*sz);}
mini.onclick=e=>{const rect=mini.getBoundingClientRect();view.center.set((e.clientX-rect.left)/rect.width*SIZE-SIZE/2,0,(e.clientY-rect.top)/rect.height*SIZE-SIZE/2);};
function dragEndpoint(origin,cell){
 const [dx,dz]=DIRS[dir],distance=Math.max(0,(cell.x-origin.x)*dx+(cell.z-origin.z)*dz);
 return {x:origin.x+dx*distance,z:origin.z+dz*distance};
}
function refreshRoute(){
 if(!rowGesture||!hover)return;
 const drag=rowGesture.points,start=drag?.at(-1)??(rowGesture.moved?rowGesture.down:rowGesture.anchor||rowGesture.down);
 const end=drag?dragEndpoint(start,hover):hover;
 const signature=[tool,start.x,start.z,end.x,end.z,dir,state.buildings.length].join(':');
 if(signature!==lastRouteKey){
  lastRouteKey=signature;
  const single=(!drag||drag.length===1)&&start.x===end.x&&start.z===end.z;
  routePlan=single?null:drag?planBeltDrag(state,[...drag,end],dir):planRoute(state,tool,start,end,dir);
 }
 if(!routePlan){view.previewRoute([]);return false;}
 const grid=new Map(state.buildings.map(b=>[key(b.x,b.z),b])),fresh=routePlan.cells.filter(c=>!grid.has(key(c.x,c.z))).length,packed=Math.min(fresh,inventoryCount(state,playerId,tool)),craft=fresh-packed;
 const missing=Object.entries(TYPES[tool].cost).some(([r,n])=>state.resources[r]<n*craft),error=routePlan.error||(missing?'Not enough materials for the entire route':null);
 view.previewRoute(routePlan.cells,!error,tool==='belt');$('tool-hint').classList.toggle('invalid',!!error);$('tool-hint').textContent=error||`${routePlan.cells.length} tiles · ${packed} from inventory · ${Object.entries(TYPES[tool].cost).map(([r,n])=>`${n*craft} ${RESOURCE_NAMES[r].toLowerCase()}`).join(' + ')} · Release to build · ${drag?'R turns · ':''}Q / Esc cancels`;
 view.cursor.visible=false;if(view.ghost)view.ghost.visible=false;
 return true;
}
function clearRoute(){rowGesture=null;routePlan=null;lastRouteKey='';view.previewRoute([]);}
function commitRoute(){
 const gesture=rowGesture;
 clearRoute();
 if(!hover){updateHover();return;}
 const points=gesture.points,start=points?.at(-1)??(gesture.moved?gesture.down:gesture.anchor||gesture.down);
 const end=points?dragEndpoint(start,hover):hover;
 if((!points||points.length===1)&&start.x===end.x&&start.z===end.z){
  if(!gesture.moved)buildAt(gesture.down);
 }else if(execute({type:'buildRow',building:tool,start,end,dir,...(points?{points:[...points,end]}:{})})!==false){
  rowAnchor={...end,type:tool};tone(700,.06,.02,'triangle');
 }
 updateHover();
}
function buildAt(cell){
 if(!cell||!tool||!started)return;const b=state.buildings.find(b=>b.x===cell.x&&b.z===cell.z);
 if(['belt','wall'].includes(tool)&&b?.type===tool){rowAnchor={...cell,type:tool};toast('Anchor set. Drag from here or Shift-click an endpoint.');return;}
 const cmd=tool==='demolish'||tool==='repair'?{type:tool,x:cell.x,z:cell.z}:{type:'build',building:tool,x:cell.x,z:cell.z,dir};
 if(execute(cmd)!==false){rowAnchor={...cell,type:tool};tone(tool==='demolish'?190:700,.035,.015,'triangle');}updateHover();
}
$('world').addEventListener('pointermove',e=>{
 pointer={x:e.clientX,y:e.clientY};hover=view.point(e.clientX,e.clientY);
 if(selectionGesture){if(Math.hypot(e.clientX-selectionGesture.screen.x,e.clientY-selectionGesture.screen.y)>5){selectionGesture.moved=true;const box=$('selection-box');box.hidden=false;box.style.left=Math.min(e.clientX,selectionGesture.screen.x)+'px';box.style.top=Math.min(e.clientY,selectionGesture.screen.y)+'px';box.style.width=Math.abs(e.clientX-selectionGesture.screen.x)+'px';box.style.height=Math.abs(e.clientY-selectionGesture.screen.y)+'px';}return;}
 if(rowGesture&&(Math.hypot(e.clientX-rowGesture.screen.x,e.clientY-rowGesture.screen.y)>4||hover&&(hover.x!==rowGesture.down.x||hover.z!==rowGesture.down.z)))rowGesture.moved=true;
 updateHover();
});
$('world').addEventListener('pointerdown',e=>{
 if(e.button===2){if(selectionGesture?.trees){selectionGesture=null;$('selection-box').hidden=true;}setTool(null);return;}if(e.button!==0||!started)return;
 pointer={x:e.clientX,y:e.clientY};hover=view.point(e.clientX,e.clientY);if(!hover)return;
 if(aimingLight){if(execute({type:'aimLighthouse',...hover})!==false){setTool(null);toast('Lighthouse turning to the new bearing.');}return;}
 if(pasting){placePaste();return;}
 if(movingArea){placeArea(e.shiftKey);return;}
 if(tool==='demolish'&&e.shiftKey){
  selectionGesture={trees:true,down:{...hover},screen:{x:e.clientX,y:e.clientY},moved:false};return;
 }
 if(tool){
  if(tool==='belt'||tool==='wall'){
   rowGesture={down:{...hover},anchor:e.shiftKey&&rowAnchor?.type===tool?{x:rowAnchor.x,z:rowAnchor.z}:null,screen:{x:e.clientX,y:e.clientY},moved:false,points:e.shiftKey||tool==='wall'?null:[{...hover}]};
   lastRouteKey='';updateHover();
  }
  else buildAt(hover);
 }else{selectionGesture={down:{...hover},screen:{x:e.clientX,y:e.clientY},moved:false};const b=state.buildings.find(b=>b.x===hover.x&&b.z===hover.z);selected=b?.id||null;areaIds=b?[b.id]:[];view.select(b);if(b)$('intel').hidden=false;updateAreaTools();updateInspector();}
});
window.addEventListener('pointerup',e=>{
 if(selectionGesture&&e.button===0){
  const g=selectionGesture;selectionGesture=null;$('selection-box').hidden=true;
  const end=view.point(e.clientX,e.clientY)||hover||g.down;
  if(g.trees){execute({type:'clearTrees',start:g.down,end});updateUi();return;}
  if(g.moved){
   areaIds=state.buildings.filter(b=>b.x>=Math.min(g.down.x,end.x)&&b.x<=Math.max(g.down.x,end.x)&&b.z>=Math.min(g.down.z,end.z)&&b.z<=Math.max(g.down.z,end.z)).map(b=>b.id);
   selected=areaIds.length===1?areaIds[0]:null;view.select(state.buildings.find(b=>b.id===selected));updateAreaTools();
  }
  return;
 }
 if(rowGesture&&e.button===0){hover=view.point(e.clientX,e.clientY)||hover;commitRoute();}
});
window.addEventListener('pointercancel',()=>{if(selectionGesture){selectionGesture=null;$('selection-box').hidden=true;}if(rowGesture){clearRoute();updateHover();}});
$('world').addEventListener('contextmenu',e=>e.preventDefault());
$('world').addEventListener('pointerleave',()=>{if(!rowGesture&&!selectionGesture&&!movingArea){pointer=null;hover=null;updateHover();}});
function rotateExisting(){
 const b=hover&&state.buildings.find(b=>b.x===hover.x&&b.z===hover.z&&b.type==='belt')||state.buildings.find(b=>b.id===selected);
 if(!b||!DIRECTIONAL.includes(b.type))return false;
 execute({type:'rotate',x:b.x,z:b.z});lastRouteKey='';tone(550,.04);updateInspector();return true;
}
$('rotate-building').onclick=()=>{const b=state.buildings.find(b=>b.id===selected);if(b)execute({type:'rotate',x:b.x,z:b.z});};
$('upgrade-turret').onclick=()=>{const b=state.buildings.find(b=>b.id===selected);if(b&&execute({type:'upgrade',x:b.x,z:b.z})!==false){tone(880,.16);updateUi();}};
$('world').addEventListener('wheel',e=>{e.preventDefault();view.setZoom(e.deltaY*.015);},{passive:false});
window.addEventListener('keydown',e=>{
 if(e.altKey||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.target.isContentEditable)return;
 if(e.ctrlKey||e.metaKey){
  if(!started||e.repeat||document.querySelector('dialog[open]'))return;
  const shortcut=e.key.toLowerCase();
  if(shortcut==='c'&&areaIds.length){e.preventDefault();copyArea();}
  if(shortcut==='v'&&copiedSetup.length){e.preventDefault();beginPaste();}
  return;
 }
 if(e.key==='Escape'||e.key.toLowerCase()==='q'){setTool(null);clearArea();keys.clear();return;}
 if(document.querySelector('dialog[open]'))return;
 if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(!started||e.repeat)return;
 if(e.key.toLowerCase()==='l'){beginLightAim();return;}
 if(pasting&&e.key.toLowerCase()==='r')return;
 const category=Object.keys(CATEGORIES).find(name=>CATEGORIES[name].key===e.key.toLowerCase());if(category)setCategory(category);
 const item=CATEGORIES[tab].tools[SHORTCUT.indexOf(e.key)];if(item)setTool(tool===item?null:item);
 if(e.key.toLowerCase()==='f'){
  e.preventDefault();setCategory('defense');setTool(tool==='demolish'?null:'demolish');return;
 }
 if(e.key.toLowerCase()==='r'){
  if(tool){
   const points=rowGesture?.points;
   if(points&&hover){const start=points.at(-1),turn=dragEndpoint(start,hover);if(turn.x!==start.x||turn.z!==start.z)points.push(turn);}
   dir=(dir+(e.shiftKey?3:1))%4;view.setTool(tool,dir);lastRouteKey='';updateHover();
  }else rotateExisting();
 }
 if(e.key.toLowerCase()==='e'&&selected)openProgram();
 if(e.key.toLowerCase()==='b')$('toggle-diagnostics').click();if(e.key.toLowerCase()==='i')$('production-overview').click();
 if(e.key.toLowerCase()==='m'&&areaIds.length)beginMove();
 if(e.key.toLowerCase()==='u'){if(areaIds.length>1)upgradeSelection();else if(selected)$('upgrade-turret').click();}
 if(e.key===' '||e.key.toLowerCase()==='p')execute({type:'pause'});if(e.key==='?')$('help-dialog').showModal();
});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();if(rowGesture){clearRoute();updateHover();}});
$('start-solo').onclick=()=>startGame();$('resume').onclick=()=>startGame(true);$('start-lan').onclick=()=>showLan();$('open-lan').onclick=()=>showLan();$('help').onclick=()=>$('help-dialog').showModal();$('menu').onclick=()=>$('menu-dialog').showModal();$('brand').onclick=e=>{e.preventDefault();if(started)$('menu-dialog').showModal();};$('continue').onclick=()=>$('menu-dialog').close();$('pause').onclick=()=>execute({type:'pause'});$('speed').onclick=()=>execute({type:'speed'});$('save').onclick=()=>saveGame();$('menu-save').onclick=()=>saveGame();$('early-wave').onclick=()=>execute({type:'wave'});$('zoom-in').onclick=()=>view.setZoom(-2);$('zoom-out').onclick=()=>view.setZoom(2);$('restart').onclick=()=>{$('menu-dialog').close();restart();};$('end-restart').onclick=restart;
function setGraphics(light){
 lowQuality=light;view.setQuality(light);document.body.classList.toggle('light-graphics',light);
 $('quality').textContent='Graphics: '+(light?'light':'standard');
}
$('quality').onclick=()=>{setGraphics(!lowQuality);writeStorage('ironhaven.lightGraphics',String(lowQuality));};
for(const id of ['send-output','receive-output'])$(id).onchange=()=>{
 const b=state.buildings.find(b=>b.id===selected);
 if(b)execute({type:'configureOutput',id:b.id,x:b.x,z:b.z,send:$('send-output').checked,receive:$('receive-output').checked});
};
$('warehouse-export').onchange=()=>{
 const b=state.buildings.find(b=>b.id===selected);
 if(b?.type==='storage')execute({type:'configureWarehouse',id:b.id,x:b.x,z:b.z,item:$('warehouse-export').value||null});
 updateInspector();
};
for(const item of RESOURCE_KEYS){
 const option=document.createElement('option');option.value=item;option.textContent=RESOURCE_NAMES[item];
 $('warehouse-export').append(option);
}
function updateSound(){$('sound').innerHTML=icon(muted?'mute':'sound',19);$('sound').setAttribute('aria-label',muted?'Enable sound':'Mute sound');}
$('sound').onclick=()=>{muted=!muted;updateSound();tone(660,.09);};updateSound();
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>b.closest('dialog').close();
function buildingLabels(){
 const root=$('building-labels'),wanted=new Set(),grid=showDiagnostics?new Map(state.buildings.map(b=>[key(b.x,b.z),b])):null;
 for(const b of state.buildings){
  const damaged=b.hp<maxHp(b),ammoLow=usesAmmo(b.type)&&(b.ammo<=3||state.resources.gear<=1&&b.ammo<=6);
  const status=showDiagnostics&&(RECIPES[b.type]||['inserter','splitter','drill','copperDrill','sawmill','generator','turret'].includes(b.type))?factoryStatus(state,b,grid):null;
  if(!damaged&&!ammoLow&&!status)continue;
  const pos=view.project(b.x,b.z,b.type==='hq'?2.8:1.65);if(!pos.visible)continue;
  const id='building-'+b.id;wanted.add(id);let el=$(id);if(!el){el=document.createElement('div');el.className='building-label';el.id=id;root.append(el);}
  el.style.left=pos.x+'px';el.style.top=pos.y+'px';
  const content=(damaged?`<span class="world-health ${b.hp/maxHp(b)<.3?'critical':''}" title="${Math.ceil(b.hp)} / ${maxHp(b)} HP"><i style="width:${Math.max(0,b.hp/maxHp(b)*100)}%"></i></span>`:'')+(ammoLow?`<span class="world-ammo ${b.ammo===0?'empty':''}">${b.ammo===0?'NO AMMO':'LOW AMMO · '+b.ammo}</span>`:'')+(status?`<span class="world-machine-status ${status}">${STATUS_LABELS[status]}</span>`:'');
  if(el.innerHTML!==content)el.innerHTML=content;
 }
 for(const el of [...root.children])if(!wanted.has(el.id))el.remove();
}
function updateAreaTools(){
 $('area-tools').hidden=!areaIds.length&&!copiedSetup.length;
 $('area-count').textContent=areaIds.length?areaIds.length+' selected':copiedSetup.length+' copied';
 $('move-selection').hidden=$('clear-selection').hidden=$('copy-selection').hidden=!areaIds.length;
 $('paste-selection').hidden=!copiedSetup.length;
 updateGroupUpgrade();
 view.markArea(areaIds,state);
}
function updateGroupUpgrade(){
 const button=$('upgrade-selection');button.hidden=areaIds.length<2;
 if(button.hidden){$('area-price').hidden=true;return;}
 const plan=planGroupUpgrade(state,areaIds);
 button.hidden=!plan.targets;
 button.disabled=!!plan.error;
 button.textContent=plan.targets?.length?`Upgrade ${plan.targets.length} (U)`:'Fully upgraded';
 button.title=[plan.error,...materialCosts(plan.cost)].filter(Boolean).join(' · ');
 $('area-price').textContent=button.hidden?'':materialCosts(plan.cost).join(' · ');
 $('area-price').hidden=button.hidden;
}
function upgradeSelection(){
 if(areaIds.length<2)return;
 if(execute({type:'upgradeSelection',ids:areaIds})!==false){updateUi();updateGroupUpgrade();}
}
function clearArea(){areaIds=[];movingArea=false;pasting=false;selectionGesture=null;pendingMove=null;$('selection-box').hidden=true;updateAreaTools();view.previewRoute([]);$('tool-hint').hidden=!tool;}
function beginMove(){if(!areaIds.length)return;tool=null;view.setTool(null);movingArea=true;pasting=false;$('tool-hint').hidden=false;previewMove();}
function copyArea(){
 const layout=copySetup(state,areaIds);
 if(!layout.length){toast('Select a building to copy. The core is unique.',true);return;}
 copiedSetup=layout;updateAreaTools();toast(layout.length+' buildings copied · Ctrl+V to place');
}
function beginPaste(){
 if(!copiedSetup.length)return;
 setTool(null);clearArea();pasting=true;$('tool-hint').hidden=false;previewPaste();
}
function previewPaste(){
 const plan=hover?planPaste(state,copiedSetup,hover,playerId):{cells:[],error:null};
 view.previewRoute(plan.cells,!plan.error,true);
 const prices=materialCosts(plan.cost);
 const hint=$('tool-hint');hint.classList.toggle('invalid',!!plan.error);
 hint.textContent=plan.error||`${copiedSetup.length} buildings · ${prices.length?prices.join(' · ')+' · ':''}Click to paste · Esc cancels`;
}
function materialCosts(cost){return Object.entries(cost||{}).filter(([,count])=>count>0).map(([resource,count])=>`${count} ${RESOURCE_NAMES[resource]}`);}
function placePaste(){
 const plan=planPaste(state,copiedSetup,hover,playerId);
 if(plan.error){toast(plan.error,true);return;}
 if(execute({type:'pasteSetup',layout:copiedSetup,anchor:hover})!==false){clearArea();updateUi();if(mode!=='client')toast('Setup placed.');}
}
function movePlan(){if(!hover)return null;const bs=state.buildings.filter(b=>areaIds.includes(b.id));if(!bs.length){clearArea();return null;}const ax=Math.round((Math.min(...bs.map(b=>b.x))+Math.max(...bs.map(b=>b.x)))/2),az=Math.round((Math.min(...bs.map(b=>b.z))+Math.max(...bs.map(b=>b.z)))/2);return{...planMove(state,areaIds,hover.x-ax,hover.z-az),dx:hover.x-ax,dz:hover.z-az};}
function previewMove(){const plan=movePlan();if(!plan)return;view.previewRoute([...plan.valid,...plan.invalid],!plan.error&&!plan.invalid.length);$('tool-hint').classList.toggle('invalid',!!plan.error||plan.invalid.length>0);$('tool-hint').textContent=plan.error||`${plan.valid.length} valid · ${plan.invalid.length} blocked · Click to move · Shift-click packs invalid buildings · Q / Esc cancels`;}
function placeArea(override){const plan=movePlan();if(!plan)return;if(plan.error){toast(plan.error,true);return;}const cmd={type:'moveArea',ids:[...areaIds],dx:plan.dx,dz:plan.dz,override};if(plan.invalid.length&&override&&!readStorage('ironhaven.skipMoveConfirm')){pendingMove=cmd;$('move-confirm-summary').textContent=`Move ${plan.valid.length} buildings and pack ${plan.invalid.length} invalid buildings into inventory?`;$('move-invalid-list').innerHTML=plan.invalid.slice(0,20).map(b=>`<li>${escape(TYPES[b.type].name)}: ${escape(b.reason)}</li>`).join('');$('move-dont-ask').checked=false;$('move-confirm').showModal();return;}if(execute(cmd)!==false){clearArea();toast('Area relocated.');}}
$('move-selection').onclick=beginMove;$('clear-selection').onclick=clearArea;
$('copy-selection').onclick=copyArea;$('paste-selection').onclick=beginPaste;
$('upgrade-selection').onclick=upgradeSelection;
$('confirm-move').onclick=()=>{if(!pendingMove)return;if($('move-dont-ask').checked)writeStorage('ironhaven.skipMoveConfirm','true');const cmd=pendingMove;$('move-confirm').close();if(execute(cmd)!==false){clearArea();toast('Area relocated. Invalid buildings are in your inventory.');}};
$('reset-move-confirm').onclick=()=>{writeStorage('ironhaven.skipMoveConfirm','');toast('Move confirmations restored.');};
$('export-save').onclick=()=>{if(mode==='client')return;saveGame(true);const text=readStorage(SAVE);if(!text)return;const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Ironhaven-'+CURRENT_VERSION+'-world.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('World backup exported.');};
$('import-save').onclick=()=>$('save-file').click();
$('save-file').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(lan.peers.size)throw Error('Close LAN before importing a world.');const data=parseSave(await file.text());writeStorage(SAVE,JSON.stringify(data));$('menu-dialog').close();startGame(true);toast('World backup imported.');}catch(error){toast(error.message,true);}finally{e.target.value='';}};
const enemyCanvas=$('enemy-health'),enemyCtx=enemyCanvas.getContext('2d');
function enemyHealth(){
 enemyCanvas.hidden=!state.enemies.length;if(enemyCanvas.hidden)return;
 if(enemyCanvas.width!==innerWidth||enemyCanvas.height!==innerHeight){enemyCanvas.width=innerWidth;enemyCanvas.height=innerHeight;}
 enemyCtx.clearRect(0,0,innerWidth,innerHeight);
 for(const e of state.enemies){const {x,z}=motion.position(e,renderPoint),p=view.project(x,z,hostileKind(e)==='walker'?2.25:hostileKind(e)==='drowned'?1.03:.8);if(!p.visible)continue;const exposed=(hostileKind(e)==='guard'&&e.lightExposure>=.65)||(hostileKind(e)==='walker'&&e.lightExposure>=1);
 if(exposed){enemyCtx.font='11px Arial';enemyCtx.textAlign='center';enemyCtx.fillStyle='#f0d9a8';enemyCtx.fillText('ARMOR EXPOSED',p.x,p.y-23);}
 if(hostileKind(e)==='walker'){enemyCtx.font='bold 11px Arial';enemyCtx.textAlign='center';enemyCtx.fillStyle='#d8c4a3';enemyCtx.fillText('ABYSS WALKER',p.x,p.y-10);}
 if(e.training){enemyCtx.font='11px Arial';enemyCtx.textAlign='center';enemyCtx.fillStyle='#f0d9a8';enemyCtx.fillText('PRACTICE · '+HOSTILES[hostileKind(e)].name,p.x,p.y-10);}
 enemyCtx.fillStyle='#102125ee';enemyCtx.fillRect(p.x-13,p.y-3,26,5);enemyCtx.fillStyle=e.illuminated?'#edcd91':e.hp/e.maxHp<.3?'#ff6b59':'#d88976';enemyCtx.fillRect(p.x-12,p.y-2,24*Math.max(0,e.hp/e.maxHp),3);}
}
const ITEM_NAMES={ore:'Iron ore',copperOre:'Copper ore',...Object.fromEntries(Object.entries(RESOURCE_NAMES).map(([k,v])=>[k,v.toLowerCase()]))};
function drawMachineIO(){
 const panel=$('machine-io');
 const target=tool&&hover?{type:tool,...hover}:state.buildings.find(b=>b.id===selected);
 const recipe=target&&RECIPES[target.type],position=target&&hasOutputBuffer(target.type)?view.project(target.x,target.z,1.85):null;
 panel.hidden=!position?.visible;
 if(panel.hidden)return;
 if(panel.dataset.type!==target.type){
  const item=(name,quantity=1)=>`<span class="io-item" data-item="${name}">${icon(name,16)}${quantity>1?quantity+' × ':''}${escape(ITEM_NAMES[name])}</span>`;
  const row=(input,output)=>`<div class="io-line"><span class="io-input">${input}</span><span class="io-arrow" aria-hidden="true">→</span><span class="io-output">${output}</span></div>`;
  panel.innerHTML=target.type==='smelter'?row(item('ore'),item('plate'))+row(item('copperOre'),item('copper')):
   recipe?row(Object.entries(recipe.input).map(([name,count])=>item(name,count)).join(''),item(recipe.output)):
   row('Deposit',item(({copperDrill:'copperOre',coalMine:'coal'})[target.type]||'ore'));
  panel.dataset.type=target.type;
 }
 panel.style.transform=`translate(${Math.round(position.x)}px,${Math.round(position.y)}px) translate(-50%,-100%)`;
}
$('program-filter').innerHTML='<option value="auto">Auto · machine recipe ingredients</option><option value="any">Any item</option>'+ITEM_KEYS.map(k=>`<option value="${k}">${escape(ITEM_NAMES[k])}</option>`).join('');
function updateProgramPreview(){const values=PROGRAM_ROLES.map(role=>[role,Number($('quota-'+role).value)]);$('program-preview').textContent=values.filter(([k,v])=>v>0).map(([k,v])=>`${k.toUpperCase()} × ${v}`).join(' → ')+' → repeat';}
function openProgram(){const b=state.buildings.find(b=>b.id===selected);if(!b||!LOGISTICS_TYPES.includes(b.type))return;programTargetId=b.id;const p=programFor(b),ports=logisticsPorts(b),dirs=['EAST','SOUTH','WEST','NORTH'];$('program-title').textContent=TYPES[b.type].name+' · dispatch plan';$('program-ports').textContent=b.type==='inserter'?`Input conveyor: ${dirs[ports.input]}. Machine: ${dirs[ports.machine]}. Forward follows the source conveyor. Return: ${dirs[ports.return]}. Leave one tile for the relay between belt and machine.`:`Input: ${dirs[ports.input]}. Machine branch: ${dirs[ports.machine]}. Forward: ${dirs[ports.forward]}. Return line: ${dirs[ports.return]}. Place directly in the conveyor line.`;for(const role of PROGRAM_ROLES)$('quota-'+role).value=String(p[role]);$('program-filter').value=p.filter;$('program-buffer').value=String(p.buffer);$('program-wait').checked=!p.bypass;$('program-error').textContent='';updateProgramPreview();$('program-dialog').showModal();}
$('program-building').onclick=openProgram;
for(const role of PROGRAM_ROLES)$('quota-'+role).oninput=updateProgramPreview;
for(const btn of document.querySelectorAll('[data-program-preset]'))btn.onclick=()=>{const v=btn.dataset.programPreset.split(',').map(Number);PROGRAM_ROLES.forEach((role,i)=>$('quota-'+role).value=v[i]);updateProgramPreview();};
$('apply-program').onclick=()=>{const b=state.buildings.find(b=>b.id===programTargetId);if(!b){$('program-error').textContent='This unit was moved or removed. Select it again.';return;}const program={...Object.fromEntries(PROGRAM_ROLES.map(role=>[role,Number($('quota-'+role).value)])),filter:$('program-filter').value,buffer:Number($('program-buffer').value),bypass:!$('program-wait').checked};if(PROGRAM_ROLES.some(r=>!Number.isInteger(program[r])||program[r]<0||program[r]>100)||PROGRAM_ROLES.every(r=>program[r]===0)){$('program-error').textContent='Use whole numbers from 0 to 100, with at least one output enabled.';return;}if(execute({type:'configureLogistics',id:b.id,x:b.x,z:b.z,program})!==false){$('program-dialog').close();updateUi();toast('Dispatch plan updated.');}};
function updateTutorial(){
 const lesson=started&&TUTORIAL_STEPS[state.tutorialStep];
 const guide=$('tutorial-guide'),root=$('tutorial-markers');
 guide.hidden=!lesson;
 if(lesson){
  const number=`${state.tutorialStep+1} / ${TUTORIAL_STEPS.length}`;
  if($('tutorial-step').textContent!==number){
   $('tutorial-step').textContent=number;
   $('tutorial-title').textContent=lesson.title;
   $('tutorial-body').textContent=lesson.body;
  }
  const complete=state.tutorialStep===TUTORIAL_STEPS.length-1;
  $('tutorial-finish').hidden=mode==='client'||!complete;
  $('tutorial-skip').hidden=mode==='client'||complete;
  $('wave-title').textContent='Field training';
  $('wave-label').textContent='SWARM COUNTDOWN ON HOLD';
  $('wave-direction').textContent='';
  $('countdown').textContent='HOLD';
  $('wave-fill').style.width='0%';
  $('wave-panel').classList.remove('imminent');
  $('early-wave').disabled=true;
 }
 const targets=lesson?tutorialTargets(state,lesson):[];
 const signature=JSON.stringify(targets);
 if(root.dataset.targets!==signature){
  root.dataset.targets=signature;
  root.replaceChildren(...targets.map(target=>{
   const mark=document.createElement('div');mark.className='tutorial-marker';
   mark.dataset.x=target.x;mark.dataset.z=target.z;mark.textContent=target.label;
   return mark;
  }));
 }
}
function drawTutorialMarkers(){
 for(const mark of $('tutorial-markers').children){
  const p=view.project(Number(mark.dataset.x),Number(mark.dataset.z),.08);
  mark.hidden=!p.visible;
  mark.style.left=p.x+'px';mark.style.top=p.y+'px';
 }
}
function leaveTutorial(skip){
 if(execute({type:'finishTutorial',skip})!==true)return;
 updateUi();checkpoint('Training complete');saveGame(true);
}
$('tutorial-skip').onclick=()=>leaveTutorial(true);
$('tutorial-finish').onclick=()=>leaveTutorial(false);
function readCheckpoints(){if(checkpointCache)return checkpointCache;try{const v=JSON.parse(readStorage(CHECKPOINTS)||'[]');return checkpointCache=Array.isArray(v)?v:[];}catch{return checkpointCache=[];}}
function writeCheckpoint(data,label){if(mode==='client')return;const items=[{label,time:data.state.time,save:data},...readCheckpoints()].slice(0,3);checkpointCache=items;if(!writeStorage(CHECKPOINTS,JSON.stringify(items)))writeStorage(CHECKPOINTS,JSON.stringify(items.slice(0,1)));}
function checkpoint(label){if(started&&mode!=='client')writeCheckpoint(packWorldSave(state,playerId),label);}
function retryCheckpoint(index=0){
 if(mode==='client')return;const cp=readCheckpoints()[index];if(!cp){toast('No checkpoint available.',true);return;}
 try{const data=parseSave(JSON.stringify(cp.save));state=data.state;playerId=data.playerId;state.paused=false;state.status='playing';state.nextWave=Math.max(state.nextWave,state.time+20);state.players=state.players.filter(p=>p.id===playerId);
  for(const peer of lan.peers.values())if(peer.ready&&peer.playerId){const p=addPlayer(state,peer.name);peer.playerId=p.id;lan.send(peer,{type:'welcome',id:p.id,state,version:CURRENT_VERSION});}
  $('menu-dialog').close();$('end-dialog').close();clearArea();finishStart();saveGame(true);toast('Checkpoint restored. At least 20 seconds to prepare.');
 }catch(e){toast(e.message,true);}
}
$('retry-checkpoint').onclick=()=>retryCheckpoint(Number($('checkpoint-choice').value)||0);$('end-retry').onclick=()=>retryCheckpoint(0);
function renderProduction(){const report=productionReport(state);$('production-summary').innerHTML=Object.entries(report.counts).filter(([k])=>k!=='idle').map(([k,n])=>`<span class="diagnostic-count ${k}">${escape(STATUS_LABELS[k])}: ${n}</span>`).join('');$('production-rows').innerHTML=report.materials.map(r=>`<tr><td>${escape(RESOURCE_NAMES[r.resource])}</td><td>${Math.floor(r.stock)} / ${r.capacity}</td><td>${r.perMinute.toFixed(1)}</td><td>${r.demand.toFixed(1)}</td></tr>`).join('');}
$('production-overview').onclick=()=>{$('menu-dialog').close();renderProduction();$('production-dialog').showModal();};
$('toggle-diagnostics').onclick=()=>{showDiagnostics=!showDiagnostics;$('toggle-diagnostics').textContent=(showDiagnostics?'Hide':'Show')+' machine status overlay (B)';toast(showDiagnostics?'Machine diagnostics enabled.':'Machine diagnostics hidden.');};
// 20 authoritative ticks/second; clients only render received snapshots.
setInterval(()=>{
 if(!started||mode==='client')return;
 if(state.tutorialStep===undefined&&!state.paused&&state.status==='playing'&&state.enemies.length===0&&canSpawnSwarm(state)&&state.time+STEP*state.speed>=state.nextWave){const id=state.wave+':'+state.nextWave;if(lastAutoCheckpoint!==id){lastAutoCheckpoint=id;checkpoint('Before swarm '+(state.wave+1));}}
 for(let i=0;i<state.speed;i++)step(state,STEP);
 if(mode==='host'&&++syncTick%2===0){
  const revision=`${state.terrain.trees.length}:${state.terrain.rocks.length}`,withoutTerrain={...state};delete withoutTerrain.terrain;
  const raw=JSON.stringify({type:'state',state:withoutTerrain});
  for(const peer of lan.peers.values())if(peer.ready&&peer.playerId){if(peer.terrainRevision!==revision){lan.send(peer,{type:'state',state});peer.terrainRevision=revision;}else lan.send(peer,raw);}
 }
},50);
let prev=performance.now();function frame(now){const dt=Math.max(0,Math.min(.1,(now-prev)/1000));prev=now;
 motion.update(state,now);
 if(started){
  if(!document.querySelector('dialog[open]')){
   const x=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
   const z=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));
   if(x||z){
    const travel=dt*(keys.has('shift')?16:10),distance=travel/Math.hypot(x,z);
    view.pan(x*distance,z*distance);
    if(mode!=='client'&&state.tutorialStep===0&&!state.cameraTrained&&(cameraTravel+=travel)>=1.25)execute({type:'cameraTraining'});
   }
  }
  if(now-lastSave>30000){lastSave=now;saveGame(true);}view.sync(state,motion);if(areaIds.length&&now-lastUi>200)view.markArea(areaIds,state);
 }else{view.sync(state,null,now/1000);}
 view.draw();buildingLabels();drawTutorialMarkers();enemyHealth();if(pointer&&started){const cell=view.point(pointer.x,pointer.y);if(cell&&(cell.x!==hover?.x||cell.z!==hover?.z)){hover=cell;updateHover();}}drawMachineIO();if(now-lastUi>200){lastUi=now;updateUi();updateGroupUpgrade();updateHover();}requestAnimationFrame(frame);
}
initHotbar();updateUi();view.sync(state);view.draw();$('loading').hidden=true;requestAnimationFrame(frame);
window.addEventListener('beforeunload',()=>{if(started&&mode!=='client')saveGame(true);});
