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

export function useV11Motion(rootRef: RefObject<HTMLDivElement | null>) {
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
      const revealSharedSections = () => {
        gsap.utils.toArray<HTMLElement>("[data-v11-reveal]").forEach((element) => {
          gsap.from(element, {
            y: 42,
            autoAlpha: 0,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 88%",
              once: true,
            },
          });
        });

        gsap.from(".v11-template-card", {
          y: 44,
          rotation: 1.5,
          autoAlpha: 0,
          duration: 0.8,
          stagger: 0.07,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".v11-template-deck",
            start: "top 85%",
            once: true,
          },
        });

        gsap.to(".v11-veil-image", {
          yPercent: -5,
          ease: "none",
          scrollTrigger: {
            trigger: ".v11-material-section",
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });

        gsap.to(".v11-paper-object", {
          y: -12,
          rotation: 1.2,
          duration: 3.8,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          scrollTrigger: {
            trigger: ".v11-paper-stage",
            start: "top bottom",
            end: "bottom top",
            toggleActions: "play pause resume pause",
          },
        });

        gsap.utils.toArray<HTMLElement>(".v11-reply-card").forEach((card, index) => {
          gsap.to(card, {
            xPercent: index % 2 === 0 ? 8 : -8,
            yPercent: index % 3 === 0 ? -14 : 12,
            rotation: index % 2 === 0 ? "+=3" : "-=3",
            duration: 4.4 + (index % 3) * 0.7,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            scrollTrigger: {
              trigger: ".v11-finale",
              start: "top bottom",
              end: "bottom top",
              toggleActions: "play pause resume pause",
            },
          });
        });
      };

      media.add("(min-width: 900px) and (pointer: fine)", () => {
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
          .from(".v11-hero-vignette", { autoAlpha: 0, duration: 1.2 })
          .from(".v11-hero-bride img", { xPercent: -14, autoAlpha: 0, duration: 1.15 }, 0.12)
          .from(".v11-hero-groom img", { xPercent: 14, autoAlpha: 0, duration: 1.15 }, 0.18)
          .from(
            ".v11-hero-invitation > *",
            { yPercent: 14, rotation: 5, scale: 0.9, autoAlpha: 0, duration: 1 },
            0.34,
          )
          .from(".v11-hero-copy > *", { y: 22, autoAlpha: 0, duration: 0.68, stagger: 0.055 }, 0.42)
          .from(".v11-hero-ribbon img", { xPercent: -14, autoAlpha: 0, duration: 1 }, 0.5)
          .from(".v11-scroll-cue", { autoAlpha: 0, duration: 0.5 }, 0.92);

        gsap
          .timeline({
            scrollTrigger: {
              trigger: ".v11-hero-track",
              start: "top top",
              end: "bottom bottom",
              scrub: 1.15,
              invalidateOnRefresh: true,
            },
          })
          .to(".v11-hero-bg", { scale: 1.085, ease: "none" }, 0)
          .to(".v11-hero-bride", { xPercent: -16, yPercent: 4, scale: 0.95, ease: "none" }, 0)
          .to(".v11-hero-groom", { xPercent: 17, yPercent: 3, scale: 0.96, ease: "none" }, 0)
          .to(
            ".v11-hero-invitation",
            { yPercent: -76, rotation: -9, scale: 0.78, ease: "none" },
            0,
          )
          .to(".v11-hero-ribbon", { xPercent: 11, yPercent: -12, rotation: 4, ease: "none" }, 0)
          .to(".v11-hero-copy", { yPercent: -28, autoAlpha: 0.08, scale: 0.95, ease: "none" }, 0.08)
          .to(".v11-scroll-cue", { autoAlpha: 0, y: -18, ease: "none" }, 0.06);

        gsap.fromTo(
          ".v11-story-frame",
          { clipPath: "inset(8% 7% 8% 7% round 1.5rem)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 0rem)",
            ease: "none",
            scrollTrigger: {
              trigger: ".v11-story-frame",
              start: "top 90%",
              end: "top 18%",
              scrub: 0.7,
            },
          },
        );

        gsap.fromTo(
          ".v11-story-image",
          { scale: 1.09 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ".v11-story-frame",
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          },
        );

        revealSharedSections();
      });

      media.add("(max-width: 899px), (pointer: coarse)", () => {
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
          .from(".v11-hero-bride img", { xPercent: -8, autoAlpha: 0, duration: 0.8 })
          .from(".v11-hero-groom img", { xPercent: 8, autoAlpha: 0, duration: 0.8 }, 0.05)
          .from(".v11-hero-invitation > *", { y: 30, autoAlpha: 0, duration: 0.75 }, 0.18)
          .from(".v11-hero-copy > *", { y: 16, autoAlpha: 0, duration: 0.5, stagger: 0.04 }, 0.16)
          .from(".v11-hero-ribbon img", { autoAlpha: 0, duration: 0.6 }, 0.35);

        gsap.from(".v11-manifesto-line", {
          yPercent: 24,
          autoAlpha: 0,
          duration: 0.75,
          stagger: 0.1,
          scrollTrigger: {
            trigger: ".v11-manifesto",
            start: "top 82%",
            once: true,
          },
        });

        revealSharedSections();
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
