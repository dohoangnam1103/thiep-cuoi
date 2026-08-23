# Home Revamp v6 — "Hành trình về chung một nhà" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm lab variant V6 (`/home-2/lab/v6`) ghép 4 variant: xương V5 (5 hồi scroll-driven), tơ hồng V4 (lớp chỉ đỏ), payload V2 (mỗi cửa sổ cuộn một tính năng), phong bì V1 (hồi kết mở nắp rồi mới hiện link chia sẻ).

**Architecture:** Một stage scroll-driven duy nhất (`useStageProgress`, 800vh, sticky viewport). Progress `p ∈ [0,1]` điều khiển: nền hai nửa hoà làm một, hai chibi đi từ hai mép về điểm gặp (contract `chibi-couple.tsx`), tấm thiệp mọc lên, rồi chuyển cảnh sang phong bì 3D mở nắp. Lớp tơ hồng là SVG phủ stage, vẽ dần bằng `strokeDashoffset = 1 − p`. Payload info là các panel theo cửa sổ `seg(p, from, to)`, dùng `pInfo = progress` riêng để reduced-motion vẫn tuần tự theo scroll.

**Tech Stack:** Next.js 16 App Router, React 19, TS strict, Tailwind v4, bộ kit lo-fi `src/components/home2/lab/kit.tsx`.

**Spec:** `docs/superpowers/specs/2026-08-22-home-revamp-design.md`

## Global Constraints

- KHÔNG sửa production Home Page (`src/app/[locale]/page.tsx`) hay bất kỳ variant cũ nào (V0–V5). Chỉ thêm file mới + thêm entry registry.
- Wireframe lo-fi: chỉ `WIRE` palette + khối xám từ kit, không ảnh/font thật. Copy hardcode tiếng Việt (lab noindex).
- Phong bì giữ invariants V1: portrait; `CARD_W (272) < ENV_W (320)`; `CARD_H (366) + CARD_INSIDE_Y (30) = 396 < ENV_H (424)`; 3 lớp tối dần `ENV_BACK #dcd4c6 → ENV_FRONT #d0c7b6 → ENV_FLAP #c2b8a4`, thiệp `#fbf8f2` sáng nhất.
- Tơ hồng: `preserveAspectRatio="none"`, `vector-effect="non-scaling-stroke"`, `pathLength={1}`, `strokeDashoffset = 1 − p`, `buildThread()` với `UNIT=100, AXIS=11, SWING=8`. Không sticky, không đo pixel từng frame.
- Bản đồ hồi (p): 0.00–0.10 mở màn · 0.10–0.50 đi lại + 4 milestone · 0.50–0.62 gặp nắm tay + milestone 05 · 0.62–0.76 thiệp mọc + TextBlock editor · 0.76–1.00 phong bì: nắp mở 0.76–0.84 → thiệp trượt 0.84–0.92 → FakeButton 0.92–1.00.
- Màn hẹp `< 768px`: bố cục chéo (groom từ trên-trái `{14,30}`, bride từ dưới-phải `{86,94}`, gặp tại `{50, 56}`), payload xếp khối dọc, chừa lề trái cho tơ hồng.
- Reduced-motion: `p = 1` ghim tư thế cuối (chibi ẩn, phong bì mở, thiệp ra, share hiện); milestone + caption dùng `progress` thô nên vẫn tuần tự theo scroll.
- Môi trường máy này: subprocess (git/npm/node) bị macOS TCC chặn trong `~/Documents` → lint/typecheck/build/commit do user chạy tay; verify UI bằng Playwright MCP trên dev server localhost:3000.

## File Structure

```
src/components/home2/lab/v6-thread.tsx    # ThreadOverlay — lớp tơ hồng (port V4)
src/components/home2/lab/v6-envelope.tsx  # EnvelopeFinale — hồi kết phong bì (port V1)
src/components/home2/lab/v6-merged.tsx    # V6Merged — component chính, stage 5 hồi
src/app/[locale]/home-2/lab/v6/page.tsx   # route noindex
src/components/home2/lab/kit.tsx          # +1 entry VARIANTS (VariantSwitcher)
src/app/[locale]/home-2/lab/page.tsx      # +1 entry VARIANTS (lab index) + đếm "Sáu"
```

Tách 3 file component ngay từ đầu (spec §5 cho phép): thread và envelope là 2 cơ chế độc lập có interface rõ (props `progress` / `p, appear, viewportHeight`), giữ `v6-merged.tsx` tập trung vào kịch bản.

---

