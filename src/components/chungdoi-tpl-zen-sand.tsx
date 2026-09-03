"use client";

/**
 * Zen Sand — tối giản kiểu Nhật.
 *
 * Khác biệt so với 40 mẫu crawl: khoảng trắng chiếm phần lớn trang, mỗi khối
 * thông tin đứng một mình giữa nền cát, chữ nhỏ và giãn rộng, điểm nhấn duy
 * nhất là một vòng ensō vẽ bằng SVG. Không dùng asset raster nào.
 */

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  AlbumGallery,
  formatDate,
  formatWishTime,
  GiftEnvelope,
  googleCalendarUrl,
  InvitationMap,
  MapDirectionsButton,
  SharedWishForm,
} from "@/components/chungdoi-tpl-shared";
import { EnsoCircle, HairRule } from "@/components/chungdoi-tpl-ornaments";
import {
  invitationCeremonyMessage,
  invitationGiftAccounts,
  invitationOpeningMessage,
  orderByBrideFirst,
  orderedCouple,
} from "@/lib/invitation-display";

const WASHI = "#f7f4ee";
const SEAL = "#8c3b2f";

/** Khối nội dung đứng riêng, cách nhau bằng khoảng trắng lớn. */
function Block({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`flex w-full flex-col items-center ${className}`}>{children}</section>;
}

