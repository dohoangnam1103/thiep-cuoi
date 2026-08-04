import assert from "node:assert/strict";
import test from "node:test";

import {
  FOREST_WILDLIFE_ACTORS,
  FOREST_WILDLIFE_CORRIDOR_HALF_WIDTH,
  sampleForestWildlifeActor,
  type ForestWildlifeActor,
  type ForestWildlifePhase,
} from "./forest-wildlife-behavior";

const CALM = {
  doveFlight: 0,
  petalGust: 0,
  rabbitGuide: 0,
  voileLift: 0,
  windStrength: 0.2,
} as const;

const CUED = {
  doveFlight: 1,
  petalGust: 0.6,
  rabbitGuide: 1,
  voileLift: 0.5,
  windStrength: 0.7,
} as const;

function actorById(id: string): ForestWildlifeActor {
  const actor = FOREST_WILDLIFE_ACTORS.find((entry) => entry.id === id);
  assert.ok(actor, `actor ${id} is missing from the roster`);
  return actor;
}

function phaseSequence(
  actor: ForestWildlifeActor,
  step: number,
  steps: number,
): readonly ForestWildlifePhase[] {
  const phases: ForestWildlifePhase[] = [];
  for (let index = 0; index < steps; index += 1) {
    const phase = sampleForestWildlifeActor(
      actor,
      index * step,
      CUED,
      false,
    ).phase;
    if (phases.at(-1) !== phase) phases.push(phase);
  }
  return phases;
}

test("the roster covers the squirrel, dove, and rabbit species", () => {
  const kinds = new Set(FOREST_WILDLIFE_ACTORS.map(({ kind }) => kind));
  assert.ok(kinds.has("squirrel"));
  assert.ok(kinds.has("dove"));
  assert.ok(kinds.has("rabbit"));
  assert.equal(
    new Set(FOREST_WILDLIFE_ACTORS.map(({ id }) => id)).size,
    FOREST_WILDLIFE_ACTORS.length,
    "actor ids must be unique",
  );
});

test("every actor sample is finite and deterministic", () => {
  for (const actor of FOREST_WILDLIFE_ACTORS) {
    for (const time of [0, 1.7, 6.25, 19.5, 78]) {
      const first = sampleForestWildlifeActor(actor, time, CUED, false);
      const second = sampleForestWildlifeActor(actor, time, CUED, false);
      assert.deepEqual(first, second, `${actor.id} at t=${time} drifted`);

      for (const value of [
        ...first.position,
        first.atlasCell,
        first.opacity,
        first.rotationY,
        first.scale,
      ]) {
        assert.ok(
          Number.isFinite(value),
          `${actor.id} at t=${time} produced ${value}`,
        );
      }
      assert.ok(Number.isInteger(first.atlasCell) && first.atlasCell >= 0);
      assert.ok(first.opacity >= 0 && first.opacity <= 1);
      assert.ok(first.scale > 0 && first.scale <= 1.6);
    }
  }
});

test("squirrels cycle hidden, run, climb, perch, then hide again", () => {
  const squirrel = actorById("squirrel-oak");
  const phases = phaseSequence(squirrel, 0.1, 900);
  assert.deepEqual(
    phases,
    ["hidden", "run", "climb", "perch", "hidden"],
    `squirrel phases were ${phases.join(" -> ")}`,
  );
});

test("doves go from perch to takeoff to flight", () => {
  const dove = actorById("dove-branch");
  const phases = phaseSequence(dove, 0.1, 900);
  assert.deepEqual(
    phases,
    ["perch", "takeoff", "flight", "hidden"],
    `dove phases were ${phases.join(" -> ")}`,
  );
});

test("climbing squirrels stay anchored to their tree", () => {
  const squirrel = actorById("squirrel-oak");
  let climbed = false;

  for (let step = 0; step < 900; step += 1) {
    const sample = sampleForestWildlifeActor(squirrel, step * 0.1, CUED, false);
    if (sample.phase !== "climb" && sample.phase !== "perch") continue;
    climbed = true;
    assert.ok(
      Math.abs(sample.position[0] - squirrel.anchor[0]) < 0.35
        && Math.abs(sample.position[2] - squirrel.anchor[2]) < 0.35,
      `squirrel left its trunk at ${sample.position.join(", ")}`,
    );
    assert.ok(sample.position[1] > squirrel.anchor[1]);
  }

  assert.ok(climbed, "the squirrel never climbed");
});

