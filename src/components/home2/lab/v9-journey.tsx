"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Compass,
  Images,
  MapPinned,
  MessageCircleHeart,
  Send,
  SlidersHorizontal,
  TicketCheck,
} from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { templatePreviewUrl } from "@/lib/template-preview-url";

import { Shell } from "../primitives";
import type { TemplateShotData } from "../types";

export type V9TemplateShot = TemplateShotData & {
  portrait: string;
};

type ActKey =
  | "departure"
  | "choose"
  | "personalize"
  | "memories"
  | "rsvp"
  | "share";

type CardKey = {
  x: number;
  y: number;
  scale: number;
  rotate: number;
};

const ACTS: Array<{
  key: ActKey;
  side: "left" | "right";
  Icon: typeof Compass;
}> = [
  { key: "departure", side: "left", Icon: Compass },
  { key: "choose", side: "right", Icon: TicketCheck },
  { key: "personalize", side: "left", Icon: SlidersHorizontal },
  { key: "memories", side: "right", Icon: Images },
  { key: "rsvp", side: "left", Icon: MessageCircleHeart },
  { key: "share", side: "right", Icon: Send },
];

const CARD_KEYS: CardKey[] = [
  { x: 23, y: 2, scale: 0.96, rotate: -3.5 },
  { x: -23, y: -1, scale: 0.84, rotate: 4 },
  { x: 23, y: 1, scale: 1.02, rotate: -2 },
  { x: -23, y: -2, scale: 0.8, rotate: 3.5 },
  { x: 23, y: 1, scale: 0.92, rotate: -4 },
  // Trạm cuối: to nhất, thẳng nhất — nhưng vẫn lệch khỏi trục giữa. Đặt x: 0 thì
  // tấm thiệp đè lên chữ đầu dòng của khối chữ bên phải.
  { x: -19, y: -1, scale: 1.08, rotate: 0 },
];

/* Số đoạn chuyển giữa các trạm: 6 trạm → 5 đoạn. */
const SEGMENTS = ACTS.length - 1;

/* Mỗi đoạn được chia làm ba phần: giữ yên ở trạm cũ → chuyển cảnh → giữ yên ở
   trạm mới. `HOLD` là tỉ lệ giữ yên ở MỖI đầu đoạn.
 *
 * Đừng nâng số này lên nữa. Nó ăn trực tiếp vào quãng cuộn dành cho chuyển động:
 * với đoạn 110svh, HOLD 0.15 để lại 77svh cho tấm thiệp bay, còn HOLD 0.3 chỉ
 * để lại 44svh — mà tấm thiệp phải đi hết 46vw trong quãng đó nên nhìn ra thành
 * "bay vèo". Việc chống-đứng-lưng-chừng đã có cơ chế snap lo, plateau ở đây chỉ
 * còn nhiệm vụ chừa một nhịp đứng yên đủ để đọc khối chữ ở mỗi trạm. */
const HOLD = 0.15;

/* Cửa sổ giao nhau của hai khối chữ. Khối cũ tắt xong ở 0.44, khối mới bắt đầu
   hiện từ 0.56 — cố tình chừa một nhịp trống để đọc ra là "cắt cảnh" thay vì
   hai khối chữ mờ đè lên nhau. */
const TEXT_OUT_END = 0.44;
const TEXT_IN_START = 0.56;

/* ── Cấu hình ScrollTrigger ──────────────────────────────────────────────────

   `SCRUB` là độ trễ bám theo cuộn, tính bằng giây: GSAP không nhảy thẳng tới vị
   trí cuộn mà đuổi theo trong 0.55s. Đây chính là thứ làm chuyển động "mượt" —
   nó cũng lọc luôn nhịp giật của trackpad và của cuộn theo bậc của chuột.

   `SNAP_*` là cú tự đi tới trạm khi cuộn đã dừng. GSAP lo phần khó: chờ cuộn
   dừng, co giãn thời lượng theo khoảng cách, chạy tween trong ticker của nó.
   Nhưng việc CHỌN trạm nào thì phải tự quyết định — xem `snapTo` bên dưới.

   Cụ thể là KHÔNG dùng `inertia: true`. Tuỳ chọn đó phóng điểm đến theo quán
   tính cú cuộn, nên một cú lăn mạnh nhảy vọt qua ba bốn trạm một lúc (đo được:
   lăn 620px từ trạm 0 bay thẳng tới trạm 5). Hành trình này phải đi từng trạm,
   không được nhảy cóc. */
