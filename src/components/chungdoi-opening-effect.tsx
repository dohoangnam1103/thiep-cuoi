"use client";

import { useEffect, useRef, useState } from "react";

import type { ArtOpeningEffect } from "@/data/templates/opening-effect";
import {
  buildOpeningKeyframes,
  buildOpeningOptions,
  buildReducedMotionKeyframes,
} from "@/lib/opening-effect-animation";

type OpeningEffectArtworkProps = {
  effect: ArtOpeningEffect;
  opening?: boolean;
  reducedMotion?: boolean;
  className?: string;
};

export function OpeningEffectArtwork({
  effect,
  opening = false,
  reducedMotion = false,
  className = "",
}: OpeningEffectArtworkProps) {
  const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set());
  const layerRefs = useRef(new Map<string, SVGImageElement>());

  useEffect(() => {
    let cancelled = false;
    const images = effect.layers.map((layer) => {
      const image = new window.Image();
      image.decoding = "async";
      image.onload = () => undefined;
      image.onerror = () => {
        if (cancelled) return;
        setFailedIds((current) => {
          if (current.has(layer.id)) return current;
          const next = new Set(current);
          next.add(layer.id);
          return next;
        });
      };
      image.src = layer.src;
      return image;
    });

    return () => {
      cancelled = true;
      for (const image of images) {
        image.onload = null;
        image.onerror = null;
      }
    };
  }, [effect]);

  useEffect(() => {
    if (!opening) return;
    const animations: Animation[] = [];

    for (const layer of effect.layers) {
      if (failedIds.has(layer.id)) continue;
      const element = layerRefs.current.get(layer.id);
      if (!element) continue;
      const keyframes = reducedMotion
        ? buildReducedMotionKeyframes(layer)
        : buildOpeningKeyframes(layer);
      const options = reducedMotion
        ? {
            delay: 0,
            duration: effect.reducedMotion.durationMs,
            easing: "ease-out",
            fill: "both" as const,
          }
        : buildOpeningOptions(layer, effect.durationMs);
      animations.push(element.animate(keyframes as Keyframe[], options));
    }

    return () => {
      for (const animation of animations) animation.cancel();
    };
  }, [effect, failedIds, opening, reducedMotion]);

  return (
    <svg
      aria-hidden="true"
      className={`opening-effect-artwork pointer-events-none h-full w-full ${className}`}
      data-opening-effect={effect.id}
      data-opening-effect-duration={effect.durationMs}
      data-opening-effect-mode={opening ? "opening" : "static"}
      viewBox={`0 0 ${effect.canvas.width} ${effect.canvas.height}`}
      preserveAspectRatio="xMidYMid slice"
    >
      {effect.layers.map((layer) => {
        const failed = failedIds.has(layer.id);
        if (failed) return null;
        return (
          <image
            key={layer.id}
            ref={(element) => {
              if (element) layerRefs.current.set(layer.id, element);
              else layerRefs.current.delete(layer.id);
            }}
            href={layer.src}
            x={layer.rect.x}
            y={layer.rect.y}
            width={layer.rect.width}
            height={layer.rect.height}
            preserveAspectRatio="none"
            opacity={layer.startOpacity}
            data-opening-layer={layer.id}
            data-opening-layer-src={layer.src}
            data-opening-layer-state="ready"
            onError={() => {
              setFailedIds((current) => new Set(current).add(layer.id));
            }}
          />
        );
      })}
    </svg>
  );
}
