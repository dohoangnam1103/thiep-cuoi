import assert from "node:assert/strict";
import test from "node:test";

import { createAutosaveController } from "./autosave-controller";

type Deferred = { promise: Promise<boolean>; resolve: (ok: boolean) => void };

function deferred(): Deferred {
  let resolve!: (ok: boolean) => void;
  const promise = new Promise<boolean>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

/** Fake timer that captures the scheduled callback so tests fire it deterministically. */
function fakeTimer() {
  let pending: (() => void) | null = null;
  return {
    set: (fn: () => void) => {
      pending = fn;
      return { id: 1 };
    },
    clear: () => {
      pending = null;
    },
    fire: () => {
      const fn = pending;
      pending = null;
      fn?.();
    },
    get scheduled() {
      return pending !== null;
    },
  };
}

const equals = (a: string, b: string) => a === b;

test("saves the latest draft once after the debounce timer fires", async () => {
  const timer = fakeTimer();
  const calls: string[] = [];
  const controller = createAutosaveController<string>({
    initial: "seed",
    equals,
    save: async (draft) => {
      calls.push(draft);
      return true;
    },
    setTimer: timer.set,
    clearTimer: timer.clear,
  });

  controller.schedule("a");
  controller.schedule("ab");
  controller.schedule("abc");
  assert.deepEqual(calls, [], "must not save while the debounce window is open");

  timer.fire();
  await Promise.resolve();
  assert.deepEqual(calls, ["abc"], "saves only the newest draft once");
});

test("does not save when the draft matches the last saved baseline", () => {
  const timer = fakeTimer();
  const calls: string[] = [];
  const controller = createAutosaveController<string>({
    initial: "seed",
    equals,
    save: async (draft) => {
      calls.push(draft);
      return true;
    },
    setTimer: timer.set,
    clearTimer: timer.clear,
  });

  controller.schedule("seed");
  assert.equal(timer.scheduled, false, "no timer for an unchanged draft");
  controller.flush();
  assert.deepEqual(calls, []);
});

test("never runs two saves concurrently and drains the newest draft after", async () => {
  const timer = fakeTimer();
  const calls: string[] = [];
  const first = deferred();
  const controller = createAutosaveController<string>({
    initial: "seed",
    equals,
    save: async (draft) => {
      calls.push(draft);
      return draft === "A" ? first.promise : true;
    },
    setTimer: timer.set,
    clearTimer: timer.clear,
  });

  controller.schedule("A");
  timer.fire();
  await Promise.resolve();
  assert.deepEqual(calls, ["A"], "first save is in flight");

  controller.schedule("B");
  timer.fire();
  await Promise.resolve();
  assert.deepEqual(calls, ["A"], "second save is held while the first is in flight");

  first.resolve(true);
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(calls, ["A", "B"], "newest draft is saved once the in-flight save completes");
});

test("flush saves immediately without waiting for the timer", async () => {
  const timer = fakeTimer();
  const calls: string[] = [];
  const controller = createAutosaveController<string>({
    initial: "seed",
    equals,
    save: async (draft) => {
      calls.push(draft);
      return true;
    },
    setTimer: timer.set,
    clearTimer: timer.clear,
  });

  controller.schedule("x");
  controller.flush();
  await Promise.resolve();
  assert.deepEqual(calls, ["x"]);
  assert.equal(timer.scheduled, false, "flush cancels the pending timer");
});

test("a failed save keeps the baseline so the next attempt retries", async () => {
  const timer = fakeTimer();
  const calls: string[] = [];
  const controller = createAutosaveController<string>({
    initial: "seed",
    equals,
    save: async (draft) => {
      calls.push(draft);
      return calls.length > 1; // first attempt fails, later ones succeed
    },
    setTimer: timer.set,
    clearTimer: timer.clear,
  });

  controller.schedule("v1");
  timer.fire();
  await Promise.resolve();
  assert.deepEqual(calls, ["v1"], "first attempt runs and fails");

  controller.schedule("v1");
  timer.fire();
  await Promise.resolve();
  assert.deepEqual(calls, ["v1", "v1"], "same content retries because the baseline did not advance");
});

test("seed advances the baseline so a matching draft is not re-saved", () => {
  const timer = fakeTimer();
  const calls: string[] = [];
  const controller = createAutosaveController<string>({
    initial: "seed",
    equals,
    save: async (draft) => {
      calls.push(draft);
      return true;
    },
    setTimer: timer.set,
    clearTimer: timer.clear,
  });

  // Bản đã lưu qua nút thủ công/publish → đặt baseline để autosave không lặp lại.
  controller.seed("saved-by-publish");
  controller.schedule("saved-by-publish");
  assert.equal(timer.scheduled, false, "no timer when the draft matches the seeded baseline");
  controller.flush();
  assert.deepEqual(calls, []);

  // Draft mới khác baseline vẫn lưu như thường.
  controller.schedule("changed");
  timer.fire();
  assert.deepEqual(calls, ["changed"]);
});

test("does not save after dispose", async () => {
  const timer = fakeTimer();
  const calls: string[] = [];
  const controller = createAutosaveController<string>({
    initial: "seed",
    equals,
    save: async (draft) => {
      calls.push(draft);
      return true;
    },
    setTimer: timer.set,
    clearTimer: timer.clear,
  });

  controller.schedule("y");
  controller.dispose();
  controller.flush();
  timer.fire();
  await Promise.resolve();
  assert.deepEqual(calls, []);
});
