"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Link2,
  MapPin,
  MessageCircle,
  PenLine,
  RefreshCw,
  Send,
  Sparkles,
  Smartphone,
  Users,
} from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

import { createInvitation } from "@/app/dashboard/actions";
import { ContactFab } from "@/components/chungdoi-chrome";
import { loginHref, TEMPLATE_LIST_PATH } from "@/lib/auth-redirects";

import { Home2Footer, Home2Header } from "../chrome";
import { Shell } from "../primitives";
import { useV11Motion } from "./v11-motion";
import "./v11.css";

const ASSET_ROOT = "/chungdoi/images/home-2/lab/v11";
const guestStageKeys = ["message", "invitation", "map", "rsvp"] as const;
const capabilityKeys = ["map", "guests", "updates"] as const;
const capabilityIcons = [MapPin, Users, RefreshCw] as const;
const faqKeys = ["edit", "guest", "price"] as const;

type GuestStage = (typeof guestStageKeys)[number];

export type V11Template = {
  slug: string;
  name: string;
  portrait: string;
  demoPath: string;
};

export function V11Page({
  instantTemplateId,
  templateCount,
  templates,
}: {
  instantTemplateId: string;
  templateCount: number;
  templates: V11Template[];
}) {
  const t = useTranslations("homeLabV11");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const guestStepRefs = useRef<Array<HTMLElement | null>>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [groom, setGroom] = useState(() => t("invitation.groomFallback"));
  const [bride, setBride] = useState(() => t("invitation.brideFallback"));
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState(
    () => templates[0]?.slug ?? instantTemplateId,
  );
  const [activeGuestStage, setActiveGuestStage] = useState(0);
  const reducedMotion = useV11Motion(rootRef);

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
    const steps = guestStepRefs.current.filter(
      (step): step is HTMLElement => step !== null,
    );
    if (steps.length === 0 || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const stage = Number((visible.target as HTMLElement).dataset.stage);
        if (Number.isInteger(stage)) setActiveGuestStage(stage);
      },
      {
        rootMargin: "-28% 0px -44% 0px",
        threshold: [0, 0.25, 0.6],
      },
    );

    steps.forEach((step) => observer.observe(step));
    return () => observer.disconnect();
  }, []);

  const createHref = loggedIn ? TEMPLATE_LIST_PATH : loginHref(TEMPLATE_LIST_PATH);
  const groomName = groom.trim() || t("invitation.groomFallback");
  const brideName = bride.trim() || t("invitation.brideFallback");
  const selectedTemplate =
    templates.find((template) => template.slug === selectedTemplateSlug)
    ?? templates[0];
  const selectedTemplateId = selectedTemplate?.slug ?? instantTemplateId;

  return (
    <div
      ref={rootRef}
      className="home-editorial hp-v11"
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      <LabStrip />
      <Home2Header createHref={createHref} />
      <main>
        <EditorialHero
          templateId={selectedTemplateId}
          groom={groom}
          bride={bride}
          groomName={groomName}
          brideName={brideName}
          onGroom={setGroom}
          onBride={setBride}
        />
        <ManifestoBand />
        <StoryChapter templateCount={templateCount} />
        <TemplateShowcase
          templates={templates}
          selectedTemplateSlug={selectedTemplateId}
          templateCount={templateCount}
          onSelect={setSelectedTemplateSlug}
        />
        <InvitationStudio
          instantTemplateId={selectedTemplateId}
          groom={groom}
          bride={bride}
          groomName={groomName}
          brideName={brideName}
          onGroom={setGroom}
          onBride={setBride}
        />
        <MaterialChapter />
        <GuestJourney
          activeStage={activeGuestStage}
          stepRefs={guestStepRefs}
          groomName={groomName}
          brideName={brideName}
        />
        <CommerceChapter createHref={createHref} />
        <Finale createHref={createHref} templates={templates} />
      </main>
      <Home2Footer />
      <ContactFab />
    </div>
  );
}

function LabStrip() {
  const t = useTranslations("homeLabV11.labStrip");

  return (
    <div className="v11-lab-strip">
      <Shell className="v11-lab-strip-inner">
        <span className="v11-kicker">{t("label")}</span>
        <span>{t("name")}</span>
        <NextLink href="/home-2/lab">{t("back")}</NextLink>
      </Shell>
    </div>
  );
}

