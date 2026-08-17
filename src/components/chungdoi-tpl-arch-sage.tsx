"use client";

/**
 * Arch Sage — cửa vòm xếp lớp, tông xanh rêu.
 *
 * Khác biệt so với 40 mẫu crawl: mọi khối nội dung nằm trong một khung vòm
 * (arch) bo tròn nửa trên, các vòm lồng nhau tạo chiều sâu, ảnh cưới cũng bị
 * cắt theo hình vòm. Không dùng asset raster nào.
 */

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  AlbumGallery,
  buildCalendar,
  formatDate,
  formatWishTime,
  GiftEnvelope,
  googleCalendarUrl,
  InvitationMap,
  MapDirectionsButton,
  SharedCountdown,
  SharedWishForm,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";
import { ArchOutline, LeafSprig } from "@/components/chungdoi-tpl-ornaments";
import {
  invitationCeremonyMessage,
  invitationGiftAccounts,
  invitationHeroImage,
  invitationOpeningMessage,
  orderByBrideFirst,
  orderedCouple,
} from "@/lib/invitation-display";

const SAGE = "#6b7f6a";
const DEEP = "#33402f";
const CREAM = "#fbfcf9";

/** Khung vòm: nửa trên bo tròn hoàn toàn, nửa dưới vuông. */
function Arch({
  children,
  className = "",
  bordered = true,
}: {
  children: ReactNode;
  className?: string;
  bordered?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-b-[12px] rounded-t-[999px] bg-[#fbfcf9] ${bordered ? "border border-[#6b7f6a]/35" : ""} ${className}`}>
      {children}
    </div>
  );
}

function ArchHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <LeafSprig color="rgba(107, 127, 106, 0.7)" className="h-6 w-16" />
      <h2 className="text-center font-serif text-[19px] tracking-[0.16em] text-[#33402f] md:text-[23px]">
        {children}
      </h2>
    </div>
  );
}

