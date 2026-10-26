# Đề xuất dự án: LegalPath

> Tài liệu này được hoàn thiện từ các trang, API và dữ liệu hiện có trong repository. Những số liệu, chính sách pháp lý và nghiệp vụ cần chủ dự án xác nhận được đánh dấu rõ; không xem đây là tư vấn pháp lý.

## 1. Tóm tắt sản phẩm

**LegalPath – Điều hướng thông tin pháp lý phổ thông** là ứng dụng web tiếng Việt giúp người dân tìm và đọc thông tin thủ tục, chuẩn bị checklist, tra cứu chuyên gia; đồng thời cung cấp không gian cho chuyên gia tạo nội dung, biên tập viên duyệt checklist và quản trị viên quản lý tài khoản/dữ liệu.

## 2. Bối cảnh và vấn đề

Thông tin thủ tục thường được trình bày trên nhiều nguồn, với cách diễn đạt và mức độ chi tiết khác nhau. Người tìm hiểu có thể khó xác định đúng lĩnh vực, giấy tờ cần chuẩn bị, cơ quan thực hiện và nơi cần xác minh thông tin. Nội dung do chuyên gia tạo cũng cần được rà soát trước khi đưa vào sử dụng.

Các vấn đề sản phẩm hướng đến:

- **P1 — Khó tìm:** Người dân chưa biết bắt đầu tra cứu theo lĩnh vực hay tên thủ tục.
- **P2 — Khó chuẩn bị:** Thông tin về giấy tờ, thời gian, lệ phí và cơ quan thực hiện cần được tập hợp, trình bày dễ theo dõi.
- **P3 — Khó tìm người hỗ trợ:** Người dân cần một điểm truy cập để tìm chuyên gia pháp lý.
- **P4 — Cần kiểm soát nội dung:** Checklist do chuyên gia soạn cần có luồng xem xét và trạng thái duyệt rõ ràng.

Các phát biểu trên là giả thuyết thiết kế, chưa kèm phỏng vấn người dùng hay dữ liệu khảo sát trong repository; nhóm cần bổ sung minh chứng thực tế trước khi bảo vệ.

## 3. Mục tiêu và kết quả mong muốn

- **O1:** Cho phép khách xem lĩnh vực và tìm thủ tục bằng từ khóa.
- **O2:** Trình bày thông tin thủ tục và tài liệu cần chuẩn bị theo cấu trúc nhất quán.
- **O3:** Tổ chức checklist và danh bạ chuyên gia trong không gian người dùng.
- **O4:** Cho chuyên gia quản lý hồ sơ, bài viết và checklist.
- **O5:** Cho biên tập viên xem hàng đợi checklist và chuyển trạng thái duyệt/từ chối.
- **O6:** Cho quản trị viên quản lý tài khoản, danh mục pháp lý và thiết lập nền tảng.
- **O7:** Hiển thị lỗi tải dữ liệu và các trạng thái danh sách để người dùng biết bước tiếp theo.

Đây là mục tiêu sản phẩm, không phải cam kết các mục đã được kiểm thử toàn diện. Đối chiếu phạm vi thực tế trong [bảng kiểm kê màn hình](./screen-inventory.md).

## 4. Vai trò và luồng chính

| Vai trò | Mục tiêu chính | Luồng tiêu biểu |
|---|---|---|
| Khách / người chưa đăng nhập | Khám phá nội dung và tra cứu thủ tục công khai | Trang pháp lý → tìm kiếm → xem chi tiết → đăng nhập/đăng ký khi cần |
| Người dùng (`user`) | Tra cứu, xem checklist, tìm chuyên gia và quản lý tài khoản | Không gian người dùng → tra cứu/checklist/danh bạ → cài đặt/thông báo |
| Chuyên gia (`expert`, `legal_expert`) | Quản lý hồ sơ, bài viết và checklist | Không gian chuyên gia → tạo/chỉnh sửa → rà soát → lưu |
| Biên tập viên (`editor`) | Kiểm duyệt checklist và theo dõi nguồn/nội dung mới | Hàng đợi → xem chi tiết → duyệt/từ chối; quản lý nguồn/theo dõi độ mới |
| Quản trị viên (`manager`) | Quản lý tài khoản, dữ liệu pháp lý và nền tảng | Dashboard → quản lý tài khoản/danh mục/thiết lập |

Các tên vai trò `user`, `expert`, `legal_expert`, `editor`, `manager` được đối chiếu từ mã đăng nhập và trang. Vai trò quản trị viên được trình bày dưới tên “quản trị viên” trên giao diện; nhóm cần xác nhận quy ước `manager` có phải tên role duy nhất trong dữ liệu hay không.

