"use client";

/**
 * Ticket Terracotta — bố cục vé/boarding pass.
 *
 * Khác biệt so với 40 mẫu crawl: thông tin xếp thành các "cuống vé" có răng
 * cưa và đường perforation, dữ liệu trình bày dạng bảng nhãn/giá trị chữ hoa,
 * kèm mã vạch ở chân vé. Không dùng asset raster nào.
 */

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  AlbumGallery,
  buildCalendar,
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
import { Barcode, PerforationRule } from "@/components/chungdoi-tpl-ornaments";
import {
  invitationCeremonyMessage,
  invitationGiftAccounts,
  invitationOpeningMessage,
  orderByBrideFirst,
  orderedCouple,
} from "@/lib/invitation-display";

const CLAY = "#a4462d";

/** Nhãn nhỏ in hoa kiểu chữ trên vé. */
function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#a4462d]/75">
        {label}
      </span>
      <span className="whitespace-pre-line text-[13px] font-semibold leading-snug md:text-[14px]">{value}</span>
    </div>
  );
}

/** Một cuống vé: viền nét, góc cắt, nền giấy. */
function Stub({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative w-full border border-[#a4462d]/35 bg-[#fffaf5] px-5 py-6 shadow-[0_1px_0_rgb(164_70_45_/_0.12)] md:px-8 md:py-8 ${className}`}>
      {children}
    </div>
  );
}

function StubHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-5 text-[11px] font-bold uppercase tracking-[0.28em] text-[#a4462d]">
      {children}
    </h2>
  );
}

