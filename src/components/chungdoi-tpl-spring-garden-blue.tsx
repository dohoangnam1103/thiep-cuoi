"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { orderedCouple, orderByBrideFirst } from "@/lib/invitation-display";
import {
  hexToRgba,
  formatDate,
  buildCalendar,
  formatWishTime,
  useLightbox,
  Lightbox,
  googleCalendarUrl,
  InvitationMap,
  FamilyColumn,
  GiftEnvelope,
  SharedWishForm,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";

const BASE = "/chungdoi/images/themes/_decor/vuon-xuan-blue";
const TEXT = "#486C7D";
const ACCENT = "#3a5666";
const MUTED = "rgba(72, 108, 125, 0.7)";
const CARD = "rgba(255, 255, 255, 0.68)";

const nameFont = { fontFamily: '"UNI Chu truyen thong", Baskerville, "Times New Roman", serif' };
const scriptFont = { fontFamily: '"Alex Brush", "The Nautigal", cursive' };

function SpringHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <img src={`${BASE}/button.webp`} alt="" aria-hidden className="h-auto w-[76px] object-contain opacity-70" />
      <h2 className="text-[20px] font-bold uppercase tracking-[0.22em] md:text-[25px]" style={{ color: ACCENT }}>
        {children}
      </h2>
    </div>
  );
}

function DecorButton({ className }: { className: string }) {
  return <img src={`${BASE}/button.webp`} alt="" aria-hidden className={className} />;
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`relative w-full rounded-[32px] border px-4 py-8 shadow-[0_18px_60px_rgba(58,86,102,0.08)] backdrop-blur-sm md:px-8 ${className}`} style={{ borderColor: hexToRgba(ACCENT, 0.16), backgroundColor: CARD }}>
      {children}
    </section>
  );
}