test("no actor ever walks through the guest path corridor", () => {
  for (const actor of FOREST_WILDLIFE_ACTORS) {
    for (let step = 0; step < 900; step += 1) {
      const sample = sampleForestWildlifeActor(actor, step * 0.1, CUED, false);
      if (sample.opacity === 0) continue;
      // Airborne actors may cross overhead; only grounded ones are fenced out.
      if (sample.position[1] > 1.9) continue;
      assert.ok(
        Math.abs(sample.position[0]) >= FOREST_WILDLIFE_CORRIDOR_HALF_WIDTH,
        `${actor.id} entered the corridor at x=${sample.position[0]}`,
      );
    }
  }
});

test("rabbits sit at the clearing edge, never in the middle", () => {
  const rabbit = actorById("rabbit-edge");
  assert.ok(
    Math.abs(rabbit.anchor[0]) >= FOREST_WILDLIFE_CORRIDOR_HALF_WIDTH,
    `rabbit anchor x=${rabbit.anchor[0]} is inside the corridor`,
  );
});

test("cues advance dove flight further than a calm scene does", () => {
  const dove = actorById("dove-branch");
  let calmPeak = 0;
  let cuedPeak = 0;

  for (let step = 0; step < 900; step += 1) {
    const time = step * 0.1;
    calmPeak = Math.max(
      calmPeak,
      sampleForestWildlifeActor(dove, time, CALM, false).position[1],
    );
    cuedPeak = Math.max(
      cuedPeak,
      sampleForestWildlifeActor(dove, time, CUED, false).position[1],
    );
  }

  assert.ok(cuedPeak > calmPeak, `${cuedPeak} <= ${calmPeak}`);
});

test("reduced motion freezes every actor in a visible resting pose", () => {
  // A previous version hid every actor instead, which reads as "the forest has
  // no animals" rather than "the animals are holding still" — and made this
  // test pass trivially, since two hidden samples are always equal.
  for (const actor of FOREST_WILDLIFE_ACTORS) {
    const atZero = sampleForestWildlifeActor(actor, 0, CUED, true);
    const later = sampleForestWildlifeActor(actor, 42.5, CUED, true);
    assert.deepEqual(atZero, later, `${actor.id} moved under reduced motion`);
    assert.equal(atZero.opacity, 1, `${actor.id} vanished under reduced motion`);
    assert.equal(
      atZero.phase,
      "perch",
      `${actor.id} must hold a safe pose, not freeze mid-flight`,
    );
    assert.ok(
      atZero.scale > 0,
      `${actor.id} must keep a drawable size`,
    );

    // A still actor must obey the corridor fence exactly as a moving one does.
    if (actor.kind !== "dove") {
      assert.ok(
        Math.abs(atZero.position[0]) >= FOREST_WILDLIFE_CORRIDOR_HALF_WIDTH,
        `${actor.id} froze inside the guest corridor`,
      );
    }
  }
});

test("a reduced-motion resting pose is a pose the live script also reaches", () => {
  // The renderer builds one UV-locked geometry per cell an actor's script can
  // reach, probed with motion enabled. A resting cell outside that set would
  // simply never draw.
  for (const actor of FOREST_WILDLIFE_ACTORS) {
    const resting = sampleForestWildlifeActor(actor, 0, CUED, true);
    const reachable = new Set<number>();
    for (let step = 0; step < Math.ceil(actor.period * 10); step += 1) {
      const sample = sampleForestWildlifeActor(actor, step * 0.1, CALM, false);
      if (sample.opacity > 0) reachable.add(sample.atlasCell);
    }
    assert.ok(
      reachable.has(resting.atlasCell),
      `${actor.id} rests on cell ${resting.atlasCell}, which its script never reaches`,
    );
  }
});
