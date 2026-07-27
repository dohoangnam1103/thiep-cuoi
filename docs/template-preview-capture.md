# Cập nhật ảnh preview mẫu thiệp

Ba biến thể preview của mỗi mẫu nằm tại:

- `listing/`: ảnh full-page rộng 768px, dùng trong danh sách và modal.
- `portrait/`: ảnh 750×1333, dùng trong carousel đầu trang.
- `landscape/`: ảnh 2400×1260, dùng cho metadata và chia sẻ.

Tạo lại cả ba biến thể cho toàn bộ 40 mẫu từ giao diện demo hiện tại:

```bash
npm run screenshots:templates
```

Mặc định lệnh trên thực hiện trọn quy trình:

1. Kết nối production qua SSH alias `minipc`.
2. Export riêng các thiệp `isDemo=true` và năm bảng nội dung liên quan, không tải toàn bộ DB người dùng.
3. Tạo SQLite backup của local trong `temp/demo-sync-backups/`.
4. Tải đúng các file `/uploads/...` mà demo production đang dùng.
5. Import demo vào local bằng transaction và chạy `quick_check`.
6. Chụp PNG full-page rồi sinh lại `listing`, `portrait`, `landscape`.
7. Cập nhật version URL để `next/image` và browser không dùng cache cũ.

Chạy thử một mẫu mà không ghi đè file:

```bash
npm run screenshots:templates -- --slug song-hy-red --no-write
```

`--no-write` cũng bỏ qua đồng bộ production để giữ đúng nghĩa dry-run.

Chỉ cập nhật một hoặc một vài mẫu:

```bash
npm run screenshots:templates -- --slug song-hy-red
npm run screenshots:templates -- --slug song-hy-red,song-hy-green
```

Nếu muốn dùng dữ liệu local hiện tại:

```bash
npm run screenshots:templates -- --no-sync-production
```

Script sẽ tự dùng server tại `http://127.0.0.1:3000` nếu đang chạy. Nếu không, nó khởi động một Next.js dev server tạm ở cổng `3200` và tự dừng sau khi hoàn tất.

Có thể đổi máy production bằng `CAPTURE_PRODUCTION_HOST` và
`CAPTURE_PRODUCTION_APP_DIR`. Thư mục production mặc định là
`/home/namdo/apps/thiepmungonline`, chứa `data/prod.db` và
`data/editor-uploads/`.

Nếu trang mẫu yêu cầu đăng nhập, script tự nạp `SESSION_SECRET` từ cấu hình local và tạo session capture tạm. Với server ngoài máy, truyền secret tương ứng qua `CAPTURE_SESSION_SECRET`.

Để chụp từ một server khác:

```bash
CAPTURE_BASE_URL=http://127.0.0.1:3100 npm run screenshots:templates
```

Mỗi trang được mở với `?capture=1` ở viewport CSS rộng `480px` và device scale `2x`. Cách này giữ nguyên bố cục mobile nhưng cho ảnh sắc nét hơn trên màn hình Retina. Chế độ capture bỏ qua phong bì 3D, nhạc và auto-scroll; script cuộn qua toàn bộ nội dung để tải ảnh, tắt animation, chụp một PNG full-page rồi sinh đồng bộ cả ba WebP. Ảnh chỉ được ghi đè sau khi toàn bộ mẫu được chọn vượt qua kiểm tra kích thước, tài nguyên và đường dẫn trùng lặp.

Sau khi ghi ảnh, script cập nhật `src/data/template-preview-version.ts`. Các nơi dùng `next/image` gắn version này vào URL để không lấy lại ảnh cũ từ image optimizer hoặc browser cache.
