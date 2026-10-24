(() => {
  const userList = document.querySelector("#user-list");
  const searchInput = document.querySelector("#user-search");
  const userCount = document.querySelector("#user-count");
  const loadError = document.querySelector("#load-error");

  const roleLabels = {
    user: "Người dùng",
    legal_expert: "Chuyên gia pháp lý",
    expert: "Chuyên gia pháp lý",
    admin: "Quản trị viên",
  };

  let users = [];

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function roleClass(role) {
    if (role === "legal_expert" || role === "expert") return "role-badge role-badge--expert";
    if (role === "admin") return "role-badge role-badge--manager";
    return "role-badge";
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("vi-VN").format(date);
  }

  function isLocked(user) {
    return user.locked === true || user["khóa"] === true;
  }

  function createActionButtons(user) {
    const actions = createElement("div", "row-actions");
    const editButton = createElement("button", "row-action");
    editButton.type = "button";
    editButton.title = "Chỉnh sửa tài khoản";
    editButton.setAttribute("aria-label", editButton.title);
    editButton.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m13.9 3.1 3 3-9.8 9.8-4 .9.9-4 9.9-9.7Zm-1.1 1.1 3 3"/></svg>';
    editButton.addEventListener("click", () => openEditor(user));

    const locked = isLocked(user);
    const lockButton = createElement("button", "row-action");
    lockButton.type = "button";
    lockButton.title = locked ? "Mở khóa tài khoản" : "Khóa tài khoản";
    lockButton.setAttribute("aria-label", lockButton.title);
    lockButton.innerHTML = locked
      ? '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 8V5.5a4 4 0 0 1 7.7-1.6l-1.8.8A2 2 0 0 0 8 5.5V8h8v9H4V8h2Z"/></svg>'
      : '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 8V5.8a5 5 0 0 1 10 0V8h1.5v9h-13V8H5Zm2 0h6V5.8a3 3 0 0 0-6 0V8Zm3 3v3"/></svg>';
    lockButton.addEventListener("click", () => toggleLock(user));
    actions.append(editButton, lockButton);
    return actions;
  }

  function render() {
    const query = searchInput.value.trim().toLocaleLowerCase("vi");
    const visibleUsers = users.filter((user) =>
      [user.name, user.identity].some((value) =>
        String(value || "").toLocaleLowerCase("vi").includes(query)
      )
    );
    userList.replaceChildren();

    if (visibleUsers.length === 0) {
      const row = createElement("tr");
      const cell = createElement(
        "td",
        "table-message",
        users.length ? "Không tìm thấy tài khoản phù hợp." : "Chưa có tài khoản nào."
      );
      cell.colSpan = 5;
      row.append(cell);
      userList.append(row);
      userCount.textContent = users.length ? "Không có kết quả" : "0 tài khoản";
      return;
    }

    visibleUsers.forEach((user) => {
      const row = createElement("tr");
      const identityCell = createElement("td");
      identityCell.append(
        createElement("span", "user-name", user.name || "Chưa cập nhật tên"),
        createElement("span", "user-email", user.identity || "Chưa cập nhật email")
      );

      const roleCell = createElement("td");
      const role = typeof user.role === "string" ? user.role : "user";
      roleCell.append(createElement("span", roleClass(role), roleLabels[role] || "Người dùng"));

      const locked = isLocked(user);
      const statusCell = createElement(
        "td",
        locked ? "status status--inactive" : "status",
        locked ? "Đã khóa" : "Hoạt động"
      );
      const dateCell = createElement("td", "date-cell", formatDate(user.createdAt));
      const actionCell = createElement("td");
      actionCell.append(createActionButtons(user));
      row.append(identityCell, roleCell, statusCell, dateCell, actionCell);
      userList.append(row);
    });

    userCount.textContent = query
      ? `${visibleUsers.length} / ${users.length} tài khoản`
      : `${users.length} tài khoản`;
  }

  async function loadUsers() {
    try {
      const result = await window.LegalPathAPI.getUsers();
      if (!Array.isArray(result)) throw new Error("API không trả về danh sách tài khoản hợp lệ.");
      users = result.filter((user) => user && typeof user === "object");
      loadError.hidden = true;
      loadError.textContent = "";
      render();
    } catch (error) {
      console.error("Không thể tải danh sách tài khoản:", error);
      userList.replaceChildren();
      const row = createElement("tr");
      const cell = createElement("td", "table-message", "Không tải được danh sách tài khoản.");
      cell.colSpan = 5;
      row.append(cell);
      userList.append(row);
      userCount.textContent = "Không tải được dữ liệu";
      loadError.textContent = error instanceof TypeError
        ? "Không kết nối được máy chủ API."
        : error.message;
      loadError.hidden = false;
    }
  }

  const editor = document.createElement("dialog");
  editor.className = "user-editor";
  editor.setAttribute("aria-labelledby", "user-editor-title");
  const editorForm = document.createElement("form");
  editorForm.className = "user-editor__form";
  const editorTitle = createElement("h2", "user-editor__title", "Chỉnh sửa tài khoản");
  editorTitle.id = "user-editor-title";

  const nameLabel = createElement("label", "user-editor__label", "Họ tên");
  const nameInput = document.createElement("input");
  nameInput.name = "name";
  nameInput.required = true;
  nameInput.maxLength = 100;
  nameInput.autocomplete = "name";
  nameLabel.append(nameInput);

  const identityLabel = createElement("label", "user-editor__label", "Email hoặc số điện thoại");
  const identityInput = document.createElement("input");
  identityInput.name = "identity";
  identityInput.type = "text";
  identityInput.required = true;
  identityInput.maxLength = 254;
  identityInput.autocomplete = "username";
  identityLabel.append(identityInput);

  const roleLabel = createElement("label", "user-editor__label", "Vai trò");
  const roleSelect = document.createElement("select");
  roleSelect.name = "role";
  [
    ["user", "Người dùng"],
    ["legal_expert", "Chuyên gia pháp lý"],
    ["admin", "Quản trị viên"],
  ].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    roleSelect.append(option);
  });
  roleLabel.append(roleSelect);

  const editorError = createElement("p", "user-editor__error");
  editorError.setAttribute("role", "alert");
  editorError.hidden = true;
  const editorActions = createElement("div", "user-editor__actions");
  const cancelButton = createElement("button", "user-editor__cancel", "Hủy");
  cancelButton.type = "button";
  const saveButton = createElement("button", "user-editor__save", "Lưu thay đổi");
  saveButton.type = "submit";
  editorActions.append(cancelButton, saveButton);
  editorForm.append(editorTitle, nameLabel, identityLabel, roleLabel, editorError, editorActions);
  editor.append(editorForm);
  document.body.append(editor);

  const lockConfirmation = document.createElement("dialog");
  lockConfirmation.className = "lock-confirmation";
  lockConfirmation.setAttribute("aria-labelledby", "lock-confirmation-title");
  const lockConfirmationContent = createElement("div", "lock-confirmation__content");
  const lockConfirmationTitle = createElement("h2", "lock-confirmation__title", "Xác nhận thay đổi trạng thái");
  lockConfirmationTitle.id = "lock-confirmation-title";
  const lockConfirmationMessage = createElement("p", "lock-confirmation__message");
  const lockConfirmationActions = createElement("div", "lock-confirmation__actions");
  const cancelLockButton = createElement("button", "lock-confirmation__cancel", "Hủy");
  cancelLockButton.type = "button";
  const confirmLockButton = createElement("button", "lock-confirmation__confirm", "Xác nhận");
  confirmLockButton.type = "button";
  lockConfirmationActions.append(cancelLockButton, confirmLockButton);
  lockConfirmationContent.append(
    lockConfirmationTitle,
    lockConfirmationMessage,
    lockConfirmationActions
  );
  lockConfirmation.append(lockConfirmationContent);
  document.body.append(lockConfirmation);

  let editingUser = null;
  let userToToggle = null;

  function openEditor(user) {
    if (user.id === undefined || user.id === null) {
      loadError.textContent = "Không thể chỉnh sửa vì tài khoản không có ID từ API.";
      loadError.hidden = false;
      return;
    }
    editingUser = user;
    nameInput.value = user.name || "";
    identityInput.value = user.identity || "";
    roleSelect.value = roleLabels[user.role] ? user.role : "user";
    editorError.textContent = "";
    editorError.hidden = true;
    editor.showModal();
    nameInput.focus();
  }

  async function saveUser(event) {
    event.preventDefault();
    const name = nameInput.value.trim().replace(/\s+/g, " ");
    const identity = identityInput.value.trim();
    if (!name || !identity) {
      editorError.textContent = "Vui lòng nhập đầy đủ họ tên và email hoặc số điện thoại.";
      editorError.hidden = false;
      return;
    }

    const normalizedIdentity = identity.toLocaleLowerCase("vi");
    const duplicate = users.some((user) =>
      user !== editingUser &&
      String(user.identity || "").toLocaleLowerCase("vi") === normalizedIdentity
    );
    if (duplicate) {
      editorError.textContent = "Email hoặc số điện thoại này đã được tài khoản khác sử dụng.";
      editorError.hidden = false;
      identityInput.focus();
      return;
    }

    saveButton.disabled = true;
    editorError.hidden = true;
    try {
      await window.LegalPathAPI.updateUser(editingUser.id, { name, identity, role: roleSelect.value });
      editor.close();
      await loadUsers();
    } catch (error) {
      console.error("Không thể cập nhật tài khoản:", error);
      editorError.textContent = error instanceof TypeError
        ? "Không kết nối được máy chủ API."
        : error.message;
      editorError.hidden = false;
    } finally {
      saveButton.disabled = false;
    }
  }

  async function toggleLock(user) {
    if (user.id === undefined || user.id === null) {
      loadError.textContent = "Không thể đổi trạng thái vì tài khoản không có ID từ API.";
      loadError.hidden = false;
      return;
    }
    const locked = isLocked(user);
    const action = locked ? "mở khóa" : "khóa";
    userToToggle = user;
    lockConfirmationTitle.textContent = `Xác nhận ${action} tài khoản`;
    lockConfirmationMessage.textContent =
      `Bạn có chắc muốn ${action} tài khoản "${user.name || user.identity}"?`;
    confirmLockButton.textContent = locked ? "Mở khóa" : "Khóa tài khoản";
    lockConfirmation.showModal();
    confirmLockButton.focus();
  }

  async function updateLock(user) {
    const locked = isLocked(user);
    const action = locked ? "mở khóa" : "khóa";
    confirmLockButton.disabled = true;
    try {
      await window.LegalPathAPI.updateUser(user.id, { locked: !locked });
      await loadUsers();
    } catch (error) {
      console.error(`Không thể ${action} tài khoản:`, error);
      loadError.textContent = error instanceof TypeError
        ? "Không kết nối được máy chủ API."
        : error.message;
      loadError.hidden = false;
    } finally {
      confirmLockButton.disabled = false;
    }
  }

  cancelButton.addEventListener("click", () => editor.close());
  editorForm.addEventListener("submit", saveUser);
  editor.addEventListener("click", (event) => {
    if (event.target === editor) editor.close();
  });
  cancelLockButton.addEventListener("click", () => {
    userToToggle = null;
    lockConfirmation.close();
  });
  confirmLockButton.addEventListener("click", () => {
    if (!userToToggle) return;
    const selectedUser = userToToggle;
    userToToggle = null;
    lockConfirmation.close();
    updateLock(selectedUser);
  });
  lockConfirmation.addEventListener("click", (event) => {
    if (event.target === lockConfirmation) {
      userToToggle = null;
      lockConfirmation.close();
    }
  });
  searchInput.addEventListener("input", render);
  loadUsers();
})();
