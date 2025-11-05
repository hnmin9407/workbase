// --- 페이지 이동 헬퍼 함수 ---
function redirectToIndex() {
  window.location.href = "./index.html";
}

// --- UI 요소에 이벤트 리스너 연결 ---
document.addEventListener("DOMContentLoaded", () => {
  // --- (A) 공통 요소 선택 ---
  const errorPopup = document.getElementById("alert-popup");
  const errorMessage = document.getElementById("alert-message");
  const checkPopup = document.getElementById("check-popup");
  const checkMessage = document.getElementById("check-message");
  let errorTimer = null;
  let checkTimer = null;
  let isSigningUp = false;

  // --- (B) 폼 화면(Wrapper) 선택 ---
  const loginWrap = document.querySelector(".login-wrap");
  const joinWrap = document.querySelector(".join-wrap");
  const rightContainer = document.querySelector(".login-container .right");

  // --- (C) 로그인 폼 요소 선택 ---
  const loginForm = loginWrap ? loginWrap.querySelector(".login-form") : null;
  const emailInput = document.getElementById("userid");
  const passwordInput = document.getElementById("userpw");
  const emailLoginButton = document.getElementById("login-button");
  const autoLoginButton = document.querySelector(".autologin-button");
  const checkbox = autoLoginButton
    ? autoLoginButton.querySelector(".checkbox")
    : null;
  const googleLoginButton = document.querySelector(".google-login-button");

  // --- (D) 회원가입 폼 요소 선택 ---
  const joinForm = joinWrap ? joinWrap.querySelector(".login-form") : null;
  const joinEmailInput = document.getElementById("join-userid");
  const joinPasswordInput = document.getElementById("join-userpw");
  const joinPasswordConfirmInput = document.getElementById(
    "join-userpw-confirm"
  );
  const joinUsernameInput = document.getElementById("join-username");
  const joinButton = document.getElementById("join-button");
  const backToLoginButton = document.getElementById("backto-login-button");

  // --- (E) 폼 전환 버튼 선택 ---
  const gotoJoinButton = document.getElementById("goto-join-button");

  // --- (1) 알림창 표시 함수 (타입 분기) ---
  function showAlert(message, type = "error") {
    let container, messageEl, timer;
    if (type === "check") {
      container = checkPopup;
      messageEl = checkMessage;
      if (checkTimer) clearTimeout(checkTimer);
    } else {
      container = errorPopup;
      messageEl = errorMessage;
      if (errorTimer) clearTimeout(errorTimer);
    }
    if (!container || !messageEl) return;
    messageEl.textContent = message;
    container.classList.add("show");
    const newTimer = setTimeout(() => {
      container.classList.remove("show");
      if (type === "check") checkTimer = null;
      else errorTimer = null;
    }, 2000);
    if (type === "check") checkTimer = newTimer;
    else errorTimer = newTimer;
  }
  if (errorPopup) {
    errorPopup.addEventListener("click", () => {
      if (errorTimer) clearTimeout(errorTimer);
      errorPopup.classList.remove("show");
      errorTimer = null;
    });
  }
  if (checkPopup) {
    checkPopup.addEventListener("click", () => {
      if (checkTimer) clearTimeout(checkTimer);
      checkPopup.classList.remove("show");
      checkTimer = null;
    });
  }
  // ---

  // --- 페이지 로드 시 상태 확인 ---
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("status") === "loggedout") {
    showAlert("로그아웃 되었습니다.", "check");
  }
  if (urlParams.get("status") === "signedup") {
    showAlert("회원가입에 성공했습니다. 로그인해 주세요.", "check");
  }
  // ---

  // --- (2) 폼 화면 전환 로직 ---
  if (rightContainer && loginWrap && joinWrap) {
    loginWrap.style.display = "flex";
    joinWrap.style.display = "none";
    if (backToLoginButton) {
      backToLoginButton.addEventListener("click", (e) => {
        e.preventDefault();
        rightContainer.classList.remove("show-join");
      });
    }
    if (gotoJoinButton) {
      gotoJoinButton.addEventListener("click", (e) => {
        e.preventDefault();
        rightContainer.classList.add("show-join");
      });
    }
  }
  // ---

  // --- (3) [수정] 자동 로그인 기능 (비동기 1회성 확인) ---
  (async () => {
    try {
      if (window.appAPI && window.appAPI.getCurrentUser) {
        // 1. preload.js의 새 함수를 호출하고 응답을 기다림
        const user = await window.appAPI.getCurrentUser();

        // 2. URL 파라미터 확인 (로그아웃/회원가입 직후인지)
        const isJustSignedUp = urlParams.get("status") === "signedup";
        const isJustLoggedOut = urlParams.get("status") === "loggedout";

        // 3. user가 존재하고, 방금 로그아웃/회원가입 한 것이 아니면 자동 로그인
        if (user && !isJustSignedUp && !isJustLoggedOut) {
          console.log("자동 로그인:", user.uid);
          redirectToIndex();
        } else {
          // 4. user가 없거나, 로그아웃/회원가입 직후면 로그인 페이지 표시
          console.log("로그인 페이지 표시 (자동 로그인 없음)");
          // (만약 로딩 스피너가 있다면 여기서 숨김)
          // document.getElementById('loading-spinner').style.display = 'none';
        }
      } else {
        console.warn(
          "appAPI.getCurrentUser가 없습니다. (웹 테스트 환경이거나 preload.js 오류)"
        );
      }
    } catch (e) {
      console.error("자동 로그인 확인 중 오류:", e);
      // (오류 발생 시에도 로그인 폼은 보여야 함)
    }
  })(); // 👈 즉시 실행 함수
  // --- [수정 끝] ---

  // --- (4) '로그인 상태 유지' 체크박스 UI 토글 ---
  if (autoLoginButton) {
    autoLoginButton.addEventListener("click", () => {
      checkbox.classList.toggle("active");
    });
  }
  // ---

  // --- (5) 이메일/비밀번호 "로그인" 처리 ---
  const handleEmailLogin = async () => {
    emailInput.disabled = true;
    passwordInput.disabled = true;
    if (emailLoginButton) emailLoginButton.disabled = true;
    if (emailLoginButton)
      emailLoginButton.querySelector("span").textContent = "로그인 중..."; // '로그인.' -> '로그인 중...'

    const email = emailInput.value;
    const password = passwordInput.value;
    const rememberMe = checkbox ? checkbox.classList.contains("active") : false;

    if (!email || !password) {
      emailInput.disabled = false;
      passwordInput.disabled = false;
      if (emailLoginButton) emailLoginButton.disabled = false;
      if (emailLoginButton)
        emailLoginButton.querySelector("span").textContent = "로그인";
      showAlert("아이디 또는 비밀번호를 확인해 주세요.");
      return;
    }
    try {
      if (window.appAPI && window.appAPI.signInWithEmail) {
        // --- 1. Electron 환경 ---
        const result = await window.appAPI.signInWithEmail(
          email,
          password,
          rememberMe
        );
        if (result.ok) {
          console.log("이메일 로그인 성공:", result.user.uid);
          redirectToIndex();
        } else {
          emailInput.disabled = false;
          passwordInput.disabled = false;
          if (emailLoginButton) emailLoginButton.disabled = false;
          if (emailLoginButton)
            emailLoginButton.querySelector("span").textContent = "로그인";
          const message = getKoreanErrorMessage(result.errorCode); // 한글 오류
          showAlert(message);
          console.error("이메일 로그인 실패:", result.errorCode, result.error);
        }
      } else {
        // --- 2. Web 환경 (API 없음) ---
        console.error("appAPI.signInWithEmail not found.");
        emailInput.disabled = false;
        passwordInput.disabled = false;
        if (emailLoginButton) emailLoginButton.disabled = false;
        if (emailLoginButton)
          emailLoginButton.querySelector("span").textContent = "로그인";
        showAlert("appAPI가 없습니다. Electron 환경에서 실행해주세요.");
      }
    } catch (e) {
      emailInput.disabled = false;
      passwordInput.disabled = false;
      if (emailLoginButton) emailLoginButton.disabled = false;
      if (emailLoginButton)
        emailLoginButton.querySelector("span").textContent = "로그인";
      const message = getKoreanErrorMessage(e.code); // 한글 오류
      showAlert(message);
      console.error("appAPI.signInWithEmail 호출 실패:", e);
    }
  };
  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handleEmailLogin();
    });
  }
  // ---

  // --- (6) 이메일/비밀번호 "회원가입" 처리 ---
  const handleEmailSignUp = async () => {
    isSigningUp = true; // 👈 자동 로그인 방지 플래그 설정
    joinEmailInput.disabled = true;
    joinPasswordInput.disabled = true;
    joinPasswordConfirmInput.disabled = true;
    joinUsernameInput.disabled = true;
    if (joinButton) joinButton.disabled = true;
    if (joinButton)
      joinButton.querySelector("span").textContent = "회원가입 중..."; // '로그인.' -> '로그인 중...'

    const email = joinEmailInput.value;
    const password = joinPasswordInput.value;
    const passwordConfirm = joinPasswordConfirmInput.value;
    const username = joinUsernameInput.value;

    if (!email || !password || !passwordConfirm || !username) {
      showAlert("모든 항목을 입력해주세요.");
      // (활성화 로직...)
      joinEmailInput.disabled = false;
      joinPasswordInput.disabled = false;
      joinPasswordConfirmInput.disabled = false;
      joinUsernameInput.disabled = false;
      if (joinButton) joinButton.disabled = false;
      if (joinButton) joinButton.querySelector("span").textContent = "회원가입";
      isSigningUp = false; // 👈 플래그 해제
      return;
    }

    if (password !== passwordConfirm) {
      showAlert("비밀번호가 일치하지 않습니다.");
      // (활성화 로직...)
      joinEmailInput.disabled = false;
      joinPasswordInput.disabled = false;
      joinPasswordConfirmInput.disabled = false;
      joinUsernameInput.disabled = false;
      if (joinButton) joinButton.disabled = false;
      if (joinButton) joinButton.querySelector("span").textContent = "회원가입";
      isSigningUp = false; // 👈 플래그 해제
      return;
    }

    try {
      if (window.appAPI && window.appAPI.signUpWithEmail) {
        // --- 1. Electron 환경 (preload.js의 API 호출) ---
        const result = await window.appAPI.signUpWithEmail(
          email,
          password,
          username
        );

        if (result.ok) {
          console.log("회원가입 성공:", result.user.uid);
          window.location.href = "./login.html?status=signedup";
          // (페이지가 리로드되므로 isSigningUp 플래그 해제 불필요)
        } else {
          // (Electron API 실패 시 활성화 로직)
          joinEmailInput.disabled = false;
          joinPasswordInput.disabled = false;
          joinPasswordConfirmInput.disabled = false;
          joinUsernameInput.disabled = false;
          if (joinButton) joinButton.disabled = false;
          if (joinButton)
            joinButton.querySelector("span").textContent = "회원가입";
          const message = getKoreanErrorMessage(result.errorCode); // 한글 오류
          showAlert(message);
          console.error("회원가입 실패:", result.errorCode, result.error);
          isSigningUp = false; // 👈 플래그 해제
        }
      } else {
        // --- 2. Web 환경 (API 없음) ---
        console.error("appAPI.signUpWithEmail not found.");
        joinEmailInput.disabled = false;
        joinPasswordInput.disabled = false;
        joinPasswordConfirmInput.disabled = false;
        joinUsernameInput.disabled = false;
        if (joinButton) joinButton.disabled = false;
        if (joinButton)
          joinButton.querySelector("span").textContent = "회원가입";
        showAlert("appAPI가 없습니다. Electron 환경에서 실행해주세요.");
        isSigningUp = false; // 👈 플래그 해제
      }
    } catch (e) {
      // (전체 오류 발생 시 활성화 로직)
      joinEmailInput.disabled = false;
      joinPasswordInput.disabled = false;
      joinPasswordConfirmInput.disabled = false;
      joinUsernameInput.disabled = false;
      if (joinButton) joinButton.disabled = false;
      if (joinButton) joinButton.querySelector("span").textContent = "회원가입";
      const message = getKoreanErrorMessage(e.code); // 한글 오류
      showAlert(message);
      console.error("appAPI.signUpWithEmail 호출 실패:", e);
      isSigningUp = false; // 👈 플래그 해제
    }
  };
  if (joinForm) {
    joinForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handleEmailSignUp();
    });
  }
  // ---

  // --- (7) 구글 로그인 버튼 클릭 ---
  if (googleLoginButton) {
    googleLoginButton.addEventListener("click", async () => {
      if (window.appAPI && window.appAPI.signInWithGoogle) {
        const rememberMe = checkbox
          ? checkbox.classList.contains("active")
          : false;
        try {
          const result = await window.appAPI.signInWithGoogle(rememberMe);
          if (result.ok) {
            console.log("구글 로그인 성공:", result.user.uid);
            redirectToIndex();
          } else {
            const message = getKoreanErrorMessage(result.errorCode); // 한글 오류
            showAlert(message);
            console.error("구글 로그인 실패:", result.errorCode, result.error);
          }
        } catch (e) {
          showAlert("구글 로그인 오류: " + e.message);
          console.error("appAPI.signInWithGoogle 호출 실패:", e);
        }
      } else {
        console.error("appAPI.signInWithGoogle not found.");
        showAlert("appAPI가 없습니다. Electron 환경에서 실행해주세요.");
      }
    });
  } else {
    console.warn(".google-login-button 요소를 찾을 수 없습니다.");
  }
  // ---

  // --- (8) 비밀번호 보기/숨기기 기능 (모든 버튼 대응) ---
  const allPwToggles = document.querySelectorAll(".pw-toggle-icon");
  allPwToggles.forEach((button) => {
    const wrapper = button.closest(".input-field-wrapper");
    const input = wrapper ? wrapper.querySelector("input") : null;
    const icon = button.querySelector("use");
    if (input && icon) {
      input.addEventListener("input", () => {
        if (input.value.length > 0) {
          button.style.display = "inline-block";
        } else {
          button.style.display = "none";
        }
      });
      button.addEventListener("click", () => {
        if (input.type === "password") {
          input.type = "text";
          icon.setAttribute("href", "#icon-view-eye");
        } else {
          input.type = "password";
          icon.setAttribute("href", "#icon-hidden-eye");
        }
      });
    }
  });

  // --- (9) [신규] Firebase 오류 코드 -> 한글 번역기 ---
  function getKoreanErrorMessage(errorCode) {
    switch (errorCode) {
      // --- 로그인 실패 ---
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "아이디 또는 비밀번호를 확인해 주세요.";

      // --- 회원가입 실패 ---
      case "auth/email-already-in-use":
        return "이미 사용 중인 이메일입니다.";
      case "auth/weak-password":
        return "비밀번호는 6자리 이상이어야 합니다.";
      case "auth/invalid-email":
        return "올바른 이메일 형식이 아닙니다.";

      // --- 공통 오류 ---
      case "auth/network-request-failed":
        return "네트워크 연결을 확인해 주세요.";
      case "auth/too-many-requests":
        return "잠시 후 다시 시도해 주세요.";

      // --- 기타 ---
      default:
        console.warn("알 수 없는 오류 코드:", errorCode);
        return "알 수 없는 오류가 발생했습니다.";
    }
  }
  // ---
}); // DOMContentLoaded 끝
