import type { ComponentPropsWithoutRef, CSSProperties } from "react";

import { cn } from "@/lib/utils";

type ZodiacMaskArtworkProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  src: string;
  "data-envelope-opening-fly"?: true;
};

type ZodiacMaskStyle = CSSProperties & {
  "--zodiac-mask-image": string;
};

export function ZodiacMaskArtwork({
  src,
  className,
  style,
  ...props
}: ZodiacMaskArtworkProps) {
  const maskStyle: ZodiacMaskStyle = {
    ...style,
    "--zodiac-mask-image": `url("${src}")`,
  };

  return (
    <span
      {...props}
      aria-hidden="true"
      data-zodiac-artwork={src}
      className={cn(
        "zodiac-mask-artwork",
        props["data-envelope-opening-fly"] && "zodiac-opening-fly",
        className,
      )}
      style={maskStyle}
    />
  );
}
