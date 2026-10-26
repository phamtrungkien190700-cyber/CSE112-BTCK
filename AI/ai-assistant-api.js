"use strict";

(() => {
  const PROCEDURES_API_URL = "http://localhost:3001/list-luat";
  const WORKSPACE_KEY_PREFIX = "legalpath.ai-workspace.v1";

  function getWorkspaceKey() {
    const session = window.LegalPathAuthApi?.getCurrentUser();
    const userId = session?.id;
    return `${WORKSPACE_KEY_PREFIX}.${userId === undefined ? "guest" : encodeURIComponent(String(userId))}`;
  }

  async function getLegalCategories() {
    const response = await fetch(PROCEDURES_API_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) {
      throw new Error(`Không thể tải danh mục thủ tục (HTTP ${response.status}).`);
    }
    const categories = await response.json();
    if (!Array.isArray(categories)) {
      throw new Error("Dữ liệu lĩnh vực từ API không hợp lệ.");
    }
    return categories;
  }

  async function getUserWorkspace() {
    const saved = localStorage.getItem(getWorkspaceKey());
    if (!saved) return { savedProcedures: [], riskReviews: [] };

    const workspace = JSON.parse(saved);
    if (
      !workspace ||
      !Array.isArray(workspace.savedProcedures) ||
      !Array.isArray(workspace.riskReviews)
    ) {
      throw new Error("Dữ liệu trợ lý đã lưu không hợp lệ.");
    }
    return workspace;
  }

  async function saveUserWorkspace(workspace) {
    const key = getWorkspaceKey();
    const serialized = JSON.stringify(workspace);
    localStorage.setItem(key, serialized);
    return JSON.parse(serialized);
  }

  window.AiAssistantAPI = Object.freeze({
    getLegalCategories,
    getUserWorkspace,
    saveUserWorkspace
  });
})();
