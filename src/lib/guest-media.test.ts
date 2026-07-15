import assert from "node:assert/strict";
import test from "node:test";

import { extensionForVideo, isSupportedVideo, safeDownloadName } from "@/lib/guest-media";

test("recognizes MP4/QuickTime and WebM signatures", () => {
  const mp4 = Buffer.from("000000186674797069736f6d", "hex");
  const webm = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x01]);

  assert.equal(isSupportedVideo(mp4, "video/mp4"), true);
  assert.equal(isSupportedVideo(mp4, "video/quicktime"), true);
  assert.equal(isSupportedVideo(webm, "video/webm"), true);
  assert.equal(isSupportedVideo(Buffer.from("not-video"), "video/mp4"), false);
});

test("maps supported video MIME types to safe extensions", () => {
  assert.equal(extensionForVideo("video/mp4"), "mp4");
  assert.equal(extensionForVideo("video/quicktime"), "mov");
  assert.equal(extensionForVideo("video/webm"), "webm");
  assert.equal(extensionForVideo("video/x-msvideo"), null);
});

test("removes unsafe content-disposition characters", () => {
  assert.equal(safeDownloadName("our\r\nphoto/01.jpg"), "our__photo_01.jpg");
  assert.equal(safeDownloadName("  "), "wedding-memory");
});
