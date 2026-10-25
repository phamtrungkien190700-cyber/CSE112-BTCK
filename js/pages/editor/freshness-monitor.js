const $ = (selector, root = document) => root.querySelector(selector);

const state = {
  monitor: [],
  editingIndex: null
};

function statusClass(status) {
  return ({
    'Ổn định': 'stable',
    'Sắp hết hạn': 'expiring',
    'Đã cũ': 'old'
  })[status] || '';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function badge(status) {
  return `<span class="status ${statusClass(status)}">${escapeHtml(status)}</span>`;
}

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove('show'), 2600);
}

async function loadMonitor() {
  state.monitor = await window.LegalPathAPI.getEditorCollection('monitor');
}

function renderSummary() {
  const total = state.monitor.length;
  const counts = {
    stable: state.monitor.filter((item) => item.status === 'Ổn định').length,
    expiring: state.monitor.filter((item) => item.status === 'Sắp hết hạn').length,
    old: state.monitor.filter((item) => item.status === 'Đã cũ').length
  };
  const percent = (count) => total ? Math.round(count / total * 100) : 0;
  const stablePercent = percent(counts.stable);
  const expiringEnd = stablePercent + percent(counts.expiring);

  $('#stableTotal').innerHTML = `${counts.stable} <em>(${stablePercent}%)</em>`;
  $('#expiringTotal').innerHTML = `${counts.expiring} <em>(${percent(counts.expiring)}%)</em>`;
  $('#oldTotal').innerHTML = `${counts.old} <em>(${percent(counts.old)}%)</em>`;
  $('#stablePercent').textContent = `${stablePercent}%`;
  $('#stableLegend').textContent = counts.stable;
  $('#expiringLegend').textContent = counts.expiring;
  $('#oldLegend').textContent = counts.old;
  $('.donut').style.background = `conic-gradient(#079b78 0 ${stablePercent}%, #f2a51c ${stablePercent}% ${expiringEnd}%, #e84d5c ${expiringEnd}% 100%)`;
}

function renderSourceOptions() {
  const select = $('#monitorSource');
  const selectedSource = select.value;
  const options = ['all', ...new Set(state.monitor.map((item) => item.source))];
  select.replaceChildren(...options.map((source) => {
    const option = document.createElement('option');
    option.value = source;
    option.textContent = source === 'all' ? 'Tất cả nguồn' : source;
    return option;
  }));
  select.value = options.includes(selectedSource) ? selectedSource : 'all';
}

function renderMonitor() {
  renderSourceOptions();
  const status = $('#monitorStatus').value;
  const source = $('#monitorSource').value;
  const period = $('#monitorPeriod').value;
  const list = state.monitor
    .map((item, index) => ({ ...item, index }))
    .filter((item) => (
      (status === 'all' || item.status === status) &&
      (source === 'all' || item.source === source) &&
      (period === 'all' || Number(item.age) <= Number(period))
    ));

  $('#monitorRows').innerHTML = list.map((item) => `
    <tr>
      <td>${escapeHtml(item.title)}</td>
      <td>${escapeHtml(item.source)}</td>
      <td>${escapeHtml(item.date)}<br><small>${escapeHtml(item.time)}</small></td>
      <td>${escapeHtml(item.age)} ngày</td>
      <td>${badge(item.status)}</td>
      <td class="monitor-actions">
        <button class="icon-button edit-monitor" data-index="${item.index}" type="button" aria-label="Sửa nội dung theo dõi">✎</button>
        <button class="icon-button delete-monitor" data-index="${item.index}" type="button" aria-label="Xóa nội dung theo dõi">×</button>
      </td>
    </tr>
  `).join('');

  $('#monitorEmpty').classList.toggle('hidden', list.length !== 0);
  $('#monitorCount').textContent = `Hiển thị ${list.length ? 1 : 0} - ${list.length} trong ${state.monitor.length} nội dung`;
  renderSummary();
}

