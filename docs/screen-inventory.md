# Kiểm kê màn hình LegalPath

Tài liệu tổng hợp các trang HTML hiện có trong dự án `CSE112-BTCK-project`, chia theo vai trò và luồng sử dụng. Danh sách bao gồm cả trang khung điều hướng, trang nội dung nhúng bên trong khung và trang lỗi.

**Tổng cộng: 25 trang HTML.** Trang khung và trang nội dung được tính riêng vì là các màn hình/điểm vào riêng trong ứng dụng. Các dòng mô tả chức năng dựa trên giao diện và mã hiện có; không hàm ý mọi API hay luồng nghiệp vụ đã được kiểm thử nghiệm thu.

## Trang công khai và tài khoản

| Màn hình | Đối tượng | Mục đích và chức năng chính | Tệp |
|---|---|---|---|
| Trang chủ LegalPath | Khách | Khám phá lĩnh vực và thủ tục pháp lý, tìm kiếm nội dung, đi đến đăng nhập hoặc đăng ký. | [legal-home.html](../legal-home/legal-home.html) |
| Đăng nhập | Người dùng có tài khoản | Nhập email/số điện thoại và mật khẩu; thông báo lỗi hoặc khóa tài khoản; điều hướng theo vai trò sau khi đăng nhập. | [login.html](../login-pages/CSE122-BTGK/loginhtml/login.html) |
| Đăng ký | Khách | Tạo tài khoản, kiểm tra dữ liệu nhập và danh tính đã đăng ký; tài khoản chuyên gia pháp lý được liên kết với hồ sơ chuyên gia. | [register.html](../login-pages/CSE122-BTGK/loginhtml/register.html) |
| Quên mật khẩu | Người dùng có tài khoản | Nhập email/số điện thoại để bắt đầu khôi phục. Giao diện hiện ghi rõ dịch vụ gửi hướng dẫn qua email/SMS chưa được tích hợp. | [forgot-password.html](../login-pages/CSE122-BTGK/loginhtml/forgot-password.html) |

## Người dùng

| Màn hình | Đối tượng | Mục đích và chức năng chính | Tệp |
|---|---|---|---|
| Không gian người dùng | Người dùng (`user`) | Khung điều hướng chính; mở tra cứu, checklist thủ tục và danh bạ chuyên gia trong vùng nội dung; có menu tài khoản. | [user-dashboard.html](../user-portal/user-dashboard/user-dashboard.html) |
| Tra cứu pháp lý | Khách/người dùng | Tìm kiếm và đọc thông tin thủ tục, quy định pháp lý. | [legal-search.html](../user-portal/legal-search/legal-search.html) |
| Checklist thủ tục | Khách/người dùng | Xem checklist và thông tin cần chuẩn bị cho thủ tục cá nhân. | [index.html](../user-portal/procedure-checklist/index.html) |
| Danh bạ chuyên gia | Khách/người dùng | Tìm và xem thông tin chuyên gia pháp lý từ danh bạ. | [legal-experts.html](../user-portal/legal-experts/legal-experts.html) |
| Cài đặt | Người dùng đã đăng nhập | Xem/cập nhật thông tin tài khoản và tùy chọn trên trang; có chức năng đăng xuất. | [settings.html](../setting/settings.html) |
| Thông báo | Người dùng đã đăng nhập | Xem thông báo gắn với tài khoản và vai trò; tương tác với trạng thái thông báo. | [notifications.html](../notification/notifications.html) |
| Trợ lý thông minh | Khách/người dùng | Nhận gợi ý thủ tục và rà soát rủi ro hồ sơ; xem hoặc lưu gợi ý. Nội dung trợ lý được xử lý cục bộ theo dữ liệu/quy tắc sẵn có, không phải dịch vụ LLM bên ngoài. | [ai-assistant.html](../AI/ai-assistant.html) |

## Chuyên gia pháp lý

