"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import NextLink from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";

import { Eyebrow, Shell } from "../primitives";
import { ChibiBride, ChibiGroom, FIG_H, FIG_W, HAND_Y } from "./chibi-couple";
import {
  clamp,
  easeInOut,
  easeOut,
  lerp,
  seg,
  useReducedMotion,
  useStageProgress,
  useViewport,
} from "./kit";
import { v7Copy } from "./v7-copy";
import { V7Envelope } from "./v7-envelope";

/**
 * Sân khấu hành trình — hồi mở đầu của V7.
 *
 * Một sân khấu cao 720vh, bên trong là khung dính cao đúng một khung nhìn. Tiến
 * độ cuộn qua sân khấu điều khiển năm hồi:
 *
 *   hồi 1  0.00–0.08  hai người đứng hai đầu, nền chia hai tông là hai nhà
 *   hồi 2  0.08–0.44  hai người đi lại gần; thông tin hai họ và bốn mốc tính
 *                     năng hiện dần theo bước chân
 *   hồi 3  0.44–0.54  gặp nhau, nắm tay, hai nền hoà thành một
 *   hồi 4  0.54–0.86  phong bì hiện lên từ điểm gặp, mở nắp, thiệp trượt ra và
 *                     mở hai cánh
 *   hồi 5  0.86–1.00  đường link chia sẻ
 *
 * Vì sao thông tin gắn vào VỊ TRÍ chứ không vào một mốc tiến độ rời: gắn vào mốc
 * thì có lúc chữ hiện ngay dưới thân người. Điều kiện dùng toạ độ thật nên không
 * bao giờ lệch pha với bước đi.
 *
 * Vì sao phải thu nhỏ nhân vật ở màn hẹp: khung nhìn điện thoại chỉ cao ~844px,
 * phải chia cho chú thích hồi, hai khối thông tin hai họ, hai mốc tính năng và
 * chỗ cho hai người đi. Giữ nguyên cỡ như bản rộng (40% chiều cao) là hết chỗ.
 */

const copy = v7Copy;

/** Ngưỡng đổi bố cục. Dưới mức này dùng bố cục chéo. */
const NARROW_AT = 860;

/** Tông của hai nửa nền — đọc từ CSS nên đổi bảng màu không phải sửa file này. */
const SIDE_A = "var(--v7-side-a)";
const SIDE_B = "var(--v7-side-b)";

/** Mặt sàn của bố cục ngang, tính từ mép dưới. */
const H_FLOOR = "32%";

/* ── Ngân sách dọc của khung dính ────────────────────────────────────────────
   Cụm phong bì phải nằm gọn giữa hai dải này. Dải trên là chỗ của chú thích hồi
   (`top-[4.5rem]` + chiều cao khối chữ); để cụm canh giữa khung nhìn thì lúc
   thiệp rút lên hết, mép trên của nó chạy vào đúng dải đó và chữ "Hồi bốn" nằm
   đè lên mặt thiệp. Dải dưới lúc chưa có đường link chỉ là khoảng thở; khi hồi 5
   tới thì nó phình bằng chiều cao THẬT của khối link, đo bằng ResizeObserver —
   đặt tay một con số thì sai ngay khi chữ ngắt dòng khác đi. */
const RESERVE_TOP_WIDE = 192;
const RESERVE_TOP_NARROW = 168;
const RESERVE_BOTTOM_IDLE = 48;

/* ── Bố cục CHÉO (màn hẹp) ───────────────────────────────────────────────────
   Chú rể đi từ trên-trái xuống, cô dâu từ dưới-phải lên, gặp nhau ở giữa. Toạ
   độ theo % khung nhìn; điểm neo là CHÂN nhân vật.

   Vì sao chéo mà không thẳng đứng: bản đi thẳng đứng chạy được nhưng động tác
   "đi" đọc rất yếu — người vẽ đứng mà trượt dọc thì trông như trôi lên/hạ xuống,
   dù sải chân vẫn đảo. Thêm thành phần ngang vào lối đi để bước chân có cái bám
   vào. Quãng ngang (23% bề ngang) vẫn nhỏ hơn quãng dọc (26–38% chiều cao) nên
   tổng thể vẫn là một chuyển động đi xuống/đi lên.

   Ngân sách dọc trên khung 844px:
     ~10–18%  chú thích hồi
     20–30%   khối "Nhà trai"   (hiện sau khi chú rể rời chỗ)
     ~35.5%   mốc của chú rể    (nhãn sang phải, lúc này cô dâu còn ở dưới)
     56%      mặt đất lúc gặp nhau
     ~73.5%   mốc của cô dâu    (nhãn sang trái, lúc này chú rể đã ở trên)
     80–90%   khối "Nhà gái"
   Hai cái mốc đặt ở đoạn mà người kia CHẮC CHẮN không có mặt, nên nhãn tha hồ
   dài mà không bao giờ bị thân người che. */
