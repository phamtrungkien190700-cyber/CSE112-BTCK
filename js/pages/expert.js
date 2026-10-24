"use strict";

(function () {
  const menuButton = document.querySelector("#menuBtn");
  const sidebar = document.querySelector("#sidebar");
  const scrim = document.querySelector("#scrim");
  if (menuButton && sidebar) {
    menuButton.addEventListener("click", () => window.toggleMenu(sidebar, scrim));
  }
  if (scrim && sidebar) {
    scrim.addEventListener("click", () => {
      sidebar.classList.remove("is-open");
      scrim.classList.remove("is-visible");
    });
  }
})();
