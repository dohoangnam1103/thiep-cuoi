import { Fraunces } from "next/font/google";

/**
 * Font display RIÊNG của trang chủ v2 (`/home-2`).
 *
 * Cố tình KHÔNG khai báo trong `src/lib/fonts.ts` / `appFontVariables`: làm vậy
 * sẽ nạp font này trên mọi trang, kể cả trang chủ hiện tại. Đặt ở đây thì chỉ
 * route `/home-2` phải trả thêm bytes, và bản home hiện tại không đổi một byte
 * nào.
 *
 * Chọn Fraunces vì ba lý do, theo thứ tự quan trọng:
 * 1. Có subset `vietnamese` thật — đã kiểm tra trên fonts.googleapis.com, dải
 *    U+1EA0-1EF9 và U+01A0-01B0 có mặt. Phần lớn serif display "đẹp" trên
 *    Google Fonts (Instrument Serif, Marcellus, Bodoni Moda) chỉ có latin nên
 *    tiêu đề tiếng Việt sẽ rơi font ngay chữ đầu tiên có dấu.
 * 2. Variable với trục `opsz`: cùng một family phục vụ được tiêu đề 96px và
 *    nhãn 12px mà vẫn giữ đúng tương quan nét thanh/nét đậm.
 * 3. Hai trục `SOFT` + `WONK` làm chân chữ hơi lệch chuẩn — đó là thứ tạo cảm
 *    giác ấn phẩm in chì thay vì serif hình học mặc định.
 */
export const displaySerif = Fraunces({
  subsets: ["latin", "vietnamese"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--hp-font-display",
});
