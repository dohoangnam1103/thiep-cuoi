"use client";

import type React from "react";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { orderedCouple, orderByBrideFirst } from "@/lib/invitation-display";
import {
  AlbumGallery,
  FamilyColumn,
  SharedWishForm,
  WEEKDAY_LABELS,
  buildCalendar,
  buildVietQrImageUrl,
  formatDate,
  formatWishTime,
  googleCalendarUrl,
  hexToRgba,
  InvitationMap,
  MapDirectionsButton,
} from "@/components/chungdoi-tpl-shared";

const SGR_BASE = "/chungdoi/images/themes/_decor/vuon-xuan-red";
const SGR_TEXT = "#D25F65";
const SGR_ACCENT = "#b54b51";
const SGR_MUTED = "rgba(210, 95, 101, 0.7)";
const SGR_CARD = "rgba(255, 255, 255, 0.95)";
const SGR_BG = "linear-gradient(to bottom right, #fff5f5, #ffefef, #ffe8e8)";

function SpringHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-[21px] font-bold uppercase tracking-wide md:text-[26px]" style={{ color: SGR_TEXT }}>
      {children}
    </h2>
  );
}

export function SpringGardenRedInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes, bank } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const nameFont = { fontFamily: '"UNI Chu truyen thong", "Baskerville", "Times New Roman", serif' };

  const groomCol = <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  const banks = orderByBrideFirst(
    { label: `${couple.brideBirthOrder || "Út Nữ"} - ${bank.brideAccountName}`, bank: bank.brideBankName, num: bank.brideAccountNumber, name: bank.brideAccountName },
    { label: `${couple.groomBirthOrder || "Trưởng Nam"} - ${bank.groomAccountName}`, bank: bank.groomBankName, num: bank.groomAccountNumber, name: bank.groomAccountName },
    couple.brideFirst,
  ).filter((q) => q.bank);

  return (
    <div className="flex w-full justify-center overflow-x-clip" style={{ background: SGR_BG }}>
      <div
        className="relative w-full max-w-[480px] overflow-hidden md:mx-auto md:max-w-[900px] md:border"
        style={{ color: SGR_ACCENT, borderColor: hexToRgba(SGR_TEXT, 0.25) }}
      >
        <img
          src={`${SGR_BASE}/top-right.webp`}
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-[240px] top-0 z-0 w-[1000px] max-w-none object-contain opacity-65 md:-right-[250px] md:w-[1680px]"
        />
        <img src={`${SGR_BASE}/button-left.webp`} alt="" aria-hidden className="pointer-events-none absolute -bottom-[40px] -left-[50px] z-0 w-[300px] max-w-none object-contain opacity-60 md:-bottom-[60px] md:-left-[70px] md:w-[420px]" />
        <img src={`${SGR_BASE}/top-right.webp`} alt="" aria-hidden className="pointer-events-none absolute top-[38%] -left-[10%] -z-10 h-[240px] w-auto max-w-none -scale-x-100 object-contain opacity-[0.14] md:h-[360px]" />

        <header className="relative z-20 flex h-[472px] w-full flex-col items-center justify-center px-6 text-center md:h-[650px] md:px-10">
          <h1 className="flex w-full flex-col items-center gap-6 text-[50px] leading-[75px] md:text-[70px] md:leading-[105px]" style={{ color: SGR_TEXT, ...nameFont }}>
            <span>{people[0].shortName}</span>
            <span className="text-[37px] leading-[56px] md:text-[50px] md:leading-[75px]">&amp;</span>
            <span>{people[1].shortName}</span>
          </h1>
        </header>

        {gallery.length > 0 ? (
          <section className="relative z-10 flex w-full flex-col items-center px-6 pb-12 md:mt-8 md:px-10 md:pb-16">
            <SpringHeading>Album Ảnh Cưới</SpringHeading>
            <div className="mt-7 w-full max-w-[400px] md:max-w-[560px]">
              <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={SGR_TEXT} gridAspect="aspect-square" />
            </div>
          </section>
        ) : null}

        <div className="relative z-10 flex w-full flex-col items-center gap-14 px-4 pb-14 pt-10 md:px-10">
          <section className="flex w-full flex-col items-center gap-8">
            <SpringHeading>Thông Tin Lễ Cưới</SpringHeading>
            <div className="flex w-full items-start justify-center gap-3 md:gap-10">
              {couple.brideFirst ? (<>{brideCol}{groomCol}</>) : (<>{groomCol}{brideCol}</>)}
            </div>
            <p className="whitespace-pre-line text-center text-[14px] uppercase leading-relaxed md:text-[18px]">{couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI."}</p>
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[40px] leading-[1.1] md:text-[56px]" style={{ ...nameFont, color: SGR_TEXT }}>{people[0].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: SGR_MUTED }}>{people[0].birthOrder}</div>
              <div className="text-[24px] md:text-[32px]" style={{ ...nameFont, color: SGR_TEXT }}>&amp;</div>
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[40px] leading-[1.1] md:text-[56px]" style={{ ...nameFont, color: SGR_TEXT }}>{people[1].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: SGR_MUTED }}>{people[1].birthOrder}</div>
            </div>
            {ceremony ? (
              <div className="flex flex-col items-center gap-1 text-center">
                {couple.ceremonyHeader ? <span className="whitespace-pre-line text-[16px] uppercase leading-relaxed md:text-[20px]">{couple.ceremonyHeader}</span> : null}
                {couple.ceremonyTime ? <div className="text-[20px] md:text-[30px]">{couple.ceremonyTime}</div> : null}
                <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                  <span>{ceremony.weekday}</span><span>|</span><span className="text-[28px] font-bold" style={{ color: SGR_TEXT }}>{ceremony.day}</span><span>|</span><span>Tháng {ceremony.month}</span>
                </div>
                <div className="text-[18px] md:text-[24px]">{ceremony.yearNumber}</div>
                <div className="text-xs opacity-75 md:text-sm">{ceremony.lunar}</div>
              </div>
            ) : null}
          </section>


          <section className="relative flex w-full flex-col items-center gap-3">
            <SpringHeading>Thông Tin Tiệc Cưới</SpringHeading>
            <p className="mt-2 text-center text-[16px] uppercase md:text-[20px]">Tiệc cưới sẽ diễn ra vào lúc:</p>
            <div className="text-[20px] font-semibold md:text-[30px]" style={{ color: SGR_TEXT }}>{venue.banquetTime || couple.time}</div>
            {reception ? (
              <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                <span>{reception.weekday}</span><span>/</span><span>{reception.day}</span><span>/</span><span>Tháng {reception.month}</span>
              </div>
            ) : null}
            {reception ? <div className="text-[18px] md:text-[24px]">{reception.yearNumber}</div> : null}
            {reception ? <div className="text-xs opacity-75 md:text-sm">{reception.lunar}</div> : null}

            {calendar ? (
              <div className="relative mx-auto mt-8 w-full max-w-[340px] rounded-2xl border px-8 py-6 md:mt-10 md:max-w-[420px]" style={{ borderColor: hexToRgba(SGR_TEXT, 0.3), backgroundColor: SGR_CARD }}>
                <div className="relative flex h-full w-full flex-col items-center justify-center">
                  <p className="text-[12px] font-semibold uppercase tracking-wide md:text-[13px]" style={{ color: SGR_TEXT }}>Tháng {calendar.month} / {calendar.year}</p>
                  <div className="mt-2 grid w-full grid-cols-7 text-[10px] font-medium opacity-70 md:text-[11px]">
                    {WEEKDAY_LABELS.map((d) => (<span key={d} className="py-0.5 text-center">{d}</span>))}
                  </div>
                  <div className="grid w-full grid-cols-7 gap-y-0.5 text-[11px] md:text-[12px]">
                    {calendar.cells.map((day, i) => (
                      <span key={i} className={`flex aspect-square items-center justify-center rounded-full ${day === calendar.highlight ? "font-bold text-white" : ""}`} style={day === calendar.highlight ? { backgroundColor: SGR_TEXT } : undefined}>{day ?? ""}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <a href={googleCalendarUrl(content)} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center rounded-full border px-6 py-2 text-sm font-semibold transition" style={{ borderColor: SGR_TEXT, color: SGR_TEXT }}>Thêm vào lịch</a>
          </section>

          {mapQuery ? (
            <section className="flex w-full flex-col items-center gap-3 text-center">
              <SpringHeading>Tiệc cưới sẽ tổ chức tại</SpringHeading>
              <p className="mx-auto mt-1 max-w-sm whitespace-pre-line text-sm leading-6 md:max-w-[500px]">{venue.address}</p>
              <div className="mt-4 w-full overflow-hidden rounded-2xl border" style={{ borderColor: hexToRgba(SGR_TEXT, 0.35) }}>
                <InvitationMap query={mapQuery} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <MapDirectionsButton query={mapQuery} style={{ color: SGR_TEXT }} />
            </section>
          ) : null}

          {schedule.length > 0 ? (
            <section className="relative flex w-full flex-col items-center gap-6 rounded-[28px] border px-5 py-8" style={{ borderColor: hexToRgba(SGR_TEXT, 0.2), backgroundColor: hexToRgba("#ffffff", 0.55) }}>
              <img src={`${SGR_BASE}/button-left.webp`} alt="" aria-hidden className="pointer-events-none absolute -bottom-12 -left-12 -z-10 h-[190px] w-auto max-w-none object-contain opacity-30 md:h-[260px]" />
              <SpringHeading>Lịch Trình Ngày Cưới</SpringHeading>
              <ol className="mx-auto flex w-full max-w-sm flex-col gap-4">
                {schedule.map((s, i) => (
                  <li key={`${s.time}-${i}`} className="flex items-baseline gap-4">
                    <span className="w-[64px] shrink-0 pt-0.5 text-right text-[16px] tabular-nums tracking-wide md:text-[17px]" style={{ color: SGR_TEXT }}>{s.time}</span>
                    <span className="text-[16px] font-medium leading-tight md:text-[18px]">{s.label}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <section className="relative w-full">
            <img src={`${SGR_BASE}/top-right.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-24 right-0 -z-10 h-[320px] w-auto max-w-none object-contain opacity-[0.12] md:-top-32 md:right-32 md:h-[460px]" />
            <div className="text-center"><SpringHeading>Sổ Lưu Bút</SpringHeading></div>
            <SharedWishForm accent={SGR_TEXT} />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                {wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-xs" style={{ borderColor: hexToRgba(SGR_TEXT, 0.22), backgroundColor: SGR_CARD }}>
                    <div className="flex items-start justify-between">
                      <span className="font-semibold" style={{ color: SGR_TEXT }}>{w.name}</span>
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
              <SpringHeading>QR Mừng Cưới</SpringHeading>
              <div className="mt-6 flex flex-row flex-wrap items-start justify-center gap-4 sm:gap-8">
                {banks.map((q) => {
                  const qr = buildVietQrImageUrl({ bank: q.bank, accountNumber: q.num, accountName: q.name });
                  return (
                    <div key={q.label} className="flex max-w-[200px] flex-1 flex-col items-center">
                      <h3 className="mb-2 flex min-h-[2rem] items-start justify-center text-xs font-semibold">{q.label}</h3>
                      <div className="size-32 rounded-xl bg-white p-2 sm:size-40"><img src={qr} alt={`QR - ${q.label}`} className="h-full w-full object-contain" /></div>
                      <p className="mt-2 text-[13px] font-semibold">{q.bank}</p>
                      <p className="text-[13px] font-mono">{q.num}</p>
                      <p className="text-[13px]">{q.name}</p>
                      <a href={`${qr}&download=1`} download className="mt-3 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase" style={{ borderColor: SGR_TEXT, color: SGR_TEXT }}>Lưu QR</a>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <footer data-template-footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 text-center">
          <span className="text-[12px] md:text-[15px] lg:text-[18px]" style={{ color: SGR_TEXT }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3" style={{ background: SGR_BG }}>
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: SGR_ACCENT }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}
