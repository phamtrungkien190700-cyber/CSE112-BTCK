"use strict";

const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { promisify } = require("node:util");
const {
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual
} = require("node:crypto");

const scryptAsync = promisify(scrypt);
const ROOT_DIR = __dirname;
const DB_FILE = process.env.PORTAL_DB_FILE || path.join(ROOT_DIR, "data", "db.json");
const DATA_DIR = path.dirname(DB_FILE);
const DATABASE_GROUPS = {
  users: ["users"],
  legal: ["legalCategories", "expertsDirectory"],
  expertContent: ["articles", "checklists", "experts"],
  notifications: ["notifications"],
  settings: ["settings"]
};
const DATABASE_FILES = {
  users: path.join(DATA_DIR, "users.json"),
  legal: path.join(DATA_DIR, "legal.json"),
  expertContent: path.join(DATA_DIR, "expert-content.json"),
  notifications: path.join(DATA_DIR, "notifications.json"),
  settings: path.join(DATA_DIR, "settings.json")
};
const PORT = Number(process.env.PORT || 3001);
const MAX_BODY_SIZE = 10 * 1024 * 1024;
const SESSION_MAX_AGE = 8 * 60 * 60 * 1000;
const sessions = new Map();
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

let writeQueue = Promise.resolve();

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function publicUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function readDatabase() {
  let legacyDatabase = {};
  try {
    const text = await fs.readFile(DB_FILE, "utf8");
    legacyDatabase = JSON.parse(text);
    if (!legacyDatabase || typeof legacyDatabase !== "object" || Array.isArray(legacyDatabase)) {
      throw new Error("The JSON database must contain an object.");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  const database = {};
  for (const [group, collections] of Object.entries(DATABASE_GROUPS)) {
    let groupData;
    try {
      groupData = JSON.parse(await fs.readFile(DATABASE_FILES[group], "utf8"));
      if (!groupData || typeof groupData !== "object" || Array.isArray(groupData)) {
        throw new Error(`The ${group} database file must contain an object.`);
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      groupData = Object.fromEntries(collections.map((collection) => [
        collection,
        legacyDatabase[collection] ?? (collection === "settings" ? {} : [])
      ]));
      await writeJsonFile(DATABASE_FILES[group], groupData);
    }
    Object.assign(database, groupData);
  }
  return database;
}

async function writeJsonFile(filePath, data) {
  const temporaryFile = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await fs.rename(temporaryFile, filePath);
}

async function updateDatabase(update) {
  const operation = writeQueue.then(async () => {
    const database = await readDatabase();
    const result = await update(database);
    for (const [group, collections] of Object.entries(DATABASE_GROUPS)) {
      const groupData = Object.fromEntries(collections.map((collection) => [collection, database[collection]]));
      await writeJsonFile(DATABASE_FILES[group], groupData);
    }
    return result;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

function parseCookies(request) {
  const cookies = {};
  String(request.headers.cookie || "").split(";").forEach((part) => {
    const cookie = part.trim();
    if (!cookie) return;
    const separator = cookie.indexOf("=");
    if (separator < 0) {
      cookies[cookie] = "";
      return;
    }
    try {
      cookies[cookie.slice(0, separator)] = decodeURIComponent(cookie.slice(separator + 1));
    } catch {
      return;
    }
  });
  return cookies;
}

async function getCurrentUser(request, database) {
  const token = parseCookies(request).legalpath_session;
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return database.users.find((user) => user.id === session.userId && user.locked !== true) || null;
}

function requireRole(user, roles) {
  if (!user) throw new HttpError(401, "Vui lòng đăng nhập để tiếp tục.");
  if (!roles.includes(user.role)) throw new HttpError(403, "Bạn không có quyền thực hiện thao tác này.");
}

function setSession(response, user) {
  const token = randomBytes(32).toString("hex");
  sessions.set(token, { userId: user.id, expiresAt: Date.now() + SESSION_MAX_AGE });
  response.setHeader(
    "Set-Cookie",
    `legalpath_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(SESSION_MAX_AGE / 1000)}`
  );
}

function clearSession(request, response) {
  const token = parseCookies(request).legalpath_session;
  if (token) sessions.delete(token);
  response.setHeader("Set-Cookie", "legalpath_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
}

function ensureSameOrigin(request, response) {
  const origin = request.headers.origin;
  if (!origin) return;
  let originUrl;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new HttpError(403, "Nguồn yêu cầu không hợp lệ.");
  }
  const requestUrl = new URL(`http://${request.headers.host || "localhost"}`);
  const isLoopback = ["localhost", "127.0.0.1", "::1"].includes(requestUrl.hostname);
  const sameLocalHost = isLoopback
    && originUrl.protocol === "http:"
    && originUrl.hostname === requestUrl.hostname;
  if (originUrl.host !== request.headers.host && !sameLocalHost) {
    throw new HttpError(403, "Yêu cầu phải đến từ cùng website.");
  }
  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Vary", "Origin");
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_BODY_SIZE) {
        reject(new HttpError(413, "Request body exceeds 10 MB."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new HttpError(400, "Request body must be valid JSON."));
      }
    });
    request.on("error", reject);
  });
}

async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = await scryptAsync(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== "string") return false;
  const [salt, hashHex] = storedHash.split(":");
  if (!salt || !/^[a-f0-9]{128}$/i.test(hashHex || "")) return false;
  const actualHash = await scryptAsync(password, salt, 64);
  return timingSafeEqual(Buffer.from(hashHex, "hex"), actualHash);
}

function newSessionUser({ name, identity, role, passwordHash }) {
  return {
    id: randomUUID(),
    name,
    identity,
    role,
    passwordHash,
    createdAt: new Date().toISOString(),
    locked: false
  };
}

function addUserNotifications(database, user) {
  const templates = database.notifications.filter((item) => item.template === true);
  templates.forEach((template) => {
    const notification = { ...template };
    delete notification.template;
    delete notification.userId;
    database.notifications.push({
      ...notification,
      id: randomUUID(),
      userId: user.id
    });
  });
}

async function bootstrapAdmin() {
  await readDatabase();
  const identity = process.env.BOOTSTRAP_ADMIN_IDENTITY;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!identity && !password) return;
  if (!identity || !password) {
    throw new Error("Set both BOOTSTRAP_ADMIN_IDENTITY and BOOTSTRAP_ADMIN_PASSWORD to create an admin account.");
  }
  if (password.length < 12) {
    throw new Error("BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters.");
  }

  const normalizedIdentity = identity.trim().toLowerCase();
  const users = (await readDatabase()).users || [];
  if (users.some((user) => user.identity === normalizedIdentity)) return;
  const user = newSessionUser({
    name: "Quản trị viên",
    identity: normalizedIdentity,
    role: "admin",
    passwordHash: await hashPassword(password)
  });
  await updateDatabase((database) => {
    database.users = Array.isArray(database.users) ? database.users : [];
    if (!database.users.some((item) => item.identity === normalizedIdentity)) {
      database.users.push(user);
      normalizeDatabase(database);
      addUserNotifications(database, user);
    }
  });
}