const SCRUB = 0.55;
const SNAP_DURATION = { min: 0.32, max: 0.85 } as const;
const SNAP_DELAY = 0.07;
const SNAP_EASE = "power2.inOut";
const NAV_JUMP_EASE = "power2.inOut";

/* Ngưỡng quyết định khi cuộn dừng ở lưng chừng, lệch theo chiều cuộn: đang đi
   xuống thì quá 34% là đi tiếp, đang đi lên thì phải quá 66% mới giữ lại trạm
   sau. Đặt thấp hơn mốc giữa vì mỗi đoạn dài 110svh — nếu đòi đúng 50% thì mọi
   cú lăn vừa phải đều bị kéo về trạm cũ, thành cảm giác bị giữ chân. */
const SNAP_FORWARD = 0.34;
const SNAP_BACKWARD = 0.66;

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max);
const lerp = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;
/**
 * Đường cong cho chặng bay của tấm thiệp: ease-in-out BẬC HAI, không phải bậc ba.
 *
 * Đây là chỗ quyết định "tấm thiệp bay có vèo hay không", quan trọng hơn cả độ
 * dài đoạn cuộn. Bậc ba có tốc độ đỉnh ở giữa chặng bằng 3 lần tốc độ trung
 * bình, tức là nó dồn phần lớn 46vw vào một khúc cuộn rất ngắn rồi bò chậm ở hai
 * đầu. Bậc hai chỉ đỉnh gấp 2 lần, nên chuyển động phân bố đều hơn và mắt theo
 * được. Nhịp "đứng lại" ở mỗi trạm đã do plateau `HOLD` lo, đường cong không cần
 * gánh thêm việc đó.
 */
const easeTravel = (value: number) =>
  value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin);

/**
 * Bộ máy cuộn của journey — dựng trên GSAP ScrollTrigger.
 *
 * Trước đây phần này là một vòng lặp scroll tự viết: tự nghe `scroll`, tự dò
 * "đã dừng cuộn chưa", tự tween `window.scrollTo`. Nó chạy được nhưng có hai
 * khuyết điểm cố hữu mà user nhận ra ngay:
 *
 * 1. Chuyển động bám cứng vào vị trí cuộn, nên mọi nhịp giật của trackpad và mọi
 *    bậc nhảy của con lăn chuột hiện nguyên vẹn lên tấm thiệp.
 * 2. Cú tự đi tới trạm kế phải tự cân thời lượng và đường cong bằng tay, và việc
 *    vẽ lại đi vòng qua sự kiện `scroll` nên trễ so với vị trí cuộn.
 *
 * ScrollTrigger giải cả hai bằng phần đã được tinh chỉnh sẵn: `scrub` cho
 * chuyển động đuổi theo cuộn có quán tính, `snap` cho cú tự về trạm. Mọi việc
 * ghi giá trị diễn ra trong ticker của GSAP nên không còn đường vòng qua sự kiện.
 *
 * Phần GIỮ LẠI từ bản tự viết là phép quy đổi `track → hình`: plateau `HOLD`,
 * đường cong `easeTravel`, cửa sổ cắt chữ. Đó là thiết kế nội dung chứ không
 * phải hạ tầng, và đã đo đạc tinh chỉnh xong; GSAP chỉ cấp cho nó một dòng
 * `track` mượt hơn.
 *
 * Ghim màn hình vẫn dùng `position: sticky` của CSS, KHÔNG dùng `pin` của
 * ScrollTrigger: `pin` tự chèn phần tử bọc và tự tính lại chiều cao, sẽ phá bố
 * cục đã dựng và đã kiểm chứng.
 */
