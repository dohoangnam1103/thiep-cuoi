# Checkpoint tiếp tục — Long Phụng Gatefold

> Cập nhật: 2026-07-31.
> Trạng thái mới nhất: đã có **opening lab độc lập chạy được**; vẫn chưa được
> public hoá template hay bắt đầu renderer production. File này là điểm khôi
> phục context cho task mẫu thí điểm.

## Cập nhật mới nhất — opening lab đã hoàn thiện vòng đầu

> Phần này supersede các câu “chưa code/chưa cài GSAP/chưa review phoenix” ở
> history bên dưới. Những phần cũ vẫn được giữ để biết nguồn gốc quyết định.

### Phạm vi đã làm

Chỉ làm **một** pilot `long-phung-gatefold` trong route lab, không đăng ký vào
catalog/editor/public invitation và không sửa pipeline legacy Song Phụng hay
`flyOnOpen`.

```text
src/app/[locale]/lab/long-phung-gatefold/page.tsx
/lab/long-phung-gatefold
```

- Route `force-dynamic`, `noindex,nofollow`.
- Production trả `404` trừ khi `GATEFOLD_LAB_ENABLED=1`; Playwright đã bật biến
  này riêng cho web server test.
- Không sửa `src/data/chungdoi.ts`, registrar, generated template data,
  `chungdoi-demo.tsx` hoặc `chungdoi-envelope-3d.tsx`.

### File runtime mới

```text
src/data/long-phung-gatefold-pilot.ts
src/components/chungdoi-long-phung-gatefold-lab.tsx
src/components/gatefold/long-phung-gatefold-scene.tsx
src/components/gatefold/long-phung-gatefold-fallback.tsx
src/components/gatefold/long-phung-gatefold-fallback.module.css
src/app/[locale]/lab/long-phung-gatefold/page.tsx
tests/e2e/long-phung-gatefold.spec.ts
```

Đã thêm đúng hai dependency đã khóa: `gsap` và `@gsap/react`. Không thêm
motion/physics/WebGPU framework nào khác.

### Contract opening đang được hiện thực

- Canvas R3F có center board, hai wing pivot thật, board depth, clasp hai nửa,
  ánh sáng/contact shadow và mặt sau được thiết kế; `OrbitControls` cho
  tilt/drag/xem mặt sau.
- Vùng clasp trung tâm nhận drag/touch primary từ `8px`; multi-touch không tự
  mở. Nút native `Mở thiệp` vẫn là đường keyboard Enter/Space đáng tin cậy.
- `snapshotPose()` xác nhận pose camera/target hiện tại trước khi timeline nhận
  quyền. Khi mở, controls bị lock và damping residual bị xoá; timeline không
  reset object về pose chuẩn.
- Camera settle dùng quỹ đạo cầu quanh card, không nội suy thẳng xuyên qua card
  khi người dùng đang xem mặt sau.
- GSAP master timeline có labels `anticipation`, `release`, `unfold`, `reveal`,
  `settle`, `handoff`, signal qua `data-gatefold-phase` để scrub/test.
- Desktop `1900ms`: `0–8` anticipation, `8–18` release, left/right unfold từ
  `18` với lệch `70ms`, reveal `42–68`, settle `68–90`, align `90–98`, handoff
  `98–100`.
- Mobile `1650ms`: camera widen trong release `12–25`, wing open nhỏ hơn và
  nằm trong viewport (`25–60`), reveal `48–72`, settle `72–94`, handoff
  `94–100`.
- Reduced motion `200ms`: vẫn clasp -> reveal -> handoff, wing chỉ đổi góc nhỏ
  và không có orbit/camera zoom lớn.
- Handoff mount DOM hero ở `HANDOFF`, giữ Canvas thêm hai frame rồi unmount;
  DOM nhận focus sau commit với `preventScroll` để không làm nhảy viewport.
  Hero DOM dùng đúng inset/tỷ lệ center sheet (`89.333vw` / `29.5rem`,
  aspect `67/101`) thay vì đổi sang card ngắn.
- Error boundary chuyển sang CSS 3D fallback nếu scene lỗi; fallback vẫn là
  carrier hai mặt, có flip mặt sau và opening timing riêng theo desktop/mobile/
  reduced motion.

### Asset verdict đã chốt cho prototype

Hai master alpha sau chỉ **pass cho prototype cover/scene ban đầu**, không phải
asset pack production:

