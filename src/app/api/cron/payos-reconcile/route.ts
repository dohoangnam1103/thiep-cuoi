import { cronUnauthorized, isAuthorizedCronRequest } from "@/lib/cron-auth";
import { reconcileOutstandingPayosPayments } from "@/lib/payos-reconcile";
import { cleanupStaleSlideshowAssets } from "@/lib/slideshow/asset-cleanup";
import { reconcileOutstandingSlideshowPayosPayments } from "@/lib/slideshow/payment-service";

export const dynamic = "force-dynamic";

/**
 * Đối soát các đơn payOS chưa chốt với payOS và thu gom media slideshow mồ côi.
 *
 * Là HTTP route chứ không phải script chạy bằng `docker exec npm run`: image
 * production là Next standalone build, trong container chỉ có `server.js`,
 * `node_modules`, `public` và `data` — không có `package.json`, `src/`, `scripts/`
 * hay `tsx`. Mọi việc định kỳ vì thế phải đi qua chính app đang chạy.
 *
 * Cron gọi từ host bằng `scripts/cron-hit-endpoint.sh`, xem `deploy-fast.sh`.
 */
export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) return cronUnauthorized();

  const invitation = await reconcileOutstandingPayosPayments();
  console.info("[payos-reconcile] thiệp mời xong", invitation);

  // Chạy tuần tự sau Invitation để không tăng burst request tới payOS.
  const slideshow = await reconcileOutstandingSlideshowPayosPayments();
  console.info("[payos-reconcile] slideshow xong", slideshow);

  const slideshowMedia = await cleanupStaleSlideshowAssets();
  console.info("[payos-reconcile] media slideshow xong", slideshowMedia);

  // Giữ các field summary Invitation ở top-level để tương thích log/consumer cũ;
  // các domain slideshow là phần bổ sung độc lập.
  const status = invitation.failed > 0
    || slideshow.failed > 0
    || slideshowMedia.failed > 0
    ? 500
    : 200;
  return Response.json({ ...invitation, slideshow, slideshowMedia }, { status });
}
