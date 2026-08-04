import type { ForestJourneyCueState } from "../forest-cue-state";
import type { ForestWorldVector3 } from "../forest-world-data";

export type ForestWildlifeKind = "dove" | "rabbit" | "squirrel";

export type ForestWildlifePhase =
  | "climb"
  | "flight"
  | "hidden"
  | "perch"
  | "run"
  | "takeoff";

export type ForestWildlifeActor = {
  /** Base of the tree or shrub the actor belongs to. */
  readonly anchor: ForestWorldVector3;
  readonly id: string;
  readonly kind: ForestWildlifeKind;
  /**
   * Seconds for one full appear-and-hide cycle. Must exceed the actor's script
   * length; the remainder is the hidden stretch between sightings.
   */
  readonly period: number;
  /** Seconds into the cycle at which this actor starts, so they never sync. */
  readonly phaseOffset: number;
  /** Metres the actor can travel from its anchor while visible. */
  readonly range: number;
};

export type ForestWildlifeCue = Readonly<
  Pick<ForestJourneyCueState, "doveFlight" | "windStrength">
>;

export type ForestWildlifeSample = {
  /** Cell in the wildlife atlas, which doubles as the actor's pose. */
  readonly atlasCell: number;
  readonly opacity: number;
  readonly phase: ForestWildlifePhase;
  readonly position: ForestWorldVector3;
  readonly rotationY: number;
  readonly scale: number;
};

/**
 * Guests walk down the middle of the scene, so grounded wildlife is fenced
 * outside this half-width. Only airborne actors may cross it.
 */
export const FOREST_WILDLIFE_CORRIDOR_HALF_WIDTH = 1.9;

/** Seconds of fade at each end of a visible window, so nothing pops in. */
const FADE_SECONDS = 0.45;

/**
 * A deliberately sparse roster. Wildlife should read as glimpsed rather than
 * staged, so each actor is visible for a fraction of its period and no two
 * share a cycle length.
 */
export const FOREST_WILDLIFE_ACTORS: readonly ForestWildlifeActor[] =
  Object.freeze([
    Object.freeze({
      anchor: [-3.15, 0.04, -6.4] as ForestWorldVector3,
      id: "squirrel-oak",
      kind: "squirrel" as const,
      period: 96,
      phaseOffset: 0,
      range: 2.1,
    }),
    Object.freeze({
      anchor: [3.42, 0.04, -21.8] as ForestWorldVector3,
      id: "squirrel-pine",
      kind: "squirrel" as const,
      period: 113,
      phaseOffset: 41.5,
      range: 1.85,
    }),
    Object.freeze({
      anchor: [-2.86, 2.68, -13.5] as ForestWorldVector3,
      id: "dove-branch",
      kind: "dove" as const,
      period: 104,
      phaseOffset: 0,
      range: 3.4,
    }),
    Object.freeze({
      anchor: [2.94, 2.42, -33.2] as ForestWorldVector3,
      id: "dove-canopy",
      kind: "dove" as const,
      period: 127,
      phaseOffset: 58,
      range: 3.1,
    }),
    Object.freeze({
      anchor: [-2.62, 0.03, -28.4] as ForestWorldVector3,
      id: "rabbit-edge",
      kind: "rabbit" as const,
      period: 87,
      phaseOffset: 23.5,
      range: 0.9,
    }),
  ]);

type PhaseWindow = {
  readonly cell: number;
  /** Seconds since the start of the cycle at which this beat ends. */
  readonly end: number;
  readonly phase: ForestWildlifePhase;
  /** Seconds since the start of the cycle at which this beat begins. */
  readonly start: number;
};

/**
 * Each kind gets a fixed script in absolute seconds, so beat length stays the
 * same however long the actor's hidden stretch is.
 */
