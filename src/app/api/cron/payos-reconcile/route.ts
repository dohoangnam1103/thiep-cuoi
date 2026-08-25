import { cronUnauthorized, isAuthorizedCronRequest } from "@/lib/cron-auth";
import { reconcileOutstandingPayosPayments } from "@/lib/payos-reconcile";

export const dynamic = "force-dynamic";

/**
 * Đối soát các đơn payOS chưa chốt với payOS.
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

  const summary = await reconcileOutstandingPayosPayments();
  console.info("[payos-reconcile] xong", summary);

  // Trả 500 khi có đơn hỏi không được để cron log và `curl -f` nhìn thấy: hỏi
  // payOS thất bại nghĩa là lưới an toàn cho việc mất webhook đang không hoạt động.
  const status = summary.failed > 0 ? 500 : 200;
  return Response.json(summary, { status });
}
