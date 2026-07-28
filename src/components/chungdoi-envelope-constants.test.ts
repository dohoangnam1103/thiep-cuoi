import assert from "node:assert/strict";
import test from "node:test";

import {
  ENVELOPE_TARGET_PX,
  fitEnvelopeWidth,
  responsiveEnvelopeWidth,
} from "./chungdoi-envelope-constants";

test("responsive envelope width follows the Chung Đôi breakpoints", () => {
  assert.equal(responsiveEnvelopeWidth(390), 310);
  assert.equal(responsiveEnvelopeWidth(639), 310);
  assert.equal(responsiveEnvelopeWidth(640), 340);
  assert.equal(responsiveEnvelopeWidth(767), 340);
  assert.equal(responsiveEnvelopeWidth(768), 520);
  assert.equal(responsiveEnvelopeWidth(1023), 520);
  assert.equal(responsiveEnvelopeWidth(1024), 600);
  assert.equal(responsiveEnvelopeWidth(1440), 600);
});

test("short viewports reduce width uniformly without stretching the ratio", () => {
  assert.equal(
    fitEnvelopeWidth({
      targetWidth: 600,
      ratio: 508 / 600,
      viewportWidth: 1408,
      viewportHeight: 868,
    }),
    600,
  );

  assert.equal(
    fitEnvelopeWidth({
      targetWidth: 310,
      ratio: 555 / 310,
      viewportWidth: 358,
      viewportHeight: 500,
    }),
    (500 - 96) / (555 / 310),
  );
});

test("the unchanged fixed path keeps its 340px target", () => {
  assert.equal(ENVELOPE_TARGET_PX, 340);
});