const V_GROOM_FROM = { x: 14, y: 30 };
const V_BRIDE_FROM = { x: 86, y: 94 };
const V_MEET_Y = 56;
/** Vị trí mốc trên lối đi, theo tỉ lệ quãng đường (0 = điểm xuất phát). */
const V_GROOM_MARK_T = 0.21;
const V_BRIDE_MARK_T = 0.54;

type Point = { x: number; y: number };

const pointAt = (from: Point, to: Point, t: number): Point => ({
  x: lerp(from.x, to.x, t),
  y: lerp(from.y, to.y, t),
});

/**
 * Khoảng cách tâm-tâm khi hai người gặp nhau, theo % bề ngang khung.
 *
 * Suy ra TỪ bề ngang nhân vật chứ không đặt tay: hai bàn tay phía trong nằm sát
 * mép trong của mỗi khung (hợp đồng toạ độ trong `chibi-couple.tsx`), nên hai
 * khung phải kề nhau vừa khít thì hai bàn tay mới gặp đúng chỗ. Đặt tay một con
 * số cố định thì màn rộng hở một khoảng, màn hẹp lại chồng người lên nhau.
 */
function meetGapPercent(figureScale: number, viewportWidth: number) {
  return ((FIG_W * figureScale) / 2 / viewportWidth) * 100;
}

/**
 * Chiều cao thật của một phần tử, theo dõi bằng ResizeObserver.
 *
 * Cần cho khối đường link ở hồi 5: cụm phong bì phải biết nó cao bao nhiêu để tự
 * thu lại nhường chỗ. Đặt tay một con số thì sai ngay khi chữ ngắt dòng khác đi
 * (khối này có một câu dài, trên màn hẹp nó thành ba dòng).
 */
function useMeasuredHeight<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return height;
}

