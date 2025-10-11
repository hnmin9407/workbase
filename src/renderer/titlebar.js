const { remote } = require('electron');
const win = remote.getCurrentWindow();

document.getElementById('min-btn').addEventListener('click', () => {
  win.minimize();
});

document.getElementById('max-btn').addEventListener('click', () => {
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

document.getElementById('close-btn').addEventListener('click', () => {
  win.close();
});