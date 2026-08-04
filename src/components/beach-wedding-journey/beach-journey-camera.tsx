"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import {
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
  type RefObject,
} from "react";
import {
  CatmullRomCurve3,
  MathUtils,
  Matrix4,
  Quaternion,
  Vector3,
  type Camera,
} from "three";

import type { BeachJourneyScene } from "@/data/beach-wedding-journey";

import {
  evaluateBeachCue,
  type BeachCueValues,
  type BeachJourneyCueState,
} from "./beach-cue-state";

/**
 * Camera rail for the beach walk.
 *
 * Twin of `src/components/forest-wedding-journey/forest-journey-camera.tsx`; the
 * two files share their rail maths, their recenter handoff, their diagnostics
 * cache and their visibility handling, and a fix to any of those must be applied
 * to both. The copy exists because the forest lab is shipped and working: this
 * lab reuses its mechanics without taking on the risk of extracting a shared
 * abstraction underneath it.
 *
 * Only the cue payload differs — the beach carries `waterSparkle` and
 * `windStrength` where the forest carries five cues.
 */

export type BeachJourneyLookState = {
  pitchDegrees: number;
  yawDegrees: number;
};

export type BeachJourneyInvalidateBridge = MutableRefObject<
  (() => void) | null
>;

type BeachJourneyCameraProps = {
  readonly cueRef: MutableRefObject<BeachJourneyCueState>;
  readonly currentIndex: number;
  readonly diagnosticsRef: RefObject<HTMLElement | null>;
  readonly invalidateBridgeRef: BeachJourneyInvalidateBridge;
  readonly lookRef: MutableRefObject<BeachJourneyLookState>;
  readonly onArrive: () => void;
  readonly reducedMotion: boolean;
  readonly scenes: readonly BeachJourneyScene[];
  readonly targetIndex: number | null;
};

const ZERO_LOOK: BeachJourneyLookState = {
  pitchDegrees: 0,
  yawDegrees: 0,
};

function toVector3([x, y, z]: readonly [number, number, number]): Vector3 {
  return new Vector3(x, y, z);
}

type BeachJourneyCameraDiagnosticCache = {
  cameraX: number;
  cameraY: number;
  cameraZ: number;
  element: HTMLElement | null;
  renderedLookPitch: number;
  renderedLookYaw: number;
};

function roundedDiagnostic(value: number): number {
  const normalized = Math.abs(value) < 0.0005 ? 0 : value;
  return Math.round(normalized * 1_000) / 1_000;
}

function writeDiagnostics(
  element: HTMLElement | null,
  camera: Camera,
  look: BeachJourneyLookState,
  cache: BeachJourneyCameraDiagnosticCache,
): void {
  if (!element) return;
  if (cache.element !== element) {
    cache.element = element;
    cache.cameraX = Number.NaN;
    cache.cameraY = Number.NaN;
    cache.cameraZ = Number.NaN;
    cache.renderedLookPitch = Number.NaN;
    cache.renderedLookYaw = Number.NaN;
  }

  const cameraX = roundedDiagnostic(camera.position.x);
  const cameraY = roundedDiagnostic(camera.position.y);
  const cameraZ = roundedDiagnostic(camera.position.z);
  const renderedLookPitch = roundedDiagnostic(look.pitchDegrees);
  const renderedLookYaw = roundedDiagnostic(look.yawDegrees);
  if (cache.cameraX !== cameraX) {
    cache.cameraX = cameraX;
    element.dataset.cameraX = cameraX.toFixed(3);
  }
  if (cache.cameraY !== cameraY) {
    cache.cameraY = cameraY;
    element.dataset.cameraY = cameraY.toFixed(3);
  }
  if (cache.cameraZ !== cameraZ) {
    cache.cameraZ = cameraZ;
    element.dataset.cameraZ = cameraZ.toFixed(3);
  }
  if (cache.renderedLookPitch !== renderedLookPitch) {
    cache.renderedLookPitch = renderedLookPitch;
    element.dataset.renderedLookPitch = renderedLookPitch.toFixed(3);
  }
  if (cache.renderedLookYaw !== renderedLookYaw) {
    cache.renderedLookYaw = renderedLookYaw;
    element.dataset.renderedLookYaw = renderedLookYaw.toFixed(3);
  }
}

