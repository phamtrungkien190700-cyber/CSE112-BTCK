const $ = (selector, root = document) => root.querySelector(selector); //Hàm chọn phần tử
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
//Lưu trang thái hiện tại
const state = {                                             //Khai báo biến
  queue: [],
  activeQueueStatus: 'Chờ duyệt',
  selectedQueueIndex: 0,
};
const EXPERT_CONTENT_API = 'http://localhost:3003/expert_content/portal';
//Chuyển về CSS
function statusClass(status) {               //Các hàm hỗ trợ
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
//Tạo nhãn dán
function badge(status) {
  return `<span class="status ${statusClass(status)}">${status}</span>`;
}
//Bảo vệ nội dung khi hiển thị HTML
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}
//Hiển thị thông báo 
function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
}
function displayDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
}

function reviewStatus(checklist) {
  if (checklist.reviewStatus === 'rejected') return 'Từ chối';
  if (checklist.reviewStatus === 'pending') return 'Chờ duyệt';
  if (checklist.reviewStatus === 'approved' || checklist.status === 'published') return 'Đã duyệt';
  return 'Chờ duyệt';
}

function mapChecklist(checklist, index) {
  return {
    id: checklist.id,
    title: checklist.name || 'Checklist chưa có tên',
    source: checklist.category || 'Chưa phân loại',
    sender: checklist.author || 'Chuyên gia pháp lý',
    date: displayDate(checklist.updatedAt || checklist.createdAt),
    time: '',
    status: reviewStatus(checklist),
    description: checklist.desc || 'Không có mô tả.',
    questions: Array.isArray(checklist.questions) ? checklist.questions : [],
    index
  };
}

