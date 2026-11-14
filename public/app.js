import { View } from './render.js';
import { createGame,addPlayer,removePlayer,command,step,STEP,TYPES,canBuild,FINAL_WAVE } from './shared/sim.js';
import { Lan } from './network.js';
import { icon,RESOURCE_NAMES } from './icons.js';
const $=id=>document.getElementById(id),SAVE='ironhaven.save.v1',NAME='ironhaven.name';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=createGame(),playerId=null,started=false,mode='solo',view,tool=null,dir=0,selected=null,tab='all',lastWave=0,lastEvent=0,ended=false,lowQuality=false,muted=true,audio=null,lastMove='0,0',hover=null,dragging=false,lastBuild='',lastUi=0,lastNet=0,lastSave=0,syncTick=0,pendingDisconnect=false;
const keys=new Set();
function toast(text,error=false){const e=document.createElement('div');e.className='toast'+(error?' error':'');e.textContent=text;$('toasts').append(e);setTimeout(()=>e.remove(),4000);}
function tone(freq=440,duration=.08,volume=.025,type='sine'){
 if(muted)return;try{audio||=new AudioContext();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}
}
try{view=new View($('world'));}catch(e){$('loading').innerHTML='<p>3D kunne ikke starte. Aktivér WebGL / hardwareacceleration i din browser, og genindlæs spillet.</p>';throw e;}
function readStorage(key){try{return localStorage.getItem(key);}catch{return null;}}
function writeStorage(key,value){try{localStorage.setItem(key,value);return true;}catch{return false;}}
$('player-name').value=readStorage(NAME)||'Ingeniør';
if(readStorage(SAVE))$('resume').hidden=false;
document.body.classList.add('at-start');
const TOOL_LIST=['belt','drill','smelter','assembler','sawmill','generator','turret','wall','repair','demolish'];
const SHORTCUT=['1','2','3','4','5','6','7','8','9','0'];
function costText(type){return Object.entries(TYPES[type].cost).map(([r,n])=>`${n}${r==='wood'?'T':r==='plate'?'J':'⚙'}`).join(' · ')||'GRATIS';}
function initHotbar(){
 $('hotbar').innerHTML=TOOL_LIST.map((t,i)=>`<button class="build-btn" data-type="${t}" title="${TYPES[t].name} (${SHORTCUT[i]})"><span class="key">${SHORTCUT[i]}</span>${icon(t)}<span class="build-name">${TYPES[t].name}</span><span class="build-cost">${costText(t)}</span></button>`).join('');
 $('hotbar').addEventListener('click',e=>{const b=e.target.closest('[data-type]');if(b&&started)setTool(tool===b.dataset.type?null:b.dataset.type);});
 document.querySelectorAll('[data-tab]').forEach(el=>el.onclick=()=>{tab=el.dataset.tab;updateToolbar();});
}
function updateToolbar(){
 document.querySelectorAll('[data-tab]').forEach(el=>el.classList.toggle('active',el.dataset.tab===tab));
 document.querySelectorAll('.build-btn').forEach(el=>{const t=el.dataset.type,production=['belt','drill','smelter','assembler','sawmill','generator'].includes(t);el.hidden=tab==='production'&&!production||tab==='defense'&&production;el.classList.toggle('active',tool===t);el.classList.toggle('unaffordable',Object.entries(TYPES[t].cost).some(([r,n])=>state.resources[r]<n));});
}
function setTool(t){tool=t;selected=null;view.select(null);view.setTool(t,dir);$('tool-hint').hidden=!t;updateToolbar();updateInspector();updateHover();if(t)tone(350,.04);}
function updateHover(){
 if(!hover||!tool){view.cursor.visible=false;if(view.ghost)view.ghost.visible=false;return;}
 let error;if(['repair','demolish'].includes(tool))error=null;else error=canBuild(state,tool,hover.x,hover.z);
 view.hover(hover,!error,tool);$('coords').textContent=`${hover.x}, ${hover.z}`;
 $('tool-hint').textContent=error||`${TYPES[tool].name} · ${['→ ØST','↓ SYD','← VEST','↑ NORD'][dir]} · Klik for at ${tool==='demolish'?'rydde':tool==='repair'?'reparere':'bygge'} · R drejer`;
 $('tool-hint').classList.toggle('invalid',!!error);
}
function execute(cmd){
 if(!started)return;
 if(mode==='client'){const host=lan.peers.get('host');if(!lan.send(host,{type:'command',command:cmd}))toast('Forbindelsen til værten er lukket.',true);return;}
 const error=command(state,playerId,cmd);if(error){toast(error,true);tone(130,.1,.02);return false;}return true;
}
function saveGame(quiet=false){
 if(!started||mode==='client'){if(!quiet)toast('Kun værten kan gemme verdenen.',true);return;}
 const data=JSON.parse(JSON.stringify(state));const p=data.players.find(p=>p.id===playerId);data.players=p?[{...p,input:{x:0,z:0}}]:[];
 if(!writeStorage(SAVE,JSON.stringify({state:data,playerId}))){if(!quiet)toast('Browseren kunne ikke gemme. Lokal lagring er slået fra eller fuld.',true);return;}
 if(!quiet)toast('Verdenen er gemt i denne browser.');$('resume').hidden=false;
}
function startGame(resume=false){
 if(resume){try{const data=JSON.parse(readStorage(SAVE));if(data.state?.version!==1||!Array.isArray(data.state.buildings)||!data.state.terrain||!data.state.players?.length)throw Error();state=data.state;playerId=data.playerId;state.paused=false;state.players=state.players.filter(p=>p.id===playerId);state.players[0].input={x:0,z:0};}catch{toast('Det gemte spil kunne ikke åbnes.',true);return false;}}
 else{state=createGame();const p=addPlayer(state,$('player-name').value);playerId=p.id;}
 mode='solo';finishStart();return true;
}
function finishStart(){started=true;ended=false;lastWave=state.wave;lastEvent=0;writeStorage(NAME,$('player-name').value);$('start-screen').hidden=true;document.body.classList.remove('at-start');$('end-dialog').close();setTool(null);view.centerBase();updateUi();view.sync(state);tone(520,.15);}
function restart(){
 if(mode==='client'){toast('Kun værten kan starte en ny ekspedition.',true);return;}
 if(mode==='host'){
  const old=state;state=createGame();playerId=addPlayer(state,old.players.find(p=>p.id===playerId)?.name).id;
  for(const peer of lan.peers.values())if(peer.ready&&peer.playerId){const p=addPlayer(state,peer.name);peer.playerId=p.id;lan.send(peer,{type:'welcome',id:p.id,state});}
  ended=false;lastWave=0;$('end-dialog').close();setTool(null);view.terrainKey='';view.centerBase();updateUi();
 }else startGame();
 toast('En ny koloni er grundlagt.');
}
const lan=new Lan({
 onPeerOpen(peer){if(lan.role==='client')lan.send(peer,{type:'hello',name:$('player-name').value||readStorage(NAME)||'Ingeniør'});updatePeers();},
 onMessage(peer,msg){
  if(lan.role==='host'){
   if(msg.type==='hello'&&!peer.playerId){const p=addPlayer(state,msg.name);if(!p){lan.drop(peer.id);return;}peer.playerId=p.id;peer.name=p.name;lan.send(peer,{type:'welcome',id:p.id,state});toast(`${p.name} er ankommet til kolonien.`);tone(660,.14);updatePeers();}
   else if(msg.type==='command'&&peer.playerId){const error=command(state,peer.playerId,msg.command);if(error)lan.send(peer,{type:'error',message:error});}
  }else if(lan.role==='client'){
   if(msg.type==='welcome'){state=msg.state;playerId=msg.id;mode='client';finishStart();mode='client';$('lan-dialog').close();toast('Forbundet! I deler nu samme verden.');pendingDisconnect=false;}
   if(msg.type==='state'&&msg.state){const terrain=msg.state.terrain||state.terrain;state={...msg.state,terrain};}
   if(msg.type==='error')toast(msg.message,true);
  }
 },
 onPeerClose(peer){
  if(mode==='host'&&peer.playerId){removePlayer(state,peer.playerId);toast(`${peer.name} forlod kolonien.`);}
  if(mode==='client'&&peer.id==='host'&&!pendingDisconnect){pendingDisconnect=true;toast('Værten afbrød forbindelsen. Verdenen er stoppet.',true);state.paused=true;$('join-status').textContent='Forbindelsen blev afbrudt. Bed værten om en ny invitation.';}
  updatePeers();
 },onStatus(){updatePeers();}
});
function updatePeers(){
 $('peer-list').innerHTML=[...lan.peers.values()].filter(p=>p.id!=='host').map(p=>`<div class="peer-row"><span>${escape(p.name)} · ${p.ready?'forbundet':'invitation '+p.id}</span><button data-drop="${p.id}">Fjern</button></div>`).join('');
 $('create-invite').disabled=lan.peers.size>=3||mode==='client';
 $('create-invite').textContent=mode==='host'?'Lav invitation til næste ven ↗':'Åbn verden og lav invitation ↗';
 if(started)updateConnection();
}
$('peer-list').onclick=e=>{const id=e.target.dataset.drop;if(id)lan.drop(Number(id));};
function updateConnection(){const n=state.players.length;$('connection').innerHTML=`<i></i> ${mode==='solo'?'SOLO':mode==='host'?`LAN VÆRT · ${n}/4`:`LAN · ${n}/4`}`;}
function lanError(error){$('lan-error').textContent=error?.message||String(error);}
function showLan(join=false){$('menu-dialog').close();$('lan-error').textContent='';$('lan-dialog').showModal();lanTab(join);updatePeers();}
function lanTab(join){$('host-pane').hidden=join;$('join-pane').hidden=!join;$('lan-host-tab').classList.toggle('active',!join);$('lan-join-tab').classList.toggle('active',join);}
$('lan-host-tab').onclick=()=>lanTab(false);$('lan-join-tab').onclick=()=>lanTab(true);
$('create-invite').onclick=async()=>{
 const btn=$('create-invite');btn.disabled=true;btn.textContent='Finder lokal forbindelse…';$('lan-error').textContent='';
 try{if(!started)startGame();mode='host';const invite=await lan.invite();$('invite-code').value=invite.code;$('answer-input').value='';$('invite-output').hidden=false;updateConnection();}catch(e){lanError(e);}finally{updatePeers();}
};
$('accept-answer').onclick=async()=>{try{$('lan-error').textContent='';await lan.accept($('answer-input').value);toast('Forbinder til din ven…');$('invite-output').hidden=true;}catch(e){lanError(e);}};
$('leave-lan').onclick=()=>{const wasClient=mode==='client';pendingDisconnect=true;lan.close();pendingDisconnect=false;mode='solo';if(wasClient){started=false;state=createGame();playerId=null;$('start-screen').hidden=false;document.body.classList.add('at-start');setTool(null);}$('menu-dialog').close();updateUi();toast(wasClient?'Du har forladt LAN-verdenen.':'LAN er lukket. Du fortsætter alene.');};
$('create-answer').onclick=async()=>{
 if(mode==='host'&&lan.peers.size){lanError(Error('Luk dine gæsteforbindelser, før du tilslutter en anden verden.'));return;}
 const btn=$('create-answer');btn.disabled=true;btn.textContent='Laver svarkode…';$('lan-error').textContent='';
 try{pendingDisconnect=true;const code=await lan.join($('offer-input').value);pendingDisconnect=false;$('answer-code').value=code;$('answer-output').hidden=false;$('join-status').textContent='Send svarkoden til værten, og vent her på forbindelsen.';}catch(e){pendingDisconnect=false;lanError(e);}finally{btn.disabled=false;btn.innerHTML='Lav svarkode <span>↗</span>';}
};
for(const button of document.querySelectorAll('[data-copy]'))button.onclick=async()=>{const input=$(button.dataset.copy);try{await navigator.clipboard.writeText(input.value);toast('Koden er kopieret.');}catch{input.focus();input.select();if(document.execCommand('copy'))toast('Koden er kopieret.');else toast('Markér og kopiér koden med Ctrl+C.');}};
function updateInspector(){
 const b=state.buildings.find(b=>b.id===selected),type=tool||b?.type||'hq',def=TYPES[type];
 $('intel-label').textContent=tool?'BYGGEPLAN':b?'VALGT BYGNING':'KOLONIENS STATUS';$('intel-icon').innerHTML=icon(type,28);$('intel-title').textContent=def.name;$('intel-desc').textContent=tool||b?def.desc:'Fra en enkelt gnist til en selvforsynende fæstning. Hold produktionen kørende — og sværmen ude.';
 const row=(a,v,cls='')=>`<div class="stat-row"><span>${a}</span><span class="${cls}">${v}</span></div>`;
 if(tool){$('intel-stats').innerHTML=Object.entries(def.cost).map(([r,n])=>row(RESOURCE_NAMES[r],n,state.resources[r]>=n?'ok':'bad')).join('')+(def.power?row('Energi',def.power):'');}
 else{const bb=b||state.buildings.find(b=>b.type==='hq');$('intel-stats').innerHTML=bb?row('Integritet',`${Math.max(0,Math.ceil(bb.hp))} / ${TYPES[bb.type].hp}`)+`<div class="hp-bar"><i style="width:${Math.max(0,bb.hp/TYPES[bb.type].hp*100)}%"></i></div>`+row('Status',bb.active?'Operationel':'Ingen strøm',bb.active?'ok':'bad')+(bb.type==='turret'?row('Ammunition',bb.ammo):'')+(bb.input?.length?row('Inputlager',bb.input.length+'/8'):'')+row('Position',`${bb.x}, ${bb.z}`):row('Status','Centralen er ødelagt','bad');}
 const recipes={drill:'JERNMALM → TRANSPORTBÅND',smelter:'1 MALM → 1 JERNPLADE',assembler:'2 JERNPLADER → 1 TANDHJUL',turret:'1 TANDHJUL → 12 SKUD',sawmill:'SKOV → 3 TRÆ / 3 SEK.',generator:'1 TRÆ / 12 SEK. → 18 ENERGI'};
 $('recipe').textContent=recipes[type]||'';$('intel-tip').textContent=tool?'R drejer udgangen. Højreklik annullerer. Blå sten på kortet er jernmalm.':b?'Brug reparationsværktøjet (9) til beskadigede bygninger.':'Vælg en bygning i værktøjslinjen for at udvide kolonien.';
}
function updateUi(){
 $('resources').innerHTML=['wood','plate','gear','power'].map(r=>`<div class="resource ${r==='power'?'power':''} ${r==='power'&&state.power.used>state.power.total?'low':''}">${icon(r,23)}<strong>${r==='power'?`${state.power.used}<span style="font-size:10px;opacity:.5">/${state.power.total}</span>`:Math.floor(state.resources[r])}</strong><small>${RESOURCE_NAMES[r]}</small></div>`).join('');
 const incoming=state.enemies.length>0,time=Math.max(0,state.nextWave-state.time);$('wave-label').textContent=state.paused?'SPILLET ER PAUSET':incoming?'KONTAKT VED PERIMETEREN':'FORBERED DIN KOLONI';$('wave-title').textContent=incoming?'Sværmen angriber':'Sværmen kommer';$('countdown').textContent=incoming?String(state.enemies.length):`${String(Math.floor(time/60)).padStart(2,'0')}:${String(Math.floor(time%60)).padStart(2,'0')}`;
 $('wave-fill').style.width=incoming?'100%':Math.min(100,(1-time/(state.wave===0?100:95))*100)+'%';$('wave-fill').style.background=incoming?'var(--red)':'var(--gold)';$('wave-detail').textContent=`BØLGE ${Math.min(8,state.wave+(incoming?0:1))} AF ${FINAL_WAVE}`;$('early-wave').disabled=incoming||state.wave>=8||mode==='client'||!started;$('day').textContent='DAG '+String(1+Math.floor(state.time/180)).padStart(2,'0');
 const goals=[{text:'En industri, der arbejder',sub:`${state.produced.plate} / 10 jernplader leveret`,done:state.produced.plate>=10},{text:'Maskiner til modstand',sub:`${state.produced.gear} / 5 tandhjul leveret`,done:state.produced.gear>=5},{text:'Hold sværmen ude',sub:`${state.wave} / 8 bølger · ${state.totalKills} fjender stoppet`,done:state.status==='victory'}];
 $('objectives').innerHTML=goals.map(g=>`<div class="objective ${g.done?'done':''}"><span class="check">${g.done?'✓':''}</span><div>${g.text}<small>${g.sub}</small></div></div>`).join('');
 $('team').innerHTML=state.players.length?`<div class="team-title">INGENIØRER · ${state.players.length}/4</div>`+state.players.map(p=>`<div class="teammate"><span class="avatar">${String(p.color+1).padStart(2,'0')}</span><span>${escape(p.name)}${p.hp<=0?` (${Math.ceil(p.respawn)}s)`:''}</span><span class="role">${p.id===state.players[0]?.id?'VÆRT':p.id===playerId?'DIG':'MEDSPILLER'}</span></div>`).join(''):'';
 $('pause').textContent=state.paused?'▶':'Ⅱ';$('speed').textContent=state.speed+'×';$('save').disabled=mode==='client';$('menu-save').disabled=mode==='client';$('restart').disabled=mode==='client';$('open-lan').disabled=mode==='client';$('leave-lan').hidden=mode==='solo';$('leave-lan').textContent=mode==='host'?'Luk LAN (behold verdenen)':'Forlad LAN-verden';$('end-restart').disabled=mode==='client';$('end-restart').textContent=mode==='client'?'Venter på værten':'Prøv en ny ekspedition ↗';$('pause').disabled=mode==='client';$('speed').disabled=mode==='client';updateConnection();updateToolbar();updateInspector();drawMinimap();
 if(state.wave>lastWave){lastWave=state.wave;toast(`Bølge ${state.wave} — ${state.enemies.length} fjender nærmer sig.`);tone(160,.6,.035,'sawtooth');}
 if(started&&state.status!=='playing'&&!ended){ended=true;$('end-title').textContent=state.status==='victory'?'Ironhaven består.':'Kolonien er faldet.';$('end-label').textContent=state.status==='victory'?'8 BØLGER. ÉN OVERLEVENDE KOLONI.':'EKSPEDITION AFSLUTTET';$('end-summary').textContent=`I holdt ud i ${Math.floor(state.time/60)} minutter og stoppede ${state.totalKills} fjender. Produktionen leverede ${state.produced.plate} jernplader og ${state.produced.gear} tandhjul.`;$('end-dialog').showModal();saveGame(true);}
}
const mini=$('minimap'),ctx=mini.getContext('2d');
function drawMinimap(){const w=mini.width,h=mini.height,sx=w/56,sz=h/56;ctx.fillStyle='#11262a';ctx.fillRect(0,0,w,h);ctx.fillStyle='#31554b';for(const t of state.terrain.trees)ctx.fillRect((t.x+28)*sx,(t.z+28)*sz,2,2);ctx.fillStyle='#789d9e';for(const t of state.terrain.ore)ctx.fillRect((t.x+28)*sx,(t.z+28)*sz,2,2);for(const b of state.buildings){ctx.fillStyle=b.type==='wall'?'#657e71':b.type==='hq'?'#eeb96e':'#abd3ae';ctx.fillRect((b.x+28)*sx,(b.z+28)*sz,b.type==='hq'?5:2,b.type==='hq'?5:2);}ctx.fillStyle='#f5816d';for(const e of state.enemies)ctx.fillRect((e.x+28)*sx,(e.z+28)*sz,2,2);ctx.fillStyle='#ffdc98';for(const p of state.players)ctx.fillRect((p.x+28)*sx-1,(p.z+28)*sz-1,3,3);ctx.strokeStyle='#afc8b750';const cw=view.zoom*1.4,ch=view.zoom;ctx.strokeRect((view.center.x+28-cw/2)*sx,(view.center.z+28-ch/2)*sz,cw*sx,ch*sz);}
mini.onclick=e=>{const rect=mini.getBoundingClientRect();view.center.set((e.clientX-rect.left)/rect.width*56-28,0,(e.clientY-rect.top)/rect.height*56-28);};
function buildAt(cell){if(!cell||!tool||!started)return;const signature=`${tool}:${cell.x}:${cell.z}`;if(signature===lastBuild)return;lastBuild=signature;
 const cmd=tool==='demolish'||tool==='repair'?{type:tool,x:cell.x,z:cell.z}:{type:'build',building:tool,x:cell.x,z:cell.z,dir};if(execute(cmd)!==false)tone(tool==='demolish'?190:700,.035,.015,'triangle');updateHover();}
