/**
 * WebGL2 capability probe.
 *
 * Libraries differ in how they react to a missing GPU context. OGL's `Renderer`
 * only `console.error`s and then dereferences the null context anyway, which
 * throws a `TypeError` and — with no guard — takes the whole page down through
 * the nearest error boundary. Probing before constructing anything is what
 * keeps a decorative WebGL layer decorative.
 */

/** The only part of a canvas this probe needs, so it stays testable in Node. */
export type WebGlProbeTarget = {
  getContext(contextId: string, options?: unknown): unknown;
};

/**
 * True only when a real WebGL2 context can be created.
 *
 * Deliberately does not accept a WebGL1 context as a substitute: callers here
 * ship GLSL ES 3.00 shaders (`#version 300 es`), which WebGL1 cannot compile,
 * so a WebGL1 fallback renders nothing while looking supported.
 */
export function supportsWebGl2(target: WebGlProbeTarget): boolean {
  try {
    const context = target.getContext("webgl2");
    if (!context) return false;

    // A browser allows only a handful of live contexts per document, so hand
    // the probe's context back immediately instead of waiting for GC to run.
    const disposable = context as {
      getExtension?: (name: string) => { loseContext?: () => void } | null;
    };
    disposable.getExtension?.("WEBGL_lose_context")?.loseContext?.();

    return true;
  } catch {
    // Some hardened or headless environments throw instead of returning null.
    return false;
  }
}

/** `supportsWebGl2` against a throwaway canvas; false during SSR. */
export function browserSupportsWebGl2(): boolean {
  if (typeof document === "undefined") return false;
  try {
    return supportsWebGl2(document.createElement("canvas"));
  } catch {
    return false;
  }
}
