const { app, BrowserWindow, dialog, Menu, protocol, session, shell } = require('electron');
const { createHash } = require('node:crypto');
const { readFile, writeFile } = require('node:fs/promises');
const { mkdtempSync } = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const gameUrl = 'ironhaven://game/index.html';
const repositoryUrl = 'https://github.com/Guffy-dk/Ironhaven';
const smokeTest = process.argv.includes('--smoke-test');
let gameWindow;
const graphicsErrors=[];
function smokePhase(label){if(smokeTest)console.error('[smoke] '+label);}

app.setName('Ironhaven');
if (smokeTest) {
  app.setPath('userData', mkdtempSync(path.join(os.tmpdir(), 'ironhaven-smoke-')));
  // Hosted Windows runners have no reliable hardware adapter.
  app.commandLine.appendSwitch('use-angle', 'swiftshader');
  app.commandLine.appendSwitch('enable-unsafe-swiftshader');
}
protocol.registerSchemesAsPrivileged([{ scheme: 'ironhaven', privileges: { standard: true, secure: true } }]);

async function start() {
  smokePhase('Reading embedded game');
  const html = await readFile(path.join(__dirname, 'Ironhaven.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw Error('The game bundle is missing its script. Reinstall this version with the patcher.');
  const hash = createHash('sha256').update(script.replace(/\r\n?/g, '\n')).digest('base64');
  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': `default-src 'none'; script-src 'sha256-${hash}'; style-src 'unsafe-inline'; img-src 'self' data: blob:; object-src 'none'; base-uri 'none'`,
  };
  protocol.handle('ironhaven', request => {
    if (request.method !== 'GET' || request.url !== gameUrl) return new Response(null, { status: 404 });
    return new Response(html, { headers });
  });
  session.defaultSession.setPermissionRequestHandler((contents, permission, callback) => {
    callback(contents?.getURL() === gameUrl && permission === 'clipboard-sanitized-write');
  });

  Menu.setApplicationMenu(null);
  gameWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 900, minHeight: 600, show: false,
    title: 'Ironhaven', backgroundColor: '#101e21',
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
  smokePhase('Loading game and warming renderer');
  await gameWindow.loadURL(gameUrl);
  smokePhase('Game document loaded');

  if (!smokeTest) {
    gameWindow.show();
    return;
  }
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
    for(let i=0;i<2;i++)document.getElementById('zoom-in').click();
    document.getElementById('save').click();
    const saved=JSON.parse(localStorage.getItem('ironhaven.save.v1'));
    if(saved.state.enemies.length!==5||!saved.state.paused)throw Error('Windows capture scene did not load');
    const map=document.getElementById('minimap'),r=map.getBoundingClientRect();
    map.dispatchEvent(new MouseEvent('click',{clientX:r.left+r.width/2,clientY:r.top+r.height*(.5-1/260),bubbles:true}));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  })()`);
  smokePhase('Fixture rendered; capturing colony');
  const capture=await gameWindow.webContents.capturePage();
  await writeFile(path.resolve(__dirname,'../../../..','Ironhaven-ingame.png'),capture.toPNG());
  smokePhase('Colony captured; inspecting creature');
  const inspected=await gameWindow.webContents.executeJavaScript(`(async () => {
    const canvas=document.getElementById('world');
    for(let y=.64;y<.81;y+=.008){
      canvas.dispatchEvent(new PointerEvent('pointerdown',{button:0,clientX:innerWidth*.5,clientY:innerHeight*y,bubbles:true}));
      window.dispatchEvent(new PointerEvent('pointerup',{button:0,clientX:innerWidth*.5,clientY:innerHeight*y,bubbles:true}));
      if(document.getElementById('intel-title').textContent==='Shell guard')break;
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
    const map=document.getElementById('minimap'),r=map.getBoundingClientRect();map.dispatchEvent(new MouseEvent('click',{clientX:r.left+r.width/2,clientY:r.top+r.height/2,bubbles:true}));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  })()`);
  smokePhase('Capturing island');
  const island=await gameWindow.webContents.capturePage();await writeFile(path.resolve(__dirname,'../../../..','Ironhaven-island.png'),island.toPNG());
  gameWindow.show();gameWindow.focus();gameWindow.webContents.focus();
  gameWindow.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});
  gameWindow.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});
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
    for(let i=0;i<60;i++)document.getElementById('zoom-in').click();
    for(let i=0;i<3;i++)document.getElementById('zoom-out').click();
    const map=document.getElementById('minimap'),r=map.getBoundingClientRect();map.dispatchEvent(new MouseEvent('click',{clientX:r.left+r.width*(.5-1/260),clientY:r.top+r.height*(.5-3/260),bubbles:true}));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const canvas=document.getElementById('world');let found=false;
    for(let y=.36;y<.55&&!found;y+=.012)for(let x=.46;x<.55&&!found;x+=.012){
      canvas.dispatchEvent(new PointerEvent('pointerdown',{button:0,clientX:innerWidth*x,clientY:innerHeight*y,bubbles:true}));
      window.dispatchEvent(new PointerEvent('pointerup',{button:0,clientX:innerWidth*x,clientY:innerHeight*y,bubbles:true}));
      found=document.getElementById('intel-title').textContent==='Dispatch hub';
    }
    if(!found)throw Error('Numbered Dispatch hub could not be selected');
    document.getElementById('program-building').click();
    if(!document.getElementById('program-dialog').open||!document.getElementById('program-ports').textContent.includes('4 OUT'))throw Error('Numbered port configuration failed');
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  })()`);
  smokePhase('Numbered ports verified; capturing hub');
  const portsCapture=await gameWindow.webContents.capturePage();await writeFile(path.resolve(__dirname,'../../../..','Ironhaven-ports.png'),portsCapture.toPNG());
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
