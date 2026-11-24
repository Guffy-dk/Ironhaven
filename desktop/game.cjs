const { app, BrowserWindow, dialog, Menu, protocol, session, shell } = require('electron');
const { createHash } = require('node:crypto');
const { readFile, writeFile, mkdir, cp } = require('node:fs/promises');
const { mkdtempSync } = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {loadModSources,compileInWorker,injectModData}=require('./mod-loader.cjs');

const gameUrl = 'ironhaven://game/index.html';
const studioUrl = 'ironhaven://game/studio.html';
const repositoryUrl = 'https://github.com/Guffy-dk/Ironhaven';
const modSmokeTest=process.argv.includes('--mod-smoke-test');
const smokeTest = process.argv.includes('--smoke-test')||modSmokeTest;
let gameWindow;
const graphicsErrors=[];
function smokePhase(label){if(smokeTest)console.error('[smoke] '+new Date().toISOString()+' '+label);}

app.setName('Ironhaven');
if (smokeTest) {
  app.setPath('userData', mkdtempSync(path.join(os.tmpdir(), 'ironhaven-smoke-')));
  // Hosted Windows runners have no reliable hardware adapter.
  app.commandLine.appendSwitch('use-angle', 'swiftshader');
  app.commandLine.appendSwitch('enable-unsafe-swiftshader');
}
protocol.registerSchemesAsPrivileged([{ scheme: 'ironhaven', privileges: { standard: true, secure: true } }]);

async function prepareGameDocument() {
  smokePhase('Reading embedded game');
  let html = await readFile(path.join(__dirname, 'Ironhaven.html'), 'utf8');
  const modDirectory=path.join(app.getPath('userData'),'mods');
  if(modSmokeTest){
    await mkdir(modDirectory,{recursive:true});
    await cp(path.join(__dirname,'../../Modding/mods/harbor-machining'),path.join(modDirectory,'harbor-machining'),{recursive:true});
    await writeFile(path.join(modDirectory,'mod-list.json'),JSON.stringify({mods:[{name:'harbor-machining',enabled:true}]}));
  }
  const packs=await loadModSources(modDirectory);
  if(packs.length){
    const seed=JSON.parse(await readFile(path.join(__dirname,'mod-base.json'),'utf8'));
    const compiled=await compileInWorker(seed,packs,path.join(__dirname,'mod-worker.cjs'));
    html=injectModData(html,compiled);
  }
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw Error('The game bundle is missing its script. Reinstall this version with the patcher.');
  const hash = createHash('sha256').update(script.replace(/\r\n?/g, '\n')).digest('base64');
  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': `default-src 'none'; script-src 'sha256-${hash}'; style-src 'unsafe-inline'; img-src 'self' data: blob:; object-src 'none'; base-uri 'none'`,
  };
  return { html, headers };
}

async function presentStudio() {
  await gameWindow.loadURL(studioUrl);
  gameWindow.show();
  const playback = gameWindow.webContents.executeJavaScript(`new Promise(resolve => {
    const video = document.getElementById('studio-intro');
    const finish = reason => {
      clearTimeout(deadline);
      video.pause();
      resolve({ reason, duration: video.duration, played: video.currentTime });
    };
    const deadline = setTimeout(() => finish('timeout'), 4000);
    video.addEventListener('ended', () => finish('ended'), { once: true });
    window.addEventListener('keydown', event => { if (event.key === 'Escape') finish('skipped'); });
    video.play().catch(() => setTimeout(() => finish('poster'), 1500));
  })`);
  if (smokeTest && !modSmokeTest) {
    await gameWindow.webContents.executeJavaScript(`new Promise(resolve => {
      const video = document.getElementById('studio-intro');
      video.addEventListener('timeupdate', () => { if (video.currentTime >= 2) resolve(); });
      setTimeout(resolve, 3500);
    })`);
    const capture = await gameWindow.webContents.capturePage();
    await writeFile(path.resolve(__dirname, '../../../..', 'Ironhaven-studio.png'), capture.toPNG());
  }
  const result = await playback;
  if (smokeTest && (result.reason !== 'ended' || result.duration < 2.8 || result.duration > 3.2 || result.played < 2.8)) {
    throw Error('Studio intro did not play to completion: ' + JSON.stringify(result));
  }
  if (smokeTest) gameWindow.hide();
}

