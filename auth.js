import { auth, provider } from "./firebase-config.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Nút Đăng nhập & Đăng xuất trên giao diện HTML
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const appContent = document.getElementById("app-content");
const loginSection = document.getElementById("login-section");

// 1. Xử lý sự kiện bấm nút Đăng nhập bằng Google
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        console.log("Đăng nhập thành công:", result.user);
      })
      .catch((error) => {
        console.error("Lỗi đăng nhập:", error);
        alert("Đăng nhập thất bại, vui lòng thử lại!");
      });
  });
}

// 2. Xử lý sự kiện Đăng xuất
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
      console.log("Đã đăng xuất");
    });
  });
}

// 3. Theo dõi trạng thái đăng nhập (Bảo vệ nội dung website)
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Học sinh ĐÃ đăng nhập
    if (loginSection) loginSection.style.display = "none";
    if (appContent) appContent.style.display = "block";
    
    // Cập nhật thông tin học sinh (Bước 2.5)
    updateUserProfile(user);
  } else {
    // Học sinh CHƯA đăng nhập -> Khóa nội dung học
    if (loginSection) loginSection.style.display = "block";
    if (appContent) appContent.style.display = "none";
  }
});

// 2.5 Hiển thị tên và email học sinh
function updateUserProfile(user) {
  const userNameEl = document.getElementById("user-name");
  const userEmailEl = document.getElementById("user-email");
  const userAvatarEl = document.getElementById("user-avatar");

  if (userNameEl) userNameEl.textContent = user.displayName || "Học sinh";
  if (userEmailEl) userEmailEl.textContent = user.email;
  if (userAvatarEl && user.photoURL) userAvatarEl.src = user.photoURL;
}
