"use client";

import NextLink from "next/link";
import { useEffect, useState, type ReactNode, type RefObject } from "react";

import "./lab.css";

/**
 * Bộ kit dựng wireframe cho các biến thể trang chủ.
 *
 * Chủ ý là LO-FI: chỉ khối xám và một màu nhấn duy nhất, không ảnh thật, không
 * font đặc biệt. Mục đích của mấy trang này là để chọn KỊCH BẢN CHUYỂN ĐỘNG khi
 * cuộn, nên mọi thứ có thể gây phân tâm về mặt thẩm mỹ đều bị lược đi. Chọn
 * được nhịp rồi mới đắp art direction lên sau.
 */

/* ── Bảng màu wireframe ──────────────────────────────────────────────────── */
export const WIRE = {
  paper: "#f4f2ee",
  paperDeep: "#e9e5dd",
  ink: "#2f2c29",
  inkSoft: "#7d766d",
  line: "#d5cfc5",
  block: "#dfd9d0",
  blockDark: "#c6bfb4",
  accent: "#b4453d",
  dark: "#2b2724",
} as const;

/* ── Toán nội suy ────────────────────────────────────────────────────────── */

export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max);

/** Cắt một đoạn con của tiến độ tổng: seg(0.5, 0.4, 0.6) === 0.5 */
export const seg = (progress: number, from: number, to: number) =>
  clamp((progress - from) / (to - from));

export const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* ── Đo tiến độ scroll ───────────────────────────────────────────────────── */

/**
 * Tiến độ 0→1 của một "sân khấu" cao hơn khung nhìn.
 *
 * Cách đo: phần tử cao H, khung nhìn cao V. Khi đỉnh phần tử vừa chạm mép trên
 * khung nhìn là 0; khi đáy phần tử chạm mép dưới là 1. Tức chia cho (H - V).
 *
 * Dùng rAF nên mỗi khung hình chỉ tính một lần, và đọc `getBoundingClientRect`
 * chứ không cộng dồn offsetTop để không bị lệch khi có phần tử sticky phía trên.
 */
export function useStageProgress(ref: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = element.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      setProgress(travel <= 0 ? 0 : clamp(-rect.top / travel));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);

  return progress;
}

/** Tiến độ cuộn của cả tài liệu, dùng cho phần tử bám suốt trang. */
export function useDocumentProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const travel = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(travel <= 0 ? 0 : clamp(window.scrollY / travel));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return progress;
}

/** true khi người dùng đã bật giảm chuyển động ở hệ điều hành. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/** Kích thước khung nhìn, cần cho các biến thể phải tính toạ độ bằng px. */
export function useViewport() {
  const [size, setSize] = useState({ width: 1280, height: 800 });
  useEffect(() => {
    const sync = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);
  return size;
}

/* ── Primitive khối xám ──────────────────────────────────────────────────── */

/** Một vạch xám thay cho một dòng chữ. */
export function Bar({
  w = "100%",
  h = 10,
  tone = WIRE.block,
  className = "",
}: {
  w?: string | number;
  h?: number;
  tone?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`block rounded-[2px] ${className}`}
      style={{ width: w, height: h, background: tone }}
    />
  );
}

