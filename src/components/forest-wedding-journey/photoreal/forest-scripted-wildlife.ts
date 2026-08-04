import type { ForestJourneyCueState } from "../forest-cue-state";
import {
  FOREST_FINALE_DOVE_PLACEMENTS,
  FOREST_GATE_DOVE_PLACEMENTS,
  FOREST_RABBIT_PLACEMENTS,
} from "../forest-animals";
import type { ForestWorldVector3 } from "../forest-world-data";
import type {
  ForestWildlifePhase,
  ForestWildlifeSample,
} from "./forest-wildlife-behavior";

/**
 * The journey's authored animal beats, moved onto the photoreal atlas.
 *
 * `FOREST_WILDLIFE_ACTORS` covers ambient wildlife: sparse, glimpsed, driven by
 * its own clock. These actors are the opposite — they stand at fixed authored
 * marks and only move when the journey tells them to, which is what the gate
 * entry and the finale release are. The two sets never overlap, so the ambient
 * roster keeps its "no two actors share a cycle" property.
 *
 * Positions are the legacy sphere placements verbatim (`forest-animals.tsx`),
 * because the gate, the voile and the finale props were all framed around them
 * and the E2E gate test pins their counts.
 */
export type ForestScriptedWildlifeKind = "finale-dove" | "gate-dove" | "rabbit";

export type ForestScriptedWildlifeActor = {
  /** Authored resting mark, before any cue displacement. */
  readonly anchor: ForestWorldVector3;
  readonly id: string;
  /** Index within its kind, which sets the direction each dove breaks toward. */
  readonly index: number;
  readonly kind: ForestScriptedWildlifeKind;
  readonly restingRotationY: number;
};

export type ForestScriptedWildlifeCue = Readonly<
  Pick<ForestJourneyCueState, "doveFlight" | "rabbitGuide" | "windStrength">
>;

/**
 * Atlas cells reused from the ambient poses, so the scripted beats need no new
 * artwork: a grounded rabbit reads as `perch`, and a dove moves through
 * perch -> takeoff -> flight exactly as the ambient doves do.
 */
const RABBIT_CELL = 2;
const DOVE_PERCH_CELL = 3;
const DOVE_TAKEOFF_CELL = 4;
const DOVE_FLIGHT_CELL = 5;

/** Flight fraction at which a dove has left the perch and is climbing out. */
const TAKEOFF_END = 0.32;

export const FOREST_SCRIPTED_WILDLIFE_ACTORS:
  readonly ForestScriptedWildlifeActor[] = Object.freeze([
    ...FOREST_RABBIT_PLACEMENTS.map((placement, index) => Object.freeze({
      anchor: placement.position as ForestWorldVector3,
      id: placement.id,
      index,
      kind: "rabbit" as const,
      restingRotationY: placement.rotationY,
    })),
    ...FOREST_GATE_DOVE_PLACEMENTS.map((placement, index) => Object.freeze({
      anchor: placement.position as ForestWorldVector3,
      id: placement.id,
      index,
      kind: "gate-dove" as const,
      restingRotationY: placement.rotationY,
    })),
    ...FOREST_FINALE_DOVE_PLACEMENTS.map((placement, index) => Object.freeze({
      anchor: placement.position as ForestWorldVector3,
      id: placement.id,
      index,
      kind: "finale-dove" as const,
      restingRotationY: placement.rotationY,
    })),
  ]);

/**
 * How far this actor's beat has run, in `0..1`.
 *
 * Gate doves hold at 1 once the gate has departed: they were released on the
 * way in and must not reappear on their perch behind the guest. Finale doves
 * stay at rest until the finale cue is the active one, so the gate release and
 * the finale release never fire together.
 *
 * Reduced motion pins every beat to rest. `evaluateForestCue` already returns a
 * zero cue in that mode, but the beats are checked here too so a future caller
 * that samples a live cue can't animate an actor a guest asked to hold still.
 */
export function getForestScriptedWildlifeFlight(
  kind: ForestScriptedWildlifeKind,
  cue: ForestScriptedWildlifeCue,
  gateDeparted: boolean,
  finaleCueActive: boolean,
  reducedMotion: boolean,
): number {
  if (kind === "gate-dove" && gateDeparted) return 1;
  if (reducedMotion) return 0;
  if (kind === "rabbit") return Math.max(0, cue.rabbitGuide);
  if (kind === "gate-dove") {
    return finaleCueActive ? 0 : Math.max(0, cue.doveFlight);
  }
  return finaleCueActive ? Math.max(0, cue.doveFlight) : 0;
}

function dovePhase(flight: number): ForestWildlifePhase {
  if (flight <= 0) return "perch";
  return flight < TAKEOFF_END ? "takeoff" : "flight";
}

function doveCell(phase: ForestWildlifePhase): number {
  if (phase === "perch") return DOVE_PERCH_CELL;
  return phase === "takeoff" ? DOVE_TAKEOFF_CELL : DOVE_FLIGHT_CELL;
}

