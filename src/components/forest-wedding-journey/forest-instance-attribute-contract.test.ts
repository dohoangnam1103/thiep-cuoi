import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const JOURNEY_DIR = join(process.cwd(), "src/components/forest-wedding-journey");

/**
 * Every file that renders an `InstancedMesh` whose shader reads a per-instance
 * attribute — `instanceWindPhase` in the photoreal wind material and in the
 * legacy `forest-environment.tsx` shaders, plus `instanceTint`/`instanceAtlasRect`.
 */
const INSTANCE_ATTRIBUTE_SOURCES = [
  "forest-environment.tsx",
  "photoreal/forest-tree-layers.tsx",
  "photoreal/forest-undergrowth.tsx",
] as const;

/** A real write, not a mention in a comment. */
const INSTANCE_ATTRIBUTE_WRITE = /setAttribute\(\s*\n?\s*"instance\w+"/;

/**
 * Splits a module into top-level `function` blocks so each component is checked
 * on its own. Text before the first `function` (imports, constants) is dropped;
 * no component lives there.
 */
function readFunctionBlocks(file: string): readonly string[] {
  const source = readFileSync(join(JOURNEY_DIR, file), "utf8");
  return source
    .split(/^(?=(?:export )?function )/m)
    .filter((block) => /^(?:export )?function /.test(block));
}

test("a mesh that carries per-instance attributes owns its geometry", () => {
  // `InstancedBufferAttribute`s live on the *geometry*, not on the mesh, so
  // sibling InstancedMeshes handed the same geometry share one attribute
  // buffer: the last to mount overwrites every earlier one's data, and where
  // its instance count is lower it leaves the buffer shorter than the draw
  // count, so the shader reads past the end.
  //
  // This is exactly how the conifer trunks broke. One trunk template was built
  // per quality tier and passed to both LODs of every resident chunk, so all
  // but one layer swayed on another layer's wind phases. Receiving a geometry
  // as a prop is fine; writing instance data onto that prop is not.
  let checked = 0;

  for (const file of INSTANCE_ATTRIBUTE_SOURCES) {
    for (const block of readFunctionBlocks(file)) {
      // Only mesh sites: a helper that writes onto a geometry argument is safe
      // as long as its caller owns that geometry, which the mesh site is where
      // we can actually see.
      if (!block.includes("<instancedMesh")) continue;
      if (!INSTANCE_ATTRIBUTE_WRITE.test(block)) continue;

      const name = block.match(/function (\w+)/)?.[1] ?? "<anonymous>";
      const geometryArg = block.match(/args=\{\[\s*(\w+)\s*,/)?.[1];
      assert.ok(
        geometryArg,
        `${file} ${name} renders an instancedMesh without a readable geometry argument`,
      );

      // A plain destructured prop (`geometry,`) means the binding is shared
      // with whatever the parent passed. A renamed one (`geometry: template,`)
      // does not bind this identifier, so a local clone under the same name is
      // what we want to see.
      const bindsGeometryPropDirectly = new RegExp(
        `^\\s*${geometryArg},\\s*$`,
        "m",
      ).test(block);
      assert.ok(
        !bindsGeometryPropDirectly,
        `${file} ${name} writes per-instance attributes onto \`${geometryArg}\`, which it receives as a prop; clone it so sibling meshes do not share one buffer`,
      );
      checked += 1;
    }
  }

  // Guards the guard: were the writes renamed or moved out of these files, the
  // loop above would pass vacuously.
  assert.ok(checked >= 2, `expected at least 2 mesh sites, found ${checked}`);
});

test("the shared conifer trunk template is cloned per layer", () => {
  // The template is memoized once per quality tier in
  // `ForestPhotorealTreeLayers` and handed to every chunk and both LODs, so
  // this is the one place the invariant above is load-bearing rather than
  // incidental. Pinned by name because a regression here is invisible: the
  // scene still renders, the trunks just sway on the wrong phases.
  const source = readFileSync(
    join(JOURNEY_DIR, "photoreal/forest-tree-layers.tsx"),
    "utf8",
  );
  const trunkLayer = source
    .split(/^(?=(?:export )?function )/m)
    .find((block) => /^function TrunkLayer\b/.test(block));

  assert.ok(trunkLayer, "TrunkLayer must exist");
  assert.match(
    trunkLayer,
    /useMemo\(\(\) => \w+\.clone\(\)/,
    "TrunkLayer must memoize its own clone of the trunk template",
  );
  assert.match(
    trunkLayer,
    /geometry\.dispose\(\)/,
    "TrunkLayer must dispose the clone it owns",
  );
});
