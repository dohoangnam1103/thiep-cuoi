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

function FamilyClothTable({
  clothColor,
  x,
}: {
  readonly clothColor: string;
  readonly x: number;
}) {
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0.23, 0]}>
        <boxGeometry args={[0.64, 0.44, 0.48]} />
        <meshStandardMaterial color="#765b43" roughness={0.92} />
      </mesh>
      <mesh name="forest-family-table-cloth-top" position={[0, 0.49, 0]}>
        <boxGeometry args={[0.78, 0.09, 0.6]} />
        <meshStandardMaterial color={clothColor} roughness={0.98} />
      </mesh>
      <mesh
        name="forest-family-table-front-drape"
        position={[0, 0.27, 0.29]}
      >
        <boxGeometry args={[0.78, 0.44, 0.035]} />
        <meshStandardMaterial color={clothColor} roughness={0.98} />
      </mesh>
      {[-0.375, 0.375].map((sideX) => (
        <mesh
          key={sideX}
          name="forest-family-table-side-drape"
          position={[sideX, 0.27, 0]}
        >
          <boxGeometry args={[0.035, 0.44, 0.58]} />
          <meshStandardMaterial color={clothColor} roughness={0.98} />
        </mesh>
      ))}
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
      <mesh position={[0, 0.44, 0]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[1.05, 0.06, 0.72]} />
        <meshStandardMaterial color="#e6d5b8" roughness={0.94} />
      </mesh>
      <mesh position={[-0.35, 0.64, -0.12]} rotation={[-0.82, 0, -0.18]}>
        <planeGeometry args={[0.72, 0.58]} />
        <meshStandardMaterial color="#d6bc93" roughness={0.96} />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[0.88, 1.08, 0.045]} />
        <meshStandardMaterial color="#fff9e8" roughness={0.9} />
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
      <mesh position={[0, 0.78, -0.045]}>
        <boxGeometry args={[1.32, 1.46, 0.12]} />
        <meshStandardMaterial color="#846247" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.78, 0.03]}>
        <boxGeometry args={[1.18, 1.3, 0.045]} />
        <meshStandardMaterial color="#fff9e8" roughness={0.93} />
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
      <mesh position={[0, 0.26, -0.08]}>
        <boxGeometry args={[1.58, 0.48, 0.48]} />
        <meshStandardMaterial color="#785b42" roughness={0.94} />
      </mesh>
      <mesh position={[0, 0.54, 0]}>
        <boxGeometry args={[1.78, 0.1, 0.66]} />
        <meshStandardMaterial color="#c9c7ad" roughness={0.98} />
      </mesh>
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
      <mesh position={[0, 0.32, -0.1]}>
        <boxGeometry args={[1.35, 0.56, 0.38]} />
        <meshStandardMaterial color="#765a43" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.22, 0]}>
        <boxGeometry args={[1.55, 0.07, 0.07]} />
        <meshStandardMaterial color="#87664a" roughness={0.9} />
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
        <mesh key={x} position={[x, 0.64, -0.08]}>
          <boxGeometry args={[0.09, 1.28, 0.09]} />
          <meshStandardMaterial color="#76583e" roughness={0.93} />
        </mesh>
      ))}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[1.36, 0.72, 0.12]} />
        <meshStandardMaterial color="#8a6749" roughness={0.9} />
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
      <mesh name="forest-map-table" position={[0, 0.32, -0.08]}>
        <boxGeometry args={[1.62, 0.58, 0.78]} />
        <meshStandardMaterial color="#795b40" roughness={0.94} />
      </mesh>
      <mesh
        name="forest-map-paper"
        position={[0, 0.68, 0.05]}
        rotation={[-0.24, 0, 0]}
      >
        <boxGeometry args={[1.45, 0.055, 0.78]} />
        <meshStandardMaterial color="#f6efd9" roughness={0.96} />
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
      <mesh name="forest-rsvp-ledger-table" position={[0, 0.3, -0.08]}>
        <boxGeometry args={[1.55, 0.54, 0.68]} />
        <meshStandardMaterial color="#795b40" roughness={0.94} />
      </mesh>
      <mesh name="forest-rsvp-white-cloth" position={[0, 0.58, -0.02]}>
        <boxGeometry args={[1.68, 0.1, 0.78]} />
        <meshStandardMaterial color="#fffdf4" roughness={0.98} />
      </mesh>
      <mesh
        name="forest-rsvp-clipboard"
        position={[0, 0.72, 0.04]}
        rotation={[-0.18, 0, 0]}
      >
        <boxGeometry args={[1.08, 0.06, 0.68]} />
        <meshStandardMaterial color="#b98a59" roughness={0.9} />
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
      <mesh name="forest-wishes-book-table" position={[0, 0.3, -0.08]}>
        <boxGeometry args={[1.72, 0.54, 0.74]} />
        <meshStandardMaterial color="#7f6044" roughness={0.94} />
      </mesh>
      {[-0.36, 0.36].map((x, index) => (
        <mesh
          key={x}
          name="forest-wishes-open-book-page"
          position={[x, 0.65, 0.04]}
          rotation={[-0.2, index === 0 ? 0.05 : -0.05, index === 0 ? -0.04 : 0.04]}
        >
          <boxGeometry args={[0.72, 0.045, 0.72]} />
          <meshStandardMaterial color="#fff8e4" roughness={0.97} />
        </mesh>
      ))}
      {[-0.72, 0.7].map((x, index) => (
        <mesh
          key={x}
          name="forest-wishes-paper-note"
          position={[x, 0.72, 0.3]}
          rotation={[-0.32, 0, index === 0 ? -0.14 : 0.12]}
        >
          <boxGeometry args={[0.38, 0.035, 0.32]} />
          <meshStandardMaterial color={index === 0 ? "#f0dfb8" : "#f6ead0"} roughness={0.98} />
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
      <mesh name="forest-gift-table" position={[0, 0.3, -0.08]}>
        <boxGeometry args={[1.5, 0.54, 0.68]} />
        <meshStandardMaterial color="#76583f" roughness={0.94} />
      </mesh>
      {[-0.4, 0.4].map((x, index) => (
        <group key={x} position={[x, 0.7, 0.03]} rotation={[-0.18, 0, index ? 0.08 : -0.08]}>
          <mesh name="forest-gift-envelope">
            <boxGeometry args={[0.62, 0.055, 0.42]} />
            <meshStandardMaterial color={index === 0 ? "#efddbc" : "#f5e7cc"} roughness={0.96} />
          </mesh>
          <mesh name="forest-gift-envelope-seal" position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.025, 16]} />
            <meshStandardMaterial color="#a7644d" roughness={0.88} />
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
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[0.42, 0.68, 0.48]} />
            <meshStandardMaterial color="#8b6b50" roughness={0.94} />
          </mesh>
          <mesh position={[0, 0.78, -0.16]} rotation={[0.12, 0, 0]}>
            <boxGeometry args={[0.42, 0.58, 0.08]} />
            <meshStandardMaterial color="#f1ead8" roughness={0.96} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.1, -0.24]}>
        <planeGeometry args={[0.78, 1.62]} />
        <meshStandardMaterial
          color="#f4f0e2"
          opacity={0.72}
          roughness={0.9}
          transparent
        />
      </mesh>
      {[-0.22, 0, 0.22].map((x, index) => (
        <mesh key={x} position={[x, 0.38 + index * 0.04, 0.02]}>
          <dodecahedronGeometry args={[0.13, 0]} />
          <meshStandardMaterial
            color={index === 1 ? "#f8f2df" : "#dfe2c9"}
            roughness={0.88}
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
