(() => {
  const categoryList = document.querySelector("#category-list");
  const procedureList = document.querySelector("#procedure-list");
  const categoryStatus = document.querySelector("#categories-status");
  const procedureStatus = document.querySelector("#procedures-status");
  const searchForm = document.querySelector("#search-form");
  const searchInput = document.querySelector("#search-input");
  const categoryFilter = document.querySelector("#category-filter");
  const feeFilter = document.querySelector("#fee-filter");
  const procedureSort = document.querySelector("#procedure-sort");
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
        searchInput.value = "";
        categoryFilter.value = category.category_id;
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
    if (procedure.is_sample) {
      dialogContent.append(
        createElement(
          "p",
          "procedure-sample-notice",
          "Dữ liệu minh họa để kiểm thử giao diện; cần xác minh quy định, hồ sơ, cơ quan, thời hạn và lệ phí từ nguồn chính thức."
        )
      );
    }

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
    const visibleProcedures = procedures.filter((procedure) => {
      const matchesCategory = categoryFilter.value === "all" || procedure.category_id === categoryFilter.value;
      const feeText = normalize(procedure.fee);
      const feeCategory = !procedure.fee || feeText.includes("can xac minh") || feeText.includes("du lieu minh hoa")
        ? "unknown"
        : feeText.includes("mien phi") ? "free" : "paid";
      return matchesCategory
        && (feeFilter.value === "all" || feeCategory === feeFilter.value)
        && procedureMatches(procedure, query);
    });
    if (procedureSort.value === "name") {
      visibleProcedures.sort((left, right) => left.name.localeCompare(right.name, "vi"));
    }
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
      if (procedure.is_sample) {
        card.append(createElement("span", "procedure-card__sample", "Dữ liệu minh họa"));
      }
      card.addEventListener("click", () => showProcedure(procedure));
      procedureList.append(card);
    });

    procedureStatus.textContent = visibleProcedures.length
      ? `${visibleProcedures.length} thủ tục phù hợp`
      : "Không tìm thấy thủ tục phù hợp. Hãy thử từ khóa khác.";
    if (!visibleProcedures.length) {
      const resetButton = createElement("button", "button button--quiet", "Xóa bộ lọc");
      resetButton.type = "button";
      resetButton.addEventListener("click", resetFilters);
      procedureList.append(resetButton);
    }
  }

  function render() {
    const query = normalize(searchInput.value.trim());
    renderCategories(query);
    renderProcedures(query);
  }

  async function loadData() {
    try {
      categories = readCategories(await window.LegalPathAPI.getLegalCategories());
      procedures = categories.flatMap((category) =>
        category.procedures.map((procedure) => ({
          ...procedure,
          category_id: category.category_id,
          category_name: category.category_name
        }))
      );
      categoryFilter.replaceChildren();
      const allOption = createElement("option", "", "Tất cả lĩnh vực");
      allOption.value = "all";
      categoryFilter.append(allOption);
      categories.forEach((category) => {
        const option = createElement("option", "", category.category_name);
        option.value = category.category_id;
        categoryFilter.append(option);
      });
      render();
    } catch (error) {
      console.error("Không thể tải dữ liệu LegalPath:", error);
      categoryStatus.textContent = `Không thể tải dữ liệu. ${error.message}`;
      procedureStatus.textContent = "Danh sách thủ tục hiện chưa khả dụng.";
      const retryButton = createElement("button", "button button--quiet", "Thử tải lại");
      retryButton.type = "button";
      retryButton.addEventListener("click", loadData);
      categoryList.replaceChildren(retryButton);
    }
  }

  function resetFilters() {
    searchInput.value = "";
    categoryFilter.value = "all";
    feeFilter.value = "all";
    procedureSort.value = "relevance";
    render();
  }

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  searchInput.addEventListener("input", render);
  categoryFilter.addEventListener("change", render);
  feeFilter.addEventListener("change", render);
  procedureSort.addEventListener("change", render);
  document.querySelector("#reset-search").addEventListener("click", resetFilters);
  document.querySelector("#dialog-close").addEventListener("click", () => {
    procedureDialog.close();
  });
  procedureDialog.addEventListener("click", (event) => {
    if (event.target === procedureDialog) procedureDialog.close();
  });

  loadData();
})();
