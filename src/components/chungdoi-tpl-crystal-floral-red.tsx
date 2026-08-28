"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import {
  AlbumGallery,
  buildCalendar,
  DressCode,
  FamilyColumn,
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
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { invitationGiftAccounts, orderedCouple } from "@/lib/invitation-display";

const ASSET_ROOT = "/chungdoi/images/themes/crystal-floral-red";
const RED = "#9c1f2c";
const DEEP_RED = "#560207";
const PAPER = "#fbf8f3";

const WATERMARK_ROWS = [
  "top-[7%]",
  "top-[23%]",
  "top-[39%]",
  "top-[55%]",
  "top-[71%]",
  "top-[87%]",
] as const;

function CrystalHeading({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`text-center font-serif text-[20px] font-bold uppercase tracking-[0.02em] text-[#9c1f2c] md:text-[24px] ${className}`}
    >
      {children}
    </h2>
  );
}

function FloralWatermarks() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {WATERMARK_ROWS.map((top, index) => (
        <div key={top} className={`absolute inset-x-0 h-[760px] ${top}`}>
          <img
            src={`${ASSET_ROOT}/${index % 2 === 0 ? "flower3" : "flower2"}.webp`}
            alt=""
            className="absolute -left-[18%] top-0 h-auto w-[54%] max-w-none rotate-[18deg] object-contain opacity-[0.07]"
          />
          <img
            src={`${ASSET_ROOT}/${index % 2 === 0 ? "flower2" : "flower3"}.webp`}
            alt=""
            className="absolute -right-[18%] top-[32%] h-auto w-[54%] max-w-none -rotate-[18deg] scale-x-[-1] object-contain opacity-[0.07]"
          />
        </div>
      ))}
    </div>
  );
}