Sơ đồ chi tiết: [User Flow](./user-flow.md).

## 5. Thực thể dữ liệu và vòng đời

| Thực thể | Trường/nguồn quan sát được | Vòng đời đang thể hiện trong dự án |
|---|---|---|
| Lĩnh vực và thủ tục pháp lý | `category_id`, `category_name`, `procedures`, mã, thời gian, lệ phí, cơ quan, giấy tờ; `api/legal-procedures.json` | Đọc → quản trị viên tạo/cập nhật/xóa lĩnh vực qua API |
| Tài khoản | `id`, danh tính đăng nhập, vai trò, thông tin hồ sơ/trạng thái khóa; API `/list-user` | Đăng ký → đăng nhập → cập nhật hồ sơ/khóa tài khoản; trạng thái chính xác cần xác nhận với schema |
| Chuyên gia | Hồ sơ và danh sách chuyên gia; `api/experts.json` | Đọc danh bạ → chuyên gia xem/cập nhật hồ sơ |
| Bài viết | Bài viết thuộc portal nội dung, danh mục, nội dung, trạng thái và checklist liên quan | Nháp → chờ duyệt/xuất bản theo luồng màn hình; quy tắc chuyển trạng thái cần nhóm xác nhận |
| Checklist | Tên, mô tả, danh mục, câu hỏi, trạng thái, `reviewStatus` | Chuyên gia tạo/chỉnh sửa → chờ duyệt → duyệt hoặc từ chối → cập nhật/xuất bản theo quy tắc hiện tại |
| Nguồn tham khảo | Tên, loại, URL, trạng thái; collection `sources` trong dữ liệu nội bộ editor | Đọc/quản lý nguồn; thao tác cụ thể cần đối chiếu màn hình |
| Thông báo | Collection `notifications` trong `api/expert-content.json` | Tải → đánh dấu đã đọc/cập nhật theo trang thông báo |
| Thiết lập | Collection `settings` hoặc các thiết lập tài khoản | Đọc/cập nhật tùy trang; cần xác nhận trường dữ liệu và quyền sở hữu |

Tên trường và trạng thái trên phản ánh cấu trúc có thể đọc được trong mã/dữ liệu hiện có, không thay thế đặc tả nghiệp vụ chính thức. Các bản ghi ví dụ trong API không chứng minh dữ liệu là nguồn pháp lý cập nhật.

## 6. Phạm vi hiện quan sát được

- Tra cứu thủ tục công khai lấy dữ liệu từ `http://localhost:3001/list-luat`.
- Đăng nhập/đăng ký và quản lý tài khoản dùng `http://localhost:3000/list-user`.
- Danh bạ chuyên gia dùng `http://localhost:3002/experts_directory`.
- Nội dung chuyên gia, checklist và thông báo dùng `http://localhost:3003`.
- Trang biên tập viên có các mục hàng đợi duyệt, quản lý nguồn và theo dõi độ mới.
- Trang chuyên gia có quản lý bài viết, checklist, hồ sơ; trong biểu mẫu bài viết có **trợ lý tạo dàn ý theo quy tắc cục bộ**, không phải kết nối mô hình AI bên ngoài.

Chi tiết cách chạy API được ghi trong [api/README.md](../api/README.md). Lưu ý: `editor/File/server.js` cũng mặc định dùng cổng 3000 cho API riêng `/api/*`; không thể chạy đồng thời với JSON Server người dùng cũng chiếm cổng này nếu chưa đổi cấu hình. Cần thống nhất cách chạy trước buổi demo.

## 7. Giới hạn và nội dung cần xác nhận

1. Chưa có bằng chứng khảo sát người dùng/nghiên cứu thực địa trong các tài liệu hiện tại.
2. Nội dung và lệ phí pháp lý phải được đối chiếu với nguồn/cơ quan chính thức; trang web chỉ nên nêu thông tin tham khảo.
3. Các giá trị trong JSON có thể là dữ liệu demo; cần xác nhận chủ sở hữu, độ mới và quyền sử dụng.
4. Có nhiều trang và vai trò trong mã; chỉ các luồng đã kiểm thử đầu-cuối mới nên được trình bày là đã hoàn thiện.
5. Chưa có xác nhận từ nhóm về người phụ trách, task board, PR/review, deployment, OBS cho từng màn hình. Xem [bảng kiểm kê](./screen-inventory.md) và [phân công](./team-assignment.md).
6. File Figma được dẫn trong [design/figma-link.txt](../design/figma-link.txt) là liên kết có sẵn trong READMEGK, chưa được xác minh quyền truy cập hay mức độ khớp với mã hiện tại.
