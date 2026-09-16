"use client";

import { useEffect, useRef } from "react";

/* GSAP choreography for the Home page. Client-only: dynamically imports
 * gsap + ScrollTrigger to avoid SSR issues. Respects prefers-reduced-motion
 * by skipping all animations when the user opts out.
 *
 * Motion budget: only transform + opacity. No pin, no canvas, no WebGL.
 * Scrub-based gallery stagger is the heaviest effect; everything else is
 * lightweight entrance tweens. */
export function HomeMotion() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect reduced motion preference
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    let ctx: ReturnType<typeof import("gsap").gsap.context> | null = null;

    // Dynamic import keeps GSAP out of the initial server bundle
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([gsapModule, scrollTriggerModule]) => {
        const gsap = gsapModule.gsap;
        const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);

        if (!containerRef.current) return;

        ctx = gsap.context(() => {
          // Gallery cards stagger entrance
          const galleryCards = containerRef.current?.querySelectorAll(
            "[data-home-gallery-card]",
          );
          if (galleryCards && galleryCards.length > 0) {
            gsap.from(galleryCards, {
              scrollTrigger: {
                trigger: "[data-home-gallery]",
                start: "top 85%",
                end: "top 20%",
                scrub: 1,
              },
              y: 40,
              opacity: 0,
              stagger: 0.08,
              duration: 0.6,
              ease: "power2.out",
            });
          }

          // Steps cards stagger
          const stepCards = containerRef.current?.querySelectorAll(
            "[data-home-step-card]",
          );
          if (stepCards && stepCards.length > 0) {
            gsap.from(stepCards, {
              scrollTrigger: {
                trigger: "[data-home-steps]",
                start: "top 80%",
              },
              y: 30,
              opacity: 0,
              stagger: 0.12,
              duration: 0.7,
              ease: "power3.out",
            });
          }
        }, containerRef.current);
      })
      .catch(() => {
        // GSAP unavailable — CSS fallbacks handle static layout
      });

    return () => {
      ctx?.revert();
    };
  }, []);

  return <div ref={containerRef} className="contents" />;
}