export function V7Journey({ createHref }: { createHref: string }) {
  const stageRef = useRef<HTMLElement | null>(null);
  const finaleRef = useRef<HTMLDivElement | null>(null);
  const progress = useStageProgress(stageRef);
  const reduced = useReducedMotion();
  const viewport = useViewport();
  const finaleHeight = useMeasuredHeight(finaleRef);

  /* Giảm chuyển động: ghim ở hồi 4 (thiệp đã mở) thay vì diễn lại. Không bao giờ
     để người dùng thấy màn hình trống. */
  const p = reduced ? 0.84 : progress;
  const narrow = viewport.width < NARROW_AT;

  /* ── Nhịp dùng chung cho cả hai bố cục ── */
  const walk = easeInOut(seg(p, 0.08, 0.44));
  const stridePhase = Math.sin(walk * Math.PI * 7);
  const walking = walk > 0.02 && walk < 0.99;
  const bob = walking ? Math.abs(Math.sin(walk * Math.PI * 14)) * -5 : 0;
  const figureScale = lerp(0.86, 1, walk);

  const meet = easeOut(seg(p, 0.44, 0.53));
  const sidesMerge = seg(p, 0.44, 0.6);
  const figureFade = 1 - seg(p, 0.53, 0.63);
  const infoFade = 1 - seg(p, 0.48, 0.6);
  /* Hồi phong bì có tiến độ riêng, `V7Envelope` tự cắt các bước bên trong. */
  const envelopeIn = easeOut(seg(p, 0.54, 0.62));
  const envelopeT = seg(p, 0.56, 0.88);
  /* Khớp với mốc chú thích hồi 5 (0.86). Đặt muộn hơn thì có một quãng dài chú
     thích đã nói "Gửi bằng một đường link" mà trên màn hình chưa có link nào. */
  const linkIn = seg(p, 0.86, 0.95);

  const foundAct = copy.acts.findIndex((act) => p < act.to);
  const activeAct = foundAct === -1 ? copy.acts.length - 1 : foundAct;

  /* Hệ số phóng nhân vật. Màn hẹp nhỏ hơn hẳn: 20% chiều cao khung thay vì 40%,
     vì trục dọc phải chia chỗ cho chú thích + hai khối thông tin + hai mốc. */
  const figFit = narrow
    ? clamp((viewport.height * 0.2) / FIG_H, 0.55, 1)
    : clamp((viewport.height * 0.36) / FIG_H, 1, 2.1);
  const scale = figureScale * figFit;

  /* Vị trí hai người. Tính ở đây để các mốc và nhân vật luôn dùng chung một con
     số — hai chỗ tự tính riêng là lệch. */
  const meetGap = meetGapPercent(scale, viewport.width);
  const gap = lerp(narrow ? 30 : 36, meetGap, walk);
  const groomX = 50 - gap;
  const brideX = 50 + gap;

  const groomTo = { x: 50 - meetGap, y: V_MEET_Y };
  const brideTo = { x: 50 + meetGap, y: V_MEET_Y };
  const groomPos = pointAt(V_GROOM_FROM, groomTo, walk);
  const bridePos = pointAt(V_BRIDE_FROM, brideTo, walk);

  return (
    <section
      ref={stageRef}
      aria-label={copy.acts[activeAct].line}
      className="relative"
      style={{ height: "720vh" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <SplitBackground merge={sidesMerge} narrow={narrow} />
        <ActCaption index={activeAct} />

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

        {/* Nhãn "một câu chuyện, hai nửa" ở đúng lúc hai người nắm tay. */}
        <p
          className="hp-label absolute inset-x-0 z-30 text-center"
          style={{
            top: narrow ? "46%" : "auto",
            bottom: narrow ? "auto" : "24%",
            opacity: meet * infoFade,
            transform: `translateY(${(1 - meet) * 10}px)`,
          }}
        >
          {copy.meetLabel}
        </p>

        {/* Phong bì mọc lên từ điểm gặp.
               `reserveTop` là dải của chú thích hồi, `reserveBottom` là dải của
               khối đường link — và nó PHÌNH RA khi hồi 5 tới, nên tấm thiệp tự thu
               lại nhường chỗ thay vì bị khối link đè lên. Không dùng canh giữa: canh
               giữa thì lúc thiệp rút lên hết, mép trên của nó chạy vào dải chú thích
               và chữ "Hồi bốn" nằm đè lên mặt thiệp. */}
        <div
          className="absolute inset-0 z-20"
          style={{
            opacity: envelopeIn,
            transform: `scale(${lerp(0.34, 1, envelopeIn)})`,
            transformOrigin: `50% ${narrow ? V_MEET_Y : 58}%`,
          }}
        >
          <V7Envelope
            t={envelopeT}
            viewportHeight={viewport.height}
            reserveTop={narrow ? RESERVE_TOP_NARROW : RESERVE_TOP_WIDE}
            reserveBottom={lerp(RESERVE_BOTTOM_IDLE, finaleHeight + 32, linkIn)}
          />
        </div>

        <Finale ref={finaleRef} createHref={createHref} show={linkIn} />
      </div>
    </section>
  );
}

/**
 * Nền hai nửa, hoà dần thành một.
 *
 * Màn rộng chia trái/phải, màn hẹp chia trên/dưới — luôn cắt theo đúng trục mà
 * hai người đang đi, nếu không thì đường chia và lối đi vuông góc nhau và cái
 * nghĩa "hai nhà" mất.
 */
function SplitBackground({ merge, narrow }: { merge: number; narrow: boolean }) {
  const rest = 1 - merge;
  return (
    <div aria-hidden className="absolute inset-0" style={{ background: "var(--hp-paper)" }}>
      <div
        className={narrow ? "absolute inset-x-0 top-0 h-1/2" : "absolute inset-y-0 left-0 w-1/2"}
        style={{ background: SIDE_A, opacity: rest }}
      />
      <div
        className={
          narrow ? "absolute inset-x-0 bottom-0 h-1/2" : "absolute inset-y-0 right-0 w-1/2"
        }
        style={{ background: SIDE_B, opacity: rest }}
      />
      <div
        className={
          narrow
            ? "absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
            : "absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
        }
        style={{ background: "var(--hp-rule)", opacity: rest }}
      />
    </div>
  );
}

/**
 * Chú thích từng hồi.
 *
 * Cách mép trên 4.5rem vì header của trang neo `sticky top-0` cao 4.25rem — để ở
 * 5% thì dòng "Hồi n" bị header cắt.
 *
 * Chọn hồi đang diễn rồi để CSS chuyển mờ theo thời gian, chứ không tính độ mờ
 * theo khoảng cách scroll: cách kia hoặc chồng hai dòng lên nhau, hoặc hở một
 * quãng không dòng nào hiện.
 */
function ActCaption({ index }: { index: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[4.5rem] z-30 px-6 text-center">
      <div className="relative mx-auto h-20 w-full max-w-xl sm:h-24">
        {copy.acts.map((act, actIndex) => {
          const active = actIndex === index;
          return (
            <div
              key={act.line}
              className="absolute inset-x-0 top-0"
              style={{
                opacity: active ? 1 : 0,
                transform: `translateY(${active ? 0 : 12}px)`,
                transition: "opacity 420ms ease, transform 420ms ease",
              }}
            >
              <p className="hp-label !tracking-[0.3em] text-[color:var(--hp-accent)]">
                {act.kicker}
              </p>
              <p className="hp-display mt-3.5 text-[clamp(1.35rem,3vw,2.35rem)] leading-tight">
                {act.line}
              </p>
            </div>
          );
        })}
      </div>
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
      {/* Hai cột thông tin ở hai lề. Vùng giữa để trống cho hai nhân vật đi. */}
      <InfoColumn rows={copy.groomRows} progress={progress} fade={infoFade} side="left" />
      <InfoColumn rows={copy.brideRows} progress={progress} fade={infoFade} side="right" />

      {/* Mặt sàn */}
      <div
        aria-hidden
        className="absolute inset-x-0"
        style={{
          bottom: H_FLOOR,
          height: 1,
          background: "var(--hp-rule)",
          opacity: figureFade,
        }}
      />

      {/* Mốc tính năng trên sàn */}
      <div className="absolute inset-x-0" style={{ bottom: H_FLOOR, height: 0, opacity: infoFade }}>
        {copy.milestones.map((milestone) => {
          /* Chú rể đi từ trái sang nên "đã qua" là toạ độ của anh LỚN HƠN mốc;
             cô dâu đi ngược lại nên là nhỏ hơn. */
          const passed =
            milestone.by === "groom" ? groomX >= milestone.x : brideX <= milestone.x;
          return (
            <FloorMilestone
              key={milestone.label}
              label={milestone.label}
              body={milestone.copy}
              passed={passed}
              left={milestone.x}
            />
          );
        })}
      </div>

      {/* Hai nhân vật */}
      <div
        className="absolute inset-x-0"
        style={{ bottom: H_FLOOR, height: 0, opacity: figureFade }}
      >
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
      <DiagonalPaths
        groomPos={groomPos}
        bridePos={bridePos}
        groomTo={groomTo}
        brideTo={brideTo}
        walk={walk}
        opacity={figureFade}
      />

      {/* Hai khối thông tin, mỗi khối dạt về phía ĐỐI DIỆN lối đi của người
          tương ứng: lối của chú rể bắt đầu ở mép trái nên khối "Nhà trai" thu về
          phải, và ngược lại. Nhờ vậy sợi vết đi không cắt qua chữ. */}
      <div className="absolute inset-x-0 px-6" style={{ top: "20%", opacity: infoFade }}>
        <div className="ml-auto w-[78%]">
          <InfoBlock row={copy.groomRows[0]} show={groomLeftTop} align="left" />
        </div>
      </div>

      {/* Ở 80% chứ không thấp hơn: thấp nữa là bị mép dưới khung nhìn cắt mất
          hai dòng cuối. */}
      <div className="absolute inset-x-0 px-6" style={{ top: "80%", opacity: infoFade }}>
        <div className="w-[78%]">
          <InfoBlock row={copy.brideRows[0]} show={brideLeftBottom} align="right" />
        </div>
      </div>

      {/* Mốc tính năng.
          Mốc của chú rể nằm ở đoạn ĐẦU lối đi của anh (t=0.21, cao hơn hẳn chỗ cô
          dâu sẽ tới) nên nhãn trải sang PHẢI thoải mái. Mốc của cô dâu nằm ở đoạn
          dưới (t=0.54, thấp hơn chỗ chú rể dừng) nên nhãn trải sang TRÁI. Chọn hai
          điểm mà người kia chắc chắn không có mặt thì nhãn không bao giờ bị thân
          người che — đó là lỗi của bản đi thẳng đứng. */}
      <div className="absolute inset-0" style={{ opacity: infoFade }}>
        <PathMilestone
          label={copy.narrowMilestones[0].label}
          passed={walk >= V_GROOM_MARK_T}
          at={groomMark}
          side={copy.narrowMilestones[0].side}
        />
        <PathMilestone
          label={copy.narrowMilestones[1].label}
          passed={walk >= V_BRIDE_MARK_T}
          at={brideMark}
          side={copy.narrowMilestones[1].side}
        />
      </div>

      {/* Hai nhân vật, chân neo vào toạ độ trên lối đi. Nghiêng người theo hướng
          đi 2.5° — nhỏ thôi nhưng đủ để dáng đọc ra là đang tiến tới. */}
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

/**
 * Lối đi của hai người + vết đã đi qua.
 *
 * `viewBox="0 0 100 100"` với `preserveAspectRatio="none"` nên toạ độ SVG trùng
 * khớp với % dùng cho nhân vật; `non-scaling-stroke` giữ nét mảnh đều dù khung bị
 * giãn không đều hai chiều.
 */
function DiagonalPaths({
  groomPos,
  bridePos,
  groomTo,
  brideTo,
  walk,
  opacity,
}: {
  groomPos: Point;
  bridePos: Point;
  groomTo: Point;
  brideTo: Point;
  walk: number;
  opacity: number;
}) {
  return (
    <svg
      aria-hidden
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      fill="none"
      style={{ opacity }}
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
            stroke="var(--hp-rule)"
            strokeWidth={1}
            strokeDasharray="3 4"
            vectorEffect="non-scaling-stroke"
          />
          {/* đoạn đã đi — cái vết để lại mới làm chuyển động đọc ra "đi" */}
          <line
            x1={path.from.x}
            y1={path.from.y}
            x2={path.now.x}
            y2={path.now.y}
            stroke="var(--v7-thread)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            opacity={0.55}
          />
          <circle cx={path.from.x} cy={path.from.y} r={0.7} fill="var(--hp-fg-soft)" />
        </g>
      ))}
      {/* Mặt đất chỗ gặp nhau — chỉ một đoạn ngắn dưới chân hai người, không kẻ
          hết bề ngang: hai người đứng trên cùng một chỗ, không phải trên một cái
          sàn trải dài.
          Chỉ hiện ở đoạn cuối. Hiện sớm theo `walk` thì lúc cô dâu còn đang đi
          lên, chân cô nằm DƯỚI vạch đất — trông như đứng dưới mặt đất. */}
      <line
        x1={24}
        y1={V_MEET_Y}
        x2={76}
        y2={V_MEET_Y}
        stroke="var(--hp-rule)"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        opacity={clamp((walk - 0.85) / 0.15)}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Mảnh dùng chung
   ═══════════════════════════════════════════════════════════════════════════ */

type InfoRow = { at: number; label: string; title: string; copy: string };

/** Cột thông tin ở lề (bố cục ngang). Các dòng hiện dồn lại theo tiến độ. */
function InfoColumn({
  rows,
  progress,
  fade,
  side,
}: {
  rows: readonly InfoRow[];
  progress: number;
  fade: number;
  side: "left" | "right";
}) {
  return (
    <div
      className="absolute top-[22%] w-[22%] max-w-[18rem]"
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
            className="mb-10 last:mb-0"
            style={{
              opacity: enter,
              transform: `translateX(${(1 - enter) * (side === "left" ? -26 : 26)}px)`,
            }}
          >
            <div
              className={`flex items-center gap-3 ${side === "right" ? "flex-row-reverse" : ""}`}
            >
              <span
                aria-hidden
                className="h-px w-5 shrink-0"
                style={{ background: "var(--hp-accent)" }}
              />
              <p className="hp-label !tracking-[0.22em]">{row.label}</p>
            </div>
            <h3 className="hp-display hp-h3 mt-3.5">{row.title}</h3>
            <p className="hp-body-sm mt-2.5">{row.copy}</p>
          </div>
        );
      })}
    </div>
  );
}

