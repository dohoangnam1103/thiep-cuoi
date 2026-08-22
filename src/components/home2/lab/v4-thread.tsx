"use client";

import { useEffect, useRef, useState } from "react";

import {
  Bar,
  FakeButton,
  Label,
  LoFiCard,
  ProgressReadout,
  TextBlock,
  VariantSwitcher,
  WIRE,
  WireFooter,
  WireHeader,
  useReducedMotion,
  useStageProgress,
} from "./kit";

/**
 * V4 — TƠ HỒNG
 *
 * Một sợi chỉ đỏ chạy suốt trang, được VẼ DẦN theo tiến độ cuộn, và một con dấu
 * sáp trượt dọc sợi chỉ đó. Mỗi chương có một cái nút thắt trên sợi chỉ; con dấu
 * đi qua thì nút thắt sáng lên và một nhánh chỉ nối sang tiêu đề chương.
 *
 * Cơ chế:
 * - SVG phủ đúng vùng các chương, `preserveAspectRatio="none"` nên toạ độ dọc
 *   giãn theo chiều cao thật của nội dung. `vector-effect="non-scaling-stroke"`
 *   giữ nét chỉ luôn mảnh đều dù bị giãn.
 * - `pathLength={1}` chuẩn hoá độ dài về 1, nên vẽ dần chỉ là
 *   `strokeDashoffset = 1 - progress`, không phải đo pixel.
 * - Vị trí con dấu lấy bằng `getPointAtLength`, đổi sang phần trăm khung.
 *
 * Vì cách tính vị trí con dấu trùng khớp với cách trang cuộn, con dấu tự nằm
 * trong khung nhìn suốt hành trình — không cần ghim (sticky) gì cả.
 *
 * Điểm mạnh: mang nghĩa văn hoá đúng chỗ (tơ hồng, chỉ đỏ buộc duyên), chạy tốt
 * cả trên mobile, và không chiếm thêm màn hình cuộn nào — nội dung đọc bình
 * thường, chuyển động chỉ là lớp dẫn.
 * Điểm yếu: nhẹ hơn V1/V3 về độ "choáng". Nó là sợi dẫn, không phải màn diễn.
 */

const CHAPTERS: Array<{ code: string; side: "left" | "right"; kind: "media" | "index" | "quote" }> = [
  { code: "01 · Mẫu thiệp", side: "left", kind: "media" },
  { code: "02 · Cách hoạt động", side: "right", kind: "index" },
  { code: "03 · Bên trong tấm thiệp", side: "left", kind: "index" },
  { code: "04 · Khách mời & RSVP", side: "right", kind: "media" },
  { code: "05 · Đa ngôn ngữ", side: "left", kind: "media" },
  { code: "06 · Lời cặp đôi", side: "right", kind: "quote" },
];

const ACTS = CHAPTERS.map((chapter) => chapter.code);

/** Một chương = 100 đơn vị dọc trong viewBox. */
const UNIT = 100;
const VBH = CHAPTERS.length * UNIT;
/** Trục sợi chỉ, tính theo % bề ngang. */
const AXIS = 11;
const SWING = 8;

/** Sợi chỉ: mỗi chương một nhịp lượn hình chữ S quanh trục. */
function buildThread() {
  let d = `M ${AXIS} 0`;
  for (let i = 0; i < CHAPTERS.length; i += 1) {
    const top = i * UNIT;
    const swing = i % 2 === 0 ? SWING : -SWING;
    d += ` C ${AXIS + swing} ${top + 30}, ${AXIS - swing} ${top + 70}, ${AXIS} ${top + UNIT}`;
  }
  return d;
}

const THREAD_D = buildThread();

