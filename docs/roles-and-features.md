# Vai trò & Chức năng

| Vai trò | Khu vực | Chức năng chính |
|---|---|---|
| Khách | Trang chủ và tra cứu công khai | Xem danh mục, tìm thủ tục và xem thông tin chuyên gia |
| `user` | `pages/user/` | Tra cứu/lọc thủ tục, checklist, trợ lý gợi ý thủ tục và rà soát sơ bộ, danh bạ chuyên gia |
| `legal_expert` | `pages/expert/` | Quản lý bài viết, checklist, hồ sơ chuyên gia và tạo dàn ý biên tập có thể chỉnh sửa |
| `editor` | `pages/editor/` | Duyệt nội dung, quản lý nguồn và theo dõi độ mới; tài khoản được quản trị viên phân quyền |
| `admin` | `pages/admin/` | Quản lý tài khoản, trạng thái tài khoản và lĩnh vực pháp luật |

Tài khoản người dùng và chuyên gia có thể tự đăng ký tại màn hình đăng nhập/đăng ký hợp nhất. Người đăng ký có thể gửi yêu cầu vai trò `editor` hoặc `admin`, nhưng tài khoản chỉ được tạo với quyền `user` cho đến khi quản trị viên phê duyệt và đổi vai trò tại màn hình quản lý tài khoản. Tài khoản quản trị đầu tiên được khởi tạo qua `BOOTSTRAP_ADMIN_IDENTITY` và `BOOTSTRAP_ADMIN_PASSWORD` khi chạy server.

Các khu vực theo vai trò đều có liên kết **Tổng quan chung** tới `/pages/public/index.html`.

Quyền truy cập được kiểm tra ở server cho các API ghi dữ liệu và các trang theo vai trò. Giao diện phía trình duyệt chỉ hỗ trợ điều hướng, không thay thế kiểm tra quyền phía server.

Dữ liệu hàng đợi duyệt, nguồn và theo dõi độ mới dùng dữ liệu minh họa trong `data/editor-content.json`; thay đổi của biên tập viên được lưu qua API vào tệp này.

Trợ lý người dùng và công cụ biên tập chuyên gia hiện chạy bằng quy tắc/dữ liệu cục bộ, không gọi dịch vụ LLM bên ngoài. Kết quả chỉ là gợi ý; người dùng chủ động rà soát và lưu. Nội dung tình huống rà soát rủi ro không được lưu; lịch sử chỉ lưu mức độ, thủ tục liên quan và mã lý do.