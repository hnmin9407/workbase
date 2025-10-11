const { ipcRenderer } = require('electron');

document.getElementById('min-btn').addEventListener('click', () => {
  ipcRenderer.send('window-minimize');
});

document.getElementById('max-btn').addEventListener('click', () => {
  ipcRenderer.send('window-maximize');
});

document.getElementById('close-btn').addEventListener('click', () => {
  ipcRenderer.send('window-close');
});
