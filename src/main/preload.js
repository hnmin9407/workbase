// preload.js

const { contextBridge, ipcRenderer } = require("electron");

// ✅ contextBridge를 통해 안전하게 API를 노출할 채널 목록
const validSendChannels = [
  "window-minimize",
  "window-maximize",
  "window-close",
];
const validReceiveChannels = ["window-maximized", "window-unmaximized"];

contextBridge.exposeInMainWorld("electronAPI", { // 💡 API 이름을 명확하게 변경 (예: electronAPI)
  // Renderer -> Main (메시지 보내기)
  send: (channel, data) => {
    // 💡 허용된 채널인지 확인하여 보안 강화
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  // Main -> Renderer (메시지 받기)
  on: (channel, func) => {
    // 💡 허용된 채널인지 확인하여 보안 강화
    if (validReceiveChannels.includes(channel)) {
      // 렌더러에서 이벤트 리스너를 제거할 수 있도록 원래 함수를 반환해주는 것이 좋습니다.
      const subscription = (event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
  },
});