// Keep shared envelope sizing dependency-free so importing it never pulls in Three.js.
export const ENVELOPE_TARGET_PX = 340;
export const ENVELOPE_VERTICAL_RESERVE_PX = 96;

// Chiều cao bìa do nội dung quyết định và bão hoà quanh 518px từ mốc 520px trở lên,
// nên width là thứ duy nhất điều khiển tỉ lệ ở tablet/desktop. Dưới 768px giữ nguyên
// số cũ để bìa trên mobile vẫn dọc như thiết kế gốc.
export function responsiveEnvelopeWidth(viewportWidth: number): number {
  if (viewportWidth >= 1024) return 732;
  if (viewportWidth >= 768) return 640;
  if (viewportWidth >= 640) return 340;
  return 310;
}

export function fitEnvelopeWidth({
  targetWidth,
  ratio,
  viewportWidth,
  viewportHeight,
}: {
  targetWidth: number;
  ratio: number;
  viewportWidth: number;
  viewportHeight: number;
}): number {
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return Math.min(targetWidth, viewportWidth);
  }

  const heightLimitedWidth = Math.max(
    0,
    viewportHeight - ENVELOPE_VERTICAL_RESERVE_PX,
  ) / ratio;
  return Math.min(targetWidth, viewportWidth, heightLimitedWidth);
}
