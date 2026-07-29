#!/usr/bin/env node

/**
 * Sinh artwork gốc cho hai mẫu thiệp Đông Sơn.
 *
 * Mọi hình đều được vẽ bằng SVG trong repo này, vì vậy plate và các layer alpha
 * dùng chung một hệ toạ độ và khớp pixel-perfect với `artwork.webp`.
 *
 * Output:
 *   tmp/dong-son/<slug>/plate.png            nền đã xoá chủ thể chuyển động
 *   tmp/dong-son/<slug>/layer-<id>.png       layer alpha full-canvas
 *   public/chungdoi/images/themes/_decor/<slug>/artwork.webp
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const ROOT = process.cwd();
const CANVAS = { width: 1024, height: 1536 };

/** Bộ sinh số giả ngẫu nhiên có seed để texture luôn tái lập được. */
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function svgDocument(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS.width}" height="${CANVAS.height}" viewBox="0 0 ${CANVAS.width} ${CANVAS.height}">${body}</svg>`;
}

/**
 * Chim Lạc kiểu Đông Sơn: mỏ dài, mào ba chỏm, cánh giương lên, ba dải lông
 * đuôi và hai chân buông về sau. Hình gốc nằm trong khung 162x92, đầu hướng
 * sang trái, nên `flip` sẽ cho chim bay sang phải.
 */
const LAC_BIRD_BOX = { width: 162, height: 92 };

function lacBird({ x, y, scale = 1, rotate = 0, fill, flip = false, opacity = 1 }) {
  const transform = [
    `translate(${x} ${y})`,
    `rotate(${rotate})`,
    `scale(${flip ? -scale : scale} ${scale})`,
  ].join(" ");
  return `<g transform="${transform}" fill="${fill}" opacity="${opacity}">
    <polygon points="0,46 34,37 33,50" />
    <path d="M30,33 C40,23 58,23 72,32 L106,47 L108,56 L70,58 C50,58 36,49 29,43 Z" />
    <polygon points="43,26 50,7 57,25" />
    <polygon points="57,24 67,3 71,22" />
    <path d="M62,33 C76,12 102,2 126,5 C112,20 95,34 86,49 Z" />
    <polygon points="104,44 160,20 158,31 106,50" />
    <polygon points="105,49 162,37 160,48 106,55" />
    <polygon points="104,53 154,56 151,66 104,60" />
    <path d="M98,57 L124,78 M91,57 L108,84" fill="none" stroke="${fill}" stroke-width="3.4" stroke-linecap="round" />
  </g>`;
}

/** Đặt chim vào một điểm trên vòng tròn, mũi bay theo tiếp tuyến. */
function lacBirdOnRing({ cx, cy, radius, angle, scale, fill }) {
  const px = cx + Math.cos(angle) * radius;
  const py = cy + Math.sin(angle) * radius;
  const deg = (angle * 180) / Math.PI + 90;
  const bird = lacBird({
    x: -(LAC_BIRD_BOX.width / 2),
    y: -(LAC_BIRD_BOX.height / 2),
    scale,
    fill,
  });
  return `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${deg.toFixed(1)})">${bird}</g>`;
}

/** Ngôi sao mặt trời nhiều cánh ở tâm mặt trống. */
function sunStar({ cx, cy, rays, inner, outer, fill, stroke, strokeWidth = 2 }) {
  const points = [];
  for (let index = 0; index < rays; index += 1) {
    const tipAngle = (index / rays) * Math.PI * 2 - Math.PI / 2;
    const gapAngle = ((index + 0.5) / rays) * Math.PI * 2 - Math.PI / 2;
    points.push(`${cx + Math.cos(tipAngle) * outer},${cy + Math.sin(tipAngle) * outer}`);
    points.push(`${cx + Math.cos(gapAngle) * inner},${cy + Math.sin(gapAngle) * inner}`);
  }
  const paint = stroke
    ? `fill="${fill ?? "none"}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"`
    : `fill="${fill}"`;
  return `<polygon points="${points.join(" ")}" ${paint} />`;
}

