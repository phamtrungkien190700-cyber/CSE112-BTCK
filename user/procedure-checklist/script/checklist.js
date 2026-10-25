(() => {
  // Giữ các biến và hàm của checklist trong phạm vi riêng, tránh trùng tên với script khác.
  const root = document.querySelector("#checklist");
  const categoriesContainer = document.querySelector("#checklist-categories");
  const status = document.querySelector("#checklist-status");
  const saveButton = document.querySelector("#save-progress");
  const storageKey = "legalpath-checklist-progress";

  // `procedures` chứa danh sách thủ tục từ API; `savedProgress` chứa trạng thái đã lưu.
  let procedures = [];
  let savedProgress = {};

  // Tạo phần tử HTML và chỉ chèn nội dung dạng text để tránh diễn giải dữ liệu thành HTML.
  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  // Hiển thị thông báo cho người dùng; bật kiểu lỗi khi isError là true.
  function showStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("la-loi", isError);
  }

  // Kiểm tra cấu trúc dữ liệu API trước khi dùng để dựng checklist.
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

  // Đọc tiến độ dạng JSON từ localStorage; nếu chưa lưu thì bắt đầu với dữ liệu rỗng.
  function loadSavedProgress() {
    const data = localStorage.getItem(storageKey);
    if (!data) return {};

    const progress = JSON.parse(data);
    if (!progress || typeof progress !== "object" || Array.isArray(progress)) {
      throw new Error("Dữ liệu tiến độ đã lưu không hợp lệ.");
    }

    return progress;
  }

  // Tính số bước đã tích, rồi đồng bộ nhãn và thanh tiến độ của một thẻ thủ tục.
  function updateProgress(card) {
    const checkboxes = Array.from(card.querySelectorAll("input[type='checkbox']"));
    const completed = checkboxes.filter((checkbox) => checkbox.checked).length;
    const total = checkboxes.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    card.querySelector(".the-thu-tuc__nhan-tien-do").textContent =
      `Đã hoàn thành ${completed}/${total} bước`;
    card.querySelector(".the-thu-tuc__muc-tien-do").style.width = `${percent}%`;
    card.querySelector(".the-thu-tuc__thanh-tien-do").setAttribute("aria-valuenow", String(percent));
  }

  // Dựng một thẻ thủ tục gồm tên, thanh tiến độ và các bước cần hoàn thành.
  function renderProcedure(procedure) {
    const card = createElement("article", "the-thu-tuc");
    card.dataset.procedureId = procedure.id;

    const header = createElement("header", "the-thu-tuc__dau");
    header.append(createElement("h3", "the-thu-tuc__ten", procedure.name));

    const progressRow = createElement("div", "the-thu-tuc__hang-tien-do");
    const progressLabel = createElement("span", "the-thu-tuc__nhan-tien-do");
    const progressBar = createElement("div", "the-thu-tuc__thanh-tien-do");
    progressBar.setAttribute("role", "progressbar");
    progressBar.setAttribute("aria-label", `Tiến độ: ${procedure.name}`);
    progressBar.setAttribute("aria-valuemin", "0");
    progressBar.setAttribute("aria-valuemax", "100");
    progressBar.append(createElement("span", "the-thu-tuc__muc-tien-do"));
    progressRow.append(progressLabel, progressBar);
    header.append(progressRow);

    const steps = createElement("ol", "the-thu-tuc__cac-buoc");
    procedure.required_documents.forEach((documentName, index) => {
      const item = createElement("li");
      const label = createElement("label", "buoc-thu-tuc");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = savedProgress[procedure.id]?.[index] === true;
      checkbox.setAttribute("aria-label", `Bước ${index + 1}: ${documentName}`);

      const title = createElement(
        "span",
        "buoc-thu-tuc__ten",
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

  // Dựng các nhóm lĩnh vực; mỗi nhóm chứa những thẻ thủ tục tương ứng.
  function renderCategories(categories) {
    categoriesContainer.replaceChildren();

    categories.forEach((category) => {
      const section = createElement("section", "nhom-linh-vuc");
      section.append(createElement("h2", "nhom-linh-vuc__tieu-de", category.category_name));
      category.procedures.forEach((procedure) => section.append(renderProcedure(procedure)));
      categoriesContainer.append(section);
    });

    if (procedures.length === 0) {
      categoriesContainer.append(
        createElement("p", "bang-kiem__trong", "Chưa có thủ tục nào trong danh sách.")
      );
    }
  }

  // Lắng nghe sự kiện ở phần tử cha để xử lý checkbox, kể cả các checkbox được tạo động.
  categoriesContainer.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLInputElement) || event.target.type !== "checkbox") return;

    const card = event.target.closest(".the-thu-tuc");
    updateProgress(card);
    showStatus("Có thay đổi chưa được lưu.");
  });

  // Thu thập lựa chọn hiện tại và lưu xuống trình duyệt của thiết bị này.
  saveButton.addEventListener("click", () => {
    const progress = {};

    procedures.forEach((procedure) => {
      const card = Array.from(categoriesContainer.querySelectorAll(".the-thu-tuc"))
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

  // Tải dữ liệu thủ tục từ API, khôi phục tiến độ đã lưu và hiển thị checklist.
  async function loadChecklist() {
    try {
      const response = await fetch(root.dataset.apiUrl);
      if (!response.ok) {
        throw new Error(`API trả về lỗi HTTP ${response.status}.`);
      }

      const categories = getCategories(await response.json());
      // Làm phẳng danh sách để dễ lưu tiến độ theo từng mã thủ tục.
      procedures = categories.flatMap((category) => category.procedures);

      // Lỗi đọc tiến độ không ngăn người dùng xem checklist hoặc tạo tiến độ mới.
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
        createElement("p", "bang-kiem__trong", "Không có dữ liệu để hiển thị.")
      );
    }
  }

  loadChecklist();
})();
