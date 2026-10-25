(() => {
  const API_BASE_URL = 'http://127.0.0.1:3000/api';

  async function getCollection(name) {
    const response = await fetch(`${API_BASE_URL}/${name}`);
    if (!response.ok) {
      throw new Error(`Không tải được dữ liệu ${name} (${response.status}).`);
    }

    return response.json();
  }

  async function saveCollection(name, items) {
    const response = await fetch(`${API_BASE_URL}/${name}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items)
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || `Không lưu được dữ liệu ${name} (${response.status}).`);
    }
  }

  window.LegalPathAPI = { getCollection, saveCollection };
})();
