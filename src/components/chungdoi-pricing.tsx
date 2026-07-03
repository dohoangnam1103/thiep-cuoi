"use client";

import { ArrowRight, Check, ChevronDown, Minus } from "lucide-react";
import { useTranslations } from "next-intl";

import { SiteFooter, SiteHeader } from "@/components/chungdoi-chrome";
import { Link } from "@/i18n/navigation";

export function ChungDoiPricing() {
  const t = useTranslations("pricing");

  const highlights = [t("highlight1"), t("highlight2"), t("highlight3")];
  const planNotes = [t("planNote1"), t("planNote2"), t("planNote3"), t("planNote4")];
  const features = [t("feature1"), t("feature2"), t("feature3"), t("feature4"), t("feature5"), t("feature6")];
  const steps = [t("step1"), t("step2"), t("step3")];

  const compare: Array<[string, string | boolean, string | boolean]> = [
    [t("compareDurationLabel"), t("compareDurationFree"), t("compareDurationPaid")],
    [t("compareGuestsLabel"), t("compareGuestsFree"), t("compareGuestsPaid")],
    [t("compareSwitch"), true, true],
    [t("compareAll"), true, true],
    [t("compareEdit"), true, true],
    [t("compareMedia"), true, true],
    [t("compareMaps"), true, true],
    [t("compareQr"), true, true],
    [t("compareDownload"), false, true],
  ];

  const faqs: Array<[string, string]> = [
    [t("faq1Q"), t("faq1A")],
    [t("faq2Q"), t("faq2A")],
    [t("faq3Q"), t("faq3A")],
    [t("faq4Q"), t("faq4A")],
    [t("faq5Q"), t("faq5A")],
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border bg-[radial-gradient(circle_at_15%_-10%,var(--accent),transparent_40%)] py-14 text-center sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-accent-foreground">{t("eyebrow")}</p>
          <h1 className="mt-4 font-heading text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl">{t("title")}</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">{t("subtitle")}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {highlights.map((item) => (
              <span key={item} className="rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-[0_8px_30px_rgb(0_0_0/0.06)]">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:px-8">
          <div className="rounded-2xl border border-primary bg-card p-8 shadow-[0_8px_30px_rgb(0_0_0/0.06)] ring-1 ring-primary">
            <div className="flex items-center gap-3">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">{t("planType")}</p>
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-black text-accent-foreground">-50%</span>
            </div>
            <p className="mt-4 font-heading text-5xl font-black text-foreground">199.000đ</p>
            <p className="mt-2 text-muted-foreground">{t("planPay")}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {planNotes.map((note) => (
                <span key={note} className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                  {note}
                </span>
              ))}
            </div>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {features.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/templates"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black text-primary-foreground transition hover:-translate-y-1 hover:bg-primary/90"
            >
              {t("startFree")} <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_8px_30px_rgb(0_0_0/0.06)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-muted-foreground">{t("secondTitle")}</p>
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-black text-accent-foreground">-50%</span>
              </div>
              <p className="mt-4 font-heading text-4xl font-black text-foreground">99.000đ</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("secondNote")}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_8px_30px_rgb(0_0_0/0.06)]">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-muted-foreground">{t("stepsTitle")}</p>
              <ol className="mt-4 space-y-4">
                {steps.map((step, index) => (
                  <li key={step} className="flex items-center gap-4">
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                      {index + 1}
                    </span>
                    <span className="font-bold text-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-secondary py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-heading text-3xl font-black text-foreground sm:text-4xl">{t("compareTitle")}</h2>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgb(0_0_0/0.06)]">
            <div className="grid grid-cols-[1.6fr_1fr_1fr] gap-2 border-b border-border p-4 text-sm font-black uppercase tracking-[0.14em] text-muted-foreground">
              <span />
              <span className="text-center">{t("freeCol")}</span>
              <span className="text-center text-primary">{t("paidCol")}</span>
            </div>
            {compare.map(([label, free, paid]) => (
              <div key={label} className="grid grid-cols-[1.6fr_1fr_1fr] items-center gap-2 border-b border-border p-4 text-sm last:border-0">
                <span className="font-bold text-foreground">{label}</span>
                <span className="flex justify-center text-muted-foreground">{renderCell(free)}</span>
                <span className="flex justify-center text-foreground">{renderCell(paid)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-heading text-3xl font-black text-foreground sm:text-4xl">{t("faqTitle")}</h2>
          <div className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgb(0_0_0/0.06)]">
            {faqs.map(([question, answer], index) => (
              <details key={question} className="group p-5" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-black text-foreground">
                  {question}
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[radial-gradient(circle_at_50%_120%,var(--accent),transparent_55%)] py-16 text-center">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-black text-foreground sm:text-5xl">{t("ctaTitle")}</h2>
          <Link
            href="/templates"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-black text-primary-foreground transition hover:-translate-y-1 hover:bg-primary/90"
          >
            {t("ctaBtn")} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function renderCell(value: string | boolean) {
  if (value === true) return <Check className="size-5 text-primary" />;
  if (value === false) return <Minus className="size-5 text-muted-foreground" />;
  return <span className="font-bold">{value}</span>;
}
