(() => {
  const root = document.querySelector("#checklist");
  const categoriesContainer = document.querySelector("#checklist-categories");
  const status = document.querySelector("#checklist-status");
  const saveButton = document.querySelector("#save-progress");
  const storageKey = "legalpath-checklist-progress";

  let procedures = [];
  let savedProgress = {};

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function showStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  }

  function getCategories(data) {
    const categories = Array.isArray(data) ? data : data?.data;

    if (!Array.isArray(categories)) {
      throw new Error("API không trả về danh sách lĩnh vực hợp lệ.");
    }

    categories.forEach((category) => {
      if (
        !category ||
        typeof category.category_name !== "string" ||
        !Array.isArray(category.procedures)
      ) {
        throw new Error("Dữ liệu lĩnh vực không hợp lệ.");
      }

      category.procedures.forEach((procedure) => {
        if (
          !procedure ||
          typeof procedure.id !== "string" ||
          typeof procedure.name !== "string" ||
          !Array.isArray(procedure.required_documents) ||
          !procedure.required_documents.every((document) => typeof document === "string")
        ) {
          throw new Error("Dữ liệu thủ tục hoặc required_documents không hợp lệ.");
        }
      });
    });

    return categories;
  }

  function loadSavedProgress() {
    const data = localStorage.getItem(storageKey);
    if (!data) return {};

    const progress = JSON.parse(data);
    if (!progress || typeof progress !== "object" || Array.isArray(progress)) {
      throw new Error("Dữ liệu tiến độ đã lưu không hợp lệ.");
    }

    return progress;
  }

  function updateProgress(card) {
    const checkboxes = Array.from(card.querySelectorAll("input[type='checkbox']"));
    const completed = checkboxes.filter((checkbox) => checkbox.checked).length;
    const total = checkboxes.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    card.querySelector(".procedure-card__progress-label").textContent =
      `Đã hoàn thành ${completed}/${total} bước`;
    card.querySelector(".procedure-card__progress-fill").style.width = `${percent}%`;
    card.querySelector(".procedure-card__progress").setAttribute("aria-valuenow", String(percent));
  }

  function renderProcedure(procedure) {
    const card = createElement("article", "procedure-card");
    card.dataset.procedureId = procedure.id;

    const header = createElement("header", "procedure-card__header");
    header.append(createElement("h3", "procedure-card__name", procedure.name));

    const progressRow = createElement("div", "procedure-card__progress-row");
    const progressLabel = createElement("span", "procedure-card__progress-label");
    const progressBar = createElement("div", "procedure-card__progress");
    progressBar.setAttribute("role", "progressbar");
    progressBar.setAttribute("aria-label", `Tiến độ: ${procedure.name}`);
    progressBar.setAttribute("aria-valuemin", "0");
    progressBar.setAttribute("aria-valuemax", "100");
    progressBar.append(createElement("span", "procedure-card__progress-fill"));
    progressRow.append(progressLabel, progressBar);
    header.append(progressRow);

    const steps = createElement("ol", "procedure-card__steps");
    procedure.required_documents.forEach((documentName, index) => {
      const item = createElement("li");
      const label = createElement("label", "procedure-step");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = savedProgress[procedure.id]?.[index] === true;
      checkbox.setAttribute("aria-label", `Bước ${index + 1}: ${documentName}`);

      const title = createElement(
        "span",
        "procedure-step__title",
        `Bước ${index + 1}: ${documentName}`
      );
      label.append(checkbox, title);
      item.append(label);
      steps.append(item);
    });

    card.append(header, steps);
    updateProgress(card);
    return card;
  }

  function renderCategories(categories) {
    categoriesContainer.replaceChildren();

    categories.forEach((category) => {
      const section = createElement("section", "checklist-category");
      section.append(createElement("h2", "checklist-category__title", category.category_name));
      category.procedures.forEach((procedure) => section.append(renderProcedure(procedure)));
      categoriesContainer.append(section);
    });

    if (procedures.length === 0) {
      categoriesContainer.append(
        createElement("p", "checklist__empty", "Chưa có thủ tục nào trong danh sách.")
      );
    }
  }

  categoriesContainer.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLInputElement) || event.target.type !== "checkbox") return;

    const card = event.target.closest(".procedure-card");
    updateProgress(card);
    showStatus("Có thay đổi chưa được lưu.");
  });

  saveButton.addEventListener("click", () => {
    const progress = {};

    procedures.forEach((procedure) => {
      const card = Array.from(categoriesContainer.querySelectorAll(".procedure-card"))
        .find((item) => item.dataset.procedureId === procedure.id);
      progress[procedure.id] = Array.from(card.querySelectorAll("input[type='checkbox']"))
        .map((checkbox) => checkbox.checked);
    });

    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
      savedProgress = progress;
      showStatus("Đã lưu tiến độ checklist trên thiết bị này.");
    } catch (error) {
      console.error("Không thể lưu tiến độ checklist:", error);
      showStatus("Không thể lưu tiến độ. Hãy kiểm tra cài đặt bộ nhớ trình duyệt.", true);
    }
  });

  async function loadChecklist() {
    try {
      const response = await fetch(root.dataset.apiUrl);
      if (!response.ok) {
        throw new Error(`API trả về lỗi HTTP ${response.status}.`);
      }

      const categories = getCategories(await response.json());
      procedures = categories.flatMap((category) => category.procedures);

      let progressError = false;
      try {
        savedProgress = loadSavedProgress();
      } catch (error) {
        console.error("Không thể đọc tiến độ checklist đã lưu:", error);
        progressError = true;
      }

      renderCategories(categories);
      saveButton.disabled = procedures.length === 0;

      if (progressError) {
        showStatus("Không thể đọc tiến độ đã lưu. Bạn có thể tạo và lưu tiến độ mới.", true);
      } else {
        showStatus(`${procedures.length} thủ tục đã sẵn sàng.`);
      }
    } catch (error) {
      console.error("Không thể tải dữ liệu checklist:", error);
      showStatus(
        `Không thể tải dữ liệu checklist: ${error.message} Hãy kiểm tra JSON Server tại ${root.dataset.apiUrl}.`,
        true
      );
      categoriesContainer.replaceChildren(
        createElement("p", "checklist__empty", "Không có dữ liệu để hiển thị.")
      );
    }
  }

  loadChecklist();
})();
