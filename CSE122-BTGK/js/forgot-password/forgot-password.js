const form = document.querySelector('[data-auth="forgot"]');
const message = form.querySelector("[data-form-message]");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const identity = LegalPathAuthApi.normalizeIdentity(form.elements.identity.value);
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
    const users = await LegalPathAuthApi.findUsersByIdentity(identity);
    const found = users.length > 0;
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
