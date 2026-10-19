# Chạy API LegalPath

Trang web lưu dữ liệu nguồn và trạng thái duyệt vào `dataset/api.json` thông qua API cục bộ.

1. Mở terminal tại thư mục dự án và chạy `node File\server.js`.
2. Mở thư mục dự án trong VS Code rồi bấm **Go Live**. Live Server dùng thư mục dự án làm root; `index.html` sẽ mở `mainEditor/index.html`, trang này điều hướng đến 5 trang con hiện có trong `File`.
3. Thao tác thêm/xóa nguồn hoặc duyệt/từ chối sẽ được lưu ngay vào `dataset/api.json`. Tải lại trang sẽ đọc dữ liệu đã lưu.

API cần Node.js và mặc định chạy tại `http://127.0.0.1:3000`.
