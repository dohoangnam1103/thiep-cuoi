"use client";

import type React from "react";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  FamilyColumn,
  Lightbox,
  SharedWishForm,
  WEEKDAY_LABELS,
  buildCalendar,
  formatDate,
  formatWishTime,
  googleCalendarUrl,
  hexToRgba,
  mapEmbedUrl,
  useLightbox,
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

/** Faithful rebuild of the Spring Garden Red (vườn xuân đỏ) opened invitation. */
export function SpringGardenRedInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes, bank } = content;
  const ceremony = formatDate(couple.ceremonyDate || couple.date);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const albumShown = gallery.slice(0, 4);
  const albumExtra = Math.max(0, gallery.length - 4);
  const { lightbox, setLightbox } = useLightbox(gallery.length);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const nameFont = { fontFamily: '"UNI Chu truyen thong", "Baskerville", "Times New Roman", serif' };

  const groomCol = <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  const banks = ([
    { label: `${couple.groomBirthOrder || "Trưởng Nam"} - ${bank.groomAccountName}`, bank: bank.groomBankName, num: bank.groomAccountNumber, name: bank.groomAccountName },
    { label: `${couple.brideBirthOrder || "Út Nữ"} - ${bank.brideAccountName}`, bank: bank.brideBankName, num: bank.brideAccountNumber, name: bank.brideAccountName },
  ] as const).filter((q) => q.bank);

  return (
    <div className="flex w-full justify-center overflow-x-clip" style={{ background: SGR_BG }}>
      <div
        className="relative w-full max-w-[480px] overflow-hidden md:mx-auto md:max-w-[900px] md:border"
        style={{ color: SGR_ACCENT, borderColor: hexToRgba(SGR_TEXT, 0.25) }}
      >
        {/* corner florals */}
        <img src={`${SGR_BASE}/top-right.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-[40px] -right-[50px] z-0 w-[300px] max-w-none object-contain opacity-60 md:-top-[60px] md:-right-[70px] md:w-[420px]" />
        <img src={`${SGR_BASE}/button-left.webp`} alt="" aria-hidden className="pointer-events-none absolute -bottom-[40px] -left-[50px] z-0 w-[300px] max-w-none object-contain opacity-60 md:-bottom-[60px] md:-left-[70px] md:w-[420px]" />
        <img src={`${SGR_BASE}/top-right.webp`} alt="" aria-hidden className="pointer-events-none absolute top-[38%] -left-[10%] -z-10 h-[240px] w-auto max-w-none -scale-x-100 object-contain opacity-[0.14] md:h-[360px]" />

        {/* HEADER */}
        <header className="relative z-20 flex w-full flex-col items-center px-4 pt-[70px] sm:px-5 md:pt-[100px]">
          <p className="relative z-30 text-center text-[13px] uppercase tracking-[0.3em] md:text-[16px]" style={{ color: SGR_MUTED }}>Welcome To Our Wedding</p>
          <h1 className="relative z-30 mt-4 flex flex-col items-center leading-none" style={{ color: SGR_TEXT }}>
            <span className="text-[54px] md:text-[72px]" style={nameFont}>{couple.groomShortName || couple.groomFullName}</span>
            <span className="my-2 text-[32px] md:text-[40px]" style={nameFont}>&amp;</span>
            <span className="text-[54px] md:text-[72px]" style={nameFont}>{couple.brideShortName || couple.brideFullName}</span>
          </h1>

          {albumShown.length > 0 ? (
            <div className="relative z-30 mt-8 flex w-full items-start justify-center gap-4 md:gap-10">
              <div className="relative aspect-[3/4] w-[42%] max-w-[200px] overflow-hidden rounded-lg border" style={{ borderColor: hexToRgba(SGR_TEXT, 0.3) }}>
                {gallery[0] ? <img src={gallery[0]} alt="Chú rể" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="relative aspect-[3/4] w-[42%] max-w-[200px] overflow-hidden rounded-lg border" style={{ borderColor: hexToRgba(SGR_TEXT, 0.3) }}>
                {gallery[1] ? <img src={gallery[1]} alt="Cô dâu" className="h-full w-full object-cover" /> : null}
              </div>
            </div>
          ) : null}
        </header>

        <div className="relative z-10 flex w-full flex-col items-center gap-14 px-4 pb-14 pt-10 md:px-10">
          {/* CEREMONY INFO */}
          <section className="flex w-full flex-col items-center gap-8">
            <SpringHeading>Thông Tin Lễ Cưới</SpringHeading>
            <div className="flex w-full items-start justify-center gap-3 md:gap-10">
              {couple.brideFirst ? (<>{brideCol}{groomCol}</>) : (<>{groomCol}{brideCol}</>)}
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[40px] leading-[1.1] md:text-[56px]" style={{ ...nameFont, color: SGR_TEXT }}>{couple.groomFullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: SGR_MUTED }}>{couple.groomBirthOrder || "Trưởng Nam"}</div>
              <div className="text-[24px] md:text-[32px]" style={{ ...nameFont, color: SGR_TEXT }}>&amp;</div>
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[40px] leading-[1.1] md:text-[56px]" style={{ ...nameFont, color: SGR_TEXT }}>{couple.brideFullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: SGR_MUTED }}>{couple.brideBirthOrder || "Út Nữ"}</div>
            </div>
            {ceremony ? (
              <div className="flex flex-col items-center gap-1 text-center">
                {couple.ceremonyHeader ? <span className="whitespace-pre-line text-[16px] uppercase leading-relaxed md:text-[20px]">{couple.ceremonyHeader}</span> : null}
                {couple.ceremonyTime ? <div className="text-[20px] md:text-[30px]">{couple.ceremonyTime}</div> : null}
                <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                  <span>{ceremony.weekday}</span><span>|</span><span className="text-[28px] font-bold" style={{ color: SGR_TEXT }}>{ceremony.day}</span><span>|</span><span>Tháng {ceremony.month}</span>
                </div>
                <div className="text-[18px] md:text-[24px]">{ceremony.yearNumber}</div>
              </div>
            ) : null}
          </section>

          {/* ALBUM */}
          {albumShown.length > 0 ? (
            <section className="flex w-full flex-col items-center gap-6">
              <SpringHeading>Album Ảnh Cưới</SpringHeading>
              <div className="grid w-full max-w-[400px] grid-cols-2 gap-3 md:max-w-[560px] md:gap-4">
                {albumShown.map((src, i) => (
                  <button key={src} type="button" onClick={() => setLightbox(i)} className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border" style={{ borderColor: hexToRgba(SGR_TEXT, 0.35) }}>
                    <img alt={`Ảnh cưới ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" src={src} />
                    {i === albumShown.length - 1 && albumExtra > 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/55"><span className="text-lg font-semibold text-white">+{albumExtra}</span></div>
                    ) : null}
                  </button>
                ))}
              </div>
              <Lightbox gallery={gallery} index={lightbox} setIndex={setLightbox} accent={SGR_TEXT} />
            </section>
          ) : null}

          {/* RECEPTION + CALENDAR */}
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

          {/* SPRING_BODY_PLACEHOLDER */}
        </div>
      </div>
    </div>
  );
}
