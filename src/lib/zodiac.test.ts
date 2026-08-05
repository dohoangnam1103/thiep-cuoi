import assert from "node:assert/strict";
import test from "node:test";

import { EARTHLY_BRANCHES } from "./vietnamese-lunar-date";
import {
  ZODIAC,
  ZODIAC_IDS,
  isZodiacArtworkPath,
  isZodiacId,
  zodiacArtworkPath,
} from "./zodiac";

test("ZODIAC follows the twelve earthly branches in canonical order", () => {
  assert.deepEqual(
    ZODIAC.map((item) => item.branch),
    EARTHLY_BRANCHES,
  );
  assert.equal(ZODIAC.length, 12);
});

test("zodiac data exposes the shared earthly-branch source instead of duplicating it", async () => {
  const zodiacModule = await import("./zodiac") as unknown as {
    ZODIAC_BRANCHES?: typeof EARTHLY_BRANCHES;
  };

  assert.equal(zodiacModule.ZODIAC_BRANCHES, EARTHLY_BRANCHES);
});

test("zodiac IDs are unique animal names instead of colliding branch slugs", () => {
  assert.equal(new Set(ZODIAC_IDS).size, 12);
  assert.deepEqual(ZODIAC_IDS, [
    "chuot",
    "trau",
    "ho",
    "meo",
    "rong",
    "tran",
    "ngua",
    "de",
    "khi",
    "ga",
    "cho",
    "lon",
  ]);
});

test("the Vietnamese Mão zodiac uses a cat and Tỵ uses the locked python artwork", () => {
  assert.deepEqual(
    ZODIAC.find((item) => item.branch === "Mão"),
    { id: "meo", branch: "Mão", animal: "Mèo" },
  );
  assert.deepEqual(
    ZODIAC.find((item) => item.branch === "Tỵ"),
    { id: "tran", branch: "Tỵ", animal: "Trăn" },
  );
});

test("isZodiacId accepts only the twelve persisted IDs", () => {
  for (const id of ZODIAC_IDS) assert.equal(isZodiacId(id), true);
  for (const value of ["", "phuong", "ty", "../../rong", "dragon"]) {
    assert.equal(isZodiacId(value), false);
  }
});

test("zodiacArtworkPath returns only the normalized filled and line asset paths", () => {
  assert.equal(
    zodiacArtworkPath("rong"),
    "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-rong.webp",
  );
  assert.equal(
    zodiacArtworkPath("phuong", "line"),
    "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-phuong-line.webp",
  );
});

test("isZodiacArtworkPath identifies only normalized assets from the zodiac pack", () => {
  assert.equal(isZodiacArtworkPath(zodiacArtworkPath("meo")), true);
  assert.equal(isZodiacArtworkPath(zodiacArtworkPath("rong", "line")), true);
  assert.equal(isZodiacArtworkPath("{{brideZodiac}}"), false);
  assert.equal(isZodiacArtworkPath("/other/zodiac-meo.webp"), false);
  assert.equal(isZodiacArtworkPath("../../zodiac-meo.webp"), false);
});

test("new zodiac invitations start with lacquer gold without changing other templates", async () => {
  const zodiacModule = await import("./zodiac") as unknown as {
    zodiacTemplatePrimaryColor?: (templateId: string) => string | undefined;
  };

  assert.equal(zodiacModule.zodiacTemplatePrimaryColor?.("thap-nhi-chi-do"), "#d4a24a");
  assert.equal(zodiacModule.zodiacTemplatePrimaryColor?.("song-hy-red"), undefined);
});
