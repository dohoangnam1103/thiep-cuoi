"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { orderedCouple } from "@/lib/invitation-display";

import styles from "./ban-ve-to-am-hero.module.css";

const GARDEN_FRAME = "/chungdoi/templates/ban-ve-to-am/cover/garden-frame.svg";

function formatWeddingDate(value: string, locale: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export function BanVeToAmHeroCard({
  content,
}: {
  content: ChungDoiDemoContent;
}) {
  const locale = useLocale();
  const t = useTranslations("banVeToAmTemplate");
  const invitationT = useTranslations("invitationTemplate");
  const people = orderedCouple(content);
  const coupleLabel = `${people[0].shortName} ${invitationT("and")} ${people[1].shortName}`;
  const weddingDate = formatWeddingDate(content.couple.date, locale);
  const heroImage = content.heroImage || content.portraits?.bride || content.gallery[0];

  return (
    <section className={styles.hero} data-ban-ve-to-am-hero>
      <div aria-hidden className={styles.glow} />
      <div className={styles.card}>
        <div className={styles.photoPane}>
          {heroImage ? (
            <Image
              alt={invitationT("weddingPhotoAlt", { couple: coupleLabel })}
              className={styles.photo}
              fill
              priority
              sizes="(max-width: 480px) 100vw, 480px"
              src={heroImage}
            />
          ) : null}
          <div aria-hidden className={styles.photoVeil} />
          <p className={styles.photoNote}>{t("heroPhotoNote")}</p>
        </div>

        <div className={styles.copyPane}>
          <Image
            aria-hidden
            alt=""
            className={styles.frame}
            height={1500}
            src={GARDEN_FRAME}
            unoptimized
            width={1000}
          />
          <div className={styles.copy}>
            <p className={styles.kicker}>{t("heroKicker")}</p>
            <p className={styles.gardenTitle}>{t("heroTitle")}</p>
            <h2
              className={styles.names}
              data-physical-handoff-target="true"
              tabIndex={-1}
            >
              <span>{people[0].shortName}</span>
              <span className={styles.ampersand}>{invitationT("and")}</span>
              <span>{people[1].shortName}</span>
            </h2>
            <div className={styles.dateRow}>
              <span aria-hidden />
              <time dateTime={content.couple.date}>{weddingDate}</time>
              <span aria-hidden />
            </div>
            <p className={styles.subtitle}>{t("heroSubtitle")}</p>
          </div>
        </div>
      </div>
      <p className={styles.scrollHint}>{t("scrollHint")}</p>
    </section>
  );
}
