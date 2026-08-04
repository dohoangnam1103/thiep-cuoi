"use client";

/*
 * Twin file: src/components/forest-wedding-journey/forest-static-scenes.tsx
 *
 * The scene's readable content, mounted into the 3D world as a `<Html transform>`
 * panel. The forest twin also builds the furniture each panel rests on — draped
 * tables, a bevelled lectern, a gift chest — because a clearing with floating
 * text reads as unfinished.
 *
 * This lab does not repeat that. `BeachProps` already hangs the panel's support:
 * a line strung between driftwood posts, the same line the gallery frames hang
 * from. So each scene mounts its content at the line's height, facing the camera
 * pose the rail parks at, and the geometry stays in the props module where it is
 * measured and tested. What is carried over unchanged is the `<Html>`
 * configuration — `transform`, `center`, the `distanceFactor`, the
 * `zIndexRange` and the rule that only the active, settled scene takes pointer
 * events — because that is what makes the DOM content legible and focusable
 * inside a WebGL canvas.
 *
 * The placement maths lives in ./beach-panel-placement so a `node:test` run can
 * import it; this file imports the lab's CSS module transitively and cannot be
 * loaded outside a bundler.
 */

import { Html } from "@react-three/drei";

import type {
  BeachJourneyContent,
  BeachJourneyScene,
} from "@/data/beach-wedding-journey";

import {
  BEACH_PANEL_DISTANCE_FACTOR,
  getBeachPanelPlacement,
} from "./beach-panel-placement";
import {
  BeachSceneContent,
  type BeachSceneLabels,
} from "./beach-scene-content";
import {
  BeachInteractiveSceneContent,
  type BeachJourneyLocalInteractions,
} from "./beach-interactive-scenes";

export type BeachScenePanelProps = {
  readonly active: boolean;
  readonly content: BeachJourneyContent;
  readonly interactions: BeachJourneyLocalInteractions;
  readonly labels: BeachSceneLabels;
  readonly scene: BeachJourneyScene;
  readonly sceneName: string;
  readonly settled: boolean;
};

export function BeachScenePanel({
  active,
  content,
  interactions,
  labels,
  scene,
  sceneName,
  settled,
}: BeachScenePanelProps) {
  const { position, rotationY } = getBeachPanelPlacement(scene);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Html
        center
        distanceFactor={BEACH_PANEL_DISTANCE_FACTOR}
        pointerEvents={active && settled ? "auto" : "none"}
        transform
        zIndexRange={[8, 1]}
      >
        <BeachSceneContent
          active={active}
          content={content}
          interactiveContent={(
            <BeachInteractiveSceneContent
              content={content}
              interactions={interactions}
              labels={labels}
              sceneType={scene.type}
            />
          )}
          labels={labels}
          photoStatus="ready"
          rendererMode="webgl"
          scene={scene}
          sceneName={sceneName}
          settled={settled}
        />
      </Html>
    </group>
  );
}
