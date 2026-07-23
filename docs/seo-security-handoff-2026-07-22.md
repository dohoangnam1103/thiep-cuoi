# SEO & Google Search Console handoff — 2026-07-22

## Mục tiêu

Hoàn thiện SEO kỹ thuật cho `https://thiepmungonline.com`, đồng thời xử lý cảnh báo Google Search Console **Security issues → Deceptive pages** trước khi gửi yêu cầu Google review.

> Trạng thái hiện tại: **chưa hoàn tất**. Code SEO local đã có và các test tập trung đã pass, nhưng thay đổi chưa commit/push, production đang ở trạng thái cập nhật một phần, sitemap live vẫn là bản cũ và Search Console vẫn còn cảnh báo bảo mật.

## Những phần đã làm trong code local

### Canonical và redirect

- Redirect host `www.thiepmungonline.com` về `thiepmungonline.com` bằng 308.
- Redirect HTTP về HTTPS khi proxy cung cấp `x-forwarded-proto: http`.
- Chuẩn hóa URL template về URL demo canonical, ví dụ:
  - `/mau-thiep/song-hy-do` → `/mau-thiep/song-hy-do/demo`
  - Các URL template theo locale cũng được chuẩn hóa slug/path tương ứng.
- Chuyển redirect của trang template sang `permanentRedirect()`.

File liên quan:

- `next.config.ts`
- `src/proxy.ts`
- `src/lib/seo-redirects.ts`
- `src/lib/seo-redirects.test.ts`
- `src/data/template-route-slugs.ts`
- `src/app/[locale]/templates/[slug]/page.tsx`

### Robots, noindex và upload

- `robots.txt` chỉ chặn `/api/` để crawler vẫn đọc được thẻ robots trên các trang `noindex`.
- `/uploads/:path*` nhận header:

  ```text
  X-Robots-Tag: noindex, nofollow, nosnippet, noarchive
  ```

- Các khu vực auth/dashboard/admin/editor đã được cấu hình `noindex, nofollow`.
- Các locale chưa hoàn chỉnh (`en`, `ko`, `ja`, `zh`) vẫn truy cập được nhưng đặt `noindex, follow`.
- Hiện chỉ tiếng Việt được khai báo là locale có thể index.

File liên quan:

- `src/app/robots.ts`
- `next.config.ts`
- `src/i18n/routing.ts`
- `src/app/[locale]/layout.tsx`
- Các layout trong `src/app/(auth)`, `src/app/dashboard`, `src/app/admin`, `src/app/editor`, `src/app/(cohost)` và `src/app/thiep`.

### Sitemap và metadata

- Sitemap local đã loại bỏ blog, template demo và locale chưa hoàn chỉnh.
- Sitemap local hiện còn 9 URL tiếng Việt có nội dung đủ điều kiện index.
- Không ghi `lastModified` giả và không xuất alternate locale chưa index.
- Canonical của locale hiện tại vẫn là self-referencing canonical.
- `hreflang` chỉ quảng bá locale indexable và có `x-default` về tiếng Việt.
- Đã thêm mã Google site verification vào metadata.

File liên quan:

- `src/app/sitemap.ts`
- `src/app/seo-routes.test.ts`
- `src/lib/seo.ts`
- `src/lib/seo.test.ts`
- `src/app/[locale]/layout.tsx`
- `src/app/[locale]/templates/layout.tsx`

### Chặn open redirect ở luồng đăng nhập

- Đã thêm `safeAuthReturnPath()` để chỉ chấp nhận đường dẫn nội bộ hợp lệ.
- Luồng login và Google auth complete dùng URL quay lại đã được lọc.

File liên quan:

- `src/lib/auth-redirects.ts`
- `src/lib/auth-redirects.test.ts`
- `src/app/(auth)/AuthForm.tsx`
- `src/app/auth/google/complete/route.ts`

## Kết quả kiểm tra gần nhất

### Local

- `npm run typecheck:tests`: pass.
- Nhóm test SEO/auth tập trung: **10/10 pass**.
- Các case đã kiểm tra gồm sitemap, robots, safe auth redirects, canonical template redirects, canonical host/HTTPS và canonical/hreflang.

Trước khi release cần chạy lại đầy đủ:

```bash
npm run check
```

Nếu cần kiểm tra nhanh riêng test:

```bash
npm run typecheck:tests
npm run test:unit
```

### Production

Các điểm đã xác nhận:

