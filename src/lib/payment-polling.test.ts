import assert from "node:assert/strict";
import test from "node:test";
import { createPaymentPoller, paymentPollDelay } from "./payment-polling";

const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

function harness(request: (signal: AbortSignal) => Promise<string>) {
  let visible = true;
  let now = 0;
  let timer: (() => void) | null = null;
  let delay = 0;
  const statuses: string[] = [];
  const poller = createPaymentPoller({
    now: () => now, isVisible: () => visible, request,
    onStatus: (status) => { statuses.push(status); return status === "paid"; },
    setTimer: (callback, ms) => { timer = callback; delay = ms; return callback; },
    clearTimer: () => { timer = null; },
  });
  return {
    poller, statuses,
    fire() { const callback = timer; timer = null; callback?.(); },
    hide() { visible = false; poller.visibilityChanged(); },
    show() { visible = true; poller.visibilityChanged(); },
    time(ms: number) { now = ms; },
    get scheduled() { return timer !== null; },
    get delay() { return delay; },
  };
}

test("poll intervals back off by elapsed time and errors, capped at thirty seconds", () => {
  assert.equal(paymentPollDelay(0, 0), 4000);
  assert.equal(paymentPollDelay(60_000, 0), 8000);
  assert.equal(paymentPollDelay(180_000, 0), 15000);
  assert.equal(paymentPollDelay(180_000, 1), 30000);
  assert.equal(paymentPollDelay(0, 20), 30000);
});

test("slow requests never overlap and terminal payment status stops future traffic", async () => {
  let calls = 0;
  let finish!: (value: string) => void;
  const h = harness(() => { calls++; return new Promise((resolve) => { finish = resolve; }); });
  h.fire(); h.show(); h.show();
  assert.equal(calls, 1);
  assert.equal(h.scheduled, false);
  finish("paid"); await tick();
  assert.deepEqual(h.statuses, ["paid"]);
  assert.equal(h.scheduled, false);
  h.show(); assert.equal(calls, 1);
});

test("hidden tab aborts its request and refreshes on return without stale callbacks", async () => {
  let finish!: (value: string) => void;
  let signal!: AbortSignal;
  let calls = 0;
  const h = harness((nextSignal) => {
    signal = nextSignal; calls++;
    return new Promise((resolve) => { finish = resolve; });
  });
  h.fire(); h.hide();
  assert.equal(signal.aborted, true);
  finish("paid"); await tick();
  assert.deepEqual(h.statuses, []);
  assert.equal(h.scheduled, false);
  h.show(); assert.equal(calls, 2);
  h.poller.dispose(); finish("pending"); await tick();
  assert.equal(h.scheduled, false);
});

test("errors slow down polling and a successful response restores normal cadence", async () => {
  let fails = true;
  const h = harness(async () => { if (fails) throw new Error("offline"); return "pending"; });
  h.fire(); await tick(); assert.equal(h.delay, 8000);
  h.fire(); await tick(); assert.equal(h.delay, 16000);
  fails = false; h.fire(); await tick(); assert.equal(h.delay, 4000);
  h.time(200_000); h.fire(); await tick(); assert.equal(h.delay, 15000);
  h.poller.dispose();
});
