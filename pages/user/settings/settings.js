"use strict";

const SETTINGS_STORAGE_KEY = "legalpath.settings.v1";
const settingsForm = document.querySelector("#settingsForm");
const passwordDialog = document.querySelector("#passwordDialog");
const passwordForm = document.querySelector("#passwordForm");
const toast = document.querySelector("#toast");
let toastTimer;

const defaultSettings = {
  name: "Nguyễn Minh Anh",
  email: "minhanh.nguyen@gmail.com",
  phone: "0912 345 678",
  legalUpdates: true,
  questionReplies: true,
  emailDigest: false,
  language: "vi"
};

function readSavedSettings() {
  const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!saved) return { ...defaultSettings };

  const parsed = JSON.parse(saved);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Dữ liệu cài đặt đã lưu không hợp lệ.");
  }
  return { ...defaultSettings, ...parsed };
}

function getFormSettings() {
  const formData = new FormData(settingsForm);
  return {
    name: String(formData.get("name")).trim(),
    email: String(formData.get("email")).trim(),
    phone: String(formData.get("phone")).trim(),
    legalUpdates: formData.get("legalUpdates") === "on",
    questionReplies: formData.get("questionReplies") === "on",
    emailDigest: formData.get("emailDigest") === "on",
    language: String(formData.get("language"))
  };
}

function setFormSettings(settings) {
  settingsForm.elements.name.value = settings.name;
  settingsForm.elements.email.value = settings.email;
  settingsForm.elements.phone.value = settings.phone;
  settingsForm.elements.legalUpdates.checked = settings.legalUpdates;
  settingsForm.elements.questionReplies.checked = settings.questionReplies;
  settingsForm.elements.emailDigest.checked = settings.emailDigest;
  settingsForm.elements.language.value = settings.language;
  updateSummary(settings);
}

function updateSummary(settings) {
  const name = settings.name || defaultSettings.name;
  const initials = name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toLocaleUpperCase("vi");
  document.querySelectorAll("[data-initials]").forEach((element) => {
    element.textContent = initials;
  });
  document.querySelector("[data-summary-name]").textContent = name;
  for (const preference of ["legalUpdates", "questionReplies", "emailDigest"]) {
    document.querySelector(`[data-pref="${preference}"]`).textContent = settings[preference] ? "Bật" : "Tắt";
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

settingsForm.addEventListener("change", () => updateSummary(getFormSettings()));
settingsForm.elements.name.addEventListener("input", () => updateSummary(getFormSettings()));

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!settingsForm.reportValidity()) return;
  try {
    const settings = getFormSettings();
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    setFormSettings(settings);
    showToast("Đã lưu thay đổi cài đặt.");
  } catch (error) {
    showToast(`Không thể lưu cài đặt: ${error.message}`);
  }
});

document.querySelector("#cancelButton").addEventListener("click", () => {
  try {
    try {
      setFormSettings(readSavedSettings());
    } catch (error) {
      setFormSettings(defaultSettings);
      showToast(`Không thể tải cài đặt đã lưu: ${error.message}`);
    }
    showToast("Đã hủy các thay đổi chưa lưu.");
  } catch (error) {
    showToast(`Không thể khôi phục cài đặt: ${error.message}`);
  }
});

document.querySelector("#changePasswordButton").addEventListener("click", () => passwordDialog.showModal());
document.querySelector("#closePasswordDialog").addEventListener("click", () => passwordDialog.close());
document.querySelector("#cancelPasswordButton").addEventListener("click", () => passwordDialog.close());

passwordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!passwordForm.reportValidity()) return;
  const newPassword = passwordForm.elements.newPassword.value;
  const confirmPassword = passwordForm.elements.confirmPassword.value;
  if (newPassword !== confirmPassword) {
    passwordForm.elements.confirmPassword.setCustomValidity("Mật khẩu nhập lại chưa khớp.");
    passwordForm.elements.confirmPassword.reportValidity();
    passwordForm.elements.confirmPassword.addEventListener("input", () => {
      passwordForm.elements.confirmPassword.setCustomValidity("");
    }, { once: true });
    return;
  }
  passwordDialog.close();
  passwordForm.reset();
  showToast("Chức năng đổi mật khẩu cần được kết nối với dịch vụ tài khoản.");
});

setFormSettings(readSavedSettings());
