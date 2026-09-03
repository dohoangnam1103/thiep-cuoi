import assert from "node:assert/strict";

const [base, path = "/mau-thiep", concurrencyText = "1", durationText = "8", hostHeader = ""] = process.argv.slice(2);
if (!base) throw new Error("Usage: node load-test-readonly.mjs <origin> <path> <concurrency> <seconds> [host]");
const concurrency = Number(concurrencyText);
const durationMs = Number(durationText) * 1000;
assert.ok(Number.isInteger(concurrency) && concurrency > 0 && concurrency <= 500);
assert.ok(Number.isFinite(durationMs) && durationMs >= 1000 && durationMs <= 60_000);
const target = new URL(path, base);
const endAt = performance.now() + durationMs;
const latencies = [];
const statuses = {};
let bytes = 0;
let errors = 0;
let timedOut = 0;

async function worker() {
  while (performance.now() < endAt) {
    const began = performance.now();
    try {
      const response = await fetch(target, {
        headers: hostHeader ? { host: hostHeader } : undefined,
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
      });
      const body = await response.arrayBuffer();
      latencies.push(performance.now() - began);
      statuses[response.status] = (statuses[response.status] || 0) + 1;
      bytes += body.byteLength;
      if (response.status < 200 || response.status >= 400) errors += 1;
    } catch (error) {
      const elapsed = performance.now() - began;
      latencies.push(elapsed);
      errors += 1;
      if (error?.name === "TimeoutError") timedOut += 1;
    }
  }
}

const began = performance.now();
await Promise.all(Array.from({ length: concurrency }, worker));
const wallMs = performance.now() - began;
latencies.sort((a, b) => a - b);
const percentile = value => latencies[Math.min(latencies.length - 1, Math.ceil(value * latencies.length) - 1)] ?? 0;
console.log(JSON.stringify({
  target: target.href,
  concurrency,
  durationTargetMs: durationMs,
  wallMs: Math.round(wallMs),
  requests: latencies.length,
  requestsPerSecond: Number((latencies.length / (wallMs / 1000)).toFixed(2)),
  statuses,
  errors,
  errorRate: Number((errors / Math.max(1, latencies.length)).toFixed(4)),
  timedOut,
  latencyMs: {
    min: Math.round(latencies[0] ?? 0),
    p50: Math.round(percentile(0.5)),
    p95: Math.round(percentile(0.95)),
    p99: Math.round(percentile(0.99)),
    max: Math.round(latencies.at(-1) ?? 0),
  },
  responseMiB: Number((bytes / 1024 / 1024).toFixed(2)),
}));