async function start() {
  session.defaultSession.setPermissionRequestHandler((contents, permission, callback) => {
    callback(contents?.getURL() === gameUrl && permission === 'clipboard-sanitized-write');
  });

  Menu.setApplicationMenu(null);
  gameWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 900, minHeight: 600, show: false,
    title: 'Ironhaven', backgroundColor: '#100e1c',
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: !smokeTest },
  });
  if(smokeTest)gameWindow.webContents.on('console-message',(event,details,message)=>{
    const text=event.message??details?.message??message??'';if(/Shader Error|not compiled|VALIDATE_STATUS false|Uncaught/i.test(text))graphicsErrors.push(text);
  });
  gameWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url === repositoryUrl) void shell.openExternal(repositoryUrl);
    return { action: 'deny' };
  });
  gameWindow.webContents.on('will-navigate', event => event.preventDefault());
  const studioDocument = readFile(path.join(__dirname, 'Studio-Intro.html'), 'utf8');
  const gameDocument = prepareGameDocument();
  protocol.handle('ironhaven', async request => {
    if (request.method === 'GET' && request.url === studioUrl) {
      return new Response(await studioDocument, { headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; media-src data:; base-uri 'none'"
      } });
    }
    if (request.method === 'GET' && request.url === gameUrl) {
      const { html, headers } = await gameDocument;
      return new Response(html, { headers });
    }
    return new Response(null, { status: 404 });
  });
  await Promise.all([studioDocument, gameDocument, presentStudio()]);
  smokePhase('Loeth Studios intro played');
  smokePhase('Loading game and warming renderer');
  await gameWindow.loadURL(gameUrl);
  smokePhase('Game document loaded');

  if (!smokeTest) return;
  const result = await gameWindow.webContents.executeJavaScript(`(() => ({
    loaded: document.getElementById('loading')?.hidden === true,
    version: document.getElementById('version-label')?.textContent,
    multiplayer: typeof RTCPeerConnection === 'function',
    secure: isSecureContext
  }))()`);
  const expectedVersion = app.getVersion().replace(/\.0$/, '');
  if (!result.loaded || !result.secure || !result.multiplayer || !result.version?.startsWith(expectedVersion + ' ')) {
    throw Error('Desktop game did not initialize: ' + JSON.stringify(result));
  }
  const graphics = await gameWindow.webContents.executeJavaScript(`(async () => {
    await Promise.all(['quarry-materials','quarry-spruce','coastal-surfaces','crab-color','crab-normal','horror-color','horror-normal'].map(id => document.getElementById(id).decode()));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const gl = document.getElementById('world').getContext('webgl2');
    return {
      quarry: document.body.dataset.visualStyle === 'quarry',
      drawable: !!gl && !gl.isContextLost() && gl.drawingBufferWidth > 0
    };
  })()`);
  if (!graphics.quarry || !graphics.drawable) {
    throw Error('Desktop graphics did not initialize: ' + JSON.stringify(graphics));
  }
  smokePhase('Initial graphics verified');
  if(modSmokeTest){
    const result=await gameWindow.webContents.executeJavaScript(`(async()=>{
      document.getElementById('skip-tutorial').checked=true;document.getElementById('start-solo').click();document.getElementById('pause').click();
      document.querySelector('[data-tab="mods"]').click();document.querySelector('[data-type="fitting-shop"]').click();
      const canvas=document.getElementById('world');
      canvas.dispatchEvent(new PointerEvent('pointerdown',{button:0,clientX:innerWidth*.65,clientY:innerHeight*.38,bubbles:true}));
      window.dispatchEvent(new PointerEvent('pointerup',{button:0,clientX:innerWidth*.65,clientY:innerHeight*.38,bubbles:true}));
      document.getElementById('save').click();
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      const saved=JSON.parse(localStorage.getItem('ironhaven.save.v1'));
      return {placed:saved.state.buildings.some(b=>b.type==='fitting-shop'),signed:saved.state.contentSignature.includes('harbor-machining@1.0.0'),item:saved.state.resources['bronze-fitting']===0,listed:document.getElementById('mod-status').textContent.includes('harbor-machining')};
    })()`);
    if(Object.values(result).some(v=>!v))throw Error('Windows enabled-mod integration failed: '+JSON.stringify(result));
    await gameWindow.webContents.executeJavaScript(`(async()=>{
      window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
      const canvas=document.getElementById('world');
      canvas.dispatchEvent(new PointerEvent('pointerdown',{button:0,clientX:innerWidth*.65,clientY:innerHeight*.38,bubbles:true}));
      window.dispatchEvent(new PointerEvent('pointerup',{button:0,clientX:innerWidth*.65,clientY:innerHeight*.38,bubbles:true}));
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    })()`);
    await writeFile(path.resolve(__dirname,'../../../..','Ironhaven-modding.png'),(await gameWindow.webContents.capturePage()).toPNG());
    if(graphicsErrors.length)throw Error('Modded renderer errors: '+graphicsErrors.join('\n'));
    smokePhase('Enabled folder mod, placement and signed save verified');app.exit(0);return;
  }
  const interaction=await gameWindow.webContents.executeJavaScript(`(async () => {
    document.getElementById('skip-tutorial').checked=true;
    document.getElementById('start-solo').click();
    document.getElementById('pause').click();
    document.getElementById('aim-light').click();
    const aiming=!document.getElementById('tool-hint').hidden;
    document.getElementById('world').dispatchEvent(new PointerEvent('pointerdown',{button:0,clientX:innerWidth*.65,clientY:innerHeight*.38,bubbles:true}));
    document.getElementById('save').click();
    const saved=JSON.parse(localStorage.getItem('ironhaven.save.v1'));
    const core=saved?.state?.buildings?.find(b=>b.type==='hq');
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    return {aiming,saved:!!saved,aimed:Number.isFinite(core?.lighthouseAim),cancelled:document.getElementById('tool-hint').hidden};
  })()`);
  if(!interaction.aiming||!interaction.saved||!interaction.aimed||!interaction.cancelled)throw Error('Windows lighthouse controls failed: '+JSON.stringify(interaction));
  smokePhase('Lighthouse controls verified');
  const lampControls=await gameWindow.webContents.executeJavaScript(`(() => {
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'c',bubbles:true}));
    document.querySelector('[data-type="lamp"]').click();
    const canvas=document.getElementById('world');
    canvas.dispatchEvent(new PointerEvent('pointerdown',{button:0,clientX:innerWidth*.65,clientY:innerHeight*.38,bubbles:true}));
    window.dispatchEvent(new PointerEvent('pointerup',{button:0,clientX:innerWidth*.65,clientY:innerHeight*.38,bubbles:true}));
    document.getElementById('save').click();
    const saved=JSON.parse(localStorage.getItem('ironhaven.save.v1'));return saved.state.buildings.some(b=>b.type==='lamp'&&b.hp===75);
  })()`);
  if(!lampControls)throw Error('Windows Harbor lamp placement failed');
  smokePhase('Lamp placement verified; loading capture fixture');
  // Capture a reproducible playtest colony using the exact packaged Windows renderer.
  // The fixture is removed by the build script before the player archive is packaged.
  const fixture=await readFile(path.join(__dirname,'smoke-world.json'),'utf8');
  gameWindow.setSize(1600,1000);
  await gameWindow.webContents.executeJavaScript(`(async () => {
    localStorage.setItem('ironhaven.save.v1',${JSON.stringify(fixture)});
    document.getElementById('resume').click();
    document.getElementById('pause').click();
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'z',bubbles:true}));
    for(let i=0;i<2;i++)document.getElementById('zoom-in').click();
    document.getElementById('save').click();
    const saved=JSON.parse(localStorage.getItem('ironhaven.save.v1'));
    if(saved.state.enemies.length!==5||!saved.state.paused)throw Error('Windows capture scene did not load');
    const map=document.getElementById('minimap'),r=map.getBoundingClientRect();
    map.dispatchEvent(new PointerEvent('click',{clientX:r.left+r.width/2,clientY:r.top+r.height*(.5-1/260),bubbles:true}));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  })()`);
  smokePhase('Fixture rendered; capturing colony');
  const capture=await gameWindow.webContents.capturePage();
  await writeFile(path.resolve(__dirname,'../../../..','Ironhaven-ingame.png'),capture.toPNG());
  smokePhase('Colony captured; inspecting creature');
  const inspected=await gameWindow.webContents.executeJavaScript(`(async () => {
    const canvas=document.getElementById('world');
    const health=document.getElementById('enemy-health');
    const {width,height}=health;
    const {data}=health.getContext('2d').getImageData(0,0,width,height);
    const bars=[];
    // Five hostiles of known types are lined up west to east in the fixture.
    for(let y=1;y<height-1;y++)for(let x=1;x<width-24;x++){
      const i=(y*width+x)*4;
      const fill=(data[i]===237&&data[i+1]===205&&data[i+2]===145)||(data[i]===216&&data[i+1]===137&&data[i+2]===118);
      if(fill&&data[i-4]!==data[i]&&data[i-width*4]!==data[i]&&data[i+8*4]===data[i])bars.push({x:x+12,y});
    }
    if(bars.length!==5)throw Error('Expected five hostile health bars, found '+bars.length);
    const guard=bars.sort((a,b)=>a.x-b.x)[2];
    for(let y=guard.y;y<guard.y+60;y+=3){
      canvas.dispatchEvent(new PointerEvent('pointerdown',{button:0,clientX:guard.x,clientY:y,bubbles:true}));
      window.dispatchEvent(new PointerEvent('pointerup',{button:0,clientX:guard.x,clientY:y,bubbles:true}));
      if(document.getElementById('intel-title').textContent==='Shell guard')break;
      if(!document.getElementById('creature-back').hidden)document.getElementById('creature-back').click();
    }
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    return document.getElementById('intel-title').textContent;
  })()`);
  if(inspected!=='Shell guard')throw Error('Windows creature inspection failed: '+inspected);
  smokePhase('Creature selected; capturing close view');
  const creatures=await gameWindow.webContents.capturePage();
  await writeFile(path.resolve(__dirname,'../../../..','Ironhaven-creatures.png'),creatures.toPNG());
  await gameWindow.webContents.executeJavaScript(`(async () => {
    document.getElementById('creature-back').click();document.getElementById('auto-light').click();
    for(let i=0;i<50;i++)document.getElementById('zoom-out').click();
    const map=document.getElementById('minimap'),r=map.getBoundingClientRect();map.dispatchEvent(new PointerEvent('click',{clientX:r.left+r.width/2,clientY:r.top+r.height/2,bubbles:true}));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  })()`);
  smokePhase('Capturing island');
  const island=await gameWindow.webContents.capturePage();await writeFile(path.resolve(__dirname,'../../../..','Ironhaven-island.png'),island.toPNG());
  gameWindow.show();gameWindow.focus();gameWindow.webContents.focus();
  gameWindow.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});
  gameWindow.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});
  await gameWindow.webContents.executeJavaScript(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
  const menuCapture=await gameWindow.webContents.capturePage();await writeFile(path.resolve(__dirname,'../../../..','Ironhaven-menu.png'),menuCapture.toPNG());
  const settings=await gameWindow.webContents.executeJavaScript(`(async () => {
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    if(!document.getElementById('menu-dialog').open)throw Error('Escape did not open the menu');
    document.querySelector('[data-menu-target="settings"]').click();document.querySelector('[data-menu-target="controls"]').click();
    const slider=document.getElementById('pan-speed');slider.value='150';slider.dispatchEvent(new Event('input',{bubbles:true}));
    return JSON.parse(localStorage.getItem('ironhaven.preferences.v1')).controls.panSpeed;
  })()`);
  if(settings!==1.5)throw Error('Windows pan speed preference did not save');
  gameWindow.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});
  gameWindow.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});
  const back=await gameWindow.webContents.executeJavaScript(`(async () => {
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    return {open:document.getElementById('menu-dialog').open,title:document.getElementById('menu-title').textContent,focus:document.activeElement?.id};
  })()`);
  if(!back.open||back.title!=='Settings')throw Error('Windows Escape did not return to the settings parent page: '+JSON.stringify(back));
  await gameWindow.webContents.executeJavaScript(`(async () => {
    document.querySelector('[data-menu-target="controls"]').click();
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  })()`);
  smokePhase('Settings verified; capturing controls');
  const settingsCapture=await gameWindow.webContents.capturePage();await writeFile(path.resolve(__dirname,'../../../..','Ironhaven-settings.png'),settingsCapture.toPNG());
  await gameWindow.webContents.executeJavaScript(`(async () => {
    document.getElementById('menu-dialog').close();
    document.getElementById('resume').click();
    document.getElementById('pause').click();
    for(let i=0;i<60;i++)document.getElementById('zoom-in').click();
    for(let i=0;i<3;i++)document.getElementById('zoom-out').click();
    const diagnostics=document.getElementById('toggle-diagnostics');
    diagnostics.click();
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const fixture=JSON.parse(localStorage.getItem('ironhaven.save.v1'));
    const hub=fixture.state.buildings.find(building=>building.type==='splitter');
    const marker=document.getElementById('building-'+hub.id);
    if(!marker)throw Error('Dispatch hub marker is outside the capture scene');
    const x=parseFloat(marker.style.left);
    const top=parseFloat(marker.style.top)+parseFloat(marker.style.getPropertyValue('--label-lift'));
    const canvas=document.getElementById('world');let found=false;
    for(let y=top;y<Math.min(innerHeight,top+200)&&!found;y+=4){
      canvas.dispatchEvent(new PointerEvent('pointerdown',{button:0,clientX:x,clientY:y,bubbles:true}));
      window.dispatchEvent(new PointerEvent('pointerup',{button:0,clientX:x,clientY:y,bubbles:true}));
      found=document.getElementById('intel-title').textContent==='Dispatch hub';
    }
    if(!found)throw Error('Numbered Dispatch hub could not be selected');
    diagnostics.click();
    document.getElementById('toasts').replaceChildren();
    document.getElementById('program-building').click();
    if(!document.getElementById('program-dialog').open||!document.getElementById('program-ports').textContent.includes('4 OUT'))throw Error('Numbered port configuration failed');
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  })()`);
  smokePhase('Numbered ports verified; capturing hub');
  const portsCapture=await gameWindow.webContents.capturePage();await writeFile(path.resolve(__dirname,'../../../..','Ironhaven-ports.png'),portsCapture.toPNG());
  await gameWindow.webContents.executeJavaScript(`(async()=>{
    document.getElementById('program-dialog').close();
    document.getElementById('resume').click();
    document.getElementById('pause').click();
    const canvas=document.getElementById('minimap'),r=canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent('click',{clientX:r.left+r.width/2,clientY:r.top+r.height*(.5-9/257),bubbles:true}));
    document.querySelector('[data-tab="fabrication"]').click();
    if(document.querySelector('[data-type="harborWorks"]').hidden)throw Error('Fabrication toolbar is unavailable');
    document.getElementById('save').click();
    const buildings=JSON.parse(localStorage.getItem('ironhaven.save.v1')).state.buildings;
    const expected=['aggregateCrusher','firebrickKiln','cokeOven','alloyFurnace','resinKettle','cableWorks','hullYard','hydraulicWorks','switchgearShop','freightWorks','harborWorks','basaltBreakwater','signalMast','coastWatch'];
    if(expected.some(type=>!buildings.some(b=>b.type===type)))throw Error('Harbor fixture did not load');
    if(document.querySelector('dialog[open]'))throw Error('Harbor capture is obscured by a dialog');
    const inspector=document.getElementById('intel');
    const colony=document.getElementById('colony-details');
    const summary=colony.querySelector('summary');
    if(inspector.checkVisibility()||colony.open)throw Error('Default HUD shows expanded details');
    const bounds=summary.getBoundingClientRect();
    if(!summary.contains(document.elementFromPoint(bounds.left+bounds.width/2,bounds.top+bounds.height/2)))throw Error('Colony details cannot receive clicks');
    summary.click();
    if(!document.getElementById('objectives').checkVisibility())throw Error('Colony details did not reveal objectives');
    summary.click();
    document.querySelector('[data-type="harborWorks"]').click();
    const details=document.getElementById('building-details');
    const description=document.getElementById('intel-desc');
    if(!inspector.checkVisibility()||description.checkVisibility())throw Error('Blueprint inspector is not compact');
    details.querySelector('summary').click();
    if(!description.checkVisibility())throw Error('Blueprint details cannot be opened');
    document.querySelector('[data-type="harborWorks"]').click();
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  })()`);
  const harborCapture=await gameWindow.webContents.capturePage();
  await writeFile(path.resolve(__dirname,'../../../..','Ironhaven-harbor.png'),harborCapture.toPNG());
  await gameWindow.webContents.executeJavaScript(`(async()=>{
    const card=document.querySelector('[data-type="harborWorks"]');
    card.click();
    const prices=[...card.querySelectorAll('.material-price')];
    const inspectorPrices=[...document.querySelectorAll('#intel-summary .material-price')];
    if(prices.map(el=>el.dataset.material).join(',')!=='plate,steel,module')throw Error('Harbor Works cost icons are missing');
    for(const [index,price] of prices.entries()){
      const art=price.querySelector('.item-icon');
      if(!art||!getComputedStyle(art).backgroundImage.includes('data:image/webp;base64'))throw Error('Material atlas was not embedded');
      if(price.textContent!==inspectorPrices[index]?.textContent)throw Error('Toolbar and blueprint show different prices');
    }
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  })()`);
  const pricesCapture=await gameWindow.webContents.capturePage();
  await writeFile(path.resolve(__dirname,'../../../..','Ironhaven-build-costs.png'),pricesCapture.toPNG());
  smokePhase('Captures complete');
  if(graphicsErrors.length)throw Error('Desktop renderer errors: '+graphicsErrors.join('\n'));
  app.exit(0);
}

app.on('window-all-closed', () => app.quit());
app.on('second-instance', () => {
  if (gameWindow?.isMinimized()) gameWindow.restore();
  gameWindow?.focus();
});
if (!smokeTest && !app.requestSingleInstanceLock()) app.exit(0);
else app.whenReady().then(start).catch(error => {
  if (!smokeTest) dialog.showErrorBox('Ironhaven could not start', error.message);
  console.error(error);
  app.exit(1);
});
