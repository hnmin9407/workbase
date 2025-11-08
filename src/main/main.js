/* main.js */

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
    minHeight: 728,
    webPreferences: {
      partition: "persist:main",
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // IndexedDB 및 localStorage 접근 권한 명시적 허용
      webSecurity: true,
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

// --- 페이지 네비게이션 IPC 핸들러 ---
ipcMain.on("navigate-to-page", (event, page, queryParams = {}) => {
  console.log("🔄 페이지 이동 요청:", page, queryParams);
  if (!mainWindow) {
    console.warn("⚠️ mainWindow가 없습니다.");
    return;
  }

  let pagePath;
  switch (page) {
    case "index":
      pagePath = path.resolve(__dirname, "../renderer/html/index.html");
      break;
    case "login":
      pagePath = path.resolve(__dirname, "../renderer/html/login.html");
      break;
    default:
      console.error("❌ 알 수 없는 페이지:", page);
      return;
  }

  // 쿼리 파라미터가 있으면 URL에 추가
  let url = `file://${pagePath}`;
  const queryString = Object.keys(queryParams)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
    .join("&");
  
  if (queryString) {
    url += `?${queryString}`;
  }

  console.log("📄 페이지 로드:", url);
  mainWindow.loadURL(url).catch((err) => {
    console.error("❌ 페이지 로드 실패:", err);
    // loadURL이 실패하면 loadFile로 대체
    mainWindow.loadFile(pagePath).catch((err2) => {
      console.error("❌ loadFile도 실패:", err2);
    });
  });
});
// ---

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