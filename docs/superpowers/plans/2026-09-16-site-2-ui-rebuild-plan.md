# Site 2 Liquid Glass UI Rebuild — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-09-16-site-2-ui-rebuild-design.md`
**Branch:** `feat/site-2-liquid-glass`
**Theme:** Blush champagne (revert từ Garden Atelier)

---

## Phase 0: Foundation — Revert to Blush + Install Deps

### Task 0.1: Revert tokens.css to Blush
- Restore `apps/site-2/src/styles/tokens.css` từ commit `c112872`
- Thêm glass tokens mới vào cuối file:
  ```css
  /* Liquid Glass material */
  --s2-glass-bg: color-mix(in oklab, var(--s2-surface) 55%, transparent);
  --s2-glass-bg-strong: color-mix(in oklab, var(--s2-surface) 78%, transparent);
  --s2-glass-blur: 18px;
  --s2-glass-saturate: 1.4;
  --s2-glass-border: color-mix(in oklab, #fff 60%, transparent);
  --s2-glass-highlight: inset 0 1px 0 0 rgb(255 255 255 / 55%);
  --s2-glass-shadow: 0 18px 50px -22px rgb(194 72 109 / 28%);
  --s2-champagne: #f3e3c8;
  ```
- Dark mode glass tokens trong `:root[data-s2-theme="dark"]` block

### Task 0.2: Revert marketing.css comment header
- Đổi "Garden Atelier" → "Blush Liquid Glass" trong comment đầu file
- Giữ nguyên CSS rules hiện tại (chưa xóa gì)

### Task 0.3: Revert workspace.css comment header
- Tương tự marketing.css

### Task 0.4: Install GSAP
```bash
cd apps/site-2 && npm install gsap @gsap/react
```

### Task 0.5: Add image optimization helper
- Thêm `templatePreviewOptimizedUrl(source: string, width: number)` vào `apps/site-2/src/lib/template-preview.ts`
- Wrap qua `/_next/image?url=...&w=...&q=84`
- Unit test helper

### Verify Phase 0
```
npm run lint && npm run typecheck && npm run test:unit
```

### Commit
```
feat: revert to blush theme + add glass tokens and gsap deps
```

---

## Phase 1: Glass System + Home Page

### Task 1.1: Glass utility classes
Thêm vào `apps/site-2/src/styles/marketing.css`:
- `.s2-glass` — backdrop-filter blur + saturate + bg + border + highlight + shadow + fallback
- `.s2-glass-strong` — bg-strong variant
- `.s2-glass-nav` — nav-specific lighter glass
- `.s2-sheen` — hover sheen animation (transform-only pseudo-element)

### Task 1.2: Glass primitive component
Tạo `apps/site-2/src/components/ui/glass.tsx`:
```tsx
export function Glass({ children, variant = "default", className, ...props })
```
- variant: "default" | "strong" | "nav"
- cn() merge classes

### Task 1.3: Home page sections
Tạo folder `apps/site-2/src/components/marketing/home/`:

| File | Description |
|------|-------------|
| `home-hero.tsx` | Rewrite existing hero: glass bệ + tilt-card + champagne glow nền |
| `home-live-preview.tsx` | Client component: input tên/ngày → live update thiệp preview (debounce 150ms) |
| `home-gallery.tsx` | Grid thumbnail optimized via `<Image>` + stagger reveal |
| `home-steps.tsx` | 3-step glass cards, Lucide icons |
| `home-story.tsx` | 2-col editorial layout, parallax lớp |
| `home-finale.tsx` | Final CTA block glass + seal SVG |
| `home-motion.ts` | GSAP choreography: ScrollTrigger scrub cho gallery stagger, hero parallax. Client-only, reduced-motion guard |

### Task 1.4: Rewrite home page.tsx
`apps/site-2/src/app/(marketing)/page.tsx`:
- Import new section components
- Data flow giữ nguyên: `getVisibleCatalogTemplates()` → `toListingItem()`
- Pass data xuống sections

### Task 1.5: i18n keys
Mở rộng `apps/site-2/messages/vi.json` namespace `home.*`:
- `livePreviewTitle`, `livePreviewBrideLabel`, `livePreviewGroomLabel`, `livePreviewDateLabel`
- `galleryTitle`, `galleryViewAll`
- `step1Title`, `step1Desc`, `step2Title`, `step2Desc`, `step3Title`, `step3Desc`
- `storyTitle`, `storyBody`
- `finaleTitle`, `finaleCta`

