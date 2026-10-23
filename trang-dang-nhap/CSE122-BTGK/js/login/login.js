const API_USERS = "http://localhost:3000/list-user";
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
  const identity = form.elements.identity.value.trim().toLowerCase();
  const password = form.elements.password.value;
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  message.textContent = "Đang kiểm tra thông tin...";
  message.dataset.state = "pending";

  try {
    const response = await fetch(`${API_USERS}?identity=${encodeURIComponent(identity)}`);
    if (!response.ok) throw new Error("Không thể kiểm tra tài khoản. Vui lòng thử lại.");
    const users = await response.json();
    const user = users.find((item) =>
      String(item.identity).toLowerCase() === identity && item.password === password
    );
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
    message.textContent = `Đăng nhập thành công. Xin chào ${user.name}!`;
    message.dataset.state = "success";
    const roleDestinations = {
      user: "../../../nguoidung/mainnguoidung/mainnguoidung.html",
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