const SCRIPTS: Readonly<Record<ForestWildlifeKind, readonly PhaseWindow[]>> =
  Object.freeze({
    dove: Object.freeze([
      { cell: 3, end: 9, phase: "perch" as const, start: 0 },
      { cell: 4, end: 11, phase: "takeoff" as const, start: 9 },
      { cell: 5, end: 16, phase: "flight" as const, start: 11 },
    ]),
    rabbit: Object.freeze([
      { cell: 2, end: 19, phase: "perch" as const, start: 5 },
    ]),
    squirrel: Object.freeze([
      { cell: 0, end: 8, phase: "run" as const, start: 4 },
      { cell: 0, end: 12.5, phase: "climb" as const, start: 8 },
      { cell: 1, end: 20, phase: "perch" as const, start: 12.5 },
    ]),
  });

const HIDDEN_CELL_BY_KIND: Readonly<Record<ForestWildlifeKind, number>> =
  Object.freeze({ dove: 3, rabbit: 2, squirrel: 0 });

/** The still pose each kind holds under reduced motion: perched, not running. */
const RESTING_CELL_BY_KIND: Readonly<Record<ForestWildlifeKind, number>> =
  Object.freeze({ dove: 3, rabbit: 2, squirrel: 1 });

/**
 * Height above the anchor at which each kind rests. A squirrel's anchor is the
 * base of its trunk, so it rests up on the bark where its perch beat ends; the
 * others already sit at their own height.
 */
const RESTING_HEIGHT_BY_KIND: Readonly<Record<ForestWildlifeKind, number>> =
  Object.freeze({ dove: 0, rabbit: 0, squirrel: 2.6 });

function hidden(actor: ForestWildlifeActor): ForestWildlifeSample {
  return {
    atlasCell: HIDDEN_CELL_BY_KIND[actor.kind],
    opacity: 0,
    phase: "hidden",
    position: actor.anchor,
    rotationY: 0,
    scale: 0.6,
  };
}

/**
 * The pose an actor holds when the guest has asked for less motion: visible,
 * still, and in the safe part of its script — perched rather than mid-flight or
 * mid-run, so nothing reads as frozen in an impossible position. Grounded actors
 * stay fenced outside the guest corridor exactly as they are while animating.
 */
function restingPose(actor: ForestWildlifeActor): ForestWildlifeSample {
  const side = actor.anchor[0] < 0 ? -1 : 1;
  const airborne = actor.kind === "dove";

  return {
    atlasCell: RESTING_CELL_BY_KIND[actor.kind],
    opacity: 1,
    phase: "perch",
    position: [
      airborne ? actor.anchor[0] : fenceOutOfCorridor(actor.anchor[0], side),
      actor.anchor[1] + RESTING_HEIGHT_BY_KIND[actor.kind],
      actor.anchor[2],
    ],
    rotationY: side < 0 ? Math.PI * 0.24 : -Math.PI * 0.24,
    scale: actor.kind === "rabbit" ? 0.58 : actor.kind === "dove" ? 0.5 : 0.52,
  };
}

function fadeAt(
  secondsIntoWindow: number,
  windowSeconds: number,
): number {
  const fade = Math.min(FADE_SECONDS, windowSeconds * 0.4);
  const distanceToEdge = Math.min(
    secondsIntoWindow,
    windowSeconds - secondsIntoWindow,
  );
  return Math.max(0, Math.min(1, distanceToEdge / fade));
}

/**
 * Pushes a grounded actor out of the guest corridor while keeping its side of
 * the path, so a wide run can never cut across the aisle.
 */
function fenceOutOfCorridor(x: number, side: number): number {
  const limit = FOREST_WILDLIFE_CORRIDOR_HALF_WIDTH;
  if (side < 0) return Math.min(x, -limit);
  return Math.max(x, limit);
}

/**
 * Samples one actor at `timeSeconds`. Pure and stateless, so the renderer can
 * call it per frame and write the result straight into an instanced matrix.
 *
 * Under reduced motion every actor holds a still perched pose rather than
 * disappearing: a quiet forest should still have wildlife in it, just wildlife
 * that does not move. `hidden()` remains for the ordinary between-sightings
 * stretch of a script.
 */
