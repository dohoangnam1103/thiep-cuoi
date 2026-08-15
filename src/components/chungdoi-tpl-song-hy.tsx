"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { TemplateGiftArtwork } from "@/components/chungdoi-gift-envelope-artwork";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { invitationCeremonyMessage, invitationHeroImage, invitationOpeningMessage, orderedCouple, orderByBrideFirst } from "@/lib/invitation-display";
import { useWishFormBinding } from "@/components/chungdoi-live-forms";
import {
  buildCalendar,
  buildVietQrImageUrl,
  formatDate,
  formatWishTime,
  googleCalendarUrl,
  hexToRgba,
  AlbumGallery,
  Lightbox,
  InvitationMap,
  MapDirectionsButton,
  SharedCarousel,
  useLightbox,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";

const SHR = "/chungdoi/images/themes/song-hy-red";
const SHG = "/chungdoi/images/themes/song-hy-green";

type SongHyPalette = {
  accent: string;
  cardBg: string;
  bandText: string;
  gray: string;
  sunburstFilter: string;
  chuHyFilter: string;
  arcFill: string;
  starSrc: string | null;
  modalBg: string;
  albumCarousel: boolean;
  showCountdown: boolean;
};

const SONG_HY_GREEN: SongHyPalette = {
  accent: "#1F3A25",
  cardBg: "#FFF7EB",
  bandText: "#e8f0e4",
  gray: "#666666",
  sunburstFilter: "hue-rotate(100deg) saturate(0.6) brightness(0.7)",
  chuHyFilter: "hue-rotate(100deg) saturate(0.7)",
  arcFill: "#e8f0e4",
  starSrc: `${SHG}/star.webp`,
  modalBg: "rgb(220, 235, 222)",
  albumCarousel: false,
  showCountdown: true,
};

const SONG_HY_RED: SongHyPalette = {
  accent: "#800000",
  cardBg: "#FFF7EB",
  bandText: "#FFEED2",
  gray: "#666666",
  sunburstFilter: "none",
  chuHyFilter: "none",
  arcFill: "#ffeed2",
  starSrc: null,
  modalBg: "rgb(245, 224, 224)",
  albumCarousel: true,
  showCountdown: false,
};

function givenName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 3 ? parts.slice(-2).join(" ") : parts.join(" ");
}

function SongHyBand({ palette, children }: { palette: SongHyPalette; children: React.ReactNode }) {
  return (
    <div className="w-full py-3 md:py-4" style={{ backgroundColor: palette.accent }}>
      <h2 className="flex flex-col items-center text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: palette.bandText, fontFamily: '"Times New Roman", serif' }}>
        {children}
      </h2>
    </div>
  );
}

function SongHyWishForm({ palette }: { palette: SongHyPalette }) {
  const { formProps, pending, state } = useWishFormBinding();

  return (
    <form {...formProps} className="mx-auto mt-6 w-full max-w-full md:max-w-[600px]">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-4">
          <input name="name" required maxLength={120} placeholder="Nhập tên của bạn*" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-200" type="text" />
        </div>
        <textarea name="text" required maxLength={1000} placeholder="Nhập lời chúc của bạn*" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-200" rows={4} style={{ resize: "none" }} />
        {state?.error ? <p className="mt-2 text-sm text-red-600">{state.error}</p> : null}
        {state?.ok ? <p className="mt-2 text-sm" style={{ color: palette.accent }}>Cảm ơn lời chúc của bạn!</p> : null}
        <div className="mt-4 flex items-center justify-end text-xs">
          <button type="submit" disabled={pending} className="rounded-full px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-60 sm:px-8 sm:py-3 sm:text-base" style={{ backgroundColor: palette.accent }}>{pending ? "ĐANG GỬI..." : "GỬI LỜI CHÚC"}</button>
        </div>
      </div>
    </form>
  );
}

