"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ImageIcon,
  Languages,
  Mail,
  Play,
  Star,
  Zap,
  type LucideIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { SiteHeader, SiteFooter } from "@/components/chungdoi-chrome";
import { getVietnameseTemplateSlug, templates } from "@/data/chungdoi";

const AuroraBackground = dynamic(() => import("@/components/aurora-background"), { ssr: false });

const featuredTemplates = templates.slice(0, 20);

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
  const locale = useLocale();
  const [active, setActive] = useState(0);
  const pausedRef = useRef(false);

  const count = heroPreviewTemplates.length;

  const hrefFor = (slug: string) => {
    const routeSlug = locale === "vi" ? getVietnameseTemplateSlug(slug) : slug;
    return `/${locale === "vi" ? "mau-thiep" : `${locale}/templates`}/${routeSlug}/demo`;
  };

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
            <a
              key={template.slug}
              href={hrefFor(template.slug)}
              className="stack-fan-card group"
              style={style}
              onClick={(e) => {
                if (!isCenter) {
                  e.preventDefault();
                  setActive(index);
                  pausedRef.current = true;
                  window.setTimeout(() => (pausedRef.current = false), 2000);
                }
              }}
            >
              <img
                src={template.listing}
                alt={template.name}
                draggable={false}
                loading="lazy"
                decoding="async"
                className="h-full w-full rounded-2xl object-cover object-top shadow-[0_18px_44px_rgb(0_0_0/0.22)]"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="font-heading text-sm font-black text-background">{template.name}</p>
                <p className="text-[10px] text-background/80">{template.category} · {template.color}</p>
              </div>
            </a>
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
    </div>
  );
}

function HeroSection() {
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
          <div className="hero-enter mb-8 overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_8px_30px_rgb(0_0_0/0.06)]">
            <Image
              src="/chungdoi/images/en/banner_hero.webp"
              alt="Beautiful online wedding invitations"
              width={2987}
              height={1566}
              sizes="(max-width: 1024px) 100vw, 50vw"
              fetchPriority="high"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="hero-enter mb-4 text-2xl font-semibold text-foreground" style={{ "--hero-delay": "80ms" } as CSSProperties}>
            <span className="font-pattaya text-4xl text-primary">thiepmungonline</span>
            <span className="text-muted-foreground">{t("hero.domainSuffix")}</span>
          </p>
          <h1 className="hero-enter font-heading max-w-3xl text-4xl font-black leading-[1.15] tracking-tight text-foreground sm:text-6xl" style={{ "--hero-delay": "160ms" } as CSSProperties}>
            <span className="shiny-text">{t("hero.title")}</span>
          </h1>
          <p className="hero-enter mt-6 max-w-2xl text-lg leading-8 text-muted-foreground" style={{ "--hero-delay": "240ms" } as CSSProperties}>{t("hero.subtitle")}</p>
          <p className="hero-enter mt-4 text-sm font-semibold text-primary" style={{ "--hero-delay": "320ms" } as CSSProperties}>{t("hero.trialNote")}</p>
          <div className="hero-enter mt-8 flex flex-wrap gap-3" style={{ "--hero-delay": "400ms" } as CSSProperties}>
            <a
              href="#templates"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-xl transition-all hover:-translate-y-1 hover:bg-primary/90 hover:shadow-[0_12px_28px_rgba(214,69,80,0.4)]"
            >
              {t("createNow")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
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
    </section>
  );
}

