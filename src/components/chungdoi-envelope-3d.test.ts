import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./chungdoi-envelope-3d.tsx", import.meta.url),
  "utf8",
);

test("rear envelope texture uses the rounded card silhouette", () => {
  const backMeshStart = source.indexOf("      {back && (");
  const frontMeshStart = source.indexOf("      {/* Mặt trước:");

  assert.notEqual(backMeshStart, -1, "back texture mesh must exist");
  assert.notEqual(frontMeshStart, -1, "front texture mesh must exist");

  const backMesh = source.slice(backMeshStart, frontMeshStart);
  assert.match(backMesh, /<mesh\s+geometry=\{faceGeometry\}/);
  assert.doesNotMatch(backMesh, /<planeGeometry\b/);
});
