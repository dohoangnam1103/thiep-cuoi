"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { TemplateGiftArtwork } from "@/components/chungdoi-gift-envelope-artwork";
import { useWishFormBinding } from "@/components/chungdoi-live-forms";
import {
  AlbumGallery,
  buildCalendar,
  DressCode,
  formatDate,
  formatWishTime,
  GiftQrGrid,
  googleCalendarUrl,
  InvitationMap,
  WEEKDAY_LABELS,
  type FormattedDate,
} from "@/components/chungdoi-tpl-shared";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  invitationCeremonyMessage,
  invitationGiftAccounts,
  invitationOpeningMessage,
  orderByBrideFirst,
  orderedCouple,
} from "@/lib/invitation-display";

const ASSET_ROOT = "/chungdoi/images/themes/royal-v2-green";
const IVORY = "#e5e4d0";
const GOLD = "#874f22";

// Khung vàng của bản gốc là border-image gradient 135deg, không phải viền đặc:
// đậm ở hai góc, sáng nhất ở giữa. Viền đặc làm mất hẳn hiệu ứng dập kim.
const GOLD_FRAME_STYLE = {
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: "transparent",
  borderImage:
    "linear-gradient(135deg, #874f22 0%, #c79a4e 30%, #f0dca8 50%, #c79a4e 70%, #874f22 100%) 1 / 1 / 0 stretch",
} as const;

type FamilyDetails = {
  title: string;
  father: string;
  mother: string;
  address: string;
};

function SectionHeading({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-center text-[20px] font-bold uppercase leading-[1.5] tracking-[0.02em] text-[#e5e4d0] ${className}`}>
      {children}
    </h2>
  );
}

function FamilyColumn({ family }: { family: FamilyDetails }) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center text-[#e5e4d0]">
      <span className="text-[11px] opacity-70 md:text-[16px]">{family.title}</span>
      <span className="mt-1 text-[12px] font-semibold leading-5 md:text-[16px] md:leading-7">{family.father}</span>
      <span className="text-[12px] font-semibold leading-5 md:text-[16px] md:leading-7">{family.mother}</span>
      <span className="mt-1 text-[10px] leading-4 opacity-60 md:text-[13px] md:leading-5">{family.address}</span>
    </div>
  );
}

function DateStrip({ date }: { date: FormattedDate }) {
  const t = useTranslations("invitationTemplate");

  return (
    <div className="flex items-center justify-center text-[#e5e4d0]">
      <span className="w-[78px] text-right text-[12px] font-semibold uppercase leading-4 opacity-75 md:w-[104px] md:text-[16px] md:leading-5">
        {date.weekday}
      </span>
      <span className="mx-3 h-7 w-px bg-[#e5e4d0]/45 md:mx-5 md:h-8" />
      <span className="text-[30px] font-semibold leading-none md:text-[40px]">{date.day}</span>
      <span className="mx-3 h-7 w-px bg-[#e5e4d0]/45 md:mx-5 md:h-8" />
      <span className="w-[78px] text-left text-[12px] font-semibold uppercase leading-4 opacity-75 md:w-[104px] md:text-[16px] md:leading-5">
        {t("month", { month: date.month })}
      </span>
    </div>
  );
}

function LunarDate({ value }: { value: string }) {
  const t = useTranslations("invitationTemplate");
  const parts = value.match(/(\d{1,2})\/(\d{1,2})\s+năm\s+(.+?)\s+âm lịch$/u);

  if (!parts) return value;
  return t("lunarDateLong", {
    day: parts[1],
    month: parts[2],
    yearName: parts[3],
  });
}

