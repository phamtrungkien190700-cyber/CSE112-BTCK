// api.js - API cho cổng chuyên gia, lưu dữ liệu qua backend Node.js
(function () {
  const API_BASE_URL = "http://[::1]:3001/api/portal";

  function cloneData(data) {
    return data == null ? data : JSON.parse(JSON.stringify(data));
  }

  async function readPortalData() {
    const saved = await MockAPI.getPortalData();
    if (saved) return saved;
    const storeRef = globalThis.Store || window.Store;
    return storeRef && typeof storeRef.get === "function"
      ? cloneData(storeRef.get())
      : { articles: [], checklists: [], profile: null };
  }

  function createId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  const MockAPI = {
    baseURL: API_BASE_URL,

    async getPortalData() {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`Không tải được dữ liệu từ API (HTTP ${response.status}).`);
      }
      return response.json();
    },

    async savePortalData(data) {
      const response = await fetch(API_BASE_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 405) {
          throw new Error("API backend không hỗ trợ lưu dữ liệu. Hãy chạy `node server.js` ở cổng 3001; Live Server chỉ dùng để mở trang HTML.");
        }
        throw new Error(result?.error || `Không lưu được dữ liệu qua API (HTTP ${response.status}).`);
      }
      return result;
    },

    async request(method, endpoint, payload) {
      const parts = String(endpoint || "").replace(/^\/+/, "").split("/").filter(Boolean);
      const data = await readPortalData();
      const collection = parts[0];
      const id = parts[1];

      if (method === "GET") {
        if (!collection) return cloneData(data);
        if (collection === "articles") {
          return cloneData(id ? data.articles.find((item) => item.id === id) || null : data.articles);
        }
        if (collection === "checklists") {
          return cloneData(id ? data.checklists.find((item) => item.id === id) || null : data.checklists);
        }
        if (collection === "profile") return cloneData(data.profile);
      }

      if (method === "POST" && ["articles", "checklists"].includes(collection)) {
        const item = { ...payload, id: payload.id || createId(collection === "articles" ? "art" : "cl") };
        data[collection].unshift(item);
        await this.savePortalData(data);
        return cloneData(item);
      }

      if (method === "PUT" && collection === "profile") {
        data.profile = { ...(data.profile || {}), ...payload };
        await this.savePortalData(data);
        return cloneData(data.profile);
      }

      if (method === "PUT" && ["articles", "checklists"].includes(collection) && id) {
        const index = data[collection].findIndex((item) => item.id === id);
        if (index < 0) return null;
        data[collection][index] = { ...data[collection][index], ...payload, id };
        await this.savePortalData(data);
        return cloneData(data[collection][index]);
      }

      if (method === "DELETE" && ["articles", "checklists"].includes(collection) && id) {
        const index = data[collection].findIndex((item) => item.id === id);
        if (index < 0) return null;
        const [removed] = data[collection].splice(index, 1);
        await this.savePortalData(data);
        return cloneData(removed);
      }

      throw new Error(`Unsupported mock API route: ${method} ${endpoint}`);
    },

    async getArticles() {
      return this.request("GET", "articles");
    },
    async getArticle(id) {
      return this.request("GET", `articles/${id}`);
    },
    async createArticle(data) {
      return this.request("POST", "articles", data);
    },
    async updateArticle(id, data) {
      return this.request("PUT", `articles/${id}`, data);
    },
    async deleteArticle(id) {
      return this.request("DELETE", `articles/${id}`);
    },

    async getChecklists() {
      return this.request("GET", "checklists");
    },
    async getChecklist(id) {
      return this.request("GET", `checklists/${id}`);
    },
    async createChecklist(data) {
      return this.request("POST", "checklists", data);
    },
    async updateChecklist(id, data) {
      return this.request("PUT", `checklists/${id}`, data);
    },
    async deleteChecklist(id) {
      return this.request("DELETE", `checklists/${id}`);
    },

    async getProfile() {
      return this.request("GET", "profile");
    },
    async updateProfile(data) {
      return this.request("PUT", "profile", data);
    }
  };

  window.MindCareMockAPI = MockAPI;
  window.mockApi = MockAPI;

  window.loadArticles = async function loadArticles() {
    const articles = await MockAPI.getArticles();
    console.log("[MockAPI] articles:", articles);
    return articles;
  };

  window.loadProfile = async function loadProfile() {
    const profile = await MockAPI.getProfile();
    console.log("[MockAPI] profile:", profile);
    return profile;
  };
})();
