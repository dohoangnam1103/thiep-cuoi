/**
 * Thang cỡ chữ dùng chung cho các trang marketing + dashboard
 * (Home, Mẫu thiệp, Pricing, Dashboard).
 *
 * Trước đây mỗi trang tự viết literal Tailwind riêng nên cùng một cấp bậc
 * (tiêu đề block, mô tả block...) lại ra 3-4 cỡ khác nhau. Mọi cỡ chữ ở các
 * trang đó giờ phải lấy từ file này để giữ đồng đều.
 *
 * Quy ước: hằng số CHỈ chứa font-size / line-height / weight / letter-spacing /
 * font-family. Màu (`text-foreground`, `text-muted-foreground`...), margin và
 * layout vẫn đặt tại nơi dùng.
 *
 * Class phải viết thành literal đầy đủ (kể cả tiền tố `sm:`), KHÔNG ghép bằng
 * template string từ hằng số nhỏ hơn — Tailwind quét chuỗi literal trong source
 * nên `sm:${SIZE}` sẽ không sinh ra utility tương ứng.
 *
 * Đơn vị: dưới `text-sm` (14px) thang mặc định của Tailwind không còn bước nào,
 * nên dùng giá trị rem tùy ý (11px/13px/15px) thay vì tụt hẳn xuống 12px —
 * giảm nhẹ chứ không làm chữ nhỏ đột ngột. Dùng rem chứ không dùng px để vẫn
 * tôn trọng cỡ chữ gốc người dùng đặt trong trình duyệt.
 *   0.6875rem = 11px · 0.8125rem = 13px · 0.9375rem = 15px
 *
 * Thang dọc (mobile → xl):
 *   pageTitle    20 → 24 → 30 → 36 → 48 px
 *   sectionTitle 18 → 20 → 24 → 30 px
 *   blockTitle   16 → 18 px
 *   cardTitle    16 px
 *   sectionDesc  13 → 15 px
 *   body         13 px
 *   bodySmall    11 px
 */

/** H1 của trang (hero Home, hero Mẫu thiệp, hero Pricing). Một trang một cái. */
export const pageTitleClass =
  "font-heading text-xl font-black leading-[1.08] tracking-tight sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl";

/** H2 tiêu đề của từng block/section. */
export const sectionTitleClass =
  "font-heading text-lg font-black leading-tight sm:text-xl md:text-2xl lg:text-3xl";

/** H3 tiêu đề con bên trong một block (bước hướng dẫn, cột nhỏ...). */
export const blockTitleClass = "font-heading text-base font-black sm:text-lg";

/** Tiêu đề card (card mẫu thiệp, card thiệp trong dashboard). */
export const cardTitleClass = "font-heading text-base font-black";

/** Tiêu đề trên thumbnail/card nhỏ (deck thiệp ở hero) — cấp thấp nhất. */
export const thumbTitleClass = "font-heading text-[0.8125rem] font-black";

/** Mô tả ngay dưới tiêu đề của từng block. */
export const sectionDescClass =
  "text-[0.8125rem] leading-[1.65] sm:text-[0.9375rem] sm:leading-[1.7]";

/** Nội dung thường: đoạn văn, item danh sách, ô bảng. */
export const bodyClass = "text-[0.8125rem] leading-[1.6]";

/** Chữ phụ: meta, caption, chú thích nhỏ trong card. */
export const bodySmallClass = "text-[0.6875rem] leading-[1.5]";

/** Eyebrow phía trên tiêu đề block. */
export const eyebrowClass =
  "text-[0.6875rem] font-black uppercase leading-4 tracking-[0.22em]";

/** Nhãn nhóm: label filter, heading cột footer, nhãn gói giá. */
export const labelClass =
  "text-[0.6875rem] font-black uppercase leading-4 tracking-[0.18em]";

/**
 * Ghi chú thêm — luôn in nghiêng để tách khỏi nội dung chính.
 * Vd: "Tạo miễn phí - Dùng thử 3 ngày - Chỉ trả khi bạn hài lòng",
 * "Những mẫu thiệp độc đáo đang chờ bạn", "Xem video hướng dẫn chi tiết".
 */
export const noteClass = "text-[0.8125rem] italic leading-[1.6]";

/** Ghi chú thêm cỡ nhỏ, dùng khi nằm trong card/khối đã chật. */
export const noteSmallClass = "text-[0.6875rem] italic leading-[1.5]";

/** CTA chính (nút hành động lớn của block). */
export const ctaPrimaryClass = "text-[0.9375rem] font-bold";

/** CTA phụ / nút thứ cấp. */
export const ctaSecondaryClass = "text-[0.8125rem] font-bold";

/** Pill, badge, nút nhỏ trong card. */
export const pillClass = "text-[0.6875rem] font-bold";

/** Con số thống kê lớn (dashboard). */
export const statValueClass = "text-xl font-bold";

/** Giá gói chính ở trang Pricing. */
export const priceMainClass = "font-heading text-3xl font-black sm:text-4xl";

/** Giá gói phụ ở trang Pricing. */
export const priceAltClass = "font-heading text-2xl font-black sm:text-3xl";

/** H1 các trang trong dashboard (dùng font Pattaya, không phải font-heading). */
export const dashboardTitleClass = "font-pattaya text-2xl";

/**
 * Heading trong dashboard giữ weight `semibold` (giao diện app, mềm hơn trang
 * marketing dùng `font-black`) — chỉ thống nhất phần cỡ chữ.
 */

/** H2 của một panel trong dashboard. */
export const panelTitleClass = "font-heading text-base font-semibold sm:text-lg";

/** H3 / tiêu đề khối con trong dashboard. */
export const panelSubTitleClass = "font-heading text-base font-semibold";