/** Khối thông tin một họ (bố cục chéo). */
function InfoBlock({
  row,
  show,
  align,
}: {
  row: InfoRow;
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
      <div className={`flex items-center gap-3 ${align === "right" ? "flex-row-reverse" : ""}`}>
        <span
          aria-hidden
          className="h-px w-5 shrink-0"
          style={{ background: "var(--hp-accent)" }}
        />
        <p className="hp-label !tracking-[0.22em]">{row.label}</p>
      </div>
      <h3 className="hp-display hp-h3 mt-3">{row.title}</h3>
      <p className="hp-body-sm mt-2.5">{row.copy}</p>
    </div>
  );
}

/** Mốc tính năng trên mặt sàn (bố cục ngang). Nhãn treo dưới sàn nên không bao
 *  giờ đè vào thân người đang đi phía trên. */
function FloorMilestone({
  label,
  body,
  passed,
  left,
}: {
  label: string;
  body: string;
  passed: boolean;
  left: number;
}) {
  return (
    <div
      className="absolute flex w-44 flex-col items-center text-center"
      style={{
        left: `${left}%`,
        top: 0,
        marginLeft: -88,
        opacity: passed ? 1 : 0.34,
        transition: "opacity 400ms ease",
      }}
    >
      <span
        className="block rounded-full"
        style={{
          width: passed ? 10 : 6,
          height: passed ? 10 : 6,
          marginTop: passed ? -5 : -3,
          background: passed ? "var(--hp-accent)" : "var(--hp-fg-soft)",
          transition: "all 400ms ease",
        }}
      />
      <span
        aria-hidden
        className="mt-4 block h-6 w-px"
        style={{ background: passed ? "var(--hp-accent)" : "var(--hp-rule)" }}
      />
      <p className="hp-label mt-3.5 !tracking-[0.18em] whitespace-nowrap">{label}</p>
      <p className="hp-body-sm mt-2.5 text-[0.8125rem] leading-relaxed">{body}</p>
    </div>
  );
}

