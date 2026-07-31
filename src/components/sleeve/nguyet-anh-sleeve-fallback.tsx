"use client";

import Image from "next/image";

import { nguyetAnhSleevePilot } from "@/data/nguyet-anh-sleeve-pilot";
import type { SleeveFilmCardContent } from "./nguyet-anh-sleeve-scene";
import styles from "./nguyet-anh-sleeve-fallback.module.css";

export type SleeveFallbackMotion = "desktop" | "mobile" | "reduced";

export function NguyetAnhSleeveFallback({
  cardContent,
  flipped,
  isOpening,
  motion,
}: {
  cardContent: SleeveFilmCardContent;
  flipped: boolean;
  isOpening: boolean;
  motion: SleeveFallbackMotion;
}) {
  return (
    <div
      className={styles.stage}
      data-testid="nguyet-anh-sleeve-fallback"
    >
      <div
        className={[
          styles.object,
          flipped ? styles.flipped : "",
          isOpening ? styles.opening : "",
        ].filter(Boolean).join(" ")}
        data-motion={motion}
      >
        <div className={styles.filmCard}>
          <Image
            alt=""
            aria-hidden="true"
            className={styles.artwork}
            fill
            priority
            sizes="(max-width: 767px) 82vw, 28rem"
            src={nguyetAnhSleevePilot.assets.photogramMobile}
          />
          <div aria-hidden="true" className={styles.cardScrim} />
          <div className={styles.cardCopy}>
            <p className={styles.kicker}>{cardContent.kicker}</p>
            <p className={styles.names}>
              <span>{cardContent.firstName}</span>
              <span className={styles.conjunction}>
                {cardContent.conjunction}
              </span>
              <span>{cardContent.secondName}</span>
            </p>
            <p className={styles.date}>{cardContent.dateAndTime}</p>
          </div>
        </div>
        <div aria-hidden="true" className={styles.sleeve}>
          <span className={styles.slot} />
          <span className={styles.aperture} />
        </div>
        <div className={styles.reverse}>
          <div>
            <p className={styles.reverseTitle}>{cardContent.backTitle}</p>
            <p className={styles.reverseNames}>{cardContent.backNames}</p>
            <p className={styles.reverseDate}>{cardContent.backDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
