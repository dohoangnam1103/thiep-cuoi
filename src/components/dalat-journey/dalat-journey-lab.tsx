"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  DALAT_JOURNEY_CHECKPOINT_IDS,
  dalatJourneyDefinition,
  type DalatJourneyCheckpointCopy,
  type DalatJourneyCheckpointId,
  type DalatJourneyCopy,
} from "@/data/dalat-journey";
import {
  chungdoiDemoContent,
  type ChungDoiDemoContent,
} from "@/data/chungdoi-demo-content";
import {
  LiveFormsProvider,
  type LiveForms,
} from "@/components/chungdoi-live-forms";
import { formatDate } from "@/components/chungdoi-tpl-shared";
import {
  invitationOpeningMessage,
  orderedCouple,
} from "@/lib/invitation-display";

import { createInitialJourneyState, journeyReducer } from "./journey-controller";
import styles from "./dalat-journey.module.css";
import { DalatArtworkBackdrop } from "./dalat-backdrop";
import { DiegeticContent } from "./diegetic-content";
import { JourneyFallback } from "./journey-fallback";
import { JourneyLoading } from "./journey-loading";
import type { JourneyCanvasProps } from "./journey-canvas";
import { useJourneyInput } from "./use-journey-input";

const FALLBACK_TRAVEL_DURATION_MS = 650;
const LOOK_DIAGNOSTIC_INTERVAL_MS = 80;
const MOBILE_QUERY = "(max-width: 767px)";

type JourneyLook = {
  pitchDegrees: number;
  yawDegrees: number;
};