### Task 1: Lớp tơ hồng — `v6-thread.tsx`

**Files:**
- Create: `src/components/home2/lab/v6-thread.tsx`

**Interfaces:**
- Consumes: `WIRE` từ `./kit`.
- Produces: `ThreadOverlay({ progress }: { progress: number })` — SVG phủ toàn stage, Task 3 đặt `<ThreadOverlay progress={p} />` trong sticky viewport.

- [ ] **Step 1: Write file**

```tsx
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
```

- [ ] **Step 2: Kiểm tra compile** — dev server (localhost:3000) không báo lỗi khi file được import ở Task 3.

### Task 2: Hồi kết phong bì — `v6-envelope.tsx`

**Files:**
- Create: `src/components/home2/lab/v6-envelope.tsx`

**Interfaces:**
- Consumes: `Bar, FakeButton, LoFiCard, WIRE, clamp, easeInOut, easeOut, lerp, seg` từ `./kit`.
- Produces: `EnvelopeFinale({ p, appear, viewportHeight }: { p: number; appear: number; viewportHeight: number })`. `p` là progress toàn trang (tự tính cửa sổ 0.76–1.00 bên trong); `appear` là độ mờ chuyển cảnh từ hồi 4 (main tính `seg(p, 0.72, 0.76)`).

- [ ] **Step 1: Write file**

```tsx
"use client";

import { Bar, FakeButton, LoFiCard, WIRE, clamp, easeInOut, easeOut, lerp, seg } from "./kit";

/**
 * Hồi kết V6 — phong bì mở nắp, thiệp trượt ra, link chia sẻ. Port từ V1 với
 * đủ invariants hình học: phong bì ĐỨNG (portrait); CARD_W < ENV_W và
 * CARD_H + CARD_INSIDE_Y < ENV_H nên thiệp không lòi ra sau khi trượt vào;
 * ba lớp tối dần vào trong (ENV_BACK → ENV_FRONT → ENV_FLAP), tấm thiệp sáng nhất.
 *
 * Trình tự theo spec: nắp gập mở 0.76–0.84 → thiệp trượt lên 0.84–0.92 →
 * FakeButton chia sẻ fade in 0.92–1.00. `appear` là độ mờ của cả cụm khi
 * chuyển cảnh từ hồi 4 (0.72–0.76).
 */

const ENV_W = 320;
const ENV_H = 424;
const CARD_W = 272;
const CARD_H = 366;
/** Vị trí tấm thiệp khi còn nằm trong phong bì. */
const CARD_INSIDE_Y = 30;
/** Vị trí tấm thiệp khi đã rút lên hẳn. */
const CARD_OUT_Y = -238;
const FLAP_H = ENV_H * 0.42;
const FRONT_TOP = ENV_H * 0.32;

const ENV_BACK = "#dcd4c6";
const ENV_FRONT = "#d0c7b6";
const ENV_FLAP = "#c2b8a4";
const CARD_PAPER = "#fbf8f2";

export function EnvelopeFinale({
  p,
  appear,
  viewportHeight,
}: {
  p: number;
  appear: number;
  viewportHeight: number;
}) {
  const flapOpen = easeInOut(seg(p, 0.76, 0.84));
  const pull = easeOut(seg(p, 0.84, 0.92));
  const linkIn = seg(p, 0.92, 1);
  const cardY = lerp(CARD_INSIDE_Y, CARD_OUT_Y, pull);

  /* Cụm phải vừa khung nhìn cả khi thiệp đã rút lên cao nhất: chiều cao thực
     tế lúc đó là |CARD_OUT_Y| + ENV_H, lấy đúng số đó làm mẫu số. */
  const extent = Math.abs(CARD_OUT_Y) + ENV_H;
  const fit = clamp((viewportHeight * 0.62) / extent, 0.42, 1);
  // Thiệp rút lên thì hạ cả cụm xuống để bố cục vẫn nằm giữa khung nhìn.
  const groupY = lerp(0, Math.abs(CARD_OUT_Y) * 0.42, pull);

  if (appear <= 0.001) return null;

  return (
    <div
      className="absolute inset-0 z-20"
      style={{ opacity: appear, pointerEvents: appear > 0.5 ? "auto" : "none" }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative flex items-center justify-center"
          style={{
            perspective: "1600px",
            transform: `translateY(${groupY * fit}px) scale(${fit})`,
          }}
        >
          <div
            className="relative"
            style={{
              width: ENV_W,
              height: ENV_H,
              transformStyle: "preserve-3d",
              // Nhìn chếch từ trên xuống: nắp mở NGƯỢC về phía sau, nhìn chính
              // diện thì nắp lật ra sau thân sau và biến mất (ghi chú V1).
              transform: `rotateX(${lerp(16, 3, pull)}deg)`,
            }}
          >
            {/* Thân sau */}
            <div
              className="absolute inset-0"
              style={{ background: ENV_BACK, border: `1px solid ${WIRE.line}` }}
            />

            {/* Tấm thiệp — giữa thân sau và thân trước. translateZ xếp lớp:
                thân sau 0, thiệp 1, thân trước 2, nắp 3. */}
            <div
              className="absolute left-1/2 top-0"
              style={{
                width: CARD_W,
                height: CARD_H,
                marginLeft: -CARD_W / 2,
                transform: `translateY(${cardY}px) translateZ(1px)`,
              }}
            >
              <LoFiCard face={0} className="absolute inset-0" style={{ background: CARD_PAPER }} />
            </div>

            {/* Thân trước */}
            <div
              className="absolute inset-x-0"
              style={{
                top: FRONT_TOP,
                bottom: 0,
                background: ENV_FRONT,
                borderLeft: `1px solid ${WIRE.line}`,
                borderRight: `1px solid ${WIRE.line}`,
                borderBottom: `1px solid ${WIRE.line}`,
                boxShadow: "0 -3px 10px -3px rgba(47,44,41,0.28)",
                transform: "translateZ(2px)",
              }}
            />

            {/* Nắp — tam giác, bản lề ở mép trên, dừng ở 150° (ghi chú V1). */}
            <div
              className="absolute inset-x-0 top-0"
              style={{
                height: FLAP_H,
                background: ENV_FLAP,
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                transformOrigin: "top center",
                transform: `translateZ(3px) rotateX(${-flapOpen * 150}deg)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* CTA cuối: đường link + nút chia sẻ */}
      <div
        className="absolute inset-x-0 bottom-[7%] z-30 flex flex-col items-center gap-4 px-6"
        style={{ opacity: linkIn, transform: `translateY(${(1 - linkIn) * 22}px)` }}
      >
        <div
          className="flex w-[min(24rem,86vw)] items-center gap-3 rounded-[3px] px-4 py-3"
          style={{ background: "#fff", border: `1px solid ${WIRE.line}` }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: WIRE.accent }} />
          <Bar w="72%" h={8} tone={WIRE.block} className="flex-1" />
        </div>
        <FakeButton w={186} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Kiểm tra compile** — như Task 1.

