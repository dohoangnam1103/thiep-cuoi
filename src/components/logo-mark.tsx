import Image from "next/image";

import { SITE_LOGO_PATH } from "@/lib/site-url";

type LogoMarkProps = {
  className?: string;
  eager?: boolean;
};

export function LogoMark({ className, eager = false }: LogoMarkProps) {
  return (
    <Image
      src={SITE_LOGO_PATH}
      alt="Thiệp Mừng Online"
      width={1657}
      height={421}
      className={className}
      loading={eager ? "eager" : "lazy"}
      sizes="(max-width: 639px) 142px, 190px"
    />
  );
}
