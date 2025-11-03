// --- 페이지 이동 헬퍼 함수 ---
function redirectToIndex() {
  window.location.href = './index.html';
}

// --- UI 요소에 이벤트 리스너 연결 ---
document.addEventListener('DOMContentLoaded', () => {
  // (1) 자동 로그인 기능 (이 코드는 이미 appAPI를 확인하므로 안전합니다)
  try {
    if (window.appAPI && window.appAPI.onAuthStateChange) {
      window.appAPI.onAuthStateChange((user) => {
        if (user) {
          console.log('이미 로그인된 사용자입니다:', user.uid);
          redirectToIndex();
        } else {
          console.log('로그아웃 상태입니다. 로그인 페이지 표시.');
        }
      });
    } else {
      // [수정] 웹 환경일 때 콘솔 로그 변경
      console.info('appAPI가 없습니다. (웹 테스트 환경)');
    }
  } catch (e) {
    console.error('appAPI.onAuthStateChange 호출 실패:', e);
  }

  // --- (2) UI 요소 선택 ---
  const autoLoginButton = document.querySelector('.autologin-button');
  const checkbox = autoLoginButton
    ? autoLoginButton.querySelector('.checkbox')
    : null;

  const emailInput = document.getElementById('userid');
  const passwordInput = document.getElementById('userpw');

  const googleLoginButton = document.querySelector('.google-login-button');
  const loginForm = document.querySelector('.login-form');
  const emailLoginButton = document.getElementById('login-button');

  // macOS 알림창 요소 선택
  const AlertContainer = document.getElementById('alert-popup');
  const AlertMessage = document.getElementById('alert-message');
  let alertTimer = null;

  // --- macOS 알림창 표시 함수 ---
  function showAlert(message) {
    if (!AlertContainer || !AlertMessage) return;
    if (alertTimer) {
      clearTimeout(alertTimer);
    }
    AlertMessage.textContent = message;
    AlertContainer.classList.add('show');
    alertTimer = setTimeout(() => {
      AlertContainer.classList.remove('show');
      alertTimer = null;
    }, 2000);
  }
  // ---

  // --- 알림창 클릭 시 수동으로 닫기 ---
  if (AlertContainer) {
    AlertContainer.addEventListener('click', () => {
      if (alertTimer) {
        clearTimeout(alertTimer);
        alertTimer = null;
      }
      AlertContainer.classList.remove('show');
    });
  }
  // ---

  // --- (3) '로그인 상태 유지' 체크박스 UI 토글 ---
  if (autoLoginButton) {
    autoLoginButton.addEventListener('click', () => {
      checkbox.classList.toggle('active');
    });
  } else {
    console.warn('.autologin-button 요소를 찾을 수 없습니다.');
  }

  // --- (4) 이메일/비밀번호 로그인 처리 ---
  const handleEmailLogin = async () => {
    // [A-1. 비활성화] UI 요소 비활성화
    emailInput.disabled = true;
    passwordInput.disabled = true;
    if (emailLoginButton) emailLoginButton.disabled = true;
    if (emailLoginButton)
      emailLoginButton.querySelector('span').textContent = '로그인.';

    const email = emailInput.value;
    const password = passwordInput.value;
    const rememberMe = checkbox ? checkbox.classList.contains('active') : false;

    if (!email || !password) {
      // [B-1. 활성화] 유효성 검사 실패 시 다시 활성화
      emailInput.disabled = false;
      passwordInput.disabled = false;
      if (emailLoginButton) emailLoginButton.disabled = false;
      if (emailLoginButton)
        emailLoginButton.querySelector('span').textContent = '로그인';
      showAlert('아이디 또는 비밀번호를 확인해 주세요.');
      return;
    }

    try {
      // [수정] window.appAPI가 있는지 확인
      if (window.appAPI && window.appAPI.signInWithEmail) {
        // --- 1. Electron 환경일 때 (기존 코드) ---
        const result = await window.appAPI.signInWithEmail(
          email,
          password,
          rememberMe
        );
        if (result.ok) {
          console.log('이메일 로그인 성공:', result.user.uid);
          redirectToIndex();
        } else {
          // [B-2. 활성화] 로그인 실패 시 다시 활성화
          emailInput.disabled = false;
          passwordInput.disabled = false;
          if (emailLoginButton) emailLoginButton.disabled = false;
          if (emailLoginButton)
            emailLoginButton.querySelector('span').textContent = '로그인';
          showAlert('아이디 또는 비밀번호를 확인해 주세요.');
          console.error('이메일 로그인 실패:', result.error);
        }
      } else {
        // --- 2. [추가] 웹 테스트 환경일 때 (Mock 로그인) ---
        console.warn('WEB 테스트: appAPI 없음. 1초 후 가상 로그인합니다.');
        // 1초간 '로그인.' 메시지를 보여주기 위한 가상 딜레이
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // (선택) 웹 테스트 시 특정 아이디/비번을 강제할 수 있습니다.
        // if (email === "test@test.com" && password === "1234") {
        console.log('WEB 테스트: 가상 로그인 성공.');
        redirectToIndex();
        // } else {
        //   console.log('WEB 테스트: 가상 로그인 실패.');
        //   emailInput.disabled = false;
        //   passwordInput.disabled = false;
        //   if (emailLoginButton) emailLoginButton.disabled = false;
        //   if (emailLoginButton)
        //     emailLoginButton.querySelector('span').textContent = '로그인';
        //   showAlert('WEB 테스트: 아이디/비번 불일치');
        // }
      }
    } catch (e) {
      // [B-3. 활성화] API 오류 발생 시 다시 활성화
      emailInput.disabled = false;
      passwordInput.disabled = false;
      if (emailLoginButton) emailLoginButton.disabled = false;
      if (emailLoginButton)
        emailLoginButton.querySelector('span').textContent = '로그인';
      showAlert('아이디 또는 비밀번호를 확인해 주세요.');
      console.error('appAPI.signInWithEmail 호출 실패:', e);
    }
  };

  // --- (5) 구글 로그인 버튼 클릭 ---
  if (googleLoginButton) {
    googleLoginButton.addEventListener('click', async () => {
      const rememberMe = checkbox ? checkbox.classList.contains('active') : false;

      try {
        // [수정] window.appAPI가 있는지 확인
        if (window.appAPI && window.appAPI.signInWithGoogle) {
          // --- 1. Electron 환경일 때 (기존 코드) ---
          const result = await window.appAPI.signInWithGoogle(rememberMe);
          if (result.ok) {
            console.log('구글 로그인 성공:', result.user.uid);
            redirectToIndex();
          } else {
            showAlert('구글 로그인 실패: ' + result.error);
            console.error('구글 로그인 실패:', result.error);
          }
        } else {
          // --- 2. [추가] 웹 테스트 환경일 때 (Mock 로그인) ---
          console.warn('WEB 테스트: appAPI 없음. 1초 후 가상 구글 로그인합니다.');
          await new Promise((resolve) => setTimeout(resolve, 1000));
          console.log('WEB 테스트: 가상 구글 로그인 성공.');
          redirectToIndex();
        }
      } catch (e) {
        showAlert('구글 로그인 오류: ' + e.message);
        console.error('appAPI.signInWithGoogle 호출 실패:', e);
      }
    });
  } else {
    console.warn('.google-login-button 요소를 찾을 수 없습니다.');
  }

  // --- 폼 제출(엔터 키 또는 버튼 클릭)로 로그인 ---
  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      handleEmailLogin();
    });
  } else {
    console.warn('.login-form 요소를 찾을 수 없습니다.');
  }

  // --- 비밀번호 보기/숨기기 기능 ---
  const pwToggleBtn = document.getElementById('pw-toggle-button');
  const pwToggleIcon = pwToggleBtn ? pwToggleBtn.querySelector('use') : null;

  if (passwordInput && pwToggleBtn && pwToggleIcon) {
    passwordInput.addEventListener('input', () => {
      if (passwordInput.value.length > 0) {
        pwToggleBtn.style.display = 'inline-block';
      } else {
        pwToggleBtn.style.display = 'none';
      }
    });

    pwToggleBtn.addEventListener('click', () => {
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        pwToggleIcon.setAttribute('href', '#icon-view-eye');
      } else {
        passwordInput.type = 'password';
        pwToggleIcon.setAttribute('href', '#icon-hidden-eye');
      }
    });
  } else {
    if (!passwordInput)
      console.error('비밀번호 input(#userpw)을 찾을 수 없습니다.');
    if (!pwToggleBtn)
      console.warn('비밀번호 토글 버튼(#pw-toggle-button)을 찾을 수 없습니다.');
    if (pwToggleBtn && !pwToggleIcon)
      console.warn('#pw-toggle-button 안에 <use> 태그를 찾을 수 없습니다.');
  }
}); // DOMContentLoaded 끝