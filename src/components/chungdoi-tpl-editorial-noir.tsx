"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  AlbumGallery,
  buildCalendar,
  DressCode,
  formatDate,
  formatWishTime,
  GiftQrGrid,
  googleCalendarUrl,
  InvitationMap,
  MapDirectionsButton,
  SharedCountdown,
  SharedWishForm,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";
import { HairRule, OrnamentDivider } from "@/components/chungdoi-tpl-ornaments";
import {
  invitationCeremonyMessage,
  invitationGiftAccounts,
  invitationHeroImage,
  invitationOpeningMessage,
  orderByBrideFirst,
  orderedCouple,
} from "@/lib/invitation-display";

const INK = "#111111";
const ACCENT = "#8c1c13";

/** Nhãn nhỏ in hoa, giãn chữ rộng — chi tiết đặc trưng của layout tạp chí. */
function Kicker({ children }: { children: ReactNode }) {
  return (
    <span className="block text-[10px] font-semibold uppercase tracking-[0.42em] text-[#111111]/55 md:text-[11px]">
      {children}
    </span>
  );
}

/** Tiêu đề mục: số thứ tự + gạch chân toàn chiều rộng, xếp theo trục ngang. */
function SectionHead({ index, children }: { index: string; children: ReactNode }) {
  return (
    <div className="w-full">
      <div className="flex items-baseline gap-4">
        <span className="text-[11px] font-bold tabular-nums tracking-[0.2em] text-[#8c1c13]">{index}</span>
        <h2 className="text-[15px] font-bold uppercase tracking-[0.24em] text-[#111111] md:text-[17px]">{children}</h2>
      </div>
      <HairRule color={INK} className="mt-3" />
    </div>
  );
}

/** Cặp nhãn/giá trị xếp cột — dùng cho khối dữ kiện kiểu bảng biên tập. */
function DataRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-t border-[#111111]/15 py-3 md:flex-row md:items-baseline md:gap-6">
      <span className="w-[130px] shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#111111]/50">{label}</span>
      <span className="text-[15px] leading-relaxed text-[#111111] md:text-[16px]">{value}</span>
    </div>
  );
}