function TemplateCarousel() {
  const t = useTranslations("home");
  const locale = useLocale();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const interactingRef = useRef(false);
  const resumeTimeoutRef = useRef<number | null>(null);
  const dragRef = useRef({ pointerId: -1, startX: 0, startScrollLeft: 0, moved: false });
  const [isDragging, setIsDragging] = useState(false);

  const hrefFor = (slug: string) => {
    const routeSlug = locale === "vi" ? getVietnameseTemplateSlug(slug) : slug;
    return `/${locale === "vi" ? "mau-thiep" : `${locale}/templates`}/${routeSlug}/demo`;
  };

  const pauseAutoScroll = () => {
    pausedRef.current = true;
    if (resumeTimeoutRef.current !== null) {
      window.clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  };

  const resumeAutoScrollSoon = () => {
    if (resumeTimeoutRef.current !== null) window.clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = window.setTimeout(() => {
      pausedRef.current = false;
      resumeTimeoutRef.current = null;
    }, 1800);
  };

  const normalizeScrollPosition = () => {
    const viewport = viewportRef.current;
    const firstSegment = trackRef.current?.firstElementChild;
    if (!viewport || !(firstSegment instanceof HTMLElement)) return;

    const segmentWidth = firstSegment.offsetWidth;
    if (segmentWidth === 0) return;
    if (viewport.scrollLeft < segmentWidth * 0.5) viewport.scrollLeft += segmentWidth;
    if (viewport.scrollLeft > segmentWidth * 1.5) viewport.scrollLeft -= segmentWidth;
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    const firstSegment = trackRef.current?.firstElementChild;
    if (!viewport || !(firstSegment instanceof HTMLElement)) return;

    viewport.scrollLeft = firstSegment.offsetWidth;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let previousTime = performance.now();

    const animate = (time: number) => {
      const elapsed = Math.min(time - previousTime, 50);
      previousTime = time;

      if (!interactingRef.current) normalizeScrollPosition();
      if (!pausedRef.current && !reducedMotion.matches) {
        viewport.scrollLeft += elapsed * 0.098;
        normalizeScrollPosition();
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frameId);
      if (resumeTimeoutRef.current !== null) window.clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  const finishMouseDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerId !== dragRef.current.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current.pointerId = -1;
    interactingRef.current = false;
    setIsDragging(false);
    normalizeScrollPosition();
    resumeAutoScrollSoon();
    window.setTimeout(() => {
      dragRef.current.moved = false;
    }, 0);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    pauseAutoScroll();
    viewportRef.current?.scrollBy({
      left: event.key === "ArrowLeft" ? -306 : 306,
      behavior: "smooth",
    });
    resumeAutoScrollSoon();
  };

  return (
    <section className="overflow-hidden bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="reveal">
          <h2 className="font-heading text-3xl font-black text-foreground sm:text-5xl">{t("carousel.title")}</h2>
          <p className="mt-4 text-muted-foreground">{t("carousel.subtitle")}</p>
          <p className="mt-2 text-sm font-medium text-primary/80">{t("carousel.dragHint")}</p>
        </div>
      </div>
      <div
        ref={viewportRef}
        role="region"
        aria-label={t("carousel.title")}
        tabIndex={0}
        data-testid="template-carousel"
        data-dragging={isDragging}
        className={`template-carousel-viewport reveal mt-12 overflow-x-auto ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        onClickCapture={(event) => {
          if (!dragRef.current.moved) return;
          event.preventDefault();
          event.stopPropagation();
          dragRef.current.moved = false;
        }}
        onFocus={pauseAutoScroll}
        onBlur={resumeAutoScrollSoon}
        onMouseEnter={pauseAutoScroll}
        onMouseLeave={() => {
          if (dragRef.current.pointerId === -1) resumeAutoScrollSoon();
        }}
        onTouchStart={() => {
          interactingRef.current = true;
          pauseAutoScroll();
        }}
        onTouchEnd={() => {
          interactingRef.current = false;
          normalizeScrollPosition();
          resumeAutoScrollSoon();
        }}
        onTouchCancel={() => {
          interactingRef.current = false;
          normalizeScrollPosition();
          resumeAutoScrollSoon();
        }}
        onWheel={() => {
          pauseAutoScroll();
          resumeAutoScrollSoon();
        }}
        onKeyDown={handleKeyDown}
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse" || event.button !== 0) return;
          event.preventDefault();
          pauseAutoScroll();
          interactingRef.current = true;
          dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startScrollLeft: event.currentTarget.scrollLeft,
            moved: false,
          };
          setIsDragging(true);
        }}
        onPointerMove={(event) => {
          if (event.pointerId !== dragRef.current.pointerId) return;
          const delta = event.clientX - dragRef.current.startX;
          if (Math.abs(delta) > 5) dragRef.current.moved = true;
          if (!dragRef.current.moved) return;
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          event.preventDefault();
          event.currentTarget.scrollLeft = dragRef.current.startScrollLeft - delta;
        }}
        onPointerUp={finishMouseDrag}
        onPointerCancel={finishMouseDrag}
      >
        <div ref={trackRef} className="flex w-max select-none">
          {[0, 1, 2].map((copyIndex) => (
            <div
              key={copyIndex}
              className="flex shrink-0 gap-5 pr-5"
              aria-hidden={copyIndex === 1 ? undefined : true}
            >
              {featuredTemplates.map((template) => (
                <a
                  key={`${template.slug}-${copyIndex}`}
                  href={hrefFor(template.slug)}
                  draggable={false}
                  tabIndex={copyIndex === 1 ? undefined : -1}
                  className="group relative block h-[520px] w-[286px] shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgb(0_0_0/0.06)]"
                >
                  <img
                    src={template.listing}
                    alt={template.name}
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                    className="pointer-events-none h-full w-full object-cover object-top transition-[object-position,transform] duration-[9000ms] ease-in-out group-hover:object-bottom group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent p-5">
                    {template.isNew ? <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">{t("carousel.new")}</span> : null}
                    <h3 className="mt-2 font-heading text-lg font-black text-background">{template.name}</h3>
                    <p className="text-sm text-background/80">
                      {template.category} - {template.color}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const t = useTranslations("home");
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
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {steps.map(([title, copy, Icon], index) => (
            <div key={title as string} className="reveal group rounded-3xl border border-border bg-card p-6 shadow-[0_8px_30px_rgb(0_0_0/0.06)] transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_16px_40px_rgb(0_0_0/0.1)]">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary transition-transform group-hover:scale-110">
                  <Icon className="size-5" />
                </div>
                <p className="text-sm font-bold text-accent">{t("howItWorks.step", { number: index + 1 })}</p>
              </div>
              <h3 className="mt-6 font-heading text-2xl font-black text-foreground">{title}</h3>
              <p className="mt-3 text-muted-foreground">{copy}</p>
            </div>
          ))}
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
        <div className="reveal grid gap-5 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-border bg-card p-5 shadow-[0_8px_30px_rgb(0_0_0/0.06)]">
            <p className="text-sm text-muted-foreground">{t("guests.personalLink")}</p>
            <h3 className="mt-3 font-heading text-2xl font-black text-foreground">{t("guests.invitePrompt")}</h3>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-emerald-950">{t("guests.attend")}</button>
              <button className="rounded-2xl bg-muted px-4 py-3 text-sm font-black text-foreground">{t("guests.declined")}</button>
            </div>
            {[t("guests.plusOnes"), t("guests.needShuttle"), t("guests.mealNotes"), t("guests.songRequest")].map((label) => (
              <div key={label} className="mt-3 rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
                {label}
              </div>
            ))}
          </div>
          <div className="rounded-[2rem] border border-border bg-primary p-5 text-primary-foreground shadow-[0_8px_30px_rgb(0_0_0/0.08)]">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-foreground/75">{t("guests.guestManager")}</p>
            <h3 className="mt-4 font-heading text-2xl font-black">{t("guests.rsvpGathered")}</h3>
            <div className="mt-7 grid grid-cols-2 gap-3">
              {[
                ["58", t("guests.guestsTracked")],
                ["84%", t("guests.replied")],
                ["24", t("guests.attending")],
                ["3", t("guests.declinedStat")],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-background/15 p-4">
                  <p className="text-3xl font-black">{value}</p>
                  <p className="text-xs text-primary-foreground/75">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-background/10 p-4">
              <div className="flex justify-between text-sm">
                <span>{t("guests.needShuttle")}</span>
                <span>18/24</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-background/25">
                <div className="h-full w-3/4 rounded-full bg-primary-foreground" />
              </div>
            </div>
          </div>
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
        <div className="reveal rounded-[2rem] border border-border bg-card p-6 shadow-[0_8px_30px_rgb(0_0_0/0.06)]">
          <div className="grid grid-cols-2 gap-3">
            {[
              [t("languages.groomLabel"), "신랑"],
              [t("languages.brideLabel"), "신부"],
              [t("languages.invitedLabel"), "초대합니다"],
            ].map(([a, b]) => (
              <div key={a} className="rounded-2xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">{a}</p>
                <p className="mt-2 text-xl font-black text-foreground">{b}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="reveal">
          <Languages className="size-10 text-primary" />
          <h2 className="mt-5 font-heading text-3xl font-black text-foreground sm:text-5xl">{t("languages.title")}</h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">{t("languages.subtitle")}</p>
          <div className="mt-7 flex flex-wrap gap-2">
            {["English", "Tiếng Việt", "한국어", "日本語", "Français", "Español", "繁體中文"].map((label) => (
              <span key={label} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"] as const;

function FaqSection() {
  const t = useTranslations("home");

  return (
    <section id="pricing" className="bg-secondary py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="reveal text-center font-heading text-3xl font-black text-foreground sm:text-5xl">{t("faq.heading")}</h2>
        <div className="reveal mt-10 divide-y divide-border overflow-hidden rounded-[2rem] border border-border bg-card">
          {faqKeys.map((key, index) => (
            <details key={key} className="group p-6" open={index === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-black text-foreground">
                {t(`faq.${key}Q`)}
                <ChevronDown className="size-5 shrink-0 text-primary transition group-open:rotate-180" />
              </summary>
              <p className="mt-4 leading-7 text-muted-foreground">{t(`faq.${key}A`)}</p>
            </details>
          ))}
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
  useRevealOnScroll();
  useScrollProgress();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div id="scroll-progress" className="scroll-progress" aria-hidden />
      <SiteHeader />
      <HeroSection />
      <TemplateCarousel />
      <HowItWorks />
      <SupportSection />
      <TestimonialsSection />
      <GuestsSection />
      <LanguageSection />
      <FaqSection />
      <SiteFooter />
    </main>
  );
}
