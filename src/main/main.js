// main.js
// ============================================================
// 📦 Electron 메인 프로세스 (with AutoUpdater + OS ContextMenu)
// ============================================================

const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const path = require("path");

// ============================================================
// 📄 로그 설정 (한글 사용자명 호환)
// ============================================================
log.transports.file.resolvePath = () =>
  path.join(app.getPath("userData"), "logs/main.log");
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

let win; // 전역 윈도우 변수

// ============================================================
// 🪟 BrowserWindow 생성
// ============================================================
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
      nodeIntegration: false, // 보안상 필수: 렌더러에서 Node 직접 접근 금지
      contextIsolation: true, // 보안상 필수: context 분리
    },
  });

  win.removeMenu(); // 상단 메뉴 제거
  win.loadFile("src/renderer/index.html");

  // 윈도우 상태 이벤트 전달
  win.on("maximize", () => win.webContents.send("window-maximized"));
  win.on("unmaximize", () => win.webContents.send("window-unmaximized"));

  // 창 제어 IPC
  ipcMain.on("window-minimize", () => win.minimize());
  ipcMain.on("window-maximize", () =>
    win.isMaximized() ? win.unmaximize() : win.maximize()
  );
  ipcMain.on("window-close", () => win.close());

  // 앱 실행 후 3초 뒤 자동 업데이트 체크
  setTimeout(() => {
    log.info("Checking for updates...");
    autoUpdater.checkForUpdatesAndNotify();
  }, 3000);
}

// ============================================================
// 🚀 앱 초기화
// ============================================================
app.whenReady().then(() => {
  createWindow();

  win.loadFile("src/renderer/index.html");
win.webContents.openDevTools({ mode: "detach" }); // 💡 자동으로 개발자도구 열기

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ============================================================
// 🔄 AutoUpdater 이벤트 로깅
// ============================================================
autoUpdater.on("checking-for-update", () => log.info("Checking for update..."));
autoUpdater.on("update-available", (info) =>
  log.info("Update available:", info)
);
autoUpdater.on("update-not-available", () => log.info("No update available"));
autoUpdater.on("error", (err) => log.error("Error in auto-updater:", err));
autoUpdater.on("update-downloaded", () => {
  log.info("Update downloaded; will install now");
  autoUpdater.quitAndInstall();
});

// ============================================================
// 🧭 OS 레벨 컨텍스트 메뉴
// ============================================================
ipcMain.on("show-context-menu", (event, payload) => {
  const { type, x, y } = payload;
  let template = [];

  if (type === "group") {
    template = [
      {
        label: "이름 바꾸기",
        click: () => event.sender.send("context-action", "rename-group"),
      },
      {
        label: "삭제",
        click: () => event.sender.send("context-action", "delete-group"),
      },
      { type: "separator" },
      {
        label: "위로 이동",
        click: () => event.sender.send("context-action", "move-up-group"),
      },
      {
        label: "아래로 이동",
        click: () => event.sender.send("context-action", "move-down-group"),
      },
    ];
  } else if (type === "project") {
    template = [
      {
        label: "이름 바꾸기",
        click: () => event.sender.send("context-action", "rename-project"),
      },
      {
        label: "삭제",
        click: () => event.sender.send("context-action", "delete-project"),
      },
    ];
  }

  // 메뉴 생성 및 표시
  const menu = Menu.buildFromTemplate(template);
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  menu.popup({
    window: browserWindow,
    x,
    y,
    // macOS에서는 포커스 유지 위해 async 표시 방지
    async: false,
  });
});
