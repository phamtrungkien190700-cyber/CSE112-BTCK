/* ==========================================================================
   expert.js — Cổng Chuyên gia (Expert Portal) · MindCare
   Dùng cho:
     · pages/expert/expert-article-management.html   — Xem & rà soát bài viết (R)
     · pages/expert/expert-checklist-management.html — Quản lý checklist (C / R / U)
     · pages/expert/expert-profile.html              — Quản lý hồ sơ chuyên gia (C / R / U / D)
   Dữ liệu được lưu qua API backend vào các tệp JSON riêng trong data/.
   ========================================================================== */
"use strict";

/* ------------------------------- Tiện ích ------------------------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const pad = (n) => String(n).padStart(2, "0");
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(String(iso).length <= 10 ? iso + "T00:00:00" : iso);
  return isNaN(d) ? iso : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};
const fmtViews = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "K" : String(n));
const uid = (p = "") => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
/* ------------------------------ Thư viện icon --------------------------- */
const S = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const SVG = {
  eye: S(`<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`),
  search: S(`<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`),
  menu: S(`<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>`),
  bell: S(`<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`),
  help: S(`<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>`),
  user: S(`<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`),
  mail: S(`<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>`),
  phone: S(`<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>`),
  pin: S(`<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>`),
  calendar: S(`<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`),
  clock: S(`<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`),
  folder: S(`<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>`),
  file: S(`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>`),
  list: S(`<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>`),
  plus: S(`<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`),
  edit: S(`<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>`),
  trash: S(`<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`),
  x: S(`<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`),
  chevL: S(`<polyline points="15 18 9 12 15 6"/>`),
  chevR: S(`<polyline points="9 18 15 12 9 6"/>`),
  logout: S(`<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`),
  star: S(`<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`),
  award: S(`<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>`),
  shield: S(`<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`),
  link: S(`<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>`),
  heart: S(`<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>`),
  briefcase: S(`<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>`),
  info: S(`<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`),
  camera: S(`<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>`),
  check: S(`<polyline points="20 6 9 17 4 12"/>`),
  alert: S(`<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`),
  globe: S(`<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>`),
  send: S(`<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>`),
  msg: S(`<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>`),
  trend: S(`<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>`),
  zap: S(`<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`)
};
const icon = (n) => SVG[n] || "";
/* ------------------------------- Hằng số ------------------------------- */
const CATEGORIES = ["Pháp luật lao động", "Hợp đồng & Giao dịch", "Sở hữu trí tuệ", "Tài chính & Thuế", "Pháp luật doanh nghiệp", "Khác"];
const QTYPES = { yesno: "Có / Không", single: "Chọn 1 đáp án", multi: "Chọn nhiều đáp án", text: "Trả lời tự do" };
const AR_STATUS = { published: "Đã xuất bản", pending: "Chờ duyệt", draft: "Bản nháp", rejected: "Từ chối" };
const CL_STATUS = { published: "Đã xuất bản", pending: "Chờ duyệt", draft: "Bản nháp", rejected: "Từ chối" };
const STATUS_BADGE = { published: "badge-success", pending: "badge-warning", draft: "badge-neutral", rejected: "badge-neutral" };
const PAGE_SIZE = 6;

