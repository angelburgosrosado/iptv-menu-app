/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const { app, BrowserWindow, session, ipcMain, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

// Disable hardware acceleration blocklist for maximum video decoding performance
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// Standard user agent spoofing for IPTV server compatibility
const IPTV_USER_AGENT = 'VLC/3.0.18 LibVLC/3.0.18';

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    title: 'IPTV Player Pro - Desktop Suite',
    backgroundColor: '#071018',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: false, // Bypasses browser CORS & Same-Origin Policy entirely
      allowRunningInsecureContent: true, // Allows HTTP streams on HTTPS UI
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false, // Keep live audio/video streaming when window is minimized or behind
    },
  });

  // Intercept outgoing network requests to spoof IPTV player headers
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders };

    // Set VLC user agent for video streams and m3u8 playlists
    const url = details.url.toLowerCase();
    if (
      url.includes('.m3u8') ||
      url.includes('.ts') ||
      url.includes('.mpd') ||
      url.includes('/live/') ||
      url.includes('/timeshift/') ||
      url.includes('output=ts') ||
      url.includes('output=m3u8')
    ) {
      headers['User-Agent'] = IPTV_USER_AGENT;
      // Remove browser-restricted Origin/Referer headers that IPTV panels reject
      delete headers['Origin'];
      delete headers['Sec-Fetch-Mode'];
      delete headers['Sec-Fetch-Site'];
      delete headers['Sec-Fetch-Dest'];
    }

    callback({ cancel: false, requestHeaders: headers });
  });

  // Intercept incoming responses to ensure permissive CORS headers for all streams
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    responseHeaders['access-control-allow-origin'] = ['*'];
    responseHeaders['access-control-allow-headers'] = ['*'];
    responseHeaders['access-control-allow-methods'] = ['GET, HEAD, OPTIONS, POST'];
    callback({ cancel: false, responseHeaders });
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    if (process.platform === 'darwin' && app.dock) {
      app.dock.show();
      app.focus({ steal: true });
    }
  });

  // Fallback to guarantee window visibility even if ready-to-show event is missed
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    }
  }, 1500);

  // Diagnostic logging for webContents load failures
  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedURL) => {
    console.error(`[Electron] Failed to load ${validatedURL}: ${errorDescription} (${errorCode})`);
  });

  // Load Vite Dev Server if active, otherwise load production build
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  const prodPath = path.join(__dirname, '../dist/index.html');

  const http = require('node:http');
  function tryLoad() {
    let hasResponded = false;
    const req = http.get(devServerUrl, (res) => {
      hasResponded = true;
      if (res.statusCode === 200) {
        console.log('[Electron] Connected to active Vite dev server at', devServerUrl);
        mainWindow.loadURL(devServerUrl);
      } else if (fs.existsSync(prodPath)) {
        console.log('[Electron] Dev server returned ' + res.statusCode + '. Loading production build:', prodPath);
        mainWindow.loadFile(prodPath);
      }
    });

    req.on('error', () => {
      if (!hasResponded) {
        hasResponded = true;
        if (fs.existsSync(prodPath)) {
          console.log('[Electron] No active Vite dev server on port 5173. Loading production bundle:', prodPath);
          mainWindow.loadFile(prodPath);
        } else {
          console.log('[Electron] Neither dev server nor dist/index.html ready. Retrying in 1.5s...');
          setTimeout(tryLoad, 1500);
        }
      }
    });

    req.setTimeout(800, () => {
      if (!hasResponded) {
        hasResponded = true;
        req.destroy();
        if (fs.existsSync(prodPath)) {
          console.log('[Electron] Dev server probe timed out. Loading production bundle:', prodPath);
          mainWindow.loadFile(prodPath);
        }
      }
    });
  }

  tryLoad();

  // Handle external links safely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Window control IPC handlers
ipcMain.on('window:toggle-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  }
});

ipcMain.on('window:minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.on('open-external', (_, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('vlc://'))) {
    shell.openExternal(url);
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
