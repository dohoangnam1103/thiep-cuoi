import assert from "node:assert/strict";
import test from "node:test";
import { Texture } from "three";

import { ForestPhotoTextureCache } from "./forest-photo-texture-cache";

function createTrackedTexture(
  name: string,
  dimensions?: { readonly height: number; readonly width: number },
) {
  const texture = new Texture();
  let disposeCount = 0;
  texture.name = name;
  if (dimensions) texture.image = { ...dimensions };
  texture.dispose = () => {
    disposeCount += 1;
  };
  return {
    disposeCount: () => disposeCount,
    texture,
  };
}

test("photo diagnostics count retained live and leased decoded textures exactly once", () => {
  const cache = new ForestPhotoTextureCache(3);
  const dimensions = { height: 2_048, width: 1_363 } as const;
  const first = createTrackedTexture("first", dimensions);
  const second = createTrackedTexture("second", dimensions);
  const third = createTrackedTexture("third", dimensions);
  const overflow = createTrackedTexture("overflow", dimensions);

  cache.storeAndAcquire("/first.webp", first.texture).release();
  cache.storeAndAcquire("/second.webp", second.texture).release();
  cache.storeAndAcquire("/third.webp", third.texture).release();

  assert.deepEqual(cache.getDiagnostics(), {
    activeLeases: 0,
    decodedRgbaMipBytes: 44_649_828,
    liveCount: 3,
    retainedCount: 3,
    textures: [
      {
        decodedRgbaMipBytes: 14_883_276,
        height: 2_048,
        leases: 0,
        retained: true,
        src: "/first.webp",
        width: 1_363,
      },
      {
        decodedRgbaMipBytes: 14_883_276,
        height: 2_048,
        leases: 0,
        retained: true,
        src: "/second.webp",
        width: 1_363,
      },
      {
        decodedRgbaMipBytes: 14_883_276,
        height: 2_048,
        leases: 0,
        retained: true,
        src: "/third.webp",
        width: 1_363,
      },
    ],
    unmeasuredCount: 0,
  });

  const firstLease = cache.acquire("/first.webp");
  const secondLease = cache.acquire("/second.webp");
  const thirdLease = cache.acquire("/third.webp");
  assert.ok(firstLease && secondLease && thirdLease);
  const overflowLease = cache.storeAndAcquire("/overflow.webp", overflow.texture);
  assert.equal(overflowLease.cached, false);
  assert.equal(cache.getDiagnostics().retainedCount, 3);
  assert.equal(cache.getDiagnostics().liveCount, 4);
  assert.equal(cache.getDiagnostics().activeLeases, 4);
  assert.equal(cache.getDiagnostics().decodedRgbaMipBytes, 59_533_104);

  overflowLease.release();
  overflowLease.release();
  assert.equal(cache.getDiagnostics().liveCount, 3);
  assert.equal(cache.getDiagnostics().activeLeases, 3);
  assert.equal(cache.getDiagnostics().decodedRgbaMipBytes, 44_649_828);

  firstLease.release();
  secondLease.release();
  thirdLease.release();
  cache.dispose();
  cache.dispose();
  assert.deepEqual(cache.getDiagnostics(), {
    activeLeases: 0,
    decodedRgbaMipBytes: 0,
    liveCount: 0,
    retainedCount: 0,
    textures: [],
    unmeasuredCount: 0,
  });
});

test("photo diagnostics report live textures whose dimensions are unavailable", () => {
  const cache = new ForestPhotoTextureCache();
  const unmeasured = createTrackedTexture("unmeasured");
  const lease = cache.storeAndAcquire("/unmeasured.webp", unmeasured.texture);

  assert.deepEqual(cache.getDiagnostics().textures, [{
    decodedRgbaMipBytes: null,
    height: null,
    leases: 1,
    retained: true,
    src: "/unmeasured.webp",
    width: null,
  }]);
  assert.equal(cache.getDiagnostics().decodedRgbaMipBytes, 0);
  assert.equal(cache.getDiagnostics().unmeasuredCount, 1);

  cache.dispose();
  assert.equal(cache.getDiagnostics().retainedCount, 0);
  assert.equal(cache.getDiagnostics().liveCount, 1);
  lease.release();
  lease.release();
  assert.equal(cache.getDiagnostics().liveCount, 0);
  assert.equal(unmeasured.disposeCount(), 1);
});

test("photo texture cache evicts the unused LRU and never disposes an acquired texture", () => {
  const cache = new ForestPhotoTextureCache(3);
  const first = createTrackedTexture("first");
  const second = createTrackedTexture("second");
  const third = createTrackedTexture("third");
  const fourth = createTrackedTexture("fourth");
  const overflow = createTrackedTexture("overflow");

  cache.storeAndAcquire("/first.webp", first.texture).release();
  cache.storeAndAcquire("/second.webp", second.texture).release();
  cache.storeAndAcquire("/third.webp", third.texture).release();

  const firstLease = cache.acquire("/first.webp");
  assert.ok(firstLease);
  const secondTouch = cache.acquire("/second.webp");
  assert.ok(secondTouch);
  secondTouch.release();

  const fourthLease = cache.storeAndAcquire("/fourth.webp", fourth.texture);
  assert.equal(cache.size, 3);
  assert.equal(cache.peek("/third.webp"), null);
  assert.equal(third.disposeCount(), 1);
  assert.equal(first.disposeCount(), 0);
  assert.equal(second.disposeCount(), 0);

  const secondLease = cache.acquire("/second.webp");
  assert.ok(secondLease);
  const overflowLease = cache.storeAndAcquire("/overflow.webp", overflow.texture);
  assert.equal(overflowLease.cached, false);
  assert.equal(overflowLease.texture, overflow.texture);
  assert.equal(cache.size, 3);
  assert.equal(cache.peek("/overflow.webp"), null);
  assert.equal(first.disposeCount(), 0);
  assert.equal(second.disposeCount(), 0);
  assert.equal(fourth.disposeCount(), 0);
  assert.equal(overflow.disposeCount(), 0);

  overflowLease.release();
  overflowLease.release();
  assert.equal(overflow.disposeCount(), 1);

  firstLease.release();
  secondLease.release();
  fourthLease.release();
  cache.dispose();
  assert.equal(first.disposeCount(), 1);
  assert.equal(second.disposeCount(), 1);
  assert.equal(third.disposeCount(), 1);
  assert.equal(fourth.disposeCount(), 1);
  assert.equal(overflow.disposeCount(), 1);
});
