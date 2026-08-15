"use client";

import type React from "react";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { orderedCouple, orderByBrideFirst } from "@/lib/invitation-display";
import {
  AlbumGallery,
  FamilyColumn,
  MapDirectionsButton,
  SharedWishForm,
  WEEKDAY_LABELS,
  buildCalendar,
  GiftEnvelope,
  formatDate,
  formatWishTime,
  googleCalendarUrl,
  hexToRgba,
  InvitationMap,
} from "@/components/chungdoi-tpl-shared";

const BFR_BASE = "/chungdoi/images/themes/_decor/brocade-flower-red";
const BFR_RED = "#a83232";
const BFR_GOLD = "#c9a227";
const BFR_DARK = "#6a2104";
const BFR_CREAM = "#f8ecdb";
const BFR_DARK_MUTED = "rgba(106, 33, 4, 0.72)";

function BrocadeHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: BFR_RED }}>
      {children}
    </h2>
  );
}

/** Faithful rebuild of the Brocade Flower Red (gấm hoa đỏ) opened invitation. */
export function BrocadeFlowerRedInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes, bank } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const nameFont = { fontFamily: '"DFVN New Eddy", "Fz Qellia", cursive' };
  const ampFont = { fontFamily: '"Alex Brush", "The Nautigal", cursive' };

  const groomCol = <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  const banks = orderByBrideFirst(
    { label: `${couple.brideBirthOrder || "Út Nữ"} - ${bank.brideAccountName}`, bank: bank.brideBankName, num: bank.brideAccountNumber, name: bank.brideAccountName },
    { label: `${couple.groomBirthOrder || "Trưởng Nam"} - ${bank.groomAccountName}`, bank: bank.groomBankName, num: bank.groomAccountNumber, name: bank.groomAccountName },
    couple.brideFirst,
  ).filter((q) => q.bank);

  return (
    <div className="flex w-full justify-center overflow-x-clip" style={{ backgroundColor: BFR_CREAM }}>
      <div
        className="relative w-full max-w-[480px] overflow-hidden md:mx-auto md:max-w-[900px] md:border"
        style={{ color: BFR_DARK, borderColor: hexToRgba(BFR_DARK, 0.4), backgroundColor: BFR_CREAM }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 bg-[url('/chungdoi/images/themes/brocade-flower-red/tile-background.webp')] bg-[length:140%] bg-top opacity-[0.12]" />

        {/* HEADER — source-specific brocade arch */}
        <section className="relative isolate z-20 w-full overflow-visible">
          <div className="relative mx-auto w-full pt-[18%]">
            <img src={`${BFR_BASE}/flower-corner.webp`} alt="" aria-hidden className="pointer-events-none absolute -left-[2%] -top-[2%] z-20 h-auto w-[48%] max-w-none object-contain" />
            <img src={`${BFR_BASE}/flower-corner.webp`} alt="" aria-hidden className="pointer-events-none absolute -right-[2%] -top-[2%] z-20 h-auto w-[48%] max-w-none scale-x-[-1] object-contain" />
            <div className="relative">
              <img src={`${BFR_BASE}/main-pattern.webp`} alt="" aria-hidden className="pointer-events-none relative z-0 block h-auto w-full max-w-none select-none" />
              <div className="absolute inset-0 z-10">
                <img src={`${BFR_BASE}/seal.webp`} alt="" aria-hidden className="absolute left-1/2 top-[19%] h-auto w-[24%] max-w-[106px] -translate-x-1/2 object-contain md:max-w-[200px]" />
                <p className="absolute left-1/2 top-[43%] w-[72%] -translate-x-1/2 -translate-y-1/2 whitespace-pre-line text-center text-[clamp(7px,1.9vw,15px)] uppercase tracking-[0.12em]" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif', color: BFR_DARK }}>The wedding of</p>
                <div className="absolute left-1/2 top-[52%] flex w-[55%] -translate-x-1/2 -translate-y-1/2 justify-center">
                  <span className="whitespace-nowrap text-[clamp(24px,5vw,36px)] uppercase leading-[1.1]" style={{ fontFamily: '"Fz Aghita", "Times New Roman", serif', color: BFR_DARK }}>{people[0].shortName}</span>
                </div>
                <span className="absolute left-1/2 top-[61%] -translate-x-1/2 -translate-y-1/2 text-[clamp(20px,6.5vw,50px)] leading-none" style={{ ...ampFont, color: BFR_DARK }}>&amp;</span>
                <div className="absolute left-1/2 top-[69%] flex w-[55%] -translate-x-1/2 -translate-y-1/2 justify-center">
                  <span className="whitespace-nowrap text-[clamp(24px,5vw,36px)] uppercase leading-[1.1]" style={{ fontFamily: '"Fz Aghita", "Times New Roman", serif', color: BFR_DARK }}>{people[1].shortName}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="relative z-10 flex w-full flex-col items-center gap-14 px-4 pb-14 md:px-10">
          {/* CEREMONY INFO */}
          <section className="flex w-full flex-col items-center gap-8">
            <BrocadeHeading>Thông Tin Lễ Cưới</BrocadeHeading>
            <div className="flex w-full flex-col items-center gap-6 md:flex-row md:items-start md:justify-center md:gap-10">
              {couple.brideFirst ? (<>{brideCol}{groomCol}</>) : (<>{groomCol}{brideCol}</>)}
            </div>
            <div className="whitespace-pre-line text-center text-[16px] uppercase leading-relaxed tracking-wide md:text-[20px]">
              {couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI."}
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="flex min-h-[80px] w-[80%] items-center justify-center text-[44px] leading-[1.1] md:text-[60px]" style={{ ...nameFont, color: BFR_RED }}>{people[0].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: BFR_DARK_MUTED }}>{people[0].birthOrder}</div>
              <div className="text-[24px] md:text-[32px]" style={{ ...ampFont, color: BFR_GOLD }}>&amp;</div>
              <h3 className="flex min-h-[80px] w-[80%] items-center justify-center text-[44px] leading-[1.1] md:text-[60px]" style={{ ...nameFont, color: BFR_RED }}>{people[1].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: BFR_DARK_MUTED }}>{people[1].birthOrder}</div>
            </div>
            {ceremony ? (
              <div className="flex flex-col items-center gap-1 text-center">
                {couple.ceremonyHeader ? <span className="whitespace-pre-line text-[16px] uppercase leading-relaxed md:text-[20px]">{couple.ceremonyHeader}</span> : null}
                {couple.ceremonyTime ? <div className="text-[20px] md:text-[30px]">{couple.ceremonyTime}</div> : null}
                <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                  <span>{ceremony.weekday}</span><span>|</span><span className="text-[28px] font-bold" style={{ color: BFR_RED }}>{ceremony.day}</span><span>|</span><span>Tháng {ceremony.month}</span>
                </div>
                <div className="text-[18px] md:text-[24px]">{ceremony.yearNumber}</div>
                <div className="text-xs uppercase tracking-[0.25em] md:text-sm" style={{ color: BFR_DARK_MUTED }}>{ceremony.lunar}</div>
              </div>
            ) : null}
            <div className="relative flex justify-center">
              <img src={`${BFR_BASE}/dai-hoa.webp`} alt="" aria-hidden className="h-auto w-[360px] object-contain md:w-[640px]" />
            </div>
          </section>

          {/* ALBUM */}
          {gallery.length > 0 ? (
            <section className="flex w-full flex-col items-center gap-6">
              <BrocadeHeading>Album Ảnh Cưới</BrocadeHeading>
              <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={BFR_RED} />
            </section>
          ) : null}

          {/* RECEPTION INFO + calendar */}
          <section className="relative flex w-full flex-col items-center gap-3">
            <img src={`${BFR_BASE}/hoa-trang.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-24 right-0 -z-10 h-[520px] w-auto max-w-none object-contain opacity-[0.14] md:-top-40 md:right-[18%] md:h-[720px]" />
            <BrocadeHeading>Thông Tin Tiệc Cưới</BrocadeHeading>
            <p className="mt-2 text-center text-[16px] uppercase md:text-[20px]">Tiệc cưới sẽ diễn ra vào lúc:</p>
            <div className="text-[20px] font-semibold md:text-[30px]" style={{ color: BFR_RED }}>{venue.banquetTime || couple.time}</div>
            {reception ? (
              <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                <span>{reception.weekday}</span><span>/</span><span>{reception.day}</span><span>/</span><span>Tháng {reception.month}</span>
              </div>
            ) : null}
            {reception ? <div className="text-[18px] md:text-[24px]">{reception.yearNumber}</div> : null}
            {reception ? <div className="text-[10px] uppercase tracking-[0.15em] md:text-base md:tracking-[0.25em]" style={{ color: BFR_DARK_MUTED }}>{reception.lunar}</div> : null}

            {/* calendar framed by calendar-floral */}
            {calendar ? (
              <div className="relative mx-auto mt-8 aspect-[388/332] w-full max-w-[340px] md:mt-10 md:max-w-[420px]">
                <img src={`${BFR_BASE}/calendar-floral.webp`} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
                <div className="relative flex h-full w-full flex-col items-center justify-center px-8 py-6">
                  <p className="text-[12px] font-semibold uppercase tracking-wide md:text-[13px]" style={{ color: BFR_RED }}>Tháng {calendar.month} / {calendar.year}</p>
                  <div className="mt-2 grid w-full grid-cols-7 text-[10px] font-medium opacity-70 md:text-[11px]">
                    {WEEKDAY_LABELS.map((d) => (<span key={d} className="py-0.5 text-center">{d}</span>))}
                  </div>
                  <div className="grid w-full grid-cols-7 gap-y-0.5 text-[11px] md:text-[12px]">
                    {calendar.cells.map((day, i) => (
                      <span key={i} className={`flex aspect-square items-center justify-center rounded-full ${day === calendar.highlight ? "font-bold text-white" : ""}`} style={day === calendar.highlight ? { backgroundColor: BFR_RED } : undefined}>{day ?? ""}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <a href={googleCalendarUrl(content)} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center rounded-full border px-6 py-2 text-sm font-semibold transition" style={{ borderColor: BFR_RED, color: BFR_RED }}>Thêm vào lịch</a>

            <div className="relative flex justify-center pt-6 md:pt-8">
              <img src={`${BFR_BASE}/hoa-kim-cuong.webp`} alt="" aria-hidden className="h-auto w-[420px] object-contain md:w-[700px]" />
            </div>
          </section>

          {/* VENUE MAP */}
          {mapQuery ? (
            <section className="flex w-full flex-col items-center gap-3 text-center">
              <h3 className="text-[20px] font-bold uppercase md:text-[24px]" style={{ color: BFR_RED }}>Tiệc cưới sẽ tổ chức tại</h3>
              <p className="mx-auto mt-1 max-w-sm whitespace-pre-line text-sm leading-6 md:max-w-[500px]">{venue.address}</p>
              <div className="mt-4 w-full overflow-hidden rounded-2xl border" style={{ borderColor: hexToRgba(BFR_RED, 0.4) }}>
                <InvitationMap query={mapQuery} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <MapDirectionsButton query={mapQuery} style={{ color: BFR_RED }} />
            </section>
          ) : null}

          {/* SCHEDULE — with pillar decor */}
          {schedule.length > 0 ? (
            <section className="relative flex w-full flex-col items-center gap-6">
              <div className="pointer-events-none absolute top-[90px] bottom-[20px] left-8 -z-10 flex flex-col items-center justify-between opacity-90 md:left-14">
                <img src={`${BFR_BASE}/la-xanh.webp`} alt="" aria-hidden className="h-[60px] w-auto object-contain md:h-[80px]" />
                <img src={`${BFR_BASE}/tru.webp`} alt="" aria-hidden className="h-[140px] w-auto object-contain md:h-[190px]" />
              </div>
              <BrocadeHeading>Lịch Trình Ngày Cưới</BrocadeHeading>
              <ol className="mx-auto flex w-full max-w-sm flex-col gap-4">
                {schedule.map((s, i) => (
                  <li key={`${s.time}-${i}`} className="flex items-baseline gap-4">
                    <span className="w-[64px] shrink-0 pt-0.5 text-right text-[16px] tabular-nums tracking-wide md:text-[17px]" style={{ color: BFR_RED }}>{s.time}</span>
                    <span className="text-[16px] font-medium leading-tight md:text-[18px]">{s.label}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* WISHES — with faint flower */}
          <section className="relative w-full">
            <img src={`${BFR_BASE}/flower-corner.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-24 left-0 -z-10 h-[420px] w-auto max-w-none object-contain opacity-[0.14] md:-top-32 md:left-40 md:h-[560px]" />
            <div className="text-center"><BrocadeHeading>Sổ Lưu Bút</BrocadeHeading></div>
            <SharedWishForm accent={BFR_RED} />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                {wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-xs" style={{ borderColor: hexToRgba(BFR_RED, 0.25), backgroundColor: "#ffffff" }}>
                    <div className="flex items-start justify-between">
                      <span className="font-semibold" style={{ color: BFR_RED }}>{w.name}</span>
                      <span className="text-xs opacity-70">{formatWishTime(w.time)}</span>
                    </div>
                    <p className="mt-2 leading-relaxed">{w.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          {banks.length > 0 ? (
            <section className="w-full text-center">
              <GiftEnvelope templateSlug={content.slug} banks={banks} accent={BFR_GOLD} dark={BFR_RED} cardBg={BFR_CREAM} heading="Phong Bao Mừng Cưới" />
            </section>
          ) : null}
        </div>

        {/* FOOTER */}
        <footer data-template-footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 text-center">
          <span className="text-[12px] md:text-[15px] lg:text-[18px]" style={{ color: BFR_RED }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3" style={{ backgroundColor: BFR_CREAM }}>
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: BFR_RED }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}
