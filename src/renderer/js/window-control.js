// ✅ DOMContentLoaded 제거 버전 (동적 로드 대응)
console.log("✅ window-control.js 실행됨");

// --- [수정] Electron 창 제어 기능 ---
// appAPI와 windowControl이 모두 존재할 때만 이 블록을 실행
if (window.appAPI && window.appAPI.windowControl) {
  console.log("✅ window-control: Electron API 감지. 버튼 바인딩 시작.");

  const minimizeBtn = document.getElementById("window-minimize");
  const maximizeBtn = document.getElementById("window-maximize");
  const closeBtn = document.getElementById("window-close");

  if (!minimizeBtn || !maximizeBtn || !closeBtn) {
    console.warn("⚠️ window-control 버튼을 찾을 수 없습니다.");
  } else {
    minimizeBtn.addEventListener("click", () => {
      console.log("🟡 minimize clicked");
      window.appAPI.windowControl.send("minimize");
    });

    maximizeBtn.addEventListener("click", () => {
      console.log("🟢 maximize clicked");
      window.appAPI.windowControl.send("maximize");
    });

    closeBtn.addEventListener("click", () => {
      console.log("🔴 close clicked");
      window.appAPI.windowControl.send("close");
    });

    window.appAPI.windowControl.onStateChange((isMaximized) => {
      console.log("🔁 window state changed:", isMaximized);
      const icon = document.querySelector("#window-maximize svg use");
      if (icon)
        icon.setAttribute(
          "href",
          isMaximized ? "#icon-maximize-2" : "#icon-maximize"
        );
    });
  }
} else {
  // 웹 미리보기 환경일 경우
  console.log("ℹ️ window-control: Electron API 없음. 창 제어 버튼을 건너뜁니다.");
}
// --- [수정] 창 제어 기능 끝 ---


// --- 🌑 다크 모드 토글 기능 ---
// 이 코드는 appAPI와 관련이 없으므로, 위 코드의 실행 여부와 관계없이 항상 실행됩니다.
console.log("✅ window-control: 다크 모드 바인딩 시작");

const modeToggleButton = document.getElementById("mode-toggle-button");
const modeToggleIcon = modeToggleButton
  ? modeToggleButton.querySelector("svg use")
  : null;
const htmlElement = document.documentElement; // <html> 태그

if (!modeToggleButton || !modeToggleIcon) {
  console.warn("⚠️ mode-toggle-button 또는 아이콘을 찾을 수 없습니다.");
} else {
  // 1. 페이지 로드 시 현재 테마에 맞는 아이콘으로 즉시 설정
  //    (HTML의 <head> 스크립트가 이미 테마를 설정함)
  const currentTheme = htmlElement.dataset.theme;
  if (currentTheme === "dark") {
    modeToggleIcon.setAttribute("href", "#icon-light-mode");
  } else {
    modeToggleIcon.setAttribute("href", "#icon-dark-mode");
  }

  // 2. 클릭 이벤트 리스너 추가
  modeToggleButton.addEventListener("click", () => {
    // <html>의 data-theme 속성을 확인
    const isDarkMode = htmlElement.dataset.theme === "dark";

    if (isDarkMode) {
      // 다크 -> 라이트 모드로 변경
      htmlElement.dataset.theme = "light";
      modeToggleIcon.setAttribute("href", "#icon-dark-mode");
      localStorage.setItem("theme", "light"); // 선택 저장
      console.log("🟡 테마 변경: Light Mode");
    } else {
      // 라이트 -> 다크 모드로 변경
      htmlElement.dataset.theme = "dark";
      modeToggleIcon.setAttribute("href", "#icon-light-mode");
      localStorage.setItem("theme", "dark"); // 선택 저장
      console.log("🌑 테마 변경: Dark Mode");
    }
  });
}