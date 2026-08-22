/**
 * Nhịp khoảng trắng dọc giữa các khối (section) của trang marketing.
 *
 * Trước đây mỗi section tự đặt padding riêng: `sm:py-16`, `sm:py-20`,
 * `sm:py-24`. Hai section cạnh nhau cộng padding của nhau nên khoảng trống thật
 * giữa hai khối lên tới 160-176px ở desktop, đo được bằng khoảng cách từ đáy
 * chữ cuối khối trước tới đỉnh tiêu đề khối sau. Trang trông trống trải.
 *
 * Dùng một hằng số duy nhất để nhịp không lệch lại. Mọi section ở trang chủ và
 * các khối dùng chung (FAQ) phải lấy từ đây.
 *
 * py-8    = 32px mỗi bên → khoảng trống giữa 2 khối 64px  (mobile, giữ nguyên)
 * sm:py-12 = 48px mỗi bên → khoảng trống giữa 2 khối 96px (desktop, từ 160-176)
 */
export const sectionPaddingClass = "py-8 sm:py-12";
