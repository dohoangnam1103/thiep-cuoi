"use client";

import {
  ArrowRight,
  Gift,
  Images,
  MapPin,
  Music,
  PenLine,
  Smartphone,
} from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

import { createInvitation } from "@/app/dashboard/actions";
import { templatePreviewUrl } from "@/lib/template-preview-url";

import type { ImageSize } from "../sections-bottom";
import type { V9TemplateShot } from "./v9-stations";

/**
 * Bằng chứng đặt THẲNG vào thẻ trạm của hành trình.
 *
 * Trước đây bốn thứ này nằm ở bốn chương riêng phía dưới hành trình. Cấu trúc đó
 * buộc mỗi chủ đề phải xuất hiện hai lần: hành trình kể, rồi chương dưới chứng
 * minh. Dù đã cắt hết câu trùng thì chủ đề vẫn lặp, vì đó là hệ quả của việc có
 * hai lớp — không phải của cách viết.
 *
 * Nên bằng chứng được dời vào trong chính trạm nói về nó. Mỗi chủ đề giờ xuất
 * hiện đúng một lần, ở đúng một chỗ.
 *
 * Giá phải trả, ghi rõ để sau này khỏi tưởng là lỗi: thẻ trạm bị ghim trong một
 * khung 100svh nên tài sản phải vừa một màn hình. Lưới mẫu thiệp vì thế nhỏ hơn
 * hẳn bản cũ (4 ô thay vì 6 ô cao tới 29rem), và ảnh trang quản lý phải cắt khung
 * thay vì hiện trọn. Muốn xem lớn thì có `/mau-thiep`, đã dẫn link sẵn.
 *
 * `active` dùng để rút mọi thứ bấm được ra khỏi luồng Tab khi trạm chưa mở — thẻ
 * trạm chỉ `pointer-events: none` chứ vẫn nhận được focus bàn phím.
 */

/* ── Trạm 01 · lưới mẫu thiệp bấm được ─────────────────────────────────────── */

export function StationTemplates({
  shots,
  templateCount,
  active,
}: {
  shots: V9TemplateShot[];
  templateCount: number;
  active: boolean;
}) {
  const t = useTranslations("homeLabV9.station");
  const tab = active ? undefined : -1;

  return (
    <div className="v9-station-asset">
      <ul className="v9-template-strip">
        {shots.map((shot) => (
          <li key={shot.slug}>
            <NextLink href={shot.demoPath} tabIndex={tab}>
              <span className="v9-template-thumb">
                <Image
                  src={templatePreviewUrl(shot.portrait)}
                  alt=""
                  fill
                  sizes="9rem"
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
          {t("templatesCta", { count: templateCount })}
        </NextLink>
        <span className="v9-station-hint">{t("templatesHint")}</span>
      </div>
    </div>
  );
}

/* ── Trạm 02 · form gõ tên chạy thật ──────────────────────────────────────── */

export function StationNameForm({
  templateId,
  groom,
  bride,
  onGroom,
  onBride,
  active,
}: {
  templateId: string;
  groom: string;
  bride: string;
  onGroom: (value: string) => void;
  onBride: (value: string) => void;
  active: boolean;
}) {
  const t = useTranslations("homeLabV9.station");
  const instantT = useTranslations("home.instant");
  const tab = active ? undefined : -1;

  return (
    <form action={createInvitation} className="v9-station-asset v9-name-form">
      <input type="hidden" name="templateId" value={templateId} />
      <div className="v9-name-fields">
        <label>
          <span className="hp-label">{instantT("groomPlaceholder")}</span>
          <input
            name="groomShortName"
            type="text"
            maxLength={24}
            autoComplete="off"
            value={groom}
            tabIndex={tab}
            onChange={(event) => onGroom(event.target.value)}
          />
        </label>
        <label>
          <span className="hp-label">{instantT("bridePlaceholder")}</span>
          <input
            name="brideShortName"
            type="text"
            maxLength={24}
            autoComplete="off"
            value={bride}
            tabIndex={tab}
            onChange={(event) => onBride(event.target.value)}
          />
        </label>
      </div>
      <button type="submit" className="hp-btn hp-btn-solid mt-6" tabIndex={tab}>
        {instantT("cta")}
        <ArrowRight className="size-4" strokeWidth={1.5} />
      </button>
      <p className="v9-station-hint mt-4">{t("formNote")}</p>
    </form>
  );
}

/* ── Trạm 03 · những gì có sẵn trong mọi mẫu ───────────────────────────────── */

const STATION_FEATURES = [
  { key: "feature1", Icon: Smartphone },
  { key: "feature2", Icon: MapPin },
  { key: "feature3", Icon: Images },
  { key: "feature4", Icon: Music },
  { key: "feature5", Icon: PenLine },
  { key: "feature6", Icon: Gift },
] as const;

export function StationFeatures() {
  const t = useTranslations("homeLabV9.station");

  return (
    <div className="v9-station-asset">
      <p className="v9-station-hint">{t("featuresTitle")}</p>
      <ul className="v9-feature-grid">
        {STATION_FEATURES.map(({ key, Icon }) => (
          <li key={key}>
            <Icon className="size-4 shrink-0" strokeWidth={1.4} />
            {t(key)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Trạm 04 · ảnh chụp trang quản lý khách ───────────────────────────────── */

export function StationGuests({ imageSize }: { imageSize: ImageSize }) {
  const t = useTranslations("homeLabV9.station");

  return (
    <div className="v9-station-asset">
      {/* Ảnh gốc là ảnh DỌC 1122×1402. Để trọn thì cao 760px ở khổ thẻ trạm, quá
          chiều cao khung ghim, nên phải cắt thành khung ngang và neo vào vùng có
          mấy bảng quản lý. */}
      <span className="v9-guests-shot">
        <Image
          src="/chungdoi/images/rsvp-showcase.png"
          alt={t("guestsAlt")}
          width={imageSize.width}
          height={imageSize.height}
          sizes="(max-width: 899px) 92vw, 38rem"
          loading="lazy"
          decoding="async"
        />
      </span>
      <p className="v9-station-hint mt-4">{t("guestsHint")}</p>
    </div>
  );
}
