#!/usr/bin/env node

// Thánh Đường Ánh Sáng — a gothic cathedral facade: a traceried rose window,
// three lancet windows under pointed archivolts, flanking pinnacles and a pair
// of doves rising through morning light.
// Every motif stays inside the top 38% of the canvas so the hero date/name
// cluster anchored to the bottom is never crossed by artwork.

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const canvas = { width: 1024, height: 1536 };
const SAFE_BOTTOM = Math.round(canvas.height * 0.38); // 584px — motifs must end above this

const workDir = path.join(root, "tmp/thanh-duong-anh-sang");
const themeDir = path.join(root, "public/chungdoi/images/themes/_decor/thanh-duong-anh-sang");
const giftDir = path.join(root, "public/chungdoi/images/giftbox/thanh-duong-anh-sang");

await mkdir(workDir, { recursive: true });
await mkdir(themeDir, { recursive: true });
await mkdir(giftDir, { recursive: true });

const colors = {
  paper: "#f9f6ef",
  paperWarm: "#f2ede0",
  stone: "#e6ddc9",
  ink: "#1e3a5f",
  glassBlue: "#2d6fa0",
  glassGold: "#c9922f",
  glassRose: "#b8607a",
  glassSage: "#6f8c7a",
  dove: "#fdfcf8",
  sun: "#e8c67a",
};

const n = (value) => Math.round(value * 100) / 100;

const svg = (body, size = canvas) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">${body}</svg>`;

/**
 * A two-centred gothic arch head: vertical at the springline, steep at the
 * apex, so the crown reads as a point rather than a semicircle.
 */
function archHead(x1, x2, springY, rise) {
  const width = x2 - x1;
  const cx = (x1 + x2) / 2;
  const apexY = springY - rise;
  return [
    `M${n(x1)} ${n(springY)}`,
    `C${n(x1)} ${n(apexY + rise * 0.42)} ${n(cx - width * 0.13)} ${n(apexY + rise * 0.11)} ${n(cx)} ${n(apexY)}`,
    `C${n(cx + width * 0.13)} ${n(apexY + rise * 0.11)} ${n(x2)} ${n(apexY + rise * 0.42)} ${n(x2)} ${n(springY)}`,
  ].join("");
}

// --- rose window tracery ---------------------------------------------------
const rose = { cx: 512, cy: 205, r: 100 };

function rosePetals() {
  const parts = [];
  const glass = [colors.glassBlue, colors.glassGold, colors.glassRose, colors.glassSage];
  for (let index = 0; index < 12; index += 1) {
    const angle = (index * 360) / 12;
    const fill = glass[index % glass.length];
    const petal =
      `M${rose.cx} ${rose.cy - 34}` +
      `C${rose.cx + 17} ${rose.cy - 52} ${rose.cx + 17} ${rose.cy - 80} ${rose.cx} ${rose.cy - 96}` +
      `C${rose.cx - 17} ${rose.cy - 80} ${rose.cx - 17} ${rose.cy - 52} ${rose.cx} ${rose.cy - 34}Z`;
    parts.push(
      `<path d="${petal}" fill="${fill}" fill-opacity=".40" stroke="${colors.ink}" stroke-opacity=".34" stroke-width="1.5" transform="rotate(${angle} ${rose.cx} ${rose.cy})"/>`,
    );
  }
  return parts.join("");
}

function roseSpokesAndFoils() {
  const parts = [];
  for (let index = 0; index < 12; index += 1) {
    const angle = ((index + 0.5) * 360) / 12;
    const rad = (angle * Math.PI) / 180;
    const sin = Math.sin(rad);
    const cos = Math.cos(rad);
    // Spoke: a lead line from the inner ring out to the outer ring.
    const x1 = rose.cx + sin * 32;
    const y1 = rose.cy - cos * 32;
    const x2 = rose.cx + sin * 92;
    const y2 = rose.cy - cos * 92;
    parts.push(
      `<path d="M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}" stroke="${colors.ink}" stroke-opacity=".30" stroke-width="1.3"/>`,
    );
    // Foil: a small circular light between each pair of petals.
    const fx = rose.cx + sin * 74;
    const fy = rose.cy - cos * 74;
    parts.push(
      `<circle cx="${n(fx)}" cy="${n(fy)}" r="8" fill="${colors.sun}" fill-opacity=".34" stroke="${colors.ink}" stroke-opacity=".28" stroke-width="1.1"/>`,
    );
  }
  return parts.join("");
}

