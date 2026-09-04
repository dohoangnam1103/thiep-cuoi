#!/usr/bin/env node

// Cổng cưới lá dừa — a Mekong Delta wedding gate: two bamboo poles lashed into an
// arch, coconut fronds woven over the crown and hanging down both edges, and a
// bunch of areca nuts tied at the centre. Every motif stays inside the top 38% of
// the canvas so the hero name/date cluster anchored to the bottom stays clear.

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const slug = "cong-la-dua-mien-tay";
const canvas = { width: 1024, height: 1536 };
const SAFE_BOTTOM = Math.round(canvas.height * 0.38); // 584px — motifs end above this

const c = {
  paper: "#eef4e8",
  warm: "#e1ebd6",
  card: "#ffffff",
  ink: "#26402b",
  leaf: "#3f6b45",
  leafLight: "#7f9c72",
  muted: "#b6c9ac",
  accent: "#d98f3d",
};

const svg = (body, size = canvas) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">${body}</svg>`;

/** The gate opening that frames the couple photograph. */
const arch = { cx: 512, top: 152, width: 560, bottom: 548 };
const archLeft = arch.cx - arch.width / 2;
const archRight = arch.cx + arch.width / 2;
const archRadius = arch.width / 2;
const archShoulder = arch.top + archRadius;
const archPath = `M${archLeft} ${arch.bottom}V${archShoulder}A${archRadius} ${archRadius} 0 0 1 ${archRight} ${archShoulder}V${arch.bottom}Z`;

/** Rattan lashings spaced along the bamboo arch. */
function lashings() {
  return Array.from({ length: 9 }, (_, index) => {
    const deg = -74 + index * 18.5;
    const rad = (deg * Math.PI) / 180;
    const x = arch.cx + Math.sin(rad) * archRadius;
    const y = archShoulder - Math.cos(rad) * archRadius;
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(1)})"><rect x="-3.4" y="-11" width="6.8" height="22" rx="3" fill="${c.accent}" opacity=".5"/></g>`;
  }).join("");
}

function plateBody() {
  return `
<defs>
  <linearGradient id="paper" x1="0" y1="0" x2="0.3" y2="1">
    <stop stop-color="${c.paper}"/>
    <stop offset="1" stop-color="${c.warm}"/>
  </linearGradient>
  <pattern id="grain" width="41" height="37" patternUnits="userSpaceOnUse">
    <circle cx="9" cy="13" r="1" fill="${c.ink}" opacity=".03"/>
    <circle cx="29" cy="27" r=".9" fill="${c.leaf}" opacity=".05"/>
  </pattern>
</defs>
<rect width="1024" height="1536" fill="url(#paper)"/>
<rect width="1024" height="1536" fill="url(#grain)"/>
<rect x="78" y="66" width="868" height="1404" fill="none" stroke="${c.leaf}" stroke-width="2.2" opacity=".32"/>
<rect x="96" y="84" width="832" height="1368" fill="none" stroke="${c.muted}" stroke-width="1" opacity=".5"/>
<path d="${archPath}" fill="${c.card}" opacity=".5"/>
<path d="M${archLeft} ${arch.bottom}V${archShoulder}A${archRadius} ${archRadius} 0 0 1 ${archRight} ${archShoulder}V${arch.bottom}" fill="none" stroke="${c.ink}" stroke-width="7" opacity=".46" stroke-linecap="round"/>
<path d="M${archLeft + 13} ${arch.bottom}V${archShoulder}A${archRadius - 13} ${archRadius - 13} 0 0 1 ${archRight - 13} ${archShoulder}V${arch.bottom}" fill="none" stroke="${c.leafLight}" stroke-width="1.6" opacity=".42"/>
${lashings()}
`;
}

/**
 * One coconut frond: a curving rib with paired leaflets that grow then taper.
 * `deg` rotates the whole frond, `bendX` pushes the tip sideways.
 */
