"use strict";

(function () {
  const loginForm = document.querySelector('[data-auth="login"]');
  const registerForm = document.querySelector('[data-auth="register"]');
  const forgotForm = document.querySelector('[data-auth="forgot"]');
  const title = document.querySelector("[data-auth-title]");
  const intro = document.querySelector("[data-auth-intro]");
  const loginSwitch = document.querySelector("[data-show-login]");
  const registerSwitch = document.querySelector("[data-show-register]");
  let redirecting = false;

  function showMessage(form, text, state = "error") {
    const message = form.querySelector("[data-form-message]");
    message.textContent = text;
    message.dataset.state = state;
  }

  function showMode(mode) {
    const isRegister = mode === "register";
    loginForm.hidden = isRegister;
    registerForm.hidden = !isRegister;
    title.textContent = isRegister ? "Tạo tài khoản" : "Đăng nhập";
    intro.textContent = isRegister
      ? "Tạo tài khoản để đồng hành cùng LegalPath."
      : "Chào mừng bạn trở lại với LegalPath.";
    if (loginSwitch) loginSwitch.hidden = isRegister;
    if (registerSwitch) registerSwitch.hidden = !isRegister;
    const url = new URL(window.location.href);
    if (isRegister) url.searchParams.set("mode", "register");
    else url.searchParams.delete("mode");
    window.history.replaceState({}, "", url);
  }

  function destinationFor(role) {
    if (role === "admin") return "/pages/admin/mainadmin/index.html";
    if (role === "legal_expert") return "/pages/expert/expert-article-management.html";
    return "/pages/user/mainnguoidung/mainnguoidung.html";
  }

  function roleMatchesPath(role, path) {
    if (role === "admin") return true;
    if (role === "legal_expert") return path.startsWith("/pages/expert/");
    return path.startsWith("/pages/user/");
  }

  async function authenticate(form, action) {
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    showMessage(form, action === "login" ? "Đang kiểm tra thông tin..." : "Đang tạo tài khoản...", "pending");
    try {
      const details = Object.fromEntries(new FormData(form).entries());
      if (action === "register" && details.password !== details["confirm-password"]) {
        throw new Error("Mật khẩu xác nhận không khớp.");
      }
      const result = action === "login"
        ? await window.LegalPathAPI.login(details)
        : await window.LegalPathAPI.register(details);
      showMessage(form, `Thành công. Xin chào ${result.user.name}! Đang chuyển trang...`, "success");
      redirecting = true;
      window.setTimeout(() => {
        const returnUrl = new URLSearchParams(window.location.search).get("returnUrl");
        const safeReturnUrl = returnUrl
          && returnUrl.startsWith("/")
          && !returnUrl.startsWith("//")
          && roleMatchesPath(result.user.role, returnUrl)
          ? returnUrl
          : destinationFor(result.user.role);
        window.location.assign(safeReturnUrl);
      }, 500);
    } catch (error) {
      showMessage(form, error.message || "Không thể kết nối đến máy chủ.", "error");
    } finally {
      if (!redirecting) button.disabled = false;
    }
  }

  document.querySelectorAll(".toggle-password").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = toggle.parentElement.querySelector("input");
      const visible = input.type === "password";
      input.type = visible ? "text" : "password";
      toggle.setAttribute("aria-pressed", String(visible));
      toggle.setAttribute("aria-label", visible ? "Ẩn mật khẩu" : "Hiện mật khẩu");
    });
  });

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      authenticate(loginForm, "login");
    });
  }
  if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      authenticate(registerForm, "register");
    });
  }
  if (forgotForm) {
    forgotForm.addEventListener("submit", (event) => {
      event.preventDefault();
      showMessage(forgotForm, "Chức năng gửi hướng dẫn khôi phục mật khẩu chưa được tích hợp.", "pending");
    });
  }

  if (loginSwitch) loginSwitch.addEventListener("click", () => showMode("login"));
  if (registerSwitch) registerSwitch.addEventListener("click", () => showMode("register"));
  if (loginForm && registerForm) {
    showMode(new URLSearchParams(window.location.search).get("mode"));
  }
})();
