(() => {
  const API_USERS = "http://localhost:3000/list-user";
  const API_EXPERTS = "http://localhost:3002/experts_directory";
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

  async function ensureExpertProfile(user) {
    if (!user || user.id === undefined || !["legal_expert", "expert"].includes(user.role)) {
      throw new Error("Không thể tạo hồ sơ cho tài khoản không phải chuyên gia pháp lý.");
    }

    const query = new URLSearchParams({ user_id: String(user.id) });
    const existingResponse = await fetch(`${API_EXPERTS}?${query}`, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (!existingResponse.ok) {
      throw createHttpError(`Không thể kiểm tra hồ sơ chuyên gia (HTTP ${existingResponse.status}).`, existingResponse.status);
    }
    const existingProfiles = await existingResponse.json();
    if (!Array.isArray(existingProfiles)) {
      throw new Error("Dữ liệu hồ sơ chuyên gia từ API không hợp lệ.");
    }

    const existingProfile = existingProfiles.find(
      (profile) => String(profile.user_id) === String(user.id)
    );
    if (existingProfile) return existingProfile;

    const directoryResponse = await fetch(API_EXPERTS, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (!directoryResponse.ok) {
      throw createHttpError(`Không thể tải danh sách chuyên gia (HTTP ${directoryResponse.status}).`, directoryResponse.status);
    }
    const directory = await directoryResponse.json();
    if (!Array.isArray(directory)) {
      throw new Error("Danh sách chuyên gia từ API không hợp lệ.");
    }

    const nextNumber = directory.reduce((highest, profile) => {
      const match = /^EXP-(\d+)$/.exec(String(profile.expert_id || ""));
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0) + 1;
    const name = typeof user.name === "string" && user.name.trim()
      ? user.name.trim()
      : "Chuyên gia pháp lý";
    const initials = name
      .split(/\s+/)
      .slice(-2)
      .map((part) => part.charAt(0))
      .join("")
      .toLocaleUpperCase("vi");
    const profile = {
      user_id: String(user.id),
      expert_id: `EXP-${String(nextNumber).padStart(2, "0")}`,
      full_name: name,
      title: "Chuyên gia pháp lý",
      category_id: "chua_cap_nhat",
      avatar_initials: initials,
      description: "Hồ sơ chuyên gia chưa có phần giới thiệu.",
      action_label: "Gửi yêu cầu tư vấn"
    };

    const response = await fetch(API_EXPERTS, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(profile)
    });
    if (!response.ok) {
      throw createHttpError(`Không thể tạo hồ sơ chuyên gia (HTTP ${response.status}).`, response.status);
    }
    const createdProfile = await response.json();
    if (!createdProfile || String(createdProfile.user_id) !== String(user.id)) {
      throw new Error("API không trả về hồ sơ chuyên gia đã liên kết đúng tài khoản.");
    }
    return createdProfile;
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
    ensureExpertProfile,
    setCurrentUser,
    getCurrentUser
  });
})();
