const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile('src/renderer/index.html');
}

app.whenReady().then(() => {
  createWindow();

  // 로그 저장 위치
  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = 'info';

  // 업데이트 체크
  autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
});
autoUpdater.on('update-available', (info) => {
  log.info('Update available: ', info);
});
autoUpdater.on('update-not-available', () => {
  log.info('No update available');
});
autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater:', err);
});
autoUpdater.on('update-downloaded', () => {
  log.info('Update downloaded; will install now');
  autoUpdater.quitAndInstall();
});
