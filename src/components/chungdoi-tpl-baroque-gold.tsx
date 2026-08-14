"use client";

import type React from "react";
import { useEffect, useState } from "react";

import { TemplateGiftArtwork } from "@/components/chungdoi-gift-envelope-artwork";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  WEEKDAY_LABELS,
  hexToRgba,
  formatDate,
  buildCalendar,
  buildVietQrImageUrl,
  formatWishTime,
  AlbumGallery,
  googleCalendarUrl,
  InvitationMap,
  MapDirectionsButton,
  FamilyColumn,
  SharedWishForm,
} from "@/components/chungdoi-tpl-shared";
import { invitationCeremonyMessage, invitationOpeningMessage, orderedCouple, orderByBrideFirst } from "@/lib/invitation-display";

const BAROQUE_BASE = "/chungdoi/images/themes/_decor/baroque-gold";
const GOLD = "#b8912f";
const GOLD_DARK = "#8a6a1f";
const INK = "#3b2f1a";
const INK_MUTED = "rgba(59, 47, 26, 0.72)";
const CREAM = "#fbf6ea";

function BaroqueHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: GOLD_DARK }}>
      {children}
    </h2>
  );
}

function BaroqueCountdown({ target }: { target: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const raf = requestAnimationFrame(tick);
    const id = window.setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(id);
    };
  }, []);
  const diff = now === null ? 0 : Math.max(0, new Date(target).getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return (
    <p className="mt-2 text-center text-[20px] font-semibold md:text-[22px]" style={{ color: GOLD_DARK }}>
      {days} ngày {hours} giờ {mins} phút {secs} giây
    </p>
  );
}

