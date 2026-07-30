import { auth, provider } from "./firebase-config.js";

import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// =========================
// LINK APPS SCRIPT
// =========================

const GOOGLE_SHEET_API =
"https://script.google.com/macros/s/AKfycbzt6Vc0R08LChAcR_TpYZZl7QKu95jBQNQU8z8_nMQV79u-r0N5Wzwoiq8XaWR0ANu91g/exec";


// =========================
// LẤY CÁC THÀNH PHẦN HTML
// =========================

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");
const appContent = document.getElementById("app-content");


// =========================
// ĐĂNG NHẬP GOOGLE
// =========================

if (loginBtn) {

    loginBtn.addEventListener("click", async () => {

        try {

            await signInWithPopup(auth, provider);

        } catch (error) {

            console.error(error);

            alert("Đăng nhập thất bại!");

        }

    });

}



// =========================
// FIREBASE TỰ KIỂM TRA
// =========================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        if (loginSection) loginSection.style.display = "block";

        if (dashboardSection) dashboardSection.style.display = "none";

        if (appContent) appContent.style.display = "none";

        // Xóa quyền khi đăng xuất
        window.registeredLevels = [];

        return;

    }

    updateUser(user);

    await verifyStudent(user.email);

});




// =========================
// KIỂM TRA GOOGLE SHEET
// =========================

async function verifyStudent(email) {

    try {

        const response = await fetch(
            `${GOOGLE_SHEET_API}?email=${encodeURIComponent(email)}`
        );

        const data = await response.json();

        console.log(data);

        if (data.status === "APPROVED") {

            // Lưu danh sách HSK được phép học
            window.registeredLevels = data.levels || [];

            if (loginSection)
                loginSection.style.display = "none";

            if (dashboardSection)
                dashboardSection.style.display = "block";

            if (appContent)
                appContent.style.display = "none";

        }

        else if (data.status === "PENDING") {

            alert("Tài khoản đang chờ duyệt.");

            await signOut(auth);

        }

        else {

            alert("Bạn chưa được cấp quyền sử dụng website.");

            await signOut(auth);

        }

    }

    catch (error) {

        console.error(error);

        alert("Không kết nối được Google Sheet.");

    }

}



// =========================
// ĐĂNG XUẤT
// =========================

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        await signOut(auth);

    });

}



// =========================
// HIỂN THỊ THÔNG TIN
// =========================

function updateUser(user) {

    const userName = document.getElementById("user-name");

    const userEmail = document.getElementById("user-email");

    const userAvatar = document.getElementById("user-avatar");

    if (userName)
        userName.textContent = user.displayName;

    if (userEmail)
        userEmail.textContent = user.email;

    if (userAvatar && user.photoURL)
        userAvatar.src = user.photoURL;

}
