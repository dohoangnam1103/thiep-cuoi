"use client";

import { useInvitationCoverReady } from "@/hooks/use-invitation-cover-ready";

import { useGSAP } from "@gsap/react";
import { Pause, Play, RotateCcw } from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { gsap } from "gsap";

import { DoraemonDoorFallback } from "@/components/doraemon-door/doraemon-door-fallback";
import {
  DoraemonDoorHandoffHero,
  DoraemonDoorInvitationBody,
  formatDoraemonDoorLocalizedDate,
} from "@/components/doraemon-door/doraemon-door-invitation";
import type { DoraemonDoorSceneHandle } from "@/components/doraemon-door/doraemon-door-scene-types";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  doraemonDoorOpeningDuration,
  doraemonDoorPilot,
  doraemonDoorPilotContent,
  type DoraemonDoorExperienceState,
  type DoraemonDoorMotionPhase,
} from "@/data/doraemon-door-pilot";
import { orderedCouple } from "@/lib/invitation-display";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

const DoraemonDoorScene = dynamic(
  () => import("@/components/doraemon-door/doraemon-door-scene")
    .then((module) => module.DoraemonDoorScene),
  { ssr: false },
);

const stateTranslationKeys: Record<
  DoraemonDoorExperienceState,
  "stateClosed" | "stateOpening" | "stateHandoff" | "stateOpened"
> = {
  closed: "stateClosed",
  opening: "stateOpening",
  handoff: "stateHandoff",
  opened: "stateOpened",
};

type DoraemonDoorLabProps = {
  content?: ChungDoiDemoContent;
  muted?: boolean;
  onStateChange?: (state: DoraemonDoorExperienceState) => void;
  onCoverReady?: () => void;
  renderBody?: boolean;
  showControls?: boolean;
};

type DoorSceneBoundaryProps = {
  children: ReactNode;
  onError: () => void;
};

type DoorSceneBoundaryState = {
  hasError: boolean;
};

class DoorSceneBoundary extends Component<
  DoorSceneBoundaryProps,
  DoorSceneBoundaryState
