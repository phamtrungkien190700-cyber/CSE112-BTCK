# Phân công thành viên

Vai trò dưới đây do người dùng xác nhận trong phiên làm việc ngày 2026-10-26. Tham chiếu branch giúp nhận diện tên trong repository nhưng không tự chứng minh lịch sử đóng góp, nội dung prompt AI, PR/review hoặc quyền sở hữu từng tệp.

| Thành viên | Branch tham chiếu | Role / vertical slice |
|---|---|---|
| Lê Công Sơn | CSE122-Lê-Công-Sơn-2551060680 | Người dùng |
| Phạm Trung Kiên | CSE122-Phạm-Trung-Kiên-2551060641 | Chuyên gia pháp lý |
| Hoàng Đức Cường | CSE122-Hoang-Duc-Cuong-2551060591 | Editor / biên tập viên |

## Các trang làm chung

Ngoài các trang thuộc phần User, Admin, Editor và Expert đã phân công theo từng thành viên ở trên, các trang công khai, xác thực tài khoản, tiện ích dùng chung và trang lỗi được xác định là phần cả nhóm cùng phối hợp thực hiện.

| Nhóm trang | Màn hình | Tệp |
|---|---|---|
| Trang công khai | Trang chủ LegalPath | [legal-home/legal-home.html](../legal-home/legal-home.html) |
| Tài khoản và xác thực | Đăng nhập | [login-pages/CSE122-BTGK/loginhtml/login.html](../login-pages/CSE122-BTGK/loginhtml/login.html) |
| Tài khoản và xác thực | Đăng ký | [login-pages/CSE122-BTGK/loginhtml/register.html](../login-pages/CSE122-BTGK/loginhtml/register.html) |
| Tài khoản và xác thực | Quên mật khẩu | [login-pages/CSE122-BTGK/loginhtml/forgot-password.html](../login-pages/CSE122-BTGK/loginhtml/forgot-password.html) |
| Tiện ích dùng chung | Trợ lý thông minh | [AI/ai-assistant.html](../AI/ai-assistant.html) |
| Tiện ích dùng chung | Cài đặt và đăng xuất | [setting/settings.html](../setting/settings.html) |
| Tiện ích dùng chung | Thông báo | [notification/notifications.html](../notification/notifications.html) |
| Xử lý lỗi | Truy cập bị từ chối (403) | [403/403.html](../403/403.html) |
| Xử lý lỗi | Không tìm thấy trang (404) | [404/404.html](../404/404.html) |

Phân công này ghi nhận phạm vi làm chung của nhóm, không khẳng định mức đóng góp cá nhân cụ thể cho từng tệp. Nếu cần báo cáo ownership chi tiết, nhóm cần bổ sung task/PR/review tương ứng.

## Cần nhóm bổ sung trước khi nộp

- Liên kết task board và task ID của từng màn hình.
- Nhánh feature, PR và reviewer tương ứng với phần việc.
- Video OBS cho màn hình do từng thành viên phụ trách.
- Trách nhiệm xuyên suốt của mỗi thành viên (design system/accessibility, kiến trúc/API, hoặc QA/deployment).
- Prompt AI thực tế, nếu có, cùng phần code AI hỗ trợ và phần sinh viên tự kiểm tra/chỉnh sửa.

Không suy luận ai viết một tệp chỉ từ branch name hoặc role. Đối chiếu thêm [bảng kiểm kê màn hình](./screen-inventory.md) và [báo cáo sử dụng AI](./ai-usage-report.md).