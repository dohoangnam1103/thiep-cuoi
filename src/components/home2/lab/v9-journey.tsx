"use client";

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
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

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
  { x: 0, y: -1, scale: 1.08, rotate: 0 },
];

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max);
const lerp = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;
const easeInOut = (value: number) =>
  value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;

function useStageProgress(ref: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      setProgress(travel <= 0 ? 0 : clamp(-rect.top / travel));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);

  return progress;
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
  const progress = useStageProgress(stageRef);
  const reduced = useReducedMotion();
  const primaryShot = shots[0];

  if (!primaryShot) return null;

  const track = progress * (ACTS.length - 1);
  const fromIndex = Math.min(Math.floor(track), ACTS.length - 2);
  const local = easeInOut(clamp(track - fromIndex));
  const from = CARD_KEYS[fromIndex];
  const to = CARD_KEYS[fromIndex + 1];
  const activeIndex = Math.min(Math.round(track), ACTS.length - 1);
  const flip = Math.sin(local * Math.PI) * 8;

  const cardStyle = {
    "--v9-card-x": `${lerp(from.x, to.x, local)}vw`,
    "--v9-card-y": `${lerp(from.y, to.y, local)}vh`,
    "--v9-card-scale": lerp(from.scale, to.scale, local),
    "--v9-card-rotate": `${lerp(from.rotate, to.rotate, local)}deg`,
    "--v9-card-flip": `${flip}deg`,
  } as CSSProperties;

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
      <div
        className="v9-scene"
        style={{ "--v9-progress": progress } as CSSProperties}
      >
        <div className="v9-scene-map" aria-hidden />
        <RouteProgress activeIndex={activeIndex} />

        {ACTS.map((act, actIndex) => {
          const distance = Math.abs(track - actIndex);
          const focus = clamp(1 - distance * 1.35);
          const active = actIndex === activeIndex;
          const Icon = act.Icon;

          return (
            <div
              key={act.key}
              className={`v9-act-layer v9-act--${act.side}`}
              aria-hidden={!active}
            >
              <Shell className="v9-act-shell">
                <article
                  className="v9-act-card"
                  style={{
                    opacity: focus,
                    transform: `translateY(${(1 - focus) * 24}px)`,
                    pointerEvents: active ? "auto" : "none",
                  }}
                >
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
          shot={primaryShot}
          alternatives={shots.slice(1, 4)}
          activeIndex={activeIndex}
          style={cardStyle}
        />

        <div className="v9-progress-readout" aria-live="polite">
          <span className="hp-num">{String(activeIndex + 1).padStart(2, "0")}</span>
          <span>{t("journey.progress", { current: activeIndex + 1, total: ACTS.length })}</span>
        </div>
      </div>
    </section>
  );
}

function RouteProgress({ activeIndex }: { activeIndex: number }) {
  const t = useTranslations("homeLabV9");

  return (
    <nav className="v9-route-progress" aria-label={t("journey.routeLabel")}>
      <div className="v9-route-line" aria-hidden>
        <span />
      </div>
      <ol>
        {ACTS.map((act, index) => (
          <li key={act.key} className={index <= activeIndex ? "is-passed" : ""}>
            <span className="v9-route-dot" aria-hidden />
            <span className="v9-route-name">{t(`journey.acts.${act.key}.short`)}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function TravelCard({
  shot,
  alternatives,
  activeIndex,
  style,
}: {
  shot: V9TemplateShot;
  alternatives: V9TemplateShot[];
  activeIndex: number;
  style: CSSProperties;
}) {
  const t = useTranslations("homeLabV9");

  return (
    <div
      className={`v9-travel-card v9-at-${activeIndex}`}
      style={style}
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
      <div className="v9-rsvp-artifact v9-card-artifacts" aria-hidden>
        <small>{t("journey.artifacts.rsvpLabel")}</small>
        <strong>{t("journey.artifacts.rsvpValue")}</strong>
        <span>{t("journey.artifacts.rsvpNote")}</span>
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
          <Image
            src={templatePreviewUrl(shot.portrait)}
            alt={shot.name}
            fill
            sizes="(max-width: 899px) 12rem, 17rem"
            className="object-cover object-top"
          />
          <span className="v9-card-live">{t("card.status")}</span>
        </div>
        <div className="v9-card-caption">
          <span>{t("card.invite")}</span>
          <strong>{t("card.couple")}</strong>
          <span>{t("card.date")}</span>
        </div>
        <div className="v9-card-perforation" aria-hidden />
        <div className="v9-card-ticket">
          <span>{t("card.route")}</span>
          <i />
          <strong>{t("card.destination")}</strong>
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
