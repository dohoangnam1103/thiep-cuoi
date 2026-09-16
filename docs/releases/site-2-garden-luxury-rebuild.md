# Site-2 Garden Luxury rebuild (2026-09-15) — working tree, chưa commit

Rebrand toàn bộ site-2 sang garden luxury: nền ivory lạnh, accent xanh rêu
sâu duy nhất, display serif Cormorant Garamond, motion CSS chỉ
transform/opacity. Site-1 không đụng (xem mục Ranh giới).

## Đã làm theo phase

- Phase 0: token garden (`styles/tokens.css`, giữ prefix `--s2-*`, lock
  `data-s2-theme="light"`), font Cormorant Garamond vietnamese
  (`--font-display`), primitives `components/motion/` (Reveal, Parallax,
  TiltCard, Marquee — triển khai bằng CSS + rAF/IO, không dependency
  animation), S2Button/S2Field focus ring, MarketingNav + WorkspaceNav dùng
  icon lucide, footer 3 cột giữ đủ 7 link, `lucide-react` vào package.json.
- Phase 1: home hero split (editorial SVG + bìa thiệp thật parallax, H1 serif
  giữ nguyên "Một lời mời đáng nhớ."), 1 marquee phong cách/trang,
  CuratedTemplates mosaic tên VI + category VI, ProductStory sticky,
  CreateSteps progress line không đánh số, FinalCta panel accent. Catalog
  `/mau-thiep`: pill VI + sticky filter, card chỉ render tên + category VI
  (ẩn description tiếng Anh site-1, strip ký tự 囍 trong `catalog.ts`).
- Phase 2: `/bang-gia` giá 99.000 ₫ từ config `SITE2_PLAN_PRICE`
  (fallback 99000, đồng nhất trang thanh toán) + specs pricing cập nhật theo;
  copy legal/help đồng bộ gói trả phí; serif + polish dang-nhap/help/legal/404.
- Phase 3: dashboard card có cover + chip + stats, empty state editorial,
  editor scroll-spy indicator + save-state animation + tên mẫu VI, token hóa
  guests/rsvp/payment, demo bar serif + tên VI (renderer không đụng).
- Phase 4: `check:site-2` pass, e2e site-2 66/66 đủ 5 projects, audit copy
  (zero em/en-dash, "Tạo thiệp ngay" đúng 1/lần/trang), screenshot desktop +
  mobile từng trang và workspace (artifacts e2e).

## Chệch brief (lý do)

- Không dùng `motion`: xác minh production e2e motion chạy, nhưng CSS đạt
  cùng hiệu quả, không thêm dependency, screenshot nghiệm thu xác định
  (không kẹt giữa animation). `motion/` giữ nguyên API đã định.
- Editorial là SVG tự vẽ (`public/editorial/`, giấy ivory + hoa trắng/lá
  rêu), không phải ảnh image-gen (không có skill/tool). Thay khi có ảnh thật.
- `package-lock.json` (root) đổi theo: Dockerfile site-2 `npm ci` nên lock
  phải đồng bộ; đã có 3 commit site-2 trước làm vậy.

## Lưu ý vận hành (phát hiện khi nghiệm thu)

- Dev server site-2 CHỈ mở qua `localhost:3200`. Mở bằng `127.0.0.1:3200`
  thì Next 16 chặn dev-runtime (allowedDevOrigins) khiến hydration chết lặng
  trên mọi trang, chỉ còn SSR. Production (`next start`, e2e port 3222)
  không ảnh hưởng.
- Cover/bìa thiệp đầy đủ chỉ có ở production (context `master-public/`);
  dev local thiếu file preview nên card dùng thumbnail fallback. Muốn xem đủ
  ở dev: symlink tạm
  `apps/site-2/public/chungdoi/images/template-previews ->
  ../../../../../public/chungdoi/images/template-previews` rồi XÓA sau khi
  chụp (thư mục này tracked, không commit symlink/file sync).

## Deploy prod (2026-09-15, đã live)

- Checkpoint: image `3cc3e697` (light, start 07:53Z), DB quick_check ok,
  users 488 / invitations 599 (381 draft + 218 published) / guests 165 /
  rsvps 81, media 2730 files. Backup `backups/pre-garden-20260915.db`
  (`8080487a…`). Không migrate (không đổi schema/packages).
- Sự cố build: `npm ci` trong Dockerfile fail vì lock thiếu entries
  `@emnapi/*` (npm 11.16 strict hơn npm 11.6.2 local). Fix: regen lock bằng
  `npx npm@11.16.0 install --package-lock-only` (+4 entries), cả 2 npm
  verify `ci --dry-run` pass. File duy nhất ngoài roots thêm vào là
  `package-lock.json` (bắt buộc cho `npm ci`).
- Image `:20260915-garden` (`0db9a353`, 2.81GB), build trên daemon minipc,
  origin `https://thiep.hoangnam.cloud`. Tag rollback `:pre-garden`
  (= image light cũ). Grep hostname master trong static chunks: chỉ còn
  string renderer dùng chung (live image cũ cũng có, còn nhiều hơn),
  không regression.
- Switch + health 200 + origin đúng. Smoke public 6 routes 200, giá
  99.000 ₫ live, lifecycle register → tạo → lưu → xuất bản → link công
  khai render tên → dọn sạch, counts về đúng baseline, quick_check ok.
- Rollback drill: về `:pre-garden` healthy → promote lại garden healthy.
- Lưu ý: SSH alias `minipc` (cloudflared) timeout từ máy dev, dùng
  `namdo@192.168.0.57` LAN trực tiếp. Public https hơi chập chờn từ máy
  dev (tunnel), loopback minipc nhanh ổn định. `master-public/` local đã
  xóa sau build. Không đụng VPS site-1, không chạm container khác.

## Ranh giới

- `node scripts/check-app-boundaries.mjs`: imports ok (150 files).
- Ngoài roots còn: 36 file `src/**` + 2 docs stray CÓ SẴN từ trước (không
  đưa vào commit) và `package-lock.json` (mục Chệch brief). Không deploy.
