"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  photos: string[];
  accent: string;
  onOpen: (index: number) => void;
};

/**
 * Coverflow 3D dùng cho layout album "3D" của mọi mẫu thiệp. Dựng lại đúng widget
 * album của chungdoi.com: sân khấu `perspective: 1000px`, thẻ tỉ lệ 2/3 cao 92%,
 * và bậc chuyển cảnh cố định theo khoảng cách tới thẻ giữa. Số liệu lấy từ DOM
 * bản gốc:
 *
 * `rotateY` CÙNG dấu với `translateX` (thẻ bên phải quay +45°). Đảo dấu vẫn ra
 * đúng chiều cao nên mắt khó thấy, chỉ bề rộng hình chiếu bị sai.
 *
 * | offset | translateX | translateZ | rotateY | scale | opacity | z-index |
 * |--------|-----------|-----------|---------|-------|---------|---------|
 * | 0      | 0%        | 0         | 0       | 1     | 1       | 100     |
 * | ±1     | ±60%      | -150px    | ±45°    | 0.85  | 0.75    | 99      |
 * | ±2     | ±120%     | -300px    | ±90°    | 0.7   | 0.5     | 98      |
 * | ±3     | ±180%     | -450px    | ±135°   | 0.7   | 0.3     | 97      |
 * | ±n     | ±n·60%    | -n·150px  | ±n·45°  | 0.7   | 0.3     | 100−n   |
 *
 * Thay cho coverflow Swiper cũ (`effect="coverflow"`, thẻ 220px tỉ lệ 3/4): bản
 * này khớp bản gốc và không cần dependency `swiper`.
 */
/**
 * Bậc là tuyến tính theo khoảng cách n nên áp dụng được cho album bao nhiêu ảnh
 * cũng đúng: bản gốc với 8 ảnh đi tới n=4 (`translateX(240%) translateZ(-600px)
 * rotateY(180deg)`, z-index 96). Bảng cứng 4 dòng sẽ kẹp n=4 về n=3 và làm sai
 * thẻ ngoài cùng.
 *
 * Kẹp ở MAX_DISTANCE=4 vì album do người dùng upload không giới hạn số ảnh: n=10
 * sẽ đẩy thẻ ra `translateX(600%)` và quay 450°, tràn khỏi sân khấu và làm mặt
 * sau ảnh lật ngược. Mọi thẻ từ n≥4 nằm chồng nhau ở opacity 0.3 nên kẹp không
 * làm đổi hình ảnh của album ≤9 ảnh — gồm cả 2 mẫu clone 7 và 8 ảnh.
 */
const MAX_DISTANCE = 4;

function stepFor(rawDistance: number) {
  const distance = Math.min(rawDistance, MAX_DISTANCE);
  return {
    x: distance * 60,
    z: distance * -150,
    rotate: distance * 45,
    scale: distance === 0 ? 1 : distance === 1 ? 0.85 : 0.7,
    opacity: distance === 0 ? 1 : distance === 1 ? 0.75 : distance === 2 ? 0.5 : 0.3,
    zIndex: 100 - distance,
  };
}

const AUTOPLAY_MS = 4000;

export default function CoverflowGallery({ photos, accent, onOpen }: Props) {
  const count = photos.length;
  const [active, setActive] = useState(0);
  const timer = useRef<number | null>(null);

  const schedule = useCallback(function next() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    if (count <= 1) return;
    timer.current = window.setTimeout(() => {
      setActive((i) => (i + 1) % count);
      next();
    }, AUTOPLAY_MS);
  }, [count]);

  useEffect(() => {
    schedule();
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [schedule]);

  if (count === 0) return null;

  const step = (delta: number) => {
    schedule();
    setActive((i) => (i + delta + count) % count);
  };
  const select = (index: number) => {
    schedule();
    setActive(index);
  };

  /** Khoảng cách có dấu tới thẻ giữa, đi vòng cho danh sách tuần hoàn. */
  const signedOffset = (index: number) => {
    let d = index - active;
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    return d;
  };

  return (
    <div className="w-full">
      <div className="relative h-[340px] touch-pan-y md:h-[520px]">
        {count > 1 ? (
          <>
            <button
              type="button"
              aria-label="Ảnh trước"
              onClick={() => step(-1)}
              className="absolute left-0 top-1/2 z-[200] hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/10 transition-colors hover:bg-black/20 md:flex"
              style={{ color: accent }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Ảnh sau"
              onClick={() => step(1)}
              className="absolute right-0 top-1/2 z-[200] hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/10 transition-colors hover:bg-black/20 md:flex"
              style={{ color: accent }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        ) : null}

        <div className="relative flex h-full w-full items-center justify-center" style={{ perspective: "1000px" }}>
          {photos.map((src, index) => {
            const offset = signedOffset(index);
            const s = stepFor(Math.abs(offset));
            const sign = Math.sign(offset);
            const isActive = offset === 0;
            return (
              <button
                // Khoá theo cả index: album do người dùng nhập có thể chứa cùng
                // một URL hai lần, key trùng làm React bỏ bớt thẻ.
                key={`${index}-${src}`}
                type="button"
                onClick={() => (isActive ? onOpen(index) : select(index))}
                aria-label={isActive ? `Xem ảnh cưới ${index + 1}` : `Chuyển tới ảnh ${index + 1}`}
                className={`absolute h-[92%] cursor-pointer overflow-hidden rounded-[16px] shadow-xl transition-all ease-in-out ${isActive ? "ring-2 ring-white/30" : ""}`}
                style={{
                  aspectRatio: "0.6666666666666666",
                  transitionDuration: "1100ms",
                  transform: `translateX(${sign * s.x}%) translateZ(${s.z}px) rotateY(${sign * s.rotate}deg) scale(${s.scale})`,
                  opacity: s.opacity,
                  zIndex: s.zIndex,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Ảnh cưới ${index + 1}`} className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      </div>

      {count > 1 ? (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {photos.map((src, index) => (
            <button
              key={`${index}-${src}`}
              type="button"
              aria-label={`Tới ảnh ${index + 1}`}
              onClick={() => select(index)}
              className={`rounded-full bg-current transition-all duration-300 ${index === active ? "h-2 w-6 opacity-70" : "h-2 w-2 opacity-25 hover:opacity-40"}`}
              style={{ color: accent }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
