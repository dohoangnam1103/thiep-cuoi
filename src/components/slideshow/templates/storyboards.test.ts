import assert from "node:assert/strict";
import test from "node:test";

import { demoWeddingSlideshowSource, weddingSlideshowSourceSchema } from "../core/source";
import { createSlideshowStoryboard } from "./storyboards";

test("demo wedding source satisfies the normalized input schema", () => {
  assert.equal(weddingSlideshowSourceSchema.safeParse(demoWeddingSlideshowSource).success, true);
});

test("templates create independent storyboards from the same source", () => {
  const cinematic = createSlideshowStoryboard("cinematic", demoWeddingSlideshowSource);
  const editorial = createSlideshowStoryboard("editorial", demoWeddingSlideshowSource);

  assert.equal(cinematic.length, 4);
  assert.equal(editorial.length, 3);
  assert.notDeepEqual(cinematic, editorial);
  assert.ok(editorial.every((scene) => scene.secondaryImage));
  assert.ok(cinematic.every((scene) => !scene.secondaryImage));
});

test("storyboard photo selection remains safe with a single source photo", () => {
  const singlePhotoSource = {
    ...demoWeddingSlideshowSource,
    photos: [demoWeddingSlideshowSource.photos[0]],
  };

  const cinematic = createSlideshowStoryboard("cinematic", singlePhotoSource);
  const editorial = createSlideshowStoryboard("editorial", singlePhotoSource);
  assert.ok([...cinematic, ...editorial].every((scene) => scene.image.length > 0));
});
