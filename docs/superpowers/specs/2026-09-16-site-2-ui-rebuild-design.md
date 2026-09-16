# Site 2 UI Rebuild — Liquid Glass + Blush

**Date:** 2026-09-16
**Branch:** `feat/site-2-liquid-glass`
**Scope:** Marketing + Workspace toàn site-2, TRỪ demo thiệp (`/mau-thiep/[slug]/demo`) và thiệp publish (`/thiep/[slug]`)
**Site-1 impact:** ZERO — mọi thay đổi nằm trong `SITE2_EDITABLE_ROOTS`

---

## 1. Context & Motivation

Site-2 (https://thiep.hoangnam.cloud/) hiện tại UI đơn điệu, thiếu ấn tượng. Cần rebuild toàn bộ UI theo hướng **Liquid Glass trên nền Blush**, nhấn mạnh hiệu ứng và visual quality.

Nghiên cứu 12 lab version (v1–v12) từ site-1 làm nguồn ý tưởng. KHÔNG bê nguyên bất kỳ version nào — design mới từ đầu, lấy cảm hứng từ các concept đã thử nghiệm.

### Non-goals
- Không sửa site-1 (thiepmungonline.com) — production đang có user
- Không sửa demo thiệp renderer (`site2-invitation-*`)
- Không sửa `/thiep/[slug]` (published invitation pages)
- Không deploy — deploy là bước riêng sau khi user duyệt

---

## 2. Architecture & Site-1 Isolation

### Boundary enforcement
Mọi file sửa đổi PHẢI nằm trong `SITE2_EDITABLE_ROOTS` (`apps/site-2/src/lib/site2-boundary.ts`):
- `apps/site-2/` — app code
- `tests/e2e/site-2-*`, `tests/site-2-*` — tests
- `docs/deploy-site-2.md`, `docs/releases/site-2-*`, `docs/research/site-2-*`
- `docs/superpowers/plans/2026-09-16-site-2-*`, `docs/superpowers/specs/2026-09-16-site-2-*`
- `infra/compose/site-2.yaml`, `infra/systemd/site-2/`

Boundary test (`tests/site-2-source-boundary.test.mjs`) chạy trước commit, fail nếu file ngoài scope bị sửa.

### Lab v1–v12 = read-only reference
Lab files nằm bên site-1 (`src/components/home2/lab/`). Copy/adapt pattern vào `apps/site-2/`, KHÔNG import chéo.

### Fonts
Giữ hệ 2 font hiện tại:
- **Be_Vietnam_Pro** — body text
- **Cormorant_Garamond** — display/headings

---

## 3. Liquid Glass Design System

### CSS Tokens (`apps/site-2/src/styles/tokens.css`)

```css
/* Glass material — Blush champagne */
--s2-glass-bg: color-mix(in oklab, var(--s2-surface) 55%, transparent);
--s2-glass-bg-strong: color-mix(in oklab, var(--s2-surface) 78%, transparent);
--s2-glass-blur: 18px;
--s2-glass-saturate: 1.4;
--s2-glass-border: color-mix(in oklab, #fff 60%, transparent);
--s2-glass-highlight: inset 0 1px 0 0 rgb(255 255 255 / 55%);
--s2-glass-shadow: 0 18px 50px -22px rgb(194 72 109 / 28%);
--s2-champagne: #f3e3c8;
```

### Utility classes (`marketing.css` + `workspace.css`)

| Class | Purpose |
|-------|---------|
| `.s2-glass` | Nền blur + border highlight + shadow. Fallback `@supports not (backdrop-filter)` → nền gần đặc |
| `.s2-glass-strong` | Biến thể đặc hơn cho nav sticky, dialog |
| `.s2-glass-nav` | Nav glass nhẹ, thu gọn khi scroll |
| `.s2-sheen` | Dải sáng quang học chạy trên viền khi hover (transform-only) |

### Performance rules
- Chỉ animate `transform` + `opacity` + `backdrop-filter`. KHÔNG `background-position`, KHÔNG canvas/WebGL trang trí
- Tối đa ~3-4 lớp `backdrop-filter` đồng thời mỗi trang
- `prefers-reduced-motion`: tắt loop trang trí, giữ bố cục + nội dung đầy đủ
- Fallback khi không hỗ trợ `backdrop-filter`: nền đặc, chữ luôn rõ

### Propagation
- **Nav, card, form, dialog, sheet** → glass nhẹ
- **Home** → glass đậm + choreography GSAP
- **Workspace forms** → field đặc hơn card trang trí (ưu tiên contrast khi nhập liệu)

---

## 4. Home Page Flow

Data source: `getVisibleCatalogTemplates()` → thumbnail thật.
Choreography: GSAP + ScrollTrigger, scrub theo scroll, KHÔNG pin.
Tất cả section có fallback reduced-motion tĩnh.

### Section sequence

#### 4.1 Nav glass sticky
- `.s2-glass-nav`, backdrop-blur, thu gọn khi cuộn

#### 4.2 Hero — "Thiệp nổi trong ánh sáng champagne"
- Nền: gradient Blush + 2 khối glow champagne (transform-only, parallax nhẹ)
- Trái: kicker + H1 Cormorant + lede + 2 CTA ("Tạo thiệp ngay" / "Xem mẫu")
- Phải: 1 thiệp cover thật (LCP image, reserve size) nổi trên bệ kính, nghiêng 3D nhẹ theo con trỏ (tilt-card primitive)
- Scroll cue ở đáy

#### 4.3 Category marquee
- Dải nhãn phong cách chạy ngang (marquee primitive), glass chip
- Data: unique categories từ catalog

#### 4.4 "Một tấm thiệp sống" — Live preview
- Khung kính chứa preview thiệp
- Input tên cặp đôi + ngày cưới
- Gõ tới đâu thiệp cập nhật tới đó (client component, state local, debounce 150ms)
- Đây là màn "wow" tương tác — chứng minh sản phẩm trực tiếp

#### 4.5 Gallery xếp lớp — Tường mẫu thật
- Lưới thumbnail, scroll-scrub stagger nhẹ khi vào viewport
- Hover: lift + sheen
- Progress bar mảnh phía trên
- Link thật tới `/mau-thiep/[slug]/demo`
- Nút "Xem tất cả N mẫu"

**⚠️ CRITICAL — Image optimization:**
Listing thumbnails gốc cao 6600–9500px. Gallery PHẢI dùng Next.js `<Image>` component hoặc helper wrap `/_next/image` để resize xuống viewport-appropriate size (max 400px wide cho grid card). KHÔNG phục vụ ảnh gốc. `next.config.ts` đã configure `localPatterns` cho optimization. Tạo helper `templatePreviewOptimizedUrl(source, width)` trong `apps/site-2/src/lib/template-preview.ts`.

#### 4.6 Cách hoạt động — 3 bước
- Glass card, reveal stagger khi vào viewport
- Icons Lucide + copy ngắn

#### 4.7 Câu chuyện sản phẩm
- Layout 2 cột: ảnh editorial + copy
- Parallax lớp nhẹ

#### 4.8 Finale CTA
- Khối kính lớn, glow champagne
- H2 + nút "Tạo thiệp ngay" + con dấu sáp Blush (SVG tĩnh)

### Mobile adaptations
- Xếp dọc toàn bộ sections
- Bỏ tilt/scrub nặng
- Giữ marquee + reveal + live preview (rút gọn input)
- Gallery thành 2 cột
- Touch-friendly tap targets (min 44px)

### i18n
Toàn bộ copy qua `messages/vi.json`, namespace `home.*`. Mở rộng key mới, KHÔNG hardcode string.

---

## 5. Marketing Pages Treatment

Nguyên tắc: native scroll, glass material, primitives sẵn có (reveal/parallax/tilt/marquee). KHÔNG GSAP pin/scrub ngoài Home.

| Trang | Treatment |
|-------|-----------|
| `/mau-thiep` (listing) | Filter chip glass, lưới card `.s2-glass` hover sheen+lift, stagger reveal. Tái dụng `template-listing-client` |
| `/mau-thiep/[slug]` (detail, KHÔNG phải `/demo`) | Hero preview thiệp + meta glass + CTA. Demo page giữ nguyên 100% |
| `/bang-gia` (pricing) | Bảng giá glass card, gói nổi bật viền champagne + sheen, FAQ accordion reveal |
| `/huong-dan` (guide) | Help search + mục lục glass, nội dung đọc rõ, contrast cao |
| `/dang-nhap` (auth) | Form kính giữa màn, glow champagne nền, auth-form field glass |
| Legal (3 trang) | Glass nhẹ, ưu tiên đọc — không hiệu ứng |
| Not-found | 404 glass + CTA về Home |

---

## 6. Workspace Treatment

Glass nhưng ưu tiên công năng/contrast khi nhập liệu.

| Khu vực | Treatment |
|---------|-----------|
| workspace-shell / nav | Nav glass sticky, sidebar glass nhẹ |
| Dashboard | Project card `.s2-glass` hover lift, empty-state minh hoạ + CTA |
| Editor `[id]` | Action bar + section-nav glass; form field ĐẶC (không blur) để rõ khi gõ; preview sheet glass |
| Khách mời | Bảng + guest-dialog glass, status badge giữ token semantic |
| RSVP | Summary card glass + list, chart nhẹ nếu có |
| Thanh toán | Payment-panel glass, QR + trạng thái rõ ràng. KHÔNG hiệu ứng làm rối giao dịch tiền |

---

## 7. Dependencies

Thêm vào `apps/site-2/package.json` ONLY — không đụng root package.json:

| Package | Purpose |
|---------|---------|
| `gsap` | Choreography Home (ScrollTrigger, scrub) |
| `@gsap/react` | React hooks cho GSAP (useGSAP pattern) |

**KHÔNG thêm:**
- Lenis (V10 cố tình native scroll)
- Canvas/WebGL libs (Aurora crash memory)
- framer-motion (bundle tương đương GSAP mà scroll ecosystem yếu hơn)

Pattern tham khảo: `src/components/home2/lab/v12-motion.ts` — useGSAP + ScrollTrigger + matchMedia + reduced-motion guard.

---

## 8. File Structure

### New files
```
apps/site-2/src/
  components/
    ui/glass.tsx                    # .s2-glass primitive reusable
    marketing/home/
      home-hero.tsx                 # Hero section
      home-live-preview.tsx         # Live typing preview
      home-gallery.tsx              # Template gallery wall
      home-steps.tsx                # How-it-works 3 steps
      home-story.tsx                # Product story section
      home-finale.tsx               # Final CTA
      home-motion.ts               # GSAP choreography (client-only)
  lib/
    template-preview.ts             # Thêm templatePreviewOptimizedUrl()
```

### Modified files
```
apps/site-2/src/
  styles/tokens.css                 # Glass tokens
  styles/marketing.css              # Glass utilities + home styles
  styles/workspace.css              # Glass utilities workspace
  app/(marketing)/page.tsx          # Home page mới
  app/(marketing)/layout.tsx        # Nav glass
  lib/site2-boundary.ts             # Thêm prefix 2026-09-16 ✅ done
  messages/vi.json                  # Home copy mới
  package.json                      # gsap + @gsap/react
```

---

## 9. Testing Strategy

### Unit tests (`src/**/*.test.ts`)
- Glass utility logic
- Live preview state management
- `templatePreviewOptimizedUrl` helper
- Catalog helpers (nếu thêm mới)

### Boundary test
- `npm run test:boundary` PHẢI PASS — khoá không sửa ngoài site-2

### E2E (`tests/e2e/site-2-*.spec.ts`)
- Home render đủ 8 sections + CTA link đúng
- Reduced-motion trả bố cục tĩnh (không animation)
- Listing/pricing/auth smoke
- Gallery images dùng optimized URL (không raw 9000px)
- Cập nhật `site-2-marketing.spec.ts` + `site-2-visual.spec.ts`

### KHÔNG test
- Pixel-diff chi tiết hiệu ứng (flaky)
- Animation timing chính xác

### Verify gate (rẻ trước đắt sau)
```
npm run lint → npm run typecheck → npm run test:unit → npm run test:boundary → E2E spec đích → build
```

---

## 10. Rollout Plan

### Commits (nhỏ, có checkpoint)
1. ✅ `0fdde24` — Root fix (gift-account label) — đã commit
2. ✅ `1442430` — WIP Garden Atelier checkpoint — đã commit
3. 🔲 Glass tokens + utilities + boundary fix
4. 🔲 Home page (sections + motion)
5. 🔲 Marketing pages update
6. 🔲 Workspace update
7. 🔲 Tests + verify

Mỗi commit: lint + typecheck pass trước khi push.

### Deploy
KHÔNG tự deploy. Site-2 deploy là bước riêng (`docs/deploy-site-2.md`), chỉ khi user duyệt + xác nhận.

---

## 11. Out of Scope

- Thiệp detail `/demo` pages
- Published invitations `/thiep/[slug]`
- Renderer `site2-invitation-*` components
- Site-1 code (bất kỳ file nào ngoài `SITE2_EDITABLE_ROOTS`)
- Deploy
- Lenis / smooth scroll
- Canvas / WebGL decorative effects
