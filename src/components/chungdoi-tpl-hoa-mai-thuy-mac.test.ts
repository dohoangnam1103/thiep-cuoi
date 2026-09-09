import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import sharp from "sharp";

const assetDirectory = path.join(
  process.cwd(),
  "public/chungdoi/images/themes/hoa-mai-thuy-mac",
);

const alphaAssets = [
  { filename: "mai-branch-canopy.webp", minimumWidth: 1_800 },
  { filename: "mai-branch-left.webp", minimumWidth: 1_000 },
  { filename: "mai-branch-right.webp", minimumWidth: 1_000 },
  { filename: "mai-cluster-round.webp", minimumWidth: 900 },
  { filename: "mai-divider.webp", minimumWidth: 900 },
  { filename: "petals.webp", minimumWidth: 900 },
  { filename: "wash-mountains-wide.webp", minimumWidth: 2_000 },
  { filename: "wash-river-wide.webp", minimumWidth: 2_000 },
] as const;

test("hoa mai watercolor assets satisfy format, alpha, size, and byte contracts", async () => {
  for (const asset of alphaAssets) {
    const assetPath = path.join(assetDirectory, asset.filename);
    assert.equal(existsSync(assetPath), true, `${asset.filename}: exists`);

    const metadata = await sharp(assetPath).metadata();
    assert.equal(metadata.format, "webp", `${asset.filename}: format`);
    assert.equal(metadata.hasAlpha, true, `${asset.filename}: alpha`);
    assert.ok(
      (metadata.width ?? 0) >= asset.minimumWidth,
      `${asset.filename}: width is at least ${asset.minimumWidth}px`,
    );
    assert.ok(
      statSync(assetPath).size < 900_000,
      `${asset.filename}: stays under 900KB`,
    );

    const alphaChannel = await sharp(assetPath).extractChannel("alpha").stats();
    assert.equal(alphaChannel.channels[0]?.min, 0, `${asset.filename}: transparent pixels`);
  }
});

test("hoa mai renderer locks every section to one centered content rail", () => {
  const componentPath = path.join(
    process.cwd(),
    "src/components/chungdoi-tpl-hoa-mai-thuy-mac.tsx",
  );
  const stylesheetPath = path.join(
    process.cwd(),
    "src/components/chungdoi-hoa-mai-thuy-mac.module.css",
  );
  assert.equal(existsSync(componentPath), true, "renderer exists");
  assert.equal(existsSync(stylesheetPath), true, "stylesheet exists");

  const source = readFileSync(componentPath, "utf8");
  const stylesheet = readFileSync(stylesheetPath, "utf8");
  assert.match(source, /export function HoaMaiThuyMacInvitation/);
  assert.match(source, /data-hoa-mai-template/);
  assert.match(source, /data-hoa-mai-section/);
  assert.match(source, /styles\.contentRail/);
  assert.doesNotMatch(source, /(?:md|lg):grid-cols-2/);
  assert.doesNotMatch(stylesheet, /grid-template-columns:\s*repeat\(2/);
  assert.match(stylesheet, /width:\s*min\(calc\(100% - 32px\),\s*760px\)/);
  assert.match(
    stylesheet,
    /url\(["']\/chungdoi\/images\/themes\/hoa-mai-thuy-mac\/paper-tile\.webp["']\)/,
  );
});

test("hoa mai renderer preserves every configured ceremony in the one-column flow", () => {
  const source = readFileSync(
    path.join(
      process.cwd(),
      "src/components/chungdoi-tpl-hoa-mai-thuy-mac.tsx",
    ),
    "utf8",
  );

  assert.match(source, /const ceremonies = invitationCeremonies\(content\)/);
  assert.match(source, /ceremonies\.map\(/);
  assert.match(source, /data-template-ceremonies/);
  assert.match(source, /data-template-ceremony-item/);
  assert.match(source, /orderedCouple\(content\)/);
  assert.match(source, /orderByBrideFirst\(/);
  assert.match(source, /invitationOpeningMessage\(content\)/);
  assert.match(source, /invitationHeroImage\(content\)/);
});

test("hoa mai information sections keep gallery, calendar, schedule, dress, and map behavior", () => {
  const source = readFileSync(
    path.join(
      process.cwd(),
      "src/components/chungdoi-tpl-hoa-mai-thuy-mac.tsx",
    ),
    "utf8",
  );

  assert.match(source, /SharedCarousel/);
  assert.match(source, /useLightbox\(content\.gallery\.length\)/);
  assert.match(source, /<Lightbox/);
  assert.match(source, /buildCalendar\(content\.couple\.date\)/);
  assert.match(source, /content\.schedule\.map\(/);
  assert.match(source, /content\.dressCodeColors/);
  assert.match(source, /venue\.mapAddress \|\| venue\.address/);
  assert.match(source, /<InvitationMap/);
  assert.match(source, /<MapDirectionsButton/);
  assert.doesNotMatch(source, /AlbumGallery/);
});

test("hoa mai live sections use shared RSVP, wishes, and deferred gift QR behavior", () => {
  const source = readFileSync(
    path.join(
      process.cwd(),
      "src/components/chungdoi-tpl-hoa-mai-thuy-mac.tsx",
    ),
    "utf8",
  );

  assert.match(source, /<SharedRsvpForm/);
  assert.match(source, /<SharedWishForm/);
  assert.match(source, /<SharedWishList/);
  assert.match(source, /<GiftEnvelope/);
  assert.match(source, /invitationGiftAccounts\(content\)\.map\(/);
  assert.match(source, /templateSlug=\{content\.slug\}/);
  assert.match(source, /artworkVariant="source"/);
  assert.match(source, /stacked/);
  assert.doesNotMatch(source, /GiftQrGrid/);
});