function SongHyFamilyColumn({ palette, title, a, b, addr }: { palette: SongHyPalette; title: string; a: string; b: string; addr: string }) {
  return (
    <div className="flex min-w-0 max-w-[160px] flex-1 flex-col items-center gap-1 text-center md:max-w-[280px]">
      <span className="text-[14px] md:text-[15px]" style={{ color: palette.gray }}>{title}</span>
      {/* Không dùng whitespace-nowrap: thẻ thiệp có overflow-hidden nên tên dài
          sẽ bị cắt mất chữ ở hai bên cột hẹp trên mobile. */}
      <span className="font-semibold" style={{ color: palette.accent, fontSize: 15 }}>{a}</span>
      <span className="font-semibold" style={{ color: palette.accent, fontSize: 15 }}>{b}</span>
      {addr ? <div className="mt-1 flex flex-col whitespace-pre-line text-[12px] leading-tight md:text-[13px]" style={{ color: palette.gray }}>{addr}</div> : null}
    </div>
  );
}

function SongHyDateRow({ palette, weekday, day, month }: { palette: SongHyPalette; weekday: string; day: string; month: string }) {
  return (
    <div className="mt-5 flex items-center justify-center">
      <span className="w-[70px] whitespace-nowrap text-right text-[14px] uppercase md:w-[85px] md:text-[15px]" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{weekday}</span>
      <span className="mx-3 h-[25px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: palette.gray }} />
      <span className="text-[32px] md:text-[38px]" style={{ color: palette.accent, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{day}</span>
      <span className="mx-3 h-[25px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: palette.gray }} />
      <span className="w-[70px] whitespace-nowrap text-left text-[14px] uppercase md:w-[85px] md:text-[15px]" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>Tháng {month}</span>
    </div>
  );
}

function SongHyCountdown({ palette, target }: { palette: SongHyPalette; target: string }) {
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
  const targetMs = new Date(target).getTime();
  const diff = now === null ? 0 : Math.max(0, targetMs - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return (
    <div className="mt-2 text-center text-[20px] font-semibold" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>
      <p>{days} ngày {hours} giờ {mins} phút {secs} giây</p>
    </div>
  );
}

/** Faithful rebuild of the Song Hỷ (double-happiness) opened invitation, palette-parametrized for the green and red variants. */
function SongHyInvitation({ content, palette }: { content: ChungDoiDemoContent; palette: SongHyPalette }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const [giftOpen, setGiftOpen] = useState(false);
  useEffect(() => {
    if (!giftOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [giftOpen]);
  const people = orderedCouple(content);
  const wedding = formatDate(couple.date);
  const weekdayUpper = wedding ? wedding.weekday.toUpperCase() : "";
  const calendar = buildCalendar(couple.date);
  const portrait = invitationHeroImage(content);
  const albumShown = gallery.slice(0, 4);
  const albumExtra = Math.max(0, gallery.length - 4);
  const { lightbox, setLightbox } = useLightbox(gallery.length);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const banks = orderByBrideFirst(
    { title: `${couple.brideBirthOrder || "Út Nữ"} - ${content.bank.brideAccountName}`, bank: content.bank.brideBankName, num: content.bank.brideAccountNumber, name: content.bank.brideAccountName },
    { title: `${couple.groomBirthOrder || "Trưởng Nam"} - ${content.bank.groomAccountName}`, bank: content.bank.groomBankName, num: content.bank.groomAccountNumber, name: content.bank.groomAccountName },
    couple.brideFirst,
  ).filter((q) => q.bank);
  const familyColumns = orderByBrideFirst(
    { title: families.brideParentTitle || "Ông Bà", a: families.brideFather, b: families.brideMother, addr: families.brideAddress },
    { title: families.groomParentTitle || "Ông Bà", a: families.groomFather, b: families.groomMother, addr: families.groomAddress },
    couple.brideFirst,
  );

  return (
    <div className="relative isolate flex w-full max-w-[480px] flex-col overflow-hidden overflow-x-clip md:mx-auto md:max-w-[900px] md:border" style={{ backgroundColor: palette.cardBg, borderColor: hexToRgba(palette.accent, 0.13) }}>
      <header className="relative w-full overflow-hidden pb-[100px] md:pb-[130px]" style={{ backgroundColor: palette.cardBg }}>
        <div className="pointer-events-none absolute left-1/2 top-0 aspect-square w-[min(671px,130vw)] -translate-x-1/2 -translate-y-1/2 md:w-[min(872px,100%)]" aria-hidden="true">
          <img alt="" className="h-full w-full" src={`${SHR}/sunburst.svg`} style={{ filter: palette.sunburstFilter }} />
        </div>
        <p className="relative z-10 px-4 pt-10 text-center text-[11px] uppercase tracking-[0.35em] md:pt-[52px] md:text-[14px]" style={{ color: palette.bandText, fontFamily: '"Cormorant Garamond", "Times New Roman", serif', textShadow: `${palette.accent} 0px 1px 4px` }}>WELCOME TO OUR WEDDING</p>
        <div className="relative z-10 mx-auto mt-3 flex w-full max-w-[872px] items-center justify-center gap-4 px-4 md:mt-4 md:gap-5 md:px-10">
          <div className="min-w-0 flex-1 text-center">
            <p className="mb-1 text-[11px] md:text-[14px]" style={{ color: palette.bandText, fontFamily: '"Avenir Next", sans-serif', textShadow: `${palette.accent} 0px 1px 4px` }}>{people[0].birthOrder}</p>
            <p className="whitespace-nowrap uppercase" style={{ fontSize: 23, color: palette.bandText, fontFamily: '"Big Caslon", Baskerville, "Times New Roman", serif', textShadow: `${palette.accent} 0px 1px 4px` }}>{givenName(people[0].fullName)}</p>
          </div>
          <div className="flex w-[64px] shrink-0 items-center justify-center md:w-[83px]">
            <img alt="" className="h-[64px] w-[64px] object-contain md:h-[83px] md:w-[83px]" src={`${SHR}/chu-hy.webp`} style={{ filter: palette.chuHyFilter }} />
          </div>
          <div className="min-w-0 flex-1 text-center">
            <p className="mb-1 text-[11px] md:text-[14px]" style={{ color: palette.bandText, fontFamily: '"Avenir Next", sans-serif', textShadow: `${palette.accent} 0px 1px 4px` }}>{people[1].birthOrder}</p>
            <p className="whitespace-nowrap uppercase" style={{ fontSize: 23, color: palette.bandText, fontFamily: '"Big Caslon", Baskerville, "Times New Roman", serif', textShadow: `${palette.accent} 0px 1px 4px` }}>{givenName(people[1].fullName)}</p>
          </div>
        </div>
        <div className="relative z-10 mt-2 flex justify-center px-6 md:mt-3">
          <div className="relative mx-auto w-full max-w-[286px] md:max-w-[372px]">
            <div className="relative w-full translate-y-[50px] md:translate-y-[73px]">
              <div className="relative aspect-[286/481] w-full">
                <div className="absolute inset-0 overflow-hidden rounded-t-full bg-[#d9d9d9]">
                  {portrait ? <img alt="" className="h-full w-full object-cover" src={portrait} /> : null}
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 aspect-[2/1] w-full overflow-visible">
                  <div className="pointer-events-none absolute inset-0 size-full -translate-y-5 md:-translate-y-[15px] lg:-translate-y-[20px]" aria-label="LOVE NEVER FAILS">
                    <svg className="h-full w-full overflow-visible" viewBox="0 0 286 143" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
                      <defs>
                        <path id="lnf-arc" d="M -6.84 143 A 149.84 149.84 0 0 1 292.84 143" fill="none" />
                      </defs>
                      <text fill={palette.arcFill} fontSize="18" fontFamily='"Cormorant Garamond", "Times New Roman", serif' letterSpacing="0.22em" dominantBaseline="central">
                        <textPath href="#lnf-arc" startOffset="50%" textAnchor="middle" method="align" spacing="auto">LOVE NEVER FAILS</textPath>
                      </text>
                      {palette.starSrc ? (
                        <>
                          <image href={palette.starSrc} x="14.15" y="46.39" width="16" height="16" opacity="0.9" />
                          <image href={palette.starSrc} x="255.85" y="46.39" width="16" height="16" opacity="0.9" />
                        </>
                      ) : null}
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <SongHyBand palette={palette}>THÔNG TIN LỄ CƯỚI</SongHyBand>
      <div className="relative w-full overflow-hidden" style={{ backgroundColor: palette.cardBg }}>
        <div className="relative z-10">
          {/* Mobile: hai họ xếp thành hai dòng để mỗi tên có trọn chiều rộng thẻ,
              không bị cắt bởi overflow-hidden của khung ngoài. */}
          <div className="mt-6 flex w-full flex-col items-center gap-6 px-2 sm:px-4 md:flex-row md:items-start md:justify-center md:gap-8">
            <SongHyFamilyColumn palette={palette} {...familyColumns[0]} />
            <div className="h-px w-16 self-center md:h-[60px] md:w-px" style={{ backgroundColor: palette.accent }} />
            <SongHyFamilyColumn palette={palette} {...familyColumns[1]} />
          </div>
          <div className="mt-8 flex flex-col gap-2 px-4 text-center text-[16px] uppercase tracking-wider md:text-[20px]" style={{ whiteSpace: "pre-line", color: palette.accent, fontFamily: 'Baskerville, "Times New Roman", serif' }}>
            {invitationOpeningMessage(content)}
          </div>
          <div className="relative mb-6 mt-4 flex flex-col items-center gap-3 text-center md:gap-4">
            <h3 className="font-qellia flex w-full items-center justify-center leading-[1.15] md:leading-[100px]" style={{ fontSize: "clamp(34px, 9vw, 64px)", color: palette.accent, wordBreak: "keep-all" }}>{people[0].fullName}</h3>
            <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{people[0].birthOrder}</div>
            <div className="font-qellia text-[30px] md:text-[35px]" style={{ color: palette.gray }}>&amp;</div>
            <h3 className="font-qellia flex w-full items-center justify-center leading-[1.15] md:leading-[100px]" style={{ fontSize: "clamp(34px, 9vw, 64px)", color: palette.accent, wordBreak: "keep-all" }}>{people[1].fullName}</h3>
            <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{people[1].birthOrder}</div>
          </div>
          <div className="flex w-full flex-col items-center justify-center px-4 py-8 sm:px-6" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>
            <div style={{ color: palette.accent }}>
              <span className="flex flex-col items-center whitespace-pre-line text-center text-[16px] leading-relaxed md:text-[20px]">{invitationCeremonyMessage(content)}</span>
            </div>
            {couple.ceremonyTime ? <p className="mt-2 text-center text-[14px] uppercase md:text-[15px]" style={{ color: palette.gray }}>VÀO LÚC {couple.ceremonyTime}</p> : null}
            {wedding ? <SongHyDateRow palette={palette} weekday={weekdayUpper} day={wedding.day} month={wedding.month} /> : null}
            {wedding ? <div className="mt-2 text-center text-[20px] md:text-[22px]" style={{ color: palette.gray }}>{wedding.yearNumber}</div> : null}
            {wedding ? <div className="mt-2 text-center text-[13px] uppercase tracking-wide md:text-[14px]" style={{ color: palette.gray }}>{wedding.lunar}</div> : null}
          </div>
        </div>
      </div>

      {albumShown.length > 0 ? (
        <>
          <SongHyBand palette={palette}>Album Ảnh Cưới</SongHyBand>
          <div className="relative w-full overflow-hidden" style={{ backgroundColor: palette.cardBg }}>
            <div className="relative z-10 mx-auto w-full max-w-lg px-2 py-4 sm:px-4">
              {(content.albumLayout ?? "grid") !== "grid" ? (
                <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={palette.accent} gridAspect="aspect-square" />
              ) : palette.albumCarousel ? (
                <div className="relative mx-auto aspect-[3/4] w-full max-w-[400px] overflow-hidden rounded-lg">
                  <SharedCarousel photos={gallery} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {albumShown.map((src, i) => (
                    <button key={src} type="button" onClick={() => setLightbox(i)} className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg">
                      <img alt={`Wedding photo ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" src={src} />
                      {i === albumShown.length - 1 && albumExtra > 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <span className="text-lg font-semibold text-white">+{albumExtra}</span>
                        </div>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}

      <Lightbox gallery={gallery} index={lightbox} setIndex={setLightbox} accent={palette.accent} />

      <SongHyBand palette={palette}>THÔNG TIN TIỆC CƯỚI</SongHyBand>
      <div className="relative w-full overflow-hidden" style={{ backgroundColor: palette.cardBg }}>
        <div className="relative z-10 -mt-[1px] flex w-full flex-col items-center justify-center px-2 pb-8 pt-6 sm:px-4">
          <h3 className="flex flex-col items-center text-center text-[16px] uppercase md:text-[20px]" style={{ color: palette.accent, fontFamily: 'Baskerville, "Times New Roman", serif' }}>Tiệc cưới sẽ diễn ra vào lúc:</h3>
          <div className="mt-2 text-center text-[20px] font-semibold md:text-[24px]" style={{ color: palette.accent, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{venue.banquetTime || couple.time}</div>
          {wedding ? <SongHyDateRow palette={palette} weekday={weekdayUpper} day={wedding.day} month={wedding.month} /> : null}
          {wedding ? <div className="mt-2 text-center text-[20px] md:text-[22px]" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{wedding.yearNumber}</div> : null}
          <div className="mt-2 text-center text-[13px] md:text-[14px]" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{wedding?.lunar}</div>
          <div className="mt-4 flex items-center justify-center gap-8">
            <div className="flex flex-col items-center">
              <span className="text-[11px] uppercase" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>Khai tiệc</span>
              <span className="mt-1 text-[20px] font-semibold" style={{ color: palette.accent, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{venue.banquetTime || couple.time}</span>
            </div>
          </div>
          {palette.showCountdown ? (
            <div className="mt-4 flex flex-col items-center justify-center">
              <h2 className="flex flex-col items-center text-center text-[20px] uppercase" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>Cùng đếm ngược</h2>
              <SongHyCountdown palette={palette} target={`${couple.date}T${couple.time || "18:00"}`} />
            </div>
          ) : null}
          {calendar ? (
            <div className="mx-auto mt-2 w-[296px] max-w-full md:w-[352px]">
              <div className="mx-auto w-full overflow-hidden rounded-lg border" style={{ borderColor: hexToRgba(palette.accent, 0.27), color: palette.accent }}>
                <div className="border-b py-2.5 text-center text-[13px] font-semibold tracking-wide md:text-[14px]" style={{ borderColor: hexToRgba(palette.accent, 0.27) }}>Tháng {calendar.month} / {calendar.year}</div>
                <div className="grid grid-cols-7 border-b-2" style={{ borderColor: palette.accent }}>
                  {WEEKDAY_LABELS.map((d) => (<div key={d} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{d}</div>))}
                </div>
                <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                  {calendar.cells.map((day, i) => (
                    <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                      {day === calendar.highlight ? (
                        <div className="relative flex h-[24px] w-[26px] items-center justify-center md:h-[28px] md:w-[30px]">
                          <svg viewBox="0 0 24 22" className="absolute inset-0 h-full w-full drop-shadow-sm" fill={palette.accent}>
                            <path d="M12 21C12 21 1.5 13.5 1.5 7.5C1.5 4.46 3.96 2 7 2C8.76 2 10.35 2.81 11.4 4.09L12 4.8L12.6 4.09C13.65 2.81 15.24 2 17 2C20.04 2 22.5 4.46 22.5 7.5C22.5 13.5 12 21 12 21Z" />
                          </svg>
                          <span className="relative z-10 text-[11px] font-bold md:text-[12px]" style={{ color: "#fff" }}>{day}</span>
                        </div>
                      ) : day ? (<span className="text-[12px] md:text-[13px]">{day}</span>) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          <a href={googleCalendarUrl(content)} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center justify-center text-sm tracking-wider underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70" style={{ color: palette.accent }}>Thêm vào lịch</a>
        </div>
        <div className="relative z-10 flex w-full flex-col items-center justify-center pb-8 pt-2 md:pb-10 md:pt-2">
          <button type="button" className="inline-flex items-center justify-center rounded-[10px] px-4 py-2 text-sm font-semibold tracking-wider transition-transform hover:scale-[1.03] md:text-base" style={{ backgroundColor: palette.accent, color: palette.bandText, fontFamily: 'Baskerville, "Times New Roman", serif' }}>XÁC NHẬN</button>
        </div>
      </div>

      {mapQuery ? (
        <div className="relative w-full overflow-hidden" style={{ backgroundColor: palette.cardBg }}>
          <section className="relative z-10 flex w-full flex-col items-center pb-8">
            <SongHyBand palette={palette}>Tiệc cưới sẽ tổ chức tại</SongHyBand>
            <div className="mt-6 flex w-[92%] max-w-3xl flex-col items-center whitespace-pre-line break-words rounded-lg p-4 text-center text-sm font-medium md:text-base" style={{ backgroundColor: palette.cardBg, color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{venue.address}</div>
            <div className="relative flex w-full flex-col items-center gap-4 md:gap-5">
              <InvitationMap query={mapQuery} className="mt-4 h-[350px] w-[92%] max-w-3xl rounded-xl md:h-[450px]" title={mapQuery} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
              <MapDirectionsButton query={mapQuery} style={{ color: palette.accent, fontFamily: 'Baskerville, "Times New Roman", serif' }} />
            </div>
          </section>
        </div>
      ) : null}

      {schedule.length > 0 ? (
        <div className="relative z-10 mb-10 mt-10 flex flex-col gap-6 px-4 md:mb-12 md:mt-12 md:gap-8">
          <h2 className="flex flex-col items-center text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: palette.accent, fontFamily: '"Times New Roman", serif' }}>LỊCH TRÌNH NGÀY CƯỚI</h2>
          <ol className="relative mx-auto grid w-full max-w-[460px] grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>
            {schedule.map((s, i) => {
              const isFirst = i === 0;
              const isLast = i === schedule.length - 1;
              const lineClass = isFirst
                ? "absolute left-1/2 w-px -translate-x-1/2 top-1/2 -bottom-8 md:-bottom-10"
                : isLast
                  ? "absolute left-1/2 w-px -translate-x-1/2 -top-8 md:-top-10 bottom-1/2"
                  : "absolute left-1/2 w-px -translate-x-1/2 -top-8 md:-top-10 -bottom-8 md:-bottom-10";
              return (
                <li key={`${s.time}-${i}`} className="contents">
                  <span className="pt-0.5 text-right text-[16px] leading-snug tabular-nums tracking-wide md:text-[17px]" style={{ color: palette.accent, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{s.time}</span>
                  <span aria-hidden="true" className="relative flex items-center justify-center self-stretch">
                    <span className={lineClass} style={{ backgroundColor: hexToRgba(palette.accent, 0.4) }} />
                    <span className="relative block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette.accent, boxShadow: `${hexToRgba(palette.accent, 0.13)} 0px 0px 0px 2px` }} />
                  </span>
                  <span className="pt-0.5 text-left text-[17px] font-medium leading-snug md:text-[19px]" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{s.label}</span>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}

      <SongHyBand palette={palette}>Sổ lưu bút</SongHyBand>
      <div className="relative w-full overflow-hidden" style={{ backgroundColor: palette.cardBg }}>
        <section className="relative z-10 flex w-full flex-col items-center justify-center px-2 py-8 sm:px-4" style={{ color: palette.gray }}>
          <SongHyWishForm palette={palette} />
          <div className="chungdoi-scroll touch-pan-y [-webkit-overflow-scrolling:touch] mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
            {wishes.length > 0 ? (
              wishes.map((w, i) => (
                <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-xs" style={{ borderColor: hexToRgba(palette.accent, 0.2), backgroundColor: "#fff" }}>
                  <div className="flex items-start justify-between">
                    <span className="font-semibold" style={{ color: palette.accent }}>{w.name}</span>
                    <span className="opacity-70">{formatWishTime(w.time)}</span>
                  </div>
                  <p className="mt-2 leading-relaxed">{w.text}</p>
                </div>
              ))
            ) : (
              <p className="flex flex-col items-center text-center text-sm opacity-70">Chưa có lời chúc nào. Hãy là người đầu tiên!</p>
            )}
          </div>
        </section>
      </div>

      <div className="relative w-full overflow-hidden" style={{ backgroundColor: palette.cardBg }}>
        <div className="relative z-10 flex flex-col items-center justify-center py-8">
          <h2 className="mb-4 flex flex-col items-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: palette.accent, fontFamily: 'Baskerville, "Times New Roman", serif' }}>Phong Bao Mừng Cưới</h2>
          <button data-testid="gift-envelope" type="button" aria-label="Mở hộp mừng cưới" onClick={() => setGiftOpen(true)} className="group relative cursor-pointer border-none bg-transparent outline-none" style={{ width: 200, height: 256 }}>
            <TemplateGiftArtwork templateSlug={content.slug} />
            <p className="nhat-binh-hint-text absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium" style={{ color: "rgb(70, 70, 70)" }}>Nhấn để mở</p>
          </button>
        </div>
      </div>

      {giftOpen ? createPortal((
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-3 sm:p-4" onClick={() => setGiftOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto sm:max-w-xl" style={{ backgroundColor: palette.modalBg }} onClick={(e) => e.stopPropagation()}>
            <div className="relative px-6 pb-4 pt-6 text-center" style={{ backgroundColor: palette.accent }}>
              <button type="button" onClick={() => setGiftOpen(false)} aria-label="Đóng" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/20 hover:text-white">✕</button>
              <h2 className="text-[20px] font-bold uppercase tracking-wide text-white md:text-[24px]" style={{ textShadow: "rgba(0, 0, 0, 0.2) 1px 1px 2px", fontFamily: 'Baskerville, "Times New Roman", serif' }}>Phong Bao Mừng Cưới</h2>
            </div>
            <div className="p-4 sm:p-6">
              <div className="flex flex-row flex-wrap items-start justify-center gap-x-10 gap-y-6 sm:gap-x-20" style={{ color: "rgb(70, 70, 70)" }}>
                {banks.map((q) => {
                  const qr = buildVietQrImageUrl({ bank: q.bank, accountNumber: q.num, accountName: q.name });
                  return (
                    <div key={q.title} className="flex w-[42%] max-w-[180px] flex-col items-center sm:w-auto sm:max-w-none">
                      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-white p-2 shadow-lg sm:h-40 sm:w-40" style={{ border: `2px solid ${hexToRgba(palette.accent, 0.125)}` }}>
                        <img alt={`QR - ${q.title}`} className="h-full w-full object-contain" src={qr} />
                      </div>
                      <div className="mt-2 space-y-0.5 text-center">
                        <p className="text-[10px]" style={{ color: "rgb(70, 70, 70)" }}>{q.bank}</p>
                        <p className="font-mono text-[10px]" style={{ color: "rgb(70, 70, 70)" }}>{q.num}</p>
                        <p className="text-[10px] font-semibold" style={{ color: "rgb(70, 70, 70)" }}>{q.name}</p>
                      </div>
                      <a href={`${qr}&download=1`} download className="mt-2.5 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-md transition hover:opacity-90" style={{ backgroundColor: palette.accent }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        Lưu QR
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ), document.body) : null}

      <div data-template-footer className="relative z-10 mx-auto max-w-4xl px-2 py-8 text-center sm:px-4">
        <span className="flex flex-col items-center gap-1 whitespace-pre-line text-xl" style={{ color: palette.gray, fontFamily: 'Baskerville, "Times New Roman", serif' }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
      </div>
      <footer className="flex w-full items-center justify-center py-1.5" style={{ backgroundColor: palette.cardBg }}>
        <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: palette.gray }}>♡ thiepmungonline.com</a>
      </footer>
    </div>
  );
}

export function SongHyGreenInvitation({ content }: { content: ChungDoiDemoContent }) {
  return <SongHyInvitation content={content} palette={SONG_HY_GREEN} />;
}

export function SongHyRedInvitation({ content }: { content: ChungDoiDemoContent }) {
  return <SongHyInvitation content={content} palette={SONG_HY_RED} />;
}