/** Một đoạn văn giả: vài vạch xám dài ngắn khác nhau. */
export function TextBlock({
  lines = 3,
  className = "",
  tone = WIRE.block,
}: {
  lines?: number;
  className?: string;
  tone?: string;
}) {
  const widths = ["100%", "94%", "88%", "97%", "72%"];
  return (
    <span aria-hidden className={`flex flex-col gap-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Bar key={index} w={widths[index % widths.length]} h={9} tone={tone} />
      ))}
    </span>
  );
}

/** Nhãn chữ hoa nhỏ — thứ duy nhất trong wireframe có chữ đọc được, để biết
 *  mình đang xem khối nào. */
export function Label({
  children,
  className = "",
  tone = WIRE.inkSoft,
}: {
  children: ReactNode;
  className?: string;
  tone?: string;
}) {
  return (
    <span
      className={`block text-[10px] font-bold uppercase leading-[1.5] tracking-[0.28em] ${className}`}
      style={{ color: tone }}
    >
      {children}
    </span>
  );
}

/** Tiêu đề giả: hai vạch dày mô phỏng một heading hai dòng. */
export function FakeHeading({
  width = "82%",
  secondWidth = "58%",
  h = 26,
  tone = WIRE.blockDark,
  className = "",
}: {
  width?: string;
  secondWidth?: string;
  h?: number;
  tone?: string;
  className?: string;
}) {
  return (
    <span aria-hidden className={`flex flex-col gap-3 ${className}`}>
      <Bar w={width} h={h} tone={tone} />
      <Bar w={secondWidth} h={h} tone={tone} />
    </span>
  );
}

/** Nút giả. */
export function FakeButton({
  w = 168,
  filled = true,
  className = "",
}: {
  w?: number;
  filled?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`block rounded-[2px] ${className}`}
      style={{
        width: w,
        height: 44,
        background: filled ? WIRE.accent : "transparent",
        border: filled ? "none" : `1px solid ${WIRE.line}`,
      }}
    />
  );
}

/**
 * Tấm thiệp lo-fi.
 *
 * `face` đổi sắc độ để phân biệt các mẫu khác nhau khi thẻ lật hoặc đổi mẫu,
 * mà không cần ảnh thật.
 */
export function LoFiCard({
  face = 0,
  label,
  className = "",
  style,
  dense = false,
}: {
  face?: number;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  dense?: boolean;
}) {
  const faces = [WIRE.paper, "#ece6da", "#e4e7e2", "#efe4e4", "#e6e4ec"];
  const background = faces[face % faces.length];

  return (
    <div
      className={`relative flex flex-col overflow-hidden ${className}`}
      style={{
        background,
        border: `1px solid ${WIRE.line}`,
        boxShadow: "0 26px 60px -30px rgba(47,44,41,0.45)",
        ...style,
      }}
    >
      {/* Ô ảnh cưới */}
      <div
        className="w-full shrink-0"
        style={{ background: WIRE.block, height: dense ? "38%" : "44%" }}
      />
      {/* Phần chữ của thiệp */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-[12%]">
        <Bar w="46%" h={7} tone={WIRE.blockDark} />
        <Bar w="78%" h={dense ? 12 : 16} tone={WIRE.blockDark} />
        <Bar w="30%" h={7} tone={WIRE.block} />
        <Bar w="66%" h={dense ? 12 : 16} tone={WIRE.blockDark} />
        <span className="mt-1 block h-px w-8" style={{ background: WIRE.line }} />
        <Bar w="52%" h={6} tone={WIRE.block} />
      </div>
      {label ? (
        <Label className="absolute left-3 top-3" tone={WIRE.inkSoft}>
          {label}
        </Label>
      ) : null}
    </div>
  );
}

/* ── Khung chung của các trang biến thể ──────────────────────────────────── */

const VARIANTS: Array<{ slug: string; code: string; name: string }> = [
  { slug: "", code: "V0", name: "Ấn phẩm (bản đã dựng)" },
  { slug: "lab/v1", code: "V1", name: "Thiệp mở ra" },
  { slug: "lab/v2", code: "V2", name: "Thiệp du hành" },
  { slug: "lab/v3", code: "V3", name: "Album lật ngang" },
  { slug: "lab/v4", code: "V4", name: "Tơ hồng" },
  { slug: "lab/v5", code: "V5", name: "Đi về phía nhau" },
];

/** Thanh chuyển nhanh giữa các biến thể, để so sánh không phải sửa URL tay. */
export function VariantSwitcher({ current }: { current: string }) {
  return (
    <div
      className="sticky top-0 z-50 flex flex-wrap items-center gap-x-1 gap-y-1 px-4 py-2.5 backdrop-blur"
      style={{
        background: "rgba(43,39,36,0.94)",
        borderBottom: `1px solid rgba(255,255,255,0.12)`,
      }}
    >
      <Label className="mr-3 !text-[9px]" tone="rgba(255,255,255,0.5)">
        Wireframe
      </Label>
      {VARIANTS.map((variant) => {
        const active = variant.code === current;
        return (
          <NextLink
            key={variant.code}
            href={`/home-2/${variant.slug}`}
            className="rounded-[2px] px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
            style={{
              background: active ? WIRE.accent : "transparent",
              color: active ? "#fff" : "rgba(255,255,255,0.62)",
            }}
          >
            <span className="tabular-nums">{variant.code}</span>
            <span className="ml-1.5 hidden sm:inline">{variant.name}</span>
          </NextLink>
        );
      })}
    </div>
  );
}

/** Thanh tiến độ nổi, cho thấy đang ở đâu trong kịch bản. Chỉ có ở wireframe —
 *  nó là công cụ để đánh giá nhịp, không phải chi tiết thiết kế. */
export function ProgressReadout({
  progress,
  acts,
}: {
  progress: number;
  acts: string[];
}) {
  const activeAct = Math.min(Math.floor(progress * acts.length), acts.length - 1);
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-40 w-[min(28rem,88vw)] -translate-x-1/2">
      <div
        className="flex items-center gap-3 rounded-[3px] px-3.5 py-2.5"
        style={{ background: "rgba(43,39,36,0.9)" }}
      >
        <span
          className="text-[10px] font-bold tabular-nums"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          {String(Math.round(progress * 100)).padStart(3, " ")}%
        </span>
        <span className="relative h-[3px] flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.18)" }}>
          <span
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${progress * 100}%`, background: WIRE.accent }}
          />
        </span>
        <span className="w-[42%] shrink-0 truncate text-[11px] font-semibold" style={{ color: "#fff" }}>
          {acts[activeAct]}
        </span>
      </div>
    </div>
  );
}

