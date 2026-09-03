"use client";

import { ArrowDown, ArrowRight, Compass } from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState, type RefObject } from "react";

import { templatePreviewUrl } from "@/lib/template-preview-url";

import { Shell } from "../primitives";
import type { ImageSize } from "../sections-bottom";
import { InvitationCard } from "./v9-invitation-card";
import { useJourneyMotion, useReducedMotion } from "./v9-journey-motion";
import {
  StationFeatures,
  StationGuests,
  StationNameForm,
  StationTemplates,
} from "./v9-station-assets";
import {
  CARD_KEYS,
  lerp,
  smoothstep,
  TEXT_IN_START,
  TEXT_OUT_END,
  V9_STATIONS,
  type V9Frame,
  type V9TemplateShot,
} from "./v9-stations";

/* Danh sách trạm, hằng số nhịp cuộn, helper và bộ máy ScrollTrigger đã chuyển
   sang `v9-stations.ts` + `v9-journey-motion.ts`, vì bản mobile
   (`v9-mobile-journey.tsx`) dùng chung đúng những thứ đó. File này giờ chỉ còn
   phần riêng của desktop: tấm thiệp bay ngang qua sáu khối chữ so le hai bên. */

export function V9Hero({
  shot,
  createHref,
}: {
  shot: V9TemplateShot;
  createHref: string;
}) {
  const t = useTranslations("homeLabV9");
  const stats = [t("hero.stat1"), t("hero.stat2"), t("hero.stat3")];

  return (
    <section className="v9-hero hp-grain">
      <div className="v9-map-grid" aria-hidden />
      <div className="v9-hero-route" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <Shell className="v9-hero-grid relative z-10 grid items-center gap-12 py-16 lg:grid-cols-[1.04fr_0.96fr] lg:py-20">
        <div className="v9-hero-copy">
          <p className="hp-label flex items-center gap-3 text-[color:var(--v9-coral)]">
            <Compass className="size-4" strokeWidth={1.5} />
            {t("hero.eyebrow")}
          </p>
          <h1 className="hp-display hp-h1 mt-7 max-w-[45rem]">
            {t("hero.titleLead")} {" "}
            <span className="hp-display-italic text-[color:var(--v9-coral)]">
              {t("hero.titleAccent")}
            </span>
          </h1>
          <p className="hp-body mt-8 max-w-[38rem] text-[color:var(--v9-cream-soft)]">
            {t("hero.lede")}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href={createHref} className="hp-btn v9-btn-light">
              {t("hero.ctaPrimary")}
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </a>
            <NextLink href="/mau-thiep" className="v9-hero-link">
              {t("hero.ctaSecondary")}
            </NextLink>
          </div>
          <ul className="mt-11 grid max-w-[42rem] gap-px border-y border-white/15 sm:grid-cols-3">
            {stats.map((stat, index) => (
              <li key={stat} className="v9-hero-stat py-4 sm:px-4 sm:first:pl-0">
                <span className="hp-num text-[color:var(--v9-gold)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="hp-body-sm ml-3 text-[color:var(--v9-cream-soft)]">
                  {stat}
                </span>
              </li>
            ))}
          </ul>
          <p className="v9-scroll-hint hp-label mt-9 flex items-center gap-3 text-[color:var(--v9-cream-soft)]">
            <ArrowDown className="size-4" strokeWidth={1.5} />
            {t("hero.scrollHint")}
          </p>
        </div>

        <div className="v9-hero-visual" aria-label={shot.name}>
          <div className="v9-passport" aria-hidden>
            <div className="v9-passport-emblem"><Compass /></div>
            <p>{t("hero.passportLabel")}</p>
            <strong>{t("hero.passportCode")}</strong>
          </div>
          <div className="v9-boarding-pass" aria-hidden>
            <span>{t("hero.boardingLabel")}</span>
            <strong>{t("hero.routeFrom")}</strong>
            <i />
            <strong>{t("hero.routeTo")}</strong>
          </div>
          <div className="v9-hero-invitation">
            <div className="v9-hero-invitation-image">
              <Image
                src={templatePreviewUrl(shot.portrait)}
                alt={shot.name}
                fill
                priority
                sizes="(max-width: 1023px) 68vw, 23rem"
                className="object-cover object-top"
              />
            </div>
            <div className="v9-hero-invitation-foot">
              <span>{t("card.invite")}</span>
              <strong>{t("card.couple")}</strong>
              <span>{t("card.date")}</span>
            </div>
          </div>
          <div className="v9-round-stamp" aria-hidden>
            <span>{t("hero.stampTop")}</span>
            <strong>V9</strong>
            <span>{t("hero.stampBottom")}</span>
          </div>
        </div>
      </Shell>
    </section>
  );
}

