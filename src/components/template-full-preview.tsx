"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function TemplateFullPreview({ src, alt, label, className }: { src: string; alt: string; label: string; className?: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  function stopAndReset() {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    if (frameRef.current) frameRef.current.scrollTop = 0;
  }

  function startScroll() {
    const frame = frameRef.current;
    if (!frame || frame.scrollHeight <= frame.clientHeight) return;
    const distance = frame.scrollHeight - frame.clientHeight;
    const duration = Math.max(5000, Math.min(14000, distance * 8));
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      frame.scrollTop = distance * progress;
      if (progress < 1) animationRef.current = requestAnimationFrame(tick);
      else animationRef.current = null;
    };
    animationRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => () => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
  }, []);

  return (
    <div
      ref={frameRef}
      className={cn("max-h-[760px] overflow-y-auto rounded-2xl border border-border bg-muted shadow-inner", className)}
      onMouseEnter={startScroll}
      onMouseLeave={stopAndReset}
      onFocus={startScroll}
      onBlur={stopAndReset}
      tabIndex={0}
      aria-label={label}
    >
      {/* Full-page captures intentionally scroll inside a fixed preview window. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={960} loading="eager" className="block h-auto w-full" />
    </div>
  );
}
