# Cập nhật ảnh preview mẫu thiệp

Ảnh cuộn khi hover trong danh sách mẫu nằm tại:

`public/chungdoi/images/template-previews/en/listing/`

Tạo lại toàn bộ 39 ảnh từ giao diện demo hiện tại:

```bash
npm run screenshots:templates
```

Chạy thử một mẫu mà không ghi đè file:

```bash
npm run screenshots:templates -- --slug song-hy-red --no-write
```

Chỉ cập nhật một hoặc một vài mẫu:

```bash
npm run screenshots:templates -- --slug song-hy-red
npm run screenshots:templates -- --slug song-hy-red,song-hy-green
```

Script sẽ tự dùng server tại `http://127.0.0.1:3000` nếu đang chạy. Nếu không, nó khởi động một Next.js dev server tạm ở cổng `3200` và tự dừng sau khi hoàn tất.

Nếu trang mẫu yêu cầu đăng nhập, script tự nạp `SESSION_SECRET` từ cấu hình local và tạo session capture tạm. Với server ngoài máy, truyền secret tương ứng qua `CAPTURE_SESSION_SECRET`.

Để chụp từ một server khác:

```bash
CAPTURE_BASE_URL=http://127.0.0.1:3100 npm run screenshots:templates
```

Mỗi trang được mở với `?capture=1` ở viewport CSS rộng `384px` và device scale `2x`, nên WebP đầu ra rộng `768px`. Cách này giữ nguyên bố cục mobile nhưng cho ảnh sắc nét hơn trên màn hình Retina. Chế độ capture bỏ qua phong bì 3D, nhạc và auto-scroll; script cuộn qua toàn bộ nội dung để tải ảnh, tắt animation rồi xuất WebP. Ảnh chỉ được ghi đè sau khi toàn bộ mẫu được chọn vượt qua kiểm tra kích thước và tài nguyên.
