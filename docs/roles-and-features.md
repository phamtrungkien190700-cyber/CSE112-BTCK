# Vai trò & Chức năng

| Vai trò | Khu vực | Chức năng chính |
|---|---|---|
| Khách | Trang chủ và tra cứu công khai | Xem danh mục, tìm thủ tục và xem thông tin chuyên gia |
| `user` | `pages/user/` | Tra cứu/lọc thủ tục, checklist, trợ lý gợi ý thủ tục và rà soát sơ bộ, danh bạ chuyên gia |
| `legal_expert` | `pages/expert/` | Quản lý bài viết, checklist, hồ sơ chuyên gia và tạo dàn ý biên tập có thể chỉnh sửa |
| `admin` | `pages/admin/` | Quản lý tài khoản, trạng thái tài khoản và lĩnh vực pháp luật |

Tài khoản người dùng và chuyên gia có thể tự đăng ký tại màn hình đăng nhập/đăng ký hợp nhất. Không cho phép tự đăng ký `admin`; tài khoản quản trị đầu tiên được khởi tạo qua `BOOTSTRAP_ADMIN_IDENTITY` và `BOOTSTRAP_ADMIN_PASSWORD` khi chạy server.

Quyền truy cập được kiểm tra ở server cho các API ghi dữ liệu và các trang theo vai trò. Giao diện phía trình duyệt chỉ hỗ trợ điều hướng, không thay thế kiểm tra quyền phía server.

Trợ lý người dùng và công cụ biên tập chuyên gia hiện chạy bằng quy tắc/dữ liệu cục bộ, không gọi dịch vụ LLM bên ngoài. Kết quả chỉ là gợi ý; người dùng chủ động rà soát và lưu. Nội dung tình huống rà soát rủi ro không được lưu; lịch sử chỉ lưu mức độ, thủ tục liên quan và mã lý do.