"use client";

import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { invitationHeroImage, orderedCouple } from "@/lib/invitation-display";
import styles from "./chungdoi-to-hong.module.css";

/** Own vector artwork: a continuous cord, with a second fine strand catching light. */
export function ToHongKnot({ className = "" }: { className?: string }) {
  return <svg aria-hidden="true" viewBox="0 0 160 180" fill="none" className={`${styles.knot} ${className}`}>
    <path className={styles.cord} d="M80 0C80 35 25 8 25 42C25 78 118 120 132 76C145 35 86 31 80 66C74 31 15 35 28 76C42 120 135 78 135 42C135 8 80 35 80 0M80 66C62 83 47 104 65 115C88 131 112 98 80 66M80 66C98 83 113 104 95 115C72 131 48 98 80 66M80 115C80 140 61 139 58 160M80 115C80 148 104 146 108 178" />
    <path className={styles.cordLight} d="M80 0C80 35 25 8 25 42C25 78 118 120 132 76C145 35 86 31 80 66C74 31 15 35 28 76C42 120 135 78 135 42C135 8 80 35 80 0M80 66C62 83 47 104 65 115C88 131 112 98 80 66M80 115C80 148 104 146 108 178" />
  </svg>;
}

/** The cord is a physical boundary on the cover, not a decorative line floating beside it. */
export function ToHongCordFrame() {
  return <svg aria-hidden="true" data-to-hong-cord-frame viewBox="0 0 100 140" fill="none" className={styles.cordFrame}>
    <path pathLength="1" className={styles.cordFrameShadow} d="M22 3C11 3 3 11 3 22C5 30 1 38 3 47C5 56 1 65 3 74C5 83 1 93 3 102C1 112 5 121 3 118C3 129 11 137 22 137C31 135 39 139 48 137C57 135 66 139 78 137C89 137 97 129 97 118C95 109 99 101 97 92C95 83 99 74 97 65C95 56 99 47 97 38C95 29 99 22 97 22C97 11 89 3 78 3C69 5 60 1 51 3C42 5 33 1 22 3Z" />
    <path pathLength="1" className={styles.cordFramePath} d="M22 3C11 3 3 11 3 22C5 30 1 38 3 47C5 56 1 65 3 74C5 83 1 93 3 102C1 112 5 121 3 118C3 129 11 137 22 137C31 135 39 139 48 137C57 135 66 139 78 137C89 137 97 129 97 118C95 109 99 101 97 92C95 83 99 74 97 65C95 56 99 47 97 38C95 29 99 22 97 22C97 11 89 3 78 3C69 5 60 1 51 3C42 5 33 1 22 3Z" />
    <path pathLength="1" className={styles.cordFrameMotion} d="M22 3C11 3 3 11 3 22C5 30 1 38 3 47C5 56 1 65 3 74C5 83 1 93 3 102C1 112 5 121 3 118C3 129 11 137 22 137C31 135 39 139 48 137C57 135 66 139 78 137C89 137 97 129 97 118C95 109 99 101 97 92C95 83 99 74 97 65C95 56 99 47 97 38C95 29 99 22 97 22C97 11 89 3 78 3C69 5 60 1 51 3C42 5 33 1 22 3Z" />
  </svg>;
}

export function ToHongCordBehind() {
  return <svg aria-hidden="true" data-to-hong-cord-behind viewBox="0 0 120 150" fill="none" className={styles.cordBehind}>
    <path className={styles.cordBehindShadow} d="M8 43C-4 14 24-4 53 10C77 21 93 7 110 20C128 34 105 54 91 51C70 47 60 25 42 30C22 36 38 54 25 67C14 78 -3 67 8 43Z" />
    <path pathLength="1" className={styles.cordBehindPath} d="M8 43C-4 14 24-4 53 10C77 21 93 7 110 20C128 34 105 54 91 51C70 47 60 25 42 30C22 36 38 54 25 67C14 78 -3 67 8 43Z" />
  </svg>;
}

export function ToHongCordRaster() {
  return <picture aria-hidden="true" className={styles.cordRaster}>
    <source media="(min-width: 640px)" srcSet="/chungdoi/images/themes/to-hong/to-hong-cord-desktop.webp" />
    <img src="/chungdoi/images/themes/to-hong/to-hong-cord-mobile.webp" alt="" width={960} height={1440} />
  </picture>;
}

export function ToHongPortrait({ content, priority = false }: { content: ChungDoiDemoContent; priority?: boolean }) {
  const t = useTranslations("invitationTemplate");
  const photo = invitationHeroImage(content);
  const people = orderedCouple(content);
  return <div className={styles.portrait} data-to-hong-portrait>
    <div className={styles.paperLayer} /><div className={styles.paperLayer} /><div className={styles.paperLayer} />
    {photo ? <img src={photo} alt={t("weddingPhotoAlt", { couple: people.map((p) => p.fullName).join(` ${t("and")} `) })} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} className={styles.portraitPhoto} /> : <div className={styles.portraitMonogram}><span>{people[0].shortName}</span><span>&amp;</span><span>{people[1].shortName}</span></div>}
    <img src="/chungdoi/images/themes/to-hong/paper-frame.webp" alt="" aria-hidden="true" width={960} height={1440} loading={priority ? "eager" : "lazy"} className={styles.paperFrame} />
  </div>;
}

export function ToHongThread() {
  return <svg data-to-hong-thread aria-hidden="true" viewBox="0 0 200 160" className={styles.thread} fill="none">
    <path pathLength="1" d="M100 0C100 38 30 20 45 67S164 96 154 60S58 78 100 160" />
    <path pathLength="1" className={styles.threadMotion} d="M100 0C100 38 30 20 45 67S164 96 154 60S58 78 100 160" />
  </svg>;
}
