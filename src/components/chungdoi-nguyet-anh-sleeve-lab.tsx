"use client";

import { useGSAP } from "@gsap/react";
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
import { Spherical, Vector3 } from "three";

import {
  NguyetAnhSleeveFallback,
} from "@/components/sleeve/nguyet-anh-sleeve-fallback";
import {
  NguyetAnhSleeveHandoffHero,
  NguyetAnhSleeveInvitationBody,
  formatSleeveLocalizedDate,
} from "@/components/sleeve/nguyet-anh-sleeve-invitation";
import {
  SLEEVE_FILM_CARD_HANDOFF_Z,
  SLEEVE_FILM_CARD_HEIGHT,
  type NguyetAnhSleeveSceneHandle,
  type SleevePoseSnapshot,
} from "@/components/sleeve/nguyet-anh-sleeve-scene";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  nguyetAnhSleevePilot,
  nguyetAnhSleevePilotContent,
  sleeveOpeningDuration,
  type SleeveExperienceState,
  type SleeveMotionPhase,
} from "@/data/nguyet-anh-sleeve-pilot";
import {
  invitationOpeningMessage,
  orderedCouple,
} from "@/lib/invitation-display";

gsap.registerPlugin(useGSAP);

const NguyetAnhSleeveScene = dynamic(
  () => import("@/components/sleeve/nguyet-anh-sleeve-scene")
    .then((module) => module.NguyetAnhSleeveScene),
  { ssr: false },
);

const stateTranslationKeys: Record<
  SleeveExperienceState,
  "stateClosed" | "stateOpening" | "stateHandoff" | "stateOpened"
> = {
  closed: "stateClosed",
  opening: "stateOpening",
  handoff: "stateHandoff",
  opened: "stateOpened",
};

type CameraSettleMotion = {
  phi: number;
  radius: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  theta: number;
};

type SleeveSceneBoundaryProps = {
  children: ReactNode;
  onError: () => void;
};

type SleeveSceneBoundaryState = {
  hasError: boolean;
};

type NguyetAnhSleeveLabProps = {
  content?: ChungDoiDemoContent;
  muted?: boolean;
  onStateChange?: (state: SleeveExperienceState) => void;
  renderBody?: boolean;
  showControls?: boolean;
};

class SleeveSceneBoundary extends Component<
  SleeveSceneBoundaryProps,
  SleeveSceneBoundaryState
