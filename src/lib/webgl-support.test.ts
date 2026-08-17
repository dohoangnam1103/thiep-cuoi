import assert from "node:assert/strict";
import test from "node:test";

import { supportsWebGl2 } from "./webgl-support";

/**
 * Regression cover for the production crash on 2026-08-04: a visitor whose
 * browser returned no WebGL context hit `TypeError: Cannot set properties of
 * null (setting 'renderer')` from OGL's `Renderer`, which the homepage error
 * boundary then showed as "Trang chưa tải xong".
 */

test("a live webgl2 context counts as supported", () => {
  let releasedContext = false;
  const target = {
    getContext: (contextId: string) =>
      contextId === "webgl2"
        ? {
            getExtension: (name: string) =>
              name === "WEBGL_lose_context"
                ? { loseContext: () => { releasedContext = true; } }
                : null,
          }
        : null,
  };

  assert.equal(supportsWebGl2(target), true);
  assert.equal(releasedContext, true, "probe must release the context it opened");
});

test("no context at all is unsupported instead of throwing", () => {
  assert.equal(supportsWebGl2({ getContext: () => null }), false);
});

test("webgl1-only hardware is unsupported because the shaders are GLSL ES 3.00", () => {
  const target = {
    getContext: (contextId: string) => (contextId === "webgl" ? {} : null),
  };

  assert.equal(supportsWebGl2(target), false);
});

test("a throwing getContext is unsupported instead of propagating", () => {
  const target = {
    getContext: () => {
      throw new Error("WebGL is disabled by policy");
    },
  };

  assert.equal(supportsWebGl2(target), false);
});

test("a context without WEBGL_lose_context is still supported", () => {
  assert.equal(
    supportsWebGl2({ getContext: (id: string) => (id === "webgl2" ? {} : null) }),
    true,
  );
});
