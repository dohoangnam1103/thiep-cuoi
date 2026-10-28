/** Leave at least one second of the track audible. */
export function musicStartLimit(duration: number | undefined): number {
  return duration && Number.isFinite(duration) && duration > 1 ? Math.floor(duration - 1) : 0;
}

export function clampMusicStart(seconds: unknown, duration?: number): number {
  const start = typeof seconds === "number" && Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const limit = musicStartLimit(duration);
  return limit ? Math.min(start, limit) : start;
}

/** Friendly label when a stored track has no catalog title. */
export function fallbackMusicTitle(src: string): string {
  const file = src.split("/").pop()?.replace(/\.mp3$/i, "") ?? "";
  return file
    .split(/[-_]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toLocaleUpperCase("vi") + word.slice(1))
    .join(" ");
}

export function musicTime(seconds: number): string {
  const time = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}`;
}

/**
 * Decorative seek waveform. Peaks are stable per track so the diagram does not
 * jump between renders; the real duration always comes from audio metadata.
 */
export function musicWavePeaks(src: string, count = 72): number[] {
  let seed = 2166136261;
  for (let index = 0; index < src.length; index += 1) {
    seed ^= src.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }
  return Array.from({ length: count }, (_, index) => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    const noise = ((seed >>> 0) % 1000) / 1000;
    const envelope = 0.35 + 0.65 * Math.abs(Math.sin((index / count) * Math.PI * 3.2 + 0.6));
    return Math.round(8 + (noise * 0.65 + envelope * 0.35) * 40);
  });
}

/** Diacritic-insensitive matching for the locally bundled default track. */
export function normalizeMusicSearch(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
