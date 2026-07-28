export type OpeningAssetRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type OpeningMotionFrame = {
  offset: number;
  xPercent: number;
  yPercent: number;
  scale: number;
  rotateDeg: number;
  blurPx: number;
  brightness: number;
  opacity: number;
};

export type OpeningEffectLayer = {
  id: string;
  src: string;
  rect: OpeningAssetRect;
  transformOrigin: `${number}% ${number}%`;
  delayMs: number;
  easing: string;
  startOpacity: number;
  peak: OpeningMotionFrame & { offset: 0.24 };
  hold: OpeningMotionFrame & { offset: 0.7 };
  exit: OpeningMotionFrame & { offset: 1 };
  optional: true;
};

export type ArtOpeningEffect = {
  id: string;
  canvas: { width: number; height: number };
  durationMs: number;
  plateSrc: string;
  layers: readonly OpeningEffectLayer[];
  reducedMotion: { durationMs: number };
};

export type OpeningEffectAssetManifest = {
  canvas: { width: number; height: number };
  plateSrc: string;
  layers: readonly {
    id: string;
    src: string;
    rect: OpeningAssetRect;
  }[];
};

function assertFinitePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }
}

export function assertValidArtOpeningEffect(effect: ArtOpeningEffect): void {
  if (!effect.id.trim()) throw new Error("opening effect id is required");
  assertFinitePositive(effect.canvas.width, "canvas width");
  assertFinitePositive(effect.canvas.height, "canvas height");

  if (effect.durationMs < 1300 || effect.durationMs > 1500) {
    throw new Error("opening effect duration must be between 1300 and 1500ms");
  }
  if (
    effect.reducedMotion.durationMs < 160 ||
    effect.reducedMotion.durationMs > 220
  ) {
    throw new Error("reduced-motion duration must be between 160 and 220ms");
  }
  if (!effect.plateSrc.startsWith("/") || effect.plateSrc.endsWith("/artwork.webp")) {
    throw new Error("opening plate must be a public path separate from artwork.webp");
  }
  if (effect.layers.length < 3 || effect.layers.length > 4) {
    throw new Error("opening effect must contain 3 or 4 layers");
  }

  const ids = new Set<string>();
  const sources = new Set<string>();
  for (const layer of effect.layers) {
    if (!layer.id.trim()) throw new Error("opening layer id is required");
    if (ids.has(layer.id)) throw new Error(`duplicate layer id: ${layer.id}`);
    ids.add(layer.id);

    if (!layer.src.startsWith("/") || layer.src.endsWith("/artwork.webp")) {
      throw new Error(`${layer.id}: foreground must be a public path separate from artwork.webp`);
    }
    if (sources.has(layer.src)) throw new Error(`duplicate layer source: ${layer.src}`);
    sources.add(layer.src);

    if (layer.hold.opacity < 0.9 || layer.hold.blurPx !== 0) {
      throw new Error(`${layer.id}: hold frame must stay visible and sharp outside the card`);
    }

    const { x, y, width, height } = layer.rect;
    assertFinitePositive(width, `${layer.id} rect width`);
    assertFinitePositive(height, `${layer.id} rect height`);
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < 0 ||
      y < 0 ||
      x + width > effect.canvas.width ||
      y + height > effect.canvas.height
    ) {
      throw new Error(`${layer.id}: rect is outside canvas`);
    }
  }
}
