"use client";

import Image from "next/image";

import { ConanCasebookFittedName } from "./conan-casebook-fitted-name";
import type { ConanCasebookCoverContent } from "./conan-casebook-scene-types";
import styles from "./conan-casebook-fallback.module.css";

export type ConanCasebookFallbackMotion = "desktop" | "mobile" | "reduced";

export type DetectiveConanCasebookFallbackProps = {
  coverContent: ConanCasebookCoverContent;
  flipped: boolean;
  isOpening: boolean;
  motion: ConanCasebookFallbackMotion;
  portraitSrc: string;
};

function fallbackNameClass(name: string): string {
  const length = [...name.trim()].length;
  if (length > 36) return styles.nameExtra;
  if (length > 24) return styles.nameLong;
  if (length > 15) return styles.nameMedium;
  return styles.nameShort;
}

export function DetectiveConanCasebookFallback({
  coverContent,
  flipped,
  isOpening,
  motion,
  portraitSrc,
}: DetectiveConanCasebookFallbackProps) {
  return (
    <div
      aria-hidden="true"
      className={styles.stage}
      data-casebook-fallback-flipped={flipped ? "true" : "false"}
      data-casebook-fallback-opening={isOpening ? "true" : "false"}
      data-testid="detective-conan-casebook-fallback"
    >
      <div
        className={[
          styles.book,
          flipped ? styles.flipped : "",
          isOpening ? styles.opening : "",
        ].filter(Boolean).join(" ")}
        data-motion={motion}
      >
        <div
          className={styles.backCover}
          data-testid="detective-conan-casebook-back-face"
        >
          <div className={styles.backInset}>
            <span className={styles.backTitle}>{coverContent.backTitle}</span>
            <strong>{coverContent.backNames}</strong>
            <span className={styles.backDate}>{coverContent.backDate}</span>
            <p>{coverContent.backMessage}</p>
            <span className={styles.caseSeal}>{coverContent.caseNumber}</span>
          </div>
        </div>

        <div className={styles.pageBlock}>
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className={styles.spine} />

        <div className={styles.firstPage}>
          <span className={styles.kicker}>{coverContent.kicker}</span>
          <strong>{coverContent.caseNumber}</strong>
          <span className={styles.date}>{coverContent.dateAndTime}</span>
          <span className={styles.pageLens} />
        </div>

        <div className={styles.frontCover}>
          <div className={styles.frontFace}>
            <span className={styles.coverRule} />
            <span className={styles.kicker}>{coverContent.kicker}</span>
            <strong className={styles.caseNumber}>
              {coverContent.caseNumber}
            </strong>
            <div className={styles.portrait}>
              <Image
                alt=""
                aria-hidden="true"
                className={styles.portraitImage}
                fill
                priority
                sizes="(max-width: 767px) 62vw, 18rem"
                src={portraitSrc}
              />
            </div>
            <div className={styles.coupleNames}>
              <ConanCasebookFittedName
                className={fallbackNameClass(coverContent.firstName)}
                name={coverContent.firstName}
              />
              <small>{coverContent.conjunction}</small>
              <ConanCasebookFittedName
                className={fallbackNameClass(coverContent.secondName)}
                name={coverContent.secondName}
              />
            </div>
            <span className={styles.date}>{coverContent.dateAndTime}</span>
            <span className={styles.coverLens} />
          </div>
          <div className={styles.insideCover}>
            <span>{coverContent.kicker}</span>
            <strong>{coverContent.caseNumber}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
