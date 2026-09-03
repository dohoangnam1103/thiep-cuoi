# Cập nhật ảnh preview mẫu thiệp

PNG gốc và ba biến thể preview của mỗi mẫu nằm tại:

- `png/`: PNG full-page rộng 960px, giữ lại bản chụp gốc để xem/tải xuống.
- `listing/`: ảnh full-page rộng 768px, dùng trong danh sách và modal.
- `portrait/`: ảnh 750×1333, dùng trong carousel đầu trang.
- `landscape/`: ảnh 2400×1260, dùng cho metadata và chia sẻ.

## Chụp trực tiếp production — ưu tiên khi có Google Maps

Không cần đồng bộ SQLite hoặc tải album về local. Trình duyệt chạy trên Mac
nhưng mở đúng domain production, sử dụng nội dung/ảnh và cấu hình Maps đang live:

```bash
CAPTURE_BASE_URL=https://thiepmungonline.com \
CAPTURE_CONCURRENCY=2 \
CAPTURE_AUDIT_DIR=/tmp/thiepmung-capture-audit \
npm run screenshots:templates -- --no-sync-production
```

Chạy thử một mẫu trước bằng cách thêm `--slug minimalism-purple --no-write`.
Chỉ dùng origin production tin cậy; không bỏ hạn chế API key hay giả mạo referrer.
Google Maps phải tải được tile và không báo lỗi API/quyền truy cập trước khi
script rasterize iframe. Nếu map lỗi hoặc chưa tải xong, toàn bộ lần chạy dừng
trước khi thay asset. Script xử lý từng iframe bằng handle ổn định, kể cả thiệp
có nhiều bản đồ. `CAPTURE_AUDIT_DIR` lưu riêng ảnh từng map và `capture-audit.json`
để kiểm tra; không đưa URL chứa API key vào báo cáo.

PNG/WebP vẫn được tạo trên máy chạy script; sau khi kiểm tra cần deploy ảnh và
manifest mới bằng quy trình VPS hiện có. Đây chưa phải tính năng nút chụp trong
admin hoặc worker chạy trên VPS.

## Chụp với dữ liệu đồng bộ về local

Tạo lại PNG và ba biến thể cho toàn bộ mẫu chưa rút khỏi catalog từ giao diện demo hiện tại (53 mẫu tại thời điểm 2026-08-31):

```bash
npm run screenshots:templates
```

Mặc định lệnh trên thực hiện trọn quy trình:

1. Kết nối production qua SSH `root@163.223.9.198` (VPS hiện tại; không dùng minipc).
2. Export riêng các thiệp `isDemo=true` và năm bảng nội dung liên quan, không tải toàn bộ DB người dùng.
3. Tạo SQLite backup của local trong `temp/demo-sync-backups/`.
4. Tải đúng các file `/uploads/...` mà demo production đang dùng.
5. Import demo vào local bằng transaction và chạy `quick_check`.
6. Lưu PNG full-page vào `public/chungdoi/images/template-previews/en/png/`, rồi sinh lại `listing`, `portrait`, `landscape`.
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

Trên máy đủ RAM có thể chụp tối đa 4 mẫu đồng thời (mặc định 1):

```bash
CAPTURE_CONCURRENCY=3 npm run screenshots:templates
```

Các bản chụp vẫn được kiểm tra hết trước khi thay asset; nếu một mẫu lỗi, script chờ các mẫu cùng nhóm kết thúc rồi dừng, không cài bộ ảnh dở dang. Nút debug Next.js của server dev được ẩn trong ảnh.

Script sẽ tự dùng server tại `http://127.0.0.1:3000` nếu đang chạy. Nếu không, nó khởi động một Next.js dev server tạm tại `http://localhost:3200` và tự dừng sau khi hoàn tất. Hostname của server phải khớp `localhost` để tránh vòng lặp rewrite của Next.js 16/next-intl khi bind vào `127.0.0.1`.

Có thể đổi máy production bằng `CAPTURE_PRODUCTION_HOST` và
`CAPTURE_PRODUCTION_APP_DIR`. Thư mục production mặc định là
`/srv/thiepmungonline`, chứa `data/prod.db` và
`data/editor-uploads/`.

Nếu trang mẫu yêu cầu đăng nhập, script tự nạp `SESSION_SECRET` từ cấu hình local và tạo session capture tạm. Với server ngoài máy, truyền secret tương ứng qua `CAPTURE_SESSION_SECRET`.

Để chụp từ một server khác:

```bash
CAPTURE_BASE_URL=http://localhost:3100 npm run screenshots:templates
```

Mỗi trang được mở với `?capture=1` ở viewport CSS rộng `480px` và device scale `2x`. Cách này giữ nguyên bố cục mobile nhưng cho ảnh sắc nét hơn trên màn hình Retina. Chế độ capture bỏ qua phong bì 3D, nhạc và auto-scroll; script cuộn qua toàn bộ nội dung để tải ảnh, tắt animation, chụp một PNG full-page rồi sinh đồng bộ cả ba WebP. Ảnh chỉ được ghi đè sau khi toàn bộ mẫu được chọn vượt qua kiểm tra kích thước, tài nguyên và đường dẫn trùng lặp.

Sau khi ghi ảnh, script cập nhật `src/data/template-preview-version.ts`. Các nơi dùng `next/image` gắn version này vào URL để không lấy lại ảnh cũ từ image optimizer hoặc browser cache.

Build tự chạy `scripts/prepare-listing-thumbnails.mjs` để tạo lại các thumbnail crop có tên theo hash nội dung. Các thumbnail mobile do admin upload riêng được giữ nguyên; chụp lại demo không ghi đè lựa chọn này.

Để tránh ảnh hưởng các thay đổi đang làm dở, nên chạy trong một bản source riêng khớp production, dùng SQLite riêng qua `DATABASE_URL` và server loopback riêng qua `CAPTURE_BASE_URL`. Chỉ dữ liệu demo được import từ production vào local; deploy không đẩy SQLite local ngược lên production.

Danh sách loại trừ lấy từ cả `retiredTemplateRouteSlugs` và `retiredTemplateSlugs` trong catalog, bao gồm các mẫu trả về 404 trực tiếp (không chỉ những mẫu có redirect).
