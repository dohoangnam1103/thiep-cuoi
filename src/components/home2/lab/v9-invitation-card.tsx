"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { templatePreviewUrl } from "@/lib/template-preview-url";

import { V9_STATION_COUNT } from "./v9-stations";
import type { V9TemplateShot } from "./v9-stations";

/**
 * Ruột tấm thiệp — phần được điền dần qua từng trạm.
 *
 * Tách ra khỏi `TravelCard` vì hai layout cần đúng tấm thiệp này ở hai vai khác
 * nhau: bản desktop treo nó vào một khung bay ngang qua màn hình, bản mobile đặt
 * nó tĩnh và to gần trọn màn (bay ngang ở khổ 390px chỉ đi được 0.96 lần bề rộng
 * chính nó, tức là một cái lắc chứ không phải một chuyến bay).
 *
 * Bốn thuộc tính `data-has-*` là các cột mốc "thiệp có thêm gì". CSS đọc chúng
 * theo kiểu con cháu nên đặt ở đây vẫn chạy đúng như khi còn ở `.v9-travel-card`.
 */
export function InvitationCard({
  shot,
  activeIndex,
  groom,
  bride,
  nameSlot,
}: {
  shot: V9TemplateShot;
  activeIndex: number;
  groom: string;
  bride: string;
  /**
   * Thay dòng tên in sẵn bằng thứ khác. Bản mobile đặt hai ô gõ tên vào đúng đây
   * ở trạm 02: thay vì một cái form riêng nằm cạnh tấm thiệp (không đủ chỗ trên
   * khổ 390px), người dùng viết thẳng vào chỗ tên trên thiệp.
   */
  nameSlot?: ReactNode;
}) {
  const t = useTranslations("homeLabV9");
  const typed = [groom.trim(), bride.trim()].filter(Boolean).join(" & ");

  return (
    <div
      className="v9-invitation"
      data-has-template={activeIndex >= 1 ? "" : undefined}
      data-has-names={activeIndex >= 2 ? "" : undefined}
      data-has-album={activeIndex >= 3 ? "" : undefined}
      data-has-rsvp={activeIndex >= 4 ? "" : undefined}
      aria-label={shot.name}
    >
      <div className="v9-card-main">
        <div className="v9-card-topline">
          <span>{t("card.passport")}</span>
          <span>{t("card.flight")}</span>
        </div>
        <div className="v9-card-media">
          {/* Trạm 00: chưa chọn mẫu nên khung ảnh còn trống. Ảnh thật chỉ hiện
              từ trạm 01. */}
          <div className="v9-card-photo">
            <Image
              src={templatePreviewUrl(shot.portrait)}
              alt={shot.name}
              fill
              sizes="(max-width: 899px) 17rem, 17rem"
              className="object-cover object-top"
            />
          </div>
          <div className="v9-card-empty" aria-hidden>
            <span>{t("card.emptyTemplate")}</span>
          </div>

          {/* Trạm 03: album kỷ niệm được đưa vào thiệp. Ba ô cùng một bộ ảnh
              cưới, cắt ở ba vị trí khác nhau — vị trí cắt đặt trong v9.css để
              không sinh tên class động (Tailwind không quét được class động). */}
          <div className="v9-card-album" aria-hidden>
            {[1, 2, 3].map((frame) => (
              <span key={frame}>
                <Image
                  src={templatePreviewUrl(shot.portrait)}
                  alt=""
                  fill
                  sizes="6rem"
                  className="object-cover"
                />
              </span>
            ))}
          </div>

          {/* Trạm 04: bảng phản hồi nằm TRONG thiệp, không phải thẻ nổi bên
              ngoài — để tấm thiệp là thứ đang thay đổi, chứ không phải khung
              giao diện quanh nó. */}
          <div className="v9-card-rsvp" aria-hidden>
            <small>{t("journey.artifacts.rsvpLabel")}</small>
            <strong>{t("journey.artifacts.rsvpValue")}</strong>
            <span>{t("journey.artifacts.rsvpNote")}</span>
          </div>

          <span className="v9-card-live">{t("card.status")}</span>
        </div>
        <div className="v9-card-caption">
          <span>{t("card.invite")}</span>
          {/* Bản thật và bản còn trống xếp cùng một ô lưới nên chiều cao thiệp
              không nhảy khi đổi. Gõ tên ở trạm 02 thì tên thật lên thẳng đây. */}
          {nameSlot ?? (
            <strong className="v9-card-swap">
              <b>{typed || t("card.couple")}</b>
              <i>{t("card.emptyNames")}</i>
            </strong>
          )}
          <span className="v9-card-swap v9-card-swap-sm">
            <b>{t("card.date")}</b>
            <i>{t("card.emptyDate")}</i>
          </span>
        </div>
        <div className="v9-card-perforation" aria-hidden />
        <div className="v9-card-ticket">
          <span>{t("card.route")}</span>
          <i />
          <strong>{t("card.destination")}</strong>
        </div>

        {/* Con dấu nhập cảnh: mỗi trạm đã đi qua để lại một dấu trên thiệp, nên
            chặng đường tích luỹ thành thứ nhìn thấy được chứ không chỉ là một
            thanh tiến độ. */}
        <div className="v9-card-stamps" aria-hidden>
          {Array.from({ length: V9_STATION_COUNT - 1 }, (_, index) => (
            <span
              key={index}
              className={`v9-card-stamp v9-card-stamp-${index + 1}${
                activeIndex >= index + 1 ? " is-inked" : ""
              }`}
            >
              <b>{String(index + 1).padStart(2, "0")}</b>
              <i>{t("card.stampMark")}</i>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
