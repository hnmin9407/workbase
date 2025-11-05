// ✅ preload.js (수정된 통합버전)
console.log("✅ preload.js 실행됨. 경로:", __filename);

const { contextBridge, ipcRenderer } = require("electron");
const { initializeApp } = require("firebase/app");
const {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence, // 👈 (필수)
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} = require("firebase/auth");
const { getFirestore } = require("firebase/firestore");

// --- Firebase 설정 ---
const firebaseConfig = {
  apiKey: "AIzaSyCwkXiJRp1DHoiv1IWnR42Y9xI5IE0_2uE",
  authDomain: "workbear-aaecb.firebaseapp.com",
  databaseURL:
    "https://workbear-aaecb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "workbear-aaecb",
  storageBucket: "workbear-aaecb.firebasestorage.app",
  messagingSenderId: "744723448261",
  appId: "1:744723448261:web:897a77a06e481f3c750bac",
};

// --- Firebase 초기화 ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("🔥 Firebase 초기화 완료 (preload.js)");

// --- 로그인 상태 유지 헬퍼 함수 ---
// [수정] 헬퍼 함수를 먼저 선언
const setAuthPersistence = (rememberMe) => {
  const persistence = rememberMe
    ? browserLocalPersistence
    : browserSessionPersistence;
  return setPersistence(auth, persistence);
};

// --- 앱 로드 시 즉시 'local'로 영구 저장 설정 ---
// [수정] 중복 선언이 아닌, 즉시 실행 코드로 변경
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("🔥 Firebase 영구 저장소(local) 설정 완료.");
  })
  .catch((error) => {
    console.error("❌ Firebase 영구 저장소 설정 실패:", error);
  });
// --- [수정 끝] ---

// --- contextBridge API 노출 ---
contextBridge.exposeInMainWorld("appAPI", {
  // ✅ HTML 파일 읽기
  loadHTML: (relativePath) => ipcRenderer.invoke("read-file", relativePath),

  // ✅ 이메일 로그인
  signInWithEmail: async (email, password, rememberMe) => {
    try {
      // 헬퍼 함수를 호출하여 'local' 또는 'session'으로 설정
      await setAuthPersistence(rememberMe);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
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

  // ✅ 이메일 회원가입
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

      await signOut(auth);
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

  // ✅ 구글 로그인
  signInWithGoogle: async (rememberMe) => {
    try {
      await setAuthPersistence(rememberMe);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
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

  // ✅ 로그아웃
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

  // ✅ 자동 로그인을 위한 1회성 검사
  getCurrentUser: () => {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe();
          if (user) {
            const safeUser = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || "",
            };
            resolve(safeUser);
          } else {
            resolve(null);
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  },

  // ✅ 로그인 상태 감시 (index.html에서 사용)
  onAuthStateChange: (callback) => {
    onAuthStateChanged(auth, (user) => {
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

  // ✅ Electron 윈도우 제어 기능
  windowControl: {
    send: (action) => ipcRenderer.send("window-control", action),
    onStateChange: (callback) =>
      ipcRenderer.on("window-state", (e, state) => callback(state)),
  },
});

console.log("windowControl API exposed:", !!ipcRenderer);