function normalizeDatabase(database) {
  for (const collection of [
    "users",
    "legalCategories",
    "expertsDirectory",
    "articles",
    "checklists",
    "experts",
    "notifications"
  ]) {
    if (!Array.isArray(database[collection])) database[collection] = [];
  }
  if (!database.settings || typeof database.settings !== "object" || Array.isArray(database.settings)) {
    database.settings = {};
  }
}

async function handleAuthentication(request, response, route, database) {
  if (request.method === "GET" && route === "auth/me") {
    const user = await getCurrentUser(request, database);
    sendJson(response, 200, { user: user ? publicUser(user) : null });
    return true;
  }

  if (request.method === "POST" && route === "auth/logout") {
    clearSession(request, response);
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (request.method !== "POST" || !["auth/login", "auth/register"].includes(route)) return false;
  const payload = await readRequestBody(request);
  const identity = typeof payload.identity === "string" ? payload.identity.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (route === "auth/register") {
    const name = typeof payload.name === "string" ? payload.name.trim().replace(/\s+/g, " ") : "";
    const role = payload.role;
    if (name.length < 2 || name.length > 100) throw new HttpError(400, "Họ tên phải có từ 2 đến 100 ký tự.");
    if (!/^(?:[^\s@]+@[^\s@]+\.[^\s@]{2,}|(?:\+84|0)(?:3|5|7|8|9)\d{8})$/.test(identity)) {
      throw new HttpError(400, "Vui lòng nhập email hợp lệ hoặc số điện thoại Việt Nam.");
    }
    if (password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      throw new HttpError(400, "Mật khẩu phải có từ 8 đến 128 ký tự và gồm chữ cái, chữ số.");
    }
    if (!["user", "legal_expert"].includes(role)) {
      throw new HttpError(400, "Vai trò đăng ký không hợp lệ.");
    }
    const user = newSessionUser({ name, identity, role, passwordHash: await hashPassword(password) });
    await updateDatabase((current) => {
      normalizeDatabase(current);
      if (current.users.some((item) => item.identity === identity)) {
        throw new HttpError(409, "Email hoặc số điện thoại này đã được đăng ký.");
      }
      current.users.push(user);
      addUserNotifications(current, user);
    });
    setSession(response, user);
    sendJson(response, 201, { user: publicUser(user) });
    return true;
  }

  const user = database.users.find((item) => item.identity === identity);
  const validPassword = user && await verifyPassword(password, user.passwordHash);
  if (!validPassword || user.locked === true) {
    throw new HttpError(401, "Email/số điện thoại hoặc mật khẩu không đúng.");
  }
  setSession(response, user);
  sendJson(response, 200, { user: publicUser(user) });
  return true;
}

function portalData(database, user) {
  return {
    articles: database.articles,
    checklists: database.checklists,
    profile: database.experts.find((expert) => expert.userId === user.id) || null
  };
}

async function handlePortal(request, response, database, user) {
  if (request.method === "GET") {
    requireRole(user, ["legal_expert", "admin"]);
    sendJson(response, 200, portalData(database, user));
    return true;
  }
  if (request.method !== "PUT") return false;
  requireRole(user, ["legal_expert", "admin"]);
  const payload = await readRequestBody(request);
  if (
    !payload ||
    !Array.isArray(payload.articles) ||
    !Array.isArray(payload.checklists) ||
    !(payload.profile === null || (typeof payload.profile === "object" && !Array.isArray(payload.profile)))
  ) {
    throw new HttpError(400, "Expected articles, checklists, and a profile object or null.");
  }
  await updateDatabase((current) => {
    normalizeDatabase(current);
    current.articles = payload.articles;
    current.checklists = payload.checklists;
    if (payload.profile) {
      const currentExpertIndex = current.experts.findIndex((expert) => expert.userId === user.id);
      const profile = { ...payload.profile, userId: user.id };
      if (currentExpertIndex < 0) current.experts.push(profile);
      else current.experts[currentExpertIndex] = profile;
    }
  });
  sendJson(response, 200, { ok: true });
  return true;
}

async function handleCollection(request, response, database, user, route) {
  const [collectionName, rawId] = route.split("/");
  const collectionNames = {
    users: "users",
    categories: "legalCategories",
    "legal-categories": "legalCategories",
    "experts-directory": "expertsDirectory",
    articles: "articles",
    checklists: "checklists",
    notifications: "notifications"
  };
  const collectionKey = collectionNames[collectionName];
  if (!collectionKey) return false;
  const id = rawId ? decodeURIComponent(rawId) : null;
  const isAdminCollection = ["users", "categories", "legal-categories"].includes(collectionName);

  if (request.method === "GET") {
    if (collectionKey === "users") requireRole(user, ["admin"]);
    if (collectionKey === "notifications") requireRole(user, ["user", "legal_expert", "admin"]);
    const items = database[collectionKey];
    const visibleItems = collectionKey === "users"
      ? items.map(publicUser)
      : collectionKey === "notifications"
        ? items.filter((item) => item.userId === user.id)
        : items;
    const result = id
      ? visibleItems.find((item) => String(item.id) === id || String(item.category_id) === id) || null
      : visibleItems;
    sendJson(response, result === null ? 404 : 200, result === null ? { error: "Không tìm thấy dữ liệu." } : result);
    return true;
  }

  if (isAdminCollection) requireRole(user, ["admin"]);
  else if (collectionKey === "notifications") requireRole(user, ["user", "legal_expert", "admin"]);
  else requireRole(user, ["legal_expert", "admin"]);

  if (request.method === "POST" && !id) {
    const payload = await readRequestBody(request);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new HttpError(400, "Request body must be a JSON object.");
    }
    const item = { ...payload, id: payload.id || randomUUID() };
    await updateDatabase((current) => {
      normalizeDatabase(current);
      if (collectionKey === "users") {
        throw new HttpError(405, "Tạo tài khoản chỉ được phép qua luồng đăng ký.");
      }
      if (collectionKey === "notifications") {
        throw new HttpError(405, "Thông báo chỉ được tạo bởi hệ thống.");
      }
      current[collectionKey].push(item);
    });
    sendJson(response, 201, item);
    return true;
  }

  if (["PUT", "PATCH"].includes(request.method) && id) {
    const payload = await readRequestBody(request);
    const updated = await updateDatabase((current) => {
      normalizeDatabase(current);
      const index = current[collectionKey].findIndex((item) => String(item.id) === id);
      if (index < 0) return null;
      if (collectionKey === "notifications") {
        const notification = current.notifications[index];
        if (notification.userId !== user.id) {
          throw new HttpError(403, "Bạn không có quyền sửa thông báo này.");
        }
        if (!["read", "unread"].includes(payload.status)) {
          throw new HttpError(400, "Trạng thái thông báo không hợp lệ.");
        }
        current.notifications[index] = { ...notification, status: payload.status };
        return current.notifications[index];
      }
      if (collectionKey === "users") {
        const currentUser = current.users[index];
        if (currentUser.id === user.id && payload.role && payload.role !== "admin") {
          throw new HttpError(400, "Không thể tự hạ quyền tài khoản quản trị đang đăng nhập.");
        }
        const allowedRoles = ["user", "legal_expert", "admin"];
        if (payload.role && !allowedRoles.includes(payload.role)) {
          throw new HttpError(400, "Vai trò không hợp lệ.");
        }
        if (payload.name !== undefined && (typeof payload.name !== "string" || payload.name.trim().length < 2 || payload.name.trim().length > 100)) {
          throw new HttpError(400, "Họ tên phải có từ 2 đến 100 ký tự.");
        }
        if (payload.identity !== undefined) {
          if (typeof payload.identity !== "string" || !/^(?:[^\s@]+@[^\s@]+\.[^\s@]{2,}|(?:\+84|0)(?:3|5|7|8|9)\d{8})$/.test(payload.identity.trim().toLowerCase())) {
            throw new HttpError(400, "Email hoặc số điện thoại không hợp lệ.");
          }
          const duplicate = current.users.some((item) =>
            item.id !== currentUser.id && item.identity === payload.identity.trim().toLowerCase()
          );
          if (duplicate) throw new HttpError(409, "Email hoặc số điện thoại này đã được đăng ký.");
        }
        if (payload.locked !== undefined && typeof payload.locked !== "boolean") {
          throw new HttpError(400, "Trạng thái khóa tài khoản không hợp lệ.");
        }
        const { passwordHash, ...changes } = payload;
        if (changes.identity) changes.identity = changes.identity.trim().toLowerCase();
        if (changes.name) changes.name = changes.name.trim().replace(/\s+/g, " ");
        current.users[index] = { ...currentUser, ...changes, passwordHash };
      } else {
        current[collectionKey][index] = { ...current[collectionKey][index], ...payload, id };
      }
      return current[collectionKey][index];
    });
    sendJson(response, updated ? 200 : 404, updated ? (collectionKey === "users" ? publicUser(updated) : updated) : { error: "Không tìm thấy dữ liệu." });
    return true;
  }

  if (request.method === "DELETE" && id) {
    const removed = await updateDatabase((current) => {
      normalizeDatabase(current);
      const index = current[collectionKey].findIndex((item) => String(item.id) === id);
      if (index < 0) return null;
      if (collectionKey === "notifications" && current.notifications[index].userId !== user.id) {
        throw new HttpError(403, "Bạn không có quyền xóa thông báo này.");
      }
      if (collectionKey === "users" && current.users[index].id === user.id) {
        throw new HttpError(400, "Không thể xóa tài khoản đang đăng nhập.");
      }
      return current[collectionKey].splice(index, 1)[0];
    });
    sendJson(response, removed ? 200 : 404, removed ? (collectionKey === "users" ? publicUser(removed) : removed) : { error: "Không tìm thấy dữ liệu." });
    return true;
  }

  throw new HttpError(405, "Phương thức không được hỗ trợ cho tài nguyên này.");
}

