"use client";

import { clamp, easeInOut, easeOut, lerp, seg } from "./kit";
import { v7Copy } from "./v7-copy";

/**
 * Cụm phong bì + tấm thiệp của hồi kết V8.
 *
 * Hình học lấy nguyên của `v7-envelope.tsx` (mà gốc là V1) vì đã sửa đúng một
 * lần rồi. Hai bất biến KHÔNG được phá:
 *
 *     CARD_W < ENV_W        và        CARD_H + CARD_INSIDE_Y < ENV_H
 *
 * Sai cái nào thì tấm thiệp thò ra khỏi phong bì ngay lúc phong bì còn đóng.
 * Nắp (tam giác) và thân trước phải chồng lấn nhau, nếu không sẽ hở một khe
 * ngang để lộ tấm thiệp.
 *
 * Xếp lớp theo trục sâu chứ không theo `z-index`: thân sau ở z=0, thiệp z=1,
 * thân trước z=2, nắp z=3, dấu sáp z=4. Nhờ vậy thứ tự che nhau đúng ở mọi góc
 * nghiêng. Lớp màu dùng lại các biến `--v7-env-*` / `--v7-card-*` đã chốt bậc
 * sắc độ ở v7.css — V8 không dựng bảng phong bì thứ hai.
 */

const copy = v7Copy.card;

const ENV_W = 320;
const ENV_H = 424;
const CARD_W = 272;
const CARD_H = 366;
/** Vị trí tấm thiệp khi còn nằm trong phong bì. */
const CARD_INSIDE_Y = 30;
/** Vị trí tấm thiệp khi đã rút lên hẳn. */
const CARD_OUT_Y = -238;
/** Nắp và thân trước phải chồng nhau, không được hở khe. */
const FLAP_H = ENV_H * 0.42;
const FRONT_TOP = ENV_H * 0.32;

/**
 * `t` là tiến độ RIÊNG của hồi phong bì (0 = phong bì còn nguyên dấu sáp,
 * 1 = thiệp đã mở hai cánh và lùi lại). Component cha cắt đoạn này ra từ tiến
 * độ tổng, nên đổi nhịp của hồi khác không phải sửa file này.
 */
export function V8Envelope({
  t,
  viewportHeight,
  className = "",
}: {
  t: number;
  viewportHeight: number;
  className?: string;
}) {
  const sealBreak = easeOut(seg(t, 0.04, 0.28));
  const flapOpen = easeInOut(seg(t, 0.1, 0.42));
  const pull = easeOut(seg(t, 0.36, 0.66));
  const fold = easeInOut(seg(t, 0.62, 0.92));
  const settle = easeOut(seg(t, 0.9, 1));

  const cardY = lerp(CARD_INSIDE_Y, CARD_OUT_Y, pull);
  const coverAngle = fold * 166;
  /* Phong bì mờ dần sau khi thiệp đã ra hẳn — để mắt dồn vào tấm thiệp. */
  const envelopeOpacity = 1 - seg(t, 0.62, 0.8);

  /* Cả cụm phải vừa khung nhìn kể cả lúc thiệp rút lên cao nhất, nên mẫu số là
     chiều cao lớn nhất của cụm chứ không phải chiều cao phong bì. */
  const fit = clamp((viewportHeight * 0.78) / (Math.abs(CARD_OUT_Y) + ENV_H), 0.4, 1);
  const groupY = lerp(0, Math.abs(CARD_OUT_Y) * 0.42, pull) - settle * 16;

  return (
    <div
      className={`v8-stage3d relative flex items-center justify-center ${className}`}
      style={{ transform: `translateY(${groupY * fit}px) scale(${fit * lerp(1, 0.9, settle)})` }}
    >
      <div
        className="v8-solid relative"
        style={{
          width: ENV_W,
          height: ENV_H,
          /* Nhìn chếch từ trên xuống. Bắt buộc: nắp mở NGƯỢC về phía sau, nên
             nhìn thẳng chính diện thì nó lật ra sau thân sau và biến mất (ghi
             chú V1). Góc giảm dần khi thiệp rút ra để lúc đọc chữ thì mặt thiệp
             quay thẳng lại. */
          transform: `rotateX(${lerp(15, 2, pull)}deg)`,
        }}
      >
        <EnvelopeBack opacity={envelopeOpacity} />
        <Card cardY={cardY} coverAngle={coverAngle} fold={fold} />
        <EnvelopeFront opacity={envelopeOpacity} />
        <EnvelopeFlap open={flapOpen} opacity={envelopeOpacity} />
        <WaxSeal break={sealBreak} flapOpen={flapOpen} opacity={envelopeOpacity} />
      </div>
    </div>
  );
}

function EnvelopeBack({ opacity }: { opacity: number }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: "var(--v7-env-back)",
        border: "1px solid color-mix(in oklab, var(--hp-ink) 22%, transparent)",
        opacity,
      }}
    />
  );
}

/** Thân trước. Mép trên của nó là chỗ thiệp trượt ra, nên cần một vệt tối mảnh
 *  để đọc ra nó nằm TRƯỚC tấm thiệp. */
function EnvelopeFront({ opacity }: { opacity: number }) {
  return (
    <div
      className="absolute inset-x-0"
      style={{
        top: FRONT_TOP,
        bottom: 0,
        background: "var(--v7-env-front)",
        borderLeft: "1px solid color-mix(in oklab, var(--hp-ink) 22%, transparent)",
        borderRight: "1px solid color-mix(in oklab, var(--hp-ink) 22%, transparent)",
        borderBottom: "1px solid color-mix(in oklab, var(--hp-ink) 22%, transparent)",
        boxShadow: "0 -3px 10px -3px color-mix(in oklab, var(--hp-ink) 30%, transparent)",
        transform: "translateZ(2px)",
        opacity,
      }}
    />
  );
}

