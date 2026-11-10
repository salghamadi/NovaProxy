const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, clipboard } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const http = require('http');
const net = require('net');

let mainWindow = null;
let tray = null;
let localBridgeServer = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 680,
    minWidth: 840,
    minHeight: 580,
    frame: false, // Frameless window matching INCY design
    transparent: false,
    backgroundColor: '#0a0d0a',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  const distPath = path.join(__dirname, '../dist/index.html');

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      mainWindow.loadFile(distPath);
    });
  } else {
    mainWindow.loadFile(distPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Window controls IPC
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

// SOCKS5 Tunnel Helper
function connectViaSocks5(proxy, targetHost, targetPort, callback) {
  const socket = net.connect(proxy.port, proxy.host, () => {
    // SOCKS5 Greeting: 0x05, 2 methods (0x00 no-auth, 0x02 user/pass)
    socket.write(Buffer.from([0x05, 0x02, 0x00, 0x02]));
  });

  let state = 0;
  socket.on('data', function onData(data) {
    if (state === 0) {
      if (data[0] === 0x05 && data[1] === 0x02) {
        state = 1;
        const u = Buffer.from(proxy.username || '');
        const p = Buffer.from(proxy.password || '');
        socket.write(Buffer.concat([Buffer.from([0x01, u.length]), u, Buffer.from([p.length]), p]));
      } else if (data[0] === 0x05 && data[1] === 0x00) {
        state = 2;
        sendConnect();
      } else {
        socket.destroy();
        callback(new Error('SOCKS5 auth rejected'));
      }
    } else if (state === 1) {
      if (data[0] === 0x01 && data[1] === 0x00) {
        state = 2;
        sendConnect();
      } else {
        socket.destroy();
        callback(new Error('SOCKS5 user/pass auth failed'));
      }
    } else if (state === 2) {
      if (data[0] === 0x05 && data[1] === 0x00) {
        socket.removeListener('data', onData);
        callback(null, socket);
      } else {
        socket.destroy();
        callback(new Error(`SOCKS5 target connect failed: ${data[1]}`));
      }
    }
  });

  function sendConnect() {
    const hostBuf = Buffer.from(targetHost);
    const portBuf = Buffer.alloc(2);
    portBuf.writeUInt16BE(targetPort);
    const req = Buffer.concat([
      Buffer.from([0x05, 0x01, 0x00, 0x03, hostBuf.length]),
      hostBuf,
      portBuf,
    ]);
    socket.write(req);
  }

  socket.on('error', (err) => callback(err));
}

// Local HTTP & HTTPS CONNECT Proxy Bridge
function startLocalHttpBridge(upstream, localPort = 10809) {
  stopLocalHttpBridge();

  if (!upstream || !upstream.host || !upstream.port) return;

  const isSocks = upstream.protocol === 'socks5' || upstream.protocol === 'socks';
  const authHeader = upstream.username && upstream.password
    ? 'Basic ' + Buffer.from(`${upstream.username}:${upstream.password}`).toString('base64')
    : null;

  localBridgeServer = http.createServer((clientReq, clientRes) => {
    if (isSocks) {
      // Connect to destination via SOCKS5
      try {
        const urlObj = new URL(clientReq.url);
        const targetHost = urlObj.hostname;
        const targetPort = parseInt(urlObj.port || '80', 10);

        connectViaSocks5(upstream, targetHost, targetPort, (err, upstreamSocket) => {
          if (err) {
            clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
            return clientRes.end(`SOCKS5 Gateway Error: ${err.message}`);
          }

          let reqHeader = `${clientReq.method} ${urlObj.pathname}${urlObj.search} HTTP/1.1\r\n`;
          for (const [key, val] of Object.entries(clientReq.headers)) {
            if (key.toLowerCase() !== 'proxy-connection') {
              reqHeader += `${key}: ${val}\r\n`;
            }
          }
          reqHeader += '\r\n';

          upstreamSocket.write(reqHeader);
          clientReq.pipe(upstreamSocket);
          upstreamSocket.pipe(clientRes);
        });
      } catch (e) {
        clientRes.writeHead(400, { 'Content-Type': 'text/plain' });
        clientRes.end('Bad Request');
      }
    } else {
      // Forward HTTP to HTTP upstream proxy
      const options = {
        hostname: upstream.host,
        port: upstream.port,
        path: clientReq.url,
        method: clientReq.method,
        headers: { ...clientReq.headers },
      };

      if (authHeader) {
        options.headers['Proxy-Authorization'] = authHeader;
      }

      const proxyReq = http.request(options, (proxyRes) => {
        clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(clientRes, { end: true });
      });

      proxyReq.on('error', (err) => {
        clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
        clientRes.end(`Proxy Error: ${err.message}`);
      });

      clientReq.pipe(proxyReq, { end: true });
    }
  });

  // Handle HTTPS CONNECT tunnel
  localBridgeServer.on('connect', (req, clientSocket, head) => {
    const [targetHost, targetPortStr] = req.url.split(':');
    const targetPort = parseInt(targetPortStr || '443', 10);

    if (isSocks) {
      connectViaSocks5(upstream, targetHost, targetPort, (err, upstreamSocket) => {
        if (err) {
          clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
          return clientSocket.end();
        }

        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        clientSocket.pipe(upstreamSocket);
        upstreamSocket.pipe(clientSocket);
      });
    } else {
      const upstreamSocket = net.connect(upstream.port, upstream.host, () => {
        let connectReq = `CONNECT ${req.url} HTTP/1.1\r\nHost: ${req.url}\r\n`;
        if (authHeader) {
          connectReq += `Proxy-Authorization: ${authHeader}\r\n`;
        }
        connectReq += '\r\n';
        upstreamSocket.write(connectReq);
      });

      let headerBuffer = '';
      let connected = false;

      upstreamSocket.on('data', (chunk) => {
        if (!connected) {
          headerBuffer += chunk.toString();
          if (headerBuffer.includes('\r\n\r\n')) {
            const firstLine = headerBuffer.split('\r\n')[0];
            if (firstLine.includes('200')) {
              connected = true;
              clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
              const remaining = chunk.slice(chunk.indexOf('\r\n\r\n') + 4);
              if (remaining.length > 0) {
                clientSocket.write(remaining);
              }
              clientSocket.pipe(upstreamSocket);
              upstreamSocket.pipe(clientSocket);
            } else {
              clientSocket.write(`HTTP/1.1 502 Bad Gateway\r\n\r\n`);
              clientSocket.end();
              upstreamSocket.end();
            }
          }
        }
      });

      upstreamSocket.on('error', () => {
        clientSocket.write(`HTTP/1.1 502 Bad Gateway\r\n\r\n`);
        clientSocket.end();
      });

      clientSocket.on('error', () => {
        upstreamSocket.destroy();
      });
    }
  });

  localBridgeServer.listen(localPort, '127.0.0.1', () => {
    console.log(`Local bridge running on 127.0.0.1:${localPort} -> ${upstream.protocol.toUpperCase()} ${upstream.host}:${upstream.port}`);
  });
}

function stopLocalHttpBridge() {
  if (localBridgeServer) {
    try {
      localBridgeServer.close();
    } catch {}
    localBridgeServer = null;
  }
}

// Windows System Proxy Manager (sets system internet settings in registry)
ipcMain.handle('set-system-proxy', async (event, { enable, port = 10809, upstream = null }) => {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      return resolve({ success: true, platform: process.platform });
    }

    if (enable) {
      if (upstream) {
        startLocalHttpBridge(upstream, port);
      }

      // Enable Windows Proxy: 127.0.0.1:port
      const cmdEnable = `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f`;
      const cmdServer = `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d "127.0.0.1:${port}" /f`;

      exec(`${cmdEnable} && ${cmdServer}`, (err) => {
        if (err) console.error('Failed to enable Windows proxy:', err);
        resolve({ success: !err });
      });
    } else {
      stopLocalHttpBridge();

      // Disable Windows Proxy
      const cmdDisable = `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f`;
      exec(cmdDisable, (err) => {
        if (err) console.error('Failed to disable Windows proxy:', err);
        resolve({ success: !err });
      });
    }
  });
});

ipcMain.on('connection-state-change', (event, { state, serverName }) => {
  if (tray) {
    tray.setToolTip(`INCY - ${state === 'connected' ? `Connected: ${serverName}` : 'Disconnected'}`);
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  stopLocalHttpBridge();
  // Always disable proxy on exit to prevent locking internet
  if (process.platform === 'win32') {
    exec(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f`);
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
