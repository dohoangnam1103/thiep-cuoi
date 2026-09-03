"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import {
  clamp,
  frameFromTrack,
  NAV_JUMP_EASE,
  SCRUB,
  SEGMENTS,
  SNAP_BACKWARD,
  SNAP_DELAY,
  SNAP_DURATION,
  SNAP_EASE,
  SNAP_FORWARD,
  type V9Frame,
} from "./v9-stations";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin);

/**
 * Bộ máy cuộn của hành trình — dựng trên GSAP ScrollTrigger.
 *
 * Trước đây phần này là một vòng lặp scroll tự viết: tự nghe `scroll`, tự dò
 * "đã dừng cuộn chưa", tự tween `window.scrollTo`. Nó chạy được nhưng có hai
 * khuyết điểm cố hữu mà user nhận ra ngay:
 *
 * 1. Chuyển động bám cứng vào vị trí cuộn, nên mọi nhịp giật của trackpad và mọi
 *    bậc nhảy của con lăn chuột hiện nguyên vẹn lên tấm thiệp.
 * 2. Cú tự đi tới trạm kế phải tự cân thời lượng và đường cong bằng tay, và việc
 *    vẽ lại đi vòng qua sự kiện `scroll` nên trễ so với vị trí cuộn.
 *
 * ScrollTrigger giải cả hai bằng phần đã được tinh chỉnh sẵn: `scrub` cho chuyển
 * động đuổi theo cuộn có quán tính, `snap` cho cú tự về trạm. Mọi việc ghi giá
 * trị diễn ra trong ticker của GSAP nên không còn đường vòng qua sự kiện.
 *
 * Ghim màn hình vẫn dùng `position: sticky` của CSS, KHÔNG dùng `pin` của
 * ScrollTrigger: `pin` tự chèn phần tử bọc và tự tính lại chiều cao, sẽ phá bố
 * cục đã dựng và đã kiểm chứng.
 *
 * Hook KHÔNG biết gì về hình. Nó chỉ đưa ra một khung hình mỗi frame qua `paint`
 * cho hành trình desktop. Mobile dùng native horizontal scroll-snap riêng và
 * không đi qua hook này.
 */
export function useJourneyMotion({
  enabled,
  stageRef,
  sceneRef,
  paint,
}: {
  enabled: boolean;
  stageRef: RefObject<HTMLElement | null>;
  sceneRef: RefObject<HTMLDivElement | null>;
  paint: (frame: V9Frame) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<ScrollTrigger | null>(null);

  /* `paint` được tạo lại mỗi lần render (nó đóng gói state của component). Giữ
     trong ref để effect của useGSAP không phải chạy lại — dựng lại ScrollTrigger
     mỗi lần render sẽ làm mất vị trí cuộn và huỷ cú snap đang chạy. */
  const paintRef = useRef(paint);
  useEffect(() => {
    paintRef.current = paint;
  }, [paint]);

  useGSAP(
    () => {
      const stage = stageRef.current;
      if (!enabled || !stage) return;

      let currentIndex = 0;

      const render = (rawTrack: number) => {
        const frame = frameFromTrack(rawTrack);
        sceneRef.current?.style.setProperty("--v9-progress", String(frame.progress));
        paintRef.current(frame);

        const nextIndex = frame.t < 0.5 ? frame.fromIndex : frame.fromIndex + 1;
        if (nextIndex !== currentIndex) {
          currentIndex = nextIndex;
          setActiveIndex(nextIndex);
        }
      };

      /* Timeline chỉ chạy một con số từ 0 tới SEGMENTS theo đường thẳng.
         ScrollTrigger cần một animation để `scrub` bám vào, và cách này giữ
         nguyên quyền kiểm soát phép quy đổi ở `render`. */
      const cursor = { track: 0 };
      const timeline = gsap.timeline({ paused: true });
      timeline.to(cursor, {
        track: SEGMENTS,
        duration: 1,
        ease: "none",
        onUpdate: () => render(cursor.track),
      });

      const trigger = ScrollTrigger.create({
        animation: timeline,
        trigger: stage,
        // Khớp đúng hình học của `position: sticky`: tiến độ 0 khi đỉnh cảnh dán
        // vào đỉnh khung nhìn, tiến độ 1 khi đáy cảnh chạm đáy khung nhìn.
        start: "top top",
        end: "bottom bottom",
        scrub: SCRUB,
        snap: {
          /* Tự chọn trạm thay vì để GSAP làm tròn về mốc gần nhất. Hai lý do:
             cần ngưỡng lệch theo chiều cuộn, và cần chắc chắn chỉ đi ĐÚNG MỘT
             trạm mỗi lần chứ không nhảy cóc. */
          snapTo: (value, self) => {
            const raw = clamp(value, 0, 1) * SEGMENTS;
            const base = Math.floor(raw);
            const fraction = raw - base;
            const forward = (self?.direction ?? 1) >= 0;
            const threshold = forward ? SNAP_FORWARD : SNAP_BACKWARD;
            const index = clamp(
              fraction >= threshold ? base + 1 : base,
              0,
              SEGMENTS,
            );
            return index / SEGMENTS;
          },
          duration: SNAP_DURATION,
          delay: SNAP_DELAY,
          ease: SNAP_EASE,
          inertia: false,
          directional: false,
        },
      });

      triggerRef.current = trigger;
      render(trigger.progress * SEGMENTS);

      return () => {
        triggerRef.current = null;
      };
    },
    { dependencies: [enabled, stageRef, sceneRef] },
  );

  /* Bấm một trạm trên lộ trình: cuộn tới đúng vị trí trạm đó. Dùng ScrollToPlugin
     để cú cuộn này cũng nằm trong ticker của GSAP, và để ScrollTrigger không coi
     nó là cuộn tay rồi snap chồng lên. */
  const goToStep = useCallback((index: number) => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const target = clamp(index, 0, SEGMENTS) / SEGMENTS;
    gsap.to(window, {
      scrollTo: {
        y: trigger.start + target * (trigger.end - trigger.start),
        autoKill: true,
      },
      // Ngắn hơn quãng cảm nhận thật, vì `scrub` còn thêm một đoạn đuôi đuổi
      // theo sau khi cuộn đã tới đích.
      duration: 0.4 + Math.abs(target - trigger.progress) * 0.55,
      ease: NAV_JUMP_EASE,
      overwrite: true,
    });
  }, []);

  return { activeIndex, goToStep };
}

/** Theo dõi `prefers-reduced-motion`. Cả hai layout đều rơi về bản tĩnh khi bật. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}

/**
 * Chọn bố cục theo bề ngang màn hình. Ngưỡng 899px khớp với breakpoint mobile
 * trong `v9.css`.
 *
 * Trả `null` ở lần render đầu (kể cả trên server) rồi mới quyết định trong effect
 * — nhờ vậy chỉ MỘT cây DOM được mount thay vì dựng cả hai rồi ẩn một cái bằng
 * CSS. Hai cây DOM nghĩa là hai bản tấm thiệp, hai bộ ảnh, và hai ScrollTrigger
 * cùng chạy.
 */
export function useIsMobileLayout() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 899px)");
    const sync = () => setIsMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return isMobile;
}
