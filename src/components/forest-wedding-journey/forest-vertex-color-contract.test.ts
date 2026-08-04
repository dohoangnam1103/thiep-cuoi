import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const JOURNEY_DIR = join(process.cwd(), "src/components/forest-wedding-journey");

/**
 * Files whose meshes tint through `InstancedMesh.setColorAt`, i.e. through
 * `instanceColor` rather than a per-vertex attribute.
 */
const INSTANCE_TINTED_SOURCES = [
  "forest-gate.tsx",
  "forest-petals.tsx",
  "forest-environment.tsx",
  "forest-animals.tsx",
  "forest-static-scenes.tsx",
  "forest-gallery-scene.tsx",
] as const;

/**
 * Files that build their own geometry with a real `color` attribute, so
 * `vertexColors: true` is legitimate there.
 */
const VERTEX_COLOURED_SOURCES = [
  "forest-environment.tsx",
  "photoreal/forest-terrain.tsx",
] as const;

function readJourneySource(file: string): string {
  return readFileSync(join(JOURNEY_DIR, file), "utf8");
}

/**
 * Matches only a real material property, so the explanatory comments that name
 * the flag do not read as uses of it.
 */
const VERTEX_COLORS_PROPERTY = /^\s*vertexColors:\s*true,?\s*$/m;

test("only geometry that declares a color attribute enables vertexColors", () => {
  // three.js defines `USE_COLOR` for any InstancedMesh carrying an
  // `instanceColor`, and `vertexColors: true` additionally emits
  // `vColor.rgb *= color` against the geometry's `color` attribute. A primitive
  // such as SphereGeometry or CircleGeometry declares no such attribute, so
  // WebGL supplies the default (0,0,0) and multiplies the instance to pure
  // black — which is exactly how the gate foliage, the authored petals and the
  // fallback trunks punched black holes through the canopy.
  for (const file of INSTANCE_TINTED_SOURCES) {
    const source = readJourneySource(file);
    if (!VERTEX_COLORS_PROPERTY.test(source)) continue;

    assert.ok(
      VERTEX_COLOURED_SOURCES.includes(
        file as (typeof VERTEX_COLOURED_SOURCES)[number],
      ),
      `${file} tints through instanceColor and must not set vertexColors`,
    );
    assert.match(
      source,
      /setAttribute\("color"/,
      `${file} sets vertexColors but never declares a geometry color attribute`,
    );
  }
});

test("every file that enables vertexColors builds the attribute it reads", () => {
  for (const file of VERTEX_COLOURED_SOURCES) {
    const source = readJourneySource(file);
    assert.match(source, VERTEX_COLORS_PROPERTY);
    assert.match(
      source,
      /setAttribute\("color", new Float32BufferAttribute/,
      `${file} must bake its own per-vertex colours`,
    );
  }
});