- `https://thiepmungonline.com/` trả về 200.
- `https://www.thiepmungonline.com/` redirect 308 về non-www.
- HTTP redirect 308 sang HTTPS.
- URL upload không tồn tại trả 404 kèm `X-Robots-Tag: noindex, nofollow, nosnippet, noarchive`.
- `/login`, `/signup`, `/dashboard`, `/admin`: `noindex, nofollow`.
- `/mau-thiep`: `index, follow`, canonical về `/mau-thiep`.
- `/vi/templates`: canonical về `/mau-thiep`.
- `/en/templates`: `noindex, follow` và self-canonical.
- `/mau-thiep/song-hy-do`: redirect 308 về `/mau-thiep/song-hy-do/demo`.

Điểm chưa đạt:

- `https://thiepmungonline.com/sitemap.xml` vẫn trả sitemap cũ có **48 URL**, bao gồm các template demo.
- Thêm cache-busting query vẫn nhận 48 URL, nên chưa thể kết luận đây chỉ là cache CDN.
- Sitemap local mới chỉ có 9 URL. Production vì vậy đang không đồng bộ với source local.

## Trạng thái Google Search Console

- Property: `https://thiepmungonline.com/`.
- Mục **Security issues** vẫn hiển thị **1 issue detected**.
- Loại lỗi: **Deceptive pages**.
- Google không đưa URL mẫu, phần **Sample URLs** hiển thị `N/A`.
- Nút **REQUEST REVIEW** đang khả dụng nhưng **chưa bấm**.

Lưu ý quan trọng: `robots`, `noindex`, canonical và sitemap chỉ là biện pháp SEO/crawl control. Chúng không tự động xóa cảnh báo Safe Browsing/Deceptive pages. Chỉ gửi review sau khi đã kiểm tra và xử lý được nguyên nhân bảo mật thực tế.

## Trạng thái Git lúc dừng

- Branch: `master`.
- HEAD local và `origin/master`: `e6d0760`.
- Các thay đổi SEO nói trên vẫn nằm trong worktree, chưa commit/push.
- Worktree còn nhiều thay đổi khác, bao gồm phần carousel/homepage; không được gom commit hoặc deploy toàn bộ một cách thiếu kiểm soát.

Kiểm tra lại trước khi làm tiếp:

```bash
git status --short
git diff -- src/app/robots.ts src/app/sitemap.ts src/lib/seo.ts src/proxy.ts next.config.ts
```

## Checklist chạy tiếp ngày mai

1. Đọc file này và kiểm tra `git status` để không ghi đè thay đổi đang dở.
2. Rà toàn bộ diff SEO/auth, tách rõ khỏi thay đổi carousel và các thay đổi không liên quan.
3. Điều tra nguyên nhân **Deceptive pages** ở production:
   - Kiểm tra HTML/script thực tế và redirect bất thường trên các route public.
   - Kiểm tra nội dung trong uploads, file lạ, iframe/form/CTA giả mạo hoặc JavaScript bị chèn.
   - Kiểm tra response theo user-agent Googlebot/mobile và so sánh với trình duyệt thường để loại trừ cloaking.
   - Kiểm tra log server/reverse proxy, dependency và dấu hiệu tài khoản hoặc máy chủ bị xâm nhập.
   - Không kết luận cảnh báo đã sạch chỉ dựa vào việc Search Console không cung cấp sample URL.
4. Chạy `npm run check` và sửa mọi lỗi phát sinh.
5. Deploy có kiểm soát đúng các file SEO đã xác nhận, không deploy tràn toàn bộ dirty worktree.
6. Sau deploy, kiểm tra lại production:
   - canonical host và HTTPS redirect;
   - robots/noindex của route private và locale chưa index;
   - header của `/uploads/*`;
   - sitemap phải còn đúng 9 URL dự kiến;
   - các redirect template phải không tạo loop.
7. Chỉ khi production sạch và đồng bộ mới mở Search Console, bấm **REQUEST REVIEW**, mô tả ngắn gọn nguyên nhân đã xử lý và các biện pháp phòng ngừa.
8. Theo dõi Search Console cho tới khi Google trả kết quả review; việc bấm review không đồng nghĩa cảnh báo được gỡ ngay.

## Tiêu chí hoàn tất

- `npm run check` pass.
- Code SEO được commit và push có phạm vi rõ ràng.
- Production chạy đúng bản code mới.
- Sitemap live đúng danh sách URL indexable dự kiến.
- Không còn redirect/canonical/noindex sai hoặc loop.
- Đã chứng minh không còn nội dung/hành vi deceptive trên production.
- Đã gửi Request Review và ghi lại thời điểm gửi.
- Google Search Console xác nhận Security issue đã được gỡ.