/** Faithful rebuild of the Baroque Gold (hoang-gia-vang) opened invitation. */
export function BaroqueGoldInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes, bank } = content;
  const [giftOpen, setGiftOpen] = useState(false);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const nameFont = { fontFamily: '"DFVN New Eddy", "Fz Qellia", cursive' };
  const ampFont = { fontFamily: '"Alex Brush", "The Nautigal", cursive' };
  const people = orderedCouple(content);

  const groomCol = <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  const banks = orderByBrideFirst(
    { label: `${couple.brideBirthOrder || "Út Nữ"} - ${bank.brideAccountName}`, bank: bank.brideBankName, num: bank.brideAccountNumber, name: bank.brideAccountName },
    { label: `${couple.groomBirthOrder || "Trưởng Nam"} - ${bank.groomAccountName}`, bank: bank.groomBankName, num: bank.groomAccountNumber, name: bank.groomAccountName },
    couple.brideFirst,
  ).filter((q) => q.bank);

  return (
    <div className="flex w-full justify-center overflow-x-clip" style={{ backgroundColor: CREAM }}>
      <div className="relative w-full max-w-[480px] overflow-hidden md:mx-auto md:max-w-[900px] md:border" style={{ color: INK, backgroundColor: CREAM, borderColor: hexToRgba(GOLD, 0.35) }}>
        {/* faint side flower */}
        <img src={`${BAROQUE_BASE}/hoa.webp`} alt="" aria-hidden className="pointer-events-none absolute top-[640px] -left-[25%] -z-10 h-[900px] w-auto max-w-none object-contain opacity-[0.15] md:top-[760px] md:-left-[15%] md:h-[1400px] lg:h-[1200px]" />

        {/* HEADER — source-specific baroque name frame */}
        <section className="relative isolate z-20 w-full">
          <img src={`${BAROQUE_BASE}/hoa.webp`} alt="" aria-hidden className="pointer-events-none absolute right-0 top-0 z-0 h-auto w-[63%] max-w-none translate-x-[42%] -translate-y-[42%] rotate-45 object-contain opacity-20 md:w-[51%]" />
          <header className="relative z-20 flex w-full flex-col items-center px-4 pb-4 pt-16 sm:px-5 md:pb-8 md:pt-24">
            <p className="relative z-30 whitespace-pre text-center text-[15px] font-bold uppercase tracking-[0.18em] md:text-[20px]" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif', color: GOLD_DARK }}>Welcome To Our Wedding</p>
            <div className="relative mt-6 w-[92%] max-w-[360px] md:mt-9 md:max-w-[520px]">
              <img src={`${BAROQUE_BASE}/khung.webp`} alt="" aria-hidden className="relative z-10 block h-auto w-full object-contain" />
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center uppercase leading-none" style={{ ...nameFont, color: GOLD_DARK }}>
                <span className="flex w-[56%] justify-center whitespace-nowrap text-[clamp(28px,5vw,47px)] leading-[1.25]">{people[0].shortName}</span>
                <span className="my-2 text-[clamp(18px,3vw,24px)] normal-case leading-none md:my-3" style={ampFont}>&amp;</span>
                <span className="flex w-[56%] justify-center whitespace-nowrap text-[clamp(28px,5vw,47px)] leading-[1.25]">{people[1].shortName}</span>
              </div>
            </div>
          </header>
        </section>

        <div className="relative z-10 flex w-full flex-col items-center gap-14 px-4 pb-14 md:px-10">
          {/* CEREMONY INFO */}
          <section className="flex w-full flex-col items-center gap-8">
            <BaroqueHeading>Thông Tin Lễ Cưới</BaroqueHeading>
            <div className="flex w-full flex-col items-center gap-6 md:flex-row md:items-start md:justify-center md:gap-10">
              {couple.brideFirst ? (<>{brideCol}{groomCol}</>) : (<>{groomCol}{brideCol}</>)}
            </div>
            <div className="whitespace-pre-line text-center text-[16px] uppercase leading-relaxed tracking-wide md:text-[20px]">
              {invitationOpeningMessage(content)}
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="flex min-h-[80px] w-[80%] items-center justify-center text-[44px] leading-[1.1] md:text-[60px]" style={{ ...nameFont, color: GOLD_DARK }}>{people[0].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: INK_MUTED }}>{people[0].birthOrder}</div>
              <div className="text-[24px] md:text-[32px]" style={ampFont}>&amp;</div>
              <h3 className="flex min-h-[80px] w-[80%] items-center justify-center text-[44px] leading-[1.1] md:text-[60px]" style={{ ...nameFont, color: GOLD_DARK }}>{people[1].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: INK_MUTED }}>{people[1].birthOrder}</div>
            </div>
            {ceremony ? (
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="whitespace-pre-line text-[16px] uppercase leading-relaxed md:text-[20px]">{invitationCeremonyMessage(content)}</span>
                {couple.ceremonyTime ? <div className="text-[20px] md:text-[30px]">{couple.ceremonyTime}</div> : null}
                <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                  <span>{ceremony.weekday}</span><span>|</span><span className="text-[28px] font-bold" style={{ color: GOLD_DARK }}>{ceremony.day}</span><span>|</span><span>Tháng {ceremony.month}</span>
                </div>
                <div className="text-[18px] md:text-[24px]">{ceremony.yearNumber}</div>
                <div className="text-xs uppercase tracking-[0.25em] md:text-sm" style={{ color: INK_MUTED }}>{ceremony.lunar}</div>
              </div>
            ) : null}
            <div className="relative flex justify-center">
              <img src={`${BAROQUE_BASE}/hoa-tiet-2.webp`} alt="" aria-hidden className="h-auto w-[380px] object-contain md:w-[680px]" />
            </div>
          </section>

          {/* ALBUM */}
          {gallery.length > 0 ? (
            <section className="flex w-full flex-col items-center gap-6">
              <BaroqueHeading>Album Ảnh Cưới</BaroqueHeading>
              <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={GOLD} />
            </section>
          ) : null}

          {/* RECEPTION INFO + calendar + countdown */}
          <section className="relative flex w-full flex-col items-center gap-3">
            <img src={`${BAROQUE_BASE}/hoa.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-30 right-0 -z-10 h-[700px] w-auto max-w-none object-contain opacity-[0.17] md:-top-150 md:right-[20%] md:h-[900px]" />
            <BaroqueHeading>Thông Tin Tiệc Cưới</BaroqueHeading>
            <p className="mt-2 text-center text-[16px] uppercase md:text-[20px]">Tiệc cưới sẽ diễn ra vào lúc:</p>
            <div className="text-[20px] font-semibold md:text-[30px]" style={{ color: GOLD_DARK }}>{venue.banquetTime || couple.time}</div>
            {reception ? (
              <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                <span>{reception.weekday}</span><span>/</span><span>{reception.day}</span><span>/</span><span>Tháng {reception.month}</span>
              </div>
            ) : null}
            {reception ? <div className="text-[18px] md:text-[24px]">{reception.yearNumber}</div> : null}
            {reception ? <div className="text-xs uppercase tracking-[0.25em] md:text-base" style={{ color: INK_MUTED }}>{reception.lunar}</div> : null}

            <div className="mt-4 flex flex-col items-center">
              <h3 className="text-[18px] uppercase tracking-wide md:text-[20px]" style={{ color: GOLD_DARK }}>Cùng đếm ngược</h3>
              <BaroqueCountdown target={`${couple.date}T${couple.time || "18:00"}`} />
            </div>

            {/* calendar framed by khung-lich */}
            {calendar ? (
              <div className="relative mx-auto mt-8 aspect-[388/332] w-full max-w-[340px] md:mt-10 md:max-w-[420px]">
                <img src={`${BAROQUE_BASE}/khung-lich.webp`} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
                <div className="relative flex h-full w-full flex-col items-center justify-center px-8 py-6">
                  <p className="text-[12px] font-semibold uppercase tracking-wide md:text-[13px]" style={{ color: GOLD_DARK }}>Tháng {calendar.month} / {calendar.year}</p>
                  <div className="mt-2 grid w-full grid-cols-7 text-[10px] font-medium opacity-70 md:text-[11px]">
                    {WEEKDAY_LABELS.map((d) => (<span key={d} className="py-0.5 text-center">{d}</span>))}
                  </div>
                  <div className="grid w-full grid-cols-7 gap-y-0.5 text-[11px] md:text-[12px]">
                    {calendar.cells.map((day, i) => (
                      <span key={i} className={`flex aspect-square items-center justify-center rounded-full ${day === calendar.highlight ? "font-bold text-white" : ""}`} style={day === calendar.highlight ? { backgroundColor: GOLD } : undefined}>{day ?? ""}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <a href={googleCalendarUrl(content)} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center rounded-full border px-6 py-2 text-sm font-semibold transition" style={{ borderColor: GOLD, color: GOLD_DARK }}>Thêm vào lịch</a>

            <div className="relative flex justify-center pt-6 md:pt-8">
              <img src={`${BAROQUE_BASE}/hoa-tiet-2.webp`} alt="" aria-hidden className="h-auto w-[450px] object-contain md:w-[730px]" />
            </div>
          </section>

          {/* VENUE MAP */}
          {mapQuery ? (
            <section className="flex w-full flex-col items-center gap-3 text-center">
              <h3 className="text-[20px] font-bold uppercase md:text-[24px]" style={{ color: GOLD_DARK }}>Tiệc cưới sẽ tổ chức tại</h3>
              <p className="mx-auto mt-1 max-w-sm whitespace-pre-line text-sm leading-6 md:max-w-[500px]">{venue.address}</p>
              <div className="mt-4 w-full overflow-hidden rounded-2xl border" style={{ borderColor: hexToRgba(GOLD, 0.4) }}>
                <InvitationMap query={mapQuery} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <MapDirectionsButton query={mapQuery} style={{ color: GOLD_DARK }} />
            </section>
          ) : null}

          {/* DRESS CODE */}
          <section className="flex w-full flex-col items-center gap-4">
            <BaroqueHeading>Dress Code</BaroqueHeading>
            <p className="text-center text-sm opacity-70 md:text-base" style={{ color: INK_MUTED }}>Trang phục dự tiệc</p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <div className="h-10 w-10 rounded-full shadow-md md:h-12 md:w-12" style={{ backgroundColor: GOLD }} />
              <div className="h-10 w-10 rounded-full shadow-md md:h-12 md:w-12" style={{ backgroundColor: GOLD_DARK }} />
              <div className="h-10 w-10 rounded-full shadow-md md:h-12 md:w-12" style={{ backgroundColor: CREAM, border: `1.5px solid ${hexToRgba(GOLD, 0.4)}` }} />
            </div>
          </section>

          {/* SCHEDULE */}
          {schedule.length > 0 ? (
            <section className="relative flex w-full flex-col items-center gap-6">
              <img src={`${BAROQUE_BASE}/tru.webp`} alt="" aria-hidden className="pointer-events-none absolute top-[70px] bottom-[20px] left-6 -z-10 h-auto w-[36px] object-contain opacity-60 md:left-12 md:w-[48px]" />
              <BaroqueHeading>Lịch Trình Ngày Cưới</BaroqueHeading>
              <ol className="mx-auto flex w-full max-w-sm flex-col gap-4">
                {schedule.map((s, i) => (
                  <li key={`${s.time}-${i}`} className="flex items-baseline gap-4">
                    <span className="w-[64px] shrink-0 pt-0.5 text-right text-[16px] tabular-nums tracking-wide md:text-[17px]" style={{ color: GOLD_DARK }}>{s.time}</span>
                    <span className="text-[16px] font-medium leading-tight md:text-[18px]">{s.label}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* WISHES */}
          <section className="relative w-full">
            <img src={`${BAROQUE_BASE}/hoa.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-82 left-0 -z-10 h-[700px] w-auto max-w-none object-contain opacity-[0.17] md:-top-120 md:left-50 md:h-[800px]" />
            <div className="text-center"><BaroqueHeading>Sổ Lưu Bút</BaroqueHeading></div>
            <SharedWishForm accent={GOLD} />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                {wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-xs" style={{ borderColor: hexToRgba(GOLD, 0.25), backgroundColor: "#ffffff" }}>
                    <div className="flex items-start justify-between">
                      <span className="font-semibold" style={{ color: GOLD_DARK }}>{w.name}</span>
                      <span className="text-xs opacity-70">{formatWishTime(w.time)}</span>
                    </div>
                    <p className="mt-2 leading-relaxed">{w.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          {/* PHONG BAO GIFT */}
          {banks.length > 0 ? (
            <section className="flex w-full flex-col items-center gap-4">
              <BaroqueHeading>Phong Bao Mừng Cưới</BaroqueHeading>
              <button data-testid="gift-envelope" type="button" aria-label="Mở phong bao mừng cưới" onClick={() => setGiftOpen(true)} className="group relative cursor-pointer border-none bg-transparent outline-none" style={{ width: 200, height: 256 }}>
                <TemplateGiftArtwork templateSlug={content.slug} />
                <p className="nhat-binh-hint-text absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium" style={{ color: INK_MUTED }}>Nhấn để mở</p>
              </button>
            </section>
          ) : null}
        </div>

        {/* FOOTER */}
        <div className="pointer-events-none relative h-28 overflow-hidden md:h-40">
          <img src={`${BAROQUE_BASE}/hoa-tiet-2.webp`} alt="" aria-hidden className="absolute left-1/2 top-1/2 h-auto w-[520px] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.1] md:w-[720px]" />
        </div>
        <footer data-template-footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 text-center">
          <span className="text-[12px] md:text-[15px] lg:text-[18px]" style={{ color: GOLD_DARK }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: GOLD_DARK }}>♡ thiepmungonline.com</a>
        </div>
      </div>

      {/* GIFT MODAL */}
      {giftOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setGiftOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto sm:max-w-xl" style={{ backgroundColor: CREAM }} onClick={(e) => e.stopPropagation()}>
            <div className="relative px-6 pb-4 pt-6 text-center" style={{ backgroundColor: GOLD_DARK }}>
              <button type="button" onClick={() => setGiftOpen(false)} aria-label="Đóng" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/20 hover:text-white">✕</button>
              <h2 className="text-[20px] font-bold uppercase tracking-wide text-white md:text-[24px]">Phong Bao Mừng Cưới</h2>
            </div>
            <div className="p-4 sm:p-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-center" style={{ color: INK }}>
                {banks.map((q) => {
                  const qr = buildVietQrImageUrl({ bank: q.bank, accountNumber: q.num, accountName: q.name });
                  return (
                    <div key={q.label} className="flex max-w-[180px] flex-1 flex-col items-center sm:max-w-none">
                      <h3 className="mb-2 line-clamp-2 flex min-h-[2rem] items-start justify-center text-center text-xs font-medium" style={{ color: GOLD_DARK }}>{q.label}</h3>
                      <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-white p-2 shadow-lg sm:h-40 sm:w-40" style={{ border: `2px solid ${hexToRgba(GOLD, 0.2)}` }}>
                        <img alt={`QR - ${q.label}`} className="h-full w-full object-contain" src={qr} />
                      </div>
                      <div className="mt-2 space-y-0.5 text-center">
                        <p className="text-[10px]">{q.bank}</p>
                        <p className="font-mono text-[10px]">{q.num}</p>
                        <p className="text-[10px] font-semibold">{q.name}</p>
                      </div>
                      <a href={`${qr}&download=1`} download className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium" style={{ color: GOLD_DARK, backgroundColor: hexToRgba(GOLD, 0.1) }}>Lưu QR</a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
