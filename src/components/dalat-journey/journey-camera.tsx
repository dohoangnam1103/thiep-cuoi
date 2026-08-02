"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import {
  useLayoutEffect,
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

import { dalatJourneyDefinition } from "@/data/dalat-journey";

import type { JourneyCueState } from "./dalat-mist-world";

export type JourneyLookState = {
  pitchDegrees: number;
  yawDegrees: number;
};

export type JourneyInvalidateBridge = MutableRefObject<(() => void) | null>;

type JourneyCameraProps = {
  cueRef: MutableRefObject<JourneyCueState>;
  currentIndex: number;
  diagnosticsRef: RefObject<HTMLElement | null>;
  invalidateBridgeRef: JourneyInvalidateBridge;
  lookRef: MutableRefObject<JourneyLookState>;
  onArrive: () => void;
  reducedMotion: boolean;
  targetIndex: number | null;
};

const ZERO_LOOK: JourneyLookState = {
  pitchDegrees: 0,
  yawDegrees: 0,
};

function toVector3(values: readonly [number, number, number]): Vector3 {
  return new Vector3(values[0], values[1], values[2]);
}

function displayNumber(value: number): string {
  return (Math.abs(value) < 0.0005 ? 0 : value).toFixed(3);
}

function writeDiagnostics(
  element: HTMLElement | null,
  camera: Camera,
  cue: JourneyCueState,
  look: JourneyLookState,
) {
  if (!element) return;
  element.dataset.cameraX = displayNumber(camera.position.x);
  element.dataset.cameraY = displayNumber(camera.position.y);
  element.dataset.cameraZ = displayNumber(camera.position.z);
  element.dataset.renderedLookPitch = displayNumber(look.pitchDegrees);
  element.dataset.renderedLookYaw = displayNumber(look.yawDegrees);
  element.dataset.sceneTime = displayNumber(cue.sceneTime);
  element.dataset.travelProgress = displayNumber(cue.travelProgress);
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
  currentIndex: number,
  look: JourneyLookState,
) {
  const checkpoint = dalatJourneyDefinition.checkpoints[currentIndex];
  const position = toVector3(checkpoint.cameraPosition);
  const target = toVector3(checkpoint.lookTarget);
  const direction = target.sub(position).normalize();
  const basePitch = Math.asin(MathUtils.clamp(direction.y, -1, 1));
  const baseYaw = Math.atan2(-direction.x, -direction.z);

  camera.position.copy(position);
  camera.rotation.set(
    basePitch + MathUtils.degToRad(look.pitchDegrees),
    baseYaw + MathUtils.degToRad(look.yawDegrees),
    0,
    "YXZ",
  );
}

function railMidpoint(currentIndex: number, targetIndex: number): Vector3 {
  const legIndex = Math.min(currentIndex, targetIndex);
  const midpoint =
    dalatJourneyDefinition.checkpoints[legIndex]?.travelMidpointToNext;
  if (midpoint === null || midpoint === undefined) {
    throw new Error("Dalat journey travel requires an authored rail midpoint");
  }
  return toVector3(midpoint);
}

