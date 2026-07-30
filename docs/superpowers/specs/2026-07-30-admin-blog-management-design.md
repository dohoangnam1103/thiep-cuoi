# Thiết kế trang quản trị blog

**Ngày:** 2026-07-30
**Trạng thái:** Đã được người dùng duyệt trong phiên thiết kế
**Phạm vi:** Quản lý bài viết blog trong admin, editor nội dung giàu định dạng, ảnh/video, xuất bản, thùng rác và chuyển dữ liệu blog tĩnh hiện có sang database.

## 1. Mục tiêu

Bổ sung khu vực quản trị blog tại `/admin/blogs` để admin có thể:

- Tạo bài viết mới.
- Lưu bài dưới trạng thái bản nháp hoặc đã xuất bản.
- Sửa bài và tự tạo lại slug từ tiêu đề mỗi lần lưu.
- Chuyển bài vào thùng rác, khôi phục hoặc xoá vĩnh viễn.
- Soạn nội dung trực quan bằng TipTap.
- Upload ảnh đại diện và ảnh nằm trong nội dung.
- Nhúng video YouTube hoặc video MP4 qua URL an toàn.

Trang blog public sẽ đọc bài từ database thay cho mảng tĩnh trong `src/data/chungdoi-content.ts`. Trong phạm vi này, bài viết chỉ được soạn bằng tiếng Việt và được hiển thị giống nhau ở tất cả locale hiện có.

## 2. Phạm vi không thực hiện

- Không xây hệ thống quản lý chuyên mục riêng; chuyên mục là trường nhập tự do.
- Không dịch từng bài sang `en`, `ko`, `ja`, `zh`.
- Không upload file video lên server.
- Không giữ redirect từ slug cũ khi đổi tiêu đề.
- Không có lịch hẹn giờ xuất bản.
- Không có version history, cộng tác nhiều người hoặc autosave.
- Không sao chép R2 hay API upload của project `news-aff`; Chung Đôi tiếp tục dùng hạ tầng lưu file local của chính dự án.

## 3. Hiện trạng

Blog public hiện lấy dữ liệu từ `blogPosts` trong `src/data/chungdoi-content.ts`. Mỗi phần tử chỉ có `slug`, `title` và `excerpt`. Trang chi tiết không có nội dung riêng mà hiển thị chung hai đoạn dịch `blog.cloneNote1` và `blog.cloneNote2`.

Admin hiện chưa có mục blog. Các trang admin xác thực qua `verifyAdmin()` hoặc `getCurrentAdmin()` và truy cập SQLite qua Prisma 7 với adapter `better-sqlite3`.

Project tham chiếu `news-aff` dùng TipTap và lưu HTML, hỗ trợ ảnh, liên kết, định dạng chữ và video. Chung Đôi sẽ áp dụng mô hình biên tập này nhưng dùng component, design token, auth, Prisma và storage sẵn có của Chung Đôi.

## 4. Kiến trúc được chọn

### 4.1. Lựa chọn

Dùng **Prisma + TipTap + HTML đã được làm sạch phía server**.

Lý do:

- Phù hợp với Prisma/SQLite và server action đang dùng trong Chung Đôi.
- HTML thuận tiện để nhập dữ liệu cũ và render trên trang public.
- TipTap cung cấp trải nghiệm trực quan giống luồng New Post của `news-aff`.
- Không cần xây renderer JSON riêng khi chưa có nhu cầu block editor phức tạp.

### 4.2. Các đơn vị chính

1. **Blog repository/query layer:** tập trung truy vấn bài admin và public, không để component tự lặp điều kiện trạng thái.
2. **Blog validation/sanitization:** kiểm tra form, tạo slug, chuẩn hoá URL video và làm sạch HTML.
3. **Blog server actions:** tạo, cập nhật, đưa vào thùng rác, khôi phục và xoá vĩnh viễn; mọi action đều xác thực admin.
4. **Blog editor:** client component TipTap dùng chung cho trang tạo và sửa.
5. **Blog media storage:** upload ảnh an toàn vào vùng lưu riêng, trả URL public ổn định và dọn file khi cần.
6. **Public blog rendering:** chỉ hiển thị bài đã xuất bản và chưa bị xoá.

