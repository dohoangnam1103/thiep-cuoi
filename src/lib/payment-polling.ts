export function paymentPollDelay(elapsedMs: number, failures: number): number {
  const normal = elapsedMs < 60_000 ? 4_000 : elapsedMs < 180_000 ? 8_000 : 15_000;
  return failures ? Math.min(30_000, normal * 2 ** Math.min(failures, 3)) : normal;
}

type PollingOptions = {
  now: () => number;
  isVisible: () => boolean;
  request: (signal: AbortSignal) => Promise<string>;
  /** Return true for a terminal status. */
  onStatus: (status: string) => boolean;
  setTimer: (callback: () => void, delay: number) => unknown;
  clearTimer: (handle: unknown) => void;
};

/** One request at a time, no hidden-tab traffic, and no stale response after disposal. */
export function createPaymentPoller(options: PollingOptions) {
  const began = options.now();
  let stopped = false;
  let failures = 0;
  let timer: unknown = null;
  let flight: AbortController | null = null;

  function cancelTimer() {
    if (timer !== null) options.clearTimer(timer);
    timer = null;
  }

  function schedule() {
    cancelTimer();
    if (!stopped && options.isVisible()) {
      timer = options.setTimer(() => { void run(); }, paymentPollDelay(options.now() - began, failures));
    }
  }

  async function run() {
    cancelTimer();
    if (stopped || flight || !options.isVisible()) return;
    const controller = new AbortController();
    flight = controller;
    try {
      const status = await options.request(controller.signal);
      if (stopped || controller.signal.aborted) return;
      failures = 0;
      if (options.onStatus(status)) stopped = true;
    } catch {
      if (!controller.signal.aborted) failures += 1;
    } finally {
      flight = null;
      schedule();
    }
  }

  schedule();
  return {
    visibilityChanged() {
      cancelTimer();
      if (!options.isVisible()) {
        flight?.abort();
      } else if (!flight) {
        // Refresh promptly on return, without overlapping an existing request.
        void run();
      }
    },
    dispose() {
      stopped = true;
      cancelTimer();
      flight?.abort();
    },
  };
}
