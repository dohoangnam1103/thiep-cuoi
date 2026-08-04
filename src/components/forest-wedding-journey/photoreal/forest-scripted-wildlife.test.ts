import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  FOREST_FINALE_DOVE_PLACEMENTS,
  FOREST_GATE_DOVE_PLACEMENTS,
  FOREST_RABBIT_PLACEMENTS,
} from "../forest-animals";
import {
  FOREST_SCRIPTED_WILDLIFE_ACTORS,
  getForestScriptedWildlifeCells,
  sampleForestScriptedWildlifeActor,
  type ForestScriptedWildlifeActor,
  type ForestScriptedWildlifeCue,
} from "./forest-scripted-wildlife";
import { FOREST_WILDLIFE_ACTORS } from "./forest-wildlife-behavior";

const REST: ForestScriptedWildlifeCue = {
  doveFlight: 0,
  rabbitGuide: 0,
  windStrength: 0.2,
};

const CUED: ForestScriptedWildlifeCue = {
  doveFlight: 1,
  rabbitGuide: 1,
  windStrength: 0.7,
};

const AT_GATE = {
  finaleCueActive: false,
  gateDeparted: false,
  openingHorizontalScale: 1,
  reducedMotion: false,
} as const;

const AT_FINALE = { ...AT_GATE, finaleCueActive: true } as const;

function actorById(id: string): ForestScriptedWildlifeActor {
  const actor = FOREST_SCRIPTED_WILDLIFE_ACTORS.find(
    (entry) => entry.id === id,
  );
  assert.ok(actor, `scripted actor ${id} is missing from the roster`);
  return actor;
}

test("the scripted roster stands on the legacy authored marks", () => {
  // The gate, the voile and the finale props were all framed around these
  // positions, and `forest-cue-state.test.ts` pins them against the threshold
  // camera's projection. Moving an animal onto the atlas must not move it in
  // the world.
  const expected = [
    ...FOREST_RABBIT_PLACEMENTS,
    ...FOREST_GATE_DOVE_PLACEMENTS,
    ...FOREST_FINALE_DOVE_PLACEMENTS,
  ];

  assert.equal(FOREST_SCRIPTED_WILDLIFE_ACTORS.length, expected.length);
  for (const [index, placement] of expected.entries()) {
    const actor = FOREST_SCRIPTED_WILDLIFE_ACTORS[index]!;
    assert.equal(actor.id, placement.id);
    assert.deepEqual([...actor.anchor], [...placement.position]);
    assert.equal(actor.restingRotationY, placement.rotationY);
  }
});

test("scripted and ambient actors are disjoint rosters", () => {
  // The ambient roster's contract is that no two actors share a cycle. The
  // scripted actors have no cycle at all, so they must not be mixed in.
  const ambient = new Set(FOREST_WILDLIFE_ACTORS.map(({ id }) => id));
  for (const { id } of FOREST_SCRIPTED_WILDLIFE_ACTORS) {
    assert.ok(!ambient.has(id), `${id} appears in both rosters`);
  }
});

test("every scripted sample is finite", () => {
  for (const actor of FOREST_SCRIPTED_WILDLIFE_ACTORS) {
    for (const cue of [REST, CUED]) {
      for (const options of [AT_GATE, AT_FINALE, { ...AT_GATE, gateDeparted: true }]) {
        const sample = sampleForestScriptedWildlifeActor(actor, 3.5, cue, options);
        for (const value of [...sample.position, sample.rotationY, sample.scale, sample.opacity]) {
          assert.ok(Number.isFinite(value), `${actor.id} produced ${value}`);
        }
        assert.ok(sample.scale > 0);
      }
    }
  }
});

test("the gate cue lifts the gate doves and leaves the finale doves perched", () => {
  // This is the beat the sphere animals used to carry. If it stops working the
  // gate entry silently loses its doves, and no count-based assertion notices.
  for (const placement of FOREST_GATE_DOVE_PLACEMENTS) {
    const actor = actorById(placement.id);
    const resting = sampleForestScriptedWildlifeActor(actor, 0, REST, AT_GATE);
    const flying = sampleForestScriptedWildlifeActor(actor, 0, CUED, AT_GATE);

    assert.equal(resting.phase, "perch");
    assert.equal(flying.phase, "flight");
    assert.ok(
      flying.position[1] > resting.position[1] + 1,
      `${actor.id} must climb at least a metre off its perch`,
    );
    assert.ok(
      Math.abs(flying.position[0]) > Math.abs(resting.position[0]),
      `${actor.id} must break outward, not inward`,
    );
  }

  for (const placement of FOREST_FINALE_DOVE_PLACEMENTS) {
    const actor = actorById(placement.id);
    const sample = sampleForestScriptedWildlifeActor(actor, 0, CUED, AT_GATE);
    assert.equal(sample.phase, "perch", `${actor.id} must wait for the finale`);
  }
});

test("the finale cue releases the finale doves and holds the gate doves back", () => {
  for (const placement of FOREST_FINALE_DOVE_PLACEMENTS) {
    const actor = actorById(placement.id);
    const resting = sampleForestScriptedWildlifeActor(actor, 0, REST, AT_FINALE);
    const flying = sampleForestScriptedWildlifeActor(actor, 0, CUED, AT_FINALE);

    assert.equal(resting.phase, "perch");
    assert.equal(flying.phase, "flight");
    assert.ok(flying.position[1] > resting.position[1] + 1);
  }

  for (const placement of FOREST_GATE_DOVE_PLACEMENTS) {
    const actor = actorById(placement.id);
    const sample = sampleForestScriptedWildlifeActor(actor, 0, CUED, AT_FINALE);
    assert.equal(
      sample.phase,
      "perch",
      `${actor.id} must not re-fly on the finale cue`,
    );
  }
});

