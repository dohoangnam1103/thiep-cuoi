"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import NextLink from "next/link";
import { useRef } from "react";

import { Eyebrow, Shell } from "../primitives";
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
import { V8Envelope } from "./v8-envelope";
import { v7Copy } from "./v7-copy";
import { v8Copy } from "./v8-copy";

/**
 * Sân khấu "Một ngày cưới" — hồi mở đầu của V8.
 *
 * Một sân khấu cao 700vh, bên trong là khung dính cao đúng một khung nhìn.
 * Tiến độ cuộn qua sân khấu điều khiển một ngày cưới trôi:
 *
 *   hồi 1  0.00–0.24  sáng sương — lễ dâng nhà trai
 *   hồi 2  0.24–0.48  trưa nắng — lễ thành hôn, giờ lễ và bản đồ
 *   hồi 3  0.48–0.72  tối đèn nến — tiệc mừng, sổ lưu bút, hộp quà QR
 *   hồi 4  0.72–0.84  con dấu ép xuống, niêm phong ngày cưới
 *   hồi 5  0.80–0.96  phong bì hiện ra, mở thiệp rồi đường link chia sẻ
 *
 * Nền đổi tông theo canh giờ bằng cách TRỘN hai mốc kế tiếp nhau trong chuỗi
 * `color-mix()` gán inline: không thư viện màu, không canvas, chỉ một phép tính
 * phần trăm mỗi khung. Bốn mốc nằm ở `v8.css` (`--v8-dawn/noon/dusk/night`).
 */

const copy = v8Copy;

/** Ngưỡng đổi bố cục lịch trình sang dạng xếp dọc. */
const NARROW_AT = 860;

/* ── Mặt trời trên cung trời ──────────────────────────────────────────────── */

/**
 * Cung mặt trời vẽ mảnh phía trên sân khấu. Chấm đỏ chạy từ trái qua phải theo
 * tiến độ ba hồi đầu; gần cuối nó mờ đi nhường chỗ cho một chấm vàng nhỏ (mặt
 * trăng) — cùng một cung, đọc ra là ngày đã hết mà không cần thêm đường thứ
 * hai. Thuần trang trí nên aria-hidden cho cả cụm.
 */
function SkyArc({ p }: { p: number }) {
  /* Cung bán nguyệt: tâm ở đáy giữa, bán kính theo % bề ngang của viewBox
     100×34 — đủ dẹt để không lấn vào chú thích hồi. */
  const path = "M 6 34 A 44 30 0 0 1 94 34";
  const dayT = clamp(seg(p, 0, 0.72));
  const sunFade = 1 - seg(p, 0.66, 0.78);
  const moonIn = seg(p, 0.72, 0.82);
  /* Góc trên cung: 180° quét hết chiều dài cung; dùng pathLength=1 để lấy điểm
     theo tỉ lệ thay vì đo pixel (cùng mẹo với sợi tơ hồng của V4/V7). */
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-14 z-10">
      <svg className="mx-auto h-auto w-[min(52rem,92vw)]" viewBox="0 0 100 34" fill="none">
        <path
          id="v8-arc"
          d={path}
          stroke="var(--hp-rule)"
          strokeWidth={0.4}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
        <SunDot t={dayT} opacity={sunFade} />
        <MoonDot t={dayT} opacity={moonIn} />
      </svg>
    </div>
  );
}

function SunDot({ t, opacity }: { t: number; opacity: number }) {
  return (
    <circle r={1.9} fill="var(--v8-sun)" opacity={opacity}>
      <animateMotion
        dur="1s"
        fill="freeze"
        repeatCount="indefinite"
        keyPoints={`${t};${t}`}
        keyTimes="0;1"
        calcMode="linear"
      >
        {/* href phải là tham chiếu tới path #v8-arc */}
        <mpath href="#v8-arc" />
      </animateMotion>
    </circle>
  );
}

function MoonDot({ t, opacity }: { t: number; opacity: number }) {
  return (
    <circle r={1.3} fill="var(--v8-moon)" opacity={opacity}>
      <animateMotion
        dur="1s"
        fill="freeze"
        repeatCount="indefinite"
        keyPoints={`${clamp(t)};${clamp(t)}`}
        keyTimes="0;1"
        calcMode="linear"
      >
        <mpath href="#v8-arc" />
      </animateMotion>
    </circle>
  );
}

/* ── Nền theo canh giờ ────────────────────────────────────────────────────── */

