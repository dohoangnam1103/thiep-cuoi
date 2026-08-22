import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { templatePreviewUrl } from "@/lib/template-preview-url";

import type { TemplateShotData } from "./types";

/**
 * Các viên gạch nhỏ dùng lại giữa các chương.
 *
 * Cố tình KHÔNG có component `<SectionHeader>` gộp sẵn eyebrow + tiêu đề + mô
 * tả. Trang chủ hiện tại mở đầu cả 6 section bằng đúng một khối căn giữa như
 * vậy, và chính sự lặp lại đó là dấu hiệu "làm bằng máy" rõ nhất. Ở đây mỗi
 * chương tự lắp từ các atom dưới đây theo một bố cục khác nhau.
 */

/** Khối nội dung chuẩn, canh theo lưới của trang. */
export function Shell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[78rem] px-5 sm:px-8 lg:px-12 ${className}`}>
      {children}
    </div>
  );
}

/** Nhãn chữ hoa nhỏ, có đoạn kẻ dẫn ở trên. Dấu hiệu mở một chương. */
export function Eyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`hp-label flex items-center gap-3 ${className}`}>
      <span aria-hidden className="h-px w-8 shrink-0 bg-current opacity-50" />
      {children}
    </p>
  );
}

/** Số thứ tự chương, in bằng Fraunces nét thanh. Vai trò thị giác là mốc dẫn
 *  mắt, nên nó nhạt và không cần đọc thành tiếng → aria-hidden. */
export function ChapterMark({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`hp-num block text-[clamp(3.5rem,7vw,6.5rem)] leading-[0.8] opacity-[0.16] ${className}`}
    >
      {value}
    </span>
  );
}

/** Kẻ chỉ ngang. `lead` thêm một đoạn đậm màu nhấn ở đầu. */
export function Rule({
  lead = false,
  className = "",
}: {
  lead?: boolean;
  className?: string;
}) {
  return <hr className={`${lead ? "hp-rule-lead" : "hp-rule"} ${className}`} />;
}

/**
 * Một tấm thiệp trong khung giấy, ảnh trôi để lộ toàn bộ trang.
 *
 * `height` là chiều cao khung tính bằng px, đồng thời được đổ vào biến CSS
 * `--hp-shot-h` để CSS tính đích trôi bằng calc() — không đo DOM, không JS.
 *
 * `drift`:
 *   - "hover": trôi khi trỏ chuột vào (dùng cho lưới mẫu thiệp)
 *   - "auto":  tự trôi liên tục (chỉ dùng cho một thiệp ở hero)
 */
export function TemplateShot({
  template,
  height,
  drift = "hover",
  driftDuration = 52,
  priority = false,
  sizes = "(max-width: 640px) 46vw, (max-width: 1024px) 40vw, 26vw",
  className = "",
}: {
  /** Chiều cao khung. Nhận cả chuỗi CSS (`clamp(...)`) để khung co giãn theo
   *  bề ngang màn hình mà vẫn giữ được phép tính đích trôi bằng calc(). */
  template: TemplateShotData;
  height: string;
  drift?: "hover" | "auto";
  driftDuration?: number;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const style = {
    height,
    "--hp-shot-h": height,
    ...(drift === "auto" ? { "--hp-drift-duration": `${driftDuration}s` } : {}),
  } as CSSProperties;

  return (
    <div
      className={`hp-frame ${drift === "hover" ? "hp-scrollshot-host" : "hp-shot-stage"} ${className}`}
      style={style}
    >
      <Image
        src={templatePreviewUrl(template.listing)}
        alt={template.name}
        width={template.listingWidth}
        height={template.listingHeight}
        sizes={sizes}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        className={`hp-scrollshot ${drift === "auto" ? "hp-shot-drift" : ""}`}
      />
    </div>
  );
}