function roseCusps() {
  const parts = [];
  for (let index = 0; index < 24; index += 1) {
    const angle = (index * 360) / 24;
    const rad = (angle * Math.PI) / 180;
    const sin = Math.sin(rad);
    const cos = Math.cos(rad);
    const cx = rose.cx + sin * (rose.r + 7);
    const cy = rose.cy - cos * (rose.r + 7);
    parts.push(
      `<circle cx="${n(cx)}" cy="${n(cy)}" r="4.6" fill="none" stroke="${colors.ink}" stroke-opacity=".26" stroke-width="1.1"/>`,
    );
  }
  return parts.join("");
}

function roseCentre() {
  const parts = [
    `<circle cx="${rose.cx}" cy="${rose.cy}" r="32" fill="none" stroke="${colors.ink}" stroke-opacity=".38" stroke-width="1.8"/>`,
  ];
  for (let index = 0; index < 4; index += 1) {
    const angle = (index * 360) / 4;
    const rad = (angle * Math.PI) / 180;
    const cx = rose.cx + Math.sin(rad) * 15;
    const cy = rose.cy - Math.cos(rad) * 15;
    parts.push(
      `<circle cx="${n(cx)}" cy="${n(cy)}" r="12" fill="${colors.glassGold}" fill-opacity=".26" stroke="${colors.ink}" stroke-opacity=".26" stroke-width="1.1"/>`,
    );
  }
  parts.push(
    `<circle cx="${rose.cx}" cy="${rose.cy}" r="10" fill="url(#roseCore)" stroke="${colors.ink}" stroke-opacity=".34" stroke-width="1.2"/>`,
  );
  return parts.join("");
}

// --- lancet windows -------------------------------------------------------
const springY = 566;

/**
 * A traceried lancet: glazed head, moulded archivolt, a central mullion and
 * two cusped sub-lights with a pierced roundel over them.
 */
function lancetWindow(x1, x2, rise, glass) {
  const cx = (x1 + x2) / 2;
  const apexY = springY - rise;
  const subRise = rise * 0.46;
  const head = archHead(x1, x2, springY, rise);

  return `
<g>
  <path d="${head}L${n(x2)} ${n(springY)}L${n(x1)} ${n(springY)}Z" fill="${glass}" fill-opacity=".13"/>
  <path d="${archHead(x1 - 13, x2 + 13, springY, rise + 13)}" fill="none" stroke="${colors.ink}" stroke-opacity=".44" stroke-width="2.6"/>
  <path d="${archHead(x1 - 5, x2 + 5, springY, rise + 5)}" fill="none" stroke="${colors.ink}" stroke-opacity=".26" stroke-width="1.3"/>
  <path d="${head}" fill="none" stroke="${colors.ink}" stroke-opacity=".50" stroke-width="2.4"/>
  <path d="M${n(x1)} ${n(springY)}V${n(apexY + rise * 0.5)}" stroke="${colors.ink}" stroke-opacity=".40" stroke-width="2.1"/>
  <path d="M${n(x2)} ${n(springY)}V${n(apexY + rise * 0.5)}" stroke="${colors.ink}" stroke-opacity=".40" stroke-width="2.1"/>
  <path d="M${n(cx)} ${n(springY)}V${n(apexY + subRise * 0.55)}" stroke="${colors.ink}" stroke-opacity=".38" stroke-width="1.9"/>
  <path d="${archHead(x1 + 13, cx - 5, springY, subRise)}" fill="none" stroke="${colors.ink}" stroke-opacity=".34" stroke-width="1.6"/>
  <path d="${archHead(cx + 5, x2 - 13, springY, subRise)}" fill="none" stroke="${colors.ink}" stroke-opacity=".34" stroke-width="1.6"/>
  <circle cx="${n(cx)}" cy="${n(apexY + rise * 0.30)}" r="${n(Math.min(21, rise * 0.12))}" fill="${colors.sun}" fill-opacity=".22" stroke="${colors.ink}" stroke-opacity=".32" stroke-width="1.5"/>
</g>`;
}