export function sampleForestWildlifeActor(
  actor: ForestWildlifeActor,
  timeSeconds: number,
  cue: ForestWildlifeCue,
  reducedMotion: boolean,
): ForestWildlifeSample {
  if (reducedMotion) return restingPose(actor);

  const cycle = ((timeSeconds + actor.phaseOffset) % actor.period
    + actor.period) % actor.period;
  const window = SCRIPTS[actor.kind].find(
    ({ end, start }) => cycle >= start && cycle < end,
  );
  if (!window) return hidden(actor);

  const windowSeconds = window.end - window.start;
  const secondsIntoWindow = cycle - window.start;
  const local = secondsIntoWindow / windowSeconds;
  const opacity = fadeAt(secondsIntoWindow, windowSeconds);
  const side = actor.anchor[0] < 0 ? -1 : 1;
  const bob = Math.sin(timeSeconds * 4.2) * 0.02;

  if (actor.kind === "squirrel") {
    if (window.phase === "run") {
      // Approaches the trunk from further out along the same side.
      const approach = 1 - local;
      return {
        atlasCell: window.cell,
        opacity,
        phase: "run",
        position: [
          fenceOutOfCorridor(
            actor.anchor[0] + side * approach * actor.range,
            side,
          ),
          actor.anchor[1] + Math.abs(Math.sin(timeSeconds * 9)) * 0.06,
          actor.anchor[2] + approach * 0.7,
        ],
        rotationY: side < 0 ? Math.PI * 0.5 : -Math.PI * 0.5,
        scale: 0.52,
      };
    }

    // The climb starts a little above the ground because the run already
    // carried the squirrel onto the base of the trunk.
    const climbHeight = window.phase === "climb" ? 0.24 + local * 2.36 : 2.6;
    return {
      atlasCell: window.cell,
      opacity,
      phase: window.phase,
      position: [
        fenceOutOfCorridor(actor.anchor[0], side),
        actor.anchor[1] + climbHeight + (window.phase === "perch" ? bob : 0),
        actor.anchor[2],
      ],
      rotationY: side < 0 ? Math.PI * 0.32 : -Math.PI * 0.32,
      scale: 0.52,
    };
  }

  if (actor.kind === "rabbit") {
    return {
      atlasCell: window.cell,
      opacity,
      phase: "perch",
      position: [
        fenceOutOfCorridor(actor.anchor[0], side),
        actor.anchor[1] + Math.abs(bob),
        actor.anchor[2] + Math.sin(timeSeconds * 0.7) * actor.range * 0.2,
      ],
      rotationY: side < 0 ? Math.PI * 0.24 : -Math.PI * 0.24,
      scale: 0.58,
    };
  }

  if (window.phase === "perch") {
    return {
      atlasCell: window.cell,
      opacity,
      phase: "perch",
      position: [actor.anchor[0], actor.anchor[1] + bob, actor.anchor[2]],
      rotationY: side < 0 ? Math.PI * 0.2 : -Math.PI * 0.2,
      scale: 0.5,
    };
  }

  // Takeoff and flight lift the dove and carry it over the corridor. The
  // journey's dove cue adds extra altitude so a scripted release reads bigger
  // than idle ambient traffic.
  const lift = window.phase === "takeoff" ? local * 0.9 : 0.9 + local * 3.2;
  const cueLift = Math.max(0, cue.doveFlight) * 1.4;
  const glide = window.phase === "takeoff" ? local * 0.4 : 0.4 + local * 2.4;

  return {
    atlasCell: window.cell,
    opacity,
    phase: window.phase,
    position: [
      actor.anchor[0] - side * glide * (actor.range / 3.4),
      actor.anchor[1] + lift + cueLift + Math.sin(timeSeconds * 6.4) * 0.08,
      actor.anchor[2] - glide * 0.9 - Math.max(0, cue.windStrength) * 0.3,
    ],
    rotationY: side < 0 ? Math.PI * 0.62 : -Math.PI * 0.62,
    scale: 0.5 + local * 0.06,
  };
}
