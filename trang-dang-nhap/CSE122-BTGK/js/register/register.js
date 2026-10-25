const form = document.querySelector('[data-auth="register"]');
const message = form.querySelector("[data-form-message]");
const identityInput = form.elements.identity;
const nameInput = form.elements.name;
const passwordInput = form.elements.password;
const confirmInput = form.elements["confirm-password"];
let redirecting = false;

function validateName() {
  const name = nameInput.value.trim().replace(/\s+/g, " ");
  nameInput.setCustomValidity(
    /^[\p{L}][\p{L}\p{M}'’ .-]{1,99}$/u.test(name)
      ? ""
      : "Nhập họ tên hợp lệ, gồm ít nhất 2 ký tự chữ."
  );
}

function isValidIdentity(value) {
  const identity = value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const phonePattern = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;
  return emailPattern.test(identity) || phonePattern.test(identity);
}

function validateIdentity() {
  identityInput.setCustomValidity(
    isValidIdentity(identityInput.value) ? "" : "Nhập email hợp lệ hoặc số điện thoại Việt Nam gồm 10 số."
  );
}

function validatePasswordMatch() {
  confirmInput.setCustomValidity(
    confirmInput.value === passwordInput.value ? "" : "Mật khẩu xác nhận không khớp."
  );
}

function validatePassword() {
  passwordInput.setCustomValidity(
    /[A-Za-z]/.test(passwordInput.value) && /\d/.test(passwordInput.value)
      ? ""
      : "Mật khẩu cần có ít nhất một chữ cái và một chữ số."
  );
  validatePasswordMatch();
}

function setMessage(text, state = "error") {
  message.textContent = text;
  message.dataset.state = state;
}

identityInput.addEventListener("input", validateIdentity);
nameInput.addEventListener("input", validateName);
passwordInput.addEventListener("input", validatePassword);
confirmInput.addEventListener("input", validatePasswordMatch);

form.querySelectorAll(".toggle-password").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const input = toggle.parentElement.querySelector("input");
    const visible = input.type === "password";
    input.type = visible ? "text" : "password";
    toggle.setAttribute("aria-pressed", String(visible));
    toggle.setAttribute("aria-label", visible ? "Ẩn mật khẩu" : "Hiện mật khẩu");
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  validateName();
  validateIdentity();
  validatePassword();
  validatePasswordMatch();
  if (!form.reportValidity()) return;

  const name = form.elements.name.value.trim().replace(/\s+/g, " ");

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  setMessage("Đang tạo tài khoản...", "pending");
  try {
    const identity = LegalPathAuthApi.normalizeIdentity(identityInput.value);
    const existingUsers = await LegalPathAuthApi.findUsersByIdentity(identity);
    if (existingUsers.length) {
      setMessage("Email hoặc số điện thoại này đã được đăng ký.");
      identityInput.focus();
      return;
    }

    await LegalPathAuthApi.createUser({
      name,
      identity,
      role: form.elements.role.value,
      password: passwordInput.value,
      createdAt: new Date().toISOString(),
    });
    setMessage("Đăng ký thành công! Bạn có thể đăng nhập ngay.", "success");
    form.reset();
    nameInput.setCustomValidity("");
    identityInput.setCustomValidity("");
    passwordInput.setCustomValidity("");
    confirmInput.setCustomValidity("");
    redirecting = true;
    window.setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);
  } catch (error) {
    setMessage(
      error instanceof TypeError
        ? "Không kết nối được API tại localhost:3000. Hãy khởi động JSON Server rồi thử lại."
        : error.message
    );
  } finally {
    if (!redirecting) submitButton.disabled = false;
  }
});
