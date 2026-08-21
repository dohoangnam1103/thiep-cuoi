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
  assert.equal(responsiveEnvelopeWidth(768), 640);
  assert.equal(responsiveEnvelopeWidth(1023), 640);
  assert.equal(responsiveEnvelopeWidth(1024), 732);
  assert.equal(responsiveEnvelopeWidth(1440), 732);
});

test("mobile keeps the portrait cover while desktop reads as a landscape envelope", () => {
  // Chiều cao bìa do nội dung quyết định: 563px ở mốc mobile, 518px từ 520px trở lên.
  const mobileRatio = 563 / responsiveEnvelopeWidth(390);
  const desktopRatio = 518 / responsiveEnvelopeWidth(1440);

  assert.ok(mobileRatio > 1.5, `bìa mobile phải còn dọc, đang ${mobileRatio}`);
  // √2 là tỉ lệ phong bì A-series/DL — đích của bìa desktop.
  assert.ok(
    Math.abs(1 / desktopRatio - Math.SQRT2) < 0.02,
    `bìa desktop phải xấp xỉ √2 ngang, đang ${1 / desktopRatio}`,
  );
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
