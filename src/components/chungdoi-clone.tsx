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
  Play,
  Sparkles,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { SiteHeader, SiteFooter } from "@/components/chungdoi-chrome";
import { getVietnameseTemplateSlug, templates, type ChungDoiTemplate } from "@/data/chungdoi";
import { createInvitation } from "@/app/dashboard/actions";

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

function useRevealOnScroll() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
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

function HeroSection() {
  const t = useTranslations("home");
  return (
    <section id="top" className="relative overflow-hidden bg-[#18120f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(251,53,112,0.24),transparent_34%),radial-gradient(circle_at_88%_0%,rgba(255,197,120,0.18),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/45 to-transparent" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-24 lg:pt-16">
        <div className="reveal flex flex-col justify-center">
          <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/35">
            <img
              src="/chungdoi/images/en/banner_hero.webp"
              alt="Beautiful online wedding invitations"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="mb-4 text-2xl font-semibold text-white">
            <span className="font-pattaya text-4xl text-[#fb3570]">thiepmungonline</span>
            <span className="text-zinc-400">{t("hero.domainSuffix")}</span>
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">{t("hero.subtitle")}</p>
          <p className="mt-4 text-sm font-semibold text-[#ffb5ca]">{t("hero.trialNote")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#templates"
              className="inline-flex items-center gap-2 rounded-full bg-[#fb3570] px-6 py-3 text-sm font-bold text-white shadow-xl shadow-[#fb3570]/25 transition hover:-translate-y-1 hover:bg-[#ff4a82]"
            >
              {t("createNow")} <ArrowRight className="size-4" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-white/10"
            >
              {t("hero.watchGuide")} <Play className="size-4" />
            </a>
          </div>
        </div>

        <div className="reveal relative min-h-[610px] lg:min-h-[720px]">
          <div className="absolute left-5 top-8 w-[58%] max-w-[360px] animate-float-slow overflow-hidden rounded-[2rem]">
            <img
              src="/chungdoi/images/en/hero/hero-1.webp"
              alt="Thiệp Mừng Online invitation example"
              className="aspect-[2/3] w-full rounded-[1.4rem] object-cover"
            />
          </div>
          <div className="absolute right-0 top-28 w-[49%] max-w-[300px] animate-float overflow-hidden rounded-[2rem]">
            <img
              src="/chungdoi/images/en/hero/hero-2.webp"
              alt="Online wedding invitation on mobile"
              className="aspect-[2/3] w-full rounded-[1.4rem] object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function TemplateCarousel() {
  const t = useTranslations("home");

  return (
    <section className="overflow-hidden bg-[#18120f] py-16">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="reveal">
          <h2 className="text-3xl font-black text-white sm:text-5xl">{t("carousel.title")}</h2>
          <p className="mt-4 text-zinc-300">{t("carousel.subtitle")}</p>
        </div>
      </div>
      <div className="reveal mt-12 overflow-hidden">
        <div className="template-marquee flex w-max gap-5">
          {[...featuredTemplates, ...featuredTemplates].map((template, index) => (
            <article
              key={`${template.slug}-${index}`}
              className="group relative h-[520px] w-[286px] shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-[#251b18] shadow-2xl shadow-black/35"
            >
              <img
                src={template.listing}
                alt={template.name}
                className="h-full w-full object-cover object-top transition-[object-position,transform] duration-[9000ms] ease-in-out group-hover:object-bottom group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5">
                {template.isNew ? <span className="rounded-full bg-[#fb3570] px-2.5 py-1 text-xs font-bold text-white">{t("carousel.new")}</span> : null}
                <h3 className="mt-2 text-lg font-black text-white">{template.name}</h3>
                <p className="text-sm text-zinc-300">
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
    <section className="bg-[#fb3570] py-10 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 text-center sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8 lg:text-left">
        <h2 className="text-2xl font-black leading-tight sm:text-3xl lg:max-w-lg">{t("stats.title")}</h2>
        {[
          [registered, t("stats.registered")],
          [invitations, t("stats.invitationsCreated")],
          [views, t("stats.totalViews")],
        ].map(([value, label]) => (
          <div key={label as string} className="rounded-3xl bg-white/13 p-5 text-center backdrop-blur">
            <p className="text-3xl font-black sm:text-4xl">{formatNumber(value as number)}+</p>
            <p className="mt-2 text-sm font-semibold text-white/80">{label}</p>
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
    <section id="how-it-works" className="bg-[#211815] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal text-center">
          <h2 className="text-3xl font-black text-white sm:text-5xl">{t("howItWorks.title")}</h2>
          <p className="mt-4 text-zinc-300">{t("howItWorks.subtitle")}</p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {steps.map(([title, copy, Icon], index) => (
            <div key={title as string} className="reveal rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#fb3570] text-white">
                  <Icon className="size-5" />
                </div>
                <p className="text-sm font-bold text-[#ffb5ca]">{t("howItWorks.step", { number: index + 1 })}</p>
              </div>
              <h3 className="mt-6 text-2xl font-black text-white">{title}</h3>
              <p className="mt-3 text-zinc-300">{copy}</p>
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
    <section className="bg-[#2a211e] py-16">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
        <div className="reveal">
          <h2 className="text-3xl font-black text-white sm:text-5xl">{t("support.title")}</h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">{t("support.subtitle")}</p>
          <a
            href="#templates"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[#1f1715] transition hover:-translate-y-1"
          >
            {t("support.startCreating")} <ArrowRight className="size-4" />
          </a>
        </div>
        <div className="reveal grid gap-4 sm:grid-cols-2">
          {[
            [t("support.replyTimeLabel"), t("support.replyTimeValue")],
            [t("support.helpEditsLabel"), t("support.helpEditsValue")],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
              <p className="text-sm text-zinc-400">{label}</p>
              <p className="mt-4 text-3xl font-black text-white">{value}</p>
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
    <section id="guests" className="relative overflow-hidden bg-[#211815] py-20">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(251,53,112,0.18),transparent_55%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="reveal">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#ff8cad]">{t("guests.eyebrow")}</p>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-5xl">{t("guests.title")}</h2>
          <p className="mt-6 text-lg leading-8 text-zinc-300">{t("guests.subtitle")}</p>
          <ul className="mt-8 space-y-4 text-zinc-200">
            {[
              t("guests.point1"),
              t("guests.point2"),
              t("guests.point3"),
              t("guests.point4"),
              t("guests.point5"),
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <Check className="mt-1 size-5 shrink-0 text-[#fb3570]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="reveal grid gap-5 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl shadow-black/35">
            <p className="text-sm text-zinc-400">{t("guests.personalLink")}</p>
            <h3 className="mt-3 text-2xl font-black text-white">{t("guests.invitePrompt")}</h3>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-emerald-950">{t("guests.attend")}</button>
              <button className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white">{t("guests.declined")}</button>
            </div>
            {[t("guests.plusOnes"), t("guests.needShuttle"), t("guests.mealNotes"), t("guests.songRequest")].map((label) => (
              <div key={label} className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                {label}
              </div>
            ))}
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-[#fb3570] p-5 text-white shadow-2xl shadow-[#fb3570]/20">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/75">{t("guests.guestManager")}</p>
            <h3 className="mt-4 text-2xl font-black">{t("guests.rsvpGathered")}</h3>
            <div className="mt-7 grid grid-cols-2 gap-3">
              {[
                ["58", t("guests.guestsTracked")],
                ["84%", t("guests.replied")],
                ["24", t("guests.attending")],
                ["3", t("guests.declinedStat")],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-white/15 p-4">
                  <p className="text-3xl font-black">{value}</p>
                  <p className="text-xs text-white/75">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-black/15 p-4">
              <div className="flex justify-between text-sm">
                <span>{t("guests.needShuttle")}</span>
                <span>18/24</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/25">
                <div className="h-full w-3/4 rounded-full bg-white" />
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
      <section className="bg-[#18120f] py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="reveal rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <div className="grid grid-cols-2 gap-3">
              {[
                [t("languages.groomLabel"), "신랑"],
                [t("languages.brideLabel"), "신부"],
                [t("languages.invitedLabel"), "초대합니다"],
              ].map(([a, b]) => (
                <div key={a} className="rounded-2xl bg-black/20 p-4">
                  <p className="text-sm text-zinc-400">{a}</p>
                  <p className="mt-2 text-xl font-black text-white">{b}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="reveal">
            <Languages className="size-10 text-[#fb3570]" />
            <h2 className="mt-5 text-3xl font-black text-white sm:text-5xl">{t("languages.title")}</h2>
            <p className="mt-5 text-lg leading-8 text-zinc-300">{t("languages.subtitle")}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {["English", "Tiếng Việt", "한국어", "日本語", "Français", "Español", "繁體中文"].map((label) => (
                <span key={label} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-zinc-200">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="bg-[#211815] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center">
            <h2 className="text-3xl font-black text-white sm:text-5xl">{t("features.title")}</h2>
            <p className="mt-4 text-zinc-300">{t("features.subtitle")}</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(([title, copy, Icon]) => (
              <div key={title as string} className="reveal rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-[#fb3570]/50 hover:bg-white/[0.07]">
                <Icon className="size-8 text-[#fb3570]" />
                <h3 className="mt-5 text-xl font-black text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{copy}</p>
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
    <section id="templates" className="bg-[#18120f] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-black text-white sm:text-5xl">{t("gallery.title")}</h2>
            <p className="mt-4 max-w-2xl text-zinc-300">{t("gallery.subtitle", { count: templates.length })}</p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-bold text-white">
            {t("gallery.countLabel", { shown: filtered.length, total: templates.length })}
          </div>
        </div>

        <div className="reveal mt-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
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
      <span className="mr-1 text-xs font-black uppercase tracking-[0.18em] text-zinc-500">{label}</span>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`rounded-full px-3 py-1.5 text-sm font-bold transition ${
            value === option ? "bg-[#fb3570] text-white shadow-lg shadow-[#fb3570]/25" : "bg-white/5 text-zinc-300 hover:bg-white/10"
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
    <article className="reveal group overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#251b18] shadow-xl shadow-black/25 transition hover:-translate-y-2 hover:border-[#fb3570]/50 hover:shadow-2xl hover:shadow-[#fb3570]/10">
      <button onClick={onSelect} className="block w-full text-left">
        <div className="relative h-[460px] overflow-hidden bg-black">
          <img
            src={template.listing}
            alt={template.name}
            className="h-full w-full object-cover object-top transition-[object-position,transform] duration-[10000ms] ease-in-out group-hover:object-bottom group-hover:scale-[1.03]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-4">
            <div className="flex items-center gap-2">
              {template.isNew ? <span className="rounded-full bg-[#fb3570] px-2.5 py-1 text-xs font-black text-white">{t("gallery.new")}</span> : null}
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold text-white">{template.color}</span>
            </div>
          </div>
        </div>
      </button>
      <div className="p-5">
        <h3 className="text-xl font-black text-white">{template.name}</h3>
        <p className="mt-2 text-sm text-zinc-400">{template.category}</p>
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-zinc-300">{template.description}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={onSelect}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-black text-white transition hover:bg-white/10"
          >
            {t("gallery.preview")}
          </button>
          <a
            href={demoHref}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fb3570] px-3 py-2.5 text-sm font-black text-white transition hover:bg-[#ff4a82]"
          >
            {t("gallery.viewDemo")} <ArrowRight className="size-4" />
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
    <div className="fixed inset-0 z-[80] bg-black/75 p-4 backdrop-blur-xl" role="dialog" aria-modal="true">
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#1d1513] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-4 sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff8cad]">{template.category}</p>
            <h3 className="mt-1 text-2xl font-black text-white">{template.name}</h3>
          </div>
          <button onClick={onClose} className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
            <X className="size-5" />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-zinc-300">{template.description}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/[0.05] p-4">
                <p className="text-xs text-zinc-500">{t("gallery.colorWord")}</p>
                <p className="mt-1 font-black text-white">{template.color}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.05] p-4">
                <p className="text-xs text-zinc-500">{t("gallery.trialLabel")}</p>
                <p className="mt-1 font-black text-white">{t("gallery.trialValue")}</p>
              </div>
            </div>
            <ul className="mt-6 space-y-3">
              {(template.highlights.length ? template.highlights : [t("gallery.highlightMobile"), t("gallery.highlightRsvp"), t("gallery.highlightGallery")]).map((item) => (
                <li key={item} className="flex gap-3 text-sm text-zinc-300">
                  <Star className="mt-0.5 size-4 shrink-0 fill-[#fb3570] text-[#fb3570]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={demoHref}
                className="inline-flex items-center gap-2 rounded-full bg-[#fb3570] px-6 py-3 text-sm font-black text-white transition hover:bg-[#ff4a82]"
              >
                {t("gallery.viewInvitationDemo")} <ArrowRight className="size-4" />
              </a>
              <form action={createInvitation}>
                <input type="hidden" name="templateId" value={template.slug} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
                >
                  {t("gallery.useStyle")}
                </button>
              </form>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[0.65fr_1fr]">
            <div className="max-h-[70vh] overflow-y-auto rounded-3xl border border-white/10 bg-black">
              <img src={template.portrait} alt={`${template.name} portrait preview`} className="w-full object-contain" />
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-3xl border border-white/10 bg-white">
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
    <section id="pricing" className="bg-[#211815] py-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.75fr_1fr] lg:px-8">
        <div className="reveal">
          <h2 className="text-3xl font-black text-white sm:text-5xl">{t("pricing.title")}</h2>
          <p className="mt-5 text-lg leading-8 text-zinc-300">{t("pricing.subtitle")}</p>
          <div className="mt-8 rounded-[2rem] border border-[#fb3570]/35 bg-[#fb3570]/10 p-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#ff8cad]">{t("pricing.popular")}</p>
            <p className="mt-4 text-5xl font-black text-white">{t("pricing.price")}</p>
            <p className="mt-2 text-zinc-300">{t("pricing.priceNote")}</p>
            <ul className="mt-6 space-y-3 text-sm text-zinc-200">
              {perks.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="size-4 text-[#fb3570]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="reveal">
          <h2 className="text-3xl font-black text-white">{t("pricing.faqTitle")}</h2>
          <div className="mt-6 divide-y divide-white/10 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group p-5" open={question === faqs[0][0]}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-black text-white">
                  {question}
                  <ChevronDown className="size-4 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ChungDoiClone() {
  useRevealOnScroll();

  return (
    <main className="min-h-screen bg-[#18120f] text-white">
      <SiteHeader />
      <HeroSection />
      <TemplateCarousel />
      <StatsSection />
      <HowItWorks />
      <SupportSection />
      <GuestsSection />
      <LanguageAndFeatures />
      <TemplateGallery />
      <PricingFaq />
      <SiteFooter />
    </main>
  );
}
