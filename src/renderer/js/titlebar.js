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
  (typeof window !== "undefined" &&
    window.require &&
    window.require("electron") &&
    window.require("electron").ipcRenderer) ||
  null;

// 사이드바 폴드 토글 (중복 등록 제거 — 한 번만 등록)
if (sidebarFoldButton && main) {
  sidebarFoldButton.addEventListener("click", () => {
    main.classList.toggle("sidebar-folded");
  });
} else {
  console.warn("sidebarFoldButton 또는 main 요소를 찾을 수 없습니다");
}

// 사이드바 폴드 토글 (중복 등록 제거 — 한 번만 등록)
if (sidebarFoldButton2 && main) {
  sidebarFoldButton2.addEventListener("click", () => {
    main.classList.toggle("sidebar-folded");
  });
} else {
  console.warn("sidebarFoldButton2 또는 main 요소를 찾을 수 없습니다");
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

// --- 모바일 오버레이 클릭 이벤트  ---

const sidebarOverlay = document.querySelector(".sidebar-overlay");

if (sidebarOverlay && main) {
  sidebarOverlay.addEventListener("click", () => {
    // 사이드바가 열려있을 때만 닫기 동작 수행
    if (!main.classList.contains("sidebar-folded")) {
      main.classList.add("sidebar-folded");
    }
  });
}

// --- 화면 크기에 따른 사이드바 자동 폴딩 (이 부분을 통째로 교체) ---

const MOBILE_BREAKPOINT = 768;
let isMobileView = window.innerWidth <= MOBILE_BREAKPOINT;

const handleResize = () => {
  const currentIsMobile = window.innerWidth <= MOBILE_BREAKPOINT;

  // 뷰 상태가 변경되는 순간(PC<->모바일 전환)에만 로직 실행
  if (currentIsMobile !== isMobileView) {
    if (currentIsMobile) {
      main.classList.add("sidebar-folded");
    } else {
      main.classList.remove("sidebar-folded");
    }
    isMobileView = currentIsMobile;
  }
};

// 창 크기가 변경될 때마다 함수를 실행
window.addEventListener("resize", handleResize);

// 페이지가 처음 로드될 때 초기 상태 설정 (애니메이션 없이)
if (isMobileView) {
  main.classList.add("sidebar-folded");
} else {
  main.classList.remove("sidebar-folded");
}
