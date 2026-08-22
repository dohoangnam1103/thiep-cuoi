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

/**
 * V5 — ĐI VỀ PHÍA NHAU
 *
 * Cô dâu và chú rể đi lại gần nhau theo nhịp cuộn; gặp nhau thì nắm tay, hai nền
 * màu hoà thành một, và từ chỗ hai bàn tay chạm nhau mọc lên tấm thiệp.
 *
 *   hồi 1  0.00–0.10  hai người ở hai đầu, hai nền màu khác nhau
 *   hồi 2  0.10–0.50  đi lại gần — VÀ đây là quãng tải thông tin
 *   hồi 3  0.50–0.62  gặp nhau, nắm tay, hai nền màu hoà thành một
 *   hồi 4  0.62–0.76  tấm thiệp mọc lên từ điểm gặp, hai người tan dần
 *   hồi 5  0.76–1.00  thiệp yên vị, hiện đường link chia sẻ
 *
 * ─── HAI BỐ CỤC, MỘT KỊCH BẢN ──────────────────────────────────────────────
 *
 * Toàn bộ phần tính nhịp (đi tới đâu, gặp nhau chưa, thiệp lớn bao nhiêu) nằm ở
 * component cha và dùng chung. Chỉ có CÁCH BÀY là khác nhau:
 *
 * MÀN RỘNG — trục NGANG:
 *   hai người đi từ hai mép vào giữa; thông tin hai họ đặt ở hai lề; mốc tính
 *   năng nằm trên mặt sàn.
 *
 * MÀN HẸP — trục DỌC:
 *   hai người đi theo chiều dọc (một người từ trên xuống, một người từ dưới
 *   lên) và lệch nhẹ sang hai bên trục giữa, nên lúc gặp nhau thì đứng cạnh
 *   nhau chứ không chồng người. Nền chia trên/dưới thay vì trái/phải. Thông tin
 *   đặt vào đúng khoảng mà mỗi người vừa rời đi.
 *
 * Vì sao trục dọc lại phải lệch sang hai bên: nếu cho cả hai đi đúng trên một
 * trục thẳng đứng thì hai người sẽ đâm vào nhau — bóng dáng nào cũng vẽ đứng,
 * nên người ở dưới đi lên sẽ chồng thân vào người ở trên. Lệch mỗi bên 16% là
 * hết va mà vẫn đọc ra "đi từ trên xuống / từ dưới lên".
 *
 * Và vì sao phải thu nhỏ nhân vật ở màn hẹp: khung nhìn điện thoại chỉ cao
 * ~844px, phải chia cho chú thích hồi, hai khối thông tin hai họ, hai mốc tính
 * năng và chỗ cho hai người đi. Giữ nguyên cỡ như bản rộng (40% chiều cao) là
 * hết chỗ cho mọi thứ còn lại.
 */

const ACTS = [
  "Hai đầu · hai nhà",
  "Đi lại gần · hiện thông tin",
  "Gặp nhau · nắm tay",
  "Tấm thiệp mọc lên",
  "Gửi bằng một đường link",
];

const CAPTIONS: Array<{ to: number; kicker: string; line: string }> = [
  { to: 0.1, kicker: "Hồi 1", line: "Hai người, hai nhà" },
  { to: 0.5, kicker: "Hồi 2", line: "Đi về phía nhau" },
  { to: 0.62, kicker: "Hồi 3", line: "Và thành một" },
  { to: 0.76, kicker: "Hồi 4", line: "Một tấm thiệp cho ngày ấy" },
  { to: 1.0, kicker: "Hồi 5", line: "Gửi bằng một đường link" },
];

/** Tông của hai nửa nền — "hai nhà" trước khi hoà làm một. */
const SIDE_A = "#e6e8e4";
const SIDE_B = "#efe4e2";

/* Bóng dáng xám đã được thay bằng nhân vật chibi vẽ tay. Ba hằng số dưới đây là
   hợp đồng toạ độ do chính file nhân vật định nghĩa — xem `chibi-couple.tsx`. */

/* ── Bố cục NGANG (màn rộng) ─────────────────────────────────────────────── */
const H_FLOOR = "30%";

const GROOM_ROWS: Array<{ at: number; label: string }> = [
  { at: 0.12, label: "Nhà trai" },
  { at: 0.26, label: "Ba mẹ chú rể" },
  { at: 0.4, label: "Lễ thành hôn" },
];