export function V4Thread() {
  const stageRef = useRef<HTMLElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const progress = useStageProgress(stageRef);
  const reduced = useReducedMotion();

  const [seal, setSeal] = useState<{ x: number; y: number } | null>(null);

  const p = reduced ? 1 : progress;

  // Vị trí con dấu trên sợi chỉ. Chạy lại mỗi khi tiến độ đổi; getPointAtLength
  // là phép tính rẻ nên không cần tiết chế thêm.
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const total = path.getTotalLength();
    const point = path.getPointAtLength(total * p);
    setSeal({ x: point.x, y: point.y });
  }, [p]);

  return (
    <div className="wire-lab" style={{ background: WIRE.paper, color: WIRE.ink }}>
      <VariantSwitcher current="V4" />
      <WireHeader />

      <section className="px-6 pb-14 pt-20">
        <div className="mx-auto max-w-5xl">
          <Label tone={WIRE.accent}>V4 · Tơ hồng</Label>
          <div className="mt-6 flex max-w-2xl flex-col gap-3.5">
            <Bar w="94%" h={34} tone={WIRE.blockDark} />
            <Bar w="62%" h={34} tone={WIRE.blockDark} />
          </div>
          <div className="mt-8 max-w-md">
            <TextBlock lines={2} />
          </div>
          <div className="mt-10 flex items-center gap-5">
            <FakeButton />
            <Bar w={110} h={9} tone={WIRE.block} />
          </div>
          <Label className="mt-16 animate-pulse">Cuộn xuống ↓</Label>
        </div>
      </section>

      {/* ═══ VÙNG CÓ SỢI CHỈ ═══ */}
      <section ref={stageRef} className="relative">
        {/* Sợi chỉ + con dấu, phủ trên nội dung nhưng không bắt chuột. Sợi chạy
            trong lề trái nên không bao giờ cắt qua chữ. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-30">
          <svg
            className="h-full w-full"
            viewBox={`0 0 100 ${VBH}`}
            preserveAspectRatio="none"
            fill="none"
          >
            {/* Bóng mờ của sợi chỉ: cho thấy đường đi còn lại. */}
            <path
              d={THREAD_D}
              stroke={WIRE.line}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
            />
            {/* Phần đã đi qua, vẽ dần theo tiến độ. */}
            <path
              ref={pathRef}
              d={THREAD_D}
              stroke={WIRE.accent}
              strokeWidth={2}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - p}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
            />
            {/* Nút thắt ở mỗi mốc chương + nhánh nối sang nội dung. */}
            {CHAPTERS.map((chapter, index) => {
              const y = index * UNIT + UNIT / 2;
              const reached = p >= (index + 0.5) / CHAPTERS.length;
              return (
                <g key={chapter.code}>
                  <line
                    x1={AXIS}
                    y1={y}
                    x2={AXIS + 7}
                    y2={y}
                    stroke={reached ? WIRE.accent : WIRE.line}
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={AXIS}
                    cy={y}
                    r={1.1}
                    fill={reached ? WIRE.accent : WIRE.paper}
                    stroke={reached ? WIRE.accent : WIRE.line}
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })}
          </svg>

          {/* Con dấu sáp trượt dọc sợi chỉ */}
          {seal ? (
            <div
              className="absolute"
              style={{
                left: `${seal.x}%`,
                top: `${(seal.y / VBH) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <span
                className="block rounded-full"
                style={{
                  width: 30,
                  height: 30,
                  background: WIRE.accent,
                  boxShadow: `0 0 0 6px rgba(180,69,61,0.14), 0 8px 20px -6px rgba(180,69,61,0.6)`,
                }}
              />
            </div>
          ) : null}
        </div>

        {/* Nội dung các chương. Lề trái rộng để chừa chỗ cho sợi chỉ. */}
        {CHAPTERS.map((chapter, index) => (
          <div
            key={chapter.code}
            className="flex min-h-screen items-center py-24 pl-[22%] pr-6 sm:pl-[18%] lg:pl-[16%] lg:pr-12"
            style={{ background: index % 2 ? WIRE.paperDeep : WIRE.paper }}
          >
            <div className="mx-auto grid w-full max-w-4xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <div className={chapter.side === "right" ? "lg:order-2" : ""}>
                <Label tone={WIRE.accent}>{chapter.code}</Label>
                <div className="mt-5 flex flex-col gap-3">
                  <Bar w="90%" h={26} tone={WIRE.blockDark} />
                  <Bar w="56%" h={26} tone={WIRE.blockDark} />
                </div>
                <TextBlock lines={3} className="mt-6" />
              </div>
              <div className={chapter.side === "right" ? "lg:order-1" : ""}>
                <ChapterMedia kind={chapter.kind} index={index} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="px-6 py-28 text-center" style={{ background: WIRE.dark }}>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
          <span className="mb-4 block h-7 w-7 rounded-full" style={{ background: WIRE.accent }} />
          <Bar w="76%" h={28} tone="rgba(255,255,255,0.3)" />
          <Bar w="48%" h={28} tone="rgba(255,255,255,0.3)" />
          <FakeButton className="mt-6" />
        </div>
      </section>

      <WireFooter />
      <ProgressReadout progress={progress} acts={ACTS} />
    </div>
  );
}

function ChapterMedia({ kind, index }: { kind: string; index: number }) {
  if (kind === "index") {
    return (
      <ul className="w-full">
        {Array.from({ length: 3 }).map((_, row) => (
          <li key={row} className="py-5" style={{ borderTop: `1px solid ${WIRE.line}` }}>
            <Bar w="56%" h={12} tone={WIRE.blockDark} />
            <TextBlock lines={2} className="mt-3" />
          </li>
        ))}
      </ul>
    );
  }
  if (kind === "quote") {
    return (
      <div className="w-full" style={{ borderTop: `1px solid ${WIRE.line}`, paddingTop: 28 }}>
        <TextBlock lines={4} tone={WIRE.blockDark} />
        <div className="mt-7 flex items-center gap-3">
          <span className="h-px w-7" style={{ background: WIRE.accent }} />
          <Bar w={96} h={8} tone={WIRE.block} />
        </div>
      </div>
    );
  }
  return <LoFiCard face={index} className="mx-auto h-[24rem] w-full max-w-[16rem]" dense />;
}
