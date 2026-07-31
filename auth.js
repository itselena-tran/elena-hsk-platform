import { auth, provider } from "./firebase-config.js";

import {
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


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
// TRÁNH CLICK LIÊN TỤC
// =========================

let loggingIn = false;


// =========================
// TRÁNH VERIFY NHIỀU LẦN
// =========================

let verifiedEmail = null;


// =========================
// PHÁT HIỆN IN-APP BROWSER
// =========================

function detectInAppBrowser() {

    const ua = navigator.userAgent || "";

    const patterns = [

        { key: "FBAN|FBAV|FB_IAB", label: "Facebook" },

        { key: "Messenger", label: "Messenger" },

        { key: "Instagram", label: "Instagram" },

        { key: "Line/", label: "Line" },

        { key: "MicroMessenger", label: "Zalo/WeChat" },

        { key: "TikTok|musical_ly|BytedanceWebview", label: "TikTok" }

    ];

    for (const p of patterns) {

        if (new RegExp(p.key, "i").test(ua))
            return p.label;

    }

    const isIOS =
        /iP(hone|od|ad)/.test(ua);

    if (
        isIOS &&
        !/Safari/.test(ua) &&
        /AppleWebKit/.test(ua)
    ) {

        return "ứng dụng khác";

    }

    return null;

}


// =========================
// HIỂN THỊ CẢNH BÁO
// =========================

function showInAppBrowserWarning(appLabel) {

    if (!loginSection)
        return;

    if (document.getElementById("iab-warning"))
        return;

    const box =
        loginSection.querySelector(".login-box");

    if (!box)
        return;

    const warning =
        document.createElement("div");

    warning.id = "iab-warning";

    warning.style.cssText =
        "margin-top:16px;padding:14px;border-radius:10px;background:#fdecea;" +
        "border:1px solid #f5c6cb;color:#922b21;font-size:13px;line-height:1.5;text-align:left;";

    warning.innerHTML =
        `⚠️ Bạn đang mở website trong <b>${appLabel}</b>.<br><br>` +
        `Google không hỗ trợ đăng nhập trong trình duyệt tích hợp của ứng dụng này.<br><br>` +
        `Hãy chọn <b>Mở bằng trình duyệt</b> rồi sử dụng Chrome hoặc Safari.`;

    box.appendChild(warning);

    if (loginBtn) {

        loginBtn.disabled = true;

        loginBtn.style.opacity = "0.5";

        loginBtn.style.cursor = "not-allowed";

    }

}

const inAppBrowserLabel =
detectInAppBrowser();

if (inAppBrowserLabel) {

    showInAppBrowserWarning(
        inAppBrowserLabel
    );

}


// =========================
// ĐĂNG NHẬP
// =========================

if (loginBtn) {

    loginBtn.addEventListener(
        "click",
        async () => {

            if (loggingIn)
                return;

            if (inAppBrowserLabel) {

                alert(
                    `Không thể đăng nhập Google trong ${inAppBrowserLabel}.\n\n` +
                    `Hãy mở website bằng Chrome hoặc Safari.`
                );

                return;

            }

            loggingIn = true;

            loginBtn.disabled = true;

            try {

                await signInWithPopup(
                    auth,
                    provider
                );

            }

            catch (error) {

                console.error(error);

                const msg =
                    String(
                        error?.message ||
                        error?.code ||
                        ""
                    );

                if (
                    /missing.?initial.?state/i.test(msg)
                ) {

                    alert(
                        "Không thể hoàn tất đăng nhập.\n\nNếu bạn đang dùng iPhone, hãy thử Safari."
                    );

                }

                else if (
                    /storage.?partition/i.test(msg)
                ) {

                    alert(
                        "Trình duyệt hiện tại đang chặn bộ nhớ tạm."
                    );

                }

                else if (
                    error.code ===
                    "auth/popup-blocked"
                ) {

                    alert(
                        "Popup đã bị trình duyệt chặn."
                    );

                }

                else if (
                    error.code ===
                    "auth/popup-closed-by-user"
                ) {

                }

                else if (
                    error.code ===
                    "auth/cancelled-popup-request"
                ) {

                }

                else {

                    alert(
                        "Đăng nhập thất bại.\n\nVui lòng thử lại."
                    );

                }

            }

            finally {

                loggingIn = false;

                loginBtn.disabled = false;

            }

        }

    );

}


// =========================
// FIREBASE
// =========================

onAuthStateChanged(

    auth,

    async (user) => {

        if (!user) {

            verifiedEmail = null;

            window.registeredLevels = [];

            if (loginSection)
                loginSection.style.display = "block";

            if (dashboardSection)
                dashboardSection.style.display = "none";

            if (appContent)
                appContent.style.display = "none";

            return;

        }

        updateUser(user);

        if (
            verifiedEmail === user.email
        ) {

            return;

        }

        verifiedEmail = user.email;

        await verifyStudent(user.email);

    }

);
// =========================
// KIỂM TRA GOOGLE SHEET
// =========================

async function verifyStudent(email) {

    try {

        const response = await fetch(
            `${GOOGLE_SHEET_API}?email=${encodeURIComponent(email)}`,
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!response.ok) {

            throw new Error("HTTP " + response.status);

        }

        const data = await response.json();

        console.log("Google Sheet:", data);

        if (data.status === "APPROVED") {

            window.registeredLevels = data.levels || [];

            if (loginSection)
                loginSection.style.display = "none";

            if (dashboardSection)
                dashboardSection.style.display = "block";

            if (appContent)
                appContent.style.display = "none";

            return;

        }

        if (data.status === "PENDING") {

            alert("Tài khoản của bạn đang chờ quản trị viên phê duyệt.");

        }

        else {

            alert("Bạn chưa được cấp quyền sử dụng website.");

        }

        verifiedEmail = null;

        await signOut(auth);

    }

    catch (error) {

        console.error("Google Sheet Error:", error);

        verifiedEmail = null;

        alert(
            "Không thể kết nối tới hệ thống kiểm tra tài khoản.\n\nVui lòng thử lại sau."
        );

        try {

            await signOut(auth);

        }

        catch (e) {

            console.error(e);

        }

    }

}


// =========================
// ĐĂNG XUẤT
// =========================

if (logoutBtn) {

    logoutBtn.addEventListener(

        "click",

        async () => {

            try {

                verifiedEmail = null;

                window.registeredLevels = [];

                await signOut(auth);

            }

            catch (error) {

                console.error(error);

                alert("Đăng xuất không thành công.");

            }

        }

    );

}



// =========================
// HIỂN THỊ THÔNG TIN NGƯỜI DÙNG
// =========================

function updateUser(user) {

    const userName =
        document.getElementById("user-name");

    const userEmail =
        document.getElementById("user-email");

    const userAvatar =
        document.getElementById("user-avatar");


    if (userName) {

        userName.textContent =
            user.displayName || "";

    }


    if (userEmail) {

        userEmail.textContent =
            user.email || "";

    }


    if (userAvatar && user.photoURL) {

        userAvatar.src =
            user.photoURL;

    }

}
