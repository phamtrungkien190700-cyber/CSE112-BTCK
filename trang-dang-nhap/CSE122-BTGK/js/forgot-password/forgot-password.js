const API_USERS = "http://localhost:3000/list-user";
const form = document.querySelector('[data-auth="forgot"]');
const message = form.querySelector("[data-form-message]");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const identity = form.elements.identity.value.trim().toLowerCase();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(identity);
  const validPhone = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/.test(identity);
  if (!validEmail && !validPhone) {
    form.elements.identity.setCustomValidity("Nhập email hợp lệ hoặc số điện thoại Việt Nam gồm 10 số.");
    form.elements.identity.reportValidity();
    return;
  }
  form.elements.identity.setCustomValidity("");

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  message.textContent = "Đang kiểm tra tài khoản...";
  message.dataset.state = "pending";
  try {
    const response = await fetch(`${API_USERS}?identity=${encodeURIComponent(identity)}`);
    if (!response.ok) throw new Error("Không thể kiểm tra tài khoản. Vui lòng thử lại.");
    const users = await response.json();
    const found = users.some((user) => String(user.identity).toLowerCase() === identity);
    message.textContent = found
      ? "Tài khoản đã tồn tại. Hệ thống hiện chưa tích hợp gửi email/SMS khôi phục."
      : "Không tìm thấy tài khoản với email hoặc số điện thoại này.";
    message.dataset.state = found ? "success" : "error";
  } catch (error) {
    message.textContent = error instanceof TypeError
      ? "Không kết nối được API tại localhost:3000. Hãy khởi động JSON Server rồi thử lại."
      : error.message;
    message.dataset.state = "error";
  } finally {
    submitButton.disabled = false;
  }
});
