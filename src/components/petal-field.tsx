"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

/**
 * Các route không được có mưa cánh hoa.
 *
 * - `lab/*`: bản dựng thử chuyển động, cánh hoa bay ngang làm loãng thứ cần đánh giá.
 * - `dashboard/<id>/thanh-toan`: trang có mã QR chuyển khoản. `.petal-field` nằm ở
 *   `z-index: 30`, tức cánh hoa phủ lên trên ảnh QR; camera quét QR đọc trực tiếp
 *   pixel trên màn hình nên một cánh hoa rơi ngang mã là đủ làm hỏng lần quét.
 */
const PETAL_FREE_ROUTES = [
  /\/lab\/(?:flow-demo|dalat-journey|forest-wedding-journey)\/?$/,
  /^\/dashboard\/[^/]+\/thanh-toan\/?$/,
];

export function PetalField() {
  const pathname = usePathname();
  const petals = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        left: `${(i * 8.3 + 3) % 98}%`,
        duration: `${11 + (i % 6) * 2.6}s`,
        delay: `${(i % 9) * 1.8}s`,
        scale: 0.55 + (i % 4) * 0.2,
      })),
    [],
  );

  if (PETAL_FREE_ROUTES.some((route) => route.test(pathname))) return null;

  return (
    <div className="petal-field pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {petals.map((p) => (
        <span
          key={p.id}
          className="petal"
          style={{
            left: p.left,
            animationDuration: p.duration,
            animationDelay: p.delay,
            transform: `scale(${p.scale})`,
          }}
        />
      ))}
    </div>
  );
}