function useJourneyMotion({
  enabled,
  stageRef,
  sceneRef,
  cardRef,
  actLayersRef,
}: {
  enabled: boolean;
  stageRef: RefObject<HTMLElement | null>;
  sceneRef: RefObject<HTMLDivElement | null>;
  cardRef: RefObject<HTMLDivElement | null>;
  actLayersRef: RefObject<Array<HTMLDivElement | null>>;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<ScrollTrigger | null>(null);

  useGSAP(
    () => {
      const stage = stageRef.current;
      if (!enabled || !stage) return;

      let currentIndex = 0;

      /* Vẽ một khung hình từ `track` (0 → 5, vị trí trên lộ trình). Hàm này KHÔNG
         đọc `window.scrollY` — nó chỉ nhận con số GSAP đưa cho, nên trong lúc
         snap thì hình và vị trí cuộn luôn thuộc cùng một frame. */
      const render = (track: number) => {
        const clamped = clamp(track, 0, SEGMENTS);
        const fromIndex = Math.min(Math.floor(clamped), SEGMENTS - 1);
        const local = clamped - fromIndex;
        const t =
          local <= HOLD
            ? 0
            : local >= 1 - HOLD
              ? 1
              : easeTravel((local - HOLD) / (1 - HOLD * 2));

        sceneRef.current?.style.setProperty(
          "--v9-progress",
          String(clamped / SEGMENTS),
        );

        const from = CARD_KEYS[fromIndex];
        const to = CARD_KEYS[fromIndex + 1];
        const card = cardRef.current;
        if (card) {
          card.style.setProperty("--v9-card-x", `${lerp(from.x, to.x, t)}vw`);
          card.style.setProperty("--v9-card-y", `${lerp(from.y, to.y, t)}vh`);
          card.style.setProperty(
            "--v9-card-scale",
            String(lerp(from.scale, to.scale, t)),
          );
          card.style.setProperty(
            "--v9-card-rotate",
            `${lerp(from.rotate, to.rotate, t)}deg`,
          );
          card.style.setProperty(
            "--v9-card-flip",
            `${Math.sin(t * Math.PI) * 8}deg`,
          );
        }

        const leaving = 1 - smoothstep(0.04, TEXT_OUT_END, t);
        const arriving = smoothstep(TEXT_IN_START, 0.96, t);
        const layers = actLayersRef.current;
        if (layers) {
          for (let index = 0; index < layers.length; index += 1) {
            const layer = layers[index];
            if (!layer) continue;
            const opacity =
              index === fromIndex
                ? leaving
                : index === fromIndex + 1
                  ? arriving
                  : 0;
            layer.style.setProperty("--v9-act-opacity", String(opacity));
            layer.style.setProperty("--v9-act-shift", `${(1 - opacity) * 24}px`);
          }
        }

        const nextIndex = t < 0.5 ? fromIndex : fromIndex + 1;
        if (nextIndex !== currentIndex) {
          currentIndex = nextIndex;
          setActiveIndex(nextIndex);
        }
      };

      /* Timeline chỉ chạy một con số từ 0 tới SEGMENTS theo đường thẳng.
         ScrollTrigger cần một animation để `scrub` bám vào, và cách này giữ
         nguyên quyền kiểm soát phép quy đổi ở `render`. */
      const cursor = { track: 0 };
      const timeline = gsap.timeline({ paused: true });
      timeline.to(cursor, {
        track: SEGMENTS,
        duration: 1,
        ease: "none",
        onUpdate: () => render(cursor.track),
      });

      triggerRef.current = ScrollTrigger.create({
        animation: timeline,
        trigger: stage,
        // Khớp đúng hình học của `position: sticky`: tiến độ 0 khi đỉnh cảnh dán
        // vào đỉnh khung nhìn, tiến độ 1 khi đáy cảnh chạm đáy khung nhìn.
        start: "top top",
        end: "bottom bottom",
        scrub: SCRUB,
        snap: {
          /* Tự chọn trạm thay vì để GSAP làm tròn về mốc gần nhất. Hai lý do:
             cần ngưỡng lệch theo chiều cuộn, và cần chắc chắn chỉ đi ĐÚNG MỘT
             trạm mỗi lần chứ không nhảy cóc. */
          snapTo: (value, self) => {
            const raw = clamp(value, 0, 1) * SEGMENTS;
            const base = Math.floor(raw);
            const fraction = raw - base;
            const forward = (self?.direction ?? 1) >= 0;
            const threshold = forward ? SNAP_FORWARD : SNAP_BACKWARD;
            const index = clamp(
              fraction >= threshold ? base + 1 : base,
              0,
              SEGMENTS,
            );
            return index / SEGMENTS;
          },
          duration: SNAP_DURATION,
          delay: SNAP_DELAY,
          ease: SNAP_EASE,
          inertia: false,
          directional: false,
        },
      });

      render(0);

      return () => {
        triggerRef.current = null;
      };
    },
    { dependencies: [enabled, stageRef, sceneRef, cardRef, actLayersRef] },
  );

  /* Bấm một trạm trên lộ trình: cuộn tới đúng vị trí trạm đó. Dùng ScrollToPlugin
     để cú cuộn này cũng nằm trong ticker của GSAP, và để ScrollTrigger không coi
     nó là cuộn tay rồi snap chồng lên. */
  const goToStep = useCallback((index: number) => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const target = clamp(index, 0, SEGMENTS) / SEGMENTS;
    gsap.to(window, {
      scrollTo: {
        y: trigger.start + target * (trigger.end - trigger.start),
        autoKill: true,
      },
      // Ngắn hơn quãng cảm nhận thật, vì `scrub` còn thêm một đoạn đuôi đuổi
      // theo sau khi cuộn đã tới đích.
      duration: 0.4 + Math.abs(target - trigger.progress) * 0.55,
      ease: NAV_JUMP_EASE,
      overwrite: true,
    });
  }, []);

  return { activeIndex, goToStep };
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}

