import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { chungdoiThemeConfig } from "@/data/chungdoi-theme-config";
import {
  resolveCoupleNames,
  resolveOgDate,
  resolveOgFont,
  resolveOgImageUrl,
  resolveOgImageVersion,
  resolveOgNameLines,
  resolveOgTheme,
} from "@/lib/og-image";

const ART_OG_FONTS = {
  "dong-ho-folk": ["UNI Chu truyen thong", "UNI_Chu_truyen_thong.ttf"],
  "tho-cam-highland": ["SVN-HC Haydon Brush", "SVN-HC-Haydon-Brush.otf"],
  "son-mai-lacquer": ["DFVN New Eddy", "DFVN-NewEddy-Regular.otf"],
  "bat-trang-blue": ["Fz Qellia", "Fz_Qellia_Fix.ttf"],
  "hang-trong-folk": ["Pattaya", "Pattaya-Regular.woff"],
  "sen-monoline": ["1FTV VIP Signora", "1FTV-VIP-Signora-Regular.otf"],
  "truc-chi-minimal": ["Lora", "Lora-Regular.ttf"],
  "long-phung-deco": ["Fz Aghita", "FzAghita.ttf"],
  "ao-dai-hue": ["The Nautigal", "TheNautigal-Regular.ttf"],
  "art-deco-gatsby": ["SVN-HC Built Titling", "SVN-HC-Built-Titling.otf"],
  "celestial-map": ["Alex Brush", "AlexBrush-Regular.ttf"],
  "coastal-mediterranean": ["SVN-HC Pacifico", "SVN-HC-Pacifico.otf"],
  "swiss-brutalist": ["HelveticaNeue", "HelveticaNeueLight.otf"],
  "riso-duotone": ["SVN-HC Marvin Visions", "SVN-HC-Marvin-Visions.otf"],
  "thanh-duong-anh-sang": ["Fz Qellia", "Fz_Qellia_Fix.ttf"],
} as const;

test("all art invitation families resolve to local OG font files", () => {
  for (const [slug, [family, file]] of Object.entries(ART_OG_FONTS)) {
    assert.deepEqual(resolveOgFont(slug), { family, file }, slug);
    assert.equal(
      existsSync(path.join(process.cwd(), "public", "chungdoi", "fonts", file)),
      true,
      `${slug}: ${file}`,
    );
  }
});

test("resolveCoupleNames dùng shortName, thứ tự theo brideFirst", () => {
  assert.equal(
    resolveCoupleNames({
      brideShortName: "Linh",
      groomShortName: "Nam",
      brideFullName: "Nguyễn Thùy Linh",
      groomFullName: "Trần Hoài Nam",
      brideFirst: false,
    }),
    "Nam & Linh",
  );
});

test("resolveCoupleNames fallback fullName khi thiếu shortName", () => {
  assert.equal(
    resolveCoupleNames({
      brideShortName: "",
      groomShortName: "",
      brideFullName: "Nguyễn Thùy Linh",
      groomFullName: "Trần Hoài Nam",
      brideFirst: true,
    }),
    "Nguyễn Thùy Linh & Trần Hoài Nam",
  );
});

test("resolveCoupleNames bỏ vế trống, không để '& '", () => {
  assert.equal(
    resolveCoupleNames({
      brideShortName: "Linh",
      groomShortName: "",
      brideFullName: "",
      groomFullName: "",
      brideFirst: true,
    }),
    "Linh",
  );
});

test("resolveOgDate trả nguyên chuỗi user nhập, trim", () => {
  assert.equal(resolveOgDate("  20.12.2026  "), "20.12.2026");
});

const SHARE_COUPLE = {
  brideShortName: "Lê Thị Hậu",
  groomShortName: "Lê Văn Long",
  brideFullName: "Lê Thị Hậu",
  groomFullName: "Lê Văn Long",
  brideFirst: false,
  date: "2026-12-06",
  primaryColor: "#511419",
};

test("share thumbnail puts the bride, ampersand and groom on separate lines", () => {
  assert.deepEqual(resolveOgNameLines(SHARE_COUPLE), ["Lê Thị Hậu", "&", "Lê Văn Long"]);
  assert.deepEqual(resolveOgNameLines({
    ...SHARE_COUPLE,
    brideShortName: " ",
    groomShortName: "",
  }), ["Lê Thị Hậu", "&", "Lê Văn Long"]);
  assert.deepEqual(resolveOgNameLines({
    ...SHARE_COUPLE,
    groomShortName: "",
    groomFullName: "",
  }), ["Lê Thị Hậu"]);
});

test("share date preserves the calendar day without timezone conversion", () => {
  assert.equal(resolveOgDate("2026-12-06"), "06.12.2026");
  assert.equal(resolveOgDate(" 2027-01-01 "), "01.01.2027");
});

