const sidebar = document.getElementById("sidebar");
const sidebarFoldButton = document.getElementById("sidebar-fold-button");
const main = document.querySelector(".main");
const minBtn = document.getElementById("min-btn");
const maxBtn = document.getElementById("max-btn");
const closeBtn = document.getElementById("close-btn");
const maxIcon = document.getElementById("max-icon");

// 안전한 ipcRenderer 참조 (preload에서 꺼내오는 경우와 require() 폴백)
const ipcRenderer =
  (window && window.ipcRenderer) ||
  (typeof window !== "undefined" && window.require && window.require("electron") && window.require("electron").ipcRenderer) ||
  null;

// 사이드바 폴드 토글 (중복 등록 제거 — 한 번만 등록)
if (sidebarFoldButton && main) {
  sidebarFoldButton.addEventListener("click", () => {
    main.classList.toggle("sidebar-folded");
  });
} else {
  console.warn("sidebarFoldButton 또는 main 요소를 찾을 수 없습니다");
}

// 창 최소화 버튼
if (minBtn) {
  minBtn.addEventListener("click", () => {
    if (ipcRenderer && typeof ipcRenderer.send === "function") {
      ipcRenderer.send("window-minimize");
    } else {
      console.warn("ipcRenderer가 없습니다: minimize 신호를 보낼 수 없음");
    }
  });
} else {
  console.warn("minBtn 요소를 찾을 수 없습니다");
}

// 창 최대화 / 복원 버튼
if (maxBtn) {
  maxBtn.addEventListener("click", () => {
    if (ipcRenderer && typeof ipcRenderer.send === "function") {
      ipcRenderer.send("window-maximize");
    } else {
      console.warn("ipcRenderer가 없습니다: maximize 신호를 보낼 수 없음");
    }
  });
} else {
  console.warn("maxBtn 요소를 찾을 수 없습니다");
}

// 창 닫기 버튼
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    if (ipcRenderer && typeof ipcRenderer.send === "function") {
      ipcRenderer.send("window-close");
    } else {
      console.warn("ipcRenderer가 없습니다: close 신호를 보낼 수 없음");
    }
  });
} else {
  console.warn("closeBtn 요소를 찾을 수 없습니다");
}

// 메인 프로세스에서 최대화 상태 신호 수신 — 아이콘 교체
if (ipcRenderer && typeof ipcRenderer.on === "function") {
  ipcRenderer.on("window-maximized", () => {
    if (maxIcon) maxIcon.src = "../../assets/titlebar/max-icon-2.svg";
  });

  ipcRenderer.on("window-unmaximized", () => {
    if (maxIcon) maxIcon.src = "../../assets/titlebar/max-icon-1.svg";
  });
} else {
  console.warn("ipcRenderer.on을 사용할 수 없습니다");
}