/**
 * Atlas cells this actor's beat can reach, probed rather than declared so the
 * grouping stays honest if a kind gains a pose. Mirrors how the ambient roster
 * is grouped in `forest-wildlife.tsx`.
 */
export function getForestScriptedWildlifeCells(
  actor: ForestScriptedWildlifeActor,
): readonly number[] {
  const cells = new Set<number>();

  for (let step = 0; step <= 20; step += 1) {
    const flight = step / 20;
    const cue = { doveFlight: flight, rabbitGuide: flight, windStrength: 0 };
    for (const gateDeparted of [false, true]) {
      for (const finaleCueActive of [false, true]) {
        const sample = sampleForestScriptedWildlifeActor(actor, 0, cue, {
          finaleCueActive,
          gateDeparted,
          openingHorizontalScale: 1,
          reducedMotion: false,
        });
        if (sample.opacity > 0) cells.add(sample.atlasCell);
      }
    }
  }

  return [...cells].sort((left, right) => left - right);
}

/**
 * Samples one scripted actor. Pure and stateless like
 * `sampleForestWildlifeActor`, so the renderer calls it per frame and writes
 * the result straight into an instanced matrix.
 *
 * Under reduced motion every actor holds its authored resting pose at full
 * opacity: the spec asks for a quiet frozen pose rather than an empty scene, so
 * the gate still has its doves and the path still has its rabbits — they simply
 * do not move. A gate dove whose gate has already departed is the one exception;
 * it stays gone, because a bird that flew away should not be standing there.
 *
 * `openingHorizontalScale` narrows the gate cluster on a phone so it stays
 * inside a portrait frame; the finale sits far down the rail and keeps its
 * authored spread.
 */
export function sampleForestScriptedWildlifeActor(
  actor: ForestScriptedWildlifeActor,
  timeSeconds: number,
  cue: ForestScriptedWildlifeCue,
  options: {
    readonly finaleCueActive: boolean;
    readonly gateDeparted: boolean;
    readonly openingHorizontalScale: number;
    readonly reducedMotion: boolean;
  },
): ForestWildlifeSample {
  const { finaleCueActive, gateDeparted, openingHorizontalScale, reducedMotion }
    = options;
  const flight = getForestScriptedWildlifeFlight(
    actor.kind,
    cue,
    gateDeparted,
    finaleCueActive,
    reducedMotion,
  );
  const horizontalScale = actor.kind === "finale-dove"
    ? 1
    : openingHorizontalScale;
  const anchorX = actor.anchor[0] * horizontalScale;
  // Idle life at the resting mark, stronger in a gust so a perched actor reads
  // as part of the same weather as the branches behind it.
  const bob = reducedMotion
    ? 0
    : Math.sin(timeSeconds * 4.2) * 0.02 * (1 + Math.max(0, cue.windStrength));

  if (actor.kind === "rabbit") {
    // The lead rabbit turns and hops ahead of the guest as the gate opens; the
    // companion only turns to watch. Same split as the legacy rig.
    //
    // No corridor fence here, unlike the ambient roster: these marks were
    // authored to flank the path closely and are framed by the gate test.
    const lead = actor.index === 0;
    const hop = lead
      ? Math.sin(Math.min(1, flight / 0.68) * Math.PI) * 0.22
      : 0;
    return {
      atlasCell: RABBIT_CELL,
      opacity: 1,
      phase: "perch",
      position: [
        anchorX - (lead ? flight * 0.18 : 0),
        actor.anchor[1] + hop + Math.abs(bob),
        actor.anchor[2] - (lead ? flight * 0.14 : 0),
      ],
      rotationY: actor.restingRotationY
        + (lead ? -flight * 0.28 : flight * 0.22),
      scale: 0.58,
    };
  }

  // A released gate dove climbs out of frame. Fading it at the very end keeps
  // it from hanging in the sky above the families scene.
  if (actor.kind === "gate-dove" && gateDeparted) {
    return {
      atlasCell: DOVE_FLIGHT_CELL,
      opacity: 0,
      phase: "hidden",
      position: actor.anchor,
      rotationY: actor.restingRotationY,
      scale: 0.5,
    };
  }

  const phase = dovePhase(flight);
  // Even indices break left, odd right, so a pair opens outward.
  const direction = actor.index % 2 === 0 ? -1 : 1;
  const spread = actor.kind === "gate-dove" ? 1.48 : 1.05;
  const climb = actor.kind === "gate-dove" ? 1.52 : 1.12;

  return {
    atlasCell: doveCell(phase),
    opacity: 1,
    phase,
    position: [
      anchorX + direction * flight * spread,
      actor.anchor[1]
        + flight * climb
        + Math.sin(flight * Math.PI) * 0.16
        + (phase === "perch" ? bob : 0),
      actor.anchor[2] - flight * (0.72 + actor.index * 0.08),
    ],
    rotationY: actor.restingRotationY + direction * flight * 0.42,
    scale: 0.5,
  };
}
