"use strict";

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
let notifications = [];
let activeStatus = "all";
let toastTimer;

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function getVisibleNotifications() {
  const query = searchInput.value.trim().toLocaleLowerCase("vi");
  const category = categoryFilter.value;
  return notifications.filter((notification) => {
    const matchesStatus = activeStatus === "all" || notification.status === activeStatus;
    const matchesCategory = category === "all" || notification.category === category;
    const searchableText = `${notification.title} ${notification.description} ${notification.action}`
      .toLocaleLowerCase("vi");
    return matchesStatus && matchesCategory && searchableText.includes(query);
  });
}

function renderNotification(notification) {
  const row = createElement(
    "article",
    `notification-row${notification.status === "unread" ? " unread" : ""}`
  );
  row.dataset.id = notification.id;

  const copy = createElement("div", "notification-copy");
  copy.append(
    createElement("strong", "notification-title", notification.title),
    createElement("div", "notification-description", notification.description)
  );
  const time = createElement("time", "notification-time");
  time.dateTime = `${notification.date.split("/").reverse().join("-")}T${notification.time}:00`;
  time.append(
    document.createTextNode(notification.time),
    createElement("span", "", notification.date)
  );
  const status = createElement(
    "span",
    `status-badge${notification.status === "read" ? " read" : ""}`,
    notification.status === "read" ? "Đã đọc" : "Chưa đọc"
  );
  const action = createElement("button", "row-action", notification.action);
  action.type = "button";
  action.dataset.open = notification.id;
  row.append(copy, time, status, action);
  return row;
}

function renderNotifications() {
  const visible = getVisibleNotifications();
  const groups = [
    { title: "Hôm nay", notifications: visible.filter((item) => item.group === "today") },
    { title: "Trước đó", notifications: visible.filter((item) => item.group !== "today") }
  ];

  unreadCount.textContent = String(notifications.filter((item) => item.status === "unread").length);
  markAllButton.disabled = !notifications.some((item) => item.status === "unread");
  resultCount.textContent = `Hiển thị ${visible.length} thông báo gần đây`;
  list.replaceChildren();

  if (!visible.length) {
    list.append(createElement("p", "empty-state", "Không tìm thấy thông báo phù hợp."));
    return;
  }

  groups.filter((group) => group.notifications.length).forEach((group) => {
    list.append(createElement("div", "date-heading", group.title));
    group.notifications.forEach((notification) => list.append(renderNotification(notification)));
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

async function openNotification(id) {
  const notification = notifications.find((item) => item.id === id);
  if (!notification) return;
  try {
    if (notification.status !== "read") {
      await window.LegalPathAPI.updateNotification(id, { status: "read" });
      notification.status = "read";
    }
    document.querySelector("#dialogTitle").textContent = notification.title;
    document.querySelector("#dialogMeta").textContent = `${notification.date} · ${notification.time}`;
    document.querySelector("#dialogDescription").textContent = notification.detail;
    renderNotifications();
    detailDialog.showModal();
  } catch (error) {
    console.error("Không thể cập nhật trạng thái thông báo:", error);
    showToast(error.message);
  }
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

markAllButton.addEventListener("click", async () => {
  const unread = notifications.filter((item) => item.status === "unread");
  if (!unread.length) return;
  markAllButton.disabled = true;
  try {
    await Promise.all(unread.map((item) =>
      window.LegalPathAPI.updateNotification(item.id, { status: "read" })
    ));
    unread.forEach((item) => { item.status = "read"; });
    renderNotifications();
    showToast(`Đã đánh dấu ${unread.length} thông báo là đã đọc.`);
  } catch (error) {
    console.error("Không thể cập nhật trạng thái thông báo:", error);
    showToast(error.message);
    markAllButton.disabled = false;
  }
});

async function loadNotifications() {
  try {
    const result = await window.LegalPathAPI.getNotifications();
    if (!Array.isArray(result)) throw new Error("API không trả về danh sách thông báo hợp lệ.");
    notifications = result.map((notification) => ({
      ...notification,
      detail: notification.detail || notification.description
    }));
    renderNotifications();
  } catch (error) {
    console.error("Không thể tải danh sách thông báo:", error);
    list.replaceChildren(createElement("p", "empty-state", error.message));
    resultCount.textContent = "Không tải được dữ liệu";
  }
}

loadNotifications();