Mỗi đơn vị có trách nhiệm riêng để validation, storage và UI có thể được kiểm thử độc lập.

## 5. Mô hình dữ liệu

Thêm model Prisma `BlogPost` với các trường dự kiến:

| Trường | Kiểu | Quy tắc |
|---|---|---|
| `id` | `String` | UUID/CUID theo quy ước hiện có của project |
| `title` | `String` | Bắt buộc |
| `slug` | `String @unique` | Sinh từ tiêu đề mỗi lần lưu |
| `excerpt` | `String` | Bắt buộc, admin nhập thủ công |
| `category` | `String?` | Nhập tự do |
| `contentHtml` | `String` | HTML TipTap đã làm sạch |
| `thumbnailUrl` | `String?` | Ảnh đại diện không bắt buộc |
| `status` | `String` | `draft` hoặc `published` |
| `publishedAt` | `DateTime?` | Ghi khi xuất bản lần đầu |
| `deletedAt` | `DateTime?` | Có giá trị khi ở thùng rác |
| `createdAt` | `DateTime` | Mặc định thời điểm tạo |
| `updatedAt` | `DateTime` | Tự cập nhật |

Không dùng trạng thái `deleted` riêng; `deletedAt` là nguồn quyết định duy nhất cho thùng rác. Một bài trong thùng rác giữ nguyên `status` trước đó để khi khôi phục trở lại đúng trạng thái cũ.

### 5.1. Quy tắc trạng thái

- `draft` + `deletedAt = null`: bản nháp đang hoạt động.
- `published` + `deletedAt = null`: bài public.
- `deletedAt != null`: bài trong thùng rác, không public bất kể `status`.
- Chuyển từ `draft` sang `published`: nếu `publishedAt` chưa có thì ghi thời điểm hiện tại.
- Chuyển từ `published` về `draft`: giữ `publishedAt` cũ nhưng bài biến mất khỏi public.
- Khôi phục: chỉ đặt `deletedAt = null`.

### 5.2. Slug

- Slug được tạo từ tiêu đề ở mọi lần tạo hoặc cập nhật bài.
- Nếu slug đã tồn tại ở bài khác, thêm hậu tố ổn định để bảo đảm unique.
- Bài trong thùng rác vẫn giữ slug và vẫn tham gia kiểm tra unique cho tới khi bị xoá vĩnh viễn.
- Không tạo redirect từ slug cũ; URL cũ có thể trả 404 sau khi đổi tiêu đề theo quyết định sản phẩm đã duyệt.

## 6. Giao diện quản trị

### 6.1. Điều hướng

Thêm mục **Bài viết** vào `NAV` trong admin layout, trỏ tới `/admin/blogs` và hiển thị cho mọi admin đã đăng nhập.

### 6.2. Danh sách `/admin/blogs`

Trang gồm:

- Tiêu đề “Bài viết”, số lượng phù hợp với bộ lọc hiện tại và nút **Tạo bài viết**.
- Bộ lọc: **Tất cả**, **Bản nháp**, **Đã xuất bản**, **Thùng rác**.
- Bảng responsive với các cột: ảnh đại diện, tiêu đề, chuyên mục, trạng thái, ngày cập nhật, thao tác.
- Empty state riêng cho từng bộ lọc.

Bài đang hoạt động có các thao tác:

- **Sửa**.
- **Xem bài** nếu đã xuất bản.
- **Chuyển vào thùng rác** sau xác nhận.

Bài trong thùng rác có:

- **Khôi phục**.
- **Xoá vĩnh viễn**, yêu cầu xác nhận rõ tên bài trước khi thực hiện.

Bộ lọc dùng search params để URL có thể tải lại/chia sẻ và server component truy vấn đúng tập dữ liệu.

### 6.3. Tạo và sửa

- `/admin/blogs/new`: tạo bài.
- `/admin/blogs/[id]`: sửa bài.
- Hai route dùng chung component form để tránh lệch hành vi.