function subscribeToMobileViewport(onStoreChange: () => void): () => void {
  const mediaQuery = window.matchMedia(MOBILE_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function mobileViewportSnapshot(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function serverMobileViewportSnapshot(): boolean {
  return false;
}

function useMobileViewport(): boolean {
  return useSyncExternalStore(
    subscribeToMobileViewport,
    mobileViewportSnapshot,
    serverMobileViewportSnapshot,
  );
}

function JourneyCanvasImportFailure({
  onUnavailable,
}: Pick<JourneyCanvasProps, "onUnavailable">) {
  useEffect(() => {
    onUnavailable();
  }, [onUnavailable]);

  return null;
}

const JourneyCanvas = dynamic(
  () => import("./journey-canvas")
    .then((module) => module.JourneyCanvas)
    .catch(() => JourneyCanvasImportFailure),
  { ssr: false },
);

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export type DalatJourneyLabProps = {
  content?: ChungDoiDemoContent;
  liveForms?: LiveForms;
};

export function DalatJourneyLab({
  content = chungdoiDemoContent["qasr-green"],
  liveForms = null,
}: DalatJourneyLabProps) {
  const t = useTranslations("dalatJourneyLab");
  const [state, dispatch] = useReducer(
    journeyReducer,
    createInitialJourneyState(false),
  );
  const isMobile = useMobileViewport();
  const [readyCanvasKey, setReadyCanvasKey] = useState<string | null>(null);
  const stageRef = useRef<HTMLElement>(null);
  const latestLookRef = useRef<JourneyLook>(state.look);
  const invalidateRef = useRef<(() => void) | null>(null);
  const lookDiagnosticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastLookDiagnosticAtRef = useRef(0);

  useEffect(() => {
    if (state.renderMode !== "webgl") {
      invalidateRef.current = null;
    }
  }, [state.renderMode]);

  useEffect(() => {
    if (state.phase !== "travelling") return;
    if (lookDiagnosticTimerRef.current !== null) {
      clearTimeout(lookDiagnosticTimerRef.current);
      lookDiagnosticTimerRef.current = null;
    }
    if (state.renderMode === "fallback") {
      latestLookRef.current = { pitchDegrees: 0, yawDegrees: 0 };
    }
  }, [state.phase, state.renderMode]);

  useEffect(() => {
    if (!state.reducedMotion) return;
    latestLookRef.current = { pitchDegrees: 0, yawDegrees: 0 };
    dispatch({ type: "resetLook" });
    invalidateRef.current?.();
  }, [state.reducedMotion]);

  useEffect(() => () => {
    if (lookDiagnosticTimerRef.current !== null) {
      clearTimeout(lookDiagnosticTimerRef.current);
    }
  }, []);

  const copy: DalatJourneyCopy = {
    checkpoints: DALAT_JOURNEY_CHECKPOINT_IDS.reduce(
      (accumulator, id) => {
        accumulator[id] = {
          body: t(`checkpoints.${id}.body`),
          detail: t(`checkpoints.${id}.detail`),
          kicker: t(`checkpoints.${id}.kicker`),
          name: t(`checkpoints.${id}.name`),
          title: t(`checkpoints.${id}.title`),
        };
        return accumulator;
      },
      {} as Record<DalatJourneyCheckpointId, DalatJourneyCheckpointCopy>,
    ),
    fallbackNotice: t("fallbackNotice"),
    loading: t("loading"),
  };

  const invitationLabels = {
    addToCalendar: t("invitation.addToCalendar"),
    album: t("invitation.album"),
    albumIntro: t("invitation.albumIntro", { count: content.gallery.length }),
    bride: t("invitation.bride"),
    calendar: t("invitation.calendar"),
    cover: t("invitation.cover"),
    directions: t("invitation.directions"),
    gift: t("invitation.gift"),
    giftIntro: t("invitation.giftIntro"),
    giftUnavailable: t("invitation.giftUnavailable"),
    groom: t("invitation.groom"),
    map: t("invitation.map"),
    mapUnavailable: t("invitation.mapUnavailable"),
    openGift: t("invitation.openGift"),
    schedule: t("invitation.schedule"),
    wishes: t("invitation.wishes"),
    wishesIntro: t("invitation.wishesIntro"),
    wishNamePlaceholder: t("invitation.wishNamePlaceholder"),
    wishPlaceholder: t("invitation.wishPlaceholder"),
    wishSubmit: t("invitation.wishSubmit"),
    wishSuccess: t("invitation.wishSuccess"),
  } as const;

  const checkpointCount = dalatJourneyDefinition.checkpoints.length;
  const displayCouple = orderedCouple(content);
  const activeCheckpoint =
    dalatJourneyDefinition.checkpoints[state.currentIndex];
  const targetCheckpoint =
    state.targetIndex === null
      ? null
      : dalatJourneyDefinition.checkpoints[state.targetIndex];
  const nextCheckpoint =
    state.currentIndex + 1 < checkpointCount
      ? dalatJourneyDefinition.checkpoints[state.currentIndex + 1]
      : null;
  const preloadCheckpoint =
    state.phase === "travelling" ? targetCheckpoint : nextCheckpoint;

  const handleNavigate = (gesture: "next" | "previous") => {
    if (state.phase !== "settled" && state.phase !== "fallback-settled") {
      return;
    }
    dispatch({ type: gesture });
  };

  const handleLook = (pitchDegrees: number, yawDegrees: number) => {
    if (state.reducedMotion) return;
    if (state.phase !== "settled" && state.phase !== "fallback-settled") {
      return;
    }
    const lookLimits = dalatJourneyDefinition.look;
    const nextLook: JourneyLook = {
      pitchDegrees: clamp(
        latestLookRef.current.pitchDegrees + pitchDegrees,
        -lookLimits.pitchDegrees,
        lookLimits.pitchDegrees,
      ),
      yawDegrees: clamp(
        latestLookRef.current.yawDegrees + yawDegrees,
        -lookLimits.yawDegrees,
        lookLimits.yawDegrees,
      ),
    };
    latestLookRef.current = nextLook;
    invalidateRef.current?.();

    const dispatchDiagnostic = () => {
      lookDiagnosticTimerRef.current = null;
      lastLookDiagnosticAtRef.current = window.performance.now();
      dispatch({
        type: "look",
        pitchDegrees: latestLookRef.current.pitchDegrees,
        yawDegrees: latestLookRef.current.yawDegrees,
      });
    };
    const elapsed = window.performance.now() - lastLookDiagnosticAtRef.current;
    if (elapsed >= LOOK_DIAGNOSTIC_INTERVAL_MS) {
      dispatchDiagnostic();
    } else if (lookDiagnosticTimerRef.current === null) {
      lookDiagnosticTimerRef.current = setTimeout(
        dispatchDiagnostic,
        LOOK_DIAGNOSTIC_INTERVAL_MS - elapsed,
      );
    }
  };

  const handleCanvasArrive = useCallback(() => {
    dispatch({ type: "arrive" });
  }, []);

  const handleCanvasReady = useCallback(() => {
    setReadyCanvasKey(`${state.renderMode}:${isMobile ? "mobile" : "desktop"}`);
  }, [isMobile, state.renderMode]);

  const handleCanvasUnavailable = useCallback(() => {
    latestLookRef.current = { pitchDegrees: 0, yawDegrees: 0 };
    invalidateRef.current = null;
    setReadyCanvasKey(null);
    dispatch({ type: "rendererFallback" });
  }, []);

  const handleInvalidateReady = useCallback((invalidate: (() => void) | null) => {
    invalidateRef.current = invalidate;
  }, []);

  useJourneyInput(stageRef, {
    enabled:
      state.phase === "settled" || state.phase === "fallback-settled",
    onLook: handleLook,
    onNavigate: handleNavigate,
  });

  useEffect(() => {
    if (state.phase !== "travelling" || state.renderMode !== "fallback") {
      return;
    }
    const duration = state.reducedMotion
      ? dalatJourneyDefinition.reducedDurationMs
      : FALLBACK_TRAVEL_DURATION_MS;
    const timer = setTimeout(() => dispatch({ type: "arrive" }), duration);
    return () => clearTimeout(timer);
  }, [state.phase, state.renderMode, state.reducedMotion, state.targetIndex]);

  const travelling = state.phase === "travelling";
  const atStart = state.currentIndex === 0;
  const atEnd = state.currentIndex === checkpointCount - 1;
  const canvasViewportKey = isMobile ? "mobile" : "desktop";
  const canvasSessionKey = `${state.renderMode}:${canvasViewportKey}`;
  const rendererReady =
    state.renderMode === "webgl" && readyCanvasKey === canvasSessionKey;
  const stageRenderer =
    state.renderMode === "fallback"
      ? "fallback"
      : rendererReady
        ? "webgl"
        : "loading";
  const webglSurface = state.renderMode === "webgl" ? (
    <>
      <JourneyCanvas
        copy={copy}
        currentIndex={state.currentIndex}
        key={canvasViewportKey}
        look={state.look}
        lookRef={latestLookRef}
        onArrive={handleCanvasArrive}
        onInvalidateReady={handleInvalidateReady}
        onReady={handleCanvasReady}
        onUnavailable={handleCanvasUnavailable}
        phase={state.phase}
        reducedMotion={state.reducedMotion}
        targetIndex={state.targetIndex}
      />
      {rendererReady ? null : <JourneyLoading copy={copy} />}
    </>
  ) : null;

  return (
    <main
      className="relative h-[100dvh] w-full overflow-hidden bg-[#08120f] text-[#f5f2e8]"
      data-checkpoint={activeCheckpoint.id}
      data-checkpoint-index={state.currentIndex}
      data-invitation-template={content.slug}
      data-invitation-id={content.invitationId}
      data-journey-phase={state.phase}
      data-look-pitch={state.look.pitchDegrees.toFixed(2)}
      data-look-yaw={state.look.yawDegrees.toFixed(2)}
      data-renderer={stageRenderer}
      data-testid="dalat-journey-stage"
      ref={stageRef}
    >
      {state.renderMode === "webgl" ? webglSurface : state.phase === "threshold" ? (
        <>
          <DalatArtworkBackdrop
            activeCheckpoint={activeCheckpoint}
            look={state.look}
            reducedMotion={state.reducedMotion}
            targetCheckpoint={null}
          />
        </>
      ) : (
        <JourneyFallback
          activeCheckpoint={activeCheckpoint}
          copy={copy}
          look={state.look}
          preloadCheckpoint={preloadCheckpoint}
          reducedMotion={state.reducedMotion}
          targetCheckpoint={targetCheckpoint}
        />
      )}

      {state.phase !== "threshold" ? (
        <LiveFormsProvider value={liveForms}>
          <DiegeticContent
            activeIndex={state.currentIndex}
            content={content}
            copy={copy}
            labels={invitationLabels}
            phase={state.phase}
            reducedMotion={state.reducedMotion}
          />
        </LiveFormsProvider>
      ) : null}

      {state.phase === "threshold" ? (
        <section
          aria-labelledby="dalat-journey-entry-title"
          className="absolute inset-0 z-10 flex items-center justify-center px-6"
        >
          <div className={styles.entryStone}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9db3a4] sm:text-sm">
              {invitationLabels.cover}
            </p>
            <h1
              className="max-w-[18ch] text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl"
              data-testid="dalat-journey-cover-couple"
              id="dalat-journey-entry-title"
            >
              {displayCouple[0].fullName}
              <span className="my-1 block text-2xl font-normal tracking-[0.12em] text-[#9db3a4] sm:text-3xl">
                &amp;
              </span>
              {displayCouple[1].fullName}
            </h1>
            <p
              className="max-w-[36ch] text-base font-medium leading-7 text-[#f0eee4] sm:text-lg sm:leading-8"
              data-testid="dalat-journey-cover-date"
            >
              {formatDate(content.couple.date)?.weekday} · {formatDate(content.couple.date)?.day}/{formatDate(content.couple.date)?.month}/{formatDate(content.couple.date)?.yearNumber}
              {content.couple.time ? ` · ${content.couple.time}` : ""}
            </p>
            <p className="max-w-[36ch] text-sm leading-6 text-[#c7cbbb] sm:text-base sm:leading-7">
              {invitationOpeningMessage(content)}
            </p>
            <button
              className="mt-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[#7fa08c] bg-[#10201a] px-7 text-base font-semibold text-[#f5f2e8] transition-colors hover:bg-[#173027] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fa08c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08120f] disabled:cursor-wait disabled:border-[#7fa08c]/35 disabled:text-[#9db3a4]/60"
              data-testid="dalat-journey-enter"
              disabled={state.renderMode === "webgl" && !rendererReady}
              onClick={() => dispatch({ type: "enter" })}
              type="button"
            >
              {t("enter")}
            </button>
          </div>
        </section>
      ) : null}

      {state.phase !== "threshold" ? (
        <div className={`${styles.journeyControls} pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4 sm:p-6`}>
          <p
            aria-live="polite"
            className="sr-only"
            data-testid="dalat-journey-status"
          >
            {t("checkpointStatus", {
              current: state.currentIndex + 1,
              total: checkpointCount,
              name: copy.checkpoints[activeCheckpoint.id].name,
            })}
          </p>
          <button
            className={`${styles.journeyControlPrevious} pointer-events-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[#7fa08c]/70 bg-[#10201a]/90 px-5 text-sm font-semibold text-[#f5f2e8] transition-colors hover:bg-[#173027] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fa08c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08120f] disabled:cursor-not-allowed disabled:border-[#7fa08c]/25 disabled:text-[#7fa08c]/40`}
            data-testid="dalat-journey-previous"
            disabled={travelling || atStart}
            onClick={() => handleNavigate("previous")}
            type="button"
          >
            {t("previous")}
          </button>
          <button
            aria-pressed={state.reducedMotion}
            className={`${styles.journeyControlReduced} pointer-events-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[#c9b98a]/70 bg-[#1a1c14]/90 px-5 text-sm font-semibold text-[#f5f2e8] transition-colors hover:bg-[#2a2a1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9b98a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08120f]`}
            data-testid="dalat-journey-reduced-motion"
            onClick={() =>
              dispatch({ type: "setReducedMotion", value: !state.reducedMotion })}
            type="button"
          >
            {t("reducedMotion")}
          </button>
          <button
            className={`${styles.journeyControlNext} pointer-events-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[#7fa08c]/70 bg-[#10201a]/90 px-5 text-sm font-semibold text-[#f5f2e8] transition-colors hover:bg-[#173027] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fa08c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08120f] disabled:cursor-not-allowed disabled:border-[#7fa08c]/25 disabled:text-[#7fa08c]/40`}
            data-testid="dalat-journey-next"
            disabled={travelling || atEnd}
            onClick={() => handleNavigate("next")}
            type="button"
          >
            {t("next")}
          </button>
        </div>
      ) : null}
    </main>
  );
}
