const $ = (selector, root = document) => root.querySelector(selector);

const PAGE_SIZE = 5;
const state = {
  notifications: [],
  activeTab: 'all',
  currentPage: 1
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove('show'), 2600);
}

async function loadNotifications() {
  state.notifications = await window.LegalPathAPI.getCollection('notifications');
}

function getFilteredNotifications() {
  const query = $('#notificationSearch').value.trim().toLocaleLowerCase('vi');
  const category = $('#notificationCategory').value;
  const status = $('#notificationStatus').value;

  return state.notifications.filter((item) => {
    const matchesQuery = `${item.title} ${item.description} ${item.category}`.toLocaleLowerCase('vi').includes(query);
    const matchesTab = state.activeTab !== 'unread' || !item.isRead;
    const matchesCategory = category === 'all' || item.category === category;
    const matchesStatus = status === 'all' ||
      (status === 'unread' ? !item.isRead : item.isRead);

    return matchesQuery && matchesTab && matchesCategory && matchesStatus;
  });
}

function renderPagination(pageCount) {
  const pagination = $('#notificationPagination');
  if (pageCount === 0) {
    pagination.innerHTML = '';
    return;
  }

  const buttons = [
    `<button type="button" data-page="${state.currentPage - 1}" aria-label="Trang trước" ${state.currentPage === 1 ? 'disabled' : ''}>‹</button>`
  ];
  for (let page = 1; page <= pageCount; page += 1) {
    buttons.push(`<button type="button" data-page="${page}" class="${page === state.currentPage ? 'selected' : ''}" aria-label="Trang ${page}" ${page === state.currentPage ? 'aria-current="page"' : ''}>${page}</button>`);
  }
  buttons.push(`<button type="button" data-page="${state.currentPage + 1}" aria-label="Trang sau" ${state.currentPage === pageCount ? 'disabled' : ''}>›</button>`);
  pagination.innerHTML = buttons.join('');
}

function renderNotification(item) {
  return `
    <article class="notification-row ${item.isRead ? '' : 'unread'}">
      <div class="notification-copy">
        <h2 class="notification-title">${item.isRead ? '' : '<span class="unread-dot" aria-label="Chưa đọc"></span>'}${escapeHtml(item.title)}</h2>
        <p class="notification-description">${escapeHtml(item.description)}</p>
      </div>
      <time class="notification-time">${escapeHtml(item.time)}<small>${escapeHtml(item.date)}</small></time>
      <span class="read-status ${item.isRead ? '' : 'unread'}">${item.isRead ? 'Đã đọc' : 'Chưa đọc'}</span>
      <button class="action-button" type="button" data-notification-id="${escapeHtml(item.id)}" data-action="${escapeHtml(item.action)}">${escapeHtml(item.action)}</button>
    </article>
  `;
}

function renderNotifications() {
  const unreadCount = state.notifications.filter((item) => !item.isRead).length;
  $('#unreadCount').textContent = unreadCount;
  $('#markAllReadButton').disabled = unreadCount === 0;

  const filtered = getFilteredNotifications();
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  if (pageCount && state.currentPage > pageCount) {
    state.currentPage = pageCount;
  }
  const start = (state.currentPage - 1) * PAGE_SIZE;
  const currentItems = filtered.slice(start, start + PAGE_SIZE);
  const grouped = new Map();

  currentItems.forEach((item) => {
    const groupName = item.isToday ? `Hôm nay · ${item.date}` : 'Trước đó';
    grouped.set(groupName, [...(grouped.get(groupName) || []), item]);
  });

  $('#notificationList').innerHTML = [...grouped.entries()].map(([heading, items]) => `
    <section class="notification-group">
      <h2 class="date-heading">${escapeHtml(heading)}</h2>
      ${items.map(renderNotification).join('')}
    </section>
  `).join('');

  $('#notificationList').classList.toggle('hidden', currentItems.length === 0);
  $('#notificationEmpty').classList.toggle('hidden', currentItems.length !== 0);
  $('#notificationCount').textContent = `Hiển thị ${currentItems.length} thông báo gần đây`;
  renderPagination(pageCount);
}

async function saveNotifications(nextNotifications, successMessage) {
  try {
    await window.LegalPathAPI.saveCollection('notifications', nextNotifications);
    state.notifications = nextNotifications;
    renderNotifications();
    toast(successMessage);
  } catch (error) {
    console.error('Không thể lưu thay đổi thông báo:', error);
    toast('Không thể lưu thay đổi. Hãy kiểm tra API đang chạy.');
  }
}

function bindControls() {
  $('#notificationSearch').addEventListener('input', () => {
    state.currentPage = 1;
    renderNotifications();
  });
  $('#notificationCategory').addEventListener('change', () => {
    state.currentPage = 1;
    renderNotifications();
  });
  $('#notificationStatus').addEventListener('change', () => {
    state.currentPage = 1;
    renderNotifications();
  });

  $('#notificationFilterButton').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const filters = $('#notificationFilters');
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!isExpanded));
    filters.classList.toggle('hidden', isExpanded);
  });

  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      state.activeTab = tab.dataset.status;
      state.currentPage = 1;
      $$('.tab').forEach((item) => {
        const isActive = item === tab;
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-selected', String(isActive));
      });
      renderNotifications();
    });
  });

  $('#notificationList').addEventListener('click', (event) => {
    const button = event.target.closest('[data-notification-id]');
    if (!button) return;

    const { notificationId, action } = button.dataset;
    const nextNotifications = state.notifications.map((item) => (
      item.id === notificationId ? { ...item, isRead: true } : item
    ));
    saveNotifications(nextNotifications, `Đã mở: ${action}.`);
  });

  $('#markAllReadButton').addEventListener('click', () => {
    const nextNotifications = state.notifications.map((item) => ({ ...item, isRead: true }));
    saveNotifications(nextNotifications, 'Đã đánh dấu tất cả thông báo là đã đọc.');
  });

  $('#notificationPagination').addEventListener('click', (event) => {
    const button = event.target.closest('[data-page]');
    if (!button || button.disabled) return;
    state.currentPage = Number(button.dataset.page);
    renderNotifications();
  });

  bindSettings();

  const profileButton = $('#profileButton');
  profileButton.addEventListener('click', () => toast('Bạn đang đăng nhập với vai trò Editor (bản demo).'));
}

function bindSettings() {
  const settings = ['emailNotifications', 'browserNotifications'];
  settings.forEach((settingId) => {
    const checkbox = $(`#${settingId}`);
    checkbox.checked = localStorage.getItem(`legalpath-${settingId}`) === 'true';
    checkbox.addEventListener('change', () => {
      localStorage.setItem(`legalpath-${settingId}`, String(checkbox.checked));
      toast('Đã cập nhật cài đặt thông báo.');
    });
  });
}

async function initPage() {
  try {
    await loadNotifications();
  } catch (error) {
    console.error('Không thể tải danh sách thông báo:', error);
    toast('Không tải được thông báo. Hãy chạy API và mở trang bằng Live Server.');
  }

  bindControls();
  renderNotifications();
}

const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
document.addEventListener('DOMContentLoaded', initPage);
