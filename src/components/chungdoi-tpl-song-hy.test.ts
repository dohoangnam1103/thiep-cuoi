import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(
  join(process.cwd(), "src/components/chungdoi-tpl-song-hy.tsx"),
  "utf8",
);

function section(startMarker: string, endMarker: string) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `missing ${startMarker}`);
  assert.notEqual(end, -1, `missing ${endMarker}`);
  return source.slice(start, end);
}

test("Song Hỷ hides wedding gift section when no VietQR account exists", () => {
  const giftSection = section(
    '<div className="relative w-full overflow-hidden" style={{ backgroundColor: palette.cardBg }}>',
    '<div data-template-footer',
  );

  assert.match(giftSection, /\{banks\.length > 0 \? \(/);
  assert.match(giftSection, /Phong Bao Mừng Cưới/);
});

test("Song Hỷ renders every ceremony inside its wedding-information section", () => {
  const ceremonySection = section(
    "<SongHyBand palette={palette}>THÔNG TIN LỄ CƯỚI</SongHyBand>",
    "{albumShown.length > 0 ? (",
  );

  assert.match(source, /const ceremonies = invitationCeremonies\(content\)/);
  assert.match(ceremonySection, /data-song-hy-ceremonies/);
  assert.match(ceremonySection, /ceremonies\.map/);
  assert.match(ceremonySection, /ceremony\.title/);
  assert.match(ceremonySection, /ceremony\.time/);
  assert.match(ceremonySection, /formatDate\(ceremony\.date\)/);
});
