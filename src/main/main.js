const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

let mainWindow; // ✅ 전역 변수 선언

function createWindow() {
  // ✅ preload 및 login.html 경로 절대경로로 지정
  const preloadPath = path.resolve(__dirname, "preload.js");
  const loginPath = path.resolve(__dirname, "../renderer/html/login.html");

  console.log("🧭 preload 경로:", preloadPath);
  console.log("🧭 login.html 경로:", loginPath);
  console.log("📂 preload 파일 존재:", fs.existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    minWidth: 500,
    minHeight: 500,
    webPreferences: {
      partition: "persist:main",
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(loginPath);

  // ✅ 창 상태 변경 감지 → 렌더러로 전달
  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window-state", true);
  });

  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window-state", false);
  });
}

// ✅ 파일 읽기 IPC
ipcMain.handle("read-file", (event, relativePath) => {
  const fullPath = path.join(__dirname, "../", relativePath);
  try {
    return fs.readFileSync(fullPath, "utf-8");
  } catch (err) {
    console.error("❌ 파일 읽기 실패:", err);
    return "";
  }
});

app.whenReady().then(() => {
  console.log("✅ Electron App 준비 완료");
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ✅ 윈도우 제어 이벤트 수신
ipcMain.on("window-control", (event, action) => {
  console.log("📩 window-control 수신:", action);
  if (!mainWindow) return; // 안전장치

  switch (action) {
    case "minimize":
      mainWindow.minimize();
      break;
    case "maximize":
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      break;
    case "close":
      mainWindow.close();
      break;
  }
});
