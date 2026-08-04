"use client";

import { Html } from "@react-three/drei";

import type {
  ForestJourneyContent,
  ForestJourneyScene,
} from "@/data/forest-wedding-journey";

import {
  ForestSceneContent,
  type ForestSceneLabels,
} from "./forest-scene-content";
import {
  ForestInteractiveSceneContent,
  type ForestJourneyLocalInteractions,
} from "./forest-interactive-scenes";
import { createForestBevelledBoxGeometry } from "./forest-prop-geometry";
import { forestPropMaterial } from "./forest-prop-material";
import { getForestClothDrape } from "./photoreal/forest-prop-material-policy";
import type { ForestClearingSlot } from "./forest-world-data";

export type ForestStaticSceneProps = {
  readonly active: boolean;
  readonly clearing: ForestClearingSlot;
  readonly content: ForestJourneyContent;
  readonly interactions: ForestJourneyLocalInteractions;
  readonly labels: ForestSceneLabels;
  readonly scene: ForestJourneyScene;
  readonly sceneName: string;
  readonly settled: boolean;
};

type SceneAssemblyProps = ForestStaticSceneProps & {
  readonly contentPosition: readonly [number, number, number];
  readonly distanceFactor: number;
};

function sceneFacingRotation(
  scene: ForestJourneyScene,
  clearing: ForestClearingSlot,
): number {
  return Math.atan2(
    scene.cameraPosition[0] - clearing.position[0],
    scene.cameraPosition[2] - clearing.position[2],
  );
}

function ContactCue({ radius = 0.72 }: { readonly radius?: number }) {
  return (
    <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius, 18]} />
      <meshBasicMaterial
        color="#28412f"
        depthWrite={false}
        opacity={0.16}
        transparent
      />
    </mesh>
  );
}

function SceneContentHtml({
  active,
  content,
  contentPosition,
  distanceFactor,
  interactions,
  labels,
  scene,
  sceneName,
  settled,
}: SceneAssemblyProps) {
  return (
    <Html
      center
      distanceFactor={distanceFactor}
      pointerEvents={active && settled ? "auto" : "none"}
      position={contentPosition}
      transform
      zIndexRange={[8, 1]}
    >
      <ForestSceneContent
        active={active}
        content={content}
        interactiveContent={(
          <ForestInteractiveSceneContent
            content={content}
            interactions={interactions}
            labels={labels}
            sceneType={scene.type}
          />
        )}
        labels={labels}
        rendererMode="webgl"
        scene={scene}
        sceneName={sceneName}
        settled={settled}
      />
    </Html>
  );
}

type DrapedClothProps = {
  readonly color: string;
  readonly depth: number;
  readonly frontDrapeName?: string;
  readonly sideDrapeName?: string;
  readonly tableHeight: number;
  readonly topName?: string;
  readonly topThickness: number;
  readonly topY: number;
  readonly width: number;
};

/**
 * A cloth laid over a table: a padded top slab plus hanging panels on the front
 * and both sides, each closed by a hem. Without shadow maps the hem is what
 * separates fabric from a painted-on lid, so it is not decoration.
 */
