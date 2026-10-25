(() => {
  const ACTIVE_PAGE_KEY = "legalpath-admin-active-page";
  const pageLabel = document.querySelector("#current-page-label");
  const contentFrame = document.querySelector("#admin-content");
  const pageLinks = document.querySelectorAll('[target="admin-content"][data-page-name]');
  const navLinks = document.querySelectorAll(".nav-link[target='admin-content']");

  function updateCurrentPage(link) {
    pageLabel.textContent = link.dataset.pageName;
    sessionStorage.setItem(ACTIVE_PAGE_KEY, link.href);
    navLinks.forEach((navLink) => {
      const isCurrent = navLink.href === link.href;
      navLink.classList.toggle("is-active", isCurrent);
      if (isCurrent) navLink.setAttribute("aria-current", "page");
      else navLink.removeAttribute("aria-current");
    });
  }

  const savedPage = sessionStorage.getItem(ACTIVE_PAGE_KEY);
  const savedLink = Array.from(pageLinks).find((link) => link.href === savedPage);
  if (savedLink) {
    contentFrame.src = savedLink.href;
    updateCurrentPage(savedLink);
  }

  pageLinks.forEach((link) => {
    link.addEventListener("click", () => updateCurrentPage(link));
  });

  contentFrame.addEventListener("load", () => {
    const currentUrl = contentFrame.contentWindow.location.href;
    const currentLink = Array.from(pageLinks).find((link) => link.href === currentUrl);
    if (currentLink) updateCurrentPage(currentLink);
  });
})();
