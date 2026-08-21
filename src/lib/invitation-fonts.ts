/**
 * Hệ 2 font cho thiệp.
 *
 * Mỗi thiệp chỉ được dùng đúng 2 font family:
 *  - **display**: tên cô dâu chú rể, heading section, label. Là 1 trong 14 class
 *    `.font-art-*` khai ở `src/app/globals.css`.
 *  - **body**: toàn bộ text còn lại (họ tên gia đình, địa chỉ, ngày giờ, lời
 *    chúc, nút). Chỉ có 2 lựa chọn: `.font-body-serif` (Lora) hoặc
 *    `.font-body-sans` (Be Vietnam Pro).
 *
 * Body được suy ra TỪ display thay vì khai tay theo từng slug, vì:
 *  1. Không phải bảo trì bảng 83 slug, và thiệp mới tự có cặp hợp lệ.
 *  2. Người dùng đổi font trong editor (`InvitationContent.fontFamily`) thì body
 *     tự đổi theo cho khớp tông, không bị lệch cặp.
 *
 * Nguyên tắc ghép: display thư pháp/serif đi với body serif; display brush đậm
 * hoặc grotesque đi với body sans.
 */

export type InvitationBodyFontClass = "font-body-serif" | "font-body-sans";

const BODY_FONT_BY_DISPLAY: Readonly<Record<string, InvitationBodyFontClass>> = {
  // Thư pháp & serif trang trí → body serif
  "font-art-uni": "font-body-serif",
  "font-art-qellia": "font-body-serif",
  "font-art-lora": "font-body-serif",
  "font-art-new-eddy": "font-body-serif",
  "font-art-nautigal": "font-body-serif",
  "font-art-alex": "font-body-serif",
  "font-art-signora": "font-body-serif",
  "font-art-aghita": "font-body-serif",
  // Brush đậm & grotesque → body sans
  "font-art-haydon": "font-body-sans",
  "font-art-pattaya": "font-body-sans",
  "font-art-pacifico": "font-body-sans",
  "font-art-built": "font-body-sans",
  "font-art-helvetica": "font-body-sans",
  "font-art-marvin": "font-body-sans",
};

export const DEFAULT_INVITATION_BODY_FONT: InvitationBodyFontClass = "font-body-serif";

/** Body font hợp tông với `displayFontClass`. Class lạ thì về serif. */
export function invitationBodyFontClass(displayFontClass: string): InvitationBodyFontClass {
  return BODY_FONT_BY_DISPLAY[displayFontClass] ?? DEFAULT_INVITATION_BODY_FONT;
}

/** Danh sách class display hợp lệ, dùng cho test và cho editor. */
export const INVITATION_DISPLAY_FONT_CLASSES = Object.keys(BODY_FONT_BY_DISPLAY);