/** Bốn mốc màu, vị trí trên trục tiến độ 0→1. Khớp nhịp seg của sân khấu. */
const SKY_STOPS = [
  { at: 0.0, color: "var(--v8-dawn)" },
  { at: 0.3, color: "var(--v8-noon)" },
  { at: 0.58, color: "var(--v8-dusk)" },
  { at: 0.86, color: "var(--v8-night)" },
] as const;

/** Trộn hai mốc kế tiếp thành một màu duy nhất bằng chuỗi color-mix(). */
function skyAt(p: number): string {
  if (p <= SKY_STOPS[0].at) return SKY_STOPS[0].color;
  for (let i = 0; i < SKY_STOPS.length - 1; i += 1) {
    const a = SKY_STOPS[i];
    const b = SKY_STOPS[i + 1];
    if (p <= b.at) {
      const t = clamp((p - a.at) / (b.at - a.at));
      /* easeInOut cho mạch màu: đổi tông liền như ánh sáng chứ không tuyến tính
         cơ học. */
      const eased = easeInOut(t);
      return `color-mix(in oklab, ${a.color} ${(100 - eased * 100).toFixed(1)}%, ${b.color})`;
    }
  }
  return SKY_STOPS[SKY_STOPS.length - 1].color;
}

/** true khi nền đang tối (dusk muộn trở đi) — chữ chuyển sang hệ cream/gold. */
function skyIsDark(p: number): boolean {
  return p >= 0.62;
}

/* ── Sân khấu chính ───────────────────────────────────────────────────────── */

export function V8Day({ createHref }: { createHref: string }) {
  const stageRef = useRef<HTMLElement | null>(null);
  const progress = useStageProgress(stageRef);
  const reduced = useReducedMotion();
  const viewport = useViewport();

  /* Giảm chuyển động: ghim ở hồi kết (thiệp đã mở, link đã hiện) thay vì diễn
     lại. Không bao giờ để người dùng thấy màn hình trống. */
  const p = reduced ? 0.97 : progress;
  const narrow = viewport.width < NARROW_AT;

  /* ── Nhịp các hồi ── */
  const act = p < 0.24 ? 0 : p < 0.48 ? 1 : 2;
  const rowsIn = easeOut(seg(p, 0.04, 0.16));

  /* Con dấu: rơi từ trên xuống rồi ép vào giữa màn hình. */
  const sealDrop = easeInOut(seg(p, 0.72, 0.8));
  const sealDone = sealDrop >= 1;
  /* Phong bì có tiến độ riêng, V8Envelope tự cắt các bước bên trong. */
  const envelopeIn = easeOut(seg(p, 0.78, 0.86));
  const envelopeT = seg(p, 0.8, 0.94);
  /* Link hiện sau khi thiệp mở xong — khớp mốc hồi kết. */
  const linkIn = seg(p, 0.9, 0.97);

  const dark = skyIsDark(p);

  /* Chữ trên nền tối đổi hệ cream/gold; trên nền sáng giữ ink mặc định. */
  const fg = dark ? "var(--hp-cream)" : undefined;
  const fgSoft = dark ? "var(--hp-gold)" : undefined;

  return (
    <section
      ref={stageRef}
      aria-label={copy.acts[act].line}
      className="relative"
      style={{ height: "700vh" }}
    >
      <div
        className="sticky top-0 h-screen overflow-hidden transition-colors duration-300"
        style={{ background: skyAt(p) }}
      >
        <SkyArc p={p} />
        <ActCaption index={act} fgSoft={fgSoft} />

        {/* Khối lịch trình của hồi đang diễn — mỗi hồi một vị trí riêng để không
            đè lên chú thích, và đổi hệ màu cùng lúc với nền. */}
        <ScheduleBlock
          actIndex={act}
          visible={rowsIn}
          narrow={narrow}
          fg={fg}
          fgSoft={fgSoft}
        />

        {/* Hồi kết: con dấu ép xuống giữa màn hình. */}
        <SealMoment drop={sealDrop} done={sealDone} show={envelopeIn < 0.6} dark={dark} />

        {/* Phong bì mọc lên từ nơi con dấu vừa ép. */}
        <div
          className="absolute inset-0 z-20 flex items-center justify-center"
          style={{
            opacity: envelopeIn,
            transform: `scale(${lerp(0.3, 1, envelopeIn)})`,
          }}
        >
          <V8Envelope t={envelopeT} viewportHeight={viewport.height} />
        </div>

        <Finale createHref={createHref} show={linkIn} />
      </div>
    </section>
  );
}

/* ── Chú thích từng hồi ───────────────────────────────────────────────────── */

