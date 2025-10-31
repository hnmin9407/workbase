// ✅ DOMContentLoaded 제거 버전 (동적 로드 대응)
console.log("✅ window-control.js 실행됨");

const minimizeBtn = document.getElementById("window-minimize");
const maximizeBtn = document.getElementById("window-maximize");
const closeBtn = document.getElementById("window-close");

if (!minimizeBtn || !maximizeBtn || !closeBtn) {
  console.warn("⚠️ window-control 버튼을 찾을 수 없습니다.");
} else {
  console.log("✅ window-control: 버튼 바인딩 시작");

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
