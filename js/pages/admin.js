"use strict";

(function () {
  const roleLabels = {
    user: "Người dùng",
    legal_expert: "Chuyên gia pháp lý",
    editor: "Biên tập viên",
    admin: "Quản trị viên"
  };
  document.querySelectorAll("[data-account-role]").forEach((element) => {
    const role = element.textContent.trim();
    if (roleLabels[role]) element.textContent = roleLabels[role];
  });
})();
