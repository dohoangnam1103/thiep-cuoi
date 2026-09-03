import assert from "node:assert/strict";
import { test } from "node:test";
import { cssImageUrls, waitForImage } from "./invitation-asset-readiness";

class TestImage extends EventTarget {
  complete = false;
  decodes = 0;
  decode: () => Promise<void> = async () => { this.decodes++; };
  asImage() { return this as unknown as HTMLImageElement; }
}

test("artwork URLs exclude inline data and SVG fragment references", () => {
  assert.deepEqual(cssImageUrls('url("/art/a.webp"), url(\'/art/b.svg\'), url(/art/c.png)'), ["/art/a.webp", "/art/b.svg", "/art/c.png"]);
  assert.deepEqual(cssImageUrls('linear-gradient(red, blue), url("data:image/svg+xml;base64,abc"), url(#mask)'), []);
});

test("cover image must finish decoding, not just downloading", async () => {
  const image = new TestImage();
  let decoded!: () => void;
  image.decode = () => new Promise<void>((resolve) => { decoded = resolve; });
  let ready = false;
  const work = waitForImage(image.asImage(), new AbortController().signal).then(() => { ready = true; });
  image.dispatchEvent(new Event("load"));
  await Promise.resolve();
  assert.equal(ready, false);
  decoded();
  await work;
  assert.equal(ready, true);
});

test("cached cover images are decoded too", async () => {
  const image = new TestImage();
  image.complete = true;
  await waitForImage(image.asImage(), new AbortController().signal);
  assert.equal(image.decodes, 1);
});

test("failed images and rejected decodes cannot deadlock detail preparation", async () => {
  const image = new TestImage();
  const error = waitForImage(image.asImage(), new AbortController().signal);
  image.dispatchEvent(new Event("error"));
  await error;
  image.complete = true;
  image.decode = () => Promise.reject(new Error("invalid image"));
  await waitForImage(image.asImage(), new AbortController().signal);
});

test("abort releases a hanging image and removes load listeners", async () => {
  const image = new TestImage();
  const controller = new AbortController();
  const work = waitForImage(image.asImage(), controller.signal);
  controller.abort();
  await work;
  image.dispatchEvent(new Event("load"));
  assert.equal(image.decodes, 0);
});

test("already aborted work never decodes", async () => {
  const image = new TestImage();
  image.complete = true;
  const controller = new AbortController();
  controller.abort();
  await waitForImage(image.asImage(), controller.signal);
  assert.equal(image.decodes, 0);
});
