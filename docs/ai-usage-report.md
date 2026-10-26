# Báo cáo sử dụng AI

Các prompt dưới đây được **diễn đạt lại theo nhóm yêu cầu**, không phải trích dẫn nguyên văn. Phần sửa/bổ sung code được tóm lược theo phạm vi từng role; cần thành viên đối chiếu với công việc thực tế trước khi nộp.


## Công cụ và phạm vi

- *Công cụ:* trợ lý AI sử dụng Copilot SDK trong VS Code.
- *Model/phiên bản:* không được xác định trong nội dung phiên làm việc.
- *API LLM bên ngoài:* không gọi API LLM bên ngoài trong các tác vụ được nêu ở đây; không tạo hoặc thêm API key.
- *Phạm vi:* các yêu cầu trong cuộc trò chuyện và role mapping do người dùng xác nhận. Đây không phải toàn bộ lịch sử AI của từng thành viên.

## Prompt và công việc AI hỗ trợ

| # | Prompt/yêu cầu (diễn đạt khái quát) | Nội dung AI hỗ trợ | Phân loại / giới hạn |
|---|---|---|---|
| 1 | Hỗ trợ xử lý thông báo không kết nối được API local và khởi động JSON Server để thử lại. | Kiểm tra endpoint, tạo api/users.json local từ mẫu khi chưa có, chạy JSON Server ở cổng 3000 và 3001, kiểm tra endpoint phản hồi HTTP 200. | Hỗ trợ môi trường và dữ liệu local; không sửa source code ứng dụng. users.json bị ignore và mẫu ban đầu rỗng. |
| 2 | Rà soát project theo barem để tìm tiêu chí thiếu hoặc có nguy cơ bị trừ điểm. | Đọc barem và rà tài liệu, màn hình, chức năng cùng minh chứng; tổng hợp các khoảng trống và việc cần kiểm tra. | Rà soát, không phải yêu cầu sửa code tính năng. |
| 3 | Bổ sung tài liệu phân tích sản phẩm, user flow, kiểm kê màn hình, thiết kế tham khảo và báo cáo AI. | Soạn đề xuất, role/features, screen list, screen inventory, user flow, đặc tả mockup và SVG mockup khởi đầu. | Hỗ trợ tài liệu/thiết kế; không trực tiếp chỉnh sửa Figma/Canva bên ngoài. |
| 4 | Bổ sung hướng dẫn chạy project và nội dung deployment vào README. | Viết hướng dẫn chạy frontend/API local, lưu ý URL localhost, xung đột cổng và các bước chuẩn bị backend/deploy frontend. | Sửa tài liệu; không triển khai website hoặc backend lên Internet. |
| 5 | Kiểm tra việc nối remote GitHub vào thư mục project. | Kiểm tra remote và kết nối GitHub; remote đã có nên không thay đổi cấu hình. | Không commit/push. |
| 6 | Giải thích cách dùng git add . trong đúng thư mục và tác dụng của lệnh. | Hướng dẫn vị trí repository, phạm vi stage và lưu ý lệnh thêm các thay đổi không bị ignore. | Hướng dẫn Git; AI không chạy git add hoặc commit. |
| 7 | Điều chỉnh báo cáo AI để phần sửa/bổ sung code được trình bày khái quát theo role; cập nhật phân công thành viên. | Tóm lược phạm vi hỗ trợ code theo khu vực người dùng, chuyên gia pháp lý và editor. | Phần mô tả theo role là bản khái quát, không phải câu prompt nguyên văn. |

## Các nhóm yêu cầu hỗ trợ sửa/bổ sung code theo role

Role mapping dưới đây do người dùng cung cấp. Prompt được viết lại *chung chung*, không đặt trong ngoặc kép và không khẳng định là log nguyên văn.