function frond(x, y, deg, length, scale, fill, opacity, bendX = 20) {
  const count = 15;
  const leaflets = Array.from({ length: count }, (_, index) => {
    const t = (index + 1) / (count + 1);
    const ly = -length * t;
    const rx = bendX * t * t;
    const size = 62 * scale * Math.sin(Math.PI * (0.16 + t * 0.74));
    const drop = size * 0.86;
    return (
      `<path d="M${rx.toFixed(1)} ${ly.toFixed(1)}q${(size * 0.72).toFixed(1)} ${(-drop * 0.3).toFixed(1)} ${size.toFixed(1)} ${(-drop).toFixed(1)}q${(-size * 0.46).toFixed(1)} ${(drop * 0.14).toFixed(1)} ${(-size).toFixed(1)} ${drop.toFixed(1)}Z"/>` +
      `<path d="M${rx.toFixed(1)} ${(ly + 7).toFixed(1)}q${(-size * 0.72).toFixed(1)} ${(-drop * 0.3).toFixed(1)} ${(-size).toFixed(1)} ${(-drop).toFixed(1)}q${(size * 0.46).toFixed(1)} ${(drop * 0.14).toFixed(1)} ${size.toFixed(1)} ${drop.toFixed(1)}Z"/>`
    );
  }).join("");
  const rib = `<path d="M0 0Q${(bendX * 0.3).toFixed(1)} ${(-length * 0.58).toFixed(1)} ${bendX} ${-length}" stroke="${fill}" stroke-width="${(4 * scale).toFixed(1)}" fill="none" stroke-linecap="round" opacity=".92"/>`;
  return `<g transform="translate(${x} ${y}) rotate(${deg})" fill="${fill}" opacity="${opacity}">${rib}${leaflets}</g>`;
}

/** A bunch of areca nuts hanging from a short stalk, wrapped by betel leaves. */
function arecaCluster(x, y, scale) {
  const rows = [
    { dy: 0, xs: [-26, 0, 26] },
    { dy: 30, xs: [-40, -14, 14, 40] },
    { dy: 60, xs: [-30, -4, 22] },
    { dy: 88, xs: [-14, 12] },
  ];
  const nuts = rows
    .flatMap(({ dy, xs }, rowIndex) =>
      xs.map((dx) => {
        const r = (19 - rowIndex * 1.6) * scale;
        return `<ellipse cx="${(dx * scale).toFixed(1)}" cy="${(dy * scale).toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * 1.16).toFixed(1)}" fill="${c.accent}" opacity=".86"/><ellipse cx="${(dx * scale - r * 0.3).toFixed(1)}" cy="${(dy * scale - r * 0.34).toFixed(1)}" rx="${(r * 0.34).toFixed(1)}" ry="${(r * 0.4).toFixed(1)}" fill="${c.card}" opacity=".34"/>`;
      }),
    )
    .join("");
  const betel = [-1, 1]
    .map(
      (side) =>
        `<path d="M${(side * 52 * scale).toFixed(1)} ${(-6 * scale).toFixed(1)}q${(side * 54 * scale).toFixed(1)} ${(22 * scale).toFixed(1)} ${(side * 24 * scale).toFixed(1)} ${(84 * scale).toFixed(1)}q${(-side * 44 * scale).toFixed(1)} ${(-32 * scale).toFixed(1)} ${(-side * 24 * scale).toFixed(1)} ${(-84 * scale).toFixed(1)}Z" fill="${c.leaf}" opacity=".72"/>`,
    )
    .join("");
  return `<g transform="translate(${x} ${y})"><path d="M0 ${(-46 * scale).toFixed(1)}V${(6 * scale).toFixed(1)}" stroke="${c.leaf}" stroke-width="${(5 * scale).toFixed(1)}" stroke-linecap="round" opacity=".8"/>${betel}${nuts}</g>`;
}

function layerBodies() {
  return [
    {
      id: "left-frond",
      body: `
<g>
  ${frond(210, 512, -14, 356, 1, c.leaf, 0.82, 46)}
  ${frond(268, 300, 58, 300, 0.86, c.leafLight, 0.72, 34)}
  ${frond(150, 372, -34, 232, 0.7, c.leaf, 0.6, 26)}
</g>`,
    },
    {
      id: "right-frond",
      body: `
<g>
  ${frond(814, 512, 14, 356, 1, c.leaf, 0.82, -46)}
  ${frond(756, 300, -58, 300, 0.86, c.leafLight, 0.72, -34)}
  ${frond(874, 372, 34, 232, 0.7, c.leaf, 0.6, -26)}
</g>`,
    },
    {
      id: "areca-cluster",
      body: `
<g>
  ${arecaCluster(512, 176, 1)}
  ${arecaCluster(382, 236, 0.58)}
  ${arecaCluster(642, 236, 0.58)}
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

const workDir = path.join(root, "tmp", slug);
const themeDir = path.join(root, "public/chungdoi/images/themes/_decor", slug);
await Promise.all([mkdir(workDir, { recursive: true }), mkdir(themeDir, { recursive: true })]);

const platePath = path.join(workDir, "plate.png");
await sharp(Buffer.from(svg(plateBody()))).png().toFile(platePath);

const rendered = [];
for (const layer of layerBodies()) {
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
  `${slug}: artwork + ${rendered.length} layers\n  npm run templates:prepare-opening-assets -- --slug ${slug} --plate tmp/${slug}/plate.png ${rendered
    .map(({ id }) => `--layer ${id}=tmp/${slug}/layer-${id}.png`)
    .join(" ")}\n`,
);
