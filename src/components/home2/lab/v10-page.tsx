"use client";

import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Heart,
  ImageIcon,
  Link2,
  MapPin,
  MessageCircle,
  MousePointer2,
  Music2,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { createInvitation } from "@/app/dashboard/actions";
import { ContactFab } from "@/components/chungdoi-chrome";
import { loginHref, TEMPLATE_LIST_PATH } from "@/lib/auth-redirects";
import { templatePreviewUrl } from "@/lib/template-preview-url";

import { Home2Footer, Home2Header } from "../chrome";
import { Shell } from "../primitives";
import "./v10.css";

export type V10Template = {
  slug: string;
  name: string;
  portrait: string;
  demoPath: string;
};

const guestStageKeys = ["message", "invitation", "map", "rsvp"] as const;
const featureKeys = ["mobile", "map", "album", "music", "guests", "link"] as const;
const featureIcons = [
  MousePointer2,
  MapPin,
  ImageIcon,
  Music2,
  Users,
  Link2,
] as const;
const faqKeys = ["edit", "guest", "price"] as const;

export function V10Page({
  templates,
  templateCount,
  instantTemplateId,
}: {
  templates: V10Template[];
  templateCount: number;
  instantTemplateId: string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState(() =>
    templates.some((template) => template.slug === instantTemplateId)
      ? instantTemplateId
      : (templates[0]?.slug ?? instantTemplateId),
  );
  const [groom, setGroom] = useState("");
  const [bride, setBride] = useState("");
  const [activeGuestStage, setActiveGuestStage] = useState(0);
  const guestStepRefs = useRef<Array<HTMLElement | null>>([]);

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

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionPreference.matches) {
      root.style.setProperty("--v10-page-progress", "0");
      return;
    }

    let frame: number | null = null;
    const paintProgress = () => {
      frame = null;
      const scrollRange = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      const progress = Math.min(Math.max(window.scrollY / scrollRange, 0), 1);
      root.style.setProperty("--v10-page-progress", progress.toFixed(4));
    };
    const requestPaint = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(paintProgress);
    };

    requestPaint();
    window.addEventListener("scroll", requestPaint, { passive: true });
    window.addEventListener("resize", requestPaint);
    return () => {
      window.removeEventListener("scroll", requestPaint);
      window.removeEventListener("resize", requestPaint);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const steps = guestStepRefs.current.filter(
      (step): step is HTMLElement => step !== null,
    );
    if (steps.length === 0 || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (!visibleEntry) return;
        const stage = Number((visibleEntry.target as HTMLElement).dataset.stage);
        if (Number.isInteger(stage)) setActiveGuestStage(stage);
      },
      { rootMargin: "-38% 0px -38% 0px", threshold: 0 },
    );

    steps.forEach((step) => observer.observe(step));
    return () => observer.disconnect();
  }, []);

  const selectedTemplate =
    templates.find((template) => template.slug === selectedSlug) ?? templates[0];
  const createHref = loggedIn ? TEMPLATE_LIST_PATH : loginHref(TEMPLATE_LIST_PATH);

  if (!selectedTemplate) return null;

  return (
    <div ref={rootRef} className="home-editorial hp-v10">
      <V10Thread />
      <LabStrip />
      <Home2Header createHref={createHref} />
      <main>
        <Hero template={templates[0] ?? selectedTemplate} createHref={createHref} />
        <VibeSection
          templates={templates}
          templateCount={templateCount}
          selectedSlug={selectedTemplate.slug}
          onSelect={setSelectedSlug}
        />
        <PersonalizeSection
          template={selectedTemplate}
          groom={groom}
          bride={bride}
          onGroom={setGroom}
          onBride={setBride}
        />
        <GuestJourney
          template={selectedTemplate}
          groom={groom}
          bride={bride}
          activeStage={activeGuestStage}
          stepRefs={guestStepRefs}
        />
        <ProofSection templateCount={templateCount} />
        <FaqSection />
        <ClosingSection createHref={createHref} />
      </main>
      <Home2Footer />
      <ContactFab />
    </div>
  );
}