/** Vành răng cưa: tam giác lặp quanh một đường tròn. */
function sawtoothRing({ cx, cy, radius, height, count, fill }) {
  const teeth = [];
  for (let index = 0; index < count; index += 1) {
    const base = (index / count) * Math.PI * 2;
    const step = (Math.PI * 2) / count;
    const a = base;
    const b = base + step * 0.82;
    const mid = base + step * 0.41;
    teeth.push(
      `<polygon points="${cx + Math.cos(a) * radius},${cy + Math.sin(a) * radius} ` +
        `${cx + Math.cos(b) * radius},${cy + Math.sin(b) * radius} ` +
        `${cx + Math.cos(mid) * (radius + height)},${cy + Math.sin(mid) * (radius + height)}" fill="${fill}" />`,
    );
  }
  return teeth.join("");
}

/** Vành văn chữ S: các đoạn xoắn kép lặp quanh đường tròn. */
function spiralRing({ cx, cy, radius, size, count, stroke, width }) {
  const items = [];
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;
    const deg = (angle * 180) / Math.PI + 90;
    const s = size;
    items.push(
      `<g transform="translate(${px} ${py}) rotate(${deg}) scale(${s / 20})">` +
        `<path d="M-18,0 C-18,-11 -4,-13 -4,-3 C-4,3 -11,4 -11,-1 ` +
        `M18,0 C18,11 4,13 4,3 C4,-3 11,-4 11,1" fill="none" ` +
        `stroke="${stroke}" stroke-width="${(width * 20) / s}" stroke-linecap="round" />` +
        `</g>`,
    );
  }
  return items.join("");
}

/** Băng hoa văn hình học ngang, kiểu thang và tam giác trên thân trống. */
function ladderBand({ x, y, width, height, step, stroke, strokeWidth }) {
  const parts = [
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" />`,
  ];
  for (let position = x + step; position < x + width; position += step) {
    parts.push(
      `<line x1="${position}" y1="${y}" x2="${position}" y2="${y + height}" stroke="${stroke}" stroke-width="${strokeWidth}" />`,
    );
  }
  return parts.join("");
}

function triangleBand({ x, y, width, height, count, fill, flip = false }) {
  const step = width / count;
  const parts = [];
  for (let index = 0; index < count; index += 1) {
    const left = x + index * step;
    parts.push(
      flip
        ? `<polygon points="${left},${y + height} ${left + step},${y + height} ${left + step / 2},${y}" fill="${fill}" />`
        : `<polygon points="${left},${y} ${left + step},${y} ${left + step / 2},${y + height}" fill="${fill}" />`,
    );
  }
  return parts.join("");
}

/** Hạt lấm tấm mô phỏng mặt đồng đúc, dùng seed nên luôn giống nhau. */
function speckles({ seed, count, color, minRadius, maxRadius, opacity }) {
  const random = createRandom(seed);
  const dots = [];
  for (let index = 0; index < count; index += 1) {
    const cx = random() * CANVAS.width;
    const cy = random() * CANVAS.height;
    const r = minRadius + random() * (maxRadius - minRadius);
    dots.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(2)}" fill="${color}" />`);
  }
  return `<g opacity="${opacity}">${dots.join("")}</g>`;
}

/* ------------------------------------------------------------------ */
/* Mẫu 1 — Trống Đồng Đông Sơn: mặt trống chính diện, đồng patina tối */
/* ------------------------------------------------------------------ */

const BRONZE = {
  deep: "#0f2b28",
  mid: "#164039",
  patina: "#2f6f61",
  gold: "#cba14a",
  goldSoft: "#e0c07a",
  ivory: "#f2e6c8",
};

/* Mặt trống nằm gọn ở phần trên canvas: hero của renderer neo cụm ngày và tên
   xuống đáy, nên vòng ngoài cùng của đĩa phải kết thúc trước 38% chiều cao để
   không có nét nào cắt qua chữ. */
const DRUM_FACE = { cx: 512, cy: 336, radius: 214 };

