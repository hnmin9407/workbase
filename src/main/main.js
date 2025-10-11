const { app, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const path = require("path");

// ✅ 로그 경로 (한글 사용자명 문제 방지)
log.transports.file.resolvePath = () =>
  path.join(app.getPath("userData"), "logs/main.log");
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

// ✅ 윈도우 생성
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minwidth: 500,
    minheight: 500,
    frame: false, // 기본 타이틀바 제거
    titleBarStyle: "hidden", // ← 오타 수정 (titmeBarStyle → titleBarStyle)
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.removeMenu(); // 상단 메뉴 제거
  win.loadFile("src/renderer/index.html");

  // ✅ IPC 통신으로 창 제어
  ipcMain.on("window-minimize", () => win.minimize());
  ipcMain.on("window-maximize", () => {
    win.isMaximized() ? win.unmaximize() : win.maximize();
  });
  ipcMain.on("window-close", () => win.close());

  // ✅ 앱 실행 후 3초 뒤 자동 업데이트 확인
  setTimeout(() => {
    log.info("Checking for updates...");
    autoUpdater.checkForUpdatesAndNotify();
  }, 3000);
}

// ✅ 앱 준비 시 윈도우 실행
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// ✅ 모든 창 닫히면 종료
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ✅ AutoUpdater 이벤트 로그
autoUpdater.on("checking-for-update", () => log.info("Checking for update..."));
autoUpdater.on("update-available", (info) => log.info("Update available:", info));
autoUpdater.on("update-not-available", () => log.info("No update available"));
autoUpdater.on("error", (err) => log.error("Error in auto-updater:", err));
autoUpdater.on("update-downloaded", () => {
  log.info("Update downloaded; will install now");
  autoUpdater.quitAndInstall();
});
