// ✅ preload.js (정상 통합 버전)
const { contextBridge, ipcRenderer } = require("electron");

const validSendChannels = [
  "window-minimize",
  "window-maximize",
  "window-close",
];
const validReceiveChannels = ["window-maximized", "window-unmaximized"];

contextBridge.exposeInMainWorld("electronAPI", {
  // -----------------------------
  // 💬 창 제어 관련 (기존 기능)
  // -----------------------------
  send: (channel, data) => {
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  on: (channel, func) => {
    if (validReceiveChannels.includes(channel)) {
      const subscription = (event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
  },

  // -----------------------------
  // 🧭 OS 컨텍스트 메뉴 관련 (추가 기능)
  // -----------------------------
  showContextMenu: (payload) => ipcRenderer.send("show-context-menu", payload),

  onContextAction: (callback) => {
    ipcRenderer.on("context-action", (event, action) => callback(action));
  },
});
