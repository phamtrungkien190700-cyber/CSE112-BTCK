# Vai trò và chức năng

Tài liệu đối chiếu mã hiện có; “có trang” không đồng nghĩa với đã kiểm thử bảo mật, quyền truy cập hay luồng đầu-cuối.

| Vai trò / trạng thái truy cập | Màn hình và chức năng được thấy trong repository | Cần xác nhận |
|---|---|---|
| Khách / công khai | `index-phapli/phapli.html`: tìm lĩnh vực/thủ tục, xem chi tiết; các trang đăng nhập, đăng ký, quên mật khẩu | Trang nào thật sự công khai; liên kết và trạng thái lỗi |
| Người dùng (`user`) | Không gian người dùng: tra cứu, checklist thủ tục, danh bạ chuyên gia; cài đặt và thông báo | Nghiệp vụ lưu tiến độ checklist và quyền truy cập |
| Chuyên gia (`expert`, `legal_expert`) | Quản lý bài viết, checklist, hồ sơ chuyên gia; trợ lý dàn ý cục bộ trong biểu mẫu bài viết | Cần xác nhận `expert` và `legal_expert` có cùng quyền hay không |
| Biên tập viên (`editor`) | Dashboard điều hướng; hàng đợi duyệt checklist; quản lý nguồn; theo dõi độ mới | Xác nhận quyền CRUD nguồn và các trạng thái nghiệp vụ |
| Quản trị viên (`manager`) | Dashboard nền tảng, quản lý tài khoản, quản lý lĩnh vực/thủ tục, thiết lập nền tảng | Xác nhận tên role trong dữ liệu, quyền quản lý và dữ liệu thật/giả |
| Lỗi/đường dẫn không hợp lệ | Trang 403 và 404 | Thử trực tiếp các trường hợp không quyền/không tìm thấy |

## Ma trận tính năng theo vai trò

| Nghiệp vụ | Khách | Người dùng | Chuyên gia | Biên tập viên | Quản trị viên |
|---|---:|---:|---:|---:|---:|
| Đọc và tìm thủ tục pháp lý | Có | Có | Chưa xác nhận | Chưa xác nhận | Quản lý dữ liệu |
| Xem checklist thủ tục | Không gian công khai một phần | Có | Tạo/quản lý checklist chuyên môn | Duyệt checklist | Chưa xác nhận |
| Tìm danh bạ chuyên gia | Có/đăng nhập tùy điều hướng | Có | Quản lý hồ sơ cá nhân | Chưa xác nhận | Chưa xác nhận |
| Quản lý bài viết | Không | Không | Tạo/sửa bài viết | Chưa xác nhận quy trình xuất bản bài viết | Chưa xác nhận |
| Duyệt nội dung | Không | Không | Gửi checklist theo luồng hiện có | Duyệt/từ chối checklist | Dashboard thống kê |
| Quản lý tài khoản/danh mục | Không | Cài đặt cá nhân | Hồ sơ cá nhân | Quản lý nguồn | Tài khoản, danh mục, thiết lập |

## Trạng thái cần kiểm thử trước khi ghi nhận hoàn thành

- Mỗi biểu mẫu: dữ liệu hợp lệ/không hợp lệ, lưu thành công, lỗi API.
- Mỗi danh sách: có dữ liệu, rỗng ban đầu, lọc không có kết quả, lỗi tải, thao tác lưu thất bại.
- Mỗi luồng duyệt: chờ duyệt → duyệt; chờ duyệt → từ chối; tải lại trang để xác nhận dữ liệu bền vững.
- Quyền hạn: người chưa đăng nhập, sai role, đúng role; xác minh chặn ở cả giao diện lẫn máy chủ nếu có.
- Responsive và bàn phím: desktop, tablet 768px, mobile 320–375px, zoom 200%, focus nhìn thấy, Escape đóng modal.

Xem [bảng kiểm kê](./screen-inventory.md), [User Flow](./user-flow.md) và [đặc tả mockup](../design/figma-mockup-spec.md).
