"use client";

import { useState } from "react";

import { TemplateGiftArtwork } from "@/components/chungdoi-gift-envelope-artwork";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { useWishFormBinding } from "@/components/chungdoi-live-forms";
import {
  buildCalendar,
  buildVietQrImageUrl,
  formatDate,
  formatWishTime,
  googleCalendarUrl,
  hexToRgba,
  AlbumGallery,
  InvitationMap,
  MapDirectionsButton,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";
import { invitationCeremonyMessage, invitationGiftAccounts, orderByBrideFirst, orderedCouple } from "@/lib/invitation-display";

const ROYAL_GOLD = "#E1BC7C";
const ROYAL_GOLD_MUTED = "#C39E5E";
const ROYAL_SERIF = '"Times New Roman", Times, serif';

type RoyalPalette = {
  assetPath: string;
  baseFrom: string;
  baseTo: string;
  btnText: string;
  modalBg: string;
};

const ROYAL_RED_PALETTE: RoyalPalette = {
  assetPath: "/chungdoi/images/themes/royal-red",
  baseFrom: "#3E0001",
  baseTo: "#7A0003",
  btnText: "#3E0001",
  modalBg: "#4a0002",
};

const ROYAL_BLUE_PALETTE: RoyalPalette = {
  assetPath: "/chungdoi/images/themes/royal-blue",
  baseFrom: "#00112E",
  baseTo: "#002875",
  btnText: "#00112E",
  modalBg: "#001b3f",
};

const ROYAL_GREEN_PALETTE: RoyalPalette = {
  assetPath: "/chungdoi/images/themes/royal-green",
  baseFrom: "#001A08",
  baseTo: "#003F1E",
  btnText: "#001A08",
  modalBg: "#002913",
};

function RoyalHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-[24px] font-bold uppercase md:text-[32px]" style={{ color: ROYAL_GOLD, fontFamily: ROYAL_SERIF, letterSpacing: "0.04em" }}>
      {children}
    </h2>
  );
}

function RoyalDateRow({ weekday, day, month }: { weekday: string; day: string; month: string }) {
  return (
    <div className="mt-4 flex items-center justify-center" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>
      <span className="w-[85px] whitespace-nowrap text-right text-[15px] uppercase md:w-[100px] md:text-[16px]" style={{ color: ROYAL_GOLD }}>{weekday}</span>
      <span className="mx-3 h-[28px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: ROYAL_GOLD }} />
      <span className="text-[36px] md:text-[42px]" style={{ color: ROYAL_GOLD }}>{day}</span>
      <span className="mx-3 h-[28px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: ROYAL_GOLD }} />
      <span className="w-[85px] whitespace-nowrap text-left text-[15px] uppercase md:w-[100px] md:text-[16px]" style={{ color: ROYAL_GOLD }}>Tháng {month}</span>
    </div>
  );
}

function RoyalFamilyColumn({ title, a, b, addr }: { title: string; a: string; b: string; addr: string }) {
  return (
    <div className="flex min-w-0 max-w-[170px] flex-1 flex-col items-center gap-1.5 text-center md:max-w-[280px]" style={{ color: ROYAL_GOLD, fontFamily: ROYAL_SERIF }}>
      <span className="text-[15px] md:text-[18px]">{title}</span>
      <span className="text-[18px] font-semibold md:text-[21px]">{a}</span>
      <span className="text-[18px] font-semibold md:text-[21px]">{b}</span>
      {addr ? <div className="mt-1 whitespace-pre-line text-[13px] leading-normal opacity-90 md:text-[15px]">{addr}</div> : null}
    </div>
  );
}

