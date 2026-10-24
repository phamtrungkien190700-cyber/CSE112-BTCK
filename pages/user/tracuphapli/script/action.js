// Lấy các phần tử HTML cần cập nhật; các selector này phụ thuộc vào id trong tracuu.html.
const oNhapTimKiem = document.querySelector("#search-input");
const bieuMauTimKiem = document.querySelector("#search-form");
const boLocLinhVuc = document.querySelector("#category-filters");
const ketQuaTraCuu = document.querySelector("#search-results");
const trangThaiKetQua = document.querySelector("#results-status");
const hopThoai = document.querySelector("#procedure-dialog");
const tieuDeHopThoai = document.querySelector("#dialog-title");
const noiDungHopThoai = document.querySelector("#dialog-content");
const boLocLePhi = document.querySelector("#fee-filter");
const sapXepThuTuc = document.querySelector("#procedure-sort");
const nutXoaBoLoc = document.querySelector("#reset-filters");
const nutThuLai = taoPhanTu("button", "Thử tải lại");
nutThuLai.type = "button";
nutThuLai.className = "nut-xoa-bo-loc";
nutThuLai.addEventListener("click", taiDanhSachThuTuc);

// Danh sách thủ tục đã làm phẳng từ dữ liệu các lĩnh vực do API trả về.
let danhSachThuTuc = [];
// Lĩnh vực đang chọn; "all" nghĩa là không giới hạn theo lĩnh vực.
let linhVucDangChon = "all";

// Chuẩn hóa văn bản để tìm kiếm không phân biệt dấu tiếng Việt và chữ hoa/thường.
function chuanHoa(vanBan) {
  // Chuyển giá trị bất kỳ thành chuỗi; giá trị null/undefined được xem như chuỗi rỗng.
  return String(vanBan || "")
    // Tách chữ có dấu thành ký tự cơ sở và dấu kết hợp để xóa dấu ở bước sau.
    .normalize("NFD")
    // Xóa các dấu kết hợp Unicode trong khoảng mã này.
    .replace(/[\u0300-\u036f]/g, "")
    // Chữ đ/Đ không bị NFD chuyển thành d nên được thay riêng.
    .replace(/[đĐ]/g, "d")
    // Chuyển về chữ thường để phép so khớp không phân biệt hoa/thường.
    .toLowerCase();
}

// Tạo phần tử HTML mới và tùy chọn thêm nội dung dạng văn bản an toàn.
function taoPhanTu(tenThe, vanBan) {
  // Tạo thẻ theo tên được truyền vào, ví dụ "p", "button" hoặc "li".
  const phanTu = document.createElement(tenThe);
  // textContent đặt văn bản, không diễn giải chuỗi đầu vào thành HTML.
  if (vanBan) phanTu.textContent = vanBan;
  // Trả phần tử để hàm gọi tiếp tục gắn thuộc tính, class hoặc con.
  return phanTu;
}

// Điền thông tin của một thủ tục vào dialog rồi mở hộp thoại.
function hienThiChiTiet(thuTuc) {
  // Đặt tên thủ tục làm tiêu đề hộp thoại.
  tieuDeHopThoai.textContent = thuTuc.name;
  // Xóa dữ liệu cũ trước khi hiển thị thủ tục được chọn mới.
  noiDungHopThoai.replaceChildren();

  // Dùng danh sách mô tả HTML (dl) để trình bày các cặp nhãn/giá trị.
  const thongTinChiTiet = taoPhanTu("dl");
  thongTinChiTiet.className = "hop-thoai-thu-tuc__thong-tin";
  // Các trường cơ bản cần trình bày; tên trường hiển thị đi cùng thuộc tính dữ liệu tương ứng.
  const cacTruong = [
    ["Mã thủ tục", thuTuc.code],
    ["Lĩnh vực", thuTuc.category_name],
    ["Thời gian giải quyết", thuTuc.processing_time],
    ["Lệ phí", thuTuc.fee],
    ["Cơ quan thực hiện", thuTuc.competent_authority]
  ];

  // Với từng cặp nhãn/giá trị, tạo dt và dd rồi thêm chúng vào danh sách mô tả.
  cacTruong.forEach(([nhan, giaTri]) => {
    const mucTu = taoPhanTu("dt", nhan);
    const moTaChiTiet = taoPhanTu("dd", giaTri || "Chưa có thông tin");
    mucTu.className = "thong-tin-thu-tuc";
    moTaChiTiet.className = "thong-tin-thu-tuc";
    thongTinChiTiet.append(mucTu, moTaChiTiet);
  });

  // Tạo tiêu đề và danh sách hồ sơ cần chuẩn bị.
  const tieuDe = taoPhanTu("h3", "Hồ sơ cần chuẩn bị");
  tieuDe.className = "hop-thoai-thu-tuc__tieu-de-phu";
  const danhSachHoSo = taoPhanTu("ul");
  danhSachHoSo.className = "hop-thoai-thu-tuc__ho-so";
  // Nếu API không trả hồ sơ thì hiển thị thông báo thay thế.
  const hoSoCanChuanBi = thuTuc.required_documents || ["Chưa có thông tin"];

  // Mỗi hồ sơ được hiển thị thành một mục li.
  hoSoCanChuanBi.forEach((tenHoSo) => {
    danhSachHoSo.append(taoPhanTu("li", tenHoSo));
  });

  // Gắn toàn bộ nội dung vào dialog và mở ở chế độ modal.
  noiDungHopThoai.append(thongTinChiTiet, tieuDe, danhSachHoSo);
  if (thuTuc.is_sample) {
    const canhBao = taoPhanTu("p", "Dữ liệu minh họa để kiểm thử; cần kiểm tra thông tin hiện hành với nguồn chính thức.");
    canhBao.className = "tra-cuu-phap-ly__minh-hoa";
    noiDungHopThoai.append(canhBao);
  }
  hopThoai.showModal();
}

