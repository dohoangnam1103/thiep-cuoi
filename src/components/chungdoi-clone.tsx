"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Mail,
  Play,
  Star,
  Zap,
  type LucideIcon,
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { SiteHeader, SiteFooter } from "@/components/chungdoi-chrome";
import { WeddingFaqSection } from "@/components/chungdoi-faq";
import { TemplatePreviewModal } from "@/components/template-preview-modal";
import { templates, type ChungDoiTemplate } from "@/data/chungdoi";
import { Link } from "@/i18n/navigation";
import { loginHref, TEMPLATE_LIST_PATH } from "@/lib/auth-redirects";

const AuroraBackground = dynamic(() => import("@/components/aurora-background"), { ssr: false });

const featuredTemplates = templates.slice(0, 20);

const featuredListingImageHeights = {
  song_hy_red: 7885,
  song_hy_green: 7853,
  double_dragon_red: 7838,
  double_phoenix_red: 7742,
  elegant_leaf_green: 8106,
  dragon_phoenix_red_480: 8904,
  dragon_phoenix_v3_red: 7056,
  dragon_phoenix_v2_red: 7450,
  double_dragon_green: 8354,
  boho_floral_green: 8355,
  boho_floral_pink: 7576,
  jasmine_white: 8254,
  silk_flora_brown: 8310,
  chateau_blue: 9381,
  brocade_flower_red: 8118,
  crystal_floral_blue: 9168,
  chateau_green: 9536,
  baroque_gold: 7666,
  qasr_green: 8746,
  qasr_gold: 8350,
} as const;

function featuredListingImageHeight(src: string) {
  const filename = src.slice(src.lastIndexOf("/") + 1, -".webp".length);
  return featuredListingImageHeights[
    filename as keyof typeof featuredListingImageHeights
  ] ?? 768;
}

