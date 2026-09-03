"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { createInvitation } from "@/app/dashboard/actions";
import { templatePreviewUrl } from "@/lib/template-preview-url";

import type { ImageSize } from "../sections-bottom";
import { InvitationCard } from "./v9-invitation-card";
import { RouteProgress } from "./v9-journey";
import { useReducedMotion } from "./v9-journey-motion";
import { StationFeatures } from "./v9-station-assets";
import {
  V9_STATIONS,
  type V9TemplateShot,
} from "./v9-stations";

/**
 * Hành trình V9 trên điện thoại — một story deck hộ chiếu vuốt ngang.
 *
 * Mobile cố ý KHÔNG điều khiển `window.scroll`. Trang chính cuộn dọc tự nhiên;
 * sáu trạm là một vùng overflow ngang dùng native scroll-snap. Nhờ vậy quán tính
 * touch, thanh địa chỉ Safari và gesture quay lại của trình duyệt không còn tranh
 * quyền với GSAP. Motion chỉ phản hồi card đang active, không quyết định card nào
 * được mở.
 */
export function V9MobileJourney({
  shots,
  createHref,
  templateCount,
  instantTemplateId,
  rsvpImage,
}: {
  shots: V9TemplateShot[];
  createHref: string;
  templateCount: number;
  instantTemplateId: string;
  rsvpImage: ImageSize;
}) {
  const t = useTranslations("homeLabV9");
  const instantT = useTranslations("home.instant");
  const trackRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<Array<HTMLElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [groom, setGroom] = useState("");
  const [bride, setBride] = useState("");
  const reduced = useReducedMotion();

  /* Chọn card gần tâm viewport ngang nhất. Đây chỉ là đọc trạng thái của native
     scroll để cập nhật progress/Tab order; nó không sửa scrollLeft. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const sync = () => {
      frameRef.current = null;
      const center = track.scrollLeft + track.clientWidth / 2;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(cardCenter - center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      setActiveIndex(nearestIndex);
    };

    const onScroll = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(sync);
    };

    sync();
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      const track = trackRef.current;
      const card = cardsRef.current[index];
      const firstCard = cardsRef.current[0];
      if (!track || !card || !firstCard) return;

      track.scrollTo({
        left: card.offsetLeft - firstCard.offsetLeft,
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [reduced],
  );

  const primaryShot = shots[0];
  if (!primaryShot) return null;

  /* Ruột từng trang. Trang nào có tấm thiệp thì thiệp LÀ nội dung chính của trang
     đó, không phải phần trang trí kèm thêm. */
  const pageBody = (index: number, active: boolean) => {
    const tab = active ? undefined : -1;

    switch (index) {
      /* Trạm 00 — tấm thiệp còn trống. Không có tài sản nào khác: cả trang chỉ để
         nói "chỗ này sẽ thành thiệp của hai bạn". */
      case 0:
        return (
          <div className="v9-page-card">
            <InvitationCard
              shot={primaryShot}
              activeIndex={0}
              groom=""
              bride=""
            />
          </div>
        );

      /* Trạm 01 — lưới 2×2, giữ đủ bốn mẫu. Bản desktop nhồi bốn ô vào một dải
         ngang nên trên mobile từng phải ẩn ô thứ tư (mỗi ô còn 78px, không nhận
         ra mẫu nữa). Có trọn một trang thì mỗi ô rộng ~150px, xem được. */
      case 1:
        return (
          <div className="v9-page-body">
            <ul className="v9-page-templates">
              {shots.slice(0, 4).map((shot) => (
                <li key={shot.slug}>
                  <NextLink href={shot.demoPath} tabIndex={tab}>
                    <span className="v9-template-thumb">
                      <Image
                        src={templatePreviewUrl(shot.portrait)}
                        alt=""
                        fill
                        sizes="46vw"
                        className="object-cover object-top"
                      />
                    </span>
                    <span className="v9-template-name">{shot.name}</span>
                  </NextLink>
                </li>
              ))}
            </ul>
            <div className="v9-station-foot">
              <NextLink href="/mau-thiep" className="hp-link" tabIndex={tab}>
                {t("station.templatesCta", { count: templateCount })}
              </NextLink>
              <span className="v9-station-hint">{t("station.templatesHint")}</span>
            </div>
          </div>
        );

      /* Trạm 02 — viết thẳng lên thiệp.
         Đây là chỗ bản mobile hơn bản desktop. Desktop phải đặt form cạnh tấm
         thiệp rồi nối tên qua state; mobile không đủ chỗ cho hai khối, nên hai ô
         gõ tên nằm LUÔN ở chỗ tên trên thiệp. Cả trang là một form thật, nên nút
         bấm vẫn tạo thiệp như cũ. */
      case 2:
        return (
          <form action={createInvitation} className="v9-page-card v9-page-form">
            <input type="hidden" name="templateId" value={instantTemplateId} />
            <InvitationCard
              shot={primaryShot}
              activeIndex={2}
              groom={groom}
              bride={bride}
              nameSlot={
                <span className="v9-inline-names">
                  <input
                    name="groomShortName"
                    type="text"
                    maxLength={24}
                    autoComplete="off"
                    aria-label={instantT("groomPlaceholder")}
                    placeholder={instantT("groomPlaceholder")}
                    value={groom}
                    tabIndex={tab}
                    onChange={(event) => setGroom(event.target.value)}
                  />
                  <b aria-hidden>&</b>
                  <input
                    name="brideShortName"
                    type="text"
                    maxLength={24}
                    autoComplete="off"
                    aria-label={instantT("bridePlaceholder")}
                    placeholder={instantT("bridePlaceholder")}
                    value={bride}
                    tabIndex={tab}
                    onChange={(event) => setBride(event.target.value)}
                  />
                </span>
              }
            />
            <button type="submit" className="hp-btn hp-btn-solid" tabIndex={tab}>
              {instantT("cta")}
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </button>
          </form>
        );

      /* Trạm 03 — sáu thứ có sẵn trong mọi mẫu. Không kèm thiệp: sáu nhãn cộng
         tiêu đề đã ăn hết chỗ, mà nhồi thêm thiệp thì nó co xuống cỡ không đọc
         được chữ nào bên trong. */
      case 3:
        return (
          <div className="v9-page-body v9-page-features">
            <StationFeatures />
          </div>
        );

      /* Trạm 04 — ảnh trang quản lý, để NGUYÊN khổ dọc.
         Bản desktop phải cắt ảnh 1122×1402 thành khung ngang 2.4 cho vừa thẻ
         trạm. Trang mobile cũng dọc như cái ảnh, nên ở đây nó được hiện trọn. */
      case 4:
        return (
          <div className="v9-page-body v9-page-guests">
            <span className="v9-page-shot">
              <Image
                src="/chungdoi/images/rsvp-showcase.png"
                alt={t("station.guestsAlt")}
                width={rsvpImage.width}
                height={rsvpImage.height}
                sizes="62vw"
                loading="lazy"
                decoding="async"
              />
            </span>
            <span className="v9-station-hint">{t("station.guestsHint")}</span>
          </div>
        );

      /* Trạm 05 — thiệp xong: đủ bốn phần và năm con dấu nhập cảnh. */
      default:
        return (
          <div className="v9-page-card">
            <InvitationCard
              shot={primaryShot}
              activeIndex={V9_STATIONS.length - 1}
              groom={groom}
              bride={bride}
            />
            {/* Ba nhãn "Zalo · Messenger · Email" của bản desktop KHÔNG có ở đây.
                Câu kể của trạm này đã liệt kê đúng ba kênh đó ngay phía trên, nên
                mấy nhãn chỉ là bản nhại của dòng chữ cách nó 40px — đúng kiểu trùng
                mà cả trang này đang dọn. Bỏ đi trả lại 54px cho tấm thiệp. */}
            <a href={createHref} className="hp-btn hp-btn-solid" tabIndex={tab}>
              {t("journey.ctaFinal")}
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </a>
          </div>
        );
    }
  };

  return (
    <section
      id="cach-hoat-dong"
      className="v9-journey v9-journey--deck"
      aria-label={t("journey.ariaLabel")}
    >
      <div className="v9-deck-shell" data-active-index={activeIndex}>
        <header className="v9-deck-header">
          <div>
            <p className="hp-label v9-deck-eyebrow">{t("journey.eyebrow")}</p>
            <h2 className="hp-display v9-deck-heading">{t("journey.title")}</h2>
          </div>
          <p className="hp-body-sm v9-deck-hint">{t("journey.mobileHint")}</p>
        </header>

        <RouteProgress activeIndex={activeIndex} onSelect={goToStep} />

        <div
          ref={trackRef}
          className="v9-deck-track"
          role="region"
          aria-label={t("journey.routeLabel")}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              goToStep(Math.max(0, activeIndex - 1));
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              goToStep(Math.min(V9_STATIONS.length - 1, activeIndex + 1));
            }
          }}
        >
          {V9_STATIONS.map((station, index) => {
            const active = index === activeIndex;

            return (
              <article
                key={station.key}
                ref={(node) => {
                  cardsRef.current[index] = node;
                }}
                className="v9-deck-card"
                data-station={index}
                data-active={active ? "true" : "false"}
                aria-current={active ? "step" : undefined}
              >
                <span className="v9-page-watermark" aria-hidden>
                  {String(index).padStart(2, "0")}
                </span>
                <header className="v9-page-head">
                  <p className="hp-label v9-page-code">
                    <station.Icon className="size-4" strokeWidth={1.4} />
                    {t(`journey.acts.${station.key}.code`)}
                  </p>
                  <h3 className="hp-display v9-page-title">
                    {t(`journey.acts.${station.key}.title`)}
                  </h3>
                  <p className="hp-body v9-page-copy">
                    {t(`journey.acts.${station.key}.copy`)}
                  </p>
                </header>
                {pageBody(index, active)}
              </article>
            );
          })}
        </div>

        <footer className="v9-deck-footer">
          <button
            type="button"
            className="v9-deck-arrow"
            disabled={activeIndex === 0}
            aria-label={t("journey.previous")}
            onClick={() => goToStep(activeIndex - 1)}
          >
            <ArrowLeft aria-hidden />
          </button>
          <p className="v9-book-foot" aria-live="polite">
            <span className="hp-num">
              {String(activeIndex + 1).padStart(2, "0")}
            </span>
            <span>
              {t("journey.progress", {
                current: activeIndex + 1,
                total: V9_STATIONS.length,
              })}
            </span>
          </p>
          <button
            type="button"
            className="v9-deck-arrow"
            disabled={activeIndex === V9_STATIONS.length - 1}
            aria-label={t("journey.next")}
            onClick={() => goToStep(activeIndex + 1)}
          >
            <ArrowRight aria-hidden />
          </button>
        </footer>
      </div>
    </section>
  );
}
