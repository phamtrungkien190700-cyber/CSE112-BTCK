# Vai trò & Chức năng

| Vai trò | Khu vực | Chức năng chính |
|---|---|---|
| Khách | Trang chủ và tra cứu công khai | Xem danh mục, tìm thủ tục và xem thông tin chuyên gia |
| `user` | `pages/user/` | Tra cứu pháp lý, checklist thủ tục, danh bạ chuyên gia |
| `legal_expert` | `pages/expert/` | Quản lý bài viết, checklist và hồ sơ chuyên gia |
| `admin` | `pages/admin/` | Quản lý tài khoản, trạng thái tài khoản và lĩnh vực pháp luật |

Tài khoản người dùng và chuyên gia có thể tự đăng ký tại màn hình đăng nhập/đăng ký hợp nhất. Không cho phép tự đăng ký `admin`; tài khoản quản trị đầu tiên được khởi tạo qua `BOOTSTRAP_ADMIN_IDENTITY` và `BOOTSTRAP_ADMIN_PASSWORD` khi chạy server.

Quyền truy cập được kiểm tra ở server cho các API ghi dữ liệu và các trang theo vai trò. Giao diện phía trình duyệt chỉ hỗ trợ điều hướng, không thay thế kiểm tra quyền phía server.