export function EditorialNoirInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const hero = invitationHeroImage(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();

  const orderedFamilies = orderByBrideFirst(
    { title: families.brideParentTitle || t("parents"), father: families.brideFather, mother: families.brideMother, address: families.brideAddress, side: t("brideFamily") },
    { title: families.groomParentTitle || t("parents"), father: families.groomFather, mother: families.groomMother, address: families.groomAddress, side: t("groomFamily") },
    couple.brideFirst,
  );

  const banks = invitationGiftAccounts(content).map((account) => ({
    label: account.name,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));

  return (
    <div className="w-full bg-[#f4f1ea] text-[#111111]">
      <div className="mx-auto w-full max-w-[520px] md:max-w-[900px]">
        {/* Masthead: tên báo + ngày phát hành, kẻ đôi trên dưới. */}
        <header className="px-5 pt-10 md:px-12 md:pt-16">
          <HairRule color={INK} weight={2} />
          <div className="flex items-center justify-between py-3">
            <Kicker>{t("invitation")}</Kicker>
            <Kicker>{reception ? `${reception.day}.${reception.monthNumber}.${reception.yearNumber}` : "—"}</Kicker>
          </div>
          <HairRule color={INK} />

          {/* Tên cặp đôi đặt lệch trục, cỡ chữ rất lớn — trọng tâm thị giác. */}
          <div className="pb-8 pt-10 md:pb-12 md:pt-16">
            <h2 className="font-serif text-[64px] font-black uppercase leading-[0.86] tracking-[-0.03em] md:text-[112px]">
              {people[0].shortName}
            </h2>
            <div className="my-2 flex items-center gap-4 md:my-4">
              <span className="font-serif text-[28px] italic md:text-[40px]">{t("and")}</span>
              <HairRule color={INK} className="flex-1" />
            </div>
            <h2 className="pl-[12%] font-serif text-[64px] font-black uppercase leading-[0.86] tracking-[-0.03em] md:pl-[18%] md:text-[112px]">
              {people[1].shortName}
            </h2>
          </div>
        </header>

        {/* Ảnh tràn viền, tỷ lệ ngang rộng như ảnh mở đầu phóng sự. */}
        {hero ? (
          <figure className="relative w-full">
            <img src={hero} alt={t("weddingPhotoAlt", { couple: `${people[0].shortName} & ${people[1].shortName}` })} className="aspect-[4/5] w-full object-cover md:aspect-[16/10]" />
            <figcaption className="px-5 pt-3 md:px-12">
              <Kicker>{people[0].shortName} &amp; {people[1].shortName} — {venue.address.split("\n")[0]}</Kicker>
            </figcaption>
          </figure>
        ) : null}

        <div className="flex flex-col gap-14 px-5 py-14 md:gap-20 md:px-12 md:py-20">
          {/* Lời mời: chữ dẫn nhập lớn, hai cột trên desktop. */}
          <section className="flex flex-col gap-6">
            <SectionHead index="01">{t("respectfulInvitation")}</SectionHead>
            <p className="whitespace-pre-line font-serif text-[19px] font-medium leading-[1.5] md:text-[24px]">
              {invitationOpeningMessage(content)}
            </p>
            <div className="grid gap-8 md:grid-cols-2 md:gap-12">
              {orderedFamilies.map((family) => (
                <div key={family.side} className="flex flex-col gap-2">
                  <Kicker>{family.side}</Kicker>
                  <p className="text-[15px] font-semibold md:text-[16px]">{family.title} {family.father}</p>
                  <p className="text-[15px] font-semibold md:text-[16px]">{family.title} {family.mother}</p>
                  <p className="text-[13px] leading-relaxed text-[#111111]/65">{family.address}</p>
                </div>
              ))}
            </div>
          </section>

          <OrnamentDivider color={ACCENT} />

          {/* Dữ kiện lễ/tiệc trình bày dạng bảng, không dùng thẻ card. */}
          <section className="flex flex-col gap-6">
            <SectionHead index="02">{t("details")}</SectionHead>
            <div className="flex flex-col">
              {people.map((person) => (
                <DataRow key={person.side} label={t(person.side === "bride" ? "bride" : "groom")} value={person.fullName} />
              ))}
              {ceremony ? (
                <DataRow
                  label={t("ceremony")}
                  value={`${invitationCeremonyMessage(content)} · ${couple.ceremonyTime} · ${ceremony.weekday}, ${ceremony.day}/${ceremony.monthNumber}/${ceremony.yearNumber}`}
                />
              ) : null}
              {reception ? (
                <DataRow
                  label={t("reception")}
                  value={`${couple.time || venue.banquetTime} · ${reception.weekday}, ${reception.day}/${reception.monthNumber}/${reception.yearNumber}`}
                />
              ) : null}
              {reception?.lunar ? <DataRow label={t("lunarDate")} value={reception.lunar} /> : null}
              <DataRow label={t("location")} value={<span className="whitespace-pre-line">{venue.address}</span>} />
            </div>
            <div className="flex flex-col gap-4 pt-2">
              <Kicker>{t("remaining")}</Kicker>
              <SharedCountdown target={`${couple.date}T${couple.time || venue.banquetTime || "18:00"}`} className="text-[15px] font-semibold tabular-nums tracking-[0.12em] text-[#8c1c13] md:text-[17px]" />
            </div>
            <a
              href={googleCalendarUrl(content)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex w-fit items-center gap-3 border-b border-[#8c1c13] pb-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#8c1c13] transition hover:gap-5"
            >
              {t("addToCalendar")} →
            </a>
          </section>

          {/* Lịch tháng vẽ bằng grid, viền vuông không bo góc. */}
          {calendar ? (
            <section className="flex flex-col gap-6">
              <SectionHead index="03">{t("calendar", { month: calendar.month })}</SectionHead>
              <div className="w-full max-w-[360px]">
                <div className="grid grid-cols-7 border-b border-[#111111]/20 pb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#111111]/50">
                  {WEEKDAY_LABELS.map((d) => <span key={d} className="text-center">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-y-1 pt-2 text-[13px] tabular-nums">
                  {calendar.cells.map((day, i) => (
                    <span
                      key={i}
                      className={`flex aspect-square items-center justify-center ${day === calendar.highlight ? "bg-[#8c1c13] font-black text-white" : ""}`}
                    >
                      {day ?? ""}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {gallery.length > 0 ? (
            <section className="flex flex-col gap-6">
              <SectionHead index="04">{t("album")}</SectionHead>
              <AlbumGallery photos={gallery} layout={content.albumLayout ?? "mosaic"} accent={INK} />
            </section>
          ) : null}

          {schedule.length > 0 ? (
            <section className="flex flex-col gap-6">
              <SectionHead index="05">{t("timeline")}</SectionHead>
              <ol className="flex flex-col">
                {schedule.map((item, i) => (
                  <li key={`${item.time}-${i}`} className="flex items-baseline gap-6 border-t border-[#111111]/15 py-3">
                    <span className="w-[64px] shrink-0 text-[15px] font-bold tabular-nums text-[#8c1c13]">{item.time}</span>
                    <span className="text-[15px] md:text-[16px]">{item.label}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {mapQuery ? (
            <section className="flex flex-col gap-6">
              <SectionHead index="06">{t("map")}</SectionHead>
              <div className="w-full border border-[#111111]">
                <InvitationMap query={mapQuery} title={mapQuery} className="h-72 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <MapDirectionsButton query={mapQuery} className="text-[#8c1c13]" />
            </section>
          ) : null}

          {content.dressCodeColors ? (
            <section className="flex flex-col gap-6">
              <SectionHead index="07">{t("dressCode")}</SectionHead>
              <DressCode
                colors={content.dressCodeColors.split(",").map((c) => ({ color: c.trim() }))}
                heading={<span className="sr-only">{t("dressCode")}</span>}
                headingColor={INK}
                subColor="rgba(17, 17, 17, 0.6)"
              />
            </section>
          ) : null}

          <section className="flex flex-col gap-6">
            <SectionHead index="08">{t("guestbook")}</SectionHead>
            <SharedWishForm accent={ACCENT} />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y max-h-[460px] overflow-y-auto pr-2">
                {wishes.map((wish, i) => (
                  <div key={`${wish.name}-${i}`} className="border-t border-[#111111]/15 py-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8c1c13]">{wish.name}</span>
                      <span className="text-[10px] tabular-nums text-[#111111]/45">{formatWishTime(wish.time)}</span>
                    </div>
                    <p className="mt-2 text-[14px] leading-relaxed">{wish.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          {banks.length > 0 ? (
            <section className="flex flex-col gap-6">
              <SectionHead index="09">{t("gift")}</SectionHead>
              <GiftQrGrid banks={banks} accent={ACCENT} heading="" />
            </section>
          ) : null}
        </div>

        <footer className="px-5 pb-10 md:px-12 md:pb-16">
          <HairRule color={INK} weight={2} />
          <p className="py-6 text-center font-serif text-[13px] leading-relaxed md:text-[15px]">
            {t("presenceHonor")}
          </p>
          <HairRule color={INK} />
          <div className="flex justify-center pt-4">
            <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-[0.28em] opacity-45 transition-opacity hover:opacity-70">
              thiepmungonline.com
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
