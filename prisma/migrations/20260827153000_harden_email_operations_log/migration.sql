-- Retry phải dùng lại đúng payload đầu tiên, và mỗi run cần cho admin biết nó
-- hoàn tất hay chết giữa chừng thay vì một card 0/0 trông như thành công.

ALTER TABLE "EmailRun" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'running';
ALTER TABLE "EmailRun" ADD COLUMN "errorMessage" TEXT;
ALTER TABLE "EmailDelivery" ADD COLUMN "html" TEXT NOT NULL DEFAULT '';
