/** Dữ liệu một mẫu thiệp đã đủ để render ở client, gồm cả kích thước thật của
 *  ảnh preview.
 *
 *  Vì sao phải mang theo kích thước: ảnh listing là screenshot full-page, cao
 *  tới hơn 9000px và mỗi mẫu một chiều cao khác nhau. Hiệu ứng "cuộn cả thiệp"
 *  cần đúng tỉ lệ thật, nếu đưa sai `height` cho next/image thì ảnh bị bóp méo.
 *  Trang chủ hiện tại giải quyết bằng một bảng hardcode 20 chiều cao trong
 *  `chungdoi-clone.tsx` — bảng đó sẽ lệch ngay khi ảnh preview được chụp lại.
 *  Ở đây đo trực tiếp từ file (xem `listing-sizes.ts`) nên không bao giờ lệch. */
export type TemplateShotData = {
  slug: string;
  name: string;
  category: string;
  color: string;
  isNew: boolean;
  /** Đường dẫn ảnh screenshot full-page trong /public. */
  listing: string;
  listingWidth: number;
  listingHeight: number;
  /** Đường dẫn trang demo tiếng Việt, tính sẵn ở server.
   *
   *  Nhờ có sẵn ở đây, phía client không cần import `@/data/chungdoi` chỉ để tra
   *  slug — trang chủ hiện tại kéo cả mảng `templates` (42 mẫu, đủ cả title,
   *  description, highlights) vào bundle client vì lý do đó. */
  demoPath: string;
};