/**
 * A slender shaft with a moulded capital and base, set between the lancets.
 * `topY` must stay inside the vertical run of the neighbouring archivolts —
 * above that the capital band reads as a stick crossing the arch crowns.
 */
function column(cx, topY) {
  return `
<g stroke="${colors.ink}" stroke-opacity=".40">
  <path d="M${n(cx - 5)} ${n(springY)}V${n(topY)}" stroke-width="2"/>
  <path d="M${n(cx + 5)} ${n(springY)}V${n(topY)}" stroke-width="2"/>
  <path d="M${n(cx - 9)} ${n(topY)}H${n(cx + 9)}" stroke-width="2.2"/>
  <path d="M${n(cx - 7)} ${n(topY + 8)}H${n(cx + 7)}" stroke-width="1.3" stroke-opacity=".26"/>
  <path d="M${n(cx - 10)} ${n(springY)}H${n(cx + 10)}" stroke-width="2.2"/>
</g>`;
}

/**
 * A buttress pinnacle: a plinth seating it on the facade, the shaft, a crocketed
 * spire and a finial. The plinth and set-off band keep it from floating.
 */
function pinnacle(cx) {
  const shaftTop = 424;
  const apex = 344;
  const crockets = [];
  for (let index = 0; index < 3; index += 1) {
    const y = shaftTop - 14 - index * 22;
    const inset = 4 + index * 4;
    crockets.push(
      `<path d="M${n(cx - 15 + inset)} ${n(y)}l-9 -6 3 10Z" fill="${colors.ink}" fill-opacity=".26"/>`,
      `<path d="M${n(cx + 15 - inset)} ${n(y)}l9 -6 -3 10Z" fill="${colors.ink}" fill-opacity=".26"/>`,
    );
  }
  return `
<g>
  <path d="M${n(cx - 26)} ${n(springY)}V${n(springY - 26)}H${n(cx + 26)}V${n(springY)}Z" fill="${colors.stone}" fill-opacity=".38" stroke="${colors.ink}" stroke-opacity=".38" stroke-width="2"/>
  <path d="M${n(cx - 26)} ${n(springY - 26)}L${n(cx - 17)} ${n(springY - 44)}H${n(cx + 17)}L${n(cx + 26)} ${n(springY - 26)}Z" fill="${colors.stone}" fill-opacity=".30" stroke="${colors.ink}" stroke-opacity=".34" stroke-width="1.6"/>
  <path d="M${n(cx - 17)} ${n(springY - 44)}V${n(shaftTop)}H${n(cx + 17)}V${n(springY - 44)}" fill="${colors.stone}" fill-opacity=".30" stroke="${colors.ink}" stroke-opacity=".40" stroke-width="2.2"/>
  <path d="M${n(cx - 17)} ${n(shaftTop)}L${n(cx)} ${n(apex)}L${n(cx + 17)} ${n(shaftTop)}Z" fill="${colors.stone}" fill-opacity=".34" stroke="${colors.ink}" stroke-opacity=".42" stroke-width="2.2"/>
  <path d="M${n(cx)} ${n(shaftTop)}V${n(apex + 8)}" stroke="${colors.ink}" stroke-opacity=".22" stroke-width="1.2"/>
  <path d="M${n(cx - 20)} ${n(shaftTop + 14)}H${n(cx + 20)}" stroke="${colors.ink}" stroke-opacity=".26" stroke-width="1.4"/>
  <path d="M${n(cx - 12)} ${n(springY - 74)}H${n(cx + 12)}" stroke="${colors.ink}" stroke-opacity=".20" stroke-width="1.2"/>
  ${crockets.join("")}
  <circle cx="${n(cx)}" cy="${n(apex - 9)}" r="6" fill="${colors.glassGold}" fill-opacity=".40" stroke="${colors.ink}" stroke-opacity=".34" stroke-width="1.3"/>
</g>`;
}

