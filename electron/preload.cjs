const { contextBridge, ipcRenderer, clipboard } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  readClipboard: () => clipboard.readText(),
  setSystemProxy: (enable, port = 10809, upstream = null) =>
    ipcRenderer.invoke('set-system-proxy', { enable, port, upstream }),
  notifyConnectionState: (state, serverName) =>
    ipcRenderer.send('connection-state-change', { state, serverName }),
});
