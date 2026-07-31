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
// PHÁT HIỆN TRÌNH DUYỆT TRONG APP (IN-APP BROWSER)
// Messenger, Facebook, Instagram, TikTok, Zalo, Line... đều
// chặn hoặc phân vùng sessionStorage/cookie bên thứ ba, khiến
// đăng nhập Google báo lỗi "missing initial state". Google
// cũng chủ động không cho đăng nhập từ các WebView này.
// =========================

function detectInAppBrowser() {
  const ua = navigator.userAgent || "";
  const patterns = [
    { key: "FBAN|FBAV|FB_IAB", label: "Facebook" },
    { key: "Messenger", label: "Messenger" },
    { key: "Instagram", label: "Instagram" },
    { key: "Line/", label: "Line" },
    { key: "MicroMessenger", label: "Zalo/WeChat" },
    { key: "TikTok|musical_ly|BytedanceWebview", label: "TikTok" },
  ];
  for (const p of patterns) {
    if (new RegExp(p.key, "i").test(ua)) return p.label;
  }
  // iOS WebView không phải Safari thật (thiếu "Safari" trong UA)
  const isIOS = /iP(hone|od|ad)/.test(ua);
  if (isIOS && !/Safari/.test(ua) && /AppleWebKit/.test(ua)) return "ứng dụng khác";
  return null;
}

function showInAppBrowserWarning(appLabel) {
  if (!loginSection || document.getElementById("iab-warning")) return;

  const box = loginSection.querySelector(".login-box");
  if (!box) return;

  const warning = document.createElement("div");
  warning.id = "iab-warning";
  warning.style.cssText =
    "margin-top:16px;padding:14px;border-radius:10px;background:#fdecea;" +
    "border:1px solid #f5c6cb;color:#922b21;font-size:13px;line-height:1.5;text-align:left;";
  warning.innerHTML =
    `⚠️ Bạn đang mở link này trong <b>${appLabel}</b>. Đăng nhập Google sẽ <b>không hoạt động</b> ở đây.<br><br>` +
    `Vui lòng bấm biểu tượng <b>"⋮" hoặc "•••"</b> ở góc màn hình, chọn <b>"Mở bằng trình duyệt" / "Open in Browser"</b>, ` +
    `rồi đăng nhập lại bằng Chrome hoặc Safari.`;

  box.appendChild(warning);

  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.style.opacity = "0.5";
    loginBtn.style.cursor = "not-allowed";
  }
}

const inAppBrowserLabel = detectInAppBrowser();
if (inAppBrowserLabel) {
  showInAppBrowserWarning(inAppBrowserLabel);
}


// =========================
// ĐĂNG NHẬP GOOGLE
// =========================

if (loginBtn) {

    loginBtn.addEventListener("click", async () => {

        if (inAppBrowserLabel) {
            alert(
                `Không thể đăng nhập Google trong ${inAppBrowserLabel}.\n\n` +
                `Vui lòng mở link này bằng Chrome hoặc Safari (bấm "⋮"/"•••" rồi chọn "Mở bằng trình duyệt").`
            );
            return;
        }

        try {

            await signInWithPopup(auth, provider);

        } catch (error) {

            console.error(error);

            const msg = String(error && (error.message || error.code) || "");

            if (/missing.?initial.?state/i.test(msg) || /storage.?partition/i.test(msg)) {
                alert(
                    "Không thể đăng nhập do trình duyệt hiện tại chặn bộ nhớ tạm (sessionStorage).\n\n" +
                    "Đây thường xảy ra khi mở link từ Messenger, Facebook, Instagram, Zalo... " +
                    "Vui lòng mở link này bằng Chrome hoặc Safari rồi thử lại."
                );
            } else if (error && error.code === "auth/popup-blocked") {
                alert("Trình duyệt đã chặn cửa sổ đăng nhập. Vui lòng cho phép popup rồi thử lại.");
            } else if (error && error.code === "auth/cancelled-popup-request") {
                // Người dùng bấm nút nhiều lần / mở popup khác trước đó — bỏ qua, không cần alert.
            } else if (error && error.code === "auth/popup-closed-by-user") {
                // Người dùng tự đóng popup — không cần alert.
            } else {
                alert("Đăng nhập thất bại! Vui lòng thử lại hoặc dùng trình duyệt Chrome/Safari.");
            }

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
