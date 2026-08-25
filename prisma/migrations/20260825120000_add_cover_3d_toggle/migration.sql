-- Công tắc bìa thiệp 3D, tắt mặc định.
--
-- Bìa 3D (Envelope3D) chặn màn hình cho tới khi tải xong chunk three.js VÀ chụp
-- xong DOM thành texture: đo trên long-phung-v3-do ở Fast 4G + CPU x4 là ~4,9s,
-- trong khi bìa 2D render xong ở ~1,5s vì nó là DOM thuần và SSR được.
--
-- Cột có DEFAULT nên SQLite thêm được tại chỗ, không phải dựng lại bảng. Hàng
-- AppConfig đang tồn tại nhận 0 (tắt), tức mọi thiệp chuyển sang bìa 2D ngay sau
-- khi migrate — đúng ý định, bật lại từng lúc qua /admin/settings.
ALTER TABLE "AppConfig" ADD COLUMN "cover3dEnabled" BOOLEAN NOT NULL DEFAULT false;
