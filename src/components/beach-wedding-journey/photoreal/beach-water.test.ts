import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const WATER_SOURCE = path.join(
  process.cwd(),
  "src/components/beach-wedding-journey/photoreal/beach-water.tsx",
);

test("water uses the WebGL Water class, never the WebGPU WaterMesh", () => {
  const source = readFileSync(WATER_SOURCE, "utf8");

  assert.ok(
    source.includes("three/examples/jsm/objects/Water.js"),
    "must import the WebGL Water class",
  );
  assert.ok(
    !source.includes("WaterMesh"),
    "WaterMesh requires WebGPURenderer and would fail at import in this WebGL app",
  );
  assert.ok(
    !source.includes("three/webgpu") && !source.includes("three/tsl"),
    "WebGPU-only entry points must not be imported",
  );
});

// Asserted against source text rather than by importing the module: importing
// beach-water.tsx pulls in three and React Three Fiber, which need a WebGL
// context that node:test has no way to provide.
test("the reflection target starts below the class default", () => {
  const source = readFileSync(WATER_SOURCE, "utf8");
  const declaration = /BEACH_WATER_REFLECTION_SIZE = (\d+)/.exec(source);

  assert.ok(declaration, "BEACH_WATER_REFLECTION_SIZE must be a literal constant");
  const size = Number(declaration[1]);
  assert.ok(
    size <= 256,
    `planar reflection re-renders the whole scene; ${size} is too generous to start`,
  );
});

// The reflection pass is a second full render of the scene. If the mirror
// camera's render target is never disposed it leaks a colour texture and a
// depth buffer for the lifetime of the tab, and the target is closure-private
// on the Water instance, so the only handle is through the uniform.
test("the mirror render target is disposed on unmount", () => {
  const source = readFileSync(WATER_SOURCE, "utf8");

  assert.match(
    source,
    /mirrorSampler\.value\.renderTarget\?\.dispose\(\)/,
    "the private reflection target must be released through the mirrorSampler uniform",
  );
});

// three's Water builds with `fog: false` unless told otherwise. A beach scene
// with fog would show the water plane cutting a hard seam across a hazed
// horizon, so the option has to be passed explicitly rather than defaulted.
test("water opts into scene fog explicitly", () => {
  const source = readFileSync(WATER_SOURCE, "utf8");

  assert.match(
    source,
    /fog:\s*true/,
    "Water defaults options.fog to false; the horizon seams without it",
  );
});