```text
public/chungdoi/templates/long-phung-gatefold/source/dragon-left-master-v2.png
public/chungdoi/templates/long-phung-gatefold/source/phoenix-right-master-v1.png
```

QA đã pass: alpha sạch trên white/black/lacquer-red/dark-green, không thấy
bright chroma-green; silhouette/head/center-facing gesture đọc được ở mock
closed cover `320px` và `390px`; dragon có bốn chân đọc được, phoenix crest
đọc được. Diagnostics authoritative là `*-v3.png` trong `asset-work/`:

```text
phoenix-alpha-diagnostic-v3.png
gatefold-mobile-readability-320px-v3.png
gatefold-mobile-readability-390px-v3.png
```

`asset-manifest.draft.json` đã được đồng bộ sang hai source versioned này và
canvas master `887 × 1774`; nó **vẫn là draft**, không được runtime import hay
registrar trước khi có layer/mask production.

### Bước asset mới — foreground cloud candidate đã vào lab

Đã tạo **một** asset tách riêng, không đụng master rồng/phượng:

```text
docs/research/templates/long-phung-gatefold/asset-work/
  cloud-front-chroma-v1.png
  cloud-front-alpha-diagnostic-v1.png

public/chungdoi/templates/long-phung-gatefold/source/
  cloud-front-master-v1.png
```

- Tạo bằng image generation tích hợp trên chroma `#00ff00`, rồi cleanup với
  `--soft-matte --despill --edge-contract 1`.
- Candidate là RGBA `1254 × 1254`; review trên white/black/lacquer-red/dark-
  green pass, không có pixel opaque green-dominant theo heuristic. Hai cụm mây
  vàng giữ padding và không có text/shadow/background baked.
- Scene lab nạp mây này như `gatefold-root` foreground: opacity `0` khi cover
  đóng, chỉ xuất hiện trong pha `reveal` sau khi cánh đã tách, rồi Canvas vẫn
  unmount theo handoff cũ. Nó không vượt hinge ở trạng thái đóng.
- Đây chỉ là **lab candidate** ở native resolution, không phải source final
  `3072px`, không có `opening/cloud-front.webp`, và không làm mini asset pack
  production pass. Draft manifest ghi rõ coordinate space/status để không bị
  gắn nhầm vào wing pivot.

### Kiểm tra đã chạy trong vòng này

- `cloud-front-master-v1.png`: alpha diagnostic bốn nền pass; `14,214` pixel
  opaque, `0` pixel opaque green-dominant theo heuristic.
- QA tay Browser: desktop `1440×900`, mobile `390×844`, clasp drag, tilt/mặt
  sau, opening từ pose đã xoay, reduced motion, DOM focus sau handoff.
- Mobile không có horizontal document overflow ở `390px`.
- `npm run typecheck`: pass.
- ESLint mục tiêu của runtime/lab/test config: pass.
- `npx tsc --noEmit -p tests/tsconfig.json`: pass.
- `npx playwright test tests/e2e/long-phung-gatefold.spec.ts --project=chromium --workers=1`:
  rerun pass sau asset-to-scene patch (desktop clasp state machine, mobile
  no-overflow, reduced motion, CSS fallback/flip).

### Điều chưa được phép coi là done

- Master mascot còn **unsplit**: chưa có body/wing/whisker/tail layers, masks,
  material maps hoặc optimized runtime assets. `cloud-front-master-v1.png` là
  candidate root-only duy nhất, không thay đổi kết luận này; chưa được thêm
  secondary mascot motion hay gọi đây là animation production.
- DOM hiện chỉ là handoff hero của lab, chưa có toàn bộ invitation capabilities
  (album, map, RSVP, QR, guestbook, music, calendar, guest media, ceremonies).
- Chưa có runtime `TemplateArtDirection` / `AssetBible` type, manifest public,
  preview listing, seed demo hay quyết định `heroImageCount`.
- Không public hoá slug hoặc dùng lab như renderer production trước khi những
  gate trên pass.

## Đọc trước khi tiếp tục

1. Đọc toàn bộ file này.
2. Đọc [`SPEC.md`](./SPEC.md).
3. Đọc toàn bộ
   [`DISTINCTIVE_TEMPLATE_ROADMAP.md`](../../DISTINCTIVE_TEMPLATE_ROADMAP.md),
   đặc biệt checkpoint đầu tài liệu, physical opening, stack, asset pipeline và
   Definition of Done.