export function ArchSageInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const hero = invitationHeroImage(content);

  const banks = invitationGiftAccounts(content).map((account) => ({
    label: `${account.birthOrder} — ${account.name}`,
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
    <div className="flex w-full justify-center bg-[#eef1ea] text-[#33402f]">
      <div className="w-full max-w-[520px] px-5 pb-0 pt-10 md:max-w-[760px] md:px-10 md:pt-16">
        {/* Hero: vòm lớn chứa tên, phía sau là 2 vòm outline lệch nhau */}
        <div className="relative flex justify-center">
          <ArchOutline
            color="rgba(107, 127, 106, 0.28)"
            className="pointer-events-none absolute -top-4 left-1/2 h-[420px] w-[300px] -translate-x-[58%] md:h-[560px] md:w-[400px]"
          />
          <ArchOutline
            color="rgba(107, 127, 106, 0.2)"
            className="pointer-events-none absolute -top-8 left-1/2 h-[420px] w-[300px] -translate-x-[42%] md:h-[560px] md:w-[400px]"
          />
          <Arch className="relative w-[270px] px-6 pb-8 pt-16 md:w-[360px] md:pb-12 md:pt-24">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-[0.34em] text-[#33402f]/55">
                {t("saveTheDate")}
              </span>
              <span className="mt-6 text-center font-serif text-[30px] leading-tight md:text-[40px]">
                {people[0].shortName}
              </span>
              <LeafSprig color="rgba(107, 127, 106, 0.8)" className="my-3 h-5 w-14" />
              <span className="text-center font-serif text-[30px] leading-tight md:text-[40px]">
                {people[1].shortName}
              </span>
              {reception ? (
                <span className="mt-7 text-[11px] tracking-[0.28em] text-[#33402f]/60">
                  {reception.day}.{reception.month}.{reception.yearNumber}
                </span>
              ) : null}
            </div>
          </Arch>
        </div>

        {/* Ảnh cưới cắt theo hình vòm */}
        {hero ? (
          <div className="mt-12 flex justify-center md:mt-16">
            <Arch className="w-[240px] md:w-[320px]" bordered={false}>
              <img src={hero} alt={t("weddingPhotoAlt", { couple: `${people[0].shortName} ${t("and")} ${people[1].shortName}` })} className="h-[330px] w-full object-cover md:h-[440px]" />
            </Arch>
          </div>
        ) : null}

        <div className="flex flex-col items-center gap-16 pt-14 md:gap-20 md:pt-20">
          {/* Gia đình + lời báo tin */}
          <section className="flex w-full flex-col items-center gap-8">
            <ArchHeading>{t("invitation")}</ArchHeading>
            <div className="grid w-full gap-8 md:grid-cols-2 md:gap-10">
              {familyPair.map((family, i) => (
                <Arch key={i} className="px-6 pb-6 pt-12 text-center">
                  <span className="text-[10px] uppercase tracking-[0.28em] text-[#33402f]/50">
                    {family.title}
                  </span>
                  <p className="mt-3 font-serif text-[15px]">{family.father}</p>
                  <p className="font-serif text-[15px]">{family.mother}</p>
                  <p className="mt-3 text-[12px] leading-relaxed text-[#33402f]/60">
                    {family.address}
                  </p>
                </Arch>
              ))}
            </div>

            <p className="max-w-[420px] whitespace-pre-line text-center text-[12.5px] uppercase leading-[2] tracking-[0.1em] text-[#33402f]/75">
              {invitationOpeningMessage(content)}
            </p>

            <div className="flex w-full flex-col items-center gap-5">
              {people.map((person) => (
                <div key={person.side} className="flex flex-col items-center">
                  <span className="font-serif text-[26px] leading-tight md:text-[32px]">
                    {person.fullName}
                  </span>
                  <span className="mt-1 text-[10px] uppercase tracking-[0.28em] text-[#33402f]/50">
                    {person.birthOrder}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Lễ cưới */}
          {ceremony ? (
            <section className="flex w-full flex-col items-center gap-7">
              <ArchHeading>{t("ceremony")}</ArchHeading>
              <p className="max-w-[400px] whitespace-pre-line text-center text-[12.5px] uppercase leading-[1.9] tracking-[0.1em] text-[#33402f]/70">
                {invitationCeremonyMessage(content)}
              </p>
              <Arch className="w-[200px] px-5 pb-6 pt-14 text-center md:w-[240px]">
                <div className="font-serif text-[46px] leading-none md:text-[56px]">{ceremony.day}</div>
                <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-[#33402f]/55">
                  {t("month", { month: ceremony.month })} · {ceremony.yearNumber}
                </div>
                {couple.ceremonyTime ? (
                  <div className="mt-3 text-[15px] tracking-[0.18em]">{couple.ceremonyTime}</div>
                ) : null}
                <div className="mt-1 text-[11px] text-[#33402f]/50">{ceremony.lunar}</div>
              </Arch>
            </section>
          ) : null}

          {/* Tiệc cưới + lịch + countdown */}
          <section className="flex w-full flex-col items-center gap-7">
            <ArchHeading>{t("reception")}</ArchHeading>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#33402f]/55">
                {t("startsAt")}
              </span>
              <span className="font-serif text-[26px] md:text-[32px]">{couple.time || venue.banquetTime}</span>
              {reception ? (
                <span className="mt-1 text-[12px] tracking-[0.18em] text-[#33402f]/65">
                  {reception.weekday} · {reception.day}.{reception.month}.{reception.yearNumber}
                </span>
              ) : null}
              {reception ? (
                <span className="text-[11px] text-[#33402f]/50">{reception.lunar}</span>
              ) : null}
            </div>

            {calendar ? (
              <div className="w-full max-w-[320px] rounded-2xl border border-[#6b7f6a]/30 bg-[#fbfcf9] px-6 py-5 md:max-w-[380px]">
                <p className="text-center text-[11px] uppercase tracking-[0.22em] text-[#33402f]/60">
                  {t("calendar", { month: `${calendar.month} / ${calendar.year}` })}
                </p>
                <div className="mt-3 grid grid-cols-7 text-[10px] text-[#33402f]/50">
                  {WEEKDAY_LABELS.map((d) => (
                    <span key={d} className="py-0.5 text-center">{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1 text-[11.5px]">
                  {calendar.cells.map((day, i) => (
                    <span
                      key={i}
                      className={`flex aspect-square items-center justify-center rounded-full ${day === calendar.highlight ? "bg-[#6b7f6a] text-[#fbfcf9]" : ""}`}
                    >
                      {day ?? ""}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <SharedCountdown
              target={`${couple.date}T${couple.time || venue.banquetTime || "18:00"}`}
              className="text-center text-[13px] tracking-[0.12em] text-[#33402f]/70"
            />

            <a
              href={googleCalendarUrl(content)}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[#6b7f6a] px-6 py-2 text-[11px] uppercase tracking-[0.2em] text-[#33402f]"
            >
              {t("addToCalendar")}
            </a>
          </section>

          {/* Album ảnh trong vòm */}
          {gallery.length > 0 ? (
            <section className="flex w-full flex-col items-center gap-7">
              <ArchHeading>{t("album")}</ArchHeading>
              <AlbumGallery photos={gallery} layout={content.albumLayout ?? "mosaic"} accent={SAGE} />
            </section>
          ) : null}

          {/* Địa điểm */}
          {mapQuery ? (
            <section className="flex w-full flex-col items-center gap-6 text-center">
              <ArchHeading>{t("location")}</ArchHeading>
              <p className="max-w-[380px] whitespace-pre-line text-[13px] leading-relaxed text-[#33402f]/75">
                {venue.address}
              </p>
              <div className="w-full overflow-hidden rounded-2xl border border-[#6b7f6a]/30">
                <InvitationMap query={mapQuery} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <MapDirectionsButton query={mapQuery} className="text-[#33402f]" />
            </section>
          ) : null}

          {/* Lịch trình */}
          {schedule.length > 0 ? (
            <section className="flex w-full flex-col items-center gap-7">
              <ArchHeading>{t("timeline")}</ArchHeading>
              <ol className="flex w-full max-w-[340px] flex-col">
                {schedule.map((item, i) => (
                  <li
                    key={`${item.time}-${i}`}
                    className={`flex items-baseline gap-5 py-3 ${i === 0 ? "" : "border-t border-[#6b7f6a]/25"}`}
                  >
                    <span className="w-[52px] shrink-0 text-right text-[14px] tabular-nums text-[#6b7f6a]">
                      {item.time}
                    </span>
                    <span className="text-[14px]">{item.label}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* Sổ lưu bút */}
          <section className="w-full">
            <div className="flex justify-center"><ArchHeading>{t("guestbook")}</ArchHeading></div>
            <div className="mt-6">
              <SharedWishForm accent={SAGE} />
            </div>
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y mx-auto mt-7 max-h-[420px] w-full space-y-3 overflow-y-auto pr-2">
                {wishes.map((wish, i) => (
                  <div
                    key={`${wish.name}-${i}`}
                    className="rounded-xl border border-[#6b7f6a]/25 bg-[#fbfcf9] px-4 py-3"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-serif text-[13px] text-[#33402f]">{wish.name}</span>
                      <span className="text-[10px] text-[#33402f]/50">{formatWishTime(wish.time)}</span>
                    </div>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-[#33402f]/80">
                      {wish.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          {/* Quà mừng */}
          {banks.length > 0 ? (
            <section className="w-full text-center">
              <GiftEnvelope templateSlug={content.slug}
                banks={banks}
                accent={DEEP}
                dark={SAGE}
                cardBg={CREAM}
                heading={t("gift")}
                labelColor="rgba(51, 64, 47, 0.6)"
              />
            </section>
          ) : null}
        </div>

        <footer className="mt-16 flex flex-col items-center gap-4 pb-8">
          <LeafSprig color="rgba(107, 127, 106, 0.6)" className="h-6 w-20" />
          <p className="max-w-[360px] text-center text-[11.5px] leading-relaxed text-[#33402f]/65">
            {t("presenceHonor")}
          </p>
          <a
            href="https://thiepmungonline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] tracking-[0.14em] text-[#33402f] opacity-50 transition-opacity hover:opacity-75"
          >
            ♡ thiepmungonline.com
          </a>
        </footer>
      </div>
    </div>
  );
}
