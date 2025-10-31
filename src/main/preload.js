// ✅ preload.js (통합버전)
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
  browserLocalPersistence,
  onAuthStateChanged,
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
const setAuthPersistence = (rememberMe) => {
  const persistence = rememberMe
    ? browserLocalPersistence
    : browserSessionPersistence;
  return setPersistence(auth, persistence);
};

// --- contextBridge API 노출 ---
contextBridge.exposeInMainWorld("appAPI", {
  // ✅ HTML 파일 읽기
  loadHTML: (relativePath) => ipcRenderer.invoke("read-file", relativePath),

  // ✅ 이메일 로그인
  signInWithEmail: async (email, password, rememberMe) => {
    try {
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
        emailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous,
        tenantId: user.tenantId || null,
      };
      return { ok: true, user: safeUser };
    } catch (error) {
      console.error("❌ 이메일 로그인 실패:", error);
      return { ok: false, error: error.message };
    }
  },

  // ✅ 구글 로그인
  signInWithGoogle: async (rememberMe) => {
    try {
      await setAuthPersistence(rememberMe);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return { ok: true, user: result.user };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  },

  // ✅ 로그인 상태 감시
  onAuthStateChange: (callback) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const safeUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || "",
          emailVerified: user.emailVerified,
          isAnonymous: user.isAnonymous,
        };
        callback(safeUser);
      } else {
        callback(null);
      }
    });
  },

  // ✅ 🔽 추가: Electron 윈도우 제어 기능
  windowControl: {
    send: (action) => ipcRenderer.send("window-control", action),
    onStateChange: (callback) =>
      ipcRenderer.on("window-state", (e, state) => callback(state)),
  },
});

console.log("windowControl API exposed:", !!ipcRenderer);
