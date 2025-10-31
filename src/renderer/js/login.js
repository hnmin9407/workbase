// ../js/login.js 파일의 전체 내용

// --- 페이지 이동 헬퍼 함수 ---
function redirectToIndex() {

  window.location.href = './index.html'; 
}

// --- UI 요소에 이벤트 리스너 연결 ---
// DOM(HTML)이 모두 로드된 후에 스크립트를 실행합니다.
document.addEventListener('DOMContentLoaded', () => {

  // (1) 자동 로그인 기능
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
      console.error('appAPI가 정의되지 않았습니다.');
    }
  } catch (e) {
    console.error('appAPI.onAuthStateChange 호출 실패:', e);
  }

  // --- (2) UI 요소 선택 ---
  const autoLoginButton = document.querySelector('.autologin-button');
  const checkbox = autoLoginButton.querySelector('.checkbox');

  const emailInput = document.querySelector('.login-input .login');
  const passwordInput = document.querySelector('.login-input .password');

  const emailLoginButton = document.querySelector('.login-button');
  const googleLoginButton = document.querySelector('.google-login-button');

  // (3) '로그인 상태 유지' 체크박스 UI 토글
  autoLoginButton.addEventListener('click', () => {
    // 이 코드가 CSS의 .active 클래스를 제어합니다.
    checkbox.classList.toggle('active');
  });

  // (4) 이메일/비밀번호 로그인 버튼 클릭
  emailLoginButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    const rememberMe = checkbox.classList.contains('active');

    if (!email || !password) {
      alert('아이디(이메일)와 비밀번호를 입력해주세요.');
      return;
    }

    try {
      const result = await window.appAPI.signInWithEmail(email, password, rememberMe);
      if (result.ok) {
        console.log('이메일 로그인 성공:', result.user.uid);
        redirectToIndex(); 
      } else {
        alert('로그인 실패: ' + result.error);
        console.error('이메일 로그인 실패:', result.error);
      }
    } catch (e) {
      console.error("appAPI.signInWithEmail 호출 실패:", e);
    }
  });

  // (5) 구글 로그인 버튼 클릭
  googleLoginButton.addEventListener('click', async () => {
    const rememberMe = checkbox.classList.contains('active');

    try {
      const result = await window.appAPI.signInWithGoogle(rememberMe);
      if (result.ok) {
        console.log('구글 로그인 성공:', result.user.uid);
        redirectToIndex(); 
      } else {
        alert('구글 로그인 실패: ' + result.error);
        console.error('구글 로그인 실패:', result.error);
      }
    } catch (e) {
      console.error("appAPI.signInWithGoogle 호출 실패:", e);
    }
  });
  
}); // DOMContentLoaded 끝