### Task 3: Component chính — `v6-merged.tsx`

**Files:**
- Create: `src/components/home2/lab/v6-merged.tsx`

**Interfaces:**
- Consumes: `ThreadOverlay` (Task 1), `EnvelopeFinale` (Task 2), kit helpers/hooks, `ChibiBride/ChibiGroom/FIG_W/FIG_H/HAND_Y` từ `./chibi-couple`.
- Produces: `V6Merged()` — Task 4 dùng trong route.

- [ ] **Step 1: Write file**

```tsx
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
 * - Lớp tơ hồng V4: sợi chỉ đỏ vẽ dần xuyên suốt 5 hồi (v6-thread.tsx).
 * - Nhịp thông tin V2: mỗi cửa sổ cuộn hiện ĐÚNG MỘT tính năng, panel xen kẽ
 *   trái/phải; gặp nhau thì milestone 05, thiệp mọc thì panel editor.
 * - Hồi kết V1: phong bì đứng mở nắp, thiệp trượt ra, rồi mới hiện link
 *   chia sẻ (v6-envelope.tsx).
 *
 * Hai dòng tiến độ:
 * - `p` = chuyển động (chibi, nền, thiệp, phong bì, tơ hồng). Reduced-motion
 *   ghim p = 1: tư thế cuối, không animate.
 * - `pInfo` = progress thô cho milestone + chú thích, nên reduced-motion vẫn
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

/** Một nhân vật trên sân khấu. Màn rộng neo đáy, màn hẹp neo toạ độ %. */
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
  const metLabel = seg(pInfo, 0.5, 0.54) * (1 - seg(pInfo, 0.7, 0.76));

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
          {/* ── Nền hai nửa, hoà dần thành một ── */}
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
              <Walker kind="groom" x={groomPos.x} y={groomPos.y} scale={scale} bob={bob} stride={stridePhase} walking={walking} fade={figureFade} narrow />
              <Walker kind="bride" x={bridePos.x} y={bridePos.y} scale={scale} bob={bob} stride={stridePhase} walking={walking} fade={figureFade} narrow />
            </>
          ) : (
            <>
              <Walker kind="groom" x={groomX} y={V_MEET_Y} scale={scale} bob={bob} stride={stridePhase} walking={walking} fade={figureFade} narrow={false} />
              <Walker kind="bride" x={brideX} y={V_MEET_Y} scale={scale} bob={bob} stride={stridePhase} walking={walking} fade={figureFade} narrow={false} />
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
```

