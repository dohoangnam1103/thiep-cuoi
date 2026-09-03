"use client";

import { useInvitationCoverReady } from "@/hooks/use-invitation-cover-ready";

import { useGSAP } from "@gsap/react";
import { Pause, Play, RotateCcw, Rotate3D } from "lucide-react";
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
  gatefoldOpeningDuration,
  longPhungGatefoldPilot,
  longPhungGatefoldPilotContent,
  type GatefoldExperienceState,
  type GatefoldMotionPhase,
} from "@/data/long-phung-gatefold-pilot";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  invitationOpeningMessage,
  orderedCouple,
} from "@/lib/invitation-display";
import {
  LongPhungGatefoldFallback,
} from "@/components/gatefold/long-phung-gatefold-fallback";
import {
  LongPhungGatefoldHandoffHero,
  LongPhungGatefoldInvitationBody,
  formatGatefoldLocalizedDate,
} from "@/components/gatefold/long-phung-gatefold-invitation";
import {
  GATEFOLD_CENTER_SHEET_HANDOFF_Z,
  GATEFOLD_CENTER_SHEET_HEIGHT,
  type GatefoldPoseSnapshot,
  type LongPhungGatefoldSceneHandle,
} from "@/components/gatefold/long-phung-gatefold-scene";
/*
 * The scene itself remains dynamically imported. These geometry constants are
 * shared so the DOM handoff camera is solved from the measured hero rectangle.
 */

gsap.registerPlugin(useGSAP);

const LongPhungGatefoldScene = dynamic(
  () => import("@/components/gatefold/long-phung-gatefold-scene").then((mod) => mod.LongPhungGatefoldScene),
  { ssr: false },
);

const stateTranslationKeys: Record<GatefoldExperienceState, "stateClosed" | "stateOpening" | "stateHandoff" | "stateOpened"> = {
  closed: "stateClosed",
  opening: "stateOpening",
  handoff: "stateHandoff",
  opened: "stateOpened",
};

type CameraSettleMotion = {
  radius: number;
  phi: number;
  theta: number;
  targetX: number;
  targetY: number;
  targetZ: number;
};

type GatefoldSceneBoundaryProps = {
  children: ReactNode;
  onError: () => void;
};

type GatefoldSceneBoundaryState = {
  hasError: boolean;
};

type LongPhungGatefoldLabProps = {
  content?: ChungDoiDemoContent;
  onStateChange?: (state: GatefoldExperienceState) => void;
  onCoverReady?: () => void;
  renderBody?: boolean;
  showControls?: boolean;
  muted?: boolean;
};

class GatefoldSceneBoundary extends Component<
  GatefoldSceneBoundaryProps,
  GatefoldSceneBoundaryState
