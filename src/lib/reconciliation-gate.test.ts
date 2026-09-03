import assert from "node:assert/strict";
import test from "node:test";
import { createReconciliationGate } from "./reconciliation-gate";

test("coalesces provider calls but never caches status during cooldown", async () => {
  let now = 0;
  let calls = 0;
  let finish!: (value: string) => void;
  const gate = createReconciliationGate({ now: () => now });
  const work = () => { calls++; return new Promise<string>((resolve) => { finish = resolve; }); };
  const first = gate("a", work); const second = gate("a", work);
  await Promise.resolve(); assert.equal(calls, 1);
  finish("pending"); assert.deepEqual(await Promise.all([first, second]), ["pending", "pending"]);
  // Undefined tells the caller to use its freshly authorized DB read, including webhook updates.
  assert.equal(await gate("a", work), undefined);
  now = 15_001;
  assert.equal(await gate("a", async () => "paid"), "paid");
});

test("provider failures are rate limited and do not poison the next attempt", async () => {
  let now = 0;
  const gate = createReconciliationGate({ now: () => now });
  await assert.rejects(gate("a", async () => { throw new Error("provider down"); }));
  assert.equal(await gate("a", async () => "paid"), undefined);
  now = 16_000;
  assert.equal(await gate("a", async () => "paid"), "paid");
});

test("bounds process memory without evicting an active cooldown", async () => {
  let now = 0;
  const gate = createReconciliationGate({ maxEntries: 1, now: () => now });
  assert.equal(await gate("a", async () => "pending"), "pending");
  assert.equal(await gate("b", async () => { throw new Error("must not run"); }), undefined);
  now = 16_000;
  assert.equal(await gate("b", async () => "paid"), "paid");
});
