"use client";

import { useRef } from "react";

import {
  Bar,
  FakeButton,
  Label,
  LoFiCard,
  ProgressReadout,
  TextBlock,
  VariantSwitcher,
  WIRE,
  WireChapter,
  WireFooter,
  WireHeader,
  clamp,
  easeInOut,
  easeOut,
  lerp,
  seg,
  useReducedMotion,
  useStageProgress,
  useViewport,
} from "./kit";
import { ChibiBride, ChibiGroom, FIG_H, FIG_W, HAND_Y } from "./chibi-couple";
import { ThreadOverlay } from "./v6-thread";
import { EnvelopeFinale } from "./v6-envelope";

/**
 * V6 — HÀNH TRÌNH VỀ CHUNG MỘT NHÀ
 *
 * Bản ghép theo spec 2026-08-22:
 * - Xương sống V5: một sân khấu cuộn, hai chibi đi từ hai mép về điểm gặp,
 *   nền hai nửa hoà làm một.
 * - Lớp tơ hồng V4: sợi chỉ đỏ vẽ dần xuyên suốt 5 hồi (v6-thread overlay).
 * - Nhịp thông tin V2: mỗi cửa sổ cuộn hiện ĐÚNG MỘT tính năng, panel xen kẽ
 *   trái/phải; gặp nhau thì milestone 05; thiệp mọc thì panel editor.
 * - Hồi kết V1: phong bì mở nắp, thiệp trượt ra, rồi mới hiện link chia sẻ
 *   (v6-envelope.tsx).
 *
 * Hai dòng tiến độ:
 * - `p` = chuyển động (chibi, nền hai nửa, thiệp mọc). Reduced-motion ghim
 *   p = 1: tư thế cuối, không animate.
 * - `pInfo` = progress thô cho milestone + chú thích — reduced-motion vẫn
 *   thấy thông tin tuần tự theo scroll (spec §2).
 */

const ACTS = [
  "Hai đầu · hai nhà",
  "Đi lại gần · hiện thông tin",
  "Gặp nhau · nắm tay",
  "Tấm thiệp mọc lên",
  "Phong bì & gửi link",
];

const CAPTIONS: Array<{ to: number; kicker: string; line: string }> = [
  { to: 0.1, kicker: "Hồi 1", line: "Hai người, hai nhà" },
  { to: 0.5, kicker: "Hồi 2", line: "Đi về phía nhau" },
  { to: 0.62, kicker: "Hồi 3", line: "Và thành một" },
  { to: 0.76, kicker: "Hồi 4", line: "Một tấm thiệp cho ngày ấy" },
  { to: 1.0, kicker: "Hồi 5", line: "Gửi trong một tấm phong bì" },
];

/** Tông của hai nửa nền — "hai nhà" trước khi hoà làm một. */
const SIDE_A = "#e6e8e4";
const SIDE_B = "#efe4e2";

/* Hợp đồng toạ độ bố cục chéo (màn hẹp), kế thừa V5 — % của sân khấu. */
const V_GROOM_FROM = { x: 14, y: 30 };
const V_BRIDE_FROM = { x: 86, y: 94 };
const V_MEET_Y = 56;

/** Payload kiểu V2: mỗi cửa sổ cuộn đúng một tính năng, xen kẽ trái/phải. */
const PAYLOADS: Array<{ code: string; from: number; to: number; side: "left" | "right" }> = [
  { code: "01 · Mẫu thiệp", from: 0.1, to: 0.2, side: "left" },
  { code: "02 · Tạo trong vài phút", from: 0.2, to: 0.3, side: "right" },
  { code: "03 · QR + nhạc + album", from: 0.3, to: 0.4, side: "left" },
  { code: "04 · Gửi bằng một link", from: 0.4, to: 0.5, side: "right" },
];

/**
 * Khoảng cách tâm-tâm khi hai người gặp nhau, theo % bề ngang. Suy ra TỪ bề
 * ngang nhân vật (hợp đồng `chibi-couple.tsx`) chứ không đặt tay — hai khung
 * kề nhau vừa khít thì hai bàn tay phía trong mới gặp đúng chỗ.
 */
function meetGapPercent(figureScale: number, viewportWidth: number) {
  return ((FIG_W * figureScale) / 2 / viewportWidth) * 100;
}

