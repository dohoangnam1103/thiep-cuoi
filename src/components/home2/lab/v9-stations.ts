import {
  Compass,
  Images,
  MessageCircleHeart,
  Send,
  SlidersHorizontal,
  TicketCheck,
} from "lucide-react";

import type { TemplateShotData } from "../types";

/**
 * Định nghĩa dùng chung cho cả hai layout của hành trình V9.
 *
 * Có module này vì desktop và mobile là hai bố cục khác nhau chứ không phải một
 * bố cục co giãn: trên khổ 390px tấm thiệp chỉ bay ngang được 179px, tức 0.96 lần
 * bề rộng chính nó, nên chuyển động ngang không còn đọc ra là "bay". Mobile đổi
 * sang chồng trang trượt dọc. Hai bố cục dùng chung danh sách trạm, phép quy đổi
 * `track → hình` và cấu hình ScrollTrigger — tách ra đây để không phải chép đôi,
 * và để tránh import vòng giữa hai file layout.
 */

export type V9TemplateShot = TemplateShotData & {
  portrait: string;
};

export type V9StationKey =
  | "departure"
  | "choose"
  | "personalize"
  | "memories"
  | "rsvp"
  | "share";

export const V9_STATIONS: Array<{
  key: V9StationKey;
  /** Bên đặt khối chữ trên desktop. Mobile không dùng (mỗi trạm một trang). */
  side: "left" | "right";
  Icon: typeof Compass;
}> = [
  { key: "departure", side: "left", Icon: Compass },
  { key: "choose", side: "right", Icon: TicketCheck },
  { key: "personalize", side: "left", Icon: SlidersHorizontal },
  { key: "memories", side: "right", Icon: Images },
  { key: "rsvp", side: "left", Icon: MessageCircleHeart },
  { key: "share", side: "right", Icon: Send },
];

export const V9_STATION_COUNT = V9_STATIONS.length;

/** Số đoạn chuyển giữa các trạm: 6 trạm → 5 đoạn. */
export const SEGMENTS = V9_STATION_COUNT - 1;

/** Keyframe vị trí tấm thiệp bay — CHỈ desktop dùng. */
export const CARD_KEYS: Array<{
  x: number;
  y: number;
  scale: number;
  rotate: number;
}> = [
  { x: 23, y: 2, scale: 0.96, rotate: -3.5 },
  { x: -23, y: -1, scale: 0.84, rotate: 4 },
  { x: 23, y: 1, scale: 1.02, rotate: -2 },
  { x: -23, y: -2, scale: 0.8, rotate: 3.5 },
  { x: 23, y: 1, scale: 0.92, rotate: -4 },
  // Trạm cuối: to nhất, thẳng nhất — nhưng vẫn lệch khỏi trục giữa. Đặt x: 0 thì
  // tấm thiệp đè lên chữ đầu dòng của khối chữ bên phải.
  { x: -19, y: -1, scale: 1.08, rotate: 0 },
];

/* Mỗi đoạn được chia làm ba phần: giữ yên ở trạm cũ → chuyển cảnh → giữ yên ở
   trạm mới. `HOLD` là tỉ lệ giữ yên ở MỖI đầu đoạn.
 *
 * Đừng nâng số này lên nữa. Nó ăn trực tiếp vào quãng cuộn dành cho chuyển động:
 * với đoạn 110svh, HOLD 0.15 để lại 77svh cho tấm thiệp bay, còn HOLD 0.3 chỉ
 * để lại 44svh — mà tấm thiệp phải đi hết 46vw trong quãng đó nên nhìn ra thành
 * "bay vèo". Việc chống-đứng-lưng-chừng đã có cơ chế snap lo, plateau ở đây chỉ
 * còn nhiệm vụ chừa một nhịp đứng yên đủ để đọc khối chữ ở mỗi trạm. */
export const HOLD = 0.15;

/* Cửa sổ giao nhau của hai khối chữ trên desktop. Khối cũ tắt xong ở 0.44, khối
   mới bắt đầu hiện từ 0.56 — cố tình chừa một nhịp trống để đọc ra là "cắt cảnh"
   thay vì hai khối chữ mờ đè lên nhau. */
