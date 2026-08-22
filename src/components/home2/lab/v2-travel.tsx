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
  WireFooter,
  WireHeader,
  clamp,
  easeInOut,
  lerp,
  useReducedMotion,
  useStageProgress,
  useViewport,
} from "./kit";

/**
 * V2 — THIỆP DU HÀNH
 *
 * Chỉ có MỘT tấm thiệp trên cả đoạn này. Nó không bao giờ bị tháo ra rồi dựng
 * lại — chỉ đổi vị trí, cỡ, góc nghiêng và mặt thiệp khi cuộn qua từng chương.
 * Chữ thì đảo bên: chương lẻ chữ bên trái, chương chẵn chữ bên phải, nên tấm
 * thiệp luôn nằm ở nửa còn trống.
 *
 * Cách tính: mỗi chương có một "mốc" {x, y, scale, rotate, face}. Tiến độ cuộn
 * đổi thành một số thực trên trục mốc (ví dụ 2.4 = đang ở giữa mốc 2 và 3), rồi
 * nội suy từng thuộc tính. Nhờ vậy chuyển động liên tục và không giật ở ranh
 * giới chương, kể cả khi cuộn rất nhanh hay nhảy bằng thanh cuộn.
 *
 * Điểm mạnh: mượt, sang, không tốn 5 màn hình mới vào nội dung — mỗi màn hình
 * đều đang giới thiệu một tính năng.
 * Điểm yếu: đây là ngôn ngữ chuyển động của trang sản phẩm công nghệ (Apple,
 * Linear). Sang nhưng không riêng của cưới.
 */

const ACTS = [
  "Lời mời",
  "Chọn mẫu",
  "Điền thông tin",
  "Album & bản đồ",
  "Khách mời xác nhận",
  "Gửi đi",
];

type Key = {
  /** Lệch ngang so với tâm khung nhìn, theo % bề ngang. */
  x: number;
  /** Lệch dọc so với tâm khung nhìn, theo % chiều cao. */
  y: number;
  scale: number;
  rotate: number;
  face: number;
};

const KEYS: Key[] = [
  { x: 24, y: 0, scale: 1.0, rotate: -3, face: 0 },
  { x: -26, y: -2, scale: 0.84, rotate: 4, face: 1 },
  { x: 25, y: 2, scale: 1.06, rotate: -2, face: 2 },
  { x: -24, y: 0, scale: 0.72, rotate: 5, face: 3 },
  { x: 23, y: -3, scale: 0.94, rotate: -4, face: 4 },
  { x: 0, y: 0, scale: 1.22, rotate: 0, face: 0 },
];

const PANELS: Array<{ code: string; side: "left" | "right"; lines: number }> = [
  { code: "Mở đầu", side: "left", lines: 2 },
  { code: "01 · Mẫu thiệp", side: "right", lines: 3 },
  { code: "02 · Điền thông tin", side: "left", lines: 3 },
  { code: "03 · Album & bản đồ", side: "right", lines: 3 },
  { code: "04 · Khách mời & RSVP", side: "left", lines: 4 },
  { code: "05 · Gửi bằng một link", side: "right", lines: 2 },
];

const CARD_W = 268;
const CARD_H = 376;