// Tạo các nút lọc: nút "Tất cả" cùng các lĩnh vực lấy từ API.
function hienThiBoLoc(danhSachLinhVuc) {
  // Xóa nút cũ để tránh lặp khi vẽ lại danh sách.
  boLocLinhVuc.replaceChildren();
  // Tạo lựa chọn đặc biệt "all", sau đó nối các lĩnh vực thực tế.
  const tatCaLinhVuc = [{ category_id: "all", category_name: "Tất cả" }, ...danhSachLinhVuc];

  // Dựng từng nút; nút đầu tiên là lựa chọn đang hoạt động mặc định.
  tatCaLinhVuc.forEach((linhVuc, chiSo) => {
    const nut = taoPhanTu("button", linhVuc.category_name);
    nut.type = "button";
    nut.dataset.category = linhVuc.category_id;
    nut.className = `nut-loc-linh-vuc${chiSo === 0 ? " dang-chon" : ""}`;
    nut.setAttribute("aria-pressed", String(chiSo === 0));
    boLocLinhVuc.append(nut);
  });
}

function loaiLePhi(thuTuc) {
  if (!thuTuc.fee || thuTuc.fee.includes("Cần xác minh") || thuTuc.fee.includes("Dữ liệu minh họa")) return "unknown";
  return chuanHoa(thuTuc.fee).includes("mien phi") ? "free" : "paid";
}

