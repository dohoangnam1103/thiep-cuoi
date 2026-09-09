# Template SEO Detail Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo trang chi tiết indexable cho từng mẫu thiệp để Google đọc được nội dung mô tả, thay vì chỉ thấy lớp demo tương tác; giữ nguyên popup chọn mẫu, CTA tạo thiệp và đường dẫn demo.

**Architecture:** `/mau-thiep/[slug]` là trang SEO server-rendered có nội dung thật và canonical chính. `/mau-thiep/[slug]/demo` chỉ phục vụ trải nghiệm thiệp tương tác, đặt `noindex,follow` và canonical về detail. Listing, facet pages và bài blog liên kết bằng thẻ `<a>` thật tới detail; click trái vào ảnh vẫn mở popup. Slug cũ được chuẩn hóa bằng redirect 301.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, next-intl, Metadata API, JSON-LD, Node test runner, Playwright.

**Research references:**

- Mẫu tham chiếu có detail page giàu nội dung: [Minimalism Đỏ Đậm](https://chungdoi.com/vi/mau-thiep/minimalism-do-dam) và demo riêng tại [mẫu `/demo`](https://chungdoi.com/vi/mau-thiep/minimalism-do-dam/demo).
- Googlebot thường không thực hiện thao tác click nút để khám phá nội dung; các URL cần crawl phải xuất hiện trong `href` của liên kết HTML.

## Review findings and decisions

- `src/app/[locale]/templates/[slug]/page.tsx` hiện redirect mọi slug hợp lệ sang `/demo`; đây là điểm thay đổi chính.
- `src/app/[locale]/templates/[slug]/demo/page.tsx` và `publicDemoMetadata` đang coi demo là canonical indexable page. Cần đảo lại vai trò này.
- `src/components/chungdoi-listing.tsx` đã có anchor cho tên và CTA demo, nhưng chúng cùng trỏ vào demo. Ảnh là button mở popup và phải giữ hành vi đó.
- `src/lib/sitemap-entries.ts` đang đưa 50 URL demo vào sitemap. Sitemap mới phải đưa detail URL; demo URL chỉ được đưa vào nếu sau này có bằng chứng đủ nội dung để index.
- `src/lib/seo-redirects.ts` đang redirect cả base path và `/demo` alias về canonical demo. Sau thay đổi, base path canonical phải trả về detail; `/demo` canonical vẫn giữ nguyên và alias cũ phải phân biệt đúng.
- Vietnamese là locale indexable duy nhất (`src/i18n/routing.ts`). Không tạo thêm bản copy indexable giả cho `en`, `ko`, `ja`, `zh`.
- Không dùng nội dung ẩn chỉ để SEO. Mọi đoạn copy mới phải hữu ích khi người dùng đọc trang và đi qua `messages/vi.json`.

## Global constraints

- Giữ toàn bộ thay đổi chưa commit trong working tree; không reset hoặc format lan sang file không liên quan.
- Không sửa `src/generated/prisma/**`, không thêm migration và không thay đổi schema dữ liệu thiệp.
- Không hardcode chuỗi UI/SEO mới trong component; copy phải nằm trong `messages/vi.json` và được kiểm tra bằng message-scope test.
- Mỗi template có title, meta description, intro, điểm nổi bật, đối tượng phù hợp, FAQ và alt text riêng; không nhân bản một đoạn văn rồi thay mỗi tên.
- Chỉ sử dụng thông tin có trong catalog/template data hiện có; không bịa tên cô dâu chú rể, ngày cưới hoặc tính năng mà template không hỗ trợ.
- Detail page phải có đúng một H1, nội dung quan trọng có trong HTML ban đầu, canonical tự trỏ về detail và không canonical ngược sang demo.
- Demo và capture route không được làm tăng số URL indexable; không chặn demo bằng `robots.txt` vì Google cần crawl được `noindex`.
- Giữ hỗ trợ click chuột trái, middle-click, Ctrl/Cmd-click và right-click trên liên kết detail; không đặt `<a>` lồng trong `<button>`.
- Ảnh preview phải có `alt`, kích thước rõ ràng và không làm xấu CLS/Core Web Vitals hiện có.
- Rollout theo pilot 5 mẫu trước, sau khi kiểm tra Search Console mới mở rộng toàn bộ catalog.

## File map

**Create**

- `src/data/template-seo-details.ts`: kiểu dữ liệu, danh sách slug pilot, resolver và kiểm tra đủ trường nội dung.
- `src/components/template-seo-detail-page.tsx`: server component cho breadcrumb, H1, preview, CTA, nội dung, FAQ, liên kết liên quan và JSON-LD.
- `src/components/template-seo-detail-page.test.ts`: kiểm tra contract dữ liệu, JSON-LD và HTML-critical copy.
- `docs/research/template-seo-detail-pages.md`: ghi URL contract, quyết định index/noindex, kết quả crawl pilot và rollback.

**Modify**

- `src/app/[locale]/templates/[slug]/page.tsx`: render detail cho slug được bật; canonicalize alias bằng `resolvePublicTemplateRoute`; giữ `notFound` cho template nghỉ.
- `src/app/[locale]/templates/[slug]/demo/page.tsx`: dùng metadata noindex và canonical về detail; không đổi trải nghiệm demo.
- `src/components/public-template-demo.tsx`: tách `demoAlternates`/robots metadata khỏi metadata detail; giữ redirect alias `/demo`.
- `src/components/chungdoi-listing.tsx`: thêm detail href cho tên và một CTA “Xem chi tiết”; CTA demo vẫn đi `/demo`; ảnh vẫn mở popup.
- `src/lib/seo.ts`: thêm helper alternates cho detail và metadata robots có kiểu rõ ràng.
- `src/lib/seo-redirects.ts`: đổi canonical base path sang detail, phân biệt alias `/demo`, giữ facet redirects và host redirects.
- `src/lib/sitemap-entries.ts`: phát sinh detail URL; nhận allowlist pilot trong giai đoạn rollout, sau đó mở toàn bộ completed templates; loại demo URL khỏi sitemap.
- `src/app/seo-routes.test.ts`, `src/lib/seo-redirects.test.ts`, `src/lib/seo.test.ts`: cập nhật contract URL, sitemap, canonical và robots.
- `messages/vi.json`: thêm namespace `templateSeoDetails` cho pilot rồi mở rộng đủ completed templates.
- Các facet/listing/blog component có liên kết mẫu: trỏ về detail bằng anchor HTML thật.

## Task 1: Chốt URL contract và viết test bảo vệ trước khi đổi route

**Files:**

- Modify: `src/lib/seo-redirects.test.ts`
- Modify: `src/app/seo-routes.test.ts`
- Modify: `src/lib/seo.test.ts`
- Create: `src/components/template-seo-detail-page.test.ts`

- [ ] **Step 1: Ghi bảng URL canonical/alias trong test**

Phải có các case:

```text
/mau-thiep/song-hy-do              -> 200 detail (canonical)
/mau-thiep/song-hy-do/demo         -> 200 demo, noindex, canonical detail
/mau-thiep/song-hy-red              -> 301 /mau-thiep/song-hy-do
/mau-thiep/song-hy-red/demo         -> 301 /mau-thiep/song-hy-do/demo
/templates/song-hy-red              -> 301 /mau-thiep/song-hy-do
/templates/song-hy-red/demo         -> 301 /mau-thiep/song-hy-do/demo
/mau-thiep/khong-ton-tai            -> 404
```

- [ ] **Step 2: Chạy test để xác nhận baseline fail đúng**

```bash
npx tsx --test src/lib/seo-redirects.test.ts src/app/seo-routes.test.ts src/lib/seo.test.ts src/components/template-seo-detail-page.test.ts
```

Expected: các assertion mới fail vì route còn redirect sang demo và sitemap còn chứa demo; không sửa test để bỏ qua lỗi.

- [ ] **Step 3: Khóa pilot allowlist**

Chọn 5 mẫu có preview và copy ổn định (gồm `minimalism-red`, `minimalism-dark-red`, `song-hy-red`, `hoa-mai-thuy-mac`, `hong-van-rose`). Resolver phải trả trạng thái rõ ràng `enabled`, `retired` hoặc `unknown`, không dùng truthy fallback mơ hồ.

## Task 2: Tạo content contract và catalog copy tiếng Việt

**Files:**

- Create: `src/data/template-seo-details.ts`
- Modify: `messages/vi.json`
- Modify: `src/i18n/message-scopes.ts`
- Test: `src/components/template-seo-detail-page.test.ts`

- [ ] **Step 1: Định nghĩa schema nội dung**

Schema tối thiểu cho mỗi slug: `metaTitle`, `metaDescription`, `heading`, `intro`, `highlights[]`, `suitableFor[]`, `features[]`, `steps[]`, `faq[]`, `imageAlt`, `relatedSlugs[]`, `relatedBlogSlugs[]`. Resolver phải kiểm tra slug liên quan tồn tại và không tự trỏ vào chính nó.

- [ ] **Step 2: Viết copy pilot trong `messages/vi.json`**

Mỗi mẫu có 500–900 từ hữu ích, có từ khóa tự nhiên như “mẫu thiệp cưới”, phong cách/màu sắc và “tạo thiệp cưới online”. Không nhồi từ khóa, không dùng cùng một intro cho nhiều slug, không hứa hẹn FAQ rich result.

- [ ] **Step 3: Thêm message-scope coverage**

Đăng ký namespace mới và assert mọi key bắt buộc của 5 slug pilot tồn tại. Test phải báo rõ slug/key thiếu để mở rộng lên 50 mẫu không bị âm thầm fallback.

- [ ] **Step 4: Chạy contract test**

```bash
npx tsx --test src/components/template-seo-detail-page.test.ts
```

Expected: PASS với 5 slug pilot; slug thiếu trường hoặc related slug không tồn tại phải fail.

## Task 3: Dựng detail page server-rendered và structured data

**Files:**

- Create: `src/components/template-seo-detail-page.tsx`
- Modify: `src/app/[locale]/templates/[slug]/page.tsx`
- Modify: `src/lib/seo.ts`
- Test: `src/components/template-seo-detail-page.test.ts`

- [ ] **Step 1: Resolver template và canonical slug**

Dùng `resolvePublicTemplateRoute`, `findTemplateByRouteSlug`, `getVietnameseTemplateSlug`; alias hợp lệ phải redirect 301 về detail canonical, retired/unknown trả `notFound`.

- [ ] **Step 2: Render nội dung trong HTML ban đầu**

Thứ tự gồm breadcrumb, H1, preview landscape/portrait, CTA “Xem demo” và “Tạo thiệp”, highlights, intro, suitable-for, features, 3 bước sử dụng, FAQ, related templates và related blog. Không đợi client state để hiển thị đoạn văn SEO.

- [ ] **Step 3: Thêm metadata riêng cho detail**

Dùng `pageSeo` với title/description từ catalog, preview làm OG image, canonical `/mau-thiep/[slug]`, `x-default` đúng locale. Title phải dưới khoảng 60 ký tự và description khoảng 140–160 ký tự sau khi render biến số.

- [ ] **Step 4: Thêm JSON-LD hợp lệ**

Render `WebPage`, `BreadcrumbList`, `ImageObject` và `ItemList` related templates. FAQ `FAQPage` chỉ thêm khi tất cả câu trả lời là nội dung tĩnh nhìn thấy; coi đây là semantic markup, không cam kết Google hiển thị rich result.

- [ ] **Step 5: Kiểm tra không có duplicate H1/canonical**

Test component phải assert một H1, canonical detail và các đoạn intro/highlights xuất hiện trong output server.

## Task 4: Cập nhật listing và internal linking mà không phá popup

**Files:**

- Modify: `src/components/chungdoi-listing.tsx`
- Modify: các component facet/blog đang dùng `templateDemoHref`
- Test: test component/listing hiện có và thêm assertion link detail

- [ ] **Step 1: Tách ba hành vi rõ ràng**

Ảnh/card preview button gọi popup; tên mẫu và CTA “Xem chi tiết” đi detail; CTA “Xem demo” đi demo. Không bọc cả card bằng anchor vì sẽ xung đột nút popup.

- [ ] **Step 2: Giữ modifier-click và accessibility**

Tên mẫu phải là `<Link>`/`<a>` thật có accessible name; không chặn `contextmenu`, middle-click hoặc Ctrl/Cmd-click. Nút popup giữ keyboard activation và `aria-label` hiện có.

- [ ] **Step 3: Liên kết nội bộ từ facet/blog**

Mọi module giới thiệu template phải trỏ detail canonical. Detail chỉ trỏ demo ở CTA rõ ràng và trỏ các detail liên quan theo `relatedSlugs`.

- [ ] **Step 4: Chạy lint/typecheck phần UI**

```bash
npm run lint
npm run typecheck
```

Expected: không có lỗi JSX nesting, type href hoặc message key.

## Task 5: Đảo canonical demo, redirect và sitemap

**Files:**

- Modify: `src/components/public-template-demo.tsx`
- Modify: `src/app/[locale]/templates/[slug]/demo/page.tsx`
- Modify: `src/lib/seo-redirects.ts`
- Modify: `src/lib/sitemap-entries.ts`
- Modify: `src/lib/seo-redirects.test.ts`
- Modify: `src/app/seo-routes.test.ts`

- [ ] **Step 1: Đặt demo là `noindex,follow`**

Demo canonical trỏ về `/mau-thiep/[slug]` detail. Demo vẫn cho phép crawl để Google thấy `noindex`; không thêm `/demo` vào sitemap. Capture route tiếp tục `noindex` và không có link indexable mới.

- [ ] **Step 2: Sửa redirect function không tạo vòng lặp**

Base alias (`/templates/...`, `/vi/templates/...`, slug cũ) redirect detail; alias có `/demo` redirect demo canonical; detail canonical và demo canonical trả `null`. Giữ facet alias và host redirect hiện có.

- [ ] **Step 3: Sửa sitemap theo pilot**

Trong pilot, sitemap chỉ chứa 5 detail canonical; không chứa detail alias hoặc demo. Khi mở rộng, mọi `completedTemplates` có content contract hợp lệ mới được thêm.

- [ ] **Step 4: Chạy test SEO**

```bash
npx tsx --test src/lib/seo-redirects.test.ts src/app/seo-routes.test.ts src/lib/seo.test.ts
```

Expected: URL không trùng, không query string, không locale retired, sitemap có detail pilot và không có `/demo`.

## Task 6: E2E/HTML crawl gate cho pilot

**Files:**

- Create: `tests/e2e/template-seo-detail.spec.ts`
- Modify: `docs/research/template-seo-detail-pages.md`

- [ ] **Step 1: Kiểm tra response và metadata**

Với mỗi slug pilot, assert status 200, một H1, canonical detail, title/description khác nhau, preview có alt và JSON-LD parse được.

- [ ] **Step 2: Kiểm tra demo**

Assert `/demo` có `noindex,follow`, canonical detail, nút mở thiệp và CTA sử dụng template vẫn hoạt động.

- [ ] **Step 3: Kiểm tra alias 301**

Assert slug cũ/internal route trả redirect đúng đích trong một hop, không redirect chain và không đổi locale thành `en/ko/ja/zh`.

- [ ] **Step 4: Kiểm tra hành vi listing**

Click trái ảnh mở popup; click tên/CTA detail điều hướng detail; Ctrl/Cmd-click hoặc middle-click tên mở tab detail; right-click vẫn hiện menu trình duyệt.

- [ ] **Step 5: Chạy gate**

```bash
npx playwright test tests/e2e/template-seo-detail.spec.ts
npm run typecheck:tests
```

Expected: pilot pass trên desktop và mobile; test fail nếu copy chỉ xuất hiện sau hydration.

## Task 7: Mở rộng catalog và rollout an toàn

**Files:**

- Modify: `src/data/template-seo-details.ts`
- Modify: `messages/vi.json`
- Modify: `src/app/seo-routes.test.ts`
- Modify: `docs/research/template-seo-detail-pages.md`

- [ ] **Step 1: Bổ sung từng batch 10 mẫu**

Chỉ thêm slug vào sitemap/allowlist sau khi đủ copy, preview, alt, related links và contract test. Không tạo trang mỏng cho mẫu chưa được biên tập.

- [ ] **Step 2: Chạy full checks trước mỗi batch**

```bash
npm run lint
npm run typecheck
npm run typecheck:tests
npm run test:unit
npm run build:local
```

Expected: tất cả pass; build dùng `build:local` vì `npm run build` cố ý từ chối `localhost` trong `.env.local`.

- [ ] **Step 3: Kiểm tra Search Console sau pilot**

Gửi sitemap, inspect 5 detail URL và 5 demo URL. Chỉ mở batch tiếp theo khi detail được crawl/index, demo giữ noindex, không xuất hiện duplicate canonical và CTR/click detail→demo không giảm bất thường.

- [ ] **Step 4: Rollback rõ ràng**

Nếu có lỗi canonical/index coverage, gỡ slug khỏi allowlist và sitemap để quay về redirect cũ trong một deploy; giữ content/data và test để sửa rồi bật lại. Không xóa URL hoặc đổi slug đã public.

## Final self-review

- [ ] Mỗi completed template chỉ có một URL detail canonical và demo không cạnh tranh index.
- [ ] Sitemap, canonical, redirect và internal link dùng cùng một hàm map slug.
- [ ] Alias source slug, Vietnamese slug, internal route và retired locale đều có test.
- [ ] Copy đầy đủ trong catalog, không có hardcode mới và không có fallback im lặng.
- [ ] HTML ban đầu chứa nội dung chính; JS tắt vẫn đọc được detail và mở được liên kết demo.
- [ ] Popup/listing behavior, accessibility và modifier-click đã được E2E kiểm tra.
- [ ] Lint, typecheck, unit, E2E và `build:local` đã pass cho batch cuối.
- [ ] `docs/research/template-seo-detail-pages.md` ghi lại URL đã inspect, ảnh hưởng còn lại và quyết định rollout.