Các trường theo thứ tự:

1. Tiêu đề, bắt buộc.
2. Slug xem trước, chỉ đọc và cập nhật theo tiêu đề.
3. Mô tả ngắn, bắt buộc.
4. Chuyên mục, không bắt buộc.
5. Ảnh đại diện, không bắt buộc; hỗ trợ chọn ảnh, xem trước và bỏ ảnh.
6. Nội dung TipTap, bắt buộc có nội dung có nghĩa sau khi bỏ markup rỗng.
7. Trạng thái: **Bản nháp** hoặc **Đã xuất bản**.
8. Nút **Lưu bài viết** và **Huỷ**.

Khi submit lỗi, form giữ dữ liệu người dùng đang nhập và hiển thị lỗi tổng quát hoặc lỗi tại trường liên quan. Khi lưu thành công, chuyển về `/admin/blogs` và hiển thị thông báo thành công trên trang danh sách.

## 7. Trình soạn thảo TipTap

Editor hỗ trợ:

- Paragraph.
- Heading 1, 2 và 3.
- Bold, italic, underline, strike.
- Bullet list và ordered list.
- Blockquote.
- Link.
- Căn trái, giữa và phải.
- Horizontal rule.
- Upload/chèn ảnh.
- Chèn video YouTube hoặc HTTPS `.mp4`.

Editor được tải client-side để tránh lỗi SSR. Toolbar phải có nhãn truy cập hoặc tooltip rõ ràng và trạng thái active. Nội dung được lưu dạng HTML nhưng server không tin HTML từ client.

### 7.1. Video

- YouTube nhận URL dạng `youtube.com/watch`, `youtu.be` hoặc URL embed hợp lệ và chuẩn hoá thành video ID/node được kiểm soát.
- MP4 chỉ nhận URL HTTPS có pathname kết thúc bằng `.mp4`.
- Không nhận iframe HTML do admin dán trực tiếp.
- Không hỗ trợ URL iframe tuỳ ý hoặc Videy trong phạm vi này.
- Renderer public chỉ sinh markup từ node/thuộc tính đã nằm trong allowlist.

## 8. Upload và vòng đời ảnh

### 8.1. Upload

Tạo endpoint upload dành riêng cho blog, xác thực admin trước khi xử lý. Endpoint:

- Chấp nhận các định dạng ảnh được project hỗ trợ.
- Kiểm tra MIME, extension và signature thực của file.
- Giới hạn dung lượng request và từng file.
- Chuyển ảnh sang WebP bằng pipeline xử lý ảnh hiện có.
- Giới hạn kích thước pixel để tránh ảnh quá lớn.
- Tạo tên file ngẫu nhiên trong thư mục blog riêng.
- Trả URL public qua route phục vụ file tương ứng.

Ảnh đại diện và ảnh nội dung dùng cùng endpoint nhưng truyền mục đích upload rõ ràng. Ảnh đại diện được giới hạn trong khung tối đa 1600 × 900 px; ảnh nội dung được giới hạn tối đa 2000 × 2000 px. Cả hai dùng chung giới hạn dung lượng file đầu vào và pipeline WebP.

### 8.2. Dọn file

- Đưa bài vào thùng rác không xoá file.
- Khôi phục không thay đổi file.
- Khi cập nhật bài, so sánh tập URL ảnh thuộc storage blog trước và sau khi lưu để dọn các ảnh bị loại khỏi bài.
- Xoá vĩnh viễn sẽ dọn ảnh đại diện và toàn bộ ảnh blog-owned còn được tham chiếu trong nội dung.
- Chỉ xoá file thuộc namespace/storage của blog; không xoá URL ngoài hoặc asset dùng chung.
- Dọn file là best-effort sau khi thay đổi database thành công và phải log lỗi để tránh làm thất bại dữ liệu bài viết chỉ vì filesystem tạm lỗi.

Ảnh đã upload nhưng người dùng rời form trước khi lưu có thể trở thành file mồ côi. Phạm vi đầu tiên chấp nhận dọn theo cơ chế định kỳ hoặc tuổi file thay vì xoá ngay, vì client không thể xác định chắc chắn file còn được tab khác sử dụng hay không.

