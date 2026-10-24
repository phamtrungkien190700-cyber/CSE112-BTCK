"use strict";

(function () {
  const frame = document.querySelector("#content-frame");
  if (!frame) return;

  const links = Array.from(document.querySelectorAll('.nav-link[target="content-frame"]'));
  const pageLabel = document.querySelector("#current-page-label");
  frame.addEventListener("load", () => {
    const currentPath = new URL(frame.contentWindow.location.href).pathname;
    links.forEach((link) => {
      const isCurrent = new URL(link.href).pathname === currentPath;
      link.classList.toggle("is-active", isCurrent);
      if (isCurrent) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    const title = frame.contentDocument.querySelector("h1");
    if (pageLabel && title) pageLabel.textContent = title.textContent;
  });
})();