4. Đọc phần **“Chung Đôi: Playbook tạo mẫu thiệp mới”** trong
   [`INSPECTION_GUIDE.md`](../../INSPECTION_GUIDE.md).
5. Không thay đổi quyết định đã khóa bên dưới nếu không có yêu cầu rõ ràng của
   người dùng.

## Mục tiêu task

Làm **một** mẫu thí điểm UI phá cách, không triển khai hàng loạt 66 mẫu.
Mẫu thí điểm phải chứng minh:

- bìa là vật thể 3D hai mặt, có chiều dày, ánh sáng, bóng, drag/tilt/flip;
- click/tap/Enter/Space mở thiệp, drag không kích hoạt mở nhầm;
- opening là một quá trình vật lý liên tục từ pose 3D hiện tại, không phải
  fade/swap sang trang khác;
- state machine là `CLOSED -> OPENING -> HANDOFF -> OPENED`;
- sau handoff, toàn bộ content/functionality là React DOM và vẫn đủ album, map,
  RSVP, QR, guestbook, music, calendar, guest media, additional ceremonies,
  i18n;
- desktop/mobile/reduced-motion/WebGL fallback đều có treatment riêng.

## Quyết định đã khóa trong session này

| Hạng mục | Quyết định |
| --- | --- |
| Pilot slug | `long-phung-gatefold` |
| Renderer family | `gatefold` |
| Carrier | Gatefold ba phần: center board + hai cánh gập có bản lề thật |
| Cultural direction | Sơn mài Việt Nam đương đại; **không** tuyên bố phục dựng một triều đại |
| Motif | Rồng ở cánh trái, phượng ở cánh phải, hướng vào clasp trung tâm |
| Cover interaction | `tilt-and-flip`, thấy mặt sau, drag/touch, threshold đề xuất `8px`, giữ pose |
| Opening | Clasp nhả -> cánh trái mở -> cánh phải lệch khoảng `70ms` -> lộ inner sheet -> camera settle -> DOM handoff |
| Desktop duration | `1900ms` |
| Mobile duration | `1650ms` |
| Reduced motion | `200ms`, vẫn giữ activate -> reveal -> handoff, không biến mọi duration thành `0` |
| Stack | R3F/Three/Drei cho vật thể; GSAP + `@gsap/react` cho master timeline; React DOM/Tailwind/shadcn cho content; Lenis là scroll authority; Web Audio cho SFX |
| Visual direction | **A v2 — engraved restraint** |

### Visual direction A v2

File đã chọn:

```text
docs/research/templates/long-phung-gatefold/concepts/
  selected-a-engraved-restraint-v2.png
```

Đặc tính phải giữ:

- lacquer crimson `#5A0B12`, deep cinnabar `#7C1B1B`, antique gold
  `#B58A3A`, warm ivory `#EAD9B8`, lacquer black `#17110F`;
- engraved gold linework thưa, negative space lớn, material không bóng nhựa;
- clasp tròn hai nửa nối đúng center seam khi đóng, tách thành hai nửa khi mở;
- inner sheet ivory sạch để DOM render tên cặp đôi/ngày cưới;
- cả rồng và phượng là layer gắn với cánh tương ứng, không phải một composite
  toàn-cover.

Hai concept không chọn vẫn được lưu để tham chiếu, **không trộn style**:

- `variant-b-lacquer-relief.png`: material/relief mạnh nhưng quá dày, rủi ro
  palace/fantasy ornament.
- `variant-c-geometric-deco.png`: silhouette mobile rõ nhưng abstraction làm
  yếu long-phụng và dễ thành geometric-deco chung.

## Các spec đã viết

- [`SPEC.md`](./SPEC.md): concept, originality gate `5/5`,
  `TemplateArtDirection`, `PhysicalOpeningModel`, `AssetBible`, storyboard
  desktop/mobile/reduced-motion, mapping toàn bộ capability và acceptance gates.
- [`concepts/prompts.md`](./concepts/prompts.md): prompt của variant A/B/C và
  prompt edit dùng để thêm clasp vào A v2.
- [`mini-asset-prompts.md`](./mini-asset-prompts.md): prompt production draft
  cho master/layer/mask, rule cleanup và review.
- [`asset-manifest.draft.json`](./asset-manifest.draft.json): asset plan, anchor,
  pivot, z-layer và kích thước mục tiêu. JSON đã parse hợp lệ.