test("share image URL changes when the wedding date, names or theme change", () => {
  const urlFor = (content = SHARE_COUPLE, templateId = "minimalism-dark-red") =>
    resolveOgImageUrl("https://thiepmungonline.com", "long-hau-wedding", templateId, content);
  const original = urlFor();
  assert.match(original, /^https:\/\/thiepmungonline\.com\/thiep\/long-hau-wedding\/opengraph-image\?v=[a-f0-9]{16}$/);
  assert.equal(urlFor({ ...SHARE_COUPLE }), original);
  assert.notEqual(urlFor({ ...SHARE_COUPLE, date: "2026-12-05" }), original);
  assert.notEqual(urlFor({ ...SHARE_COUPLE, brideShortName: "Hậu" }), original);
  assert.notEqual(urlFor({ ...SHARE_COUPLE, groomShortName: "Long" }), original);
  assert.notEqual(urlFor(SHARE_COUPLE, "minimalism-dark-blue"), original);
  assert.equal(urlFor({ ...SHARE_COUPLE, brideFirst: true }), original);
});

test("resolveOgDate trả chuỗi rỗng khi trống", () => {
  assert.equal(resolveOgDate(""), "");
  assert.equal(resolveOgDate("   "), "");
});

test("prepared thumbnail versions rebuild for both full names and date edits", () => {
  const version = resolveOgImageVersion("minimalism-dark-red", SHARE_COUPLE);
  for (const change of [
    { brideFullName: "Nguyễn Thị Hậu" },
    { groomFullName: "Nguyễn Văn Long" },
    { brideShortName: "Hậu" },
    { groomShortName: "Long" },
    { date: "2027-01-01" },
  ]) {
    assert.notEqual(resolveOgImageVersion("minimalism-dark-red", { ...SHARE_COUPLE, ...change }), version);
  }
  const url = resolveOgImageUrl("https://example.com", "wedding", "minimalism-dark-red", SHARE_COUPLE);
  assert.equal(new URL(url).searchParams.get("v"), version);
});

test("resolveOgFont map template có font riêng (song-hy-green → Fz Qellia)", () => {
  const f = resolveOgFont("song-hy-green");
  assert.equal(f.family, "Fz Qellia");
  assert.equal(f.file, "Fz_Qellia_Fix.ttf");
});

test("resolveOgFont fallback Lora khi template không tồn tại", () => {
  const f = resolveOgFont("khong-co-template-nay");
  assert.equal(f.family, "Lora");
  assert.equal(f.file, "Lora-Regular.ttf");
});

test("resolveOgTheme lấy token từ config (double-phoenix-red)", () => {
  const t = resolveOgTheme("double-phoenix-red", "#c8102e");
  assert.equal(t.textPrimary, "#710001");
  assert.equal(t.cardBg, "rgba(255, 240, 231, 0.95)");
  assert.ok(t.background.startsWith("linear-gradient"));
  assert.ok(Array.isArray(t.decor));
});

test("resolveOgTheme replaces zodiac placeholders with safe fallback artwork", () => {
  const slug = "test-zodiac-placeholder-og";
  const base = chungdoiThemeConfig["double-phoenix-red"];
  if (!base) throw new Error("expected the double-phoenix-red fixture");
  chungdoiThemeConfig[slug] = {
    ...base,
    decorations: {
      cardImages: [
        {
          src: "{{brideZodiac}}",
          className: "left-slot",
          flyOnOpen: true,
        },
        {
          src: "{{groomZodiac}}",
          className: "right-slot",
          flyOnOpen: true,
        },
      ],
    },
  };

  try {
    const theme = resolveOgTheme(slug, "#710001");
    assert.deepEqual(theme.decor, [
      {
        src: "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-phuong.webp",
        className: "left-slot",
      },
      {
        src: "/chungdoi/images/themes/_decor/thap-nhi-chi-do/zodiac-rong.webp",
        className: "right-slot",
      },
    ]);
    assert.equal(theme.decor.some(({ src }) => src.includes("{{")), false);
  } finally {
    delete chungdoiThemeConfig[slug];
  }
});

test("resolveOgTheme fallback theo primaryColor khi không có config", () => {
  const t = resolveOgTheme("khong-co", "#123456");
  assert.equal(t.background, "linear-gradient(to bottom right, #123456, #123456)");
  assert.equal(t.cardBg, "rgba(255, 250, 244, 0.96)");
  assert.equal(t.textPrimary, "#123456");
  assert.deepEqual(t.decor, []);
});

test("resolveOgTheme fallback primaryColor trống → màu mặc định", () => {
  const t = resolveOgTheme("khong-co", "");
  assert.equal(t.textPrimary, "#710001");
});
