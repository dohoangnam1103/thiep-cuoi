"use client";

/**
 * Cô dâu & chú rể kiểu chibi 2D, vẽ tay bằng SVG.
 *
 * ─── VÌ SAO SVG VẼ TAY, KHÔNG PHẢI ẢNH ─────────────────────────────────────
 *
 * 1. Cần cử động từng bộ phận. Hoạt cảnh V5 đòi chân đảo theo sải bước, tay
 *    vươn ra để hai người nắm tay đúng một điểm, khăn voan bay theo nhịp. Một
 *    tấm ảnh phẳng muốn làm vậy phải cắt thành sprite sheet.
 * 2. Cỡ chạy từ 130px (điện thoại) tới 400px (desktop). Vector không rỗ.
 * 3. Nhẹ: `_decor/chibi_red/couple-main.webp` nặng 130KB cho MỘT tư thế; hai
 *    nhân vật ở đây vài KB và đổi được màu qua props.
 * 4. Chính sách asset của project (`docs/research/asset-provenance.md`): mọi
 *    file là artwork gốc làm riêng cho Chungdoi, không lấy ảnh từ web. Vẽ tay
 *    là cách duy nhất giữ đúng chính sách đó mà không cần công cụ sinh ảnh.
 *
 * ─── STYLE THEO ĐÚNG NHÀ ───────────────────────────────────────────────────
 *
 * Lấy chuẩn từ `themes/_decor/chibi_red/couple-main.webp` đang dùng cho mẫu
 * thiệp `chibi-red`: viền mực đen dày, màu phẳng không gradient, má hồng hai
 * bên, mắt nhắm cong hình ^ khi cười, miệng mở tròn. Khác một điểm có chủ ý:
 * tỉ lệ ở đây chibi hơn — đầu chiếm 1/4 chiều cao (bản gốc khoảng 1/6) vì nhân
 * vật phải đọc được ở cỡ 130px trên điện thoại.
 *
 * ─── HỢP ĐỒNG TOẠ ĐỘ (đừng phá) ────────────────────────────────────────────
 *
 * Cả hai nhân vật dùng chung một khung `FIG_W × FIG_H`, và:
 *   - chân đứng ở y ≈ 194 (sát đáy khung)
 *   - BÀN TAY PHÍA TRONG ở y = HAND_Y, sát mép trong của khung
 *     (chú rể ở x ≈ FIG_W, cô dâu ở x ≈ 0)
 * Nhờ vậy khi hai khung đặt cạnh nhau vừa khít thì hai bàn tay gặp nhau đúng
 * chỗ, không phải căn bằng mắt. Vị trí gặp nhau ở V5 được tính TỪ `FIG_W`, nên
 * đổi bề ngang khung là phải đổi cả chỗ đó.
 */

export const FIG_W = 104;
export const FIG_H = 200;
/** Độ cao bàn tay phía trong, tính từ đỉnh khung. */
export const HAND_Y = 96;

export type ChibiPalette = {
  ink: string;
  skin: string;
  blush: string;
  hair: string;
  suit: string;
  suitDark: string;
  shirt: string;
  dress: string;
  dressDark: string;
  veil: string;
  gold: string;
  shoe: string;
};

/** Bảng màu mặc định, lấy theo mẫu thiệp `chibi-red`. */
export const CHIBI_PALETTE: ChibiPalette = {
  ink: "#2c1a14",
  skin: "#ffdcc0",
  blush: "#ff9c92",
  hair: "#33211a",
  suit: "#33302f",
  suitDark: "#1f1d1d",
  shirt: "#fff8ee",
  dress: "#d63b2e",
  dressDark: "#a82a20",
  veil: "#fffaf4",
  gold: "#e2b45f",
  shoe: "#241a17",
};

const STROKE = 3.4;
/** Góc đảo chân tối đa. 9° là quá ít — ở cỡ hiển thị thật thì hai ống chân trông
 *  như song song và động tác đi biến mất. 15° mới đọc ra là đang bước. */
