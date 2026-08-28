"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Play,
  Plus,
  Star,
  Zap,
} from "lucide-react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { ContactFab } from "@/components/chungdoi-chrome";
import { WeddingGuideVideo } from "@/components/wedding-guide-video";
import { loginHref, TEMPLATE_LIST_PATH } from "@/lib/auth-redirects";

import { Home2Footer, Home2Header } from "../chrome";
import { Shell } from "../primitives";
import {
  ClosingChapter,
  FeaturesChapter,
  GuestsChapter,
  LanguagesChapter,
  type ImageSize,
} from "../sections-bottom";
import { InstantChapter, Ribbon, TemplatesChapter } from "../sections-top";
import { V9Hero, V9Journey, type V9TemplateShot } from "./v9-journey";
import "./v9.css";

const testimonialKeys = ["t1", "t2", "t3", "t4", "t5", "t6"] as const;
const faqNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function V9Page({
  shots,
  templateCount,
  instantTemplateId,
  rsvpImage,
  languagesImage,
}: {
  shots: V9TemplateShot[];
  templateCount: number;
  instantTemplateId: string;
  rsvpImage: ImageSize;
  languagesImage: ImageSize;
}) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { loggedIn?: boolean } | null) => {
        if (active && data?.loggedIn) setLoggedIn(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const createHref = loggedIn ? TEMPLATE_LIST_PATH : loginHref(TEMPLATE_LIST_PATH);
  const heroShot = shots[0];
  const galleryShots = shots.slice(1, 7);

  if (!heroShot) return null;

  return (
    <div className="home-editorial hp-v9">
      <LabStrip />
      <Home2Header createHref={createHref} />
      <main>
        <V9Hero shot={heroShot} createHref={createHref} />
        <V9Journey shots={shots.slice(0, 4)} createHref={createHref} />
        <GuideChapter />
        <Ribbon templateCount={templateCount} />
        <TemplatesChapter shots={galleryShots} templateCount={templateCount} />
        <InstantChapter templateId={instantTemplateId} />
        <FeaturesChapter />
        <GuestsChapter imageSize={rsvpImage} />
        <LanguagesChapter imageSize={languagesImage} />
        <SupportChapter />
        <TestimonialsChapter />
        <FullFaqChapter />
        <ClosingChapter createHref={createHref} />
      </main>
      <Home2Footer />
      <ContactFab />
    </div>
  );
}

function LabStrip() {
  const t = useTranslations("homeLabV9.labStrip");

  return (
    <div className="v9-lab-strip px-5 py-2.5 sm:px-8">
      <div className="mx-auto flex w-full max-w-[78rem] flex-wrap items-center gap-x-3 gap-y-1">
        <span className="hp-label !tracking-[0.24em]">{t("label")}</span>
        <span className="hp-body-sm">{t("name")}</span>
        <NextLink
          href="/home-2/lab"
          className="hp-body-sm ml-auto underline decoration-1 underline-offset-4"
        >
          {t("back")}
        </NextLink>
      </div>
    </div>
  );
}

function GuideChapter() {
  const t = useTranslations("home");
  const steps = [
    [t("howItWorks.step1Title"), t("howItWorks.step1Copy")],
    [t("howItWorks.step2Title"), t("howItWorks.step2Copy")],
    [t("howItWorks.step3Title"), t("howItWorks.step3Copy")],
  ];

  return (
    <section className="hp-paper-2 hp-grain py-[var(--hp-chapter-y)]">
      <Shell className="grid items-center gap-12 lg:grid-cols-[1fr_0.78fr] lg:gap-20">
        <div>
          <p className="hp-label flex items-center gap-3 text-[color:var(--hp-accent)]">
            <Play className="size-4" strokeWidth={1.5} />
            {t("howItWorks.title")}
          </p>
          <h2 className="hp-display hp-h2 mt-6 max-w-[36rem]">
            {t("howItWorks.subtitle")}
          </h2>
          <ol className="mt-10 border-b border-[color:var(--hp-rule)]">
            {steps.map(([title, copy], index) => (
              <li
                key={title}
                className="grid grid-cols-[3rem_1fr] gap-4 border-t border-[color:var(--hp-rule)] py-5"
              >
                <span className="hp-num text-2xl text-[color:var(--hp-accent)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong className="hp-display hp-h3 block">{title}</strong>
                  <span className="hp-body-sm mt-1 block">{copy}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <NextLink href="/mau-thiep" className="hp-btn hp-btn-solid">
              {t("howItWorks.ctaStart")}
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </NextLink>
            <NextLink href="/tao-thiep-cuoi-online" className="hp-link">
              {t("howItWorks.ctaHint")}
            </NextLink>
          </div>
        </div>
        <div className="v9-guide-frame mx-auto aspect-[9/16] w-full max-w-[20rem] overflow-hidden">
          <WeddingGuideVideo title={t("howItWorks.ctaHint")} />
        </div>
      </Shell>
    </section>
  );
}

function SupportChapter() {
  const t = useTranslations("home");
  const cards = [
    {
      label: t("support.replyTimeLabel"),
      value: t("support.replyTimeValue"),
      Icon: Zap,
    },
    {
      label: t("support.helpEditsLabel"),
      value: t("support.helpEditsValue"),
      Icon: CheckCircle2,
    },
  ];

  return (
    <section className="hp-wine hp-grain py-[var(--hp-chapter-y)]">
      <Shell className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <p className="hp-label">{t("support.title")}</p>
          <h2 className="hp-display hp-h2 mt-6 max-w-[38rem]">
            {t("support.titleAccent")}
          </h2>
          <p className="hp-body mt-7 max-w-[38rem]">
            {t.rich("support.subtitle", {
              hl: (chunks) => <strong className="font-semibold text-[color:var(--hp-fg)]">{chunks}</strong>,
            })}
          </p>
        </div>
        <div className="grid gap-px bg-[color:var(--hp-rule)] sm:grid-cols-2 lg:grid-cols-1">
          {cards.map(({ label, value, Icon }) => (
            <div key={label} className="flex items-center gap-5 bg-[color:var(--hp-bg)] p-6">
              <Icon className="size-6 shrink-0 text-[color:var(--hp-accent)]" strokeWidth={1.35} />
              <div>
                <p className="hp-body-sm">{label}</p>
                <p className="hp-display hp-h3 mt-1 text-[color:var(--hp-fg)]">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </Shell>
    </section>
  );
}

function TestimonialsChapter() {
  const t = useTranslations("home");

  return (
    <section className="hp-paper-2 hp-grain py-[var(--hp-chapter-y)]">
      <Shell>
        <div className="grid gap-8 lg:grid-cols-12">
          <header className="lg:col-span-7">
            <p className="hp-label text-[color:var(--hp-accent)]">
              {t("testimonials.eyebrow")}
            </p>
            <h2 className="hp-display hp-h2 mt-6">{t("testimonials.title")}</h2>
          </header>
          <p className="hp-body lg:col-span-4 lg:col-start-9 lg:self-end">
            {t("testimonials.subtitle")}
          </p>
        </div>
        <div className="mt-14 grid gap-px bg-[color:var(--hp-rule)] sm:grid-cols-2 lg:grid-cols-3">
          {testimonialKeys.map((key, index) => (
            <figure key={key} className="flex min-h-64 flex-col bg-[color:var(--hp-bg)] p-7">
              <div className="flex gap-1 text-[color:var(--hp-accent)]" aria-hidden>
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Star key={starIndex} className="size-3.5 fill-current" strokeWidth={1} />
                ))}
              </div>
              <blockquote className="hp-display mt-6 flex-1 text-xl leading-[1.35]">
                “{t(`testimonials.${key}Quote`)}”
              </blockquote>
              <figcaption className="mt-7 border-t border-[color:var(--hp-rule)] pt-5">
                <p className="hp-label !tracking-[0.16em] text-[color:var(--hp-fg)]">
                  {String(index + 1).padStart(2, "0")} · {t(`testimonials.${key}Author`)}
                </p>
                <p className="hp-body-sm mt-2">{t(`testimonials.${key}Role`)}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </Shell>
    </section>
  );
}

function FullFaqChapter() {
  const t = useTranslations("home");
  const labT = useTranslations("homeLabV9");
  const items = faqNumbers.map((number) => ({
    question: t(`faq.q${number}Q`),
    answer: t(`faq.q${number}A`),
  }));

  return (
    <section id="hoi-dap" className="hp-paper hp-grain py-[var(--hp-chapter-y)]">
      <Shell className="grid gap-12 lg:grid-cols-12 lg:gap-x-10">
        <header className="lg:col-span-4">
          <p className="hp-label flex items-center gap-3 text-[color:var(--hp-accent)]">
            <Clock3 className="size-4" strokeWidth={1.5} />
            {labT("faqEyebrow")}
          </p>
          <h2 className="hp-display hp-h2 mt-6">{t("faq.heading")}</h2>
          <NextLink href="/bang-gia" className="hp-link mt-8 inline-block">
            {t("nav.pricing")}
          </NextLink>
        </header>
        <div className="lg:col-span-7 lg:col-start-6">
          {items.map((item, index) => (
            <details key={item.question} className="v9-qa border-t border-[color:var(--hp-rule)]">
              <summary className="flex cursor-pointer list-none items-start gap-5 py-6 [&::-webkit-details-marker]:hidden">
                <span className="hp-num mt-0.5 text-sm text-[color:var(--hp-accent)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="hp-display flex-1 text-[1.08rem] leading-snug sm:text-[1.18rem]">
                  {item.question}
                </h3>
                <Plus className="v9-qa-sign mt-1 size-4 shrink-0" strokeWidth={1.5} />
              </summary>
              <p className="hp-body whitespace-pre-line pb-7 pl-10 pr-8">{item.answer}</p>
            </details>
          ))}
        </div>
      </Shell>
    </section>
  );
}