/** Nắp tam giác, bản lề ở mép trên. Dừng ở 150° chứ không 180°: mở sát 180° thì
 *  nắp gần như song song tầm mắt và chỉ còn là mấy vệt mảnh (ghi chú V1). */
function EnvelopeFlap({ open, opacity }: { open: number; opacity: number }) {
  return (
    <div
      className="absolute inset-x-0 top-0"
      style={{
        height: FLAP_H,
        background: "var(--v7-env-flap)",
        clipPath: "polygon(0 0, 100% 0, 50% 100%)",
        transformOrigin: "top center",
        transform: `translateZ(3px) rotateX(${-open * 150}deg)`,
        opacity,
      }}
    />
  );
}

/** Dấu sáp ở đỉnh nắp: hai nửa tách ra rồi mờ đi. Dán TRÊN nắp nên phải quay
 *  cùng nắp, và nằm ngoài nắp một lớp nữa (z=4). */
function WaxSeal({
  break: broken,
  flapOpen,
  opacity,
}: {
  break: number;
  flapOpen: number;
  opacity: number;
}) {
  return (
    <div
      className="absolute left-1/2"
      style={{
        top: FLAP_H - 26,
        marginLeft: -26,
        width: 52,
        height: 52,
        opacity: (1 - broken) * opacity,
        transform: `translateZ(4px) rotateX(${-flapOpen * 150}deg)`,
        transformOrigin: `center ${-(FLAP_H - 52)}px`,
      }}
    >
      {[-1, 1].map((side) => (
        <span
          key={side}
          className="absolute inset-0 rounded-full"
          style={{
            background: "var(--hp-seal)",
            clipPath: side === -1 ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)",
            transform: `translateX(${side * broken * 34}px) rotate(${side * broken * 26}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Tấm thiệp — nằm GIỮA thân sau và thân trước (z=1), nên khi chưa rút lên thì
 * bị phong bì che đúng như thật.
 *
 * Hai cánh cửa che ruột thiệp lúc góc 0. Chữ trên ruột chỉ hiện khi hai cánh đã
 * mở quá nửa: hiện sớm thì đọc được chữ xuyên qua chỗ cánh còn che, trông như
 * lỗi dựng lớp.
 */
function Card({
  cardY,
  coverAngle,
  fold,
}: {
  cardY: number;
  coverAngle: number;
  fold: number;
}) {
  const insideIn = seg(fold, 0.55, 1);

  return (
    <div
      className="v8-solid absolute left-1/2 top-0"
      style={{
        width: CARD_W,
        height: CARD_H,
        marginLeft: -CARD_W / 2,
        transform: `translateY(${cardY}px) translateZ(1px)`,
      }}
    >
      {/* Ruột thiệp */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-9 text-center"
        style={{
          background: "var(--v7-card)",
          border: "1px solid color-mix(in oklab, var(--hp-ink) 14%, transparent)",
        }}
      >
        <div style={{ opacity: insideIn, transition: "opacity 260ms ease" }}>
          <p className="hp-label !tracking-[0.26em]">{copy.invitePrompt}</p>
          <p className="hp-script mt-5 text-[2.4rem] text-[color:var(--hp-seal)]">
            {copy.coupleNames}
          </p>
          <p className="hp-body-sm mt-5 leading-relaxed">{copy.joiner}</p>
          <span
            aria-hidden
            className="mx-auto mt-6 block h-px w-10"
            style={{ background: "var(--hp-seal)" }}
          />
          <p className="hp-num mt-6 text-[1.05rem]">{copy.dateLine}</p>
          <p className="hp-body-sm mt-2.5">{copy.venueLine}</p>
        </div>
      </div>

      {/* Cánh trái */}
      <CardCover side="left" angle={coverAngle} />
      {/* Cánh phải */}
      <CardCover side="right" angle={coverAngle} />
    </div>
  );
}

function CardCover({ side, angle }: { side: "left" | "right"; angle: number }) {
  const isLeft = side === "left";
  return (
    <div
      className={`absolute top-0 h-full ${isLeft ? "left-0" : "right-0"}`}
      style={{
        width: CARD_W / 2,
        background: "var(--v7-card-cover)",
        [isLeft ? "borderRight" : "borderLeft"]:
          "1px solid color-mix(in oklab, var(--hp-ink) 12%, transparent)",
        transformOrigin: isLeft ? "left center" : "right center",
        transform: `rotateY(${isLeft ? -angle : angle}deg)`,
        boxShadow: `${isLeft ? "8px" : "-8px"} 0 26px -12px color-mix(in oklab, var(--hp-ink) 45%, transparent)`,
      }}
    >
      {/* Mặt ngoài thiệp: chỉ một chữ lồng và đường viền mảnh — bìa thiệp thật
          cũng không in cả lời mời ra ngoài. */}
      <div className="flex h-full items-center justify-center">
        {isLeft ? (
          <span
            aria-hidden
            className="block h-24 w-px"
            style={{ background: "color-mix(in oklab, var(--hp-ink) 14%, transparent)" }}
          />
        ) : (
          <span className="hp-script text-[1.9rem] text-[color:var(--hp-seal)] opacity-70">
            M&amp;H
          </span>
        )}
      </div>
    </div>
  );
}