function V10Thread() {
  return (
    <div className="v10-thread" aria-hidden>
      <svg viewBox="0 0 24 100" preserveAspectRatio="none">
        <path
          className="v10-thread-rail"
          d="M12 0 C3 12 21 22 12 34 C3 46 21 58 12 70 C4 82 20 91 12 100"
        />
        <path
          className="v10-thread-progress"
          pathLength="1"
          d="M12 0 C3 12 21 22 12 34 C3 46 21 58 12 70 C4 82 20 91 12 100"
        />
      </svg>
      <span />
    </div>
  );
}

function LabStrip() {
  const t = useTranslations("homeLabV10.labStrip");

  return (
    <div className="v10-lab-strip">
      <Shell className="v10-lab-strip-inner">
        <span className="v10-kicker">{t("label")}</span>
        <span>{t("name")}</span>
        <NextLink href="/home-2/lab">{t("back")}</NextLink>
      </Shell>
    </div>
  );
}

function Hero({
  template,
  createHref,
}: {
  template: V10Template;
  createHref: string;
}) {
  const t = useTranslations("homeLabV10");

  return (
    <section className="v10-hero">
      <div className="v10-hero-burst" aria-hidden />
      <Shell className="v10-hero-grid">
        <div className="v10-hero-copy">
          <p className="v10-kicker">{t("hero.eyebrow")}</p>
          <h1 className="v10-display v10-hero-title">
            {t("hero.titleLead")} <em>{t("hero.titleAccent")}</em>
          </h1>
          <p className="v10-lede">{t("hero.lede")}</p>
          <div className="v10-hero-actions">
            <a href={createHref} className="v10-button v10-button-dark">
              {t("hero.ctaPrimary")}
              <ArrowRight aria-hidden />
            </a>
            <a href="#cach-hoat-dong" className="v10-text-link">
              {t("hero.ctaSecondary")}
              <ArrowDown aria-hidden />
            </a>
          </div>
          <p className="v10-hero-note">
            <Sparkles aria-hidden />
            {t("hero.note")}
          </p>
        </div>

        <div className="v10-envelope-stage">
          <span className="v10-pop-dot v10-pop-dot-one" aria-hidden />
          <span className="v10-pop-dot v10-pop-dot-two" aria-hidden />
          <div className="v10-envelope-back" aria-hidden />
          <div className="v10-hero-card">
            <V10InvitationCard template={template} priority />
          </div>
          <div className="v10-envelope-front" aria-hidden>
            <span>{t("hero.envelopeLabel")}</span>
          </div>
          <div className="v10-hero-seal" aria-hidden>
            {t("hero.seal")}
          </div>
        </div>
      </Shell>
    </section>
  );
}

function VibeSection({
  templates,
  templateCount,
  selectedSlug,
  onSelect,
}: {
  templates: V10Template[];
  templateCount: number;
  selectedSlug: string;
  onSelect: (slug: string) => void;
}) {
  const t = useTranslations("homeLabV10");

  return (
    <section id="cach-hoat-dong" className="v10-vibe-section">
      <Shell>
        <header className="v10-section-head">
          <p className="v10-kicker">{t("vibe.eyebrow")}</p>
          <h2 className="v10-display">{t("vibe.title")}</h2>
          <p>{t("vibe.lede", { count: templateCount })}</p>
        </header>

        <ol className="v10-vibe-stack">
          {templates.map((template, index) => {
            const selected = template.slug === selectedSlug;
            return (
              <li key={template.slug} data-tone={index + 1}>
                <article className="v10-vibe-card" data-selected={selected ? "true" : "false"}>
                  <button
                    type="button"
                    className="v10-vibe-select"
                    aria-pressed={selected}
                    onClick={() => onSelect(template.slug)}
                  >
                    <span className="v10-vibe-number" aria-hidden>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="v10-vibe-image">
                      <Image
                        src={templatePreviewUrl(template.portrait)}
                        alt={t("vibe.imageAlt", { name: template.name })}
                        fill
                        sizes="(max-width: 899px) 74vw, 28rem"
                        className="object-cover object-top"
                      />
                    </span>
                    <span className="v10-vibe-copy">
                      <span className="v10-vibe-label">
                        {selected ? t("vibe.selected") : t("vibe.tapToSelect")}
                      </span>
                      <strong>{template.name}</strong>
                    </span>
                    <span className="v10-vibe-check" aria-hidden>
                      <Check />
                    </span>
                  </button>
                  <NextLink href={template.demoPath} className="v10-vibe-demo">
                    {t("vibe.demo")}
                    <ArrowRight aria-hidden />
                  </NextLink>
                </article>
              </li>
            );
          })}
        </ol>
      </Shell>
    </section>
  );
}

