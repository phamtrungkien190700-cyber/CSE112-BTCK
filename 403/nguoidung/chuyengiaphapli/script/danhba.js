
const trang = document.querySelector("#danh-ba-chuyen-gia");
const oNhapTimKiem = document.querySelector("#o-tim-kiem-chuyen-gia");
const trangThai = document.querySelector("#trang-thai-danh-ba");
const luoiChuyenGia = document.querySelector("#danh-sach-chuyen-gia");

let danhSachChuyenGia = [];

// Tạo phần tử HTML mới và tùy chọn thêm nội dung dạng văn bản an toàn.
function taoPhanTu(tenThe, vanBan) {
  const phanTu = document.createElement(tenThe);
  if (vanBan) phanTu.textContent = vanBan;
  return phanTu;
}

function hienThiDanhSach() {
  const tuKhoa = oNhapTimKiem.value.trim().toLocaleLowerCase("vi");
  const danhSachPhuHop = danhSachChuyenGia.filter((chuyenGia) =>
    `${chuyenGia.full_name} ${chuyenGia.title} ${chuyenGia.description}`
      .toLocaleLowerCase("vi")
      .includes(tuKhoa)
  );

  trangThai.textContent = `${danhSachPhuHop.length} chuyên gia phù hợp`;
  luoiChuyenGia.replaceChildren();

  if (danhSachPhuHop.length === 0) {
    const thongBao = taoPhanTu("p", "Không tìm thấy chuyên gia phù hợp với từ khóa của bạn.");
    thongBao.className = "danh-ba-chuyen-gia__thong-bao";
    luoiChuyenGia.append(thongBao);
    return;
  }

  danhSachPhuHop.forEach((chuyenGia) => {
    const theChuyenGia = taoPhanTu("article");
    theChuyenGia.className = "the-chuyen-gia";

    const anhDaiDien = taoPhanTu("div", chuyenGia.avatar_initials || "?");
    anhDaiDien.className = "the-chuyen-gia__anh-dai-dien";
    anhDaiDien.setAttribute("aria-hidden", "true");

    const ten = taoPhanTu("h2", chuyenGia.full_name || "Chuyên gia pháp lý");
    ten.className = "the-chuyen-gia__ten";

    const chucDanh = taoPhanTu("p", chuyenGia.title || "Chuyên gia pháp lý");
    chucDanh.className = "the-chuyen-gia__chuc-danh";

    const moTa = taoPhanTu("p", chuyenGia.description || "Thông tin đang được cập nhật.");
    moTa.className = "the-chuyen-gia__mo-ta";

    const nut = taoPhanTu("button", chuyenGia.action_label || "Gửi yêu cầu tư vấn");
    nut.className = "the-chuyen-gia__nut-tu-van";
    nut.type = "button";

    theChuyenGia.append(anhDaiDien, ten, chucDanh, moTa, nut);
    luoiChuyenGia.append(theChuyenGia);
  });
}

// Hiển thị thông báo khi không tải được dữ liệu danh bạ.
function hienThiLoi(loi) {
  console.error("Không thể tải danh bạ chuyên gia:", loi);
  trangThai.textContent = "Không thể tải danh sách chuyên gia.";
  const thongBao = taoPhanTu("p", `${loi.message} Hãy kiểm tra API tại ${trang.dataset.duongDanApi}.`);
  thongBao.className = "danh-ba-chuyen-gia__thong-bao danh-ba-chuyen-gia__thong-bao--loi";
  luoiChuyenGia.replaceChildren(thongBao);
}

oNhapTimKiem.addEventListener("input", hienThiDanhSach);


fetch(trang.dataset.duongDanApi)
  .then((phanHoi) => {
    if (!phanHoi.ok) {
      throw new Error(`Không tải được danh sách chuyên gia (HTTP ${phanHoi.status}).`);
    }
    return phanHoi.json();
  })
  .then((ketQua) => {
    danhSachChuyenGia = Array.isArray(ketQua) ? ketQua : ketQua.experts_directory;
    if (!Array.isArray(danhSachChuyenGia)) {
      throw new Error("Dữ liệu danh bạ chuyên gia không hợp lệ.");
    }
    hienThiDanhSach();
  })
  .catch(hienThiLoi);