export function TicketTerracottaInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();

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
    <div className="flex w-full justify-center bg-[#f6ede4] text-[#3b2318]">
      <div className="w-full max-w-[520px] px-4 pb-0 pt-8 md:max-w-[760px] md:px-8 md:pt-14">
        {/* Cuống vé chính: tên cặp đôi + số hiệu chuyến */}
        <Stub className="overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a4462d]/75">
              {t("invitation")} · {t("weddingPass")}
            </span>
            <span className="tabular-nums text-[10px] text-[#a4462d]/75">
              NO. {couple.date.replace(/-/g, "")}
            </span>
          </div>

          <div className="mt-7 flex flex-col items-center text-center">
            <span data-invitation-short-name className="font-serif text-[28px] leading-tight md:text-[38px]">
              {people[0].shortName}
            </span>
            <span className="my-1 text-[13px] uppercase tracking-[0.4em] text-[#a4462d]">
              {t("and")}
            </span>
            <span data-invitation-short-name className="font-serif text-[28px] leading-tight md:text-[38px]">
              {people[1].shortName}
            </span>
          </div>

          <div className="mt-7">
            <PerforationRule color="rgba(164, 70, 45, 0.45)" className="h-[10px] w-full" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
            <Field label={t("day")} value={reception ? `${reception.day}.${reception.month}.${reception.yearNumber}` : ""} />
            <Field label={t("time")} value={couple.time || venue.banquetTime} />
            <Field label={t("weekday")} value={reception?.weekday ?? ""} />
            <Field label={t("lunarDate")} value={reception?.lunar ?? ""} />
          </div>

          <div className="mt-8 flex items-end justify-between gap-4">
            <Barcode color="rgba(59, 35, 24, 0.8)" className="h-8 w-[140px] md:w-[180px]" />
            <span className="text-[10px] text-[#a4462d]/70">
              {t("admitTwo")}
            </span>
          </div>
        </Stub>

        {/* Cuống: gia đình + lời báo tin */}
        <div className="mt-4">
          <Stub>
            <StubHeading>{t("invitation")}</StubHeading>
            <div className="grid gap-6 md:grid-cols-2">
              {familyPair.map((family, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#a4462d]/75">
                    {family.title}
                  </span>
                  <span className="text-[14px] font-semibold">{family.father}</span>
                  <span className="text-[14px] font-semibold">{family.mother}</span>
                  <span className="mt-1 text-[12px] leading-relaxed opacity-70">{family.address}</span>
                </div>
              ))}
            </div>

            <p className="mt-7 whitespace-pre-line text-[13px] font-semibold uppercase leading-relaxed tracking-wide">
              {invitationOpeningMessage(content)}
            </p>

            <div className="mt-6 flex flex-col gap-4">
              {people.map((person) => (
                <div key={person.side} className="flex items-baseline justify-between gap-4 border-b border-[#a4462d]/20 pb-2">
                  {/* Không khai font ở tên: tên ba mẹ ngay phía trên không khai font
                      nên phải để tên thừa hưởng cùng font, đừng để lẻ ra một serif. */}
                  <span className="text-[19px] md:text-[23px]">
                    {person.fullName}
                  </span>
                  <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-[#a4462d]/80">
                    {person.birthOrder}
                  </span>
                </div>
              ))}
            </div>
          </Stub>
        </div>

        {/* Cuống: lễ + tiệc */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {ceremony ? (
            <Stub>
              <StubHeading>{t("ceremony")}</StubHeading>
              <p className="whitespace-pre-line text-[12px] font-semibold uppercase leading-relaxed">
                {invitationCeremonyMessage(content)}
              </p>
              <div className="mt-5 flex items-baseline gap-3">
                <span className="font-serif text-[40px] leading-none md:text-[52px]">
                  {ceremony.day}
                </span>
                <div className="flex flex-col text-[11px] uppercase tracking-[0.16em] text-[#a4462d]">
                  <span>{t("month", { month: ceremony.month })}</span>
                  <span>{ceremony.yearNumber}</span>
                </div>
              </div>
              {couple.ceremonyTime ? (
                <p className="mt-3 text-[14px] font-semibold">{couple.ceremonyTime}</p>
              ) : null}
              <p className="mt-1 text-[11px] opacity-65">{ceremony.lunar}</p>
            </Stub>
          ) : null}

          <Stub>
            <StubHeading>{t("reception")}</StubHeading>
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-[40px] leading-none md:text-[52px]">
                {reception?.day ?? "--"}
              </span>
              <div className="flex flex-col text-[11px] uppercase tracking-[0.16em] text-[#a4462d]">
                <span>{t("month", { month: reception?.month ?? "--" })}</span>
                <span>{reception?.yearNumber ?? ""}</span>
              </div>
            </div>
            <p className="mt-3 text-[14px] font-semibold">{couple.time || venue.banquetTime}</p>
            <p className="mt-1 text-[11px] opacity-65">{reception?.lunar ?? ""}</p>
            <div className="mt-5">
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#a4462d]/75">
                {t("remaining")}
              </span>
              <SharedCountdown
                target={`${couple.date}T${couple.time || venue.banquetTime || "00:00"}`}
                className="mt-1 text-[13px] font-semibold"
              />
            </div>
          </Stub>
        </div>

        {/* Cuống: lịch tháng */}
        {calendar ? (
          <div className="mt-4">
            <Stub>
              <StubHeading>{t("calendar", { month: `${calendar.month} / ${calendar.year}` })}</StubHeading>
              <div className="mx-auto w-full max-w-[360px]">
                <div className="grid grid-cols-7 text-[10px] font-bold uppercase text-[#a4462d]/70">
                  {WEEKDAY_LABELS.map((day) => (
                    <span key={day} className="py-1 text-center">
                      {day}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1 text-[12px] tabular-nums">
                  {calendar.cells.map((day, i) => (
                    <span
                      key={i}
                      className={`flex aspect-square items-center justify-center ${day === calendar.highlight ? "bg-[#a4462d] font-bold text-white" : ""}`}
                    >
                      {day ?? ""}
                    </span>
                  ))}
                </div>
              </div>
              <a
                href={googleCalendarUrl(content)}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex border border-[#a4462d] px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a4462d]"
              >
                {t("addToCalendar")}
              </a>
            </Stub>
          </div>
        ) : null}

        {/* Cuống: album */}
        {gallery.length > 0 ? (
          <div className="mt-4">
            <Stub>
              <StubHeading>{t("album")}</StubHeading>
              <div className="flex justify-center">
                <AlbumGallery photos={gallery} layout={content.albumLayout ?? "mosaic"} accent={CLAY} />
              </div>
            </Stub>
          </div>
        ) : null}

        {/* Cuống: địa điểm */}
        {mapQuery ? (
          <div className="mt-4">
            <Stub>
              <StubHeading>{t("location")}</StubHeading>
              <p className="whitespace-pre-line text-[13px] leading-relaxed">{venue.address}</p>
              <div className="mt-4 overflow-hidden border border-[#a4462d]/30">
                <InvitationMap query={mapQuery} title={mapQuery} className="h-60 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <MapDirectionsButton query={mapQuery} className="text-[#a4462d]" />
            </Stub>
          </div>
        ) : null}

        {/* Cuống: lịch trình dạng bảng vé */}
        {schedule.length > 0 ? (
          <div className="mt-4">
            <Stub>
              <StubHeading>{t("timeline")}</StubHeading>
              <ol className="flex flex-col">
                {schedule.map((item, i) => (
                  <li
                    key={`${item.time}-${i}`}
                    className="flex items-baseline gap-5 border-b border-[#a4462d]/15 py-3 last:border-b-0"
                  >
                    <span className="w-[58px] shrink-0 text-[13px] tabular-nums text-[#a4462d]">
                      {item.time}
                    </span>
                    <span className="text-[14px] font-medium">{item.label}</span>
                  </li>
                ))}
              </ol>
            </Stub>
          </div>
        ) : null}

        {/* Cuống: lưu bút */}
        <div className="mt-4">
          <Stub>
            <StubHeading>{t("guestbook")}</StubHeading>
            <SharedWishForm accent={CLAY} />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y mt-6 max-h-[420px] space-y-3 overflow-y-auto pr-2">
                {wishes.map((wish, i) => (
                  <div
                    key={`${wish.name}-${i}`}
                    className="border border-[#a4462d]/20 bg-[#a4462d]/5 p-3 text-[12px]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-bold uppercase tracking-wide text-[#a4462d]">
                        {wish.name}
                      </span>
                      <span className="tabular-nums shrink-0 text-[10px] opacity-60">{formatWishTime(wish.time)}</span>
                    </div>
                    <p className="mt-2 leading-relaxed">{wish.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </Stub>
        </div>

        {/* Cuống: quà mừng */}
        {banks.length > 0 ? (
          <div className="mt-4">
            <Stub>
              <div className="text-center">
                <GiftQrGrid banks={banks} accent={CLAY} heading={t("gift")} />
              </div>
            </Stub>
          </div>
        ) : null}

        <footer className="mt-8 flex flex-col items-center gap-3 pb-6 text-center">
          <PerforationRule color="rgba(164, 70, 45, 0.4)" className="h-[10px] w-full" />
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#a4462d]">
            {t("presenceHonor")}
          </p>
          <a
            href="https://thiepmungonline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#a4462d] opacity-50 transition-opacity hover:opacity-70"
          >
            ♡ thiepmungonline.com
          </a>
        </footer>
      </div>
    </div>
  );
}