### Lưu ý về draft manifest

Manifest vẫn là **draft**. Source đã trỏ tới master versioned đang pass prototype
và target đã là `887 × 1774`, nhưng còn thiếu toàn bộ split layer/mask/material
asset. Không dùng manifest này để registrar hay runtime trước khi mọi asset tồn
tại và pass review production.

## Asset work đã làm

### Quy tắc tool đã chốt

- Người dùng đã yêu cầu tiếp tục bằng image generation tích hợp, **không dùng
  OpenAI API key/CLI fallback**.
- Đã dùng `imagegen` tích hợp để generate source trên nền chroma phẳng
  `#00ff00`.
- Cleanup alpha dùng helper cục bộ:

  ```bash
  python3 /Users/namdo/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py
  ```

- Lệnh `python` không có trong môi trường; dùng `python3`.
- Với linework mảnh, pass tốt hơn dùng `--soft-matte --despill --edge-contract 1`.
- Không coi color image AI là PBR data; foil mask, emboss mask, paper normal và
  roughness phải được derive/cleanup riêng sau này.

### Dragon

| File | Trạng thái | Ghi chú |
| --- | --- | --- |
| `asset-work/dragon-left-master-chroma-v2.png` | Giữ làm intermediate chroma source | Rồng vàng engraving trên nền xanh; v2 sửa anatomy thành 4 chân đọc được |
| `public/.../source/dragon-left-master.png` | Không dùng làm final | Matte pass đầu, giữ để so sánh/recover |
| `public/.../source/dragon-left-master-v2.png` | Candidate hiện tại | Pass anatomy v2; alpha cleanup bằng `edge-contract 1` |
| `asset-work/dragon-alpha-diagnostic.png` | Diagnostic pass đầu | Bốn nền contrast |
| `asset-work/dragon-alpha-diagnostic-v2.png` | Diagnostic candidate hiện tại | Bốn nền trắng/đen/lacquer đỏ/xanh đậm |

Review đã làm cho dragon v2:

- Anatomy: v1 bị reject vì chỉ thấy rõ 3 chân; v2 có 4 chân đọc được.
- Alpha: pass đầu còn fringe xanh mảnh; v2 dùng `edge-contract 1` tốt hơn.
- Chưa coi là final production cho đến khi kiểm tra projected width `320px` và
  overlay trên cover thật.
- Quick pixel diagnostic trên alpha v2 không tìm thấy pixel xanh rõ ràng theo
  heuristic, nhưng review bằng mắt vẫn là gate chính.

### Phoenix

| File | Trạng thái | Ghi chú |
| --- | --- | --- |
| `asset-work/phoenix-right-master-chroma-v1.png` | Giữ làm intermediate chroma source | Phoenix vàng engraving trên nền xanh |
| `public/.../source/phoenix-right-master-v1.png` | Candidate, chưa accept | Alpha cleanup dùng `edge-contract 1` |

Review đã làm cho phoenix v1:

- Có một silhouette phoenix, hai chân và wing/tail group có vẻ tách được.
- Alpha four-background diagnostic v3 hiện đã có và pass prototype review; nó
  vẫn chưa thay thế QA registration của layer production.
- Chưa tạo các layer `phoenix-body-right`, `phoenix-wing-front-right`,
  `phoenix-tail-front-right`.

### Foreground cloud

| File | Trạng thái | Ghi chú |
| --- | --- | --- |
| `asset-work/cloud-front-chroma-v1.png` | Intermediate | Output image generation tích hợp trên chroma `#00ff00` |
| `public/.../source/cloud-front-master-v1.png` | Lab candidate | RGBA `1254 × 1254`, full root coordinate space, alpha clean |
| `asset-work/cloud-front-alpha-diagnostic-v1.png` | QA pass | Bốn nền white/black/lacquer-red/dark-green |

Không gắn mây này vào một wing. Nó là opening-only foreground của
`gatefold-root`, hidden khi cover đang đóng; production vẫn cần source
`3072px` và `cloud-back` riêng.

### Asset chưa được tạo

Chưa generate hoặc derive bất kỳ asset nào sau đây:

- `dragon-body-left`, `dragon-whiskers-left`;
- `phoenix-body-right`, `phoenix-wing-front-right`,
  `phoenix-tail-front-right`;
