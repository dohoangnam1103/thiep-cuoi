"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { invitationGiftAccounts, orderedCouple } from "@/lib/invitation-display";
import {
  AlbumGallery,
  buildCalendar,
  formatDate,
  formatWishTime,
  GiftEnvelope,
  googleCalendarUrl,
  hexToRgba,
  InvitationMap,
  SharedCountdown,
  SharedWishForm,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";

const THEME = "/chungdoi/images/themes/sunflower";
const GOLD = "#dc8203";
const OLIVE = "#71702a";
const PAPER = "#fefbf4";

function InvitationBrandLink() {
  const t = useTranslations("invitationTemplate");

  return (
    <Link href="/" className="opacity-70 transition-opacity hover:opacity-90">
      {t("brandDomain")}
    </Link>
  );
}

function SunflowerHeading({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <h2
      className={`text-center font-bold uppercase ${compact ? "text-[20px] leading-[30px]" : "text-[20px] leading-9 md:text-[24px]"}`}
      style={{ color: GOLD }}
    >
      {children}
    </h2>
  );
}

function Flower({
  name = "flower2",
  className,
}: {
  name?: "flower2" | "flower4" | "flower5";
  className: string;
}) {
  return <img aria-hidden alt="" src={`${THEME}/${name}.webp`} className={`pointer-events-none absolute z-0 h-auto max-w-none object-contain ${className}`} />;
}

function ParentColumn({ title, father, mother, address }: { title: string; father: string; mother: string; address: string }) {
  return (
    <div className="min-w-0 text-center text-[12px] leading-[21px] md:text-[16px] md:leading-[28px]">
      <p className="mb-[3px] opacity-70 md:text-[14px]">{title}</p>
      <p className="font-semibold" style={{ color: GOLD }}>{father}</p>
      <p className="font-semibold" style={{ color: GOLD }}>{mother}</p>
      <p className="mt-1 whitespace-pre-line text-[10px] leading-tight opacity-75 md:mt-2 md:text-[13px] md:leading-[19px]">{address}</p>
    </div>
  );
}

export function SunflowerInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const banquetTime = venue.banquetTime || couple.time;
  const welcomeTime = venue.welcomeTime || schedule[0]?.time || "";
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const dressColors = (content.dressCodeColors ?? "").split(",").map((color) => color.trim()).filter(Boolean);
  const banks = invitationGiftAccounts(content).map((account) => ({
    label: `${account.side === "groom" ? "Chú Rể" : "Cô Dâu"} - ${account.name}`,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <main
        data-testid="sunflower-template"
        className="relative isolate mx-auto w-full max-w-[480px] overflow-hidden md:max-w-[900px] md:border-x"
        style={{
          color: OLIVE,
          borderColor: hexToRgba(GOLD, 0.12),
          backgroundColor: PAPER,
          fontFamily: '"Times New Roman", serif',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: `url(${THEME}/paper.webp)`,
            backgroundRepeat: "repeat",
            backgroundSize: "900px 900px",
          }}
        />

        <section className="relative z-10 min-h-[690px] px-7 pb-20 pt-16 md:min-h-[820px] md:px-16 md:pt-24">
          <Flower name="flower4" className="left-[-18%] top-[14%] w-[88%] rotate-[-25deg] md:left-[-5%] md:top-[9%] md:w-[54%]" />
          <Flower className="right-[-28%] top-[4%] w-[70%] opacity-[0.07] md:right-[-20%] md:w-[58%]" />
          <div className="relative z-10 text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.34em] md:text-[15px]">The Wedding Of</p>
          </div>
          <div className="relative z-10 ml-auto mt-20 flex w-[56%] flex-col items-center text-center md:mt-28 md:w-[52%]">
            <p className="whitespace-nowrap text-[35px] italic uppercase leading-tight md:text-[44px]" style={{ color: GOLD }}>{people[0].shortName}</p>
            <p className="font-art-nautigal -my-1 text-[31px] md:text-[42px]">and</p>
            <p className="whitespace-nowrap text-[35px] italic uppercase leading-tight md:text-[44px]" style={{ color: GOLD }}>{people[1].shortName}</p>
          </div>
        </section>

        <section className="relative z-10 px-7 pb-8 md:px-10 md:pb-8">
          <Flower className="left-[-22%] top-[-10%] w-[72%] -scale-x-100 opacity-[0.07] md:w-[58%]" />
          <div className="relative z-10">
            <SunflowerHeading>Thông Tin Lễ Cưới</SunflowerHeading>
            <div className="mt-8 grid w-full grid-cols-[1fr_auto_1fr] gap-x-[14px]">
              <ParentColumn title={families.groomParentTitle || "Ông Bà"} father={families.groomFather} mother={families.groomMother} address={families.groomAddress} />
              <span className="h-[50px] w-px self-center opacity-40 md:h-[68px]" style={{ backgroundColor: OLIVE }} />
              <ParentColumn title={families.brideParentTitle || "Ông Bà"} father={families.brideFather} mother={families.brideMother} address={families.brideAddress} />
            </div>
          </div>
        </section>

        <section className="relative z-10 px-7 pb-10 text-center md:px-10 md:pb-10">
          <Flower className="right-[-27%] top-[6%] w-[58%] md:right-[-12%] md:w-[34%]" />
          <Flower className="bottom-[-12%] left-[-18%] w-[64%] opacity-[0.07] md:w-[50%]" />
          <div className="relative z-10">
            <p className="whitespace-pre-line text-[12px] uppercase leading-relaxed md:text-[14px]">
              {couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI"}
            </p>
            <div className="mt-8 flex flex-col items-center gap-[10px]">
              <h3 className="flex min-h-[80px] w-[80%] items-center justify-center whitespace-nowrap font-couple-garamond text-[35px] leading-[46px] md:text-[38px] md:leading-[54px]" style={{ color: GOLD }}>{people[0].fullName}</h3>
              <p className="text-[10px] uppercase tracking-[0.25em]">{people[0].birthOrder}</p>
              <p className="font-art-nautigal text-[35px] leading-none" style={{ color: GOLD }}>&amp;</p>
              <h3 className="flex min-h-[80px] w-[80%] items-center justify-center whitespace-nowrap font-couple-garamond text-[35px] leading-[46px] md:text-[38px] md:leading-[54px]" style={{ color: GOLD }}>{people[1].fullName}</h3>
              <p className="text-[10px] uppercase tracking-[0.25em]">{people[1].birthOrder}</p>
            </div>
            {ceremony ? (
              <div className="mt-8 flex flex-col items-center gap-[6px] text-[12px] uppercase tracking-[0.04em] md:text-[14px]">
                <p className="whitespace-pre-line leading-relaxed">{couple.ceremonyHeader}</p>
                <p>Vào lúc {couple.ceremonyTime}</p>
                <div className="flex items-center gap-[9px] md:gap-[15px]">
                  <span>{ceremony.weekday}</span>
                  <strong className="text-[52px] font-normal leading-none md:text-[57px]" style={{ color: GOLD }}>{ceremony.day}</strong>
                  <span className="border-l pl-3 text-left md:pl-[15px]" style={{ borderColor: hexToRgba(OLIVE, 0.4) }}>Tháng {ceremony.month}<br />{ceremony.yearNumber}</span>
                </div>
                <p className="text-[11px] tracking-[0.12em] md:text-sm">{ceremony.lunar}</p>
              </div>
            ) : null}
          </div>
        </section>

        {gallery.length > 0 ? (
          <section className="relative z-10 px-7 pb-8 pt-4 md:px-10 md:pb-8">
            <div className="relative z-10">
              <SunflowerHeading compact>Album Ảnh</SunflowerHeading>
              <div className="mx-auto mt-5 max-w-[560px]">
                <AlbumGallery photos={gallery} layout="grid" accent={GOLD} gridAspect="aspect-square" radiusClass="rounded-sm" />
              </div>
            </div>
          </section>
        ) : null}

        <section className="relative z-10 px-6 pb-16 text-center md:px-16 md:pb-14">
          <Flower name="flower5" className="left-[-31%] top-[15%] w-[68%] md:left-[-12%] md:top-[12%] md:w-[38%]" />
          <Flower className="right-[-28%] top-[-8%] w-[62%] opacity-[0.07] md:w-[50%]" />
          <div className="relative z-10">
            <SunflowerHeading>Thông Tin Tiệc Cưới</SunflowerHeading>
            <p className="mt-8 text-[12px] font-semibold uppercase md:text-[15px]">Tiệc cưới sẽ diễn ra vào lúc:</p>
            {reception ? (
              <div className="mt-5 flex items-center justify-center gap-4 md:gap-6">
                <span className="text-[12px] uppercase md:text-[15px]">{reception.weekday}<br />{banquetTime}</span>
                <strong className="text-[48px] font-normal leading-none md:text-[64px]" style={{ color: GOLD }}>{reception.day}</strong>
                <span className="border-l pl-4 text-left text-[12px] uppercase md:pl-6 md:text-[15px]" style={{ borderColor: hexToRgba(OLIVE, 0.4) }}>Tháng {reception.month}<br />{reception.yearNumber}</span>
              </div>
            ) : null}
            <p className="mt-3 text-[10px] uppercase md:text-[12px]">{reception?.lunar}</p>
            <div className="mt-7 flex justify-center gap-12 text-[11px] uppercase md:text-[13px]">
              <p>Đón khách<br /><strong className="mt-1 block text-lg" style={{ color: GOLD }}>{welcomeTime}</strong></p>
              <p>Khai tiệc<br /><strong className="mt-1 block text-lg" style={{ color: GOLD }}>{banquetTime}</strong></p>
            </div>
            <h3 className="mt-9 text-[15px] uppercase md:text-[18px]">Cùng đếm ngược</h3>
            <SharedCountdown target={`${couple.date}T${banquetTime || "18:00"}`} className="mt-3 text-sm font-semibold md:text-lg" style={{ color: OLIVE }} />
            {calendar ? (
              <div className="mx-auto mt-8 max-w-[360px] overflow-hidden rounded-lg border bg-white/25" style={{ borderColor: hexToRgba(GOLD, 0.24) }}>
                <div className="border-b py-3 text-sm italic" style={{ borderColor: hexToRgba(GOLD, 0.25), color: GOLD }}>Tháng {calendar.month} / {calendar.year}</div>
                <div className="grid grid-cols-7 border-b" style={{ borderColor: GOLD }}>
                  {WEEKDAY_LABELS.map((day) => <span key={day} className="py-2 text-[10px] opacity-70">{day}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-y-1 p-3">
                  {calendar.cells.map((day, index) => (
                    <span key={index} className="flex h-7 items-center justify-center text-[11px] md:h-8 md:text-[12px]">
                      {day === calendar.highlight ? <strong className="flex size-6 items-center justify-center rounded-full text-white" style={{ backgroundColor: GOLD }}>{day}</strong> : day}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <a href={googleCalendarUrl(content)} target="_blank" rel="noreferrer" className="mt-6 inline-block text-xs underline underline-offset-4">Thêm vào lịch</a>
            <div>
              <button
                type="button"
                onClick={() => document.querySelector<HTMLButtonElement>('[data-testid="public-rsvp-trigger"]')?.click()}
                className="mt-5 min-h-8 rounded-full px-7 text-xs font-semibold uppercase text-white transition hover:brightness-95"
                style={{ backgroundColor: GOLD }}
              >
                Xác nhận tham dự
              </button>
            </div>
          </div>
        </section>

        <section className="relative z-10 px-6 pb-20 text-center md:px-16 md:pb-20">
          <Flower className="right-[-30%] top-[5%] w-[65%] opacity-[0.07] md:w-[52%]" />
          <div className="relative z-10">
            <SunflowerHeading compact>Tiệc Cưới Sẽ Tổ Chức Tại</SunflowerHeading>
            <p className="mx-auto mt-5 max-w-[560px] whitespace-pre-line text-sm leading-relaxed md:text-base">{venue.address}</p>
            {mapQuery ? <InvitationMap query={mapQuery} title={mapQuery} className="mx-auto mt-7 h-[260px] w-full max-w-[560px] overflow-hidden rounded-xl md:h-[360px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /> : null}
          </div>
        </section>

        {dressColors.length > 0 ? (
          <section className="relative z-10 px-6 pb-12 text-center md:pb-12">
            <SunflowerHeading compact>Dress Code</SunflowerHeading>
            <p className="mt-3 text-sm">Trang phục dự tiệc</p>
            <div className="mt-6 flex justify-center gap-5">
              {dressColors.map((color) => <span key={color} className="size-12 rounded-full border shadow-sm md:size-14" style={{ backgroundColor: color, borderColor: hexToRgba(OLIVE, 0.13) }} />)}
            </div>
          </section>
        ) : null}

        {schedule.length > 0 ? (
          <section className="relative z-10 px-5 pb-12 md:px-16 md:pb-12">
            <Flower name="flower5" className="right-[-23%] top-[8%] w-[58%] md:right-[-10%] md:w-[38%]" />
            <div className="relative z-10">
              <SunflowerHeading>Lịch Trình Ngày Cưới</SunflowerHeading>
              <ol className="relative mx-auto mt-10 grid max-w-[430px] grid-cols-[1fr_14px_1fr] gap-x-5 gap-y-8">
                {schedule.map((item, index) => (
                  <li key={`${item.time}-${item.label}`} className="contents">
                    <span className="relative text-right text-sm tabular-nums md:text-base">
                      {index > 0 && index < 4 ? <img aria-hidden alt="" src={`${THEME}/${index === 1 ? "ring" : index === 2 ? "map" : "medallion-flower"}.webp`} className="absolute right-full top-1/2 mr-6 size-8 -translate-y-1/2 object-contain md:size-9" /> : null}
                      {item.time}
                    </span>
                    <span className="relative flex justify-center"><i className="absolute inset-y-[-18px] w-px" style={{ backgroundColor: hexToRgba(OLIVE, 0.45) }} /><i className="relative mt-1.5 size-2 rounded-full" style={{ backgroundColor: OLIVE }} /></span>
                    <span className="text-sm md:text-base">{item.label}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ) : null}

        <section className="relative z-10 px-6 pb-16 md:px-16 md:pb-16">
          <div className="relative z-10">
            <SunflowerHeading compact>Sổ Lưu Bút</SunflowerHeading>
            <SharedWishForm accent={GOLD} />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll mx-auto mt-8 max-h-[500px] max-w-[600px] space-y-3 overflow-y-auto pr-2">
                {wishes.map((wish) => (
                  <article key={`${wish.name}-${wish.time}`} className="rounded-md border bg-white/45 p-4 text-sm" style={{ borderColor: hexToRgba(GOLD, 0.18) }}>
                    <div className="flex items-start justify-between gap-4"><strong style={{ color: GOLD }}>{wish.name}</strong><span className="text-[10px] opacity-60">{formatWishTime(wish.time)}</span></div>
                    <p className="mt-2 leading-relaxed">{wish.text}</p>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {banks.length > 0 ? (
          <section className="relative z-10 px-6 pb-16 pt-8 md:px-16 md:pb-16">
            <Flower className="bottom-[-20%] right-[-25%] w-[65%] opacity-[0.07] md:w-[52%]" />
            <div className="relative z-10">
              <GiftEnvelope templateSlug={content.slug} banks={banks} accent={GOLD} dark={OLIVE} cardBg={PAPER} heading="Hộp Quà Mừng" labelColor={OLIVE} />
            </div>
          </section>
        ) : null}

        <footer className="relative z-10 px-6 pb-8 text-center text-xs">
          <p>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</p>
          <div className="mt-5">
            <InvitationBrandLink />
          </div>
        </footer>
      </main>
    </div>
  );
}