async function fetchPortalRecord() {
  const response = await fetch(EXPERT_CONTENT_API, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Không tải được dữ liệu checklist (HTTP ${response.status}).`);
  const record = await response.json();
  if (!record || record.id !== 'portal' || !Array.isArray(record.checklists)) {
    throw new Error('Dữ liệu expert_content không đúng định dạng.');
  }
  return record;
}

// Load the checklist records that are stored in expert_content.
async function loadQueue() {
  const record = await fetchPortalRecord();
  state.queue = record.checklists.map(mapChecklist);

  if (state.queue.length) {
    const firstPendingIndex = state.queue.findIndex((item) => item.status === 'Chờ duyệt');
    state.selectedQueueIndex = firstPendingIndex >= 0 ? firstPendingIndex : 0;
  } else {
    state.selectedQueueIndex = -1;
  }
}
//Hiển thị bảng nội dung
function renderQueue() {                             //Hiển thị giao diện
  const queueSearch = $('#queueSearch');
  if (!queueSearch) return;

  const q = queueSearch.value.toLowerCase();
  const rows = state.queue
    .filter((item) => item.status === state.activeQueueStatus && `${item.title} ${item.source} ${item.sender}`.toLowerCase().includes(q));
//Tạo các hàng trong HTML
  $('#queueRows').innerHTML = rows.map((item) => `
    <tr class="clickable ${item.index === state.selectedQueueIndex ? 'selected-row' : ''}" data-index="${item.index}">
      <td><strong>${escapeHtml(item.title)}</strong></td>
      <td><span class="source-pill">${escapeHtml(item.source)}</span></td>
      <td>${escapeHtml(item.sender)}</td>
      <td>${escapeHtml(item.date)}${item.time ? `<br><small>${escapeHtml(item.time)}</small>` : ''}</td>
      <td>${badge(item.status)}</td>
    </tr>
  `).join('');
//Hiển thị trang thái và danh sách số lượng
  $('#queueEmpty').classList.toggle('hidden', rows.length !== 0);
  $('#pendingCount').textContent = state.queue.filter((item) => item.status === 'Chờ duyệt').length;
  $('#approvedCount').textContent = state.queue.filter((item) => item.status === 'Đã duyệt').length;
  $('#rejectedCount').textContent = state.queue.filter((item) => item.status === 'Từ chối').length;
//Gắn sự kiện vào từng hàng
  $$('#queueRows tr').forEach((row) => {
    row.addEventListener('click', () => {
      state.selectedQueueIndex = Number(row.dataset.index);
      renderQueue();
      renderQueueDetail();
    });
  });

  renderQueueDetail();
}
//Hiện thị chi tiết nội dung
function renderQueueDetail() {
  const item = state.queue[state.selectedQueueIndex];
  if (!item || item.status !== state.activeQueueStatus) {
    $('#queueDetail').innerHTML = '<p>Chọn một nội dung để xem chi tiết.</p>';
    return;
  }

  const pending = item.status === 'Chờ duyệt';
  $('#queueDetail').innerHTML = `
    <div>
      <h3>Chi tiết nội dung cần duyệt</h3>
      <h3>${escapeHtml(item.title)}</h3>
      <div class="detail-meta">
        <span>Chuyên mục</span><span class="source-pill">${escapeHtml(item.source)}</span>
        <span>Người gửi</span><span>${escapeHtml(item.sender)}</span>
        <span>Mã checklist</span><span>${escapeHtml(item.id)}</span>
        <span>Ngày cập nhật</span><span>${escapeHtml(item.date)}</span>
      </div>
    </div>
    <div>
      <div class="detail-meta">
        <span>Trạng thái</span><span>${badge(item.status)}</span>
        <span>Mô tả</span><span>${escapeHtml(item.description)}</span>
      </div>
      ${item.questions.length ? `<div class="detail-meta"><span>Tiêu chí</span><span>${item.questions.map((question, index) => `<div>${index + 1}. ${escapeHtml(question.text || '')}</div>`).join('')}</span></div>` : ''}
      <div class="detail-actions">
        ${pending ? '<button class="btn outline" id="rejectItem" type="button">× Từ chối</button><button class="btn primary" id="approveItem" type="button">✓ Duyệt</button>' : ''}
      </div>
    </div>
    <div class="document-preview">
      <div><strong>${escapeHtml(item.title)}</strong><br>${escapeHtml(item.description)}<br>${item.questions.map((question, index) => `${index + 1}. ${escapeHtml(question.text || '')}`).join('<br>')}</div>
    </div>
  `;
  //Nút đồng ý và từ chối
  const approveButton = $('#approveItem');
  const rejectButton = $('#rejectItem');

  if (approveButton) {
    approveButton.addEventListener('click', () => updateQueueItem('Đã duyệt'));
  }

  if (rejectButton) {
    rejectButton.addEventListener('click', () => updateQueueItem('Từ chối'));
  }
}
//Hàm duyệt hoặc từ chối nội dung
async function updateQueueItem(status) {                            //Xử lý nghiệp vụ
  const item = state.queue[state.selectedQueueIndex];
  if (!item) return;

  try {
    const record = await fetchPortalRecord();
    const checklistIndex = record.checklists.findIndex((checklist) => checklist.id === item.id);
    if (checklistIndex < 0) throw new Error('Checklist không còn tồn tại trong expert_content.');
    const checklist = record.checklists[checklistIndex];
    record.checklists[checklistIndex] = {
      ...checklist,
      status: status === 'Đã duyệt' ? 'published' : 'draft',
      reviewStatus: status === 'Đã duyệt' ? 'approved' : 'rejected',
      reviewedAt: new Date().toISOString()
    };
    const response = await fetch(EXPERT_CONTENT_API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    if (!response.ok) throw new Error(`Không lưu được trạng thái checklist (HTTP ${response.status}).`);
    state.activeQueueStatus = status;
    await loadQueue();
    state.selectedQueueIndex = state.queue.findIndex((queueItem) => queueItem.id === item.id);
    state.activeQueueStatus = status;
    $$('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.status === status));
    renderQueue();
    toast(status === 'Đã duyệt' ? 'Đã duyệt checklist và cập nhật expert_content.' : 'Đã từ chối checklist và cập nhật expert_content.');
  } catch (error) {
    console.error('Không thể cập nhật trạng thái nội dung:', error);
    toast(`Không thể lưu thay đổi: ${error.message}`);
  }
}
//Gắn sự kiện cho giao diện
function bindQueueControls() {          //Gắn ự kiện
  $('#queueSearch').addEventListener('input', renderQueue);
  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      state.activeQueueStatus = tab.dataset.status;
      state.selectedQueueIndex = state.queue.findIndex((item) => item.status === state.activeQueueStatus);
      $$('.tab').forEach((item) => item.classList.toggle('active', item === tab));
      renderQueue();
    });
  });

  $('#queueFilterBtn').addEventListener('click', () => {
    $('#queueSearch').focus();
    toast('Nhập từ khóa vào ô tìm kiếm để lọc nội dung.');
  });
}
//Khởi tạo trang                    //Khởi tạo
async function initPage() {
  try {
    await loadQueue();
  } catch (error) {
    console.error('Không thể tải dữ liệu hàng đợi:', error);
    toast(`Không tải được checklist từ expert_content: ${error.message}`);
  }
  bindQueueControls();
  renderQueue();
}

document.addEventListener('DOMContentLoaded', initPage);
