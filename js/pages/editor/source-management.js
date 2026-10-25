const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  sources: []
};

function statusClass(status) {
  return ({
    'Hoạt động': 'active',
    'Cần kiểm tra': 'check',
    'Chờ duyệt': 'pending',
    'Đã duyệt': 'approved',
    'Từ chối': 'rejected',
    'Ổn định': 'stable',
    'Sắp hết hạn': 'expiring',
    'Đã cũ': 'old'
  })[status] || '';
}

function badge(status) {
  return `<span class="status ${statusClass(status)}">${escapeHtml(status)}</span>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function sourceLink(value) {
  const url = String(value);
  try {
    const parsedUrl = new URL(url);
    if (['http:', 'https:'].includes(parsedUrl.protocol)) {
      return `<a class="url" href="${escapeHtml(parsedUrl.href)}" target="_blank" rel="noopener">${escapeHtml(url)}</a>`;
    }
  } catch {
    return escapeHtml(url);
  }
  return escapeHtml(url);
}

function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
}

async function loadSources() {
  state.sources = await window.LegalPathAPI.getEditorCollection('sources');
}

function renderSources() {
  const sourceSearch = $('#sourceSearch');
  if (!sourceSearch) return;

  const q = (sourceSearch.value || '').trim().toLowerCase();
  const status = $('#sourceStatus').value;
  const type = $('#sourceType').value;
  const list = state.sources.filter((source) => (
    `${source.name} ${source.url}`.toLowerCase().includes(q) &&
    (status === 'all' || source.status === status) &&
    (type === 'all' || source.type === type)
  ));

  $('#sourceRows').innerHTML = list.map((source) => `
    <tr>
      <td>${escapeHtml(source.name)}</td>
      <td>${escapeHtml(source.type)}</td>
      <td>${sourceLink(source.url)}</td>
      <td>${badge(source.status)}</td>
      <td class="source-actions">
        <button class="icon-button edit-source" data-name="${escapeHtml(source.name)}" title="Sửa nguồn" aria-label="Sửa nguồn" type="button">✎</button>
        <button class="icon-button remove-source" data-name="${escapeHtml(source.name)}" title="Xóa nguồn" aria-label="Xóa nguồn" type="button">×</button>
      </td>
    </tr>
  `).join('');

  $('#sourceEmpty').classList.toggle('hidden', list.length !== 0);
  $('#sourceCount').textContent = `Hiển thị ${list.length ? 1 : 0} - ${list.length} trong ${state.sources.length} nguồn`;
  $('#sourceTotal').textContent = state.sources.length;
  $('#activeSourceTotal').textContent = state.sources.filter((source) => source.status === 'Hoạt động').length;
  $('#checkSourceTotal').textContent = state.sources.filter((source) => source.status === 'Cần kiểm tra').length;

  $$('.edit-source').forEach((button) => {
    button.addEventListener('click', () => {
      const source = state.sources.find((item) => item.name === button.dataset.name);
      if (!source) return;
      const form = $('#sourceForm');
      form.elements.namedItem('name').value = source.name;
      form.elements.namedItem('type').value = source.type;
      form.elements.namedItem('url').value = source.url;
      form.elements.namedItem('status').value = source.status;
      form.dataset.originalName = source.name;
      $('#sourceDialog').querySelector('h2').textContent = 'Chỉnh sửa nguồn';
      $('#sourceForm button[type="submit"]').textContent = 'Lưu thay đổi';
      $('#sourceDialog').showModal();
    });
  });

  $$('.remove-source').forEach((button) => {
    button.addEventListener('click', async () => {
      if (confirm(`Xóa nguồn "${button.dataset.name}" khỏi dữ liệu?`)) {
        const index = state.sources.findIndex((source) => source.name === button.dataset.name);
        if (index >= 0) {
          const nextSources = state.sources.filter((_, sourceIndex) => sourceIndex !== index);
          try {
            await window.LegalPathAPI.saveEditorCollection('sources', nextSources);
            state.sources = nextSources;
            renderSources();
            toast('Đã xóa nguồn và lưu dữ liệu.');
          } catch (error) {
            console.error('Không thể xóa nguồn:', error);
            toast('Không thể lưu thay đổi. Hãy kiểm tra API đang chạy.');
          }
        }
      }
    });
  });
}

function bindSourceControls() {
  const dialog = $('#sourceDialog');
  const sourceForm = $('#sourceForm');
  const sourceFilterBtn = $('#sourceFilterBtn');

  $('#sourceSearch').addEventListener('input', renderSources);
  $('#sourceStatus').addEventListener('change', renderSources);
  $('#sourceType').addEventListener('change', renderSources);
  sourceFilterBtn.addEventListener('click', () => $('#sourceFilter').classList.toggle('hidden'));

  $('#addSourceBtn').addEventListener('click', () => {
    sourceForm.reset();
    delete sourceForm.dataset.originalName;
    dialog.querySelector('h2').textContent = 'Thêm nguồn mới';
    sourceForm.querySelector('button[type="submit"]').textContent = 'Thêm nguồn';
    dialog.showModal();
  });
  $('#closeDialog').addEventListener('click', () => dialog.close());
  $('#cancelDialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    sourceForm.reset();
    delete sourceForm.dataset.originalName;
    dialog.querySelector('h2').textContent = 'Thêm nguồn mới';
    sourceForm.querySelector('button[type="submit"]').textContent = 'Thêm nguồn';
  });

  sourceForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = data.get('name').trim();
    const url = data.get('url').trim();
    const originalName = sourceForm.dataset.originalName;
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      toast('Vui lòng nhập URL hợp lệ.');
      return;
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      toast('URL nguồn phải dùng giao thức HTTP hoặc HTTPS.');
      return;
    }

    if (state.sources.some((source) => (
      source.name.toLowerCase() === name.toLowerCase() && source.name !== originalName
    ))) {
      toast('Tên nguồn này đã tồn tại.');
      return;
    }

    const updatedSource = {
      name,
      type: data.get('type'),
      url: parsedUrl.href,
      status: data.get('status')
    };
    const nextSources = originalName
      ? state.sources.map((source) => source.name === originalName ? updatedSource : source)
      : [updatedSource, ...state.sources];

    try {
      await window.LegalPathAPI.saveEditorCollection('sources', nextSources);
      state.sources = nextSources;
      form.reset();
      dialog.close();
      renderSources();
      toast(originalName ? 'Đã cập nhật nguồn và lưu dữ liệu.' : 'Đã thêm nguồn và lưu dữ liệu.');
    } catch (error) {
      console.error('Không thể thêm nguồn:', error);
      toast('Không thể lưu thay đổi. Hãy kiểm tra API đang chạy.');
    }
  });
}

async function initPage() {
  try {
    await loadSources();
  } catch (error) {
    console.error('Không thể tải dữ liệu nguồn:', error);
    toast('Không tải được dữ liệu nguồn. Hãy kiểm tra API đang chạy.');
  }
  bindSourceControls();
  renderSources();
}

document.addEventListener('DOMContentLoaded', initPage);
