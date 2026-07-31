"use client";

import Image from "next/image";

import { longPhungGatefoldPilot } from "@/data/long-phung-gatefold-pilot";
import type { GatefoldInnerSheetContent } from "@/components/gatefold/long-phung-gatefold-scene";

import styles from "./long-phung-gatefold-fallback.module.css";

type LongPhungGatefoldFallbackProps = {
  flipped: boolean;
  isOpening: boolean;
  motion: "desktop" | "mobile" | "reduced";
  backFace: Pick<GatefoldInnerSheetContent, "backTitle" | "backDate" | "backNames" | "backMessage">;
};

export function LongPhungGatefoldFallback({
  flipped,
  isOpening,
  motion,
  backFace,
}: LongPhungGatefoldFallbackProps) {
  const motionClass = motion === "reduced"
    ? styles.reduced
    : motion === "mobile"
      ? styles.mobile
      : styles.desktop;
  const backPrint = (
    <div className={styles.backPrint}>
      <span className={styles.backTitle}>{backFace.backTitle}</span>
      <span className={styles.backRule} />
      <strong>{backFace.backDate}</strong>
      <span className={styles.backNames}>{backFace.backNames}</span>
      <span className={styles.backMessage}>{backFace.backMessage}</span>
      <span className={styles.backSeal}>✦</span>
    </div>
  );

  return (
    <div
      aria-hidden="true"
      data-gatefold-fallback-flipped={flipped}
      data-gatefold-fallback-opening={isOpening}
      data-testid="long-phung-gatefold-fallback"
      className={`${styles.stage} ${motionClass} ${flipped ? styles.flipped : ""} ${isOpening ? styles.opening : ""}`}
    >
      <div className={styles.backFaceOverlay}>{backPrint}</div>
      <div className={styles.carrier}>
        <div className={styles.center} />
        <div className={styles.backBoard}>
          {backPrint}
        </div>
        <div className={styles.backCover}>{backPrint}</div>
        <div className={`${styles.wing} ${styles.leftWing}`}>
          <div className={`${styles.wingFace} ${styles.outerFace}`}>
            <div className={styles.artwork}>
              <Image
                alt=""
                fill
                priority
                sizes="(max-width: 640px) 38vw, 13rem"
                src={longPhungGatefoldPilot.assets.dragon}
              />
            </div>
          </div>
          <div className={`${styles.wingFace} ${styles.innerFace}`} />
        </div>
        <div className={`${styles.wing} ${styles.rightWing}`}>
          <div className={`${styles.wingFace} ${styles.outerFace}`}>
            <div className={styles.artwork}>
              <Image
                alt=""
                fill
                priority
                sizes="(max-width: 640px) 38vw, 13rem"
                src={longPhungGatefoldPilot.assets.phoenix}
              />
            </div>
          </div>
          <div className={`${styles.wingFace} ${styles.innerFace}`} />
        </div>
        <div className={styles.clasp}>
          <span className={styles.claspLeft} />
          <span className={styles.claspRight} />
        </div>
      </div>
    </div>
  );
}
