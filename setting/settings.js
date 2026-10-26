"use strict";

const settingsForm = document.querySelector("#settingsForm");
const passwordDialog = document.querySelector("#passwordDialog");
const passwordForm = document.querySelector("#passwordForm");
const toast = document.querySelector("#toast");
const accountStatus = document.querySelector("#accountStatus");
const roleSelect = document.querySelector("#roleSelect");
const changeRoleButton = document.querySelector("#changeRoleButton");
const roleSwitchStatus = document.querySelector("#roleSwitchStatus");
const rolePreview = document.querySelector("#rolePreview");
let toastTimer;
let currentUser = null;
const roleLabels = {
  user: "Người dùng",
  expert: "Chuyên gia",
  legal_expert: "Chuyên gia pháp lý",
  editor: "Biên tập viên",
  manager: "Quản trị viên"
};

const defaultSettings = {
  legalUpdates: true,
  questionReplies: true,
  emailDigest: false,
  language: "vi"
};

const roleDestinations = {
  user: "../user-portal/user-dashboard/user-dashboard.html",
  legal_expert: "../expert/expert-profile.html",
  editor: "../editor/mainEditor/index.html",
  manager: "../admin/mainadmin/index.html"
};

function readSavedSettings() {
  const saved = localStorage.getItem("legalpath.settings.v1");
  if (!saved) return { ...defaultSettings };

  const parsed = JSON.parse(saved);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Dữ liệu cài đặt đã lưu không hợp lệ.");
  }
  return {
    legalUpdates: parsed.legalUpdates ?? defaultSettings.legalUpdates,
    questionReplies: parsed.questionReplies ?? defaultSettings.questionReplies,
    emailDigest: parsed.emailDigest ?? defaultSettings.emailDigest,
    language: parsed.language ?? defaultSettings.language
  };
}

function getFormSettings() {
  const formData = new FormData(settingsForm);
  return {
    legalUpdates: formData.get("legalUpdates") === "on",
    questionReplies: formData.get("questionReplies") === "on",
    emailDigest: formData.get("emailDigest") === "on",
    language: String(formData.get("language"))
  };
}

function setFormSettings(settings) {
  settingsForm.elements.legalUpdates.checked = settings.legalUpdates;
  settingsForm.elements.questionReplies.checked = settings.questionReplies;
  settingsForm.elements.emailDigest.checked = settings.emailDigest;
  settingsForm.elements.language.value = settings.language;
  updateSummary(settings, currentUser?.name);
}

function updateSummary(settings, accountName = currentUser?.name) {
  const name = accountName || "Người dùng";
  const initials = name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toLocaleUpperCase("vi");
  document.querySelectorAll("[data-initials]").forEach((element) => {
    element.textContent = initials;
  });
  document.querySelectorAll("[data-summary-name], [data-account-name]").forEach((element) => {
    element.textContent = name;
  });
  document.querySelectorAll("[data-account-initial]").forEach((element) => {
    element.textContent = initials;
  });
  document.querySelector("[data-account-role]").textContent = roleLabels[currentUser?.role] || "Người dùng";
  for (const preference of ["legalUpdates", "questionReplies", "emailDigest"]) {
    document.querySelector(`[data-pref="${preference}"]`).textContent = settings[preference] ? "Bật" : "Tắt";
  }
}

function setAccountStatus(message, isError = false) {
  accountStatus.textContent = message;
  accountStatus.dataset.state = isError ? "error" : "info";
}

function updateRolePreview() {
  const selectedOption = roleSelect.selectedOptions[0];
  rolePreview.dataset.role = roleSelect.value;
  rolePreview.textContent = selectedOption?.textContent || "Chưa chọn vai trò";
}

function redirectForHttpError(error) {
  const errorPages = {
    403: "../403/403.html",
    404: "../404/404.html"
  };
  const errorPage = errorPages[error.status];
  if (!errorPage) return false;
  window.location.assign(errorPage);
  return true;
}