function EditorialHero({
  templateId,
  groom,
  bride,
  groomName,
  brideName,
  onGroom,
  onBride,
}: {
  templateId: string;
  groom: string;
  bride: string;
  groomName: string;
  brideName: string;
  onGroom: (value: string) => void;
  onBride: (value: string) => void;
}) {
  const t = useTranslations("homeLabV11");

  return (
    <section className="v11-hero-track" aria-labelledby="v11-hero-title">
      <div className="v11-hero-sticky">
        <div className="v11-hero-bg" aria-hidden />
        <div className="v11-hero-vignette" aria-hidden />

        <div className="v11-hero-person v11-hero-bride" aria-hidden>
          <Image
            src={`${ASSET_ROOT}/layers/bride-cutout.png`}
            alt=""
            fill
            priority
            quality={92}
            sizes="(max-width: 899px) 100vw, 48vw"
            className="object-contain object-bottom"
          />
        </div>
        <div className="v11-hero-person v11-hero-groom" aria-hidden>
          <Image
            src={`${ASSET_ROOT}/layers/groom-cutout.png`}
            alt=""
            fill
            priority
            quality={92}
            sizes="(max-width: 899px) 100vw, 44vw"
            className="object-contain object-bottom"
          />
        </div>

        <div className="v11-hero-invitation" aria-hidden>
          <Image
            src={`${ASSET_ROOT}/invitation-paper-object.png`}
            alt=""
            fill
            priority
            quality={92}
            sizes="(max-width: 899px) 68vw, 28vw"
            className="object-contain"
          />
          <div className="v11-hero-card-copy">
            <span>{t("hero.cardEyebrow")}</span>
            <strong>{groomName} &amp; {brideName}</strong>
            <time>{t("hero.cardDate")}</time>
          </div>
        </div>

        <div className="v11-hero-ribbon" aria-hidden>
          <Image
            src={`${ASSET_ROOT}/organza-motion-overlay.png`}
            alt=""
            fill
            priority
            quality={88}
            sizes="100vw"
            className="object-contain"
          />
        </div>

        <div className="v11-hero-copy">
          <p className="v11-kicker">{t("hero.eyebrow")}</p>
          <h1 id="v11-hero-title" className="v11-display v11-hero-title">
            <span>{t("hero.titleLead")}</span>
            <em>{t("hero.titleAccent")}</em>
          </h1>
          <p className="v11-hero-lede">{t("hero.lede")}</p>
          <form action={createInvitation} className="v11-hero-personalizer">
            <input type="hidden" name="templateId" value={templateId} />
            <label>
              <span>{t("invitation.groomLabel")}</span>
              <input
                type="text"
                name="groomShortName"
                maxLength={24}
                autoComplete="off"
                value={groom}
                placeholder={t("invitation.groomPlaceholder")}
                onChange={(event) => onGroom(event.target.value)}
              />
            </label>
            <i aria-hidden>&amp;</i>
            <label>
              <span>{t("invitation.brideLabel")}</span>
              <input
                type="text"
                name="brideShortName"
                maxLength={24}
                autoComplete="off"
                value={bride}
                placeholder={t("invitation.bridePlaceholder")}
                onChange={(event) => onBride(event.target.value)}
              />
            </label>
            <button type="submit" className="v11-button v11-button-ink">
              {t("hero.ctaPrimary")}
              <ArrowRight aria-hidden />
            </button>
          </form>
          <div className="v11-hero-actions">
            <NextLink href="#cach-hoat-dong" className="v11-text-link">
              {t("hero.ctaSecondary")}
              <ArrowDown aria-hidden />
            </NextLink>
          </div>
          <p className="v11-hero-note">
            <Sparkles aria-hidden />
            {t("hero.note")}
          </p>
        </div>

        <div className="v11-scroll-cue" aria-hidden>
          <span>{t("hero.scrollHint")}</span>
          <i />
        </div>
      </div>
    </section>
  );
}