/** Nhãn section: chữ nhỏ, giãn rất rộng, không in hoa toàn phần. */
function Marker({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-[10px] uppercase tracking-[0.42em] text-[#2c2a26]/55">
        {children}
      </span>
      <HairRule color="rgba(44, 42, 38, 0.25)" className="w-8" />
    </div>
  );
}

export function ZenSandInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();

  const banks = invitationGiftAccounts(content).map((account) => ({
    label: `${account.birthOrder} - ${account.name}`,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));

  const familyPair = orderByBrideFirst(
    {
      title: families.brideParentTitle || t("parents"),
      father: families.brideFather,
      mother: families.brideMother,
      address: families.brideAddress,
    },
    {
      title: families.groomParentTitle || t("parents"),
      father: families.groomFather,
      mother: families.groomMother,
      address: families.groomAddress,
    },
    couple.brideFirst,
  );

  return (
    <div className="flex w-full justify-center bg-[#eae4d9] text-[#2c2a26]">
      <div className="w-full max-w-[520px] bg-[#f7f4ee] md:max-w-[720px]">
        {/* Hero: ensō + tên, khoảng trắng rộng */}
        <header className="flex flex-col items-center px-8 pb-24 pt-28 md:pb-32 md:pt-40">
          <div className="relative flex items-center justify-center">
            <EnsoCircle color="rgba(140, 59, 47, 0.5)" className="h-[190px] w-[190px] md:h-[250px] md:w-[250px]" />
            <div className="absolute flex flex-col items-center">
              <span data-invitation-short-name className="font-serif text-[22px] leading-tight md:text-[28px]">
                {people[0].shortName}
              </span>
              <span className="my-2 text-[11px] tracking-[0.4em] text-[#2c2a26]/50">
                {t("and")}
              </span>
              <span data-invitation-short-name className="font-serif text-[22px] leading-tight md:text-[28px]">
                {people[1].shortName}
              </span>
            </div>
          </div>

          {reception ? (
            <p className="mt-16 text-[11px] tracking-[0.4em] text-[#2c2a26]/60">
              {reception.day} · {reception.month} · {reception.yearNumber}
            </p>
          ) : null}
        </header>

        <div className="flex flex-col items-center gap-28 px-8 pb-28 md:gap-36 md:px-16">
          {/* Gia đình */}
          <Block className="gap-10">
            <Marker>{t("family")}</Marker>
            <div className="grid w-full gap-12 text-center md:grid-cols-2 md:gap-16">
              {familyPair.map((family, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#2c2a26]/50">
                    {family.title}
                  </span>
                  <span className="font-serif text-[15px]">
                    {family.father}
                  </span>
                  <span className="font-serif text-[15px]">
                    {family.mother}
                  </span>
                  <span className="mt-2 max-w-[220px] text-[12px] leading-relaxed text-[#2c2a26]/55">
                    {family.address}
                  </span>
                </div>
              ))}
            </div>
          </Block>

          {/* Lời báo tin + tên đầy đủ */}
          <Block className="gap-10">
            <p className="max-w-[420px] whitespace-pre-line text-center text-[12px] leading-[2.2] tracking-[0.12em] text-[#2c2a26]/75">
              {invitationOpeningMessage(content)}
            </p>
            <div className="flex flex-col items-center gap-6">
              {people.map((person) => (
                <div key={person.side} className="flex flex-col items-center gap-1.5">
                  <span className="font-serif text-[26px] leading-tight md:text-[32px]">
                    {person.fullName}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#2c2a26]/45">
                    {person.birthOrder}
                  </span>
                </div>
              ))}
            </div>
          </Block>

          {/* Lễ cưới */}
          {ceremony ? (
            <Block className="gap-10">
              <Marker>{t("ceremony")}</Marker>
              <p className="max-w-[400px] whitespace-pre-line text-center text-[12px] leading-[2] tracking-[0.12em] text-[#2c2a26]/70">
                {invitationCeremonyMessage(content)}
              </p>
              <div className="flex flex-col items-center gap-3">
                <span className="font-serif text-[52px] leading-none md:text-[64px]">
                  {ceremony.day}
                </span>
                <span className="text-[10px] uppercase tracking-[0.36em] text-[#2c2a26]/55">
                  {t("month", { month: ceremony.month })} · {ceremony.yearNumber}
                </span>
                {couple.ceremonyTime ? (
                  <span className="text-[15px] tracking-[0.2em]">{couple.ceremonyTime}</span>
                ) : null}
                <span className="text-[11px] text-[#2c2a26]/45">
                  {ceremony.lunar}
                </span>
              </div>
            </Block>
          ) : null}

          {/* Album */}
          {gallery.length > 0 ? (
            <Block className="gap-10">
              <Marker>{t("album")}</Marker>
              <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={SEAL} />
            </Block>
          ) : null}

          {/* Tiệc cưới */}
          <Block className="gap-10">
            <Marker>{t("reception")}</Marker>
            <div className="flex flex-col items-center gap-3">
              <span className="font-serif text-[52px] leading-none md:text-[64px]">
                {reception?.day ?? "--"}
              </span>
              <span className="text-[10px] uppercase tracking-[0.36em] text-[#2c2a26]/55">
                {t("month", { month: reception?.month ?? "--" })} · {reception?.yearNumber ?? ""}
              </span>
              <span className="text-[15px] tracking-[0.2em]">{couple.time || venue.banquetTime}</span>
              <span className="text-[11px] text-[#2c2a26]/45">
                {reception?.lunar ?? ""}
              </span>
            </div>
            <a
              href={googleCalendarUrl(content)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 border-b border-[#8c3b2f]/40 pb-1 text-[10px] uppercase tracking-[0.3em] text-[#8c3b2f] transition-opacity hover:opacity-60"
            >
              {t("addToCalendar")}
            </a>
          </Block>

          {/* Địa điểm */}
          {mapQuery ? (
            <Block className="gap-10">
              <Marker>{t("location")}</Marker>
              <p className="max-w-[380px] whitespace-pre-line text-center text-[12px] leading-[2] text-[#2c2a26]/70">
                {venue.address}
              </p>
              <div className="w-full overflow-hidden border border-[#2c2a26]/15">
                <InvitationMap
                  query={mapQuery}
                  title={mapQuery}
                  className="h-64 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <MapDirectionsButton query={mapQuery} className="text-[#8c3b2f]" />
            </Block>
          ) : null}

          {/* Lịch trình */}
          {schedule.length > 0 ? (
            <Block className="gap-10">
              <Marker>{t("timeline")}</Marker>
              <ol className="flex w-full max-w-[320px] flex-col gap-6">
                {schedule.map((item, i) => (
                  <li key={`${item.time}-${i}`} className="flex flex-col items-center gap-1.5 text-center">
                    <span className="text-[11px] tracking-[0.3em] text-[#8c3b2f]">
                      {item.time}
                    </span>
                    <span className="text-[13px] tracking-[0.08em]">{item.label}</span>
                  </li>
                ))}
              </ol>
            </Block>
          ) : null}

          {/* Lưu bút */}
          <Block className="gap-10">
            <Marker>{t("guestbook")}</Marker>
            <SharedWishForm accent={SEAL} />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y mt-2 max-h-[420px] w-full space-y-6 overflow-y-auto pr-2">
                {wishes.map((wish, i) => (
                  <div key={`${wish.name}-${i}`} className="flex flex-col items-center gap-2 text-center">
                    <span className="text-[11px] uppercase tracking-[0.28em] text-[#8c3b2f]">
                      {wish.name}
                    </span>
                    <p className="max-w-[380px] text-[12px] leading-[2] text-[#2c2a26]/75">
                      {wish.text}
                    </p>
                    <span className="text-[10px] text-[#2c2a26]/35">
                      {formatWishTime(wish.time)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </Block>

          {/* Quà mừng */}
          {banks.length > 0 ? (
            <Block className="gap-10 text-center">
              <GiftEnvelope templateSlug={content.slug}
                banks={banks}
                accent={SEAL}
                dark={SEAL}
                cardBg={WASHI}
                heading={t("gift")}
                labelColor="rgba(44, 42, 38, 0.55)"
              />
            </Block>
          ) : null}
        </div>

        <footer className="flex flex-col items-center gap-4 px-8 pb-10">
          <HairRule color="rgba(44, 42, 38, 0.2)" className="w-16" />
          <p className="text-center text-[11px] leading-[2] tracking-[0.16em] text-[#2c2a26]/60">
            {t("presenceHonor")}
          </p>
          <a
            href="https://thiepmungonline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] tracking-[0.2em] text-[#2c2a26] opacity-40 transition-opacity hover:opacity-70"
          >
            ♡ thiepmungonline.com
          </a>
        </footer>
      </div>
    </div>
  );
}
