

const state = {
  monitor: []
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

function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
}

async function loadMonitor() {
  state.monitor = await window.LegalPathAPI.getCollection('monitor');
}

function renderMonitor() {
  const monitorStatus = $('#monitorStatus');
  const monitorSource = $('#monitorSource');
  if (!monitorStatus || !monitorSource) return;

  const status = monitorStatus.value;
  const source = monitorSource.value;
  const list = state.monitor.filter((item) => (
    (status === 'all' || item.status === status) &&
    (source === 'all' || item.source === source)
  ));

  $('#monitorRows').innerHTML = list.map((item) => `
    <tr>
      <td>${escapeHtml(item.title)}</td>
      <td>${escapeHtml(item.source)}</td>
      <td>${item.date}<br><small>${item.time}</small></td>
      <td>${item.age} ngày</td>
      <td>${badge(item.status)}</td>
    </tr>
  `).join('');

  $('#monitorEmpty').classList.toggle('hidden', list.length !== 0);
  $('#monitorCount').textContent = `Hiển thị ${list.length ? 1 : 0} - ${list.length} trong ${state.monitor.length} nội dung`;
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

function bindMonitorControls() {
  const refreshButton = $('#refreshMonitor');
  $('#monitorStatus').addEventListener('change', renderMonitor);
  $('#monitorSource').addEventListener('change', renderMonitor);
  $('#monitorPeriod').addEventListener('change', () => toast(`Đã chọn khoảng thời gian: ${$('#monitorPeriod').value}`));
  refreshButton.addEventListener('click', async () => {
    try {
      await loadMonitor();
      renderMonitor();
      toast('Đã tải lại dữ liệu từ API.');
    } catch (error) {
      console.error('Không thể cập nhật dữ liệu theo dõi:', error);
      toast('Không thể tải dữ liệu. Hãy kiểm tra API đang chạy.');
    }
  });
}

async function initPage() {
  try {
    await loadMonitor();
  } catch (error) {
    console.error('Không thể tải dữ liệu theo dõi:', error);
    toast('Không tải được dữ liệu theo dõi. Hãy chạy trang bằng Live Server.');
  }

  bindMonitorControls();
  renderMonitor();
}

document.addEventListener('DOMContentLoaded', initPage);
