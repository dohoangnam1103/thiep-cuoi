#!/usr/bin/env node

// Hoa Thư — a classic floral arch cover issued in four deep colourways. The arch
// crowns the top of the canvas and every bloom stays inside the top 38% so the
// hero date/name cluster anchored to the bottom is never crossed by artwork.

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const canvas = { width: 1024, height: 1536 };
const SAFE_BOTTOM = Math.round(canvas.height * 0.38); // 584px — motifs end above this

/** One colourway per template slug. */
const variants = [
  { slug: "hoa-thu-do-ruou-vang", paper: "#fdf8f4", warm: "#f4e7e0", deep: "#7b2b3a", mid: "#a8515f", leaf: "#5c6b4f", ink: "#3a1d24" },
  { slug: "hoa-thu-xanh-la", paper: "#fbfcf8", warm: "#e9efe4", deep: "#3f6b4f", mid: "#6b9070", leaf: "#4f6b3f", ink: "#22321f" },
  { slug: "hoa-thu-hong", paper: "#fdf8fa", warm: "#f6e5ea", deep: "#b8607a", mid: "#d493a6", leaf: "#6b7a55", ink: "#452431" },
  { slug: "hoa-thu-xanh-duong", paper: "#f8fafd", warm: "#e5ecf5", deep: "#33567f", mid: "#6b88ad", leaf: "#4f6b62", ink: "#1e2c3f" },
];

const svg = (body, size = canvas) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">${body}</svg>`;

/** The arch that frames the couple photograph, shared by plate and frame layer. */
const arch = { cx: 512, top: 148, width: 520, bottom: 556 };
const archPath = (() => {
  const left = arch.cx - arch.width / 2;
  const right = arch.cx + arch.width / 2;
  const radius = arch.width / 2;
  const shoulder = arch.top + radius;
  return `M${left} ${arch.bottom}V${shoulder}A${radius} ${radius} 0 0 1 ${right} ${shoulder}V${arch.bottom}Z`;
})();

function plateBody(c) {
  return `
<defs>
  <linearGradient id="paper" x1="0" y1="0" x2="0.35" y2="1">
    <stop stop-color="${c.paper}"/>
    <stop offset="1" stop-color="${c.warm}"/>
  </linearGradient>
  <pattern id="grain" width="39" height="43" patternUnits="userSpaceOnUse">
    <circle cx="7" cy="11" r="1" fill="${c.ink}" opacity=".026"/>
    <circle cx="27" cy="31" r=".9" fill="${c.deep}" opacity=".045"/>
  </pattern>
</defs>
<rect width="1024" height="1536" fill="url(#paper)"/>
<rect width="1024" height="1536" fill="url(#grain)"/>
<rect x="80" y="68" width="864" height="1400" fill="none" stroke="${c.deep}" stroke-width="2.4" opacity=".34"/>
<rect x="98" y="86" width="828" height="1364" fill="none" stroke="${c.mid}" stroke-width="1" opacity=".26"/>
<path d="${archPath}" fill="${c.warm}" opacity=".55"/>
`;
}

/** A single rotated bloom: five petals around a small centre. */
function bloom(x, y, scale, fill, centre, opacity) {
  const petals = Array.from({ length: 5 }, (_, index) => {
    const deg = index * 72;
    return `<ellipse cx="${x}" cy="${y - 13 * scale}" rx="${7 * scale}" ry="${13 * scale}" transform="rotate(${deg} ${x} ${y})"/>`;
  }).join("");
  return `<g fill="${fill}" opacity="${opacity}">${petals}</g><circle cx="${x}" cy="${y}" r="${4.4 * scale}" fill="${centre}" opacity="${Math.min(1, opacity + 0.16)}"/>`;
}

