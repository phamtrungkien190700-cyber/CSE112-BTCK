"use strict";

const notifications = [
  {
    id: "reply-1",
    group: "today",
    title: "Câu hỏi của bạn có phản hồi mới",
    description: "Câu hỏi “Cần giấy tờ gì để đăng ký tạm trú?” đã có phản hồi. Xem hướng dẫn và các lưu ý cần thiết.",
    time: "09:15",
    date: "03/10/2026",
    status: "unread",
    category: "reply",
    action: "Xem phản hồi",
    detail: "Chuyên gia đã gửi phản hồi cho câu hỏi về thủ tục đăng ký tạm trú. Mở nội dung để xem các giấy tờ cần chuẩn bị và lưu ý khi nộp hồ sơ."
  },
  {
    id: "guide-1",
    group: "today",
    title: "Nội dung mới về thủ tục cư trú",
    description: "Hướng dẫn đăng ký tạm trú trực tuyến: điều kiện, hồ sơ và các bước thực hiện.",
    time: "08:30",
    date: "03/10/2026",
    status: "unread",
    category: "guide",
    action: "Đọc hướng dẫn",
    detail: "Hướng dẫn mới tổng hợp điều kiện đăng ký tạm trú, thành phần hồ sơ và các bước nộp trực tuyến."
  },
  {
    id: "topic-1",
    group: "earlier",
    title: "Chủ đề bạn theo dõi đã được cập nhật",
    description: "Chủ đề “Hợp đồng lao động” có thêm nội dung về quyền và nghĩa vụ khi chấm dứt hợp đồng.",
    time: "16:40",
    date: "02/10/2026",
    status: "unread",
    category: "topic",
    action: "Xem chủ đề",
    detail: "Chủ đề Hợp đồng lao động vừa được bổ sung nội dung về quyền và nghĩa vụ của các bên khi chấm dứt hợp đồng."
  },
  {
    id: "news-1",
    group: "earlier",
    title: "Bản tin pháp lý tuần này",
    description: "Những điều cần biết về bảo hiểm xã hội, cư trú và các thủ tục hành chính thường gặp.",
    time: "10:00",
    date: "01/10/2026",
    status: "read",
    category: "news",
    action: "Đọc bản tin",
    detail: "Bản tin tuần này điểm lại các cập nhật đáng chú ý về bảo hiểm xã hội, cư trú và thủ tục hành chính."
  },
  {
    id: "welcome-1",
    group: "earlier",
    title: "Chào mừng bạn đến với LegalPath",
    description: "Bắt đầu bằng cách theo dõi chủ đề bạn quan tâm và lưu lại những hướng dẫn hữu ích.",
    time: "14:20",
    date: "29/09/2026",
    status: "read",
    category: "welcome",
    action: "Khám phá chủ đề",
    detail: "Cảm ơn bạn đã tham gia LegalPath. Hãy theo dõi các chủ đề quan tâm để nhận cập nhật và lưu các hướng dẫn hữu ích."
  }
];

const list = document.querySelector("#notificationList");
const searchInput = document.querySelector("#searchInput");
const unreadCount = document.querySelector("#unreadCount");
const resultCount = document.querySelector("#resultCount");
const markAllButton = document.querySelector("#markAllButton");
const filterButton = document.querySelector("#filterButton");
const filterPanel = document.querySelector("#filterPanel");
const categoryFilter = document.querySelector("#categoryFilter");
const detailDialog = document.querySelector("#detailDialog");
const toast = document.querySelector("#toast");
let activeStatus = "all";
let toastTimer;

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function getVisibleNotifications() {
  const query = searchInput.value.trim().toLocaleLowerCase("vi");
  const category = categoryFilter.value;
  return notifications.filter((notification) => {
    const matchesStatus = activeStatus === "all" || notification.status === activeStatus;
    const matchesCategory = category === "all" || notification.category === category;
    const searchableText = `${notification.title} ${notification.description} ${notification.action}`.toLocaleLowerCase("vi");
    return matchesStatus && matchesCategory && searchableText.includes(query);
  });
}

function renderNotifications() {
  const visible = getVisibleNotifications();
  const today = visible.filter((notification) => notification.group === "today");
  const earlier = visible.filter((notification) => notification.group === "earlier");
  const groups = [
    { title: "Hôm nay · 03/10/2026", notifications: today },
    { title: "Trước đó", notifications: earlier }
  ];

  unreadCount.textContent = String(notifications.filter((notification) => notification.status === "unread").length);
  markAllButton.disabled = !notifications.some((notification) => notification.status === "unread");
  resultCount.textContent = `Hiển thị ${visible.length} thông báo gần đây`;

  if (visible.length === 0) {
    list.innerHTML = '<p class="empty-state">Không tìm thấy thông báo phù hợp.</p>';
    return;
  }

  list.innerHTML = groups
    .filter((group) => group.notifications.length > 0)
    .map((group) => `
      <div class="date-heading">${group.title}</div>
      ${group.notifications.map((notification) => `
        <article class="notification-row ${notification.status === "unread" ? "unread" : ""}" data-id="${notification.id}">
          <div class="notification-copy">
            <strong class="notification-title">${escapeHtml(notification.title)}</strong>
            <div class="notification-description">${escapeHtml(notification.description)}</div>
          </div>
          <time class="notification-time" datetime="${notification.date.split("/").reverse().join("-")}T${notification.time}:00">
            ${notification.time}<span>${notification.date}</span>
          </time>
          <span class="status-badge ${notification.status === "read" ? "read" : ""}">${notification.status === "read" ? "Đã đọc" : "Chưa đọc"}</span>
          <button class="row-action" type="button" data-open="${notification.id}">${escapeHtml(notification.action)}</button>
        </article>
      `).join("")}
    `).join("");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function openNotification(id) {
  const notification = notifications.find((item) => item.id === id);
  if (!notification) return;
  notification.status = "read";
  document.querySelector("#dialogTitle").textContent = notification.title;
  document.querySelector("#dialogMeta").textContent = `${notification.date} · ${notification.time}`;
  document.querySelector("#dialogDescription").textContent = notification.detail;
  renderNotifications();
  detailDialog.showModal();
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    activeStatus = tab.dataset.status;
    document.querySelectorAll(".tab").forEach((item) => {
      const selected = item === tab;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-selected", String(selected));
    });
    renderNotifications();
  });
});

searchInput.addEventListener("input", renderNotifications);
categoryFilter.addEventListener("change", renderNotifications);

filterButton.addEventListener("click", () => {
  const isExpanded = filterButton.getAttribute("aria-expanded") === "true";
  filterButton.setAttribute("aria-expanded", String(!isExpanded));
  filterPanel.hidden = isExpanded;
});

document.addEventListener("click", (event) => {
  if (!filterPanel.hidden && !event.target.closest(".filter-wrap")) {
    filterPanel.hidden = true;
    filterButton.setAttribute("aria-expanded", "false");
  }
});

list.addEventListener("click", (event) => {
  const action = event.target.closest("[data-open]");
  if (action) openNotification(action.dataset.open);
});

markAllButton.addEventListener("click", () => {
  const unread = notifications.filter((notification) => notification.status === "unread");
  if (unread.length === 0) return;
  unread.forEach((notification) => { notification.status = "read"; });
  renderNotifications();
  showToast(`Đã đánh dấu ${unread.length} thông báo là đã đọc.`);
});

renderNotifications();
