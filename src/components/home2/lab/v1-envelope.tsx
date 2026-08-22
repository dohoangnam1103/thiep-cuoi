"use client";

import { useRef } from "react";

import {
  Bar,
  FakeButton,
  Label,
  LoFiCard,
  ProgressReadout,
  TextBlock,
  VariantSwitcher,
  WIRE,
  WireChapter,
  WireFooter,
  WireHeader,
  clamp,
  easeInOut,
  easeOut,
  lerp,
  seg,
  useReducedMotion,
  useStageProgress,
  useViewport,
} from "./kit";

/**
 * V1 — THIỆP MỞ RA
 *
 * Một "sân khấu" cao 520vh, bên trong là khung dính (sticky) cao đúng một khung
 * nhìn. Tiến độ cuộn qua sân khấu điều khiển năm hồi liên tiếp:
 *
 *   hồi 1  0.00–0.18  phong bì nằm giữa, còn nguyên dấu sáp
 *   hồi 2  0.16–0.42  dấu sáp nứt ra, nắp phong bì mở lên
 *   hồi 3  0.36–0.60  tấm thiệp được rút lên khỏi phong bì
 *   hồi 4  0.58–0.82  thiệp mở kiểu cửa hai cánh, ruột thiệp lộ ra
 *   hồi 5  0.82–1.00  thiệp lùi lại, hiện đường link chia sẻ
 *
 * Các hồi cố ý gối đầu nhau (hồi 3 bắt đầu ở 0.36 khi hồi 2 chưa xong ở 0.42)
 * để chuyển động liền mạch, không thành năm đoạn rời rạc.
 *
 * HÌNH HỌC — chỗ này làm sai một lần rồi nên ghi lại:
 * phong bì phải là khổ DỌC và lớn hơn tấm thiệp theo cả hai chiều, nếu không
 * thiệp sẽ thò ra khỏi phong bì ngay ở hồi 1. Cụ thể phải giữ:
 *     CARD_W < ENV_W  và  CARD_H + CARD_INSIDE_Y < ENV_H
 * Nắp phong bì (tam giác) và thân trước phải chồng lấn nhau một đoạn, nếu không
 * sẽ hở một khe ngang để lộ tấm thiệp lúc đang đóng.
 *
 * Điểm mạnh: kịch tính nhất, hiểu ngay sản phẩm là gì mà không cần đọc chữ.
 * Điểm yếu: tốn 5 màn hình cuộn trước khi tới nội dung; ai cuộn nhanh sẽ chỉ
 * thấy loang loáng.
 */

const ACTS = [
  "Phong bì · còn dấu sáp",
  "Bóc dấu sáp · mở nắp",
  "Rút thiệp ra",
  "Thiệp mở hai cánh",
  "Gửi bằng một đường link",
];

const CAPTIONS: Array<{ from: number; to: number; line: string }> = [
  { from: 0.0, to: 0.2, line: "Một lời mời được gửi đi" },
  { from: 0.2, to: 0.4, line: "Mở ra" },
  { from: 0.4, to: 0.6, line: "Thiệp của riêng hai bạn" },
  { from: 0.6, to: 0.82, line: "Đủ mọi thứ ngày cưới cần" },
  { from: 0.82, to: 1.0, line: "Gửi bằng một đường link" },
];

/**
 * SẮC ĐỘ — cũng làm sai một lần rồi nên ghi lại.
 *
 * Phong bì và tấm thiệp lúc đầu đều lấy `WIRE.paperDeep`, chênh nhau chưa tới
 * 5% độ sáng. Kết quả là cả cụm đọc ra như một cái thùng carton chứ không phải
 * "tấm thiệp sáng được rút ra khỏi phong bì tối". Ba lớp phong bì phải tối dần
 * từ trong ra ngoài, và tấm thiệp phải sáng hơn hẳn cả ba.
 */
const ENV_BACK = "#dcd4c6";
const ENV_FRONT = "#d0c7b6";
const ENV_FLAP = "#c2b8a4";
const CARD_PAPER = "#fbf8f2";
const CARD_COVER = "#f1ebe0";

