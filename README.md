# LegalPath — Điều hướng thông tin pháp lý phổ thông

Ứng dụng web tiếng Việt với các không gian công khai, người dùng, chuyên gia, biên tập viên và quản trị viên. Đây là dự án học tập; thông tin pháp lý chỉ mang tính tham khảo và cần đối chiếu cơ quan có thẩm quyền.

## Tài liệu dự án

- [Đề xuất và phân tích sản phẩm](docs/project-proposal.md)
- [Vai trò và chức năng](docs/roles-and-features.md)
- [User Flow](docs/user-flow.md)
- [Danh sách màn hình](docs/screen-list.md)
- [Bảng kiểm kê 12 cột](docs/screen-inventory.md)
- [Phân công thành viên và minh chứng](docs/team-assignment.md)
- [Báo cáo sử dụng AI](docs/ai-usage-report.md)
- [Đặc tả mockup Figma/Canva](design/figma-mockup-spec.md)
- [Liên kết Figma hiện có và trạng thái xác minh](design/figma-link.txt)

## Chạy ứng dụng local

### Yêu cầu

- Node.js và `npx` (khuyến nghị Node.js 18 trở lên).
- VS Code với extension Live Server, hoặc một static web server tương đương.
- Kết nối mạng trong lần đầu chạy `npx` để tải JSON Server nếu máy chưa có package trong cache.

### 1. Mở thư mục dự án

Mở thư mục `CSE112-BTCK` trong VS Code. Các lệnh dưới đây đều chạy từ thư mục này.

### 2. Chuẩn bị dữ liệu tài khoản local

Chạy một lần trong PowerShell:

```powershell
if (-not (Test-Path "api\users.json")) {
  Copy-Item "api\users.example.json" "api\users.json"
}
```

`api/users.json` chứa tài khoản local và được `.gitignore` loại khỏi Git. Không commit dữ liệu tài khoản, mật khẩu hay thông tin cá nhân. Tệp mẫu ban đầu không có user; mở trang đăng ký để tạo tài khoản thử nghiệm sau khi API chạy.

### 3. Khởi động JSON Server

Mở **4 terminal riêng**, mỗi terminal giữ một tiến trình chạy. Chạy mỗi lệnh từ thư mục `CSE112-BTCK`:

```powershell
npx --yes json-server@0.17.4 api/users.json --host 127.0.0.1 --port 3000
```

```powershell
npx --yes json-server@0.17.4 api/legal-procedures.json --host 127.0.0.1 --port 3001
```

```powershell
npx --yes json-server@0.17.4 api/experts.json --host 127.0.0.1 --port 3002
```

```powershell
npx --yes json-server@0.17.4 api/expert-content.json --host 127.0.0.1 --port 3003
```

Các endpoint chính:

| Dữ liệu | Endpoint |
|---|---|
| Tài khoản | `http://localhost:3000/list-user` |
| Lĩnh vực và thủ tục | `http://localhost:3001/list-luat` |
| Danh bạ chuyên gia | `http://localhost:3002/experts_directory` |
| Bài viết/checklist | `http://localhost:3003/expert_content/portal` |
| Thông báo | `http://localhost:3003/notifications` |

Xác nhận mỗi API trả JSON bằng cách mở endpoint tương ứng trong trình duyệt hoặc chạy:

```powershell
curl.exe --fail --show-error http://localhost:3001/list-luat
```

Chi tiết schema và các thao tác đọc/lưu được ghi trong [api/README.md](api/README.md).

### 4. Mở giao diện

Trong VS Code Explorer, mở `index-phapli/phapli.html`, chọn **Open with Live Server**. Địa chỉ thường có dạng `http://127.0.0.1:5500/index-phapli/phapli.html`. Dùng trang này để vào khu vực công khai; các trang role khác có trong [danh sách màn hình](docs/screen-list.md).

Nếu dữ liệu không tải được, kiểm tra cả bốn terminal JSON Server, port đang dùng, và Console/Network trong DevTools. Khi dùng một HTTP static server thay Live Server, không mở trang trực tiếp bằng `file://`.

> **Xung đột cổng editor:** `editor/File/server.js` cũng bind `127.0.0.1:3000`, trong khi JSON Server tài khoản dùng cổng 3000. Không thể chạy cả hai tiến trình cùng lúc trên cùng địa chỉ/cổng. Bản editor server dùng API riêng `/api/*`, không thay thế endpoint `/list-user`; nhóm cần thống nhất một backend hoặc đổi cấu hình/API trước khi demo kết hợp editor và đăng nhập.

## Triển khai (Deployment)

### Giới hạn quan trọng trước khi public

Các trang hiện gọi API bằng URL `http://localhost:3000` đến `http://localhost:3003`. Khi người xem mở website đã deploy, `localhost` là **máy của chính người xem**, không phải máy phát triển hay hosting. Vì vậy, chỉ upload HTML/CSS/JS lên GitHub Pages, Netlify hoặc Vercel **không làm API hoạt động**; API JSON Server local cũng không phải backend production.

**Chưa ghi nhận URL deployment hoặc production API đã cấu hình cho repository này.** Không trình bày deployment là hoạt động hoàn chỉnh cho tới khi kiểm tra trực tiếp từ URL công khai.

### Chuẩn bị backend cho website công khai

1. Chọn và triển khai một backend/API có thể truy cập công khai; tạo dữ liệu demo không chứa thông tin cá nhân thật.
2. Cấu hình CORS chỉ cho phép origin của website.
3. Cập nhật các URL API đang khai báo trong JavaScript để dùng endpoint production (không dùng `localhost`); kiểm tra tất cả trang đăng nhập, tài khoản, thủ tục, chuyên gia, nội dung và thông báo.
4. Không đưa API key, secret, thông tin tài khoản hay dữ liệu nhạy cảm vào mã frontend hoặc repository công khai.
5. Kiểm tra đọc/tạo/cập nhật/duyệt, quyền truy cập, lưu sau khi tải lại, lỗi mạng và trạng thái rỗng từ origin production.

JSON Server local hiện là dữ liệu thử nghiệm, không có bảo vệ truy cập phù hợp để public làm backend của ứng dụng.

### Deploy frontend tĩnh

Sau khi backend production và URL API đã được cấu hình:

- **GitHub Pages:** đẩy mã lên remote, vào **Settings → Pages**, chọn branch/folder chứa site, lưu và chờ URL được cấp.
- **Netlify/Vercel:** import repository, chọn thư mục `CSE112-BTCK` làm publish/root directory và triển khai như static site; không cần build command nếu chỉ phục vụ các file HTML/CSS/JS hiện có.

Sau khi deploy, mở `https://<domain-hoặc-project-url>/index-phapli/phapli.html` (trang chính hiện nằm trong thư mục `index-phapli`, không nằm ở root). Dùng cửa sổ riêng tư hoặc thiết bị khác để xác nhận trang và API tải thành công, thử một thao tác ghi dữ liệu, tải lại để kiểm tra lưu bền vững và rà Console/Network không có lỗi CORS hoặc `localhost`. Ghi URL đã xác minh vào README sau khi hoàn tất.

## Trạng thái hồ sơ minh chứng

Tài liệu được bổ sung dựa trên repository và lịch sử prompt có trong phiên làm việc này. Người phụ trách, ID Trello/Jira/Notion, feature branch, PR/review, deployment và OBS cần thành viên xác nhận; các placeholder trong inventory không phải bằng chứng đã hoàn thành. Đặc tả mockup chưa thay thế mockup Figma/Canva thực tế.
