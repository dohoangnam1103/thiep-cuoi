import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import sharp from "sharp";

import {
  buildForestCalendarEvents,
  buildForestJourneyScenes,
  forestWeddingJourneyDemoContent,
  forestWeddingJourneyFeatures,
  isValidForestGiftAccount,
  orderForestFamilySides,
  type ForestJourneyContent,
  type ForestJourneyFeatures,
} from "./forest-wedding-journey";

const demoScenes = buildForestJourneyScenes(
  forestWeddingJourneyDemoContent,
  forestWeddingJourneyFeatures,
);

async function assertTransparentCellGutters(
  assetPath: string,
  columnBoundaries: readonly number[],
  rowBoundaries: readonly number[],
  gutter: number,
) {
  const { data, info } = await sharp(assetPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const occupiedCells = new Set<string>();

  for (let y = 0; y < info.height; y += 1) {
    const row = rowBoundaries.findIndex(
      (boundary, index) =>
        index < rowBoundaries.length - 1 &&
        y >= boundary &&
        y < rowBoundaries[index + 1],
    );

    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3];
      if (alpha === 0) {
        continue;
      }

      const column = columnBoundaries.findIndex(
        (boundary, index) =>
          index < columnBoundaries.length - 1 &&
          x >= boundary &&
          x < columnBoundaries[index + 1],
      );
      const cell = `${column}:${row}`;
      occupiedCells.add(cell);

      assert.ok(
        x >= columnBoundaries[column] + gutter &&
          x < columnBoundaries[column + 1] - gutter &&
          y >= rowBoundaries[row] + gutter &&
          y < rowBoundaries[row + 1] - gutter,
        `${path.basename(assetPath)} has alpha in the ${gutter}px gutter at ${x},${y}`,
      );
    }
  }

  assert.equal(
    occupiedCells.size,
    (columnBoundaries.length - 1) * (rowBoundaries.length - 1),
    `${path.basename(assetPath)} must occupy every nominal cell`,
  );
}

test("forest material assets satisfy their dimensions, alpha, and byte budget", async () => {
  const materialsDirectory = path.join(
    process.cwd(),
    "public/chungdoi/labs/forest-wedding-journey/materials",
  );
  const assets = [
    {
      filename: "foliage-atlas.webp",
      width: 1_024,
      height: 1_024,
      hasAlpha: true,
    },
    {
      filename: "wildflower-atlas.webp",
      width: 1_024,
      height: 1_024,
      hasAlpha: true,
    },
    { filename: "petal-atlas.webp", width: 512, height: 512, hasAlpha: true },
    {
      filename: "ground-detail.webp",
      width: 1_024,
      height: 1_024,
      hasAlpha: false,
    },
  ] as const;

  let totalBytes = 0;

  for (const asset of assets) {
    const assetPath = path.join(materialsDirectory, asset.filename);
    assert.equal(existsSync(assetPath), true, `${asset.filename} must exist`);

    totalBytes += statSync(assetPath).size;
    const metadata = await sharp(assetPath).metadata();
    assert.equal(metadata.format, "webp", `${asset.filename}: format`);
    assert.equal(metadata.width, asset.width, `${asset.filename}: width`);
    assert.equal(metadata.height, asset.height, `${asset.filename}: height`);
    assert.equal(metadata.hasAlpha, asset.hasAlpha, `${asset.filename}: alpha`);
  }

  assert.equal(totalBytes, 845_260, "forest material payload changed unexpectedly");
  assert.ok(totalBytes <= 1_200_000, `forest materials exceed 1,200,000 bytes: ${totalBytes}`);
  assert.ok(totalBytes <= 4_000_000, `initial forest payload exceeds 4,000,000 bytes: ${totalBytes}`);
  assert.ok(totalBytes <= 12_000_000, `shared forest payload exceeds 12,000,000 bytes: ${totalBytes}`);
});

