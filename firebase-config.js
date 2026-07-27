// Khởi tạo SDK Firebase (Sử dụng CDN dạng Module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Thay thế các thông tin bên dưới bằng firebaseConfig thu được ở Bước 2.1
const firebaseConfig = {
  apiKey: "AIzaSyAVbnYruosyvlkHYwvmve59RjPLolvRVsg",
  authDomain: "itselena-hsk.firebaseapp.com",
  projectId: "itselena-hsk",
  storageBucket: "itselena-hsk.firebasestorage.app",
  messagingSenderId: "422292479641",
  appId: "1:422292479641:web:4432c1710553959059a208",
  measurementId: "G-PZGVDTWGFP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