/** Mốc tính năng trên lối đi chéo (bố cục hẹp). Nhãn trải về một phía. */
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
          width: passed ? 9 : 5,
          height: passed ? 9 : 5,
          marginLeft: side === "right" ? -4.5 : 0,
          marginRight: side === "left" ? -4.5 : 0,
          background: passed ? "var(--hp-accent)" : "var(--hp-fg-soft)",
          transition: "all 400ms ease",
        }}
      />
      <span
        aria-hidden
        className="block h-px w-4 shrink-0"
        style={{ background: passed ? "var(--hp-accent)" : "var(--hp-rule)" }}
      />
      {/* Bề ngang cố định 6rem và CHO PHÉP xuống dòng. Khoảng trống phía ngoài lối
          đi trên điện thoại chỉ khoảng 100px, nên nhãn một dòng không ngắt
          ("KHÁCH MỜI & RSVP") sẽ tràn ra ngoài mép màn hình. */}
      <p className={`hp-label w-24 !tracking-[0.16em] ${side === "left" ? "text-right" : ""}`}>
        {label}
      </p>
    </div>
  );
}

/** Điểm hai bàn tay chạm nhau. */
function HandJoin({ meet, style }: { meet: number; style: React.CSSProperties }) {
  return (
    <div
      aria-hidden
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
          width: 14,
          height: 14,
          background: "var(--hp-accent)",
          boxShadow: `0 0 0 ${lerp(0, 10, meet)}px color-mix(in oklab, var(--hp-seal) 16%, transparent)`,
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
 *   "top"    — hộp neo theo `top`, phải kéo lên đúng chiều cao thân để CHÂN, chứ
 *              không phải đầu, nằm trên toạ độ đã cho (bố cục chéo)
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

/** Hồi 5 — đường link thật của cặp đôi và ba kênh gửi. */
function Finale({
  ref,
  createHref,
  show,
}: {
  ref: RefObject<HTMLDivElement | null>;
  createHref: string;
  show: number;
}) {
  return (
    <div
      ref={ref}
      className="absolute inset-x-0 bottom-[5%] z-30 px-6"
      style={{
        opacity: show,
        transform: `translateY(${(1 - show) * 22}px)`,
        /* Ẩn khỏi chuột lúc chưa hiện — nếu không thì nút bấm vẫn nhận click khi
           người xem chưa cuộn tới, và trên mobile nó chặn cả vùng cuộn. */
        pointerEvents: show > 0.9 ? "auto" : "none",
      }}
    >
      <Shell className="flex flex-col items-center text-center">
        <p className="hp-label !tracking-[0.28em]">{copy.finale.label}</p>

        {/* Ô địa chỉ. Không phải input — chỉ để thấy hình dạng của đường link. */}
        <div
          className="mt-5 flex w-[min(26rem,88vw)] items-center gap-3 px-4 py-3"
          style={{
            background: "color-mix(in oklab, var(--hp-paper) 60%, white)",
            border: "1px solid var(--hp-rule)",
            borderRadius: 2,
          }}
        >
          <span
            aria-hidden
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: "var(--hp-accent)" }}
          />
          <span className="hp-body-sm truncate !text-[color:var(--hp-fg)]">
            {copy.finale.link}
          </span>
        </div>

        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {copy.finale.channels.map((channel) => (
            <li key={channel} className="hp-body-sm flex items-center gap-2.5">
              <span
                aria-hidden
                className="h-1 w-1 rounded-full"
                style={{ background: "var(--hp-accent)" }}
              />
              {channel}
            </li>
          ))}
        </ul>

        <p className="hp-body-sm mt-5 max-w-[26rem]">{copy.finale.note}</p>

        <a href={createHref} className="hp-btn hp-btn-solid mt-7">
          {copy.finale.cta}
        </a>
      </Shell>
    </div>
  );
}

