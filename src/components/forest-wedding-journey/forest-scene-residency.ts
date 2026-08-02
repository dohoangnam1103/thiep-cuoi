export function residentSceneIndices(
  currentIndex: number,
  targetIndex: number | null,
  sceneCount: number,
): number[] {
  const center = targetIndex ?? currentIndex;
  return Array.from(new Set([currentIndex, center - 1, center, center + 1]))
    .filter((index) => index >= 0 && index < sceneCount)
    .sort((a, b) => a - b);
}
