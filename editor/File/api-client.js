(() => {
  const API_BASE_URL = 'http://127.0.0.1:3000/api';
  const STORAGE_KEY = 'legalpath:dataset';
  const FALLBACK_DATA = {
    sources: [
      { name: 'Bộ Công Thương', type: 'Cơ quan nhà nước', url: 'https://moit.gov.vn', status: 'Hoạt động' },
      { name: 'Cổng thông tin pháp luật Quốc gia', type: 'Cổng thông tin', url: 'https://phapluat.gov.vn', status: 'Hoạt động' },
      { name: 'Tạp chí Luật học', type: 'Báo chí', url: 'https://tapchiluathoc.vn', status: 'Hoạt động' },
      { name: 'VnExpress', type: 'Báo chí', url: 'https://vnexpress.net', status: 'Hoạt động' },
      { name: 'Sở Tư pháp Hà Nội', type: 'Cơ quan nhà nước', url: 'https://sotuphap.hanoi.gov.vn', status: 'Hoạt động' },
      { name: 'Thư viện pháp luật', type: 'Tài liệu', url: 'https://thuvienphapluat.vn', status: 'Cần kiểm tra' },
      { name: 'Báo Chính phủ', type: 'Báo chí', url: 'https://baochinhphu.vn', status: 'Hoạt động' },
      { name: 'Luật Việt Nam', type: 'Trang chuyên ngành', url: 'https://luatvietnam.vn', status: 'Hoạt động' },
      { name: 'Tổng cục Thuế', type: 'Cơ quan nhà nước', url: 'https://gdt.gov.vn', status: 'Hoạt động' },
      { name: 'Hội Luật gia Việt Nam', type: 'Tổ chức', url: 'https://hoiluatgia.vn', status: 'Cần kiểm tra' }
    ],
    queue: [
      { title: 'Cập nhật quy định mới về thuế thu nhập doanh nghiệp', source: 'Văn bản pháp luật', sender: 'Nguyễn Văn An', date: '12/03/2026', time: '10:24', status: 'Từ chối', description: 'Văn bản cập nhật một số quy định mới về thuế TNDN áp dụng từ năm 2026.' },
      { title: 'Hướng dẫn thực hiện hợp đồng lao động', source: 'Công văn', sender: 'Lê Thị Hồng', date: '11/03/2026', time: '16:32', status: 'Chờ duyệt', description: 'Hướng dẫn thực hiện các nội dung cơ bản của hợp đồng lao động.' },
      { title: 'Thông tư sửa đổi về đăng ký kinh doanh', source: 'Văn bản pháp luật', sender: 'Trần Văn Bình', date: '10/03/2026', time: '14:20', status: 'Chờ duyệt', description: 'Thông tin về các thay đổi trong thủ tục đăng ký kinh doanh.' },
      { title: 'Cập nhật biểu mẫu hành chính mới', source: 'Tài liệu hướng dẫn', sender: 'Phạm Thị Mai', date: '09/03/2026', time: '09:15', status: 'Đã duyệt', description: 'Tổng hợp biểu mẫu hành chính được cập nhật gần đây.' },
      { title: 'Quy định về bảo vệ dữ liệu cá nhân', source: 'Văn bản pháp luật', sender: 'Hoàng Đức Nam', date: '08/03/2026', time: '11:37', status: 'Chờ duyệt', description: 'Tóm tắt quy định và trách nhiệm liên quan đến bảo vệ dữ liệu cá nhân.' },
      { title: 'Hướng dẫn kê khai thuế điện tử', source: 'Tài liệu hướng dẫn', sender: 'Đỗ Minh Anh', date: '07/03/2026', time: '08:45', status: 'Đã duyệt', description: 'Hướng dẫn thao tác kê khai thuế điện tử.' }
    ],
    monitor: [
      { title: 'Thông tư 06/2025/TT-BTC về thuế TNDN', source: 'Bộ Tài chính', date: '12/03/2026', time: '09:30', age: 3, status: 'Ổn định' },
      { title: 'Nghị định 70/2025/NĐ-CP', source: 'Chính phủ', date: '10/03/2026', time: '14:20', age: 5, status: 'Ổn định' },
      { title: 'Hướng dẫn đăng ký doanh nghiệp', source: 'Sở KH&ĐT', date: '08/03/2026', time: '11:45', age: 7, status: 'Sắp hết hạn' },
      { title: 'Công văn 1234/BCT', source: 'Bộ Công Thương', date: '05/03/2026', time: '16:10', age: 10, status: 'Sắp hết hạn' },
      { title: 'Quy định bảo vệ dữ liệu cá nhân', source: 'Bộ TT&TT', date: '28/02/2026', time: '09:15', age: 15, status: 'Đã cũ' },
      { title: 'Thông tư 01/2024/TT-NHNN', source: 'Ngân hàng NN', date: '25/02/2026', time: '13:40', age: 18, status: 'Đã cũ' }
    ]
  };

  function getLocalCollection(name) {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}:${name}`);
      if (stored) {
        return JSON.parse(stored);
      }
      if (FALLBACK_DATA[name]) {
        localStorage.setItem(`${STORAGE_KEY}:${name}`, JSON.stringify(FALLBACK_DATA[name]));
        return FALLBACK_DATA[name];
      }
      return null;
    } catch {
      return FALLBACK_DATA[name] || null;
    }
  }

  async function getCollection(name) {
    try {
      const response = await fetch(`${API_BASE_URL}/${name}`);
      if (!response.ok) {
        throw new Error(`Không tải được dữ liệu ${name} (${response.status}).`);
      }
      const data = await response.json();
      localStorage.setItem(`${STORAGE_KEY}:${name}`, JSON.stringify(data));
      return data;
    } catch {
      const fallback = getLocalCollection(name);
      if (fallback) {
        return fallback;
      }
      throw new Error(`Không tải được dữ liệu ${name}.`);
    }
  }

  async function saveCollection(name, items) {
    try {
      const response = await fetch(`${API_BASE_URL}/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items)
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || `Không lưu được dữ liệu ${name} (${response.status}).`);
      }
      localStorage.setItem(`${STORAGE_KEY}:${name}`, JSON.stringify(items));
      return;
    } catch {
      localStorage.setItem(`${STORAGE_KEY}:${name}`, JSON.stringify(items));
    }
  }

  window.LegalPathAPI = { getCollection, saveCollection };
})();
