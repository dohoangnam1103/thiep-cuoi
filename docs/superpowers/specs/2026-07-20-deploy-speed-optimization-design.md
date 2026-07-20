# Tối ưu tốc độ deploy Mini PC

**Ngày:** 2026-07-20
**Trạng thái:** Đã chốt thiết kế, chờ người dùng review đặc tả

## Bối cảnh

Deployment `20260720112801` mất 192 giây. Log cho thấy:

- Xác minh host, rsync và backup: 6 giây.
- Build web image native: phần lớn thời gian còn lại, trong đó Next build khoảng 30 giây.
- Build migration image thứ hai mất khoảng 68 giây dù `prisma migrate deploy` kết luận không có migration mới.
- Restart + healthcheck: 9 giây.
- Public verification: 2 giây.
- Docker cleanup đồng bộ: 9 giây.

Production có 13 migration đã apply, buildx cache khoảng 10.86 GB và runtime image khoảng 1.92 GB. Mục tiêu đợt này là tối ưu an toàn, giữ nguyên các safety gate, giảm deploy thông thường về khoảng 100-120 giây tùy cache.

## Mục tiêu và ngoài phạm vi

### Mục tiêu

1. Không build migration image hoặc chạy Prisma khi source không có migration pending.
2. Khi có migration mới, vẫn chạy migration bằng source release hiện tại trước khi promote web.
3. Bỏ Docker cache/image cleanup đồng bộ khỏi đường deploy; giữ cleanup cron định kỳ.
4. Giữ nguyên backup, rollback, healthcheck và public verification.

### Ngoài phạm vi

- Chưa tách public assets khỏi runtime image.
- Chưa thay đổi Dockerfile runtime hoặc cấu trúc asset.
- Chưa đổi cơ chế build native amd64.
- Không thay đổi `.env`, database schema, ứng dụng hoặc payment flow.

## Thiết kế

### Migration preflight

Sau rsync và backup, script chạy một bước read-only trên Mini PC:

1. Liệt kê tên thư mục migration trong `releases/current/prisma/migrations`.
2. Đọc các migration đã hoàn tất từ `data/prod.db._prisma_migrations` bằng Python sqlite3.
3. Chỉ coi migration là đã áp dụng khi `finished_at` có giá trị và `rolled_back_at` rỗng.
4. Tính tập `pending = source - applied`.
5. Nếu bảng không tồn tại, DB không đọc được, migration source không hợp lệ, source rỗng bất thường, DB có migration không còn tồn tại trong source, hoặc có migration failed/rolled back, dừng deploy với lỗi rõ ràng.
6. Nếu `pending` rỗng, ghi log skip migration build/run.
7. Nếu có pending migration, build migration image như hiện tại và chạy `prisma migrate deploy`.

Migration runner khi cần sẽ mount source `prisma/` và `prisma.config.ts` từ release hiện tại ở chế độ read-only, đồng thời mount `data/` để Prisma ghi DB. Migration image tạm chỉ được xóa sau khi lệnh migrate thành công hoặc đã xử lý cleanup an toàn.

Bước preflight không ghi DB và không ảnh hưởng container web đang chạy.

### Docker cleanup

Loại bỏ bước gọi `scripts/docker-storage-maintenance.sh` ở cuối mỗi deployment. Cuối deploy chỉ cập nhật idempotently cron maintenance để tiếp tục chạy định kỳ lúc 04:17 Chủ nhật. Việc giữ cache giữa các lần deploy giúp tránh build chậm lại do prune ngay sau lần build vừa hoàn thành.

Các image safety tag vẫn do flow promote quản lý: image mới, image latest và rollback image hiện hành không bị xóa trong deploy.

## Luồng deploy sau thay đổi

### Không có migration mới

```text
verify host
→ rsync source
→ backup DB/uploads/media
→ migration preflight: no pending
→ build web image native
→ promote/restart web
→ healthcheck + deployment/canonical/DB checks
→ public URL verify
```

### Có migration mới

```text
verify host
→ rsync source
→ backup DB/uploads/media
→ migration preflight: pending
→ build web image native
→ build migration image
→ prisma migrate deploy
→ promote/restart web
→ healthcheck + deployment/canonical/DB checks
→ public URL verify
```

Migration vẫn xảy ra trước khi container web mới được promote.

## Error handling và rollback

- Preflight lỗi: dừng trước restart, giữ container cũ.
- Web build lỗi: dừng, giữ container cũ.
- Migration lỗi: dừng, giữ container cũ; backup đã tạo trước đó.
- Container mới không healthy, sai image, canonical/deployment ID sai hoặc DB quick check lỗi: cơ chế rollback hiện tại tiếp tục chạy.
- Public healthcheck lỗi sau promote: báo lỗi theo flow hiện tại; rollback trap xử lý lỗi trong remote restart.

## Kiểm thử và tiêu chí chấp nhận

1. Static shell validation của script pass.
2. Preflight với DB production hiện tại báo `pending=[]` và không tạo migration image.
3. Preflight với DB copy thiếu một migration báo pending đúng tên.
4. Preflight với DB copy có migration failed/rolled back hoặc migration lạ báo lỗi và không chạy build/restart.
5. Migration runner mount source hiện tại chạy được trên DB copy và không có pending thì không thay đổi DB.
6. Deploy dry/read-only inspection xác nhận không có cleanup đồng bộ trong đường chạy.
7. Một deployment thực tế sau implementation phải xác nhận:
   - container healthy;
   - image mới đang chạy;
   - homepage và demo trả HTTP 200;
   - database quick check ok;
   - PayOS status/QR endpoints không bị ảnh hưởng;
   - tổng thời gian được log để so sánh với baseline 192 giây.

## Kỳ vọng hiệu năng

Việc bỏ build migration image không cần thiết tiết kiệm khoảng 68 giây trong deploy không có migration. Bỏ cleanup đồng bộ tiết kiệm khoảng 9 giây. Mức kỳ vọng bảo thủ cho deploy thường là khoảng 100-120 giây sau khi tính dao động build/export image; mốc thấp hơn phụ thuộc BuildKit cache và không được coi là cam kết cứng.
