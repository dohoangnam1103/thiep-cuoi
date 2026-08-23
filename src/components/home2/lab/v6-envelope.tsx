"use client";

import { Bar, FakeButton, LoFiCard, WIRE, clamp, easeInOut, easeOut, lerp, seg } from "./kit";

/**
 * Hồi kết V6 — phong bì mở nắp, thiệp 3D trượt ra, link chia sẻ. Port từ V1
 * với đủ invariants: phong bì ĐỨNG (portrait); CARD_W < ENV_W và
 * CARD_H + CARD_INSIDE_Y < ENV_H nên thiệp 366+30=396 nằm gọn trong 424;
 * ba lớp tối dần vào trong (ENV_BACK → ENV_FRONT → ENV_FLAP), tấm thiệp sáng nhất.
 *
 * Trình tự theo spec: nắp gập mở 0.76–0.84 → thiệp trượt lên 0.84–0.92 →
 * FakeButton chia sẻ fade in 0.92–1.00. `appear` = độ mờ của cả cụm khi
 * chuyển cảnh từ hồi 4 (0.72–0.76).
 */

const ENV_W = 320;
const ENV_H = 424;
const CARD_W = 272;
const CARD_H = 366;
/** Vị trí tấm thiệp khi còn nằm trong phong bì. */
const CARD_INSIDE_Y = 30;
/** Vị trí tấm thiệp khi đã rút hẳn. */
const CARD_OUT_Y = -238;
const FLAP_H = ENV_H * 0.42;
const FRONT_TOP = ENV_H * 0.32;

const ENV_BACK = "#dcd4c6";
const ENV_FRONT = "#d0c7b6";
const ENV_FLAP = "#c2b8a4";
const CARD_PAPER = "#fbf8f2";

export function EnvelopeFinale({
  p,
  appear,
  viewportHeight,
}: {
  p: number;
  appear: number;
  viewportHeight: number;
}) {
  const flapOpen = easeInOut(seg(p, 0.76, 0.84));
  const pull = easeOut(seg(p, 0.84, 0.92));
  const linkIn = seg(p, 0.92, 1);
  const cardY = lerp(CARD_INSIDE_Y, CARD_OUT_Y, pull);

  /* Cụm phải vừa khung nhìn cả khi thiệp đã rút lên cao nhất: chiều cao thực
     tế lúc đó là |CARD_OUT_Y|+ENV_H, lấy đúng số đó làm mẫu số (ghi chú V1). */
  const extent = Math.abs(CARD_OUT_Y) + ENV_H;
  const fit = clamp((viewportHeight * 0.62) / extent, 0.42, 1);
  // Thiệp rút lên thì hạ cả cụm xuống để bố cục vẫn nằm giữa khung nhìn.
  const groupY = lerp(0, Math.abs(CARD_OUT_Y) * 0.42, pull);

  if (appear <= 0.001) return null;

  return (
    <div
      className="absolute inset-0 z-20"
      style={{ opacity: appear, pointerEvents: appear > 0.5 ? "auto" : "none" }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative flex items-center justify-center"
          style={{
            perspective: "1600px",
            transform: `translateY(${groupY * fit}px) scale(${fit})`,
          }}
        >
          {/* Phong bì */}
          <div
            className="relative"
            style={{
              width: ENV_W,
              height: ENV_H,
              transformStyle: "preserve-3d",
              /* Nhìn chếch 16° từ trên xuống: nắp mở NGƯỢC về phía sau; nhìn
                 chính diện thì nắp lật ra sau thân sau và biến mất (ghi chú V1).
                 Hạ dần còn 3° khi thiệp rút ra để mặt thiệp quay thẳng người xem. */
              transform: `rotateX(${lerp(16, 3, pull)}deg)`,
            }}
          >
            {/* Thân sau */}
            <div
              className="absolute inset-0"
              style={{ background: ENV_BACK, border: `1px solid ${WIRE.line}` }}
            />

            {/* Tấm thiệp — giữa thân sau và thân trước. translateZ xếp lớp:
                thân sau 0, thiệp 1, thân trước 2, nắp 3. */}
            <div
              className="absolute left-1/2 top-0"
              style={{
                width: CARD_W,
                height: CARD_H,
                marginLeft: -CARD_W / 2,
                transform: `translateY(${cardY}px) translateZ(1px)`,
              }}
            >
              <LoFiCard face={0} className="absolute inset-0" style={{ background: CARD_PAPER }} />
            </div>

            {/* Thân trước */}
            <div
              className="absolute inset-x-0"
              style={{
                top: FRONT_TOP,
                bottom: 0,
                background: ENV_FRONT,
                borderLeft: `1px solid ${WIRE.line}`,
                borderRight: `1px solid ${WIRE.line}`,
                borderBottom: `1px solid ${WIRE.line}`,
                boxShadow: "0 -3px 10px -3px rgba(47,44,41,0.28)",
                transform: "translateZ(2px)",
              }}
            />

            {/* Nắp — tam giác, bản lề mép trên, dừng ở 150° (ghi chú V1). */}
            <div
              className="absolute inset-x-0 top-0"
              style={{
                height: FLAP_H,
                background: ENV_FLAP,
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                transformOrigin: "top center",
                transform: `translateZ(3px) rotateX(${-flapOpen * 150}deg)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* CTA cuối: đường link + nút chia sẻ */}
      <div
        className="absolute inset-x-0 bottom-[7%] z-30 flex flex-col items-center gap-4 px-6"
        style={{ opacity: linkIn, transform: `translateY(${(1 - linkIn) * 22}px)` }}
      >
        <div
          className="flex w-[min(24rem,86vw)] items-center gap-3 rounded-[3px] px-4 py-3"
          style={{ background: "#fff", border: `1px solid ${WIRE.line}` }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: WIRE.accent }} />
          <Bar w="72%" h={8} tone={WIRE.block} className="flex-1" />
        </div>
        <FakeButton w={186} />
      </div>
    </div>
  );
}