function ManifestoBand() {
  const t = useTranslations("homeLabV11.manifesto");

  return (
    <section className="v11-manifesto" aria-label={t("ariaLabel")}>
      <Shell>
        <p className="v11-kicker">{t("eyebrow")}</p>
        <p className="v11-display v11-manifesto-copy">
          <span className="v11-manifesto-line">{t("lineOne")}</span>
          <span className="v11-manifesto-line">
            <em>{t("lineTwo")}</em>
          </span>
        </p>
      </Shell>
    </section>
  );
}

function StoryChapter({ templateCount }: { templateCount: number }) {
  const t = useTranslations("homeLabV11");

  return (
    <section id="cach-hoat-dong" className="v11-story-section" aria-labelledby="v11-story-title">
      <div className="v11-story-frame">
        <div className="v11-story-image">
          <Image
            src={`${ASSET_ROOT}/story/couple-editorial-wide.png`}
            alt={t("story.imageAlt")}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="v11-story-shade" aria-hidden />
        <Shell className="v11-story-copy">
          <div data-v11-reveal>
            <p className="v11-kicker">{t("story.eyebrow")}</p>
            <h2 id="v11-story-title" className="v11-display">
              {t("story.title")}
            </h2>
            <p>{t("story.lede")}</p>
          </div>
        </Shell>
      </div>

      <Shell className="v11-story-proof">
        <blockquote data-v11-reveal>“{t("story.quote")}”</blockquote>
        <dl data-v11-reveal>
          <div>
            <dt>{t("story.proof.templatesLabel")}</dt>
            <dd>{t("story.proof.templatesValue", { count: templateCount })}</dd>
          </div>
          <div>
            <dt>{t("story.proof.timeLabel")}</dt>
            <dd>{t("story.proof.timeValue")}</dd>
          </div>
          <div>
            <dt>{t("story.proof.trialLabel")}</dt>
            <dd>{t("story.proof.trialValue")}</dd>
          </div>
        </dl>
      </Shell>
    </section>
  );
}

function TemplateShowcase({
  templates,
  selectedTemplateSlug,
  templateCount,
  onSelect,
}: {
  templates: V11Template[];
  selectedTemplateSlug: string;
  templateCount: number;
  onSelect: (slug: string) => void;
}) {
  const t = useTranslations("homeLabV11.templates");

  return (
    <section id="mau-thiep" className="v11-template-section" aria-labelledby="v11-template-title">
      <Shell>
        <header className="v11-template-head" data-v11-reveal>
          <div>
            <p className="v11-kicker">{t("eyebrow")}</p>
            <h2 id="v11-template-title" className="v11-display">
              {t("title")}
            </h2>
          </div>
          <p>{t("lede")}</p>
        </header>

        <div className="v11-template-deck">
          {templates.map((template, index) => {
            const selected = template.slug === selectedTemplateSlug;
            return (
              <article
                key={template.slug}
                className={`v11-template-card v11-template-card-${index + 1}`}
                data-selected={selected ? "true" : "false"}
                data-template={template.slug}
              >
                <button
                  type="button"
                  className="v11-template-select"
                  aria-pressed={selected}
                  onClick={() => onSelect(template.slug)}
                >
                  <span className="v11-template-image">
                    <Image
                      src={template.portrait}
                      alt={t("imageAlt", { name: template.name })}
                      fill
                      quality={90}
                      sizes="(max-width: 639px) 72vw, (max-width: 1023px) 38vw, 20vw"
                      className="object-cover"
                    />
                  </span>
                  <span className="v11-template-meta">
                    <i>{String(index + 1).padStart(2, "0")}</i>
                    <strong>{template.name}</strong>
                    <em>{selected ? t("selected") : t("choose")}</em>
                  </span>
                </button>
                <NextLink href={template.demoPath} className="v11-template-demo">
                  {t("demo")}
                  <ArrowUpRight aria-hidden />
                </NextLink>
              </article>
            );
          })}
        </div>

        <NextLink href="/mau-thiep" className="v11-template-all" data-v11-reveal>
          {t("all", { count: templateCount })}
          <ArrowRight aria-hidden />
        </NextLink>
      </Shell>
    </section>
  );
}