| Thành viên | Role | Prompt tổng hợp (diễn đạt lại) | Nội dung AI hỗ trợ | Sinh viên tự kiểm tra/chỉnh sửa |
|---|---|---|---|---|
| Lê Công Sơn | Người dùng | Hỗ trợ rà soát, sửa hoặc bổ sung giao diện và chức năng trong khu vực người dùng để các luồng tra cứu và tiện ích được giao hoạt động phù hợp với project. | Phân tích cấu trúc HTML/CSS/JavaScript liên quan; hỗ trợ chỉnh giao diện, tương tác hoặc xử lý dữ liệu khi có yêu cầu. | Sơn đối chiếu màn hình và tính năng thực tế, tự kiểm thử luồng, ghi rõ phần code đã tự sửa/chỉnh lý. |
| Phạm Trung Kiên | Chuyên gia pháp lý | Hỗ trợ rà soát, sửa hoặc bổ sung giao diện và chức năng khu vực chuyên gia pháp lý, gồm các màn hình hồ sơ và quản lý nội dung/checklist thuộc phạm vi được giao. | Phân tích cấu trúc trang và dữ liệu; hỗ trợ chỉnh UI, tương tác và luồng lưu nội dung khi có yêu cầu. | Kiên xác minh nghiệp vụ, trạng thái lưu/duyệt, và tự kiểm chứng nội dung pháp lý với nguồn đáng tin cậy. |
| Hoàng Đức Cường | Editor / biên tập viên | Hỗ trợ rà soát, sửa hoặc bổ sung giao diện và chức năng khu vực editor, gồm danh sách/hàng đợi, xem chi tiết và xử lý nội dung thuộc phạm vi được giao. | Phân tích UI, JavaScript và API; hỗ trợ chỉnh bộ lọc, tương tác hoặc cập nhật trạng thái theo yêu cầu. | Cường kiểm thử các trạng thái chờ duyệt/đã duyệt/từ chối, lỗi API và việc dữ liệu còn sau khi tải lại. |

Bảng trên là mô tả tổng hợp theo role và loại việc, không khẳng định mọi tính năng nêu ra đều đã được AI sửa hoặc mọi thành viên đều dùng đúng prompt này. Nếu cần truy vết chính xác, bổ sung prompt/lịch sử chat thật cùng tệp và thay đổi tương ứng.


## Nội dung AI hỗ trợ tạo trong hồ sơ dự án

- Rà cấu trúc màn hình, API, JSON và một số hành vi HTML/JavaScript trong repository.
- Soạn tài liệu phân tích, inventory và user flow theo bằng chứng trong mã; các giả định chưa có nghiên cứu người dùng được đánh dấu cần nhóm xác nhận.
- Soạn đặc tả thiết kế và tạo SVG mockup khởi đầu; không thay thế Figma/Canva hoàn chỉnh.
- Soạn README hướng dẫn local/deployment; đây là hướng dẫn, không phải bằng chứng đã deploy.
- Hỗ trợ kiểm tra kết nối Git remote; không commit hoặc push thay người dùng.

## Việc sinh viên cần tự xác minh

- [ ] Sơn đối chiếu các nội dung về khu vực người dùng với màn hình, prompt và code thực tế.
- [ ] Kiên đối chiếu các nội dung về chuyên gia pháp lý với màn hình, prompt và code thực tế.
- [ ] Cường đối chiếu các nội dung về editor với màn hình, prompt và code thực tế.
- [ ] Với từng phần được AI hỗ trợ, ghi tệp liên quan, mô tả đầu ra AI, phần sinh viên chỉnh sửa và cách kiểm thử.
- [ ] Bổ sung model/công cụ hoặc các lần dùng AI khác nếu có; báo cáo này không đại diện lịch sử của các phiên chưa được cung cấp.
- [ ] Cả nhóm kiểm tra các nhận định và cập nhật những chỗ không khớp với sản phẩm thực tế.

*Người duyệt cuối cùng (sinh viên):* Chưa ghi nhận

*Ngày nhóm tự rà soát:* Chưa ghi nhận