/* ------------------------------ Kho dữ liệu ----------------------------- */
const SEED_ARTICLES = [];
SEED_ARTICLES.push(
  {
    id: "art-01",
    title: "Hướng dẫn soạn thảo hợp đồng lao động đạt chuẩn Bộ luật Lao động 2019",
    desc: "Các điều khoản bắt buộc, lỗi thường gặp và mẫu tham chiếu dành cho doanh nghiệp.",
    category: "Pháp luật lao động", status: "published", checklistId: "cl-01",
    views: 12840, date: "2024-05-12", author: "Luật sư Trần Văn Minh",
    tags: ["Hợp đồng lao động", "BLLĐ 2019", "Nhân sự"],
    content: [
      { t: "p", x: "Hợp đồng lao động là căn cứ pháp lý quan trọng nhất trong quan hệ lao động. Theo Điều 14 Bộ luật Lao động 2019, hợp đồng lao động phải được giao kết bằng văn bản, trừ các trường hợp công việc tạm thời dưới 1 tháng có thể giao kết bằng lời nói." },
      { t: "h", x: "1. Các nội dung bắt buộc" },
      { t: "p", x: "Hợp đồng phải ghi rõ: tên, địa chỉ người sử dụng lao động; họ tên, ngày tháng năm sinh của người lao động; công việc và địa điểm làm việc; thời giờ làm việc, nghỉ ngơi; tiền lương và hình thức trả lương; thời hạn hợp đồng; điều kiện bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp." },
      { t: "h", x: "2. Những lỗi thường gặp" },
      { t: "p", x: "Nhiều doanh nghiệp thường vi phạm quy định về thử việc, đưa điều khoản phạt vi phạm vượt mức tối đa 20% tiền lương theo Điều 39, hoặc dùng phụ lục hợp đồng thay thế hợp đồng chính khi thay đổi nội dung cơ bản — dẫn tới hợp đồng vô hiệu từng phần hoặc toàn bộ." },
      { t: "h", x: "3. Khuyến nghị" },
      { t: "p", x: "Doanh nghiệp nên định kỳ rà soát toàn bộ hợp đồng đang lưu hành theo checklist đính kèm, đối chiếu từng điều khoản với văn bản quy phạm pháp luật hiện hành trước khi ký kết mới." }
    ]
  },
  {
    id: "art-02",
    title: "Nghị định 144/2021/NĐ-CP: Những hành vi xử phạt hành chính trong lao động cần biết",
    desc: "Tổng hợp mức phạt thường gặp và cách phòng tránh sai phạm trong quản trị nhân sự.",
    category: "Pháp luật lao động", status: "published", checklistId: "cl-02",
    views: 9870, date: "2024-04-28", author: "Luật sư Trần Văn Minh",
    tags: ["Nghị định 144", "Xử phạt", "Tuân thủ"],
    content: [
      { t: "p", x: "Nghị định 144/2021/NĐ-CP quy định mức xử phạt vi phạm hành chính trong lĩnh vực bảo hiểm xã hội, bảo hiểm y tế và lao động. Đây là văn bản mà mọi doanh nghiệp cần nắm để tránh rủi ro pháp lý không đáng có." },
      { t: "h", x: "Các vi phạm phổ biến" },
      { t: "p", x: "Không giao kết hợp đồng lao động bằng văn bản, chậm đóng bảo hiểm xã hội, không xây dựng thang bảng lương, bố trí làm thêm giờ vượt quy định... đều bị phạt tiền từ vài triệu đến hàng chục triệu đồng tùy mức độ." },
      { t: "p", x: "Ngoài phạt tiền, doanh nghiệp còn có thể bị đình chỉ hoạt động hoặc buộc khắc phục hậu quả. Checklist đính kèm giúp chủ doanh nghiệp tự kiểm tra mức độ tuân thủ trước khi cơ quan chức năng thanh tra." }
    ]
  },
  {
    id: "art-03",
    title: "Thỏa thuận bảo mật thông tin (NDA): Khuôn khổ pháp lý và mẫu checkpoint",
    desc: "Cách soạn thảo thỏa thuận không tiết lộ thông tin hiệu lực tại Việt Nam.",
    category: "Hợp đồng & Giao dịch", status: "published", checklistId: "cl-03",
    views: 11230, date: "2024-05-20", author: "Luật sư Nguyễn Thu Hà",
    tags: ["NDA", "Bảo mật", "Hợp đồng"],
    content: [
      { t: "p", x: "Thỏa thuận không tiết lộ thông tin (NDA) là công cụ bảo vệ bí mật kinh doanh phổ biến nhất. Tuy nhiên, một bản NDA sơ sài thường không thể bảo vệ doanh nghiệp khi tranh chấp xảy ra." },
      { t: "h", x: "Nội dung cốt lõi của NDA" },
      { t: "p", x: "Phạm vi thông tin bảo mật, trách nhiệm của bên nhận, thời hạn bảo mật (thường 2-5 năm sau khi ký), các trường hợp ngoại lệ, và chế tài khi vi phạm. Đánh dấu rõ ràng tài liệu 'MẬT' và giới hạn người được tiếp cận." },
      { t: "p", x: "Sử dụng checklist đính kèm để rà soát từng điều khoản trước khi trình lãnh đạo phê duyệt." }
    ]
  },
  {
    id: "art-04",
    title: "Checklist kiểm tra tính hợp pháp của hợp đồng thuê văn phòng",
    desc: "Rà soát 5 nhóm rủi ro khi ký hợp đồng thuê mặt bằng văn phòng tại Hà Nội, TP.HCM.",
    category: "Hợp đồng & Giao dịch", status: "pending", checklistId: "cl-04",
    views: 2140, date: "2024-06-05", author: "Luật sư Nguyễn Thu Hà",
    tags: ["Thuê văn phòng", "Bất động sản"],
    content: [
      { t: "p", x: "Hợp đồng thuê văn phòng là giao dịch có giá trị lớn nhưng thường bị xem nhẹ về mặt pháp lý. Kiểm tra giấy tờ pháp lý của tòa nhà, tư cách chủ sở hữu và các cam kết về phí dịch vụ là bước bắt buộc." },
      { t: "p", x: "Bài viết đang được phản biện, vui lòng theo dõi nội dung cập nhật sau khi có kết luận của hội đồng duyệt nội dung." }
    ]
  },
  {
    id: "art-05",
    title: "Đăng ký nhãn hiệu: Quy trình từ tra cứu đến cấp văn bằng bảo hộ",
    desc: "Hướng dẫn 9 bước tra cứu, nộp đơn và theo dõi tiến độ xử lý tại Cục Sở hữu trí tuệ.",
    category: "Sở hữu trí tuệ", status: "published", checklistId: "cl-05",
    views: 15320, date: "2024-03-18", author: "Luật sư Trần Văn Minh",
    tags: ["Nhãn hiệu", "Sở hữu trí tuệ", "Thương hiệu"],
    content: [
      { t: "p", x: "Nhãn hiệu là tài sản vô hình quan trọng. Trước khi nộp đơn, doanh nghiệp cần tra cứu để chắc chắn nhãn hiệu chưa bị trùng hoặc tương tự gây nhầm lẫn trong cùng nhóm sản phẩm, dịch vụ theo bảng phân loại Nice." },
      { t: "h", x: "Lộ trình dự kiến" },
      { t: "p", x: "Tra cứu sơ bộ (miễn phí) → tra cứu chuyên sâu → nộp đơn điện tử → thẩm định hình thức (1 tháng) → công bố đơn → thẩm định nội dung (12-18 tháng) → cấp giấy chứng nhận đăng ký nhãn hiệu." },
      { t: "p", x: "Sử dụng checklist đính kèm để chuẩn bị đầy đủ hồ sơ, hạn chế thiếu sót gây chậm trễ." }
    ]
  }
);
SEED_ARTICLES.push(
  {
    id: "art-06",
    title: "Hợp đồng chuyển giao công nghệ: Những rủi ro pháp lý doanh nghiệp hay bỏ qua",
    desc: "Phân tích các điều khoản quan trọng và cảnh báo rủi ro trong hợp đồng chuyển giao công nghệ.",
    category: "Sở hữu trí tuệ", status: "pending", checklistId: "cl-06",
    views: 3420, date: "2024-06-10", author: "Luật sư Nguyễn Thu Hà",
    tags: ["Chuyển giao công nghệ", "Sở hữu trí tuệ"],
    content: [
      { t: "p", x: "Hợp đồng chuyển giao công nghệ cần tuân thủ Luật Chuyển giao công nghệ 2017 và nên làm thủ tục đăng ký tại cơ quan quản lý để được hưởng ưu đãi thuế. Tuy nhiên, điều khoản về quyền sở hữu kết quả nghiên cứu mới là nút thắt pháp lý." },
      { t: "p", x: "Doanh nghiệp cần xác định rõ đối tượng chuyển giao, phạm vi sử dụng, thời hạn, phí và phương thức thanh toán, cũng như quyền đối với công nghệ cải tiến. Bài viết đang chờ hội đồng chuyên môn phản biện." }
    ]
  },
  {
    id: "art-07",
    title: "Quản lý hóa đơn điện tử và nghĩa vụ thuế của doanh nghiệp năm 2024",
    desc: "Cập nhật quy định mới về hóa đơn điện tử, hóa đơn điện tử từng lần bán hàng.",
    category: "Tài chính & Thuế", status: "published", checklistId: "cl-07",
    views: 18760, date: "2024-04-02", author: "Luật sư Trần Văn Minh",
    tags: ["Hóa đơn điện tử", "Thuế", "Kế toán"],
    content: [
      { t: "p", x: "Từ 01/01/2024, các trường hợp sử dụng hóa đơn điện tử từng lần bán hàng được siết chặt (không phân biệt doanh thu). Việc xuất hóa đơn phải thực hiện đúng thời điểm theo quy định tại Nghị định 123/2020/NĐ-CP." },
      { t: "h", x: "Ba lưu ý quan trọng" },
      { t: "p", x: "Thứ nhất, hóa đơn phải xuất đúng thời điểm lập. Thứ hai, các chỉ tiêu trên hóa đơn phải đúng quy cách, ký hiệu mẫu số. Thứ ba, doanh nghiệp phải giữ một bản hóa đơn điện tử lưu trữ theo quy định khi bán hàng hóa, cung cấp dịch vụ." },
      { t: "p", x: "Checklist đính kèm giúp kế toán kiểm tra nhanh các tiêu chí hợp lệ của hóa đơn trước khi kết thúc kỳ kê khai." }
    ]
  },
  {
    id: "art-08",
    title: "Thủ tục thành lập công ty TNHH một thành viên: Hồ sơ, trình tự và chi phí",
    desc: "Cẩm nang từng bước đăng ký doanh nghiệp trong ngày cho nhà đầu tư cá nhân.",
    category: "Pháp luật doanh nghiệp", status: "published", checklistId: null,
    views: 22640, date: "2024-02-15", author: "Luật sư Nguyễn Thu Hà",
    tags: ["Thành lập doanh nghiệp", "TNHH", "Đăng ký kinh doanh"],
    content: [
      { t: "p", x: "Thành lập công ty TNHH một thành viên gồm: chuẩn bị tên doanh nghiệp, trụ sở, ngành nghề (rà soát mã ngành có điều kiện), vốn điều lệ và hồ sơ người đại diện theo pháp luật." },
      { t: "h", x: "Trình tự chuẩn" },
      { t: "p", x: "Nộp hồ sơ qua Cổng thông tin quốc gia về đăng ký doanh nghiệp → nhận Giấy chứng nhận đăng ký doanh nghiệp (3 ngày làm việc) → công bố thông tin đăng ký trên cổng → khắc dấu, đăng ký chữ ký số và mở tài khoản ngân hàng → đăng ký thuế, đăng ký lao động." },
      { t: "p", x: "Bài viết này chưa đính kèm checklist. Xem thêm chuyên mục quản lý checklist để xây dựng bộ tiêu chí kiểm tra hồ sơ phù hợp." }
    ]
  },
  {
    id: "art-09",
    title: "Giải quyết tranh chấp lao động: Nên hòa giải hay khởi kiện ra tòa?",
    desc: "So sánh các phương thức giải quyết tranh chấp và trình tự bắt buộc phải thực hiện.",
    category: "Pháp luật lao động", status: "draft", checklistId: "cl-02",
    views: 560, date: "2024-07-01", author: "Luật sư Trần Văn Minh",
    tags: ["Tranh chấp lao động", "Hòa giải", "Khởi kiện"],
    content: [
      { t: "p", x: "Theo Bộ luật Lao động 2019, hòa giải là thủ tục bắt buộc trước khi khởi kiện đối với hầu hết tranh chấp lao động cá nhân. Hòa giải viên lao động có 5 ngày làm việc để tiến hành hòa giải." },
      { t: "p", x: "Nếu hòa giải không thành, các bên có quyền khởi kiện tại Tòa án trong thời hiệu 1 năm. Bài viết còn ở dạng bản nháp, đang bổ sung phân tích chi phí và thời gian của từng phương thức." }
    ]
  },
  {
    id: "art-10",
    title: "Điều khoản bất khả kháng trong hợp đồng thương mại: Viết thế nào cho hiệu lực?",
    desc: "Kinh nghiệm soạn thảo điều khoản force majeure đủ điều kiện miễn trách theo Bộ luật Dân sự.",
    category: "Hợp đồng & Giao dịch", status: "published", checklistId: "cl-03",
    views: 8690, date: "2024-05-30", author: "Luật sư Nguyễn Thu Hà",
    tags: ["Bất khả kháng", "Hợp đồng thương mại", "Rủi ro"],
    content: [
      { t: "p", x: "Điều khoản bất khả kháng cần liệt kê sự kiện, quy trình thông báo (trong 24-48 giờ), nghĩa vụ giảm thiểu thiệt hại và hậu quả pháp lý (gia hạn, tạm hoãn hay hủy hợp đồng)." },
      { t: "h", x: "Tiêu chí nhận diện" },
      { t: "p", x: "Sự kiện phải khách quan, không thể lường trước, không thể khắc phục được dù đã áp dụng mọi biện pháp cần thiết. Điều khoản càng chi tiết, càng ít tranh chấp khi áp dụng." },
      { t: "p", x: "Đối chiếu với checklist đính kèm để rà soát mức độ đầy đủ của điều khoản trước khi ký." }
    ]
  }
);
const SEED_CHECKLISTS = [
  {
    id: "cl-01", name: "Checklist rà soát hợp đồng lao động",
    desc: "Danh sách kiểm tra các điều khoản bắt buộc và lỗi phổ biến khi soạn thảo, giao kết hợp đồng lao động theo BLLĐ 2019.",
    category: "Pháp luật lao động", status: "published", updatedAt: "2024-06-01",
    questions: [
      { id: "q1", text: "Hợp đồng ghi rõ loại hợp đồng (không xác định thời hạn / xác định thời hạn 12-36 tháng)?", type: "yesno", required: true },
      { id: "q2", text: "Đã kiểm tra số CMND/CCCD, địa chỉ và thông tin liên hệ của người lao động?", type: "yesno", required: true },
      { id: "q3", text: "Mô tả công việc và địa điểm làm việc cụ thể, không ghi chung chung?", type: "yesno", required: true },
      { id: "q4", text: "Mức lương thử việc tối thiểu đạt 85% mức lương chính thức (Điều 26)?", type: "yesno", required: false },
      { id: "q5", text: "Điều khoản phạt vi phạm không vượt quá 20% một tháng tiền lương (Điều 39)?", type: "single", required: true },
      { id: "q6", text: "Hợp đồng yêu cầu làm thêm giờ tối đa hằng tháng là bao nhiêu giờ?", type: "text", required: false },
      { id: "q7", text: "Đã ký kết theo đúng số bản mà thỏa thuận yêu cầu và giao cho người lao động giữ một bản?", type: "yesno", required: true }
    ]
  },
  {
    id: "cl-02", name: "Checklist tuân thủ kỷ luật lao động",
    desc: "Rà soát quy trình xử lý kỷ luật lao động và các sai phạm quản trị nhân sự thường gặp.",
    category: "Pháp luật lao động", status: "published", updatedAt: "2024-05-20",
    questions: [
      { id: "q1", text: "Công ty đã ban hành nội quy lao động và đăng ký với cơ quan quản lý chưa?", type: "yesno", required: true },
      { id: "q2", text: "Người lao động được thông báo bằng văn bản về nội quy lao động?", type: "yesno", required: true },
      { id: "q3", text: "Thời hiệu xử lý kỷ luật lao động được tuân thủ (tối đa 6 tháng)?", type: "yesno", required: true },
      { id: "q4", text: "Đơn phương chấm dứt hợp đồng có đúng căn cứ và báo trước đủ thời hạn?", type: "single", required: false }
    ]
  },
  {
    id: "cl-03", name: "Checklist bảo mật thông tin & thỏa thuận NDA",
    desc: "Bộ câu hỏi đánh giá mức độ chặt chẽ của thỏa thuận bảo mật thông tin doanh nghiệp.",
    category: "Hợp đồng & Giao dịch", status: "published", updatedAt: "2024-06-12",
    questions: [
      { id: "q1", text: "NDA định nghĩa rõ 'thông tin bảo mật' bao gồm phần mềm, tài liệu, khách hàng?", type: "yesno", required: true },
      { id: "q2", text: "Thời hạn bảo mật sau khi kết thúc hợp đồng được xác định rõ ràng?", type: "yesno", required: true },
      { id: "q3", text: "Có các trường hợp ngoại lệ (tiết lộ theo pháp luật, thông tin công khai)?", type: "yesno", required: true },
      { id: "q4", text: "Có quy định chế tài bồi thường thiệt hại khi vi phạm?", type: "single", required: false },
      { id: "q5", text: "Bên nhận NDA có được phép chuyển giao lại cho bên thứ ba không?", type: "multi", required: false }
    ]
  },
  {
    id: "cl-04", name: "Checklist hợp đồng thuê văn phòng",
    desc: "Kiểm tra giấy tờ pháp lý và các điều khoản trọng yếu trước khi ký hợp đồng thuê mặt bằng.",
    category: "Hợp đồng & Giao dịch", status: "draft", updatedAt: "2024-07-02",
    questions: [
      { id: "q1", text: "Đã yêu cầu bản sao giấy chứng nhận quyền sử dụng đất / sở hữu nhà?", type: "yesno", required: true },
      { id: "q2", text: "Chủ cho thuê là chủ sở hữu hoặc có giấy ủy quyền hợp lệ?", type: "yesno", required: true },
      { id: "q3", text: "Phí dịch vụ quản lý, phí điện nước, phí đỗ xe được tách bạch?", type: "yesno", required: true },
      { id: "q4", text: "Điều khoản miễn tiền thuê thời gian sửa chữa ban đầu có hay không?", type: "single", required: false },
      { id: "q5", text: "Quyền chấm dứt sớm và mức phạt được thỏa thuận?", type: "text", required: false }
    ]
  },
  {
    id: "cl-05", name: "Checklist đăng ký nhãn hiệu",
    desc: "Rà soát hồ sơ đăng ký nhãn hiệu trước khi nộp đơn tại Cục Sở hữu trí tuệ.",
    category: "Sở hữu trí tuệ", status: "published", updatedAt: "2024-04-26",
    questions: [
      { id: "q1", text: "Đã thực hiện tra cứu sơ bộ trên hệ thống tra cứu quốc gia?", type: "yesno", required: true },
      { id: "q2", text: "Nhãn hiệu không trùng/tương tự gây nhầm lẫn với đơn đã nộp trước?", type: "yesno", required: true },
      { id: "q3", text: "Danh mục sản phẩm, dịch vụ được phân loại theo bảng Nice?", type: "yesno", required: true },
      { id: "q4", text: "Mẫu nhãn hiệu đạt yêu cầu về kích thước, độ phân giải?", type: "yesno", required: false },
      { id: "q5", text: "Đã chuẩn bị giấy ủy quyền (nếu nộp qua đại diện sở hữu công nghiệp)?", type: "yesno", required: true }
    ]
  },
  {
    id: "cl-06", name: "Checklist chuyển giao công nghệ",
    desc: "Kiểm tra hồ sơ và điều khoản của hợp đồng chuyển giao công nghệ nội địa, nhập khẩu.",
    category: "Sở hữu trí tuệ", status: "draft", updatedAt: "2024-07-04",
    questions: [
      { id: "q1", text: "Đối tượng công nghệ được mô tả cụ thể, có tài liệu kỹ thuật kèm theo?", type: "yesno", required: true },
      { id: "q2", text: "Điều khoản bảo mật và quyền sở hữu công nghệ cải tiến rõ ràng?", type: "yesno", required: true },
      { id: "q3", text: "Phí chuyển giao và phương thức thanh toán phù hợp quy định thuế?", type: "single", required: false },
      { id: "q4", text: "Nghĩa vụ đăng ký hợp đồng tại cơ quan quản lý được làm rõ?", type: "yesno", required: true }
    ]
  },
  {
    id: "cl-07", name: "Checklist sổ sách kế toán & hóa đơn điện tử",
    desc: "Tự kiểm tra nhanh tính hợp lệ của hóa đơn điện tử và sổ sách kế toán doanh nghiệp.",
    category: "Tài chính & Thuế", status: "published", updatedAt: "2024-05-08",
    questions: [
      { id: "q1", text: "Hóa đơn được xuất đúng thời điểm lập theo quy định?", type: "yesno", required: true },
      { id: "q2", text: "Đối chiếu giữa hóa đơn điện tử và bảng kê khai thuế GTGT?", type: "yesno", required: true },
      { id: "q3", text: "Hạch toán các khoản chi phí không hợp lệ bị loại trước khi quyết toán?", type: "yesno", required: false },
      { id: "q4", text: "Các hóa đơn đã được lưu trữ theo đúng định dạng dữ liệu?", type: "yesno", required: false },
      { id: "q5", text: "Sổ sách kế toán được in, đóng dấu giáp lai đủ theo quy định?", type: "yesno", required: true }
    ]
  }
];
const SEED_PROFILE = {
  name: "ThS. Luật sư Trần Minh",
  initials: "TM",
  role: "Chuyên gia pháp lý",
  title: "Thạc sĩ · Luật sư",
  email: "tranminh.law@example.com",
  phone: "090 123 4567",
  organization: "Công ty Luật Minh & Cộng sự",
  gender: "Nam",
  dob: "1986-04-22",
  city: "Hà Nội",
  specialty: "Doanh nghiệp, Dân sự, Lao động",
  yearsExperience: 12,
  joined: "2026-01-05",
  bio: "Tôi có 12 năm kinh nghiệm tư vấn pháp luật doanh nghiệp và dân sự. Tôi đồng hành cùng người dân và doanh nghiệp trong việc chuẩn bị hồ sơ, rà soát hợp đồng và thực hiện các thủ tục pháp lý.",
  rating: 4.8,
  reviews: 98,
  stats: { articles: 42, checklists: 18, views: "36.2K", rating: 4.8 },
  licenses: [
    { id: "license-01", name: "Chứng chỉ hành nghề luật sư", number: "1234/TP-LS-CNH", issuer: "Đoàn Luật sư thành phố Hà Nội", issuedAt: "15/06/2014" }
  ],
  skills: [
    { id: "sk-01", name: "Tư vấn pháp luật doanh nghiệp", pct: 95 },
    { id: "sk-02", name: "Soạn thảo hợp đồng", pct: 92 },
    { id: "sk-03", name: "Giải quyết tranh chấp lao động", pct: 88 },
    { id: "sk-04", name: "Sở hữu trí tuệ", pct: 80 }
  ],
  certs: [
    { id: "ce-01", name: "Chứng chỉ hành nghề luật sư", issuer: "Liên đoàn Luật sư Việt Nam", year: "2012" },
    { id: "ce-02", name: "Chứng nhận Giải quyết tranh chấp thương mại", issuer: "Trung tâm Trọng tài Quốc tế Việt Nam (VIAC)", year: "2018" },
    { id: "ce-03", name: "Chứng chỉ về Sở hữu trí tuệ WIPO", issuer: "Tổ chức Sở hữu trí tuệ Thế giới", year: "2021" }
  ],
  links: [
    { id: "li-01", platform: "LinkedIn", url: "https://linkedin.com/in/tranvanminh" },
    { id: "li-02", platform: "Facebook", url: "https://facebook.com/tranvanminh.law" },
    { id: "li-03", platform: "Trang cá nhân MindCare", url: "https://mindcare.vn/expert/minhtran" }
  ]
};