- `cloud-back`, source `cloud-front` production `3072px`;
- foil mask, emboss mask, shadow pass;
- `paper-color`, `paper-normal`, `foil-roughness`;
- mobile variants, optimized runtime WebP, asset-manifest production.

Không tạo tất cả layer từ một composite bằng crop chữ nhật. Mỗi layer phải giữ
cùng canvas/registration với master, alpha sạch, safe padding và pivot đã khai
báo.

## Cấu trúc file hiện tại

```text
docs/research/templates/long-phung-gatefold/
  CONTINUATION.md                 # file này
  SPEC.md
  asset-manifest.draft.json
  mini-asset-prompts.md
  concepts/
    prompts.md
    selected-a-engraved-restraint-v2.png
    variant-a-engraved-restraint.png
    variant-b-lacquer-relief.png
    variant-c-geometric-deco.png
  asset-work/                     # intermediate + diagnostic, không runtime
    dragon-left-master-chroma-v2.png
    dragon-alpha-diagnostic.png
    dragon-alpha-diagnostic-v2.png
    phoenix-right-master-chroma-v1.png
    cloud-front-chroma-v1.png
    cloud-front-alpha-diagnostic-v1.png

public/chungdoi/templates/long-phung-gatefold/
  source/
    dragon-left-master.png         # alpha pass đầu, không chọn
    dragon-left-master-v2.png      # candidate hiện tại
    phoenix-right-master-v1.png    # candidate, chưa accept
    cloud-front-master-v1.png      # lab candidate, root-only
```

## Hiện trạng code — legacy vẫn không đụng, lab đã có

- `src/components/chungdoi-envelope-3d.tsx` và `src/components/chungdoi-demo.tsx`
  vẫn là legacy, không sửa và không tái dùng làm gatefold.
- `three`, `@react-three/fiber`, `@react-three/drei`, `gsap` và `@gsap/react`
  là stack runtime đúng scope của pilot.
- `TemplateArtDirection` / `AssetBible` production runtime type chưa tạo; spec
  vẫn là authority. Lab chỉ dùng fixture `long-phung-gatefold-pilot.ts`.
- Có E2E lab riêng; chưa thêm regression production renderer vì chưa public hoá.

## Thứ tự tiếp tục an toàn

1. Đọc file này + spec/roadmap/playbook như phần đầu; kiểm tra `git status` để
   giữ nguyên các thay đổi user đang stage.
2. Giữ lab tách biệt; không public hoá slug, registrar hay legacy demo.
3. Dùng imagegen edit theo `mini-asset-prompts.md` để tách từng mascot layer,
   mỗi lần chỉ thay một phần và giữ exact full-canvas registration:
   - dragon body -> dragon whiskers;
   - phoenix body -> near wing -> front tail;
   - sau đó mới làm `cloud-back` và finalise `cloud-front` 3072px.
4. Chroma-clean từng layer; kiểm tra alpha trên bốn nền và kiểm tra ghép lại
   khớp master pixel-for-pixel ở frame 0.
5. Derive mask từ master/layer đã duyệt, không nhờ AI sinh PBR color maps:
   - foil mask;
   - emboss/height source;
   - paper normal;
   - foil roughness.
6. Khi mini asset pack production pass, thay master tạm trong scene bằng layer
   đúng registration, rồi mới thêm secondary motion rất tiết chế.
7. Sau đó mới làm DOM renderer đầy đủ section và
   shared business capability.

## Không được làm khi resume

- Không quay lại thực hiện 66 mẫu.
- Không dùng `ArtInvitation` nếu làm mất gatefold family identity.
- Không đổi bìa thành fade/swap hoặc reset pose trước khi mở.
- Không dùng một ảnh phẳng/composite cho mascot animation.
- Không xóa các asset version cũ; chúng là recovery references.
- Không override pipeline legacy `flyOnOpen`/Song Phụng.
- Không install Motion/Framer Motion, React Spring, Anime.js, Rapier/Cannon,
  Spline, Rive, ScrollTrigger hoặc WebGPU cho pilot.
- Không tự thêm text AI vào artwork; text/name/date luôn do DOM/texture pipeline
  render.

## Validation đã chạy

- `git diff --check`: pass.
- `asset-manifest.draft.json`: parse JSON pass.
- Đã xác nhận branch:

  ```text
  feat/new-invitation-layouts...origin/feat/new-invitation-layouts
  ```