function PersonalizeSection({
  template,
  groom,
  bride,
  onGroom,
  onBride,
}: {
  template: V10Template;
  groom: string;
  bride: string;
  onGroom: (value: string) => void;
  onBride: (value: string) => void;
}) {
  const t = useTranslations("homeLabV10");

  return (
    <section id="ca-nhan-hoa" className="v10-personalize-section">
      <Shell>
        <header className="v10-section-head v10-section-head-light">
          <p className="v10-kicker">{t("personalize.eyebrow")}</p>
          <h2 className="v10-display">{t("personalize.title")}</h2>
          <p>{t("personalize.lede")}</p>
        </header>

        <div className="v10-personalize-layout">
          <div className="v10-live-wrap">
            <p className="v10-live-label">
              <span aria-hidden />
              {t("personalize.liveLabel")}
            </p>
            <V10InvitationCard template={template} groom={groom} bride={bride} />
          </div>

          <form action={createInvitation} className="v10-name-sheet">
            <input type="hidden" name="templateId" value={template.slug} />
            <p className="v10-kicker">{t("personalize.formEyebrow")}</p>
            <h3 className="v10-display">{t("personalize.formTitle")}</h3>
            <p className="v10-selected-template">
              {t("personalize.selectedTemplate", { name: template.name })}
            </p>
            <div className="v10-fields">
              <label>
                <span>{t("personalize.groomLabel")}</span>
                <input
                  type="text"
                  name="groomShortName"
                  maxLength={24}
                  autoComplete="off"
                  value={groom}
                  placeholder={t("personalize.groomPlaceholder")}
                  onChange={(event) => onGroom(event.target.value)}
                />
              </label>
              <label>
                <span>{t("personalize.brideLabel")}</span>
                <input
                  type="text"
                  name="brideShortName"
                  maxLength={24}
                  autoComplete="off"
                  value={bride}
                  placeholder={t("personalize.bridePlaceholder")}
                  onChange={(event) => onBride(event.target.value)}
                />
              </label>
            </div>
            <p className="v10-form-note">{t("personalize.note")}</p>
            <button type="submit" className="v10-button v10-button-red">
              {t("personalize.cta")}
              <ArrowRight aria-hidden />
            </button>
          </form>
        </div>
      </Shell>
    </section>
  );
}