function RoyalWishForm({ btnText }: { btnText: string }) {
  const { formProps, pending, state } = useWishFormBinding();
  return (
    <form {...formProps} className="mx-auto mt-6 w-full max-w-full md:max-w-[600px]">
      <div className="flex flex-col gap-3">
        <input name="name" required maxLength={120} className="w-full rounded-[6px] border px-4 py-2.5 text-[13px] outline-none" style={{ borderColor: hexToRgba(ROYAL_GOLD, 0.35), color: ROYAL_GOLD, backgroundColor: hexToRgba(ROYAL_GOLD, 0.05) }} placeholder="Nhập tên của bạn*" />
        <textarea name="text" rows={3} required maxLength={1000} className="w-full rounded-[6px] border px-4 py-2.5 text-[13px] outline-none" style={{ borderColor: hexToRgba(ROYAL_GOLD, 0.35), color: ROYAL_GOLD, backgroundColor: hexToRgba(ROYAL_GOLD, 0.05) }} placeholder="Nhập lời chúc của bạn*" />
        {state?.error ? <p className="text-[12px] text-red-400">{state.error}</p> : null}
        {state?.ok ? <p className="text-[12px]" style={{ color: ROYAL_GOLD }}>Cảm ơn lời chúc của bạn!</p> : null}
        <div className="mt-1 flex items-center justify-end">
          <button type="submit" disabled={pending} className="rounded-full px-6 py-2 text-[13px] font-semibold uppercase tracking-wider disabled:opacity-60" style={{ backgroundColor: ROYAL_GOLD, color: btnText }}>{pending ? "Đang gửi..." : "Gửi lời chúc"}</button>
        </div>
      </div>
    </form>
  );
}