- Worktree tại thời điểm checkpoint gồm:

  ```text
  A  docs/research/DISTINCTIVE_TEMPLATE_ROADMAP.md
  M  docs/research/INSPECTION_GUIDE.md
  M  messages/vi.json
  M  package.json
  M  package-lock.json
  M  playwright.config.ts
  ?? docs/research/templates/
  ?? public/chungdoi/templates/
  ?? src/app/[locale]/lab/
  ?? src/components/chungdoi-long-phung-gatefold-lab.tsx
  ?? src/components/gatefold/
  ?? src/data/long-phung-gatefold-pilot.ts
  ?? tests/e2e/long-phung-gatefold.spec.ts
  ```

Hai file docs đầu đã stage từ trước; không tự unstage, reset hoặc ghi đè chúng.

## Reference văn hóa được dùng làm guardrail

- Vietnam National Museum of History — dragon/phượng trên Nguyễn dynasty
  treasures: <https://vnmh.com.vn/en/Articles/3173/55924/special-exhibition-the-dragon-phoenix-on-treasures-of-the-nguyen-dynasty.html>
- Vietnam National Museum of History — crimsoned/gilded wood reference:
  <https://vnmh.com.vn/en/Articles/3188/18228/collection-of-crimsoned-and-gilded-wood-worshipping-objects-under-nguyen-dynasty-preserved-in-vietnam-national-museum-of-history-vnmh.html>
- Vietnam National Fine Arts Museum — lacquer/traditional arts collections:
  <https://vnfam.vn/en/about>

Các nguồn là guardrail để tránh pha trộn tùy tiện, không phải source để trace,
copy hoặc claim historical reconstruction.

## Resume prompt gợi ý

```text
Đọc toàn bộ docs/research/templates/long-phung-gatefold/CONTINUATION.md,
SPEC.md, DISTINCTIVE_TEMPLATE_ROADMAP.md và phần Playbook trong
INSPECTION_GUIDE.md. Kiểm tra git status; giữ gatefold lab tách biệt và không
đổi decision đã khóa. Tiếp tục từ mini asset pack production: tách layer có
registration đầy đủ, alpha/mask QA rồi mới làm DOM renderer full capability.
```

## Checkpoint cập nhật — 2026-07-31

Phần dưới đây supersede các ghi chú cũ nói rằng pilot còn chỉ ở lab. Pilot đã
được nối vào production demo shell, nhưng vẫn chưa được gọi là asset
production-complete.

### Đã hoàn tất trong checkpoint này

- `src/data/long-phung-gatefold-pilot.ts` đã export typed
  `TemplateArtDirection`, `PhysicalOpeningModel`, `AssetBible` và fixture demo
  đầy đủ cho hai người, hai nghi lễ, gallery, map, dress code, wishes, QR và
  music.
- `src/components/chungdoi-long-phung-gatefold-lab.tsx` sở hữu physical
  opening: state `closed -> opening -> handoff -> opened`, clasp drag/touch
  threshold `8px`, desktop `1900ms`, mobile `1650ms`, reduced motion `200ms`,
  pose snapshot, orbit continuity, camera settle theo DOM hero và CSS fallback.
- `src/components/chungdoi-demo.tsx` chỉ chuyển pilot sang gatefold lab; các
  slug legacy vẫn dùng envelope cũ. `capture=1` và preview mode đi thẳng vào
  DOM document.
- `src/components/chungdoi-tpl-long-phung-gatefold.tsx` đã đăng ký renderer
  production. Renderer giữ lại cùng DOM hero 67:101 trước khi đi vào
  `LongPhungGatefoldInvitationBody`, tránh nhảy từ WebGL center sheet sang
  portrait section.
- `src/data/templates/long-phung-gatefold.manifest.ts` đã đăng ký slug,
  catalog/i18n, assets và generated registrars. Khi DB demo trống,
  `src/app/[locale]/templates/[slug]/demo/page.tsx` dùng fixture fallback thay
  vì hiển thị “đang cập nhật”.
- Mini runtime asset pack hiện có composite WebP/mobile, cloud candidate,
  paper color/normal, foil roughness và diagnostics bốn nền tại
  `public/chungdoi/templates/long-phung-gatefold/`. Pipeline deterministic nằm
  trong `scripts/generate-long-phung-gatefold-assets.ts` và report ghi rõ
  semantic promotion đang bị block nếu thiếu author masks/layers.
