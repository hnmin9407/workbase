const { contextBridge, ipcRenderer } = require("electron");
const { 
    initializeApp 
} = require("firebase/app");
const {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    updateProfile,
    signOut,
} = require("firebase/auth");
const { getFirestore } = require("firebase/firestore");

// Firebase 설정 (환경 변수나 별도 config 파일로 관리하는 것이 더 안전합니다)
const firebaseConfig = {
  apiKey: "AIzaSyCwkXiJRp1DHoiv1IWnR42Y9xI5IE0_2uE",
  authDomain: "workbear-aaecb.firebaseapp.com",
  databaseURL:
    "https://workbear-aaecb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "workbear-aaecb",
  storageBucket: "workbear-aaecb.appspot.com",
  messagingSenderId: "744723448261",
  appId: "1:744723448261:web:897a77a06e481f3c750bac",

};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("🔥 Firebase가 preload.js에서 초기화되었습니다.");

// --- Firebase Auth 기본 persistence 설정 (Electron 환경에서 필수) ---
// Electron에서는 기본적으로 local persistence를 사용하여 앱 재시작 후에도 로그인 상태 유지
(async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log("✅ Firebase Auth persistence가 local로 설정되었습니다.");
  } catch (error) {
    console.error("❌ Firebase Auth persistence 설정 실패:", error);
  }
})();

// --- 로그인 상태 유지 헬퍼 함수 ---
// 참고: Electron에서는 기본적으로 local persistence를 사용하므로,
// 이 함수는 사용자가 명시적으로 session persistence를 원할 때만 사용
const setAuthPersistence = async (rememberMe) => {
  try {
    // rememberMe가 true이면 local, false이면 session
    // 하지만 Electron에서는 일반적으로 local을 유지하는 것이 좋음
    const persistence = rememberMe
      ? browserLocalPersistence
      : browserSessionPersistence;
    await setPersistence(auth, persistence);
    console.log(`✅ Firebase Auth persistence가 ${rememberMe ? 'local' : 'session'}로 설정되었습니다.`);
    return true;
  } catch (error) {
    console.error("❌ Firebase Auth persistence 변경 실패:", error);
    // persistence 변경 실패 시에도 로그인은 계속 진행
    return false;
  }
};

