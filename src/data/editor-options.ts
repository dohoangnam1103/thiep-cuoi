// Tùy chọn tĩnh cho form editor. Thư mục public/ không đọc được ở client runtime,
// nên liệt kê tay theo font đã khai báo @font-face trong globals.css.

export type SelectOption = { value: string; label: string };

/** Font khớp với @font-face trong src/app/globals.css. Value = tên font-family. */
export const FONT_OPTIONS: SelectOption[] = [
  { value: "", label: "Mặc định (theo mẫu)" },
  { value: "Fz Aghita", label: "Fz Aghita" },
  { value: "Fz Qellia", label: "Fz Qellia" },
  { value: "Pattaya", label: "Pattaya" },
  { value: "SVN-HC Pacifico", label: "SVN-HC Pacifico" },
  { value: "SVN-HC Haydon Brush", label: "SVN-HC Haydon Brush" },
  { value: "SVN-HC Marvin Visions", label: "SVN-HC Marvin Visions" },
  { value: "SVN-HC Built Titling", label: "SVN-HC Built Titling" },
  { value: "HelveticaNeue", label: "Helvetica Neue" },
];

/** Thứ bậc khớp bảng chuẩn hoá trong EditorForm (normalizeBirthOrder). "" = tự nhập. */
export const BIRTH_ORDER_OPTIONS: SelectOption[] = [
  { value: "Trưởng Nữ", label: "Trưởng Nữ" },
  { value: "Thứ Nữ", label: "Thứ Nữ" },
  { value: "Út Nữ", label: "Út Nữ" },
  { value: "Trưởng Nam", label: "Trưởng Nam" },
  { value: "Thứ Nam", label: "Thứ Nam" },
  { value: "Út Nam", label: "Út Nam" },
];
