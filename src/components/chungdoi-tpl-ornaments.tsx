"use client";

/**
 * Hand-authored SVG ornaments for the layout-first templates.
 *
 * The 40 crawled templates lean on raster decor under
 * `public/chungdoi/images/themes/`. These templates deliberately avoid that:
 * every mark here is drawn in code, so a new template needs no new asset and
 * carries no third-party licence.
 */

type OrnamentProps = {
  className?: string;
  color?: string;
  strokeWidth?: number;
};

/**
 * Plain horizontal rule. A div rather than an SVG so it stays crisp at any
 * width — the editorial layout uses these as its main structural mark.
 */
export function HairRule({
  className,
  color = "currentColor",
  weight = 1,
}: {
  className?: string;
  color?: string;
  weight?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 2"
      preserveAspectRatio="none"
      aria-hidden
      className={`${weight > 1 ? "h-0.5" : "h-px"} w-full ${className ?? ""}`}
    >
      <path d="M0 1h100" stroke={color} strokeWidth={weight} />
    </svg>
  );
}

/** Small centred mark: rule, open diamond, rule. Softer than DiamondRule. */
export function OrnamentDivider({ className, color = "currentColor", strokeWidth = 1 }: OrnamentProps) {
  return (
    <svg viewBox="0 0 160 16" fill="none" aria-hidden className={className ?? "h-4 w-[160px]"}>
      <path d="M4 8h58" stroke={color} strokeWidth={strokeWidth} />
      <path d="M98 8h58" stroke={color} strokeWidth={strokeWidth} />
      <path d="M80 3 85 8 80 13 75 8z" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="68" cy="8" r="1.4" fill={color} />
      <circle cx="92" cy="8" r="1.4" fill={color} />
    </svg>
  );
}

/** Thin rule with a diamond at the centre. Used as a section divider. */
export function DiamondRule({ className, color = "currentColor", strokeWidth = 1 }: OrnamentProps) {
  return (
    <svg viewBox="0 0 240 12" fill="none" aria-hidden className={className} preserveAspectRatio="none">
      <path d="M0 6h104" stroke={color} strokeWidth={strokeWidth} />
      <path d="M136 6h104" stroke={color} strokeWidth={strokeWidth} />
      <path d="M120 1.5 126.5 6 120 10.5 113.5 6z" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
}

/** Single open brush circle — the zen ensō. Left intentionally unclosed. */
export function EnsoCircle({ className, color = "currentColor", strokeWidth = 6 }: OrnamentProps) {
  return (
    <svg viewBox="0 0 200 200" fill="none" aria-hidden className={className}>
      <path
        d="M150 38a78 78 0 1 0 26 48"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Two interlocking rings, drawn as line art. */
export function LinkedRings({ className, color = "currentColor", strokeWidth = 2 }: OrnamentProps) {
  return (
    <svg viewBox="0 0 120 64" fill="none" aria-hidden className={className}>
      <circle cx="44" cy="32" r="22" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="76" cy="32" r="22" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
}

/** Symmetric leaf sprig. Mirror it with `-scale-x-100` for the opposite side. */
export function LeafSprig({ className, color = "currentColor", strokeWidth = 1.4 }: OrnamentProps) {
  return (
    <svg viewBox="0 0 120 40" fill="none" aria-hidden className={className}>
      <path d="M4 20h112" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      {[24, 44, 64, 84].map((x, i) => (
        <g key={x}>
          <path
            d={`M${x} 20c6-3 12-7 14-13-7 0-12 5-14 13z`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={1 - i * 0.12}
          />
          <path
            d={`M${x} 20c6 3 12 7 14 13-7 0-12-5-14-13z`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={1 - i * 0.12}
          />
        </g>
      ))}
    </svg>
  );
}

/** Perforation line for the ticket template — dashes plus two notches. */
export function PerforationRule({ className, color = "currentColor" }: OrnamentProps) {
  return (
    <svg viewBox="0 0 320 12" fill="none" aria-hidden className={className} preserveAspectRatio="none">
      <path d="M6 6h308" stroke={color} strokeWidth="1.5" strokeDasharray="5 7" strokeLinecap="round" />
    </svg>
  );
}

/** Decorative barcode. Widths come from a fixed table so SSR and client match. */
const BARCODE_WIDTHS = [3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 2, 1, 1, 3, 2];
const BARCODE_BARS = BARCODE_WIDTHS.reduce<{
  bars: Array<{ width: number; x: number }>;
  x: number;
}>((result, width, index) => ({
  bars: index % 2 === 0
    ? [...result.bars, { width, x: result.x }]
    : result.bars,
  x: result.x + width + 1,
}), { bars: [], x: 0 }).bars;

export function Barcode({ className, color = "currentColor" }: OrnamentProps) {
  return (
    <svg viewBox="0 0 120 32" fill="none" aria-hidden className={className} preserveAspectRatio="none">
      {BARCODE_BARS.map((bar) => (
        <rect key={bar.x} x={bar.x} y="0" width={bar.width} height="32" fill={color} />
      ))}
    </svg>
  );
}

/** Nested arch outline used as a frame in the arch template. */
export function ArchOutline({ className, color = "currentColor", strokeWidth = 1.5 }: OrnamentProps) {
  return (
    <svg viewBox="0 0 200 280" fill="none" aria-hidden className={className} preserveAspectRatio="none">
      <path
        d="M8 272V100a92 92 0 0 1 184 0v172"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <path
        d="M26 272V102a74 74 0 0 1 148 0v170"
        stroke={color}
        strokeWidth={strokeWidth}
        opacity="0.45"
      />
    </svg>
  );
}

/** Corner bracket. Rotate with Tailwind to place on the other three corners. */
export function CornerBracket({ className, color = "currentColor", strokeWidth = 1.5 }: OrnamentProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden className={className}>
      <path d="M2 46V14A12 12 0 0 1 14 2h32" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
}