function bronzePlate() {
  const { cx, cy, radius } = DRUM_FACE;
  return svgDocument(`
    <defs>
      <radialGradient id="glow" cx="50%" cy="28%" r="62%">
        <stop offset="0%" stop-color="${BRONZE.patina}" stop-opacity="0.85" />
        <stop offset="55%" stop-color="${BRONZE.mid}" stop-opacity="0.9" />
        <stop offset="100%" stop-color="${BRONZE.deep}" stop-opacity="1" />
      </radialGradient>
      <radialGradient id="disc" cx="46%" cy="38%" r="70%">
        <stop offset="0%" stop-color="#317565" />
        <stop offset="62%" stop-color="#1d4f46" />
        <stop offset="100%" stop-color="#12332e" />
      </radialGradient>
    </defs>
    <rect width="${CANVAS.width}" height="${CANVAS.height}" fill="${BRONZE.deep}" />
    <rect width="${CANVAS.width}" height="${CANVAS.height}" fill="url(#glow)" />
    ${speckles({ seed: 21, count: 1400, color: BRONZE.goldSoft, minRadius: 0.6, maxRadius: 2.1, opacity: 0.16 })}
    ${speckles({ seed: 907, count: 520, color: "#0a1f1c", minRadius: 1.2, maxRadius: 4.4, opacity: 0.2 })}

    <circle cx="${cx}" cy="${cy}" r="${radius + 26}" fill="none" stroke="${BRONZE.gold}" stroke-width="2" opacity="0.34" />
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="url(#disc)" />
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${BRONZE.gold}" stroke-width="5" opacity="0.75" />
    <circle cx="${cx}" cy="${cy}" r="${radius - 16}" fill="none" stroke="${BRONZE.goldSoft}" stroke-width="1.6" opacity="0.5" />

    <g opacity="0.3">
      ${ladderBand({ x: 96, y: 148, width: 832, height: 30, step: 32, stroke: BRONZE.goldSoft, strokeWidth: 1.6 })}
    </g>
  `);
}

function bronzeSpiralBands() {
  const { cx, cy, radius } = DRUM_FACE;
  const r = (fraction) => Math.round(radius * fraction);
  return svgDocument(`
    <g opacity="0.9">
      ${spiralRing({ cx, cy, radius: r(0.846), size: r(0.085), count: 22, stroke: BRONZE.goldSoft, width: 2.6 })}
      <circle cx="${cx}" cy="${cy}" r="${r(0.741)}" fill="none" stroke="${BRONZE.gold}" stroke-width="2.2" opacity="0.7" />
      <circle cx="${cx}" cy="${cy}" r="${r(0.537)}" fill="none" stroke="${BRONZE.gold}" stroke-width="2.2" opacity="0.7" />
      ${sawtoothRing({ cx, cy, radius: r(0.423), height: r(0.06), count: 32, fill: BRONZE.gold })}
      <circle cx="${cx}" cy="${cy}" r="${r(0.413)}" fill="none" stroke="${BRONZE.goldSoft}" stroke-width="1.6" opacity="0.6" />
    </g>
  `);
}

function bronzeSunStar() {
  const { cx, cy, radius } = DRUM_FACE;
  const r = (fraction) => Math.round(radius * fraction);
  return svgDocument(`
    <g opacity="0.96">
      ${sunStar({ cx, cy, rays: 14, inner: r(0.114), outer: r(0.318), fill: BRONZE.gold })}
      <circle cx="${cx}" cy="${cy}" r="${r(0.109)}" fill="${BRONZE.goldSoft}" />
      <circle cx="${cx}" cy="${cy}" r="${r(0.075)}" fill="${BRONZE.deep}" opacity="0.55" />
      <circle cx="${cx}" cy="${cy}" r="${r(0.373)}" fill="none" stroke="${BRONZE.goldSoft}" stroke-width="1.8" opacity="0.65" />
    </g>
  `);
}

function bronzeLacBirds() {
  const { cx, cy, radius } = DRUM_FACE;
  const ringRadius = radius * 0.632;
  const count = 8;
  const birds = [];
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    birds.push(
      lacBirdOnRing({
        cx,
        cy,
        radius: ringRadius,
        angle,
        scale: 0.46,
        fill: BRONZE.ivory,
      }),
    );
  }
  return svgDocument(`<g opacity="0.95">${birds.join("")}</g>`);
}

/* ------------------------------------------------------------------ */
/* Mẫu 2 — Chim Lạc: trống nhìn ngang, đàn chim bay chéo, nền ngà     */
/* ------------------------------------------------------------------ */

const IVORY = {
  paper: "#efe4cd",
  paperSoft: "#f8f1e1",
  ink: "#3a2a1e",
  cinnabar: "#a8341f",
  cinnabarSoft: "#c4593c",
  bronze: "#8a6a33",
};

/**
 * Trống nhìn ngang, vẽ theo lối nét mảnh: mặt trống loe, thân thắt, chân bành.
 * Trả về path để dùng cho cả stroke và fill rất nhạt.
 */