function GuestJourney({
  template,
  groom,
  bride,
  activeStage,
  stepRefs,
}: {
  template: V10Template;
  groom: string;
  bride: string;
  activeStage: number;
  stepRefs: React.MutableRefObject<Array<HTMLElement | null>>;
}) {
  const t = useTranslations("homeLabV10");

  return (
    <section id="khach-moi" className="v10-guest-section">
      <Shell>
        <header className="v10-section-head">
          <p className="v10-kicker">{t("guest.eyebrow")}</p>
          <h2 className="v10-display">{t("guest.title")}</h2>
          <p>{t("guest.lede")}</p>
        </header>

        <div className="v10-guest-layout">
          <div className="v10-phone-sticky">
            <p className="v10-phone-label">
              {t("guest.phoneLabel", {
                current: activeStage + 1,
                total: guestStageKeys.length,
              })}
            </p>
            <div className="v10-phone" aria-label={t("guest.phoneAriaLabel")}>
              <div className="v10-phone-speaker" aria-hidden />
              <div className="v10-phone-screen">
                {guestStageKeys.map((key, index) => (
                  <PhonePanel
                    key={key}
                    stage={key}
                    active={index === activeStage}
                    template={template}
                    groom={groom}
                    bride={bride}
                  />
                ))}
              </div>
            </div>
          </div>

          <ol className="v10-guest-steps">
            {guestStageKeys.map((key, index) => (
              <li key={key}>
                <article
                  ref={(node) => {
                    stepRefs.current[index] = node;
                  }}
                  data-stage={index}
                  data-active={index === activeStage ? "true" : "false"}
                  className="v10-guest-step"
                >
                  <span className="v10-step-code">
                    {t(`guest.steps.${key}.code`)}
                  </span>
                  <h3>{t(`guest.steps.${key}.title`)}</h3>
                  <p>{t(`guest.steps.${key}.copy`)}</p>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </Shell>
    </section>
  );
}

function PhonePanel({
  stage,
  active,
  template,
  groom,
  bride,
}: {
  stage: (typeof guestStageKeys)[number];
  active: boolean;
  template: V10Template;
  groom: string;
  bride: string;
}) {
  const t = useTranslations("homeLabV10");

  return (
    <div
      className={`v10-phone-panel v10-phone-panel-${stage}`}
      data-active={active ? "true" : "false"}
      aria-hidden={!active}
    >
      {stage === "message" ? (
        <>
          <div className="v10-chat-head">
            <MessageCircle aria-hidden />
            <span>{t("guest.phone.chatApp")}</span>
          </div>
          <div className="v10-chat-bubble">{t("guest.phone.chatMessage")}</div>
          <div className="v10-link-preview">
            <Heart aria-hidden />
            <strong>{t("guest.phone.previewTitle")}</strong>
            <span>{t("guest.phone.previewUrl")}</span>
          </div>
          <div className="v10-chat-sent">
            <CheckCircle2 aria-hidden />
            {t("guest.phone.sent")}
          </div>
        </>
      ) : null}

      {stage === "invitation" ? (
        <div className="v10-phone-invitation">
          <V10InvitationCard template={template} groom={groom} bride={bride} />
        </div>
      ) : null}

      {stage === "map" ? (
        <>
          <div className="v10-mini-map">
            <span className="v10-map-road" aria-hidden />
            <MapPin aria-hidden />
            <strong>{t("guest.phone.mapTitle")}</strong>
            <span>{t("guest.phone.mapDistance")}</span>
          </div>
          <div className="v10-mini-album">
            {["one", "two", "three"].map((frame) => (
              <span key={frame}>
                <Image
                  src={templatePreviewUrl(template.portrait)}
                  alt=""
                  fill
                  sizes="6rem"
                  className="object-cover"
                />
              </span>
            ))}
          </div>
          <p>{t("guest.phone.albumLabel")}</p>
        </>
      ) : null}

      {stage === "rsvp" ? (
        <>
          <div className="v10-rsvp-check" aria-hidden>
            <Check />
          </div>
          <p>{t("guest.phone.rsvpEyebrow")}</p>
          <strong>{t("guest.phone.rsvpTitle")}</strong>
          <span>{t("guest.phone.rsvpCopy")}</span>
          <div className="v10-rsvp-choice">
            <CheckCircle2 aria-hidden />
            {t("guest.phone.rsvpChoice")}
          </div>
        </>
      ) : null}
    </div>
  );
}

function ProofSection({ templateCount }: { templateCount: number }) {
  const t = useTranslations("homeLabV10");

  return (
    <section className="v10-proof-section">
      <Shell>
        <div className="v10-proof-head">
          <div>
            <p className="v10-kicker">{t("features.eyebrow")}</p>
            <h2 className="v10-display">{t("features.title")}</h2>
          </div>
          <p>{t("features.lede")}</p>
        </div>

        <ul className="v10-feature-grid">
          {featureKeys.map((key, index) => {
            const Icon = featureIcons[index];
            return (
              <li key={key} data-tone={index + 1}>
                <Icon aria-hidden />
                <h3>{t(`features.items.${key}.title`)}</h3>
                <p>{t(`features.items.${key}.copy`)}</p>
              </li>
            );
          })}
        </ul>

        <div className="v10-proof-band">
          <div>
            <strong>{t("features.proof.templateValue", { count: templateCount })}</strong>
            <span>{t("features.proof.templateLabel")}</span>
          </div>
          <div>
            <strong>{t("features.proof.timeValue")}</strong>
            <span>{t("features.proof.timeLabel")}</span>
          </div>
          <div>
            <strong>{t("features.proof.trialValue")}</strong>
            <span>{t("features.proof.trialLabel")}</span>
          </div>
        </div>

        <figure className="v10-testimonial">
          <span aria-hidden>“</span>
          <blockquote>{t("testimonial.quote")}</blockquote>
          <figcaption>
            <strong>{t("testimonial.name")}</strong>
            <span>{t("testimonial.role")}</span>
          </figcaption>
        </figure>
      </Shell>
    </section>
  );
}

function FaqSection() {
  const t = useTranslations("homeLabV10");

  return (
    <section className="v10-faq-section">
      <Shell className="v10-faq-layout">
        <header>
          <p className="v10-kicker">{t("faq.eyebrow")}</p>
          <h2 className="v10-display">{t("faq.title")}</h2>
          <p>{t("faq.lede")}</p>
        </header>
        <div className="v10-faq-list">
          {faqKeys.map((key) => (
            <details key={key}>
              <summary>
                <span>{t(`faq.items.${key}.question`)}</span>
                <ChevronDown aria-hidden />
              </summary>
              <p>{t(`faq.items.${key}.answer`)}</p>
            </details>
          ))}
        </div>
      </Shell>
    </section>
  );
}

function ClosingSection({ createHref }: { createHref: string }) {
  const t = useTranslations("homeLabV10");

  return (
    <section className="v10-closing-section">
      <Shell className="v10-closing-grid">
        <div className="v10-closing-art" aria-hidden>
          <span className="v10-closing-thread" />
          <span className="v10-closing-loop" />
          <span className="v10-closing-seal">{t("closing.seal")}</span>
        </div>
        <div className="v10-closing-copy">
          <p className="v10-kicker">{t("closing.eyebrow")}</p>
          <h2 className="v10-display">{t("closing.title")}</h2>
          <p>{t("closing.lede")}</p>
          <a href={createHref} className="v10-button v10-button-yellow">
            {t("closing.cta")}
            <Send aria-hidden />
          </a>
          <span className="v10-closing-note">{t("closing.note")}</span>
        </div>
      </Shell>
    </section>
  );
}

function V10InvitationCard({
  template,
  groom = "",
  bride = "",
  priority = false,
}: {
  template: V10Template;
  groom?: string;
  bride?: string;
  priority?: boolean;
}) {
  const t = useTranslations("homeLabV10.card");
  const groomName = groom.trim() || t("groomFallback");
  const brideName = bride.trim() || t("brideFallback");

  return (
    <div className="v10-invitation-card">
      <div className="v10-card-ribbon">
        <Heart aria-hidden />
        {t("badge")}
      </div>
      <div className="v10-card-image">
        <Image
          src={templatePreviewUrl(template.portrait)}
          alt={t("imageAlt", { name: template.name })}
          fill
          priority={priority}
          sizes="(max-width: 899px) 72vw, 24rem"
          className="object-cover object-top"
        />
      </div>
      <div className="v10-card-body">
        <span>{t("invite")}</span>
        <strong>
          {groomName} <i>&</i> {brideName}
        </strong>
        <time>{t("date")}</time>
        <p>
          <CalendarDays aria-hidden />
          {t("venue")}
        </p>
      </div>
      <span className="v10-card-template">{template.name}</span>
    </div>
  );
}