export function V9Journey({
  shots,
  createHref,
  templateCount,
  instantTemplateId,
  rsvpImage,
}: {
  shots: V9TemplateShot[];
  createHref: string;
  templateCount: number;
  instantTemplateId: string;
  rsvpImage: ImageSize;
}) {
  const t = useTranslations("homeLabV9");
  const stageRef = useRef<HTMLElement | null>(null);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const actLayersRef = useRef<Array<HTMLDivElement | null>>([]);
  /* Tên gõ ở trạm 02 phải sống ở đây, không sống trong form: tấm thiệp đang bay
     cũng cần đọc nó để đổi tên trên thiệp theo từng ký tự. Đó là phần trả công
     cho việc đưa form vào trong hành trình — thứ mà hai lớp tách rời không làm
     được, vì form và tấm thiệp khi đó ở hai chỗ cách nhau cả trang. */
  const [groom, setGroom] = useState("");
  const [bride, setBride] = useState("");
  const reduced = useReducedMotion();

  /* Hình của bản desktop: tấm thiệp bay ngang giữa hai keyframe, khối chữ cũ tắt
     rồi khối chữ mới hiện. Ghi thẳng vào biến CSS chứ không qua state React —
     mỗi frame một lần setState sẽ kéo cả cây con render lại 60 lần/giây. */
  const paint = useCallback(
    ({ fromIndex, t }: V9Frame) => {
      const from = CARD_KEYS[fromIndex];
      const to = CARD_KEYS[fromIndex + 1];
      const card = cardRef.current;
      if (card) {
        card.style.setProperty("--v9-card-x", `${lerp(from.x, to.x, t)}vw`);
        card.style.setProperty("--v9-card-y", `${lerp(from.y, to.y, t)}vh`);
        card.style.setProperty(
          "--v9-card-scale",
          String(lerp(from.scale, to.scale, t)),
        );
        card.style.setProperty(
          "--v9-card-rotate",
          `${lerp(from.rotate, to.rotate, t)}deg`,
        );
        card.style.setProperty(
          "--v9-card-flip",
          `${Math.sin(t * Math.PI) * 8}deg`,
        );
      }

      const leaving = 1 - smoothstep(0.04, TEXT_OUT_END, t);
      const arriving = smoothstep(TEXT_IN_START, 0.96, t);
      const layers = actLayersRef.current;
      if (!layers) return;
      for (let index = 0; index < layers.length; index += 1) {
        const layer = layers[index];
        if (!layer) continue;
        const opacity =
          index === fromIndex
            ? leaving
            : index === fromIndex + 1
              ? arriving
              : 0;
        layer.style.setProperty("--v9-act-opacity", String(opacity));
        layer.style.setProperty("--v9-act-shift", `${(1 - opacity) * 24}px`);
      }
    },
    [cardRef, actLayersRef],
  );

  const { activeIndex, goToStep } = useJourneyMotion({
    enabled: !reduced,
    stageRef,
    sceneRef,
    paint,
  });
  const primaryShot = shots[0];

  if (!primaryShot) return null;

  if (reduced) {
    return <StaticJourney shot={primaryShot} createHref={createHref} />;
  }

  /* Bốn tài sản, mỗi tài sản gắn vào đúng trạm nói về nó. Trước đây chúng là bốn
     chương riêng phía dưới hành trình, nên mỗi chủ đề phải xuất hiện hai lần. */
  const stationAsset = (actIndex: number, active: boolean) => {
    switch (actIndex) {
      case 1:
        return (
          <StationTemplates
            shots={shots.slice(0, 4)}
            templateCount={templateCount}
            active={active}
          />
        );
      case 2:
        return (
          <StationNameForm
            templateId={instantTemplateId}
            groom={groom}
            bride={bride}
            onGroom={setGroom}
            onBride={setBride}
            active={active}
          />
        );
      case 3:
        return <StationFeatures />;
      case 4:
        return <StationGuests imageSize={rsvpImage} />;
      default:
        return null;
    }
  };

  return (
    <section
      ref={stageRef}
      id="cach-hoat-dong"
      className="v9-journey"
      aria-label={t("journey.ariaLabel")}
    >
      <div ref={sceneRef} className="v9-scene">
        <div className="v9-scene-map" aria-hidden />
        <RouteProgress activeIndex={activeIndex} onSelect={goToStep} />

        {V9_STATIONS.map((act, actIndex) => {
          const active = actIndex === activeIndex;
          const Icon = act.Icon;

          return (
            <div
              key={act.key}
              ref={(node) => {
                actLayersRef.current[actIndex] = node;
              }}
              className={`v9-act-layer v9-act--${act.side}`}
              data-active={active ? "true" : "false"}
              data-station={actIndex}
              aria-hidden={!active}
            >
              <Shell className="v9-act-shell">
                <article className="v9-act-card">
                  <p className="hp-label flex items-center gap-3 text-[color:var(--v9-coral)]">
                    <Icon className="size-4" strokeWidth={1.4} />
                    {t(`journey.acts.${act.key}.code`)}
                  </p>
                  <h2 className="hp-display v9-act-title mt-5">
                    {t(`journey.acts.${act.key}.title`)}
                  </h2>
                  {/* Mỗi trạm: đúng một câu kể, rồi tới bằng chứng thật. */}
                  <p className="hp-body v9-act-copy mt-5">
                    {t(`journey.acts.${act.key}.copy`)}
                  </p>
                  {stationAsset(actIndex, active)}
                  {/* Trạm 00 không còn cặp nút riêng: hero ngay phía trên đã có
                      đúng hai nút đó, mà journey ghim lại ngay sau hero nên
                      người đọc gặp cùng một cặp nút hai lần trong một màn hình. */}
                  {actIndex === V9_STATIONS.length - 1 ? (
                    <a
                      href={createHref}
                      className="hp-btn hp-btn-solid mt-8"
                      tabIndex={active ? undefined : -1}
                    >
                      {t("journey.ctaFinal")}
                      <ArrowRight className="size-4" strokeWidth={1.5} />
                    </a>
                  ) : null}
                </article>
              </Shell>
            </div>
          );
        })}

        <TravelCard
          cardRef={cardRef}
          shot={primaryShot}
          alternatives={shots.slice(1, 4)}
          activeIndex={activeIndex}
          groom={groom}
          bride={bride}
        />

        <p className="v9-progress-readout" aria-live="polite">
          <span className="hp-num">{String(activeIndex + 1).padStart(2, "0")}</span>
          <span>{t("journey.progress", { current: activeIndex + 1, total: V9_STATIONS.length })}</span>
        </p>
      </div>
    </section>
  );
}

