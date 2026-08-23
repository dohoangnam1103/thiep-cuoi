"use client";

import { WIRE } from "./kit";

/**
 * Lớp tơ hồng của V6 — port từ V4.
 *
 * SVG phủ đúng sân khấu, `preserveAspectRatio="none"` nên toạ độ dọc giãn theo
 * chiều cao thật của stage. `vector-effect="non-scaling-stroke"` giữ nét chỉ
 * mảnh đều dù bị giãn, `pathLength={1}` chuẩn hoá độ dài nên vẽ dần chỉ là
 * `strokeDashoffset = 1 − p` — không đo pixel, không sticky, mobile-friendly.
 *
 * Sợi chỉ đỏ vẽ dần theo TOÀN hành trình 5 hồi và băng qua mọi hồi; mỗi hồi
 * một nút thắt trên sợi chỉ, đi qua thì sáng lên.
 */

/** Một hồi = 100 đơn vị dọc trong viewBox. */
const UNIT = 100;
const ACT_COUNT = 5;
const VBH = ACT_COUNT * UNIT;
/** Trục sợi chỉ, tính theo % bề ngang. */
const AXIS = 11;
const SWING = 8;

/** Sợi chỉ: mỗi hồi một nhịp lượn hình chữ S quanh trục. */
function buildThread() {
  let d = `M ${AXIS} 0`;
  for (let i = 0; i < ACT_COUNT; i += 1) {
    const top = i * UNIT;
    const swing = i % 2 === 0 ? SWING : -SWING;
    d += ` C ${AXIS + swing} ${top + 30}, ${AXIS - swing} ${top + 70}, ${AXIS} ${top + UNIT}`;
  }
  return d;
}

const THREAD_D = buildThread();

export function ThreadOverlay({ progress }: { progress: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
      <svg
        className="h-full w-full"
        viewBox={`0 0 100 ${VBH}`}
        preserveAspectRatio="none"
        fill="none"
      >
        {/* Bóng mờ: cho thấy đường đi còn lại. */}
        <path
          d={THREAD_D}
          stroke={WIRE.line}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
        {/* Phần đã đi qua, vẽ dần theo tiến độ. */}
        <path
          d={THREAD_D}
          stroke={WIRE.accent}
          strokeWidth={2}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - progress}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
        {/* Nút thắt ở mỗi hồi. */}
        {Array.from({ length: ACT_COUNT }).map((_, index) => {
          const y = index * UNIT + UNIT / 2;
          const reached = progress >= (index + 0.5) / ACT_COUNT;
          return (
            <circle
              key={index}
              cx={AXIS}
              cy={y}
              r={1.1}
              fill={reached ? WIRE.accent : WIRE.paper}
              stroke={reached ? WIRE.accent : WIRE.line}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
    </div>
  );
}