export function V2Travel() {
  const stageRef = useRef<HTMLElement | null>(null);
  const progress = useStageProgress(stageRef);
  const reduced = useReducedMotion();
  const viewport = useViewport();

  // Vị trí trên trục mốc. PANELS.length - 1 khoảng giữa PANELS.length mốc.
  const track = progress * (KEYS.length - 1);
  const index = Math.min(Math.floor(track), KEYS.length - 2);
  const local = easeInOut(clamp(track - index));

  const from = KEYS[index];
  const to = KEYS[index + 1];

  const x = lerp(from.x, to.x, local);
  const y = lerp(from.y, to.y, local);
  const scale = lerp(from.scale, to.scale, local);
  const rotate = lerp(from.rotate, to.rotate, local);
  // Mặt thiệp đổi ở giữa quãng, kèm một nhịp lật nhẹ quanh trục dọc.
  const face = local < 0.5 ? from.face : to.face;
  const flip = Math.sin(local * Math.PI) * 16;

  // Trên màn hình hẹp thì bỏ hẳn lối đi ngang: thiệp nằm giữa, chữ xếp dưới.
  const narrow = viewport.width < 900;

  // Thẻ chỉ hiện khi sân khấu còn trong khung nhìn. Không cần đo thêm: tiến độ
  // bằng 0 tuyệt đối hoặc 1 tuyệt đối nghĩa là đã ra khỏi vùng diễn.
  const visible = progress > 0.001 && progress < 0.999;

  return (
    <div className="wire-lab" style={{ background: WIRE.paper, color: WIRE.ink }}>
      <VariantSwitcher current="V2" />
      <WireHeader />

      {/* Tấm thiệp du hành. Đặt fixed để nó thật sự không rời khung nhìn. */}
      {!reduced ? (
        <div
          aria-hidden
          className="pointer-events-none fixed left-1/2 top-1/2 z-20"
          style={{
            width: CARD_W,
            height: CARD_H,
            opacity: visible ? 1 : 0,
            transition: "opacity 320ms ease",
            perspective: "1200px",
            transform: [
              "translate(-50%, -50%)",
              `translate(${narrow ? 0 : x}vw, ${narrow ? 0 : y}vh)`,
              `scale(${narrow ? scale * 0.78 : scale})`,
            ].join(" "),
          }}
        >
          <LoFiCard
            face={face}
            className="h-full w-full"
            style={{ transform: `rotate(${rotate}deg) rotateY(${flip}deg)` }}
          />
        </div>
      ) : null}

      {/* ═══ SÂN KHẤU: 6 tấm, mỗi tấm một khung nhìn ═══ */}
      <section ref={stageRef} className="relative">
        {PANELS.map((panel, panelIndex) => {
          const distance = Math.abs(track - panelIndex);
          const focus = clamp(1 - distance * 1.15);
          return (
            <div
              key={panel.code}
              className="flex min-h-screen items-center px-6"
              style={{ background: panelIndex % 2 === 0 ? WIRE.paper : WIRE.paperDeep }}
            >
              <div className="mx-auto w-full max-w-6xl">
                <div
                  className={`flex ${
                    narrow
                      ? "flex-col items-center pb-[46vh] pt-[8vh] text-center"
                      : panel.side === "left"
                        ? "justify-start"
                        : "justify-end"
                  }`}
                >
                  <div
                    className="w-full max-w-md"
                    style={{
                      opacity: reduced ? 1 : lerp(0.16, 1, focus),
                      transform: reduced ? "none" : `translateY(${(1 - focus) * 22}px)`,
                    }}
                  >
                    <Label tone={WIRE.accent}>{panel.code}</Label>
                    <div className={`mt-6 flex flex-col gap-3 ${narrow ? "items-center" : ""}`}>
                      <Bar w="88%" h={27} tone={WIRE.blockDark} />
                      <Bar w="56%" h={27} tone={WIRE.blockDark} />
                    </div>
                    <TextBlock lines={panel.lines} className="mt-7" />
                    {panelIndex === 0 || panelIndex === PANELS.length - 1 ? (
                      <FakeButton className="mt-9" />
                    ) : null}

                    {/* Ở màn hình hẹp, thiệp nằm giữa nên chừa chỗ bằng padding
                        phía dưới; thẻ giả này chỉ để thấy khoảng chừa. */}
                    {narrow && reduced ? (
                      <LoFiCard
                        face={panel.side === "left" ? 1 : 2}
                        className="mx-auto mt-10"
                        style={{ width: CARD_W * 0.8, height: CARD_H * 0.8 }}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <WireFooter />
      <ProgressReadout progress={progress} acts={ACTS} />
    </div>
  );
}