- Đã capture riêng ba preview pilot:
  `public/chungdoi/images/template-previews/en/{listing,portrait,landscape}/long_phung_gatefold.webp`.
  Landscape là frame cover đóng để catalog không lấy lát cắt giấy trống từ
  document quá dài.

### Validation mới nhất

- `npm run typecheck`: pass.
- ESLint trên các file pilot/route/test: pass; chỉ còn các warning `<img>` cũ
  trong `chungdoi-demo.tsx`.
- `npx playwright test tests/e2e/long-phung-gatefold.spec.ts`: pass 6/6 trên
  production build cô lập, gồm desktop drag ở lab, mobile overflow, reduced
  motion, CSS fallback/flip, production demo opening và production capture.
- Sau visual QA phát hiện một khe khựng ở cuối opening, pilot production
  renderer đã được render synchronous trong `src/components/chungdoi-demo.tsx`
  thay vì chờ `next/dynamic`; frame sampler production ghi nhận `0` gap frame
  trong đoạn Canvas-to-DOM handoff.
- Preview metadata pass: listing `768px` wide, portrait `750×1333`, landscape
  `2400×1260`, WebP hợp lệ.
- `npm run build` đi qua compile/typecheck; nếu chạy ngoài E2E cần
  `ALLOW_INSECURE_SITE_URL=1` cho local HTTP. E2E đã set biến này.

### Vẫn là blocker có chủ đích

- Dragon/phoenix vẫn là composite runtime an toàn cho lab; chưa có bộ layer
  semantic co-registered (`body`, `wing`, `whisker`, `tail`), author masks,
  foil/emboss/shadow pass và `cloud-back` production. Không được tự tách giả
  bằng heuristic hoặc gọi đây là secondary mascot animation production.
- Shared Web Audio cho clasp/hinge/settle và mute state đã được hoàn tất ở
  checkpoint polish phía cuối file; các blocker còn lại không phụ thuộc audio.
- Cần thêm QA sâu cho orbit-to-opening continuity, keyboard/touch matrix,
  runtime asset failure, a11y/perf budgets và review trực quan ở các locale
  còn lại trước khi đổi status thành production-ready.

### Bước resume kế tiếp

1. Chốt authoring package thật trong Figma/artist workflow: layer, mask,
   registration, foil/height/shadow và `cloud-back`; chạy recomposition/diff
   gate của asset pipeline.
2. Khi pack pass, thay composite trong scene bằng layer đã duyệt và chỉ thêm
   secondary motion tối thiểu.
3. Regression Web Audio lifecycle/mute dùng chung với nhạc nền và bổ sung E2E
   cho lỗi asset, keyboard, pointer/touch, locale.
4. Chạy lại preview pilot sau mỗi thay đổi visual; không chạy capture hàng loạt
   66 mẫu.

## Checkpoint follow-up — 2026-07-31 — polish pass

Đây là phần tiếp nối sau khi hoàn thiện polish cho pilot; các ghi chú cũ về
audio/chapter bên trên được supersede trong scope này.

### Đã làm

- Back face của center board giờ là một mặt in thật trong cả WebGL và CSS
  fallback: nền lacquer đen/cinnabar, viền foil, ngày cưới, tên đôi và seal.
  Date text được wrap/fitting để không vỡ ở locale dài; fallback có nút
  `Xem mặt sau` giữ nguyên affordance tilt-and-flip đã khóa.
- Web Audio cue nhẹ đã nối vào cùng mute state với nhạc nền trong production
  shell: clasp release ở user gesture, hinge trái/phải theo stagger 70ms và
  paper settle trước handoff. AudioContext tạo lazy, resume trong gesture,
  cleanup khi unmount; muted thì không phát cue.
- Family wings đã có chapter foldout semantic bằng native `<details>` với
  focus ring, keyboard toggle và label i18n `details`; event inserts được thêm
  paper-lift hover rất nhẹ, không đổi grid/foldout grammar hay mobile overflow.
- `semanticLayers` được khai báo nullable trong pilot fixture và composite
  artwork mesh gắn `userData.assetRole`/`semanticLayersReady: false`. Đây chỉ là
  hook để thay layer authoring sau này, không giả vờ đã có layer animation.

### Validation follow-up

- `npm run typecheck`: pass.
- ESLint các file pilot: pass; chỉ còn 6 warning `<img>` legacy trong
  `src/components/chungdoi-demo.tsx`, không phát sinh từ polish pass.