function useScrollProgress() {
  useEffect(() => {
    const bar = document.getElementById("scroll-progress");
    if (!bar) return;
    let raf = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      bar.style.setProperty("--scroll-progress", `${ratio}`);
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

function useAuroraEnabled() {
  const subscribe = (onChange: () => void) => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const width = window.matchMedia("(min-width: 1024px)");
    motion.addEventListener("change", onChange);
    width.addEventListener("change", onChange);
    return () => {
      motion.removeEventListener("change", onChange);
      width.removeEventListener("change", onChange);
    };
  };
  const getSnapshot = () =>
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    window.matchMedia("(min-width: 1024px)").matches;
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

function useRevealOnScroll() {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal, .reveal-left, .reveal-right, .reveal-scale"),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
}

const heroPreviewTemplates = featuredTemplates.slice(0, 6);

function StackFan() {
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<ChungDoiTemplate | null>(null);
  const pausedRef = useRef(false);

  const count = heroPreviewTemplates.length;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      setActive((prev) => (prev + 1) % count);
    }, 2800);
    return () => window.clearInterval(id);
  }, [count, active]);

  // slot: vị trí trong quạt tính từ thẻ active (0 = giữa nổi lên, 1..n xòe sang phải theo vòng).
  const slotOf = (index: number) => (index - active + count) % count;

  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      <div
        className="stack-fan-stage"
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
      >
        {heroPreviewTemplates.map((template, index) => {
          const slot = slotOf(index);
          const isCenter = slot === 0;
          // Quạt: thẻ sau active xòe sang 2 bên. Ánh xạ slot 1..count-1 về dải cân đối quanh 0.
          const half = (count - 1) / 2;
          const fan = slot === 0 ? 0 : slot - 1 - (half - 0.5);
          const angle = isCenter ? 0 : fan * 9;
          const tx = isCenter ? 0 : fan * 30;
          const ty = isCenter ? -14 : Math.abs(fan) * 10;
          const style: CSSProperties = {
            transform: `translateX(${tx}px) translateY(${ty}px) rotate(${angle}deg) scale(${isCenter ? 1 : 0.9})`,
            zIndex: isCenter ? count + 1 : count - slot,
            opacity: isCenter ? 1 : 0.72,
          };
          return (
            <button
              key={template.slug}
              type="button"
              className="stack-fan-card group"
              style={style}
              onClick={() => {
                if (isCenter) {
                  setSelected(template);
                  return;
                }
                setActive(index);
                pausedRef.current = true;
                window.setTimeout(() => (pausedRef.current = false), 2000);
              }}
            >
              <Image
                src={template.portrait}
                alt={template.name}
                fill
                sizes="230px"
                draggable={false}
                loading={isCenter ? "eager" : "lazy"}
                fetchPriority={isCenter ? "high" : "auto"}
                decoding="async"
                className="h-full w-full rounded-2xl object-cover object-top shadow-[0_18px_44px_rgb(0_0_0/0.22)]"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="font-heading text-sm font-black text-background">{template.name}</p>
                <p className="text-[10px] text-background/80">{template.category} · {template.color}</p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="coverflow-dots" role="tablist" aria-label="Chọn mẫu thiệp">
        {heroPreviewTemplates.map((template, index) => (
          <button
            key={template.slug}
            type="button"
            className={`coverflow-dot${index === active ? " is-active" : ""}`}
            aria-label={template.name}
            aria-selected={index === active}
            role="tab"
            onClick={() => {
              setActive(index);
              pausedRef.current = true;
              window.setTimeout(() => (pausedRef.current = false), 2000);
            }}
          />
        ))}
      </div>

      {selected ? <TemplatePreviewModal template={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

function HeroSection({ createHref }: { createHref: string }) {
  const t = useTranslations("home");
  const auroraEnabled = useAuroraEnabled();
  return (
    <section id="top" className="relative overflow-hidden bg-background">
      {auroraEnabled ? (
        <AuroraBackground className="pointer-events-none absolute inset-0 opacity-20" amplitude={1.1} blend={0.55} />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(214,69,80,0.05),transparent_34%),radial-gradient(circle_at_88%_0%,rgba(224,168,112,0.05),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-muted/40 to-transparent" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-24 lg:pt-16">
        <div className="flex flex-col justify-center">
          <h1 className="hero-enter font-heading max-w-3xl text-4xl font-black leading-[1.15] tracking-tight text-foreground sm:text-6xl" style={{ "--hero-delay": "160ms" } as CSSProperties}>
            <span className="shiny-text">{t("hero.title")}</span>
          </h1>
          <p className="hero-enter mt-6 max-w-2xl text-lg leading-8 text-muted-foreground" style={{ "--hero-delay": "240ms" } as CSSProperties}>{t("hero.subtitle")}</p>
          <p className="hero-enter mt-2 max-w-2xl text-lg leading-8 text-muted-foreground" style={{ "--hero-delay": "280ms" } as CSSProperties}>{t("hero.subtitle2")}</p>
          <p className="hero-enter mt-5 max-w-2xl text-sm leading-6 text-muted-foreground" style={{ "--hero-delay": "320ms" } as CSSProperties}>{t("hero.trialNote")}</p>
          <div className="hero-enter mt-8 flex flex-col items-center gap-4 sm:items-start" style={{ "--hero-delay": "400ms" } as CSSProperties}>
            <a
              href={createHref}
              className="group inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3 text-base font-bold text-primary-foreground shadow-xl transition-all hover:-translate-y-1 hover:bg-primary/90 hover:shadow-[0_12px_28px_rgba(214,69,80,0.4)] sm:px-8 sm:py-4 sm:text-lg"
            >
              {t("createNow")} <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-bold text-foreground transition hover:-translate-y-1 hover:bg-muted"
            >
              {t("hero.watchGuide")} <Play className="size-4" />
            </a>
          </div>
        </div>

        <div className="hero-enter flex items-center justify-center" style={{ "--hero-delay": "300ms" } as CSSProperties}>
          <StackFan />
        </div>
      </div>
      <div className="relative mx-auto max-w-7xl px-4 pb-16 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl font-black text-foreground sm:text-5xl">
          {t("hero.showcaseTitle")} <span className="font-pattaya font-normal italic text-primary">{t("hero.showcaseAccent")}</span>
        </h2>
        <p className="mt-4 text-muted-foreground">{t("hero.showcaseSubtitle")}</p>
      </div>
    </section>
  );
}

const TWEEN_FACTOR = 2.3;
const EMPHASIS_TWEEN_FACTOR = 9;

function TemplateCarousel() {
  const t = useTranslations("home");
  const locale = useLocale();
  const autoplay = useRef(
    Autoplay({ delay: 4200, stopOnInteraction: false, stopOnMouseEnter: true }),
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center", skipSnaps: false },
    [autoplay.current],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [selected, setSelected] = useState<ChungDoiTemplate | null>(null);

  const applyTween = useCallback((api: NonNullable<typeof emblaApi>) => {
    const engine = api.internalEngine();
    const scrollProgress = api.scrollProgress();
    const slidesInView = api.slidesInView();

    api.scrollSnapList().forEach((snap, snapIndex) => {
      let diffToTarget = snap - scrollProgress;

      if (engine.options.loop) {
        engine.slideLooper.loopPoints.forEach((loopItem) => {
          const target = loopItem.target();
          if (snapIndex === loopItem.index && target !== 0) {
            const sign = Math.sign(target);
            if (sign === -1) diffToTarget = snap - (1 + scrollProgress);
            if (sign === 1) diffToTarget = snap + (1 - scrollProgress);
          }
        });
      }

      const tween = 1 - Math.abs(diffToTarget * TWEEN_FACTOR);
      const rawProminence = Math.min(
        Math.max(1 - Math.abs(diffToTarget * EMPHASIS_TWEEN_FACTOR), 0),
        1,
      );
      const prominence = rawProminence ** 1.35;
      const scale = Math.min(Math.max(tween, 0.4), 1);
      const lift = 16 - prominence * 30;
      const opacity = 0.42 + prominence * 0.58;
      const saturation = 0.35 + prominence * 0.75;
      const brightness = 0.88 + prominence * 0.12;
      const contrast = 0.82 + prominence * 0.24;
      const shadowOpacity = 0.03 + prominence * 0.24;
      const shadowY = 10 + prominence * 24;
      const shadowBlur = 22 + prominence * 56;
      const node = api.slideNodes()[snapIndex];
      const inner = node?.firstElementChild as HTMLElement | null;
      if (!node || !inner) return;
      const image = inner.querySelector("img");

      inner.style.transform = `translate3d(0, ${lift.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      inner.style.boxShadow = `0 ${shadowY.toFixed(0)}px ${shadowBlur.toFixed(0)}px rgb(95 49 47 / ${shadowOpacity.toFixed(3)}), 0 5px 18px rgb(95 49 47 / ${(shadowOpacity * 0.45).toFixed(3)})`;
      node.style.opacity = opacity.toFixed(3);
      node.style.transition = "opacity 240ms ease";
      node.style.zIndex = prominence > 0.85 ? "2" : slidesInView.includes(snapIndex) ? "1" : "0";

      if (image) {
        image.style.filter = `saturate(${saturation.toFixed(3)}) brightness(${brightness.toFixed(3)}) contrast(${contrast.toFixed(3)})`;
      }
    });
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    applyTween(emblaApi);

    emblaApi.on("select", onSelect);
    emblaApi.on("scroll", () => applyTween(emblaApi));
    emblaApi.on("reInit", () => {
      setScrollSnaps(emblaApi.scrollSnapList());
      onSelect();
      applyTween(emblaApi);
    });
  }, [emblaApi, applyTween]);

  return (
    <>
    <section className="overflow-hidden bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="reveal">
          <h2 className="font-heading text-3xl font-black text-foreground sm:text-5xl">{t("carousel.title")}</h2>
          <p className="mt-4 text-muted-foreground">{t("carousel.subtitle")}</p>
        </div>
      </div>

      <div className="reveal relative mt-12 w-full">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-10 left-1/2 w-[min(42rem,80vw)] -translate-x-1/2 rounded-full bg-primary/[0.11] blur-3xl"
        />
        <div className="overflow-hidden py-4" ref={emblaRef}>
          <div className="relative flex touch-pan-y">
            {featuredTemplates.map((template, index) => {
              const isActive = index === selectedIndex;

              return (
                <div
                  key={template.slug}
                  className="min-w-0 shrink-0 grow-0 basis-[286px] px-2.5 [will-change:opacity]"
                  onMouseEnter={(event) => {
                    const image = event.currentTarget.querySelector("img");
                    event.currentTarget.style.opacity = "1";
                    if (image) image.style.filter = "saturate(1.1) brightness(1) contrast(1.06)";
                  }}
                  onMouseLeave={() => {
                    if (emblaApi) applyTween(emblaApi);
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelected(template)}
                    draggable={false}
                    aria-current={isActive ? "true" : undefined}
                    className={`group relative block h-[520px] w-full overflow-hidden rounded-2xl border bg-card text-left transition-[border-color] duration-300 [will-change:transform] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${
                      isActive ? "border-primary/85" : "border-border/40"
                    }`}
                  >
                    <Image
                      src={template.listing}
                      alt={template.name}
                      width={768}
                      height={featuredListingImageHeight(template.listing)}
                      sizes="266px"
                      draggable={false}
                      loading="lazy"
                      decoding="async"
                      data-carousel-preview
                      className="pointer-events-none block h-auto w-full max-w-none [transition-duration:240ms,1200ms] [transition-property:filter,translate] [transition-timing-function:ease,ease-out] group-hover:translate-y-[calc(520px_-_100%)] group-hover:[transition-duration:240ms,40000ms] group-hover:[transition-timing-function:ease,linear] motion-reduce:group-hover:translate-y-0 motion-reduce:transition-none"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent p-5">
                      {template.isNew ? <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">{t("carousel.new")}</span> : null}
                      <h3 className="mt-2 font-heading text-lg font-black text-background">{template.name}</h3>
                      <p className="text-sm text-background/80">
                        {template.category} - {template.color}
                      </p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          aria-label={t("carousel.prev")}
          onClick={() => emblaApi?.scrollPrev()}
          className="absolute left-2 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition-all hover:bg-background hover:shadow-xl sm:left-4"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          aria-label={t("carousel.next")}
          onClick={() => emblaApi?.scrollNext()}
          className="absolute right-2 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition-all hover:bg-background hover:shadow-xl sm:right-4"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="mt-8 flex justify-center gap-2">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={t("carousel.goTo", { number: index + 1 })}
            aria-current={index === selectedIndex}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`h-2 rounded-full transition-all ${
              index === selectedIndex ? "w-6 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>

      <div className="reveal mt-12 flex flex-col items-center gap-3 px-4">
        <a
          href={locale === "vi" ? "/mau-thiep" : `/${locale}/templates`}
          className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-xl transition-all hover:-translate-y-1 hover:bg-primary/90 hover:shadow-[0_12px_28px_rgba(214,69,80,0.4)]"
        >
          {t("carousel.viewAll")} <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
        </a>
        <p className="text-sm text-muted-foreground">{t("carousel.viewAllHint")}</p>
      </div>
    </section>
    {selected ? <TemplatePreviewModal template={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

function HowItWorks() {
  const t = useTranslations("home");
  const locale = useLocale();
  const steps: Array<[string, string, LucideIcon]> = [
    [t("howItWorks.step1Title"), t("howItWorks.step1Copy"), CalendarDays],
    [t("howItWorks.step2Title"), t("howItWorks.step2Copy"), ImageIcon],
    [t("howItWorks.step3Title"), t("howItWorks.step3Copy"), Mail],
  ];

  return (
    <section id="how-it-works" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal text-center">
          <h2 className="font-heading text-3xl font-black text-foreground sm:text-5xl">{t("howItWorks.title")}</h2>
          <p className="mt-4 text-muted-foreground">{t("howItWorks.subtitle")}</p>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl items-center gap-12 lg:grid-cols-2">
          <ol className="reveal relative flex w-full max-w-md flex-col lg:justify-self-end">
            {steps.map(([title, copy, Icon], index) => (
              <li key={title as string} className="group relative flex gap-5 pb-10 last:pb-0">
                {index < steps.length - 1 ? (
                  <span aria-hidden className="absolute left-6 top-14 h-[calc(100%-3.5rem)] w-px bg-border" />
                ) : null}
                <div className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary transition-transform group-hover:scale-110">
                  <Icon className="size-5" />
                </div>
                <div className="pt-1">
                  <p className="text-sm font-bold text-accent">{t("howItWorks.step", { number: index + 1 })}</p>
                  <h3 className="mt-2 font-heading text-2xl font-black text-foreground">{title}</h3>
                  <p className="mt-2 text-muted-foreground">{copy}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="reveal w-full max-w-xs overflow-hidden rounded-3xl border border-border bg-card shadow-[0_8px_30px_rgb(0_0_0/0.06)] max-lg:mx-auto lg:justify-self-start">
            <div className="flex aspect-[9/16] items-center justify-center bg-secondary text-muted-foreground">
              <Play className="size-12 opacity-40" />
            </div>
          </div>
        </div>
        <div className="reveal mt-14 flex flex-col items-center gap-3">
          <a
            href={locale === "vi" ? "/mau-thiep" : `/${locale}/templates`}
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-xl transition-all hover:-translate-y-1 hover:bg-primary/90 hover:shadow-[0_12px_28px_rgba(214,69,80,0.4)]"
          >
            {t("howItWorks.ctaStart")} <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </a>
          <Link
            href="/create-wedding-invitation-online"
            className="text-sm font-medium text-muted-foreground underline-offset-4 transition hover:text-primary hover:underline"
          >
            {t("howItWorks.ctaHint")}
          </Link>
        </div>
      </div>
    </section>
  );
}

function SupportSection() {
  const t = useTranslations("home");
  const cards: Array<[LucideIcon, string, string]> = [
    [Zap, t("support.replyTimeLabel"), t("support.replyTimeValue")],
    [CheckCircle2, t("support.helpEditsLabel"), t("support.helpEditsValue")],
  ];

  return (
    <section className="bg-secondary py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="reveal font-heading text-3xl font-black text-foreground sm:text-5xl">
          {t("support.title")} <span className="font-pattaya font-normal italic text-primary">{t("support.titleAccent")}</span>
        </h2>
        <p className="reveal mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          {t.rich("support.subtitle", {
            hl: (chunks) => <span className="font-semibold text-primary">{chunks}</span>,
          })}
        </p>
        <div className="reveal mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          {cards.map(([Icon, label, value]) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-3xl border border-border bg-card p-6 text-left transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_16px_40px_rgb(0_0_0/0.08)]"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Icon className="size-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-xl font-black text-foreground">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GuestsSection() {
  const t = useTranslations("home");

  return (
    <section id="guests" className="relative overflow-hidden bg-background py-20">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(214,64,69,0.14),transparent_55%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="reveal">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">{t("guests.eyebrow")}</p>
          <h2 className="mt-4 font-heading text-3xl font-black text-foreground sm:text-5xl">{t("guests.title")}</h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">{t("guests.subtitle")}</p>
          <ul className="mt-8 space-y-4 text-foreground">
            {[
              t("guests.point1"),
              t("guests.point2"),
              t("guests.point3"),
              t("guests.point4"),
              t("guests.point5"),
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <Check className="mt-1 size-5 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="reveal">
          <Image
            src="/chungdoi/images/rsvp-showcase.png"
            alt={t("guests.title")}
            width={1122}
            height={1402}
            sizes="(max-width: 1023px) 100vw, 704px"
            loading="lazy"
            decoding="async"
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}

function LanguageSection() {
  const t = useTranslations("home");

  return (
    <section className="bg-background py-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="reveal">
          <Image
            src="/chungdoi/images/language-showcase.png"
            alt={t("languages.title")}
            width={941}
            height={1089}
            sizes="(max-width: 1023px) 100vw, 576px"
            loading="lazy"
            decoding="async"
            className="h-auto w-full"
          />
        </div>
        <div className="reveal">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">{t("languages.eyebrow")}</p>
          <h2 className="mt-4 font-heading text-3xl font-black text-foreground sm:text-5xl">{t("languages.title")}</h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">{t("languages.subtitle")}</p>
          <ul className="mt-8 space-y-4 text-foreground">
            {[
              t("languages.point1"),
              t("languages.point2"),
              t("languages.point3"),
              t("languages.point4"),
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <Check className="mt-1 size-5 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

const testimonialKeys = ["t1", "t2", "t3", "t4", "t5", "t6"] as const;

function TestimonialsSection() {
  const t = useTranslations("home");

  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">{t("testimonials.eyebrow")}</p>
          <h2 className="mt-4 font-heading text-3xl font-black text-foreground sm:text-5xl">{t("testimonials.title")}</h2>
          <p className="mt-4 text-muted-foreground">{t("testimonials.subtitle")}</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonialKeys.map((key) => (
            <figure
              key={key}
              className="reveal-scale flex flex-col rounded-3xl border border-border bg-card p-6 shadow-[0_8px_30px_rgb(0_0_0/0.06)] transition hover:-translate-y-1 hover:border-primary/40"
            >
              <div className="flex gap-1 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-primary text-primary" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-6 text-foreground">“{t(`testimonials.${key}Quote`)}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-secondary font-black text-primary">
                  {t(`testimonials.${key}Author`).charAt(0)}
                </span>
                <span>
                  <span className="block text-sm font-black text-foreground">{t(`testimonials.${key}Author`)}</span>
                  <span className="block text-xs text-muted-foreground">{t(`testimonials.${key}Role`)}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ChungDoiClone() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const createHref = isAuthenticated ? TEMPLATE_LIST_PATH : loginHref(TEMPLATE_LIST_PATH);

  useRevealOnScroll();
  useScrollProgress();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div id="scroll-progress" className="scroll-progress" aria-hidden />
      <SiteHeader onSessionChange={setIsAuthenticated} />
      <HeroSection createHref={createHref} />
      <TemplateCarousel />
      <HowItWorks />
      <SupportSection />
      <TestimonialsSection />
      <GuestsSection />
      <LanguageSection />
      <WeddingFaqSection animated id="pricing" />
      <SiteFooter />
    </main>
  );
}
