const GOOGLE_SHEET_API = "https://script.google.com/macros/library/d/1lVDNsvhUqXvCR2HnzVikfCrVHYwMgYgyUWOU0KTfRuMnnYtiuF3jfUaP/1";

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
        console.log("Đăng nhập Google thành công:", result.user);
        const userEmail = result.user.email;
        verifyStudentWithSheet(userEmail);
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
      localStorage.removeItem("hsk_user_email");
      if (loginSection) loginSection.style.display = "block";
      if (appContent) appContent.style.display = "none";
    });
  });
}

// 3. Theo dõi trạng thái đăng nhập (Bảo vệ nội dung website khi F5/Mở trang)
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Nếu học sinh đã đăng nhập Google -> Tiếp tục check xem email có trong Google Sheet không
    verifyStudentWithSheet(user.email);
    updateUserProfile(user);
  } else {
    // Chưa đăng nhập Google -> Khóa nội dung học
    if (loginSection) loginSection.style.display = "block";
    if (appContent) appContent.style.display = "none";
  }
});

// 4. Hiển thị thông tin tên và email học sinh
function updateUserProfile(user) {
  const userNameEl = document.getElementById("user-name");
  const userEmailEl = document.getElementById("user-email");
  const userAvatarEl = document.getElementById("user-avatar");

  if (userNameEl) userNameEl.textContent = user.displayName || "Học sinh";
  if (userEmailEl) userEmailEl.textContent = user.email;
  if (userAvatarEl && user.photoURL) userAvatarEl.src = user.photoURL;
}

// 5. Hàm gửi Email lên Google Sheet để kiểm tra quyền truy cập
async function verifyStudentWithSheet(userEmail) {
  try {
    const res = await fetch(`${GOOGLE_SHEET_API}?email=${encodeURIComponent(userEmail)}`);
    const data = await res.json();

    if (data.status === "APPROVED") {
      // ✅ Đã duyệt -> Mở khóa web cho vào học
      localStorage.setItem("hsk_user_email", userEmail);
      if (loginSection) loginSection.style.display = "none";
      if (appContent) appContent.style.display = "block";

      const gateEl = document.getElementById("gate");
      if (gateEl) gateEl.style.display = "none";

    } else if (data.status === "PENDING") {
      // ⏳ Có trong sheet nhưng chưa ghi "Đã duyệt"
      alert("Tài khoản của bạn đang chờ duyệt. Vui lòng liên hệ lại sau nhé!");
      signOut(auth); // Đăng xuất ra luôn
    } else {
      // ❌ Không có email trong sheet
      alert(`Email (${userEmail}) chưa được cấp quyền truy cập. Vui lòng liên hệ để đăng ký học!`);
      signOut(auth); // Đăng xuất ra luôn
    }
  } catch (error) {
    console.error("Lỗi kiểm tra Google Sheet:", error);
    alert("Có lỗi kết nối hệ thống kiểm tra tài khoản!");
  }
}