export const TEXT_OUT_END = 0.44;
export const TEXT_IN_START = 0.56;

/* ── Cấu hình ScrollTrigger ──────────────────────────────────────────────────

   `SCRUB` là độ trễ bám theo cuộn, tính bằng giây: GSAP không nhảy thẳng tới vị
   trí cuộn mà đuổi theo trong 0.55s. Đây chính là thứ làm chuyển động "mượt" —
   nó cũng lọc luôn nhịp giật của trackpad và của cuộn theo bậc của chuột.

   `SNAP_*` là cú tự đi tới trạm khi cuộn đã dừng. GSAP lo phần khó: chờ cuộn
   dừng, co giãn thời lượng theo khoảng cách, chạy tween trong ticker của nó.
   Nhưng việc CHỌN trạm nào thì phải tự quyết định — xem `snapTo` trong hook.

   Cụ thể là KHÔNG dùng `inertia: true`. Tuỳ chọn đó phóng điểm đến theo quán
   tính cú cuộn, nên một cú lăn mạnh nhảy vọt qua ba bốn trạm một lúc (đo được:
   lăn 620px từ trạm 0 bay thẳng tới trạm 5). Hành trình này phải đi từng trạm,
   không được nhảy cóc. */
export const SCRUB = 0.55;
export const SNAP_DURATION = { min: 0.32, max: 0.85 } as const;
export const SNAP_DELAY = 0.07;
export const SNAP_EASE = "power2.inOut";
export const NAV_JUMP_EASE = "power2.inOut";

/* Ngưỡng quyết định khi cuộn dừng ở lưng chừng, lệch theo chiều cuộn: đang đi
   xuống thì quá 34% là đi tiếp, đang đi lên thì phải quá 66% mới giữ lại trạm
   sau. Đặt thấp hơn mốc giữa vì mỗi đoạn dài 110svh — nếu đòi đúng 50% thì mọi
   cú lăn vừa phải đều bị kéo về trạm cũ, thành cảm giác bị giữ chân. */
export const SNAP_FORWARD = 0.34;
export const SNAP_BACKWARD = 0.66;

export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max);

export const lerp = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;

/**
 * Đường cong chuyển cảnh: ease-in-out BẬC HAI, không phải bậc ba.
 *
 * Đây là chỗ quyết định "chuyển động có vèo hay không", quan trọng hơn cả độ dài
 * đoạn cuộn. Bậc ba có tốc độ đỉnh ở giữa chặng bằng 3 lần tốc độ trung bình,
 * tức là nó dồn phần lớn quãng đi vào một khúc cuộn rất ngắn rồi bò chậm ở hai
 * đầu. Bậc hai chỉ đỉnh gấp 2 lần, nên chuyển động phân bố đều hơn và mắt theo
 * được. Nhịp "đứng lại" ở mỗi trạm đã do plateau `HOLD` lo, đường cong không cần
 * gánh thêm việc đó.
 */
export const easeTravel = (value: number) =>
  value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;

export const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

/** Một khung hình của hành trình, đã quy đổi xong từ vị trí cuộn. */
export type V9Frame = {
  /** 0 → 1 trên toàn chặng. */
  progress: number;
  /** 0 → SEGMENTS, tức vị trí trên lộ trình. */
  track: number;
  /** Trạm đang rời khỏi. */
  fromIndex: number;
  /** 0 → 1 trong đoạn hiện tại, đã qua plateau và đường cong. */
  t: number;
};

/** Quy đổi `track` thô thành một khung hình cho hành trình desktop. */
export function frameFromTrack(rawTrack: number): V9Frame {
  const track = clamp(rawTrack, 0, SEGMENTS);
  const fromIndex = Math.min(Math.floor(track), SEGMENTS - 1);
  const local = track - fromIndex;
  const t =
    local <= HOLD
      ? 0
      : local >= 1 - HOLD
        ? 1
        : easeTravel((local - HOLD) / (1 - HOLD * 2));
  return { progress: track / SEGMENTS, track, fromIndex, t };
}