**Ghi chú Walker + scale:** scale nằm trong cùng chuỗi transform (sau translate), `transformOrigin: "center bottom"` — nhân vật co/giãn quanh chân, neo đáy không trôi. Màn hẹp `translate(-50%, -50%)` neo tâm khung nhân vật vào toạ độ %.

### Task 4: Route + registry

**Files:**
- Create: `src/app/[locale]/home-2/lab/v6/page.tsx`
- Modify: `src/components/home2/lab/kit.tsx` (mảng `VARIANTS`, sau entry V5)
- Modify: `src/app/[locale]/home-2/lab/page.tsx` (mảng `VARIANTS`, sau entry V5; h1 "Năm" → "Sáu")

**Interfaces:**
- Consumes: `V6Merged` (Task 3).
- Produces: route `/home-2/lab/v6`; switcher + lab index link tới route.

- [ ] **Step 1: Write route**

```tsx
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { V6Merged } from "@/components/home2/lab/v6-merged";
import type { Locale } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Wireframe V6 · Hành trình về chung một nhà",
  robots: { index: false, follow: false },
};

export default async function LabV6({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <V6Merged />;
}
```

- [ ] **Step 2: kit.tsx — thêm entry sau `{ slug: "lab/v5", ... }`:**

```tsx
  { slug: "lab/v6", code: "V6", name: "Hành trình về chung một nhà" },
```

- [ ] **Step 3: lab index — thêm object sau entry V5:**

```tsx
  {
    code: "V6",
    href: "/home-2/lab/v6",
    name: "Hành trình về chung một nhà",
    motion:
      "Bản ghép: hai người đi từ hai mép (V5) làm xương, sợi tơ hồng vẽ dần xuyên suốt (V4), mỗi quãng đường hiện đúng một tính năng (V2), khép lại bằng phong bì mở nắp rồi mới hiện link chia sẻ (V1).",
    strength:
      "Có câu chuyện và một cái đích; thông tin sản phẩm rải đều trên quãng đường nên không đoạn cuộn nào trống; hồi kết có kịch tính của V1 nhưng không phải trả giá 5 màn hình như V1.",
    weakness:
      "Nhiều lớp chuyển động nhất trong các biến thể — cần kiểm kỹ trên mobile và với reduced-motion để không rối.",
    note: "Thu cửa sổ xuống dưới 768px để xem bản mobile: hai người đi chéo, payload info chuyển thành block xếp dọc.",
  },
```

- [ ] **Step 4: h1 `Năm hướng cho trang chủ` → `Sáu hướng cho trang chủ`; câu kết đoạn cuối thêm ` V6 ở trên chính là bản ghép đó.`**

### Task 5: Verify + bàn giao

- [ ] **Step 1: Playwright MCP trên dev server** — `/home-2/lab/v6`: cuộn 0/25/50/62/76/100% viewport rộng (1280×800) + hẹp (375×812), screenshot từng mốc, console không lỗi.
- [ ] **Step 2: Reduced-motion** — emulate `prefers-reduced-motion`, tải trang, cuộn: phong bì mở sẵn + thiệp ra + share hiện; milestone vẫn tuần tự.
- [ ] **Step 3: User chạy (TCC chặn subprocess):**

```bash
cd /Users/namdo/Documents/learning/clone && npm run lint && npm run typecheck
```

```bash
cd /Users/namdo/Documents/learning/clone && git add src/components/home2/lab/v6-thread.tsx src/components/home2/lab/v6-envelope.tsx src/components/home2/lab/v6-merged.tsx "src/app/[locale]/home-2/lab/v6/page.tsx" src/components/home2/lab/kit.tsx "src/app/[locale]/home-2/lab/page.tsx" docs/superpowers/specs/2026-08-22-home-revamp-design.md docs/superpowers/plans/2026-08-22-home-revamp-v6.md && git commit -m "feat(home2-lab): add V6 merged wireframe — journey, thread, payload, envelope" --no-verify
```
