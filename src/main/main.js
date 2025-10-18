// main.js

const { app, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const path = require("path");

// ✅ 로그 경로 (한글 사용자명 문제 방지)
log.transports.file.resolvePath = () =>
  path.join(app.getPath("userData"), "logs/main.log");
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

let win; // 윈도우 전역 변수

// ✅ 윈도우 생성
function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 500,
    minHeight: 500,
    frame: false, // 기본 타이틀바 제거
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      // ✅ ================== 보안 개선 ==================
      // 💡 nodeIntegration과 contextIsolation은 Electron 보안의 핵심입니다.
      // 💡 contextIsolation을 true로 설정하여 메인 프로세스와 렌더러 프로세스의 컨텍스트를 분리합니다.
      // 💡 이는 preload 스크립트를 더 안전하게 만들어 줍니다.
      nodeIntegration: false, // 렌더러 프로세스에서 Node.js API 사용 비활성화
      contextIsolation: true, // 컨텍스트 분리 활성화 (가장 중요)
      // ✅ ==============================================
    },
  });

  win.removeMenu(); // 상단 메뉴 제거
  win.loadFile("src/renderer/index.html");

  // ✅ 최대화/복원 시 아이콘 변경 신호 보내기
  win.on("maximize", () => {
    win.webContents.send("window-maximized");
  });

  win.on("unmaximize", () => {
    win.webContents.send("window-unmaximized");
  });

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