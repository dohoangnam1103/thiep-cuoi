/**
 * Kiểu chuyển động của bìa chưa mở.
 *
 * `classic` là đường mặc định: con dấu nứt 500ms rồi bìa mới bay lên 800ms
 * (xem SEAL_BREAK_MS / ENVELOPE_AWAY_MS trong chungdoi-demo.tsx).
 *
 * `single-panel` dành cho mẫu có bìa LIỀN MỘT MẶT, không con dấu: cả tấm bìa
 * trượt lên trong một nhịp duy nhất ngay khi bấm. Đây KHÔNG phải `openingEffect`
 * của họ art — `assertValidArtOpeningEffect` đòi 3-4 lớp artwork bay và
 * 1300-1500ms, tức mô tả một chuyển động khác hẳn. Nới validator đó để lách một
 * mẫu sẽ hạ chuẩn cho cả họ art, nên biến thể này đứng riêng.
 */
export type CoverVariant = "classic" | "single-panel";

export const singlePanelCoverTemplateSlugs = new Set<string>(["hy-uoc", "uyen-uong", "hong-van-rose"]);

/** Bìa liền một mặt trượt hết trong một nhịp — ngắn hơn 800ms của bìa cổ điển
 *  vì không phải chờ pha con dấu nào phía trước. */
export const SINGLE_PANEL_COVER_AWAY_MS = 700;

export function coverVariantForTemplate(slug: string): CoverVariant {
  return singlePanelCoverTemplateSlugs.has(slug) ? "single-panel" : "classic";
}