const Store = {
  key: "mc_expert_portal_v1",
  read() {
    try { return JSON.parse(localStorage.getItem(this.key)) || null; } catch (e) { return null; }
  },
  write(d) { localStorage.setItem(this.key, JSON.stringify(d)); },
  get() {
    let d = this.read();
    if (!d) { d = { articles: SEED_ARTICLES, checklists: SEED_CHECKLISTS, profile: SEED_PROFILE }; this.write(d); }
    return d;
  },
  reset() { localStorage.removeItem(this.key); }
};
globalThis.Store = Store;
window.Store = Store;
/* ----------------------- Thông báo, modal, phân trang -------------------- */
function toast(message, type = "success") {
  let wrap = $("#toastWrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "toastWrap";
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }
  const el = document.createElement("div");
  el.className = "toast " + type;
  const ic = type === "error" ? "alert" : type === "info" ? "info" : "check";
  el.innerHTML = `<span>${icon(ic)}</span>${esc(message)}`;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(10px)";
    setTimeout(() => el.remove(), 300);
  }, 2800);
}

function openModal(id) { const m = document.getElementById(id); if (m) m.classList.add("open"); }
function closeModal(id) { const m = document.getElementById(id); if (m) m.classList.remove("open"); }

function bindModalClosers() {
  $$("[data-close]").forEach((b) => b.addEventListener("click", () => closeModal(b.dataset.close)));
  $$(".modal-backdrop").forEach((bd) => {
    bd.addEventListener("mousedown", (e) => { if (e.target === bd) bd.classList.remove("open"); });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") $$(".modal-backdrop.open").forEach((m) => m.classList.remove("open"));
  });
}

function pagerSeq(pages, cur) {
  const set = new Set([1, 2, pages - 1, pages, cur - 1, cur, cur + 1]);
  const arr = [...set].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  arr.forEach((p) => { if (p - prev > 1) out.push(0); out.push(p); prev = p; });
  return out;
}

