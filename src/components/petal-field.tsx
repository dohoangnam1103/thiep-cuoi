"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

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

  if (/\/lab\/(?:flow-demo|dalat-journey|forest-wedding-journey)\/?$/.test(pathname)) return null;

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