## 9. Validation và bảo mật

### 9.1. Server action

Mọi action quản trị phải:

1. Gọi `verifyAdmin()` trước khi đọc hoặc ghi dữ liệu nhạy cảm.
2. Parse input bằng Zod.
3. Không tin `id`, `status`, URL hoặc HTML từ client.
4. Dùng transaction cho các thay đổi database cần tính nguyên tử.
5. Revalidate các route/tag blog liên quan sau khi ghi.

### 9.2. HTML sanitizer

Sanitizer dùng allowlist cho các tag và attribute TipTap cần. Loại bỏ tối thiểu:

- `script`, `style`, event handler `on*`.
- `javascript:` và data URL không được phép.
- iframe tuỳ ý.
- CSS/style tự do ngoài các thuộc tính do renderer kiểm soát.
- Tag/attribute không nằm trong allowlist.

Link ngoài phải có thuộc tính an toàn phù hợp khi mở tab mới. Ảnh chỉ giữ `src`, `alt`, `title` cần thiết; URL ảnh được kiểm tra theo chính sách đã định.

### 9.3. Public query

Query public luôn áp dụng cả hai điều kiện:

- `status = published`.
- `deletedAt = null`.

Trang chi tiết trả 404 cho slug không tồn tại, bản nháp hoặc bài trong thùng rác. Không dựa vào việc ẩn link ở UI để bảo vệ dữ liệu.

## 10. Trang blog public

### 10.1. Danh sách

`/[locale]/blog` chuyển sang truy vấn database và hiển thị:

- Ảnh đại diện nếu có.
- Tiêu đề.
- Mô tả ngắn.
- Chuyên mục nếu có.
- Ngày đăng.
- Liên kết đọc bài.

Bài không có ảnh vẫn dùng card chữ cân đối như giao diện blog hiện tại. Danh sách sắp theo `publishedAt` giảm dần, sau đó `createdAt` giảm dần để có thứ tự ổn định.

### 10.2. Chi tiết

`/[locale]/blog/[slug]` hiển thị:

- Tiêu đề, mô tả, chuyên mục và ngày đăng.
- Ảnh đại diện nếu có.
- HTML nội dung đã làm sạch với typography dành cho bài dài.
- Ảnh responsive và video tỷ lệ 16:9.
- Tối đa ba bài liên quan đã xuất bản, ưu tiên cùng chuyên mục rồi mới lấy bài mới nhất khác.

Metadata dùng tiêu đề và mô tả ngắn. Sitemap/SEO hiện tại phải được cập nhật để URL bài database có thể được khám phá khi chính sách `robots` của blog được bật; việc thay đổi chính sách index hiện tại không nằm trong yêu cầu này.

Mọi locale hiện hiển thị cùng nội dung tiếng Việt. Khung giao diện như nhãn “Đọc thêm”, “Bài liên quan” tiếp tục dùng `next-intl`.

## 11. Chuyển dữ liệu blog cũ

Tạo migration dữ liệu idempotent cho 12 bài trong `blogPosts` hiện tại:

- Giữ nguyên `title`, `slug` và `excerpt`.
- Đặt `status = published`.
- Đặt nội dung ban đầu thành hai đoạn nội dung mẫu tương ứng với `blog.cloneNote1` và `blog.cloneNote2` bản tiếng Việt.
- Không đặt ảnh đại diện.
- Chuyên mục có thể để trống.
- Dùng slug làm khoá kiểm tra để chạy lại không tạo bản ghi trùng.

Sau khi migration và code public mới hoạt động, loại bỏ nguồn blog tĩnh hoặc giữ lại chỉ những type/dữ liệu khác không liên quan. Không để hai nguồn dữ liệu blog cùng tồn tại trong runtime.

Dữ liệu seed phải chạy được trong quy trình deploy production hiện có. Migration schema và bước seed/backfill cần tách rõ nếu Prisma migration SQL không phù hợp để nhúng chuỗi HTML dài.

