-- Đo click nút thanh toán trong email nhắc.
--
-- Ba cột `ALTER TABLE ADD COLUMN` chứ không phải redefine cả bảng: `prisma
-- migrate dev` tự sinh ra bản redefine vì nó phát hiện một drift KHÔNG liên quan
-- (`AppConfig.updatedAt` trong DB có `DEFAULT CURRENT_TIMESTAMP` từ migration
-- 20260705080000, còn schema khai `@updatedAt` không kèm default). Gộp việc
-- DROP/CREATE bảng cấu hình giá vào một migration về email là rủi ro không cần
-- thiết, nên bản này viết tay và chỉ làm đúng việc của nó.
--
-- Bảng `EmailDelivery` trên production đã có dữ liệu, nhưng cả ba cột đều nullable
-- hoặc có default nên hàng cũ không cần backfill: thư gửi trước khi có tính năng
-- này thực sự không có số liệu click, và `NULL` nói đúng điều đó — khác hẳn với 0.
ALTER TABLE "EmailDelivery" ADD COLUMN "firstClickedAt" DATETIME;
ALTER TABLE "EmailDelivery" ADD COLUMN "lastClickedAt" DATETIME;
ALTER TABLE "EmailDelivery" ADD COLUMN "clickCount" INTEGER NOT NULL DEFAULT 0;
