"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Gift,
  Heart,
  ImageIcon,
  Languages,
  Mail,
  MapPin,
  MessageCircle,
  MoveHorizontal,
  Play,
  Sparkles,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";
import Lenis from "lenis";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { type CSSProperties, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { SiteHeader, SiteFooter } from "@/components/chungdoi-chrome";
import { getVietnameseTemplateSlug, templates, type ChungDoiTemplate } from "@/data/chungdoi";
import { createInvitation } from "@/app/dashboard/actions";

const AuroraBackground = dynamic(() => import("@/components/aurora-background"), { ssr: false });

const categories = ["All", ...Array.from(new Set(templates.map((template) => template.category)))];
const colors = ["All", ...Array.from(new Set(templates.map((template) => template.color)))];
const featuredTemplates = templates.slice(0, 20);

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function useCountUp(target: number, duration = 1600) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = Math.round(duration / 16);
    const tick = () => {
      frame += 1;
      const progress = 1 - Math.pow(1 - frame / totalFrames, 3);
      setValue(Math.round(target * Math.min(progress, 1)));
      if (frame < totalFrames) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [duration, target]);

  return value;
}

function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ syncTouch: false });
    let rafId = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);
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

function CardSwap() {
  const t = useTranslations("home");
  const locale = useLocale();
  const cardsRef = useRef<Array<HTMLAnchorElement | null>>([]);
  const orderRef = useRef<number[]>(heroPreviewTemplates.map((_, i) => i));
  const pausedRef = useRef(false);
  const applyRef = useRef<() => void>(() => {});
  const cycleRef = useRef<(dir: number) => void>(() => {});
  const promoteRef = useRef<(cardIndex: number) => void>(() => {});
  const resetAutoRef = useRef<() => void>(() => {});
  const hintRef = useRef<HTMLDivElement | null>(null);

  const count = heroPreviewTemplates.length;

  const hrefFor = (slug: string) => {
    const routeSlug = locale === "vi" ? getVietnameseTemplateSlug(slug) : slug;
    return `/${locale === "vi" ? "mau-thiep" : `${locale}/templates`}/${routeSlug}/demo`;
  };

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const slotTransform = (slot: number) =>
      `translateX(${slot * 42}px) translateY(${slot * -46}px) translateZ(${slot * -70}px)`;

    const applyLayout = () => {
      orderRef.current.forEach((cardIndex, slot) => {
        const el = cardsRef.current[cardIndex];
        if (!el) return;
        el.style.transform = slotTransform(slot);
        el.style.zIndex = String(count - slot);
        el.style.opacity = "1";
      });
    };
    applyRef.current = applyLayout;
    applyLayout();

    // Đưa 1 thẻ bất kỳ lên đầu (click thẻ sau).
    promoteRef.current = (cardIndex: number) => {
      const pos = orderRef.current.indexOf(cardIndex);
      if (pos <= 0) return;
      orderRef.current = [cardIndex, ...orderRef.current.filter((i) => i !== cardIndex)];
      applyLayout();
    };

    // Cycle: thẻ front (đang cầm) bay ra theo hướng kéo (dir>=0 sang phải, dir<0 sang trái) rồi xuống cuối.
    let dropping = false;
    cycleRef.current = (dir: number) => {
      if (dropping) return;
      dropping = true;
      const sign = dir >= 0 ? 1 : -1;
      const frontIndex = orderRef.current[0];
      const front = cardsRef.current[frontIndex];
      if (front) {
        front.style.zIndex = String(count + 1);
        front.style.transform = `translateX(${sign * 140}%) translateY(40px) translateZ(120px) rotate(${sign * 14}deg)`;
        front.style.opacity = "0";
      }
      window.setTimeout(() => {
        orderRef.current = [...orderRef.current.slice(1), frontIndex];
        applyLayout();
        dropping = false;
      }, 460);
    };

    const DELAY = 2600;
    let nextAt = Date.now() + DELAY;
    resetAutoRef.current = () => {
      nextAt = Date.now() + DELAY;
    };

    // Back-forward cache restore không chạy lại effect → card giữ transform cũ (thẻ đã bay ra).
    // Reset về layout gốc khi trang được restore từ bfcache.
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      dropping = false;
      orderRef.current = heroPreviewTemplates.map((_, i) => i);
      applyLayout();
      nextAt = Date.now() + DELAY;
    };
    window.addEventListener("pageshow", onPageShow);

    if (reduce) {
      return () => window.removeEventListener("pageshow", onPageShow);
    }

    const interval = window.setInterval(() => {
      if (pausedRef.current) {
        nextAt = Date.now() + DELAY;
        return;
      }
      if (Date.now() >= nextAt) {
        cycleRef.current(1);
        nextAt = Date.now() + DELAY;
      }
    }, 120);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [count]);

  // Kéo/vuốt thẻ đầu để đổi.
  const dragRef = useRef({ active: false, startX: 0, lastX: 0, lastT: 0, vx: 0, moved: false, cardIndex: -1 });

  const onCardPointerDown = (cardIndex: number) => (e: React.PointerEvent<HTMLAnchorElement>) => {
    const isFront = orderRef.current[0] === cardIndex;
    if (!isFront) return;
    pausedRef.current = true;
    dragRef.current = { active: true, startX: e.clientX, lastX: e.clientX, lastT: e.timeStamp, vx: 0, moved: false, cardIndex };
    const el = cardsRef.current[cardIndex];
    if (el) {
      el.style.transition = "none";
      el.setPointerCapture?.(e.pointerId);
    }
  };

  const onCardPointerMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 4) d.moved = true;
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.vx = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    const el = cardsRef.current[d.cardIndex];
    if (el) el.style.transform = `translateX(${dx}px) translateY(0) translateZ(0) rotate(${dx * 0.03}deg)`;
  };

  const endDrag = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    const el = cardsRef.current[d.cardIndex];
    if (el) {
      el.style.transition = "";
      el.releasePointerCapture?.(e.pointerId);
    }
    const dx = e.clientX - d.startX;
    // Hướng LUÔN theo dx tổng (điểm đầu→cuối); vx chỉ để hạ ngưỡng khi vẩy nhanh.
    // Không dùng vx cho hướng vì micro-movement lúc thả hay đảo dấu → thẻ bay ngược.
    const flick = Math.abs(d.vx) > 0.45;
    const far = Math.abs(dx) > 70;
    if ((flick || far) && Math.abs(dx) > 8) {
      cycleRef.current(dx < 0 ? -1 : 1);
    } else {
      applyRef.current();
    }
    resetAutoRef.current();
    if (hintRef.current) hintRef.current.style.opacity = "0";
    window.setTimeout(() => (pausedRef.current = false), 400);
  };

  const onCardClick = (cardIndex: number) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Vừa kéo → chặn navigate.
    if (dragRef.current.moved) {
      e.preventDefault();
      dragRef.current.moved = false;
      return;
    }
    // Thẻ sau → đưa lên đầu, không navigate.
    if (orderRef.current[0] !== cardIndex) {
      e.preventDefault();
      pausedRef.current = true;
      promoteRef.current(cardIndex);
      resetAutoRef.current();
      window.setTimeout(() => (pausedRef.current = false), 1800);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-[380px]" data-parallax="0.4">
      <div
        className="card-swap-stage"
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => {
          if (!dragRef.current.active) pausedRef.current = false;
        }}
      >
        <div className="card-swap-track">
          {heroPreviewTemplates.map((template, index) => (
            <a
              key={template.slug}
              ref={(el) => {
                cardsRef.current[index] = el;
              }}
              href={hrefFor(template.slug)}
              className="card-swap-card group"
              onPointerDown={onCardPointerDown(index)}
              onPointerMove={onCardPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onClick={onCardClick(index)}
            >
              <img
                src={template.listing}
                alt={template.name}
                draggable={false}
                className="h-full w-full rounded-2xl object-cover object-top shadow-[0_18px_44px_rgb(0_0_0/0.22)]"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="font-heading text-sm font-black text-background">{template.name}</p>
                <p className="text-[10px] text-background/80">{template.category} · {template.color}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
      <div ref={hintRef} className="card-swap-hint pointer-events-none" aria-hidden>
        <MoveHorizontal className="size-3.5" />
        {t("hero.dragHint")}
      </div>
    </div>
  );
}

function useHeroParallax() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    const root = document.getElementById("hero-parallax");
    if (!root) return;
    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-parallax]"));

    let raf = 0;
    let tx = 0;
    let ty = 0;
    const onMove = (e: MouseEvent) => {
      const rect = root.getBoundingClientRect();
      tx = (e.clientX - rect.left - rect.width / 2) / rect.width;
      ty = (e.clientY - rect.top - rect.height / 2) / rect.height;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          for (const layer of layers) {
            const depth = Number(layer.dataset.parallax ?? 0);
            layer.style.transform = `translate3d(${tx * depth * 30}px, ${ty * depth * 30}px, 0)`;
          }
          raf = 0;
        });
      }
    };
    const onLeave = () => {
      for (const layer of layers) layer.style.transform = "";
    };

    root.addEventListener("mousemove", onMove);
    root.addEventListener("mouseleave", onLeave);
    return () => {
      root.removeEventListener("mousemove", onMove);
      root.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

function HeroSection() {
  const t = useTranslations("home");
  useHeroParallax();
  const auroraEnabled = useAuroraEnabled();
  return (
    <section id="top" className="relative overflow-hidden bg-background">
      {auroraEnabled ? (
        <AuroraBackground className="pointer-events-none absolute inset-0 opacity-20" amplitude={1.1} blend={0.55} />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(214,69,80,0.05),transparent_34%),radial-gradient(circle_at_88%_0%,rgba(224,168,112,0.05),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-muted/40 to-transparent" />
      <div id="hero-parallax" className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-24 lg:pt-16">
        <div className="flex flex-col justify-center">
          <div className="hero-enter mb-8 overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_8px_30px_rgb(0_0_0/0.06)]">
            <img
              src="/chungdoi/images/en/banner_hero.webp"
              alt="Beautiful online wedding invitations"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="hero-enter mb-4 text-2xl font-semibold text-foreground" style={{ "--hero-delay": "80ms" } as CSSProperties}>
            <span className="font-pattaya text-4xl text-primary">thiepmungonline</span>
            <span className="text-muted-foreground">{t("hero.domainSuffix")}</span>
          </p>
          <h1 className="hero-enter font-heading max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl" style={{ "--hero-delay": "160ms" } as CSSProperties}>
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
          <CardSwap />
        </div>
      </div>
    </section>
  );
}

function TemplateCarousel() {
  const t = useTranslations("home");

  return (
    <section className="overflow-hidden bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="reveal">
          <h2 className="font-heading text-3xl font-black text-foreground sm:text-5xl">{t("carousel.title")}</h2>
          <p className="mt-4 text-muted-foreground">{t("carousel.subtitle")}</p>
        </div>
      </div>
      <div className="reveal mt-12 overflow-hidden">
        <div className="template-marquee flex w-max gap-5">
          {[...featuredTemplates, ...featuredTemplates].map((template, index) => (
            <article
              key={`${template.slug}-${index}`}
              className="group relative h-[520px] w-[286px] shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgb(0_0_0/0.06)]"
            >
              <img
                src={template.listing}
                alt={template.name}
                className="h-full w-full object-cover object-top transition-[object-position,transform] duration-[9000ms] ease-in-out group-hover:object-bottom group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent p-5">
                {template.isNew ? <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">{t("carousel.new")}</span> : null}
                <h3 className="mt-2 font-heading text-lg font-black text-background">{template.name}</h3>
                <p className="text-sm text-background/80">
                  {template.category} - {template.color}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const t = useTranslations("home");
  const registered = useCountUp(65000);
  const invitations = useCountUp(73000);
  const views = useCountUp(3100000);

  return (
    <section className="bg-primary py-10 text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 text-center sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8 lg:text-left">
        <h2 className="font-heading text-2xl font-black leading-tight sm:text-3xl lg:max-w-lg">{t("stats.title")}</h2>
        {[
          [registered, t("stats.registered")],
          [invitations, t("stats.invitationsCreated")],
          [views, t("stats.totalViews")],
        ].map(([value, label]) => (
          <div key={label as string} className="rounded-3xl bg-background/15 p-5 text-center backdrop-blur">
            <p className="text-3xl font-black sm:text-4xl">{formatNumber(value as number)}+</p>
            <p className="mt-2 text-sm font-semibold text-primary-foreground/80">{label}</p>
          </div>
        ))}
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

  return (
    <section className="bg-secondary py-16">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
        <div className="reveal">
          <h2 className="font-heading text-3xl font-black text-foreground sm:text-5xl">{t("support.title")}</h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{t("support.subtitle")}</p>
          <a
            href="#templates"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black text-primary-foreground transition-all hover:-translate-y-1 hover:bg-primary/90 hover:shadow-[0_12px_28px_rgba(214,69,80,0.4)]"
          >
            {t("support.startCreating")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
        <div className="reveal grid gap-4 sm:grid-cols-2">
          {[
            [t("support.replyTimeLabel"), t("support.replyTimeValue")],
            [t("support.helpEditsLabel"), t("support.helpEditsValue")],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_16px_40px_rgb(0_0_0/0.08)]">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-4 text-3xl font-black text-foreground">{value}</p>
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

function LanguageAndFeatures() {
  const t = useTranslations("home");
  const features: Array<[string, string, LucideIcon]> = [
    [t("features.mobileTitle"), t("features.mobileCopy"), Heart],
    [t("features.templatesTitle"), t("features.templatesCopy"), Sparkles],
    [t("features.mapsTitle"), t("features.mapsCopy"), MapPin],
    [t("features.albumTitle"), t("features.albumCopy"), ImageIcon],
    [t("features.guestBookTitle"), t("features.guestBookCopy"), MessageCircle],
    [t("features.giftTitle"), t("features.giftCopy"), Gift],
  ];

  return (
    <>
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
      <section className="bg-secondary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center">
            <h2 className="font-heading text-3xl font-black text-foreground sm:text-5xl">{t("features.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("features.subtitle")}</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(([title, copy, Icon]) => (
              <div key={title as string} className="reveal rounded-3xl border border-border bg-card p-6 shadow-[0_8px_30px_rgb(0_0_0/0.06)] transition hover:-translate-y-1 hover:border-primary/50">
                <Icon className="size-8 text-primary" />
                <h3 className="mt-5 font-heading text-xl font-black text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function TemplateGallery() {
  const t = useTranslations("home");
  const [category, setCategory] = useState("All");
  const [color, setColor] = useState("All");
  const [selected, setSelected] = useState<ChungDoiTemplate | null>(null);

  const filtered = useMemo(
    () =>
      templates.filter(
        (template) =>
          (category === "All" || template.category === category) && (color === "All" || template.color === color),
      ),
    [category, color],
  );

  useEffect(() => {
    if (!selected) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [selected]);

  return (
    <section id="templates" className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-heading text-3xl font-black text-foreground sm:text-5xl">{t("gallery.title")}</h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">{t("gallery.subtitle", { count: templates.length })}</p>
          </div>
          <div className="rounded-full border border-border bg-card px-5 py-3 text-sm font-bold text-foreground">
            {t("gallery.countLabel", { shown: filtered.length, total: templates.length })}
          </div>
        </div>

        <div className="reveal mt-8 flex flex-col gap-4 rounded-[2rem] border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <FilterPills label={t("gallery.styleLabel")} options={categories} value={category} onChange={setCategory} />
          <FilterPills label={t("gallery.colorLabel")} options={colors} value={color} onChange={setColor} />
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((template) => (
            <TemplateCard key={template.slug} template={template} onSelect={() => setSelected(template)} />
          ))}
        </div>
      </div>

      {selected ? <TemplateModal template={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}

function FilterPills({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`rounded-full px-3 py-1.5 text-sm font-bold transition ${
            value === option ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted text-muted-foreground hover:bg-secondary"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function TemplateCard({ template, onSelect }: { template: ChungDoiTemplate; onSelect: () => void }) {
  const t = useTranslations("home");
  const locale = useLocale();
  const routeSlug = locale === "vi" ? getVietnameseTemplateSlug(template.slug) : template.slug;
  const demoHref = `/${locale === "vi" ? "mau-thiep" : `${locale}/templates`}/${routeSlug}/demo`;

  return (
    <article className="reveal group overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_8px_30px_rgb(0_0_0/0.06)] transition hover:-translate-y-2 hover:border-primary/50 hover:shadow-[0_16px_40px_rgb(0_0_0/0.1)]">
      <button onClick={onSelect} className="block w-full text-left">
        <div className="relative h-[460px] overflow-hidden bg-muted">
          <img
            src={template.listing}
            alt={template.name}
            className="h-full w-full object-cover object-top transition-[object-position,transform] duration-[10000ms] ease-in-out group-hover:object-bottom group-hover:scale-[1.03]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent p-4">
            <div className="flex items-center gap-2">
              {template.isNew ? <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-black text-primary-foreground">{t("gallery.new")}</span> : null}
              <span className="rounded-full bg-background/20 px-2.5 py-1 text-xs font-bold text-background">{template.color}</span>
            </div>
          </div>
        </div>
      </button>
      <div className="p-5">
        <h3 className="font-heading text-xl font-black text-foreground">{template.name}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{template.category}</p>
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">{template.description}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={onSelect}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-muted px-3 py-2.5 text-sm font-black text-foreground transition hover:bg-secondary"
          >
            {t("gallery.preview")}
          </button>
          <a
            href={demoHref}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-3 py-2.5 text-sm font-black text-primary-foreground transition hover:bg-primary/90"
          >
            {t("gallery.viewDemo")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </article>
  );
}

function TemplateModal({ template, onClose }: { template: ChungDoiTemplate; onClose: () => void }) {
  const t = useTranslations("home");
  const locale = useLocale();
  const routeSlug = locale === "vi" ? getVietnameseTemplateSlug(template.slug) : template.slug;
  const demoHref = `/${locale === "vi" ? "mau-thiep" : `${locale}/templates`}/${routeSlug}/demo`;

  return (
    <div className="fixed inset-0 z-[80] bg-foreground/60 p-4 backdrop-blur-xl" role="dialog" aria-modal="true">
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_16px_50px_rgb(0_0_0/0.15)]">
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">{template.category}</p>
            <h3 className="mt-1 font-heading text-2xl font-black text-foreground">{template.name}</h3>
          </div>
          <button onClick={onClose} className="flex size-10 items-center justify-center rounded-full bg-muted text-foreground transition hover:bg-secondary">
            <X className="size-5" />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-muted-foreground">{template.description}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs text-muted-foreground">{t("gallery.colorWord")}</p>
                <p className="mt-1 font-black text-foreground">{template.color}</p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs text-muted-foreground">{t("gallery.trialLabel")}</p>
                <p className="mt-1 font-black text-foreground">{t("gallery.trialValue")}</p>
              </div>
            </div>
            <ul className="mt-6 space-y-3">
              {(template.highlights.length ? template.highlights : [t("gallery.highlightMobile"), t("gallery.highlightRsvp"), t("gallery.highlightGallery")]).map((item) => (
                <li key={item} className="flex gap-3 text-sm text-muted-foreground">
                  <Star className="mt-0.5 size-4 shrink-0 fill-primary text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={demoHref}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black text-primary-foreground transition hover:bg-primary/90"
              >
                {t("gallery.viewInvitationDemo")} <ArrowRight className="size-4" />
              </a>
              <form action={createInvitation}>
                <input type="hidden" name="templateId" value={template.slug} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-6 py-3 text-sm font-black text-foreground transition hover:bg-secondary"
                >
                  {t("gallery.useStyle")}
                </button>
              </form>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[0.65fr_1fr]">
            <div className="max-h-[70vh] overflow-y-auto rounded-3xl border border-border bg-muted">
              <img src={template.portrait} alt={`${template.name} portrait preview`} className="w-full object-contain" />
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-3xl border border-border bg-card">
              <img src={template.landscape} alt={`${template.name} landscape preview`} className="w-full object-contain" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingFaq() {
  const t = useTranslations("home");
  const faqs: Array<[string, string]> = [
    [t("pricing.faq1Q"), t("pricing.faq1A")],
    [t("pricing.faq2Q"), t("pricing.faq2A")],
    [t("pricing.faq3Q"), t("pricing.faq3A")],
    [t("pricing.faq4Q"), t("pricing.faq4A")],
  ];
  const perks = [t("pricing.perk1"), t("pricing.perk2"), t("pricing.perk3"), t("pricing.perk4")];

  return (
    <section id="pricing" className="bg-secondary py-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.75fr_1fr] lg:px-8">
        <div className="reveal">
          <h2 className="font-heading text-3xl font-black text-foreground sm:text-5xl">{t("pricing.title")}</h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">{t("pricing.subtitle")}</p>
          <div className="mt-8 rounded-[2rem] border border-primary/35 bg-primary/10 p-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-accent">{t("pricing.popular")}</p>
            <p className="mt-4 text-5xl font-black text-foreground">{t("pricing.price")}</p>
            <p className="mt-2 text-muted-foreground">{t("pricing.priceNote")}</p>
            <ul className="mt-6 space-y-3 text-sm text-foreground">
              {perks.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="size-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="reveal">
          <h2 className="font-heading text-3xl font-black text-foreground">{t("pricing.faqTitle")}</h2>
          <div className="mt-6 divide-y divide-border overflow-hidden rounded-[2rem] border border-border bg-card">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group p-5" open={question === faqs[0][0]}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-black text-foreground">
                  {question}
                  <ChevronDown className="size-4 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function InstantDemo() {
  const t = useTranslations("home");
  const defaultGroom = t("instant.defaultGroom");
  const defaultBride = t("instant.defaultBride");
  const [groom, setGroom] = useState("");
  const [bride, setBride] = useState("");

  const groomName = groom.trim() || defaultGroom;
  const brideName = bride.trim() || defaultBride;

  return (
    <section className="bg-secondary py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <div className="reveal-left">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">{t("instant.eyebrow")}</p>
          <h2 className="mt-4 font-heading text-3xl font-black text-foreground sm:text-5xl">{t("instant.title")}</h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">{t("instant.subtitle")}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-muted-foreground">{t("languages.groomLabel")}</span>
              <input
                value={groom}
                onChange={(e) => setGroom(e.target.value)}
                placeholder={t("instant.groomPlaceholder")}
                maxLength={24}
                className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-muted-foreground">{t("languages.brideLabel")}</span>
              <input
                value={bride}
                onChange={(e) => setBride(e.target.value)}
                placeholder={t("instant.bridePlaceholder")}
                maxLength={24}
                className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
          </div>
          <form action={createInvitation} className="mt-6">
            <button
              type="submit"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-black text-primary-foreground shadow-xl transition-all hover:-translate-y-1 hover:bg-primary/90 hover:shadow-[0_12px_28px_rgba(214,69,80,0.4)]"
            >
              {t("instant.cta")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>
        </div>
        <div className="reveal-right">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[380px] overflow-hidden rounded-[2rem] border border-border shadow-[0_24px_60px_rgb(0_0_0/0.18)]">
            <img
              src={heroPreviewTemplates[0].portrait}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/25 via-foreground/10 to-foreground/55" />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <p className="font-heading text-xs font-black uppercase tracking-[0.35em] text-background/90">{t("instant.previewInvited")}</p>
              <p className="mt-6 font-pattaya text-4xl text-background drop-shadow-lg sm:text-5xl">{groomName}</p>
              <p className="my-2 text-2xl text-background/90">&</p>
              <p className="font-pattaya text-4xl text-background drop-shadow-lg sm:text-5xl">{brideName}</p>
              <span className="mt-8 rounded-full bg-background/20 px-4 py-1.5 text-xs font-bold text-background backdrop-blur">{t("hero.rsvpOpen")}</span>
            </div>
          </div>
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

function StickyCta() {
  const t = useTranslations("home");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href="#templates"
      className={`group fixed bottom-5 right-5 z-[95] inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-[0_10px_30px_rgba(214,69,80,0.45)] transition-all duration-300 hover:bg-primary/90 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-16 opacity-0"
      }`}
    >
      <Sparkles className="size-4" />
      {t("stickyCta.button")}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
    </a>
  );
}

export function ChungDoiClone() {
  useSmoothScroll();
  useRevealOnScroll();
  useScrollProgress();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div id="scroll-progress" className="scroll-progress" aria-hidden />
      <SiteHeader />
      <HeroSection />
      <TemplateCarousel />
      <StatsSection />
      <InstantDemo />
      <HowItWorks />
      <SupportSection />
      <GuestsSection />
      <TestimonialsSection />
      <LanguageAndFeatures />
      <TemplateGallery />
      <PricingFaq />
      <SiteFooter />
      <StickyCta />
    </main>
  );
}
