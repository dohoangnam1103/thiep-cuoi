"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type AdminTableScrollerProps = {
  children: ReactNode;
  className?: string;
};

type Track = { width: number; overflowing: boolean };
type Edges = { start: boolean; end: boolean };

/**
 * 1px chênh lệch là chuyện thường của layout dưới pixel: so bằng `>` trần sẽ
 * làm cờ "còn cuộn được" bật/tắt liên tục ở hai đầu.
 */
const SLACK = 1;

/** Dưới ngưỡng này coi như hai bên đã trùng, khỏi gán lại kẻo dội qua dội lại. */
const SYNC_EPSILON = 0.5;

/**
 * Khung cuộn ngang dùng chung cho các bảng quản trị.
 *
 * Bảng admin nào cũng rộng hơn khung nội dung, nên `overflow-x-auto` là bắt
 * buộc. Vấn đề là thanh cuộn của một vùng cuộn luôn nằm ở đáy vùng đó — tức
 * đáy bảng — và một trang 20-200 dòng thì đáy bảng ở tận cuối trang. Muốn kéo
 * ngang phải cuộn dọc hết bảng trước.
 *
 * Cách chữa: giữ bảng cuộn như cũ, nhưng thanh nhìn thấy là một vùng cuộn thứ
 * hai cao 14px được ghim ở đáy màn hình (`sticky bottom`), đồng bộ `scrollLeft`
 * hai chiều với bảng. Thanh gốc bị ẩn để không có hai thanh cạnh nhau — nhưng
 * chỉ ẩn sau khi component gắn (`data-proxy="on"`), nên nếu JS chưa chạy thì
 * bảng vẫn còn thanh cuộn dùng được.
 *
 * `sticky` thay vì `fixed` là có chủ ý: thanh chỉ nổi trong lúc khung bảng còn
 * trong tầm mắt, cuộn qua khỏi bảng là nó đi theo, không đọng lại trên trang.
 */
export function AdminTableScroller({ children, className }: AdminTableScrollerProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const [track, setTrack] = useState<Track>({ width: 0, overflowing: false });
  const [edges, setEdges] = useState<Edges>({ start: false, end: false });

  // So từng field rồi mới `setState`: hai hàm này chạy mỗi frame cuộn, trả về
  // object mới mỗi lần sẽ render lại cả bảng dù câu trả lời chỉ đổi hai lần
  // trong suốt một cú kéo.
  const readEdges = useCallback((el: HTMLElement) => {
    const max = el.scrollWidth - el.clientWidth;
    const next = { start: el.scrollLeft > SLACK, end: el.scrollLeft < max - SLACK };
    setEdges((prev) =>
      prev.start === next.start && prev.end === next.end ? prev : next,
    );
  }, []);

  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const width = el.scrollWidth;
    const overflowing = width - el.clientWidth > SLACK;
    setTrack((prev) =>
      prev.width === width && prev.overflowing === overflowing
        ? prev
        : { width, overflowing },
    );
    readEdges(el);
  }, [readEdges]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    measure();

    const onViewportScroll = () => {
      const bar = barRef.current;
      if (bar && Math.abs(bar.scrollLeft - el.scrollLeft) > SYNC_EPSILON) {
        bar.scrollLeft = el.scrollLeft;
      }
      readEdges(el);
    };
    el.addEventListener("scroll", onViewportScroll, { passive: true });

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    // Theo dõi cả bảng, không chỉ khung: đổi bộ lọc hay đổi số dòng có thể làm
    // một cột dài ra, `scrollWidth` đổi mà kích thước khung thì không.
    const table = el.firstElementChild;
    if (table) observer.observe(table);

    return () => {
      el.removeEventListener("scroll", onViewportScroll);
      observer.disconnect();
    };
  }, [measure, readEdges]);

  const onBarScroll = useCallback(() => {
    const el = viewportRef.current;
    const bar = barRef.current;
    if (!el || !bar) return;
    if (Math.abs(el.scrollLeft - bar.scrollLeft) > SYNC_EPSILON) {
      el.scrollLeft = bar.scrollLeft;
    }
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div
        ref={viewportRef}
        data-proxy={track.overflowing ? "on" : "off"}
        data-overflow-start={edges.start}
        data-overflow-end={edges.end}
        // Vùng cuộn phải tới được bằng bàn phím, nếu không người dùng phím mũi
        // tên không có cách nào xem các cột bên phải. Chỉ nhận tab khi thật sự
        // có gì để cuộn, để bảng vừa khung không thêm điểm dừng vô ích.
        tabIndex={track.overflowing ? 0 : undefined}
        className="admin-table-viewport overflow-x-auto rounded-2xl border border-border bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {children}
      </div>

      {track.overflowing ? (
        <div className="sticky bottom-3 z-20 mt-1.5">
          <div
            ref={barRef}
            onScroll={onBarScroll}
            // Bản sao của một vùng cuộn đã có sẵn: trình đọc màn hình không cần
            // nghe về nó, và `tabIndex={-1}` giữ nó ngoài thứ tự tab để không
            // tạo điểm dừng ẩn bên trong vùng aria-hidden.
            aria-hidden="true"
            tabIndex={-1}
            // h-4 chứ không sát 12px: 1px viền mỗi bên cộng 1px của thanh chèn
            // bên trong, thiếu chỗ là Chrome bóp nút kéo lại cho vừa.
            className="admin-table-scrollbar h-4 overflow-x-auto overflow-y-hidden rounded-full border border-border/70 bg-background/85 shadow-sm backdrop-blur-sm"
          >
            <div className="h-px" style={{ width: track.width }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
