"use strict";

(() => {
  const EXPERT_CONTENT_API = "http://localhost:3003/expert_content/portal";
  const EXPERTS_API = "http://localhost:3002/experts_directory";
  const activityRows = document.querySelector("#activity-rows");
  const activityStatus = document.querySelector("#activity-status");
  if (!activityRows || !activityStatus) return;

  function normalizeName(value) {
    return String(value || "").trim().toLocaleLowerCase("vi");
  }

  function findExpert(item, experts) {
    const expertId = item.expert_id || item.expertId || item.authorExpertId;
    const userId = item.user_id || item.userId || item.authorId || item.author_id;
    const explicitReference = experts.find((expert) =>
      (expertId && String(expert.expert_id) === String(expertId)) ||
      (userId && String(expert.user_id) === String(userId))
    );
    if (explicitReference) return explicitReference;

    const author = normalizeName(item.author || item.reviewedBy || item.reviewer);
    if (author) {
      const matchingName = experts.find((expert) => {
        const fullName = normalizeName(expert.full_name);
        return fullName && (fullName === author || fullName.includes(author) || author.includes(fullName));
      });
      if (matchingName) return matchingName;

      if (author.includes("luat su") || author.includes("luật sư")) {
        const matchingTitle = experts.find((expert) =>
          normalizeName(expert.title).includes("luat su") ||
          normalizeName(expert.title).includes("luật sư")
        );
        if (matchingTitle) return matchingTitle;
      }
    }

    return experts[0] || null;
  }

  function parseDate(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
    return Number.isNaN(date.valueOf()) ? null : date;
  }

  function getChecklistEvent(checklist) {
    if (checklist.reviewedAt) {
      return {
        date: checklist.reviewedAt,
        action: checklist.reviewStatus === "rejected" ? "Từ chối" : "Duyệt",
        actionClass: checklist.reviewStatus === "rejected" ? "action--red" : "action--green"
      };
    }
    const isUpdated = checklist.updatedAt && checklist.updatedAt !== checklist.createdAt;
    return {
      date: checklist.updatedAt || checklist.createdAt,
      action: isUpdated ? "Cập nhật" : "Tạo mới",
      actionClass: isUpdated ? "action--blue" : "action--green"
    };
  }

  function getArticleEvent(article) {
    const isUpdated = article.updatedAt && article.updatedAt !== article.createdAt;
    return {
      date: article.updatedAt || article.createdAt || article.date,
      action: article.status === "published"
        ? "Xuất bản"
        : isUpdated ? "Cập nhật" : "Tạo mới",
      actionClass: article.status === "published" || !isUpdated
        ? "action--green"
        : "action--blue"
    };
  }

  function toActivity(item, entity, event, experts) {
    const date = parseDate(event.date);
    if (!date) return null;
    const expert = findExpert(item, experts);
    return {
      date,
      entity,
      action: event.action,
      actionClass: event.actionClass,
      title: item.title || item.name || "Nội dung chưa có tên",
      actor: expert?.full_name || "Chưa có hồ sơ chuyên gia"
    };
  }

  function formatRelativeDate(date) {
    const elapsed = Math.max(0, Date.now() - date.valueOf());
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Hôm qua";
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  }

  function renderActivities(record, experts) {
    if (
      !record ||
      record.id !== "portal" ||
      !Array.isArray(record.articles) ||
      !Array.isArray(record.checklists) ||
      !Array.isArray(experts) ||
      !experts.length ||
      experts.some((expert) => typeof expert.full_name !== "string" || !expert.full_name.trim())
    ) {
      throw new Error("Dữ liệu bài viết/checklist hoặc danh bạ chuyên gia không đúng định dạng.");
    }

    const activities = [
      ...record.checklists.map((checklist) =>
        toActivity(checklist, "Checklist", getChecklistEvent(checklist), experts)
      ),
      ...record.articles.map((article) =>
        toActivity(article, "Bài viết", getArticleEvent(article), experts)
      )
    ]
      .filter(Boolean)
      .sort((left, right) => right.date.valueOf() - left.date.valueOf())
      .slice(0, 5);

    activityRows.replaceChildren();
    if (!activities.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 4;
      cell.textContent = "Chưa có hoạt động nội dung để hiển thị.";
      row.append(cell);
      activityRows.append(row);
      activityStatus.textContent = "Dữ liệu đã tải thành công; chưa ghi nhận hoạt động nội dung.";
      return;
    }

    activities.forEach((activity) => {
      const row = document.createElement("tr");
      const timeCell = document.createElement("td");
      timeCell.dataset.label = "Thời gian";
      timeCell.textContent = formatRelativeDate(activity.date);

      const entityCell = document.createElement("td");
      entityCell.dataset.label = "Thực thể";
      const entityName = document.createElement("strong");
      entityName.textContent = activity.entity;
      entityCell.append(entityName);

      const actionCell = document.createElement("td");
      actionCell.dataset.label = "Hành động";
      const action = document.createElement("span");
      action.className = `action ${activity.actionClass}`;
      action.textContent = activity.action;
      actionCell.append(action, ` ${activity.title}`);

      const actorCell = document.createElement("td");
      actorCell.dataset.label = "Người thực hiện";
      actorCell.textContent = activity.actor;
      row.append(timeCell, entityCell, actionCell, actorCell);
      activityRows.append(row);
    });

    activityStatus.textContent = `Đang hiển thị ${activities.length} hoạt động gần nhất từ expert-content.json. Tên người thực hiện lấy từ danh bạ chuyên gia; thời gian và hành động suy ra từ ngày/trạng thái hiện có.`;
  }

  async function loadActivities() {
    activityRows.replaceChildren();
    activityStatus.classList.remove("is-error");
    activityStatus.textContent = "Đang tải hoạt động nội dung...";
    try {
      const [contentResponse, expertsResponse] = await Promise.all([
        fetch(EXPERT_CONTENT_API, {
          headers: { Accept: "application/json" },
          cache: "no-store"
        }),
        fetch(EXPERTS_API, {
          headers: { Accept: "application/json" },
          cache: "no-store"
        })
      ]);
      if (!contentResponse.ok) {
        throw new Error(`API nội dung phản hồi HTTP ${contentResponse.status}.`);
      }
      if (!expertsResponse.ok) {
        throw new Error(`API chuyên gia phản hồi HTTP ${expertsResponse.status}.`);
      }
      const [record, experts] = await Promise.all([
        contentResponse.json(),
        expertsResponse.json()
      ]);
      renderActivities(record, experts);
    } catch (error) {
      console.error("Không thể tải hoạt động nội dung:", error);
      activityStatus.classList.add("is-error");
      activityStatus.textContent = `Không tải được hoạt động hoặc danh bạ chuyên gia. ${error.message}`;

      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 4;
      const retry = document.createElement("button");
      retry.className = "activity-retry";
      retry.type = "button";
      retry.textContent = "Thử tải lại";
      retry.addEventListener("click", loadActivities);
      cell.append(retry);
      row.append(cell);
      activityRows.append(row);
    }
  }

  loadActivities();
})();
