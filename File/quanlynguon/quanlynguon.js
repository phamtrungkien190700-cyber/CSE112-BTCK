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
  return `<span class="status ${statusClass(status)}">${status}</span>`;
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

function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
}

async function loadSources() {
  state.sources = await window.LegalPathAPI.getCollection('sources');
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
      <td><a class="url" href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.url)}</a></td>
      <td>${badge(source.status)}</td>
      <td><button class="icon-button remove-source" data-name="${escapeHtml(source.name)}" title="Xóa nguồn" aria-label="Xóa nguồn" type="button">⋯</button></td>
    </tr>
  `).join('');

  $('#sourceEmpty').classList.toggle('hidden', list.length !== 0);
  $('#sourceCount').textContent = `Hiển thị ${list.length ? 1 : 0} - ${list.length} trong ${state.sources.length} nguồn`;
  $('#sourceTotal').textContent = state.sources.length;
  $('#activeSourceTotal').textContent = state.sources.filter((source) => source.status === 'Hoạt động').length;
  $('#checkSourceTotal').textContent = state.sources.filter((source) => source.status === 'Cần kiểm tra').length;

  $$('.remove-source').forEach((button) => {
    button.addEventListener('click', async () => {
      if (confirm(`Xóa nguồn "${button.dataset.name}" khỏi dữ liệu?`)) {
        const index = state.sources.findIndex((source) => source.name === button.dataset.name);
        if (index >= 0) {
          const nextSources = state.sources.filter((_, sourceIndex) => sourceIndex !== index);
          try {
            await window.LegalPathAPI.saveCollection('sources', nextSources);
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

  $('#addSourceBtn').addEventListener('click', () => dialog.showModal());
  $('#closeDialog').addEventListener('click', () => dialog.close());
  $('#cancelDialog').addEventListener('click', () => dialog.close());

  sourceForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = data.get('name').trim();
    const url = data.get('url').trim();

    if (state.sources.some((source) => source.name.toLowerCase() === name.toLowerCase())) {
      toast('Tên nguồn này đã tồn tại.');
      return;
    }

    const nextSources = [{
      name,
      type: data.get('type'),
      url,
      status: data.get('status')
    }, ...state.sources];

    try {
      await window.LegalPathAPI.saveCollection('sources', nextSources);
      state.sources = nextSources;
      form.reset();
      dialog.close();
      renderSources();
      toast('Đã thêm nguồn và lưu dữ liệu.');
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
    toast('Không tải được dữ liệu nguồn. Hãy chạy trang bằng Live Server.');
  }
  bindSourceControls();
  renderSources();
}

document.addEventListener('DOMContentLoaded', initPage);
