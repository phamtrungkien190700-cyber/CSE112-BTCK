(() => {
  const API_URL = "http://localhost:3001/list-luat";
  const categoryList = document.querySelector("#category-list");
  const procedureList = document.querySelector("#procedure-list");
  const categoryStatus = document.querySelector("#categories-status");
  const procedureStatus = document.querySelector("#procedures-status");
  const searchForm = document.querySelector("#search-form");
  const searchInput = document.querySelector("#search-input");
  const procedureDialog = document.querySelector("#procedure-dialog");
  const dialogTitle = document.querySelector("#dialog-title");
  const dialogContent = document.querySelector("#dialog-content");

  let categories = [];
  let procedures = [];

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function normalize(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .toLowerCase();
  }

  function readCategories(response) {
    const result = Array.isArray(response) ? response : response?.data;
    if (!Array.isArray(result)) {
      throw new Error("API không trả về danh sách lĩnh vực hợp lệ.");
    }

    result.forEach((category) => {
      if (
        !category ||
        typeof category.category_name !== "string" ||
        !Array.isArray(category.procedures)
      ) {
        throw new Error("Dữ liệu lĩnh vực không hợp lệ.");
      }
      category.procedures.forEach((procedure) => {
        if (!procedure || typeof procedure.name !== "string") {
          throw new Error("Dữ liệu thủ tục không hợp lệ.");
        }
      });
    });

    return result;
  }

  function categoryMatches(category, query) {
    const categoryText = normalize([
      category.category_name,
      ...category.procedures.map((procedure) => procedure.name)
    ].join(" "));
    return categoryText.includes(query);
  }

  function procedureMatches(procedure, query) {
    return normalize([
      procedure.name,
      procedure.code,
      procedure.category_name,
      procedure.processing_time,
      procedure.fee,
      procedure.competent_authority,
      ...(Array.isArray(procedure.required_documents) ? procedure.required_documents : [])
    ].join(" ")).includes(query);
  }

  function renderCategories(query) {
    const visibleCategories = categories.filter((category) => categoryMatches(category, query));
    categoryList.replaceChildren();

    visibleCategories.forEach((category, index) => {
      const card = createElement("button", "category-card");
      card.type = "button";
      card.setAttribute("aria-label", `Xem thủ tục lĩnh vực ${category.category_name}`);

      const icon = createElement("span", "card-icon", ["§", "⌂", "▤", "◇"][index % 4]);
      icon.setAttribute("aria-hidden", "true");
      const title = createElement("h3", "", category.category_name);
      const description = createElement(
        "p",
        "",
        category.procedures[0]?.name || "Xem các thông tin và thủ tục thuộc lĩnh vực này."
      );
      const count = createElement(
        "span",
        "card-meta",
        `${category.procedures.length} thủ tục`
      );

      card.append(icon, title, description, count);
      card.addEventListener("click", () => {
        searchInput.value = category.category_name;
        render();
        document.querySelector("#procedures").scrollIntoView({ behavior: "smooth" });
      });
      categoryList.append(card);
    });

    categoryStatus.textContent = visibleCategories.length
      ? `${visibleCategories.length} lĩnh vực pháp luật`
      : "Không tìm thấy lĩnh vực phù hợp.";
  }

  function showProcedure(procedure) {
    dialogTitle.textContent = procedure.name;
    dialogContent.replaceChildren();

    const details = createElement("dl", "procedure-details");
    [
      ["Mã thủ tục", procedure.code],
      ["Lĩnh vực", procedure.category_name],
      ["Thời gian giải quyết", procedure.processing_time],
      ["Lệ phí", procedure.fee],
      ["Cơ quan thực hiện", procedure.competent_authority]
    ].forEach(([label, value]) => {
      details.append(createElement("dt", "", label));
      details.append(createElement("dd", "", value || "Chưa có thông tin"));
    });

    const documentsTitle = createElement("h3", "", "Hồ sơ cần chuẩn bị");
    const documents = createElement("ul", "document-list");
    const requiredDocuments = Array.isArray(procedure.required_documents)
      ? procedure.required_documents
      : [];
    if (requiredDocuments.length) {
      requiredDocuments.forEach((documentName) => {
        documents.append(createElement("li", "", documentName));
      });
    } else {
      documents.append(createElement("li", "", "Chưa có thông tin."));
    }
    dialogContent.append(details, documentsTitle, documents);
    procedureDialog.showModal();
  }

  function renderProcedures(query) {
    const visibleProcedures = procedures.filter((procedure) => procedureMatches(procedure, query));
    procedureList.replaceChildren();

    visibleProcedures.forEach((procedure, index) => {
      const card = createElement("button", "procedure-card");
      card.type = "button";
      card.setAttribute("aria-label", `Xem chi tiết: ${procedure.name}`);
      const icon = createElement("span", "card-icon", ["▤", "⌂", "◇", "§"][index % 4]);
      icon.setAttribute("aria-hidden", "true");
      const category = createElement("span", "procedure-card__category", procedure.category_name);
      const title = createElement("h3", "", procedure.name);
      const description = createElement(
        "p",
        "",
        procedure.processing_time || "Chọn để xem chi tiết thủ tục."
      );
      card.append(icon, category, title, description);
      card.addEventListener("click", () => showProcedure(procedure));
      procedureList.append(card);
    });

    procedureStatus.textContent = visibleProcedures.length
      ? `${visibleProcedures.length} thủ tục phù hợp`
      : "Không tìm thấy thủ tục phù hợp. Hãy thử từ khóa khác.";
  }

  function render() {
    const query = normalize(searchInput.value.trim());
    renderCategories(query);
    renderProcedures(query);
  }

  async function loadData() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`Không tải được dữ liệu (HTTP ${response.status}).`);
      }
      categories = readCategories(await response.json());
      procedures = categories.flatMap((category) =>
        category.procedures.map((procedure) => ({
          ...procedure,
          category_id: category.category_id,
          category_name: category.category_name
        }))
      );
      render();
    } catch (error) {
      console.error("Không thể tải dữ liệu LegalPath:", error);
      categoryStatus.textContent = `Không thể tải dữ liệu. ${error.message} Kiểm tra API tại ${API_URL}.`;
      procedureStatus.textContent = "Danh sách thủ tục hiện chưa khả dụng.";
    }
  }

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  searchInput.addEventListener("input", render);
  document.querySelector("#dialog-close").addEventListener("click", () => {
    procedureDialog.close();
  });
  procedureDialog.addEventListener("click", (event) => {
    if (event.target === procedureDialog) procedureDialog.close();
  });

  loadData();
})();
