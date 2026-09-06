"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { useLiveForms } from "@/components/chungdoi-live-forms";
import { formatDate } from "@/components/chungdoi-tpl-shared";
import { orderedCouple } from "@/lib/invitation-display";
import { ToHongKnot, ToHongCordRaster } from "./chungdoi-to-hong-art";
import styles from "./chungdoi-to-hong.module.css";

export function ToHongCover({ content, onOpen, onReady }: {
  content: ChungDoiDemoContent;
  onOpen: () => void;
  onReady: () => void;
}) {
  const t = useTranslations("invitationTemplate");
  const u = useTranslations("invitationTemplate.toHong");
  const live = useLiveForms();
  const people = orderedCouple(content);
  const date = formatDate(content.couple.date);
  const [opening, setOpening] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const started = useRef(false);
  const recipient = live?.guest?.name.trim() || live?.recipientLabel || u("recipient");
  const salutation = live?.guest?.role?.trim() || live?.personalizationLabels.salutationDefault || t("respectfulInvitation");
  const message = live?.guest?.greeting?.trim() || live?.personalizationLabels.messageDefault || u("guestMessage");
  useEffect(() => { onReady(); }, [onReady]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function finish() {
    if (timer.current) clearTimeout(timer.current);
    onOpen();
  }
  function open() {
    if (started.current) return;
    started.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
    setOpening(true);
    timer.current = setTimeout(finish, 2800);
  }
  return <div data-to-hong-cover data-opening={opening} className={styles.cover}>
    <div className={styles.coverSheet}>
      <ToHongCordRaster />
      <ToHongKnot className={styles.coverKnot} />
      <div className={styles.coverNames}><p>{people[0].shortName}</p><span>&amp;</span><p>{people[1].shortName}</p></div>
      {date ? <p className={styles.date}>{date.dayNumber}.{date.monthNumber}.{date.yearNumber}</p> : null}
      <div className={styles.recipient}><p>{salutation}</p><strong>{recipient}</strong><p>{message}</p></div>
      <button data-open-btn type="button" className={styles.openButton} onClick={open} disabled={opening}>
        <ToHongKnot /><span>{opening ? u("opening") : u("open")}</span>
      </button>
      <p className={styles.hint}>{u("openHint")}</p>
    </div>
  </div>;
}
