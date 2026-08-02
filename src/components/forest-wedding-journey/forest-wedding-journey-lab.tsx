"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import { useFormatter, useTranslations } from "next-intl";

import {
  buildForestJourneyScenes,
  forestWeddingJourneyDefinition,
  forestWeddingJourneyDemoContent,
  forestWeddingJourneyFeatures,
  type ForestJourneySceneType,
} from "@/data/forest-wedding-journey";

import {
  createInitialForestJourneyState,
  forestJourneyReducer,
  type ForestJourneyAction,
} from "./forest-journey-controller";
import { useForestJourneyLocalInteractions } from "./forest-interactive-scenes";
import {
  ForestJourneyFallback,
} from "./forest-journey-fallback";
import type {
  ForestJourneySceneNames,
  ForestSceneLabels,
} from "./forest-scene-content";
import { useForestJourneyInput } from "./use-forest-journey-input";
import styles from "./forest-wedding-journey.module.css";

import type { ForestJourneyCanvasProps } from "./forest-journey-canvas";

function ForestJourneyCanvasImportFailure({
  onUnavailable,
}: ForestJourneyCanvasProps) {
  useEffect(() => {
    onUnavailable();
  }, [onUnavailable]);

  return null;
}

const ForestJourneyCanvas = dynamic(
  () => import("./forest-journey-canvas")
    .then((module) => module.ForestJourneyCanvas)
    .catch(() => ForestJourneyCanvasImportFailure),
  { ssr: false },
);

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const LOOK_DIAGNOSTIC_INTERVAL_MS = 80;

export type ForestWeddingJourneyFixture = "default" | "long-copy";

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function reducedMotionSnapshot(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function serverReducedMotionSnapshot(): boolean {
  return false;
}

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return null;

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    ? date
    : null;
}