const BRIDE_ROWS: Array<{ at: number; label: string }> = [
  { at: 0.18, label: "Nhà gái" },
  { at: 0.32, label: "Ba mẹ cô dâu" },
  { at: 0.46, label: "Lễ vu quy" },
];

const H_MILESTONES: Array<{ x: number; by: "groom" | "bride"; label: string }> = [
  { x: 21, by: "groom", label: "Chọn mẫu thiệp" },
  { x: 34, by: "groom", label: "Thêm ảnh & nhạc" },
  { x: 66, by: "bride", label: "Bản đồ chỉ đường" },
  { x: 79, by: "bride", label: "Khách mời & RSVP" },
];

/* ── Bố cục CHÉO (màn hẹp) ───────────────────────────────────────────────────
   Chú rể đi từ trên-trái xuống, cô dâu từ dưới-phải lên, gặp nhau ở giữa và
   đứng cạnh nhau. Toạ độ theo % khung nhìn; điểm neo là CHÂN nhân vật.

   Vì sao chéo mà không thẳng đứng: bản đi thẳng đứng chạy được nhưng động tác
   "đi" đọc rất yếu — bóng dáng vẽ đứng mà trượt dọc thì trông như trôi lên/hạ
   xuống, dù sải chân vẫn đảo. Thêm thành phần ngang vào lối đi là để bước chân
   có cái bám vào. Quãng ngang (23% bề ngang) vẫn nhỏ hơn quãng dọc (26–38%
   chiều cao) nên tổng thể vẫn là một chuyển động đi xuống/đi lên, không thành
   bản ngang thu nhỏ.

   Ngân sách dọc trên khung 844px:
     0–49px   thanh chuyển biến thể (phủ lên)
     ~10–18%  chú thích hồi
     20–30%   khối "Nhà trai"       (hiện sau khi chú rể rời chỗ)
     ~35.5%   mốc của chú rể        (nhãn sang phải, lúc này cô dâu còn ở dưới)
     56%      mặt đất lúc gặp nhau
     ~73.5%   mốc của cô dâu        (nhãn sang trái, lúc này chú rể đã ở trên)
     80–90%   khối "Nhà gái"
   Hai cái mốc đặt ở đoạn mà người kia CHẮC CHẮN không có mặt, nên nhãn tha hồ
   dài mà không bao giờ bị thân người che. */
const V_GROOM_FROM = { x: 14, y: 30 };
const V_BRIDE_FROM = { x: 86, y: 94 };
const V_MEET_Y = 56;
/** Vị trí mốc trên lối đi, tính theo tỉ lệ quãng đường (0 = điểm xuất phát). */
const V_GROOM_MARK_T = 0.21;
const V_BRIDE_MARK_T = 0.54;

/**
 * Khoảng cách tâm-tâm khi hai người gặp nhau, tính theo % bề ngang khung.
 *
 * Suy ra TỪ bề ngang nhân vật chứ không đặt tay: hai bàn tay phía trong nằm sát
 * mép trong của mỗi khung (xem hợp đồng toạ độ trong `chibi-couple.tsx`), nên
 * hai khung phải kề nhau vừa khít thì hai bàn tay mới gặp đúng chỗ. Đặt tay một
 * con số cố định thì ở màn rộng hai người sẽ hở một khoảng, còn ở màn hẹp lại
 * chồng người lên nhau.
 */
function meetGapPercent(figureScale: number, viewportWidth: number) {
  return ((FIG_W * figureScale) / 2 / viewportWidth) * 100;
}