function authoredQuaternion(
  position: Vector3,
  target: Vector3,
  camera: Camera,
): Quaternion {
  const matrix = new Matrix4().lookAt(position, target, camera.up);
  return new Quaternion().setFromRotationMatrix(matrix);
}

function applySettledPose(
  camera: Camera,
  scene: BeachJourneyScene,
  look: BeachJourneyLookState,
  position: Vector3,
  direction: Vector3,
): void {
  position.set(...scene.cameraPosition);
  direction.set(...scene.lookTarget).sub(position).normalize();
  const basePitch = Math.asin(MathUtils.clamp(direction.y, -1, 1));
  const baseYaw = Math.atan2(-direction.x, -direction.z);

  camera.position.copy(position);
  camera.rotation.set(
    basePitch + MathUtils.degToRad(look.pitchDegrees),
    baseYaw + MathUtils.degToRad(look.yawDegrees),
    0,
    "YXZ",
  );
  camera.updateMatrixWorld(true);
}

export function getBeachJourneyRailMidpoint(
  sourceScene: BeachJourneyScene,
  targetScene: BeachJourneyScene,
): Vector3 {
  if (Math.abs(sourceScene.ordinal - targetScene.ordinal) !== 1) {
    throw new Error(
      `Beach journey camera travel must connect adjacent scene ordinals: ${sourceScene.id} (${sourceScene.ordinal}) -> ${targetScene.id} (${targetScene.ordinal})`,
    );
  }

  const lowerScene = sourceScene.ordinal < targetScene.ordinal
    ? sourceScene
    : targetScene;
  if (lowerScene.travelMidpointToNext === null) {
    throw new Error(
      `Beach journey camera rail from ${lowerScene.id} (${lowerScene.ordinal}) requires an authored midpoint to the next scene`,
    );
  }

  return toVector3(lowerScene.travelMidpointToNext);
}

function copyCueValues(
  cue: BeachJourneyCueState,
  values: BeachCueValues,
): void {
  cue.waterSparkle = values.waterSparkle;
  cue.windStrength = values.windStrength;
}

