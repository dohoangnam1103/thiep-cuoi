"use client";

import { Rotate3D } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { CoiTrauHeroCard, coiTrauTypography } from "@/components/coi-trau/coi-trau-hero-card";
import styles from "@/components/coi-trau/coi-trau-cover.module.css";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { useInvitationCoverReady } from "@/hooks/use-invitation-cover-ready";
import { orderedCouple } from "@/lib/invitation-display";

export type CoiTrauExperienceState = "closed" | "opening" | "handoff" | "opened";

type CoiTrauKhamTraiLabProps = {
  content: ChungDoiDemoContent;
  muted?: boolean;
  onCoverReady?: () => void;
  onStateChange?: (state: CoiTrauExperienceState) => void;
};

type DragSnapshot = {
  pointerId: number;
  startX: number;
  startY: number;
  startTiltX: number;
  startTiltY: number;
};

const stateTranslationKeys: Record<
  CoiTrauExperienceState,
  "stateClosed" | "stateOpening" | "stateHandoff" | "stateOpened"
> = {
  closed: "stateClosed",
  opening: "stateOpening",
  handoff: "stateHandoff",
  opened: "stateOpened",
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function useCaddyAudio(muted: boolean) {
  const contextRef = useRef<AudioContext | null>(null);

  const playOpenCue = useCallback(() => {
    if (muted) return;
    const AudioContextConstructor = window.AudioContext
      ?? (window as WindowWithWebkitAudio).webkitAudioContext;
    if (!AudioContextConstructor) return;
    const context = contextRef.current ?? new AudioContextConstructor();
    contextRef.current = context;

    const play = () => {
      const now = context.currentTime;
      const master = context.createGain();
      const wood = context.createOscillator();
      const shell = context.createOscillator();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.085, now + 0.012);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      wood.type = "triangle";
      wood.frequency.setValueAtTime(180, now);
      wood.frequency.exponentialRampToValueAtTime(92, now + 0.2);
      shell.type = "sine";
      shell.frequency.setValueAtTime(610, now + 0.045);
      shell.frequency.exponentialRampToValueAtTime(390, now + 0.19);
      wood.connect(master);
      shell.connect(master);
      master.connect(context.destination);
      wood.start(now);
      shell.start(now + 0.045);
      wood.stop(now + 0.24);
      shell.stop(now + 0.24);
      window.setTimeout(() => master.disconnect(), 320);
    };

    if (context.state === "suspended") {
      void context.resume().then(play).catch(() => undefined);
    } else {
      play();
    }
  }, [muted]);

  useEffect(() => () => {
    const context = contextRef.current;
    contextRef.current = null;
    if (context && context.state !== "closed") void context.close();
  }, []);

  return playOpenCue;
}

