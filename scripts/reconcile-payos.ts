/**
 * Đối soát các đơn payOS chưa chốt với payOS. Dùng để chạy tay khi phát triển
 * hoặc khi điều tra sự cố, trên máy có source và `tsx`:
 *
 *   npm run reconcile:payos
 *
 * KHÔNG dùng được trong container production: image là Next standalone build,
 * trong đó không có `package.json`, `src/` hay `tsx`. Cron production gọi route
 * `/api/cron/payos-reconcile` qua `scripts/cron-hit-endpoint.sh` — xem
 * `deploy-fast.sh` và `docs/deploy-payment.md`.
 *
 * Bịt luồng mất tiền duy nhất còn lại của payOS: khách đã chuyển tiền nhưng
 * webhook không tới được (deploy đang restart, mạng chớp, chữ ký lệch) và khách
 * đã đóng tab nên poll trên trang thanh toán cũng không còn chạy. Xem
 * `src/lib/payos-reconcile.ts`.
 */
import { reconcileOutstandingPayosPayments } from "@/lib/payos-reconcile";
import { prisma } from "@/lib/prisma";

async function main() {
  const summary = await reconcileOutstandingPayosPayments();
  console.log(
    `Tổng kết: quét ${summary.scanned}, cứu được ${summary.settled}, không đổi ${summary.unchanged}, lỗi ${summary.failed}`,
  );

  // Báo lỗi ra exit code để cron log và người vận hành nhìn thấy: hỏi payOS
  // không được trên diện rộng nghĩa là lưới an toàn đang không hoạt động.
  if (summary.failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Script lỗi:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