function InvitationStudio({
  instantTemplateId,
  groom,
  bride,
  groomName,
  brideName,
  onGroom,
  onBride,
}: {
  instantTemplateId: string;
  groom: string;
  bride: string;
  groomName: string;
  brideName: string;
  onGroom: (value: string) => void;
  onBride: (value: string) => void;
}) {
  const t = useTranslations("homeLabV11.invitation");

  return (
    <section className="v11-studio-section" aria-labelledby="v11-studio-title">
      <Shell>
        <header className="v11-studio-head" data-v11-reveal>
          <div>
            <p className="v11-kicker">{t("eyebrow")}</p>
            <h2 id="v11-studio-title" className="v11-display">
              {t("title")}
            </h2>
          </div>
          <p>{t("lede")}</p>
        </header>

        <div className="v11-studio-grid">
          <div className="v11-paper-stage" data-v11-reveal>
            <div className="v11-paper-halo" aria-hidden />
            <div className="v11-paper-object" aria-hidden>
              <Image
                src={`${ASSET_ROOT}/invitation-paper-object.png`}
                alt=""
                fill
                sizes="(max-width: 899px) 92vw, 52vw"
                className="object-contain"
              />
            </div>
            <article className="v11-live-card" aria-live="polite">
              <span>{t("cardEyebrow")}</span>
              <strong>
                {groomName} <i>&</i> {brideName}
              </strong>
              <time>{t("cardDate")}</time>
              <p>
                <CalendarDays aria-hidden />
                {t("cardVenue")}
              </p>
            </article>
            <p className="v11-live-status">
              <span aria-hidden />
              {t("liveLabel")}
            </p>
          </div>

          <form action={createInvitation} className="v11-name-form" data-v11-reveal>
            <input type="hidden" name="templateId" value={instantTemplateId} />
            <p className="v11-kicker">
              <PenLine aria-hidden />
              {t("formEyebrow")}
            </p>
            <h3 className="v11-display">{t("formTitle")}</h3>
            <div className="v11-fields">
              <label>
                <span>{t("groomLabel")}</span>
                <input
                  type="text"
                  name="groomShortName"
                  maxLength={24}
                  autoComplete="off"
                  value={groom}
                  placeholder={t("groomPlaceholder")}
                  onChange={(event) => onGroom(event.target.value)}
                />
              </label>
              <label>
                <span>{t("brideLabel")}</span>
                <input
                  type="text"
                  name="brideShortName"
                  maxLength={24}
                  autoComplete="off"
                  value={bride}
                  placeholder={t("bridePlaceholder")}
                  onChange={(event) => onBride(event.target.value)}
                />
              </label>
            </div>
            <p className="v11-form-note">{t("formNote")}</p>
            <button type="submit" className="v11-button v11-button-wine">
              {t("cta")}
              <ArrowRight aria-hidden />
            </button>
          </form>
        </div>
      </Shell>
    </section>
  );
}

