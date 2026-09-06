import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { invitationCeremonies } from "@/lib/invitation-display";
import { createTemplateDemoContent } from "@/data/templates/template-manifest";

const component = (name: string) => readFileSync(
  join(process.cwd(), "src/components", name),
  "utf8",
);

const dataFile = (name: string) => readFileSync(
  join(process.cwd(), "src/data/templates", name),
  "utf8",
);

const generatedRendererSource = readFileSync(
  join(process.cwd(), "src/components/generated/template-renderers.tsx"),
  "utf8",
);

const templatesWithInternalCeremonies = [
  ["chungdoi-tpl-art-invitation.tsx", "data-art-ceremonies"],
  ["chungdoi-tpl-porcelain-family.tsx", "data-template-ceremonies"],
  ["chungdoi-tpl-floral-base.tsx", "data-floral-ceremonies"],
  ["chungdoi-tpl-boho-floral-brown.tsx", "data-boho-ceremonies"],
  ["chungdoi-tpl-dragon-phoenix.tsx", "data-dragon-phoenix-ceremonies"],
  ["chungdoi-tpl-dragon-phoenix-v3-red.tsx", "data-dragon-phoenix-v3-ceremonies"],
  ["chungdoi-tpl-minimalism-dark-red.tsx", "data-minimalism-dark-red-ceremonies"],
  ["chungdoi-tpl-minimalism-brown.tsx", "data-minimalism-brown-ceremonies"],
  ["chungdoi-tpl-glass-garden-pink.tsx", "data-glass-garden-pink-ceremonies"],
  ["chungdoi-tpl-glass-garden-green.tsx", "data-glass-garden-green-ceremonies"],
  ["chungdoi-tpl-ban-ve-to-am.tsx", "data-template-ceremonies"],
  ["chungdoi-tpl-hy-uoc.tsx", "data-template-ceremonies"],
  ["chungdoi-tpl-to-hong.tsx", "data-template-ceremonies"],
  ["chungdoi-tpl-uyen-uong.tsx", "data-template-ceremonies"],
  ["chungdoi-tpl-song-hy.tsx", "data-song-hy-ceremonies"],
  ["chungdoi-tpl-rap-hy-sai-gon.tsx", "data-template-ceremonies"],
] as const;

test("native ceremony layouts render every stored ceremony with stable markers", () => {
  for (const [file, marker] of templatesWithInternalCeremonies) {
    const source = component(file);
    assert.match(source, /invitationCeremonies\(content\)/, file);
    assert.match(source, /ceremonies\.map/, file);
    assert.match(source, new RegExp(marker), file);
    assert.match(source, /data-template-ceremony-item/, file);
  }
});

test("the generic post-template ceremony card is controlled by the renderer registry", () => {
  const source = component("chungdoi-demo.tsx");

  assert.doesNotMatch(
    source,
    /const rendersCeremoniesInsideTemplate\s*=\s*\[/,
    "a new clone must not require a second slug allowlist",
  );
  assert.match(source, /const TEMPLATE_RENDERERS =/);
  assert.match(source, /rendererEntry\?\.ceremonyRendering === "inline-all"/);
  assert.match(source, /!isPhysicalExperience && !rendersCeremoniesInsideTemplate/);
  assert.match(generatedRendererSource, /ceremonyRendering/);
  assert.match(
    generatedRendererSource,
    /"minimalism-dark-blue": \{ component: [^,]+, ceremonyRendering: "inline-all" \}/,
  );

  for (const slug of [
    "minimalism-jade",
    "minimalism-sky-blue",
    "minimalism-powder-pink",
    "minimalism-purple",
  ]) {
    assert.match(
      source,
      new RegExp(`"${slug}": templateRendererEntry\\([^\\n]+, "inline-all"\\)`),
      `${slug}: native alias mode`,
    );
  }
});

test("every manifest declares an explicit ceremony rendering contract", () => {
  const manifestDirectory = join(process.cwd(), "src/data/templates");
  const files = readdirSync(manifestDirectory)
    .filter((file) => file.endsWith(".manifest.ts"));

  assert.ok(files.length > 0);
  for (const file of files) {
    const source = dataFile(file);
    if (source.includes("createArtTemplateManifest") || source.includes("createPorcelainTemplateManifest")) {
      const slug = file.replace(/\.manifest\.ts$/, "");
      const rendererSource = component(`chungdoi-tpl-${slug}.tsx`);
      assert.doesNotMatch(
        rendererSource,
        /invitationCeremonyMessage/,
        `${file}: factory renderer must not discard additional ceremonies`,
      );
      assert.match(
        rendererSource,
        /ArtInvitation|PorcelainFamilyInvitation|invitationCeremonies\(content\)/,
        `${file}: factory renderer ceremony implementation`,
      );
      continue;
    }
    assert.match(
      source,
      /ceremonyRendering:\s*"(?:inline-all|post-template)"/,
      `${file}: explicit ceremonyRendering`,
    );
  }

  assert.match(
    dataFile("art-template-manifest.ts"),
    /ceremonyRendering:\s*"inline-all"/,
  );
  assert.match(
    dataFile("porcelain-template-manifest.ts"),
    /ceremonyRendering:\s*"inline-all"/,
  );
  assert.match(
    dataFile("minimalism-dark-blue.manifest.ts"),
    /ceremonyRendering:\s*"inline-all"/,
  );
});

test("the two-ceremony fixture contract keeps title, date, and time distinct", () => {
  const fixture = [
    { title: "Lễ Vu Quy tại tư gia Nhà Gái", date: "2026-09-04", time: "09:31" },
    { title: "Lễ Thành Hôn tại tư gia Nhà Trai", date: "2026-09-05", time: "11:00" },
  ];
  const content = {
    ...createTemplateDemoContent({
      slug: "ceremony-regression-fixture",
      primaryColor: "#31443a",
      fontFamily: "Cormorant Garamond",
      music: "/chungdoi/music/a-thousand-years.mp3",
    }),
    ceremonies: fixture,
  };

  assert.deepEqual(invitationCeremonies(content), fixture);
  assert.equal(new Set(fixture.map((item) => item.title)).size, 2);
  assert.equal(new Set(fixture.map((item) => item.date)).size, 2);
  assert.equal(new Set(fixture.map((item) => item.time)).size, 2);
});