test("alpha atlas cells keep their required transparent gutter bands", async () => {
  const materialsDirectory = path.join(
    process.cwd(),
    "public/chungdoi/labs/forest-wedding-journey/materials",
  );

  await assertTransparentCellGutters(
    path.join(materialsDirectory, "foliage-atlas.webp"),
    [0, 512, 1_024],
    [0, 256, 512, 768, 1_024],
    12,
  );
  await assertTransparentCellGutters(
    path.join(materialsDirectory, "wildflower-atlas.webp"),
    [0, 256, 512, 768, 1_024],
    [0, 341, 683, 1_024],
    10,
  );
  await assertTransparentCellGutters(
    path.join(materialsDirectory, "petal-atlas.webp"),
    [0, 128, 256, 384, 512],
    [0, 128, 256, 384, 512],
    8,
  );
});

test("the data contract depends on the pure calendar URL helper, not a client component", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/data/forest-wedding-journey.ts"),
    "utf8",
  );

  assert.doesNotMatch(source, /chungdoi-tpl-shared/);
  assert.match(source, /@\/lib\/google-calendar-url/);
});

test("calendar event rows distinguish localized ceremony and reception values on different dates", () => {
  assert.deepEqual(
    buildForestCalendarEvents(
      {
        ceremonyDate: "2026-08-02",
        ceremonyTime: "09:00",
        receptionDate: "2026-08-03",
        receptionTime: "18:30",
      },
      {
        ceremony: "Ceremony",
        formattedCeremonyDate: "August 2, 2026",
        formattedReceptionDate: "August 3, 2026",
        reception: "Reception",
      },
    ),
    [
      {
        date: "2026-08-02",
        formattedDate: "August 2, 2026",
        label: "Ceremony",
        time: "09:00",
      },
      {
        date: "2026-08-03",
        formattedDate: "August 3, 2026",
        label: "Reception",
        time: "18:30",
      },
    ],
  );
});

test("families scene authors two white or ivory cloth tables with draped depth and paper panels", () => {
  const staticSceneSource = readFileSync(
    path.join(
      process.cwd(),
      "src/components/forest-wedding-journey/forest-static-scenes.tsx",
    ),
    "utf8",
  );
  const sceneContentSource = readFileSync(
    path.join(
      process.cwd(),
      "src/components/forest-wedding-journey/forest-scene-content.tsx",
    ),
    "utf8",
  );

  assert.equal(
    staticSceneSource.match(/<FamilyClothTable\b/g)?.length ?? 0,
    2,
    "families must render exactly two authored cloth-table assemblies",
  );
  assert.match(staticSceneSource, /clothColor="#fffdf4"/);
  assert.match(staticSceneSource, /clothColor="#eee5d0"/);
  // The three cloth meshes are named through the shared DrapedCloth assembly,
  // so the guard checks both the authored names and the wiring that applies them.
  assert.match(staticSceneSource, /"forest-family-table-cloth-top"/);
  assert.match(staticSceneSource, /"forest-family-table-front-drape"/);
  assert.match(staticSceneSource, /"forest-family-table-side-drape"/);
  assert.match(staticSceneSource, /name=\{topName\}/);
  assert.match(staticSceneSource, /name=\{frontDrapeName\}/);
  assert.match(staticSceneSource, /name=\{sideDrapeName\}/);
  assert.match(staticSceneSource, /<ContactCue radius=\{1\.02\}/);
  assert.equal(
    sceneContentSource.match(/<FamilyPaper\b/g)?.length ?? 0,
    2,
    "families must keep one paper panel per family",
  );
});

test("family side ordering follows brideFirst in both orientations", () => {
  assert.deepEqual(orderForestFamilySides(true), ["bride", "groom"]);
  assert.deepEqual(orderForestFamilySides(false), ["groom", "bride"]);
});

