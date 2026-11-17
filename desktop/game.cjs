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

app.setName('Ironhaven');
if (smokeTest) {
  app.setPath('userData', mkdtempSync(path.join(os.tmpdir(), 'ironhaven-smoke-')));
  // Hosted Windows runners have no reliable hardware adapter.
  app.commandLine.appendSwitch('use-angle', 'swiftshader');
  app.commandLine.appendSwitch('enable-unsafe-swiftshader');
}
protocol.registerSchemesAsPrivileged([{ scheme: 'ironhaven', privileges: { standard: true, secure: true } }]);

async function start() {
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
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  if(smokeTest)gameWindow.webContents.on('console-message',(_event,details)=>{
    if(/Shader Error|not compiled|VALIDATE_STATUS false|Uncaught/i.test(details.message||''))graphicsErrors.push(details.message);
  });
  gameWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url === repositoryUrl) void shell.openExternal(repositoryUrl);
    return { action: 'deny' };
  });
  gameWindow.webContents.on('will-navigate', event => event.preventDefault());
  await gameWindow.loadURL(gameUrl);

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
    await Promise.all(['quarry-materials', 'quarry-spruce'].map(id => document.getElementById(id).decode()));
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
  // Capture a reproducible playtest colony using the exact packaged Windows renderer.
  // The fixture is removed by the build script before the player archive is packaged.
  const fixture=await readFile(path.join(__dirname,'smoke-world.json'),'utf8');
  gameWindow.setSize(1600,1000);
  await gameWindow.webContents.executeJavaScript(`(async () => {
    localStorage.setItem('ironhaven.save.v1',${JSON.stringify(fixture)});
    document.getElementById('resume').click();
    document.getElementById('pause').click();
    for(let i=0;i<4;i++)document.getElementById('zoom-in').click();
    document.getElementById('world').dispatchEvent(new WheelEvent('wheel',{deltaY:-66.666,bubbles:true}));
    document.getElementById('save').click();
    const saved=JSON.parse(localStorage.getItem('ironhaven.save.v1'));
    if(saved.state.enemies.length!==5||!saved.state.paused)throw Error('Windows capture scene did not load');
    const map=document.getElementById('minimap'),r=map.getBoundingClientRect();
    map.dispatchEvent(new MouseEvent('click',{clientX:r.left+r.width/2,clientY:r.top+r.height*(.5+1.4/181),bubbles:true}));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  })()`);
  const capture=await gameWindow.webContents.capturePage();
  await writeFile(path.resolve(__dirname,'../../../..','Ironhaven-ingame.png'),capture.toPNG());
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