function DrapedCloth({
  color,
  depth,
  frontDrapeName,
  sideDrapeName,
  tableHeight,
  topName,
  topThickness,
  topY,
  width,
}: DrapedClothProps) {
  const drape = getForestClothDrape(tableHeight);
  const drapeTop = topY - topThickness / 2;
  const panelY = drapeTop - drape.dropMetres / 2;
  const hemY = drapeTop - drape.dropMetres + drape.hemMetres / 2;
  const hemThickness = drape.thicknessMetres * 1.7;
  const material = forestPropMaterial("cloth", color);

  return (
    <>
      <mesh
        geometry={createForestBevelledBoxGeometry(width, topThickness, depth)}
        name={topName}
        position={[0, topY, 0]}
      >
        <meshStandardMaterial {...material} />
      </mesh>
      <mesh
        geometry={createForestBevelledBoxGeometry(
          width,
          drape.dropMetres,
          drape.thicknessMetres,
        )}
        name={frontDrapeName}
        position={[0, panelY, depth / 2]}
      >
        <meshStandardMaterial {...material} />
      </mesh>
      <mesh
        geometry={createForestBevelledBoxGeometry(
          width,
          drape.hemMetres,
          hemThickness,
        )}
        position={[0, hemY, depth / 2]}
      >
        <meshStandardMaterial {...material} />
      </mesh>
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[(side * width) / 2, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <mesh
            geometry={createForestBevelledBoxGeometry(
              depth,
              drape.dropMetres,
              drape.thicknessMetres,
            )}
            name={sideDrapeName}
            position={[0, panelY, 0]}
          >
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh
            geometry={createForestBevelledBoxGeometry(
              depth,
              drape.hemMetres,
              hemThickness,
            )}
            position={[0, hemY, 0]}
          >
            <meshStandardMaterial {...material} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function FamilyClothTable({
  clothColor,
  x,
}: {
  readonly clothColor: string;
  readonly x: number;
}) {
  return (
    <group position={[x, 0, 0]}>
      <mesh
        geometry={createForestBevelledBoxGeometry(0.64, 0.44, 0.48)}
        position={[0, 0.23, 0]}
      >
        <meshStandardMaterial {...forestPropMaterial("wood", "#765b43")} />
      </mesh>
      <DrapedCloth
        color={clothColor}
        depth={0.6}
        frontDrapeName="forest-family-table-front-drape"
        sideDrapeName="forest-family-table-side-drape"
        tableHeight={0.45}
        topName="forest-family-table-cloth-top"
        topThickness={0.09}
        topY={0.49}
        width={0.78}
      />
    </group>
  );
}

function FamiliesScene(props: ForestStaticSceneProps) {
  const rotationY = sceneFacingRotation(props.scene, props.clearing);
  return (
    <group position={props.clearing.position} rotation={[0, rotationY, 0]}>
      <ContactCue radius={1.02} />
      <FamilyClothTable clothColor="#fffdf4" x={-0.48} />
      <FamilyClothTable clothColor="#eee5d0" x={0.48} />
      <SceneContentHtml
        {...props}
        contentPosition={[0, 0.79, 0.34]}
        distanceFactor={1.42}
      />
    </group>
  );
}

function OpeningMessageScene(props: ForestStaticSceneProps) {
  const rotationY = sceneFacingRotation(props.scene, props.clearing);
  return (
    <group position={props.clearing.position} rotation={[0, rotationY, 0]}>
      <ContactCue />
      <mesh
        geometry={createForestBevelledBoxGeometry(1.05, 0.06, 0.72)}
        position={[0, 0.44, 0]}
        rotation={[-0.18, 0, 0]}
      >
        <meshStandardMaterial {...forestPropMaterial("wood", "#e6d5b8")} />
      </mesh>
      <mesh position={[-0.35, 0.64, -0.12]} rotation={[-0.82, 0, -0.18]}>
        <planeGeometry args={[0.72, 0.58]} />
        <meshStandardMaterial {...forestPropMaterial("paper", "#d6bc93")} />
      </mesh>
      <mesh
        geometry={createForestBevelledBoxGeometry(0.88, 1.08, 0.045)}
        position={[0, 1.02, 0]}
      >
        <meshStandardMaterial {...forestPropMaterial("paper", "#fff9e8")} />
      </mesh>
      <SceneContentHtml
        {...props}
        contentPosition={[0, 1.04, 0.035]}
        distanceFactor={1.05}
      />
    </group>
  );
}

function CalendarScene(props: ForestStaticSceneProps) {
  const rotationY = sceneFacingRotation(props.scene, props.clearing);
  return (
    <group position={props.clearing.position} rotation={[0, rotationY, 0]}>
      <ContactCue radius={0.82} />
      <mesh
        geometry={createForestBevelledBoxGeometry(1.32, 1.46, 0.12)}
        position={[0, 0.78, -0.045]}
      >
        <meshStandardMaterial {...forestPropMaterial("wood", "#846247")} />
      </mesh>
      <mesh
        geometry={createForestBevelledBoxGeometry(1.18, 1.3, 0.045)}
        position={[0, 0.78, 0.03]}
      >
        <meshStandardMaterial {...forestPropMaterial("paper", "#fff9e8")} />
      </mesh>
      <SceneContentHtml
        {...props}
        contentPosition={[0, 0.8, 0.065]}
        distanceFactor={1.08}
      />
    </group>
  );
}

function ScheduleScene(props: ForestStaticSceneProps) {
  const rotationY = sceneFacingRotation(props.scene, props.clearing);
  return (
    <group position={props.clearing.position} rotation={[0, rotationY, 0]}>
      <ContactCue radius={1.05} />
      <mesh
        geometry={createForestBevelledBoxGeometry(1.58, 0.48, 0.48)}
        position={[0, 0.26, -0.08]}
      >
        <meshStandardMaterial {...forestPropMaterial("wood", "#785b42")} />
      </mesh>
      <DrapedCloth
        color="#c9c7ad"
        depth={0.66}
        tableHeight={0.5}
        topThickness={0.1}
        topY={0.54}
        width={1.78}
      />
      <SceneContentHtml
        {...props}
        contentPosition={[0, 0.82, 0.36]}
        distanceFactor={1.5}
      />
    </group>
  );
}

function DressCodeScene(props: ForestStaticSceneProps) {
  const rotationY = sceneFacingRotation(props.scene, props.clearing);
  return (
    <group position={props.clearing.position} rotation={[0, rotationY, 0]}>
      <ContactCue radius={0.88} />
      <mesh
        geometry={createForestBevelledBoxGeometry(1.35, 0.56, 0.38)}
        position={[0, 0.32, -0.1]}
      >
        <meshStandardMaterial {...forestPropMaterial("wood", "#765a43")} />
      </mesh>
      <mesh
        geometry={createForestBevelledBoxGeometry(1.55, 0.07, 0.07)}
        position={[0, 1.22, 0]}
      >
        <meshStandardMaterial {...forestPropMaterial("wood", "#87664a")} />
      </mesh>
      <SceneContentHtml
        {...props}
        contentPosition={[0, 0.82, 0.24]}
        distanceFactor={1.22}
      />
    </group>
  );
}

function VenueScene(props: ForestStaticSceneProps) {
  const rotationY = sceneFacingRotation(props.scene, props.clearing);
  return (
    <group position={props.clearing.position} rotation={[0, rotationY, 0]}>
      <ContactCue radius={0.78} />
      {[-0.52, 0.52].map((x) => (
        <mesh
          geometry={createForestBevelledBoxGeometry(0.09, 1.28, 0.09)}
          key={x}
          position={[x, 0.64, -0.08]}
        >
          <meshStandardMaterial {...forestPropMaterial("wood", "#76583e")} />
        </mesh>
      ))}
      <mesh
        geometry={createForestBevelledBoxGeometry(1.36, 0.72, 0.12)}
        position={[0, 1.05, 0]}
      >
        <meshStandardMaterial {...forestPropMaterial("wood", "#8a6749")} />
      </mesh>
      <SceneContentHtml
        {...props}
        contentPosition={[0, 1.02, 0.08]}
        distanceFactor={1.06}
      />
    </group>
  );
}

function MapScene(props: ForestStaticSceneProps) {
  const rotationY = sceneFacingRotation(props.scene, props.clearing);
  return (
    <group position={props.clearing.position} rotation={[0, rotationY, 0]}>
      <ContactCue radius={0.94} />
      <mesh
        geometry={createForestBevelledBoxGeometry(1.62, 0.58, 0.78)}
        name="forest-map-table"
        position={[0, 0.32, -0.08]}
      >
        <meshStandardMaterial {...forestPropMaterial("wood", "#795b40")} />
      </mesh>
      <mesh
        geometry={createForestBevelledBoxGeometry(1.45, 0.055, 0.78)}
        name="forest-map-paper"
        position={[0, 0.68, 0.05]}
        rotation={[-0.24, 0, 0]}
      >
        <meshStandardMaterial {...forestPropMaterial("paper", "#f6efd9")} />
      </mesh>
      <SceneContentHtml
        {...props}
        contentPosition={[0, 0.96, 0.4]}
        distanceFactor={1.3}
      />
    </group>
  );
}

function RsvpScene(props: ForestStaticSceneProps) {
  const rotationY = sceneFacingRotation(props.scene, props.clearing);
  return (
    <group position={props.clearing.position} rotation={[0, rotationY, 0]}>
      <ContactCue radius={0.92} />
      <mesh
        geometry={createForestBevelledBoxGeometry(1.55, 0.54, 0.68)}
        name="forest-rsvp-ledger-table"
        position={[0, 0.3, -0.08]}
      >
        <meshStandardMaterial {...forestPropMaterial("wood", "#795b40")} />
      </mesh>
      <DrapedCloth
        color="#fffdf4"
        depth={0.78}
        tableHeight={0.55}
        topName="forest-rsvp-white-cloth"
        topThickness={0.1}
        topY={0.58}
        width={1.68}
      />
      <mesh
        geometry={createForestBevelledBoxGeometry(1.08, 0.06, 0.68)}
        name="forest-rsvp-clipboard"
        position={[0, 0.72, 0.04]}
        rotation={[-0.18, 0, 0]}
      >
        <meshStandardMaterial {...forestPropMaterial("wood", "#b98a59")} />
      </mesh>
      <SceneContentHtml
        {...props}
        contentPosition={[0, 1.08, 0.4]}
        distanceFactor={1.35}
      />
    </group>
  );
}

function WishesScene(props: ForestStaticSceneProps) {
  const rotationY = sceneFacingRotation(props.scene, props.clearing);
  return (
    <group position={props.clearing.position} rotation={[0, rotationY, 0]}>
      <ContactCue radius={1.02} />
      <mesh
        geometry={createForestBevelledBoxGeometry(1.72, 0.54, 0.74)}
        name="forest-wishes-book-table"
        position={[0, 0.3, -0.08]}
      >
        <meshStandardMaterial {...forestPropMaterial("wood", "#7f6044")} />
      </mesh>
      {[-0.36, 0.36].map((x, index) => (
        <mesh
          geometry={createForestBevelledBoxGeometry(0.72, 0.045, 0.72)}
          key={x}
          name="forest-wishes-open-book-page"
          position={[x, 0.65, 0.04]}
          rotation={[-0.2, index === 0 ? 0.05 : -0.05, index === 0 ? -0.04 : 0.04]}
        >
          <meshStandardMaterial {...forestPropMaterial("paper", "#fff8e4")} />
        </mesh>
      ))}
      {[-0.72, 0.7].map((x, index) => (
        <mesh
          geometry={createForestBevelledBoxGeometry(0.38, 0.035, 0.32)}
          key={x}
          name="forest-wishes-paper-note"
          position={[x, 0.72, 0.3]}
          rotation={[-0.32, 0, index === 0 ? -0.14 : 0.12]}
        >
          <meshStandardMaterial
            {...forestPropMaterial(
              "paper",
              index === 0 ? "#f0dfb8" : "#f6ead0",
            )}
          />
        </mesh>
      ))}
      <SceneContentHtml
        {...props}
        contentPosition={[0, 1.05, 0.42]}
        distanceFactor={1.48}
      />
    </group>
  );
}

function GiftScene(props: ForestStaticSceneProps) {
  const rotationY = sceneFacingRotation(props.scene, props.clearing);
  return (
    <group position={props.clearing.position} rotation={[0, rotationY, 0]}>
      <ContactCue radius={0.9} />
      <mesh
        geometry={createForestBevelledBoxGeometry(1.5, 0.54, 0.68)}
        name="forest-gift-table"
        position={[0, 0.3, -0.08]}
      >
        <meshStandardMaterial {...forestPropMaterial("wood", "#76583f")} />
      </mesh>
      {[-0.4, 0.4].map((x, index) => (
        <group key={x} position={[x, 0.7, 0.03]} rotation={[-0.18, 0, index ? 0.08 : -0.08]}>
          <mesh
            geometry={createForestBevelledBoxGeometry(0.62, 0.055, 0.42)}
            name="forest-gift-envelope"
          >
            <meshStandardMaterial
              {...forestPropMaterial(
                "paper",
                index === 0 ? "#efddbc" : "#f5e7cc",
              )}
            />
          </mesh>
          <mesh name="forest-gift-envelope-seal" position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.025, 16]} />
            <meshStandardMaterial {...forestPropMaterial("paper", "#a7644d")} />
          </mesh>
        </group>
      ))}
      <SceneContentHtml
        {...props}
        contentPosition={[0, 1.02, 0.4]}
        distanceFactor={1.38}
      />
    </group>
  );
}

function FinaleScene(props: ForestStaticSceneProps) {
  const rotationY = sceneFacingRotation(props.scene, props.clearing);
  return (
    <group position={props.clearing.position} rotation={[0, rotationY, 0]}>
      <ContactCue radius={1.22} />
      {[-0.72, 0.72].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh
            geometry={createForestBevelledBoxGeometry(0.42, 0.68, 0.48)}
            position={[0, 0.35, 0]}
          >
            <meshStandardMaterial {...forestPropMaterial("wood", "#8b6b50")} />
          </mesh>
          <mesh
            geometry={createForestBevelledBoxGeometry(0.42, 0.58, 0.08)}
            position={[0, 0.78, -0.16]}
            rotation={[0.12, 0, 0]}
          >
            <meshStandardMaterial {...forestPropMaterial("cloth", "#f1ead8")} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.1, -0.24]}>
        <planeGeometry args={[0.78, 1.62]} />
        <meshStandardMaterial {...forestPropMaterial("cloth", "#f4f0e2", 0.72)} />
      </mesh>
      {[-0.22, 0, 0.22].map((x, index) => (
        <mesh key={x} position={[x, 0.38 + index * 0.04, 0.02]}>
          <dodecahedronGeometry args={[0.13, 0]} />
          <meshStandardMaterial
            {...forestPropMaterial(
              "blossom",
              index === 1 ? "#f8f2df" : "#dfe2c9",
            )}
          />
        </mesh>
      ))}
      <SceneContentHtml
        {...props}
        contentPosition={[0, 1.08, 0.08]}
        distanceFactor={1.1}
      />
    </group>
  );
}

export function ForestStaticScene(props: ForestStaticSceneProps) {
  switch (props.scene.type) {
    case "families":
      return <FamiliesScene {...props} />;
    case "opening-message":
      return <OpeningMessageScene {...props} />;
    case "calendar":
      return <CalendarScene {...props} />;
    case "schedule":
      return <ScheduleScene {...props} />;
    case "dress-code":
      return <DressCodeScene {...props} />;
    case "venue":
      return <VenueScene {...props} />;
    case "map":
      return <MapScene {...props} />;
    case "rsvp":
      return <RsvpScene {...props} />;
    case "wishes":
      return <WishesScene {...props} />;
    case "gift":
      return <GiftScene {...props} />;
    case "finale":
      return <FinaleScene {...props} />;
    case "cover-gate":
    case "gallery-photo":
      return null;
    default: {
      const unhandledSceneType: never = props.scene.type;
      return unhandledSceneType;
    }
  }
}