function openMonitorEditor(index = null) {
  const form = $('#monitorForm');
  state.editingIndex = index;
  form.reset();
  if (index === null) {
    $('#monitorDialogTitle').textContent = 'Thêm nội dung theo dõi';
    $('#saveMonitorButton').textContent = 'Thêm theo dõi';
  } else {
    const item = state.monitor[index];
    if (!item) return;
    form.elements.namedItem('title').value = item.title;
    form.elements.namedItem('source').value = item.source;
    form.elements.namedItem('date').value = item.date;
    form.elements.namedItem('time').value = item.time;
    form.elements.namedItem('age').value = item.age;
    form.elements.namedItem('status').value = item.status;
    $('#monitorDialogTitle').textContent = 'Chỉnh sửa nội dung theo dõi';
    $('#saveMonitorButton').textContent = 'Lưu thay đổi';
  }
  $('#monitorDialog').showModal();
}

function validDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.getFullYear() === Number(year)
    && date.getMonth() === Number(month) - 1
    && date.getDate() === Number(day);
}

function bindMonitorControls() {
  const dialog = $('#monitorDialog');
  const form = $('#monitorForm');

  $('#monitorStatus').addEventListener('change', renderMonitor);
  $('#monitorSource').addEventListener('change', renderMonitor);
  $('#monitorPeriod').addEventListener('change', renderMonitor);
  $('#refreshMonitor').addEventListener('click', async () => {
    try {
      await loadMonitor();
      renderMonitor();
      toast('Đã tải lại dữ liệu từ API.');
    } catch (error) {
      console.error('Không thể cập nhật dữ liệu theo dõi:', error);
      toast('Không thể tải dữ liệu. Hãy kiểm tra API đang chạy.');
    }
  });

  $('#addMonitorBtn').addEventListener('click', () => openMonitorEditor());
  $('#closeMonitorDialog').addEventListener('click', () => dialog.close());
  $('#cancelMonitorDialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    state.editingIndex = null;
    form.reset();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    const date = String(values.date).trim();
    if (!validDate(date)) {
      toast('Ngày cập nhật cần đúng định dạng DD/MM/YYYY.');
      form.elements.namedItem('date').focus();
      return;
    }

    const updatedItem = {
      title: String(values.title).trim(),
      source: String(values.source).trim(),
      date,
      time: values.time,
      age: Number(values.age),
      status: values.status
    };
    const nextMonitor = state.editingIndex === null
      ? [updatedItem, ...state.monitor]
      : state.monitor.map((item, index) => index === state.editingIndex ? updatedItem : item);
    const wasEditing = state.editingIndex !== null;

    try {
      await window.LegalPathAPI.saveEditorCollection('monitor', nextMonitor);
      state.monitor = nextMonitor;
      dialog.close();
      renderMonitor();
      toast(wasEditing ? 'Đã cập nhật dữ liệu theo dõi.' : 'Đã thêm dữ liệu theo dõi.');
    } catch (error) {
      console.error('Không thể lưu dữ liệu theo dõi:', error);
      toast('Không thể lưu thay đổi. Hãy kiểm tra API đang chạy.');
    }
  });

  $('#monitorRows').addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-index]');
    if (!button) return;
    const index = Number(button.dataset.index);
    if (button.classList.contains('edit-monitor')) {
      openMonitorEditor(index);
      return;
    }
    if (!button.classList.contains('delete-monitor')) return;

    const item = state.monitor[index];
    if (!item || !confirm(`Xóa "${item.title}" khỏi danh sách theo dõi?`)) return;
    const nextMonitor = state.monitor.filter((_, itemIndex) => itemIndex !== index);
    try {
      await window.LegalPathAPI.saveEditorCollection('monitor', nextMonitor);
      state.monitor = nextMonitor;
      renderMonitor();
      toast('Đã xóa nội dung theo dõi.');
    } catch (error) {
      console.error('Không thể xóa nội dung theo dõi:', error);
      toast('Không thể lưu thay đổi. Hãy kiểm tra API đang chạy.');
    }
  });
}

async function initPage() {
  try {
    await loadMonitor();
  } catch (error) {
    console.error('Không thể tải dữ liệu theo dõi:', error);
    toast('Không tải được dữ liệu theo dõi. Hãy kiểm tra API đang chạy.');
  }

  bindMonitorControls();
  renderMonitor();
}

document.addEventListener('DOMContentLoaded', initPage);