/** A leaf sprig: a stem with paired leaves along it. */
function sprig(x, y, deg, length, fill, opacity) {
  const leaves = Array.from({ length: 5 }, (_, index) => {
    const t = (index + 1) / 6;
    const ly = -length * t;
    const size = 15 * (1 - t * 0.45);
    return (
      `<ellipse cx="${size * 0.85}" cy="${ly}" rx="${size * 0.85}" ry="${size * 0.34}" transform="rotate(-26 ${size * 0.85} ${ly})"/>` +
      `<ellipse cx="${-size * 0.85}" cy="${ly - 7}" rx="${size * 0.85}" ry="${size * 0.34}" transform="rotate(26 ${-size * 0.85} ${ly - 7})"/>`
    );
  }).join("");
  return `<g transform="translate(${x} ${y}) rotate(${deg})" fill="${fill}" opacity="${opacity}"><path d="M0 0V${-length}" stroke="${fill}" stroke-width="2" fill="none" opacity=".8"/>${leaves}</g>`;
}

function layerBodies(c) {
  const left = arch.cx - arch.width / 2;
  const right = arch.cx + arch.width / 2;

  return [
    {
      id: "arch-frame",
      body: `
<g>
  <path d="${archPath}" fill="none" stroke="${c.deep}" stroke-width="6" opacity=".9"/>
  <path d="${archPath}" fill="none" stroke="${c.mid}" stroke-width="1.6" opacity=".55" transform="translate(0 14) scale(1 0.965)" transform-origin="${arch.cx} ${arch.bottom}"/>
  <path d="M${left + 46} ${arch.bottom}H${right - 46}" stroke="${c.deep}" stroke-width="2" opacity=".42"/>
</g>`,
    },
    {
      id: "crown-blooms",
      body: `
<g>
  ${bloom(512, 132, 1.5, c.deep, c.paper, 0.92)}
  ${bloom(432, 168, 1.1, c.mid, c.paper, 0.82)}
  ${bloom(596, 170, 1.15, c.mid, c.paper, 0.82)}
  ${bloom(366, 226, 0.85, c.deep, c.paper, 0.7)}
  ${bloom(660, 230, 0.9, c.deep, c.paper, 0.7)}
  ${sprig(478, 116, -18, 74, c.leaf, 0.6)}
  ${sprig(548, 118, 18, 78, c.leaf, 0.6)}
</g>`,
    },
    {
      id: "side-garland",
      body: `
<g>
  ${sprig(196, 470, -8, 210, c.leaf, 0.62)}
  ${sprig(828, 474, 8, 206, c.leaf, 0.62)}
  ${bloom(184, 292, 1.05, c.deep, c.paper, 0.78)}
  ${bloom(842, 296, 1.05, c.deep, c.paper, 0.78)}
  ${bloom(224, 380, 0.75, c.mid, c.paper, 0.62)}
  ${bloom(800, 384, 0.75, c.mid, c.paper, 0.62)}
</g>`,
    },
    {
      id: "petal-fall",
      body: `
<g fill="${c.mid}">
  <ellipse cx="292" cy="118" rx="9" ry="4.2" opacity=".46" transform="rotate(-24 292 118)"/>
  <ellipse cx="726" cy="126" rx="9" ry="4.2" opacity=".46" transform="rotate(22 726 126)"/>
  <ellipse cx="150" cy="196" rx="10" ry="4.6" opacity=".42" transform="rotate(-12 150 196)"/>
  <ellipse cx="880" cy="204" rx="10" ry="4.6" opacity=".42" transform="rotate(14 880 204)"/>
  <ellipse cx="132" cy="392" rx="8" ry="3.8" opacity=".36" transform="rotate(-30 132 392)"/>
  <ellipse cx="892" cy="398" rx="8" ry="3.8" opacity=".36" transform="rotate(30 892 398)"/>
  <ellipse cx="262" cy="536" rx="9" ry="4.2" opacity=".32" transform="rotate(-16 262 536)"/>
  <ellipse cx="760" cy="540" rx="9" ry="4.2" opacity=".32" transform="rotate(18 760 540)"/>
  <ellipse cx="404" cy="104" rx="7" ry="3.4" opacity=".38" transform="rotate(-8 404 104)"/>
  <ellipse cx="620" cy="102" rx="7" ry="3.4" opacity=".38" transform="rotate(10 620 102)"/>
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