## 12. Xử lý lỗi

- Validation thất bại: trả lỗi tiếng Việt có thể hành động được và giữ dữ liệu form.
- Slug trùng: tự tạo hậu tố, không yêu cầu admin xử lý thủ công.
- Upload sai loại/quá lớn: từ chối trước khi ghi file hoặc dọn file tạm đã tạo.
- Bài không tồn tại hoặc đã đổi trạng thái giữa hai thao tác: trả lỗi không tìm thấy/xung đột và không báo thành công giả.
- Xoá vĩnh viễn: database là nguồn sự thật; lỗi dọn file được log và có thể dọn lại sau.
- Lỗi render media: phần còn lại của bài vẫn hiển thị; media lỗi có fallback phù hợp.

## 13. Kiểm thử và xác minh

### 13.1. Unit test

- Schema validation cho title, excerpt, category, content và status.
- Slug tiếng Việt, tiêu đề rỗng, ký tự đặc biệt và xử lý trùng.
- HTML sanitizer chặn script, event handler, URL nguy hiểm và iframe ngoài allowlist.
- Chuẩn hoá URL YouTube và kiểm tra HTTPS MP4.
- Trích xuất URL ảnh blog-owned để dọn file.
- Quy tắc trạng thái và `publishedAt`.

### 13.2. Integration/server test

- Admin có thể tạo bản nháp và bài đã xuất bản.
- Không có admin thì mọi action CRUD/upload bị từ chối.
- Sửa tiêu đề đổi slug và public URL cũ trả 404.
- Bản nháp không xuất hiện trong query public.
- Bài trong thùng rác không xuất hiện public.
- Khôi phục trả bài về trạng thái trước đó.
- Xoá vĩnh viễn xoá record và gọi dọn đúng file blog-owned.
- Danh sách/chi tiết public chỉ lấy bài hợp lệ.

### 13.3. Gate runtime

Smoke test bằng trình duyệt thật:

1. Đăng nhập admin.
2. Tạo bài nháp có heading, link, ảnh và video.
3. Xác nhận bài chưa xuất hiện public.
4. Sửa và xuất bản; xác nhận danh sách và chi tiết hiển thị đúng.
5. Đổi tiêu đề; xác nhận slug mới hoạt động và slug cũ 404.
6. Chuyển vào thùng rác; xác nhận public 404.
7. Khôi phục; xác nhận public trở lại nếu trạng thái là published.
8. Xoá vĩnh viễn; xác nhận record và file liên quan được dọn.
9. Kiểm tra desktop và mobile, đặc biệt ảnh/video không gây tràn ngang.

### 13.4. Gate repository

Chạy tối thiểu:

```bash
npm run prisma:generate
npm run typecheck
npm run typecheck:tests
npm run test:unit
npm run lint
NEXT_PUBLIC_SITE_URL=https://thiepmungonline.com SITE_URL=https://thiepmungonline.com npm run build
git diff --check
```

Lint phải không có error mới; warning nền có sẵn cần được ghi rõ.

## 14. Tiêu chí hoàn thành

- Admin có mục **Bài viết** và truy cập được danh sách blog.
- Tạo, sửa, lưu nháp, xuất bản hoạt động với validation server.
- TipTap hỗ trợ đầy đủ định dạng, ảnh và video trong phạm vi đã chốt.
- Ảnh upload được kiểm tra và chuyển WebP bằng storage local của Chung Đôi.
- Bài có thể chuyển thùng rác, khôi phục và xoá vĩnh viễn.
- Public không bao giờ hiển thị bản nháp hoặc bài trong thùng rác.
- Đổi tiêu đề tạo slug mới và xử lý trùng an toàn.
- 12 bài cũ được chuyển sang database ở trạng thái đã xuất bản, giữ slug và dùng hai đoạn mẫu chung.
- Danh sách và chi tiết blog render nội dung database, ảnh và video responsive.
- Sanitizer và URL allowlist ngăn HTML/video tuỳ ý nguy hiểm.
- Unit test, integration test, typecheck, lint error gate và production build đều đạt.