async function serveStatic(requestPath, response, user) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(requestPath);
  } catch {
    throw new HttpError(400, "Invalid URL path.");
  }
  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
  const pathSegments = relativePath.split(/[\\/]+/);
  if (pathSegments.some((segment) => [".git", "data", "node_modules"].includes(segment.toLowerCase()))) {
    throw new HttpError(404, "Không tìm thấy trang hoặc tệp.");
  }
  const normalizedPath = relativePath.replace(/\\/g, "/").toLowerCase();
  const filePath = path.resolve(ROOT_DIR, relativePath);
  const relativeToRoot = path.relative(ROOT_DIR, filePath);
  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    throw new HttpError(403, "Path is outside the project.");
  }

  const requiredRole = normalizedPath.startsWith("pages/admin/")
    ? "admin"
    : normalizedPath.startsWith("pages/expert/")
      ? "legal_expert"
      : normalizedPath.startsWith("pages/user/")
        ? "user"
        : null;
  if (requiredRole && (!user || (user.role !== requiredRole && user.role !== "admin"))) {
    if (path.extname(relativePath) === ".html") {
      response.writeHead(302, { Location: `/pages/auth/login.html?returnUrl=${encodeURIComponent(`/${relativePath}`)}` });
      response.end();
      return;
    }
    throw new HttpError(user ? 403 : 401, "Bạn không có quyền truy cập tài nguyên này.");
  }

  try {
    const content = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream"
    });
    response.end(content);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      throw new HttpError(404, "Không tìm thấy trang hoặc tệp.");
    }
    throw error;
  }
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  try {
    if (requestUrl.pathname.startsWith("/api/")) {
      ensureSameOrigin(request, response);
      if (request.method === "OPTIONS") {
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.writeHead(204);
        response.end();
        return;
      }
    }
    if (requestUrl.pathname.startsWith("/api/")) {
      const database = await readDatabase();
      normalizeDatabase(database);
      if (await handleAuthentication(request, response, requestUrl.pathname.slice(5), database)) return;
      const user = await getCurrentUser(request, database);
      if (requestUrl.pathname === "/api/portal") {
        if (await handlePortal(request, response, database, user)) return;
      } else if (await handleCollection(request, response, database, user, requestUrl.pathname.slice(5))) {
        return;
      }
      throw new HttpError(404, "Không tìm thấy API.");
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      throw new HttpError(405, "Method not allowed.");
    }
    const database = await readDatabase();
    normalizeDatabase(database);
    const user = await getCurrentUser(request, database);
    await serveStatic(requestUrl.pathname, response, user);
  } catch (error) {
    console.error(`[server] ${request.method} ${requestUrl.pathname}:`, error);
    if (!response.headersSent) {
      sendJson(response, error.statusCode || 500, {
        error: error.statusCode ? error.message : "Internal server error."
      });
    } else {
      response.destroy(error);
    }
  }
});

bootstrapAdmin()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`LegalPath: http://localhost:${PORT}/`);
      console.log(`JSON data directory: ${DATA_DIR}`);
    });
  })
  .catch((error) => {
    console.error("[server] Failed to initialize:", error);
    process.exitCode = 1;
  });

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Start with another port, e.g. $env:PORT=3002; node server.js`);
  } else {
    console.error("[server] Failed to start:", error);
  }
  process.exitCode = 1;
});
