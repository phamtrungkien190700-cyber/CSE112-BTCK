const pageName = document.querySelector("#current-page-label");
const navigationLinks = document.querySelectorAll(".nav-link");

navigationLinks.forEach((link) => {
  link.addEventListener("click", () => {
    pageName.textContent = link.querySelector("span:last-child").textContent;
    navigationLinks.forEach((navigationLink) => {
      const isActive = navigationLink === link;
      navigationLink.classList.toggle("is-active", isActive);
      if (isActive) {
        navigationLink.setAttribute("aria-current", "page");
      } else {
        navigationLink.removeAttribute("aria-current");
      }
    });
  });
});
