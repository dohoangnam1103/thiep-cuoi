"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Color, Fog } from "three";

export type ForestAtmosphere = {
  readonly color: string;
  readonly far: number;
  readonly near: number;
};

/**
 * Installs a skin's sky colour and distance fog on the live scene.
 *
 * Declared imperatively rather than as `<color attach="background" />` and
 * `<fog attach="fog" />`: R3F resolves `attach` against the *parent instance*,
 * and every forest skin renders its lighting inside a `<group>`, so the JSX
 * form silently writes `group.background`/`group.fog` and leaves the sky at
 * the renderer's black clear colour with no fog at all. Both values are
 * restored on unmount so switching skins cannot leak one atmosphere into
 * another.
 */
export function useForestSceneAtmosphere({ color, far, near }: ForestAtmosphere): void {
  const invalidate = useThree(({ invalidate: requestFrame }) => requestFrame);
  const scene = useThree(({ scene: activeScene }) => activeScene);

  useEffect(() => {
    const previousBackground = scene.background;
    const previousFog = scene.fog;
    /* eslint-disable react-hooks/immutability */
    scene.background = new Color(color);
    scene.fog = new Fog(color, near, far);
    /* eslint-enable react-hooks/immutability */
    invalidate();

    return () => {
      scene.background = previousBackground;
      scene.fog = previousFog;
      invalidate();
    };
  }, [color, far, invalidate, near, scene]);
}
