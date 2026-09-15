# Site 2 Cobalt Atelier Release Record

Trạng thái: **ĐÃ DEPLOY lên minipc 2026-09-15 ~06:50 UTC, healthy**.
Deploy qua SSH alias `minipc` (192.168.0.57, cùng LAN). VPS 163.223.9.198
không route được từ máy dev nên mọi smoke prod dưới đây là minipc +
https public. Site 1 không bị chạm: không có master container nào chạy
trên minipc trước/sau deploy, lệnh deploy gốc chưa bao giờ chạy.

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

## 3. Thực tế deploy minipc (2026-09-15, SSH alias `minipc`)

Checkpoint trước deploy (chỉ đọc + backup online, không restart DB):
- Image cũ: `sha256:a4e59b8d4a0e`, container start 2026-09-14T09:16:09Z.
- DB `quick_check: ok`, sha256 `65963341…acca3b`, users 488, invitations
  599 (381 draft + 218 published), guests 165, rsvps 81, payments 0.
- Backup online: `backups/pre-cobalt-20260915.db` (fb6ac453…).
- Media: 350MB, 2730 files. Không migrate (không đổi schema).

Build: context tinh gọn 1.1GB (code + master-public), build trên minipc
native amd64 (driver buildx local hỏng; context docker `minipc` trỏ nhầm
sang 192.168.0.77 nên build bằng `DOCKER_HOST=ssh://minipc` trỏ đúng .57).
Image mới `chungdoi-site2-web:20260915-cobalt` (`075424b6f81f`, 2.81GB),
bake origin `https://thiep.hoangnam.cloud`. Tag rollback `pre-cobalt`
giữ image cũ.

Switch: retag `:production` + `docker compose -p chungdoi-site2-web up -d`
(lưu ý `-p` vì container gốc tạo bằng project name đó). Container mới
healthy, `/api/health` origin đúng.

Smoke prod (https public + lifecycle có dọn dẹp):
- 7 routes công khai 200, homepage Cobalt mới live.
- register → tạo → autosave → publish → link công khai → RSVP → overview
  (Tham dự 1) → login → guest/payment pages: PASS. Payment hiện đúng trạng
  thái vô hiệu (target chưa có env payment).
- Dọn test data: users/invitations/rsvps về đúng baseline 488/599/81.

Rollback exercise: retag `:production` về `a4e59b8d4a0e` → recreate →
healthy, homepage cũ hiện lại → re-promote `075424b6f81f` → recreate →
healthy, Cobalt live. DB `quick_check: ok` sau mọi bước.

Tài nguyên: site2 CPU ~0%, RAM 48MB/768MB. Các container khác giữ nguyên
uptime (images-db/ds2api/kiro 47h, telegram 10h). Không master container nào
tồn tại trên minipc.

## 4. Checklist còn lại cho operator (VPS, khi có SSH)

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
