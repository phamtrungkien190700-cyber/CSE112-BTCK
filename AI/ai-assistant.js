"use strict";

(() => {
  const recommendationForm = document.querySelector("#recommendation-form");
  const riskForm = document.querySelector("#risk-form");
  if (!recommendationForm || !riskForm) return;

  const byId = (id) => document.getElementById(id);
  const elements = {
    workspaceStatus: byId("workspace-status"),
    recommendationQuery: byId("recommendation-query"),
    recommendationProgress: byId("recommendation-progress"),
    recommendationResult: byId("recommendation-result"),
    recommendationActions: byId("recommendation-actions"),
    riskProcedure: byId("risk-procedure"),
    riskSituation: byId("risk-situation"),
    riskProgress: byId("risk-progress"),
    riskResult: byId("risk-result"),
    riskActions: byId("risk-actions"),
    savedProcedures: byId("saved-procedures"),
    savedProceduresEmpty: byId("saved-procedures-empty"),
    riskReviews: byId("risk-reviews"),
    riskReviewsEmpty: byId("risk-reviews-empty")
  };

  const ignoredTerms = new Set([
    "ban", "toi", "minh", "muon", "can", "tim", "hieu", "ho", "so", "thu",
    "tuc", "ve", "cho", "mot", "va", "la", "co", "cua", "theo", "xin",
    "huong", "dan", "giup", "voi", "duoc", "nay", "do", "bi", "tai"
  ]);
  const riskLabels = {
    urgent_deadline: "Có nhắc đến thời hạn gấp hoặc sắp hết hạn",
    missing_documents: "Có nhắc đến giấy tờ còn thiếu",
    high_stakes: "Có nhắc đến tranh chấp hoặc hậu quả đáng kể",
    unclear_scope: "Phạm vi hoặc thông tin tình huống còn chưa rõ"
  };
  const levelLabels = {
    high: "Cần ưu tiên hỏi ý kiến chuyên gia",
    medium: "Nên kiểm tra thêm trước khi nộp",
    low: "Chưa thấy dấu hiệu cảnh báo theo bộ quy tắc",
    "needs-review": "Chưa đủ thông tin để phân loại"
  };
  const state = {
    categories: [],
    procedures: [],
    workspace: { savedProcedures: [], riskReviews: [] },
    recommendation: null,
    risk: null,
    recommendationBusy: false,
    riskBusy: false
  };

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
      .toLocaleLowerCase("vi");
  }

  function tokens(text) {
    return normalize(text)
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2 && !ignoredTerms.has(token));
  }

  function showMessage(element, message, isError = false) {
    element.textContent = message;
    element.classList.toggle("is-error", isError);
  }

  function getProcedure(id) {
    return state.procedures.find((procedure) => procedure.id === id);
  }

  function renderProcedureOptions() {
    const placeholder = createElement("option", "", "Chưa xác định thủ tục");
    placeholder.value = "";
    elements.riskProcedure.replaceChildren(placeholder);
    state.procedures.forEach((procedure) => {
      const option = createElement(
        "option",
        "",
        `${procedure.name}${procedure.is_sample ? " · dữ liệu minh họa" : ""}`
      );
      option.value = procedure.id;
      elements.riskProcedure.append(option);
    });
  }

  function renderWorkspace() {
    elements.savedProcedures.replaceChildren();
    elements.savedProceduresEmpty.hidden = state.workspace.savedProcedures.length > 0;
    state.workspace.savedProcedures.forEach((saved) => {
      const procedure = getProcedure(saved.procedureId);
      if (!procedure) return;
      const item = createElement("li", "ai-saved__item");
      const detail = createElement("span");
      detail.append(createElement("strong", "", procedure.name));
      detail.append(createElement("small", "", `Đã lưu · mức khớp ${saved.score}% · ${saved.reason}`));
      const removeButton = createElement("button", "btn btn--quiet", "Xóa");
      removeButton.type = "button";
      removeButton.dataset.savedProcedureId = saved.procedureId;
      removeButton.setAttribute("aria-label", `Xóa thủ tục đã lưu: ${procedure.name}`);
      item.append(detail, removeButton);
      elements.savedProcedures.append(item);
    });

    elements.riskReviews.replaceChildren();
    elements.riskReviewsEmpty.hidden = state.workspace.riskReviews.length > 0;
    state.workspace.riskReviews.forEach((review) => {
      const item = createElement("li", "ai-saved__item");
      const detail = createElement("span");
      const procedure = review.procedureId ? getProcedure(review.procedureId) : null;
      const date = new Date(review.createdAt);
      const dateText = Number.isNaN(date.valueOf())
        ? "Ngày lưu không xác định"
        : date.toLocaleString("vi-VN");
      detail.append(createElement("strong", "", levelLabels[review.level]));
      detail.append(createElement(
        "small",
        "",
        `${dateText} · ${procedure?.name || "Chưa gắn thủ tục"} · ${review.score}% thông tin`
      ));
      const removeButton = createElement("button", "btn btn--quiet", "Xóa");
      removeButton.type = "button";
      removeButton.dataset.riskReviewId = review.id;
      removeButton.setAttribute("aria-label", `Xóa lịch sử: ${levelLabels[review.level]}`);
      item.append(detail, removeButton);
      elements.riskReviews.append(item);
    });
  }

  function createStepList(activeStep) {
    const steps = [
      "Nhập thông tin",
      "Đối chiếu dữ liệu",
      "Hiển thị kết quả",
      "Giải thích lý do",
      "Chọn sửa, chấp nhận hoặc từ chối",
      "Lưu sau khi chấp nhận"
    ];
    const list = createElement("ol", "ai-result__steps");
    steps.forEach((label, index) => {
      const item = createElement("li", index < activeStep ? "is-complete" : "");
      item.textContent = `${index + 1}. ${label}`;
      list.append(item);
    });
    return list;
  }

  function scoreRecommendation(procedure, queryTokens) {
    const searchableText = normalize([
      procedure.name,
      procedure.category_name,
      procedure.code,
      ...(procedure.required_documents || [])
    ].join(" "));
    const matched = [...new Set(queryTokens.filter((token) => searchableText.includes(token)))];
    if (!matched.length) return null;
    const coverage = matched.length / queryTokens.length;
    const confidence = Math.min(95, Math.round(42 + coverage * 50 - (procedure.is_sample ? 12 : 0)));
    return {
      procedure,
      matched,
      confidence,
      reason: matched.slice(0, 4).join(", ")
    };
  }

  function renderRecommendationResult(result) {
    state.recommendation = result;
    elements.recommendationResult.replaceChildren();
    elements.recommendationActions.hidden = !result;
    if (!result) return;

    const heading = createElement("h3", "", result.uncertain
      ? "Chưa thể đưa ra gợi ý đáng tin cậy"
      : "Gợi ý dựa trên thông tin bạn nhập");
    const explanation = createElement("p", "ai-result__reasons", result.explanation);
    const score = createElement(
      "p",
      "ai-result__meta",
      `Mức khớp theo từ khóa: ${result.confidence}% · Đây không phải xác suất đúng pháp lý.`
    );
    const content = [heading, explanation, score];

    if (result.procedure) {
      const procedure = result.procedure;
      const item = createElement("p", "", procedure.name);
      item.setAttribute("aria-label", "Thủ tục được gợi ý");
      content.push(item);
      if (procedure.is_sample) {
        content.push(createElement(
          "p",
          "ai-result__sample",
          "Dữ liệu minh họa: cần kiểm tra quy định, hồ sơ, cơ quan, thời hạn và lệ phí từ nguồn chính thức."
        ));
      }
      const reasons = createElement("p", "ai-result__reasons", `Từ khóa trùng: ${result.reason || "không có"}.`);
      content.push(reasons);
      const choiceLabel = createElement("label", "ai-result__choice", "Chỉnh sửa thủ tục được chọn");
      const choice = document.createElement("select");
      choice.id = "recommendation-choice";
      choice.setAttribute("aria-label", "Chỉnh sửa thủ tục được chọn");
      state.procedures.forEach((candidate) => {
        const option = createElement(
          "option",
          "",
          `${candidate.name}${candidate.is_sample ? " · dữ liệu minh họa" : ""}`
        );
        option.value = candidate.id;
        option.selected = candidate.id === procedure.id;
        choice.append(option);
      });
      choiceLabel.append(choice);
      content.push(choiceLabel);
    } else {
      content.push(createElement(
        "p",
        "ai-result__caution",
        "Hãy mô tả cụ thể hơn loại thủ tục hoặc giấy tờ bạn cần. Bạn vẫn có thể tra cứu thủ công."
      ));
    }
    content.push(createStepList(result.uncertain ? 4 : 5));
    elements.recommendationResult.append(...content);
    elements.recommendationActions.hidden = false;
  }

  function makeRecommendation(query) {
    const queryTokens = [...new Set(tokens(query))];
    if (queryTokens.length === 0) {
      return {
        uncertain: true,
        confidence: 0,
        explanation: "Mô tả hiện chưa có từ khóa đủ cụ thể để đối chiếu."
      };
    }
    const ranked = state.procedures
      .map((procedure) => scoreRecommendation(procedure, queryTokens))
      .filter(Boolean)
      .sort((left, right) =>
        right.confidence - left.confidence ||
        Number(Boolean(left.procedure.is_sample)) - Number(Boolean(right.procedure.is_sample))
      );
    const best = ranked[0];
    if (!best || best.confidence < 48) {
      return {
        uncertain: true,
        confidence: best?.confidence || 0,
        explanation: "Chưa tìm thấy đối chiếu đủ rõ trong dữ liệu thủ tục hiện có."
      };
    }
    return {
      ...best,
      alternatives: ranked.slice(1, 5),
      explanation: `Đối chiếu ${queryTokens.length} từ khóa với tên thủ tục, lĩnh vực và giấy tờ cần chuẩn bị. Gợi ý đứng đầu vì trùng ${best.matched.length} từ khóa.`
    };
  }

  async function runRecommendation() {
    const query = elements.recommendationQuery.value.trim();
    if (query.length < 8) {
      elements.recommendationQuery.setCustomValidity("Hãy mô tả nhu cầu bằng ít nhất 8 ký tự.");
      elements.recommendationQuery.reportValidity();
      elements.recommendationQuery.setCustomValidity("");
      return;
    }
    state.recommendationBusy = true;
    elements.recommendationActions.hidden = true;
    elements.recommendationProgress.hidden = false;
    showMessage(elements.recommendationProgress, "Đang đối chiếu nhu cầu với danh mục thủ tục...");
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      renderRecommendationResult(makeRecommendation(query));
    } finally {
      elements.recommendationProgress.hidden = true;
      state.recommendationBusy = false;
    }
  }

  function analyzeRisk(situation, procedureId) {
    const normalized = normalize(situation);
    const words = tokens(situation);
    const reasonCodes = [];
    if (/\b(gap|sap het han|qua han|han chot|mai|hom nay|ngay cuoi)\b/.test(normalized)) {
      reasonCodes.push("urgent_deadline");
    }
    if (/(thieu giay to|thieu ho so|chua co giay|chua du ho so|bo sung ho so)/.test(normalized)) {
      reasonCodes.push("missing_documents");
    }
    if (/(tranh chap|bi lua|mat dat|khoi kien|bi kien|boi thuong lon|bi cuong che)/.test(normalized)) {
      reasonCodes.push("high_stakes");
    }
    if (/(khong ro|khong chac|chua biet|khong biet|khong nho|mau thuan)/.test(normalized)) {
      reasonCodes.push("unclear_scope");
    }

    const confidence = Math.min(
      92,
      38 + Math.min(words.length, 8) * 5 + (procedureId ? 12 : 0)
    );
    const uncertain = words.length < 3 && !procedureId;
    const level = uncertain
      ? "needs-review"
      : reasonCodes.includes("urgent_deadline") || reasonCodes.includes("high_stakes")
        ? "high"
        : reasonCodes.length
          ? "medium"
          : "low";
    const explanations = reasonCodes.map((code) => riskLabels[code]);
    if (!explanations.length) explanations.push("Không phát hiện từ khóa cảnh báo trong phần mô tả hiện tại.");
    if (uncertain) explanations.push("Mô tả còn quá ngắn để phân loại; vui lòng bổ sung loại việc và mốc thời gian.");

    return { level, confidence, reasonCodes, uncertain, explanations, procedureId: procedureId || null };
  }

  function renderRiskResult(result) {
    state.risk = result;
    elements.riskResult.replaceChildren();
    elements.riskActions.hidden = !result;
    if (!result) return;

    elements.riskResult.append(
      createElement("h3", "", levelLabels[result.level]),
      createElement("p", "ai-result__meta", `Mức đủ thông tin: ${result.confidence}% · Dấu hiệu theo quy tắc, không phải đánh giá pháp lý.`),
      createElement("p", "ai-result__reasons", result.explanations.join(" · ")),
      createElement("p", "ai-result__caution", "Đây chỉ là rà soát từ khóa. Hãy đối chiếu giấy tờ và thời hạn với cơ quan tiếp nhận hoặc chuyên gia."),
      createStepList(result.uncertain ? 4 : 5)
    );
    elements.riskActions.hidden = false;
  }

  async function runRiskReview() {
    const situation = elements.riskSituation.value.trim();
    if (situation.length < 12) {
      elements.riskSituation.setCustomValidity("Hãy mô tả tình huống bằng ít nhất 12 ký tự.");
      elements.riskSituation.reportValidity();
      elements.riskSituation.setCustomValidity("");
      return;
    }
    state.riskBusy = true;
    elements.riskActions.hidden = true;
    elements.riskProgress.hidden = false;
    showMessage(elements.riskProgress, "Đang rà soát dấu hiệu thời hạn, hồ sơ và mức độ khẩn cấp...");
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      renderRiskResult(analyzeRisk(situation, elements.riskProcedure.value));
    } finally {
      elements.riskProgress.hidden = true;
      state.riskBusy = false;
    }
  }

  async function persistWorkspace(successMessage) {
    try {
      state.workspace = await window.AiAssistantAPI.saveUserWorkspace(state.workspace);
      renderWorkspace();
      showMessage(elements.workspaceStatus, successMessage);
    } catch (error) {
      console.error("Không thể lưu không gian trợ lý:", error);
      showMessage(elements.workspaceStatus, `Không thể lưu dữ liệu. ${error.message}`, true);
      throw error;
    }
  }

  async function handleRecommendationAction(action) {
    if (!state.recommendation || state.recommendationBusy) return;
    if (action === "edit") {
      elements.recommendationQuery.focus();
      return;
    }
    if (action === "retry") {
      await runRecommendation();
      return;
    }
    if (action === "reject") {
      renderRecommendationResult(null);
      showMessage(elements.workspaceStatus, "Đã từ chối gợi ý. Không có dữ liệu nào được lưu.");
      return;
    }
    if (action !== "save") return;
    if (state.recommendation.uncertain || !state.recommendation.procedure) {
      showMessage(elements.workspaceStatus, "Chưa có gợi ý đủ rõ để lưu. Hãy bổ sung thông tin trước.", true);
      return;
    }
    const procedureId = byId("recommendation-choice")?.value || state.recommendation.procedure.id;
    const procedure = getProcedure(procedureId);
    const item = {
      procedureId,
      reason: state.recommendation.reason || "Thủ tục do người dùng tự chọn",
      score: state.recommendation.confidence
    };
    const previousSavedProcedures = state.workspace.savedProcedures;
    state.workspace.savedProcedures = [
      item,
      ...state.workspace.savedProcedures.filter((saved) => saved.procedureId !== procedureId)
    ].slice(0, 100);
    try {
      await persistWorkspace(`Đã lưu "${procedure.name}" vào không gian của bạn.`);
      renderRecommendationResult(null);
    } catch {
      state.workspace.savedProcedures = previousSavedProcedures;
      renderWorkspace();
    }
  }

  async function handleRiskAction(action) {
    if (!state.risk || state.riskBusy) return;
    if (action === "edit") {
      elements.riskSituation.focus();
      return;
    }
    if (action === "retry") {
      await runRiskReview();
      return;
    }
    if (action === "reject") {
      renderRiskResult(null);
      showMessage(elements.workspaceStatus, "Đã từ chối kết quả. Nội dung mô tả không được lưu.");
      return;
    }
    if (action !== "save") return;

    const review = {
      id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      level: state.risk.level,
      score: state.risk.confidence,
      reasonCodes: state.risk.reasonCodes,
      procedureId: state.risk.procedureId
    };
    const previousRiskReviews = state.workspace.riskReviews;
    state.workspace.riskReviews = [review, ...state.workspace.riskReviews].slice(0, 25);
    try {
      await persistWorkspace("Đã lưu kết quả rà soát. Nội dung tình huống không được lưu.");
      renderRiskResult(null);
    } catch {
      state.workspace.riskReviews = previousRiskReviews;
      renderWorkspace();
    }
  }

  async function loadData() {
    showMessage(elements.workspaceStatus, "Đang tải danh mục thủ tục và dữ liệu đã lưu...");
    try {
      const [categories, workspace] = await Promise.all([
        window.AiAssistantAPI.getLegalCategories(),
        window.AiAssistantAPI.getUserWorkspace()
      ]);
      if (!Array.isArray(categories)) throw new Error("Danh sách thủ tục không hợp lệ.");
      state.categories = categories;
      state.procedures = categories.flatMap((category) =>
        (Array.isArray(category.procedures) ? category.procedures : []).map((procedure) => ({
          ...procedure,
          category_id: category.category_id,
          category_name: category.category_name
        }))
      );
      if (
        !workspace ||
        !Array.isArray(workspace.savedProcedures) ||
        !Array.isArray(workspace.riskReviews)
      ) {
        throw new Error("Dữ liệu trợ lý đã lưu không hợp lệ.");
      }
      state.workspace = workspace;
      renderProcedureOptions();
      renderWorkspace();
      showMessage(elements.workspaceStatus, `${state.procedures.length} thủ tục sẵn sàng. Các gợi ý được xử lý cục bộ.`);
    } catch (error) {
      console.error("Không thể tải dữ liệu trợ lý:", error);
      showMessage(elements.workspaceStatus, `Không thể tải dữ liệu trợ lý. ${error.message}`, true);
      const retry = createElement("button", "btn", "Thử tải lại");
      retry.type = "button";
      retry.addEventListener("click", loadData);
      elements.workspaceStatus.append(" ", retry);
    }
  }

  recommendationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runRecommendation();
  });
  riskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runRiskReview();
  });
  document.addEventListener("click", (event) => {
    const recommendationAction = event.target.closest("[data-recommendation-action]");
    if (recommendationAction) {
      handleRecommendationAction(recommendationAction.dataset.recommendationAction);
      return;
    }
    const riskAction = event.target.closest("[data-risk-action]");
    if (riskAction) {
      handleRiskAction(riskAction.dataset.riskAction);
      return;
    }
    const removeSaved = event.target.closest("[data-saved-procedure-id]");
    if (removeSaved) {
      const previousSavedProcedures = state.workspace.savedProcedures;
      state.workspace.savedProcedures = state.workspace.savedProcedures
        .filter((item) => item.procedureId !== removeSaved.dataset.savedProcedureId);
      persistWorkspace("Đã xóa thủ tục đã lưu.").catch(() => {
        state.workspace.savedProcedures = previousSavedProcedures;
        renderWorkspace();
      });
      return;
    }
    const removeReview = event.target.closest("[data-risk-review-id]");
    if (removeReview) {
      const previousRiskReviews = state.workspace.riskReviews;
      state.workspace.riskReviews = state.workspace.riskReviews
        .filter((item) => item.id !== removeReview.dataset.riskReviewId);
      persistWorkspace("Đã xóa kết quả rà soát.").catch(() => {
        state.workspace.riskReviews = previousRiskReviews;
        renderWorkspace();
      });
    }
  });
  byId("clear-risk-reviews").addEventListener("click", () => {
    const previousRiskReviews = state.workspace.riskReviews;
    state.workspace.riskReviews = [];
    persistWorkspace("Đã xóa lịch sử rà soát.").catch(() => {
      state.workspace.riskReviews = previousRiskReviews;
      renderWorkspace();
    });
  });

  loadData();
})();