export function V9Hero({
  shot,
  createHref,
}: {
  shot: V9TemplateShot;
  createHref: string;
}) {
  const t = useTranslations("homeLabV9");
  const stats = [t("hero.stat1"), t("hero.stat2"), t("hero.stat3")];

  return (
    <section className="v9-hero hp-grain">
      <div className="v9-map-grid" aria-hidden />
      <div className="v9-hero-route" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <Shell className="v9-hero-grid relative z-10 grid items-center gap-12 py-16 lg:grid-cols-[1.04fr_0.96fr] lg:py-20">
        <div className="v9-hero-copy">
          <p className="hp-label flex items-center gap-3 text-[color:var(--v9-coral)]">
            <Compass className="size-4" strokeWidth={1.5} />
            {t("hero.eyebrow")}
          </p>
          <h1 className="hp-display hp-h1 mt-7 max-w-[45rem]">
            {t("hero.titleLead")} {" "}
            <span className="hp-display-italic text-[color:var(--v9-coral)]">
              {t("hero.titleAccent")}
            </span>
          </h1>
          <p className="hp-body mt-8 max-w-[38rem] text-[color:var(--v9-cream-soft)]">
            {t("hero.lede")}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href={createHref} className="hp-btn v9-btn-light">
              {t("hero.ctaPrimary")}
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </a>
            <NextLink href="/mau-thiep" className="v9-hero-link">
              {t("hero.ctaSecondary")}
            </NextLink>
          </div>
          <ul className="mt-11 grid max-w-[42rem] gap-px border-y border-white/15 sm:grid-cols-3">
            {stats.map((stat, index) => (
              <li key={stat} className="v9-hero-stat py-4 sm:px-4 sm:first:pl-0">
                <span className="hp-num text-[color:var(--v9-gold)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="hp-body-sm ml-3 text-[color:var(--v9-cream-soft)]">
                  {stat}
                </span>
              </li>
            ))}
          </ul>
          <p className="v9-scroll-hint hp-label mt-9 flex items-center gap-3 text-[color:var(--v9-cream-soft)]">
            <ArrowDown className="size-4" strokeWidth={1.5} />
            {t("hero.scrollHint")}
          </p>
        </div>

        <div className="v9-hero-visual" aria-label={shot.name}>
          <div className="v9-passport" aria-hidden>
            <div className="v9-passport-emblem"><Compass /></div>
            <p>{t("hero.passportLabel")}</p>
            <strong>{t("hero.passportCode")}</strong>
          </div>
          <div className="v9-boarding-pass" aria-hidden>
            <span>{t("hero.boardingLabel")}</span>
            <strong>{t("hero.routeFrom")}</strong>
            <i />
            <strong>{t("hero.routeTo")}</strong>
          </div>
          <div className="v9-hero-invitation">
            <div className="v9-hero-invitation-image">
              <Image
                src={templatePreviewUrl(shot.portrait)}
                alt={shot.name}
                fill
                priority
                sizes="(max-width: 1023px) 68vw, 23rem"
                className="object-cover object-top"
              />
            </div>
            <div className="v9-hero-invitation-foot">
              <span>{t("card.invite")}</span>
              <strong>{t("card.couple")}</strong>
              <span>{t("card.date")}</span>
            </div>
          </div>
          <div className="v9-round-stamp" aria-hidden>
            <span>{t("hero.stampTop")}</span>
            <strong>V9</strong>
            <span>{t("hero.stampBottom")}</span>
          </div>
        </div>
      </Shell>
    </section>
  );
}