$('world').addEventListener('pointermove',e=>{hover=view.point(e.clientX,e.clientY);updateHover();if(dragging&&e.shiftKey&&['belt','wall'].includes(tool))buildAt(hover);});
$('world').addEventListener('pointerdown',e=>{if(e.button===2){setTool(null);return;}if(e.button!==0||!started)return;hover=view.point(e.clientX,e.clientY);if(tool){dragging=true;lastBuild='';buildAt(hover);}else if(hover){const b=state.buildings.find(b=>b.x===hover.x&&b.z===hover.z);selected=b?.id||null;view.select(b);updateInspector();}});
window.addEventListener('pointerup',()=>{dragging=false;lastBuild='';});$('world').addEventListener('contextmenu',e=>e.preventDefault());
$('world').addEventListener('wheel',e=>{e.preventDefault();view.setZoom(e.deltaY*.015);},{passive:false});
window.addEventListener('keydown',e=>{
 if(['INPUT','TEXTAREA'].includes(e.target.tagName))return;
 if(e.key==='Escape'){setTool(null);keys.clear();return;}
 if(document.querySelector('dialog[open]'))return;
 if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(!started||e.repeat)return;
 const i=SHORTCUT.indexOf(e.key);if(i>=0)setTool(tool===TOOL_LIST[i]?null:TOOL_LIST[i]);
 if(e.key.toLowerCase()==='r'&&tool){dir=(dir+1)%4;view.setTool(tool,dir);updateHover();}
 if(e.key.toLowerCase()==='p')execute({type:'pause'});if(e.key===' ')view.centerBase();if(e.key==='?')$('help-dialog').showModal();
});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();if(started)execute({type:'move',x:0,z:0});});
$('start-solo').onclick=()=>startGame();$('resume').onclick=()=>startGame(true);$('start-lan').onclick=()=>showLan();$('open-lan').onclick=()=>showLan();$('help').onclick=()=>$('help-dialog').showModal();$('menu').onclick=()=>$('menu-dialog').showModal();$('brand').onclick=e=>{e.preventDefault();if(started)$('menu-dialog').showModal();};$('continue').onclick=()=>$('menu-dialog').close();$('pause').onclick=()=>execute({type:'pause'});$('speed').onclick=()=>execute({type:'speed'});$('save').onclick=()=>saveGame();$('menu-save').onclick=()=>saveGame();$('early-wave').onclick=()=>execute({type:'wave'});$('zoom-in').onclick=()=>view.setZoom(-2);$('zoom-out').onclick=()=>view.setZoom(2);$('focus').onclick=()=>view.centerBase();$('restart').onclick=()=>{$('menu-dialog').close();restart();};$('end-restart').onclick=restart;
$('quality').onclick=()=>{lowQuality=!lowQuality;view.setQuality(lowQuality);$('quality').textContent='Grafik: '+(lowQuality?'let (uden skygger)':'standard');};
function updateSound(){$('sound').innerHTML=icon(muted?'mute':'sound',19);$('sound').setAttribute('aria-label',muted?'Slå lyd til':'Slå lyd fra');}
$('sound').onclick=()=>{muted=!muted;updateSound();tone(660,.09);};updateSound();
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>b.closest('dialog').close();
function nameplates(){const root=$('nameplates');const ids=new Set(state.players.map(p=>'p'+p.id));for(const el of [...root.children])if(!ids.has(el.id))el.remove();for(const p of state.players){let el=$('p'+p.id);if(!el){el=document.createElement('div');el.id='p'+p.id;el.className='nameplate';root.append(el);}const pos=view.project(p.x,p.z);el.style.left=pos.x+'px';el.style.top=pos.y+'px';el.hidden=!pos.visible;el.textContent=p.name+(p.id===playerId?' · DIG':'')+(p.hp<=0?` · ${Math.ceil(p.respawn)}s`:'');el.classList.toggle('dead',p.hp<=0);}}
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
  const modal=!!document.querySelector('dialog[open]'),x=modal?0:(keys.has('d')?1:0)-(keys.has('a')?1:0),z=modal?0:(keys.has('s')?1:0)-(keys.has('w')?1:0),input=`${x},${z}`;
  if(input!==lastMove||mode==='client'&&now-lastNet>500){execute({type:'move',x,z});lastMove=input;lastNet=now;}
  if(!modal){const cx=(keys.has('arrowright')?1:0)-(keys.has('arrowleft')?1:0),cz=(keys.has('arrowdown')?1:0)-(keys.has('arrowup')?1:0);if(cx||cz)view.pan((cx+cz)*dt*9,(cz-cx)*dt*9);}
  if(now-lastSave>30000){lastSave=now;saveGame(true);}view.sync(state);
 }else{view.sync({...state,time:now/1000});}
 view.draw();nameplates();if(now-lastUi>200){lastUi=now;updateUi();updateHover();}requestAnimationFrame(frame);
}
initHotbar();updateUi();view.sync(state);view.draw();$('loading').hidden=true;requestAnimationFrame(frame);
window.addEventListener('beforeunload',()=>{if(started&&mode!=='client')saveGame(true);});