/**
 * A dove in profile, built from separate body, wing and tail shapes so it reads
 * as a bird rather than a star. `dir` mirrors it (-1 faces left, 1 faces right)
 * and `tilt` rotates it around its own centre.
 */
function dove(cx, cy, dir, tilt) {
  const body = [
    // Breast up to the head.
    "M-30 10C-22 -2 -8 -9 4 -11",
    // Head and beak.
    "C10 -20 20 -24 28 -22C25 -18 24 -13 25 -9",
    "L38 -6L25 -3",
    // Back of the neck into the shoulder.
    "C22 4 14 8 6 9",
    // Tail sweeping back and down.
    "C-4 12 -14 18 -30 22",
    "C-26 18 -25 14 -30 10Z",
  ].join("");

  const nearWing = [
    "M-2 4C-10 -6 -12 -20 -8 -33",
    "C0 -22 8 -13 16 -8",
    "C10 0 4 4 -2 4Z",
  ].join("");

  const farWing = [
    "M-4 6C-16 12 -30 14 -44 11",
    "C-32 4 -22 -3 -14 -8",
    "C-10 -2 -7 2 -4 6Z",
  ].join("");

  return `
<g transform="translate(${cx} ${cy}) rotate(${tilt}) scale(${dir} 1)">
  <path d="${farWing}" fill="${colors.stone}" fill-opacity=".55" stroke-width="1.5" stroke-opacity=".38"/>
  <path d="${body}" fill="${colors.dove}" stroke-width="1.8" stroke-opacity=".52"/>
  <path d="${nearWing}" fill="${colors.dove}" stroke-width="1.7" stroke-opacity=".48"/>
  <path d="M-6 -20C-2 -13 3 -8 9 -5" fill="none" stroke-width="1.2" stroke-opacity=".30"/>
  <path d="M-16 4C-10 1 -6 -2 -3 -5" fill="none" stroke-width="1.1" stroke-opacity=".24"/>
  <circle cx="20" cy="-14" r="2.1" fill="${colors.ink}" fill-opacity=".62" stroke="none"/>
</g>`;
}

/** A pierced quatrefoil, used to fill the spandrels beside the rose window. */
function quatrefoil(cx, cy, r) {
  const petals = [];
  for (let index = 0; index < 4; index += 1) {
    const angle = (index * 360) / 4;
    const rad = (angle * Math.PI) / 180;
    const px = cx + Math.sin(rad) * r * 0.56;
    const py = cy - Math.cos(rad) * r * 0.56;
    petals.push(
      `<circle cx="${n(px)}" cy="${n(py)}" r="${n(r * 0.5)}" fill="${colors.glassBlue}" fill-opacity=".16" stroke="${colors.ink}" stroke-opacity=".30" stroke-width="1.3"/>`,
    );
  }
  return `<g>${petals.join("")}<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none" stroke="${colors.ink}" stroke-opacity=".26" stroke-width="1.4"/></g>`;
}

