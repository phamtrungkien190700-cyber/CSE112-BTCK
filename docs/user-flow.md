# Sơ đồ User Flow

Sơ đồ dưới đây biểu diễn luồng sản phẩm dự kiến dựa trên điều hướng và chức năng nhìn thấy trong repository. Mũi tên không thay thế kiểm thử trực tiếp; nhánh ghi “cần xác nhận” phải được nhóm đối chiếu với hành vi thật.

## Luồng công khai và người dùng

```mermaid
flowchart TD
    A[Khách mở LegalPath] --> B[Tìm lĩnh vực hoặc thủ tục]
    B --> C{Có kết quả?}
    C -->|Có| D[Chọn thủ tục]
    D --> E[Xem thời gian, lệ phí, cơ quan, hồ sơ]
    E --> F{Muốn dùng tiện ích tài khoản?}
    F -->|Có| G[Đăng nhập hoặc đăng ký]
    F -->|Không| B
    C -->|Không| H[Thông báo không tìm thấy; đổi từ khóa]
    H --> B
    G --> I[Không gian người dùng]
    I --> J[Tra cứu pháp lý]
    I --> K[Xem checklist thủ tục]
    I --> L[Tìm danh bạ chuyên gia]
    I --> M[Cài đặt / thông báo]
    J --> D
```

## Luồng chuyên gia và biên tập viên

```mermaid
flowchart LR
    U[Người dùng / khách] -->|Đọc nội dung đã công bố| P[Trang tra cứu]
    E[Chuyên gia đăng nhập] --> EP[Hồ sơ chuyên gia]
    E --> EA[Soạn hoặc cập nhật bài viết]
    EA --> AI[Trợ lý dàn ý cục bộ: nhập chủ đề → xem giải thích → sửa/chấp nhận/từ chối]
    AI -->|Chấp nhận dàn ý| EA
    EA -->|Lưu| SAVED[Lưu bài viết; trạng thái tiếp theo cần xác nhận]
    E --> EC[Tạo hoặc sửa checklist]
    EC -->|Gửi theo luồng hiện có; cần xác nhận| Q[Hàng đợi biên tập]
    ED[Biên tập viên đăng nhập] --> Q
    Q -->|Tìm/lọc và xem chi tiết| DECIDE{Đánh giá checklist}
    DECIDE -->|Duyệt| APPROVED[Đã duyệt / published theo quy tắc hiện tại]
    DECIDE -->|Từ chối| REJECTED[Từ chối / draft theo quy tắc hiện tại]
    APPROVED -->|Kiểm tra sau khi lưu| EC
    REJECTED -->|Chỉnh sửa và gửi lại; cần xác minh| EC
    ED --> SRC[Quản lý nguồn]
    ED --> MON[Theo dõi độ mới]
    APPROVED --> P
```

## Luồng quản trị

```mermaid
flowchart TD
    ADM[Quản trị viên đăng nhập] --> DASH[Dashboard nền tảng]
    DASH --> ACC[Quản lý tài khoản]
    ACC --> EDIT[Chỉnh sửa hồ sơ / khóa hoặc mở khóa]
    DASH --> LAW[Quản lý lĩnh vực và thủ tục]
    LAW --> CREATE[Tạo / sửa / xóa dữ liệu qua API]
    DASH --> CONFIG[Thiết lập nền tảng]
    ACC -->|Lưu| PERSIST[Phản hồi API; xác minh tải lại]
    CREATE -->|Lưu| PERSIST
    CONFIG -->|Lưu| PERSIST
```

## Luồng ngoại lệ dùng chung

```mermaid
flowchart TD
    ACTION[Người dùng mở trang hoặc gửi thao tác] --> LOAD[Tải dữ liệu / kiểm tra biểu mẫu]
    LOAD -->|Hợp lệ và API thành công| OK[Hiển thị kết quả / xác nhận]
    LOAD -->|Không có dữ liệu hoặc lọc rỗng| EMPTY[Thông báo rỗng; đề nghị đổi bộ lọc]
    LOAD -->|Mạng/API lỗi| ERROR[Thông báo lỗi riêng; hiển thị thử lại nếu trang hỗ trợ]
    LOAD -->|Dữ liệu nhập sai| INVALID[Thông báo lỗi cạnh trường dữ liệu]
    LOAD -->|Không đủ quyền| FORBIDDEN[Trang 403 hoặc điều hướng an toàn]
    LOAD -->|URL không tồn tại| NOTFOUND[Trang 404]
```

## Handoff kiểm thử

1. Chạy từng luồng bằng dữ liệu demo, ghi lại kết quả và lỗi thực tế.
2. Với hàng đợi, thử checklist chờ duyệt → duyệt, chờ duyệt → từ chối, sau đó tải lại trang.
3. Với mọi API, thử thành công, danh sách rỗng, lỗi mạng và dữ liệu sai định dạng; ghi rõ trang nào có nút thử lại.
4. Xác nhận liên kết từ trang công khai sang đăng nhập và từ từng role tới trang dùng chung.
5. Đính kèm screenshot/video OBS và URL Figma frame tương ứng trong [screen inventory](./screen-inventory.md).

Các trạng thái chưa được xác nhận trong mã được đánh dấu trong [bảng kiểm kê](./screen-inventory.md).
