import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import sharp from "sharp";

import { ZODIAC_IDS, zodiacArtworkPath } from "./zodiac";

const root = process.cwd();
const artworkIds = [...ZODIAC_IDS, "phuong"] as const;

function publicFile(publicPath: string): string {
  return path.join(root, "public", publicPath.slice(1));
}

test("the zodiac artwork pack contains exactly thirteen filled and thirteen line masks", async () => {
  const expected = artworkIds.flatMap((id) => [
    { path: zodiacArtworkPath(id), width: 1952, height: 4105 },
    { path: zodiacArtworkPath(id, "line"), width: 1966, height: 4119 },
  ]);

  assert.equal(expected.length, 26);
  for (const asset of expected) {
    const file = publicFile(asset.path);
    assert.equal(existsSync(file), true, `missing ${asset.path}`);
    const metadata = await sharp(file).metadata();
    assert.equal(metadata.width, asset.width, `${asset.path} width`);
    assert.equal(metadata.height, asset.height, `${asset.path} height`);
    assert.equal(metadata.hasAlpha, true, `${asset.path} needs alpha`);

    const { data, info } = await sharp(file)
      .ensureAlpha()
      .extractChannel("alpha")
      .raw()
      .toBuffer({ resolveWithObject: true });
    const corners = [
      data[0],
      data[info.width - 1],
      data[(info.height - 1) * info.width],
      data[info.width * info.height - 1],
    ];
    assert.deepEqual(corners, [0, 0, 0, 0], `${asset.path} corners`);

    let opaquePixels = 0;
    let minX = info.width;
    let minY = info.height;
    let maxX = -1;
    let maxY = -1;
    for (let index = 0; index < data.length; index += 1) {
      if ((data[index] ?? 0) <= 16) continue;
      const x = index % info.width;
      const y = Math.floor(index / info.width);
      opaquePixels += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    const coverage = opaquePixels / data.length;
    assert.equal(coverage > 0.005, true, `${asset.path} is effectively empty`);
    assert.equal(coverage < 0.8, true, `${asset.path} still contains a background`);

    const leftMargin = minX / info.width;
    const rightMargin = (info.width - 1 - maxX) / info.width;
    const topMargin = minY / info.height;
    const bottomMargin = (info.height - 1 - maxY) / info.height;
    const subjectWidth = (maxX - minX + 1) / info.width;
    const subjectHeight = (maxY - minY + 1) / info.height;
    assert.equal(
      Math.min(leftMargin, rightMargin, topMargin, bottomMargin) >= 0.04,
      true,
      `${asset.path} needs a safe transparent gutter`,
    );
    assert.equal(
      subjectWidth >= 0.86 || subjectHeight >= 0.88,
      true,
      `${asset.path} needs normalized visual scale`,
    );
    assert.equal(subjectWidth <= 0.9, true, `${asset.path} width exceeds the safe rect`);
    assert.equal(subjectHeight <= 0.92, true, `${asset.path} height exceeds the safe rect`);
  }
});