export function JourneyCamera({
  cueRef,
  currentIndex,
  diagnosticsRef,
  invalidateBridgeRef,
  lookRef,
  onArrive,
  reducedMotion,
  targetIndex,
}: JourneyCameraProps) {
  const { camera, invalidate } = useThree();
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    if (targetIndex !== null) return;

    const checkpoint = dalatJourneyDefinition.checkpoints[currentIndex];
    applySettledPose(camera, currentIndex, lookRef.current);
    cueRef.current.glow = checkpoint.sceneCue;
    cueRef.current.mistOpen = currentIndex === 0 ? 0 : 1;
    cueRef.current.travelProgress = 1;
    writeDiagnostics(
      diagnosticsRef.current,
      camera,
      cueRef.current,
      lookRef.current,
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
    targetIndex,
  ]);

  useFrame((_, delta) => {
    if (targetIndex !== null || document.visibilityState !== "visible") return;

    cueRef.current.sceneTime += Math.min(delta, 0.1);
    applySettledPose(camera, currentIndex, lookRef.current);
    writeDiagnostics(
      diagnosticsRef.current,
      camera,
      cueRef.current,
      lookRef.current,
    );
  });

  useLayoutEffect(() => {
    if (targetIndex === null) return;

    gsap.ticker.lagSmoothing(0);
    timelineRef.current?.kill();
    const targetCheckpoint = dalatJourneyDefinition.checkpoints[targetIndex];
    const durationSeconds = reducedMotion
      ? dalatJourneyDefinition.reducedDurationMs / 1_000
      : targetCheckpoint.travelDurationMs / 1_000;
    const startPosition = camera.position.clone();
    const startQuaternion = camera.quaternion.clone();
    const startLook = { ...lookRef.current };
    const targetPosition = toVector3(targetCheckpoint.cameraPosition);
    const targetLookTarget = toVector3(targetCheckpoint.lookTarget);
    const targetQuaternion = authoredQuaternion(
      targetPosition,
      targetLookTarget,
      camera,
    );
    const currentLookDistance = Math.max(
      1,
      startPosition.distanceTo(
        toVector3(
          dalatJourneyDefinition.checkpoints[currentIndex].lookTarget,
        ),
      ),
    );
    const startLookTarget = new Vector3(0, 0, -1)
      .applyQuaternion(startQuaternion)
      .multiplyScalar(currentLookDistance)
      .add(startPosition);
    const curve = new CatmullRomCurve3([
      startPosition,
      railMidpoint(currentIndex, targetIndex),
      targetPosition,
    ]);
    const proxy = { progress: 0 };
    const interpolatedLookTarget = new Vector3();
    const renderedLook: JourneyLookState = { ...startLook };
    const startSceneTime = cueRef.current.sceneTime;
    const diagnosticsElement = diagnosticsRef.current;
    let arrived = false;
    let reducedPoseSnapped = false;

    lookRef.current = { ...ZERO_LOOK };
    cueRef.current.travelProgress = 0;

    const requestInvalidation = () => {
      (invalidateBridgeRef.current ?? invalidate)();
    };

    const snapReducedPose = () => {
      if (reducedPoseSnapped) return;
      reducedPoseSnapped = true;
      camera.position.copy(targetPosition);
      camera.quaternion.copy(targetQuaternion);
      cueRef.current.glow = targetCheckpoint.sceneCue;
      cueRef.current.mistOpen = targetIndex === 0 ? 0 : 1;
      cueRef.current.sceneTime = startSceneTime + durationSeconds;
      cueRef.current.travelProgress = proxy.progress;
    };

    const updateTravel = () => {
      if (reducedMotion) {
        cueRef.current.travelProgress = proxy.progress;
        if (proxy.progress >= 0.5) snapReducedPose();
      } else {
        curve.getPoint(proxy.progress, camera.position);
        interpolatedLookTarget.lerpVectors(
          startLookTarget,
          targetLookTarget,
          proxy.progress,
        );
        if (proxy.progress === 0) {
          camera.quaternion.copy(startQuaternion);
        } else {
          camera.lookAt(interpolatedLookTarget);
        }
      }

      renderedLook.pitchDegrees = MathUtils.lerp(
        startLook.pitchDegrees,
        0,
        proxy.progress,
      );
      renderedLook.yawDegrees = MathUtils.lerp(
        startLook.yawDegrees,
        0,
        proxy.progress,
      );
      writeDiagnostics(
        diagnosticsElement,
        camera,
        cueRef.current,
        renderedLook,
      );
      requestInvalidation();
    };

    const timeline = gsap.timeline({
      onComplete: () => {
        if (arrived) return;
        arrived = true;
        camera.position.copy(targetPosition);
        camera.quaternion.copy(targetQuaternion);
        cueRef.current.glow = targetCheckpoint.sceneCue;
        cueRef.current.mistOpen = targetIndex === 0 ? 0 : 1;
        cueRef.current.sceneTime = startSceneTime + durationSeconds;
        cueRef.current.travelProgress = 1;
        writeDiagnostics(
          diagnosticsElement,
          camera,
          cueRef.current,
          ZERO_LOOK,
        );
        requestInvalidation();
        onArrive();
      },
      onUpdate: updateTravel,
    });
    timelineRef.current = timeline;

    timeline.to(
      proxy,
      {
        duration: durationSeconds,
        ease: reducedMotion ? "none" : "power2.inOut",
        progress: 1,
      },
      0,
    );

    if (reducedMotion) {
      if (diagnosticsElement) {
        timeline
          .to(
            diagnosticsElement,
            { duration: durationSeconds / 2, ease: "power1.in", opacity: 0 },
            0,
          )
          .to(
            diagnosticsElement,
            { duration: durationSeconds / 2, ease: "power1.out", opacity: 1 },
            durationSeconds / 2,
          );
      }
      timeline.call(snapReducedPose, [], durationSeconds / 2);
    } else {
      timeline.to(
        cueRef.current,
        {
          duration: durationSeconds,
          ease: "power2.inOut",
          glow: targetCheckpoint.sceneCue,
          mistOpen: targetIndex === 0 ? 0 : 1,
          sceneTime: startSceneTime + durationSeconds,
          travelProgress: 1,
        },
        0,
      );
    }

    return () => {
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
    targetIndex,
  ]);

  return null;
}