> {
  state: GatefoldSceneBoundaryState = { hasError: false };

  static getDerivedStateFromError(): GatefoldSceneBoundaryState {
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
}: GatefoldPoseSnapshot & {
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
      radius: currentSpherical.radius,
      phi: currentSpherical.phi,
      theta: currentSpherical.theta,
      targetX: controlsTarget[0],
      targetY: controlsTarget[1],
      targetZ: controlsTarget[2],
    },
    target: {
      radius: finalSpherical.radius,
      phi: finalSpherical.phi,
      theta: currentSpherical.theta + thetaDelta,
      targetX: finalTarget[0],
      targetY: finalTarget[1],
      targetZ: finalTarget[2],
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

type GatefoldPhysicalCue = "clasp" | "hinge-left" | "hinge-right" | "paper-settle";

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function useGatefoldPhysicalAudio(muted: boolean) {
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

  const playCue = useCallback((cue: GatefoldPhysicalCue) => {
    if (muted) return;
    const context = getContext();
    if (!context) return;

    const play = () => {
      const now = context.currentTime;
      const master = context.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(cue === "clasp" ? 0.15 : 0.09, now + 0.012);
      master.gain.exponentialRampToValueAtTime(0.0001, now + (cue === "paper-settle" ? 0.18 : 0.12));
      master.connect(context.destination);

      if (cue === "clasp") {
        const first = context.createOscillator();
        const second = context.createOscillator();
        first.type = "triangle";
        second.type = "sine";
        first.frequency.setValueAtTime(290, now);
        first.frequency.exponentialRampToValueAtTime(190, now + 0.08);
        second.frequency.setValueAtTime(470, now + 0.018);
        second.frequency.exponentialRampToValueAtTime(270, now + 0.09);
        first.connect(master);
        second.connect(master);
        first.start(now);
        second.start(now + 0.018);
        first.stop(now + 0.12);
        second.stop(now + 0.12);
      } else {
        const duration = cue === "paper-settle" ? 0.18 : 0.12;
        const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
        const channel = buffer.getChannelData(0);
        for (let index = 0; index < channel.length; index += 1) {
          const envelope = 1 - index / channel.length;
          channel[index] = (Math.random() * 2 - 1) * envelope * envelope;
        }
        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();
        filter.type = cue === "paper-settle" ? "lowpass" : "bandpass";
        filter.frequency.setValueAtTime(
          cue === "hinge-left" ? 880 : cue === "hinge-right" ? 720 : 420,
          now,
        );
        filter.Q.setValueAtTime(cue === "paper-settle" ? 0.4 : 0.8, now);
        source.buffer = buffer;
        source.connect(filter);
        filter.connect(master);
        source.start(now);
        source.stop(now + duration);
      }

      window.setTimeout(() => master.disconnect(), 260);
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

export function LongPhungGatefoldLab({
  content = longPhungGatefoldPilotContent,
  onStateChange,
  onCoverReady,
  renderBody = true,
  showControls = true,
  muted = false,
}: LongPhungGatefoldLabProps) {
  const t = useTranslations("gatefoldLab");
  const invitationT = useTranslations("invitationTemplate");
  const locale = useLocale();
  const invitationContent = content;
  const stageRef = useRef<HTMLElement>(null);
  const domHeroRef = useRef<HTMLElement>(null);
  const sceneHandleRef = useRef<LongPhungGatefoldSceneHandle | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const handoffFrameRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const openingRequestRef = useRef(false);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [canvasMounted, setCanvasMounted] = useState(true);
  const [state, setState] = useState<GatefoldExperienceState>("closed");
  const [hasTimeline, setHasTimeline] = useState(false);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [motionPhase, setMotionPhase] = useState<GatefoldMotionPhase | "idle">("idle");
  const [hasOpeningPose, setHasOpeningPose] = useState(false);
  const [forceReducedMotion, setForceReducedMotion] = useState(false);
  const [fallbackFlipped, setFallbackFlipped] = useState(false);
  const [backFaceVisible, setBackFaceVisible] = useState(false);
  const systemReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isMobile = useMediaQuery("(max-width: 767px)");
  const reducedMotion = forceReducedMotion || systemReducedMotion;
  const physicalAudio = useGatefoldPhysicalAudio(muted);
  const innerSheet = useMemo(() => {
    const people = orderedCouple(invitationContent);

    return {
      kicker: invitationT("invitation"),
      firstName: people[0].shortName,
      conjunction: invitationT("and"),
      secondName: people[1].shortName,
      dateAndTime: `${formatGatefoldLocalizedDate(
        invitationContent.couple.date,
        locale,
      )} / ${invitationContent.couple.time}`,
      message: invitationOpeningMessage(invitationContent),
      backTitle: invitationT("saveTheDate"),
      backDate: formatGatefoldLocalizedDate(
        invitationContent.couple.date,
        locale,
      ),
      backNames: `${people[0].shortName} ${invitationT("and")} ${people[1].shortName}`,
      backMessage: invitationT("presenceHonor"),
    };
  }, [invitationContent, invitationT, locale]);

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
      longPhungGatefoldPilot.assets.dragon,
      longPhungGatefoldPilot.assets.phoenix,
      longPhungGatefoldPilot.assets.cloudFront,
    ];
    const warmImages = imageUrls.map((src) => {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
      return image;
    });

    void document.fonts?.ready;
    return () => {
      warmImages.forEach((image) => image.onload = null);
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
    setTimelineProgress((current) => current === roundedProgress ? current : roundedProgress);
    stageRef.current?.setAttribute("data-gatefold-progress", String(roundedProgress));
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

  const handleScene = useCallback((handle: LongPhungGatefoldSceneHandle) => {
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
    stageRef.current?.setAttribute("data-gatefold-progress", "0");

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
    const durationMs = gatefoldOpeningDuration({ isMobile, reducedMotion });

    openingRequestRef.current = true;
    setFallbackFlipped(false);
    setState("opening");
    setMotionPhase("anticipation");
    physicalAudio.playCue("clasp");
    if (!reducedMotion && "vibrate" in navigator) navigator.vibrate(8);
    updateTimelineProgress(0);
    fallbackTimerRef.current = window.setTimeout(() => {
      setMotionPhase("handoff");
      physicalAudio.playCue("paper-settle");
      updateTimelineProgress(1);
      beginHandoff();
    }, durationMs);
  }, [beginHandoff, isMobile, physicalAudio, reducedMotion, updateTimelineProgress]);

  const openInvitation = useCallback(() => {
    if (openingRequestRef.current || backFaceVisible || state !== "closed") return;
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
    physicalAudio.playCue("clasp");
    if (!reducedMotion && "vibrate" in navigator) navigator.vibrate(8);

    const durationMs = gatefoldOpeningDuration({ isMobile, reducedMotion });
    const duration = durationMs / 1000;
    const releaseAt = reducedMotion ? duration * 0.14 : isMobile ? duration * 0.12 : duration * 0.08;
    const releaseDuration = reducedMotion ? 0.035 : isMobile ? duration * 0.13 : duration * 0.1;
    const unfoldAt = reducedMotion ? duration * 0.27 : isMobile ? duration * 0.25 : duration * 0.18;
    const leftUnfoldDuration = reducedMotion
      ? 0.04
      : isMobile
        ? duration * 0.35
        : duration * 0.3;
    const rightUnfoldAt = reducedMotion
      ? unfoldAt
      : isMobile
        ? unfoldAt + longPhungGatefoldPilot.physicalOpening.rightWingStaggerMs / 1000
        : duration * 0.22;
    const rightUnfoldDuration = reducedMotion
      ? 0.04
      : isMobile
        ? duration * 0.35
        : duration * 0.33;
    const revealAt = reducedMotion ? duration * 0.45 : isMobile ? duration * 0.48 : duration * 0.42;
    const revealDuration = reducedMotion ? 0.04 : isMobile ? duration * 0.24 : duration * 0.26;
    const settleStart = reducedMotion ? duration * 0.58 : isMobile ? duration * 0.72 : duration * 0.68;
    const settleEnd = reducedMotion ? duration * 0.8 : isMobile ? duration * 0.94 : duration * 0.9;
    const handoffAt = reducedMotion ? duration * 0.8 : isMobile ? duration * 0.94 : duration * 0.98;
    const cameraSettleDuration = settleEnd - settleStart;
    const leftWingAngle = reducedMotion ? -0.18 : isMobile ? -1.55 : -2.72;
    const rightWingAngle = reducedMotion ? 0.18 : isMobile ? 1.55 : 2.72;
    const cloudFrontOpacity = reducedMotion ? 0.2 : isMobile ? 0.34 : 0.46;
    const cloudFrontPosition = {
      y: reducedMotion ? -0.86 : isMobile ? -0.98 : -1.08,
      z: reducedMotion ? 0.23 : isMobile ? 0.34 : 0.42,
    };
    const cloudFrontRotation = reducedMotion ? 0 : isMobile ? -0.014 : -0.03;
    const domHeroHeight = domHeroRef.current?.getBoundingClientRect().height ?? 0;
    const stageHeight = stageRef.current?.getBoundingClientRect().height ?? 0;
    const finalCameraDistance = domHeroHeight > 0 && stageHeight > 0
      ? cameraDistanceForProjectedHeight({
        cameraFovDegrees: targets.camera.fov,
        projectedHeightPx: domHeroHeight,
        viewportHeightPx: stageHeight,
        worldHeight: GATEFOLD_CENTER_SHEET_HEIGHT,
      })
      : 10.25;
    const { motion: initialCameraMotion, target: fullCameraSettleTarget } = createCameraSettleMotion({
      ...openingPose,
      finalCameraDistance,
      finalTarget: [0, 0, GATEFOLD_CENTER_SHEET_HANDOFF_Z],
    });
    const cameraWidenMotion = { ...initialCameraMotion };
    const cameraWidenTarget = {
      ...initialCameraMotion,
      radius: initialCameraMotion.radius * 1.12,
    };
    const cameraSettleMotion = {
      ...(isMobile && !reducedMotion ? cameraWidenTarget : initialCameraMotion),
    };
    const cameraSettleTarget = fullCameraSettleTarget;
    const settleSpherical = new Spherical();
    const widenSpherical = new Spherical();
    const applyCameraMotion = (motion: CameraSettleMotion, spherical: Spherical) => {
      targets.controls.target.set(motion.targetX, motion.targetY, motion.targetZ);
      targets.camera.position
        .setFromSpherical(spherical.set(motion.radius, motion.phi, motion.theta))
        .add(targets.controls.target);
    };

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
        scene.unlockControls();
        openingRequestRef.current = false;
        setState("closed");
        setMotionPhase("idle");
        setHasOpeningPose(false);
        updateTimelineProgress(0);
      },
    });

    timeline
      .addLabel("anticipation", 0)
      .call(() => setMotionPhase("anticipation"), [], "anticipation")
      .to(
        [targets.leftClasp.position, targets.rightClasp.position],
        { z: 0.34, duration: reducedMotion ? 0.025 : releaseAt },
        "anticipation",
      )
      .addLabel("release", releaseAt)
      .call(() => setMotionPhase("release"), [], "release")

    if (isMobile && !reducedMotion) {
      timeline.to(
        cameraWidenMotion,
        {
          ...cameraWidenTarget,
          duration: releaseDuration,
          onUpdate: () => applyCameraMotion(cameraWidenMotion, widenSpherical),
        },
        "release",
      );
    }

    timeline
      .to(
        targets.leftClasp.position,
        { x: -0.78, z: 0.72, duration: releaseDuration, ease: "power2.out" },
        "release",
      )
      .to(
        targets.rightClasp.position,
        { x: 0.78, z: 0.72, duration: releaseDuration, ease: "power2.out" },
        "release",
      )
      .addLabel("unfold", unfoldAt)
      .call(() => setMotionPhase("unfold"), [], "unfold")
      .call(() => physicalAudio.playCue("hinge-left"), [], "unfold")
      .to(
        targets.leftWingPivot.rotation,
        { y: leftWingAngle, duration: leftUnfoldDuration, ease: "power3.inOut" },
        "unfold",
      )
      .to(
        targets.rightWingPivot.rotation,
        { y: rightWingAngle, duration: rightUnfoldDuration, ease: "power3.inOut" },
        rightUnfoldAt,
      )
      .call(() => physicalAudio.playCue("hinge-right"), [], rightUnfoldAt)
      .addLabel("reveal", revealAt)
      .call(() => setMotionPhase("reveal"), [], "reveal")
      .to(
        targets.centerSheet.position,
        { z: reducedMotion ? 0.025 : 0.1, duration: revealDuration, ease: "power2.out" },
        "reveal",
      )
      .to(
        targets.cloudFrontMaterial,
        { opacity: cloudFrontOpacity, duration: revealDuration, ease: "power2.out" },
        "reveal",
      )
      .to(
        targets.cloudFront.position,
        { ...cloudFrontPosition, duration: revealDuration, ease: "power2.out" },
        "reveal",
      )
      .to(
        targets.cloudFront.rotation,
        { z: cloudFrontRotation, duration: revealDuration, ease: "power2.out" },
        "reveal",
      )
      .addLabel("settle", settleStart)
      .call(() => setMotionPhase("settle"), [], "settle")
      .call(() => physicalAudio.playCue("paper-settle"), [], "settle")
      .to(
        cameraSettleMotion,
        {
          ...cameraSettleTarget,
          duration: cameraSettleDuration,
          onUpdate: () => applyCameraMotion(cameraSettleMotion, settleSpherical),
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
    backFaceVisible,
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
  useInvitationCoverReady(stageRef, canOpen, onCoverReady);
  const canFlip = state === "closed" && (webglSupported === false || sceneReady);
  const fallbackMotion = reducedMotion ? "reduced" : isMobile ? "mobile" : "desktop";

  const toggleBackFace = useCallback(() => {
    if (!canFlip || openingRequestRef.current) return;

    const nextVisible = !backFaceVisible;
    setBackFaceVisible(nextVisible);
    setFallbackFlipped(nextVisible);
    sceneHandleRef.current?.setBackFaceVisible(nextVisible);
  }, [backFaceVisible, canFlip]);

  return (
    <div className="relative z-40 min-h-[100dvh] overflow-x-hidden bg-[#17110F] text-[#EAD9B8]">
      <h1 className="sr-only">{t("title")}</h1>
      <section
        ref={stageRef}
        data-gatefold-state={state}
        data-gatefold-progress={timelineProgress}
        data-gatefold-phase={motionPhase}
        data-gatefold-pose-captured={hasOpeningPose ? "true" : "false"}
        data-testid="long-phung-gatefold-stage"
        className="relative isolate min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_50%_16%,#7C1B1B_0%,#5A0B12_40%,#17110F_100%)]"
      >
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(120deg,transparent_0%,rgb(234_217_184_/_0.1)_48%,transparent_52%)]" />
        <div className="absolute inset-0 grid place-items-center">
          {webglSupported === true && canvasMounted ? (
            <div className="absolute inset-0" data-testid="long-phung-gatefold-canvas">
              <GatefoldSceneBoundary onError={handleSceneError}>
                <LongPhungGatefoldScene
                  innerSheet={innerSheet}
                  isOpening={state === "opening"}
                  onReady={handleSceneReady}
                  onSceneHandle={handleScene}
                />
              </GatefoldSceneBoundary>
            </div>
          ) : null}
          {webglSupported !== true ? (
            <LongPhungGatefoldFallback
              backFace={innerSheet}
              flipped={fallbackFlipped}
              isOpening={state === "opening" || state === "opened"}
              motion={fallbackMotion}
            />
          ) : null}
          <LongPhungGatefoldHandoffHero
            ref={domHeroRef}
            content={invitationContent}
            aria-hidden={state !== "opened"}
            inert={state !== "opened" ? true : undefined}
            className={state === "handoff" || state === "opened"
              ? "pointer-events-auto z-10 opacity-100"
              : "pointer-events-none z-10 opacity-0"}
          />
        </div>
        <div className="absolute inset-x-4 bottom-[max(2rem,env(safe-area-inset-bottom))] z-20 flex flex-col items-center gap-3">
          {canFlip ? (
            <button
              aria-pressed={backFaceVisible}
              data-testid="long-phung-gatefold-back-face"
              type="button"
              onClick={toggleBackFace}
              className="inline-flex min-h-11 items-center gap-2 border border-[#EAD9B8]/45 bg-[#17110F]/55 px-4 font-art-lora text-sm text-[#EAD9B8] backdrop-blur-sm transition-transform active:scale-[0.98]"
            >
              <Rotate3D aria-hidden size={16} strokeWidth={1.5} />
              {t(backFaceVisible ? "viewFront" : "viewBack")}
            </button>
          ) : null}
          {state === "closed" ? (
            <button
              type="button"
              data-testid="long-phung-gatefold-open"
              disabled={!canOpen}
              onClick={openInvitation}
              className="inline-flex min-h-12 items-center justify-center border border-[#EAD9B8]/70 bg-[#B58A3A] px-6 font-art-lora text-base font-semibold text-[#17110F] shadow-[0_0.9rem_2.2rem_rgba(23,17,15,0.3)] transition-transform disabled:cursor-wait disabled:opacity-65 active:scale-[0.98]"
            >
              {webglSupported === null ? t("loading") : t("open")}
            </button>
          ) : null}
          {state === "closed" ? (
            <p className="max-w-[30ch] text-center font-art-lora text-sm leading-6 text-[#EAD9B8]/78">
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
          <LongPhungGatefoldInvitationBody
            content={invitationContent}
          />
        </div>
      ) : null}

      {showControls ? <section className="mx-auto grid w-full max-w-4xl gap-5 px-4 py-10 sm:px-6">
        <div>
          <p className="font-art-lora text-sm font-semibold uppercase tracking-[0.18em] text-[#B58A3A]">
            {t("labKicker")}
          </p>
          <h2 className="mt-3 font-art-uni text-4xl leading-tight text-[#EAD9B8]">{t("controlsTitle")}</h2>
          <p className="mt-3 max-w-[56ch] font-art-lora leading-7 text-[#EAD9B8]/75">
            {t("controlsDescription")}
          </p>
        </div>
        <div className="grid gap-3 border border-[#B58A3A]/35 bg-[#5A0B12]/45 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <label className="flex min-h-11 items-center gap-3 font-art-lora text-sm text-[#EAD9B8]">
            <input
              type="checkbox"
              checked={forceReducedMotion}
              onChange={(event) => setForceReducedMotion(event.target.checked)}
              className="size-4 accent-[#B58A3A]"
            />
            {t("forceReducedMotion")}
          </label>
          <span className="font-art-lora text-sm text-[#EAD9B8]/72">
            {reducedMotion ? t("reducedMotionActive") : t("fullMotionActive")}
          </span>
        </div>
        <div className="grid gap-4 border border-[#B58A3A]/35 bg-[#5A0B12]/30 p-4">
          <label className="grid gap-2 font-art-lora text-sm text-[#EAD9B8]">
            <span>{t("timeline", { progress: timelineProgress })}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={timelineProgress}
              onChange={(event) => seekTimeline(Number(event.target.value))}
              disabled={!hasTimeline || state === "opened"}
              className="accent-[#B58A3A] disabled:cursor-not-allowed disabled:opacity-45"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => timelineRef.current?.play()}
              disabled={!hasTimeline || state === "opened"}
              className="inline-flex min-h-11 items-center gap-2 border border-[#EAD9B8]/45 px-4 font-art-lora text-sm text-[#EAD9B8] transition-colors hover:bg-[#EAD9B8]/10 disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.98]"
            >
              <Play aria-hidden size={15} strokeWidth={1.5} />
              {t("play")}
            </button>
            <button
              type="button"
              onClick={() => timelineRef.current?.pause()}
              disabled={!hasTimeline || state === "opened"}
              className="inline-flex min-h-11 items-center gap-2 border border-[#EAD9B8]/45 px-4 font-art-lora text-sm text-[#EAD9B8] transition-colors hover:bg-[#EAD9B8]/10 disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.98]"
            >
              <Pause aria-hidden size={15} strokeWidth={1.5} />
              {t("pause")}
            </button>
            <button
              type="button"
              onClick={reverseTimeline}
              disabled={!hasTimeline || state === "opened"}
              className="inline-flex min-h-11 items-center gap-2 border border-[#EAD9B8]/45 px-4 font-art-lora text-sm text-[#EAD9B8] transition-colors hover:bg-[#EAD9B8]/10 disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.98]"
            >
              <Rotate3D aria-hidden size={15} strokeWidth={1.5} />
              {t("reverse")}
            </button>
            <button
              type="button"
              onClick={resetExperience}
              className="inline-flex min-h-11 items-center gap-2 border border-[#B58A3A] bg-[#B58A3A] px-4 font-art-lora text-sm font-semibold text-[#17110F] transition-transform active:scale-[0.98]"
            >
              <RotateCcw aria-hidden size={15} strokeWidth={1.5} />
              {t("reset")}
            </button>
          </div>
        </div>
      </section> : null}
    </div>
  );
}
