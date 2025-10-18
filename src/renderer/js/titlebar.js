// titlebar.js

document.addEventListener("DOMContentLoaded", function () {
  const minBtn = document.getElementById("min-btn");
  const maxBtn = document.getElementById("max-btn");
  const closeBtn = document.getElementById("close-btn");
  const maxIcon = maxBtn ? maxBtn.querySelector("img") : null;

  // ✅ 변경: contextBridge를 통해 노출된 안전한 API를 사용합니다.
  const electronAPI = window.electronAPI;

  if (!electronAPI) {
    console.error("preload.js를 통해 electronAPI가 노출되지 않았습니다.");
    return;
  }
  
  // 창 최소화 버튼
  if (minBtn) {
    minBtn.addEventListener("click", () => {
      electronAPI.send("window-minimize");
    });
  }

  // 창 최대화 / 복원 버튼
  if (maxBtn) {
    maxBtn.addEventListener("click", () => {
      electronAPI.send("window-maximize");
    });
  }

  // 창 닫기 버튼
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      electronAPI.send("window-close");
    });
  }

  // 메인 프로세스에서 오는 창 상태 변경 신호 수신
  if (maxIcon) {
    electronAPI.on("window-maximized", () => {
      maxIcon.src = "../../assets/titlebar/max-icon-2.svg";
    });

    electronAPI.on("window-unmaximized", () => {
      maxIcon.src = "../../assets/titlebar/max-icon-1.svg";
    });
  }
});