function RoyalV2WishForm() {
  const t = useTranslations("invitationTemplate");
  const { formProps, pending, state } = useWishFormBinding();

  return (
    <form {...formProps} className="mx-auto mt-7 w-full md:max-w-[600px]">
      <div className="flex flex-col gap-4">
        <label className="sr-only" htmlFor="royal-v2-wish-name">{t("wishName")}</label>
        <input
          id="royal-v2-wish-name"
          name="name"
          required
          maxLength={120}
          className="h-12 w-full rounded-[7px] border border-[#e5e4d0] bg-transparent px-4 text-[13px] text-[#e5e4d0] outline-none placeholder:text-[#e5e4d0]/55"
          placeholder={`${t("sourceWishName")}*`}
        />
        <label className="sr-only" htmlFor="royal-v2-wish-text">{t("wishText")}</label>
        <textarea
          id="royal-v2-wish-text"
          name="text"
          required
          maxLength={1000}
          rows={4}
          className="min-h-28 w-full resize-y rounded-[7px] border border-[#e5e4d0] bg-transparent px-4 py-3 text-[13px] text-[#e5e4d0] outline-none placeholder:text-[#e5e4d0]/55"
          placeholder={`${t("sourceWishText")}*`}
        />
        {state?.error ? <p className="text-xs text-red-300">{state.error}</p> : null}
        {state?.ok ? <p className="text-xs text-[#e5e4d0]">{t("wishSuccess")}</p> : null}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 rounded-[7px] border border-[#e5e4d0] px-7 text-[13px] font-bold uppercase text-[#e5e4d0] transition-colors hover:bg-[#e5e4d0]/10 disabled:opacity-60"
          >
            {pending ? t("wishPending") : t("wishSubmit")}
          </button>
        </div>
      </div>
    </form>
  );
}

export function RoyalV2GreenInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const { couple, families, gallery, schedule, venue, wishes } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const [giftOpen, setGiftOpen] = useState(false);

  const familyPair = orderByBrideFirst<FamilyDetails>(
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

  const banks = invitationGiftAccounts(content).map((account) => ({
    label: `${account.side === "groom" ? t("groom") : t("bride")} - ${account.name}`,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));

  const scheduleIcons = [
    null,
    `${ASSET_ROOT}/ring.webp`,
    `${ASSET_ROOT}/cake.webp`,
    `${ASSET_ROOT}/welcome.webp`,
    null,
  ];

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <main className="font-body-serif relative isolate w-full max-w-[480px] overflow-hidden bg-[#10261c] text-[#e5e4d0] md:mx-auto md:max-w-[900px] md:border md:border-[#874f22]/20">
        <img
          aria-hidden="true"
          alt=""
          src={`${ASSET_ROOT}/background.webp`}
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-full w-full max-w-none -translate-x-1/2 object-cover opacity-40"
        />

        <section className="relative isolate flex w-full flex-col items-center px-4 pb-15 pt-[clamp(60px,15vw,110px)] md:pb-40">
          <div className="relative z-10 mx-auto w-[86%] max-w-[360px] md:max-w-[540px]">
            <div className="pointer-events-none absolute inset-0" style={GOLD_FRAME_STYLE} />
            <img aria-hidden="true" alt="" src={`${ASSET_ROOT}/flower1-decoration.webp`} className="pointer-events-none absolute -left-[29%] -top-[20%] z-20 w-[98%] max-w-none" />
            <img aria-hidden="true" alt="" src={`${ASSET_ROOT}/flower2-decoration.webp`} className="pointer-events-none absolute left-[36%] top-[50%] z-20 w-[97%] max-w-none" />

            <div className="relative z-10 aspect-[372/603]">
              <img aria-hidden="true" alt="" src={`${ASSET_ROOT}/golden-line.webp`} className="pointer-events-none absolute left-1/2 top-[27%] z-10 w-[33%] -translate-x-1/2" />
              <img aria-hidden="true" alt="" src={`${ASSET_ROOT}/golden-line.webp`} className="pointer-events-none absolute left-1/2 top-[66%] z-10 w-[33%] -translate-x-1/2" />

              <p className="absolute left-1/2 top-[21%] w-[70%] -translate-x-1/2 text-center text-[clamp(9px,2.4vw,12px)] font-semibold uppercase leading-[1.7] tracking-[0.07em]">
                {t("invitedToWedding")}
              </p>

              <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center font-couple-garamond leading-[1.05]">
                <span data-invitation-short-name className="text-[clamp(46px,13vw,72px)]">{people[0].shortName}</span>
                <span className="my-2 text-[clamp(24px,6.6vw,38px)] font-normal">&amp;</span>
                <span data-invitation-short-name className="text-[clamp(46px,13vw,72px)]">{people[1].shortName}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="relative isolate flex w-full flex-col items-center px-4">
          <div className="relative mx-auto w-[86%] max-w-[360px] md:max-w-[540px]">
            <div className="pointer-events-none absolute inset-0" style={GOLD_FRAME_STYLE} />
            <img aria-hidden="true" alt="" src={`${ASSET_ROOT}/leaf-decoration.webp`} className="pointer-events-none absolute left-[85%] top-[40%] z-20 w-[53%] max-w-none" />
            <img aria-hidden="true" alt="" src={`${ASSET_ROOT}/flower2-decoration.webp`} className="pointer-events-none absolute -left-[19%] top-[82%] z-20 w-[49%] max-w-none md:-left-[14%] md:top-[78%] md:w-[45%]" />

            <div className="relative z-10 flex flex-col items-center px-5 pb-12 pt-11 text-center md:px-8 md:py-16">
              <SectionHeading>{t("weddingInformation")}</SectionHeading>

              <div className="mt-8 grid w-full grid-cols-[1fr_auto_1fr] items-start gap-x-3">
                <FamilyColumn family={familyPair[0]} />
                <span className="h-24 w-px self-center bg-[#e5e4d0]/35" />
                <FamilyColumn family={familyPair[1]} />
              </div>

              <p className="mt-11 whitespace-pre-line text-[12px] font-semibold uppercase leading-6 tracking-[0.02em] md:max-w-[420px] md:text-[18px] md:leading-8">
                {invitationOpeningMessage(content)}
              </p>

              <div className="mt-9 flex w-full flex-col items-center">
                <h3 className="font-couple-garamond flex min-h-20 w-full items-center justify-center whitespace-nowrap text-[40px] leading-[52px] md:text-[52px] md:leading-[70px]">
                  {people[0].fullName}
                </h3>
                <span className="text-[10px] uppercase tracking-[0.12em] opacity-55 md:text-[13px]">{people[0].birthOrder}</span>
                <span className="my-5 font-couple-garamond text-[34px] md:text-[42px]">&amp;</span>
                <h3 className="font-couple-garamond flex min-h-20 w-full items-center justify-center whitespace-nowrap text-[40px] leading-[52px] md:text-[52px] md:leading-[70px]">
                  {people[1].fullName}
                </h3>
                <span className="text-[10px] uppercase tracking-[0.12em] opacity-55 md:text-[13px]">{people[1].birthOrder}</span>
              </div>

              <p className="mt-11 max-w-[280px] whitespace-pre-line text-[11px] font-semibold uppercase leading-6 tracking-[0.03em] opacity-70 md:max-w-[400px] md:text-[16px] md:leading-7">
                {invitationCeremonyMessage(content)}
              </p>
              {couple.ceremonyTime ? (
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide opacity-70 md:text-[16px]">
                  {t("atTime", { time: couple.ceremonyTime })}
                </p>
              ) : null}
              {ceremony ? (
                <div className="mt-7 flex flex-col items-center gap-5">
                  <DateStrip date={ceremony} />
                  <span className="text-[16px] font-semibold opacity-70 md:text-[22px]">{ceremony.yearNumber}</span>
                  <span className="text-[10px] opacity-70 md:text-[14px]"><LunarDate value={ceremony.lunar} /></span>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {gallery.length > 0 ? (
          <section className="relative z-10 px-4 pb-4 pt-12 md:pt-16">
            <SectionHeading>{t("photoAlbum")}</SectionHeading>
            <div className="mx-auto mt-7 w-full max-w-[320px] md:max-w-[520px]">
              <AlbumGallery photos={gallery} layout="grid" accent={GOLD} gridAspect="aspect-square" radiusClass="rounded-none" />
            </div>
            <img aria-hidden="true" alt="" src={`${ASSET_ROOT}/flower3-decoration.webp`} className="mx-auto my-10 w-[54%] max-w-[260px]" />
          </section>
        ) : null}

        <section className="relative isolate flex w-full flex-col items-center px-4 pt-1">
          <div className="relative mx-auto w-[86%] max-w-[360px] md:max-w-[540px]">
            <div className="pointer-events-none absolute inset-0" style={GOLD_FRAME_STYLE} />
            <img aria-hidden="true" alt="" src={`${ASSET_ROOT}/leaf-decoration.webp`} className="pointer-events-none absolute -left-[29%] top-[30%] z-20 w-[48%] max-w-none" />
            <img aria-hidden="true" alt="" src={`${ASSET_ROOT}/flower2-decoration.webp`} className="pointer-events-none absolute left-[71%] top-[83%] z-20 w-[49%] max-w-none md:left-[70%] md:top-[78%] md:w-[50%]" />

            <div className="relative z-10 flex flex-col items-center px-5 pb-12 pt-12 text-center md:px-8 md:py-16">
              <SectionHeading>{t("receptionInformation")}</SectionHeading>
              <h3 className="mt-7 max-w-[280px] text-[18px] font-semibold uppercase leading-7 md:max-w-[380px] md:text-[24px] md:leading-9">
                {t("receptionStartsAt")}
              </h3>
              <p className="mt-7 text-[18px] font-semibold opacity-70 md:text-[26px]">{venue.banquetTime || couple.time}</p>

              {reception ? (
                <div className="mt-7 flex flex-col items-center gap-6">
                  <DateStrip date={reception} />
                  <span className="text-[17px] font-semibold opacity-70 md:text-[24px]">{reception.yearNumber}</span>
                  <span className="text-[10px] opacity-70 md:text-[16px]"><LunarDate value={reception.lunar} /></span>
                </div>
              ) : null}

              <div className="mt-9 grid grid-cols-2 gap-x-12 text-center">
                <div>
                  <p className="text-[10px] uppercase opacity-60 md:text-[14px]">{t("guestArrival")}</p>
                  <p className="mt-2 text-[18px] font-bold md:text-[24px]">{venue.welcomeTime || schedule[0]?.time || ""}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase opacity-60 md:text-[14px]">{t("banquetOpening")}</p>
                  <p className="mt-2 text-[18px] font-bold md:text-[24px]">{venue.banquetTime || couple.time}</p>
                </div>
              </div>

              {calendar ? (
                <div className="mt-10 w-full max-w-[286px] rounded-[32px] border border-[#e5e4d0]/65 px-5 pb-5 pt-7 md:max-w-[360px] md:px-7 md:pb-7 md:pt-8">
                  <p className="text-[12px] font-semibold">{t("monthYear", { month: calendar.month, year: calendar.year })}</p>
                  <div className="mt-5 grid grid-cols-7 border-b-2 border-[#e5e4d0] pb-2 text-[9px] font-semibold opacity-60">
                    {WEEKDAY_LABELS.map((day) => <span key={day}>{day}</span>)}
                  </div>
                  <div className="mt-2 grid grid-cols-7 gap-y-1">
                    {calendar.cells.map((day, index) => (
                      <div key={`${day ?? "empty"}-${index}`} className="flex h-7 items-center justify-center text-[10px]">
                        {day === calendar.highlight ? (
                          <span className="relative flex h-7 w-8 items-center justify-center font-bold text-[#173326]">
                            <img aria-hidden="true" alt="" src={`${ASSET_ROOT}/calendar-heart.webp`} className="absolute inset-0 h-full w-full object-contain" />
                            <span className="relative z-10">{day}</span>
                          </span>
                        ) : day}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <a
                href={googleCalendarUrl(content)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 text-[11px] underline decoration-1 underline-offset-4 opacity-65 transition-opacity hover:opacity-100"
              >
                {t("addToCalendar")}
              </a>
            </div>
          </div>
        </section>

        <div className="relative z-20 flex justify-center py-8">
          <button type="button" className="min-h-10 rounded-full border border-[#e5e4d0] px-7 text-[11px] font-semibold uppercase tracking-wide text-[#e5e4d0] transition-colors hover:bg-[#e5e4d0]/10">
            {t("attendConfirmation")}
          </button>
        </div>

        <section className="relative z-10 flex min-h-[445px] flex-col items-center px-6 pt-8 text-center md:px-10 md:pt-14">
          <SectionHeading className="text-[18px] md:text-[22px]">{t("receptionVenueHeading")}</SectionHeading>
          <p className="mt-3 max-w-[310px] whitespace-pre-line text-[11px] leading-5 opacity-65 md:max-w-[420px] md:text-[14px] md:leading-relaxed">{venue.address}</p>
          {mapQuery ? (
            <InvitationMap
              query={mapQuery}
              title={mapQuery}
              className="mt-4 h-[250px] w-full max-w-[350px] border-0 opacity-75 md:h-[340px] md:max-w-[480px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : null}
        </section>

        <section className="relative z-10 px-6 pb-6 pt-8 md:px-10 md:py-12">
          <DressCode
            colors={(content.dressCodeColors || "#001d0f,#e9bd6a,#315739,#f6e8c6").split(",").map((color) => ({ color }))}
            heading={<SectionHeading>{t("dressCodeHeading")}</SectionHeading>}
            subLabel={t("partyAttire")}
            headingColor={IVORY}
            subColor={IVORY}
          />
        </section>

        {schedule.length > 0 ? (
          <section className="relative isolate px-6 pb-9 pt-12">
            <img aria-hidden="true" alt="" src={`${ASSET_ROOT}/flower5-decoration.webp`} className="pointer-events-none absolute -right-[16%] top-[8%] z-20 w-[40%] max-w-[190px]" />
            <SectionHeading className="relative z-10 text-[18px]">{t("weddingSchedule")}</SectionHeading>
            <ol className="relative z-10 mx-auto mt-8 w-full max-w-[320px] md:max-w-[460px]">
              {schedule.map((item, index) => {
                const icon = scheduleIcons[index];
                return (
                  <li key={`${item.time}-${item.label}`} className="grid min-h-[50px] grid-cols-[52px_58px_20px_1fr] items-center gap-x-2">
                    <span className="flex h-12 w-12 items-center justify-center">
                      {icon ? <img aria-hidden="true" alt="" src={icon} className="h-12 w-12 object-contain" /> : null}
                    </span>
                    <span className="text-right text-[14px] tabular-nums">{item.time}</span>
                    <span className="relative flex h-full items-center justify-center">
                      {index > 0 ? <span className="absolute bottom-1/2 top-0 w-px bg-[#e5e4d0]/45" /> : null}
                      {index < schedule.length - 1 ? <span className="absolute bottom-0 top-1/2 w-px bg-[#e5e4d0]/45" /> : null}
                      <span className="relative z-10 h-3 w-3 rounded-full border-2 border-[#748172] bg-[#e5e4d0]" />
                    </span>
                    <span className="text-left text-[12px] font-semibold leading-5">{item.label}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}

        <section className="relative z-10 px-6 pb-10 pt-10 md:px-10 md:pt-14">
          <SectionHeading>{t("guestbook")}</SectionHeading>
          <RoyalV2WishForm />
          <div className="chungdoi-scroll mx-auto mt-12 max-h-[500px] space-y-3 overflow-y-auto pr-1 md:max-w-[600px]">
            {wishes.length > 0 ? wishes.map((wish, index) => (
              <article key={`${wish.name}-${index}`} className="rounded-[8px] border border-[#e5e4d0]/30 bg-[#08271b]/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[12px] font-bold">{wish.name}</span>
                  <time className="shrink-0 text-[9px] opacity-65">{formatWishTime(wish.time)}</time>
                </div>
                <p className="mt-3 whitespace-pre-line text-[12px] font-medium leading-6">{wish.text}</p>
              </article>
            )) : (
              <p className="text-center text-sm opacity-60">{t("noWishes")}</p>
            )}
          </div>
        </section>

        {banks.length > 0 ? (
          <section className="relative z-10 flex flex-col items-center overflow-hidden px-6 pb-12 pt-12 md:px-10">
            <img aria-hidden="true" alt="" src={`${ASSET_ROOT}/leaf-decoration.webp`} className="pointer-events-none absolute -left-[15%] top-[16%] z-[1] w-[34%] max-w-[150px] md:left-[4%]" />
            <SectionHeading className="relative z-10">{t("giftBox")}</SectionHeading>
            <button
              data-testid="gift-envelope"
              type="button"
              aria-label={t("giftOpen")}
              onClick={() => setGiftOpen(true)}
              className="relative z-10 mt-3 h-[256px] w-[200px] border-0 bg-transparent"
            >
              <TemplateGiftArtwork templateSlug={content.slug} />
            </button>
            <p className="relative z-10 -mt-5 text-[11px] font-semibold">{t("giftOpenHint")}</p>
          </section>
        ) : null}

        <footer data-template-footer className="relative z-10 flex min-h-[270px] flex-col items-center px-6 pt-14 text-center">
          <p className="max-w-[350px] text-[10px] leading-5 md:max-w-[560px] md:text-[14px]">{t("presenceHonor")}</p>
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="mt-8 text-[11px] opacity-55 transition-opacity hover:opacity-90">
            ♡ thiepmungonline.com
          </a>
          <img aria-hidden="true" alt="" src={`${ASSET_ROOT}/flower4-bottom.webp`} className="pointer-events-none absolute inset-x-0 bottom-0 z-[-1] w-full translate-y-[30%] md:translate-y-[45%]" />
        </footer>

        {giftOpen ? (
          <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onClick={() => setGiftOpen(false)}>
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto bg-[#08271b] p-6 shadow-2xl sm:rounded-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex justify-end">
                <button type="button" aria-label={t("close")} onClick={() => setGiftOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e4d0]/30 text-xl text-[#e5e4d0]">✕</button>
              </div>
              <GiftQrGrid
                banks={banks}
                heading={t("giftBox")}
                accent={IVORY}
                radiusClass="rounded-xl"
                saveQrLabel={t("saveQr")}
                copyNumberLabel={t("copyAccount")}
                numberCopiedLabel={t("accountCopied")}
              />
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