> {
  state: SleeveSceneBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SleeveSceneBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

function createCameraSettleMotion({
  cameraPosition,
  controlsTarget,
  finalCameraDistance,
  finalTarget,
}: SleevePoseSnapshot & {
  finalCameraDistance: number;
  finalTarget: [number, number, number];
}): {
  motion: CameraSettleMotion;
  target: CameraSettleMotion;
} {
  const currentTarget = new Vector3(...controlsTarget);
  const currentOffset = new Vector3(...cameraPosition).sub(currentTarget);
  const currentSpherical = new Spherical().setFromVector3(currentOffset);
  const finalSpherical = new Spherical().setFromVector3(
    new Vector3(0, 0, finalCameraDistance),
  );
  const thetaDelta = Math.atan2(
    Math.sin(finalSpherical.theta - currentSpherical.theta),
    Math.cos(finalSpherical.theta - currentSpherical.theta),
  );

  return {
    motion: {
      phi: currentSpherical.phi,
      radius: currentSpherical.radius,
      targetX: controlsTarget[0],
      targetY: controlsTarget[1],
      targetZ: controlsTarget[2],
      theta: currentSpherical.theta,
    },
    target: {
      phi: finalSpherical.phi,
      radius: finalSpherical.radius,
      targetX: finalTarget[0],
      targetY: finalTarget[1],
      targetZ: finalTarget[2],
      theta: currentSpherical.theta + thetaDelta,
    },
  };
}

function cameraDistanceForProjectedHeight({
  cameraFovDegrees,
  projectedHeightPx,
  viewportHeightPx,
  worldHeight,
}: {
  cameraFovDegrees: number;
  projectedHeightPx: number;
  viewportHeightPx: number;
  worldHeight: number;
}): number {
  const halfFovRadians = (cameraFovDegrees * Math.PI) / 360;
  return (
    (worldHeight * viewportHeightPx)
    / (2 * projectedHeightPx * Math.tan(halfFovRadians))
  );
}

function supportsWebGl(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

type SleevePhysicalCue = "aperture" | "film-drag" | "frame-seat";

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function useSleevePhysicalAudio(muted: boolean) {
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

  const playCue = useCallback((cue: SleevePhysicalCue) => {
    if (muted) return;
    const context = getContext();
    if (!context) return;

    const play = () => {
      const now = context.currentTime;
      const master = context.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(
        cue === "aperture" ? 0.12 : 0.075,
        now + 0.012,
      );
      master.gain.exponentialRampToValueAtTime(
        0.0001,
        now + (cue === "film-drag" ? 0.32 : 0.15),
      );
      master.connect(context.destination);

      if (cue === "aperture") {
        const oscillator = context.createOscillator();
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(520, now);
        oscillator.frequency.exponentialRampToValueAtTime(240, now + 0.11);
        oscillator.connect(master);
        oscillator.start(now);
        oscillator.stop(now + 0.14);
      } else {
        const duration = cue === "film-drag" ? 0.32 : 0.15;
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
        filter.type = cue === "film-drag" ? "bandpass" : "lowpass";
        filter.frequency.setValueAtTime(
          cue === "film-drag" ? 760 : 360,
          now,
        );
        filter.Q.setValueAtTime(cue === "film-drag" ? 0.65 : 0.35, now);
        source.buffer = buffer;
        source.connect(filter);
        filter.connect(master);
        source.start(now);
        source.stop(now + duration);
      }

      window.setTimeout(() => master.disconnect(), 400);
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

export function NguyetAnhSleeveLab({
  content = nguyetAnhSleevePilotContent,
  muted = false,
  onStateChange,
  renderBody = true,
  showControls = true,
}: NguyetAnhSleeveLabProps) {
  const t = useTranslations("sleeveLab");
  const invitationT = useTranslations("invitationTemplate");
  const locale = useLocale();
  const stageRef = useRef<HTMLElement>(null);
  const domHeroRef = useRef<HTMLElement>(null);
  const sceneHandleRef = useRef<NguyetAnhSleeveSceneHandle | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const handoffFrameRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const openingRequestRef = useRef(false);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [canvasMounted, setCanvasMounted] = useState(true);
  const [state, setState] = useState<SleeveExperienceState>("closed");
  const [hasTimeline, setHasTimeline] = useState(false);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [motionPhase, setMotionPhase] = useState<SleeveMotionPhase | "idle">(
    "idle",
  );
  const [hasOpeningPose, setHasOpeningPose] = useState(false);
  const [forceReducedMotion, setForceReducedMotion] = useState(false);
  const [fallbackFlipped, setFallbackFlipped] = useState(false);
  const [backFaceVisible, setBackFaceVisible] = useState(false);
  const systemReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isMobile = useMediaQuery("(max-width: 767px)");
  const reducedMotion = forceReducedMotion || systemReducedMotion;
  const physicalAudio = useSleevePhysicalAudio(muted);
  const cardContent = useMemo(() => {
    const people = orderedCouple(content);

    return {
      backDate: formatSleeveLocalizedDate(content.couple.date, locale),
      backMessage: invitationT("presenceHonor"),
      backNames: `${people[0].shortName} ${invitationT("and")} ${people[1].shortName}`,
      backTitle: invitationT("saveTheDate"),
      conjunction: invitationT("and"),
      dateAndTime: `${formatSleeveLocalizedDate(
        content.couple.date,
        locale,
      )} / ${content.couple.time}`,
      firstName: people[0].shortName,
      kicker: invitationT("invitation"),
      message: invitationOpeningMessage(content),
      secondName: people[1].shortName,
    };
  }, [content, invitationT, locale]);

  useEffect(() => {
    onStateChange?.(state);
  }, [onStateChange, state]);

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
    const imageUrls = [
      nguyetAnhSleevePilot.assets.photogram,
      nguyetAnhSleevePilot.assets.photogramMobile,
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
  }, []);

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
      "data-sleeve-progress",
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

  const handleScene = useCallback((handle: NguyetAnhSleeveSceneHandle) => {
    sceneHandleRef.current = handle;
  }, []);

  const handleSceneReady = useCallback(() => {
    setSceneReady(true);
  }, []);

  const handleSceneError = useCallback(() => {
    setSceneReady(false);
    setWebglSupported(false);
  }, []);

  const handleBackFaceChange = useCallback((visible: boolean) => {
    setBackFaceVisible(visible);
    setFallbackFlipped(visible);
  }, []);

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

    setState("closed");
    setTimelineProgress(0);
    setMotionPhase("idle");
    setHasOpeningPose(false);
    setFallbackFlipped(false);
    setBackFaceVisible(false);
    stageRef.current?.setAttribute("data-sleeve-progress", "0");

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
    const durationMs = sleeveOpeningDuration({ isMobile, reducedMotion });

    openingRequestRef.current = true;
    setFallbackFlipped(false);
    setState("opening");
    setMotionPhase("anticipation");
    physicalAudio.playCue("aperture");
    if (!reducedMotion && "vibrate" in navigator) navigator.vibrate(7);
    updateTimelineProgress(0);
    fallbackTimerRef.current = window.setTimeout(() => {
      setMotionPhase("handoff");
      physicalAudio.playCue("frame-seat");
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
    if (openingRequestRef.current || backFaceVisible || state !== "closed") {
      return;
    }
    if (webglSupported === false) {
      runFallbackOpening();
      return;
    }

    const scene = sceneHandleRef.current;
    const targets = scene?.getMotionTargets();
    if (!scene || !targets) return;

    const openingPose = scene.snapshotPose();
    if (!openingPose) return;

    setHasOpeningPose(true);
    openingRequestRef.current = true;
    scene.lockControls();
    setState("opening");
    setMotionPhase("anticipation");
    physicalAudio.playCue("aperture");
    if (!reducedMotion && "vibrate" in navigator) navigator.vibrate(7);

    const durationMs = sleeveOpeningDuration({ isMobile, reducedMotion });
    const duration = durationMs / 1000;
    const releaseAt = reducedMotion
      ? duration * 0.12
      : isMobile
        ? duration * 0.12
        : duration * 0.1;
    const extractAt = reducedMotion
      ? duration * 0.28
      : isMobile
        ? duration * 0.28
        : duration * 0.24;
    const rotateAt = reducedMotion
      ? duration * 0.45
      : isMobile
        ? duration * 0.48
        : duration * 0.46;
    const settleAt = reducedMotion
      ? duration * 0.58
      : isMobile
        ? duration * 0.72
        : duration * 0.7;
    const settleEnd = reducedMotion
      ? duration * 0.8
      : duration * 0.94;
    const handoffAt = reducedMotion ? duration * 0.8 : duration * 0.94;
    const extractDuration = reducedMotion
      ? 0.055
      : isMobile
        ? duration * 0.32
        : duration * 0.34;
    const rotateDuration = reducedMotion
      ? 0.045
      : isMobile
        ? duration * 0.25
        : duration * 0.28;
    const settleDuration = settleEnd - settleAt;
    const domHeroHeight = domHeroRef.current?.getBoundingClientRect().height ?? 0;
    const stageHeight = stageRef.current?.getBoundingClientRect().height ?? 0;
    const finalCameraDistance = domHeroHeight > 0 && stageHeight > 0
      ? cameraDistanceForProjectedHeight({
        cameraFovDegrees: targets.camera.fov,
        projectedHeightPx: domHeroHeight,
        viewportHeightPx: stageHeight,
        worldHeight: SLEEVE_FILM_CARD_HEIGHT,
      })
      : 10.4;
    const {
      motion: initialCameraMotion,
      target: cameraSettleTarget,
    } = createCameraSettleMotion({
      ...openingPose,
      finalCameraDistance,
      finalTarget: [0, 0, SLEEVE_FILM_CARD_HANDOFF_Z],
    });
    const cameraWidenMotion = { ...initialCameraMotion };
    const cameraWidenTarget = {
      ...initialCameraMotion,
      radius: initialCameraMotion.radius * 1.1,
    };
    const cameraSettleMotion = {
      ...(isMobile && !reducedMotion
        ? cameraWidenTarget
        : initialCameraMotion),
    };
    const settleSpherical = new Spherical();
    const widenSpherical = new Spherical();
    const applyCameraMotion = (
      motion: CameraSettleMotion,
      spherical: Spherical,
    ) => {
      targets.controls.target.set(
        motion.targetX,
        motion.targetY,
        motion.targetZ,
      );
      targets.camera.position
        .setFromSpherical(
          spherical.set(motion.radius, motion.phi, motion.theta),
        )
        .add(targets.controls.target);
    };

    const timeline = gsap.timeline({
      paused: true,
      defaults: { ease: "power4.inOut" },
      onComplete: () => updateTimelineProgress(1),
      onReverseComplete: () => {
        scene.unlockControls();
        openingRequestRef.current = false;
        setState("closed");
        setMotionPhase("idle");
        setHasOpeningPose(false);
        updateTimelineProgress(0);
      },
      onUpdate: () => {
        targets.controls.update();
        targets.invalidate();
        updateTimelineProgress(timeline.progress());
      },
    });

    timeline
      .addLabel("anticipation", 0)
      .call(() => setMotionPhase("anticipation"), [], "anticipation")
      .to(
        targets.aperture.scale,
        {
          duration: reducedMotion ? 0.035 : releaseAt,
          x: 0.78,
          y: 0.78,
          z: 0.78,
        },
        "anticipation",
      )
      .to(
        targets.aperture.rotation,
        {
          duration: reducedMotion ? 0.035 : releaseAt,
          z: 0.48,
        },
        "anticipation",
      )
      .addLabel("release", releaseAt)
      .call(() => setMotionPhase("release"), [], "release")
      .to(
        targets.slotLightMaterial,
        {
          duration: reducedMotion ? 0.03 : duration * 0.14,
          opacity: reducedMotion ? 0.28 : 0.86,
        },
        "release",
      );

    if (isMobile && !reducedMotion) {
      timeline.to(
        cameraWidenMotion,
        {
          ...cameraWidenTarget,
          duration: duration * 0.12,
          onUpdate: () => applyCameraMotion(
            cameraWidenMotion,
            widenSpherical,
          ),
        },
        "release",
      );
    }

    timeline
      .addLabel("extract", extractAt)
      .call(() => setMotionPhase("extract"), [], "extract")
      .call(() => physicalAudio.playCue("film-drag"), [], "extract")
      .to(
        targets.filmCard.position,
        {
          duration: extractDuration,
          ease: "power2.inOut",
          y: reducedMotion ? 0.08 : isMobile ? 1.24 : 1.82,
          z: reducedMotion ? 0.12 : 0.48,
        },
        "extract",
      )
      .addLabel("rotate", rotateAt)
      .call(() => setMotionPhase("rotate"), [], "rotate")
      .to(
        targets.filmCard.rotation,
        {
          duration: rotateDuration,
          ease: "power3.inOut",
          y: reducedMotion ? -0.03 : isMobile ? -0.22 : -0.48,
          z: reducedMotion ? 0 : isMobile ? 0.025 : 0.045,
        },
        "rotate",
      )
      .to(
        targets.sleeve.position,
        {
          duration: rotateDuration,
          ease: "power3.inOut",
          y: reducedMotion ? -0.12 : isMobile ? -3.45 : -4.25,
          z: reducedMotion ? -0.08 : -0.72,
        },
        "rotate",
      )
      .addLabel("settle", settleAt)
      .call(() => setMotionPhase("settle"), [], "settle")
      .call(() => physicalAudio.playCue("frame-seat"), [], "settle")
      .to(
        targets.filmCard.position,
        {
          duration: settleDuration,
          ease: "power3.inOut",
          y: 0,
          z: SLEEVE_FILM_CARD_HANDOFF_Z,
        },
        "settle",
      )
      .to(
        targets.filmCard.rotation,
        {
          duration: settleDuration,
          ease: "power3.inOut",
          y: 0,
          z: 0,
        },
        "settle",
      )
      .to(
        cameraSettleMotion,
        {
          ...cameraSettleTarget,
          duration: settleDuration,
          onUpdate: () => applyCameraMotion(
            cameraSettleMotion,
            settleSpherical,
          ),
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
    backFaceVisible,
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
    if (nextProgress === 0) sceneHandleRef.current?.unlockControls();
    updateTimelineProgress(nextProgress / 100);
  }, [updateTimelineProgress]);

  const reverseTimeline = useCallback(() => {
    const timeline = timelineRef.current;
    if (!timeline || state === "opened") return;
    setState("opening");
    timeline.reverse();
  }, [state]);

  const canOpen = state === "closed"
    && !backFaceVisible
    && (webglSupported === false || sceneReady);
  const canFlip = state === "closed"
    && (webglSupported === false || sceneReady);
  const fallbackMotion = reducedMotion
    ? "reduced"
    : isMobile
      ? "mobile"
      : "desktop";

  const toggleBackFace = useCallback(() => {
    if (!canFlip || openingRequestRef.current) return;

    const nextVisible = !backFaceVisible;
    setBackFaceVisible(nextVisible);
    setFallbackFlipped(nextVisible);
    sceneHandleRef.current?.setBackFaceVisible(nextVisible);
  }, [backFaceVisible, canFlip]);

  return (
    <div className="relative z-40 min-h-[100dvh] overflow-x-hidden bg-[#0B1116] text-[#D7E4EA]">
      <h1 className="sr-only">{t("title")}</h1>
      <section
        ref={stageRef}
        data-sleeve-phase={motionPhase}
        data-sleeve-pose-captured={hasOpeningPose ? "true" : "false"}
        data-sleeve-progress={timelineProgress}
        data-sleeve-state={state}
        data-testid="nguyet-anh-sleeve-stage"
        className="relative isolate min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_50%_13%,#29424F_0%,#14232D_34%,#0B1116_75%)]"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(215,228,234,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(215,228,234,0.035)_1px,transparent_1px)] [background-size:4rem_4rem]"
        />
        <div className="absolute inset-0 grid place-items-center">
          {webglSupported === true && canvasMounted ? (
            <div
              className="absolute inset-0"
              data-testid="nguyet-anh-sleeve-canvas"
            >
              <SleeveSceneBoundary onError={handleSceneError}>
                <NguyetAnhSleeveScene
                  cardContent={cardContent}
                  isOpening={state === "opening"}
                  onBackFaceChange={handleBackFaceChange}
                  onReady={handleSceneReady}
                  onSceneHandle={handleScene}
                />
              </SleeveSceneBoundary>
            </div>
          ) : null}
          {webglSupported !== true ? (
            <NguyetAnhSleeveFallback
              cardContent={cardContent}
              flipped={fallbackFlipped}
              isOpening={state === "opening" || state === "opened"}
              motion={fallbackMotion}
            />
          ) : null}
          <NguyetAnhSleeveHandoffHero
            ref={domHeroRef}
            aria-hidden={state !== "opened"}
            className={
              state === "handoff" || state === "opened"
                ? "pointer-events-auto z-10 opacity-100"
                : "pointer-events-none z-10 opacity-0"
            }
            content={content}
            inert={state !== "opened" ? true : undefined}
          />
        </div>
        <div className="absolute inset-x-4 bottom-[max(2rem,env(safe-area-inset-bottom))] z-20 flex flex-col items-center gap-3">
          {canFlip ? (
            <button
              aria-pressed={backFaceVisible}
              data-testid="nguyet-anh-sleeve-back-face"
              type="button"
              onClick={toggleBackFace}
              className="inline-flex min-h-11 items-center gap-2 border border-[#D7E4EA]/38 bg-[#0B1116]/62 px-4 text-sm text-[#D7E4EA] backdrop-blur-sm transition-colors hover:border-[#78C7D7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78C7D7] active:scale-[0.98]"
            >
              <Rotate3D aria-hidden size={16} strokeWidth={1.5} />
              {t(backFaceVisible ? "viewFront" : "viewBack")}
            </button>
          ) : null}
          {state === "closed" ? (
            <button
              type="button"
              data-testid="nguyet-anh-sleeve-open"
              disabled={!canOpen}
              onClick={openInvitation}
              className="inline-flex min-h-12 items-center justify-center border border-[#78C7D7] bg-[#78C7D7] px-7 text-base font-semibold text-[#071015] shadow-[0_1rem_2.5rem_rgba(0,0,0,0.28)] transition-transform disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7E4EA] active:scale-[0.98]"
            >
              {webglSupported === null ? t("loading") : t("open")}
            </button>
          ) : null}
          {state === "closed" ? (
            <p className="max-w-[32ch] text-center text-sm leading-6 text-[#D7E4EA]/68">
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
          <NguyetAnhSleeveInvitationBody content={content} />
        </div>
      ) : null}

      {showControls ? (
        <section className="mx-auto grid w-full max-w-4xl gap-5 px-4 py-10 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-[#78C7D7]">
              {t("labKicker")}
            </p>
            <h2 className="mt-3 font-art-helvetica text-4xl font-light tracking-[-0.04em] text-[#D7E4EA]">
              {t("controlsTitle")}
            </h2>
            <p className="mt-3 max-w-[56ch] leading-7 text-[#D7E4EA]/68">
              {t("controlsDescription")}
            </p>
          </div>
          <div className="grid gap-3 border border-[#D7E4EA]/18 bg-[#14232D]/58 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <label className="flex min-h-11 items-center gap-3 text-sm text-[#D7E4EA]">
              <input
                type="checkbox"
                checked={forceReducedMotion}
                onChange={(event) => {
                  setForceReducedMotion(event.target.checked);
                }}
                className="size-4 accent-[#78C7D7]"
              />
              {t("forceReducedMotion")}
            </label>
            <span className="text-sm text-[#D7E4EA]/62">
              {reducedMotion
                ? t("reducedMotionActive")
                : t("fullMotionActive")}
            </span>
          </div>
          <div className="grid gap-4 border border-[#D7E4EA]/18 bg-[#14232D]/42 p-4">
            <label className="grid gap-2 text-sm text-[#D7E4EA]">
              <span>{t("timeline", { progress: timelineProgress })}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={timelineProgress}
                onChange={(event) => {
                  seekTimeline(Number(event.target.value));
                }}
                disabled={!hasTimeline || state === "opened"}
                className="accent-[#78C7D7] disabled:cursor-not-allowed disabled:opacity-45"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => timelineRef.current?.play()}
                disabled={!hasTimeline || state === "opened"}
                className="inline-flex min-h-11 items-center gap-2 border border-[#D7E4EA]/36 px-4 text-sm text-[#D7E4EA] transition-colors hover:bg-[#D7E4EA]/8 disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.98]"
              >
                <Play aria-hidden size={15} strokeWidth={1.5} />
                {t("play")}
              </button>
              <button
                type="button"
                onClick={() => timelineRef.current?.pause()}
                disabled={!hasTimeline || state === "opened"}
                className="inline-flex min-h-11 items-center gap-2 border border-[#D7E4EA]/36 px-4 text-sm text-[#D7E4EA] transition-colors hover:bg-[#D7E4EA]/8 disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.98]"
              >
                <Pause aria-hidden size={15} strokeWidth={1.5} />
                {t("pause")}
              </button>
              <button
                type="button"
                onClick={reverseTimeline}
                disabled={!hasTimeline || state === "opened"}
                className="inline-flex min-h-11 items-center gap-2 border border-[#D7E4EA]/36 px-4 text-sm text-[#D7E4EA] transition-colors hover:bg-[#D7E4EA]/8 disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.98]"
              >
                <Rotate3D aria-hidden size={15} strokeWidth={1.5} />
                {t("reverse")}
              </button>
              <button
                type="button"
                onClick={resetExperience}
                className="inline-flex min-h-11 items-center gap-2 border border-[#78C7D7] bg-[#78C7D7] px-4 text-sm font-semibold text-[#071015] transition-transform active:scale-[0.98]"
              >
                <RotateCcw aria-hidden size={15} strokeWidth={1.5} />
                {t("reset")}
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