// Kết hợp từ khóa, lĩnh vực và mức lệ phí; việc sắp xếp giữ nguyên các bộ lọc.
function hienThiKetQua() {
  // Bỏ khoảng trắng đầu/cuối rồi chuẩn hóa từ khóa tìm kiếm.
  const tuKhoa = chuanHoa(oNhapTimKiem.value.trim());
  // Chỉ giữ thủ tục thỏa đồng thời điều kiện lĩnh vực và điều kiện từ khóa.
  const thuTucPhuHop = danhSachThuTuc.filter((thuTuc) => {
    // "all" cho qua mọi lĩnh vực; nếu không thì mã lĩnh vực phải trùng lựa chọn.
    const thuocLinhVucDangChon =
      linhVucDangChon === "all" || thuTuc.category_id === linhVucDangChon;
    const dungMucLePhi = boLocLePhi.value === "all" || loaiLePhi(thuTuc) === boLocLePhi.value;
    // Gom các trường có thể tìm kiếm thành một chuỗi đã chuẩn hóa.
    const noiDungTimKiem = chuanHoa([
      thuTuc.name,
      thuTuc.code,
      thuTuc.category_name,
      thuTuc.processing_time,
      thuTuc.fee,
      thuTuc.competent_authority,
      ...(thuTuc.required_documents || [])
    ].join(" "));

    // includes("") trả về true nên khi ô tìm kiếm rỗng sẽ hiện mọi thủ tục trong lĩnh vực.
    return thuocLinhVucDangChon && dungMucLePhi && noiDungTimKiem.includes(tuKhoa);
  });
  if (sapXepThuTuc.value === "name") {
    thuTucPhuHop.sort((left, right) => left.name.localeCompare(right.name, "vi"));
  }

  // Cập nhật số kết quả và dọn giao diện kết quả cũ.
  trangThaiKetQua.textContent = `${thuTucPhuHop.length} kết quả phù hợp với tìm kiếm của bạn`;
  ketQuaTraCuu.replaceChildren();

  // Nếu không có kết quả, hiển thị hướng dẫn và kết thúc hàm.
  if (thuTucPhuHop.length === 0) {
    const thongBao = taoPhanTu("p", "Không tìm thấy thủ tục phù hợp với các điều kiện đã chọn.");
    thongBao.className = "tra-cuu-phap-ly__khong-co-ket-qua";
    const nutDatLai = taoPhanTu("button", "Xóa bộ lọc và tìm lại");
    nutDatLai.type = "button";
    nutDatLai.addEventListener("click", xoaBoLoc);
    ketQuaTraCuu.append(thongBao, nutDatLai);
    return;
  }

  // Tạo một thẻ hiển thị cho từng thủ tục khớp.
  thuTucPhuHop.forEach((thuTuc) => {
    // article là một mục nội dung độc lập cho mỗi thủ tục.
    const theThuTuc = taoPhanTu("article");
    theThuTuc.className = "the-thu-tuc";

    const noiDungChinh = taoPhanTu("div");
    noiDungChinh.className = "the-thu-tuc__noi-dung";
    const tieuDeThe = taoPhanTu("div");
    tieuDeThe.className = "the-thu-tuc__tieu-de";
    // Tạo biểu tượng hình ảnh trang trí; aria-hidden tránh đọc biểu tượng không có ý nghĩa.
    const bieuTuong = taoPhanTu("span");
    bieuTuong.className = "the-thu-tuc__bieu-tuong";
    bieuTuong.setAttribute("aria-hidden", "true");
    const anhBieuTuong = taoPhanTu("img");
    anhBieuTuong.src = "image/image.png";
    // Ảnh trang trí không cần văn bản thay thế.
    anhBieuTuong.alt = "";
    bieuTuong.append(anhBieuTuong);
    const tieuDe = taoPhanTu("h2", thuTuc.name);
    tieuDeThe.append(bieuTuong, tieuDe);

    // Ưu tiên mô tả; nếu thiếu thì dùng tên cơ quan hoặc thông báo chưa cập nhật.
    const tomTat = taoPhanTu(
      "p",
      thuTuc.description || `Cơ quan thực hiện: ${thuTuc.competent_authority || "Chưa cập nhật"}`
    );
    tomTat.className = "the-thu-tuc__tom-tat";
    const thongTinPhu = taoPhanTu("div");
    thongTinPhu.className = "the-thu-tuc__thong-tin";

    // Hiển thị mã và thời gian; thay giá trị rỗng bằng nội dung dự phòng.
    const maThuTuc = taoPhanTu("span", `Mã thủ tục: ${thuTuc.code || "Chưa cập nhật"}`);
    const thoiGian = taoPhanTu(
      "span",
      `Thời gian: ${thuTuc.processing_time || "Chưa cập nhật"}`
    );
    thongTinPhu.append(maThuTuc, thoiGian);
    noiDungChinh.append(tieuDeThe, tomTat, thongTinPhu);

    const cotBen = taoPhanTu("div");
    cotBen.className = "the-thu-tuc__cot-ben";
    // Hiển thị tên lĩnh vực của thủ tục.
    const tenLinhVuc = taoPhanTu("span", thuTuc.category_name);
    tenLinhVuc.className = "the-thu-tuc__linh-vuc";
    if (thuTuc.is_sample) {
      const nhanMinhHoa = taoPhanTu("span", "Dữ liệu minh họa");
      nhanMinhHoa.className = "the-thu-tuc__linh-vuc";
      cotBen.append(nhanMinhHoa);
    }

    const nutChiTiet = taoPhanTu("button", "Xem chi tiết");
    nutChiTiet.type = "button";
    nutChiTiet.className = "the-thu-tuc__chi-tiet";
    // Khi bấm nút, truyền đối tượng thủ tục hiện tại vào hàm mở chi tiết.
    nutChiTiet.addEventListener("click", () => hienThiChiTiet(thuTuc));

    // Gắn phần nội dung, thông tin phụ và nút vào thẻ rồi thêm vào trang.
    cotBen.append(tenLinhVuc, nutChiTiet);
    theThuTuc.append(noiDungChinh, cotBen);
    ketQuaTraCuu.append(theThuTuc);
  });
}

function xoaBoLoc() {
  oNhapTimKiem.value = "";
  linhVucDangChon = "all";
  boLocLePhi.value = "all";
  sapXepThuTuc.value = "relevance";
  boLocLinhVuc.querySelectorAll("button[data-category]").forEach((nut) => {
    const isActive = nut.dataset.category === "all";
    nut.classList.toggle("dang-chon", isActive);
    nut.setAttribute("aria-pressed", String(isActive));
  });
  hienThiKetQua();
}