/** Faithful rebuild of Chungdoi's Hoa Thủy Tinh Đỏ opened invitation. */
export function CrystalFloralRedInvitation({
  content,
}: {
  content: ChungDoiDemoContent;
}) {
  const t = useTranslations("invitationTemplate");
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const banquetTime = venue.banquetTime || couple.time;
  const welcomeTime = venue.welcomeTime || schedule[0]?.time || couple.time;
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();

  const banks = invitationGiftAccounts(content).map((account) => ({
    label: `${account.birthOrder} - ${account.name}`,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));
  const dressColors = (content.dressCodeColors ?? "")
    .split(",")
    .map((color) => color.trim())
    .filter((color) => /^#[0-9a-fA-F]{6}$/.test(color))
    .map((color, index) => ({
      color,
      border: index === 2 ? "#dec9ad" : undefined,
    }));

  const groomFamily = (
    <FamilyColumn
      sideBySideOnMobile
      title={families.groomParentTitle || t("parents")}
      a={families.groomFather}
      b={families.groomMother}
      addr={families.groomAddress}
    />
  );
  const brideFamily = (
    <FamilyColumn
      sideBySideOnMobile
      title={families.brideParentTitle || t("parents")}
      a={families.brideFather}
      b={families.brideMother}
      addr={families.brideAddress}
    />
  );

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <main
        data-invitation-column="true"
        className="font-art-lora relative isolate mx-auto w-full max-w-[480px] overflow-hidden border-[#9c1f2c]/15 bg-[#fbf8f3] text-[#560207] md:max-w-[900px] md:border"
      >
        <FloralWatermarks />

        <div className="pointer-events-none absolute -top-5 left-1/2 z-[1] w-[90%] -translate-x-1/2 overflow-hidden md:-top-10" aria-hidden>
          <img
            src={`${ASSET_ROOT}/flower1.webp`}
            alt=""
            className="h-auto w-full scale-x-[-1] object-contain"
          />
        </div>

        <section className="relative z-10 mt-[30px] w-full md:mt-[105px]">
          <header className="flex w-full flex-col items-center px-4 pb-6 pt-[72px] md:pb-10 md:pt-[100px]">
            <div className="relative w-[90%] max-w-[340px] md:max-w-[520px] lg:max-w-[580px]">
              <img
                src={`${ASSET_ROOT}/flower-frame.webp`}
                alt=""
                aria-hidden
                className="relative z-10 block h-auto w-full object-contain"
              />
              <div className="font-couple-viaoda absolute inset-0 z-20 flex flex-col items-center justify-center text-center uppercase leading-none text-[#9c1f2c]">
                <span className="flex w-[50%] justify-center whitespace-nowrap text-[clamp(24px,5vw,42px)] leading-[1.25]">
                  {people[0].shortName}
                </span>
                <span className="font-art-alex my-4 text-[clamp(23px,4vw,34px)] normal-case leading-none md:my-8 lg:my-10">
                  &amp;
                </span>
                <span className="flex w-[50%] justify-center whitespace-nowrap text-[clamp(24px,5vw,42px)] leading-[1.25]">
                  {people[1].shortName}
                </span>
              </div>
            </div>
          </header>
        </section>

        <section className="relative z-10 px-3 pb-10 pt-2 md:px-6 md:pb-16 md:pt-6">
          <div className="flex flex-col gap-8 md:gap-12">
            <CrystalHeading>{t("ceremonyInformation")}</CrystalHeading>

            <div className="grid w-full grid-cols-[1fr_auto_1fr] grid-rows-[repeat(4,auto)] items-start gap-x-3 gap-y-1 text-center text-[#9c1f2c] md:gap-x-8">
              {couple.brideFirst ? brideFamily : groomFamily}
              <span className="row-span-4 h-16 w-px self-center bg-[#9c1f2c]/40 md:h-20" aria-hidden />
              {couple.brideFirst ? groomFamily : brideFamily}
            </div>

            <p className="mx-auto max-w-[560px] whitespace-pre-line text-center text-[14px] uppercase leading-relaxed tracking-[0.04em] text-[#9c1f2c] md:text-[18px]">
              {couple.openingMessage}
            </p>

            <div className="relative flex flex-col items-center gap-3 text-center md:gap-4">
              <img
                src={`${ASSET_ROOT}/flower2.webp`}
                alt=""
                aria-hidden
                className="pointer-events-none absolute -right-[18%] top-1/2 -z-10 h-[260px] w-auto max-w-none -translate-y-1/2 -rotate-[20deg] object-contain md:h-[430px]"
              />
              <h3 className="font-couple-garamond flex min-h-20 w-[88%] items-center justify-center text-[clamp(38px,8vw,72px)] leading-[1.05] text-[#9c1f2c]">
                {people[0].fullName}
              </h3>
              <p className="uppercase tracking-[0.18em] text-[#560207]/75">{people[0].birthOrder}</p>
              <span className="font-art-alex text-[34px] text-[#9c1f2c] md:text-[44px]">&amp;</span>
              <h3 className="font-couple-garamond flex min-h-20 w-[88%] items-center justify-center text-[clamp(38px,8vw,72px)] leading-[1.05] text-[#9c1f2c]">
                {people[1].fullName}
              </h3>
              <p className="uppercase tracking-[0.18em] text-[#560207]/75">{people[1].birthOrder}</p>
            </div>

            {ceremony ? (
              <div className="relative flex flex-col items-center gap-3 text-center">
                <img
                  src={`${ASSET_ROOT}/flower3.webp`}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute -left-[18%] top-1/2 -z-10 h-[260px] w-auto max-w-none -translate-y-1/2 rotate-[20deg] object-contain md:h-[430px]"
                />
                <p className="whitespace-pre-line text-[16px] uppercase leading-relaxed md:text-[18px]">
                  {couple.ceremonyHeader}
                </p>
                <p className="text-[16px] uppercase">{t("atTime", { time: couple.ceremonyTime })}</p>
                <div className="mt-1 flex items-center justify-center gap-5 text-[#9c1f2c] md:gap-7">
                  <span className="text-[12px] uppercase md:text-[16px]">{ceremony.weekday}</span>
                  <span className="text-xl text-[#560207]/35">|</span>
                  <span className="text-[34px] md:text-[44px]">{ceremony.day}</span>
                  <span className="text-xl text-[#560207]/35">|</span>
                  <span className="text-[12px] uppercase md:text-[16px]">{t("month", { month: ceremony.month })}</span>
                </div>
                <p className="text-[20px] md:text-[26px]">{ceremony.yearNumber}</p>
                <p className="text-xs uppercase tracking-[0.12em] md:text-sm">{ceremony.lunar}</p>
              </div>
            ) : null}

            <img
              src={`${ASSET_ROOT}/filigree.webp`}
              alt=""
              aria-hidden
              className="mx-auto h-auto w-[250px] object-contain md:w-[360px]"
            />

            {gallery.length > 0 ? (
              <section className="flex flex-col items-center pt-2">
                <CrystalHeading className="mb-6">{t("photoAlbum")}</CrystalHeading>
                <div className="w-full max-w-[600px]">
                  <AlbumGallery
                    photos={gallery}
                    layout={content.albumLayout ?? "coverflow"}
                    accent={RED}
                    radiusClass="rounded-2xl"
                  />
                </div>
              </section>
            ) : null}

            <img
              src={`${ASSET_ROOT}/filigree.webp`}
              alt=""
              aria-hidden
              className="mx-auto h-auto w-[250px] object-contain md:w-[360px]"
            />

            <section className="relative flex flex-col items-center gap-3 text-center">
              <img
                src={`${ASSET_ROOT}/flower3.webp`}
                alt=""
                aria-hidden
                className="pointer-events-none absolute -right-[18%] top-[20%] -z-10 h-[260px] w-auto max-w-none -rotate-[20deg] object-contain md:h-[430px]"
              />
              <CrystalHeading>{t("receptionAnnouncement")}</CrystalHeading>
              <h3 className="mt-1 text-[16px] font-bold uppercase text-[#9c1f2c] md:text-[18px]">
                {t("receptionStartsAtAnnouncement")}
              </h3>
              <p className="text-[24px] text-[#560207] md:text-[32px]">{banquetTime}</p>
              {reception ? (
                <>
                  <div className="mt-1 flex items-center justify-center gap-5 text-[#9c1f2c] md:gap-7">
                    <span className="text-[12px] uppercase md:text-[16px]">{reception.weekday}</span>
                    <span className="text-xl text-[#560207]/35">|</span>
                    <span className="text-[34px] md:text-[44px]">{reception.day}</span>
                    <span className="text-xl text-[#560207]/35">|</span>
                    <span className="text-[12px] uppercase md:text-[16px]">{t("month", { month: reception.month })}</span>
                  </div>
                  <p className="text-[20px] md:text-[26px]">{reception.yearNumber}</p>
                  <p className="text-xs uppercase tracking-[0.12em] md:text-sm">{reception.lunar}</p>
                </>
              ) : null}

              <div className="mt-5 grid grid-cols-2 gap-10 text-center md:gap-16">
                <div>
                  <p className="text-xs uppercase">{t("guestArrival")}</p>
                  <p className="mt-1 text-lg text-[#9c1f2c]">{welcomeTime}</p>
                </div>
                <div>
                  <p className="text-xs uppercase">{t("banquetOpening")}</p>
                  <p className="mt-1 text-lg text-[#9c1f2c]">{banquetTime}</p>
                </div>
              </div>

              <h3 className="mt-7 text-[16px] font-bold uppercase text-[#9c1f2c] md:text-[18px]">
                {t("countdown")}
              </h3>
              <SharedCountdown
                target={`${couple.date}T${banquetTime}`}
                className="text-center text-sm text-[#560207] md:text-base"
                labels={{
                  days: t("days"),
                  hours: t("hours"),
                  minutes: t("minutes"),
                  seconds: t("seconds"),
                }}
              />

              {calendar ? (
                <div className="relative mx-auto mt-8 aspect-[388/332] w-full max-w-[340px] md:max-w-[420px]">
                  <img
                    src={`${ASSET_ROOT}/calendar-frame.webp`}
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-10 h-full w-full object-fill"
                  />
                  <div className="relative z-20 flex h-full w-full flex-col items-center justify-center px-9 py-7">
                    <p className="text-[12px] font-semibold text-[#9c1f2c] md:text-[14px]">
                      {t("monthYear", { month: calendar.month, year: calendar.year })}
                    </p>
                    <div className="mt-3 grid w-full grid-cols-7 border-b border-[#9c1f2c] pb-1 text-[10px] text-[#9c1f2c]/70 md:text-[11px]">
                      {WEEKDAY_LABELS.map((day) => (
                        <span key={day} className="text-center">{day}</span>
                      ))}
                    </div>
                    <div className="mt-2 grid w-full grid-cols-7 gap-y-1 text-[11px] md:text-[12px]">
                      {calendar.cells.map((day, index) => (
                        <span
                          key={`${day ?? "blank"}-${index}`}
                          className={`flex aspect-square items-center justify-center rounded-full ${day === calendar.highlight ? "bg-[#9c1f2c] font-bold text-[#fbf8f3]" : ""}`}
                        >
                          {day ?? ""}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              <a
                href={googleCalendarUrl(content)}
                target="_blank"
                rel="noreferrer"
                className="mt-4 text-sm font-semibold text-[#560207] underline decoration-[#9c1f2c]/50 underline-offset-4"
              >
                {t("addToCalendar")}
              </a>
            </section>
          </div>
        </section>

        {mapQuery ? (
          <section className="relative z-10 px-5 py-14 text-center md:px-10 md:py-20">
            <img
              src={`${ASSET_ROOT}/flower2.webp`}
              alt=""
              aria-hidden
              className="pointer-events-none absolute -left-[18%] top-[8%] -z-10 h-[260px] w-auto max-w-none rotate-[20deg] object-contain md:h-[430px]"
            />
            <CrystalHeading>{t("receptionVenueAnnouncement")}</CrystalHeading>
            <p className="mx-auto mt-5 max-w-[560px] whitespace-pre-line text-sm leading-6 md:text-base">
              {venue.address}
            </p>
            <div className="mx-auto mt-6 w-full max-w-[760px] overflow-hidden rounded-2xl border border-[#9c1f2c]/20 bg-white/30">
              <InvitationMap
                query={mapQuery}
                title={mapQuery}
                className="h-[360px] w-full md:h-[520px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <MapDirectionsButton
              query={mapQuery}
              className="mt-5 inline-flex rounded-full border border-[#9c1f2c]/45 px-5 py-2 text-sm font-semibold text-[#9c1f2c]"
            />
          </section>
        ) : null}

        {dressColors.length > 0 ? (
          <section className="relative z-10 px-6 py-14 md:px-10 md:py-20">
            <DressCode
              colors={dressColors}
              heading={<CrystalHeading>{t("dressCodeHeading")}</CrystalHeading>}
              subLabel={t("partyAttire")}
              subColor={DEEP_RED}
            />
          </section>
        ) : null}

        {schedule.length > 0 ? (
          <section className="relative z-10 overflow-hidden px-5 py-12 md:px-10 md:py-16">
            <img
              src={`${ASSET_ROOT}/flower4.webp`}
              alt=""
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-0 h-full w-auto max-w-none -translate-x-1/2 object-contain opacity-40"
            />
            <img
              src={`${ASSET_ROOT}/flower4.webp`}
              alt=""
              aria-hidden
              className="pointer-events-none absolute bottom-0 right-0 h-full w-auto max-w-none translate-x-1/2 scale-x-[-1] object-contain opacity-40"
            />
            <CrystalHeading>{t("receptionSchedule")}</CrystalHeading>
            <ol className="relative z-10 mx-auto mt-9 flex w-full max-w-md flex-col">
              {schedule.map((item, index) => (
                <li
                  key={`${item.time}-${item.label}`}
                  className="grid min-h-[62px] grid-cols-[72px_14px_1fr] items-start gap-4 text-sm md:grid-cols-[90px_14px_1fr] md:text-base"
                >
                  <span className="pt-0.5 text-right tabular-nums text-[#9c1f2c]">{item.time}</span>
                  <span className="relative flex h-full justify-center">
                    <span className="relative z-10 mt-1.5 size-2.5 rounded-full bg-[#9c1f2c] shadow-[0_0_0_3px_rgba(156,31,44,0.10)]" />
                    {index < schedule.length - 1 ? (
                      <span className="absolute bottom-0 top-3 w-px bg-[#9c1f2c]/45" />
                    ) : null}
                  </span>
                  <span className="leading-6 text-[#560207]">{item.label}</span>
                </li>
              ))}
            </ol>
            <div className="pointer-events-none absolute inset-y-16 left-[7%] hidden w-16 md:block" aria-hidden>
              <img src={`${ASSET_ROOT}/ring.webp`} alt="" className="absolute top-[18%] h-12 w-auto opacity-80" />
              <img src={`${ASSET_ROOT}/map.webp`} alt="" className="absolute top-[46%] h-14 w-auto opacity-80" />
              <img src={`${ASSET_ROOT}/flowericon.webp`} alt="" className="absolute top-[73%] h-16 w-auto opacity-80" />
            </div>
          </section>
        ) : null}

        <section className="relative z-10 px-5 py-12 md:px-10 md:py-16">
          <CrystalHeading>{t("guestbook")}</CrystalHeading>
          <SharedWishForm accent={RED} />
          {wishes.length > 0 ? (
            <div className="chungdoi-scroll mx-auto mt-8 max-h-[500px] w-full max-w-[600px] space-y-3 overflow-y-auto pr-2">
              {wishes.map((wish) => (
                <article
                  key={`${wish.name}-${wish.time}`}
                  className="rounded-xl border border-[#9c1f2c]/20 bg-[#fbf8f3]/70 p-4 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-[#9c1f2c]">{wish.name}</strong>
                    <time className="shrink-0 text-[11px] text-[#560207]/60">{formatWishTime(wish.time)}</time>
                  </div>
                  <p className="mt-2 leading-relaxed">{wish.text}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        {banks.length > 0 ? (
          <section className="relative z-10 px-5 py-12 text-center md:px-10 md:py-16">
            <GiftEnvelope
              templateSlug={content.slug}
              banks={banks}
              accent={RED}
              dark={DEEP_RED}
              cardBg={PAPER}
              heading={t("giftBox")}
              openLabel={t("giftOpenHint")}
              labelColor={DEEP_RED}
            />
          </section>
        ) : null}

        <footer data-template-footer className="relative z-10 flex flex-col items-center px-6 pb-4 pt-8 text-center">
          <p className="text-sm text-[#9c1f2c] md:text-base">{t("presenceHonor")}</p>
          <a
            href="https://thiepmungonline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 text-xs text-[#560207]/45 transition-opacity hover:opacity-70"
          >
            ♡ thiepmungonline.com
          </a>
        </footer>

        <div className="relative z-10 h-[130px] w-full overflow-visible md:h-[210px]" aria-hidden>
          <img
            src={`${ASSET_ROOT}/flower5.webp`}
            alt=""
            className="absolute left-1/2 top-0 h-auto w-[125%] max-w-none -translate-x-1/2 object-contain"
          />
        </div>
      </main>
    </div>
  );
}