/**
 * Hero của V7 — cố tình NGẮN.
 *
 * Trang này lấy một sân khấu cao 720vh ngay sau hero, nên hero phải nhường chỗ:
 * chỉ một câu, hai nút, và một mũi chỉ xuống. Đặt cả dải ảnh thiệp như bản V0 thì
 * người xem đã no mắt trước khi hồi một bắt đầu.
 *
 * Không dùng `hp-h1` mà một cỡ nhỏ hơn: dòng "Hồi một" của sân khấu xuất hiện
 * ngay sau đó cũng là chữ display, hai cỡ quá gần nhau thì đọc thành hai tiêu đề
 * tranh nhau.
 */
export function V7Hero({ createHref }: { createHref: string }) {
  return (
    <section className="hp-paper hp-grain flex min-h-[76vh] items-center py-[var(--hp-chapter-y)]">
      <Shell className="text-center">
        <Eyebrow className="justify-center">{copy.hero.eyebrow}</Eyebrow>

        <h1 className="hp-display mx-auto mt-7 max-w-[38rem] text-[clamp(2.35rem,6vw,4.5rem)] leading-[0.98]">
          {copy.hero.titleLead}{" "}
          <span className="hp-display-italic text-[color:var(--hp-accent)]">
            {copy.hero.titleAccent}
          </span>
        </h1>

        <p className="hp-body mx-auto mt-8 max-w-[34rem]">{copy.hero.lede}</p>

        <div className="mt-11 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <a href={createHref} className="hp-btn hp-btn-solid">
            {copy.hero.ctaPrimary}
            <ArrowRight className="size-4" strokeWidth={1.75} />
          </a>
          <NextLink href="/mau-thiep" className="hp-link">
            {copy.hero.ctaSecondary}
          </NextLink>
        </div>

        <p className="hp-label v7-nudge mt-20 flex items-center justify-center gap-2.5">
          {copy.hero.scrollHint}
          <ArrowDown aria-hidden className="size-3.5" strokeWidth={1.75} />
        </p>
      </Shell>
    </section>
  );
}
