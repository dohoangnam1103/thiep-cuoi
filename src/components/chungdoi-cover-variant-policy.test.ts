import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  SINGLE_PANEL_COVER_AWAY_MS,
  coverVariantForTemplate,
  singlePanelCoverTemplateSlugs,
} from "./chungdoi-cover-variant-policy";
import { chungdoiThemeConfig } from "@/data/chungdoi-theme-config";

test("mẫu ngoài danh sách vẫn dùng bìa cổ điển", () => {
  assert.equal(coverVariantForTemplate("song-hy-red"), "classic");
  assert.equal(coverVariantForTemplate("khong-ton-tai"), "classic");
});

test("mẫu bìa liền một mặt được nhận đúng biến thể", () => {
  for (const slug of singlePanelCoverTemplateSlugs) {
    assert.equal(coverVariantForTemplate(slug), "single-panel", slug);
  }
});

test("bìa liền một mặt trượt trong 650-800ms", () => {
  assert.ok(SINGLE_PANEL_COVER_AWAY_MS >= 650 && SINGLE_PANEL_COVER_AWAY_MS <= 800);
});

test("bìa liền một mặt không đi kèm openingEffect của họ art", () => {
  // Hai cơ chế loại trừ nhau: `openingEffect` giữ bìa đứng tới 48-70% keyframe
  // rồi mới bay, còn biến thể này bay ngay từ frame đầu.
  for (const slug of singlePanelCoverTemplateSlugs) {
    assert.equal(chungdoiThemeConfig[slug]?.openingEffect, undefined, slug);
  }
});

test("bìa liền một mặt không có decor bay lúc mở", () => {
  for (const slug of singlePanelCoverTemplateSlugs) {
    const flying = (chungdoiThemeConfig[slug]?.decorations.cardImages ?? []).filter(
      (image) => image.flyOnOpen,
    );
    assert.deepEqual(flying, [], `${slug}: bìa liền một mặt trượt nguyên tấm, không có mảnh nào bay riêng`);
  }
});

test("chungdoi-demo bỏ con dấu và pha chờ cho bìa liền một mặt", () => {
  const source = readFileSync(new URL("./chungdoi-demo.tsx", import.meta.url), "utf8");
  assert.match(source, /coverVariantForTemplate/);
  assert.match(source, /SINGLE_PANEL_COVER_AWAY_MS/);
  assert.match(source, /showSeal/);
});