> {
  state: DoorSceneBoundaryState = { hasError: false };

  static getDerivedStateFromError(): DoorSceneBoundaryState {
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

type DoorPhysicalCue = "latch" | "swing" | "portal";

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function useDoorPhysicalAudio(muted: boolean) {
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

  const playCue = useCallback((cue: DoorPhysicalCue) => {
    if (muted) return;
    const context = getContext();
    if (!context) return;

    const play = () => {
      const now = context.currentTime;
      const master = context.createGain();
      const duration = cue === "portal" ? 0.42 : cue === "swing" ? 0.24 : 0.12;
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(
        cue === "latch" ? 0.1 : 0.07,
        now + 0.012,
      );
      master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      master.connect(context.destination);

      if (cue === "portal") {
        const oscillator = context.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(390, now);
        oscillator.frequency.exponentialRampToValueAtTime(720, now + duration);
        oscillator.connect(master);
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
        filter.type = cue === "latch" ? "bandpass" : "lowpass";
        filter.frequency.setValueAtTime(cue === "latch" ? 1260 : 520, now);
        source.buffer = buffer;
        source.connect(filter);
        filter.connect(master);
        source.start(now);
        source.stop(now + duration);
      }

      window.setTimeout(() => master.disconnect(), 520);
    };

    if (context.state === "suspended") {
      void context.resume().then(play).catch(() => undefined);
    } else {
      play();
    }
  }, [getContext, muted]);

  useEffect(() => () => {
    const context = contextRef.current;
    contextRef.current = null;
    if (context && context.state !== "closed") {
      void context.close();
    }
  }, []);

  return { playCue };
}

export function DoraemonDoorLab({
  content = doraemonDoorPilotContent,
  muted = false,
  onStateChange,
  onCoverReady,
  renderBody = true,
  showControls = true,
}: DoraemonDoorLabProps) {
  const locale = useLocale();
  const t = useTranslations("doraemonDoorLab");
  const doorT = useTranslations("doraemonDoor");
  const invitationT = useTranslations("invitationTemplate");
  const stageRef = useRef<HTMLElement>(null);
  const domHeroRef = useRef<HTMLElement>(null);
  const sceneHandleRef = useRef<DoraemonDoorSceneHandle | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const handoffFrameRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const openingRequestRef = useRef(false);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [canvasMounted, setCanvasMounted] = useState(true);
  const [state, setState] = useState<DoraemonDoorExperienceState>("closed");
  const [motionPhase, setMotionPhase] = useState<
    DoraemonDoorMotionPhase | "idle"
  >("idle");
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [hasTimeline, setHasTimeline] = useState(false);
  const [hasOpeningPose, setHasOpeningPose] = useState(false);
  const [forceReducedMotion, setForceReducedMotion] = useState(false);
  const systemReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isMobile = useMobileQuery();
  const reducedMotion = forceReducedMotion || systemReducedMotion;
  const physicalAudio = useDoorPhysicalAudio(muted);
  const people = orderedCouple(content);
  const weddingDate = formatDoraemonDoorLocalizedDate(
    content.couple.date,
    locale,
  );

  useEffect(() => {
    onStateChange?.(state);
  }, [onStateChange, state]);

  useEffect(() => {
    if (state === "opened") return;

    const originalOverflow = document.body.style.overflow;
    const originalOverscrollBehavior = document.documentElement.style
      .overscrollBehaviorY;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehaviorY = "none";
    stageRef.current?.scrollIntoView({ block: "start" });

    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overscrollBehaviorY =
        originalOverscrollBehavior;
    };
  }, [state]);

  useGSAP(() => () => {
    timelineRef.current?.kill();
  }, { scope: stageRef });

  useEffect(() => {
    const detectWebgl = window.setTimeout(() => {
      setWebglSupported(supportsWebGl());
    }, 0);
    return () => window.clearTimeout(detectWebgl);
  }, []);

  useEffect(() => {
    if (isMobile === null) return;
    const assets = doraemonDoorPilot.assets;
    const imageUrls = isMobile
      ? [
        assets.doraemonMobile,
        assets.jaianMobile,
        assets.nobitaMobile,
        assets.shizukaMobile,
        assets.suneoMobile,
      ]
      : [
        assets.doraemon,
        assets.jaian,
        assets.nobita,
        assets.shizuka,
        assets.suneo,
      ];
    const warmImages = imageUrls.map((src) => {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
      return image;
    });

    void document.fonts?.ready;
    return () => {
      warmImages.forEach((image) => {
        image.onload = null;
      });
    };
  }, [isMobile]);

  useEffect(() => () => {
    if (handoffFrameRef.current !== null) {
      window.cancelAnimationFrame(handoffFrameRef.current);
    }
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (state === "opened") {
      domHeroRef.current?.focus({ preventScroll: true });
    }
  }, [state]);

  const updateTimelineProgress = useCallback((progress: number) => {
    const roundedProgress = Math.round(progress * 100);
    setTimelineProgress((current) => (
      current === roundedProgress ? current : roundedProgress
    ));
    stageRef.current?.setAttribute(
      "data-door-progress",
      String(roundedProgress),
    );
  }, []);

  const beginHandoff = useCallback(() => {
    if (handoffFrameRef.current !== null) {
      window.cancelAnimationFrame(handoffFrameRef.current);
    }

    setState("handoff");
    handoffFrameRef.current = window.requestAnimationFrame(() => {
      handoffFrameRef.current = window.requestAnimationFrame(() => {
        setCanvasMounted(false);
        setState("opened");
        handoffFrameRef.current = null;
      });
    });
  }, []);

  const handleScene = useCallback((handle: DoraemonDoorSceneHandle) => {
    sceneHandleRef.current = handle;
  }, []);

  const handleSceneReady = useCallback(() => {
    setSceneReady(true);
  }, []);

  const handleSceneError = useCallback(() => {
    setSceneReady(false);
    setWebglSupported(false);
  }, []);

  const resetExperience = useCallback(() => {
    stageRef.current?.scrollIntoView({ block: "start" });
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

    setState("closed");
    setMotionPhase("idle");
    setTimelineProgress(0);
    setHasOpeningPose(false);
    stageRef.current?.setAttribute("data-door-progress", "0");

    if (canvasMounted) {
      sceneHandleRef.current?.reset();
      sceneHandleRef.current?.unlockControls();
      return;
    }

    sceneHandleRef.current = null;
    setSceneReady(false);
    setCanvasMounted(true);
  }, [canvasMounted]);

  const runFallbackOpening = useCallback(() => {
    if (isMobile === null) return;
    const durationMs = doraemonDoorOpeningDuration({
      isMobile,
      reducedMotion,
    });

    openingRequestRef.current = true;
    setState("opening");
    setMotionPhase("swing");
    updateTimelineProgress(0);
    physicalAudio.playCue("latch");
    if (!reducedMotion && "vibrate" in navigator) navigator.vibrate(8);
    fallbackTimerRef.current = window.setTimeout(() => {
      setMotionPhase("handoff");
      physicalAudio.playCue("portal");
      updateTimelineProgress(1);
      beginHandoff();
    }, durationMs);
  }, [
    beginHandoff,
    isMobile,
    physicalAudio,
    reducedMotion,
    updateTimelineProgress,
  ]);

  const openInvitation = useCallback(() => {
    if (
      openingRequestRef.current
      || isMobile === null
      || state !== "closed"
    ) {
      return;
    }
    if (webglSupported === false) {
      runFallbackOpening();
      return;
    }

    const scene = sceneHandleRef.current;
    const targets = scene?.getMotionTargets();
    const openingPose = scene?.snapshotPose();
    if (!scene || !targets || !openingPose) return;

    openingRequestRef.current = true;
    setHasOpeningPose(true);
    scene.lockControls();
    setState("opening");
    setMotionPhase("anticipation");
    updateTimelineProgress(0);
    physicalAudio.playCue("latch");
    if (!reducedMotion && "vibrate" in navigator) navigator.vibrate(8);

    const duration = doraemonDoorOpeningDuration({
      isMobile,
      reducedMotion,
    }) / 1000;
    const latchAt = reducedMotion ? duration * 0.08 : duration * 0.06;
    const swingAt = reducedMotion ? duration * 0.16 : duration * 0.14;
    const portalAt = reducedMotion ? duration * 0.3 : duration * 0.32;
    const castAt = reducedMotion ? duration * 0.38 : duration * 0.4;
    const settleAt = reducedMotion ? duration * 0.56 : duration * 0.68;
    const handoffAt = reducedMotion ? duration * 0.8 : duration * 0.96;
    const doorAngle = reducedMotion ? -0.16 : isMobile ? -1.68 : -1.98;
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
      targetY: -0.08,
      targetZ: 0,
      x: 0,
      y: 0.1,
      z: isMobile ? 12.15 : 9.8,
    };
    const characterSequence = [
      targets.characters.nobita,
      targets.characters.shizuka,
      targets.characters.doraemon,
      targets.characters.jaian,
      targets.characters.suneo,
    ];

    const timeline = gsap.timeline({
      paused: true,
      defaults: { ease: "power3.inOut" },
      onUpdate: () => {
        targets.controls.update();
        targets.invalidate();
        updateTimelineProgress(timeline.progress());
      },
      onComplete: () => updateTimelineProgress(1),
      onReverseComplete: () => {
        scene.reset();
        openingRequestRef.current = false;
        setHasOpeningPose(false);
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
          x: openingPose.rootRotation[0] * 0.75,
          y: openingPose.rootRotation[1] * 0.75,
          z: 0,
          duration: Math.max(0.03, latchAt),
        },
        "anticipation",
      )
      .addLabel("latch", latchAt)
      .call(() => setMotionPhase("latch"), [], "latch")
      .to(
        targets.handlePivot.rotation,
        {
          duration: reducedMotion ? 0.025 : duration * 0.08,
          ease: "back.out(1.8)",
          z: -1.05,
        },
        "latch",
      )
      .addLabel("swing", swingAt)
      .call(() => {
        setMotionPhase("swing");
        physicalAudio.playCue("swing");
      }, [], "swing")
      .to(
        targets.doorPivot.rotation,
        {
          duration: reducedMotion ? 0.05 : duration * 0.43,
          ease: reducedMotion ? "power1.out" : "power3.inOut",
          y: doorAngle,
        },
        "swing",
      )
      .addLabel("portal", portalAt)
      .call(() => {
        setMotionPhase("portal");
        physicalAudio.playCue("portal");
      }, [], "portal")
      .to(
        targets.portalGroup.scale,
        {
          duration: reducedMotion ? 0.04 : duration * 0.25,
          ease: "power2.out",
          x: reducedMotion ? 1 : 1.08,
          y: reducedMotion ? 1 : 1.08,
          z: reducedMotion ? 1 : 1.08,
        },
        "portal",
      )
      .to(
        targets.portalGroup.rotation,
        {
          duration: reducedMotion ? 0.04 : duration * 0.34,
          ease: "power2.out",
          z: reducedMotion ? 0 : 0.025,
        },
        "portal",
      )
      .to(
        targets.portalMaterial,
        {
          duration: reducedMotion ? 0.04 : duration * 0.24,
          emissiveIntensity: reducedMotion ? 0.55 : 1.05,
          opacity: 1,
        },
        "portal",
      )
      .to(
        targets.portalRingMaterial,
        {
          duration: reducedMotion ? 0.04 : duration * 0.24,
          opacity: reducedMotion ? 0.3 : 0.56,
        },
        "portal",
      )
      .addLabel("cast", castAt)
      .call(() => setMotionPhase("cast"), [], "cast");

    characterSequence.forEach((character, index) => {
      const at = reducedMotion
        ? castAt
        : castAt + index * Math.min(0.08, duration * 0.032);
      timeline
        .to(
          character.group.position,
          {
            duration: reducedMotion ? 0.04 : duration * 0.26,
            ease: "back.out(1.18)",
            x: character.finalPosition[0],
            y: character.finalPosition[1],
            z: character.finalPosition[2],
          },
          at,
        )
        .to(
          character.group.scale,
          {
            duration: reducedMotion ? 0.04 : duration * 0.24,
            ease: "back.out(1.18)",
            x: 1,
            y: 1,
            z: 1,
          },
          at,
        )
        .to(
          character.material,
          {
            duration: reducedMotion ? 0.03 : duration * 0.14,
            opacity: 1,
          },
          at,
        );
    });

    timeline
      .addLabel("settle", settleAt)
      .call(() => setMotionPhase("settle"), [], "settle")
      .to(
        cameraMotion,
        {
          ...finalCamera,
          duration: Math.max(0.04, handoffAt - settleAt),
          ease: "power3.inOut",
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
          },
        },
        "settle",
      )
      .to(
        targets.root.rotation,
        {
          duration: Math.max(0.04, handoffAt - settleAt),
          x: 0,
          y: 0,
          z: 0,
        },
        "settle",
      )
      .addLabel("handoff", handoffAt)
      .call(() => {
        setMotionPhase("handoff");
        beginHandoff();
      }, [], "handoff")
      .to({}, { duration: Math.max(0.01, duration - handoffAt) }, "handoff");

    timelineRef.current = timeline;
    setHasTimeline(true);
    timeline.play();
  }, [
    beginHandoff,
    isMobile,
    physicalAudio,
    reducedMotion,
    runFallbackOpening,
    state,
    updateTimelineProgress,
    webglSupported,
  ]);

  const seekTimeline = useCallback((nextProgress: number) => {
    const timeline = timelineRef.current;
    const targets = sceneHandleRef.current?.getMotionTargets();
    if (!timeline || !targets) return;

    timeline.pause();
    timeline.progress(nextProgress / 100, false);
    targets.controls.update();
    targets.invalidate();
    setState(nextProgress === 0 ? "closed" : "opening");
    updateTimelineProgress(nextProgress / 100);
  }, [updateTimelineProgress]);

  const canOpen = state === "closed"
    && isMobile !== null
    && (webglSupported === false || sceneReady);
  useInvitationCoverReady(stageRef, canOpen, onCoverReady);
  const fallbackMotion = reducedMotion
    ? "reduced"
    : isMobile
      ? "mobile"
      : "desktop";

  return (
    <div className="relative z-40 min-h-[100dvh] overflow-x-hidden bg-[#DDF6FF] font-art-helvetica text-[#17334A]">
      <h1 className="sr-only">{t("title")}</h1>
      <section
        ref={stageRef}
        data-door-drag-enabled="true"
        data-door-phase={motionPhase}
        data-door-pose-captured={hasOpeningPose ? "true" : "false"}
        data-door-progress={timelineProgress}
        data-door-state={state}
        data-testid="doraemon-door-stage"
        className="relative isolate min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_50%_38%,#FFF9EE_0%,#DDF6FF_48%,#BFEFFF_100%)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_70%,rgba(255,249,238,0.82)_100%)]"
        />

        <div
          aria-hidden={state !== "closed"}
          data-testid="doraemon-door-stage-intro"
          className={cn(
            "pointer-events-none absolute inset-x-5 top-[max(1.5rem,env(safe-area-inset-top))] z-20 flex flex-col items-center text-center transition-[opacity,transform] duration-500 ease-out sm:inset-x-auto sm:left-[5vw] sm:top-[9vh] sm:max-w-[18rem] sm:items-start sm:text-left lg:max-w-[22rem]",
            state === "closed"
              ? "translate-y-0 opacity-100"
              : "-translate-y-3 opacity-0",
          )}
        >
          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-[#B94170] sm:text-xs">
            {doorT("heroKicker")}
          </p>
          <h2
            data-testid="doraemon-door-stage-couple-names"
            className="mt-2 w-full font-art-marvin text-[clamp(2.1rem,10vw,3.75rem)] leading-[0.86] tracking-[-0.035em] text-[#17334A] sm:mt-3 sm:w-auto sm:text-[clamp(2.75rem,4vw,4.75rem)]"
          >
            <span className="block whitespace-nowrap sm:inline">
              {people[0].shortName}
            </span>
            <span className="my-1 block text-[0.44em] text-[#E96F9A] sm:mx-[0.18em] sm:my-0 sm:inline">
              {invitationT("and")}
            </span>
            <span className="block whitespace-nowrap sm:inline">
              {people[1].shortName}
            </span>
          </h2>
          <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[#17334A]/66 sm:mt-3 sm:text-xs">
            {weddingDate} / {content.couple.time}
          </p>
        </div>

        <div className="absolute inset-0 grid place-items-center">
          {webglSupported === true && canvasMounted && isMobile !== null ? (
            <div
              className="absolute inset-0"
              data-testid="doraemon-door-canvas"
            >
              <DoorSceneBoundary onError={handleSceneError}>
                <DoraemonDoorScene
                  isMobile={isMobile}
                  isOpening={state === "opening"}
                  onReady={handleSceneReady}
                  onSceneHandle={handleScene}
                />
              </DoorSceneBoundary>
            </div>
          ) : null}

          {webglSupported === false && isMobile !== null ? (
            <DoraemonDoorFallback
              isMobile={isMobile}
              isOpening={state === "opening" || state === "opened"}
              motion={fallbackMotion}
            />
          ) : null}

          {webglSupported === null || isMobile === null ? (
            <div
              aria-hidden="true"
              className="h-[min(62dvh,34rem)] w-[min(62vw,22rem)] animate-pulse rounded-[2rem] border-[0.8rem] border-[#E96F9A]/45 bg-[#E96F9A]/18 motion-reduce:animate-none"
            />
          ) : null}

          <DoraemonDoorHandoffHero
            ref={domHeroRef}
            content={content}
            aria-hidden={state !== "opened"}
            inert={state !== "opened" ? true : undefined}
            className={state === "handoff" || state === "opened"
              ? "pointer-events-auto z-10 opacity-100"
              : "pointer-events-none z-10 opacity-0"}
          />
        </div>

        {reducedMotion ? (
          <p className="absolute right-4 top-4 z-30 rounded-full border border-[#17334A]/12 bg-[#FFF9EE]/88 px-3 py-2 text-xs font-semibold text-[#17334A] backdrop-blur-sm">
            {t("reducedMotionActive")}
          </p>
        ) : null}

        <div className="absolute inset-x-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-30 flex flex-col items-center gap-3">
          {state === "closed" ? (
            <button
              type="button"
              data-testid="doraemon-door-open"
              disabled={!canOpen}
              onClick={openInvitation}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#B94170] bg-[#E96F9A] px-7 font-art-marvin text-lg text-[#FFF9EE] shadow-[0_1.2rem_3rem_rgba(185,65,112,0.24)] transition-transform disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17334A] focus-visible:ring-offset-4 focus-visible:ring-offset-[#DDF6FF] active:scale-[0.98]"
            >
              {webglSupported === null || isMobile === null
                ? t("loading")
                : t("open")}
            </button>
          ) : null}
          {state === "closed" ? (
            <p className="max-w-[31ch] text-center text-sm leading-6 text-[#17334A]/72">
              {t("closedHint")}
            </p>
          ) : null}
        </div>

        <p aria-live="polite" className="sr-only">
          {t(stateTranslationKeys[state])}
        </p>
      </section>

      {renderBody && (state === "handoff" || state === "opened") ? (
        <div
          aria-hidden={state !== "opened"}
          inert={state !== "opened" ? true : undefined}
        >
          <DoraemonDoorInvitationBody content={content} />
        </div>
      ) : null}

      {showControls ? (
        <section className="mx-auto grid w-full max-w-4xl gap-5 px-4 py-12 sm:px-6">
          <div>
            <h2 className="font-art-marvin text-4xl leading-[0.95] text-[#17334A]">
              {t("controlsTitle")}
            </h2>
            <p className="mt-4 max-w-[58ch] leading-7 text-[#17334A]/70">
              {t("controlsDescription")}
            </p>
          </div>
          <div className="grid gap-3 rounded-[1.5rem] border border-[#17334A]/12 bg-[#FFF9EE] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <label className="flex min-h-11 items-center gap-3 text-sm text-[#17334A]">
              <input
                type="checkbox"
                checked={forceReducedMotion}
                onChange={(event) => setForceReducedMotion(event.target.checked)}
                className="size-4 accent-[#E96F9A]"
              />
              {t("forceReducedMotion")}
            </label>
            <span className="text-sm text-[#17334A]/68">
              {reducedMotion
                ? t("reducedMotionActive")
                : t("fullMotionActive")}
            </span>
          </div>
          <div className="grid gap-4 rounded-[1.5rem] border border-[#17334A]/12 bg-[#DDF6FF] p-4">
            <label className="grid gap-2 text-sm text-[#17334A]">
              <span>{t("timeline", { progress: timelineProgress })}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={timelineProgress}
                onChange={(event) => seekTimeline(Number(event.target.value))}
                disabled={!hasTimeline || state === "opened"}
                className="accent-[#E96F9A] disabled:cursor-not-allowed disabled:opacity-45"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => timelineRef.current?.play()}
                disabled={!hasTimeline || state === "opened"}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#17334A]/24 bg-[#FFF9EE] px-4 text-sm text-[#17334A] disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.98]"
              >
                <Play aria-hidden size={15} strokeWidth={1.7} />
                {t("play")}
              </button>
              <button
                type="button"
                onClick={() => timelineRef.current?.pause()}
                disabled={!hasTimeline || state === "opened"}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#17334A]/24 bg-[#FFF9EE] px-4 text-sm text-[#17334A] disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.98]"
              >
                <Pause aria-hidden size={15} strokeWidth={1.7} />
                {t("pause")}
              </button>
              <button
                type="button"
                onClick={resetExperience}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#B94170] bg-[#E96F9A] px-4 text-sm font-semibold text-[#FFF9EE] active:scale-[0.98]"
              >
                <RotateCcw aria-hidden size={15} strokeWidth={1.7} />
                {t("reset")}
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
