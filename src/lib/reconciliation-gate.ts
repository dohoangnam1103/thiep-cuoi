/** Per-process rate limit, not a cache of payment status or payment authority. */
export function createReconciliationGate({ cooldownMs = 15_000, maxEntries = 1_000, now = Date.now } = {}) {
  const entries = new Map<string, { until: number; flight?: Promise<string> }>();
  return async function run(key: string, reconcile: () => Promise<string>): Promise<string | undefined> {
    const time = now();
    const previous = entries.get(key);
    if (previous?.flight) return previous.flight;
    if (previous && previous.until > time) return undefined;
    if (entries.size >= maxEntries) {
      for (const [id, entry] of entries) {
        if (!entry.flight && entry.until <= time) entries.delete(id);
      }
      // Database/webhook status remains available even if this safety net is busy.
      if (!entries.has(key) && entries.size >= maxEntries) return undefined;
    }
    const entry: { until: number; flight?: Promise<string> } = { until: time + cooldownMs };
    entries.set(key, entry);
    entry.flight = Promise.resolve().then(reconcile);
    try {
      return await entry.flight;
    } finally {
      entry.flight = undefined;
      entry.until = now() + cooldownMs;
    }
  };
}