export function V9Journey({
  shots,
  createHref,
}: {
  shots: V9TemplateShot[];
  createHref: string;
}) {
  const t = useTranslations("homeLabV9");
  const stageRef = useRef<HTMLElement | null>(null);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const actLayersRef = useRef<Array<HTMLDivElement | null>>([]);
  const reduced = useReducedMotion();
  const { activeIndex, goToStep } = useJourneyMotion({
    enabled: !reduced,
    stageRef,
    sceneRef,
    cardRef,
    actLayersRef,
  });
  const primaryShot = shots[0];

  if (!primaryShot) return null;

  if (reduced) {
    return <StaticJourney shot={primaryShot} createHref={createHref} />;
  }

  return (
    <section
      ref={stageRef}
      id="cach-hoat-dong"
      className="v9-journey"
      aria-label={t("journey.ariaLabel")}
    >
      <div ref={sceneRef} className="v9-scene">
        <div className="v9-scene-map" aria-hidden />
        <RouteProgress activeIndex={activeIndex} onSelect={goToStep} />

        {ACTS.map((act, actIndex) => {
          const active = actIndex === activeIndex;
          const Icon = act.Icon;

          return (
            <div
              key={act.key}
              ref={(node) => {
                actLayersRef.current[actIndex] = node;
              }}
              className={`v9-act-layer v9-act--${act.side}`}
              data-active={active ? "true" : "false"}
              aria-hidden={!active}
            >
              <Shell className="v9-act-shell">
                <article className="v9-act-card">
                  <p className="hp-label flex items-center gap-3 text-[color:var(--v9-coral)]">
                    <Icon className="size-4" strokeWidth={1.4} />
                    {t(`journey.acts.${act.key}.code`)}
                  </p>
                  <h2 className="hp-display v9-act-title mt-5">
                    {t(`journey.acts.${act.key}.title`)}
                  </h2>
                  <p className="hp-body mt-5 max-w-[31rem]">
                    {t(`journey.acts.${act.key}.copy`)}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {["point1", "point2"].map((point) => (
                      <li key={point} className="hp-body-sm flex items-start gap-3">
                        <Check
                          className="mt-1 size-4 shrink-0 text-[color:var(--v9-coral)]"
                          strokeWidth={1.6}
                        />
                        {t(`journey.acts.${act.key}.${point}`)}
                      </li>
                    ))}
                  </ul>
                  {actIndex === 0 ? (
                    <div className="mt-8 flex flex-wrap items-center gap-5">
                      <a
                        href={createHref}
                        className="hp-btn hp-btn-solid"
                        tabIndex={active ? undefined : -1}
                      >
                        {t("journey.ctaStart")}
                        <ArrowRight className="size-4" strokeWidth={1.5} />
                      </a>
                      <NextLink
                        href="/mau-thiep"
                        className="hp-link"
                        tabIndex={active ? undefined : -1}
                      >
                        {t("journey.ctaTemplates")}
                      </NextLink>
                    </div>
                  ) : null}
                  {actIndex === ACTS.length - 1 ? (
                    <a
                      href={createHref}
                      className="hp-btn hp-btn-solid mt-8"
                      tabIndex={active ? undefined : -1}
                    >
                      {t("journey.ctaFinal")}
                      <ArrowRight className="size-4" strokeWidth={1.5} />
                    </a>
                  ) : null}
                </article>
              </Shell>
            </div>
          );
        })}

        <TravelCard
          cardRef={cardRef}
          shot={primaryShot}
          alternatives={shots.slice(1, 4)}
          activeIndex={activeIndex}
        />

        <p className="v9-progress-readout" aria-live="polite">
          <span className="hp-num">{String(activeIndex + 1).padStart(2, "0")}</span>
          <span>{t("journey.progress", { current: activeIndex + 1, total: ACTS.length })}</span>
        </p>
      </div>
    </section>
  );
}

