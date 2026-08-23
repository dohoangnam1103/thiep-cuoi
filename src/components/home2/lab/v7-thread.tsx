"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sợi tơ hồng — lớp dẫn chạy xuyên suốt phần thân trang.
 *
 * Cơ chế lấy của V4:
 * - SVG phủ đúng vùng các chương, `preserveAspectRatio="none"` nên toạ độ dọc
 *   giãn theo chiều cao thật của nội dung, không cần đo DOM.
 * - `vectorEffect="non-scaling-stroke"` giữ nét chỉ mảnh đều dù bị giãn không
 *   đều hai chiều.
 * - `pathLength={1}` chuẩn hoá độ dài về 1, nên vẽ dần chỉ là
 *   `strokeDashoffset = 1 - progress` — không phải đo pixel.
 * - Con dấu sáp trượt theo `getPointAtLength`, đổi sang toạ độ viewBox.
 *
 * Vì cách tính vị trí con dấu trùng khớp với cách trang cuộn, con dấu tự nằm
 * trong khung nhìn suốt hành trình — không cần ghim (sticky) gì cả, nên chạy tốt
 * trên mobile.
 *
 * Sợi chạy trong lề nên không bao giờ cắt qua chữ. Ở màn hẹp lề gần như không
 * còn, nên component tự lùi trục về sát mép.
 */

/** Một chương = 100 đơn vị dọc trong viewBox. */
const UNIT = 100;
/** Trục sợi chỉ, theo % bề ngang. */
const AXIS_WIDE = 5.5;
const AXIS_NARROW = 3;
/** Biên độ lượn quanh trục. */
const SWING = 4.5;

/** Mỗi chương một nhịp lượn hình chữ S quanh trục. */
function buildThread(chapters: number, axis: number) {
  let d = `M ${axis} 0`;
  for (let index = 0; index < chapters; index += 1) {
    const top = index * UNIT;
    const swing = index % 2 === 0 ? SWING : -SWING;
    d += ` C ${axis + swing} ${top + 30}, ${axis - swing} ${top + 70}, ${axis} ${top + UNIT}`;
  }
  return d;
}

export function V7Thread({
  progress,
  chapters,
  narrow,
}: {
  /** Tiến độ 0→1 của vùng có sợi chỉ. */
  progress: number;
  /** Số mốc trên sợi — mỗi chương một nút thắt. */
  chapters: number;
  narrow: boolean;
}) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const [seal, setSeal] = useState<{ x: number; y: number } | null>(null);

  const axis = narrow ? AXIS_NARROW : AXIS_WIDE;
  const height = chapters * UNIT;
  const d = buildThread(chapters, axis);

  /* Vị trí con dấu trên sợi. `getPointAtLength` là phép tính rẻ nên chạy lại mỗi
     khi tiến độ đổi mà không cần tiết chế thêm. */
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const total = path.getTotalLength();
    const point = path.getPointAtLength(total * progress);
    setSeal({ x: point.x, y: point.y });
  }, [progress, d]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
      <svg
        className="h-full w-full"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        fill="none"
      >
        {/* Bóng mờ của sợi: cho thấy đường còn lại phía trước. */}
        <path
          ref={pathRef}
          d={d}
          stroke="var(--v7-thread-track)"
          strokeWidth={1.25}
          pathLength={1}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
        {/* Phần đã đi qua, vẽ dần theo tiến độ. */}
        <path
          d={d}
          stroke="var(--v7-thread)"
          strokeWidth={1.75}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - progress}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
        {/* Nút thắt ở mỗi mốc chương. Sáng lên khi con dấu đã đi qua. */}
        {Array.from({ length: chapters }).map((_, index) => {
          const y = index * UNIT + UNIT / 2;
          const reached = progress >= (index + 0.5) / chapters;
          return (
            <g key={index}>
              <line
                x1={axis}
                y1={y}
                x2={axis + (narrow ? 3.5 : 5)}
                y2={y}
                stroke={reached ? "var(--v7-thread)" : "var(--v7-thread-track)"}
                strokeWidth={1.25}
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={axis}
                cy={y}
                r={0.9}
                fill={reached ? "var(--v7-thread)" : "var(--hp-paper)"}
                stroke={reached ? "var(--v7-thread)" : "var(--v7-thread-track)"}
                strokeWidth={1.25}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
        {/* Con dấu sáp đang trượt. Vẽ trong cùng viewBox nên nó bị giãn dọc
            giống sợi chỉ — dùng hai vòng tròn nhỏ chứ không hình phức tạp, giãn
            méo cũng vẫn đọc ra là một hạt sáp. */}
        {seal ? (
          <g>
            <circle
              cx={seal.x}
              cy={seal.y}
              r={2.4}
              fill="var(--v7-thread)"
              opacity={0.18}
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={seal.x} cy={seal.y} r={1.4} fill="var(--v7-thread)" />
          </g>
        ) : null}
      </svg>
    </div>
  );
}
