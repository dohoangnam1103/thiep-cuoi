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
  lerp,
  useReducedMotion,
  useStageProgress,
  useViewport,
} from "./kit";

/**
 * V3 — ALBUM LẬT NGANG
 *
 * Cuộn dọc bị đổi thành dịch chuyển NGANG: một dải sáu trang album trượt sang
 * trái theo tiến độ cuộn, như đang lật một quyển album cưới đặt trước mặt.
 *
 * Cách làm: sân khấu cao 600vh, bên trong là khung dính cao một khung nhìn và
 * cắt tràn. Dải bên trong rộng 600vw, dịch `-progress × 500vw`. Mỗi trang thêm
 * một chút `rotateY` theo khoảng cách tới tâm nên hai trang ngoài rìa hơi
 * nghiêng đi — đó là thứ làm nó đọc ra "quyển sách" chứ không phải "băng
 * chuyền".
 *
 * Điểm mạnh: lạ nhất trong bốn phương án, và hợp nghĩa "album cưới". Người xem
 * gần như chắc chắn sẽ nhớ.
 * Điểm yếu: cuộn dọc mà nội dung đi ngang là nghịch trực giác với một số người;
 * cũng khó cho SEO/đọc nhanh vì không thể "quét mắt" cả trang. Trên mobile phải
 * đổi sang xếp dọc (đã xử lý ở dưới).
 */

const ACTS = ["Trang 1", "Trang 2", "Trang 3", "Trang 4", "Trang 5", "Trang 6"];

const SPREADS: Array<{ code: string; kind: "cover" | "cards" | "text" | "grid" | "closing" }> = [
  { code: "Bìa · Lời mời", kind: "cover" },
  { code: "01 · Mẫu thiệp", kind: "cards" },
  { code: "02 · Cách hoạt động", kind: "text" },
  { code: "03 · Bên trong tấm thiệp", kind: "grid" },
  { code: "04 · Khách mời & RSVP", kind: "text" },
  { code: "05 · Gửi đi", kind: "closing" },
];

