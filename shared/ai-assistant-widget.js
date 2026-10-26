(() => {
  const currentScript = document.currentScript;
  if (!currentScript || document.querySelector("[data-ai-assistant-widget]")) return;

  const scriptUrl = new URL(currentScript.src);
  const assistantUrl = new URL("../AI/ai-assistant.html", scriptUrl);
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = new URL("ai-assistant-widget.css", scriptUrl).href;
  document.head.append(stylesheet);

  const launcher = document.createElement("button");
  launcher.className = "ai-assistant-widget__launcher";
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Mở Trợ lý AI");
  launcher.setAttribute("aria-haspopup", "dialog");
  launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-controls", "ai-assistant-widget-panel");
  const launcherIcon = document.createElement("span");
  launcherIcon.className = "ai-assistant-widget__icon";
  launcherIcon.setAttribute("aria-hidden", "true");
  launcherIcon.textContent = "✧";
  const launcherText = document.createElement("span");
  launcherText.textContent = "Trợ lý AI";
  launcher.append(launcherIcon, launcherText);

  const panel = document.createElement("section");
  panel.className = "ai-assistant-widget__panel";
  panel.id = "ai-assistant-widget-panel";
  panel.setAttribute("data-ai-assistant-widget", "");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-labelledby", "ai-assistant-widget-title");
  panel.hidden = true;

  const header = document.createElement("header");
  header.className = "ai-assistant-widget__header";

  const title = document.createElement("span");
  title.id = "ai-assistant-widget-title";
  title.textContent = "Trợ lý thông minh";

  const closeButton = document.createElement("button");
  closeButton.className = "ai-assistant-widget__close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Đóng Trợ lý AI");
  closeButton.textContent = "×";
  header.append(title, closeButton);

  const frame = document.createElement("iframe");
  frame.className = "ai-assistant-widget__frame";
  frame.title = "Trợ lý AI LegalPath";
  panel.append(header, frame);
  document.body.append(launcher, panel);

  function closePanel() {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  }

  launcher.addEventListener("click", () => {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    if (!frame.hasAttribute("src")) frame.src = assistantUrl.href;
    closeButton.focus();
  });

  closeButton.addEventListener("click", closePanel);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) closePanel();
  });
})();