function drumProfilePath({ cx, top, height, halfWidth }) {
  const h = height;
  const w = halfWidth;
  return (
    `M${cx - w},${top} ` +
    `L${cx + w},${top} ` +
    `L${cx + w * 0.9},${top + h * 0.24} ` +
    `C${cx + w * 0.72},${top + h * 0.3} ${cx + w * 0.6},${top + h * 0.36} ${cx + w * 0.6},${top + h * 0.46} ` +
    `L${cx + w * 0.6},${top + h * 0.66} ` +
    `C${cx + w * 0.6},${top + h * 0.8} ${cx + w * 0.8},${top + h * 0.9} ${cx + w * 0.94},${top + h} ` +
    `L${cx - w * 0.94},${top + h} ` +
    `C${cx - w * 0.8},${top + h * 0.9} ${cx - w * 0.6},${top + h * 0.8} ${cx - w * 0.6},${top + h * 0.66} ` +
    `L${cx - w * 0.6},${top + h * 0.46} ` +
    `C${cx - w * 0.6},${top + h * 0.36} ${cx - w * 0.72},${top + h * 0.3} ${cx - w * 0.9},${top + h * 0.24} ` +
    `Z`
  );
}

const DRUM_SIDE = { cx: 512, top: 826, height: 486, halfWidth: 244 };

function ivoryPlate() {
  return svgDocument(`
    <defs>
      <linearGradient id="paper" x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0%" stop-color="${IVORY.paperSoft}" />
        <stop offset="48%" stop-color="${IVORY.paper}" />
        <stop offset="100%" stop-color="#e4d7bc" />
      </linearGradient>
    </defs>
    <rect width="${CANVAS.width}" height="${CANVAS.height}" fill="url(#paper)" />
    ${speckles({ seed: 4242, count: 1800, color: IVORY.bronze, minRadius: 0.5, maxRadius: 1.7, opacity: 0.14 })}
    ${speckles({ seed: 88, count: 260, color: IVORY.cinnabar, minRadius: 1, maxRadius: 3, opacity: 0.07 })}

    <line x1="104" y1="188" x2="920" y2="188" stroke="${IVORY.ink}" stroke-width="1.6" opacity="0.22" />
    <line x1="104" y1="198" x2="920" y2="198" stroke="${IVORY.ink}" stroke-width="1" opacity="0.14" />
    <line x1="104" y1="1398" x2="920" y2="1398" stroke="${IVORY.ink}" stroke-width="1.6" opacity="0.26" />
    <line x1="104" y1="1408" x2="920" y2="1408" stroke="${IVORY.ink}" stroke-width="1" opacity="0.16" />
  `);
}

function ivoryFriezeBands() {
  return svgDocument(`
    <g opacity="0.62">
      ${ladderBand({ x: 104, y: 214, width: 816, height: 30, step: 34, stroke: IVORY.bronze, strokeWidth: 1.6 })}
    </g>
    <g opacity="0.7">
      ${triangleBand({ x: 104, y: 1330, width: 816, height: 30, count: 34, fill: IVORY.cinnabar })}
      ${ladderBand({ x: 104, y: 1370, width: 816, height: 22, step: 34, stroke: IVORY.bronze, strokeWidth: 1.5 })}
    </g>
    <g opacity="0.55">
      ${spiralRing({ cx: 512, cy: 1268, radius: 486, size: 26, count: 26, stroke: IVORY.bronze, width: 2.2 })}
    </g>
  `);
}

