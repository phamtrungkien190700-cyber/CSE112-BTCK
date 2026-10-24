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

  function setFieldError(form, name, text) {
    const input = form.elements.namedItem(name);
    const message = form.querySelector(`[data-field-error="${name}"]`);
    if (!input || !message) return;
    message.textContent = text;
    message.hidden = !text;
    if (text) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function clearFieldErrors(form) {
    form.querySelectorAll("[data-field-error]").forEach((message) => {
      setFieldError(form, message.dataset.fieldError, "");
    });
  }

  function validateRegistration(form, details) {
    clearFieldErrors(form);
    let firstInvalid = null;
    const reject = (name, message) => {
      setFieldError(form, name, message);
      firstInvalid ||= form.elements.namedItem(name);
    };
    const name = String(details.name || "").trim().replace(/\s+/g, " ");
    const identity = String(details.identity || "").trim();
    const password = String(details.password || "");

    if (name.length < 2 || name.length > 100) reject("name", "Họ tên cần có từ 2 đến 100 ký tự.");
    if (!/^(?:[^\s@]+@[^\s@]+\.[^\s@]{2,}|(?:\+84|0)(?:3|5|7|8|9)\d{8})$/.test(identity)) {
      reject("identity", "Nhập email hợp lệ hoặc số điện thoại Việt Nam.");
    }
    if (password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      reject("password", "Mật khẩu cần có 8–128 ký tự, gồm ít nhất một chữ cái và một chữ số.");
    }
    if (password !== details["confirm-password"]) {
      reject("confirm-password", "Mật khẩu xác nhận không khớp.");
    }
    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }
    return true;
  }

  function fieldForServerError(form, message) {
    if (/họ tên/i.test(message)) return ["name", message];
    if (/email|số điện thoại|đã được đăng ký/i.test(message)) return ["identity", message];
    if (/mật khẩu/i.test(message)) return ["password", message];
    return null;
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
    clearFieldErrors(form);
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    showMessage(form, action === "login" ? "Đang kiểm tra thông tin..." : "Đang tạo tài khoản...", "pending");
    try {
      const details = Object.fromEntries(new FormData(form).entries());
      if (action === "register" && !validateRegistration(form, details)) {
        showMessage(form, "Vui lòng kiểm tra các trường được đánh dấu.");
        return;
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
      const fieldError = fieldForServerError(form, error.message || "");
      if (fieldError) setFieldError(form, fieldError[0], fieldError[1]);
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

  document.querySelectorAll("[data-field-error]").forEach((message) => {
    const input = message.closest(".field")?.querySelector("input, select, textarea");
    input?.addEventListener("input", () => {
      setFieldError(message.closest("form"), message.dataset.fieldError, "");
    });
  });

  if (loginSwitch) loginSwitch.addEventListener("click", () => showMode("login"));
  if (registerSwitch) registerSwitch.addEventListener("click", () => showMode("register"));
  if (loginForm && registerForm) {
    showMode(new URLSearchParams(window.location.search).get("mode"));
  }
})();
