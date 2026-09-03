"use client";

import { useInvitationCoverReady } from "@/hooks/use-invitation-cover-ready";
import { PreparedInvitationDetail } from "@/components/prepared-invitation-detail";

import { Pause, Play, Rotate3D, RotateCcw } from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { gsap } from "gsap";

import { DetectiveConanCasebookFallback } from "@/components/detective-conan-casebook/conan-casebook-fallback";
import { ConanCasebookFittedName } from "@/components/detective-conan-casebook/conan-casebook-fitted-name";
import { HeroTypographyScope } from "@/components/hero-typography-provider";
import { DetectiveConanCasebookReader } from "@/components/detective-conan-casebook/conan-casebook-reader";
import type {
  ConanCasebookCoverContent,
  ConanCasebookSceneHandle,
} from "@/components/detective-conan-casebook/conan-casebook-scene-types";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  detectiveConanCasebookOpeningDuration,
  detectiveConanCasebookPilot,
  detectiveConanCasebookPilotContent,
  type DetectiveConanCasebookExperienceState,
  type DetectiveConanCasebookMotionPhase,
} from "@/data/detective-conan-casebook-pilot";
import { longestCoupleNameLength, orderedCouple } from "@/lib/invitation-display";
import { cn } from "@/lib/utils";

const DetectiveConanCasebookScene = dynamic(
  () => import(
    "@/components/detective-conan-casebook/conan-casebook-scene"
  ).then((module) => module.DetectiveConanCasebookScene),
  { ssr: false },
);

const stateTranslationKeys: Record<
  DetectiveConanCasebookExperienceState,
  "stateClosed" | "stateOpening" | "stateHandoff" | "stateOpened"
> = {
  closed: "stateClosed",
  opening: "stateOpening",
  handoff: "stateHandoff",
  opened: "stateOpened",
};

type DetectiveConanCasebookLabProps = {
  content?: ChungDoiDemoContent;
  lockDocument?: boolean;
  muted?: boolean;
  onStateChange?: (state: DetectiveConanCasebookExperienceState) => void;
  showControls?: boolean;
};

type SceneBoundaryProps = {
  children: ReactNode;
  onError: () => void;
};

type SceneBoundaryState = {
  hasError: boolean;
};

class SceneBoundary extends Component<
  SceneBoundaryProps,
  SceneBoundaryState
