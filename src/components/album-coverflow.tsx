"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import type { CSSProperties } from "react";

type Props = {
  photos: string[];
  accent: string;
  onOpen: (index: number) => void;
};

export default function CoverflowGallery({ photos, accent, onOpen }: Props) {
  const canLoop = photos.length > 2;
  return (
    <div
      className="w-full"
      style={{ ["--swiper-navigation-color" as keyof CSSProperties]: accent } as CSSProperties}
    >
      <Swiper
        modules={[EffectCoverflow, Autoplay, Navigation]}
        effect="coverflow"
        grabCursor
        centeredSlides
        slidesPerView="auto"
        loop={canLoop}
        navigation
        autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        coverflowEffect={{ rotate: 40, stretch: 0, depth: 180, modifier: 1, slideShadows: true }}
        className="!py-6"
      >
        {photos.map((src, i) => (
          <SwiperSlide key={src} style={{ width: 220 }}>
            <button
              type="button"
              onClick={() => onOpen(i)}
              className="block aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-2xl border"
              style={{ borderColor: accent }}
            >
              <img src={src} alt={`Ảnh cưới ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