export function V6Merged() {
  const stageRef = useRef<HTMLElement | null>(null);
  const progress = useStageProgress(stageRef);
  const reduced = useReducedMotion();
  const viewport = useViewport();
  const narrow = viewport.width < 768;

  const p = reduced ? 1 : progress; // chuyển động
  const pInfo = progress; // thông tin — luôn theo scroll

  /* ── Nhịp dùng chung cho cả hai bố cục ── */
  const walk = easeInOut(seg(p, 0.1, 0.5));
  const stridePhase = Math.sin(walk * Math.PI * 7);
  const walking = walk > 0.02 && walk < 0.99;
  const bob = walking ? Math.abs(Math.sin(walk * Math.PI * 14)) * -5 : 0;
  const figureScale = lerp(0.86, 1, walk);

  const meet = easeOut(seg(p, 0.5, 0.58));
  const sidesMerge = seg(p, 0.5, 0.66);
  const figureFade = 1 - seg(p, 0.62, 0.68);
  const grow = easeOut(seg(p, 0.64, 0.76));
  const cardOut = 1 - seg(p, 0.72, 0.76);
  const envelopeIn = seg(p, 0.72, 0.76);

  // Milestone 05 hiện khi hai người vừa gặp, mờ đi trước khi thiệp mọc hẳn.
  const metLabel =
    Math.min(seg(pInfo, 0.5, 0.53), 1 - seg(pInfo, 0.59, 0.62));

  const foundCaption = CAPTIONS.findIndex((caption) => pInfo < caption.to);
  const activeCaption = foundCaption === -1 ? CAPTIONS.length - 1 : foundCaption;

  /* Hệ số phóng nhân vật: màn hẹp nhỏ hẳn (20% chiều cao khung) vì trục dọc
     phải chia chỗ cho chú thích + khối thông tin + phong bì. */
  const figFit = narrow
    ? clamp((viewport.height * 0.2) / FIG_H, 0.55, 1)
    : clamp((viewport.height * 0.4) / FIG_H, 1, 2.2);
  const scale = figureScale * figFit;

  const meetGap = meetGapPercent(scale, viewport.width);
  const gap = lerp(narrow ? 30 : 38, meetGap, walk);
  const groomX = 50 - gap;
  const brideX = 50 + gap;

  const groomTo = { x: 50 - meetGap, y: V_MEET_Y };
  const brideTo = { x: 50 + meetGap, y: V_MEET_Y };
  const groomPos = {
    x: lerp(V_GROOM_FROM.x, groomTo.x, walk),
    y: lerp(V_GROOM_FROM.y, groomTo.y, walk),
  };
  const bridePos = {
    x: lerp(V_BRIDE_FROM.x, brideTo.x, walk),
    y: lerp(V_BRIDE_FROM.y, brideTo.y, walk),
  };

  return (
    <div className="wire-lab" style={{ background: WIRE.paper, color: WIRE.ink }}>
      <VariantSwitcher current="V6" />
      <WireHeader />

      <section className="px-6 pb-10 pt-16 text-center sm:pt-20">
        <Label>V6 · Hành trình về chung một nhà</Label>
        <div className="mx-auto mt-6 flex max-w-xl flex-col items-center gap-3">
          <Bar w="84%" h={30} tone={WIRE.blockDark} />
          <Bar w="52%" h={30} tone={WIRE.blockDark} />
        </div>
        <div className="mx-auto mt-7 max-w-sm">
          <TextBlock lines={2} />
        </div>
        <Label className="mt-12 animate-pulse">Cuộn xuống ↓</Label>
      </section>

      {/* ═══ SÂN KHẤU ═══ */}
      <section ref={stageRef} className="relative" style={{ height: "800vh" }}>
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* ── Nền hai nửa, hoà dần thành một. Màn rộng chia trái/phải, màn
                 hẹp chia trên/dưới — cắt theo đúng trục hai người đang đi. ── */}
          <div className="absolute inset-0" style={{ background: WIRE.paper }}>
            <div
              className={narrow ? "absolute inset-x-0 top-0 h-1/2" : "absolute inset-y-0 left-0 w-1/2"}
              style={{ background: SIDE_A, opacity: 1 - sidesMerge }}
            />
            <div
              className={narrow ? "absolute inset-x-0 bottom-0 h-1/2" : "absolute inset-y-0 right-0 w-1/2"}
              style={{ background: SIDE_B, opacity: 1 - sidesMerge }}
            />
            <div
              className={
                narrow
                  ? "absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
                  : "absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
              }
              style={{ background: WIRE.line, opacity: 1 - sidesMerge }}
            />
          </div>

          {/* ── Lớp tơ hồng, vẽ dần theo toàn hành trình ── */}
          <ThreadOverlay progress={p} />

          {/* ── Chú thích từng hồi ── */}
          <div className="pointer-events-none absolute inset-x-0 top-[5.5rem] z-30 px-6 text-center">
            <div className="relative mx-auto h-16 w-full max-w-xl sm:h-20">
              {CAPTIONS.map((caption, captionIndex) => {
                const active = captionIndex === activeCaption;
                return (
                  <div
                    key={caption.line}
                    className="absolute inset-x-0 top-0"
                    style={{
                      opacity: active ? 1 : 0,
                      transform: `translateY(${active ? 0 : 12}px)`,
                      transition: "opacity 420ms ease, transform 420ms ease",
                    }}
                  >
                    <Label tone={WIRE.accent}>{caption.kicker}</Label>
                    <p className="mt-3 text-[clamp(1.15rem,2.7vw,2rem)] font-semibold leading-tight">
                      {caption.line}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Payload kiểu V2: mỗi cửa sổ cuộn một tính năng ── */}
          {PAYLOADS.map((item) => {
            const opacity = Math.min(
              seg(pInfo, item.from, item.from + 0.03),
              1 - seg(pInfo, item.to - 0.03, item.to),
            );
            if (opacity <= 0.001) return null;
            return (
              <div
                key={item.code}
                className="pointer-events-none absolute z-30"
                style={{
                  opacity,
                  width: narrow ? undefined : 240,
                  top: narrow ? "58%" : "50%",
                  ...(narrow
                    ? { left: "24%", right: 16 }
                    : item.side === "right"
                      ? { right: "6%" }
                      : { left: "20%" }),
                  transform: narrow
                    ? `translateY(${(1 - opacity) * 18}px)`
                    : `translateY(calc(-50% + ${(1 - opacity) * 18}px))`,
                }}
              >
                <PayloadBlock code={item.code} />
              </div>
            );
          })}

          {/* Milestone 05 — hai người vừa gặp */}
          {(() => {
            const opacity = Math.min(seg(pInfo, 0.5, 0.53), 1 - seg(pInfo, 0.59, 0.62));
            if (opacity <= 0.001) return null;
            return (
              <div
                className="pointer-events-none absolute z-30"
                style={{
                  opacity,
                  ...(narrow
                    ? { left: "24%", right: 16, top: "30%" }
                    : { left: "50%", width: 288, top: "34%" }),
                  transform: narrow
                    ? `translateY(${(1 - opacity) * 18}px)`
                    : `translateX(-50%) translateY(calc(-50% + ${(1 - opacity) * 18}px))`,
                }}
              >
                <PayloadBlock code="05 · Một câu chuyện — hai nửa" center={!narrow} lines={2} />
              </div>
            );
          })()}

          {/* Panel editor — hồi 4, cạnh tấm thiệp mọc lên */}
          {(() => {
            const opacity = Math.min(seg(pInfo, 0.64, 0.67), 1 - seg(pInfo, 0.71, 0.74));
            if (opacity <= 0.001) return null;
            return (
              <div
                className="pointer-events-none absolute z-30"
                style={{
                  opacity,
                  ...(narrow
                    ? { left: "24%", right: 16, top: "71%" }
                    : { left: "20%", width: 240, top: "50%" }),
                  transform: narrow
                    ? `translateY(${(1 - opacity) * 18}px)`
                    : `translateY(calc(-50% + ${(1 - opacity) * 18}px))`,
                }}
              >
                <PayloadBlock code="Soạn trong trình chỉnh sửa" lines={4} />
              </div>
            );
          })()}

          {/* ── Vết đường đã đi (màn hẹp, bố cục chéo) ── */}
          {narrow ? (
            <svg
              aria-hidden
              className="absolute inset-0 z-10 h-full w-full"
              style={{ opacity: walk > 0.02 ? 1 : 0, transition: "opacity 300ms ease" }}
              fill="none"
            >
              <line
                x1={(V_GROOM_FROM.x / 100) * viewport.width}
                y1={(V_GROOM_FROM.y / 100) * viewport.height}
                x2={(groomPos.x / 100) * viewport.width}
                y2={(groomPos.y / 100) * viewport.height}
                stroke={WIRE.blockDark}
                strokeWidth={2}
                strokeDasharray="2 8"
                strokeLinecap="round"
              />
              <line
                x1={(V_BRIDE_FROM.x / 100) * viewport.width}
                y1={(V_BRIDE_FROM.y / 100) * viewport.height}
                x2={(bridePos.x / 100) * viewport.width}
                y2={(bridePos.y / 100) * viewport.height}
                stroke={WIRE.blockDark}
                strokeWidth={2}
                strokeDasharray="2 8"
                strokeLinecap="round"
              />
            </svg>
          ) : null}

          {/* ── Hai nhân vật ── */}
          {narrow ? (
            <>
              <Walker
                kind="groom"
                x={groomPos.x}
                y={groomPos.y}
                scale={scale}
                bob={bob}
                stride={stridePhase}
                walking={walking}
                fade={figureFade}
                narrow
              />
              <Walker
                kind="bride"
                x={bridePos.x}
                y={bridePos.y}
                scale={scale}
                bob={bob}
                stride={stridePhase}
                walking={walking}
                fade={figureFade}
                narrow
              />
            </>
          ) : (
            <>
              <Walker
                kind="groom"
                x={groomX}
                y={0}
                scale={scale}
                bob={bob}
                stride={stridePhase}
                walking={walking}
                fade={figureFade}
                narrow={false}
              />
              <Walker
                kind="bride"
                x={brideX}
                y={0}
                scale={scale}
                bob={bob}
                stride={stridePhase}
                walking={walking}
                fade={figureFade}
                narrow={false}
              />
            </>
          )}

          {/* ── Nhãn "Đã gặp" ngay trên chỗ hai bàn tay chạm ── */}
          <div
            className="pointer-events-none absolute left-1/2 z-30 -translate-x-1/2"
            style={{
              bottom: narrow
                ? `calc(44% + ${4 * scale + 20}px)`
                : `calc(16% + ${(FIG_H - HAND_Y) * scale + 18}px)`,
              opacity: meet * metLabel,
            }}
          >
            <Label tone={WIRE.accent}>Đã gặp</Label>
          </div>

          {/* ── Hồi 4: tấm thiệp mọc lên từ điểm gặp ── */}
          <div
            className="absolute left-1/2 top-1/2 z-20"
            style={{
              width: narrow ? 224 : 300,
              height: narrow ? 314 : 420,
              marginLeft: narrow ? -112 : -150,
              marginTop: narrow ? -157 : -210,
              opacity: grow * cardOut,
              transform: `translateY(${lerp(64, 0, grow)}px) scale(${lerp(0.24, 1, grow)})`,
              transformOrigin: "center 62%",
            }}
          >
            <LoFiCard face={0} className="h-full w-full" dense={narrow} />
          </div>

          {/* ── Hồi 5: phong bì mở, thiệp trượt ra, link chia sẻ ── */}
          <EnvelopeFinale p={p} appear={envelopeIn} viewportHeight={viewport.height} />
        </div>
      </section>

      {/* ── Thân trang ── */}
      <WireChapter code="01 · Mẫu thiệp" layout="left" tone={WIRE.paper} />
      <WireChapter code="02 · Khách mời & RSVP" layout="right" tone={WIRE.paperDeep} />

      <section className="px-6 py-24 text-center" style={{ background: WIRE.dark }}>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
          <Bar w="72%" h={26} tone="rgba(255,255,255,0.3)" />
          <Bar w="46%" h={26} tone="rgba(255,255,255,0.3)" />
          <FakeButton className="mt-6" />
        </div>
      </section>

      <WireFooter />
      <ProgressReadout progress={progress} acts={ACTS} />
    </div>
  );
}

/** Một nhân vật trên sân khấu. Màn rộng neo đáy (bottom 16%), màn hẹp neo toạ độ %. */
function Walker({
  kind,
  x,
  y,
  scale,
  bob,
  stride,
  walking,
  fade,
  narrow,
}: {
  kind: "groom" | "bride";
  x: number;
  y: number;
  scale: number;
  bob: number;
  stride: number;
  walking: boolean;
  fade: number;
  narrow: boolean;
}) {
  return (
    <div
      className="absolute z-20"
      style={{
        left: `${x}%`,
        top: narrow ? `${y}%` : undefined,
        bottom: narrow ? undefined : "16%",
        opacity: fade,
        transform: [
          narrow ? "translate(-50%, -50%)" : "translateX(-50%)",
          `translateY(${bob}px)`,
          `scale(${scale})`,
        ].join(" "),
        transformOrigin: "center bottom",
      }}
    >
      {kind === "groom" ? (
        <ChibiGroom stride={walking ? stride : 0} />
      ) : (
        <ChibiBride stride={walking ? stride : 0} />
      )}
    </div>
  );
}

/** Khối nội dung payload: nhãn + heading giả + đoạn văn giả. */
function PayloadBlock({
  code,
  lines = 3,
  center = false,
}: {
  code: string;
  lines?: number;
  center?: boolean;
}) {
  return (
    <div className={center ? "text-center" : ""}>
      <Label tone={WIRE.accent}>{code}</Label>
      <div className={`mt-4 flex flex-col gap-2.5 ${center ? "items-center" : ""}`}>
        <Bar w="86%" h={20} tone={WIRE.blockDark} />
        <Bar w="58%" h={20} tone={WIRE.blockDark} />
      </div>
      <TextBlock lines={lines} className="mt-5" />
    </div>
  );
}

