#!/usr/bin/env node

// Phong Thư — a soft modern cover built from a paper envelope and a wax seal,
// issued in five pastel colourways. Every motif stays inside the top 38% of the
// canvas so the hero date/name cluster anchored to the bottom is never crossed.

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const canvas = { width: 1024, height: 1536 };
const SAFE_BOTTOM = Math.round(canvas.height * 0.38); // 584px — motifs end above this

/** One colourway per template slug. */
const variants = [
  { slug: "phong-thu-be", paper: "#fdfaf4", warm: "#f2ebdd", panel: "#e9dcc6", accent: "#b08d5f", ink: "#4a3a29" },
  { slug: "phong-thu-luc-pastel", paper: "#fbfcf9", warm: "#eaf1e8", panel: "#dce9da", accent: "#6f8f76", ink: "#2f4238" },
  { slug: "phong-thu-do-pastel", paper: "#fdf8f6", warm: "#f6e6e1", panel: "#f0d8d1", accent: "#b5695f", ink: "#4d2a26" },
  { slug: "phong-thu-lam-pastel", paper: "#f9fbfd", warm: "#e7eef6", panel: "#dbe6f1", accent: "#6382a6", ink: "#27364a" },
  { slug: "phong-thu-hong-pastel", paper: "#fdf8fa", warm: "#f7e8ee", panel: "#f2dae3", accent: "#b8748c", ink: "#4a2b36" },
];

const svg = (body, size = canvas) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">${body}</svg>`;

/** Envelope geometry, shared by the plate shadow and the animated flap layer. */
const envelope = { left: 272, top: 196, width: 480, height: 288 };
const flapTip = { x: 512, y: 372 };

function plateBody(c) {
  return `
<defs>
  <linearGradient id="paper" x1="0" y1="0" x2="0.35" y2="1">
    <stop stop-color="${c.paper}"/>
    <stop offset="1" stop-color="${c.warm}"/>
  </linearGradient>
  <radialGradient id="wash" cx="0.5" cy="0.16" r="0.62">
    <stop stop-color="${c.panel}" stop-opacity=".85"/>
    <stop offset="1" stop-color="${c.panel}" stop-opacity="0"/>
  </radialGradient>
  <pattern id="grain" width="41" height="45" patternUnits="userSpaceOnUse">
    <circle cx="8" cy="12" r="1" fill="${c.ink}" opacity=".028"/>
    <circle cx="29" cy="33" r=".9" fill="${c.accent}" opacity=".05"/>
  </pattern>
</defs>
<rect width="1024" height="1536" fill="url(#paper)"/>
<rect width="1024" height="1536" fill="url(#wash)"/>
<rect width="1024" height="1536" fill="url(#grain)"/>
<rect x="86" y="74" width="852" height="1388" fill="none" stroke="${c.accent}" stroke-width="2" opacity=".32"/>
<rect x="104" y="92" width="816" height="1352" fill="none" stroke="${c.accent}" stroke-width="1" opacity=".18"/>
`;
}

/** A single rotated petal. */
function petal(x, y, deg, rx, ry, fill, opacity) {
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${opacity}" transform="rotate(${deg} ${x} ${y})"/>`;
}

const petalDrift = [
  [150, 152, -28, 11, 5, 0.5],
  [206, 296, 18, 9, 4.2, 0.42],
  [132, 428, -12, 12, 5.4, 0.46],
  [224, 522, 34, 8, 3.8, 0.36],
  [876, 158, 22, 11, 5, 0.5],
  [828, 302, -20, 9, 4.2, 0.42],
  [898, 430, 14, 12, 5.4, 0.46],
  [800, 524, -34, 8, 3.8, 0.36],
  [398, 138, -8, 10, 4.6, 0.4],
  [622, 146, 12, 10, 4.6, 0.4],
  [512, 542, 0, 12, 5.2, 0.34],
  [342, 558, -22, 9, 4, 0.3],
  [690, 556, 24, 9, 4, 0.3],
  [512, 116, 90, 8, 3.6, 0.32],
];

