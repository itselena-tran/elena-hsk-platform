// =========================
// FIREBASE CONFIG
// =========================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAVbnYruosyvlkHYwvmve59RjPLolvRVsg",
    authDomain: "itselena-hsk.firebaseapp.com",
    projectId: "itselena-hsk",
    storageBucket: "itselena-hsk.firebasestorage.app",
    messagingSenderId: "422292479641",
    appId: "1:422292479641:web:4432c1710553959059a208",
    measurementId: "G-PZGVDTWGFP"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Authentication
const auth = getAuth(app);

// Lưu phiên đăng nhập trên trình duyệt
await setPersistence(auth, browserLocalPersistence);

// Google Provider
const provider = new GoogleAuthProvider();

// Luôn hiện danh sách tài khoản Google
provider.setCustomParameters({
    prompt: "select_account"
});

export {
    auth,
    provider
};
