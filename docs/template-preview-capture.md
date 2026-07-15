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

Để chụp từ một server khác:

```bash
CAPTURE_BASE_URL=http://127.0.0.1:3100 npm run screenshots:templates
```

Mỗi trang được mở với `?capture=1` ở viewport rộng `384px`. Chế độ này bỏ qua phong bì 3D, nhạc và auto-scroll; script cuộn qua toàn bộ nội dung để tải ảnh, tắt animation rồi xuất WebP. Ảnh chỉ được ghi đè sau khi toàn bộ mẫu được chọn vượt qua kiểm tra kích thước và tài nguyên.
