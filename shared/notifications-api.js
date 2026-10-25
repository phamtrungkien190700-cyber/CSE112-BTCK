"use strict";

(() => {
  const API_URL = "http://localhost:3003/notifications";
  const CATEGORY_MAP = {
    "Phản hồi": "reply",
    "Hướng dẫn": "guide",
    "Chủ đề": "topic",
    "Bản tin": "news"
  };

  function getSession() {
    if (!window.LegalPathAuthApi) {
      throw new Error("Không tải được tiện ích kết nối tài khoản.");
    }
    const session = window.LegalPathAuthApi.getCurrentUser();
    if (!session) throw new Error("Vui lòng đăng nhập để xem thông báo.");
    return session;
  }

  async function getAllNotifications() {
    const response = await fetch(API_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Không thể tải thông báo (HTTP ${response.status}).`);
    }
    const notifications = await response.json();
    if (!Array.isArray(notifications)) {
      throw new Error("Dữ liệu thông báo từ API không hợp lệ.");
    }
    return notifications;
  }

  async function getNotifications() {
    const session = getSession();
    const userId = String(session.id);
    const notifications = await getAllNotifications();
    return notifications
      .map((notification) => ({
        ...notification,
        group: notification.group || (notification.isToday ? "today" : "previous"),
        status: notification.status || (notification.isRead ? "read" : "unread"),
        category: CATEGORY_MAP[notification.category] || notification.category
      }))
      .filter((notification) =>
        (!notification.userId || String(notification.userId) === userId) &&
        (!notification.role || notification.role === session.role)
      )
      .sort((left, right) =>
        Date.parse(right.createdAt || 0) - Date.parse(left.createdAt || 0)
      );
  }

  async function createNotification(notification) {
    const session = getSession();
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...notification,
        id: `notice-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: String(session.id),
        role: session.role,
        date: `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`,
        time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
        group: "today",
        status: "unread",
        createdAt: now.toISOString()
      })
    });
    if (!response.ok) {
      throw new Error(`Không thể gửi thông báo (HTTP ${response.status}).`);
    }
    return response.json();
  }

  async function updateNotification(id, updates) {
    const notifications = await getNotifications();
    const notification = notifications.find((item) => String(item.id) === String(id));
    if (!notification) throw new Error("Không tìm thấy thông báo của tài khoản này.");

    const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      throw new Error(`Không thể cập nhật thông báo (HTTP ${response.status}).`);
    }
    return response.json();
  }

  window.LegalPathAPI = Object.freeze({
    getNotifications,
    createNotification,
    updateNotification
  });
})();
