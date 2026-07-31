# Nguyệt Ảnh Sleeve - implementation checkpoint

## Trạng thái

Mẫu `nguyet-anh-sleeve` đã được triển khai và đăng ký vào catalog.

- Carrier: sleeve kính khói với film card hai mặt.
- Opening: aperture release, extract, rotate, camera settle và two-frame DOM
  handoff.
- Post-open renderer: contact sheet phòng tối, không dùng lại section grammar
  của Long Phụng Gatefold.
- Runtime: WebGL/R3F với CSS 3D fallback hai mặt.
- Mobile texture: `512x768`; desktop texture: `1024x1536`.
- Reduced motion: giữ release, reveal và focus handoff trong `200ms`.
- Production demo: có replay cover, shared music/mute, RSVP và guest media.

## Điểm vào chính

- Data/contract: `src/data/nguyet-anh-sleeve-pilot.ts`
- Experience shell: `src/components/chungdoi-nguyet-anh-sleeve-lab.tsx`
- Three.js scene: `src/components/sleeve/nguyet-anh-sleeve-scene.tsx`
- CSS fallback: `src/components/sleeve/nguyet-anh-sleeve-fallback.tsx`
- DOM invitation: `src/components/sleeve/nguyet-anh-sleeve-invitation.tsx`
- Production wrapper: `src/components/chungdoi-tpl-nguyet-anh-sleeve.tsx`
- Manifest: `src/data/templates/nguyet-anh-sleeve.manifest.ts`
- Lab route: `src/app/[locale]/lab/nguyet-anh-sleeve/page.tsx`
- E2E: `tests/e2e/nguyet-anh-sleeve.spec.ts`

## Asset và preview

- Prompt gốc: `docs/research/templates/nguyet-anh-sleeve/prompts.md`
- Source master:
  `public/chungdoi/templates/nguyet-anh-sleeve/source/lotus-photogram-master-v1.png`
- Runtime variants:
  `public/chungdoi/templates/nguyet-anh-sleeve/cover/lotus-photogram-v1.webp`
  và
  `public/chungdoi/templates/nguyet-anh-sleeve/cover/lotus-photogram-v1.mobile.webp`
- Preview listing/portrait do capture pipeline tạo từ `?capture=1`.
- Landscape preview dùng focal crop `y=355`, `768x403` từ listing rồi resize
  `2400x1260`, để giữ đủ tên đôi uyên ương thay vì khoảng thở phía trên hero.

## Hợp đồng tương tác đã khóa

1. Canvas, aperture và card không gọi opening.
2. Chỉ native button `Mở thiệp` gọi master timeline.
3. Khi thấy mặt sau, nút mở bị khóa cho đến khi card về mặt trước.
4. Camera và controls target được snapshot trước khi timeline chạy.
5. Card rời sleeve trước khi camera dolly vào frame đầu.
6. DOM hero giữ cùng aspect ratio `13:19` và đã reserve geometry.
7. DOM nhận focus; Canvas unmount sau hai `requestAnimationFrame`.
8. Replay production trả về đúng state `closed`.

## Validation checkpoint

Đã đạt:

- `npm run templates:register`
- `npm run typecheck`
- `npm run typecheck:tests`
- ESLint cho toàn bộ file mới và file tích hợp
- `npm run test:unit` (`160/160`)
- `ALLOW_INSECURE_SITE_URL=1 npm run build`
- E2E Nguyệt Ảnh Sleeve (`6/6`)
- E2E hồi quy Nguyệt Ảnh + Long Phụng (`12/12`)
- Capture preview: listing, portrait và landscape

Các warning ESLint còn lại nằm trong phần `<img>` legacy của
`src/components/chungdoi-demo.tsx`; mẫu mới dùng `next/image`.

## Lưu ý vận hành

Khi tự chạy capture server, dùng:

```bash
next start -p 3200
```

Không truyền `-H 127.0.0.1` cho harness hiện tại. Với Next.js 16 và rewrite
next-intl của project, hostname ép cứng làm middleware phát absolute rewrite và
health check có thể rơi vào self-redirect. Sau khi server sẵn sàng:

```bash
CAPTURE_BASE_URL=http://127.0.0.1:3200 \
  npm run screenshots:templates -- \
  --slug nguyet-anh-sleeve \
  --no-sync-production
```

Capture pipeline mặc định sẽ tạo lại landscape từ top crop. Nếu chạy lại,
áp dụng lại focal crop được ghi ở phần Asset và preview.