export function ForestWeddingJourneyLab({
  fixture = "default",
}: {
  readonly fixture?: ForestWeddingJourneyFixture;
}) {
  const format = useFormatter();
  const t = useTranslations("forestWeddingJourneyLab");
  const content = useMemo(() => {
    const longCopy = fixture === "long-copy";
    const scheduleLabels = [
      t("demoContent.schedule.guestWelcome"),
      t("demoContent.schedule.banquetOpening"),
      t("demoContent.schedule.toastAndCake"),
      t("demoContent.schedule.mainCourse"),
      t("demoContent.schedule.farewell"),
    ];
    const wishMessages = [
      t("demoContent.wishes.first"),
      t("demoContent.wishes.second"),
    ];

    return {
      ...forestWeddingJourneyDemoContent,
      ceremonyHeader: t("demoContent.ceremonyHeader"),
      families: {
        ...forestWeddingJourneyDemoContent.families,
        brideParentTitle: longCopy
          ? t("longCopy.familyParentTitle")
          : t("demoContent.families.brideParentTitle"),
        groomParentTitle: longCopy
          ? t("longCopy.familyParentTitle")
          : t("demoContent.families.groomParentTitle"),
      },
      mapQuery: longCopy
        ? t("longCopy.venueAddress")
        : forestWeddingJourneyDemoContent.mapQuery,
      openingMessage: t("demoContent.openingMessage"),
      schedule: forestWeddingJourneyDemoContent.schedule.map((item, index) => ({
        ...item,
        label: scheduleLabels[index] ?? item.label,
      })),
      venueAddress: longCopy
        ? t("longCopy.venueAddress")
        : forestWeddingJourneyDemoContent.venueAddress,
      wishes: forestWeddingJourneyDemoContent.wishes.map((wish, index) => ({
        ...wish,
        message: wishMessages[index] ?? wish.message,
      })),
    };
  }, [fixture, t]);
  const interactions = useForestJourneyLocalInteractions(
    content.wishes,
  );
  const scenes = useMemo(
    () => buildForestJourneyScenes(content, forestWeddingJourneyFeatures),
    [content],
  );
  const [state, dispatch] = useReducer(
    forestJourneyReducer,
    scenes.length,
    (sceneCount) => createInitialForestJourneyState(sceneCount, false),
  );
  const [rendererReady, setRendererReady] = useState(false);
  const [gateDeparted, setGateDeparted] = useState(false);
  const [webglCapability, setWebglCapability] = useState<
    "available" | "checking"
  >("checking");
  const systemReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    reducedMotionSnapshot,
    serverReducedMotionSnapshot,
  );
  const effectiveReducedMotion = systemReducedMotion || state.reducedMotion;
  const [travelReducedMotion, setTravelReducedMotion] = useState(effectiveReducedMotion);
  const stageRef = useRef<HTMLElement | null>(null);
  const previousPhaseRef = useRef(state.phase);
  const gateDepartedRef = useRef(false);
  const stateRef = useRef(state);
  const liveLookRef = useRef(state.look);
  const invalidateRef = useRef<(() => void) | null>(null);
  const lookDiagnosticTimerRef = useRef<number | null>(null);
  const lastLookDiagnosticAtRef = useRef(0);
  const effectiveReducedMotionRef = useRef(effectiveReducedMotion);
  const displayedIndex = state.targetIndex ?? state.currentIndex;
  const activeScene = scenes[displayedIndex] ?? scenes[state.currentIndex] ?? scenes[0];
  const [firstName, secondName] = content.brideFirst
    ? [content.brideName, content.groomName]
    : [content.groomName, content.brideName];
  const ceremonyDate = parseIsoDate(content.ceremonyDate);
  const receptionDate = parseIsoDate(content.receptionDate);
  const formattedCeremonyDate = ceremonyDate
    ? format.dateTime(ceremonyDate, {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
      year: "numeric",
    })
    : content.ceremonyDate;
  const formattedReceptionDate = receptionDate
    ? format.dateTime(receptionDate, {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
      year: "numeric",
    })
    : content.receptionDate;
  const sceneNames = useMemo<ForestJourneySceneNames>(() => {
    const names: Record<ForestJourneySceneType, string> = {
      "cover-gate": t("sceneNames.coverGate"),
      "families": t("sceneNames.families"),
      "opening-message": t("sceneNames.openingMessage"),
      "calendar": t("sceneNames.calendar"),
      "schedule": t("sceneNames.schedule"),
      "gallery-photo": t("sceneNames.galleryPhoto"),
      "dress-code": t("sceneNames.dressCode"),
      "venue": t("sceneNames.venue"),
      "map": t("sceneNames.map"),
      "rsvp": t("sceneNames.rsvp"),
      "wishes": t("sceneNames.wishes"),
      "gift": t("sceneNames.gift"),
      "finale": t("sceneNames.finale"),
    };

    return names;
  }, [t]);
  const labels = useMemo<ForestSceneLabels>(() => ({
    addToCalendar: t("labels.addToCalendar"),
    accountHolder: t("labels.accountHolder"),
    accountNumber: t("labels.accountNumber"),
    attendingNo: t("labels.attendingNo"),
    attendingYes: t("labels.attendingYes"),
    bankName: t("labels.bankName"),
    brideFamily: t("labels.brideFamily"),
    ceremony: t("labels.ceremony"),
    closeGift: t("labels.closeGift"),
    date: t("labels.date"),
    directions: t("labels.directions"),
    formError: t("labels.formError"),
    formattedCeremonyDate,
    formattedReceptionDate,
    groomFamily: t("labels.groomFamily"),
    giftUnavailable: t("labels.giftUnavailable"),
    invitation: t("labels.invitation"),
    mapUnavailable: t("labels.mapUnavailable"),
    openGift: t("labels.openGift"),
    photoAlt: t("labels.photoAlt"),
    photoUnavailable: t("labels.photoUnavailable"),
    reception: t("labels.reception"),
    rsvpAttendance: fixture === "long-copy"
      ? t("longCopy.labels.rsvpAttendance")
      : t("labels.rsvpAttendance"),
    rsvpGuests: t("labels.rsvpGuests"),
    rsvpGuestsInvalid: t("labels.rsvpGuestsInvalid"),
    rsvpName: t("labels.rsvpName"),
    rsvpNameRequired: t("labels.rsvpNameRequired"),
    rsvpNotes: fixture === "long-copy"
      ? t("longCopy.labels.rsvpNotes")
      : t("labels.rsvpNotes"),
    rsvpSubmit: t("labels.rsvpSubmit"),
    rsvpSuccess: t("labels.rsvpSuccess"),
    thankYou: t("labels.thankYou"),
    time: t("labels.time"),
    wishName: t("labels.wishName"),
    wishRequired: t("labels.wishRequired"),
    wishSubmit: t("labels.wishSubmit"),
    wishSuccess: t("labels.wishSuccess"),
    wishText: fixture === "long-copy"
      ? t("longCopy.labels.wishText")
      : t("labels.wishText"),
  }), [fixture, formattedCeremonyDate, formattedReceptionDate, t]);
  const cancelPendingLookDiagnostic = useCallback(() => {
    if (lookDiagnosticTimerRef.current === null) return;
    window.clearTimeout(lookDiagnosticTimerRef.current);
    lookDiagnosticTimerRef.current = null;
  }, []);
  const dispatchJourney = useCallback((action: ForestJourneyAction) => {
    const currentState = stateRef.current;
    const predictedState = forestJourneyReducer(currentState, action);
    if (currentState.phase !== "travelling" && predictedState.phase === "travelling") {
      cancelPendingLookDiagnostic();
      setTravelReducedMotion(effectiveReducedMotionRef.current);
      if (currentState.renderMode === "fallback") {
        liveLookRef.current = { pitchDegrees: 0, yawDegrees: 0 };
      }
    }
    stateRef.current = predictedState;
    if (predictedState.currentIndex > 0 && !gateDepartedRef.current) {
      gateDepartedRef.current = true;
      setGateDeparted(true);
    }
    dispatch(action);
  }, [cancelPendingLookDiagnostic]);
  const handleFallbackReady = useCallback(() => {
    setRendererReady(true);
  }, []);
  const handleWebglReady = useCallback(() => {
    setRendererReady(true);
  }, []);
  const handleWebglArrive = useCallback(() => {
    dispatchJourney({ type: "arrive" });
  }, [dispatchJourney]);
  const handleRendererUnavailable = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.renderMode === "fallback") return;
    cancelPendingLookDiagnostic();
    const fallbackLook = currentState.phase === "settled"
      ? liveLookRef.current
      : { pitchDegrees: 0, yawDegrees: 0 };
    liveLookRef.current = fallbackLook;
    invalidateRef.current = null;
    setRendererReady(false);
    dispatchJourney({ look: fallbackLook, type: "rendererFallback" });
  }, [cancelPendingLookDiagnostic, dispatchJourney]);
  const handleLook = useCallback((pitchDeltaDegrees: number, yawDeltaDegrees: number) => {
    const currentState = stateRef.current;
    if (
      effectiveReducedMotionRef.current
      || (currentState.phase !== "settled" && currentState.phase !== "fallback-settled")
    ) {
      return;
    }

    const currentLook = liveLookRef.current;
    const nextLook = {
      pitchDegrees: Math.max(
        -forestWeddingJourneyDefinition.look.pitchDegrees,
        Math.min(
          forestWeddingJourneyDefinition.look.pitchDegrees,
          currentLook.pitchDegrees + pitchDeltaDegrees,
        ),
      ),
      yawDegrees: Math.max(
        -forestWeddingJourneyDefinition.look.yawDegrees,
        Math.min(
          forestWeddingJourneyDefinition.look.yawDegrees,
          currentLook.yawDegrees + yawDeltaDegrees,
        ),
      ),
    };
    liveLookRef.current = nextLook;
    invalidateRef.current?.();

    const dispatchDiagnostic = () => {
      lookDiagnosticTimerRef.current = null;
      if (
        stateRef.current.phase !== "settled"
        && stateRef.current.phase !== "fallback-settled"
      ) {
        return;
      }
      lastLookDiagnosticAtRef.current = window.performance.now();
      dispatchJourney({
        pitchDegrees: liveLookRef.current.pitchDegrees,
        type: "look",
        yawDegrees: liveLookRef.current.yawDegrees,
      });
    };
    const elapsed = window.performance.now() - lastLookDiagnosticAtRef.current;
    if (elapsed >= LOOK_DIAGNOSTIC_INTERVAL_MS) {
      cancelPendingLookDiagnostic();
      dispatchDiagnostic();
    } else if (lookDiagnosticTimerRef.current === null) {
      lookDiagnosticTimerRef.current = window.setTimeout(
        dispatchDiagnostic,
        LOOK_DIAGNOSTIC_INTERVAL_MS - elapsed,
      );
    }
  }, [cancelPendingLookDiagnostic, dispatchJourney]);
  const handleInvalidateReady = useCallback((invalidate: (() => void) | null) => {
    invalidateRef.current = invalidate;
  }, []);
  const inputEnabled = state.phase === "settled" || state.phase === "fallback-settled";

  useLayoutEffect(() => {
    stateRef.current = state;
    effectiveReducedMotionRef.current = effectiveReducedMotion;
  }, [effectiveReducedMotion, state]);

  useEffect(() => {
    if (!effectiveReducedMotion) return;
    cancelPendingLookDiagnostic();
    liveLookRef.current = { pitchDegrees: 0, yawDegrees: 0 };
    dispatchJourney({ type: "resetLook" });
    invalidateRef.current?.();
  }, [cancelPendingLookDiagnostic, dispatchJourney, effectiveReducedMotion]);

  useEffect(() => () => {
    cancelPendingLookDiagnostic();
    invalidateRef.current = null;
  }, [cancelPendingLookDiagnostic]);

  useEffect(() => {
    const previousPhase = previousPhaseRef.current;
    previousPhaseRef.current = state.phase;
    const arrived = previousPhase === "travelling"
      && (state.phase === "settled" || state.phase === "fallback-settled");
    if (
      !arrived
      || (state.navigationSource !== "button" && state.navigationSource !== "keyboard")
    ) {
      return;
    }

    const scene = scenes[state.currentIndex];
    if (!scene) return;
    const frame = window.requestAnimationFrame(() => {
      const heading = stageRef.current?.querySelector<HTMLHeadingElement>(
        `[data-forest-scene-id="${scene.id}"][data-forest-interactive="true"] h2`,
      );
      heading?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [scenes, state.currentIndex, state.navigationSource, state.phase]);

  useForestJourneyInput(stageRef, {
    enabled: inputEnabled,
    onLook: handleLook,
    onNavigate: (direction, source) => {
      dispatchJourney({ source, type: direction });
    },
  });

  useEffect(() => {
    let active = true;
    let completionFrame: number | null = null;
    const canvas = document.createElement("canvas");
    let contextAvailable = false;

    try {
      const context = canvas.getContext("webgl2");
      contextAvailable = context !== null;
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      contextAvailable = false;
    }

    completionFrame = window.requestAnimationFrame(() => {
      completionFrame = null;
      if (!active) return;
      if (contextAvailable) {
        setWebglCapability("available");
      } else {
        handleRendererUnavailable();
      }
    });

    return () => {
      active = false;
      if (completionFrame !== null) {
        window.cancelAnimationFrame(completionFrame);
      }
    };
  }, [handleRendererUnavailable]);

  useEffect(() => {
    if (state.renderMode !== "fallback" || state.phase !== "travelling") return;

    const duration = travelReducedMotion ? 180 : 650;
    const timer = window.setTimeout(() => {
      dispatchJourney({ type: "arrive" });
    }, duration);

    return () => {
      window.clearTimeout(timer);
    };
  }, [dispatchJourney, state.phase, state.renderMode, travelReducedMotion]);

  if (!activeScene) return null;

  const atFinale = state.currentIndex === scenes.length - 1;
  const controlsDisabled = !rendererReady || state.phase === "travelling";
  const atThreshold = state.phase === "threshold";
  const thresholdDeparted = gateDeparted || state.currentIndex > 0;
  const showThresholdVoile = !thresholdDeparted
    && (atThreshold || (state.phase === "travelling" && state.currentIndex === 0));
  const fallbackInactive = atThreshold || state.phase === "travelling";
  const settledScene = scenes[state.currentIndex] ?? activeScene;
  const targetScene = state.targetIndex === null ? null : scenes[state.targetIndex] ?? null;
  const settledSceneName = sceneNames[settledScene.type];
  const renderedReducedMotion = state.phase === "travelling"
    ? travelReducedMotion
    : effectiveReducedMotion;

  return (
    <main
      className={styles.stage}
      data-gesture-active={inputEnabled ? "true" : "false"}
      data-journey-phase={state.phase}
      data-look-pitch={state.look.pitchDegrees}
      data-look-yaw={state.look.yawDegrees}
      data-renderer={state.renderMode === "fallback"
        ? "fallback"
        : rendererReady
          ? "webgl"
          : "loading"}
      data-scene={activeScene.type}
      data-scene-id={activeScene.id}
      data-scene-index={displayedIndex}
      data-scene-total={scenes.length}
      data-current-scene-id={settledScene.id}
      data-current-scene-index={state.currentIndex}
      data-target-scene-id={targetScene?.id ?? ""}
      data-target-scene-index={state.targetIndex ?? ""}
      data-testid="forest-journey-stage"
      ref={stageRef}
    >
      {state.renderMode === "webgl" && webglCapability === "available" ? (
        <ForestJourneyCanvas
          activeIndex={state.currentIndex}
          content={content}
          interactions={interactions}
          labels={labels}
          lookRef={liveLookRef}
          onArrive={handleWebglArrive}
          onInvalidateReady={handleInvalidateReady}
          onReady={handleWebglReady}
          onUnavailable={handleRendererUnavailable}
          phase={state.phase}
          reducedMotion={renderedReducedMotion}
          sceneNames={sceneNames}
          scenes={scenes}
          targetIndex={state.targetIndex}
        />
      ) : null}

      {state.renderMode === "fallback" ? (
        <div
          aria-hidden={fallbackInactive ? "true" : undefined}
          className={styles.fallbackShell}
          inert={fallbackInactive ? true : undefined}
        >
          <ForestJourneyFallback
            content={content}
            currentIndex={state.currentIndex}
            inputEnabled={inputEnabled}
            interactions={interactions}
            labels={labels}
            look={state.look}
            onReady={handleFallbackReady}
            reducedMotion={renderedReducedMotion}
            sceneNames={sceneNames}
            scenes={scenes}
            targetIndex={state.targetIndex}
            travelling={state.phase === "travelling"}
          />
        </div>
      ) : null}

      {showThresholdVoile ? (
        <section className={styles.entry} aria-labelledby="forest-journey-entry-title">
          <div
            aria-hidden={!atThreshold ? "true" : undefined}
            className={styles.entryVoile}
            data-departing={!atThreshold ? "true" : "false"}
            data-testid="forest-journey-voile"
            inert={!atThreshold ? true : undefined}
          >
            <p className={styles.kicker}>{t("entryKicker")}</p>
            <h1
              className={styles.names}
              data-testid="forest-journey-couple"
              id="forest-journey-entry-title"
            >
              <span>{firstName}</span>
              <span>&amp;</span>
              <span>{secondName}</span>
            </h1>
            <div className={styles.dates}>
              <time dateTime={content.receptionDate}>
                {formattedReceptionDate}
              </time>
            </div>
            <p className={styles.body}>{t("entryBody")}</p>
            {!rendererReady || state.renderMode === "fallback" ? (
              <p className={styles.loading} role="status">
                {rendererReady ? t("fallbackNotice") : t("loading")}
              </p>
            ) : null}
            <button
              className={styles.enter}
              data-testid="forest-journey-enter"
              disabled={!rendererReady || !atThreshold}
              onClick={() => dispatchJourney({ source: "button", type: "enter" })}
              type="button"
            >
              {t("enter")}
            </button>
          </div>
        </section>
      ) : null}

      {!atThreshold ? (
        <>
          <p aria-live="polite" className={styles.sceneStatus}>
            {t("sceneStatus", {
              current: state.currentIndex + 1,
              name: settledSceneName,
              total: scenes.length,
            })}
          </p>
          <nav className={styles.controls}>
            <button
              className={styles.controlButton}
              data-testid="forest-journey-previous"
              disabled={controlsDisabled || state.currentIndex === 0}
              onClick={() => dispatchJourney({ source: "button", type: "previous" })}
              type="button"
            >
              {t("previous")}
            </button>
            <button
              className={styles.controlButton}
              data-testid="forest-journey-next"
              disabled={controlsDisabled || atFinale}
              onClick={() => dispatchJourney({ source: "button", type: "next" })}
              type="button"
            >
              {t("next")}
            </button>
            <button
              aria-pressed={effectiveReducedMotion}
              className={styles.controlButton}
              data-testid="forest-journey-reduced-motion"
              disabled={state.phase === "travelling"}
              onClick={() => dispatchJourney({
                type: "setReducedMotion",
                value: systemReducedMotion ? false : !state.reducedMotion,
              })}
              type="button"
            >
              {t("reducedMotion")}
            </button>
          </nav>
        </>
      ) : null}
    </main>
  );
}