> {
  state: SceneBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SceneBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

function supportsWebGl(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function useMobileQuery(): boolean | null {
  const [matches, setMatches] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const update = () => setMatches(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return matches;
}

type PhysicalCue = "latch" | "paper" | "settle";

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function useCasebookAudio(muted: boolean) {
  const contextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (contextRef.current) return contextRef.current;
    const AudioContextConstructor = window.AudioContext
      ?? (window as WindowWithWebkitAudio).webkitAudioContext;
    if (!AudioContextConstructor) return null;
    const context = new AudioContextConstructor();
    contextRef.current = context;
    return context;
  }, []);

  const play = useCallback((cue: PhysicalCue) => {
    if (muted) return;
    const context = getContext();
    if (!context) return;

    const run = () => {
      const now = context.currentTime;
      const duration = cue === "paper" ? 0.28 : 0.12;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(
        cue === "latch" ? 0.09 : 0.055,
        now + 0.012,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      gain.connect(context.destination);

      if (cue === "latch") {
        const oscillator = context.createOscillator();
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(330, now);
        oscillator.frequency.exponentialRampToValueAtTime(190, now + duration);
        oscillator.connect(gain);
        oscillator.start(now);
        oscillator.stop(now + duration);
      } else {
        const buffer = context.createBuffer(
          1,
          Math.ceil(context.sampleRate * duration),
          context.sampleRate,
        );
        const channel = buffer.getChannelData(0);
        for (let index = 0; index < channel.length; index += 1) {
          const envelope = 1 - index / channel.length;
          channel[index] = (Math.random() * 2 - 1) * envelope * envelope;
        }
        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(cue === "paper" ? 920 : 460, now);
        source.buffer = buffer;
        source.connect(filter);
        filter.connect(gain);
        source.start(now);
        source.stop(now + duration);
      }

      window.setTimeout(() => gain.disconnect(), 420);
    };

    if (context.state === "suspended") {
      void context.resume().then(run).catch(() => undefined);
    } else {
      run();
    }
  }, [getContext, muted]);

  useEffect(() => () => {
    const context = contextRef.current;
    contextRef.current = null;
    if (context && context.state !== "closed") {
      void context.close();
    }
  }, []);

  return { play };
}

function formatCasebookDate(iso: string, time: string, locale: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return `${iso} / ${time}`;

  const localized = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
  return `${localized} / ${time}`;
}

/**
 * Nhận độ dài tên dài nhất của cặp (không phải một tên) để cả hai tên dùng chung
 * một cỡ chữ — xem `longestCoupleNameLength`.
 */
function coverNameSizeClass(length: number): string {
  if (length > 36) {
    return "text-[clamp(0.72rem,3vw,1.8rem)] tracking-[-0.01em]";
  }
  if (length > 24) {
    return "text-[clamp(1.05rem,4.5vw,2.6rem)] tracking-[-0.02em]";
  }
  if (length > 15) {
    return "text-[clamp(1.55rem,6.5vw,3.8rem)] tracking-[-0.025em]";
  }
  return "text-[clamp(2.5rem,11vw,5.5rem)] tracking-[-0.035em]";
}

export function DetectiveConanCasebookLab({
  content = detectiveConanCasebookPilotContent,
  lockDocument = true,
  muted = false,
  onStateChange,
  showControls = true,
}: DetectiveConanCasebookLabProps) {
  const locale = useLocale();
  const t = useTranslations("detectiveConanCasebookLab");
  const stageRef = useRef<HTMLElement>(null);
  const readerLayerRef = useRef<HTMLDivElement>(null);
  const sceneHandleRef = useRef<ConanCasebookSceneHandle | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const handoffFrameRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const openingRequestRef = useRef(false);
  const timelineProgressValueRef = useRef(-1);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [coverReady, setCoverReady] = useState(false);
  const handleCoverReady = useCallback(() => setCoverReady(true), []);
  const [backFaceVisible, setBackFaceVisible] = useState(false);
  const [state, setState] =
    useState<DetectiveConanCasebookExperienceState>("closed");
  const [motionPhase, setMotionPhase] = useState<
    DetectiveConanCasebookMotionPhase | "idle"
  >("idle");
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [hasTimeline, setHasTimeline] = useState(false);
  const [forceReducedMotion, setForceReducedMotion] = useState(false);
  const systemReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isMobile = useMobileQuery();
  const reducedMotion = forceReducedMotion || systemReducedMotion;
  const { play: playPhysicalCue } = useCasebookAudio(muted);
  const people = orderedCouple(content);
  const firstName = people[0].shortName;
  const secondName = people[1].shortName;
  // Một cỡ chữ dùng chung cho cả hai tên, chọn theo tên dài hơn.
  const coupleNameSizeClass = coverNameSizeClass(
    longestCoupleNameLength(firstName, secondName),
  );
  const openingMessage = content.couple.openingMessage ?? "";
  const conjunction = t("and");
  const backTitle = t("backTitle");
  const coverKicker = t("coverKicker");
  const dateAndTime = formatCasebookDate(
    content.couple.date,
    content.couple.time,
    locale,
  );
  const coverContent = useMemo<ConanCasebookCoverContent>(() => ({
    backDate: dateAndTime,
    backMessage: openingMessage,
    backNames: `${firstName} ${conjunction} ${secondName}`,
    backTitle,
    caseNumber: "4869",
    conjunction,
    dateAndTime,
    firstName,
    kicker: coverKicker,
    secondName,
  }), [
    backTitle,
    conjunction,
    coverKicker,
    dateAndTime,
    firstName,
    openingMessage,
    secondName,
  ]);

  const handleSceneReady = useCallback(() => {
    setSceneReady(true);
  }, []);

  const handleSceneHandle = useCallback((
    handle: ConanCasebookSceneHandle,
  ) => {
    sceneHandleRef.current = handle;
  }, []);

  useEffect(() => {
    onStateChange?.(state);
  }, [onStateChange, state]);

  useEffect(() => {
    if (!lockDocument) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalRootOverflow = document.documentElement.style.overflow;
    const originalOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    window.scrollTo({ behavior: "auto", top: 0 });

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalRootOverflow;
      document.documentElement.style.overscrollBehavior = originalOverscroll;
    };
  }, [lockDocument]);

  useEffect(() => {
    const detect = window.setTimeout(() => {
      setWebglSupported(supportsWebGl());
    }, 0);
    return () => window.clearTimeout(detect);
  }, []);

  useEffect(() => {
    const image = new Image();
    image.decoding = "async";
    image.src = isMobile
      ? detectiveConanCasebookPilot.assets.shinichiRanMobile
      : detectiveConanCasebookPilot.assets.shinichiRan;
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [isMobile]);

  useEffect(() => () => {
    timelineRef.current?.kill();
    if (handoffFrameRef.current !== null) {
      window.cancelAnimationFrame(handoffFrameRef.current);
    }
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
    }
  }, []);

  const updateTimelineProgress = useCallback((progress: number) => {
    const next = Math.round(progress * 100);
    if (next === timelineProgressValueRef.current) return;
    timelineProgressValueRef.current = next;
    if (!showControls && next !== 0 && next !== 100) return;
    stageRef.current?.setAttribute("data-book-progress", String(next));
    setTimelineProgress((current) => (
      next === 0 || next === 100 || Math.abs(next - current) >= 5
        ? next
        : current
    ));
  }, [showControls]);

  const finalizeHandoff = useCallback(() => {
    if (handoffFrameRef.current !== null) {
      window.cancelAnimationFrame(handoffFrameRef.current);
    }

    handoffFrameRef.current = window.requestAnimationFrame(() => {
      handoffFrameRef.current = window.requestAnimationFrame(() => {
        timelineRef.current?.kill();
        timelineRef.current = null;
        setState("opened");
        const focusTarget = readerLayerRef.current?.querySelector<HTMLElement>(
          '[data-position="current"] [data-chapter-heading]',
        ) ?? readerLayerRef.current?.querySelector<HTMLElement>(
          "[data-physical-handoff-target]",
        );
        focusTarget?.focus({ preventScroll: true });
        playPhysicalCue("settle");
        handoffFrameRef.current = null;
      });
    });
  }, [playPhysicalCue]);

  const beginFallbackOpening = useCallback(() => {
    if (isMobile === null) return;
    const durationMs = detectiveConanCasebookOpeningDuration({
      isMobile,
      reducedMotion,
    });
    const handoffDurationMs = reducedMotion ? 80 : isMobile ? 300 : 320;
    const handoffStartMs = reducedMotion
      ? Math.max(0, durationMs - handoffDurationMs)
      : isMobile
        ? 900
        : 1050;

    openingRequestRef.current = true;
    setState("opening");
    setMotionPhase("cover-turn");
    setTimelineProgress(0);
    playPhysicalCue("latch");
    if (!reducedMotion && "vibrate" in navigator) navigator.vibrate(7);

    fallbackTimerRef.current = window.setTimeout(() => {
      fallbackTimerRef.current = null;
      setState("handoff");
      setMotionPhase("handoff");
      const readerLayer = readerLayerRef.current;
      const stage = stageRef.current;

      if (!readerLayer || !stage) {
        updateTimelineProgress(1);
        finalizeHandoff();
        return;
      }

      const handoffTimeline = gsap.timeline({
        onComplete: () => {
          updateTimelineProgress(1);
          finalizeHandoff();
        },
      });
      handoffTimeline
        .to(readerLayer, {
          duration: handoffDurationMs / 1000,
          ease: "power1.inOut",
          opacity: 1,
        })
        .to(stage, {
          duration: handoffDurationMs / 1000,
          ease: "power1.inOut",
          opacity: 0,
        }, 0);
      timelineRef.current = handoffTimeline;
    }, handoffStartMs);
  }, [
    finalizeHandoff,
    isMobile,
    playPhysicalCue,
    reducedMotion,
    updateTimelineProgress,
  ]);

  const openCasebook = useCallback(() => {
    if (
      openingRequestRef.current
      || isMobile === null
      || state !== "closed"
      || backFaceVisible
    ) {
      return;
    }

    if (webglSupported === false) {
      beginFallbackOpening();
      return;
    }

    const scene = sceneHandleRef.current;
    const targets = scene?.getMotionTargets();
    const openingPose = scene?.snapshotPose();
    if (!scene || !targets || !openingPose) return;

    openingRequestRef.current = true;
    scene.lockControls();
    setState("opening");
    setMotionPhase("anticipation");
    updateTimelineProgress(0);
    playPhysicalCue("latch");
    if (!reducedMotion && "vibrate" in navigator) navigator.vibrate(7);

    const duration = detectiveConanCasebookOpeningDuration({
      isMobile,
      reducedMotion,
    }) / 1000;
    const unlockAt = duration * 0.035;
    const coverAt = duration * 0.055;
    const revealAt = duration * 0.22;
    const settleAt = duration * 0.31;
    const handoffAt = duration * 0.78;
    const handoffDuration = Math.max(
      reducedMotion ? 0.08 : isMobile ? 0.28 : 0.32,
      duration * 0.16,
    );
    const cameraMotion = {
      targetX: openingPose.controlsTarget[0],
      targetY: openingPose.controlsTarget[1],
      targetZ: openingPose.controlsTarget[2],
      x: openingPose.cameraPosition[0],
      y: openingPose.cameraPosition[1],
      z: openingPose.cameraPosition[2],
    };
    const finalCamera = {
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      x: 0,
      y: reducedMotion ? 0.04 : 0.16,
      z: isMobile ? 10.7 : 8.8,
    };

    if (readerLayerRef.current) {
      gsap.set(readerLayerRef.current, { opacity: 0 });
    }
    if (stageRef.current) {
      gsap.set(stageRef.current, { opacity: 1 });
    }

    const timeline = gsap.timeline({
      paused: true,
      defaults: { ease: "power2.inOut" },
      onUpdate: () => {
        targets.invalidate();
        updateTimelineProgress(timeline.progress());
      },
      onComplete: () => updateTimelineProgress(1),
      onReverseComplete: () => {
        scene.reset();
        scene.unlockControls();
        openingRequestRef.current = false;
        setBackFaceVisible(false);
        setMotionPhase("idle");
        setState("closed");
        updateTimelineProgress(0);
      },
    });

    timeline
      .addLabel("anticipation", 0)
      .call(() => setMotionPhase("anticipation"), [], "anticipation")
      .to(
        targets.root.rotation,
        {
          duration: Math.max(0.04, duration * 0.18),
          ease: "sine.out",
          x: openingPose.rootRotation[0] * 0.48,
          y: openingPose.rootRotation[1] * 0.48,
          z: 0,
        },
        "anticipation",
      )
      .addLabel("unlock", unlockAt)
      .call(() => setMotionPhase("unlock"), [], "unlock")
      .to(
        targets.frontCoverMaterial,
        {
          duration: reducedMotion ? 0.03 : duration * 0.08,
          roughness: 0.72,
        },
        "unlock",
      )
      .addLabel("cover-turn", coverAt)
      .call(() => {
        setMotionPhase("cover-turn");
        playPhysicalCue("paper");
      }, [], "cover-turn")
      .to(
        targets.frontCoverPivot.rotation,
        {
          duration: reducedMotion ? 0.06 : duration * 0.61,
          ease: reducedMotion ? "power1.out" : "power2.inOut",
          y: reducedMotion ? -0.16 : -Math.PI * 0.96,
        },
        "cover-turn",
      )
      .addLabel("page-reveal", revealAt)
      .call(() => setMotionPhase("page-reveal"), [], "page-reveal")
      .to(
        targets.firstPagePivot.rotation,
        {
          duration: reducedMotion ? 0.03 : duration * 0.16,
          ease: "sine.out",
          y: reducedMotion ? -0.04 : -0.22,
        },
        "page-reveal",
      )
      .to(
        targets.firstPagePivot.rotation,
        {
          duration: reducedMotion ? 0.04 : duration * 0.32,
          ease: "sine.inOut",
          y: 0,
        },
        revealAt + (reducedMotion ? 0.03 : duration * 0.16),
      )
      .addLabel("settle", settleAt)
      .call(() => setMotionPhase("settle"), [], "settle")
      .to(
        cameraMotion,
        {
          ...finalCamera,
          duration: Math.max(0.06, handoffAt - settleAt),
          ease: "sine.inOut",
          onUpdate: () => {
            targets.camera.position.set(
              cameraMotion.x,
              cameraMotion.y,
              cameraMotion.z,
            );
            targets.controls.target.set(
              cameraMotion.targetX,
              cameraMotion.targetY,
              cameraMotion.targetZ,
            );
            targets.controls.update();
          },
        },
        "settle",
      )
      .to(
        targets.root.rotation,
        {
          duration: Math.max(0.06, handoffAt - settleAt),
          ease: "sine.inOut",
          x: 0,
          y: 0,
          z: 0,
        },
        "settle",
      )
      .addLabel("handoff", handoffAt)
      .call(() => {
        setState("handoff");
        setMotionPhase("handoff");
      }, [], "handoff");

    if (readerLayerRef.current) {
      timeline.to(
        readerLayerRef.current,
        {
          duration: handoffDuration,
          ease: "power1.inOut",
          opacity: 1,
        },
        "handoff",
      );
    }
    if (stageRef.current) {
      timeline.to(
        stageRef.current,
        {
          duration: handoffDuration,
          ease: "power1.inOut",
          opacity: 0,
        },
        "handoff",
      );
    }

    timeline.call(
      finalizeHandoff,
      [],
      handoffAt + handoffDuration,
    );

    timelineRef.current = timeline;
    setHasTimeline(true);
    timeline.play();
  }, [
    backFaceVisible,
    beginFallbackOpening,
    finalizeHandoff,
    isMobile,
    playPhysicalCue,
    reducedMotion,
    state,
    updateTimelineProgress,
    webglSupported,
  ]);

  const resetExperience = useCallback(() => {
    timelineRef.current?.kill();
    timelineRef.current = null;
    openingRequestRef.current = false;
    setHasTimeline(false);
    if (handoffFrameRef.current !== null) {
      window.cancelAnimationFrame(handoffFrameRef.current);
      handoffFrameRef.current = null;
    }
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    gsap.set(stageRef.current, { opacity: 1 });
    gsap.set(readerLayerRef.current, { opacity: 0 });
    setState("closed");
    setMotionPhase("idle");
    setTimelineProgress(0);
    setBackFaceVisible(false);

    sceneHandleRef.current?.reset();
    sceneHandleRef.current?.unlockControls();
  }, []);

  const seekTimeline = useCallback((progress: number) => {
    const timeline = timelineRef.current;
    const targets = sceneHandleRef.current?.getMotionTargets();
    if (!timeline || !targets) return;
    timeline.pause();
    timeline.progress(progress / 100, false);
    targets.controls.update();
    targets.invalidate();
    setState(progress === 0 ? "closed" : "opening");
    updateTimelineProgress(progress / 100);
  }, [updateTimelineProgress]);

  const toggleBackFace = useCallback(() => {
    if (state !== "closed") return;
    const next = !backFaceVisible;
    sceneHandleRef.current?.setBackFaceVisible(next);
    setBackFaceVisible(next);
  }, [backFaceVisible, state]);

  const canOpen = state === "closed"
    && !backFaceVisible
    && isMobile !== null
    && (webglSupported === false || sceneReady);
  useInvitationCoverReady(stageRef, canOpen, handleCoverReady);
  const fallbackMotion = reducedMotion
    ? "reduced"
    : isMobile
      ? "mobile"
      : "desktop";
  const readerActive = state === "handoff" || state === "opened";

  return (
    <div
      data-template-renderer="detective-conan-casebook"
      className="fixed inset-0 z-40 h-[100dvh] overflow-hidden bg-[#06111D] font-art-helvetica"
    >
      <div
        ref={readerLayerRef}
        aria-hidden={state === "closed" ? "true" : undefined}
        inert={state === "closed" ? true : undefined}
        className="fixed inset-0 z-40 opacity-0"
      >
        <PreparedInvitationDetail prepare={coverReady || state !== "closed"} visible={readerActive}>
          <HeroTypographyScope slug={content.slug} userFont={content.theme.userFontFamily}>
          <DetectiveConanCasebookReader
            active={readerActive}
            content={content}
            productionControls={!showControls}
          />
          </HeroTypographyScope>
        </PreparedInvitationDetail>
      </div>

      <section
        ref={stageRef}
        data-book-phase={motionPhase}
        data-book-progress={timelineProgress}
        data-book-state={state}
        data-motion={reducedMotion ? "reduced" : "full"}
        data-reader-ready="true"
        data-renderer={webglSupported === false ? "css" : "webgl"}
        data-testid="detective-conan-casebook-stage"
        className={cn(
          "fixed inset-0 z-50 isolate min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#28445D_0%,#111E2B_48%,#06111D_100%)]",
          state === "opened" && "pointer-events-none",
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:30px_30px]"
        />

        <div
          aria-hidden={state !== "closed"}
          className={cn(
            "pointer-events-none absolute inset-x-5 top-[max(1.25rem,env(safe-area-inset-top))] z-20 flex flex-col items-center text-center text-[#F6F1E7] transition-[opacity,transform] duration-500 sm:top-[7vh]",
            !showControls && "max-lg:hidden",
            state === "closed"
              ? "translate-y-0 opacity-100"
              : "-translate-y-3 opacity-0",
          )}
        >
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[#D85A63] sm:text-xs">
            {t("caseLabel")}
          </p>
          <h1 className="mt-2 max-w-full font-art-built font-normal leading-[0.82]">
            <ConanCasebookFittedName
              className={coupleNameSizeClass}
              name={people[0].shortName}
            />
            <span className="my-1 block text-[0.34em] tracking-[0.04em] text-[#D85A63]">
              +
            </span>
            <ConanCasebookFittedName
              className={coupleNameSizeClass}
              name={people[1].shortName}
            />
          </h1>
          <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-[0.09em] text-[#F6F1E7]/70 sm:text-xs">
            {dateAndTime}
          </p>
        </div>

        <div className="absolute inset-0 grid place-items-center">
          {webglSupported === true && isMobile !== null ? (
            <div className="absolute inset-0">
              <SceneBoundary
                onError={() => {
                  setSceneReady(false);
                  setWebglSupported(false);
                }}
              >
                <DetectiveConanCasebookScene
                  coverContent={coverContent}
                  isMobile={isMobile}
                  isOpening={state === "opening" || state === "handoff"}
                  onBackFaceChange={setBackFaceVisible}
                  onReady={handleSceneReady}
                  onSceneHandle={handleSceneHandle}
                />
              </SceneBoundary>
            </div>
          ) : null}

          {webglSupported === false && isMobile !== null ? (
            <DetectiveConanCasebookFallback
              coverContent={coverContent}
              flipped={backFaceVisible}
              isOpening={state === "opening" || state === "handoff"}
              motion={fallbackMotion}
              portraitSrc={
                isMobile
                  ? detectiveConanCasebookPilot.assets.shinichiRanMobile
                  : detectiveConanCasebookPilot.assets.shinichiRan
              }
            />
          ) : null}

          {webglSupported === null || isMobile === null ? (
            <div
              aria-hidden="true"
              className="h-[min(64dvh,36rem)] w-[min(72vw,25rem)] animate-pulse rounded-r-xl border-l-[1.1rem] border-[#0A1522] bg-[#123A63]/60 shadow-2xl motion-reduce:animate-none"
            />
          ) : null}
        </div>

        <div className="absolute inset-x-4 bottom-[max(1.2rem,env(safe-area-inset-bottom))] z-30 flex flex-col items-center gap-2.5">
          {state === "closed" ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                data-testid="detective-conan-casebook-open"
                disabled={!canOpen}
                onClick={openCasebook}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#D85A63] bg-[#B43A42] px-7 font-art-built text-xl tracking-[0.03em] text-[#FFFCF5] shadow-[0_1.1rem_3rem_rgba(0,0,0,.32)] transition-transform disabled:cursor-wait disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFCF5] focus-visible:ring-offset-4 focus-visible:ring-offset-[#06111D] active:scale-[0.98]"
              >
                {webglSupported === null || isMobile === null
                  ? t("loading")
                  : t("open")}
              </button>
              {webglSupported !== null ? (
                <button
                  type="button"
                  data-testid="detective-conan-casebook-back-face"
                  onClick={toggleBackFace}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/28 bg-[#06111D]/72 px-4 text-sm font-semibold text-[#F6F1E7] backdrop-blur-sm transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6F1E7] active:scale-[0.98]"
                >
                  <Rotate3D aria-hidden className="size-4" strokeWidth={1.6} />
                  {backFaceVisible ? t("viewFront") : t("viewBack")}
                </button>
              ) : null}
            </div>
          ) : null}
          {state === "closed" ? (
            <p className="max-w-[34ch] text-center text-sm leading-6 text-[#F6F1E7]/72">
              {t("closedHint")}
            </p>
          ) : null}
        </div>

        <p aria-live="polite" className="sr-only">
          {t(stateTranslationKeys[state])}
        </p>
      </section>

      {showControls ? (
        <aside className="fixed left-3 top-3 z-[70] grid max-w-[17rem] gap-2 rounded-xl border border-white/15 bg-[#06111D]/88 p-3 text-xs text-[#F6F1E7] shadow-xl backdrop-blur-md">
          <label className="flex min-h-9 items-center gap-2">
            <input
              type="checkbox"
              checked={forceReducedMotion}
              onChange={(event) => setForceReducedMotion(event.target.checked)}
              className="size-4 accent-[#B43A42]"
            />
            {t("forceReducedMotion")}
          </label>
          <label className="grid gap-1">
            <span>{t("timeline", { progress: timelineProgress })}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={timelineProgress}
              onChange={(event) => seekTimeline(Number(event.target.value))}
              disabled={!hasTimeline || state === "opened"}
              className="accent-[#B43A42] disabled:opacity-40"
            />
          </label>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => timelineRef.current?.play()}
              disabled={!hasTimeline || state === "opened"}
              className="inline-flex min-h-9 items-center gap-1 rounded-full border border-white/18 px-3 disabled:opacity-40"
            >
              <Play aria-hidden className="size-3.5" />
              {t("play")}
            </button>
            <button
              type="button"
              onClick={() => timelineRef.current?.pause()}
              disabled={!hasTimeline || state === "opened"}
              className="inline-flex min-h-9 items-center gap-1 rounded-full border border-white/18 px-3 disabled:opacity-40"
            >
              <Pause aria-hidden className="size-3.5" />
              {t("pause")}
            </button>
            <button
              type="button"
              onClick={resetExperience}
              className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[#D85A63]/60 px-3"
            >
              <RotateCcw aria-hidden className="size-3.5" />
              {t("reset")}
            </button>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
