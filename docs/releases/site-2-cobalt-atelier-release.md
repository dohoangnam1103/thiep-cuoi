# Site 2 Cobalt Atelier Release Record

Trạng thái: **sẵn sàng deploy, chưa deploy**. Mọi gate local xanh. Deploy
production và smoke/rollback chỉ chạy được từ máy có SSH tới VPS
(`root@163.223.9.198` cấm BatchMode từ máy dev này: SSH timeout ngày
2026-09-15, không route). Không có thay đổi nào được đẩy lên production
trong đợt này, và site 1 không bị chạm tới dưới mọi hình thức.

## 1. Nội dung release

- 12 commits từ `fb77c34` (porcelain) tới `ea41909` (Task 12), toàn bộ trong
  `apps/site-2/**`, `tests/e2e/site-2-*`, `tests/site-2-*`,
  `docs/research/site-2-*`.
- Marketing shell + workspace shell + invitation isolation shell (URL giữ
  nguyên), homepage/ghi danh/bảng giá/auth/help/policy dashboard/editor/
  guest/RSVP/payment-sandbox Cobalt Atelier.
- Renderer (`packages/invitation-core`, data registry) và mọi file site 1
  (`src/**`, `messages/vi.json` gốc) không đổi trong diff đã commit.

## 2. Gate đã pass (local, 2026-09-15)

- `npm run check:site-2` (generate + lint + typecheck + unit + build): PASS.
- `test:boundary`: chỉ đỏ trên dirt site-1 có sẵn từ trước Task 1
  (`AGENTS.md`, `src/components/chungdoi-tpl-*`...), mọi file release
  in-scope.
- `test:e2e` site-2 (7 specs, 5 projects gồm visual desktop/mobile/dark/
  reduced-motion): 66/66 PASS.
- `deploy-app.sh site-2 --check-only` với origin thật: preflight + isolation
  guards PASS.
- Build với `NEXT_PUBLIC_SITE_URL=https://thiep.hoangnam.cloud`: PASS, không
  hostname master nào trong trang prerender.

## 3. Checklist cho operator (có SSH)

```bash
# 0. Ghi checkpoint trước deploy (site 1 chỉ đọc)
ssh root@163.223.9.198 "docker inspect chungdoi-site2-web --format '{{.Image}} {{.State.StartedAt}}'; \
  docker inspect <site-1-container> --format '{{.Image}} {{.State.StartedAt}}'"
# 1. Deploy site-2 (KHÔNG chạy npm run deploy gốc)
NEXT_PUBLIC_SITE_URL=https://thiep.hoangnam.cloud npm run deploy:site-2
# 2. Smoke site-2: /, /mau-thiep, /bang-gia, /dang-nhap, /dashboard,
#    /editor, /khach-moi, /rsvp, /thanh-toan, /huong-dan, policy, /thiep/<slug>
#    ở desktop + mobile.
# 3. Smoke site-1 read-only: so image ID + start time với checkpoint ở bước 0.
# 4. Rollback: promote image site-2 trước đó, chạy lại smoke cả hai site.
# 5. Quan sát CPU/RAM/disk/logs site-2 qua một chu kỳ backup.
```

## 4. Khuyết điểm đã biết khi lên prod

- Payment ở chế độ sandbox theo mặc định (`SITE2_PAYMENT_ENABLED` chưa set
  trên target): trang thanh toán hiện trạng thái vô hiệu cho tới checklist
  tích hợp Task 11.
- Upload ảnh khách (media dialog) 404 tới khi có endpoint contributions.
- LCP mobile homepage ~5.5s trên 4G giả lập (chi tiết + issue trong biên bản
  visual acceptance). Không chặn launch theo tiêu chí ngoại lệ có bằng chứng.
- Toggle dark mode tay trong workspace chưa có; dark theo system preference.
- Preview assets local không đầy đủ (prod sync từ master public qua
  Dockerfile); E2E và screenshot local dùng bản copy tạm đã xóa.
