"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";
import { doraemonDoorPilot } from "@/data/doraemon-door-pilot";

type DoraemonDoorFallbackProps = {
  isMobile: boolean;
  isOpening: boolean;
  motion: "desktop" | "mobile" | "reduced";
};

const motionDuration = {
  desktop: "duration-[2450ms]",
  mobile: "duration-[2100ms]",
  reduced: "duration-[220ms]",
} as const;

function Character({
  className,
  imageClassName,
  isOpening,
  sizes,
  src,
}: {
  className: string;
  imageClassName?: string;
  isOpening: boolean;
  sizes: string;
  src: string;
}) {
  return (
    <div
      className={cn(
        "absolute transition-[opacity,transform] duration-700 ease-[cubic-bezier(.16,1,.3,1)]",
        isOpening
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-10 scale-[0.55] opacity-0",
        className,
      )}
    >
      <Image
        alt=""
        aria-hidden="true"
        className={cn("object-contain object-bottom", imageClassName)}
        fill
        sizes={sizes}
        src={src}
      />
    </div>
  );
}

export function DoraemonDoorFallback({
  isMobile,
  isOpening,
  motion,
}: DoraemonDoorFallbackProps) {
  const assets = doraemonDoorPilot.assets;

  return (
    <div
      data-door-fallback-opening={isOpening ? "true" : "false"}
      data-testid="doraemon-door-fallback"
      className="absolute inset-0 grid place-items-center overflow-hidden"
    >
      <div className="relative h-[min(76dvh,46rem)] w-[min(94vw,62rem)] [perspective:1200px]">
        <div className="absolute left-1/2 top-1/2 h-[78%] w-[min(60vw,19rem)] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border-[0.75rem] border-[#E96F9A] bg-[radial-gradient(circle_at_50%_26%,#FFF9EE_0%,#A4E9FC_34%,#39BCEB_100%)] shadow-[0_2.5rem_6rem_rgba(57,188,235,0.24)] sm:w-[23rem]">
          <div className="absolute inset-4 rounded-[1.25rem] border border-white/70" />
        </div>

        <Character
          className={cn(
            "bottom-[7%] left-[4%] h-[60%] w-[26%] delay-[680ms]",
            isMobile && "left-[2%] h-[47%] w-[25%]",
          )}
          isOpening={isOpening}
          sizes="(max-width: 767px) 25vw, 16rem"
          src={isMobile ? assets.jaianMobile : assets.jaian}
        />
        <Character
          className={cn(
            "bottom-[7%] right-[4%] h-[57%] w-[23%] delay-[780ms]",
            isMobile && "right-[2%] h-[44%] w-[23%]",
          )}
          isOpening={isOpening}
          sizes="(max-width: 767px) 23vw, 14rem"
          src={isMobile ? assets.suneoMobile : assets.suneo}
        />
        <Character
          className={cn(
            "bottom-[6%] left-[29%] h-[67%] w-[21%] delay-[470ms]",
            isMobile && "left-[24%] h-[56%] w-[24%]",
          )}
          isOpening={isOpening}
          sizes="(max-width: 767px) 24vw, 13rem"
          src={isMobile ? assets.nobitaMobile : assets.nobita}
        />
        <Character
          className={cn(
            "bottom-[5%] right-[27%] h-[72%] w-[25%] delay-[560ms]",
            isMobile && "right-[22%] h-[61%] w-[28%]",
          )}
          isOpening={isOpening}
          sizes="(max-width: 767px) 28vw, 16rem"
          src={isMobile ? assets.shizukaMobile : assets.shizuka}
        />
        <Character
          className="bottom-[2%] left-1/2 z-10 h-[36%] w-[28%] -translate-x-1/2 delay-[880ms]"
          imageClassName="object-center"
          isOpening={isOpening}
          sizes="(max-width: 767px) 28vw, 17rem"
          src={isMobile ? assets.doraemonMobile : assets.doraemon}
        />

        <div
          className={cn(
            "absolute left-1/2 top-1/2 z-20 h-[78%] w-[min(60vw,19rem)] -translate-x-1/2 -translate-y-1/2 origin-left rounded-[1.45rem] border-[0.38rem] border-[#B94170] bg-[#E96F9A] shadow-[0_2rem_4rem_rgba(23,51,74,0.3)] transition-transform ease-[cubic-bezier(.2,.9,.2,1)] sm:w-[23rem]",
            motionDuration[motion],
            isOpening
              ? "[transform:translate(-50%,-50%)_rotateY(-108deg)]"
              : "[transform:translate(-50%,-50%)_rotateY(0deg)]",
          )}
        >
          <div className="absolute inset-5 rounded-[1rem] border-2 border-[#F6A3BE]/70" />
          <div className="absolute right-[12%] top-1/2 size-5 -translate-y-1/2 rounded-full bg-[#F4C84A] shadow-[0_0.25rem_0.7rem_rgba(23,51,74,0.24)]" />
        </div>
      </div>
    </div>
  );
}