test("demo brackets enabled features with the approved non-gallery scene order", () => {
  assert.deepEqual(
    demoScenes.filter((scene) => scene.type !== "gallery-photo").map((scene) => scene.type),
    [
      "cover-gate",
      "families",
      "opening-message",
      "calendar",
      "schedule",
      "dress-code",
      "venue",
      "map",
      "rsvp",
      "wishes",
      "gift",
      "finale",
    ],
  );
  assert.equal(demoScenes[0]?.type, "cover-gate");
  assert.equal(demoScenes.at(-1)?.type, "finale");
  assert.deepEqual(
    demoScenes.map((scene) => scene.type),
    [
      "cover-gate",
      "families",
      "opening-message",
      "calendar",
      "schedule",
      "gallery-photo",
      "gallery-photo",
      "gallery-photo",
      "dress-code",
      "venue",
      "map",
      "rsvp",
      "wishes",
      "gift",
      "finale",
    ],
  );
});

test("demo assigns the first three curated memories stable gallery IDs", () => {
  assert.deepEqual(
    demoScenes
      .filter((scene) => scene.type === "gallery-photo")
      .map((scene) => scene.id),
    ["gallery-photo:memory-01", "gallery-photo:memory-02", "gallery-photo:memory-03"],
  );
});

test("demo projects exactly two stable existing wishes for the local guestbook", () => {
  assert.deepEqual(
    forestWeddingJourneyDemoContent.wishes.map(({ id, name }) => ({ id, name })),
    [
      { id: "demo-wish-01", name: "Nguyễn Thanh Hà" },
      { id: "demo-wish-02", name: "Trần Minh Đức" },
    ],
  );
  assert.ok(forestWeddingJourneyDemoContent.wishes.every(({ message }) => message.length > 0));
});

test("demo gift fixtures are synthetic, complete, owner-matched, and orderable", () => {
  assert.deepEqual(
    forestWeddingJourneyDemoContent.giftAccounts.map(({ side }) => side).sort(),
    ["bride", "groom"],
  );
  assert.ok(forestWeddingJourneyDemoContent.giftAccounts.every((account) => (
    isValidForestGiftAccount(account, forestWeddingJourneyDemoContent)
  )));
  assert.deepEqual(orderForestFamilySides(false), ["groom", "bride"]);
  assert.deepEqual(orderForestFamilySides(true), ["bride", "groom"]);
});

