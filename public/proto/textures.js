// Procedural texture generation for the forest prototype.
// Everything is drawn on a 2D canvas at load time so the prototype needs no
// binary assets. The production pipeline would bake equivalent atlases offline.

import * as THREE from "./three.module.js";

function createCanvas(size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function toTexture(canvas, { srgb = true } = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function mulberry32(seed) {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

// A single tapered grass blade drawn as a filled bezier ribbon.
function drawBlade(ctx, { x, y, height, width, lean, hueShift, random }) {
  const tipX = x + lean * height;
  const tipY = y - height;
  const ctrlX = x + lean * height * 0.35;
  const ctrlY = y - height * 0.55;

  const gradient = ctx.createLinearGradient(x, y, tipX, tipY);
  const base = 26 + hueShift * 8;
  gradient.addColorStop(0, `hsl(${88 + hueShift * 14}, 42%, ${base}%)`);
  gradient.addColorStop(0.55, `hsl(${84 + hueShift * 12}, 46%, ${base + 12}%)`);
  gradient.addColorStop(1, `hsl(${72 + hueShift * 16}, 58%, ${base + 26}%)`);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(x - width * 0.5, y);
  ctx.quadraticCurveTo(ctrlX - width * 0.32, ctrlY, tipX, tipY);
  ctx.quadraticCurveTo(ctrlX + width * 0.32, ctrlY, x + width * 0.5, y);
  ctx.closePath();
  ctx.fill();

  // Centre rib keeps the blade from reading as a flat sliver.
  ctx.strokeStyle = `hsla(${70 + hueShift * 10}, 55%, ${base + 30}%, 0.5)`;
  ctx.lineWidth = Math.max(1, width * 0.12);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
  ctx.stroke();

  if (random() > 0.6) {
    ctx.strokeStyle = "rgba(255, 246, 214, 0.35)";
    ctx.lineWidth = Math.max(1, width * 0.08);
    ctx.beginPath();
    ctx.moveTo(x + width * 0.18, y);
    ctx.quadraticCurveTo(ctrlX + width * 0.18, ctrlY, tipX, tipY);
    ctx.stroke();
  }
}

// A tuft of blades filling one cross-quad face.
export function createGrassTexture(size = 512) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext("2d");
  const random = mulberry32(0x51f3a1);

  ctx.clearRect(0, 0, size, size);

  const bladeCount = 11;
  for (let index = 0; index < bladeCount; index += 1) {
    const t = index / (bladeCount - 1);
    const centreBias = 1 - Math.abs(t - 0.5) * 1.35;
    drawBlade(ctx, {
      x: size * (0.1 + t * 0.8) + (random() - 0.5) * size * 0.05,
      y: size * 0.995,
      height: size * (0.42 + centreBias * 0.5 + random() * 0.12),
      width: size * (0.035 + random() * 0.028),
      lean: (t - 0.5) * 1.5 + (random() - 0.5) * 0.35,
      hueShift: random(),
      random,
    });
  }

  return toTexture(canvas);
}

// Flat scale-like spray, matching arborvitae / thuja hedging.
export function createConiferTexture(size = 512) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext("2d");
  const random = mulberry32(0x2ba97c);

  ctx.clearRect(0, 0, size, size);

  const drawFrond = (originX, originY, length, angle, depth, scale) => {
    if (depth > 3) return;
    const endX = originX + Math.sin(angle) * length;
    const endY = originY - Math.cos(angle) * length;

    const shade = 22 + depth * 7 + random() * 6;
    ctx.strokeStyle = `hsl(${104 - depth * 5}, ${38 + depth * 6}%, ${shade}%)`;
    ctx.lineWidth = Math.max(1.2, scale * (5 - depth));
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    const branches = depth === 0 ? 9 : 5;
    for (let index = 1; index <= branches; index += 1) {
      const t = index / (branches + 1);
      const branchX = originX + (endX - originX) * t;
      const branchY = originY + (endY - originY) * t;
      const spread = 0.55 + random() * 0.35;
      const childLength = length * (0.42 - depth * 0.06) * (1 - t * 0.45);
      drawFrond(branchX, branchY, childLength, angle - spread, depth + 1, scale * 0.7);
      drawFrond(branchX, branchY, childLength, angle + spread, depth + 1, scale * 0.7);
    }
  };

  // Three overlapping sprays give the billboard visual depth.
  drawFrond(size * 0.5, size * 0.99, size * 0.62, 0, 0, 1);
  drawFrond(size * 0.32, size * 0.94, size * 0.5, -0.28, 0, 0.85);
  drawFrond(size * 0.68, size * 0.94, size * 0.5, 0.28, 0, 0.85);

  // Sun-facing highlight along the upper right, matching late-afternoon light.
  const highlight = ctx.createLinearGradient(size * 0.35, size, size, 0);
  highlight.addColorStop(0, "rgba(255, 236, 168, 0)");
  highlight.addColorStop(1, "rgba(255, 236, 168, 0.4)");
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = highlight;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "source-over";

  return toTexture(canvas);
}

export function createBarkTexture(width = 256, height = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const random = mulberry32(0x7c41d2);

  ctx.fillStyle = "#4a3a2c";
  ctx.fillRect(0, 0, width, height);

  for (let index = 0; index < 220; index += 1) {
    const x = random() * width;
    const stripeWidth = 2 + random() * 9;
    const lightness = 14 + random() * 22;
    ctx.fillStyle = `hsl(${26 + random() * 14}, ${18 + random() * 16}%, ${lightness}%)`;
    let y = 0;
    while (y < height) {
      const segment = 24 + random() * 90;
      const jitter = (random() - 0.5) * 5;
      ctx.fillRect(x + jitter, y, stripeWidth, segment);
      y += segment + random() * 14;
    }
  }

  // Sunlit side.
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0.45)");
  gradient.addColorStop(0.62, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, "rgba(255, 224, 160, 0.28)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

export function createPetalTexture(size = 256) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);

  const centreX = size * 0.5;
  const centreY = size * 0.5;

  ctx.save();
  ctx.translate(centreX, centreY);
  ctx.rotate(-0.3);

  const gradient = ctx.createRadialGradient(
    -size * 0.08,
    -size * 0.1,
    size * 0.04,
    0,
    0,
    size * 0.46,
  );
  gradient.addColorStop(0, "rgba(255, 255, 252, 1)");
  gradient.addColorStop(0.62, "rgba(252, 248, 236, 0.98)");
  gradient.addColorStop(1, "rgba(238, 228, 206, 0.82)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.44);
  ctx.bezierCurveTo(size * 0.34, -size * 0.3, size * 0.3, size * 0.26, 0, size * 0.44);
  ctx.bezierCurveTo(-size * 0.3, size * 0.26, -size * 0.34, -size * 0.3, 0, -size * 0.44);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(214, 200, 172, 0.5)";
  ctx.lineWidth = size * 0.008;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.4);
  ctx.lineTo(0, size * 0.4);
  ctx.stroke();

  ctx.restore();
  return toTexture(canvas);
}

// Soft radial mask reused for blob contact shadows.
export function createBlobShadowTexture(size = 128) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(
    size * 0.5,
    size * 0.5,
    0,
    size * 0.5,
    size * 0.5,
    size * 0.5,
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0.55)");
  gradient.addColorStop(0.55, "rgba(0, 0, 0, 0.24)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return toTexture(canvas, { srgb: false });
}