// --- plate: paper, stone, facade, rose window, frame ----------------------
const plate = `
<defs>
  <linearGradient id="paper" x1="0" y1="0" x2="0.25" y2="1">
    <stop stop-color="${colors.paper}"/>
    <stop offset="1" stop-color="${colors.paperWarm}"/>
  </linearGradient>
  <pattern id="grain" width="41" height="53" patternUnits="userSpaceOnUse">
    <circle cx="8" cy="15" r="1" fill="${colors.ink}" opacity=".028"/>
    <circle cx="29" cy="39" r=".9" fill="${colors.glassGold}" opacity=".050"/>
  </pattern>
  <radialGradient id="roseCore" cx="0.5" cy="0.5" r="0.5">
    <stop stop-color="${colors.sun}" stop-opacity=".62"/>
    <stop offset="1" stop-color="${colors.glassGold}" stop-opacity=".22"/>
  </radialGradient>
  <linearGradient id="apse" x1="0" y1="0" x2="0" y2="1">
    <stop stop-color="${colors.stone}" stop-opacity=".42"/>
    <stop offset="1" stop-color="${colors.stone}" stop-opacity="0"/>
  </linearGradient>
</defs>
<rect width="1024" height="1536" fill="url(#paper)"/>
<rect width="1024" height="1536" fill="url(#grain)"/>

<!-- the nave wall behind the facade, fading out before the hero text -->
<path d="M168 ${springY}V300C168 214 300 150 512 150C724 150 856 214 856 300V${springY}Z" fill="url(#apse)"/>

<!-- outer frame, interrupted by the rose window -->
<path d="M84 72H940V1464H84Z" fill="none" stroke="${colors.ink}" stroke-width="2" opacity=".22"/>
<path d="M110 98H384" stroke="${colors.ink}" stroke-width="1.2" opacity=".26"/>
<path d="M640 98H914" stroke="${colors.ink}" stroke-width="1.2" opacity=".26"/>

<!-- flanking buttress pinnacles -->
${pinnacle(196)}
${pinnacle(828)}

<!-- three lancet windows under a string course -->
${lancetWindow(430, 594, 186, colors.glassBlue)}
${lancetWindow(252, 404, 150, colors.glassGold)}
${lancetWindow(620, 772, 150, colors.glassGold)}
${column(417, 498)}
${column(607, 498)}
<path d="M236 ${springY}H788" stroke="${colors.ink}" stroke-opacity=".34" stroke-width="2.2"/>
<path d="M252 ${springY - 9}H772" stroke="${colors.ink}" stroke-opacity=".18" stroke-width="1.2"/>

<!-- spandrel quatrefoils beside the rose -->
${quatrefoil(300, 232, 30)}
${quatrefoil(724, 232, 30)}

<!-- rose window -->
${roseCusps()}
<circle cx="${rose.cx}" cy="${rose.cy}" r="${rose.r}" fill="none" stroke="${colors.ink}" stroke-opacity=".46" stroke-width="2.8"/>
<circle cx="${rose.cx}" cy="${rose.cy}" r="${rose.r - 8}" fill="none" stroke="${colors.ink}" stroke-opacity=".28" stroke-width="1.4"/>
${roseSpokesAndFoils()}
${rosePetals()}
${roseCentre()}
`;

// --- foreground layers: full-canvas, true alpha, all above SAFE_BOTTOM -----
// rose-glow   : halo and light motes around the rose window (y 40–370)
// dove-pair   : two doves flanking the window               (y 236–360)
// light-shaft : slanted morning beam through the arch       (y 300–566)
const motes = [
  [368, 300, 4],
  [654, 268, 3.4],
  [420, 366, 3],
  [612, 350, 4.2],
  [332, 176, 3.2],
  [700, 190, 3.6],
];

const layers = [
  {
    id: "rose-glow",
    body: `
<defs>
  <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
    <stop stop-color="${colors.sun}" stop-opacity=".62"/>
    <stop offset=".45" stop-color="${colors.glassGold}" stop-opacity=".26"/>
    <stop offset="1" stop-color="${colors.glassGold}" stop-opacity="0"/>
  </radialGradient>
</defs>
<circle cx="${rose.cx}" cy="${rose.cy}" r="164" fill="url(#halo)"/>
<g stroke="${colors.sun}" stroke-width="2.4" opacity=".38" stroke-linecap="round">
  <path d="M${rose.cx} ${rose.cy - 122}V${rose.cy - 154}"/>
  <path d="M${n(rose.cx + 86)} ${n(rose.cy - 86)}L${n(rose.cx + 109)} ${n(rose.cy - 109)}"/>
  <path d="M${rose.cx + 122} ${rose.cy}H${rose.cx + 154}"/>
  <path d="M${n(rose.cx - 86)} ${n(rose.cy - 86)}L${n(rose.cx - 109)} ${n(rose.cy - 109)}"/>
  <path d="M${rose.cx - 122} ${rose.cy}H${rose.cx - 154}"/>
  <path d="M${n(rose.cx + 86)} ${n(rose.cy + 86)}L${n(rose.cx + 105)} ${n(rose.cy + 105)}" opacity=".7"/>
  <path d="M${n(rose.cx - 86)} ${n(rose.cy + 86)}L${n(rose.cx - 105)} ${n(rose.cy + 105)}" opacity=".7"/>
</g>
<g fill="${colors.sun}">
  ${motes.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill-opacity=".42"/>`).join("")}
