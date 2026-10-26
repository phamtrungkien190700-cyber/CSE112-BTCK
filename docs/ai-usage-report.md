# Báo cáo sử dụng AI

> Phạm vi báo cáo: chỉ các tương tác có trong cuộc trò chuyện Copilot SDK trong VS Code mà nhóm đang dùng để rà soát thư mục `clone-them`. Báo cáo không khẳng định bao quát những lần dùng AI ngoài cuộc trò chuyện này. Nhóm cần bổ sung lịch sử sử dụng AI của từng thành viên nếu có.

## Công cụ và phạm vi

- **Công cụ trong cuộc trò chuyện được ghi nhận:** trợ lý AI sử dụng Copilot SDK trong VS Code.
- **API AI bên ngoài:** trong các tác vụ dưới đây, trợ lý không gọi API LLM bên ngoài và không tạo/đưa API key vào mã nguồn.
- **Tệp/dữ liệu đọc để rà soát:** mã HTML/CSS/JavaScript, JSON, README và PDF barem được người dùng chỉ định. Việc trích xuất PDF được chạy cục bộ để đọc tiêu chí.

## Các yêu cầu người dùng có trong phiên làm việc

| # | Yêu cầu/prompt của người dùng | Phần AI đã thực hiện hoặc tạo ra | Trạng thái kiểm chứng của sinh viên |
|---|---|---|---|
| 1 | Thông báo lỗi API: “Không kết nối được API tại localhost:3000. Hãy khởi động JSON Server rồi thử lại.” | Kiểm tra cấu hình API; tạo `api/users.json` cục bộ từ `api/users.example.json` nếu chưa có (tệp này được `.gitignore` loại khỏi Git); khởi chạy JSON Server ở cổng 3000 và 3001; kiểm tra `/list-user` và `/list-luat` trả HTTP 200. | **Chưa được sinh viên xác nhận.** DB user khởi tạo rỗng theo mẫu; cần tự tạo tài khoản thử và xác minh quy trình chạy. |
| 2 | “dựa trên barem chấm điểm xem folder clone-them có những tiêu chí nào bị trừ điểm hoặc thiếu ko” | Đọc barem PDF và rà repository; báo cáo các khoảng trống tài liệu, AI UX, Git/deploy/OBS và các mục cần kiểm tra trực tiếp. | **Chưa được sinh viên xác nhận.** Báo cáo là rà soát sơ bộ, không thay cho chấm điểm giảng viên. |
| 3 | “m thực hiện Tài liệu phân tích, user flow, kiểm kê màn hình và thiết kế (có Bảng kiểm kê màn hình (docs/screen-inventory.md) + Sơ đồ User Flow + Thiết kế Figma/Canva) và Báo cáo sử dụng AI dựa trên những gì t từng promt cho m (Có tệp báo cáo docs/ai-usage-report.md khai báo trung thực các công cụ AI, câu lệnh prompt, phần AI sinh và phần sinh viên tự kiểm chứng/chỉnh sửa.)” | Tạo/cập nhật đề xuất dự án, ma trận vai trò, danh sách và bảng kiểm kê 24 HTML, user flow, đặc tả mockup để chuyển thành frame Figma/Canva, và báo cáo AI này. | **Cần nhóm đối chiếu từng nội dung với sản phẩm, xác nhận người phụ trách, sửa giả định và kiểm tra liên kết thiết kế.** |

Các trích dẫn trên chỉ phản ánh yêu cầu nhìn thấy trong phiên làm việc này. Không tự thêm prompt, công cụ hay đóng góp của thành viên mà AI không có bằng chứng.

## Nội dung do AI hỗ trợ soạn trong repository

- `docs/project-proposal.md`: bối cảnh/vấn đề, mục tiêu, vai trò, thực thể và giới hạn; được suy ra từ màn hình, API, dữ liệu hiện có, chưa có phỏng vấn người dùng.
- `docs/roles-and-features.md`, `docs/screen-list.md`, `docs/screen-inventory.md`, `docs/user-flow.md`: tổng hợp đường dẫn HTML, chức năng nhìn thấy trong mã và luồng dự kiến; các ô “chưa xác nhận” cần giữ nguyên cho đến khi thành viên bổ sung bằng chứng.
- `design/figma-mockup-spec.md` và `design/figma-link.txt`: đặc tả/handoff thiết kế dựa trên các màu CSS hiện tại và liên kết có sẵn trong READMEGK; trợ lý **không đăng nhập hoặc chỉnh sửa tệp Figma/Canva**.
- `docs/team-assignment.md`: chỉ liệt kê tên xuất hiện trong remote branch, không tự gán ai làm màn hình nào.

## Phần sinh viên cần tự kiểm chứng/chỉnh sửa trước khi nộp

- [ ] Cả nhóm xác nhận bối cảnh, vấn đề, mục tiêu, thực thể và vòng đời trạng thái trong đề xuất.
- [ ] Mở từng URL, xác nhận chức năng/role/CRUD/state trong inventory; sửa mọi sai khác với code và trải nghiệm chạy thật.
- [ ] Thành viên tự điền người phụ trách, task board ID/link, feature branch, PR + reviewer và video OBS cho từng màn hình.
- [ ] Chủ sở hữu Figma xác nhận quyền truy cập, cập nhật mockup desktop/mobile và các trạng thái thực tế; gắn ảnh/frame/link đã hoàn tất, không dùng đặc tả này thay cho thiết kế Figma.
- [ ] Thử lại API và đăng ký/đăng nhập bằng dữ liệu demo an toàn; không đưa mật khẩu hoặc dữ liệu cá nhân thật vào báo cáo.
- [ ] Chạy kiểm tra responsive, bàn phím/A11y, trạng thái rỗng/lỗi và luồng duyệt/lưu trên dữ liệu cục bộ.
- [ ] Mỗi thành viên bổ sung công cụ/prompt/phần AI mình đã dùng và nêu rõ phần tự viết, kiểm tra, sửa; sửa báo cáo nếu lịch sử AI bên ngoài phiên này khác.

## Xác nhận của nhóm

Người tổng hợp: **AI hỗ trợ soạn từ repository và lịch sử prompt có sẵn**

Người duyệt cuối cùng (sinh viên): **Chưa ghi nhận**
Ngày nhóm tự rà soát: **Chưa ghi nhận**