test("a departed gate leaves no dove standing on its post", () => {
  for (const placement of FOREST_GATE_DOVE_PLACEMENTS) {
    const actor = actorById(placement.id);
    const sample = sampleForestScriptedWildlifeActor(actor, 0, REST, {
      ...AT_GATE,
      gateDeparted: true,
    });
    assert.equal(sample.opacity, 0, `${actor.id} must stay gone once released`);
  }
});

test("the rabbit cue moves the guide and only turns the companion", () => {
  const [guidePlacement, companionPlacement] = FOREST_RABBIT_PLACEMENTS;
  const guide = actorById(guidePlacement!.id);
  const companion = actorById(companionPlacement!.id);

  const guideResting = sampleForestScriptedWildlifeActor(guide, 0, REST, AT_GATE);
  const guideCued = sampleForestScriptedWildlifeActor(guide, 0, CUED, AT_GATE);
  assert.ok(
    guideCued.position[2] < guideResting.position[2],
    "the guide rabbit must lead down the path",
  );
  assert.notEqual(guideCued.rotationY, guideResting.rotationY);

  const companionResting = sampleForestScriptedWildlifeActor(companion, 0, REST, AT_GATE);
  const companionCued = sampleForestScriptedWildlifeActor(companion, 0, CUED, AT_GATE);
  assert.deepEqual(
    [companionCued.position[0], companionCued.position[2]],
    [companionResting.position[0], companionResting.position[2]],
    "the companion rabbit only turns to watch",
  );
  assert.notEqual(companionCued.rotationY, companionResting.rotationY);
});

test("reduced motion freezes the scripted actors in their resting pose", () => {
  // Deliberately unlike the ambient roster, which hides entirely: a still gate
  // should keep its doves rather than emptying out.
  for (const actor of FOREST_SCRIPTED_WILDLIFE_ACTORS) {
    const first = sampleForestScriptedWildlifeActor(actor, 0, CUED, {
      ...AT_FINALE,
      reducedMotion: true,
    });
    const later = sampleForestScriptedWildlifeActor(actor, 9.75, CUED, {
      ...AT_FINALE,
      reducedMotion: true,
    });

    assert.equal(first.opacity, 1, `${actor.id} must stay visible`);
    assert.deepEqual([...later.position], [...first.position]);
    assert.equal(later.rotationY, first.rotationY);
    assert.deepEqual([...first.position], [
      actor.anchor[0],
      actor.anchor[1],
      actor.anchor[2],
    ]);
  }
});

test("the mobile scale narrows the gate cluster and spares the finale", () => {
  const scale = 0.58;
  for (const placement of [...FOREST_RABBIT_PLACEMENTS, ...FOREST_GATE_DOVE_PLACEMENTS]) {
    const actor = actorById(placement.id);
    const sample = sampleForestScriptedWildlifeActor(actor, 0, REST, {
      ...AT_GATE,
      openingHorizontalScale: scale,
    });
    assert.ok(
      Math.abs(sample.position[0]) < Math.abs(actor.anchor[0]),
      `${actor.id} must compress toward the centre on a phone`,
    );
  }

  for (const placement of FOREST_FINALE_DOVE_PLACEMENTS) {
    const actor = actorById(placement.id);
    const sample = sampleForestScriptedWildlifeActor(actor, 0, REST, {
      ...AT_FINALE,
      openingHorizontalScale: scale,
    });
    assert.equal(sample.position[0], actor.anchor[0]);
  }
});

test("cell probing reaches every pose a kind can hold", () => {
  const doveCells = getForestScriptedWildlifeCells(
    actorById(FOREST_GATE_DOVE_PLACEMENTS[0]!.id),
  );
  const rabbitCells = getForestScriptedWildlifeCells(
    actorById(FOREST_RABBIT_PLACEMENTS[0]!.id),
  );

  // perch, takeoff and flight — the renderer builds one UV-locked geometry per
  // cell, so a missed pose is a pose that never draws.
  assert.equal(doveCells.length, 3);
  assert.equal(rabbitCells.length, 1);
  for (const cell of [...doveCells, ...rabbitCells]) {
    assert.ok(Number.isInteger(cell) && cell >= 0 && cell < 6, `cell ${cell} is outside the atlas`);
  }
});

test("the photoreal world renders no sphere-built animals", () => {
  // `ForestAnimals` builds its bodies from SphereGeometry. The photoreal
  // acceptance criteria call out "no sphere animals", and mounting both rosters
  // would put faceted spheres beside photographic cards. Checked at the source
  // because the E2E animal counts read placement arrays, not mounted meshes, so
  // they cannot tell the two rigs apart.
  const source = readFileSync(
    join(process.cwd(), "src/components/forest-wedding-journey/forest-wedding-world.tsx"),
    "utf8",
  );
  const hybrid = source
    .split(/^(?=function )/m)
    .find((block) => /^function HybridPhotorealWorld\b/.test(block));

  assert.ok(hybrid, "HybridPhotorealWorld must exist");
  assert.match(
    hybrid,
    /sphereAnimals=\{false\}/,
    "the hybrid world must opt out of the sphere-built animals",
  );
  assert.match(
    hybrid,
    /<ForestPhotorealWildlife\b/,
    "the hybrid world must mount the atlas wildlife that replaces them",
  );
  // The scripted beats only reach the scene through these props.
  for (const prop of ["cueRef", "finaleCueActive", "gateDepartedRef"]) {
    assert.ok(
      new RegExp(`${prop}=\\{${prop}\\}`).test(hybrid),
      `ForestPhotorealWildlife needs ${prop} to drive the gate and finale beats`,
    );
  }
});
