"use client";

import { ArrowRight, Check, QrCode, X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";

import { createInvitation } from "@/app/dashboard/actions";
import { SiteFooter, SiteHeader } from "@/components/chungdoi-chrome";
import { WeddingFaqSection } from "@/components/chungdoi-faq";
import { TemplateSuggestionCta } from "@/components/template-suggestion-cta";
import { Link } from "@/i18n/navigation";
import {
  completedTemplates,
  getVietnameseTemplateSlug,
  templateCategories,
  templateColors,
  type ChungDoiTemplate,
} from "@/data/chungdoi";

function demoSlug(template: ChungDoiTemplate, locale: string) {
  return locale === "vi" ? getVietnameseTemplateSlug(template.slug) : template.slug;
}

export function ChungDoiListing() {
  const t = useTranslations("listing");
  const locale = useLocale();
  const [category, setCategory] = useState("All");
  const [color, setColor] = useState("All");
  const [selected, setSelected] = useState<ChungDoiTemplate | null>(null);

  const filtered = useMemo(
    () =>
      completedTemplates.filter(
        (template) =>
          (category === "All" || template.category === category) &&
          (color === "All" || template.color === color),
      ),
    [category, color],
  );

  useEffect(() => {
    if (!selected) return;
    const original = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [selected]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div
        aria-hidden={selected ? true : undefined}
        className={`transition-[filter,transform] duration-200 ease-out ${selected ? "scale-[0.998] blur-[6px]" : "blur-none"}`}
      >
        <SiteHeader initialLoggedIn hideCreateButton />
        <section className="border-b border-border bg-background py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">{t("eyebrow")}</p>
            <h1 className="mt-4 max-w-3xl font-heading text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-normal leading-8 text-muted-foreground">{t("subtitle")}</p>
            <p className="mt-2 max-w-2xl text-lg font-normal leading-8 text-muted-foreground">{t("editingHint")}</p>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="sr-only">{t("title")}</h2>
            <div className="inline-block rounded-full border border-border bg-card px-5 py-2 text-sm font-bold text-foreground">
              {filtered.length} / {completedTemplates.length} {t("countSuffix")}
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((template) => (
                <TemplateCard key={template.slug} template={template} onSelect={() => setSelected(template)} />
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-4 rounded-[2rem] border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <FilterPills
                label={t("styleLabel")}
                options={[...templateCategories]}
                value={category}
                onChange={setCategory}
                getOptionLabel={(option) => (locale === "vi" ? t(`categories.${option}`) : option)}
              />
              <FilterPills
                label={t("colorLabel")}
                options={[...templateColors]}
                value={color}
                onChange={setColor}
                getOptionLabel={(option) => (locale === "vi" ? t(`colors.${option}`) : option)}
              />
            </div>
            <TemplateSuggestionCta />
          </div>
        </section>

        <WeddingFaqSection />
        <SiteFooter />
      </div>

      {selected ? <TemplateModal template={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}

function FilterPills({
  label,
  options,
  value,
  onChange,
  getOptionLabel,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  getOptionLabel: (value: string) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`rounded-full border border-border px-4 py-1.5 text-sm font-bold transition ${
            value === option
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          {getOptionLabel(option)}
        </button>
      ))}
    </div>
  );
}

function TemplateCard({ template, onSelect }: { template: ChungDoiTemplate; onSelect: () => void }) {
  const t = useTranslations("listing");
  const locale = useLocale();
  const isVietnamese = locale === "vi";
  const name = isVietnamese ? t(`templates.${template.slug}.name`) : template.name;
  const description = isVietnamese ? t(`templates.${template.slug}.description`) : template.description;
  const category = isVietnamese ? t(`categories.${template.category}`) : template.category;

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow transition hover:-translate-y-1 hover:shadow-lg">
      <button
        onClick={onSelect}
        data-ga-event="preview_template"
        data-ga-param-template-id={template.slug}
        data-ga-param-source="listing_card"
        className="block w-full text-left"
      >
        <div className="relative h-[460px] overflow-hidden rounded-2xl bg-muted">
          <Image
            src={template.listing}
            alt={name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="h-full w-full object-cover object-top transition-[object-position,transform] duration-[10000ms] ease-in-out group-hover:object-bottom group-hover:scale-[1.03]"
          />
        </div>
      </button>
      <div className="p-5">
        <h3 className="font-heading text-xl font-black text-foreground">{name}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{category}</p>
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-5 grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-2">
          <button
            onClick={onSelect}
            data-ga-event="preview_template"
            data-ga-param-template-id={template.slug}
            data-ga-param-source="listing_card_button"
            className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full border border-border bg-secondary px-2 py-2.5 text-xs font-bold text-foreground transition hover:bg-muted"
          >
            {t("preview")}
          </button>
          <Link
            href={{ pathname: "/templates/[slug]/demo", params: { slug: demoSlug(template, locale) } }}
            data-ga-event="open_template_demo"
            data-ga-param-template-id={template.slug}
            data-ga-param-source="listing_card"
            className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full bg-primary px-2 py-2.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
          >
            {t("demo")} <ArrowRight className="size-3.5 shrink-0" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function TemplateModal({ template, onClose }: { template: ChungDoiTemplate; onClose: () => void }) {
  const t = useTranslations("listing");
  const modalT = useTranslations("templatePreviewModal");
  const locale = useLocale();
  const isVietnamese = locale === "vi";
  const name = isVietnamese ? t(`templates.${template.slug}.name`) : template.name;
  const description = isVietnamese ? t(`templates.${template.slug}.description`) : template.description;
  const category = isVietnamese ? t(`categories.${template.category}`) : template.category;
  const color = isVietnamese ? t(`colors.${template.color}`) : template.color;
  const localizedSlug = demoSlug(template, locale);
  const demoPath = locale === "vi"
    ? `/mau-thiep/${localizedSlug}/demo`
    : `/${locale}/templates/${localizedSlug}/demo`;

  const features = [modalT("highlightMobile"), modalT("highlightRsvp"), modalT("highlightGallery")];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/60 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-detail-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="isolate flex max-h-[calc(100dvh-1rem)] w-full max-w-[67.5rem] flex-col overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl sm:max-h-[calc(100dvh-2rem)] lg:h-[min(760px,calc(100dvh-2rem))]">
        <header className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{modalT("eyebrow")}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{modalT("title")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={modalT("close")}
            className="flex size-10 items-center justify-center rounded-full bg-secondary text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_420px] lg:overflow-hidden">
          <section className="flex min-h-0 flex-col bg-card p-5 sm:p-6 lg:overflow-hidden lg:p-6">
            <h2
              id="template-detail-title"
              className="max-w-xl text-balance font-heading text-3xl font-black leading-tight tracking-tight text-foreground"
            >
              {name}
            </h2>

            <div className="mt-3">
              <h3 className="text-xs font-black uppercase tracking-[0.08em] text-foreground">{modalT("introLabel")}</h3>
              <p className="mt-1.5 max-w-xl text-pretty text-sm leading-5 text-muted-foreground">{description}</p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div>
                <div className="flex flex-wrap gap-2">
                  <div className="rounded-lg bg-secondary px-2.5 py-1.5">
                    <span className="text-[11px] text-muted-foreground">{t("styleLabel")}: </span>
                    <span className="text-xs font-bold text-foreground">{category}</span>
                  </div>
                  <div className="rounded-lg bg-secondary px-2.5 py-1.5">
                    <span className="text-[11px] text-muted-foreground">{t("colorLabel")}: </span>
                    <span className="text-xs font-bold text-foreground">{color}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.08em] text-foreground">
                    {modalT("featuresTitle")}
                  </h3>
                  <ul className="mt-2.5 grid gap-2">
                    {features.map((item) => (
                      <li key={item} className="flex gap-2 text-xs leading-4 text-muted-foreground">
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid content-start gap-3">
                <div className="grid grid-cols-[80px_1fr] items-center gap-3 rounded-xl bg-secondary/70 p-3">
                  <TemplateQrCode demoPath={demoPath} name={name} />
                  <div>
                    <h3 className="text-sm font-black leading-4 text-foreground">{modalT("phonePreviewTitle")}</h3>
                    <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                      {modalT("phonePreviewDescription")}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5">
                  <p className="text-xs font-bold leading-4 text-foreground">{modalT("offerPrimary")}</p>
                  <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{modalT("offerSecondary")}</p>
                </div>
              </div>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
              <Link
                href={{ pathname: "/templates/[slug]/demo", params: { slug: localizedSlug } }}
                data-ga-event="open_template_demo"
                data-ga-param-template-id={template.slug}
                data-ga-param-source="listing_modal"
                className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-full border border-border bg-secondary px-3 py-2.5 text-center text-xs font-black text-foreground transition hover:-translate-y-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-0 sm:text-sm"
              >
                {t("demoCta")} <ArrowRight className="size-4 shrink-0" />
              </Link>
              <form
                action={createInvitation}
                data-ga-event="select_template"
                data-ga-param-template-id={template.slug}
                data-ga-param-source="listing_modal"
                className="min-w-0"
              >
                <input type="hidden" name="templateId" value={template.slug} />
                <button
                  type="submit"
                  className="inline-flex h-full min-h-11 w-full min-w-0 items-center justify-center gap-2 rounded-full bg-primary px-3 py-2.5 text-center text-xs font-black text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-0 sm:text-sm"
                >
                  {t("useStyle")}
                </button>
              </form>
            </div>
          </section>

          <aside className="flex min-h-[520px] flex-col bg-card p-4 sm:p-5 lg:min-h-0">
            <AutoScrollingPreview template={template} alt={modalT("imageAlt", { name })} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function TemplateQrCode({ demoPath, name }: { demoPath: string; name: string }) {
  const modalT = useTranslations("templatePreviewModal");
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    let active = true;
    const demoUrl = new URL(demoPath, window.location.origin).toString();
    QRCode.toDataURL(demoUrl, {
      width: 240,
      margin: 1,
      color: { dark: "#5a2b28", light: "#ffffff" },
    })
      .then((value) => {
        if (active) setQrCode(value);
      })
      .catch(() => {
        if (active) setQrCode("");
      });

    return () => {
      active = false;
    };
  }, [demoPath]);

  return (
    <div className="flex size-20 items-center justify-center overflow-hidden rounded-lg bg-white p-1 shadow-sm">
      {qrCode ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrCode} alt={modalT("qrAlt", { name })} className="size-full" />
      ) : (
        <QrCode className="size-9 animate-pulse text-muted-foreground" aria-hidden />
      )}
    </div>
  );
}

function AutoScrollingPreview({ template, alt }: { template: ChungDoiTemplate; alt: string }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const image = imageRef.current;
    if (!image || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const animation = image.animate(
      [
        { objectPosition: "center top", offset: 0 },
        { objectPosition: "center top", offset: 0.04 },
        { objectPosition: "center bottom", offset: 0.96 },
        { objectPosition: "center bottom", offset: 1 },
      ],
      {
        duration: 26_000,
        iterations: Infinity,
        direction: "alternate",
        easing: "linear",
      },
    );

    if (pausedRef.current) animation.pause();
    animationRef.current = animation;

    return () => {
      animation.cancel();
      animationRef.current = null;
    };
  }, [template.slug]);

  const pause = () => {
    pausedRef.current = true;
    animationRef.current?.pause();
  };

  const resume = () => {
    pausedRef.current = false;
    animationRef.current?.play();
  };

  return (
    <div
      tabIndex={0}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      className="relative min-h-0 flex-1 overflow-hidden rounded-[1.4rem] border border-border bg-card shadow-[0_18px_45px_rgb(82_39_35/0.12)] [contain:strict] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={template.listing}
        alt={alt}
        className="absolute inset-0 block size-full object-cover object-top"
      />
    </div>
  );
}
