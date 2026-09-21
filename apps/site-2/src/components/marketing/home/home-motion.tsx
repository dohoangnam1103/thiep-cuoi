"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function HomeMotion({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    let cancelled = false;
    let media: ReturnType<typeof import("gsap").gsap.matchMedia> | undefined;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      media = gsap.matchMedia();
      media.add({ desktop: "(min-width: 768px)", mobile: "(max-width: 767px)", reduce: "(prefers-reduced-motion: reduce)" }, (context) => {
        if (context.conditions?.reduce) return;
        // Only art moves. The fan block is gone from the hero; guard so the
        // gallery and preview motion still runs without it.
        const fan = root.querySelector(".s2-home-fan");
        const exhibition = root.querySelector(".s2-home-exhibition");
        if (fan && exhibition) {
          const cards = Array.from(root.querySelectorAll<HTMLElement>(".s2-home-fan-card")).filter((card) => card.offsetWidth > 0);
          // Only art moves. The surrounding clipped region protects the copy.
          gsap.from(cards, {
            y: 100, rotation: (index: number) => (index - (cards.length - 1) / 2) * -5,
            scale: .84, duration: 1.3, stagger: { each: .07, from: "center" }, ease: "power3.out",
          });
          gsap.to(fan, {
            y: context.conditions?.desktop ? 45 : 18, ease: "none",
            scrollTrigger: { trigger: exhibition, start: "top 45%", end: "bottom top", scrub: 1 },
          });
        }
        root.querySelectorAll<HTMLElement>("[data-home-gallery-card]").forEach((card, index) => {
          gsap.from(card.querySelector(".s2-home-gallery-image"), {
            y: index % 2 ? 35 : 18, duration: .9, ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 95%", once: true },
          });
        });
        gsap.from(root.querySelector(".s2-home-preview-paper"), {
          rotation: -4, y: 25, duration: 1.3, ease: "power3.out",
          scrollTrigger: { trigger: root.querySelector(".s2-home-preview-stage"), start: "top 90%", once: true },
        });
      }, root);
    }).catch(() => { media?.revert(); });
    return () => { cancelled = true; media?.revert(); };
  }, []);
  return <div ref={containerRef} className="s2-home">{children}</div>;
}
