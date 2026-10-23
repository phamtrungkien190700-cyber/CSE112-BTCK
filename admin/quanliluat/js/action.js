(() => {
  const API_URL = "http://localhost:3000/list-luat";
  const categoryList = document.querySelector("#category-list");
  const searchInput = document.querySelector("#category-search");
  const categoryCount = document.querySelector("#category-count");
  const loadError = document.querySelector("#load-error");
  const addButton = document.querySelector(".add-button");

  let categories = [];

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .toLocaleLowerCase("vi");
  }

  function categoryCode(category, index) {
    if (category.category_id) return category.category_id;
    const code = String(index + 1).padStart(2, "0");
    return `CAT-${code}`;
  }

  function createActions(category) {
    const actions = createElement("div", "row-actions");
    const editButton = createElement("button", "row-action");
    editButton.type = "button";
    editButton.title = "Chỉnh sửa lĩnh vực";
    editButton.setAttribute("aria-label", editButton.title);
    editButton.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m13.9 3.1 3 3-9.8 9.8-4 .9.9-4 9.9-9.7Zm-1.1 1.1 3 3"/></svg>';
    editButton.addEventListener("click", () => openEditor(category));

    const deleteButton = createElement("button", "row-action");
    deleteButton.type = "button";
    deleteButton.title = "Xóa lĩnh vực";
    deleteButton.setAttribute("aria-label", deleteButton.title);
    deleteButton.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 6h8l-.6 11H6.6L6 6Zm-2-2h12v2H4V4Zm4-2h4l1 2H7l1-2Zm1 6v6m2-6v6"/></svg>';
    deleteButton.addEventListener("click", () => deleteCategory(category));
    actions.append(editButton, deleteButton);
    return actions;
  }

  function render() {
    const query = normalize(searchInput.value.trim());
    const visibleCategories = categories
      .map((category, index) => ({ category, index }))
      .filter(({ category, index }) =>
        normalize([
          category.category_id,
          category.category_name,
          category.name,
          categoryCode(category, index),
        ].join(" ")).includes(query)
      );
    categoryList.replaceChildren();

    if (!visibleCategories.length) {
      const row = createElement("tr");
      const cell = createElement(
        "td",
        "table-message",
        categories.length ? "Không tìm thấy lĩnh vực phù hợp." : "Chưa có lĩnh vực nào."
      );
      cell.colSpan = 5;
      row.append(cell);
      categoryList.append(row);
      categoryCount.textContent = categories.length ? "Không có kết quả" : "0 lĩnh vực";
      return;
    }

    visibleCategories.forEach(({ category, index }) => {
      const row = createElement("tr");
      const id = createElement("td", "category-id", categoryCode(category, index));
      const name = createElement(
        "td",
        "category-name",
        category.category_name || category.name || "Chưa đặt tên"
      );
      const level = createElement("td");
      level.append(createElement("span", "level-badge", "Lĩnh vực gốc"));
      const procedureCount = Array.isArray(category.procedures)
        ? category.procedures.length
        : 0;
      const count = createElement("td", "procedure-count", `${procedureCount} thủ tục`);
      const actions = createElement("td");
      actions.append(createActions(category));
      row.append(id, name, level, count, actions);
      categoryList.append(row);
    });

    categoryCount.textContent = query
      ? `${visibleCategories.length} / ${categories.length} lĩnh vực`
      : `${categories.length} lĩnh vực`;
  }

  async function loadCategories() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`API phản hồi HTTP ${response.status}.`);
      const result = await response.json();
      if (!Array.isArray(result)) {
        throw new Error("API không trả về danh sách lĩnh vực hợp lệ.");
      }
      result.forEach((category) => {
        if (
          !category ||
          typeof category !== "object" ||
          typeof (category.category_name || category.name) !== "string"
        ) {
          throw new Error("Dữ liệu danh mục không hợp lệ.");
        }
        if (category.procedures !== undefined && !Array.isArray(category.procedures)) {
          throw new Error(`Danh sách thủ tục của "${category.category_name}" không hợp lệ.`);
        }
      });
      categories = result;
      loadError.hidden = true;
      loadError.textContent = "";
      render();
    } catch (error) {
      console.error("Không thể tải danh sách lĩnh vực:", error);
      categoryList.replaceChildren();
      const row = createElement("tr");
      const cell = createElement("td", "table-message", "Không tải được danh sách lĩnh vực.");
      cell.colSpan = 5;
      row.append(cell);
      categoryList.append(row);
      categoryCount.textContent = "Không tải được dữ liệu";
      loadError.textContent = error instanceof TypeError
        ? `Không kết nối được API. Hãy kiểm tra máy chủ tại ${API_URL}.`
        : error.message;
      loadError.hidden = false;
    }
  }

  const editor = document.createElement("dialog");
  editor.className = "category-editor";
  editor.setAttribute("aria-labelledby", "category-editor-title");
  const editorForm = document.createElement("form");
  editorForm.className = "category-editor__form";
  editorForm.method = "dialog";
  const editorTitle = createElement("h2", "category-editor__title");
  editorTitle.id = "category-editor-title";
  const idLabel = createElement("label", "category-editor__label", "Mã lĩnh vực");
  const idInput = document.createElement("input");
  idInput.name = "category_id";
  idInput.required = true;
  idInput.maxLength = 100;
  idInput.autocomplete = "off";
  idLabel.append(idInput);
  const nameLabel = createElement("label", "category-editor__label", "Tên lĩnh vực");
  const nameInput = document.createElement("input");
  nameInput.name = "category_name";
  nameInput.required = true;
  nameInput.maxLength = 200;
  nameInput.autocomplete = "off";
  nameLabel.append(nameInput);
  const editorError = createElement("p", "category-editor__error");
  editorError.setAttribute("role", "alert");
  editorError.hidden = true;
  const editorActions = createElement("div", "category-editor__actions");
  const cancelButton = createElement("button", "category-editor__cancel", "Hủy");
  cancelButton.type = "button";
  const saveButton = createElement("button", "category-editor__save", "Lưu");
  saveButton.type = "submit";
  editorActions.append(cancelButton, saveButton);
  editorForm.append(editorTitle, idLabel, nameLabel, editorError, editorActions);
  editor.append(editorForm);
  document.body.append(editor);

  let editingCategory = null;

  function openEditor(category = null) {
    editingCategory = category;
    editorTitle.textContent = category ? "Chỉnh sửa lĩnh vực" : "Thêm lĩnh vực mới";
    idInput.value = category?.category_id || "";
    nameInput.value = category?.category_name || category?.name || "";
    idInput.readOnly = false;
    editorError.textContent = "";
    editorError.hidden = true;
    editor.showModal();
    (category ? nameInput : idInput).focus();
  }

  function showEditorError(message) {
    editorError.textContent = message;
    editorError.hidden = false;
  }

  async function saveCategory(event) {
    event.preventDefault();
    const categoryId = idInput.value.trim();
    const categoryName = nameInput.value.trim();
    if (editingCategory && (editingCategory.id === undefined || editingCategory.id === null)) {
      showEditorError("Không thể chỉnh sửa vì bản ghi không có ID từ API.");
      return;
    }
    if (!categoryId || !categoryName) {
      showEditorError("Vui lòng nhập đầy đủ mã và tên lĩnh vực.");
      return;
    }

    const duplicate = categories.some((category) =>
      category !== editingCategory &&
      String(category.category_id || "").toLocaleLowerCase("vi") === categoryId.toLocaleLowerCase("vi")
    );
    if (duplicate) {
      showEditorError("Mã lĩnh vực này đã tồn tại.");
      idInput.focus();
      return;
    }

    saveButton.disabled = true;
    editorError.hidden = true;
    try {
      const response = await fetch(
        editingCategory ? `${API_URL}/${encodeURIComponent(editingCategory.id)}` : API_URL,
        {
          method: editingCategory ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category_id: categoryId,
            category_name: categoryName,
            ...(editingCategory ? {} : { procedures: [] }),
          }),
        }
      );
      if (!response.ok) {
        throw new Error(`Không lưu được lĩnh vực (HTTP ${response.status}).`);
      }
      editor.close();
      await loadCategories();
    } catch (error) {
      console.error("Không thể lưu lĩnh vực:", error);
      showEditorError(error instanceof TypeError
        ? `Không kết nối được API tại ${API_URL}.`
        : error.message);
    } finally {
      saveButton.disabled = false;
    }
  }

  async function deleteCategory(category) {
    const categoryName = category.category_name || category.name || "lĩnh vực này";
    if (category.id === undefined || category.id === null) {
      loadError.textContent = "Không thể xóa vì bản ghi không có ID từ API.";
      loadError.hidden = false;
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn xóa "${categoryName}"? Các thủ tục thuộc lĩnh vực này cũng sẽ bị xóa.`)) {
      return;
    }
    try {
      const response = await fetch(`${API_URL}/${encodeURIComponent(category.id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Không xóa được lĩnh vực (HTTP ${response.status}).`);
      }
      await loadCategories();
    } catch (error) {
      console.error("Không thể xóa lĩnh vực:", error);
      loadError.textContent = error instanceof TypeError
        ? `Không kết nối được API tại ${API_URL}.`
        : error.message;
      loadError.hidden = false;
    }
  }

  addButton.addEventListener("click", () => openEditor());
  cancelButton.addEventListener("click", () => editor.close());
  editorForm.addEventListener("submit", saveCategory);
  editor.addEventListener("click", (event) => {
    if (event.target === editor) editor.close();
  });
  searchInput.addEventListener("input", render);
  loadCategories();
})();