function validateIdentity() {
  const identityInput = settingsForm.elements.identity;
  const identity = identityInput.value.trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(identity);
  const validPhone = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/.test(identity);
  identityInput.setCustomValidity(validEmail || validPhone
    ? ""
    : "Nhập email hợp lệ hoặc số điện thoại Việt Nam gồm 10 số.");
}

async function loadCurrentUser() {
  try {
    if (!window.LegalPathAuthApi) {
      throw new Error("Không tải được tiện ích kết nối tài khoản.");
    }
    const session = LegalPathAuthApi.getCurrentUser();
    if (!session) {
      throw new Error("Chưa xác định tài khoản đăng nhập. Vui lòng đăng nhập lại để chỉnh sửa thông tin.");
    }
    currentUser = await LegalPathAuthApi.getUserById(session.id);
    settingsForm.elements.name.value = currentUser.name || "";
    settingsForm.elements.identity.value = currentUser.identity || "";
    settingsForm.elements.name.disabled = false;
    settingsForm.elements.identity.disabled = false;
    const createdDate = currentUser.createdAt
      ? new Date(currentUser.createdAt).toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" })
      : "";
    const roleLabel = roleLabels[currentUser.role] || "Người dùng";
    roleSelect.value = currentUser.role;
    const hasSupportedRole = roleSelect.value === currentUser.role;
    updateRolePreview();
    roleSelect.disabled = !hasSupportedRole;
    changeRoleButton.disabled = !hasSupportedRole;
    roleSwitchStatus.textContent = hasSupportedRole
      ? `Vai trò hiện tại: ${roleLabel}.`
      : "Vai trò tài khoản hiện tại không nằm trong danh sách được hỗ trợ.";
    document.querySelector("[data-account-meta]").textContent = createdDate
      ? `${roleLabel} · Tham gia từ ${createdDate}`
      : `Tài khoản ${roleLabel}`;
    document.querySelector("[data-account-created]").textContent = createdDate
      ? `Tham gia từ ${createdDate}`
      : "Tài khoản LegalPath";
    updateSummary(getFormSettings());
    setAccountStatus("Thông tin được tải từ users.json.");
  } catch (error) {
    console.error("Không thể tải thông tin tài khoản:", error);
    if (redirectForHttpError(error)) return;
    settingsForm.elements.name.disabled = true;
    settingsForm.elements.identity.disabled = true;
    setAccountStatus(error.message, true);
    showToast(error.message);
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

document.querySelector("#logoutButton").addEventListener("click", () => {
  try {
    localStorage.removeItem("legalpath.auth.user.v1");
    window.location.assign("../login-pages/CSE122-BTGK/loginhtml/login.html");
  } catch (error) {
    console.error("Không thể đăng xuất:", error);
    showToast("Không thể đăng xuất. Vui lòng thử lại.");
  }
});

settingsForm.addEventListener("change", () => updateSummary(getFormSettings(), settingsForm.elements.name.value));
settingsForm.elements.name.addEventListener("input", () => updateSummary(getFormSettings(), settingsForm.elements.name.value));
settingsForm.elements.identity.addEventListener("input", validateIdentity);

settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  validateIdentity();
  if (!settingsForm.reportValidity()) return;
  try {
    const settings = getFormSettings();
    const settingsChanged = JSON.stringify(settings) !== JSON.stringify(readSavedSettings());
    let profileChanged = false;
    if (currentUser) {
      const name = settingsForm.elements.name.value.trim();
      const identity = settingsForm.elements.identity.value.trim();
      profileChanged = name !== currentUser.name || identity !== currentUser.identity;
      if (profileChanged) {
        const matchingUsers = await LegalPathAuthApi.findUsersByIdentity(identity);
        if (matchingUsers.some((user) => String(user.id) !== String(currentUser.id))) {
          throw new Error("Email hoặc số điện thoại này đã được một tài khoản khác sử dụng.");
        }
        currentUser = await LegalPathAuthApi.updateUser(currentUser.id, { name, identity });
        LegalPathAuthApi.setCurrentUser(currentUser);
      }
    } else if (!settingsForm.elements.name.disabled) {
      throw new Error("Không xác định được tài khoản để lưu thông tin cá nhân.");
    }
    localStorage.setItem("legalpath.settings.v1", JSON.stringify(settings));
    setFormSettings(settings);
    let notificationError = null;
    if (currentUser && (profileChanged || settingsChanged)) {
      const changedAreas = [];
      if (profileChanged) changedAreas.push("thông tin tài khoản");
      if (settingsChanged) changedAreas.push("tùy chọn cài đặt");
      const description = `Bạn đã lưu thay đổi: ${changedAreas.join(" và ")}.`;
      try {
        await LegalPathAPI.createNotification({
          title: "Thông tin tài khoản đã thay đổi",
          description,
          detail: `${description} Thay đổi được thông báo đến tài khoản hiện đang đăng nhập.`,
          category: "account",
          action: "Xem thay đổi"
        });
      } catch (error) {
        console.error("Không thể gửi thông báo về thay đổi cài đặt:", error);
        notificationError = error;
      }
    }
    if (currentUser) {
      setAccountStatus("Thông tin cá nhân đã được lưu vào users.json.");
      showToast(notificationError
        ? `Đã lưu thay đổi nhưng không gửi được thông báo: ${notificationError.message}`
        : "Đã lưu thông tin tài khoản và cài đặt.");
    } else {
      showToast("Đã lưu tùy chọn cài đặt. Thông tin cá nhân chưa được lưu.");
    }
  } catch (error) {
    console.error("Không thể lưu cài đặt tài khoản:", error);
    if (redirectForHttpError(error)) return;
    setAccountStatus(error.message, true);
    showToast(`Không thể lưu cài đặt: ${error.message}`);
  }
});

