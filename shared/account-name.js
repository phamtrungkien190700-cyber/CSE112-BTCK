"use strict";

(() => {
  const nameElements = document.querySelectorAll("[data-account-name]");
  const initialsElements = document.querySelectorAll(
    "[data-account-initials], [data-side-initials]"
  );
  if (!nameElements.length && !initialsElements.length) return;

  async function loadAccountName() {
    if (!window.LegalPathAuthApi) {
      throw new Error("Không thể tải tên tài khoản: API xác thực chưa được khởi tạo.");
    }

    const session = window.LegalPathAuthApi.getCurrentUser();
    if (!session) return;

    const user = await window.LegalPathAuthApi.getUserById(session.id);
    if (typeof user.name !== "string" || !user.name.trim()) {
      throw new Error("Hồ sơ tài khoản không có tên hợp lệ.");
    }

    const name = user.name.trim();
    nameElements.forEach((element) => {
      element.textContent = name;
    });

    const initials = name
      .split(/\s+/)
      .slice(-2)
      .map((part) => part.charAt(0))
      .join("")
      .toLocaleUpperCase("vi");
    initialsElements.forEach((element) => {
      element.textContent = initials;
    });
  }

  loadAccountName().catch((error) => {
    console.error("Không thể cập nhật tên tài khoản trên thanh tiêu đề:", error);
  });
})();
