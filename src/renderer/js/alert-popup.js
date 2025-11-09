// alert-popup.js

let activeAlertTimer = null;

/**
 * 화면 우측 하단에 알림 팝업을 표시합니다.
 * @param {string} message - 표시할 메시지
 * @param {'error' | 'check'} type - 팝업 종류 ('error' 또는 'check')
 */
function showAlert(message, type = "error") {
  // 1. 기존 타이머가 있으면 취소
  if (activeAlertTimer) {
    clearTimeout(activeAlertTimer);
    activeAlertTimer = null;
  }

  // 2. 팝업 요소들을 찾음
  const container = document.getElementById("alert-popup");
  const messageEl = document.getElementById("alert-message");
  const iconWrapper = document.getElementById("alert-icon-wrapper");
  const iconUse = document.getElementById("alert-icon-use");

  if (!container || !messageEl || !iconWrapper || !iconUse) {
    console.warn("showAlert: 필수 팝업 요소를 찾을 수 없습니다.");
    return;
  }

  // 3. 팝업이 이미 보이는 경우, 먼저 닫기 애니메이션 실행
  const isAlreadyVisible = container.classList.contains("show");
  if (isAlreadyVisible) {
    container.classList.remove("show");
  }

  // 4. 새 팝업 내용 설정 및 표시
  // (이미 보이는 경우, 닫히는 애니메이션과 겹치지 않도록 짧은 지연)
  const showNewAlert = () => {
    // 아이콘과 색상 설정
    iconWrapper.className = `alert-icon-wrapper ${type}`; // 클래스 교체
    iconUse.setAttribute(
      "href",
      type === "check" ? "#icon-check" : "#icon-caution"
    );

    // 메시지 설정 및 표시
    messageEl.textContent = message;
    container.classList.add("show");

    // 2초 후 자동 닫기 타이머 설정
    activeAlertTimer = setTimeout(() => {
      container.classList.remove("show");
      activeAlertTimer = null;
    }, 2000);
  };

  setTimeout(showNewAlert, isAlreadyVisible ? 150 : 0);
}

/**
 * 모든 알림 팝업에 클릭하여 닫는 기능을 초기화합니다.
 */
function initAlertPopups() {
  const popup = document.getElementById("alert-popup");
  if (popup) {
    popup.addEventListener("click", () => {
      if (activeAlertTimer) clearTimeout(activeAlertTimer);
      popup.classList.remove("show");
      activeAlertTimer = null;
    });
  }
}