document.querySelector("#cancelButton").addEventListener("click", () => {
  try {
    if (currentUser) {
      settingsForm.elements.name.value = currentUser.name || "";
      settingsForm.elements.identity.value = currentUser.identity || "";
    }
    setFormSettings(readSavedSettings());
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

try {
  setFormSettings(readSavedSettings());
} catch (error) {
  console.error("Không thể tải tùy chọn cài đặt:", error);
  setFormSettings(defaultSettings);
  showToast(`Không thể tải cài đặt đã lưu: ${error.message}`);
}
loadCurrentUser();

roleSelect.addEventListener("change", updateRolePreview);

changeRoleButton.addEventListener("click", async () => {
  if (!currentUser) {
    roleSwitchStatus.textContent = "Không xác định được tài khoản đang đăng nhập.";
    return;
  }

  const nextRole = roleSelect.value;
  if (!roleDestinations[nextRole]) {
    roleSwitchStatus.textContent = "Vai trò được chọn không hợp lệ.";
    return;
  }
  if (nextRole === currentUser.role) {
    roleSwitchStatus.textContent = "Đây là vai trò hiện tại của bạn.";
    return;
  }

  changeRoleButton.disabled = true;
  roleSelect.disabled = true;
  roleSwitchStatus.textContent = "Đang cập nhật vai trò...";
  try {
    currentUser = await LegalPathAuthApi.updateUser(currentUser.id, { role: nextRole });
    LegalPathAuthApi.setCurrentUser(currentUser);
    window.location.assign(roleDestinations[nextRole]);
  } catch (error) {
    console.error("Không thể đổi vai trò tài khoản:", error);
    if (redirectForHttpError(error)) return;
    roleSelect.disabled = false;
    changeRoleButton.disabled = false;
    roleSwitchStatus.textContent = `Không thể đổi vai trò: ${error.message}`;
    showToast(`Không thể đổi vai trò: ${error.message}`);
  }
});
