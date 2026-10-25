const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const HOST = '127.0.0.1';
const PORT = 3000;
const MAX_BODY_BYTES = 1024 * 1024;
const DATA_PATH = path.join(__dirname, 'dataset', 'api.json');
const COLLECTIONS = new Set(['sources', 'queue', 'monitor', 'notifications', 'settings']);

let pendingWrite = Promise.resolve();

function setCorsHeaders(request, response) {
  const origin = request.headers.origin;
  if (origin) {
    try {
      const url = new URL(origin);
      const isLocalOrigin = url.protocol === 'http:' &&
        (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
      if (isLocalOrigin) {
        response.setHeader('Access-Control-Allow-Origin', origin);
        response.setHeader('Vary', 'Origin');
      }
    } catch {
      // Invalid origins receive no CORS permission.
    }
  }

  response.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

async function readDataset() {
  const contents = await fs.readFile(DATA_PATH, 'utf8');
  return JSON.parse(contents);
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let oversized = false;

    request.on('data', (chunk) => {
      if (oversized) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        oversized = true;
        chunks.length = 0;
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (oversized) {
        reject(Object.assign(new Error('Dữ liệu gửi lên quá lớn.'), { statusCode: 413 }));
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Nội dung gửi lên phải là JSON hợp lệ.'), { statusCode: 400 }));
      }
    });
    request.on('error', reject);
  });
}

async function saveCollection(name, items) {
  const write = pendingWrite.then(async () => {
    const dataset = await readDataset();
    dataset[name] = items;

    const temporaryPath = `${DATA_PATH}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryPath, DATA_PATH);
  });
  pendingWrite = write.catch(() => {});
  await write;
}

const server = http.createServer(async (request, response) => {
  setCorsHeaders(request, response);

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  const match = new URL(request.url, `http://${HOST}:${PORT}`).pathname.match(/^\/api\/([^/]+)$/);
  const collection = match && match[1];
  if (!COLLECTIONS.has(collection)) {
    sendJson(response, 404, { error: 'Không tìm thấy API.' });
    return;
  }

  try {
    if (request.method === 'GET') {
      const dataset = await readDataset();
      if (!Array.isArray(dataset[collection])) {
        sendJson(response, 500, { error: `Dữ liệu ${collection} trong api.json không hợp lệ.` });
        return;
      }
      sendJson(response, 200, dataset[collection]);
      return;
    }

    if (request.method === 'PUT') {
      const items = await readRequestBody(request);
      if (!Array.isArray(items) || items.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) {
        sendJson(response, 400, { error: 'Dữ liệu phải là một mảng các đối tượng JSON.' });
        return;
      }

      await saveCollection(collection, items);
      response.writeHead(204);
      response.end();
      return;
    }

    response.setHeader('Allow', 'GET, PUT, OPTIONS');
    sendJson(response, 405, { error: 'Phương thức không được hỗ trợ.' });
  } catch (error) {
    if (error.statusCode) {
      sendJson(response, error.statusCode, { error: error.message });
      return;
    }
    console.error('Lỗi API LegalPath:', error);
    sendJson(response, 500, { error: 'Không thể đọc hoặc lưu dataset/api.json.' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`LegalPath API đang chạy tại http://${HOST}:${PORT}`);
});