| Màn hình | Đối tượng | Mục đích và chức năng chính | Tệp |
|---|---|---|---|
| Quản lý bài viết | Chuyên gia (`expert`, `legal_expert`) | Tra cứu và xem bài viết/checklist chuyên môn. Có trợ lý tạo dàn ý biên tập cục bộ để chuyên gia rà soát; không tự xác nhận căn cứ pháp lý. | [expert-article-management.html](../expert/expert-article-management.html) |
| Quản lý checklist | Chuyên gia (`expert`, `legal_expert`) | Quản lý checklist chuyên môn và gửi nội dung vào luồng duyệt hiện có. | [expert-checklist-management.html](../expert/expert-checklist-management.html) |
| Hồ sơ chuyên gia | Chuyên gia (`expert`, `legal_expert`) | Xem và cập nhật hồ sơ của tài khoản đang đăng nhập. Hồ sơ được liên kết bằng `user_id` trong danh bạ chuyên gia. | [expert-profile.html](../expert/expert-profile.html) |

## Biên tập viên

| Màn hình | Đối tượng | Mục đích và chức năng chính | Tệp |
|---|---|---|---|
| Điều hướng vào không gian biên tập | Biên tập viên (`editor`) | Điểm vào chuyển tiếp đến không gian biên tập. | [index.html](../editor/index.html) |
| Không gian biên tập | Biên tập viên (`editor`) | Khung điều hướng tới hàng đợi duyệt, quản lý nguồn và theo dõi độ mới; có menu tài khoản. | [index.html](../editor/mainEditor/index.html) |
| Hàng đợi duyệt | Biên tập viên (`editor`) | Xem nội dung chờ duyệt và thực hiện thao tác duyệt/từ chối checklist theo luồng hiện có. | [review-queue.html](../editor/File/review-queue/review-queue.html) |
| Quản lý nguồn | Biên tập viên (`editor`) | Theo dõi và thao tác với nguồn nội dung pháp lý. | [source-management.html](../editor/File/source-management/source-management.html) |
| Theo dõi độ mới nội dung | Biên tập viên (`editor`) | Theo dõi độ mới/trạng thái cập nhật của nội dung. | [new-content-tracking.html](../editor/File/new-content-tracking/new-content-tracking.html) |

## Quản trị viên

| Màn hình | Đối tượng | Mục đích và chức năng chính | Tệp |
|---|---|---|---|
| Không gian quản trị | Quản trị viên (`manager`) | Khung điều hướng tới dashboard, quản lý tài khoản và quản lý lĩnh vực pháp luật; có menu tài khoản. | [index.html](../admin/mainadmin/index.html) |
| Dashboard nền tảng | Quản trị viên (`manager`) | Xem tổng quan tình hình nền tảng. | [platform-dashboard.html](../admin/platform-management/platform-dashboard.html) |
| Quản lý tài khoản | Quản trị viên (`manager`) | Tra cứu và quản lý tài khoản người dùng. | [account-management.html](../admin/account-management/account-management.html) |
| Quản lý lĩnh vực pháp luật | Quản trị viên (`manager`) | Quản lý dữ liệu lĩnh vực pháp luật trên nền tảng. | [law-management.html](../admin/law-management/law-management.html) |

## Màn hình lỗi

| Màn hình | Đối tượng | Mục đích | Tệp |
|---|---|---|---|
| Truy cập bị từ chối (403) | Mọi vai trò | Thông báo người dùng không có quyền truy cập. | [403.html](../403/403.html) |
| Không tìm thấy trang (404) | Mọi vai trò | Thông báo trang được yêu cầu không tồn tại. | [404.html](../404/404.html) |

## Thành phần giao diện dùng chung

- Widget trợ lý nổi được dùng trong các không gian vai trò đã tích hợp; đây là thành phần giao diện dùng chung, không phải một trang HTML riêng.
- Menu tài khoản và tên/ảnh đại diện được chia sẻ giữa các không gian có yêu cầu đăng nhập.
- Cài đặt và thông báo là các trang riêng, có thể được mở từ menu tài khoản.

## Lưu ý

- Các trang trong không gian người dùng, biên tập và quản trị có thể đóng vai trò khung điều hướng; trang nội dung bên trong được liệt kê riêng ở trên.
- Đăng nhập định tuyến tài khoản theo các vai trò `user`, `expert`, `legal_expert`, `editor` và `manager`.
- Màn hình quên mật khẩu chưa tích hợp gửi email/SMS. Trợ lý thông minh là chức năng cục bộ theo quy tắc/dữ liệu sẵn có; không mô tả như một dịch vụ AI bên ngoài.
- Tài liệu này kiểm kê màn hình theo mã nguồn hiện có, không thay thế kiểm thử API, kiểm thử quyền truy cập hay nghiệm thu nghiệp vụ.
