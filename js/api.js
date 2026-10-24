"use strict";

(function () {
  const API_PREFIX = "/api/";
  const API_ORIGIN = window.location.port === "3001"
    ? ""
    : `http://${window.location.hostname || "localhost"}:3001`;

  async function request(method, endpoint, payload) {
    const normalizedEndpoint = String(endpoint || "").replace(/^\/+/, "");
    const options = {
      method: String(method || "GET").toUpperCase(),
      credentials: "include",
      headers: {}
    };
    if (payload !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(payload);
    }

    let response;
    try {
      response = await fetch(`${API_ORIGIN}${API_PREFIX}${normalizedEndpoint}`, options);
    } catch (error) {
      throw new Error("Không kết nối được API. Hãy chạy `node server.js` trong thư mục dự án rồi thử lại.");
    }
    const contentType = response.headers.get("content-type") || "";
    const result = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
    if (!response.ok) {
      const message = result && typeof result === "object" && result.error
        ? result.error
        : `API request failed (HTTP ${response.status}).`;
      throw new Error(message);
    }
    return result;
  }

  const api = {
    request,
    getCurrentUser: () => request("GET", "auth/me"),
    login: (credentials) => request("POST", "auth/login", credentials),
    register: (details) => request("POST", "auth/register", details),
    logout: () => request("POST", "auth/logout", {}),
    getUsers: () => request("GET", "users"),
    updateUser: (id, data) => request("PATCH", `users/${encodeURIComponent(id)}`, data),
    getLegalCategories: () => request("GET", "legal-categories"),
    createLegalCategory: (data) => request("POST", "legal-categories", data),
    updateLegalCategory: (id, data) => request("PATCH", `legal-categories/${encodeURIComponent(id)}`, data),
    deleteLegalCategory: (id) => request("DELETE", `legal-categories/${encodeURIComponent(id)}`),
    getExperts: () => request("GET", "experts-directory"),
    getNotifications: () => request("GET", "notifications"),
    updateNotification: (id, data) => request("PATCH", `notifications/${encodeURIComponent(id)}`, data),
    getUserWorkspace: () => request("GET", "user-workspace"),
    saveUserWorkspace: (data) => request("PUT", "user-workspace", data)
  };

  const expertPortalApi = {
    baseURL: `${API_ORIGIN}${API_PREFIX}portal`,
    request,
    getPortalData: () => request("GET", "portal"),
    savePortalData: (data) => request("PUT", "portal", data),
    getArticles: () => request("GET", "articles"),
    getArticle: (id) => request("GET", `articles/${encodeURIComponent(id)}`),
    createArticle: (data) => request("POST", "articles", data),
    updateArticle: (id, data) => request("PUT", `articles/${encodeURIComponent(id)}`, data),
    deleteArticle: (id) => request("DELETE", `articles/${encodeURIComponent(id)}`),
    getChecklists: () => request("GET", "checklists"),
    getChecklist: (id) => request("GET", `checklists/${encodeURIComponent(id)}`),
    createChecklist: (data) => request("POST", "checklists", data),
    updateChecklist: (id, data) => request("PUT", `checklists/${encodeURIComponent(id)}`, data),
    deleteChecklist: (id) => request("DELETE", `checklists/${encodeURIComponent(id)}`),
    getProfile: async () => (await request("GET", "portal")).profile,
    updateProfile: async (profile) => {
      const data = await request("GET", "portal");
      data.profile = profile;
      await request("PUT", "portal", data);
      return data.profile;
    }
  };

  window.LegalPathAPI = api;
  window.MindCareMockAPI = expertPortalApi;
  window.mockApi = expertPortalApi;
  window.loadArticles = () => expertPortalApi.getArticles();
  window.loadProfile = () => expertPortalApi.getProfile();
})();
