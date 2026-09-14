import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveMediaPath,
  resolveMediaRoot,
  resolveUploadsRoot,
} from "./media-paths";

test("media roots stay under the site-2 data root", () => {
  assert.equal(resolveMediaRoot("/app/data"), "/app/data/media");
  assert.equal(resolveUploadsRoot("/app/data"), "/app/data/media/uploads");
});

test("user-supplied media paths cannot traverse outside the root", () => {
  const root = "/app/data/media";
  assert.equal(
    resolveMediaPath(root, "uploads/photo.webp"),
    "/app/data/media/uploads/photo.webp",
  );
  assert.throws(() => resolveMediaPath(root, "../prod.db"), /traverse|inside/);
  assert.throws(() => resolveMediaPath(root, ".."), /traverse|inside/);
  assert.throws(() => resolveMediaPath(root, "/etc/passwd"), /relative/);
  assert.throws(
    () => resolveMediaPath(root, "uploads/../../prod.db"),
    /traverse|inside/,
  );
});