/** Faithful rebuild of the Royal (Hoàng Kim) opened invitation — dark base + gold frame, palette-parametrized for red/blue/green. */
function RoyalInvitation({ content, palette = ROYAL_RED_PALETTE }: { content: ChungDoiDemoContent; palette?: RoyalPalette }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const RYL = palette.assetPath;
  const BASE_GRADIENT = `linear-gradient(to bottom right, ${palette.baseFrom}, ${palette.baseTo}, ${palette.baseFrom})`;
  const wedding = formatDate(couple.date);
  const ceremony = formatDate(couple.ceremonyDate);
  const weekdayUpper = wedding ? wedding.weekday.toUpperCase() : "";
  const ceremonyWeekdayUpper = ceremony ? ceremony.weekday.toUpperCase() : "";
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const [giftOpen, setGiftOpen] = useState(false);

  const banks = invitationGiftAccounts(content).map((account) => ({
    title: account.name,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));
  const familyColumns = orderByBrideFirst(
    { title: families.brideParentTitle || "Ông Bà", a: families.brideFather, b: families.brideMother, addr: families.brideAddress },
    { title: families.groomParentTitle || "Ông Bà", a: families.groomFather, b: families.groomMother, addr: families.groomAddress },
    couple.brideFirst,
  );

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div
        className="relative isolate w-full max-w-[480px] overflow-hidden md:mx-auto md:max-w-[900px] md:border"
        style={{ background: BASE_GRADIENT, color: ROYAL_GOLD, fontFamily: ROYAL_SERIF, borderColor: hexToRgba(ROYAL_GOLD, 0.2) }}
      >
        {/* faint background texture */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url("${RYL}/background.webp")` }} aria-hidden="true" />

        {/* header — gold frame + flower + couple names */}
        <header className="relative z-10 flex flex-col items-center justify-center px-6 pb-10 pt-16 text-center md:pt-20">
          <img alt="" aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 w-[70%] max-w-[360px] -translate-x-1/2 opacity-25" src={`${RYL}/flower.webp`} />
          <div className="relative z-10 flex flex-col items-center gap-1" style={{ color: ROYAL_GOLD }}>
            <span className="font-qellia leading-tight" style={{ fontSize: 56 }}>{people[0].shortName}</span>
            <span className="font-qellia text-[28px] md:text-[34px]">&amp;</span>
            <span className="font-qellia leading-tight" style={{ fontSize: 56 }}>{people[1].shortName}</span>
          </div>
          {wedding ? (
            <p className="relative z-10 mt-4 text-[16px] tracking-wide md:text-[18px]" style={{ color: ROYAL_GOLD_MUTED, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{wedding.dayNumber} tháng {wedding.monthNumber}, {wedding.yearNumber}</p>
          ) : null}
        </header>

        <div className="relative z-10 flex w-full flex-col items-center gap-14 px-4 pb-14 md:px-10">
          {/* CEREMONY INFO — families */}
          <div className="flex w-full flex-col items-center gap-8">
            <RoyalHeading>Thông tin lễ cưới</RoyalHeading>
            <div className="flex w-full flex-col items-center gap-6 md:flex-row md:items-start md:justify-center md:gap-10">
              <RoyalFamilyColumn {...familyColumns[0]} />
              <div className="h-px w-16 self-center md:h-[70px] md:w-px" style={{ backgroundColor: hexToRgba(ROYAL_GOLD, 0.4) }} />
              <RoyalFamilyColumn {...familyColumns[1]} />
            </div>
            <div className="whitespace-pre-line text-center text-[16px] uppercase leading-relaxed tracking-wide md:text-[20px]" style={{ color: ROYAL_GOLD }}>
              {couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI."}
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="font-qellia leading-[1.1]" style={{ fontSize: 60, color: ROYAL_GOLD }}>{people[0].fullName}</h3>
              <div className="font-qellia text-[32px] md:text-[40px]" style={{ color: ROYAL_GOLD_MUTED }}>&amp;</div>
              <h3 className="font-qellia leading-[1.1]" style={{ fontSize: 60, color: ROYAL_GOLD }}>{people[1].fullName}</h3>
            </div>
            {/* ceremony date */}
            <div className="flex flex-col items-center gap-2 text-center" style={{ color: ROYAL_GOLD }}>
              <span className="whitespace-pre-line text-[16px] leading-relaxed md:text-[20px]">{invitationCeremonyMessage(content)}</span>
              {couple.ceremonyTime ? <p className="text-[14px] uppercase md:text-[15px]" style={{ color: ROYAL_GOLD_MUTED }}>Vào lúc {couple.ceremonyTime}</p> : null}
              {ceremony ? <RoyalDateRow weekday={ceremonyWeekdayUpper} day={ceremony.day} month={ceremony.month} /> : null}
              {ceremony ? <div className="mt-1 text-[20px] md:text-[22px]" style={{ color: ROYAL_GOLD_MUTED }}>{ceremony.yearNumber}</div> : null}
              {ceremony ? <div className="text-xs opacity-75 md:text-sm" style={{ color: ROYAL_GOLD_MUTED }}>{ceremony.lunar}</div> : null}
            </div>
          </div>

          {/* Album */}
          {gallery.length > 0 ? (
            <div className="flex w-full flex-col items-center gap-6">
              <RoyalHeading>Album ảnh cưới</RoyalHeading>
              <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={ROYAL_GOLD} gridAspect="aspect-square" />
            </div>
          ) : null}

          {/* Reception info */}
          <div className="flex w-full flex-col items-center gap-3">
            <RoyalHeading>Thông tin tiệc cưới</RoyalHeading>
            <p className="mt-2 text-center text-[16px] uppercase md:text-[20px]" style={{ color: ROYAL_GOLD, fontFamily: 'Baskerville, "Times New Roman", serif' }}>Tiệc cưới sẽ diễn ra vào lúc:</p>
            <div className="text-[20px] font-semibold md:text-[24px]" style={{ color: ROYAL_GOLD, fontFamily: 'Baskerville, "Times New Roman", serif' }}>{venue.banquetTime || couple.time}</div>
            {wedding ? <RoyalDateRow weekday={weekdayUpper} day={wedding.day} month={wedding.month} /> : null}
            {wedding ? <div className="mt-1 text-[20px] md:text-[22px]" style={{ color: ROYAL_GOLD_MUTED }}>{wedding.yearNumber}</div> : null}
            {wedding ? <div className="text-xs opacity-75 md:text-sm" style={{ color: ROYAL_GOLD_MUTED }}>{wedding.lunar}</div> : null}

            {/* calendar */}
            {calendar ? (
              <div className="mx-auto mt-4 w-[296px] max-w-full md:w-[352px]">
                <div className="mx-auto w-full overflow-hidden rounded-lg border" style={{ borderColor: hexToRgba(ROYAL_GOLD, 0.3), color: ROYAL_GOLD }}>
                  <div className="border-b py-2.5 text-center text-[13px] font-semibold tracking-wide md:text-[14px]" style={{ borderColor: hexToRgba(ROYAL_GOLD, 0.3) }}>Tháng {calendar.month} / {calendar.year}</div>
                  <div className="grid grid-cols-7 border-b-2" style={{ borderColor: hexToRgba(ROYAL_GOLD, 0.5) }}>
                    {WEEKDAY_LABELS.map((d) => (<div key={d} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{d}</div>))}
                  </div>
                  <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                    {calendar.cells.map((day, i) => (
                      <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                        {day === calendar.highlight ? (
                          <div className="relative flex h-[24px] w-[26px] items-center justify-center md:h-[28px] md:w-[30px]">
                            <svg viewBox="0 0 24 22" className="absolute inset-0 h-full w-full drop-shadow-sm" fill={ROYAL_GOLD}>
                              <path d="M12 21C12 21 1.5 13.5 1.5 7.5C1.5 4.46 3.96 2 7 2C8.76 2 10.35 2.81 11.4 4.09L12 4.8L12.6 4.09C13.65 2.81 15.24 2 17 2C20.04 2 22.5 4.46 22.5 7.5C22.5 13.5 12 21 12 21Z" />
                            </svg>
                            <span className="relative z-10 text-[11px] font-bold md:text-[12px]" style={{ color: palette.btnText }}>{day}</span>
                          </div>
                        ) : day ? (<span className="text-[12px] md:text-[13px]">{day}</span>) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
            <a href={googleCalendarUrl(content)} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center justify-center text-sm tracking-wide underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70" style={{ color: ROYAL_GOLD }}>Thêm vào lịch</a>
            <button type="button" className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full px-7 text-sm font-semibold tracking-wide transition-transform hover:scale-[1.03] md:text-base" style={{ backgroundColor: ROYAL_GOLD, color: palette.btnText, fontFamily: 'Baskerville, "Times New Roman", serif' }}>XÁC NHẬN</button>
          </div>

          {/* map */}
          {mapQuery ? (
            <div className="flex w-full flex-col items-center gap-4">
              <RoyalHeading>Tiệc cưới sẽ tổ chức tại</RoyalHeading>
              <div className="mx-auto max-w-[320px] whitespace-pre-line text-center text-[15px] leading-snug opacity-90 md:max-w-md md:text-[18px]" style={{ color: ROYAL_GOLD }}>{venue.address}</div>
              <InvitationMap query={mapQuery} title={mapQuery} className="mt-2 h-[300px] w-full max-w-[340px] overflow-hidden rounded-2xl md:h-[400px] md:max-w-[560px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              <MapDirectionsButton query={mapQuery} style={{ color: ROYAL_GOLD, fontFamily: ROYAL_SERIF }} />
            </div>
          ) : null}

          {/* schedule */}
          {schedule.length > 0 ? (
            <div className="flex w-full flex-col gap-6">
              <RoyalHeading>Lịch trình ngày cưới</RoyalHeading>
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
                      <span className="pt-0.5 text-right text-[16px] leading-snug tabular-nums tracking-wide md:text-[17px]" style={{ color: ROYAL_GOLD_MUTED }}>{s.time}</span>
                      <span aria-hidden="true" className="relative flex items-center justify-center self-stretch">
                        <span className={lineClass} style={{ backgroundColor: hexToRgba(ROYAL_GOLD, 0.4) }} />
                        <span className="relative block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ROYAL_GOLD, boxShadow: `0 0 0 2px ${hexToRgba(ROYAL_GOLD, 0.2)}` }} />
                      </span>
                      <span className="pt-0.5 text-left text-[17px] font-medium leading-snug md:text-[19px]" style={{ color: ROYAL_GOLD }}>{s.label}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : null}

          {/* guestbook */}
          <section className="mx-auto w-full max-w-[340px] md:max-w-[560px]">
            <RoyalHeading>Sổ lưu bút</RoyalHeading>
            <RoyalWishForm btnText={palette.btnText} />
            <div className="chungdoi-scroll touch-pan-y [-webkit-overflow-scrolling:touch] mx-auto mt-8 max-h-[500px] w-full space-y-3 overflow-y-auto pr-2">
              {wishes.length > 0 ? (
                wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-xl border p-3 text-sm" style={{ borderColor: hexToRgba(ROYAL_GOLD, 0.25), backgroundColor: hexToRgba(ROYAL_GOLD, 0.05) }}>
                    <div className="flex items-start justify-between">
                      <span className="font-semibold" style={{ color: ROYAL_GOLD }}>{w.name}</span>
                      <span className="opacity-60">{formatWishTime(w.time)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-line leading-relaxed" style={{ color: ROYAL_GOLD_MUTED }}>{w.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-base opacity-70 md:text-[17px]">Chưa có lời chúc nào. Hãy là người đầu tiên!</p>
              )}
            </div>
          </section>

          {/* gift box */}
          {banks.length > 0 ? (
            <div className="flex w-full flex-col items-center">
              <RoyalHeading>Phong bì mừng cưới</RoyalHeading>
              <button data-testid="gift-envelope" type="button" aria-label="Mở hộp mừng cưới" onClick={() => setGiftOpen(true)} className="group relative mt-4 cursor-pointer border-none bg-transparent outline-none" style={{ width: 200, height: 240 }}>
                <TemplateGiftArtwork templateSlug={content.slug} />
                <p className="nhat-binh-hint-text absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium" style={{ color: ROYAL_GOLD }}>Nhấn để mở</p>
              </button>
            </div>
          ) : null}

          {giftOpen ? (
            <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={() => setGiftOpen(false)}>
              <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto sm:max-w-xl" style={{ backgroundColor: palette.modalBg }} onClick={(e) => e.stopPropagation()}>
                <div className="relative px-6 pb-4 pt-6 text-center" style={{ backgroundColor: hexToRgba(ROYAL_GOLD, 0.12) }}>
                  <button type="button" aria-label="Đóng" onClick={() => setGiftOpen(false)} className="absolute right-3 top-3 text-white/80 hover:text-white">✕</button>
                  <h2 className="text-[21px] md:text-[26px]" style={{ color: ROYAL_GOLD, fontFamily: ROYAL_SERIF }}>Phong Bao Mừng Cưới</h2>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-center" style={{ color: ROYAL_GOLD }}>
                    {banks.map((q) => {
                      const qr = buildVietQrImageUrl({ bank: q.bank, accountNumber: q.num, accountName: q.name });
                      // An account that cannot produce a QR has nothing to show here.
                      if (!qr) return null;
                      return (
                        <div key={q.title} className="flex max-w-[180px] flex-1 flex-col items-center sm:max-w-none">
                          <h3 className="mb-2 flex min-h-[2rem] items-start justify-center text-center text-xs font-medium" style={{ color: ROYAL_GOLD }}>{q.name}</h3>
                          <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-white p-2 shadow-lg sm:h-40 sm:w-40" style={{ border: `2px solid ${hexToRgba(ROYAL_GOLD, 0.3)}` }}>
                            <img alt={`QR - ${q.name}`} className="h-full w-full object-contain" src={qr} />
                          </div>
                          <div className="mt-2 space-y-0.5 text-center">
                            <p className="text-[10px]">{q.bank}</p>
                            <p className="font-mono text-[10px]">{q.num}</p>
                            <p className="text-[10px] font-semibold">{q.name}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* footer */}
          <footer data-template-footer className="flex w-full flex-col items-center gap-1 text-center">
            <span className="text-[14px] leading-normal md:text-base" style={{ color: ROYAL_GOLD }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
          </footer>
        </div>

        <div className="relative z-20 flex items-center justify-center pb-3 pt-2">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-[14px] opacity-70 transition-opacity hover:opacity-90 md:text-[15px]" style={{ color: ROYAL_GOLD }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}

export function RoyalRedInvitation({ content }: { content: ChungDoiDemoContent }) {
  return <RoyalInvitation content={content} palette={ROYAL_RED_PALETTE} />;
}

export function RoyalBlueInvitation({ content }: { content: ChungDoiDemoContent }) {
  return <RoyalInvitation content={content} palette={ROYAL_BLUE_PALETTE} />;
}

export function RoyalGreenInvitation({ content }: { content: ChungDoiDemoContent }) {
  return <RoyalInvitation content={content} palette={ROYAL_GREEN_PALETTE} />;
}
