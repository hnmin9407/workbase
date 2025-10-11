const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// 로그 경로 지정 (한글 사용자명 문제 방지)
log.transports.file.resolvePath = () => `${app.getPath('userData')}/logs/main.log`;
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    titmeBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // ✅ 메뉴바 제거
  win.removeMenu();

  win.loadFile('src/renderer/index.html');
}

app.whenReady().then(() => {
  createWindow();

  // 3초 후 업데이트 체크 (GitHub 릴리즈 확인)
  setTimeout(() => {
    log.info('Checking for updates...');
    autoUpdater.checkForUpdatesAndNotify();
  }, 3000);
});

// autoUpdater 이벤트 로그
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
});
autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info);
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
