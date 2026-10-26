A1 them vào #sourse filter
-html
<label>
  Tên miền
  <select id="sourceDomain">
    <option value="all">Tất cả tên miền</option>
    <option value=".gov.vn">.gov.vn</option>
    <option value=".vn">.vn</option>
    <option value=".com">.com</option>
  </select>
</label>
-js
// Thêm hàm này lên đầu file
const hostOf = (u) => { try { return new URL(u).hostname.toLowerCase(); } catch { return ''; } };

// Trong renderSources(): đọc giá trị
const domain = $('#sourceDomain').value;

// THAY phần filter: thêm 1 điều kiện nối bằng &&
const list = state.sources.filter((source) => (
  `${source.name} ${source.url}`.toLowerCase().includes(q) &&
  (status === 'all' || source.status === status) &&
  (type === 'all' || source.type === type) &&
  (domain === 'all' || hostOf(source.url).endsWith(domain))
));

// Trong bindSourceControls():
$('#sourceDomain').addEventListener('change', renderSources);

A2 thêm vào .toolbar
<select id="sourceSort" class="btn outline">
  <option value="default">Sắp xếp: Mặc định</option>
  <option value="az">Tên A → Z</option>
  <option value="za">Tên Z → A</option>
</select>

-js 
// Thêm hàm này lên đầu file
const hostOf = (u) => { try { return new URL(u).hostname.toLowerCase(); } catch { return ''; } };

// Trong renderSources(): đọc giá trị
const domain = $('#sourceDomain').value;

// THAY phần filter: thêm 1 điều kiện nối bằng &&
const list = state.sources.filter((source) => (
  `${source.name} ${source.url}`.toLowerCase().includes(q) &&
  (status === 'all' || source.status === status) &&
  (type === 'all' || source.type === type) &&
  (domain === 'all' || hostOf(source.url).endsWith(domain))
));

// Trong bindSourceControls():
$('#sourceDomain').addEventListener('change', renderSources);

A3 
- js Thay đổi renderSources
$('#sourceCount').textContent = `Đang hiển thị ${list.length} / ${state.sources.length} kết quả`;

A4 
- html Thêm vào sources filter
 <button class="btn outline" id="resetFilters" type="button">↺ Xóa tất cả bộ lọc</button>

- js Trong bindsourcescontrol
$('#resetFilters').addEventListener('click', () => {
  $('#sourceSearch').value = '';
  $('#sourceStatus').value = 'all';
  $('#sourceType').value = 'all';
  if ($('#sourceDomain')) $('#sourceDomain').value = 'all';   // nếu đã làm A1
  if ($('#sourceSort')) $('#sourceSort').value = 'default';   // nếu đã làm A2
  renderSources();
  toast('Đã đặt lại bộ lọc.');
});

