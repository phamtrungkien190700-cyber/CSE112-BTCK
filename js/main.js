"use strict";

(function () {
  const pageRoles = (document.body.dataset.allowedRoles || document.body.dataset.requiredRole || "")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
  const loginPath = "/pages/auth/login.html";

  window.toggleMenu = function toggleMenu(menu, scrim) {
    const menuElement = typeof menu === "string" ? document.querySelector(menu) : menu;
    const scrimElement = typeof scrim === "string" ? document.querySelector(scrim) : scrim;
    if (!menuElement) return;
    const isOpen = menuElement.classList.toggle("is-open");
    if (scrimElement) scrimElement.classList.toggle("is-visible", isOpen);
    menuElement.setAttribute("aria-expanded", String(isOpen));
  };

  async function initializeSession() {
    if (!window.LegalPathAPI) return;
    try {
      const { user } = await window.LegalPathAPI.getCurrentUser();
      const accountName = document.querySelector("[data-account-name], [data-side-name]");
      const accountRole = document.querySelector("[data-account-role], [data-side-role]");
      const accountInitial = document.querySelector("[data-account-initial]");
      const roleLabels = {
        user: "Người dùng",
        legal_expert: "Chuyên gia pháp lý",
        admin: "Quản trị viên"
      };
      if (accountName && user) accountName.textContent = user.name;
      if (accountRole && user) accountRole.textContent = roleLabels[user.role] || user.role;
      if (accountInitial && user) {
        accountInitial.textContent = user.name.trim().split(/\s+/).slice(-2)
          .map((part) => part.charAt(0)).join("").toLocaleUpperCase("vi");
      }

      if (pageRoles.length && (!user || (!pageRoles.includes(user.role) && user.role !== "admin"))) {
        window.top.location.replace(`${loginPath}?returnUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      document.querySelectorAll("[data-logout]").forEach((button) => {
        button.addEventListener("click", async () => {
          button.disabled = true;
          try {
            await window.LegalPathAPI.logout();
            window.top.location.replace(loginPath);
          } catch (error) {
            button.disabled = false;
            console.error("Không thể đăng xuất:", error);
            window.alert(error.message);
          }
        });
      });
    } catch (error) {
      console.error("Không thể kiểm tra trạng thái đăng nhập:", error);
      if (pageRoles.length) {
        window.top.location.replace(loginPath);
      }
    }
  }

  initializeSession();
})();
