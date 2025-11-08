// --- 페이지 이동 헬퍼 함수 ---
function redirectToIndex() {
  // Electron 환경에서는 IPC를 통해 페이지 이동
  if (window.appAPI && window.appAPI.navigateToPage) {
    console.log("🔄 Electron: IPC를 통해 index 페이지로 이동");
    window.appAPI.navigateToPage("index");
  } else {
    // 웹 환경에서는 일반적인 방법 사용
    console.log("🔄 Web: window.location으로 페이지 이동");
    window.location.href = "./index.html";
  }
}

// --- 로그인 페이지로 이동 헬퍼 함수 ---
function redirectToLogin(status = null) {
  // Electron 환경에서는 IPC를 통해 페이지 이동
  if (window.appAPI && window.appAPI.navigateToPage) {
    console.log("🔄 Electron: IPC를 통해 login 페이지로 이동");
    const queryParams = status ? { status } : {};
    window.appAPI.navigateToPage("login", queryParams);
  } else {
    // 웹 환경에서는 일반적인 방법 사용
    console.log("🔄 Web: window.location으로 페이지 이동");
    const queryString = status ? `?status=${status}` : "";
    window.location.href = `./login.html${queryString}`;
  }
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

  // --- (3) [개선] 자동 로그인 기능 (렌더러 Firebase 사용) ---
  // 페이지를 먼저 보여주고 백그라운드에서 자동 로그인 확인
  (async () => {
    // 페이지가 먼저 로드되도록 약간의 지연
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      console.log("🚀 자동 로그인 확인 시작 (렌더러 Firebase 사용)...");
      
      // Firebase Auth가 준비될 때까지 대기
      let retryCount = 0;
      const maxRetries = 20; // 2초 (100ms * 20)
      
      while (!window.firebaseAuth && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retryCount++;
      }

      if (!window.firebaseAuth) {
        console.warn("⚠️ window.firebaseAuth를 찾을 수 없습니다.");
        return;
      }

      console.log("🔍 Firebase 인증 상태 확인 중 (렌더러)...");
      
      // 렌더러 프로세스의 Firebase Auth 사용 (IndexedDB 접근 가능)
      const auth = window.firebaseAuth;
      
      // onAuthStateChanged를 사용하여 인증 상태 확인
      const user = await new Promise((resolve) => {
        let isResolved = false;
        let unsubscribe = null;
        let timeout = null;
        let checkInterval = null;
        
        // 즉시 현재 사용자 확인
        const currentUser = auth.currentUser;
        if (currentUser) {
          isResolved = true;
          console.log("✅ 자동 로그인: 즉시 사용자 발견:", currentUser.uid);
          resolve({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || "",
          });
          return;
        }
        
        // 주기적으로 auth.currentUser 확인 (IndexedDB 복원 대기)
        checkInterval = setInterval(() => {
          if (isResolved) {
            clearInterval(checkInterval);
            return;
          }
          
          const user = auth.currentUser;
          if (user) {
            isResolved = true;
            if (timeout) clearTimeout(timeout);
            if (unsubscribe) unsubscribe();
            if (checkInterval) clearInterval(checkInterval);
            
            console.log("✅ 자동 로그인: 주기적 확인으로 사용자 발견:", user.uid);
            resolve({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || "",
            });
          }
        }, 100); // 100ms마다 확인
        
        // onAuthStateChanged로 인증 상태 확인
        unsubscribe = auth.onAuthStateChanged((user) => {
          if (isResolved) return;
          
          if (user) {
            isResolved = true;
            if (timeout) clearTimeout(timeout);
            if (unsubscribe) unsubscribe();
            if (checkInterval) clearInterval(checkInterval);
            
            console.log("✅ 자동 로그인: onAuthStateChanged로 사용자 발견:", user.uid);
            resolve({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || "",
            });
          }
        });
        
        // 타임아웃 (5초) - IndexedDB 복원 대기
        timeout = setTimeout(() => {
          if (isResolved) return;
          isResolved = true;
          
          if (unsubscribe) unsubscribe();
          if (checkInterval) clearInterval(checkInterval);
          
          // 최종 확인
          const finalUser = auth.currentUser;
          if (finalUser) {
            console.log("✅ 자동 로그인: 타임아웃 후 사용자 발견:", finalUser.uid);
            resolve({
              uid: finalUser.uid,
              email: finalUser.email,
              displayName: finalUser.displayName || "",
            });
          } else {
            console.log("ℹ️ 자동 로그인: 사용자 없음 (타임아웃)");
            resolve(null);
          }
        }, 5000);
      });
      
      // URL 파라미터 확인 (로그아웃/회원가입 직후인지)
      const isJustSignedUp = urlParams.get('status') === 'signedup';
      const isJustLoggedOut = urlParams.get('status') === 'loggedout';

      // user가 존재하고, 방금 로그아웃/회원가입 한 것이 아니면 자동 로그인
      if (user && !isJustSignedUp && !isJustLoggedOut) { 
        console.log("✅ 자동 로그인 성공 (렌더러):", user.uid, user.email);
        redirectToIndex();
      } else {
        if (!user) {
          console.log("ℹ️ 로그인된 사용자 없음. 로그인 페이지 표시");
        } else if (isJustSignedUp) {
          console.log("ℹ️ 회원가입 직후. 로그인 페이지 표시");
        } else if (isJustLoggedOut) {
          console.log("ℹ️ 로그아웃 직후. 로그인 페이지 표시");
        }
      }
    } catch (e) {
      console.error("❌ 자동 로그인 확인 중 예상치 못한 오류:", e);
    }
  })();
  // --- [개선 끝] ---

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
      // 렌더러 프로세스의 Firebase Auth 사용 (IndexedDB 접근 가능)
      if (window.firebaseAuth) {
        const auth = window.firebaseAuth;
        
        // Local persistence 설정
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        
        // 로그인 수행
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log("✅ 이메일 로그인 성공 (렌더러):", user.uid, user.email);
        console.log("✅ 인증 상태가 IndexedDB에 저장됨 (자동 로그인 가능)");
        
        redirectToIndex();
      } else if (window.appAPI && window.appAPI.signInWithEmail) {
        // 백업: preload.js의 appAPI 사용
        console.log("⚠️ 렌더러 Firebase 없음, preload.js API 사용");
        const result = await window.appAPI.signInWithEmail(
          email,
          password,
          rememberMe
        );
        if (result.ok) {
          console.log("✅ 이메일 로그인 성공:", result.user.uid, result.user.email);
          redirectToIndex();
        } else {
          emailInput.disabled = false;
          passwordInput.disabled = false;
          if (emailLoginButton) emailLoginButton.disabled = false;
          if (emailLoginButton)
            emailLoginButton.querySelector("span").textContent = "로그인";
          const message = getKoreanErrorMessage(result.errorCode);
          showAlert(message);
          console.error("이메일 로그인 실패:", result.errorCode, result.error);
        }
      } else {
        console.error("Firebase Auth를 사용할 수 없습니다.");
        emailInput.disabled = false;
        passwordInput.disabled = false;
        if (emailLoginButton) emailLoginButton.disabled = false;
        if (emailLoginButton)
          emailLoginButton.querySelector("span").textContent = "로그인";
        showAlert("Firebase Auth를 사용할 수 없습니다.");
      }
    } catch (e) {
      emailInput.disabled = false;
      passwordInput.disabled = false;
      if (emailLoginButton) emailLoginButton.disabled = false;
      if (emailLoginButton)
        emailLoginButton.querySelector("span").textContent = "로그인";
      const message = getKoreanErrorMessage(e.code);
      showAlert(message);
      console.error("로그인 실패:", e);
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
      // 렌더러 프로세스의 Firebase Auth 사용
      if (window.firebaseAuth) {
        const auth = window.firebaseAuth;
        
        // 회원가입 수행
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: username });
        
        console.log("✅ 회원가입 성공 (렌더러):", userCredential.user.uid);
        
        // 회원가입 후 자동 로그아웃
        await auth.signOut();
        console.log("✅ 회원가입 후 자동 로그아웃 처리됨");
        
        redirectToLogin('signedup');
      } else if (window.appAPI && window.appAPI.signUpWithEmail) {
        // 백업: preload.js의 appAPI 사용
        const result = await window.appAPI.signUpWithEmail(
          email,
          password,
          username
        );

        if (result.ok) {
          console.log("회원가입 성공:", result.user.uid);
          redirectToLogin('signedup');
        } else {
          joinEmailInput.disabled = false;
          joinPasswordInput.disabled = false;
          joinPasswordConfirmInput.disabled = false;
          joinUsernameInput.disabled = false;
          if (joinButton) joinButton.disabled = false;
          if (joinButton)
            joinButton.querySelector("span").textContent = "회원가입";
          const message = getKoreanErrorMessage(result.errorCode);
          showAlert(message);
          console.error("회원가입 실패:", result.errorCode, result.error);
          isSigningUp = false;
        }
      } else {
        console.error("Firebase Auth를 사용할 수 없습니다.");
        joinEmailInput.disabled = false;
        joinPasswordInput.disabled = false;
        joinPasswordConfirmInput.disabled = false;
        joinUsernameInput.disabled = false;
        if (joinButton) joinButton.disabled = false;
        if (joinButton)
          joinButton.querySelector("span").textContent = "회원가입";
        showAlert("Firebase Auth를 사용할 수 없습니다.");
        isSigningUp = false;
      }
    } catch (e) {
      joinEmailInput.disabled = false;
      joinPasswordInput.disabled = false;
      joinPasswordConfirmInput.disabled = false;
      joinUsernameInput.disabled = false;
      if (joinButton) joinButton.disabled = false;
      if (joinButton)
        joinButton.querySelector("span").textContent = "회원가입";
      const message = getKoreanErrorMessage(e.code);
      showAlert(message);
      console.error("회원가입 실패:", e);
      isSigningUp = false;
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
      try {
        // 렌더러 프로세스의 Firebase Auth 사용
        if (window.firebaseAuth) {
          const auth = window.firebaseAuth;
          const provider = new firebase.auth.GoogleAuthProvider();
          
          // Local persistence 설정
          await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
          
          // 구글 로그인 수행
          const result = await auth.signInWithPopup(provider);
          const user = result.user;
          
          console.log("✅ 구글 로그인 성공 (렌더러):", user.uid, user.email);
          console.log("✅ 인증 상태가 IndexedDB에 저장됨 (자동 로그인 가능)");
          
          redirectToIndex();
        } else if (window.appAPI && window.appAPI.signInWithGoogle) {
          // 백업: preload.js의 appAPI 사용
          const rememberMe = checkbox ? checkbox.classList.contains("active") : false;
          const result = await window.appAPI.signInWithGoogle(rememberMe);
          if (result.ok) {
            console.log("구글 로그인 성공:", result.user.uid);
            redirectToIndex();
          } else {
            const message = getKoreanErrorMessage(result.errorCode);
            showAlert(message);
            console.error("구글 로그인 실패:", result.errorCode, result.error);
          }
        } else {
          console.error("Firebase Auth를 사용할 수 없습니다.");
          showAlert("Firebase Auth를 사용할 수 없습니다.");
        }
      } catch (e) {
        const message = getKoreanErrorMessage(e.code) || ("구글 로그인 오류: " + e.message);
        showAlert(message);
        console.error("구글 로그인 실패:", e);
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