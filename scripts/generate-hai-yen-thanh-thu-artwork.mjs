#!/usr/bin/env node

// Hải Yến Thanh Thư — a pair of sea swallows crossing a watercolour bay wash.
// Every motif stays inside the top 38% of the canvas so the hero date/name
// cluster anchored to the bottom is never crossed by artwork.

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const canvas = { width: 1024, height: 1536 };
const SAFE_BOTTOM = Math.round(canvas.height * 0.38); // 584px — motifs must end above this

const workDir = path.join(root, "tmp/hai-yen-thanh-thu");
const themeDir = path.join(root, "public/chungdoi/images/themes/_decor/hai-yen-thanh-thu");
const giftDir = path.join(root, "public/chungdoi/images/giftbox/hai-yen-thanh-thu");

const colors = {
  paper: "#fdfbf7",
  paperWarm: "#f4f3ef",
  sea: "#2d8fbe",
  seaDeep: "#1988ae",
  seaPale: "#7bc8e8",
  ink: "#123a52",
  sand: "#e8dcc8",
  sun: "#f5c98a",
};

const svg = (body, size = canvas) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">${body}</svg>`;

// --- plate: paper, grain, a low horizon wash and the frame rule -------------
const plate = `
<defs>
  <linearGradient id="paper" x1="0" y1="0" x2="0.3" y2="1">
    <stop stop-color="${colors.paper}"/>
    <stop offset="1" stop-color="${colors.paperWarm}"/>
  </linearGradient>
  <pattern id="grain" width="43" height="47" patternUnits="userSpaceOnUse">
    <circle cx="9" cy="13" r="1" fill="${colors.ink}" opacity=".030"/>
    <circle cx="31" cy="35" r=".9" fill="${colors.sea}" opacity=".055"/>
  </pattern>
</defs>
<rect width="1024" height="1536" fill="url(#paper)"/>
<rect width="1024" height="1536" fill="url(#grain)"/>
<path d="M86 74H938V1462H86Z" fill="none" stroke="${colors.sea}" stroke-width="2" opacity=".30"/>
<path d="M112 100H912" stroke="${colors.seaDeep}" stroke-width="1" opacity=".26"/>
`;

// --- foreground layers: each is full-canvas with true alpha ----------------
// wave-wash  : foam trim hugging the lower edge of the photograph (y 440–578,
//              dissolved to nothing by the `fade` mask before the safe line)
// swallow-pair: four distant gull silhouettes clear of the sun (y 192–300)
// spray-dots : white foam flecks along the wave crest (y 434–479)
const layers = [
  {
    id: "wave-wash",
    body: `
<defs>
  <linearGradient id="w1" x1="0" y1="0" x2="1" y2="0.4">
    <stop stop-color="${colors.seaPale}" stop-opacity=".30"/>
    <stop offset="1" stop-color="${colors.sea}" stop-opacity=".20"/>
  </linearGradient>
  <clipPath id="frame"><rect x="88" y="76" width="848" height="1384"/></clipPath>
  <linearGradient id="w2" x1="1" y1="0" x2="0" y2="0.5">
    <stop stop-color="${colors.seaDeep}" stop-opacity=".18"/>
    <stop offset="1" stop-color="${colors.sea}" stop-opacity=".10"/>
  </linearGradient>
  <linearGradient id="dissolve" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="1"/>
    <stop offset=".55" stop-color="#fff" stop-opacity=".7"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <mask id="fade" maskUnits="userSpaceOnUse" x="0" y="430" width="1024" height="150">
    <rect x="0" y="430" width="1024" height="150" fill="url(#dissolve)"/>
  </mask>
</defs>
<g clip-path="url(#frame)" mask="url(#fade)">
  <path d="M40 470C200 444 320 480 452 466s268-36 420-16c60 8 100 14 128 18v70c-160-22-268 10-420 26s-236-12-364 2c-84 10-152 10-204 6Z" fill="url(#w1)"/>
  <path d="M40 508C214 486 330 512 470 500s262-28 420-12c56 6 92 10 116 14v58c-148-14-252 10-404 24s-232-8-360 4c-74 8-136 8-180 6Z" fill="url(#w2)"/>
  <path d="M40 464C210 436 366 468 502 454s280-38 486-18" fill="none" stroke="${colors.seaDeep}" stroke-width="2" opacity=".26" stroke-linecap="round"/>
  <path d="M40 530C204 512 380 532 506 522s268-26 482-14" fill="none" stroke="${colors.sea}" stroke-width="1.6" opacity=".18" stroke-linecap="round"/>
</g>`,
  },
  {
    id: "swallow-pair",
    body: `
<g fill="none" stroke="${colors.ink}" stroke-linecap="round" stroke-linejoin="round">
  <path d="M258 232C272 208 289 204 300 222C311 204 328 208 342 232" stroke-width="6" opacity=".82"/>
  <path d="M714 274C725 256 737 253 744 267C751 253 763 256 774 274" stroke-width="5" opacity=".72"/>
  <path d="M636 206C643 194 651 192 656 201C661 192 669 194 676 206" stroke-width="4" opacity=".58"/>
  <path d="M366 300C372 289 379 287 384 296C389 287 396 289 402 300" stroke-width="3.4" opacity=".46"/>
</g>`,
  },
  {
    id: "spray-dots",
    body: `
<g fill="${colors.paper}">
  <circle cx="150" cy="456" r="3.2" opacity=".72"/>
  <circle cx="212" cy="447" r="2.2" opacity=".6"/>
  <circle cx="286" cy="452" r="3.6" opacity=".68"/>
  <circle cx="352" cy="461" r="2.1" opacity=".54"/>
  <circle cx="428" cy="466" r="3.0" opacity=".66"/>
  <circle cx="498" cy="456" r="2.4" opacity=".58"/>
  <circle cx="566" cy="449" r="3.4" opacity=".7"/>
  <circle cx="640" cy="443" r="2.2" opacity=".54"/>
  <circle cx="712" cy="440" r="2.9" opacity=".64"/>
  <circle cx="788" cy="438" r="2.3" opacity=".56"/>
  <circle cx="862" cy="437" r="3.1" opacity=".62"/>
</g>
<g fill="${colors.paper}">
  <circle cx="182" cy="466" r="1.9" opacity=".44"/>
  <circle cx="322" cy="472" r="2.2" opacity=".46"/>
  <circle cx="466" cy="476" r="1.8" opacity=".4"/>
  <circle cx="604" cy="462" r="2.1" opacity=".44"/>
  <circle cx="750" cy="452" r="1.9" opacity=".4"/>
  <circle cx="898" cy="446" r="2.0" opacity=".38"/>
</g>`,
  },
];