### Verify Phase 1
```
npm run lint && npm run typecheck && npm run test:unit
```

### Commit
```
feat: liquid glass home page with gsap choreography
```

---

## Phase 2: Marketing Pages Update

### Task 2.1: Nav glass
`apps/site-2/src/components/marketing/marketing-nav.tsx`:
- Wrap nav trong `.s2-glass-nav`
- Sticky top, shrink on scroll (CSS only hoặc minimal JS)

### Task 2.2: Listing page `/mau-thiep`
`apps/site-2/src/app/(marketing)/mau-thiep/page.tsx`:
- Filter chips → glass chip style
- Template cards → `.s2-glass` + hover sheen + lift
- Stagger reveal khi scroll

### Task 2.3: Pricing page `/bang-gia`
- Pricing cards → `.s2-glass`
- Featured tier → champagne border + sheen
- FAQ accordion → reveal animation

### Task 2.4: Auth page `/dang-nhap`
- Form container → glass giữa màn
- Glow champagne nền
- Input fields → glass nhẹ (nhưng đủ contrast)

### Task 2.5: Legal pages
- Glass nhẹ wrapper
- Ưu tiên readability, không hiệu ứng

### Task 2.6: Not-found page
- 404 glass card + CTA về Home

### Verify Phase 2
```
npm run lint && npm run typecheck && npm run test:unit
```

### Commit
```
feat: apply liquid glass to marketing pages
```

---

## Phase 3: Workspace Update

### Task 3.1: Workspace shell/nav
- Nav glass sticky
- Sidebar glass nhẹ

### Task 3.2: Dashboard
- Project cards → `.s2-glass` hover lift
- Empty state minh hoạ + CTA

### Task 3.3: Editor
- Action bar + section-nav → glass
- Form fields → ĐẶC (không blur), high contrast
- Preview sheet → glass

### Task 3.4: Guest manager
- Table + dialog → glass
- Status badges giữ semantic tokens

### Task 3.5: RSVP
- Summary cards → glass
- List clean

### Task 3.6: Payment
- Panel glass nhưng QR/trạng thái rõ ràng
- KHÔNG hiệu ứng làm rối giao dịch tiền

### Verify Phase 3
```
npm run lint && npm run typecheck && npm run test:unit
```

### Commit
```
feat: apply liquid glass to workspace
```

---

## Phase 4: Tests + Final Verify

### Task 4.1: Unit tests
- `templatePreviewOptimizedUrl` helper
- Glass component variants
- Live preview state/debounce logic

### Task 4.2: E2E tests update
`tests/e2e/site-2-marketing.spec.ts`:
- Home render đủ 8 sections
- CTA links đúng destination
- Gallery images dùng optimized URL

`tests/e2e/site-2-visual.spec.ts`:
- Reduced-motion trả bố cục tĩnh
- Glass classes present trên key elements

### Task 4.3: Boundary test
```
npm run test:boundary
```
PHẢI PASS — không file nào ngoài SITE2_EDITABLE_ROOTS bị sửa.

### Task 4.4: Full verify gate
```
npm run lint
npm run typecheck
npm run test:unit
npm run test:boundary
npx playwright test tests/e2e/site-2-marketing.spec.ts
npx playwright test tests/e2e/site-2-visual.spec.ts
npm run build:local
```

### Commit
```
test: e2e + unit coverage for liquid glass rebuild
```

---

## Risk Register

| Risk | Mitigation |
|------|------------|
| GSAP bundle size (~30KB gzipped) | Chỉ load ở Home, dynamic import `home-motion.ts` |
| Backdrop-filter perf trên mobile yếu | Max 3-4 layers, fallback nền đặc |
| Ảnh gốc 9000px giết tab | `templatePreviewOptimizedUrl` bắt buộc cho gallery |
| Garden → Blush revert gây conflict | Merge cẩn thận, check dark mode tokens |
| Boundary test fail do spec path | Prefix đã thêm ở commit `de5c66d` |
| Live preview nặng | Simplified preview component, không full renderer |

---

## Out of Scope (nhắc lại)
- Demo thiệp `/demo` pages
- Published invitations `/thiep/[slug]`
- Renderer components
- Site-1 code
- Deploy
- Lenis / smooth scroll
- Canvas / WebGL