function renderPager(container, total, page, per, onGo) {
  if (!container) return;
  const pages = Math.max(1, Math.ceil(total / per));
  const cur = Math.min(page, pages);
  let html = `<div class="pager-info">Hiển thị ${total ? (cur - 1) * per + 1 : 0}–${Math.min(cur * per, total)} trên ${total} mục</div>`;
  html += `<div class="pager-btns">`;
  html += `<button class="pg-btn" data-p="${cur - 1}" ${cur === 1 ? "disabled" : ""}>${icon("chevL")}</button>`;
  pagerSeq(pages, cur).forEach((p) => {
    html += p === 0
      ? `<span class="pg-btn pg-ellip">…</span>`
      : `<button class="pg-btn ${p === cur ? "active" : ""}" data-p="${p}">${p}</button>`;
  });
  html += `<button class="pg-btn" data-p="${cur + 1}" ${cur === pages ? "disabled" : ""}>${icon("chevR")}</button>`;
  html += `</div>`;
  container.innerHTML = html;
  $$(".pg-btn", container).forEach((b) => {
    b.addEventListener("click", () => {
      const p = +b.dataset.p;
      if (p >= 1 && p <= pages && p !== cur) onGo(p);
    });
  });
}
/* --------------------- Khởi tạo khung chung (shell) ---------------------- */
function initShell() {
  const menuBtn = $("#menuBtn"), sidebar = $("#sidebar"), scrim = $("#scrim");
  if (menuBtn && sidebar && scrim) {
    menuBtn.addEventListener("click", () => { sidebar.classList.add("open"); scrim.classList.add("show"); });
    scrim.addEventListener("click", () => { sidebar.classList.remove("open"); scrim.classList.remove("show"); });
  }

  $$("[data-dd]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const dd = btn.closest(".dropdown");
      const was = dd.classList.contains("open");
      $$(".dropdown.open").forEach((d) => d.classList.remove("open"));
      if (!was) dd.classList.add("open");
    });
  });
  document.addEventListener("click", () => $$(".dropdown.open").forEach((d) => d.classList.remove("open")));

  $$("#logoutBtn, #logoutBtn2").forEach((b) => {
    b.addEventListener("click", () => toast("Bạn đã đăng xuất khỏi Cổng Chuyên gia.", "info"));
  });

  const markAll = $("#markAllRead");
  if (markAll) {
    markAll.addEventListener("click", () => {
      $$(".notif-dot").forEach((x) => { x.style.display = "none"; });
      toast("Đã đánh dấu tất cả thông báo đã đọc.");
    });
  }

  $("#helpFeedback")?.addEventListener("click", () => toast("Đã gửi phản hồi tới đội ngũ hỗ trợ. Cảm ơn bạn!", "info"));
  $("#helpDoc")?.addEventListener("click", () => toast("Mở tài liệu hướng dẫn Cổng Chuyên gia…", "info"));

  const ts = $("#topSearchInput");
  if (ts) {
    ts.addEventListener("input", debounce(() => {
      if (window.PageCtl && typeof PageCtl.setQuery === "function") PageCtl.setQuery(ts.value.trim());
    }, 200));
  }

  // Đổ dữ liệu hồ sơ vào thanh bên / menu người dùng
  const p = Store.get().profile;
  $$("[data-side-name]").forEach((el) => { el.textContent = p.name; });
  $$("[data-side-role]").forEach((el) => { el.textContent = p.role; });
  $$("[data-side-email]").forEach((el) => { el.textContent = p.email; });
  $$("[data-side-initials]").forEach((el) => { el.textContent = p.initials; });

  bindModalClosers();
}
/* ------------------- Trang: Quản lý bài viết (chế độ R) ------------------ */
function ArticlesPage() {
  const state = { q: "", status: "all", cat: "all", page: 1 };
  const db = () => Store.get();

  function filtered() {
    return db().articles.filter((a) => {
      const okQ = !state.q || (a.title + " " + a.desc + " " + a.author).toLowerCase().includes(state.q.toLowerCase());
      const okS = state.status === "all" || a.status === state.status;
      const okC = state.cat === "all" || a.category === state.cat;
      return okQ && okS && okC;
    });
  }

  function renderStats() {
    const arts = db().articles;
    $("#stTotal").textContent = arts.length;
    $("#stPub").textContent = arts.filter((a) => a.status === "published").length;
    $("#stPending").textContent = arts.filter((a) => a.status === "pending").length;
    $("#stViews").textContent = fmtViews(arts.reduce((s, a) => s + (a.views || 0), 0));
  }

  function renderTable() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    const rows = list.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
    const tbody = $("#artTbody");
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty">${icon("file")}<b>Không tìm thấy bài viết</b><span>Thử thay đổi từ khóa hoặc bộ lọc trạng thái, chuyên mục.</span></div></td></tr>`;
    } else {
      tbody.innerHTML = rows.map((a) => {
        const cl = db().checklists.find((c) => c.id === a.checklistId);
        const qc = cl ? cl.questions.length : 0;
        return `<tr>
        <td><div class="t-title"><span class="t-file">${icon("file")}</span><div><div class="t-name">${esc(a.title)}</div><div class="t-desc">${esc(a.desc)}</div></div></div></td>
        <td><span class="cat-name">${icon("folder")}${esc(a.category)}</span></td>
        <td><span class="badge ${STATUS_BADGE[a.status]}">${AR_STATUS[a.status]}</span></td>
        <td><span class="cl-count">${icon("list")}${qc} câu hỏi</span></td>
        <td><span class="view-count">${icon("eye")}${fmtViews(a.views)}</span></td>
        <td>${fmtDate(a.date)}</td>
        <td><div class="tb-actions"><button class="btn btn-ghost btn-sm" data-view="${a.id}">${icon("eye")} Xem</button></div></td>
      </tr>`;
      }).join("");
      $$("[data-view]", tbody).forEach((b) => b.addEventListener("click", () => openDetail(b.dataset.view)));
    }
    renderPager($("#artPager"), list.length, state.page, PAGE_SIZE, (p) => { state.page = p; renderTable(); });
  }

  function openDetail(id) {
    const a = db().articles.find((x) => x.id === id);
    if (!a) return;
    const cl = db().checklists.find((c) => c.id === a.checklistId);
    $("#artViewTitle").textContent = a.title;
    $("#artViewMeta").innerHTML = `
      <span>${icon("user")}${esc(a.author)}</span>
      <span>${icon("calendar")}${fmtDate(a.date)}</span>
      <span>${icon("eye")}${fmtViews(a.views)} lượt xem</span>
      <span>${icon("folder")}${esc(a.category)}</span>
      <span class="badge ${STATUS_BADGE[a.status]}">${AR_STATUS[a.status]}</span>`;
    $("#artViewContent").innerHTML = a.content.map((b) => (b.t === "h" ? `<h4>${esc(b.x)}</h4>` : `<p>${esc(b.x)}</p>`)).join("");
    $("#artViewTags").innerHTML = a.tags.map((t) => `<span class="chip">#${esc(t)}</span>`).join("");
    $("#artAttached").innerHTML = cl
      ? `<div class="ac-head">${icon("list")} Checklist đính kèm: ${esc(cl.name)} · ${cl.questions.length} câu hỏi</div>
         ${cl.questions.map((q, i) => `<div class="question"><span class="q-num">${i + 1}</span><div class="question-body"><p>${esc(q.text)}</p><span>${QTYPES[q.type]}${q.required ? " · Bắt buộc" : ""}</span></div></div>`).join("")}`
      : `<div class="notice">${icon("info")}<span><b>Lưu ý:</b> Bài viết chưa đính kèm checklist đánh giá.</span></div>`;
    openModal("artViewModal");
  }

  function exportCsv() {
    const list = filtered();
    if (!list.length) { toast("Không có dữ liệu để xuất.", "error"); return; }
    const rows = [["Tiêu đề", "Chuyên mục", "Trạng thái", "Checklist đính kèm", "Lượt xem", "Ngày đăng"]];
    list.forEach((a) => {
      const cl = db().checklists.find((c) => c.id === a.checklistId);
      rows.push([a.title, a.category, AR_STATUS[a.status], cl ? cl.name : "—", a.views, fmtDate(a.date)]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "danh-sach-bai-viet.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Đã xuất danh sách bài viết (CSV).");
  }

  $("#artSearch").addEventListener("input", debounce((e) => { state.q = e.target.value.trim(); state.page = 1; renderTable(); }));
  $("#artStatus").addEventListener("change", (e) => { state.status = e.target.value; state.page = 1; renderTable(); });
  $("#artCat").addEventListener("change", (e) => { state.cat = e.target.value; state.page = 1; renderTable(); });
  $("#exportBtn").addEventListener("click", exportCsv);
  $("#refreshBtn").addEventListener("click", () => { renderStats(); renderTable(); toast("Đã làm mới dữ liệu.", "info"); });

  renderStats();
  renderTable();

  return {
    setQuery(q) { state.q = q; state.page = 1; renderTable(); }
  };
}
/* ------------- Trang: Quản lý checklist (chế độ C / R / U) --------------- */
function ChecklistsPage() {
  const state = { q: "", status: "all", page: 1 };
  const db = () => Store.get();

  function filtered() {
    return db().checklists.filter((c) => {
      const okQ = !state.q || (c.name + " " + (c.desc || "")).toLowerCase().includes(state.q.toLowerCase());
      const okS = state.status === "all" || c.status === state.status;
      return okQ && okS;
    });
  }

  function renderStats() {
    const cls = db().checklists;
    $("#clTotal").textContent = cls.length;
    $("#clDraft").textContent = cls.filter((c) => c.status === "draft").length;
    $("#clPub").textContent = cls.filter((c) => c.status === "published").length;
    $("#clQTotal").textContent = cls.reduce((s, c) => s + c.questions.length, 0);
  }

  function renderTable() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    const rows = list.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
    const tbody = $("#clTbody");
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty">${icon("list")}<b>Không tìm thấy checklist</b><span>Thử thay đổi từ khóa hoặc tạo checklist mới.</span></div></td></tr>`;
    } else {
      tbody.innerHTML = rows.map((c) => `
        <tr>
          <td><div class="t-title"><span class="t-file t-file-violet">${icon("list")}</span><div><div class="t-name">${esc(c.name)}</div><div class="t-desc">${esc(c.desc)}</div></div></div></td>
          <td><span class="cl-count">${icon("list")}${c.questions.length} câu hỏi</span></td>
          <td><span class="badge ${STATUS_BADGE[c.status]}">${CL_STATUS[c.status]}</span></td>
          <td><span class="cat-name">${icon("folder")}${esc(c.category)}</span></td>
          <td>${fmtDate(c.updatedAt)}</td>
          <td><div class="tb-actions">
            <button class="btn btn-ghost btn-sm" data-view="${c.id}">${icon("eye")} Xem</button>
            <button class="btn btn-soft btn-sm" data-edit="${c.id}">${icon("edit")} Sửa</button>
          </div></td>
        </tr>`).join("");
      $$("[data-view]", tbody).forEach((b) => b.addEventListener("click", () => openView(b.dataset.view)));
      $$("[data-edit]", tbody).forEach((b) => b.addEventListener("click", () => openForm(b.dataset.edit)));
    }
    renderPager($("#clPager"), list.length, state.page, PAGE_SIZE, (p) => { state.page = p; renderTable(); });
  }

  function openView(id) {
    const c = db().checklists.find((x) => x.id === id);
    if (!c) return;
    $("#clViewName").textContent = c.name;
    $("#clViewMeta").innerHTML = `
      <span>${icon("folder")}${esc(c.category)}</span>
      <span>${icon("calendar")}Cập nhật ${fmtDate(c.updatedAt)}</span>
      <span>${icon("list")}${c.questions.length} câu hỏi</span>
      <span class="badge ${STATUS_BADGE[c.status]}">${CL_STATUS[c.status]}</span>`;
    $("#clViewDesc").textContent = c.desc || "";
    $("#clViewQuestions").querySelector(".ac-head").innerHTML = `${icon("list")} Danh sách câu hỏi (${c.questions.length})`;
    $("#clViewQuestions").querySelector(".q-list-readonly").innerHTML = c.questions.length
      ? c.questions.map((q, i) => `<div class="question"><span class="q-num">${i + 1}</span><div class="question-body"><p>${esc(q.text)}</p><span>${QTYPES[q.type]}${q.required ? " · Bắt buộc" : " · Tùy chọn"}</span></div></div>`).join("")
      : `<div class="notice">${icon("info")}<span>Checklist này chưa có câu hỏi nào.</span></div>`;
    $("#clViewEdit").onclick = () => { closeModal("clViewModal"); openForm(id); };
    openModal("clViewModal");
  }

  /* -------------------- Biên tập câu hỏi động trong modal ------------------ */
  function qRowHtml(q, i) {
    return `<div class="q-row">
      <span class="q-idx">${i + 1}</span>
      <input class="input" data-f="text" value="${esc(q.text)}" placeholder="Nhập nội dung câu hỏi…">
      <select class="input" data-f="type">${Object.keys(QTYPES).map((k) => `<option value="${k}" ${q.type === k ? "selected" : ""}>${QTYPES[k]}</option>`).join("")}</select>
      <label class="q-req"><input type="checkbox" data-f="req" ${q.required ? "checked" : ""}>Bắt buộc</label>
      <button type="button" class="q-del" title="Xóa câu hỏi">${icon("trash")}</button>
    </div>`;
  }

  function renderQuestionList(items, keep = []) {
    const list = (items && items.length ? items : [{ text: "", type: "yesno", required: true }]);
    $("#qList").innerHTML = list.map((q, i) => qRowHtml(q, i)).join("");
    reindexQuestions();
    if (keep.length) {
      setTimeout(() => { const r = $$("#qList .q-row")[keep.index] || null; if (r) { const inp = $("input[data-f=text]", r); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } }, 30);
    }
  }

  function reindexQuestions() {
    $$("#qList .q-row").forEach((r, i) => { $(".q-idx", r).textContent = i + 1; });
    $("#qListCount").textContent = $$("#qList .q-row").length;
  }

  function setQuery(q) { state.q = q; state.page = 1; renderTable(); }

  function openForm(id) {
    const cl = id ? db().checklists.find((c) => c.id === id) : null;
    $("#clModal").dataset.editId = cl ? cl.id : "";
    $("#clModalTitle").textContent = cl ? "Chỉnh sửa checklist" : "Thêm checklist mới";
    $("#clFName").value = cl ? cl.name : "";
    $("#clFDesc").value = cl ? (cl.desc || "") : "";
    $("#clFCat").value = cl ? cl.category : CATEGORIES[0];
    $("#clFStatus").value = cl ? cl.status : "draft";
    renderQuestionList(cl ? cl.questions : []);
    openModal("clModal");
    setTimeout(() => $("#clFName").focus(), 60);
  }

  function saveChecklist() {
    const name = $("#clFName").value.trim();
    const desc = $("#clFDesc").value.trim();
    const category = $("#clFCat").value;
    const status = $("#clFStatus").value;
    if (!name) { toast("Vui lòng nhập tên checklist.", "error"); $("#clFName").focus(); return; }
    const questions = $$("#qList .q-row").map((r) => ({
      id: uid("q"),
      text: $("[data-f=text]", r).value.trim(),
      type: $("[data-f=type]", r).value,
      required: $("[data-f=req]", r).checked
    })).filter((x) => x.text);
    if (!questions.length) { toast("Checklist cần có ít nhất một câu hỏi.", "error"); return; }
    const d = Store.get();
    const editingId = $("#clModal").dataset.editId || "";
    if (editingId) {
      const cl = d.checklists.find((c) => c.id === editingId);
      if (cl) {
        Object.assign(cl, { name, desc, category, status, questions, updatedAt: today() });
        toast("Đã cập nhật checklist.");
      }
    } else {
      d.checklists.unshift({ id: uid("cl-"), name, desc, category, status, questions, createdAt: today(), updatedAt: today() });
      toast("Đã tạo checklist mới.");
    }
    Store.write(d);
    closeModal("clModal");
    renderStats();
    renderTable();
  }

  $("#clSearch").addEventListener("input", debounce((e) => { state.q = e.target.value.trim(); state.page = 1; renderTable(); }));
  $("#clStatusSel").addEventListener("change", (e) => { state.status = e.target.value; state.page = 1; renderTable(); });
  $("#clNewBtn").addEventListener("click", () => openForm(null));
  $("#addQBtn").addEventListener("click", () => {
    const count = $$("#qList .q-row").length;
    $("#qList").insertAdjacentHTML("beforeend", qRowHtml({ text: "", type: "yesno", required: true }, count));
    reindexQuestions();
    const last = $$("#qList .q-row").pop();
    const inp = $("input[data-f=text]", last);
    if (inp) { inp.focus(); }
  });
  $("#qList").addEventListener("click", (e) => {
    const del = e.target.closest(".q-del");
    if (!del) return;
    del.closest(".q-row").remove();
    reindexQuestions();
  });
  $("#saveClBtn").addEventListener("click", saveChecklist);
  $("#clFName").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("#clFDesc").focus(); } });

  renderStats();
  renderTable();

  return { init() { /* đã render tại lúc dựng controller */ }, setQuery };
}
/* ------------- Trang: Hồ sơ chuyên gia (chế độ C / R / U / D) ------------ */
function ProfilePage() {
  const db = () => Store.get();

  function setAvatarUI() {
    const p = db().profile;
    const avatar = $("#pfAvatar");
    if (p.avatar) {
      avatar.classList.add("has-img");
      avatar.style.backgroundImage = `url("${p.avatar}")`;
      $("#pfInitials").textContent = "";
    } else {
      avatar.classList.remove("has-img");
      avatar.style.backgroundImage = "";
      $("#pfInitials").textContent = p.initials;
    }
  }

  function renderCard() {
    const p = db().profile;
    $("#pfName").textContent = p.name;
    $("#pfRole").textContent = p.role;
    $("#pfRating").textContent = p.rating.toFixed(1);
    $("#pfReviews").textContent = `${p.reviews} đánh giá`;
    $("#pfStatArticles").textContent = p.stats.articles;
    $("#pfStatChecklists").textContent = p.stats.checklists;
    $("#pfStatViews").textContent = p.stats.views;
    $("#pfStatRate").textContent = p.rating.toFixed(1);
    $("#pfMeta").innerHTML = `
      <span class="p-mi">${icon("pin")}${esc(p.city)}</span>
      <span class="p-mi">${icon("mail")}${esc(p.email)}</span>
      <span class="p-mi">${icon("phone")}${esc(p.phone)}</span>
      <span class="p-mi">${icon("clock")}Hoạt động từ ${fmtDate(p.joined)}</span>`;
    $("#pfBio").textContent = p.bio || "";
    setAvatarUI();
  }

  function renderInfo() {
    const p = db().profile;
    const rows = [
      ["Họ và tên", p.name],
      ["Vai trò", p.role],
      ["Email", p.email],
      ["Số điện thoại", p.phone],
      ["Giới tính", p.gender],
      ["Ngày sinh", fmtDate(p.dob)],
      ["Thành phố", p.city],
      ["Ngày tham gia", fmtDate(p.joined)]
    ];
    $("#infoList").innerHTML = rows.map(([k, v]) => `<div class="info-row"><b>${k}</b><span>${esc(v)}</span></div>`).join("");
    $("#infoBio").textContent = p.bio || "";
  }

  function renderSkills() {
    const p = db().profile;
    $("#skillList").innerHTML = p.skills.length
      ? p.skills.map((s) => `
          <div class="skill-row">
            <span>${esc(s.name)}</span>
            <div class="skill-bar"><i style="width:${s.pct}%"></i></div>
            <span class="skill-pct">${s.pct}%</span>
          </div>`).join("")
      : `<div class="notice">${icon("info")}<span>Chưa có kỹ năng nào. Nhấn "Quản lý" để thêm.</span></div>`;
  }

  function renderCerts() {
    const p = db().profile;
    $("#certList").innerHTML = p.certs.length
      ? p.certs.map((c) => `
          <div class="cert-item">
            <span class="cert-ic">${icon("award")}</span>
            <div class="cert-body"><b>${esc(c.name)}</b><span>${esc(c.issuer)} · ${esc(c.year)}</span></div>
          </div>`).join("")
      : `<div class="notice">${icon("info")}<span>Chưa có chứng chỉ nào.</span></div>`;
  }

  function renderLinks() {
    const p = db().profile;
    $("#linkList").innerHTML = p.links.length
      ? p.links.map((l) => `
          <a class="link-row" href="${esc(l.url)}" target="_blank" rel="noopener">
            <span class="link-ic">${icon("globe")}</span>
            <div class="link-info"><b>${esc(l.platform)}</b><span>${esc(l.url)}</span></div>
          </a>`).join("")
      : `<div class="notice">${icon("info")}<span>Chưa có liên kết mạng xã hội.</span></div>`;
  }

  function renderAll() { renderCard(); renderInfo(); renderSkills(); renderCerts(); renderLinks(); }
}

