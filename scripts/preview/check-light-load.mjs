import assert from 'node:assert/strict';

// A small, bounded diagnostic, not a capacity benchmark or sustained stress test.
const base = process.argv[2];
if (!base) throw new Error('Usage: node check-light-load.mjs <preview-origin>');
for (const concurrency of [1, 3, 5]) {
  const start = performance.now();
  const timings = await Promise.all(Array.from({ length: concurrency }, async () => {
    const began = performance.now();
    const response = await fetch(new URL('/mau-thiep', base), { signal: AbortSignal.timeout(15_000) });
    assert.equal(response.status, 200);
    const html = await response.text();
    const images = [...new Set([...html.matchAll(/src="([^"<>]*\/listing-thumbnails\/[^"<>]+)"/g)].map(match => match[1]))].slice(0, 4);
    assert.equal(images.length, 4);
    await Promise.all(images.map(async image => {
      const asset = await fetch(new URL(image, base), { signal: AbortSignal.timeout(15_000) });
      assert.equal(asset.status, 200);
      await asset.arrayBuffer();
    }));
    return Math.round(performance.now() - began);
  }));
  console.log(JSON.stringify({ concurrency, requests: concurrency * 5, wallMs: Math.round(performance.now() - start), userMs: timings }));
}