export function V5Approach() {
  const stageRef = useRef<HTMLElement | null>(null);
  const progress = useStageProgress(stageRef);
  const reduced = useReducedMotion();
  const viewport = useViewport();

  // Giảm chuyển động: ghim ở hồi 4 (thiệp đã hiện) thay vì diễn lại.
  const p = reduced ? 0.86 : progress;
  const narrow = viewport.width < 860;

  /* ── Nhịp dùng chung cho cả hai bố cục ── */
  const walk = easeInOut(seg(p, 0.1, 0.5));
  const stridePhase = Math.sin(walk * Math.PI * 7);
  const walking = walk > 0.02 && walk < 0.99;
  const bob = walking ? Math.abs(Math.sin(walk * Math.PI * 14)) * -5 : 0;
  const figureScale = lerp(0.86, 1, walk);

  const meet = easeOut(seg(p, 0.5, 0.6));
  const sidesMerge = seg(p, 0.5, 0.66);
  const figureFade = 1 - seg(p, 0.6, 0.72);
  const grow = easeOut(seg(p, 0.64, 0.86));
  const infoFade = 1 - seg(p, 0.56, 0.68);
  /* Khớp với mốc chú thích hồi 5 (0.76). Trước đây đặt 0.90 nên có một quãng dài
     chú thích đã nói "Gửi bằng một đường link" mà trên màn hình chưa có link nào. */
  const linkIn = seg(p, 0.78, 0.9);

  const foundCaption = CAPTIONS.findIndex((caption) => p < caption.to);
  const activeCaption = foundCaption === -1 ? CAPTIONS.length - 1 : foundCaption;

  /* Hệ số phóng bóng dáng. Màn hẹp nhỏ hơn hẳn: 20% chiều cao khung thay vì 40%,
     vì trục dọc phải chia chỗ cho chú thích + hai khối thông tin + hai mốc. */
  const figFit = narrow
    ? clamp((viewport.height * 0.2) / FIG_H, 0.55, 1)
    : clamp((viewport.height * 0.4) / FIG_H, 1, 2.2);
  const scale = figureScale * figFit;

  /* Vị trí hai người. Bố cục ngang đo theo % bề ngang; bố cục dọc theo % chiều
     cao. Tính ở đây để các mốc và nhân vật luôn dùng chung một con số. */
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
      <VariantSwitcher current="V5" />
      <WireHeader />

      <section className="px-6 pb-10 pt-16 text-center sm:pt-20">
        <Label>V5 · Đi về phía nhau</Label>
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
      <section ref={stageRef} className="relative" style={{ height: "700vh" }}>
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* ── Nền hai nửa, hoà dần thành một.
                 Màn rộng chia trái/phải, màn hẹp chia trên/dưới — luôn cắt theo
                 đúng trục mà hai người đang đi. ── */}
          <div className="absolute inset-0" style={{ background: WIRE.paper }}>
            <div
              className={narrow ? "absolute inset-x-0 top-0 h-1/2" : "absolute inset-y-0 left-0 w-1/2"}
              style={{ background: SIDE_A, opacity: 1 - sidesMerge }}
            />
            <div
              className={
                narrow ? "absolute inset-x-0 bottom-0 h-1/2" : "absolute inset-y-0 right-0 w-1/2"
              }
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

          {/* ── Chú thích từng hồi ──
                 Cách mép trên 5.5rem: khung dính của sân khấu và thanh chuyển
                 biến thể đều neo top-0, để ở 5% thì dòng "Hồi n" bị cắt. ── */}
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

          {narrow ? (
            <DiagonalStage
              groomPos={groomPos}
              bridePos={bridePos}
              groomTo={groomTo}
              brideTo={brideTo}
              walk={walk}
              scale={scale}
              bob={bob}
              stride={stridePhase}
              walking={walking}
              meet={meet}
              figureFade={figureFade}
              infoFade={infoFade}
            />
          ) : (
            <HorizontalStage
              groomX={groomX}
              brideX={brideX}
              scale={scale}
              bob={bob}
              stride={stridePhase}
              walking={walking}
              meet={meet}
              progress={p}
              figureFade={figureFade}
              infoFade={infoFade}
            />
          )}

          {/* ── Tấm thiệp mọc lên từ điểm gặp ── */}
          <div
            className="absolute left-1/2 top-1/2 z-20"
            style={{
              width: narrow ? 224 : 300,
              height: narrow ? 314 : 420,
              marginLeft: narrow ? -112 : -150,
              marginTop: narrow ? -157 : -210,
              opacity: grow,
              transform: `translateY(${lerp(64, 0, grow)}px) scale(${lerp(0.24, 1, grow)})`,
              transformOrigin: "center 62%",
            }}
          >
            <LoFiCard face={0} className="h-full w-full" dense={narrow} />
          </div>

          {/* ── Hồi 5: đường link ── */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-[6%] z-30 flex flex-col items-center gap-4 px-6"
            style={{ opacity: linkIn, transform: `translateY(${(1 - linkIn) * 22}px)` }}
          >
            <div
              className="flex w-[min(24rem,86vw)] items-center gap-3 rounded-[3px] px-4 py-3"
              style={{ background: "#fff", border: `1px solid ${WIRE.line}` }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: WIRE.accent }} />
              <Bar w="72%" h={8} tone={WIRE.block} />
            </div>
            <div className="flex gap-2.5">
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className="block h-9 w-9 rounded-[3px]"
                  style={{ background: WIRE.block, border: `1px solid ${WIRE.line}` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Thân trang ── */}
      <WireChapter code="01 · Mẫu thiệp" layout="left" tone={WIRE.paper} />
      <WireChapter code="02 · Bên trong tấm thiệp" layout="index" tone={WIRE.paperDeep} />
      <WireChapter code="03 · Khách mời & RSVP" layout="right" tone={WIRE.paper} />
      <WireChapter code="04 · Lời cặp đôi" layout="center" tone={WIRE.paperDeep} />

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

/* ═══════════════════════════════════════════════════════════════════════════
   Bố cục NGANG — màn rộng
   ═══════════════════════════════════════════════════════════════════════════ */

function HorizontalStage({
  groomX,
  brideX,
  scale,
  bob,
  stride,
  walking,
  meet,
  progress,
  figureFade,
  infoFade,
}: {
  groomX: number;
  brideX: number;
  scale: number;
  bob: number;
  stride: number;
  walking: boolean;
  meet: number;
  progress: number;
  figureFade: number;
  infoFade: number;
}) {
  return (
    <>
      {/* Hai cột thông tin ở hai lề. Vùng giữa để trống cho hai nhân vật. */}
      <InfoColumn rows={GROOM_ROWS} progress={progress} fade={infoFade} side="left" />
      <InfoColumn rows={BRIDE_ROWS} progress={progress} fade={infoFade} side="right" />

      {/* Mặt sàn */}
      <div
        aria-hidden
        className="absolute inset-x-0"
        style={{
          bottom: H_FLOOR,
          height: 1,
          background: WIRE.line,
          opacity: 0.9 * figureFade,
        }}
      />

      {/* Mốc tính năng trên sàn */}
      <div className="absolute inset-x-0" style={{ bottom: H_FLOOR, height: 0, opacity: infoFade }}>
        {H_MILESTONES.map((milestone) => {
          // Chú rể đi từ trái sang nên "đã qua" là toạ độ của anh lớn hơn mốc;
          // cô dâu đi ngược lại nên là nhỏ hơn.
          const passed =
            milestone.by === "groom" ? groomX >= milestone.x : brideX <= milestone.x;
          return (
            <Milestone
              key={milestone.label}
              label={milestone.label}
              passed={passed}
              style={{ left: `${milestone.x}%`, top: 0, marginLeft: -80 }}
            />
          );
        })}
      </div>

      {/* Hai nhân vật */}
      <div className="absolute inset-x-0" style={{ bottom: H_FLOOR, height: 0, opacity: figureFade }}>
        <Walker
          side="groom"
          style={{ left: `${groomX}%`, bottom: 0 }}
          scale={scale}
          bob={bob}
          stride={walking ? stride : 0}
        />
        <Walker
          side="bride"
          style={{ left: `${brideX}%`, bottom: 0 }}
          scale={scale}
          bob={bob}
          stride={walking ? -stride : 0}
        />
        <HandJoin meet={meet} style={{ left: "50%", bottom: HAND_Y * scale }} />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Bố cục CHÉO — màn hẹp
   ═══════════════════════════════════════════════════════════════════════════ */

type Point = { x: number; y: number };

const pointAt = (from: Point, to: Point, t: number) => ({
  x: lerp(from.x, to.x, t),
  y: lerp(from.y, to.y, t),
});

function DiagonalStage({
  groomPos,
  bridePos,
  groomTo,
  brideTo,
  walk,
  scale,
  bob,
  stride,
  walking,
  meet,
  figureFade,
  infoFade,
}: {
  groomPos: Point;
  bridePos: Point;
  groomTo: Point;
  brideTo: Point;
  walk: number;
  scale: number;
  bob: number;
  stride: number;
  walking: boolean;
  meet: number;
  figureFade: number;
  infoFade: number;
}) {
  /* Khối thông tin chỉ hiện SAU KHI người tương ứng đã rời khỏi chỗ đó — hiện
     sớm thì chữ nằm ngay dưới thân người. Điều kiện gắn vào vị trí THẬT chứ
     không vào một mốc tiến độ rời, nên không bao giờ lệch pha với bước đi. */
  const groomLeftTop = groomPos.y > 42;
  const brideLeftBottom = bridePos.y < 84;

  const groomMark = pointAt(V_GROOM_FROM, groomTo, V_GROOM_MARK_T);
  const brideMark = pointAt(V_BRIDE_FROM, brideTo, V_BRIDE_MARK_T);

  return (
    <>
      {/* Lối đi của hai người + vết đã đi qua.
          viewBox 0 0 100 100 với preserveAspectRatio="none" nên toạ độ trùng khớp
          với % dùng cho nhân vật; `non-scaling-stroke` giữ nét mảnh đều dù khung
          bị giãn không đều hai chiều. */}
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
        style={{ opacity: figureFade }}
      >
        {[
          { from: V_GROOM_FROM, to: groomTo, now: groomPos },
          { from: V_BRIDE_FROM, to: brideTo, now: bridePos },
        ].map((path, index) => (
          <g key={index}>
            {/* cả lối đi */}
            <line
              x1={path.from.x}
              y1={path.from.y}
              x2={path.to.x}
              y2={path.to.y}
              stroke={WIRE.line}
              strokeWidth={1}
              strokeDasharray="3 4"
              vectorEffect="non-scaling-stroke"
            />
            {/* đoạn đã đi — vết để lại, cái này mới làm chuyển động đọc ra "đi" */}
            <line
              x1={path.from.x}
              y1={path.from.y}
              x2={path.now.x}
              y2={path.now.y}
              stroke={WIRE.accent}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              opacity={0.55}
            />
            <circle cx={path.from.x} cy={path.from.y} r={0.7} fill={WIRE.blockDark} />
          </g>
        ))}
        {/* Mặt đất chỗ gặp nhau — chỉ một đoạn ngắn dưới chân hai người, không
            kẻ hết bề ngang: hai người đứng trên cùng một chỗ, không phải trên
            một cái sàn trải dài. */}
        <line
          x1={24}
          y1={V_MEET_Y}
          x2={76}
          y2={V_MEET_Y}
          stroke={WIRE.line}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          // Chỉ hiện ở đoạn cuối. Nếu hiện sớm theo `walk` thì lúc cô dâu còn
          // đang đi lên, chân cô nằm DƯỚI vạch đất — trông như đứng dưới mặt đất.
          opacity={clamp((walk - 0.85) / 0.15)}
        />
      </svg>

      {/* Hai khối thông tin. Rộng tối đa 78% và dạt về phía đối diện lối đi của
          người tương ứng, để sợi vết đi không cắt qua chữ: lối của chú rể bắt
          đầu ở mép trái nên khối "Nhà trai" thu về phải một chút và ngược lại. */}
      <div className="absolute inset-x-0 px-6" style={{ top: "20%", opacity: infoFade }}>
        <div className="ml-auto w-[78%]">
          <InfoBlock label="Nhà trai" show={groomLeftTop} align="left" />
        </div>
      </div>

      {/* Ở 80% chứ không thấp hơn: thấp nữa là bị mép dưới khung nhìn cắt mất
          hai dòng cuối. */}
      <div className="absolute inset-x-0 px-6" style={{ top: "80%", opacity: infoFade }}>
        <div className="w-[78%]">
          <InfoBlock label="Nhà gái" show={brideLeftBottom} align="right" />
        </div>
      </div>

      {/* Mốc tính năng.
          Mốc của chú rể nằm ở đoạn đầu lối đi của anh (t=0.21, cao hơn hẳn chỗ
          cô dâu sẽ tới), nên nhãn trải sang PHẢI thoải mái. Mốc của cô dâu nằm ở
          đoạn dưới (t=0.54, thấp hơn chỗ chú rể dừng), nhãn trải sang TRÁI. Nhờ
          chọn hai điểm mà người kia chắc chắn không có mặt, nhãn không bao giờ bị
          thân người che — đó là lỗi của bản đi thẳng đứng. */}
      <div className="absolute inset-0" style={{ opacity: infoFade }}>
        <PathMilestone
          label="Chọn mẫu thiệp"
          passed={walk >= V_GROOM_MARK_T}
          at={groomMark}
          side="right"
        />
        <PathMilestone
          label="Khách mời & RSVP"
          passed={walk >= V_BRIDE_MARK_T}
          at={brideMark}
          side="left"
        />
      </div>

      {/* Hai nhân vật. Chân neo vào toạ độ trên lối đi.
          Thêm chút nghiêng người theo hướng đi: chú rể chúi sang phải, cô dâu
          sang trái. Nhỏ thôi (2.5°) nhưng đủ để dáng đọc ra là đang tiến tới. */}
      <div className="absolute inset-0" style={{ opacity: figureFade }}>
        <Walker
          side="groom"
          style={{ left: `${groomPos.x}%`, top: `${groomPos.y}%` }}
          anchor="top"
          scale={scale}
          bob={bob}
          lean={walking ? 2.5 : 0}
          stride={walking ? stride : 0}
        />
        <Walker
          side="bride"
          style={{ left: `${bridePos.x}%`, top: `${bridePos.y}%` }}
          anchor="top"
          scale={scale}
          bob={bob}
          lean={walking ? -2.5 : 0}
          stride={walking ? -stride : 0}
        />
        <HandJoin
          meet={meet}
          style={{ left: "50%", top: `${V_MEET_Y}%`, marginTop: -HAND_Y * scale }}
        />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Mảnh dùng chung
   ═══════════════════════════════════════════════════════════════════════════ */

/** Cột thông tin ở lề (bố cục ngang). Các dòng hiện dồn lại theo tiến độ. */
function InfoColumn({
  rows,
  progress,
  fade,
  side,
}: {
  rows: Array<{ at: number; label: string }>;
  progress: number;
  fade: number;
  side: "left" | "right";
}) {
  return (
    <div
      className="absolute top-[24%] w-[21%] max-w-[17rem]"
      style={{
        [side]: "4.5%",
        opacity: fade,
        textAlign: side === "left" ? "left" : "right",
      }}
    >
      {rows.map((row) => {
        const enter = easeOut(seg(progress, row.at, row.at + 0.06));
        return (
          <div
            key={row.label}
            className="mb-8 last:mb-0"
            style={{
              opacity: enter,
              transform: `translateX(${(1 - enter) * (side === "left" ? -26 : 26)}px)`,
            }}
          >
            <div className={`flex items-center gap-2.5 ${side === "right" ? "flex-row-reverse" : ""}`}>
              <span className="h-px w-5 shrink-0" style={{ background: WIRE.accent }} />
              <Label tone={WIRE.inkSoft}>{row.label}</Label>
            </div>
            <div className={side === "right" ? "mt-4 flex flex-col items-end" : "mt-4"}>
              <Bar w="72%" h={14} tone={WIRE.blockDark} />
              <span className="mt-3 block w-full">
                <TextBlock lines={2} />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Khối thông tin một họ (bố cục dọc). */
function InfoBlock({
  label,
  show,
  align,
}: {
  label: string;
  show: boolean;
  align: "left" | "right";
}) {
  return (
    <div
      className={align === "right" ? "text-right" : "text-left"}
      style={{
        opacity: show ? 1 : 0,
        transform: `translateY(${show ? 0 : 14}px)`,
        transition: "opacity 500ms ease, transform 500ms ease",
      }}
    >
      <div
        className={`flex items-center gap-2.5 ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        <span className="h-px w-5 shrink-0" style={{ background: WIRE.accent }} />
        <Label tone={WIRE.inkSoft}>{label}</Label>
      </div>
      <div className={align === "right" ? "mt-3.5 flex flex-col items-end" : "mt-3.5"}>
        <Bar w="58%" h={13} tone={WIRE.blockDark} />
        <span className="mt-3 block w-full">
          <TextBlock lines={2} />
        </span>
      </div>
    </div>
  );
}

/** Mốc tính năng trên mặt sàn (bố cục ngang). */
function Milestone({
  label,
  passed,
  style,
}: {
  label: string;
  passed: boolean;
  style: React.CSSProperties;
}) {
  return (
    <div
      className="absolute flex w-40 flex-col items-center"
      style={{ ...style, opacity: passed ? 1 : 0.32, transition: "opacity 400ms ease" }}
    >
      <span
        className="block rounded-full"
        style={{
          width: passed ? 11 : 7,
          height: passed ? 11 : 7,
          marginTop: passed ? -5.5 : -3.5,
          background: passed ? WIRE.accent : WIRE.blockDark,
          transition: "all 400ms ease",
        }}
      />
      <span className="mt-4 block h-6 w-px" style={{ background: passed ? WIRE.accent : WIRE.line }} />
      <Label className="mt-3 whitespace-nowrap" tone={passed ? WIRE.ink : WIRE.inkSoft}>
        {label}
      </Label>
      <span className="mt-3 flex w-28 justify-center">
        <Bar w="100%" h={7} tone={passed ? WIRE.block : WIRE.paperDeep} />
      </span>
    </div>
  );
}

/** Mốc tính năng nằm trên lối đi chéo (bố cục hẹp). Nhãn trải về một phía. */
function PathMilestone({
  label,
  passed,
  at,
  side,
}: {
  label: string;
  passed: boolean;
  at: Point;
  side: "left" | "right";
}) {
  return (
    <div
      className="absolute flex items-center gap-3"
      style={{
        top: `${at.y}%`,
        left: side === "right" ? `${at.x}%` : undefined,
        right: side === "left" ? `${100 - at.x}%` : undefined,
        transform: "translateY(-50%)",
        flexDirection: side === "right" ? "row" : "row-reverse",
        opacity: passed ? 1 : 0.3,
        transition: "opacity 400ms ease",
      }}
    >
      <span
        className="block shrink-0 rounded-full"
        style={{
          width: passed ? 10 : 6,
          height: passed ? 10 : 6,
          marginLeft: side === "right" ? -5 : 0,
          marginRight: side === "left" ? -5 : 0,
          background: passed ? WIRE.accent : WIRE.blockDark,
          transition: "all 400ms ease",
        }}
      />
      <span className="block h-px w-4 shrink-0" style={{ background: passed ? WIRE.accent : WIRE.line }} />
      {/* Bề ngang cố định 96px và CHO PHÉP xuống dòng. Khoảng trống phía ngoài
          lối đi trên điện thoại chỉ khoảng 100px, nên nhãn một dòng không ngắt
          ("KHÁCH MỜI & RSVP") sẽ tràn ra ngoài mép màn hình. */}
      <div className={`w-24 ${side === "left" ? "text-right" : "text-left"}`}>
        <Label className="!tracking-[0.16em]" tone={passed ? WIRE.ink : WIRE.inkSoft}>
          {label}
        </Label>
        <span className={`mt-2.5 flex ${side === "left" ? "justify-end" : ""}`}>
          <Bar w={72} h={7} tone={passed ? WIRE.block : WIRE.paperDeep} />
        </span>
      </div>
    </div>
  );
}

/** Điểm hai bàn tay chạm nhau. */
function HandJoin({ meet, style }: { meet: number; style: React.CSSProperties }) {
  return (
    <div
      className="absolute"
      style={{
        ...style,
        opacity: meet,
        transform: `translateX(-50%) scale(${lerp(0.3, 1, meet)})`,
      }}
    >
      <span
        className="block rounded-full"
        style={{
          width: 16,
          height: 16,
          background: WIRE.accent,
          boxShadow: `0 0 0 ${lerp(0, 10, meet)}px rgba(180,69,61,0.16)`,
        }}
      />
    </div>
  );
}

/**
 * Một nhân vật đang đi.
 *
 * `anchor` quyết định chân người neo vào đâu:
 *   "bottom" — hộp neo đáy (bố cục ngang, đứng trên mặt sàn ở dưới)
 *   "top"    — hộp neo theo `top`, phải kéo lên đúng chiều cao thân để CHÂN,
 *              chứ không phải đầu, nằm trên toạ độ đã cho (bố cục dọc)
 */
function Walker({
  side,
  style,
  anchor = "bottom",
  scale,
  bob,
  stride,
  lean = 0,
}: {
  side: "groom" | "bride";
  style: React.CSSProperties;
  anchor?: "bottom" | "top";
  scale: number;
  bob: number;
  stride: number;
  /** Độ nghiêng người theo hướng đi, đơn vị độ. */
  lean?: number;
}) {
  return (
    <div
      className="absolute"
      style={{
        ...style,
        transformOrigin: "bottom center",
        transform: [
          "translateX(-50%)",
          anchor === "top" ? `translateY(-${FIG_H * scale}px)` : "",
          `translateY(${bob}px)`,
          `scale(${scale})`,
          lean ? `rotate(${lean}deg)` : "",
        ]
          .filter(Boolean)
          .join(" "),
      }}
    >
      {side === "groom" ? <ChibiGroom stride={stride} /> : <ChibiBride stride={stride} />}
    </div>
  );
}