const STRIDE_DEG = 15;

/** Mặt cười dùng chung: mắt nhắm hình ^, má hồng, miệng mở. */
function Face({
  cx,
  cy,
  palette,
}: {
  cx: number;
  cy: number;
  palette: ChibiPalette;
}) {
  return (
    <g>
      {/* mắt nhắm cười */}
      <path
        d={`M${cx - 13} ${cy + 1} q4.5 -6.5 9 0`}
        stroke={palette.ink}
        strokeWidth={2.8}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M${cx + 4} ${cy + 1} q4.5 -6.5 9 0`}
        stroke={palette.ink}
        strokeWidth={2.8}
        strokeLinecap="round"
        fill="none"
      />
      {/* má hồng */}
      <ellipse cx={cx - 15} cy={cy + 9} rx={5.5} ry={3.4} fill={palette.blush} opacity={0.85} />
      <ellipse cx={cx + 15} cy={cy + 9} rx={5.5} ry={3.4} fill={palette.blush} opacity={0.85} />
      {/* miệng mở, cười */}
      <path
        d={`M${cx - 6} ${cy + 8} q6 9 12 0 q-6 3.5 -12 0 z`}
        fill={palette.ink}
      />
    </g>
  );
}

/**
 * Chú rể. Đi sang PHẢI, nên tay phải (phía trong) vươn về mép phải khung.
 * `stride` trong khoảng -1..1 điều khiển đảo chân và vung tay.
 */
export function ChibiGroom({
  stride = 0,
  palette = CHIBI_PALETTE,
}: {
  stride?: number;
  palette?: ChibiPalette;
}) {
  const headCx = 44;
  const headCy = 40;

  return (
    <svg
      width={FIG_W}
      height={FIG_H}
      viewBox={`0 0 ${FIG_W} ${FIG_H}`}
      fill="none"
      role="img"
      aria-label="Chú rể"
    >
      {/* bóng dưới chân */}
      <ellipse cx={44} cy={195} rx={28} ry={4.4} fill={palette.ink} opacity={0.13} />

      {/* ── chân, đảo quanh hông ──
             Hai ống chân cách nhau 8 đơn vị và hai chiếc giày KHÔNG chồng nhau.
             Lúc đầu để chân ở x=30/45 và giày x=25/43 (rộng 22) nên hai chiếc
             giày trùm vào nhau thành một khối đen duy nhất. */}
      <g transform={`rotate(${stride * STRIDE_DEG} 44 136)`}>
        <rect x={28} y={132} width={12} height={52} rx={6} fill={palette.suit} stroke={palette.ink} strokeWidth={STROKE} />
        <rect x={22} y={179} width={20} height={13} rx={6} fill={palette.shoe} stroke={palette.ink} strokeWidth={STROKE} />
      </g>
      <g transform={`rotate(${-stride * STRIDE_DEG} 44 136)`}>
        <rect x={48} y={132} width={12} height={52} rx={6} fill={palette.suit} stroke={palette.ink} strokeWidth={STROKE} />
        <rect x={46} y={179} width={20} height={13} rx={6} fill={palette.shoe} stroke={palette.ink} strokeWidth={STROKE} />
      </g>

      {/* ── tay phía ngoài, vung ngược pha với chân ── */}
      <g transform={`rotate(${-stride * 14} 26 72)`}>
        <path d="M26 72 L17 112" stroke={palette.ink} strokeWidth={12.5} strokeLinecap="round" />
        <path d="M26 72 L17 112" stroke={palette.suit} strokeWidth={7.5} strokeLinecap="round" />
        <circle cx={16} cy={115} r={6.4} fill={palette.skin} stroke={palette.ink} strokeWidth={2.6} />
      </g>

      {/* ── thân áo vest ── */}
      <path
        d="M28 68 Q30 60 40 59 L48 59 Q58 60 60 68 L64 134 L24 134 Z"
        fill={palette.suit}
        stroke={palette.ink}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      {/* ve áo + áo sơ mi */}
      <path d="M40 59 L44 78 L48 59 Z" fill={palette.shirt} stroke={palette.ink} strokeWidth={2.2} />
      <path
        d="M34 62 L44 82 L54 62"
        stroke={palette.suitDark}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
      />
      {/* nơ con bướm */}
      <path
        d="M38 63 L44 67 L50 63 L50 71 L38 71 Z"
        fill={palette.dress}
        stroke={palette.ink}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />

      {/* ── TAY PHÍA TRONG: vươn sang phải, bàn tay ở đúng HAND_Y, sát mép ──
             Đây là chỗ hai người nắm tay. Không đổi toạ độ điểm cuối nếu chưa
             đổi hợp đồng toạ độ ở đầu file. */}
      <path
        d={`M60 74 Q82 78 ${FIG_W - 6} ${HAND_Y}`}
        stroke={palette.ink}
        strokeWidth={12}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M60 74 Q82 78 ${FIG_W - 6} ${HAND_Y}`}
        stroke={palette.suit}
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
      />
      <circle
        cx={FIG_W - 4}
        cy={HAND_Y}
        r={6.4}
        fill={palette.skin}
        stroke={palette.ink}
        strokeWidth={2.6}
      />

      {/* ── cổ + đầu ── */}
      <rect x={39} y={52} width={10} height={9} fill={palette.skin} stroke={palette.ink} strokeWidth={2.4} />
      <circle
        cx={headCx}
        cy={headCy}
        r={24}
        fill={palette.skin}
        stroke={palette.ink}
        strokeWidth={STROKE}
      />
      {/* tóc: mái lệch + một cọng vểnh */}
      <path
        d="M20 38 Q19 15 44 15 Q69 15 68 38 Q62 24 50 27 Q40 32 33 26 Q24 27 20 38 Z"
        fill={palette.hair}
        stroke={palette.ink}
        strokeWidth={2.8}
        strokeLinejoin="round"
      />
      <path
        d="M52 16 Q60 9 63 14"
        stroke={palette.hair}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
      <Face cx={headCx} cy={headCy} palette={palette} />
    </svg>
  );
}