/** Lộ trình sáu trạm bấm được. Cả hai layout dùng chung. */
export function RouteProgress({
  activeIndex,
  onSelect,
}: {
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const t = useTranslations("homeLabV9");

  return (
    <nav className="v9-route-progress" aria-label={t("journey.routeLabel")}>
      <div className="v9-route-line" aria-hidden>
        <span />
      </div>
      <ol>
        {V9_STATIONS.map((act, index) => (
          <li key={act.key}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              className={index <= activeIndex ? "is-passed" : undefined}
              aria-current={index === activeIndex ? "step" : undefined}
              aria-label={t(`journey.acts.${act.key}.code`)}
            >
              <span className="v9-route-dot" aria-hidden />
              <span className="v9-route-name" aria-hidden>
                {t(`journey.acts.${act.key}.short`)}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Khung bay của bản desktop: tấm thiệp cộng những thứ chỉ tồn tại khi nó đang di
 * chuyển — xấp mẫu xoè phía sau và chùm nhãn "gửi đi" ở trạm cuối.
 *
 * Ruột thiệp nằm trong `InvitationCard` vì bản mobile cũng cần đúng tấm thiệp đó,
 * chỉ khác là đặt tĩnh giữa trang thay vì treo vào một khung bay.
 */
function TravelCard({
  cardRef,
  shot,
  alternatives,
  activeIndex,
  groom,
  bride,
}: {
  cardRef: RefObject<HTMLDivElement | null>;
  shot: V9TemplateShot;
  alternatives: V9TemplateShot[];
  activeIndex: number;
  groom: string;
  bride: string;
}) {
  const t = useTranslations("homeLabV9");

  return (
    <div ref={cardRef} className="v9-travel-card" data-act={activeIndex}>
      <div className="v9-card-stack" aria-hidden>
        {alternatives.slice(0, 2).map((template, index) => (
          <div key={template.slug} className={`v9-fan-card v9-fan-card-${index + 1}`}>
            <Image
              src={templatePreviewUrl(template.portrait)}
              alt=""
              fill
              sizes="13rem"
              className="object-cover object-top"
            />
          </div>
        ))}
      </div>

      {/* Chùm nhãn nổi của trạm 02 ("Tên & gia đình", "Ngày giờ tổ chức"…) và
          trạm 03 ("Album kỷ niệm", "Google Maps") đã bị bỏ: giờ hai trạm đó có
          form thật và danh sách tính năng thật ngay trong thẻ trạm, nên mấy nhãn
          đó chỉ còn là bản nhại của thứ đứng ngay bên cạnh. Trạm 05 vẫn giữ vì
          "gửi đi" không có tài sản nào thay thế được. */}
      <div className="v9-share-artifact v9-card-artifacts" aria-hidden>
        <span>{t("journey.artifacts.zalo")}</span>
        <span>{t("journey.artifacts.messenger")}</span>
        <span>{t("journey.artifacts.email")}</span>
      </div>

      <InvitationCard
        shot={shot}
        activeIndex={activeIndex}
        groom={groom}
        bride={bride}
      />
    </div>
  );
}

function StaticJourney({
  shot,
  createHref,
}: {
  shot: V9TemplateShot;
  createHref: string;
}) {
  const t = useTranslations("homeLabV9");

  return (
    <section id="cach-hoat-dong" className="v9-static-journey hp-paper hp-grain py-[var(--hp-chapter-y)]">
      <Shell>
        <header className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="hp-label text-[color:var(--v9-coral)]">{t("journey.eyebrow")}</p>
            <h2 className="hp-display hp-h2 mt-6">{t("journey.title")}</h2>
          </div>
          <p className="hp-body lg:col-span-4 lg:col-start-9 lg:self-end">{t("journey.lede")}</p>
        </header>
        <div className="mt-14 grid gap-12 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="v9-static-card mx-auto w-full max-w-[20rem] self-start">
            <Image
              src={templatePreviewUrl(shot.portrait)}
              alt={shot.name}
              width={768}
              height={1024}
              sizes="20rem"
              className="h-auto w-full"
            />
          </div>
          <ol className="border-b border-[color:var(--hp-rule)]">
            {V9_STATIONS.map((act, index) => {
              const Icon = act.Icon;
              return (
                <li key={act.key} className="border-t border-[color:var(--hp-rule)] py-7">
                  <div className="flex items-center gap-3">
                    <Icon className="size-4 text-[color:var(--v9-coral)]" strokeWidth={1.5} />
                    <span className="hp-label">{t(`journey.acts.${act.key}.code`)}</span>
                  </div>
                  <h3 className="hp-display hp-h3 mt-4">{t(`journey.acts.${act.key}.title`)}</h3>
                  <p className="hp-body mt-3">{t(`journey.acts.${act.key}.copy`)}</p>
                  <span className="hp-num mt-3 block text-sm text-[color:var(--v9-coral)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        <a href={createHref} className="hp-btn hp-btn-solid mt-12">
          {t("journey.ctaFinal")}
          <ArrowRight className="size-4" strokeWidth={1.5} />
        </a>
      </Shell>
    </section>
  );
}