test("interactive shell keeps Three.js behind the dynamic canvas boundary", () => {
  const interactiveSource = readFileSync(
    path.join(
      process.cwd(),
      "src/components/forest-wedding-journey/forest-interactive-scenes.tsx",
    ),
    "utf8",
  );
  const labSource = readFileSync(
    path.join(
      process.cwd(),
      "src/components/forest-wedding-journey/forest-wedding-journey-lab.tsx",
    ),
    "utf8",
  );

  assert.doesNotMatch(interactiveSource, /@react-three|@react-three\/drei|from ["']three["']/);
  assert.equal(
    labSource.match(/useForestJourneyLocalInteractions\(/g)?.length ?? 0,
    1,
    "the lab must own exactly one local-interaction hook instance",
  );
});

test("each interactive scene has an authored physical clearing assembly", () => {
  const staticSceneSource = readFileSync(
    path.join(
      process.cwd(),
      "src/components/forest-wedding-journey/forest-static-scenes.tsx",
    ),
    "utf8",
  );

  for (const authoredProp of [
    "forest-map-table",
    "forest-map-paper",
    "forest-rsvp-clipboard",
    "forest-wishes-open-book-page",
    "forest-wishes-paper-note",
    "forest-gift-envelope",
    "forest-gift-envelope-seal",
  ]) {
    assert.match(staticSceneSource, new RegExp(`name=["']${authoredProp}["']`));
  }

  // The RSVP cloth is named through the shared DrapedCloth assembly rather than
  // inline, so it is asserted on the prop that carries the name.
  assert.match(staticSceneSource, /topName="forest-rsvp-white-cloth"/);
});

test("gallery descriptors trim IDs and keep only the first valid occurrence", () => {
  const content: ForestJourneyContent = {
    ...forestWeddingJourneyDemoContent,
    gallery: [
      { id: " memory-a ", src: " /one.webp " },
      { id: "memory-a", src: "/duplicate.webp" },
      { id: "  ", src: "/invalid.webp" },
      { id: "memory-b", src: " /two.webp " },
    ],
  };

  const galleryScenes = buildForestJourneyScenes(content, forestWeddingJourneyFeatures)
    .filter((scene) => scene.type === "gallery-photo");

  assert.deepEqual(
    galleryScenes.map((scene) => ({ id: scene.id, photo: scene.photo })),
    [
      {
        id: "gallery-photo:memory-a",
        photo: { id: "memory-a", src: "/one.webp" },
      },
      {
        id: "gallery-photo:memory-b",
        photo: { id: "memory-b", src: "/two.webp" },
      },
    ],
  );
});

test("missing optional content removes its scenes without ordinal gaps", () => {
  const content: ForestJourneyContent = {
    ...forestWeddingJourneyDemoContent,
    dressCodeColors: [],
    gallery: [],
    giftAccounts: [],
    mapQuery: "",
    openingMessage: "",
    ceremonyHeader: "",
    schedule: [],
  };
  const scenes = buildForestJourneyScenes(content, {
    ...forestWeddingJourneyFeatures,
    map: false,
  });

  assert.deepEqual(
    scenes.map((scene) => scene.type),
    ["cover-gate", "families", "calendar", "venue", "rsvp", "wishes", "finale"],
  );
  assert.deepEqual(scenes.map((scene) => scene.ordinal), [0, 1, 2, 3, 4, 5, 6]);
});

test("scene poses form a finite connected layout with bounded travel durations", () => {
  for (const [index, scene] of demoScenes.entries()) {
    assert.equal(scene.ordinal, index);
    assert.ok(scene.cameraPosition.every(Number.isFinite));
    assert.ok(scene.lookTarget.every(Number.isFinite));
    assert.ok(scene.travelDurationMs >= 1_200 && scene.travelDurationMs <= 1_800);
    assert.equal(scene.travelMidpointToNext === null, index === demoScenes.length - 1);
    if (scene.travelMidpointToNext) {
      assert.ok(scene.travelMidpointToNext.every(Number.isFinite));
    }
  }
});

test("an account whose owner does not match its side does not add a gift scene", () => {
  const content: ForestJourneyContent = {
    ...forestWeddingJourneyDemoContent,
    giftAccounts: [
      {
        accountName: "Someone Else",
        accountNumber: "123456789",
        bankName: "Example Bank",
        side: "bride",
      },
    ],
  };

  assert.ok(
    !buildForestJourneyScenes(content, forestWeddingJourneyFeatures).some(
      (scene) => scene.type === "gift",
    ),
  );
});

test("a mixed-validity gift account list does not add a gift scene", () => {
  const content: ForestJourneyContent = {
    ...forestWeddingJourneyDemoContent,
    giftAccounts: [
      ...forestWeddingJourneyDemoContent.giftAccounts,
      {
        accountName: forestWeddingJourneyDemoContent.groomName,
        accountNumber: "",
        bankName: "Forest Journey Demo Bank",
        side: "groom",
      },
    ],
  };

  assert.ok(
    !buildForestJourneyScenes(content, forestWeddingJourneyFeatures).some(
      (scene) => scene.type === "gift",
    ),
  );
});

test("disabling gifts leaves gallery identity stable", () => {
  const galleryIds = (features: ForestJourneyFeatures) =>
    buildForestJourneyScenes(forestWeddingJourneyDemoContent, features)
      .filter((scene) => scene.type === "gallery-photo")
      .map((scene) => scene.id);

  assert.deepEqual(
    galleryIds(forestWeddingJourneyFeatures),
    galleryIds({ ...forestWeddingJourneyFeatures, gift: false }),
  );
});

test("the Vietnamese catalog carries the forest wedding journey lab copy", () => {
  const catalog = JSON.parse(
    readFileSync(path.join(process.cwd(), "messages", "vi.json"), "utf8"),
  ) as { forestWeddingJourneyLab: unknown };

  assert.ok(catalog.forestWeddingJourneyLab, "vi is missing forestWeddingJourneyLab");
});