/* Khổ dọc, phong bì bọc trọn tấm thiệp. Xem ghi chú HÌNH HỌC ở trên. */
const ENV_W = 320;
const ENV_H = 424;
const CARD_W = 272;
const CARD_H = 366;
/** Vị trí tấm thiệp khi còn nằm trong phong bì. */
const CARD_INSIDE_Y = 30;
/** Vị trí tấm thiệp khi đã rút lên hẳn. */
const CARD_OUT_Y = -238;
/** Nắp phong bì và thân trước phải chồng nhau, không được hở khe. */
const FLAP_H = ENV_H * 0.42;
const FRONT_TOP = ENV_H * 0.32;

export function V1Envelope() {
  const stageRef = useRef<HTMLElement | null>(null);
  const progress = useStageProgress(stageRef);
  const reduced = useReducedMotion();
  const viewport = useViewport();

  // Khi người dùng bật giảm chuyển động: ghim ở trạng thái cuối (thiệp đã mở)
  // thay vì chạy hoạt cảnh. Không bao giờ để họ thấy màn hình trống.
  const p = reduced ? 0.92 : progress;

  /* ── hồi 2: dấu sáp + nắp phong bì ── */
  const sealBreak = easeOut(seg(p, 0.14, 0.32));
  const flapOpen = easeInOut(seg(p, 0.18, 0.42));

  /* ── hồi 3: rút thiệp ── */
  const pull = easeOut(seg(p, 0.36, 0.6));
  const cardY = lerp(CARD_INSIDE_Y, CARD_OUT_Y, pull);

  /* ── hồi 4: mở hai cánh ── */
  const fold = easeInOut(seg(p, 0.58, 0.82));
  const coverAngle = fold * 166;

  /* ── hồi 5: lùi lại + hiện link ── */
  const settle = easeOut(seg(p, 0.82, 1));
  const linkIn = seg(p, 0.86, 1);

  // Phong bì mờ dần sau khi thiệp đã ra hẳn.
  const envelopeOpacity = 1 - seg(p, 0.6, 0.78);

  /* Hồi đang diễn, dùng cho phần chú thích. */
  const foundCaption = CAPTIONS.findIndex((caption) => p < caption.to);
  const activeCaption = foundCaption === -1 ? CAPTIONS.length - 1 : foundCaption;

  /* Cả cụm phải vừa khung nhìn. Lúc thiệp rút lên cao nhất, chiều cao thực tế
     của cụm là |CARD_OUT_Y| + ENV_H, nên lấy đúng số đó làm mẫu số. */
  const extent = Math.abs(CARD_OUT_Y) + ENV_H;
  const fit = clamp((viewport.height * 0.8) / extent, 0.42, 1);
  // Thiệp rút lên thì hạ cả cụm xuống để bố cục vẫn nằm giữa khung nhìn.
  const groupY = lerp(0, Math.abs(CARD_OUT_Y) * 0.42, pull) - settle * 18;
  const groupScale = fit * lerp(1, 0.88, settle);

  return (
    <div className="wire-lab" style={{ background: WIRE.paper, color: WIRE.ink }}>
      <VariantSwitcher current="V1" />
      <WireHeader />

      <section className="px-6 pb-10 pt-20 text-center">
        <Label>V1 · Thiệp mở ra</Label>
        <div className="mx-auto mt-6 flex max-w-xl flex-col items-center gap-3">
          <Bar w="86%" h={30} tone={WIRE.blockDark} />
          <Bar w="54%" h={30} tone={WIRE.blockDark} />
        </div>
        <div className="mx-auto mt-7 max-w-sm">
          <TextBlock lines={2} />
        </div>
        <Label className="mt-12 animate-pulse">Cuộn xuống ↓</Label>
      </section>

      {/* ═══ SÂN KHẤU ═══ */}
      <section ref={stageRef} className="relative" style={{ height: "520vh" }}>
        <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
          {/* Chú thích đổi theo hồi. Desktop đặt ở cột trái để không bao giờ đè
              lên tấm thiệp; mobile đặt sát mép trên. */}
          <div className="pointer-events-none absolute inset-x-0 top-[6%] z-30 px-6 lg:inset-y-0 lg:left-[6%] lg:right-auto lg:top-0 lg:flex lg:w-[20rem] lg:items-center">
            <div className="relative h-14 w-full lg:h-32">
              {CAPTIONS.map((caption, captionIndex) => {
                // Chọn hồi đang diễn, để CSS chuyển mờ theo thời gian. Tính độ
                // mờ theo khoảng cách scroll thì hoặc chồng hai dòng, hoặc hở
                // một khoảng không dòng nào hiện.
                const active = captionIndex === activeCaption;
                return (
                  <div
                    key={caption.line}
                    className="absolute inset-x-0 top-0 text-center lg:text-left"
                    style={{
                      opacity: active ? 1 : 0,
                      transform: `translateY(${active ? 0 : 14}px)`,
                      transition: "opacity 420ms ease, transform 420ms ease",
                    }}
                  >
                    <Label tone={WIRE.accent}>{`Hồi ${captionIndex + 1}`}</Label>
                    <p className="mt-3 text-[clamp(1.2rem,2.4vw,1.85rem)] font-semibold leading-tight">
                      {caption.line}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sàn diễn 3D */}
          <div
            className="relative flex items-center justify-center"
            style={{
              perspective: "1600px",
              transform: `translateY(${groupY * fit}px) scale(${groupScale})`,
            }}
          >
            <div
              className="relative"
              style={{
                width: ENV_W,
                height: ENV_H,
                transformStyle: "preserve-3d",
                // Nhìn chếch từ trên xuống. Bắt buộc phải có: nắp phong bì mở
                // NGƯỢC về phía sau, nên nếu nhìn thẳng chính diện thì nó lật ra
                // sau thân sau và biến mất — người xem chỉ thấy tấm thiệp tự
                // nhiên trồi lên mà không hiểu vì sao. Nghiêng 16° là thấy được
                // cái nắp đang mở. Góc giảm dần khi thiệp rút ra để lúc đọc nội
                // dung thiệp thì mặt thiệp quay thẳng về phía người xem.
                transform: `rotateX(${lerp(16, 3, pull)}deg)`,
              }}
            >
              {/* Thân sau phong bì */}
              <div
                className="absolute inset-0"
                style={{
                  background: ENV_BACK,
                  border: `1px solid ${WIRE.line}`,
                  opacity: envelopeOpacity,
                }}
              />

              {/* Tấm thiệp — nằm giữa thân sau và thân trước, nên khi chưa rút
                  lên thì bị phong bì che đúng như thật. */}
              <div
                className="absolute left-1/2 top-0"
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  marginLeft: -CARD_W / 2,
                  // translateZ xếp lớp theo trục sâu: thân sau ở 0, thiệp ở 1,
                  // thân trước ở 2. Nhờ vậy thứ tự che nhau đúng ở mọi góc
                  // nghiêng, không phải phụ thuộc z-index.
                  transform: `translateY(${cardY}px) translateZ(1px)`,
                  transformStyle: "preserve-3d",
                }}
              >
                <LoFiCard
                  face={0}
                  className="absolute inset-0"
                  style={{ background: CARD_PAPER }}
                />

                {/* Hai cánh cửa: góc 0 thì che kín ruột thiệp, mở ra hai bên để
                    lộ ruột. */}
                <div
                  className="absolute left-0 top-0 h-full"
                  style={{
                    width: CARD_W / 2,
                    background: CARD_COVER,
                    borderRight: `1px solid ${WIRE.line}`,
                    transformOrigin: "left center",
                    transform: `rotateY(${-coverAngle}deg)`,
                    boxShadow: "8px 0 26px -12px rgba(47,44,41,0.5)",
                  }}
                >
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-5">
                    <Bar w="60%" h={7} tone={WIRE.blockDark} />
                    <Bar w="84%" h={12} tone={WIRE.blockDark} />
                  </div>
                </div>
                <div
                  className="absolute right-0 top-0 h-full"
                  style={{
                    width: CARD_W / 2,
                    background: CARD_COVER,
                    borderLeft: `1px solid ${WIRE.line}`,
                    transformOrigin: "right center",
                    transform: `rotateY(${coverAngle}deg)`,
                    boxShadow: "-8px 0 26px -12px rgba(47,44,41,0.5)",
                  }}
                >
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-5">
                    <Bar w="72%" h={12} tone={WIRE.blockDark} />
                    <Bar w="48%" h={7} tone={WIRE.block} />
                  </div>
                </div>
              </div>

              {/* Thân trước phong bì */}
              <div
                className="absolute inset-x-0"
                style={{
                  top: FRONT_TOP,
                  bottom: 0,
                  background: ENV_FRONT,
                  borderLeft: `1px solid ${WIRE.line}`,
                  borderRight: `1px solid ${WIRE.line}`,
                  borderBottom: `1px solid ${WIRE.line}`,
                  // Mép trên thân trước là chỗ tấm thiệp trượt ra, nên cần một
                  // vệt tối mảnh để thấy nó nằm TRƯỚC tấm thiệp.
                  boxShadow: "0 -3px 10px -3px rgba(47,44,41,0.28)",
                  transform: "translateZ(2px)",
                  opacity: envelopeOpacity,
                }}
              />

              {/* Nắp phong bì — tam giác, bản lề ở mép trên */}
              <div
                className="absolute inset-x-0 top-0"
                style={{
                  height: FLAP_H,
                  background: ENV_FLAP,
                  clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                  transformOrigin: "top center",
                  // Dừng ở 150° chứ không 168°: mở gần sát 180° thì cái nắp gần
                  // như song song tầm mắt và chỉ còn là mấy vệt mảnh, không đọc
                  // ra là cái nắp đang mở.
                  //
                  // translateZ(3px) — nắp phải là lớp NGOÀI CÙNG khi còn đóng,
                  // vì nó phủ lên cả tấm thiệp lẫn thân trước. Lúc đầu để nắp ở
                  // z=0 trong khi thiệp ở z=1, nên thiệp đè lên nắp và dấu sáp
                  // bị che mất: hồi 1 trông như một phong bì đã mở sẵn. Khi nắp
                  // lật ra sau thì chính phép quay đưa nó về phía sau, không cần
                  // đổi z.
                  transform: `translateZ(3px) rotateX(${-flapOpen * 150}deg)`,
                  opacity: envelopeOpacity,
                }}
              />

              {/* Dấu sáp ở đỉnh nắp: hai nửa tách ra rồi mờ đi */}
              <div
                className="absolute left-1/2"
                style={{
                  top: FLAP_H - 26,
                  marginLeft: -26,
                  width: 52,
                  height: 52,
                  opacity: (1 - sealBreak) * envelopeOpacity,
                  // Dấu sáp dán trên nắp nên phải quay CÙNG nắp, và nằm ngoài
                  // nắp một lớp nữa (z=4).
                  transform: `translateZ(4px) rotateX(${-flapOpen * 150}deg)`,
                  transformOrigin: `center ${-(FLAP_H - 52)}px`,
                }}
              >
                {[-1, 1].map((side) => (
                  <span
                    key={side}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: WIRE.accent,
                      clipPath: side === -1 ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)",
                      transform: `translateX(${side * sealBreak * 34}px) rotate(${side * sealBreak * 26}deg)`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Hồi 5: đường link + nút chia sẻ */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-[9%] z-20 flex flex-col items-center gap-4 px-6"
            style={{ opacity: linkIn, transform: `translateY(${(1 - linkIn) * 24}px)` }}
          >
            <div
              className="flex w-[min(24rem,86vw)] items-center gap-3 rounded-[3px] px-4 py-3"
              style={{ background: "#fff", border: `1px solid ${WIRE.line}` }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: WIRE.accent }} />
              <Bar w="72%" h={8} tone={WIRE.block} />
            </div>
            <div className="flex gap-2.5">
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className="block h-9 w-9 rounded-[3px]"
                  style={{ background: WIRE.block, border: `1px solid ${WIRE.line}` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Thân trang, sau đoạn chuyển động ── */}
      <WireChapter code="01 · Mẫu thiệp" layout="left" tone={WIRE.paper} />
      <WireChapter code="02 · Cách hoạt động" layout="right" tone={WIRE.paperDeep} />
      <WireChapter code="03 · Bên trong tấm thiệp" layout="index" tone={WIRE.paper} />
      <WireChapter code="04 · Khách mời & RSVP" layout="left" tone={WIRE.paperDeep} />
      <WireChapter code="05 · Lời cặp đôi" layout="center" tone={WIRE.paper} />

      <section className="px-6 py-24 text-center" style={{ background: WIRE.dark }}>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
          <Bar w="72%" h={26} tone="rgba(255,255,255,0.3)" />
          <Bar w="46%" h={26} tone="rgba(255,255,255,0.3)" />
          <FakeButton className="mt-6" />
        </div>
      </section>

      <WireFooter />
      <ProgressReadout progress={progress} acts={ACTS} />
    </div>
  );
}
