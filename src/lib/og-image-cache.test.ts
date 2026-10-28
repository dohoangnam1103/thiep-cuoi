import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createOgImageCache } from "@/lib/og-image-cache";

async function withCache(run: (directory: string) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), "invitation-og-"));
  try {
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("a prepared thumbnail is read from disk after recreating the cache", async () => {
  await withCache(async directory => {
    const version = "0123456789abcdef";
    const png = Buffer.from("prepared PNG");
    await createOgImageCache(directory).getOrCreate(version, async () => png);
    const restored = await createOgImageCache(directory).getOrCreate(version, async () => {
      assert.fail("A ready thumbnail must not render again");
    });
    assert.deepEqual(restored, png);
    assert.deepEqual(await readdir(directory), [`${version}.png`]);
  });
});

test("concurrent preparation and first share render the same version only once", async () => {
  await withCache(async directory => {
    const cache = createOgImageCache(directory);
    let renders = 0;
    const render = async () => {
      renders++;
      return Buffer.from("PNG");
    };
    const results = await Promise.all(Array.from({ length: 8 }, () =>
      cache.getOrCreate("0123456789abcdef", render)));
    assert.equal(renders, 1);
    assert.ok(results.every(png => png.equals(results[0])));
  });
});

test("a slow old thumbnail cannot overwrite a newer name/date version", async () => {
  await withCache(async directory => {
    const cache = createOgImageCache(directory);
    let finishOld!: (png: Buffer) => void;
    const oldRender = new Promise<Buffer>(resolve => { finishOld = resolve; });
    const old = cache.getOrCreate("aaaaaaaaaaaaaaaa", () => oldRender);
    const current = Buffer.from("new names and date");
    await cache.getOrCreate("bbbbbbbbbbbbbbbb", async () => current);
    finishOld(Buffer.from("old names and date"));
    await old;
    assert.deepEqual(await cache.getOrCreate("bbbbbbbbbbbbbbbb", async () => {
      assert.fail("The newer image should still be prepared");
    }), current);
  });
});

test("failed renders are never cached and can retry", async () => {
  await withCache(async directory => {
    const cache = createOgImageCache(directory);
    await assert.rejects(cache.getOrCreate("0123456789abcdef", async () => {
      throw new Error("Render failed");
    }), /Render failed/);
    assert.deepEqual(await readdir(directory), []);
    const retried = await cache.getOrCreate("0123456789abcdef", async () => Buffer.from("retry"));
    assert.equal(retried.toString(), "retry");
  });
});

test("cache keys cannot escape the cache directory", async () => {
  await withCache(async directory => {
    await assert.rejects(createOgImageCache(directory).getOrCreate("../../private", async () => {
      assert.fail("Invalid versions must never reach the renderer");
    }), /Invalid invitation thumbnail version/);
  });
});