function ivoryDrumProfile() {
  const { cx, top, height, halfWidth } = DRUM_SIDE;
  const bands = [];
  for (let index = 1; index <= 4; index += 1) {
    const y = top + height * (0.42 + index * 0.06);
    const inset = halfWidth * 0.58;
    bands.push(
      `<line x1="${cx - inset}" y1="${y}" x2="${cx + inset}" y2="${y}" stroke="${IVORY.bronze}" stroke-width="1.6" opacity="0.5" />`,
    );
  }
  const rays = [];
  for (let index = 0; index < 18; index += 1) {
    const x = cx - halfWidth + 12 + (index * (halfWidth * 2 - 24)) / 17;
    rays.push(
      `<line x1="${x.toFixed(1)}" y1="${top + 14}" x2="${x.toFixed(1)}" y2="${top + 40}" stroke="${IVORY.cinnabar}" stroke-width="2" opacity="0.55" />`,
    );
  }
  return svgDocument(`
    <g>
      <path d="${drumProfilePath(DRUM_SIDE)}" fill="${IVORY.cinnabar}" opacity="0.07" />
      <path d="${drumProfilePath(DRUM_SIDE)}" fill="none" stroke="${IVORY.ink}" stroke-width="3" stroke-linejoin="round" opacity="0.7" />
      <line x1="${cx - halfWidth}" y1="${top + 8}" x2="${cx + halfWidth}" y2="${top + 8}" stroke="${IVORY.cinnabar}" stroke-width="3.4" opacity="0.8" />
      <line x1="${cx - halfWidth}" y1="${top + 48}" x2="${cx + halfWidth}" y2="${top + 48}" stroke="${IVORY.cinnabar}" stroke-width="2" opacity="0.5" />
      ${rays.join("")}
      ${bands.join("")}
      <circle cx="${cx}" cy="${top + height * 0.56}" r="52" fill="none" stroke="${IVORY.bronze}" stroke-width="1.8" opacity="0.5" />
      ${sunStar({ cx, cy: top + height * 0.56, rays: 12, inner: 14, outer: 40, fill: IVORY.cinnabar })}
    </g>
  `);
}

/** Đàn chim bay cùng hướng theo một vòng cung thoáng ở nửa trên. */
function ivoryBirdFlock() {
  const flightPath = [
    { x: 118, y: 560, scale: 0.6 },
    { x: 286, y: 470, scale: 0.66 },
    { x: 470, y: 408, scale: 0.72 },
    { x: 664, y: 386, scale: 0.66 },
    { x: 836, y: 402, scale: 0.58 },
  ];
  const birds = flightPath.map(({ x, y, scale }, index) =>
    lacBird({
      x,
      y,
      scale,
      rotate: -14 + index * 5,
      flip: true,
      fill: index === 2 ? IVORY.cinnabar : IVORY.ink,
      opacity: index === 2 ? 0.92 : 0.78,
    }),
  );
  return svgDocument(`<g>${birds.join("")}</g>`);
}

/* ------------------------------------------------------------------ */

const THEMES = [
  {
    slug: "trong-dong-dong-son",
    plate: bronzePlate,
    layers: [
      { id: "spiral-bands", svg: bronzeSpiralBands },
      { id: "sun-star", svg: bronzeSunStar },
      { id: "lac-birds", svg: bronzeLacBirds },
    ],
  },
  {
    slug: "chim-lac-ivory",
    plate: ivoryPlate,
    layers: [
      { id: "frieze-bands", svg: ivoryFriezeBands },
      { id: "drum-profile", svg: ivoryDrumProfile },
      { id: "bird-flock", svg: ivoryBirdFlock },
    ],
  },
];

async function renderTheme(theme) {
  const workDirectory = path.join(ROOT, "tmp/dong-son", theme.slug);
  const themeDirectory = path.join(
    ROOT,
    "public/chungdoi/images/themes/_decor",
    theme.slug,
  );
  await mkdir(workDirectory, { recursive: true });
  await mkdir(themeDirectory, { recursive: true });

  const platePath = path.join(workDirectory, "plate.png");
  await writeFile(path.join(workDirectory, "plate.svg"), theme.plate());
  await sharp(Buffer.from(theme.plate())).png().toFile(platePath);

  const layerPaths = [];
  for (const layer of theme.layers) {
    const layerPath = path.join(workDirectory, `layer-${layer.id}.png`);
    await writeFile(path.join(workDirectory, `layer-${layer.id}.svg`), layer.svg());
    await sharp(Buffer.from(layer.svg()))
      .ensureAlpha()
      .png()
      .toFile(layerPath);
    layerPaths.push({ id: layer.id, filePath: layerPath });
  }

  await sharp(platePath)
    .composite(layerPaths.map(({ filePath }) => ({ input: filePath })))
    .webp({ quality: 92 })
    .toFile(path.join(themeDirectory, "artwork.webp"));

  process.stdout.write(
    `${theme.slug}: artwork + plate + ${layerPaths.length} layer alpha đã sinh\n`,
  );
  process.stdout.write(
    `  npm run templates:prepare-opening-assets -- --slug ${theme.slug} --plate ${path.relative(ROOT, platePath)} ` +
      layerPaths
        .map(({ id, filePath }) => `--layer ${id}=${path.relative(ROOT, filePath)}`)
        .join(" ") +
      "\n",
  );
}

async function main() {
  for (const theme of THEMES) {
    await renderTheme(theme);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