/* ----------------------- Giao diện LegalPath mới ----------------------- */
const portal = {
  root: document.getElementById("pageContent"),
  data: null,
  expertRecord: null,
  page: document.body.dataset.page,
  article: { query: "", status: "all", category: "all", page: 1, selectedId: "" },
  checklist: { query: "", status: "all", page: 1 },
  modal: null
};
let articleCopilotDraft = null;
const EXPERT_CONTENT_API = "http://localhost:3003/expert_content/portal";
const EXPERT_DIRECTORY_API = "http://localhost:3002/experts_directory";
const EXPERT_CATEGORY_LABELS = {
  dat_dai: "Đất đai",
  hon_nhan_gia_dinh: "Hôn nhân & gia đình",
  lao_dong: "Lao động",
  doanh_nghiep: "Doanh nghiệp"
};

async function fetchApiJson(url, options = {}) {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/json",
      ...options.headers
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
  return response;
}

async function fetchExpertContent(options = {}) {
  return fetchApiJson(EXPERT_CONTENT_API, options);
}

async function fetchExpertDirectory(options = {}) {
  return fetchApiJson(EXPERT_DIRECTORY_API, options);
}

function portalData() {
  if (!portal.data) portal.data = Store.get();
  if (portal.data.profile) {
    const p = portal.data.profile;
    p.name = p.name || "ThS. Luật sư Trần Minh";
    p.role = p.role || "Chuyên gia pháp lý";
    p.title = p.title || "Thạc sĩ · Luật sư";
    p.email = p.email || "tranminh.law@example.com";
    p.phone = p.phone || "090 123 4567";
    p.organization = p.organization || "Công ty Luật Minh & Cộng sự";
    p.city = p.city || "Hà Nội";
    p.specialty = p.specialty || "Doanh nghiệp, Dân sự, Lao động";
    p.yearsExperience = p.yearsExperience || 12;
    p.bio = p.bio || "Tôi có 12 năm kinh nghiệm tư vấn pháp luật doanh nghiệp và dân sự. Tôi đồng hành cùng người dân và doanh nghiệp trong việc chuẩn bị hồ sơ, rà soát hợp đồng và thực hiện các thủ tục pháp lý.";
    p.licenses = p.licenses || (p.certs || []).slice(0, 1).map((c) => ({
      id: c.id || uid("license-"),
      name: c.name,
      number: "1234/TP-LS-CNH",
      issuer: c.issuer,
      issuedAt: c.year || "2012"
    }));
  }
  return portal.data;
}

function checklistPublicationStatus(checklist) {
  if (checklist.reviewStatus === "approved") return "published";
  if (checklist.reviewStatus === "rejected") return "rejected";
  if (checklist.reviewStatus === "pending") return "pending";
  if (checklist.status === "published") return "published";
  if (checklist.status === "draft") return "pending";
  return "draft";
}

function articleContentEntries() {
  const data = portalData();
  return [
    ...(data.articles || []).map((article) => ({ ...article, contentType: "article" })),
    ...(data.checklists || []).map((checklist) => ({
      id: checklist.id,
      title: checklist.name,
      desc: checklist.desc || "",
      category: checklist.category || "Khác",
      status: checklistPublicationStatus(checklist),
      date: checklist.updatedAt || checklist.createdAt,
      author: checklist.author || "Chuyên gia pháp lý",
      views: 0,
      checklistId: checklist.id,
      contentType: "checklist"
    }))
  ];
}

async function savePortalData() {
  const data = portalData();
  try {
    await fetchExpertContent({
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, id: "portal" })
    });
    Store.write(data);
    return true;
  } catch (error) {
    portal.data = Store.read();
    console.error("[portal] Failed to save data:", error);
    portalToast(`Không lưu được dữ liệu vào máy chủ. Hãy kiểm tra server: ${error.message}`, "error");
    return false;
  }
}

function portalToast(message, type = "success") {
  const box = document.getElementById("toastWrap");
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  const symbol = type === "error" ? "alert" : type === "info" ? "info" : "check";
  item.innerHTML = `${icon(symbol)}<span>${esc(message)}</span>`;
  box.appendChild(item);
  window.setTimeout(() => {
    item.style.opacity = "0";
    item.style.transform = "translateY(8px)";
    window.setTimeout(() => item.remove(), 250);
  }, 2600);
}

// Shared portal UI: statistic cards, pagination, sidebar profile, and modals.
function statCard(label, value, tone, iconName) {
  return `<div class="stat-card"><span class="stat-icon ${tone || ""}">${icon(iconName)}</span><span class="stat-copy"><span>${label}</span><b>${value}</b></span></div>`;
}

function portalPager(containerId, total, current, pageSize, onPage) {
  const container = portal.root.querySelector(`#${containerId}`);
  if (!container) return;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = total ? (current - 1) * pageSize + 1 : 0;
  const end = Math.min(current * pageSize, total);
  const shown = [...new Set([1, current - 1, current, current + 1, pages])].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  let previous = 0;
  const buttons = shown.map((pageNumber) => {
    const dots = pageNumber - previous > 1 ? `<span class="pg-btn pg-ellip">…</span>` : "";
    previous = pageNumber;
    return `${dots}<button class="pg-btn ${pageNumber === current ? "active" : ""}" data-page-number="${pageNumber}" type="button">${pageNumber}</button>`;
  }).join("");
  container.innerHTML = `<div class="pager-info">Hiển thị ${start}–${end} trên ${total} mục</div><div class="pager-btns"><button class="pg-btn" data-page-number="${current - 1}" ${current <= 1 ? "disabled" : ""} aria-label="Trang trước" type="button">${icon("chevL")}</button>${buttons}<button class="pg-btn" data-page-number="${current + 1}" ${current >= pages ? "disabled" : ""} aria-label="Trang sau" type="button">${icon("chevR")}</button></div>`;
  container.onclick = (event) => {
    const button = event.target.closest("[data-page-number]");
    if (button && !button.disabled) onPage(Number(button.dataset.pageNumber));
  };
}

function setSideProfile() {
  const expertRecord = portal.page === "profile" ? portal.expertRecord : null;
  const p = expertRecord
    ? { name: expertRecord.full_name, role: expertRecord.title, initials: expertRecord.avatar_initials }
    : (portalData().profile || SEED_PROFILE);
  document.querySelectorAll("[data-side-name]").forEach((node) => { node.textContent = p.name || "Chuyên gia"; });
  document.querySelectorAll("[data-side-role]").forEach((node) => { node.textContent = p.role || "Chuyên gia pháp lý"; });
  document.querySelectorAll("[data-side-initials]").forEach((node) => { node.textContent = p.initials || p.name.split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase(); });
  document.querySelectorAll("[data-topbar-name]").forEach((node) => {
    node.textContent = p.name.replace(/^(?:ThS\.\s*)?(?:Luật sư\s*)/i, "");
  });
}

function initPortalShell() {
  const menu = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("scrim");
  menu?.addEventListener("click", () => { sidebar.classList.add("open"); scrim.classList.add("show"); });
  scrim?.addEventListener("click", () => { sidebar.classList.remove("open"); scrim.classList.remove("show"); });
  document.getElementById("logoutBtn")?.addEventListener("click", () => portalToast("Bạn đã đăng xuất khỏi Cổng Chuyên gia.", "info"));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      portal.modal = null;
      document.getElementById("portalOverlay")?.remove();
      sidebar?.classList.remove("open");
      scrim?.classList.remove("show");
    }
  });
  setSideProfile();
}

function mountOverlay(markup) {
  document.getElementById("portalOverlay")?.remove();
  if (!markup) return;
  portal.root.insertAdjacentHTML("beforeend", `<div id="portalOverlay">${markup}</div>`);
  const backdrop = document.querySelector("#portalOverlay .modal-backdrop");
  backdrop?.addEventListener("mousedown", (event) => {
    if (event.target === backdrop) closePortalModal();
  });
}

function closePortalModal() {
  portal.modal = null;
  document.getElementById("portalOverlay")?.remove();
}

// ARTICLE: statistics, article list, filtering, details, export, and edit form.
function renderArticles() {
  const description = document.getElementById("pageDescription");
  if (description) {
    description.innerHTML = 'Tra cứu bài viết và checklist pháp lý, theo dõi trạng thái và xem nội dung đã được biên soạn.<span class="read-only-pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></svg>Quyền chỉ xem</span>';
  }
  document.getElementById("pageActions").replaceChildren();
  portal.root.innerHTML = `
    <section class="panel article-list-panel">
      <div class="toolbar article-toolbar"><div class="filter-group">
        <label class="search-field">${icon("search")}<input class="field" id="articleSearch" type="search" placeholder="Tìm theo tên nội dung hoặc mã..." value="${esc(portal.article.query)}" aria-label="Tìm bài viết và checklist"></label>
        <select class="field filter-select" id="articleCategory" aria-label="Lọc theo lĩnh vực"><option value="all">Tất cả lĩnh vực</option>${CATEGORIES.map((category) => `<option value="${esc(category)}">${esc(category)}</option>`).join("")}</select>
        <select class="field filter-select" id="articleStatus" aria-label="Lọc theo trạng thái"><option value="all">Tất cả trạng thái</option><option value="published">Đã xuất bản</option><option value="pending">Chờ duyệt</option><option value="draft">Bản nháp</option><option value="rejected">Từ chối</option></select>
      </div><span class="article-total" id="articleTotal"></span></div>
      <div class="table-wrap"><table class="article-table"><thead><tr><th>NỘI DUNG PHÁP LÝ</th><th>LĨNH VỰC</th><th>TRẠNG THÁI</th><th>CẬP NHẬT</th><th>THAO TÁC</th></tr></thead><tbody id="articleRows"></tbody></table></div>
      <div class="pager" id="articlePager"></div>
    </section>
    <section class="panel article-detail-panel" id="articleDetail"></section>
    <div class="article-permission-note">${icon("info")}<span>Bạn có quyền xem bài viết và checklist. Việc tạo, chỉnh sửa và xóa nội dung do biên tập viên phụ trách.</span></div>
    <div id="portalOverlay"></div>`;
  document.getElementById("articleStatus").value = portal.article.status;
  document.getElementById("articleCategory").value = portal.article.category;
  updateArticleRows();
  const search = document.getElementById("articleSearch");
  search.addEventListener("input", debounce(() => {
    portal.article.query = search.value.trim();
    portal.article.page = 1;
    updateArticleRows();
  }, 180));
  document.getElementById("articleStatus").addEventListener("change", (event) => { portal.article.status = event.target.value; portal.article.page = 1; updateArticleRows(); });
  document.getElementById("articleCategory").addEventListener("change", (event) => { portal.article.category = event.target.value; portal.article.page = 1; updateArticleRows(); });
}

function updateArticleRows() {
  const { query, status, category } = portal.article;
  const filtered = articleContentEntries().filter((article) => {
    const text = `${article.id} ${article.title} ${article.desc || ""} ${article.author || ""}`.toLocaleLowerCase("vi");
    return (!query || text.includes(query.toLocaleLowerCase("vi"))) && (status === "all" || article.status === status) && (category === "all" || article.category === category);
  });
  document.getElementById("articleTotal").textContent = `${filtered.length} nội dung trong thư viện`;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  portal.article.page = Math.min(portal.article.page, pages);
  const rows = filtered.slice((portal.article.page - 1) * PAGE_SIZE, portal.article.page * PAGE_SIZE);
  const tbody = document.getElementById("articleRows");
  if (!tbody) return;
  if (!rows.some((article) => article.id === portal.article.selectedId)) {
    portal.article.selectedId = rows[0]?.id || "";
  }
  tbody.innerHTML = rows.length ? rows.map((article) => `
    <tr class="${article.id === portal.article.selectedId ? "selected" : ""}">
      <td><div class="article-row-title"><strong>${esc(article.title)}</strong><small>${article.contentType === "checklist" ? "Checklist" : "Bài viết"} · ${esc(article.id)} · ${esc(article.author || "Chuyên gia pháp lý")}</small></div></td>
      <td>${esc(article.category)}</td>
      <td><span class="badge ${STATUS_BADGE[article.status] || "badge-neutral"}">${AR_STATUS[article.status] || "Bản nháp"}</span></td>
      <td>${fmtDate(article.date)}</td>
      <td><button class="article-view-button" type="button" data-action="article-select" data-id="${esc(article.id)}">${icon("eye")} Xem</button></td>
    </tr>    `).join("") : `<tr><td colspan="5"><div class="empty">${icon("file")}<b>Không tìm thấy nội dung</b><span>Thử thay đổi từ khóa hoặc bộ lọc.</span></div></td></tr>`;
  if (portal.article.selectedId) {
    renderArticleDetail(portal.article.selectedId);
  } else {
    document.getElementById("articleDetail").innerHTML = "";
  }
  portalPager("articlePager", filtered.length, portal.article.page, PAGE_SIZE, (page) => { portal.article.page = page; updateArticleRows(); });
}

