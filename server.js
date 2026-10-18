"use strict";

const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT_DIR = __dirname;
const DB_FILE = process.env.PORTAL_DB_FILE || path.join(ROOT_DIR, "pages", "expert", "db.json");
const PORT = Number(process.env.PORT || 3001);
const MAX_BODY_SIZE = 10 * 1024 * 1024;
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

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function getCorsHeaders(origin) {
  if (!origin) return null;

  let originUrl;
  try {
    originUrl = new URL(origin);
  } catch {
    return null;
  }

  const hostname = originUrl.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const isLoopback = originUrl.protocol === "http:"
    && (hostname === "localhost" || hostname === "::1" || /^127(?:\.\d{1,3}){3}$/.test(hostname));
  if (!isLoopback) return null;

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

async function readDatabase() {
  try {
    const text = await fs.readFile(DB_FILE, "utf8");
    const data = JSON.parse(text);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("The JSON database must contain an object.");
    }
    return data;
  } catch (error) {
    if (error.code === "ENOENT") {
      return { articles: [], checklists: [], experts: [] };
    }
    throw error;
  }
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let tooLarge = false;
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      if (tooLarge) return;
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_BODY_SIZE) {
        tooLarge = true;
      }
    });
    request.on("end", () => {
      if (tooLarge) {
        reject(Object.assign(new Error("Request body exceeds 10 MB."), { statusCode: 413 }));
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(Object.assign(new Error("Request body must be valid JSON."), { statusCode: 400 }));
      }
    });
    request.on("error", reject);
  });
}

function validatePortalData(data) {
  return data
    && typeof data === "object"
    && !Array.isArray(data)
    && Array.isArray(data.articles)
    && Array.isArray(data.checklists)
    && (data.profile === null || (typeof data.profile === "object" && !Array.isArray(data.profile)));
}

async function savePortalData(portalData) {
  const operation = writeQueue.then(async () => {
    const database = await readDatabase();
    database.expertPortal = portalData;
    const temporaryFile = `${DB_FILE}.tmp`;
    await fs.writeFile(temporaryFile, `${JSON.stringify(database, null, 2)}\n`, "utf8");
    await fs.rename(temporaryFile, DB_FILE);
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function serveStatic(requestPath, response) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(requestPath);
  } catch {
    sendJson(response, 400, { error: "Invalid URL path." });
    return;
  }

  const relativePath = decodedPath === "/" ? "pages/index.html" : decodedPath.replace(/^\/+/, "");
  const filePath = path.resolve(ROOT_DIR, relativePath);
  if (filePath !== ROOT_DIR && !filePath.startsWith(`${ROOT_DIR}${path.sep}`)) {
    sendJson(response, 403, { error: "Path is outside the project." });
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream"
    });
    response.end(content);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      sendJson(response, 404, { error: "File not found." });
      return;
    }
    throw error;
  }
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  try {
    if (requestUrl.pathname === "/api/portal" && request.headers.origin) {
      const corsHeaders = getCorsHeaders(request.headers.origin);
      if (!corsHeaders) {
        sendJson(response, 403, { error: "The API only accepts requests from localhost during development." });
        return;
      }
      for (const [name, value] of Object.entries(corsHeaders)) {
        response.setHeader(name, value);
      }
    }

    if (requestUrl.pathname === "/api/portal" && request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    if (requestUrl.pathname === "/api/portal" && request.method === "GET") {
      const database = await readDatabase();
      const portalData = database.expertPortal || {
        articles: Array.isArray(database.articles) ? database.articles : [],
        checklists: Array.isArray(database.checklists) ? database.checklists : [],
        profile: Array.isArray(database.experts) ? (database.experts[0] || null) : null
      };
      sendJson(response, 200, portalData);
      return;
    }

    if (requestUrl.pathname === "/api/portal" && request.method === "PUT") {
      const portalData = await readRequestBody(request);
      if (!validatePortalData(portalData)) {
        sendJson(response, 400, { error: "Expected articles, checklists, and a profile object or null." });
        return;
      }
      await savePortalData(portalData);
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }
    await serveStatic(requestUrl.pathname, response);
  } catch (error) {
    console.error(`[server] ${request.method} ${requestUrl.pathname}:`, error);
    if (!response.headersSent) {
      sendJson(response, error.statusCode || 500, { error: error.message || "Internal server error." });
    } else {
      response.destroy(error);
    }
  }
});

server.listen(PORT, () => {
  console.log(`LegalPath dev server: http://localhost:${PORT}/pages/expert/expert-article-management.html`);
  console.log(`Portal JSON file: ${DB_FILE}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Start with another port, e.g. $env:PORT=3002; node server.js`);
    process.exitCode = 1;
    return;
  }
  console.error("[server] Failed to start:", error);
  process.exitCode = 1;
});