function MaterialChapter() {
  const t = useTranslations("homeLabV11");

  return (
    <section className="v11-material-section" aria-labelledby="v11-material-title">
      <Shell className="v11-material-grid">
        <div className="v11-veil-frame" data-v11-reveal>
          <div className="v11-veil-image">
            <Image
              src={`${ASSET_ROOT}/story/bride-veil-closeup.png`}
              alt={t("material.imageAlt")}
              fill
              sizes="(max-width: 899px) 92vw, 46vw"
              className="object-cover"
            />
          </div>
          <span className="v11-veil-index" aria-hidden>
            {t("material.index")}
          </span>
        </div>

        <div className="v11-material-copy">
          <header data-v11-reveal>
            <p className="v11-kicker">{t("material.eyebrow")}</p>
            <h2 id="v11-material-title" className="v11-display">
              {t("material.title")}
            </h2>
            <p>{t("material.lede")}</p>
          </header>

          <ul className="v11-capabilities">
            {capabilityKeys.map((key, index) => {
              const Icon = capabilityIcons[index];
              return (
                <li key={key} data-v11-reveal>
                  <Icon aria-hidden />
                  <div>
                    <h3>{t(`material.items.${key}.title`)}</h3>
                    <p>{t(`material.items.${key}.copy`)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Shell>
    </section>
  );
}

function GuestJourney({
  activeStage,
  stepRefs,
  groomName,
  brideName,
}: {
  activeStage: number;
  stepRefs: MutableRefObject<Array<HTMLElement | null>>;
  groomName: string;
  brideName: string;
}) {
  const t = useTranslations("homeLabV11");

  return (
    <section id="khach-moi" className="v11-guest-section" aria-labelledby="v11-guest-title">
      <Shell>
        <header className="v11-guest-head" data-v11-reveal>
          <div>
            <p className="v11-kicker">{t("guest.eyebrow")}</p>
            <h2 id="v11-guest-title" className="v11-display">
              {t("guest.title")}
            </h2>
          </div>
          <p>{t("guest.lede")}</p>
        </header>

        <div className="v11-guest-layout">
          <div className="v11-phone-sticky">
            <p className="v11-phone-label" aria-live="polite">
              <Smartphone aria-hidden />
              {t("guest.phoneLabel", {
                current: activeStage + 1,
                total: guestStageKeys.length,
              })}
            </p>
            <div className="v11-phone" aria-label={t("guest.phoneAriaLabel")}>
              <div className="v11-phone-camera" aria-hidden />
              <div className="v11-phone-screen">
                {guestStageKeys.map((stage, index) => (
                  <PhonePanel
                    key={stage}
                    stage={stage}
                    active={index === activeStage}
                    groomName={groomName}
                    brideName={brideName}
                  />
                ))}
              </div>
            </div>
          </div>

          <ol className="v11-guest-steps">
            {guestStageKeys.map((key, index) => (
              <li key={key}>
                <article
                  ref={(node) => {
                    stepRefs.current[index] = node;
                  }}
                  data-stage={index}
                  data-active={index === activeStage ? "true" : "false"}
                  className="v11-guest-step"
                >
                  <span>{t(`guest.steps.${key}.code`)}</span>
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
  groomName,
  brideName,
}: {
  stage: GuestStage;
  active: boolean;
  groomName: string;
  brideName: string;
}) {
  const t = useTranslations("homeLabV11.guest.phone");
  const groomInitial = Array.from(groomName.trim())[0]?.toLocaleUpperCase("vi") ?? "";
  const brideInitial = Array.from(brideName.trim())[0]?.toLocaleUpperCase("vi") ?? "";

  return (
    <div
      className={`v11-phone-panel v11-phone-panel-${stage}`}
      data-active={active ? "true" : "false"}
      aria-hidden={!active}
    >
      {stage === "message" ? (
        <>
          <div className="v11-chat-head">
            <MessageCircle aria-hidden />
            <span>{t("chatApp")}</span>
          </div>
          <div className="v11-chat-bubble">{t("chatMessage")}</div>
          <div className="v11-link-preview">
            <span className="v11-link-monogram" aria-hidden>
              {groomInitial}<em>&</em>{brideInitial}
            </span>
            <div>
              <strong>{t("previewTitle", { groom: groomName, bride: brideName })}</strong>
              <span>{t("previewUrl")}</span>
            </div>
            <Link2 aria-hidden />
          </div>
          <p className="v11-chat-sent">
            <CheckCircle2 aria-hidden />
            {t("sent")}
          </p>
        </>
      ) : null}

      {stage === "invitation" ? (
        <div className="v11-phone-invitation">
          <span>{t("inviteEyebrow")}</span>
          <strong>
            {groomName} <i>&</i> {brideName}
          </strong>
          <time>{t("inviteDate")}</time>
          <p>{t("inviteVenue")}</p>
        </div>
      ) : null}

      {stage === "map" ? (
        <>
          <div className="v11-mini-map">
            <span className="v11-map-road v11-map-road-one" aria-hidden />
            <span className="v11-map-road v11-map-road-two" aria-hidden />
            <span className="v11-map-pin">
              <MapPin aria-hidden />
            </span>
          </div>
          <div className="v11-map-copy">
            <span>{t("mapEyebrow")}</span>
            <strong>{t("mapTitle")}</strong>
            <p>{t("mapDistance")}</p>
          </div>
        </>
      ) : null}

      {stage === "rsvp" ? (
        <div className="v11-rsvp-panel">
          <span className="v11-rsvp-check" aria-hidden>
            <Check />
          </span>
          <p>{t("rsvpEyebrow")}</p>
          <strong>{t("rsvpTitle")}</strong>
          <span>{t("rsvpCopy")}</span>
          <div className="v11-rsvp-choice">
            <CheckCircle2 aria-hidden />
            {t("rsvpChoice")}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CommerceChapter({ createHref }: { createHref: string }) {
  const t = useTranslations("homeLabV11.commerce");

  return (
    <section className="v11-commerce-section" aria-labelledby="v11-commerce-title">
      <Shell>
        <header className="v11-commerce-head" data-v11-reveal>
          <p className="v11-kicker">{t("eyebrow")}</p>
          <h2 id="v11-commerce-title" className="v11-display">
            {t("title")}
          </h2>
        </header>

        <div className="v11-commerce-grid">
          <blockquote className="v11-proof-card" data-v11-reveal>
            <MessageCircle aria-hidden />
            <p>“{t("proof.quote")}”</p>
            <footer>
              <strong>{t("proof.name")}</strong>
              <span>{t("proof.role")}</span>
            </footer>
          </blockquote>

          <article className="v11-pricing-card" data-v11-reveal>
            <p className="v11-kicker">{t("pricing.eyebrow")}</p>
            <h3>{t("pricing.title")}</h3>
            <ul>
              {(["trial", "once", "forever"] as const).map((key) => (
                <li key={key}>
                  <CheckCircle2 aria-hidden />
                  <span>
                    <strong>{t(`pricing.items.${key}.title`)}</strong>
                    {t(`pricing.items.${key}.copy`)}
                  </span>
                </li>
              ))}
            </ul>
            <div>
              <a href={createHref} className="v11-button v11-button-wine">
                {t("pricing.createCta")}
                <ArrowRight aria-hidden />
              </a>
              <NextLink href="/bang-gia" className="v11-text-link">
                {t("pricing.cta")}
                <ArrowUpRight aria-hidden />
              </NextLink>
            </div>
          </article>
        </div>

        <div className="v11-faq" data-v11-reveal>
          <div>
            <p className="v11-kicker">{t("faq.eyebrow")}</p>
            <h3 className="v11-display">{t("faq.title")}</h3>
            <p>{t("faq.lede")}</p>
          </div>
          <div className="v11-faq-list">
            {faqKeys.map((key) => (
              <details key={key}>
                <summary>{t(`faq.items.${key}.question`)}</summary>
                <p>{t(`faq.items.${key}.answer`)}</p>
              </details>
            ))}
          </div>
        </div>
      </Shell>
    </section>
  );
}

function Finale({
  createHref,
  templates,
}: {
  createHref: string;
  templates: V11Template[];
}) {
  const t = useTranslations("homeLabV11.finale");

  return (
    <section className="v11-finale" aria-labelledby="v11-finale-title">
      <div className="v11-finale-shade" aria-hidden />
      <div className="v11-reply-cards" aria-hidden>
        {templates.slice(0, 8).map((template, index) => (
          <span
            key={template.slug}
            className={`v11-reply-card v11-reply-card-${index + 1}`}
          >
            <Image
              src={template.portrait}
              alt=""
              fill
              quality={84}
              sizes="(max-width: 639px) 32vw, 16vw"
              className="object-cover"
            />
          </span>
        ))}
      </div>
      <Shell className="v11-finale-copy">
        <div data-v11-reveal>
          <p className="v11-kicker">{t("eyebrow")}</p>
          <h2 id="v11-finale-title" className="v11-display">
            {t("titleLead")} <em>{t("titleAccent")}</em>
          </h2>
          <p>{t("lede")}</p>
          <div className="v11-finale-actions">
            <a href={createHref} className="v11-button v11-button-light">
              {t("cta")}
              <Send aria-hidden />
            </a>
            <NextLink href="/bang-gia" className="v11-text-link v11-text-link-light">
              {t("secondaryCta")}
              <ArrowRight aria-hidden />
            </NextLink>
          </div>
          <span className="v11-finale-note">{t("note")}</span>
        </div>
      </Shell>
    </section>
  );
}