- `npx playwright test tests/e2e/long-phung-gatefold.spec.ts`: pass 6/6 trên
  production build cô lập sau khi thêm back face, audio hooks và foldout.
- `ALLOW_INSECURE_SITE_URL=1 npm run build`: pass; chạy `npm run check` không
  có cờ local này sẽ dừng ở HTTPS guard của repo vì env local dùng HTTP.
- Visual QA capture document desktop xác nhận đúng thứ tự: hero, portrait
  prints, family gatefold, ceremony inserts, calendar, album, timeline, map,
  dress code, guestbook, gift QR và footer; không có horizontal overflow trong
  mobile suite.

### Còn bỏ ngỏ có chủ đích

- Composite dragon/phoenix vẫn là runtime fallback; semantic author layers,
  masks, foil/height/shadow pass và `cloud-back` chỉ được promote sau khi có
  source co-registered thật và recomposition diff pass.
- Chưa đổi pilot thành `production-ready` toàn diện: còn cần review locale
  dài, keyboard/touch matrix sâu hơn, asset failure path, a11y/perf budget và
  visual sign-off trên thiết bị thật.

### Bước tiếp theo khi hệ thống ổn định

1. Artist/Figma chốt mini asset pack thật (`body`, `wing`, `whisker`, `tail`,
   `cloud-back`) với exact registration và masks; chạy deterministic QA.
2. Nếu pack pass, thay composite bằng semantic layers trong scene, giữ motion
   secondary ở mức tối thiểu và không đổi physical opening contract.
3. Chạy visual review lại 5 locale và thiết bị mobile thật; chỉ sau sign-off
   mới cân nhắc mở rộng sang template tiếp theo.

## Checkpoint follow-up — 2026-07-31 — enhanced Vietnamese experience

User đã yêu cầu build toàn bộ polish chỉ cho `long-phung-gatefold`, ưu tiên
khách Việt. Không mở rộng sang 66 mẫu và không thay physical opening contract.

### Đã bổ sung

- Nút `Xem mặt sau` / `Về mặt trước` có `aria-pressed`, hoạt động cho WebGL,
  fallback, touch và keyboard. WebGL quay toàn object bằng tween có invalidate;
  khi đang ở mặt sau, nút mở bị khóa cho đến lúc quay lại mặt trước.
- CSS fallback có reverse-cover overlay đúng visual hierarchy, không còn lộ hai
  cánh giấy ivory trống khi xem mặt sau. Visual QA cũng phát hiện seal 3D chồng
  lên năm trên WebGL back face; seal đã được chuyển xuống cuối layout.
- Texture dragon/phoenix/cloud được warm trước thao tác; clasp có haptic 8ms
  khi thiết bị hỗ trợ Vibration API và reduced motion không active. Web Audio
  vẫn là shared mute state như checkpoint trước.
- Thêm foil-glint procedural rất nhẹ trên hai wing composite, thay đổi opacity
  theo góc camera; fallback dùng glint CSS. Đây là material treatment, không
  claim rằng mascot đã có semantic animation layer authoring.
- Production document có chapter rail sticky bằng các label Việt hiện có,
  scroll-safe anchors; family foldout có sao chép địa chỉ với feedback rõ ràng;
  shell có nút xem lại bìa mà không reload trang hoặc restart experience cũ.

### Validation follow-up

- `npm run typecheck`: pass.
- ESLint trên file pilot mới sửa: pass, chỉ còn 6 warning `<img>` legacy trong
  `chungdoi-demo.tsx`.
- `ALLOW_INSECURE_SITE_URL=1 npm run build`: pass.
- `npx playwright test tests/e2e/long-phung-gatefold.spec.ts`: pass 6/6,
  gồm fallback flip quay về mặt trước trước khi mở, replay cover production và
  chapter rail/copy-address trong production capture.
- Visual QA desktop WebGL, mobile CSS fallback back face và document capture:
  pass sau khi sửa overlay reverse và vị trí seal.

### Boundary còn giữ nguyên

- `semanticLayers` vẫn nullable: chỉ artist/Figma package có registration,
  alpha/mask/foil/height/shadow hợp lệ mới được thay composite runtime.
- Không thêm particle, confetti, bounce game-like, shader effect nặng hoặc
  autoplay âm thanh mới. Motion và sound vẫn tuân theo reduced motion/mute.
