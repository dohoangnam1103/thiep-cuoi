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
import { reconcileOutstandingSlideshowPayosPayments } from "@/lib/slideshow/payment-service";

async function main() {
  // Chạy tuần tự để không nhân đôi burst request tới payOS. Giữ nguyên lượt
  // Invitation trước, rồi mới đối soát domain slideshow độc lập.
  const invitation = await reconcileOutstandingPayosPayments();
  console.log(
    `Thiệp mời: quét ${invitation.scanned}, cứu được ${invitation.settled}, không đổi ${invitation.unchanged}, lỗi ${invitation.failed}`,
  );

  const slideshow = await reconcileOutstandingSlideshowPayosPayments();
  console.log(
    `Slideshow: quét ${slideshow.scanned}, cứu được ${slideshow.settled}, không đổi ${slideshow.unchanged}, lỗi ${slideshow.failed}`,
  );

  // Báo lỗi ra exit code để cron log và người vận hành nhìn thấy: hỏi payOS
  // không được trên diện rộng nghĩa là lưới an toàn đang không hoạt động.
  if (invitation.failed > 0 || slideshow.failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Script lỗi:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
