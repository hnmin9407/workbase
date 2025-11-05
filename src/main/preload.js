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
  browserLocalPersistence,
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
        // 👈 "안전한" 일반 객체로 반환
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
      };
      return { ok: true, user: safeUser };
    } catch (error) {
      console.error("❌ 이메일 로그인 실패:", error.code, error.message);
      // [수정] error.message 대신 errorCode: error.code를 반환
      return { ok: false, errorCode: error.code, error: error.message };
    }
  },

  // ✅ [수정] 이메일 회원가입
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

      // [수정] ❗ 복잡한 user 객체 대신 "안전한" 일반 객체로 반환
      const user = userCredential.user;
      const safeUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
      };
      return { ok: true, user: safeUser }; // 👈 수정된 부분
    } catch (error) {
      console.error("Preload: 회원가입 실패", error.code, error.message);
      // [수정] error.message 대신 errorCode: error.code를 반환
      return { ok: false, errorCode: error.code, error: error.message };
    }
  },

  // ✅ 구글 로그인
  signInWithGoogle: async (rememberMe) => {
    try {
      await setAuthPersistence(rememberMe);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // 구글 로그인은 user 객체를 그대로 반환해도 문제가 없는 경우가 많지만,
      // 일관성을 위해 safeUser로 반환하는 것이 더 안전합니다.
      const user = result.user;
      const safeUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
      };
      return { ok: true, user: safeUser };
    } catch (error) {
      return { ok: false, error: error.message };
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
