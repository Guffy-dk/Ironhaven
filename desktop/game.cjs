const { app, BrowserWindow, dialog, Menu, protocol, session, shell } = require('electron');
const { createHash } = require('node:crypto');
const { readFile } = require('node:fs/promises');
const { mkdtempSync } = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const gameUrl = 'ironhaven://game/index.html';
const repositoryUrl = 'https://github.com/Guffy-dk/Ironhaven';
const smokeTest = process.argv.includes('--smoke-test');
let gameWindow;

app.setName('Ironhaven');
if (smokeTest) {
  app.setPath('userData', mkdtempSync(path.join(os.tmpdir(), 'ironhaven-smoke-')));
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