function formatCoverDate(date: string, locale: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function CoiTrauKhamTraiLab({
  content,
  muted = false,
  onCoverReady,
  onStateChange,
}: CoiTrauKhamTraiLabProps) {
  const t = useTranslations("coiTrauLab");
  const invitationT = useTranslations("invitationTemplate");
  const locale = useLocale();
  const people = orderedCouple(content);
  const stageRef = useRef<HTMLElement>(null);
  const dragRef = useRef<DragSnapshot | null>(null);
  const timerRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const [state, setState] = useState<CoiTrauExperienceState>("closed");
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const reducedMotion = useReducedMotion();
  const playOpenCue = useCaddyAudio(muted);
  const frontFacing = Math.abs(tiltY) <= 1;
  const backFacing = Math.abs(tiltY) >= 3;
  const coverDate = formatCoverDate(content.couple.date, locale);

  useInvitationCoverReady(stageRef, true, onCoverReady);

  useEffect(() => {
    onStateChange?.(state);
  }, [onStateChange, state]);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
  }, []);

  const finishOpening = useCallback(() => {
    setState("handoff");
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = window.requestAnimationFrame(() => {
        setState("opened");
        frameRef.current = null;
      });
    });
  }, []);

  const openInvitation = useCallback(() => {
    if (state !== "closed" || !frontFacing) return;
    setTiltX(0);
    setTiltY(0);
    setState("opening");
    playOpenCue();
    if (!reducedMotion && "vibrate" in navigator) navigator.vibrate(8);
    timerRef.current = window.setTimeout(
      finishOpening,
      reducedMotion ? 200 : 1680,
    );
  }, [finishOpening, frontFacing, playOpenCue, reducedMotion, state]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (state !== "closed") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startTiltX: tiltX,
      startTiltY: tiltY,
    };
    setDragging(true);
  }, [state, tiltX, tiltY]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || state !== "closed") return;
    const nextTiltY = clamp(
      Math.round(drag.startTiltY + (event.clientX - drag.startX) / 46),
      -4,
      4,
    );
    const nextTiltX = clamp(
      Math.round(drag.startTiltX - (event.clientY - drag.startY) / 54),
      -2,
      2,
    );
    setTiltX(nextTiltX);
    setTiltY(nextTiltY);
  }, [state]);

  const endPointerGesture = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDragging(false);
  }, []);

  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (state !== "closed") return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setTiltY((value) => clamp(value - 1, -4, 4));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setTiltY((value) => clamp(value + 1, -4, 4));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setTiltX((value) => clamp(value - 1, -2, 2));
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setTiltX((value) => clamp(value + 1, -2, 2));
    } else if (event.key === "Home") {
      event.preventDefault();
      setTiltX(0);
      setTiltY(0);
    }
  }, [state]);

  const toggleBackFace = useCallback(() => {
    if (state !== "closed") return;
    setTiltX(0);
    setTiltY(backFacing ? 0 : 4);
  }, [backFacing, state]);

  return (
    <section
      ref={stageRef}
      className={styles.stage}
      data-dragging={dragging ? "true" : "false"}
      data-state={state}
      data-testid="coi-trau-kham-trai-stage"
      data-tilt-x={tiltX}
      data-tilt-y={tiltY}
    >
      <h1 className="sr-only">{t("title")}</h1>

      {state === "closed" ? null : (
        <CoiTrauHeroCard
          className={styles.handoffCard}
          content={content}
        />
      )}

      <div
        aria-label={t("dragLabel")}
        className={styles.orbit}
        onKeyDown={handleKeyDown}
        onPointerCancel={endPointerGesture}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointerGesture}
        role="application"
        tabIndex={state === "closed" ? 0 : -1}
      >
        <div className={styles.rig}>
          <div aria-hidden="true" className={styles.caddyShadow} />
          <div className={styles.backFace}>
            <p className="text-[9px] font-semibold uppercase tracking-[0.32em] text-[#D8E3DF] sm:text-xs">
              {invitationT("saveTheDate")}
            </p>
            <p className={`${coiTrauTypography.displayFontClass} max-w-[70%] text-[clamp(1.4rem,5vw,2.7rem)] leading-none`}>
              {people[0].shortName}
              <span className="mx-2 text-[#B85B52]">&amp;</span>
              {people[1].shortName}
            </p>
            <p className="text-[9px] font-semibold tracking-[0.2em] text-[#D8E3DF]/78 sm:text-xs">
              {coverDate}
            </p>
          </div>
          <div aria-hidden="true" className={styles.baseEdgeBack} />
          <div aria-hidden="true" className={styles.baseEdgeFront} />
          <div aria-hidden="true" className={styles.base}>
            <div className={styles.trayArtwork} />
          </div>
          <div aria-hidden="true" className={styles.lidEdge} />
          <div className={styles.lid}>
            <div aria-hidden="true" className={styles.lidArtwork} />
            <div className={styles.lidCopy}>
              <p className="text-[8px] font-semibold uppercase tracking-[0.3em] text-[#315A42] sm:text-[10px]">
                {invitationT("invitation")}
              </p>
              <p className={`${coiTrauTypography.displayFontClass} mt-2 max-w-full text-[clamp(1.15rem,4.6vw,2.4rem)] font-medium leading-[0.88] tracking-[-0.04em] text-[#32151F]`}>
                <span className="block truncate">{people[0].shortName}</span>
                <span className="my-1 block text-[0.52em] italic text-[#B85B52]">{invitationT("and")}</span>
                <span className="block truncate">{people[1].shortName}</span>
              </p>
              <p className="mt-2 text-[8px] font-semibold tracking-[0.18em] text-[#315A42]/90 sm:text-[10px]">
                {coverDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      {state === "closed" ? (
        <div className="absolute inset-x-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-30 flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              aria-pressed={backFacing}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D8E3DF]/35 bg-[#180B10]/62 px-4 text-sm text-[#F1E8D8] backdrop-blur-md transition hover:border-[#D8E3DF]/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8E3DF] active:scale-[0.98]"
              onClick={toggleBackFace}
              type="button"
            >
              <Rotate3D aria-hidden size={16} strokeWidth={1.5} />
              {t(backFacing ? "viewFront" : "viewBack")}
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#D8E3DF]/50 bg-[#F1E8D8] px-7 text-base font-semibold text-[#32151F] shadow-[0_1rem_3rem_rgba(0,0,0,0.34)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8E3DF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#180B10] disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.98]"
              data-testid="coi-trau-kham-trai-open"
              disabled={!frontFacing}
              onClick={openInvitation}
              type="button"
            >
              {t("open")}
            </button>
          </div>
          <p className="max-w-[34ch] text-center text-xs leading-5 text-[#F1E8D8]/72 sm:text-sm sm:leading-6">
            {t(frontFacing ? "closedHint" : "returnFrontHint")}
          </p>
        </div>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {t(stateTranslationKeys[state])}
      </p>
    </section>
  );
}
