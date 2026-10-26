const form = document.querySelector('[data-auth="login"]');
const message = form.querySelector("[data-form-message]");
let redirecting = false;

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
  const identity = LegalPathAuthApi.normalizeIdentity(form.elements.identity.value);
  const password = form.elements.password.value;
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  message.textContent = "Đang kiểm tra thông tin...";
  message.dataset.state = "pending";

  try {
    const users = await LegalPathAuthApi.findUsersByIdentity(identity);
    const user = users.find((item) => item.password === password);
    if (!user) {
      message.textContent = "Email/số điện thoại hoặc mật khẩu không đúng.";
      message.dataset.state = "error";
      return;
    }
    if (user["khóa"] === true) {
      message.textContent = "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.";
      message.dataset.state = "error";
      return;
    }
    LegalPathAuthApi.setCurrentUser(user);
    message.textContent = `Đăng nhập thành công. Xin chào ${user.name}!`;
    message.dataset.state = "success";
    const roleDestinations = {
      user: "../../../user-portal/user-dashboard/user-dashboard.html",
      expert: "../../../expert/expert-profile.html",
      legal_expert: "../../../expert/expert-profile.html",
      editor: "../../../editor/mainEditor/index.html",
      manager: "../../../admin/mainadmin/index.html",
    };
    const destination = roleDestinations[user.role];
    if (destination) {
      redirecting = true;
      message.textContent += " Đang chuyển trang...";
      window.setTimeout(() => {
        window.location.href = destination;
      }, 1000);
    }
  } catch (error) {
    message.textContent = error instanceof TypeError
      ? "Không kết nối được API tại localhost:3000. Hãy khởi động JSON Server rồi thử lại."
      : error.message;
    message.dataset.state = "error";
  } finally {
    if (!redirecting) submitButton.disabled = false;
  }
});