/**
 * Cô dâu. Đi sang TRÁI, nên tay trái (phía trong) vươn về mép trái khung.
 */
export function ChibiBride({
  stride = 0,
  palette = CHIBI_PALETTE,
}: {
  stride?: number;
  palette?: ChibiPalette;
}) {
  const headCx = 60;
  const headCy = 40;

  return (
    <svg
      width={FIG_W}
      height={FIG_H}
      viewBox={`0 0 ${FIG_W} ${FIG_H}`}
      fill="none"
      role="img"
      aria-label="Cô dâu"
    >
      <ellipse cx={60} cy={195} rx={30} ry={4.4} fill={palette.ink} opacity={0.13} />

      {/* ── khăn voan phía sau, bay theo sải bước ──
             Bản đầu chỉ rộng 20 đơn vị nên bị thân váy che gần hết và đọc ra như
             một vệt trắng dán bên hông. Giờ xoè rộng ra tới mép ngoài khung. */}
      <path
        d={`M72 30 Q${102 + stride * 5} 104 ${96 + stride * 7} 178 L60 178 Q74 104 64 34 Z`}
        fill={palette.veil}
        stroke={palette.ink}
        strokeWidth={2.4}
        strokeLinejoin="round"
        opacity={0.9}
      />

      {/* ── chân, đảo quanh hông ──
             Gấu váy nâng lên y=168 để hở HAI bàn chân. Trước đây gấu ở 176 và
             chỉ có một ống chân, nên dưới váy chỉ thấy một cái cục. */}
      <g transform={`rotate(${stride * (STRIDE_DEG - 3)} 60 150)`}>
        <rect x={49} y={162} width={11} height={22} rx={5} fill={palette.skin} stroke={palette.ink} strokeWidth={2.6} />
        <rect x={44} y={180} width={18} height={12} rx={5} fill={palette.dressDark} stroke={palette.ink} strokeWidth={2.6} />
      </g>
      <g transform={`rotate(${-stride * (STRIDE_DEG - 3)} 60 150)`}>
        <rect x={62} y={162} width={11} height={22} rx={5} fill={palette.skin} stroke={palette.ink} strokeWidth={2.6} />
        <rect x={60} y={180} width={18} height={12} rx={5} fill={palette.dressDark} stroke={palette.ink} strokeWidth={2.6} />
      </g>

      {/* ── chân váy ── */}
      <path
        d="M44 98 L76 98 L86 168 Q60 174 34 168 Z"
        fill={palette.dress}
        stroke={palette.ink}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      {/* nếp gấp */}
      <path d="M56 104 L50 165" stroke={palette.dressDark} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M68 104 L72 165" stroke={palette.dressDark} strokeWidth={2.2} strokeLinecap="round" />

      {/* ── thân áo ── */}
      <path
        d="M46 68 Q48 60 56 59 L64 59 Q72 60 74 68 L76 100 L44 100 Z"
        fill={palette.dress}
        stroke={palette.ink}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path d="M52 82 L68 82" stroke={palette.gold} strokeWidth={3} strokeLinecap="round" />

      {/* ── tay phía ngoài, cầm bó hoa ── */}
      <g transform={`rotate(${stride * 10} 76 74)`}>
        <path d="M76 74 L88 104" stroke={palette.ink} strokeWidth={12} strokeLinecap="round" />
        <path d="M76 74 L88 104" stroke={palette.skin} strokeWidth={7} strokeLinecap="round" />
        {/* bó hoa: một chùm tròn nhỏ, không phải một cái đĩa đỏ */}
        <g>
          <circle cx={90} cy={112} r={4.6} fill={palette.dress} stroke={palette.ink} strokeWidth={2} />
          <circle cx={97} cy={109} r={4} fill={palette.gold} stroke={palette.ink} strokeWidth={2} />
          <circle cx={95} cy={117} r={3.6} fill={palette.dress} stroke={palette.ink} strokeWidth={2} />
          <path d="M90 116 L88 124" stroke={palette.ink} strokeWidth={2.2} strokeLinecap="round" />
        </g>
      </g>

      {/* ── TAY PHÍA TRONG: vươn sang trái, bàn tay ở đúng HAND_Y, sát mép ── */}
      <path
        d={`M44 74 Q22 78 6 ${HAND_Y}`}
        stroke={palette.ink}
        strokeWidth={12}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M44 74 Q22 78 6 ${HAND_Y}`}
        stroke={palette.skin}
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
      />
      <circle cx={4} cy={HAND_Y} r={6.4} fill={palette.skin} stroke={palette.ink} strokeWidth={2.6} />

      {/* ── cổ + đầu ── */}
      <rect x={55} y={52} width={10} height={9} fill={palette.skin} stroke={palette.ink} strokeWidth={2.4} />
      <circle
        cx={headCx}
        cy={headCy}
        r={24}
        fill={palette.skin}
        stroke={palette.ink}
        strokeWidth={STROKE}
      />
      {/* tóc: búi cao + kẹp hoa */}
      <path
        d="M36 40 Q35 15 60 15 Q85 15 84 40 Q80 26 60 27 Q42 27 36 40 Z"
        fill={palette.hair}
        stroke={palette.ink}
        strokeWidth={2.8}
        strokeLinejoin="round"
      />
      <circle cx={60} cy={13} r={10} fill={palette.hair} stroke={palette.ink} strokeWidth={2.8} />
      <circle cx={74} cy={22} r={4.6} fill={palette.dress} stroke={palette.ink} strokeWidth={2.2} />
      <circle cx={80} cy={28} r={3.4} fill={palette.gold} stroke={palette.ink} strokeWidth={2} />
      <Face cx={headCx} cy={headCy} palette={palette} />
    </svg>
  );
}
