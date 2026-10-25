const $ = (selector, root = document) => root.querySelector(selector);

const state = {
  settings: null
};

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove('show'), 2600);
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('vi');
}

function readFormSettings() {
  return {
    ...state.settings,
    name: $('#accountName').value.trim(),
    email: $('#accountEmail').value.trim(),
    phone: $('#accountPhone').value.trim(),
    language: $('#language').value,
    preferences: {
      legalUpdates: $('#legalUpdates').checked,
      replies: $('#replyNotifications').checked,
      emailNewsletter: $('#emailNewsletter').checked
    }
  };
}

function renderSettings() {
  const settings = state.settings;
  $('#accountName').value = settings.name;
  $('#accountEmail').value = settings.email;
  $('#accountPhone').value = settings.phone;
  $('#language').value = settings.language;
  $('#legalUpdates').checked = settings.preferences.legalUpdates;
  $('#replyNotifications').checked = settings.preferences.replies;
  $('#emailNewsletter').checked = settings.preferences.emailNewsletter;
  $('#joinedAt').textContent = settings.joinedAt;
  $('#summaryJoinedAt').textContent = settings.joinedAt;
  $('#summaryName').textContent = settings.name;
  $('#summaryRole').textContent = settings.role;
  $('#summaryAvatar').textContent = getInitials(settings.name);
  $('#topbarAvatar').textContent = getInitials(settings.name);
  $('#summaryLegalUpdates').textContent = `Cập nhật nội dung pháp lý: ${settings.preferences.legalUpdates ? 'Bật' : 'Tắt'}`;
  $('#summaryReplies').textContent = `Phản hồi câu hỏi của bạn: ${settings.preferences.replies ? 'Bật' : 'Tắt'}`;
  $('#summaryNewsletter').textContent = `Bản tin qua email: ${settings.preferences.emailNewsletter ? 'Bật' : 'Tắt'}`;
}

async function loadSettings() {
  const settings = await window.LegalPathAPI.getCollection('settings');
  if (!settings.length) {
    throw new Error('Không tìm thấy hồ sơ cài đặt trong dataset.');
  }
  state.settings = settings[0];
  renderSettings();
}

async function saveSettings(event) {
  event.preventDefault();
  if (!$('#settingsForm').reportValidity()) return;

  const nextSettings = readFormSettings();
  try {
    await window.LegalPathAPI.saveCollection('settings', [nextSettings]);
    state.settings = nextSettings;
    renderSettings();
    toast('Đã lưu cài đặt tài khoản.');
  } catch (error) {
    console.error('Không thể lưu cài đặt tài khoản:', error);
    toast('Không thể lưu thay đổi. Hãy kiểm tra API đang chạy.');
  }
}

function bindControls() {
  $('#settingsForm').addEventListener('submit', saveSettings);
  $('#cancelSettingsButton').addEventListener('click', () => {
    renderSettings();
    toast('Đã hủy các thay đổi chưa lưu.');
  });
  $('#settingsForm').addEventListener('input', updateSummary);
  $('#settingsForm').addEventListener('change', updateSummary);

  const passwordDialog = $('#passwordDialog');
  $('#changePasswordButton').addEventListener('click', () => passwordDialog.showModal());
  $('#closePasswordDialog').addEventListener('click', () => passwordDialog.close());
  $('#cancelPasswordDialog').addEventListener('click', () => passwordDialog.close());
  $('#passwordForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const [currentPassword, newPassword, confirmPassword] = [...event.currentTarget.querySelectorAll('input')];
    if (newPassword.value !== confirmPassword.value) {
      confirmPassword.setCustomValidity('Mật khẩu xác nhận không khớp.');
      confirmPassword.reportValidity();
      confirmPassword.addEventListener('input', () => confirmPassword.setCustomValidity(''), { once: true });
      return;
    }
    toast('Chức năng đổi mật khẩu chưa được kết nối với hệ thống xác thực.');
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    passwordDialog.close();
  });

  $('#profileButton').addEventListener('click', () => toast('Thông tin hồ sơ đang được quản lý tại trang Cài đặt.'));
}

function updateSummary() {
  $('#summaryName').textContent = $('#accountName').value.trim() || 'Chưa nhập họ tên';
  $('#summaryAvatar').textContent = getInitials($('#accountName').value || 'MA');
  $('#topbarAvatar').textContent = getInitials($('#accountName').value || 'MA');
  $('#summaryLegalUpdates').textContent = `Cập nhật nội dung pháp lý: ${$('#legalUpdates').checked ? 'Bật' : 'Tắt'}`;
  $('#summaryReplies').textContent = `Phản hồi câu hỏi của bạn: ${$('#replyNotifications').checked ? 'Bật' : 'Tắt'}`;
  $('#summaryNewsletter').textContent = `Bản tin qua email: ${$('#emailNewsletter').checked ? 'Bật' : 'Tắt'}`;
}

async function loadUnreadCount() {
  try {
    const notifications = await window.LegalPathAPI.getCollection('notifications');
    const unreadCount = notifications.filter((notification) => !notification.isRead).length;
    $('#unreadNotificationCount').textContent = unreadCount || '';
    $('#unreadNotificationCount').classList.toggle('hidden', unreadCount === 0);
  } catch (error) {
    console.error('Không thể tải số lượng thông báo chưa đọc:', error);
  }
}

async function initPage() {
  try {
    await loadSettings();
  } catch (error) {
    console.error('Không thể tải cài đặt tài khoản:', error);
    toast('Không tải được cài đặt. Hãy chạy API và mở trang bằng Live Server.');
  }
  bindControls();
  loadUnreadCount();
}

document.addEventListener('DOMContentLoaded', initPage);