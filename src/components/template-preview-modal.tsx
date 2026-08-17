"use client";

import { ArrowRight, Check, QrCode, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

import { createInvitation } from "@/app/dashboard/actions";
import { useTemplateName } from "@/components/template-name-overrides";
import { Link } from "@/i18n/navigation";
import { getVietnameseTemplateSlug, type ChungDoiTemplate } from "@/data/chungdoi";
import { templatePreviewOptimizedUrl } from "@/lib/template-preview-url";

export function demoSlug(template: ChungDoiTemplate, locale: string) {
  return locale === "vi" ? getVietnameseTemplateSlug(template.slug) : template.slug;
}

export function TemplatePreviewModal({ template, onClose }: { template: ChungDoiTemplate; onClose: () => void }) {
  const t = useTranslations("listing");
  const modalT = useTranslations("templatePreviewModal");
  const locale = useLocale();
  const templateName = useTemplateName();
  const isVietnamese = locale === "vi";
  const name = templateName(
    template.slug,
    isVietnamese ? t(`templates.${template.slug}.name`) : template.name,
  );
  const description = isVietnamese ? t(`templates.${template.slug}.description`) : template.description;
  const category = isVietnamese ? t(`categories.${template.category}`) : template.category;
  const color = isVietnamese ? t(`colors.${template.color}`) : template.color;
  const localizedSlug = demoSlug(template, locale);
  const demoPath = locale === "vi"
    ? `/mau-thiep/${localizedSlug}/demo`
    : `/${locale}/templates/${localizedSlug}/demo`;

  const features = [
    modalT("editSimple"),
    modalT("unlimitedUpload"),
    modalT("googleMapsLink"),
    modalT("multiLanguage"),
    modalT("guestName"),
    modalT("shareLink"),
    modalT("attendanceConfirmed"),
    modalT("receiveWishes"),
    modalT("qrCodeDemo"),
    modalT("photoUploadAfterWedding"),
  ];

  useEffect(() => {
    const original = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

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
      <div className="isolate flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-full max-w-[67.5rem] flex-col overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl [&>div]:overscroll-contain [&>div]:touch-pan-y [&>header]:shrink-0 sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)] lg:h-[min(760px,calc(100dvh-2rem))]">
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

        <div className="mx-6 mb-3 hidden shrink-0 grid-cols-[80px_1fr] items-center gap-3 rounded-xl bg-secondary/70 p-3 sm:grid">
          <TemplateQrCode demoPath={demoPath} name={name} />
          <div>
            <h3 className="text-sm font-black leading-4 text-foreground">{modalT("phonePreviewTitle")}</h3>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
              {modalT("phonePreviewDescription")}
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:overflow-hidden">
          <section className="flex min-h-0 shrink-0 flex-col bg-card p-5 sm:p-6 lg:overflow-hidden lg:p-6">
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

            <div className="mt-4 grid gap-4">
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
                  <ul className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
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
                <div className="hidden">
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

          <aside className="flex h-[60dvh] min-h-[320px] flex-none flex-col bg-card p-4 sm:h-[65dvh] sm:p-5 lg:h-auto lg:min-h-0 lg:flex-1">
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
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const source = templatePreviewOptimizedUrl(template.listing, 384);

  useEffect(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let animation: Animation | null = null;
    let animationFrame = 0;
    let disposed = false;

    const rebuildAnimation = () => {
      window.cancelAnimationFrame(animationFrame);
      animation?.cancel();
      animation = null;
      image.style.transform = "translate3d(0, 0, 0)";

      if (
        disposed ||
        reduceMotion.matches ||
        !image.complete ||
        image.naturalWidth === 0 ||
        image.getAttribute("src") !== source
      ) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        const travel = Math.max(0, image.offsetHeight - container.clientHeight);
        if (disposed || travel < 1) return;

        animation = image.animate(
          [
            { transform: "translate3d(0, 0, 0)", offset: 0 },
            { transform: "translate3d(0, 0, 0)", offset: 0.04 },
            { transform: `translate3d(0, -${travel}px, 0)`, offset: 0.96 },
            { transform: `translate3d(0, -${travel}px, 0)`, offset: 1 },
          ],
          {
            duration: 26_000,
            iterations: Infinity,
            direction: "alternate",
            easing: "linear",
          },
        );
      });
    };

    const handleImageReady = () => {
      void image.decode().catch(() => undefined).then(rebuildAnimation);
    };
    const pauseOnFinePointer = () => animation?.pause();
    const resumeOnFinePointer = () => animation?.play();
    const resizeObserver = new ResizeObserver(rebuildAnimation);

    image.addEventListener("load", handleImageReady);
    resizeObserver.observe(container);
    resizeObserver.observe(image);
    reduceMotion.addEventListener("change", rebuildAnimation);
    if (finePointer.matches) {
      container.addEventListener("pointerenter", pauseOnFinePointer);
      container.addEventListener("pointerleave", resumeOnFinePointer);
    }
    if (image.complete && image.naturalWidth > 0) handleImageReady();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      animation?.cancel();
      image.removeEventListener("load", handleImageReady);
      resizeObserver.disconnect();
      reduceMotion.removeEventListener("change", rebuildAnimation);
      container.removeEventListener("pointerenter", pauseOnFinePointer);
      container.removeEventListener("pointerleave", resumeOnFinePointer);
    };
  }, [source]);

  return (
    <div
      ref={containerRef}
      className="relative min-h-0 flex-1 overflow-hidden rounded-[1.4rem] border border-border bg-card shadow-[0_18px_45px_rgb(82_39_35/0.12)] [contain:strict]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={source}
        srcSet={`${source} 1x, ${templatePreviewOptimizedUrl(template.listing, 640)} 2x`}
        alt={alt}
        className="absolute inset-x-0 top-0 block h-auto w-full max-w-none will-change-transform"
      />
    </div>
  );
}