function RouteProgress({
  activeIndex,
  onSelect,
}: {
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const t = useTranslations("homeLabV9");

  return (
    <nav className="v9-route-progress" aria-label={t("journey.routeLabel")}>
      <div className="v9-route-line" aria-hidden>
        <span />
      </div>
      <ol>
        {ACTS.map((act, index) => (
          <li key={act.key}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              className={index <= activeIndex ? "is-passed" : undefined}
              aria-current={index === activeIndex ? "step" : undefined}
              aria-label={t(`journey.acts.${act.key}.code`)}
            >
              <span className="v9-route-dot" aria-hidden />
              <span className="v9-route-name" aria-hidden>
                {t(`journey.acts.${act.key}.short`)}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function TravelCard({
  cardRef,
  shot,
  alternatives,
  activeIndex,
}: {
  cardRef: RefObject<HTMLDivElement | null>;
  shot: V9TemplateShot;
  alternatives: V9TemplateShot[];
  activeIndex: number;
}) {
  const t = useTranslations("homeLabV9");

  return (
    <div
      ref={cardRef}
      className="v9-travel-card"
      data-act={activeIndex}
      /* Bốn cột mốc "tấm thiệp có thêm gì". Để React tự bật/tắt bằng thuộc tính
         thay vì liệt kê [data-act="2"], [data-act="3"]… trong CSS. */
      data-has-template={activeIndex >= 1 ? "" : undefined}
      data-has-names={activeIndex >= 2 ? "" : undefined}
      data-has-album={activeIndex >= 3 ? "" : undefined}
      data-has-rsvp={activeIndex >= 4 ? "" : undefined}
      aria-label={shot.name}
    >
      <div className="v9-card-stack" aria-hidden>
        {alternatives.slice(0, 2).map((template, index) => (
          <div key={template.slug} className={`v9-fan-card v9-fan-card-${index + 1}`}>
            <Image
              src={templatePreviewUrl(template.portrait)}
              alt=""
              fill
              sizes="13rem"
              className="object-cover object-top"
            />
          </div>
        ))}
      </div>

      <div className="v9-edit-artifacts v9-card-artifacts" aria-hidden>
        <span>{t("journey.artifacts.editName")}</span>
        <span>{t("journey.artifacts.editDate")}</span>
        <span>{t("journey.artifacts.editVenue")}</span>
      </div>
      <div className="v9-memory-artifacts v9-card-artifacts" aria-hidden>
        <span><Images />{t("journey.artifacts.album")}</span>
        <span><MapPinned />{t("journey.artifacts.map")}</span>
      </div>
      <div className="v9-share-artifact v9-card-artifacts" aria-hidden>
        <span>{t("journey.artifacts.zalo")}</span>
        <span>{t("journey.artifacts.messenger")}</span>
        <span>{t("journey.artifacts.email")}</span>
      </div>

      <div className="v9-card-main">
        <div className="v9-card-topline">
          <span>{t("card.passport")}</span>
          <span>{t("card.flight")}</span>
        </div>
        <div className="v9-card-media">
          {/* Trạm 00: chưa chọn mẫu nên khung ảnh còn trống. Ảnh thật chỉ hiện
              từ trạm 01. */}
          <div className="v9-card-photo">
            <Image
              src={templatePreviewUrl(shot.portrait)}
              alt={shot.name}
              fill
              sizes="(max-width: 899px) 12rem, 17rem"
              className="object-cover object-top"
            />
          </div>
          <div className="v9-card-empty" aria-hidden>
            <span>{t("card.emptyTemplate")}</span>
          </div>

          {/* Trạm 03: album kỷ niệm được đưa vào thiệp. Ba ô cùng một bộ ảnh
              cưới, cắt ở ba vị trí khác nhau — vị trí cắt đặt trong v9.css để
              không sinh tên class động (Tailwind không quét được class động). */}
          <div className="v9-card-album" aria-hidden>
            {[1, 2, 3].map((frame) => (
              <span key={frame}>
                <Image
                  src={templatePreviewUrl(shot.portrait)}
                  alt=""
                  fill
                  sizes="4rem"
                  className="object-cover"
                />
              </span>
            ))}
          </div>

          {/* Trạm 04: bảng phản hồi nằm TRONG thiệp, không phải thẻ nổi bên
              ngoài — để tấm thiệp là thứ đang thay đổi, chứ không phải khung
              giao diện quanh nó. */}
          <div className="v9-card-rsvp" aria-hidden>
            <small>{t("journey.artifacts.rsvpLabel")}</small>
            <strong>{t("journey.artifacts.rsvpValue")}</strong>
            <span>{t("journey.artifacts.rsvpNote")}</span>
          </div>

          <span className="v9-card-live">{t("card.status")}</span>
        </div>
        <div className="v9-card-caption">
          <span>{t("card.invite")}</span>
          {/* Trạm 02: tên và ngày được điền vào chỗ trống. Hai dòng xếp cùng một
              ô lưới nên chiều cao thiệp không nhảy khi đổi. */}
          <strong className="v9-card-swap">
            <b>{t("card.couple")}</b>
            <i>{t("card.emptyNames")}</i>
          </strong>
          <span className="v9-card-swap v9-card-swap-sm">
            <b>{t("card.date")}</b>
            <i>{t("card.emptyDate")}</i>
          </span>
        </div>
        <div className="v9-card-perforation" aria-hidden />
        <div className="v9-card-ticket">
          <span>{t("card.route")}</span>
          <i />
          <strong>{t("card.destination")}</strong>
        </div>

        {/* Con dấu nhập cảnh: mỗi trạm đã đi qua để lại một dấu trên thiệp, nên
            chặng đường tích luỹ thành thứ nhìn thấy được chứ không chỉ là một
            thanh tiến độ. */}
        <div className="v9-card-stamps" aria-hidden>
          {ACTS.slice(1).map((act, index) => (
            <span
              key={act.key}
              className={`v9-card-stamp v9-card-stamp-${index + 1}${
                activeIndex >= index + 1 ? " is-inked" : ""
              }`}
            >
              <b>{String(index + 1).padStart(2, "0")}</b>
              <i>{t("card.stampMark")}</i>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StaticJourney({
  shot,
  createHref,
}: {
  shot: V9TemplateShot;
  createHref: string;
}) {
  const t = useTranslations("homeLabV9");

  return (
    <section id="cach-hoat-dong" className="v9-static-journey hp-paper hp-grain py-[var(--hp-chapter-y)]">
      <Shell>
        <header className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="hp-label text-[color:var(--v9-coral)]">{t("journey.eyebrow")}</p>
            <h2 className="hp-display hp-h2 mt-6">{t("journey.title")}</h2>
          </div>
          <p className="hp-body lg:col-span-4 lg:col-start-9 lg:self-end">{t("journey.lede")}</p>
        </header>
        <div className="mt-14 grid gap-12 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="v9-static-card mx-auto w-full max-w-[20rem] self-start">
            <Image
              src={templatePreviewUrl(shot.portrait)}
              alt={shot.name}
              width={768}
              height={1024}
              sizes="20rem"
              className="h-auto w-full"
            />
          </div>
          <ol className="border-b border-[color:var(--hp-rule)]">
            {ACTS.map((act, index) => {
              const Icon = act.Icon;
              return (
                <li key={act.key} className="border-t border-[color:var(--hp-rule)] py-7">
                  <div className="flex items-center gap-3">
                    <Icon className="size-4 text-[color:var(--v9-coral)]" strokeWidth={1.5} />
                    <span className="hp-label">{t(`journey.acts.${act.key}.code`)}</span>
                  </div>
                  <h3 className="hp-display hp-h3 mt-4">{t(`journey.acts.${act.key}.title`)}</h3>
                  <p className="hp-body mt-3">{t(`journey.acts.${act.key}.copy`)}</p>
                  <span className="hp-num mt-3 block text-sm text-[color:var(--v9-coral)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        <a href={createHref} className="hp-btn hp-btn-solid mt-12">
          {t("journey.ctaFinal")}
          <ArrowRight className="size-4" strokeWidth={1.5} />
        </a>
      </Shell>
    </section>
  );
}
