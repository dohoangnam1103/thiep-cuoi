"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  photos: string[];
  accent: string;
  onOpen: (index: number) => void;
  paused?: boolean;
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

/**
 * Ngưỡng vuốt. Mũi tên prev/next là `hidden md:flex` nên trên mobile không có
 * cách nào chuyển ảnh ngoài chạm thẻ bên cạnh hoặc bấm dot — vuốt là thao tác
 * người dùng mong đợi ở một album 3D.
 *
 * Sân khấu đã có `touch-pan-y`: trình duyệt vẫn tự lo cuộn dọc, còn cử chỉ ngang
 * không bị nó chiếm nên pointermove/up đến được tay chúng ta. Vì vậy chỉ nhận
 * cử chỉ nào ngang trội hơn dọc, tránh giật ảnh khi người dùng đang cuộn trang.
 */
const SWIPE_MIN_PX = 40;

export function CoverflowGallery({ photos, accent, onOpen, paused = false }: Props) {
  const t = useTranslations("invitationTemplate");
  const count = photos.length;
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => typeof document !== "undefined" && !document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const timer = useRef<number | null>(null);
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  // Nhả tay sau khi vuốt vẫn sinh ra một click trên thẻ nằm dưới ngón. Cờ này để
  // chặn nó, nếu không mỗi lần vuốt sẽ mở luôn lightbox.
  const swiped = useRef(false);
  const canAutoplay = isVisible && pageVisible && !reducedMotion && !paused;

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    // Reserve the stage's height immediately, but don't fetch full-resolution
    // photos while the guest is still at the opening/hero.
    const preload = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setHasEntered(true);
      preload.disconnect();
    }, { rootMargin: "600px 0px" });
    const visibility = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    });
    preload.observe(element);
    visibility.observe(element);
    return () => { preload.disconnect(); visibility.disconnect(); };
  }, []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReducedMotion(motion.matches);
    const onVisibility = () => setPageVisible(!document.hidden);
    motion.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const schedule = useCallback(function next() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    if (count <= 1 || !canAutoplay) return;
    timer.current = window.setTimeout(() => {
      setActive((i) => (i + 1) % count);
      next();
    }, AUTOPLAY_MS);
  }, [count, canAutoplay]);

  useEffect(() => {
    schedule();
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [schedule]);

  useEffect(() => {
    if (!canAutoplay) return;
    // Restart the delay on scroll, without rerendering on each scroll event.
    // A new 3D transition must not compete with the guest's vertical gesture.
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", schedule, true);
  }, [canAutoplay, schedule]);

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

  const handlePointerDown = (e: React.PointerEvent) => {
    // Dọn cờ ngay từ đầu mỗi cử chỉ: nếu lần vuốt trước nhả tay ra ngoài thẻ thì
    // không có click nào tới để tiêu thụ cờ, để sót lại sẽ ăn mất cú chạm sau.
    swiped.current = false;
    // Bỏ qua ngón thứ hai: pinch-zoom không phải lệnh chuyển ảnh.
    if (count <= 1 || !e.isPrimary) {
      gesture.current = null;
      return;
    }
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.id !== e.pointerId) return;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return;

    swiped.current = true;
    step(dx < 0 ? 1 : -1);
  };

  return (
    <div ref={root} className="w-full" data-invitation-album="coverflow">
      <div
        className="relative h-[340px] touch-pan-y md:h-[520px]"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          gesture.current = null;
        }}
        // Bắt ở pha capture để chặn click TRƯỚC khi nó tới thẻ, khỏi phải nhớ
        // kiểm tra cờ trong từng handler của thẻ và dot.
        onClickCapture={(e) => {
          if (!swiped.current) return;
          swiped.current = false;
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {count > 1 ? (
          <>
            <button
              type="button"
              aria-label={t("lightboxPrevious")}
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
              aria-label={t("lightboxNext")}
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

        <div className="relative flex h-full w-full items-center justify-center [perspective:1000px]">
          {hasEntered && photos.map((src, index) => {
            const offset = signedOffset(index);
            // Far cards used to stack at the same ±4 position, retaining every
            // huge decoded image and 3D layer. Keep only the visible window;
            // dots and the lightbox still address the complete original album.
            if (Math.abs(offset) > MAX_DISTANCE) return null;
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
                aria-label={t(isActive ? "coverflowOpen" : "coverflowSelect", { index: index + 1 })}
                className={`absolute aspect-[2/3] h-[92%] cursor-pointer overflow-hidden rounded-[16px] shadow-xl transition-[transform,opacity] ease-in-out motion-reduce:transition-none ${isActive ? "ring-2 ring-white/30" : ""}`}
                style={{
                  transitionDuration: "1100ms",
                  transform: `translateX(${sign * s.x}%) translateZ(${s.z}px) rotateY(${sign * s.rotate}deg) scale(${s.scale})`,
                  opacity: s.opacity,
                  zIndex: s.zIndex,
                }}
              >
                {/* draggable=false: ảnh kéo được theo mặc định, trên desktop cú
                    kéo native sẽ cắt ngang chuỗi pointer và vuốt bằng chuột hỏng */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={t("lightboxPhotoAlt", { index: index + 1 })} decoding="async" draggable={false} className="h-full w-full object-cover" />
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
              aria-label={t("coverflowGoTo", { index: index + 1 })}
              aria-current={index === active ? "true" : undefined}
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

export default CoverflowGallery;