function CalendarBlock({ calendar }: { calendar: ReturnType<typeof buildCalendar> }) {
  if (!calendar) return null;
  return (
    <div className="relative mx-auto mt-8 w-full max-w-[342px] overflow-hidden rounded-[28px] border px-7 py-6 md:max-w-[420px]" style={{ borderColor: hexToRgba(ACCENT, 0.22), backgroundColor: "rgba(255,255,255,0.72)" }}>
      <DecorButton className="pointer-events-none absolute -right-12 -top-14 h-[170px] w-auto rotate-12 object-contain opacity-[0.16]" />
      <p className="text-center text-[12px] font-semibold uppercase tracking-[0.22em] md:text-[13px]">Tháng {calendar.month} / {calendar.year}</p>
      <div className="mt-3 grid grid-cols-7 text-[10px] font-medium opacity-70 md:text-[11px]">
        {WEEKDAY_LABELS.map((d) => <span key={d} className="py-0.5 text-center">{d}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-y-1 text-[11px] md:text-[12px]">
        {calendar.cells.map((day, i) => (
          <span key={i} className={`flex aspect-square items-center justify-center rounded-full ${day === calendar.highlight ? "font-bold text-white" : ""}`} style={day === calendar.highlight ? { backgroundColor: ACCENT } : undefined}>{day ?? ""}</span>
        ))}
      </div>
    </div>
  );
}

function WishesList({ wishes }: { wishes: ChungDoiDemoContent["wishes"] }) {
  if (wishes.length === 0) return null;
  return (
    <div className="chungdoi-scroll touch-pan-y mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
      {wishes.map((w, i) => (
        <div key={`${w.name}-${i}`} className="rounded-2xl border p-3 text-xs" style={{ borderColor: hexToRgba(ACCENT, 0.18), backgroundColor: "rgba(255,255,255,0.78)" }}>
          <div className="flex items-start justify-between gap-3">
            <span className="font-semibold" style={{ color: ACCENT }}>{w.name}</span>
            <span className="shrink-0 text-xs opacity-70">{formatWishTime(w.time)}</span>
          </div>
          <p className="mt-2 leading-relaxed">{w.text}</p>
        </div>
      ))}
    </div>
  );
}

function GiftSection({ content }: { content: ChungDoiDemoContent }) {
  const { couple, bank } = content;
  const banks = orderByBrideFirst(
    { label: `${couple.brideBirthOrder || "Út Nữ"} - ${bank.brideAccountName}`, bank: bank.brideBankName, num: bank.brideAccountNumber, name: bank.brideAccountName },
    { label: `${couple.groomBirthOrder || "Trưởng Nam"} - ${bank.groomAccountName}`, bank: bank.groomBankName, num: bank.groomAccountNumber, name: bank.groomAccountName },
    couple.brideFirst,
  ).filter((q) => q.bank);
  if (banks.length === 0) return null;
  return (
    <SectionCard className="text-center">
      <GiftEnvelope banks={banks} accent={TEXT} dark={ACCENT} cardBg="#eef7fa" heading="Phong Bao Mừng Cưới" labelColor={MUTED} />
    </SectionCard>
  );
}

export function SpringGardenBlueInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate || couple.date);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const albumShown = gallery.slice(0, 4);
  const albumExtra = Math.max(0, gallery.length - 4);
  const { lightbox, setLightbox } = useLightbox(gallery.length);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const groomCol = <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div className="relative w-full max-w-[480px] overflow-hidden bg-white md:mx-auto md:max-w-[900px] md:border" style={{ color: TEXT, borderColor: hexToRgba(ACCENT, 0.2) }}>
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 z-[1] h-[1550px] w-[1680px] -translate-x-1/2 bg-[url('/chungdoi/images/themes/_decor/vuon-xuan-blue/top.webp')] bg-contain bg-top bg-no-repeat md:h-[2800px] md:w-[3000px]" />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[1850px] z-[1] h-[1500px] w-[1650px] -translate-x-1/2 bg-[url('/chungdoi/images/themes/_decor/vuon-xuan-blue/mid.webp')] bg-contain bg-center bg-no-repeat opacity-80 md:h-[2700px] md:w-[2950px]" />

        <header className="relative z-20 flex h-[472px] w-full flex-col items-center justify-center px-6 text-center md:h-[650px] md:px-10">
          <h1 className="flex w-full flex-col items-center gap-6 text-[50px] leading-[75px] md:text-[70px] md:leading-[105px]" style={{ ...nameFont, color: TEXT }}>
            <span>{people[0].shortName}</span>
            <span className="text-[37px] leading-[56px] md:text-[50px] md:leading-[75px]" style={nameFont}>&amp;</span>
            <span>{people[1].shortName}</span>
          </h1>
        </header>

        {albumShown.length > 0 ? (
          <section className="relative z-10 flex w-full flex-col items-center px-6 pb-12 md:mt-8 md:px-10 md:pb-16">
            <h2 className="text-[20px] font-normal uppercase md:text-[26px]" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>Album Ảnh Cưới</h2>
            <div className="mt-7 grid w-full max-w-[400px] grid-cols-2 gap-3 md:max-w-[560px] md:gap-4">
              {albumShown.map((src, i) => (
                <button key={src} type="button" onClick={() => setLightbox(i)} className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border" style={{ borderColor: hexToRgba(ACCENT, 0.22) }}>
                  <img src={src} alt={`Ảnh cưới ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
                </button>
              ))}
            </div>
            <Lightbox gallery={gallery} index={lightbox} setIndex={setLightbox} accent={ACCENT} />
          </section>
        ) : null}

        <div className="relative z-10 flex w-full flex-col items-center gap-12 px-4 pb-14 pt-12 md:px-10">
          <SectionCard className="flex flex-col items-center gap-8 text-center">
            <SpringHeading>Thông Tin Lễ Cưới</SpringHeading>
            <div className="flex w-full items-start justify-center gap-3 md:gap-10">
              {couple.brideFirst ? (<>{brideCol}{groomCol}</>) : (<>{groomCol}{brideCol}</>)}
            </div>
            <p className="whitespace-pre-line text-[15px] uppercase leading-relaxed tracking-[0.12em] md:text-[19px]">{couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI."}</p>
            <div className="flex flex-col items-center gap-2">
              <h3 className="flex min-h-[70px] w-[88%] items-center justify-center text-[44px] leading-[1.1] md:text-[64px]" style={nameFont}>{people[0].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.24em] md:text-[13px]" style={{ color: MUTED }}>{people[0].birthOrder}</div>
              <div className="text-[26px] md:text-[36px]" style={scriptFont}>&amp;</div>
              <h3 className="flex min-h-[70px] w-[88%] items-center justify-center text-[44px] leading-[1.1] md:text-[64px]" style={nameFont}>{people[1].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.24em] md:text-[13px]" style={{ color: MUTED }}>{people[1].birthOrder}</div>
            </div>
            {ceremony ? (
              <div className="flex flex-col items-center gap-1">
                {couple.ceremonyHeader ? <span className="whitespace-pre-line text-[15px] uppercase leading-relaxed md:text-[19px]">{couple.ceremonyHeader}</span> : null}
                {couple.ceremonyTime ? <div className="text-[20px] font-semibold md:text-[30px]">{couple.ceremonyTime}</div> : null}
                <div className="mt-2 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                  <span>{ceremony.weekday}</span><span>|</span><span className="text-[30px] font-bold">{ceremony.day}</span><span>|</span><span>Tháng {ceremony.month}</span>
                </div>
                <div className="text-[18px] md:text-[24px]">{ceremony.yearNumber}</div>
                <div className="text-xs opacity-75 md:text-sm">{ceremony.lunar}</div>
              </div>
            ) : null}
          </SectionCard>

          {false && albumShown.length > 0 ? (
            <SectionCard className="flex flex-col items-center gap-6">
              <DecorButton className="pointer-events-none absolute -left-20 top-2 h-[180px] w-auto -rotate-12 object-contain opacity-[0.14] md:h-[260px]" />
              <SpringHeading>Album Ảnh Cưới</SpringHeading>
              <div className="grid w-full max-w-[400px] grid-cols-2 gap-3 md:max-w-[560px] md:gap-4">
                {albumShown.map((src, i) => (
                  <button key={src} type="button" onClick={() => setLightbox(i)} className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-[22px] border bg-white/70 p-1" style={{ borderColor: hexToRgba(ACCENT, 0.22) }}>
                    <img alt={`Ảnh cưới ${i + 1}`} className="h-full w-full rounded-[18px] object-cover transition-transform duration-200 group-hover:scale-[1.03]" src={src} />
                    {i === albumShown.length - 1 && albumExtra > 0 ? <div className="absolute inset-1 flex items-center justify-center rounded-[18px] bg-black/55"><span className="text-lg font-semibold text-white">+{albumExtra}</span></div> : null}
                  </button>
                ))}
              </div>
              <Lightbox gallery={gallery} index={lightbox} setIndex={setLightbox} accent={ACCENT} />
            </SectionCard>
          ) : null}

          <SectionCard className="flex flex-col items-center gap-3 text-center">
            <SpringHeading>Thông Tin Tiệc Cưới</SpringHeading>
            <p className="mt-2 text-[16px] uppercase md:text-[20px]">Tiệc cưới sẽ diễn ra vào lúc:</p>
            <div className="text-[22px] font-semibold md:text-[32px]">{venue.banquetTime || couple.time}</div>
            {reception ? <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]"><span>{reception.weekday}</span><span>/</span><span>{reception.day}</span><span>/</span><span>Tháng {reception.month}</span></div> : null}
            {reception ? <div className="text-[18px] md:text-[24px]">{reception.yearNumber}</div> : null}
            {reception ? <div className="text-xs opacity-75 md:text-sm">{reception.lunar}</div> : null}
            <CalendarBlock calendar={calendar} />
            <a href={googleCalendarUrl(content)} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center rounded-full border px-6 py-2 text-sm font-semibold transition hover:bg-white/70" style={{ borderColor: ACCENT, color: ACCENT }}>Thêm vào lịch</a>
          </SectionCard>

          {mapQuery ? (
            <SectionCard className="flex flex-col items-center gap-3 text-center">
              <SpringHeading>Tiệc cưới sẽ tổ chức tại</SpringHeading>
              <p className="mx-auto mt-1 max-w-sm whitespace-pre-line text-sm leading-6 md:max-w-[500px]">{venue.address}</p>
              <div className="mt-4 w-full overflow-hidden rounded-[24px] border bg-white/70 p-1" style={{ borderColor: hexToRgba(ACCENT, 0.22) }}>
                <InvitationMap query={mapQuery} title={mapQuery} className="h-64 w-full rounded-[20px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            </SectionCard>
          ) : null}

          {schedule.length > 0 ? (
            <SectionCard className="flex flex-col items-center gap-6">
              <DecorButton className="pointer-events-none absolute -right-16 bottom-4 h-[210px] w-auto rotate-12 object-contain opacity-[0.13] md:h-[300px]" />
              <SpringHeading>Lịch Trình Ngày Cưới</SpringHeading>
              <ol className="mx-auto flex w-full max-w-sm flex-col gap-4">
                {schedule.map((s, i) => (
                  <li key={`${s.time}-${i}`} className="flex items-baseline gap-4">
                    <span className="w-[64px] shrink-0 pt-0.5 text-right text-[16px] font-semibold tabular-nums tracking-wide md:text-[17px]">{s.time}</span>
                    <span className="text-[16px] font-medium leading-tight md:text-[18px]">{s.label}</span>
                  </li>
                ))}
              </ol>
            </SectionCard>
          ) : null}

          <SectionCard>
            <div className="text-center"><SpringHeading>Sổ Lưu Bút</SpringHeading></div>
            <SharedWishForm accent={ACCENT} />
            <WishesList wishes={wishes} />
          </SectionCard>

          <GiftSection content={content} />
        </div>

        <div className="pointer-events-none relative z-0 flex h-32 justify-center overflow-hidden pb-2 md:h-44">
          <DecorButton className="absolute top-1/2 h-auto w-[360px] max-w-[85%] -translate-y-1/2 object-contain opacity-[0.1] md:w-[500px]" />
        </div>
        <footer data-template-footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 text-center">
          <span className="text-[12px] md:text-[15px] lg:text-[18px]" style={{ color: ACCENT }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: ACCENT }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}