// --- contextBridge API 노출 ---
// 이 코드는 즉시 실행되어 window.appAPI를 설정합니다.
try {
  contextBridge.exposeInMainWorld("appAPI", {
    // --- 인증 관련 ---
    
    // 이메일 로그인
    signInWithEmail: async (email, password, rememberMe) => {
      try {
        console.log("🔐 이메일 로그인 시도:", email, "rememberMe:", rememberMe);
        
        // ⚠️ 중요: Electron에서는 항상 local persistence를 사용해야 함
        // setPersistence는 로그인 전에 호출되어야 하며, 성공해야 함
        try {
          // 항상 local persistence로 설정 (Electron에서 자동 로그인을 위해 필수)
          await setPersistence(auth, browserLocalPersistence);
          console.log("✅ Local persistence로 설정됨 (자동 로그인 활성화)");
        } catch (persistenceError) {
          console.error("❌ Local persistence 설정 실패:", persistenceError);
          // persistence 설정 실패 시에도 로그인은 시도 (하지만 자동 로그인이 작동하지 않을 수 있음)
        }
        
        // 로그인 수행
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        
        console.log("✅ 로그인 성공:", user.uid, user.email);
        
        // 로그인 성공 후 인증 상태가 제대로 설정되고 저장되었는지 확인
        // Electron에서 IndexedDB에 저장되는데 시간이 걸릴 수 있음
        let verificationAttempts = 0;
        const maxVerificationAttempts = 10;
        
        while (verificationAttempts < maxVerificationAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const currentUser = auth.currentUser;
          if (currentUser && currentUser.uid === user.uid) {
            console.log("✅ 인증 상태 확인됨:", currentUser.uid);
            console.log("✅ 인증 상태가 IndexedDB에 저장됨 (자동 로그인 가능)");
            break;
          }
          
          verificationAttempts++;
          if (verificationAttempts >= maxVerificationAttempts) {
            console.warn("⚠️ 인증 상태 확인 실패 (하지만 로그인은 성공)");
            console.warn("⚠️ auth.currentUser:", auth.currentUser ? auth.currentUser.uid : "null");
            console.warn("⚠️ 자동 로그인이 작동하지 않을 수 있습니다.");
          }
        }
        
        const safeUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || "",
        };
        return { ok: true, user: safeUser };
      } catch (error) {
        console.error("❌ 이메일 로그인 실패:", error.code, error.message);
        return { ok: false, errorCode: error.code, error: error.message };
      }
    },

    // 이메일 회원가입
    signUpWithEmail: async (email, password, username) => {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await updateProfile(userCredential.user, {
          displayName: username,
        });
        console.log("Preload: 회원가입 성공", userCredential.user.uid);
        await signOut(auth); // 회원가입 후 자동 로그아웃
        console.log("Preload: 회원가입 후 자동 로그아웃 처리됨");
        const user = userCredential.user;
        const safeUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || "",
        };
        return { ok: true, user: safeUser };
      } catch (error) {
        console.error("Preload: 회원가입 실패", error.code, error.message);
        return { ok: false, errorCode: error.code, error: error.message };
      }
    },

    // 구글 로그인 (팝업)
    signInWithGoogle: async (rememberMe) => {
      try {
        console.log("🔐 구글 로그인 시도:", "rememberMe:", rememberMe);
        
        // Electron에서는 항상 local persistence 사용
        try {
          await setPersistence(auth, browserLocalPersistence);
          console.log("✅ Local persistence로 설정됨 (자동 로그인 활성화)");
        } catch (persistenceError) {
          console.error("❌ Local persistence 설정 실패:", persistenceError);
        }
        
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        console.log("✅ 구글 로그인 성공:", user.uid, user.email);
        
        // 인증 상태 저장 확인
        await new Promise(resolve => setTimeout(resolve, 200));
        if (auth.currentUser && auth.currentUser.uid === user.uid) {
          console.log("✅ 인증 상태가 IndexedDB에 저장됨 (자동 로그인 가능)");
        }
        
        const safeUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || "",
        };
        return { ok: true, user: safeUser };
      } catch (error) {
        console.error("❌ 구글 로그인 실패:", error.code, error.message);
        return { ok: false, errorCode: error.code, error: error.message };
      }
    },

    // 로그아웃
    signOut: async () => {
      try {
        await signOut(auth);
        console.log("Preload: 로그아웃 성공");
        return { ok: true };
      } catch (error) {
        console.error("Preload: 로그아웃 실패", error.code, error.message);
        return { ok: false, errorCode: error.code, error: error.message };
      }
    },

    // 현재 사용자 정보 가져오기 (비동기, 개선됨)
    getCurrentUser: () => {
      return new Promise((resolve, reject) => {
        console.log("🔍 getCurrentUser: 인증 상태 확인 시작");
        
        // Firebase Auth가 이미 초기화되어 있다면 바로 확인
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log("✅ getCurrentUser: 현재 사용자 발견 (즉시 반환):", currentUser.uid);
          const safeUser = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || "",
          };
          resolve(safeUser);
          return;
        }

        console.log("⏳ getCurrentUser: 인증 상태 복원 대기 중...");
        
        // Electron에서 IndexedDB를 통한 인증 상태 복원은 시간이 걸릴 수 있음
        // onAuthStateChanged는 초기 상태를 확인할 때 즉시 호출되지만,
        // persistence에서 복원하는 동안은 null일 수 있음
        let timeout;
        let checkInterval;
        let isResolved = false;
        let authStateReceived = false;
        
        // 주기적으로 auth.currentUser 확인 (IndexedDB 복원이 완료되면 즉시 감지)
        // Electron에서 IndexedDB 복원은 비동기로 이루어지므로 주기적 확인 필요
        checkInterval = setInterval(() => {
          if (isResolved) {
            clearInterval(checkInterval);
            return;
          }
          
          const user = auth.currentUser;
          if (user) {
            // 사용자가 발견되면 즉시 반환
            isResolved = true;
            clearInterval(checkInterval);
            if (timeout) clearTimeout(timeout);
            if (typeof unsubscribe === 'function') unsubscribe();
            
            console.log("✅ getCurrentUser: 주기적 확인으로 사용자 발견:", user.uid, user.email);
            const safeUser = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || "",
            };
            resolve(safeUser);
          }
        }, 100); // 100ms마다 확인
        
        const unsubscribe = onAuthStateChanged(
          auth,
          (user) => {
            authStateReceived = true;
            
            if (isResolved) return;
            
            // onAuthStateChanged는 초기 상태 확인 시 즉시 호출되지만,
            // Electron의 IndexedDB에서 복원 중일 수 있으므로 여러 번 확인
            const checkUser = () => {
              if (isResolved) return;
              
              // auth.currentUser를 우선 확인 (가장 최신 상태)
              const currentUser = auth.currentUser;
              const finalUser = currentUser || user;
              
              if (finalUser) {
                isResolved = true;
                if (timeout) clearTimeout(timeout);
                if (checkInterval) clearInterval(checkInterval);
                unsubscribe();
                
                console.log("✅ getCurrentUser: 사용자 인증 상태 복원됨:", finalUser.uid, finalUser.email);
                const safeUser = {
                  uid: finalUser.uid,
                  email: finalUser.email,
                  displayName: finalUser.displayName || "",
                };
                resolve(safeUser);
              } else {
                // 사용자가 없으면 주기적 확인이 계속 실행됨
                console.log("ℹ️ getCurrentUser: 사용자 없음 (주기적 확인 계속)");
              }
            };
            
            // 즉시 확인
            checkUser();
            
            // 추가 확인 (IndexedDB 복원 대기)
            setTimeout(checkUser, 100);
            setTimeout(checkUser, 300);
            setTimeout(checkUser, 500);
          },
          (error) => {
            if (isResolved) return;
            isResolved = true;
            
            if (timeout) clearTimeout(timeout);
            if (checkInterval) clearInterval(checkInterval);
            unsubscribe();
            console.error("❌ getCurrentUser 오류:", error);
            reject(error);
          }
        );

        // 최대 10초 동안 대기 (타임아웃)
        // Electron의 IndexedDB 복원은 시간이 걸릴 수 있으므로 충분한 시간 제공
        // 특히 앱 재시작 직후에는 더 오래 걸릴 수 있음
        timeout = setTimeout(() => {
          if (isResolved) return;
          
          // 타임아웃 시에도 주기적 확인이 계속 실행되도록 함
          // 최종적으로 사용자가 없으면 null 반환
          setTimeout(() => {
            if (isResolved) return;
            isResolved = true;
            
            if (checkInterval) clearInterval(checkInterval);
            if (typeof unsubscribe === 'function') unsubscribe();
            
            // 최종 확인
            const finalUser = auth.currentUser;
            if (finalUser) {
              console.log("✅ getCurrentUser: 타임아웃 후 최종 확인으로 사용자 발견:", finalUser.uid);
              const safeUser = {
                uid: finalUser.uid,
                email: finalUser.email,
                displayName: finalUser.displayName || "",
              };
              resolve(safeUser);
            } else {
              console.log("ℹ️ getCurrentUser: 타임아웃 (10초) - 로그인된 사용자 없음");
              console.log("ℹ️ IndexedDB에서 인증 상태를 복원하지 못했습니다.");
              resolve(null);
            }
          }, 1000); // 타임아웃 후 1초 더 대기
        }, 10000); // 10초로 증가 (IndexedDB 복원 시간 확보)
      });
    },

    // 실시간 인증 상태 변경 감지 (구독형)
    onAuthStateChanged: (callback) => {
      return onAuthStateChanged(auth, (user) => {
        if (user) {
          const safeUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "",
          };
          callback(safeUser);
        } else {
          callback(null);
        }
      });
    },

    // --- 창 제어 ---
    windowControl: {
      send: (action) => ipcRenderer.send("window-control", action),
      onStateChange: (callback) =>
        ipcRenderer.on("window-state", (event, state) => callback(state)),
    },

    // --- 페이지 네비게이션 ---
    navigateToPage: (page, queryParams = {}) => {
      console.log("🔄 페이지 이동 요청:", page, queryParams);
      ipcRenderer.send("navigate-to-page", page, queryParams);
    },

    // --- 파일 시스템 (예시) ---
    loadHTML: (relativePath) => ipcRenderer.invoke("read-file", relativePath),
  });

  console.log("✅ contextBridge API가 성공적으로 노출되었습니다.");
} catch (error) {
  console.error("❌ contextBridge API 노출 실패:", error);
}