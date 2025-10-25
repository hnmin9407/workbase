const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, '../renderer/index.html'));
}

ipcMain.handle('read-file', (event, relativePath) => {
  const fullPath = path.join(__dirname, '../../', relativePath);
  try {
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (err) {
    console.error('파일 읽기 실패:', err);
    return '';
  }
});

app.whenReady().then(createWindow);