function layerBodies(c) {
  const { left, top, width, height } = envelope;
  const right = left + width;
  const bottom = top + height;

  return [
    {
      id: "envelope-body",
      body: `
<defs>
  <linearGradient id="paperFace" x1="0" y1="0" x2="0.4" y2="1">
    <stop stop-color="${c.paper}"/>
    <stop offset="1" stop-color="${c.warm}"/>
  </linearGradient>
</defs>
<g>
  <rect x="${left}" y="${top}" width="${width}" height="${height}" rx="12" fill="url(#paperFace)" stroke="${c.accent}" stroke-width="2.4" opacity=".96"/>
  <path d="M${left} ${bottom}L${flapTip.x} ${top + 116} ${right} ${bottom}" fill="none" stroke="${c.accent}" stroke-width="1.4" opacity=".28"/>
  <path d="M${left + 34} ${top + 58}H${right - 34}" stroke="${c.ink}" stroke-width="1.2" opacity=".14"/>
  <path d="M${left + 34} ${top + 84}H${right - 96}" stroke="${c.ink}" stroke-width="1.2" opacity=".1"/>
</g>`,
    },
    {
      id: "envelope-flap",
      body: `
<defs>
  <linearGradient id="flapFace" x1="0" y1="0" x2="0.2" y2="1">
    <stop stop-color="${c.panel}"/>
    <stop offset="1" stop-color="${c.warm}"/>
  </linearGradient>
</defs>
<g>
  <path d="M${left} ${top}H${right}L${flapTip.x} ${flapTip.y}Z" fill="url(#flapFace)" stroke="${c.accent}" stroke-width="2.2" opacity=".96"/>
  <path d="M${left + 26} ${top + 16}L${flapTip.x} ${flapTip.y - 30} ${right - 26} ${top + 16}" fill="none" stroke="${c.accent}" stroke-width="1.2" opacity=".3"/>
</g>`,
    },
    {
      id: "wax-seal",
      body: `
<g>
  <circle cx="${flapTip.x}" cy="${flapTip.y}" r="46" fill="${c.accent}" opacity=".94"/>
  <circle cx="${flapTip.x}" cy="${flapTip.y}" r="46" fill="none" stroke="${c.ink}" stroke-width="1.6" opacity=".22"/>
  <circle cx="${flapTip.x}" cy="${flapTip.y}" r="33" fill="none" stroke="${c.paper}" stroke-width="1.8" opacity=".55"/>
  <path d="M${flapTip.x} ${flapTip.y - 20}L${flapTip.x + 7} ${flapTip.y - 6} ${flapTip.x + 21} ${flapTip.y} ${flapTip.x + 7} ${flapTip.y + 6} ${flapTip.x} ${flapTip.y + 20} ${flapTip.x - 7} ${flapTip.y + 6} ${flapTip.x - 21} ${flapTip.y} ${flapTip.x - 7} ${flapTip.y - 6}Z" fill="${c.paper}" opacity=".8"/>
  ${petalDrift
    .slice(0, 6)
    .map(([x, y, deg, rx, ry, op]) => petal(x, y, deg, rx * 0.7, ry * 0.7, c.accent, op * 0.5))
    .join("\n  ")}
</g>`,
    },
    {
      id: "petal-drift",
      body: `
<g>
  ${petalDrift.map(([x, y, deg, rx, ry, op]) => petal(x, y, deg, rx, ry, c.accent, op)).join("\n  ")}
</g>`,
    },
  ];
}

async function assertSafeZone(filePath, id) {
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
    throw new Error(`layer ${id}: ink found below the ${SAFE_BOTTOM}px safe line (alpha ${maxAlpha})`);
  }
}

for (const variant of variants) {
  const workDir = path.join(root, "tmp", variant.slug);
  const themeDir = path.join(root, "public/chungdoi/images/themes/_decor", variant.slug);
  await Promise.all([mkdir(workDir, { recursive: true }), mkdir(themeDir, { recursive: true })]);

  const platePath = path.join(workDir, "plate.png");
  await sharp(Buffer.from(svg(plateBody(variant)))).png().toFile(platePath);

  const rendered = [];
  for (const layer of layerBodies(variant)) {
    const filePath = path.join(workDir, `layer-${layer.id}.png`);
    await sharp(Buffer.from(svg(layer.body))).ensureAlpha().png().toFile(filePath);
    await assertSafeZone(filePath, layer.id);
    rendered.push({ ...layer, filePath });
  }

  await sharp(platePath)
    .composite(rendered.map(({ filePath }) => ({ input: filePath })))
    .webp({ quality: 94 })
    .toFile(path.join(themeDir, "artwork.webp"));

  process.stdout.write(
    `${variant.slug}: artwork + ${rendered.length} layers\n  npm run templates:prepare-opening-assets -- --slug ${variant.slug} --plate tmp/${variant.slug}/plate.png ${rendered
      .map(({ id }) => `--layer ${id}=tmp/${variant.slug}/layer-${id}.png`)
      .join(" ")}\n`,
  );
}