function renderArticleDetail(id) {
  const article = articleContentEntries().find((item) => item.id === id);
  const panel = document.getElementById("articleDetail");
  if (!article || !panel) return;
  const checklist = (portalData().checklists || []).find((item) => item.id === article.checklistId);
  if (article.contentType === "checklist") {
    const questions = (checklist?.questions || []).map((question, index) => `
      <div class="question-readonly"><span class="question-index">${index + 1}</span><div><p>${esc(question.text)}</p><small>${esc(QTYPES[question.type] || "Trả lời")} · ${question.required ? "Bắt buộc" : "Tùy chọn"}</small></div></div>`).join("");
    panel.innerHTML = `
      <div class="panel-head article-detail-head">
        <div><h2>Chi tiết checklist</h2><p>${esc(article.id)} · Chế độ chỉ đọc</p></div>
        <span class="badge ${STATUS_BADGE[article.status] || "badge-neutral"}">${AR_STATUS[article.status] || "Bản nháp"}</span>
      </div>
      <div class="article-detail-layout">
        <article class="article-preview">
          <h3>${esc(article.title)}</h3>
          <p class="article-preview-intro">${esc(article.desc || "")}</p>
          <h4>Tiêu chí kiểm tra</h4>
          ${questions || '<p>Checklist chưa có tiêu chí.</p>'}
        </article>
        <aside class="article-publication-info">
          <h3>THÔNG TIN CHECKLIST</h3>
          <p>Tác giả: ${esc(article.author || "Chuyên gia pháp lý")}</p>
          <p>Lĩnh vực: ${esc(article.category)}</p>
          <p>Cập nhật: ${fmtDate(article.date)}</p>
          <p>Số tiêu chí: ${(checklist?.questions || []).length}</p>
        </aside>
      </div>`;
    return;
  }
  const firstHeading = (article.content || []).find((block) => block.t === "h");
  const firstParagraph = (article.content || []).find((block) => block.t === "p");
  const status = AR_STATUS[article.status] || "Bản nháp";
  panel.innerHTML = `
    <div class="panel-head article-detail-head">
      <div><h2>Chi tiết bài viết</h2><p>${esc(article.id)} · Chế độ chỉ đọc</p></div>
      <span class="badge ${STATUS_BADGE[article.status] || "badge-neutral"}">${status}</span>
    </div>
    <div class="article-detail-layout">
      <article class="article-preview">
        <h3>${esc(article.title)}</h3>
        <p class="article-preview-intro">${esc(article.desc || "")}</p>
        ${firstHeading ? `<h4>${esc(firstHeading.x)}</h4>` : ""}
        ${firstParagraph ? `<p>${esc(firstParagraph.x)}</p>` : ""}
        <button class="article-read-button" type="button" data-action="article-view" data-id="${esc(article.id)}">Đọc toàn bộ bài viết ${icon("chevR")}</button>
      </article>
      <aside class="article-publication-info">
        <h3>THÔNG TIN XUẤT BẢN</h3>
        <p>Tác giả: ${esc(article.author || "Chuyên gia pháp lý")}</p>
        <p>Lĩnh vực: ${esc(article.category)}</p>
        <p>Cập nhật: ${fmtDate(article.date)}</p>
        <p>Lượt xem: ${fmtViews(article.views || 0)}</p>
        ${checklist ? `<div class="article-checklist-link">${icon("list")}Checklist: ${esc(checklist.name)}</div>` : ""}
      </aside>
    </div>`;
}

