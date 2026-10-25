"use strict";

(function () {
  const pageRoles = (document.body.dataset.allowedRoles || document.body.dataset.requiredRole || "")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
  const loginPath = "/pages/auth/login.html";

  function updatePublicAccount(user) {
    const accountLink = document.querySelector("[data-public-account]");
    if (!accountLink || !user) return;

    const destinations = {
      user: "/pages/user/mainnguoidung/mainnguoidung.html",
      legal_expert: "/pages/expert/expert-article-management.html",
      editor: "/pages/editor/index.html",
      admin: "/pages/admin/mainadmin/index.html"
    };
    const roleLabels = {
      user: "Người dùng",
      legal_expert: "Chuyên gia pháp lý",
      editor: "Biên tập viên",
      admin: "Quản trị viên"
    };
    accountLink.href = destinations[user.role] || destinations.user;
    accountLink.querySelector("[data-public-account-name]").textContent = user.name;
    accountLink.querySelector("[data-public-account-role]").textContent = roleLabels[user.role] || user.role;
    accountLink.querySelector("[data-public-account-initial]").textContent = user.name.trim().split(/\s+/)
      .slice(-2).map((part) => part.charAt(0)).join("").toLocaleUpperCase("vi");
    accountLink.setAttribute("aria-label", `Tài khoản ${user.name}`);
    accountLink.hidden = false;
    document.querySelectorAll("[data-guest-action]").forEach((action) => {
      action.hidden = true;
    });
  }

  function addRoleOverviewLink() {
    if (!pageRoles.length || document.querySelector(".role-overview-link, .overview-link")) return;
    const nav = document.querySelector(".side-nav, .primary-nav");
    const link = document.createElement("a");
    link.href = "/pages/public/index.html";
    link.target = "_top";
    link.className = nav ? "nav-link overview-link" : "role-overview-link";
    link.textContent = "Tổng quan chung";

    if (nav) {
      const icon = document.createElement("span");
      icon.className = "nav-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "⌂";
      link.prepend(icon);
      nav.prepend(link);
      return;
    }

    const bar = document.createElement("div");
    bar.className = "role-overview-bar";
    bar.append(link);
    document.body.prepend(bar);
  }

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
    addRoleOverviewLink();
    try {
      const { user } = await window.LegalPathAPI.getCurrentUser();
      updatePublicAccount(user);
      const accountName = document.querySelector("[data-account-name], [data-side-name]");
      const accountRole = document.querySelector("[data-account-role], [data-side-role]");
      const accountInitial = document.querySelector("[data-account-initial]");
      const roleLabels = {
        user: "Người dùng",
        legal_expert: "Chuyên gia pháp lý",
        editor: "Biên tập viên",
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
