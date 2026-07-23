export type AutosaveOptions<T> = {
  /** Baseline the controller starts from — usually the draft already saved on the server. */
  initial: T;
  /** True when two drafts are equal; equal drafts never trigger a save. */
  equals: (a: T, b: T) => boolean;
  /** Persists the draft. Resolve true on success, false to keep the baseline for a retry. */
  save: (draft: T) => Promise<boolean>;
  /** Schedules the debounced flush; returns a handle passed back to clearTimer. */
  setTimer: (fn: () => void) => unknown;
  /** Cancels a handle returned by setTimer. */
  clearTimer: (handle: unknown) => void;
};

export type AutosaveController<T> = {
  /** Record a new draft; debounces a save unless it matches the saved baseline. */
  schedule: (draft: T) => void;
  /** Save the pending draft right away, cancelling the debounce timer. */
  flush: () => void;
  /** Move the baseline forward without saving — use after a manual save/publish persisted this draft. */
  seed: (draft: T) => void;
  /** Stop all future saves and cancel any pending timer. */
  dispose: () => void;
};

export function createAutosaveController<T>(opts: AutosaveOptions<T>): AutosaveController<T> {
  const { initial, equals, save, setTimer, clearTimer } = opts;

  let baseline = initial;
  let pending: { draft: T } | null = null;
  let timer: unknown = null;
  let inFlight = false;
  let disposed = false;

  const cancelTimer = () => {
    if (timer !== null) {
      clearTimer(timer);
      timer = null;
    }
  };

  const run = async () => {
    cancelTimer();
    if (disposed || inFlight || !pending) return;
    if (equals(pending.draft, baseline)) {
      pending = null;
      return;
    }

    const draft = pending.draft;
    pending = null;
    inFlight = true;
    let ok = false;
    try {
      ok = await save(draft);
    } catch {
      // Lỗi mạng: giữ baseline cũ, draft sẽ được thử lại ở nhịp sau.
      ok = false;
    }
    inFlight = false;
    // Chỉ dời baseline khi lưu thành công; thất bại giữ nguyên để lần sau thử lại.
    if (ok) baseline = draft;
    // Có draft mới hơn dồn lại trong lúc đang lưu → chạy tiếp.
    if (!disposed && pending) void run();
  };

  return {
    schedule(draft) {
      if (disposed) return;
      if (equals(draft, baseline)) {
        pending = null;
        cancelTimer();
        return;
      }
      pending = { draft };
      cancelTimer();
      timer = setTimer(run);
    },
    flush() {
      if (disposed) return;
      run();
    },
    seed(draft) {
      baseline = draft;
      pending = null;
      cancelTimer();
    },
    dispose() {
      disposed = true;
      pending = null;
      cancelTimer();
    },
  };
}
