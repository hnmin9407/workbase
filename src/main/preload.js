const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('appAPI', {
  loadHTML: async (relativePath) => {
    return await ipcRenderer.invoke('read-file', relativePath);
  }
});