function showArticle(id) {
  const article = portalData().articles.find((item) => item.id === id);
  if (!article) return;
  const checklist = (portalData().checklists || []).find((item) => item.id === article.checklistId);
  const body = (article.content || []).map((block) => block.t === "h" ? `<h3>${esc(block.x)}</h3>` : `<p>${esc(block.x)}</p>`).join("");
  mountOverlay(`<div class="modal-backdrop open"><section class="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="articleModalTitle"><header class="modal-head"><h2 id="articleModalTitle">${esc(article.title)}</h2><button class="icon-button" type="button" data-action="modal-close" aria-label="Đóng">${icon("x")}</button></header><div class="modal-body"><div class="article-meta"><span>${icon("user")}${esc(article.author || "Chuyên gia")}</span><span>${icon("calendar")}${fmtDate(article.date)}</span><span>${icon("eye")}${fmtViews(article.views || 0)} lượt xem</span><span>${icon("folder")}${esc(article.category)}</span><span class="badge ${STATUS_BADGE[article.status] || "badge-neutral"}">${AR_STATUS[article.status] || "Bản nháp"}</span></div><div class="article-body">${body}</div><div class="article-tags">${(article.tags || []).map((tag) => `<span class="chip">#${esc(tag)}</span>`).join("")}</div><section class="panel" style="margin-top:16px"><div class="panel-head"><h2>${checklist ? `Checklist đính kèm · ${esc(checklist.name)}` : "Checklist đính kèm"}</h2></div><div class="panel-body">${checklist ? checklist.questions.map((question, index) => `<div class="question-readonly"><span class="question-index">${index + 1}</span><div><p>${esc(question.text)}</p><small>${esc(QTYPES[question.type] || "Trả lời")} · ${question.required ? "Bắt buộc" : "Tùy chọn"}</small></div></div>`).join("") : `<div class="empty">${icon("info")}<span>Bài viết chưa đính kèm checklist đánh giá.</span></div>`}</div></section></div><footer class="modal-foot"><button class="btn" type="button" data-action="modal-close">Đóng</button></footer></section></div>`);
}

function exportArticles() {
  const { query, status, category } = portal.article;
  const rows = articleContentEntries().filter((article) => {
    const text = `${article.id} ${article.title} ${article.desc || ""} ${article.author || ""}`.toLocaleLowerCase("vi");
    return (!query || text.includes(query.toLocaleLowerCase("vi"))) && (status === "all" || article.status === status) && (category === "all" || article.category === category);
  });
  const csvRows = [["Loại nội dung", "Tiêu đề", "Chuyên mục", "Trạng thái", "Lượt xem", "Ngày cập nhật"], ...rows.map((article) => [article.contentType === "checklist" ? "Checklist" : "Bài viết", article.title, article.category, AR_STATUS[article.status] || "Bản nháp", article.views || 0, fmtDate(article.date)])];
  const csv = "\uFEFF" + csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "danh-sach-noi-dung.csv";
  link.click();
  URL.revokeObjectURL(url);
  portalToast("Đã xuất danh sách bài viết.");
}

function renderArticleForm() {
  const modal = portal.modal || { type: "article-form", id: "", title: "", desc: "", category: CATEGORIES[0], status: "draft", checklistId: "", tags: [], body: "" };
  const data = portalData();
  const existing = modal.id ? data.articles.find((item) => item.id === modal.id) : null;
  const article = { ...(existing || { title: "", desc: "", category: CATEGORIES[0], status: "draft", checklistId: "", tags: [], body: "" }), ...modal };
  const checklistOptions = [{ value: "", label: "Không gắn checklist" }].concat((data.checklists || []).map((item) => ({ value: item.id, label: item.name })));
  const tagText = (article.tags || []).join(", ");
  const bodyText = Array.isArray(article.content) ? article.content.map((block) => block.x).join("\n\n") : (article.body || "");
  articleCopilotDraft = null;
  mountOverlay(`<div class="modal-backdrop open"><form class="modal modal-wide" id="articleForm" role="dialog" aria-modal="true" aria-labelledby="articleFormTitle"><header class="modal-head"><h2 id="articleFormTitle">${existing ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}</h2><button class="icon-button" type="button" data-action="modal-close" aria-label="Đóng">${icon("x")}</button></header><div class="modal-body"><div class="modal-grid"><div class="form-field"><label for="articleTitle">Tiêu đề bài viết <span aria-hidden="true">*</span></label><input class="input" id="articleTitle" name="title" value="${esc(article.title)}" maxlength="180" required></div><div class="form-field"><label for="articleCategory">Chuyên mục</label><select class="input" id="articleCategory" name="category">${CATEGORIES.map((category) => `<option value="${esc(category)}" ${article.category === category ? "selected" : ""}>${esc(category)}</option>`).join("")}</select></div><div class="form-field"><label for="articleStatus">Trạng thái</label><select class="input" id="articleStatus" name="status"><option value="draft" ${article.status === "draft" ? "selected" : ""}>Bản nháp</option><option value="pending" ${article.status === "pending" ? "selected" : ""}>Chờ duyệt</option><option value="published" ${article.status === "published" ? "selected" : ""}>Đã xuất bản</option></select></div><div class="form-field"><label for="articleChecklist">Checklist đính kèm</label><select class="input" id="articleChecklist" name="checklistId"><option value="">Không gắn checklist</option>${checklistOptions.filter((item) => item.value !== "").map((option) => `<option value="${esc(option.value)}" ${article.checklistId === option.value ? "selected" : ""}>${esc(option.label)}</option>`).join("")}</select></div><div class="form-field full"><label for="articleDesc">Mô tả ngắn</label><textarea class="input" id="articleDesc" name="desc" rows="2" maxlength="300">${esc(article.desc || "")}</textarea></div><section class="form-field full article-copilot"><h3>Trợ lý biên tập theo dữ liệu LegalPath</h3><p>Gợi ý dàn ý quy tắc tại chỗ từ chủ đề và checklist; không gửi nội dung ra ngoài và không tự thêm điều luật.</p><label for="articleCopilotPrompt">Chủ đề cần xây dựng dàn ý</label><input class="input" id="articleCopilotPrompt" maxlength="180" value="${esc(article.title || "")}" placeholder="Ví dụ: Các bước rà soát hợp đồng lao động"><div class="article-copilot__actions"><button class="btn" type="button" data-action="article-copilot-generate">Tạo gợi ý</button><span id="articleCopilotStatus" role="status" aria-live="polite"></span></div><div id="articleCopilotResult" hidden><p id="articleCopilotExplanation"></p><label for="articleCopilotDraft">Xem lại và chỉnh sửa dàn ý</label><textarea class="input" id="articleCopilotDraft" rows="9"></textarea><div class="article-copilot__actions"><button class="btn btn-primary" type="button" data-action="article-copilot-accept">Chấp nhận dàn ý</button><button class="btn" type="button" data-action="article-copilot-retry">Tạo lại</button><button class="btn btn-danger" type="button" data-action="article-copilot-reject">Từ chối</button></div></div></section><div class="form-field full"><label for="articleTags">Tags</label><input class="input" id="articleTags" name="tags" value="${esc(tagText)}" placeholder="Nhập tag, cách nhau bởi dấu phẩy"></div><div class="form-field full"><label for="articleBody">Nội dung bài viết <span aria-hidden="true">*</span></label><textarea class="input" id="articleBody" name="body" rows="12" required>${esc(bodyText)}</textarea></div></div></div><footer class="modal-foot"><button class="btn" type="button" data-action="modal-close">Hủy</button><button class="btn btn-primary" type="submit">${icon("check")} Lưu bài viết</button></footer></form></div>`);
}

// CHECKLIST: checklist list, filtering, question editor, and detail view.
function renderChecklists() {
  const checklists = portalData().checklists || [];
  portal.root.innerHTML = `
    <div class="stat-grid">${statCard("Tổng checklist", checklists.length, "", "list")}${statCard("Chờ duyệt", checklists.filter((item) => checklistPublicationStatus(item) === "pending").length, "amber", "clock")}${statCard("Đã xuất bản", checklists.filter((item) => checklistPublicationStatus(item) === "published").length, "green", "check")}${statCard("Tổng tiêu chí", checklists.reduce((sum, item) => sum + (item.questions || []).length, 0), "", "list")}</div>
    <section class="panel"><div class="toolbar"><div class="filter-group"><label class="search-field">${icon("search")}<input class="field" id="checklistSearch" type="search" placeholder="Tìm theo tên checklist" value="${esc(portal.checklist.query)}" aria-label="Tìm checklist"></label><select class="field filter-select" id="checklistStatus" aria-label="Lọc theo trạng thái"><option value="all">Tất cả trạng thái</option><option value="pending">Chờ duyệt</option><option value="published">Đã xuất bản</option><option value="rejected">Từ chối</option><option value="draft">Bản nháp</option></select></div><button class="btn btn-primary" type="button" data-action="checklist-create">${icon("plus")} Tạo checklist</button></div>
      <div class="table-wrap"><table><thead><tr><th>CHECKLIST</th><th>SỐ TIÊU CHÍ</th><th>TRẠNG THÁI</th><th>CHUYÊN MỤC</th><th>CẬP NHẬT</th><th></th></tr></thead><tbody id="checklistRows"></tbody></table></div><div class="pager" id="checklistPager"></div></section><div id="portalOverlay"></div>`;
  document.getElementById("checklistStatus").value = portal.checklist.status;
  updateChecklistRows();
  const search = document.getElementById("checklistSearch");
  search.addEventListener("input", debounce(() => { portal.checklist.query = search.value.trim(); portal.checklist.page = 1; updateChecklistRows(); }, 180));
  document.getElementById("checklistStatus").addEventListener("change", (event) => { portal.checklist.status = event.target.value; portal.checklist.page = 1; updateChecklistRows(); });
}

function updateChecklistRows() {
  const { query, status } = portal.checklist;
  const filtered = (portalData().checklists || []).filter((item) => {
    const text = `${item.name} ${item.desc || ""}`.toLocaleLowerCase("vi");
    return (!query || text.includes(query.toLocaleLowerCase("vi"))) && (status === "all" || checklistPublicationStatus(item) === status);
  });
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  portal.checklist.page = Math.min(portal.checklist.page, pages);
  const rows = filtered.slice((portal.checklist.page - 1) * PAGE_SIZE, portal.checklist.page * PAGE_SIZE);
  const tbody = document.getElementById("checklistRows");
  if (!tbody) return;
  tbody.innerHTML = rows.length ? rows.map((item) => {
    const itemStatus = checklistPublicationStatus(item);
    return `<tr><td><div class="t-title"><span class="t-file">${icon("list")}</span><div><div class="t-name">${esc(item.name)}</div><div class="t-desc">${esc(item.desc || "")}</div></div></div></td><td><span class="cl-count">${icon("list")}${(item.questions || []).length} câu hỏi</span></td><td><span class="badge ${STATUS_BADGE[itemStatus] || "badge-neutral"}">${CL_STATUS[itemStatus] || "Bản nháp"}</span></td><td><span class="cat-name">${icon("folder")}${esc(item.category)}</span></td><td>${fmtDate(item.updatedAt)}</td><td><div class="tb-actions"><button class="btn btn-sm" type="button" data-action="checklist-view" data-id="${esc(item.id)}">${icon("eye")} Xem</button><button class="btn btn-sm" type="button" data-action="checklist-edit" data-id="${esc(item.id)}">${icon("edit")} Sửa</button></div></td></tr>`;
  }).join("") : `<tr><td colspan="6"><div class="empty">${icon("list")}<b>Chưa có checklist phù hợp</b><span>Thay đổi bộ lọc hoặc tạo checklist mới.</span></div></td></tr>`;
  portalPager("checklistPager", filtered.length, portal.checklist.page, PAGE_SIZE, (page) => { portal.checklist.page = page; updateChecklistRows(); });
}

function checklistQuestionMarkup(question, index) {
  return `<div class="question-row" data-question-index="${index}"><span class="question-index">${index + 1}</span><input class="input" data-question-text value="${esc(question.text)}" placeholder="Nhập nội dung tiêu chí" aria-label="Nội dung tiêu chí ${index + 1}"><select class="input" data-question-type aria-label="Loại câu trả lời">${Object.entries(QTYPES).map(([value, label]) => `<option value="${value}" ${question.type === value ? "selected" : ""}>${label}</option>`).join("")}</select><label class="question-required"><input class="check-input" type="checkbox" data-question-required ${question.required ? "checked" : ""}> Bắt buộc</label><button class="question-remove" type="button" data-action="question-remove" data-index="${index}" aria-label="Xóa tiêu chí">${icon("trash")}</button></div>`;
}

function renderChecklistForm() {
  const modal = portal.modal;
  const editing = modal.id ? portalData().checklists.find((item) => item.id === modal.id) : null;
  const item = { ...(editing || { name: "", desc: "", category: CATEGORIES[0] }), ...modal };
  mountOverlay(`<div class="modal-backdrop open"><form class="modal modal-wide" id="checklistForm" role="dialog" aria-modal="true" aria-labelledby="checklistFormTitle"><header class="modal-head"><h2 id="checklistFormTitle">${editing ? "Chỉnh sửa checklist" : "Tạo checklist mới"}</h2><button class="icon-button" type="button" data-action="modal-close" aria-label="Đóng">${icon("x")}</button></header><div class="modal-body"><div class="modal-grid"><div class="form-field"><label for="clName">Tên checklist <span aria-hidden="true">*</span></label><input class="input" id="clName" name="name" value="${esc(item.name)}" maxlength="120" required></div><div class="form-field"><label for="clCategory">Chuyên mục</label><select class="input" id="clCategory" name="category">${CATEGORIES.map((category) => `<option ${item.category === category ? "selected" : ""}>${esc(category)}</option>`).join("")}</select></div><div class="form-field full"><label for="clDescription">Mô tả</label><textarea class="input" id="clDescription" name="desc" rows="2" maxlength="400">${esc(item.desc || "")}</textarea></div></div><p class="form-hint">Sau khi lưu, checklist sẽ được gửi vào hàng đợi để biên tập viên duyệt.</p><section class="question-editor"><div class="panel-head" style="padding:8px 0"><h2>Tiêu chí <span id="questionCount">${modal.questions.length}</span></h2><button class="btn btn-sm" type="button" data-action="question-add">${icon("plus")} Thêm tiêu chí</button></div><div id="questionRows">${modal.questions.map((question, index) => checklistQuestionMarkup(question, index)).join("")}</div></section></div><footer class="modal-foot"><button class="btn" type="button" data-action="modal-close">Hủy</button><button class="btn btn-primary" type="submit">${icon("check")} Lưu checklist</button></footer></form></div>`);
}

function showChecklist(id) {
  const item = portalData().checklists.find((checklist) => checklist.id === id);
  if (!item) return;
  const itemStatus = checklistPublicationStatus(item);
  mountOverlay(`<div class="modal-backdrop open"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="checklistViewTitle"><header class="modal-head"><h2 id="checklistViewTitle">${esc(item.name)}</h2><button class="icon-button" type="button" data-action="modal-close" aria-label="Đóng">${icon("x")}</button></header><div class="modal-body"><div class="article-meta"><span>${icon("folder")}${esc(item.category)}</span><span>${icon("calendar")}Cập nhật ${fmtDate(item.updatedAt)}</span><span>${icon("list")}${(item.questions || []).length} tiêu chí</span><span class="badge ${STATUS_BADGE[itemStatus] || "badge-neutral"}">${CL_STATUS[itemStatus] || "Bản nháp"}</span></div><p>${esc(item.desc || "")}</p><section class="panel"><div class="panel-head"><h2>Danh sách tiêu chí</h2></div><div class="panel-body">${(item.questions || []).map((question, index) => `<div class="question-readonly"><span class="question-index">${index + 1}</span><div><p>${esc(question.text)}</p><small>${esc(QTYPES[question.type] || "Trả lời")} · ${question.required ? "Bắt buộc" : "Tùy chọn"}</small></div></div>`).join("")}</div></section></div><footer class="modal-foot"><button class="btn" type="button" data-action="modal-close">Đóng</button><button class="btn btn-primary" type="button" data-action="checklist-edit" data-id="${esc(item.id)}">${icon("edit")} Chỉnh sửa</button></footer></section></div>`);
}

// PROFILE: edit only the fields provided by the expert directory API.
function renderProfile() {
  const expert = portal.expertRecord;
  if (!expert) {
    portal.root.innerHTML = `<section class="panel"><div class="panel-body empty"><span class="stat-icon">${icon("user")}</span><b>Không tải được hồ sơ chuyên gia</b><span>Kiểm tra API danh sách chuyên gia rồi tải lại trang.</span></div></section><div id="portalOverlay"></div>`;
    return;
  }
  const categoryOptions = Object.entries(EXPERT_CATEGORY_LABELS).map(([value, label]) =>
    `<option value="${value}" ${expert.category_id === value ? "selected" : ""}>${label}</option>`
  ).join("");
  portal.root.innerHTML = `
    <div class="profile-layout">
      <aside class="profile-rail">
        <section class="panel identity-card">
          <div class="identity-top">
            <span class="avatar avatar-large">${esc(expert.avatar_initials || "EX")}</span>
            <h2>${esc(expert.full_name)}</h2>
            <p>${esc(expert.title)}</p>
            <span class="badge badge-success">${esc(EXPERT_CATEGORY_LABELS[expert.category_id] || expert.category_id)}</span>
            <span class="member-since">Mã chuyên gia: ${esc(expert.expert_id)}</span>
          </div>
        </section>
      </aside>
      <div class="profile-main">
        <section class="panel">
          <div class="panel-head"><div><h2>Thông tin hồ sơ công khai</h2><p>Thông tin được lưu trực tiếp trong danh bạ chuyên gia.</p></div></div>
          <div class="panel-body">
            <form id="profileForm">
              <div class="profile-form">
                <div class="form-field"><label for="profileName">Họ và tên *</label><input class="input" id="profileName" name="full_name" required maxlength="120" value="${esc(expert.full_name)}"></div>
                <div class="form-field"><label for="profileTitle">Chức danh *</label><input class="input" id="profileTitle" name="title" required maxlength="120" value="${esc(expert.title)}"></div>
                <div class="form-field"><label for="profileCategory">Lĩnh vực chuyên môn *</label><select class="input" id="profileCategory" name="category_id" required>${categoryOptions}</select></div>
                <div class="form-field"><label for="profileInitials">Tên viết tắt</label><input class="input" id="profileInitials" name="avatar_initials" maxlength="4" value="${esc(expert.avatar_initials || "")}"></div>
                <div class="form-field full"><label for="profileDescription">Giới thiệu chuyên gia *</label><textarea class="input" id="profileDescription" name="description" rows="4" maxlength="900" required>${esc(expert.description || "")}</textarea></div>
                <div class="form-field full"><label for="profileActionLabel">Nhãn nút liên hệ *</label><input class="input" id="profileActionLabel" name="action_label" required maxlength="80" value="${esc(expert.action_label || "")}"></div>
              </div>
              <div class="form-footer">
                <span class="last-updated">Mã chuyên gia: ${esc(expert.expert_id)}</span>
                <div class="form-actions"><button class="btn" type="reset">${icon("x")} Hủy thay đổi</button><button class="btn btn-primary" type="submit">${icon("check")} Lưu thay đổi</button></div>
              </div>
            </form>
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><div><h2>Giới thiệu trên danh bạ</h2><p>Nội dung này được hiển thị công khai cho người dùng.</p></div></div>
          <div class="panel-body"><p>${esc(expert.description || "Chưa có phần giới thiệu.")}</p><span class="btn btn-sm">${esc(expert.action_label || "Liên hệ")}</span></div>
        </section>
      </div>
    </div>
    <div id="portalOverlay"></div>`;
}

function renderPublicPreview() {
  const expert = portal.expertRecord;
  if (!expert) return;
  mountOverlay(`<div class="modal-backdrop open"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="publicPreviewTitle"><header class="modal-head"><h2 id="publicPreviewTitle">Hồ sơ công khai</h2><button class="icon-button" type="button" data-action="modal-close" aria-label="Đóng">${icon("x")}</button></header><div class="modal-body"><div class="identity-top"><span class="avatar">${esc(expert.avatar_initials || "EX")}</span><h2>${esc(expert.full_name)}</h2><p>${esc(expert.title)}</p><span class="badge badge-success">${esc(EXPERT_CATEGORY_LABELS[expert.category_id] || expert.category_id)}</span></div><p>${esc(expert.description || "")}</p><div class="article-meta"><span>${icon("user")}Mã chuyên gia: ${esc(expert.expert_id)}</span><span>${icon("briefcase")}${esc(expert.action_label || "Liên hệ")}</span></div></div><footer class="modal-foot"><button class="btn" type="button" data-action="modal-close">Đóng</button></footer></section></div>`);
}

// ARTICLE: create a local editorial outline for the article form.
async function generateArticleCopilotDraft() {
  const prompt = document.getElementById("articleCopilotPrompt");
  const status = document.getElementById("articleCopilotStatus");
  const result = document.getElementById("articleCopilotResult");
  const explanation = document.getElementById("articleCopilotExplanation");
  const draftField = document.getElementById("articleCopilotDraft");
  const bodyField = document.getElementById("articleBody");
  const title = prompt?.value.trim() || "";
  const words = title.split(/\s+/).filter(Boolean);

  if (words.length < 3) {
    status.textContent = "Hãy nhập chủ đề cụ thể bằng ít nhất 3 từ trước khi tạo dàn ý.";
    prompt?.focus();
    return;
  }

  const category = document.getElementById("articleCategory")?.value || "Khác";
  const selectedChecklist = document.getElementById("articleChecklist")?.value || "";
  const relatedChecklist = portalData().checklists.find((item) => item.id === selectedChecklist);
  status.textContent = "Đang đối chiếu chủ đề với chuyên mục và checklist...";
  result.hidden = true;
  await new Promise((resolve) => window.setTimeout(resolve, 160));

  const checklistGuidance = relatedChecklist?.questions?.length
    ? relatedChecklist.questions.slice(0, 5).map((question) => `- ${question.text}`).join("\n")
    : "- Xác định giấy tờ, chủ thể và mục tiêu cần làm rõ.";
  const draft = [
    `# Mục tiêu và phạm vi`,
    `Làm rõ câu hỏi thực tế cần giải đáp về "${title}" trong chuyên mục ${category}. Xác định chủ thể, thời điểm và dữ kiện còn thiếu trước khi đưa ra nhận định.`,
    `# Thông tin cần thu thập`,
    checklistGuidance,
    `# Các bước tham khảo`,
    `1. Kiểm tra tình huống và tài liệu thực tế, không suy diễn khi chưa đủ dữ kiện.`,
    `2. Đối chiếu quy định và biểu mẫu hiện hành trên nguồn chính thức phù hợp.`,
    `3. Nêu rõ phương án, cơ quan cần liên hệ và giới hạn của nội dung hướng dẫn.`,
    `# Điểm cần chuyên gia xác minh`,
    `Kiểm tra căn cứ pháp lý, hiệu lực văn bản, thời hạn, thẩm quyền và hồ sơ áp dụng cho "${title}" trước khi xuất bản.`,
    `# Lưu ý`,
    `Dàn ý này chỉ là khung biên tập tự động, không trích dẫn hoặc xác nhận điều luật. Chuyên gia cần kiểm chứng, chỉnh sửa và bổ sung nguồn chính thức.`
  ].join("\n\n");

  const confidence = Math.min(86, 50 + Math.min(words.length, 7) * 4 + (relatedChecklist ? 8 : 0));
  articleCopilotDraft = { body: draft, category, relatedChecklist: relatedChecklist?.name || "" };
  draftField.value = draft;
  explanation.textContent = `Dàn ý theo quy tắc cục bộ · mức phù hợp của chủ đề ${confidence}%. Căn cứ: chuyên mục "${category}"${relatedChecklist ? ` và ${relatedChecklist.questions.length} câu hỏi trong checklist "${relatedChecklist.name}"` : ""}. Không gửi dữ liệu ra ngoài; mọi nội dung pháp lý phải được kiểm chứng.`;
  result.hidden = false;
  status.textContent = "Đã tạo bản nháp để bạn rà soát. Chưa có nội dung nào được lưu.";
  draftField.focus();
}

async function dispatchPortalAction(action, id) {
  if (action === "modal-close") { closePortalModal(); return; }
  // Article actions.
  if (action === "article-copilot-generate" || action === "article-copilot-retry") {
    await generateArticleCopilotDraft();
    return;
  }
  if (action === "article-copilot-accept") {
    const draftField = document.getElementById("articleCopilotDraft");
    const bodyField = document.getElementById("articleBody");
    if (!articleCopilotDraft || !draftField?.value.trim() || !bodyField) {
      portalToast("Hãy tạo và kiểm tra dàn ý trước khi chấp nhận.", "error");
      return;
    }
    bodyField.value = draftField.value.trim();
    document.getElementById("articleCopilotResult").hidden = true;
    document.getElementById("articleCopilotStatus").textContent = "Đã đưa dàn ý vào nội dung bài viết. Hãy biên tập và chọn Lưu bài viết để lưu lên máy chủ.";
    bodyField.focus();
    return;
  }
  if (action === "article-copilot-reject") {
    articleCopilotDraft = null;
    document.getElementById("articleCopilotResult").hidden = true;
    document.getElementById("articleCopilotStatus").textContent = "Đã từ chối dàn ý. Nội dung chưa được lưu.";
    return;
  }
  if (action === "article-view") { showArticle(id); return; }
  if (action === "article-select") {
    portal.article.selectedId = id;
    updateArticleRows();
    return;
  }
  if (action === "article-create") {
    portal.modal = { type: "article-form", id: "", title: "", desc: "", category: CATEGORIES[0], status: "draft", checklistId: "", tags: [], body: "" };
    renderArticleForm();
    document.getElementById("articleTitle")?.focus();
    return;
  }
  if (action === "export") { exportArticles(); return; }
  // Checklist actions.
  if (action === "checklist-create" || action === "checklist-edit") {
    const existing = action === "checklist-edit" ? portalData().checklists.find((item) => item.id === id) : null;
    portal.modal = { type: "checklist-form", id: existing?.id || "", name: existing?.name || "", desc: existing?.desc || "", category: existing?.category || CATEGORIES[0], questions: existing ? existing.questions.map((question) => ({ ...question })) : [{ text: "", type: "yesno", required: true }] };
    renderChecklistForm();
    document.getElementById("clName")?.focus();
    return;
  }
  if (action === "checklist-view") { showChecklist(id); return; }
  if (action === "question-add") {
    syncChecklistQuestionDraft();
    portal.modal.questions.push({ text: "", type: "yesno", required: true });
    renderChecklistForm();
    const last = document.querySelectorAll("#questionRows .question-row");
    last[last.length - 1]?.querySelector("[data-question-text]")?.focus();
    return;
  }
  if (action === "question-remove") {
    syncChecklistQuestionDraft();
    portal.modal.questions.splice(Number(id), 1);
    renderChecklistForm();
    return;
  }
  // Profile actions.
  if (action === "public-preview") { portal.modal = { type: "preview" }; renderPublicPreview(); }
}

function syncChecklistQuestionDraft() {
  if (!portal.modal || portal.modal.type !== "checklist-form") return;
  portal.modal.name = document.getElementById("clName")?.value || "";
  portal.modal.desc = document.getElementById("clDescription")?.value || "";
  portal.modal.category = document.getElementById("clCategory")?.value || CATEGORIES[0];
  portal.modal.questions = [...document.querySelectorAll("#questionRows .question-row")].map((row) => ({
    text: row.querySelector("[data-question-text]").value,
    type: row.querySelector("[data-question-type]").value,
    required: row.querySelector("[data-question-required]").checked
  }));
}

function handlePortalClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  dispatchPortalAction(button.dataset.action, button.dataset.id || button.dataset.index || "");
}