// Dùng event delegation: một listener trên vùng lọc xử lý mọi nút lọc được tạo động.
boLocLinhVuc.addEventListener("click", (suKien) => {
  // Tìm nút lọc gần nhất mà người dùng bấm; bỏ qua click ngoài các nút.
  const nut = suKien.target.closest("button[data-category]");
  if (!nut) return;

  // Ghi nhớ mã lĩnh vực vừa chọn.
  linhVucDangChon = nut.dataset.category;
  // Đồng bộ màu trạng thái và thuộc tính trợ năng aria-pressed cho mọi nút.
  boLocLinhVuc.querySelectorAll("button").forEach((nutLinhVuc) => {
    const dangChon = nutLinhVuc === nut;
    nutLinhVuc.classList.toggle("dang-chon", dangChon);
    nutLinhVuc.setAttribute("aria-pressed", String(dangChon));
  });

  // Vẽ lại kết quả theo lĩnh vực mới.
  hienThiKetQua();
});

// Chặn form gửi dữ liệu/tải lại trang; thay vào đó chạy lọc trên dữ liệu đã tải.
bieuMauTimKiem.addEventListener("submit", (suKien) => {
  suKien.preventDefault();
  hienThiKetQua();
});

// Lọc ngay khi nội dung ô tìm kiếm thay đổi.
oNhapTimKiem.addEventListener("input", hienThiKetQua);
boLocLePhi.addEventListener("change", hienThiKetQua);
sapXepThuTuc.addEventListener("change", hienThiKetQua);
nutXoaBoLoc.addEventListener("click", xoaBoLoc);

// Nút × đóng hộp thoại.
document.querySelector("#dialog-close").addEventListener("click", () => {
  hopThoai.close();
});

// Cho phép đóng bằng cách bấm vào vùng nền của dialog, không đóng khi bấm nội dung bên trong.
hopThoai.addEventListener("click", (suKien) => {
  if (suKien.target === hopThoai) hopThoai.close();
});

// Tải dữ liệu từ API, xác thực cấu trúc, chuẩn hóa danh sách và cập nhật giao diện.
async function taiDanhSachThuTuc() {
  trangThaiKetQua.textContent = "Đang tải dữ liệu thủ tục...";
  ketQuaTraCuu.setAttribute("aria-busy", "true");
  try {
    const ketQua = await window.LegalPathAPI.getLegalCategories();
    // API có thể trả thẳng mảng lĩnh vực hoặc bọc mảng trong thuộc tính data.
    const danhSachLinhVuc = Array.isArray(ketQua) ? ketQua : ketQua.data;
    // Báo lỗi rõ ràng nếu cấu trúc cấp cao nhất không phải danh sách lĩnh vực.
    if (!Array.isArray(danhSachLinhVuc)) {
      throw new Error("Dữ liệu lĩnh vực không hợp lệ.");
    }
    // Kiểm tra mỗi lĩnh vực có mảng procedures trước khi xử lý.
    danhSachLinhVuc.forEach((linhVuc) => {
      if (!Array.isArray(linhVuc.procedures)) {
        throw new Error("Danh sách thủ tục không hợp lệ.");
      }
    });

    // Chuyển danh sách lồng lĩnh vực/thủ tục thành một mảng thủ tục phẳng.
    // Mã và tên lĩnh vực được bổ sung vào mỗi thủ tục để lọc và hiển thị.
    danhSachThuTuc = danhSachLinhVuc.flatMap((linhVuc) =>
      linhVuc.procedures.map((thuTuc) => ({
        ...thuTuc,
        category_id: linhVuc.category_id,
        category_name: linhVuc.category_name
      }))
    );

    // Tạo nút lọc và hiển thị các thủ tục ban đầu.
    hienThiBoLoc(danhSachLinhVuc);
    hienThiKetQua();
  } catch (loi) {
    console.error("Không thể tải dữ liệu tra cứu pháp lý:", loi);
    trangThaiKetQua.textContent = "Không thể tải dữ liệu thủ tục.";
    const thongBao = taoPhanTu("p", loi.message);
    thongBao.className = "tra-cuu-phap-ly__loi-tai-du-lieu";
    ketQuaTraCuu.replaceChildren(thongBao, nutThuLai);
  } finally {
    ketQuaTraCuu.removeAttribute("aria-busy");
  }
}

// Bắt đầu tải dữ liệu ngay khi file JavaScript được thực thi.
taiDanhSachThuTuc();
