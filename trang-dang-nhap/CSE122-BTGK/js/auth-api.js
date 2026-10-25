(() => {
  const API_USERS = "http://localhost:3000/list-user";
  const CURRENT_USER_KEY = "legalpath.auth.user.v1";

  function normalizeIdentity(identity) {
    return String(identity || "").trim().toLowerCase();
  }

  function createHttpError(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
  }

  async function findUsersByIdentity(identity) {
    const normalizedIdentity = normalizeIdentity(identity);
    const query = new URLSearchParams({ identity: normalizedIdentity });
    const response = await fetch(`${API_USERS}?${query}`, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) throw createHttpError(`Không thể kiểm tra tài khoản (HTTP ${response.status}).`, response.status);
    const users = await response.json();
    if (!Array.isArray(users)) throw new Error("Dữ liệu tài khoản từ API không hợp lệ.");
    return users.filter((user) => normalizeIdentity(user.identity) === normalizedIdentity);
  }

  async function createUser(user) {
    const response = await fetch(API_USERS, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(user)
    });
    if (!response.ok) throw createHttpError(`Không thể tạo tài khoản (HTTP ${response.status}).`, response.status);
    return response.json();
  }

  async function getUserById(id) {
    const response = await fetch(`${API_USERS}/${encodeURIComponent(id)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) throw createHttpError(`Không thể tải hồ sơ tài khoản (HTTP ${response.status}).`, response.status);
    const user = await response.json();
    if (!user || String(user.id) !== String(id)) {
      throw new Error("API trả về hồ sơ tài khoản không hợp lệ.");
    }
    return user;
  }

  async function updateUser(id, updates) {
    const response = await fetch(`${API_USERS}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw createHttpError(`Không thể cập nhật tài khoản (HTTP ${response.status}).`, response.status);
    const user = await response.json();
    if (!user || String(user.id) !== String(id)) {
      throw new Error("API trả về hồ sơ tài khoản đã cập nhật không hợp lệ.");
    }
    return user;
  }

  function setCurrentUser(user) {
    if (!user || user.id === undefined || !user.role) {
      throw new Error("Không thể lưu phiên đăng nhập không hợp lệ.");
    }
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
      id: user.id,
      identity: user.identity,
      role: user.role
    }));
  }

  function getCurrentUser() {
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    if (!saved) return null;
    const user = JSON.parse(saved);
    if (!user || typeof user !== "object" || user.id === undefined || !user.role) {
      throw new Error("Thông tin phiên đăng nhập đã lưu không hợp lệ.");
    }
    return user;
  }

  window.LegalPathAuthApi = Object.freeze({
    findUsersByIdentity,
    createUser,
    normalizeIdentity,
    getUserById,
    updateUser,
    setCurrentUser,
    getCurrentUser
  });
})();