async function handlePortalSubmit(event) {
  const form = event.target;
  if (!form.matches("form")) return;
  // Article form submission.
  if (form.id === "articleForm") {
    event.preventDefault();
    const fields = new FormData(form);
    const title = String(fields.get("title") || "").trim();
    const desc = String(fields.get("desc") || "").trim();
    const category = String(fields.get("category") || CATEGORIES[0]);
    const status = String(fields.get("status") || "draft");
    const checklistId = String(fields.get("checklistId") || "");
    const rawTags = String(fields.get("tags") || "").split(",").map((tag) => tag.trim()).filter(Boolean);
    const bodyText = String(fields.get("body") || "").trim();
    const paragraphs = bodyText.split(/\n\s*\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);
    const content = paragraphs.length ? paragraphs.map((paragraph) => ({ t: paragraph.startsWith("#") ? "h" : "p", x: paragraph.replace(/^#+\s*/, "") })) : [{ t: "p", x: bodyText || "" }];
    const existing = portal.modal?.id ? portalData().articles.find((item) => item.id === portal.modal.id) : null;
    const article = {
      id: existing?.id || uid("art-"),
      title,
      desc: desc || (bodyText ? bodyText.slice(0, 140) : ""),
      category,
      status,
      checklistId: checklistId || null,
      views: existing?.views || 0,
      date: today(),
      author: portalData().profile?.name || "Luật sư",
      tags: rawTags.length ? rawTags : (existing?.tags || []),
      content
    };
    const data = portalData();
    if (existing) {
      Object.assign(existing, article);
    } else {
      data.articles.unshift(article);
    }
    if (!(await savePortalData())) return;
    portal.modal = null;
    renderArticles();
    portalToast(existing ? "Bài viết đã được cập nhật." : "Bài viết mới đã được lưu.");
    return;
  }
  // Checklist form submission.
  if (form.id === "checklistForm") {
    event.preventDefault();
    const fields = new FormData(form);
    const questions = [...form.querySelectorAll(".question-row")].map((row) => ({
      id: uid("q-"),
      text: row.querySelector("[data-question-text]").value.trim(),
      type: row.querySelector("[data-question-type]").value,
      required: row.querySelector("[data-question-required]").checked
    })).filter((question) => question.text);
    if (!questions.length) { portalToast("Checklist cần có ít nhất một tiêu chí.", "error"); return; }
    const data = portalData();
    const values = { name: String(fields.get("name")).trim(), desc: String(fields.get("desc")).trim(), category: String(fields.get("category")), status: "draft", questions, updatedAt: today(), reviewStatus: "pending", reviewedAt: null };
    const existing = portal.modal.id ? data.checklists.find((item) => item.id === portal.modal.id) : null;
    if (existing) Object.assign(existing, values);
    else data.checklists.unshift({ id: uid("cl-"), ...values, createdAt: today() });
    if (!(await savePortalData())) return;
    portal.modal = null;
    portal.checklist.page = 1;
    renderChecklists();
    portalToast(existing ? "Checklist đã được cập nhật." : "Checklist mới đã được tạo.");
    return;
  }
  // Expert directory profile update.
  if (form.id === "profileForm") {
    event.preventDefault();
    const fields = new FormData(form);
    const expert = portal.expertRecord;
    if (!expert?.id) {
      portalToast("Không tìm thấy mã bản ghi chuyên gia để lưu.", "error");
      return;
    }
    const changes = {
      full_name: String(fields.get("full_name") || "").trim(),
      title: String(fields.get("title") || "").trim(),
      category_id: String(fields.get("category_id") || "").trim(),
      avatar_initials: String(fields.get("avatar_initials") || "").trim().toUpperCase(),
      description: String(fields.get("description") || "").trim(),
      action_label: String(fields.get("action_label") || "").trim()
    };
    try {
      const response = await fetchApiJson(`${EXPERT_DIRECTORY_API}/${encodeURIComponent(expert.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes)
      });
      portal.expertRecord = await response.json();
    } catch (error) {
      console.error("[portal] Failed to save expert profile:", error);
      portalToast(`Không lưu được hồ sơ chuyên gia: ${error.message}`, "error");
      return;
    }
    setSideProfile();
    renderProfile();
    portalToast("Thông tin hồ sơ đã được lưu.");
    return;
  }
}

async function initExpertPortal() {
  if (!portal.root) return;
  initPortalShell();
  portal.root.addEventListener("click", handlePortalClick);
  document.getElementById("pageActions")?.addEventListener("click", handlePortalClick);
  portal.root.addEventListener("submit", handlePortalSubmit);
  if (portal.page === "profile") {
    document.getElementById("pageActions").innerHTML = `<button class="btn" type="button" data-action="public-preview">${icon("eye")} Xem hồ sơ công khai</button>`;
    try {
      const response = await fetchExpertDirectory();
      const experts = await response.json();
      if (!Array.isArray(experts)) throw new Error("Danh sách chuyên gia trên máy chủ không đúng định dạng.");
      portal.expertRecord = experts.find((expert) => expert.expert_id === "EXP-01") || null;
      if (!portal.expertRecord) throw new Error("Không tìm thấy hồ sơ chuyên gia EXP-01.");
      setSideProfile();
    } catch (error) {
      console.error("[portal] Failed to load expert profile:", error);
      portalToast(`Không tải được hồ sơ từ API chuyên gia: ${error.message}`, "error");
    }
    renderProfile();
    return;
  }
  try {
    const response = await fetchExpertContent();
    const savedData = await response.json();
    if (!savedData || !Array.isArray(savedData.articles) || !Array.isArray(savedData.checklists)) {
      throw new Error("Dữ liệu chuyên gia trên máy chủ không đúng định dạng.");
    }
    Store.write(savedData);
    portal.data = savedData;
  } catch (error) {
    console.error("[portal] Failed to load data:", error);
    portalToast(`Không tải được dữ liệu từ máy chủ. Hãy kiểm tra server: ${error.message}`, "error");
  }
  if (portal.page === "articles") renderArticles();
  else if (portal.page === "checklists") renderChecklists();
}

document.addEventListener("DOMContentLoaded", initExpertPortal);