export function BeachJourneyCamera({
  cueRef,
  currentIndex,
  diagnosticsRef,
  invalidateBridgeRef,
  lookRef,
  onArrive,
  reducedMotion,
  scenes,
  targetIndex,
}: BeachJourneyCameraProps) {
  const { camera, invalidate } = useThree();
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const diagnosticsCacheRef = useRef<BeachJourneyCameraDiagnosticCache>({
    cameraX: Number.NaN,
    cameraY: Number.NaN,
    cameraZ: Number.NaN,
    element: null,
    renderedLookPitch: Number.NaN,
    renderedLookYaw: Number.NaN,
  });
  const settledPosition = useMemo(() => new Vector3(), []);
  const settledDirection = useMemo(() => new Vector3(), []);

  useLayoutEffect(() => {
    if (targetIndex !== null) return;
    const scene = scenes[currentIndex];
    if (!scene) {
      throw new Error(
        `Beach journey camera cannot resolve current scene index ${currentIndex}`,
      );
    }

    applySettledPose(
      camera,
      scene,
      lookRef.current,
      settledPosition,
      settledDirection,
    );
    writeDiagnostics(
      diagnosticsRef.current,
      camera,
      lookRef.current,
      diagnosticsCacheRef.current,
    );
    (invalidateBridgeRef.current ?? invalidate)();
  }, [
    camera,
    cueRef,
    currentIndex,
    diagnosticsRef,
    invalidate,
    invalidateBridgeRef,
    lookRef,
    scenes,
    settledDirection,
    settledPosition,
    targetIndex,
  ]);

  useFrame((_, delta) => {
    if (targetIndex !== null || document.visibilityState !== "visible") return;
    const scene = scenes[currentIndex];
    if (!scene) return;

    cueRef.current.sceneTime += Math.min(delta, 0.1);
    applySettledPose(
      camera,
      scene,
      lookRef.current,
      settledPosition,
      settledDirection,
    );
    writeDiagnostics(
      diagnosticsRef.current,
      camera,
      lookRef.current,
      diagnosticsCacheRef.current,
    );
  });

  useLayoutEffect(() => {
    if (targetIndex === null) return;
    timelineRef.current?.kill();

    const sourceScene = scenes[currentIndex];
    const targetScene = scenes[targetIndex];
    if (!sourceScene || !targetScene) {
      throw new Error(
        `Beach journey camera cannot resolve travel indices ${currentIndex} -> ${targetIndex}`,
      );
    }
    const midpoint = getBeachJourneyRailMidpoint(sourceScene, targetScene);

    gsap.ticker.lagSmoothing(0);

    const totalDuration = reducedMotion
      ? 0.18
      : targetScene.travelDurationMs / 1_000;
    const recenterDuration = reducedMotion
      ? 0
      : Math.min(0.18, totalDuration * 0.12);
    const railDuration = totalDuration - recenterDuration;
    const startPosition = camera.position.clone();
    const startQuaternion = camera.quaternion.clone();
    const startLook = { ...lookRef.current };
    const sourcePosition = toVector3(sourceScene.cameraPosition);
    const sourceLookTarget = toVector3(sourceScene.lookTarget);
    const sourceQuaternion = authoredQuaternion(
      sourcePosition,
      sourceLookTarget,
      camera,
    );
    const targetPosition = toVector3(targetScene.cameraPosition);
    const targetLookTarget = toVector3(targetScene.lookTarget);
    const targetQuaternion = authoredQuaternion(
      targetPosition,
      targetLookTarget,
      camera,
    );
    const curve = new CatmullRomCurve3([
      startPosition,
      midpoint,
      targetPosition,
    ]);
    const proxy = {
      handoffProgress: 0,
      railProgress: 0,
      recenterProgress: 0,
    };
    const renderedLook: BeachJourneyLookState = { ...startLook };
    const interpolatedLookTarget = new Vector3();
    const startSceneTime = cueRef.current.sceneTime;
    const diagnosticsElement = diagnosticsRef.current;
    let active = true;
    let arrived = false;
    let reducedPoseSnapped = false;

    lookRef.current = { ...ZERO_LOOK };
    cueRef.current.travelProgress = 0;

    /**
     * Diagnostics are published from a frame loop, so on slow hardware the
     * previous rail's final progress stays readable while the recenter pose
     * below is already live, and the pose cache would swallow the handoff frame
     * because the settled loop published those exact values. Republishing the
     * pose and zeroing progress here keeps the handoff frame self-consistent.
     */
    diagnosticsCacheRef.current.element = null;
    if (diagnosticsElement) diagnosticsElement.dataset.travelProgress = "0";

    const requestInvalidation = () => {
      (invalidateBridgeRef.current ?? invalidate)();
    };

    const evaluateCue = (progress: number) => {
      const cueValues = evaluateBeachCue({
        phase: "travelling",
        progress,
        reducedMotion,
        sourceType: sourceScene.type,
        targetType: targetScene.type,
      });
      copyCueValues(cueRef.current, cueValues);
      cueRef.current.travelProgress = reducedMotion ? 0 : progress;
    };

    const snapReducedPose = () => {
      if (reducedPoseSnapped) return false;
      reducedPoseSnapped = true;
      camera.position.copy(targetPosition);
      camera.quaternion.copy(targetQuaternion);
      camera.updateMatrixWorld(true);
      return true;
    };

    const updateTravel = () => {
      if (!active) return;

      /**
       * Reduced motion freezes the cues and holds a single pose until the
       * midpoint snap, so only the frames that actually change the 3D scene are
       * worth a render. The crossfade itself is a DOM opacity animation on the
       * diagnostics wrapper, and requesting a photoreal render for every ticker
       * tick would starve the rAF loop that drives the timeline.
       */
      let sceneChanged = !reducedMotion;

      if (reducedMotion) {
        if (proxy.handoffProgress === 0) sceneChanged = true;
        if (proxy.handoffProgress >= 0.5 && snapReducedPose()) sceneChanged = true;
        evaluateCue(0);
        cueRef.current.sceneTime = startSceneTime
          + totalDuration * proxy.handoffProgress;
        renderedLook.pitchDegrees = 0;
        renderedLook.yawDegrees = 0;
        if (diagnosticsElement) {
          diagnosticsElement.style.opacity = String(
            proxy.handoffProgress < 0.5
              ? 1 - proxy.handoffProgress * 2
              : (proxy.handoffProgress - 0.5) * 2,
          );
        }
      } else if (proxy.railProgress === 0) {
        camera.position.copy(startPosition);
        camera.quaternion.slerpQuaternions(
          startQuaternion,
          sourceQuaternion,
          proxy.recenterProgress,
        );
        camera.updateMatrixWorld(true);
        renderedLook.pitchDegrees = MathUtils.lerp(
          startLook.pitchDegrees,
          0,
          proxy.recenterProgress,
        );
        renderedLook.yawDegrees = MathUtils.lerp(
          startLook.yawDegrees,
          0,
          proxy.recenterProgress,
        );
        evaluateCue(0);
        cueRef.current.sceneTime = startSceneTime
          + recenterDuration * proxy.recenterProgress;
      } else {
        curve.getPoint(proxy.railProgress, camera.position);
        interpolatedLookTarget.lerpVectors(
          sourceLookTarget,
          targetLookTarget,
          proxy.railProgress,
        );
        camera.lookAt(interpolatedLookTarget);
        camera.updateMatrixWorld(true);
        renderedLook.pitchDegrees = 0;
        renderedLook.yawDegrees = 0;
        evaluateCue(proxy.railProgress);
        cueRef.current.sceneTime = startSceneTime
          + recenterDuration
          + railDuration * proxy.railProgress;
      }

      writeDiagnostics(
        diagnosticsElement,
        camera,
        renderedLook,
        diagnosticsCacheRef.current,
      );
      if (sceneChanged) requestInvalidation();
    };

    const timeline = gsap.timeline({
      onComplete: () => {
        if (!active || arrived) return;
        arrived = true;
        snapReducedPose();
        camera.position.copy(targetPosition);
        camera.quaternion.copy(targetQuaternion);
        camera.updateMatrixWorld(true);
        evaluateCue(reducedMotion ? 0 : 1);
        cueRef.current.sceneTime = startSceneTime + totalDuration;
        diagnosticsElement?.style.removeProperty("opacity");
        writeDiagnostics(
          diagnosticsElement,
          camera,
          ZERO_LOOK,
          diagnosticsCacheRef.current,
        );
        requestInvalidation();
        onArrive();
      },
      onUpdate: updateTravel,
    });
    timelineRef.current = timeline;

    if (reducedMotion) {
      timeline.to(proxy, {
        duration: totalDuration,
        ease: "none",
        handoffProgress: 1,
      }, 0);
    } else {
      timeline
        .to(proxy, {
          duration: recenterDuration,
          ease: "power1.out",
          recenterProgress: 1,
        }, 0)
        .to(proxy, {
          duration: railDuration,
          ease: "power2.inOut",
          railProgress: 1,
        }, recenterDuration);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        timeline.pause();
      } else if (active && !arrived) {
        timeline.resume();
        requestInvalidation();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (document.visibilityState === "hidden") timeline.pause();
    updateTravel();

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      timeline.kill();
      gsap.ticker.lagSmoothing(500, 33);
      if (timelineRef.current === timeline) timelineRef.current = null;
      diagnosticsElement?.style.removeProperty("opacity");
    };
  }, [
    camera,
    cueRef,
    currentIndex,
    diagnosticsRef,
    invalidate,
    invalidateBridgeRef,
    lookRef,
    onArrive,
    reducedMotion,
    scenes,
    targetIndex,
  ]);

  return null;
}
