"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useState, type RefObject } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

function useReducedMotion() {
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

function dataNumber(element: HTMLElement, key: keyof DOMStringMap) {
  return Number(element.dataset[key] ?? 0);
}

export function useV12Motion(rootRef: RefObject<HTMLDivElement | null>) {
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      root.dataset.motion = reducedMotion ? "reduced" : "full";
      if (reducedMotion) {
        return () => {
          delete root.dataset.motion;
        };
      }

      const media = gsap.matchMedia();
      const mosaicCards = gsap.utils.toArray<HTMLElement>(".v12-mosaic-card");
      const galleryCards = gsap.utils.toArray<HTMLElement>(".v12-gallery-card");
      const orbitCards = gsap.utils.toArray<HTMLElement>(".v12-final-orbit-card");

      const revealFinale = () => {
        gsap.from(".v12-final-card", {
          scale: 0.58,
          rotation: -10,
          autoAlpha: 0,
          duration: 1.1,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".v12-finale",
            start: "top 72%",
            once: true,
          },
        });

        gsap.from(orbitCards, {
          x: (index) => (index % 2 === 0 ? -1 : 1) * (180 + index * 26),
          y: (index) => ((index % 3) - 1) * 190,
          scale: 0.4,
          rotation: (index) => (index % 2 === 0 ? -28 : 28),
          autoAlpha: 0,
          duration: 1.25,
          stagger: 0.045,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".v12-finale",
            start: "top 76%",
            once: true,
          },
        });

        gsap.from(".v12-finale-copy > *", {
          y: 34,
          autoAlpha: 0,
          duration: 0.85,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".v12-finale-copy",
            start: "top 78%",
            once: true,
          },
        });

        gsap.to(".v12-final-orbit", {
          rotation: 360,
          duration: 70,
          repeat: -1,
          ease: "none",
          scrollTrigger: {
            trigger: ".v12-finale",
            start: "top bottom",
            end: "bottom top",
            toggleActions: "play pause resume pause",
          },
        });

        gsap.to(".v12-final-sunburst", {
          rotation: -18,
          scale: 1.08,
          duration: 9,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          scrollTrigger: {
            trigger: ".v12-finale",
            start: "top bottom",
            end: "bottom top",
            toggleActions: "play pause resume pause",
          },
        });
      };

      media.add("(min-width: 900px)", () => {
        const stepX = Math.min(56, window.innerWidth / 23);
        const stepY = Math.min(47, window.innerHeight / 18);

        gsap.set(mosaicCards, {
          x: (_index, target: HTMLElement) => dataNumber(target, "x") * stepX,
          y: (_index, target: HTMLElement) => dataNumber(target, "y") * stepY,
          z: (_index, target: HTMLElement) => dataNumber(target, "z"),
          rotationZ: (_index, target: HTMLElement) => dataNumber(target, "rotation"),
          transformOrigin: "50% 50%",
          force3D: true,
        });

        const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
        intro
          .from(mosaicCards, {
            scale: 0.12,
            z: -560,
            autoAlpha: 0,
            duration: 1.35,
            stagger: { each: 0.008, from: "center" },
          })
          .from(
            ".v12-symbol-glow",
            { scale: 0.7, autoAlpha: 0, duration: 1.15 },
            0.24,
          )
          .from(
            ".v12-hero-copy > *",
            { y: 28, autoAlpha: 0, duration: 0.8, stagger: 0.08 },
            0.55,
          )
          .from(".v12-scroll-cue", { y: 16, autoAlpha: 0, duration: 0.6 }, 1.08);

        gsap.to(".v12-orbit-one", {
          rotation: 360,
          duration: 55,
          repeat: -1,
          ease: "none",
        });
        gsap.to(".v12-orbit-two", {
          rotation: -360,
          duration: 72,
          repeat: -1,
          ease: "none",
        });

        const hero = gsap.timeline({
          scrollTrigger: {
            trigger: ".v12-hero-track",
            start: "top top",
            end: "bottom bottom",
            scrub: 1.15,
            invalidateOnRefresh: true,
          },
        });

        hero
          .to(
            ".v12-hero-copy",
            {
              y: -90,
              scale: 0.9,
              autoAlpha: 0,
              duration: 0.2,
              ease: "power2.in",
            },
            0,
          )
          .to(".v12-scroll-cue", { y: -20, autoAlpha: 0, duration: 0.12 }, 0)
          .to(
            ".v12-symbol-glow",
            { scale: 1.7, autoAlpha: 0, duration: 0.34, ease: "power2.in" },
            0.03,
          )
          .to(
            mosaicCards,
            {
              x: (index, target: HTMLElement) => {
                const side = dataNumber(target, "x") < 0 ? -1 : 1;
                return side * (window.innerWidth * (0.48 + (index % 6) * 0.075));
              },
              y: (index, target: HTMLElement) =>
                dataNumber(target, "y") * stepY * (1.5 + (index % 4) * 0.2),
              z: (index) => 520 + (index % 8) * 72,
              rotationX: (index) => ((index % 5) - 2) * 15,
              rotationY: (index) => (index % 2 === 0 ? -1 : 1) * (18 + (index % 4) * 8),
              rotationZ: (index) => (index % 2 === 0 ? -1 : 1) * (12 + (index % 7) * 5),
              scale: (index) => 1.45 + (index % 5) * 0.18,
              autoAlpha: (index) => (index % 4 === 0 ? 0.18 : 0),
              duration: 0.58,
              stagger: { each: 0.0012, from: "center" },
              ease: "power2.in",
            },
            0.07,
          )
          .fromTo(
            ".v12-focus-stage",
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.22, ease: "power2.out" },
            0.29,
          )
          .fromTo(
            ".v12-focus-card",
            { z: -620, scale: 0.3, rotationY: -26, rotationZ: 11 },
            {
              z: 0,
              scale: 1,
              rotationY: 0,
              rotationZ: -2,
              duration: 0.36,
              ease: "power4.out",
            },
            0.28,
          )
          .fromTo(
            ".v12-focus-halo",
            { scale: 0.35, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: 0.34, ease: "power3.out" },
            0.34,
          )
          .fromTo(
            ".v12-focus-copy > *",
            { y: 30, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.25,
              stagger: 0.035,
              ease: "power3.out",
            },
            0.43,
          )
          .to(
            ".v12-focus-card",
            { scale: 1.2, y: -22, rotationZ: 0, duration: 0.28, ease: "sine.inOut" },
            0.7,
          )
          .to(
            ".v12-focus-copy",
            { y: -38, autoAlpha: 0, duration: 0.2, ease: "power2.in" },
            0.79,
          )
          .to(
            ".v12-focus-halo",
            { scale: 1.5, autoAlpha: 0.25, duration: 0.22 },
            0.8,
          )
          .to(
            ".v12-focus-stage",
            { scale: 1.08, autoAlpha: 0.18, duration: 0.2, ease: "power2.in" },
            0.89,
          );

        gsap.fromTo(
          ".v12-gallery-wall",
          { x: "54vw" },
          {
            x: "-56vw",
            ease: "none",
            scrollTrigger: {
              trigger: ".v12-gallery-track",
              start: "top top",
              end: "bottom bottom",
              scrub: 1.05,
              invalidateOnRefresh: true,
            },
          },
        );

        gsap.fromTo(
          ".v12-gallery-progress > span",
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ".v12-gallery-track",
              start: "top top",
              end: "bottom bottom",
              scrub: true,
            },
          },
        );

        gsap.from(".v12-gallery-heading > *", {
          y: 24,
          autoAlpha: 0,
          duration: 0.8,
          stagger: 0.07,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".v12-gallery-track",
            start: "top 76%",
            once: true,
          },
        });

        galleryCards.forEach((card, index) => {
          gsap.to(card, {
            yPercent: index % 2 === 0 ? -7 : 7,
            force3D: false,
            ease: "none",
            scrollTrigger: {
              trigger: ".v12-gallery-track",
              start: "top bottom",
              end: "bottom top",
              scrub: 1.4,
            },
          });
        });

        revealFinale();
      });

      media.add("(max-width: 899px)", () => {
        const visibleCards = mosaicCards.filter(
          (card) => card.dataset.mobileVisible === "true",
        );
        const hiddenCards = mosaicCards.filter(
          (card) => card.dataset.mobileVisible !== "true",
        );

        gsap.set(hiddenCards, { autoAlpha: 0, display: "none" });
        gsap.set(visibleCards, {
          x: (_index, target: HTMLElement) => dataNumber(target, "mobileX") * 40,
          y: (_index, target: HTMLElement) => dataNumber(target, "mobileY") * 37,
          rotationZ: (_index, target: HTMLElement) => dataNumber(target, "mobileRotation"),
          force3D: true,
        });

        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
          .from(visibleCards, {
            scale: 0.25,
            z: -240,
            autoAlpha: 0,
            duration: 0.9,
            stagger: { each: 0.025, from: "center" },
          })
          .from(".v12-symbol-glow", { scale: 0.7, autoAlpha: 0, duration: 0.8 }, 0.16)
          .from(
            ".v12-hero-copy > *",
            { y: 22, autoAlpha: 0, duration: 0.58, stagger: 0.07 },
            0.3,
          )
          .from(".v12-scroll-cue", { autoAlpha: 0, duration: 0.45 }, 0.72);

        const hero = gsap.timeline({
          scrollTrigger: {
            trigger: ".v12-hero-track",
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });

        hero
          .to(
            ".v12-hero-copy",
            { y: -52, scale: 0.92, autoAlpha: 0, duration: 0.22 },
            0,
          )
          .to(".v12-scroll-cue", { autoAlpha: 0, duration: 0.1 }, 0)
          .to(
            ".v12-symbol-glow",
            { scale: 1.5, autoAlpha: 0, duration: 0.33 },
            0.04,
          )
          .to(
            visibleCards,
            {
              x: (_index, target: HTMLElement) =>
                dataNumber(target, "mobileX") * 72,
              y: (_index, target: HTMLElement) =>
                dataNumber(target, "mobileY") * 62,
              z: (index) => 260 + (index % 5) * 56,
              rotationZ: (index) => (index % 2 === 0 ? -1 : 1) * (18 + index * 2),
              scale: (index) => 1.2 + (index % 3) * 0.22,
              autoAlpha: (index) => (index % 3 === 0 ? 0.15 : 0),
              duration: 0.5,
              ease: "power2.in",
            },
            0.07,
          )
          .fromTo(
            ".v12-focus-stage",
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.2 },
            0.3,
          )
          .fromTo(
            ".v12-focus-card",
            { y: 110, scale: 0.52, rotationZ: 8 },
            {
              y: 0,
              scale: 1,
              rotationZ: -2,
              duration: 0.36,
              ease: "power4.out",
            },
            0.28,
          )
          .fromTo(
            ".v12-focus-copy > *",
            { y: 22, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.24, stagger: 0.04 },
            0.43,
          )
          .to(".v12-focus-card", { scale: 1.08, y: -12, duration: 0.28 }, 0.72)
          .to(".v12-focus-copy", { autoAlpha: 0, y: -28, duration: 0.2 }, 0.82)
          .to(".v12-focus-stage", { autoAlpha: 0.3, duration: 0.18 }, 0.9);

        galleryCards.forEach((card) => {
          gsap.from(card, {
            y: 46,
            scale: 0.92,
            autoAlpha: 0,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              once: true,
            },
          });
        });

        gsap.from(".v12-gallery-heading > *", {
          y: 24,
          autoAlpha: 0,
          duration: 0.72,
          stagger: 0.07,
          scrollTrigger: {
            trigger: ".v12-gallery-heading",
            start: "top 82%",
            once: true,
          },
        });

        revealFinale();
      });

      return () => {
        media.revert();
        delete root.dataset.motion;
      };
    },
    { scope: rootRef, dependencies: [reducedMotion], revertOnUpdate: true },
  );

  return reducedMotion;
}
