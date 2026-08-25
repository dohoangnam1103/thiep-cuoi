-- Ghi lại các ca "tiền đã về nhưng thiệp không tự kích hoạt".
--
-- Trước migration này những ca đó chỉ tồn tại dưới dạng `console.warn` trong log
-- container, nên trên thực tế là không ai biết. Bảng mới cho chúng một chỗ bền
-- và hiện được lên /admin/payments.
--
-- Bảng mới hoàn toàn, không đụng tới Payment cũ (kể cả Payment Casso).
CREATE TABLE "PaymentReconciliation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "expectedAmount" INTEGER NOT NULL,
    "receivedAmount" INTEGER NOT NULL,
    "localStatus" TEXT NOT NULL,
    "providerRef" TEXT,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentReconciliation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Truy vấn chính là "đơn này có ca nào chưa" (trang quản trị, theo từng đơn) và
-- "gần đây có ca nào" (điều tra sự cố theo mốc thời gian).
CREATE INDEX "PaymentReconciliation_paymentId_detectedAt_idx" ON "PaymentReconciliation"("paymentId", "detectedAt");
CREATE INDEX "PaymentReconciliation_detectedAt_idx" ON "PaymentReconciliation"("detectedAt");