export function V3Album() {
  const stageRef = useRef<HTMLElement | null>(null);
  const progress = useStageProgress(stageRef);
  const reduced = useReducedMotion();
  const viewport = useViewport();

  const narrow = viewport.width < 820;
  const track = progress * (SPREADS.length - 1);

  // Màn hình hẹp: bỏ hẳn cơ chế ngang, xếp dọc như một trang thường. Lật ngang
  // trên điện thoại đánh nhau với cử chỉ cuộn của hệ điều hành.
  if (narrow || reduced) {
    return (
      <div className="wire-lab" style={{ background: WIRE.paper, color: WIRE.ink }}>
        <VariantSwitcher current="V3" />
        <WireHeader />
        <section className="px-6 py-16 text-center">
          <Label tone={WIRE.accent}>V3 · Album lật ngang</Label>
          <p className="mx-auto mt-4 max-w-sm text-sm" style={{ color: WIRE.inkSoft }}>
            {reduced
              ? "Đang bật chế độ giảm chuyển động — hiển thị bản xếp dọc."
              : "Màn hình hẹp — hiển thị bản xếp dọc thay cho lật ngang."}
          </p>
        </section>
        {SPREADS.map((spread, index) => (
          <section
            key={spread.code}
            className="px-6 py-20"
            style={{ background: index % 2 ? WIRE.paperDeep : WIRE.paper }}
          >
            <div className="mx-auto max-w-md">
              <Label tone={WIRE.accent}>{spread.code}</Label>
              <div className="mt-5 flex flex-col gap-3">
                <Bar w="88%" h={24} tone={WIRE.blockDark} />
                <Bar w="54%" h={24} tone={WIRE.blockDark} />
              </div>
              <TextBlock lines={3} className="mt-6" />
              <LoFiCard face={index} className="mt-8 h-[22rem] w-full" dense />
            </div>
          </section>
        ))}
        <WireFooter />
      </div>
    );
  }

  return (
    <div className="wire-lab" style={{ background: WIRE.paper, color: WIRE.ink }}>
      <VariantSwitcher current="V3" />
      <WireHeader />

      <section className="px-6 pb-8 pt-16 text-center">
        <Label>V3 · Album lật ngang</Label>
        <div className="mx-auto mt-6 flex max-w-xl flex-col items-center gap-3">
          <Bar w="80%" h={30} tone={WIRE.blockDark} />
          <Bar w="48%" h={30} tone={WIRE.blockDark} />
        </div>
        <Label className="mt-10 animate-pulse">Cuộn xuống để lật trang →</Label>
      </section>

      {/* ═══ SÂN KHẤU NGANG ═══ */}
      <section ref={stageRef} className="relative" style={{ height: "600vh" }}>
        <div
          className="sticky top-0 h-screen overflow-hidden"
          style={{ background: WIRE.paperDeep, perspective: "2200px" }}
        >
          <div
            className="flex h-full"
            style={{
              width: `${SPREADS.length * 100}vw`,
              transform: `translateX(${-progress * (SPREADS.length - 1) * 100}vw)`,
              transformStyle: "preserve-3d",
            }}
          >
            {SPREADS.map((spread, index) => {
              // Khoảng cách tới trang đang xem, dùng cho nghiêng + tối dần.
              const offset = track - index;
              const tilt = clamp(offset, -1.4, 1.4) * 7;
              const dim = clamp(Math.abs(offset) - 0.25) * 0.5;

              return (
                <article
                  key={spread.code}
                  className="relative flex h-full w-screen shrink-0 items-center justify-center px-[6vw]"
                  style={{
                    transform: `rotateY(${-tilt}deg)`,
                    transformOrigin: offset > 0 ? "left center" : "right center",
                  }}
                >
                  {/* Nền trang giấy */}
                  <div
                    className="absolute inset-y-[8vh] inset-x-[3vw]"
                    style={{
                      background: WIRE.paper,
                      border: `1px solid ${WIRE.line}`,
                      boxShadow: "0 40px 90px -50px rgba(47,44,41,0.55)",
                    }}
                  />
                  {/* Sống sách ở giữa trang */}
                  <div
                    aria-hidden
                    className="absolute inset-y-[8vh] left-1/2 w-[2px] -translate-x-1/2"
                    style={{
                      background: `linear-gradient(to right, transparent, ${WIRE.line}, transparent)`,
                    }}
                  />
                  {/* Lớp tối cho trang đang lệch khỏi tâm */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ background: `rgba(43,39,36,${dim})` }}
                  />

                  <div className="relative z-10 grid w-full max-w-5xl grid-cols-2 items-center gap-[6vw]">
                    <SpreadLeft kind={spread.kind} index={index} />
                    <div>
                      <Label tone={WIRE.accent}>{spread.code}</Label>
                      <div className="mt-6 flex flex-col gap-3">
                        <Bar w="92%" h={28} tone={WIRE.blockDark} />
                        <Bar w="58%" h={28} tone={WIRE.blockDark} />
                      </div>
                      <TextBlock lines={3} className="mt-7" />
                      {index === 0 || index === SPREADS.length - 1 ? (
                        <FakeButton className="mt-9" />
                      ) : null}
                    </div>
                  </div>

                  {/* Số trang */}
                  <Label className="absolute bottom-[11vh] right-[7vw] !tracking-[0.4em]">
                    {String(index + 1).padStart(2, "0")} / {String(SPREADS.length).padStart(2, "0")}
                  </Label>
                </article>
              );
            })}
          </div>

          {/* Thanh lật trang dưới đáy */}
          <div className="pointer-events-none absolute inset-x-0 bottom-[3.5vh] flex justify-center gap-2">
            {SPREADS.map((spread, index) => (
              <span
                key={spread.code}
                className="h-[3px] rounded-full transition-all duration-300"
                style={{
                  width: Math.round(lerp(14, 44, clamp(1 - Math.abs(track - index)))),
                  background:
                    Math.abs(track - index) < 0.5 ? WIRE.accent : WIRE.blockDark,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <WireFooter />
      <ProgressReadout progress={progress} acts={ACTS} />
    </div>
  );
}

/** Nửa trái của mỗi trang album — đổi kiểu để sáu trang không giống nhau. */
function SpreadLeft({ kind, index }: { kind: string; index: number }) {
  if (kind === "cards") {
    return (
      <div className="flex gap-4">
        <LoFiCard face={1} className="h-[46vh] flex-1" dense />
        <LoFiCard face={2} className="mt-8 h-[38vh] flex-1" dense />
      </div>
    );
  }
  if (kind === "grid") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, cell) => (
          <div
            key={cell}
            className="aspect-[4/3]"
            style={{ background: WIRE.block, border: `1px solid ${WIRE.line}` }}
          />
        ))}
      </div>
    );
  }
  if (kind === "text") {
    return (
      <div className="flex flex-col gap-6">
        {Array.from({ length: 3 }).map((_, row) => (
          <div key={row} className="flex gap-4" style={{ borderTop: `1px solid ${WIRE.line}`, paddingTop: 18 }}>
            <Bar w={34} h={30} tone={WIRE.accent} />
            <div className="flex-1">
              <Bar w="60%" h={13} tone={WIRE.blockDark} />
              <TextBlock lines={2} className="mt-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return <LoFiCard face={index} className="mx-auto h-[54vh] w-[70%]" />;
}