/** Header/footer giả, chỉ để trang có đủ khung trên dưới. */
export function WireHeader() {
  return (
    <header
      className="flex items-center justify-between px-6 py-5"
      style={{ borderBottom: `1px solid ${WIRE.line}` }}
    >
      <Bar w={112} h={22} tone={WIRE.blockDark} />
      <div className="hidden items-center gap-7 sm:flex">
        {[52, 68, 46, 58].map((w) => (
          <Bar key={w} w={w} h={8} tone={WIRE.block} />
        ))}
      </div>
      <FakeButton w={104} />
    </header>
  );
}

export function WireFooter() {
  return (
    <footer className="px-6 py-16" style={{ background: WIRE.dark }}>
      <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-4">
        <div className="flex flex-col gap-4">
          <Bar w={112} h={22} tone="rgba(255,255,255,0.28)" />
          <TextBlock lines={2} tone="rgba(255,255,255,0.14)" />
        </div>
        {[0, 1, 2].map((column) => (
          <div key={column} className="flex flex-col gap-3.5">
            <Bar w={72} h={8} tone="rgba(255,255,255,0.3)" />
            {[0, 1, 2].map((row) => (
              <Bar key={row} w={`${60 + row * 12}%`} h={7} tone="rgba(255,255,255,0.14)" />
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}

/**
 * Một chương nội dung thường (không có chuyển động đặc biệt).
 *
 * Có mặt ở mọi biến thể để thấy được: sau đoạn "ăn tiền" thì phần còn lại của
 * trang trông ra sao, và đoạn chuyển động có ăn nhập với phần thân hay không.
 */
export function WireChapter({
  code,
  layout = "left",
  tone = WIRE.paper,
  lines = 3,
  children,
}: {
  code: string;
  layout?: "left" | "right" | "center" | "index";
  tone?: string;
  lines?: number;
  children?: ReactNode;
}) {
  const media = children ?? (
    <div
      className="aspect-[4/3] w-full"
      style={{ background: WIRE.block, border: `1px solid ${WIRE.line}` }}
    />
  );

  if (layout === "index") {
    return (
      <section className="px-6 py-24" style={{ background: tone }}>
        <div className="mx-auto max-w-5xl">
          <Label>{code}</Label>
          <FakeHeading className="mt-5 max-w-lg" width="90%" secondWidth="52%" />
          <ul className="mt-14 grid sm:grid-cols-2 sm:gap-x-14">
            {Array.from({ length: 6 }).map((_, index) => (
              <li key={index} className="py-6" style={{ borderTop: `1px solid ${WIRE.line}` }}>
                <Bar w="52%" h={13} tone={WIRE.blockDark} />
                <TextBlock lines={2} className="mt-4" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  if (layout === "center") {
    return (
      <section className="px-6 py-24" style={{ background: tone }}>
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <Label>{code}</Label>
          <FakeHeading className="mt-5 w-full items-center" width="78%" secondWidth="46%" />
          <TextBlock lines={lines} className="mt-7 w-full max-w-md" />
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-24" style={{ background: tone }}>
      <div
        className={`mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2 ${
          layout === "right" ? "" : ""
        }`}
      >
        <div className={layout === "right" ? "md:order-2" : ""}>
          <Label>{code}</Label>
          <FakeHeading className="mt-5" width="88%" secondWidth="54%" />
          <TextBlock lines={lines} className="mt-7" />
          <FakeButton className="mt-9" filled={false} />
        </div>
        <div className={layout === "right" ? "md:order-1" : ""}>{media}</div>
      </div>
    </section>
  );
}
