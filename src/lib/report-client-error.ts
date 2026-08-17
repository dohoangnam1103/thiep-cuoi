/**
 * Ships a client render failure to `/api/client-error` so it lands in the
 * server log. Without this the app is blind: a visitor sees Next.js's built-in
 * error screen and we never learn what threw.
 *
 * Every failure mode here is swallowed. This runs while the page is already
 * broken, so a second throw would replace a rendered error screen with a blank
 * document.
 */
export type ClientErrorScope = "global" | "segment";

export function reportClientError(
  error: (Error & { digest?: string }) | undefined,
  scope: ClientErrorScope,
): void {
  if (typeof window === "undefined") return;

  try {
    const payload = {
      scope,
      message: error?.message?.slice(0, 500),
      digest: error?.digest,
      name: error?.name,
      stack: error?.stack?.slice(0, 4000),
      url: window.location.href.slice(0, 500),
      userAgent: window.navigator.userAgent.slice(0, 400),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      // Chrome-only, and the single most useful number for telling a
      // memory-pressure crash apart from a code fault.
      deviceMemory: (window.navigator as Navigator & { deviceMemory?: number }).deviceMemory,
    };

    const body = JSON.stringify(payload);
    // sendBeacon survives the navigation that a "Reload" click triggers; fetch
    // with keepalive is the fallback where it is unavailable or refused.
    const beacon = window.navigator.sendBeacon?.bind(window.navigator);
    if (beacon?.("/api/client-error", new Blob([body], { type: "application/json" }))) return;

    void fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Reporting must never mask the original error.
  }
}
