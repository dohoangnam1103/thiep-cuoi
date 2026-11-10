"use client";

import { useEffect, useRef, useState } from "react";

const WEDDING_GUIDE_VIDEO_URL =
  "/chungdoi/videos/wedding-guide-720p.mp4";
const WEDDING_GUIDE_POSTER_URL =
  "/chungdoi/videos/wedding-guide-720p-poster.webp";

export function WeddingGuideVideo({ title }: { title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!("IntersectionObserver" in window)) {
      const frame = requestAnimationFrame(() => setReady(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setReady(true);
      observer.disconnect();
    }, { rootMargin: "400px" });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      className="size-full bg-black object-contain"
      controls
      playsInline
      preload={ready ? "metadata" : "none"}
      poster={ready ? WEDDING_GUIDE_POSTER_URL : undefined}
      src={ready ? WEDDING_GUIDE_VIDEO_URL : undefined}
      onFocus={() => setReady(true)}
      onPointerDown={() => setReady(true)}
      aria-label={title}
    >
      {title}
    </video>
  );
}