await Promise.all([
  mkdir(workDir, { recursive: true }),
  mkdir(themeDir, { recursive: true }),
  mkdir(giftDir, { recursive: true }),
]);

/**
 * A real sea photograph (Poly Haven CC0, prepared by
 * `scripts/prepare-hai-yen-sea-photos.mjs`) feathered top and bottom so it
 * dissolves into the paper instead of sitting in a hard rectangle.
 */
const seaBand = { top: 150, left: 112, width: 800, height: 400 };

async function featheredSeaBand() {
  const photo = path.join(
    root,
    "public/chungdoi/images/themes/_decor/hai-yen-thanh-thu/photo/sea-hero.webp",
  );
  const pixels = await sharp(photo)
    .resize({ width: seaBand.width, height: seaBand.height, fit: "cover", position: "center" })
    .removeAlpha()
    .toBuffer();

  // Feather all four edges so the photograph has no visible rectangle: a
  // vertical ramp for top/bottom, multiplied by a horizontal ramp for the sides.
  const feather = await sharp(
    Buffer.from(
      svg(
        `<defs>
           <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
             <stop stop-color="#000"/>
             <stop offset=".2" stop-color="#c8c8c8"/>
             <stop offset=".66" stop-color="#a0a0a0"/>
             <stop offset="1" stop-color="#000"/>
           </linearGradient>
           <linearGradient id="h" x1="0" y1="0" x2="1" y2="0">
             <stop stop-color="#000"/>
             <stop offset=".14" stop-color="#fff"/>
             <stop offset=".86" stop-color="#fff"/>
             <stop offset="1" stop-color="#000"/>
           </linearGradient>
         </defs>
         <rect width="${seaBand.width}" height="${seaBand.height}" fill="url(#v)"/>
         <rect width="${seaBand.width}" height="${seaBand.height}" fill="url(#h)" style="mix-blend-mode:multiply"/>`,
        seaBand,
      ),
    ),
  )
    .greyscale()
    .toColourspace("b-w")
    .raw()
    .toBuffer();

  return sharp(pixels)
    .joinChannel(feather, {
      raw: { width: seaBand.width, height: seaBand.height, channels: 1 },
    })
    .png()
    .toBuffer();
}

const platePath = path.join(workDir, "plate.png");
await sharp(Buffer.from(svg(plate)))
  .composite([{ input: await featheredSeaBand(), top: seaBand.top, left: seaBand.left }])
  .png()
  .toFile(platePath);

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

const gift = svg(
  `<path d="M42 96L210 22 378 96V254H42Z" fill="${colors.sea}" stroke="${colors.paper}" stroke-width="8"/>
   <path d="M42 96L210 196 378 96" fill="none" stroke="${colors.paper}" stroke-width="7"/>
   <path d="M42 254L156 156M378 254L264 156" stroke="${colors.seaDeep}" stroke-width="5" opacity=".7"/>
   <path d="M158 176c30-40 66-54 104-47-26 14-40 30-47 48 26-12 53-10 77 5-33 2-56 14-70 37-13-21-35-35-64-43Z" fill="${colors.paper}"/>`,
  { width: 420, height: 300 },
);
await sharp(Buffer.from(gift)).webp({ lossless: true }).toFile(path.join(giftDir, "envelope.webp"));

process.stdout.write(
  `hai-yen-thanh-thu assets generated\n  npm run templates:prepare-opening-assets -- --slug hai-yen-thanh-thu --plate ${path.relative(root, platePath)} ${rendered
    .map(({ id, filePath }) => `--layer ${id}=${path.relative(root, filePath)}`)
    .join(" ")}\n`,
);
