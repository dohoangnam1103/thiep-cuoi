#!/usr/bin/env node

// Thánh Đường Ánh Sáng — gothic double arch, a stained-glass rose window and a
// pair of doves rising through morning light.
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
  ink: "#1e3a5f",
  glassBlue: "#2d6fa0",
  glassGold: "#c9922f",
  glassRose: "#b8607a",
  dove: "#fdfcf8",
  sun: "#e8c67a",
};

// Rose window and arch geometry — all values well above SAFE_BOTTOM (584).
const rose = { cx: 512, cy: 168, r: 92 };
const archTop = 268;
const archBase = 556;

const svg = (body, size = canvas) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">${body}</svg>`;

// --- rose window petals drawn as static plate detail -----------------------
function rosePetals() {
  const petals = [];
  for (let index = 0; index < 8; index += 1) {
    const angle = (index * 360) / 8;
    const fill = index % 2 === 0 ? colors.glassBlue : colors.glassGold;
    petals.push(
      `<path d="M${rose.cx} ${rose.cy - 26}C${rose.cx + 20} ${rose.cy - 52} ${rose.cx + 20} ${rose.cy - 74} ${rose.cx} ${rose.cy - 84}C${rose.cx - 20} ${rose.cy - 74} ${rose.cx - 20} ${rose.cy - 52} ${rose.cx} ${rose.cy - 26}Z" fill="${fill}" fill-opacity=".42" transform="rotate(${angle} ${rose.cx} ${rose.cy})"/>`,
    );
  }
  return petals.join("");
}

// --- plate: paper, grain, gothic arches, rose window, frame rule -----------
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
    <stop stop-color="${colors.sun}" stop-opacity=".55"/>
    <stop offset="1" stop-color="${colors.glassGold}" stop-opacity=".18"/>
  </radialGradient>
</defs>
<rect width="1024" height="1536" fill="url(#paper)"/>
<rect width="1024" height="1536" fill="url(#grain)"/>

<!-- outer ogee frame -->
<path d="M84 72H940V1464H84Z" fill="none" stroke="${colors.ink}" stroke-width="2" opacity=".22"/>
<path d="M110 98H914" stroke="${colors.ink}" stroke-width="1" opacity=".24"/>

<!-- gothic double arch, nét mỏng, hoàn toàn trên safe line -->
<g fill="none" stroke="${colors.ink}" stroke-width="1.6" opacity=".34">
  <path d="M262 ${archBase}V404C262 322 306 288 374 ${archTop}C442 288 486 322 486 404V${archBase}"/>
  <path d="M538 ${archBase}V404C538 322 582 288 650 ${archTop}C718 288 762 322 762 404V${archBase}"/>
  <path d="M290 ${archBase}V416C290 344 328 314 374 300C420 314 458 344 458 416V${archBase}" opacity=".55"/>
  <path d="M566 ${archBase}V416C566 344 604 314 650 300C696 314 734 344 734 416V${archBase}" opacity=".55"/>
</g>

<!-- rose window: static stained glass -->
<circle cx="${rose.cx}" cy="${rose.cy}" r="${rose.r}" fill="none" stroke="${colors.ink}" stroke-width="2.2" opacity=".40"/>
<circle cx="${rose.cx}" cy="${rose.cy}" r="${rose.r - 12}" fill="none" stroke="${colors.ink}" stroke-width="1.2" opacity=".26"/>
${rosePetals()}
<circle cx="${rose.cx}" cy="${rose.cy}" r="26" fill="url(#roseCore)"/>
<circle cx="${rose.cx}" cy="${rose.cy}" r="26" fill="none" stroke="${colors.ink}" stroke-width="1.4" opacity=".34"/>
<circle cx="${rose.cx}" cy="${rose.cy}" r="9" fill="${colors.glassRose}" fill-opacity=".38"/>
`;

// --- foreground layers: full-canvas, true alpha, all above SAFE_BOTTOM -----
// rose-glow   : halo radiating from the rose window (y 18–318)
// dove-pair   : two doves flanking the window       (y 196–330)
// light-shaft : slanted morning beam through the arch (y 104–540)
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
<circle cx="${rose.cx}" cy="${rose.cy}" r="150" fill="url(#halo)"/>
<g stroke="${colors.sun}" stroke-width="2" opacity=".34" stroke-linecap="round">
  <path d="M${rose.cx} ${rose.cy - 112}V${rose.cy - 142}"/>
  <path d="M${rose.cx + 79} ${rose.cy - 79}L${rose.cx + 100} ${rose.cy - 100}"/>
  <path d="M${rose.cx + 112} ${rose.cy}H${rose.cx + 142}"/>
  <path d="M${rose.cx - 79} ${rose.cy - 79}L${rose.cx - 100} ${rose.cy - 100}"/>
  <path d="M${rose.cx - 112} ${rose.cy}H${rose.cx - 142}"/>
</g>`,
  },
  {
    id: "dove-pair",
    body: `
<g fill="${colors.dove}" stroke="${colors.ink}" stroke-width="1.1" stroke-opacity=".28">
  <!-- left dove, gliding outward -->
  <path d="M300 268c14-9 30-11 45-6 8-14 21-22 36-23-6 9-8 18-6 27 13 4 23 13 27 25-14-6-27-6-40 1-9 12-23 19-38 19 7-8 11-17 11-27-13-2-25-8-35-16Z"/>
  <path d="M336 265c9-16 24-27 42-31-10 12-16 25-17 39" fill="none" stroke-opacity=".34"/>
  <!-- right dove, mirrored -->
  <path d="M724 268c-14-9-30-11-45-6-8-14-21-22-36-23 6 9 8 18 6 27-13 4-23 13-27 25 14-6 27-6 40 1 9 12 23 19 38 19-7-8-11-17-11-27 13-2 25-8 35-16Z"/>
  <path d="M688 265c-9-16-24-27-42-31 10 12 16 25 17 39" fill="none" stroke-opacity=".34"/>
</g>`,
  },
  {
    id: "light-shaft",
    body: `
<defs>
  <linearGradient id="beam" x1="0.3" y1="0" x2="0.7" y2="1">
    <stop stop-color="${colors.sun}" stop-opacity=".40"/>
    <stop offset=".6" stop-color="${colors.sun}" stop-opacity=".16"/>
    <stop offset="1" stop-color="${colors.sun}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="beamThin" x1="0.3" y1="0" x2="0.7" y2="1">
    <stop stop-color="${colors.paper}" stop-opacity=".46"/>
    <stop offset="1" stop-color="${colors.paper}" stop-opacity="0"/>
  </linearGradient>
</defs>
<path d="M470 104L560 104L680 540L392 540Z" fill="url(#beam)"/>
<path d="M498 112L536 112L596 528L448 528Z" fill="url(#beamThin)"/>`,
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