/**
 * Kicker-giờ + dòng lớn của hồi đang diễn.
 *
 * Cách mép trên 4.5rem vì header neo `sticky top-0` cao 4.25rem — để thấp hơn
 * thì dòng bị header cắt (ghi chú của ActCaption V7). Đổi mờ theo thời gian CSS
 * chứ không tính độ mờ theo khoảng cách scroll.
 */
function ActCaption({ index, fgSoft }: { index: number; fgSoft?: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[4.5rem] z-30 px-6 text-center">
      <div className="relative mx-auto h-20 w-full max-w-xl sm:h-24">
        {copy.acts.map((item, itemIndex) => {
          const active = itemIndex === index;
          return (
            <div
              key={item.id}
              className="absolute inset-x-0 top-0"
              style={{
                opacity: active ? 1 : 0,
                transform: `translateY(${active ? 0 : 12}px)`,
                transition: "opacity 420ms ease, transform 420ms ease",
              }}
            >
              <p
                className="hp-label !tracking-[0.3em] tabular-nums"
                style={{ color: fgSoft ?? "var(--hp-accent)" }}
              >
                {item.kicker} · {item.line}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Khối lịch trình thật của từng canh giờ.
 *
 * Ba hồi ba vị trí (trái / phải / dưới-giữa) để mắt bắt được sự trôi của thời
 * gian qua chính bố cục, không chỉ qua màu nền. Trên màn hẹp xếp về dưới-chú-
 * thích cho cả ba — chỗ hẹp không đủ đất cho ba kiểu khác nhau.
 */
function ScheduleBlock({
  actIndex,
  visible,
  narrow,
  fg,
  fgSoft,
}: {
  actIndex: number;
  visible: number;
  narrow: boolean;
  fg?: string;
  fgSoft?: string;
}) {
  const item = copy.acts[actIndex];

  const place = narrow
    ? { left: "50%", bottom: "18%", transform: "translateX(-50%)" }
    : [
        { left: "12%", bottom: "22%", transform: "none" },
        { right: "12%", bottom: "26%", transform: "none" },
        { left: "50%", bottom: "20%", transform: "translateX(-50%)" },
      ][actIndex];

  return (
    <div
      className="absolute z-30 w-[min(24rem,86vw)] px-6 sm:px-0"
      style={{
        ...place,
        opacity: visible,
        transform: `${place.transform} translateY(${(1 - visible) * 22}px)`,
        transition: "opacity 420ms ease",
      }}
    >
      <Shell className="!px-0">
        <ul className="space-y-4">
          {item.rows.map((row) => (
            <li key={row.title}>
              <p className="hp-body-sm font-semibold" style={{ color: fg ?? undefined }}>
                {row.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: fgSoft ?? undefined }}>
                {row.copy}
              </p>
            </li>
          ))}
        </ul>
      </Shell>
    </div>
  );
}

/* ── Con dấu ép ngày ──────────────────────────────────────────────────────── */

/**
 * Con dấu sáp to rơi xuống giữa màn hình, in nổi ngày cưới.
 *
 * Là khoảnh khắc "niêm phong" của ngày: mọi canh giờ đã đi qua, còn lại một
 * ngày duy nhất được ép vào dấu. Scale từ lớn về 1 + opacity là cảm giác lực
 * đập; class `v8-seal-done` cho phần rung lì sau khi ép (keyframes ở v8.css,
         chạy một lần).
 */
function SealMoment({
  drop,
  done,
  show,
  dark,
}: {
  drop: number;
  done: boolean;
  show: boolean;
  dark: boolean;
}) {
  if (!show) return null;

  const size = lerp(220, 168, drop);
  const y = lerp(-40, 0, drop);

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center"
      style={{ pointerEvents: "none", opacity: clamp(drop * 1.4) }}
    >
      <div
        className={`flex flex-col items-center justify-center rounded-full text-center ${done && !dark ? "" : ""}`}
        style={{
          width: size,
          height: size,
          transform: `translateY(${y}px)`,
          background:
            "radial-gradient(circle at 38% 32%, color-mix(in oklab, var(--hp-seal) 88%, white), var(--hp-seal))",
          boxShadow: `0 ${lerp(60, 22, drop)}px ${lerp(70, 34, drop)}px -18px color-mix(in oklab, var(--hp-seal) 55%, transparent)`,
        }}
      >
        <span
          className={`v8-seal-done hp-label block`}
          style={{ color: "var(--hp-cream)", fontSize: "0.62rem" }}
        >
          {copy.seal.label}
        </span>
        <span
          className="hp-num mt-1.5 leading-none"
          style={{ color: "var(--hp-cream)", fontSize: size * 0.082 }}
        >
          {copy.seal.dateLine}
        </span>
      </div>
      <p
        className="absolute inset-x-0 bottom-[16%] px-6 text-center text-sm italic"
        style={{ color: "var(--hp-gold)" }}
      >
        {copy.seal.note}
      </p>
    </div>
  );
}

/* ── Hồi kết — link chia sẻ ───────────────────────────────────────────────── */

/**
 * Nội dung lấy NGUYÊN từ `v7Copy.finale` — hai biến thể phải nói cùng một câu
 * về đường link, sửa một chỗ thì cả hai đi theo.
 */
function Finale({ createHref, show }: { createHref: string; show: number }) {
  const finale = v7Copy.finale;
  return (
    <div
      className="absolute inset-x-0 bottom-[7%] z-30 px-6"
      style={{
        opacity: show,
        transform: `translateY(${(1 - show) * 22}px)`,
        /* Ẩn khỏi chuột lúc chưa hiện — nếu không thì nút bấm vẫn nhận click khi
           người xem chưa cuộn tới, và trên mobile nó chặn cả vùng cuộn. */
        pointerEvents: show > 0.9 ? "auto" : "none",
      }}
    >
      <Shell className="flex flex-col items-center text-center">
        <p className="hp-label !tracking-[0.28em]" style={{ color: "var(--hp-gold)" }}>
          {finale.label}
        </p>

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
          <span className="hp-body-sm truncate !text-[color:var(--hp-fg)]">{finale.link}</span>
        </div>

        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {finale.channels.map((channel) => (
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

        <NextLink href={createHref} className="hp-btn hp-btn-solid group mt-7">
          {finale.cta}
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-1"
            strokeWidth={1.75}
          />
        </NextLink>

        <NextLink href="/mau-thiep" className="hp-link mt-4">
          {copy.hero.ctaSecondary}
        </NextLink>
      </Shell>
    </div>
  );
}

/* ── Hero ngắn dẫn vào sân khấu ───────────────────────────────────────────── */

/** Hero giấy ngắn trước sân khấu — cùng ngôn ngữ chữ với hero V7 nhưng nói về
 *  thời gian trong ngày thay vì hành trình hai người. */
export function V8Hero({ createHref }: { createHref: string }) {
  return (
    <section className="hp-paper hp-grain relative overflow-hidden">
      <Shell className="grid gap-10 pb-14 pt-12 sm:pt-16 lg:grid-cols-2 lg:pb-20 lg:pt-24">
        <div className="flex flex-col justify-center lg:pr-14">
          <div className="hp-enter" style={{ "--hp-enter-delay": "60ms" } as React.CSSProperties}>
            <Eyebrow>{copy.hero.eyebrow}</Eyebrow>
          </div>

          <h1
            className="hp-display hp-h1 hp-enter mt-7"
            style={{ "--hp-enter-delay": "140ms" } as React.CSSProperties}
          >
            {copy.hero.titleLead}
            <span className="hp-display-italic mt-1 block pl-[0.5ch] text-[color:var(--hp-accent)]">
              {copy.hero.titleAccent}
            </span>
          </h1>

          <p
            className="hp-body hp-enter mt-7 max-w-md leading-relaxed"
            style={{ "--hp-enter-delay": "220ms" } as React.CSSProperties}
          >
            {copy.hero.lede}
          </p>

          <div
            className="hp-enter mt-9 flex flex-wrap items-center gap-x-7 gap-y-3"
            style={{ "--hp-enter-delay": "300ms" } as React.CSSProperties}
          >
            <NextLink href={createHref} className="hp-btn hp-btn-solid group">
              {copy.hero.ctaPrimary}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                strokeWidth={1.75}
              />
            </NextLink>
            <NextLink href="/mau-thiep" className="hp-link">
              {copy.hero.ctaSecondary}
            </NextLink>
          </div>
        </div>

        {/* Cột phải: lời nhắc cuộn. Sân khấu ngay bên dưới tự là hình ảnh hero,
            không cần ảnh minh hoạ cạnh tranh sự chú ý. */}
        <div className="hidden flex-col items-start justify-end border-l border-[color:var(--hp-rule)] pl-14 lg:flex">
          <p className="hp-label">06:00 → 18:00</p>
          <p className="hp-display-italic mt-4 text-[clamp(1.6rem,2.4vw,2.2rem)] leading-snug text-[color:var(--hp-fg-soft)]">
            {copy.hero.scrollHint}
          </p>
          <ArrowDown aria-hidden className="v8-nudge mt-6 size-5 text-[color:var(--hp-accent)]" />
        </div>
      </Shell>
    </section>
  );
}