</g>`,
  },
  {
    id: "dove-pair",
    body: `
<g stroke="${colors.ink}" stroke-linejoin="round" stroke-linecap="round">
  ${dove(330, 312, -1, -9)}
  ${dove(694, 312, 1, 9)}
</g>`,
  },
  {
    id: "light-shaft",
    body: `
<defs>
  <linearGradient id="beam" x1="0.3" y1="0" x2="0.7" y2="1">
    <stop stop-color="${colors.sun}" stop-opacity=".42"/>
    <stop offset=".6" stop-color="${colors.sun}" stop-opacity=".17"/>
    <stop offset="1" stop-color="${colors.sun}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="beamThin" x1="0.3" y1="0" x2="0.7" y2="1">
    <stop stop-color="${colors.paper}" stop-opacity=".48"/>
    <stop offset="1" stop-color="${colors.paper}" stop-opacity="0"/>
  </linearGradient>
</defs>
<path d="M462 300L566 300L688 566L386 566Z" fill="url(#beam)"/>
<path d="M496 308L536 308L600 560L444 560Z" fill="url(#beamThin)"/>`,
  },
];

const platePath = path.join(workDir, "plate.png");
await sharp(Buffer.from(svg(plate))).png().toFile(platePath);

const rendered = [];
for (const layer of layers) {
  const filePath = path.join(workDir, `layer-${layer.id}.png`);
  await sharp(Buffer.from(svg(layer.body))).ensureAlpha().png().toFile(filePath);

  // Guard the playbook rule: nothing may extend past 38% of the canvas height.
  const { info, data } = await sharp(filePath)
    .extract({ left: 0, top: SAFE_BOTTOM, width: canvas.width, height: canvas.height - SAFE_BOTTOM })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let maxAlpha = 0;
  for (let i = info.channels - 1; i < data.length; i += info.channels) {
    if (data[i] > maxAlpha) maxAlpha = data[i];
  }
  if (maxAlpha > 8) {
    throw new Error(`layer ${layer.id}: ink found below the ${SAFE_BOTTOM}px safe line (alpha ${maxAlpha})`);
  }

  rendered.push({ ...layer, filePath });
}

await sharp(platePath)
  .composite(rendered.map(({ filePath }) => ({ input: filePath })))
  .webp({ quality: 94 })
  .toFile(path.join(themeDir, "artwork.webp"));

// Giftbox envelope: a mini arch with a rose window, matching the theme.
const gift = svg(
  `<rect x="40" y="70" width="340" height="184" rx="10" fill="${colors.paperWarm}" stroke="${colors.ink}" stroke-width="6" stroke-opacity=".5"/>
   <path d="M40 84L210 178 380 84" fill="none" stroke="${colors.ink}" stroke-width="5" stroke-opacity=".42"/>
   <path d="M168 250V150C168 118 186 104 210 92C234 104 252 118 252 150V250" fill="none" stroke="${colors.glassGold}" stroke-width="5"/>
   <circle cx="210" cy="132" r="24" fill="none" stroke="${colors.glassBlue}" stroke-width="4"/>
   <circle cx="210" cy="132" r="9" fill="${colors.glassGold}" fill-opacity=".6"/>`,
  { width: 420, height: 300 },
);
await sharp(Buffer.from(gift)).webp({ lossless: true }).toFile(path.join(giftDir, "envelope.webp"));

process.stdout.write(
  `thanh-duong-anh-sang assets generated\n  npm run templates:prepare-opening-assets -- --slug thanh-duong-anh-sang --plate ${path.relative(root, platePath)} ${rendered
    .map(({ id, filePath }) => `--layer ${id}=${path.relative(root, filePath)}`)
    .join(" ")}\n`,
);
