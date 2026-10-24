# Báo cáo sử dụng AI (AI Usage Report)

## AI trong sản phẩm

- Trợ lý gợi ý thủ tục: đối chiếu từ khóa người dùng nhập với tên thủ tục, lĩnh vực và giấy tờ trong dữ liệu LegalPath.
- Rà soát sơ bộ: phát hiện các cụm từ liên quan đến thời hạn gấp, giấy tờ thiếu, tranh chấp và phạm vi chưa rõ.
- Trợ lý biên tập chuyên gia: tạo dàn ý chung dựa trên chủ đề, chuyên mục và checklist được chọn.

Ba công cụ trên là các quy tắc minh bạch chạy tại trình duyệt, không gọi mô hình ngôn ngữ/API AI bên ngoài, không tự xác minh luật và không gửi nội dung tình huống ra ngoài. Dàn ý pháp lý không tự thêm điều luật. Mọi kết quả phải được người dùng/chuyên gia kiểm tra; nội dung trong `data/legal-supplement.json` được đánh dấu minh họa.

## Kiểm tra và lưu dữ liệu

- Người dùng có thể chỉnh sửa, chấp nhận, từ chối hoặc chạy lại gợi ý trước khi lưu.
- Gợi ý và lịch sử rà soát được lưu riêng theo tài khoản đăng nhập qua API có kiểm tra vai trò.
- Lịch sử rà soát chỉ lưu mức độ, mã lý do và thủ tục liên quan; không lưu phần mô tả tình huống người dùng nhập.
- Dàn ý chuyên gia chỉ được ghi vào bài viết khi chuyên gia chấp nhận, biên tập và bấm lưu bài viết.