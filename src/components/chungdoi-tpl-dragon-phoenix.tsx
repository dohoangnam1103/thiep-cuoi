"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { useWishFormBinding } from "@/components/chungdoi-live-forms";
import {
  buildCalendar,
  buildVietQrImageUrl,
  formatDate,
  formatWishTime,
  googleCalendarUrl,
  hexToRgba,
  Lightbox,
  InvitationMap,
  useLightbox,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";
import { invitationCeremonyMessage, invitationOpeningMessage, orderedCouple, orderByBrideFirst } from "@/lib/invitation-display";

const LPD_UNI = '"UNI Chu truyen thong", "Baskerville", "Times New Roman", serif';
const LPD_BODY = 'Baskerville, "Times New Roman", serif';
const LPD_CN_WEEKDAY = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const LPD_SCHEDULE_CN: Record<string, string> = {
  "Đón khách": "賓客迎接",
  "Khai tiệc": "開席",
  "Rót rượu, cắt bánh": "敬酒、切蛋糕",
  "Phục vụ món chính": "上主菜",
  "Kết thúc tiệc": "宴會結束",
};

/** CHỦ NHẬT/星期日 | 01 | THÁNG 02/2月 bilingual date row for the long-phung-do template. */
function LpdDateRow({ vnWeekday, cnWeekday, day, month, gold, dayClass }: {
  vnWeekday: string;
  cnWeekday: string;
  day: string;
  month: string;
  gold: string;
  dayClass: string;
}) {
  return (
    <div className="flex items-center justify-center gap-4 md:gap-6" style={{ color: gold, fontFamily: LPD_BODY }}>
      <div className="flex flex-col items-center leading-tight">
        <span className="text-[15px] font-semibold uppercase md:text-[18px]">{vnWeekday}</span>
        <span className="text-[12px] opacity-70 md:text-[14px]">{cnWeekday}</span>
      </div>
      <div className="shrink-0" style={{ width: 2, height: 28, backgroundColor: hexToRgba(gold, 0.5) }} />
      <span className={`font-semibold leading-none ${dayClass}`}>{day}</span>
      <div className="shrink-0" style={{ width: 2, height: 28, backgroundColor: hexToRgba(gold, 0.5) }} />
      <div className="flex flex-col items-center leading-tight">
        <span className="text-[15px] font-semibold uppercase md:text-[18px]">Tháng {month}</span>
        <span className="text-[12px] opacity-70 md:text-[14px]">{Number(month)}月</span>
      </div>
    </div>
  );
}

function DragonPhoenixWishForm({ GOLD, BTN_TEXT }: { GOLD: string; BTN_TEXT: string }) {
  const { formProps, pending, state } = useWishFormBinding();

  return (
    <form {...formProps} className="mx-auto mt-6 w-full">
      <div className="rounded-2xl border p-4 md:p-5" style={{ borderColor: hexToRgba(GOLD, 0.35), backgroundColor: hexToRgba(GOLD, 0.06) }}>
        <div className="mb-4">
          <input name="name" required maxLength={120} placeholder="Nhập tên của bạn*" className="w-full rounded-lg border bg-transparent px-4 py-3 text-base focus:outline-none md:py-3.5 md:text-[17px]" type="text" style={{ borderColor: hexToRgba(GOLD, 0.4), color: GOLD }} />
        </div>
        <textarea name="text" required maxLength={1000} placeholder="Nhập lời chúc của bạn*" className="w-full rounded-lg border bg-transparent px-4 py-3 text-base focus:outline-none md:py-3.5 md:text-[17px]" rows={4} style={{ borderColor: hexToRgba(GOLD, 0.4), color: GOLD, resize: "none" }} />
        {state?.error ? <p className="mt-2 text-sm" style={{ color: "#ffb4a2" }}>{state.error}</p> : null}
        {state?.ok ? <p className="mt-2 text-sm" style={{ color: GOLD }}>Cảm ơn lời chúc của bạn!</p> : null}
        <div className="mt-4 flex items-center justify-between">
          <span aria-hidden="true" className="text-xl">🪄</span>
          <button type="submit" disabled={pending} className="rounded-full px-6 py-2.5 text-base font-semibold transition-transform hover:scale-105 disabled:opacity-60 md:px-7 md:text-[17px]" style={{ backgroundColor: GOLD, color: BTN_TEXT }}>{pending ? "Đang gửi..." : "GỬI LỜI CHÚC / 送出祝福"}</button>
        </div>
      </div>
    </form>
  );
}

interface DpPalette {
  assetPath: string;
  gold: string;
  goldMuted: string;
  cardBg: string;
  btnText: string;
  envelope: string;
  showGift: boolean;
}

const DP_RED_PALETTE: DpPalette = {
  assetPath: "/chungdoi/images/themes/dragon-phoenix-red",
  gold: "#e9ce9e",
  goldMuted: "#d9bc86",
  cardBg: "#680e0e",
  btnText: "#553f18",
  envelope: "#8a1220",
  showGift: true,
};

const DP_GREEN_PALETTE: DpPalette = {
  assetPath: "/chungdoi/images/themes/dragon-phoenix-green",
  gold: "#e9ce9e",
  goldMuted: "#d9bc86",
  cardBg: "#162614",
  btnText: "#553f18",
  envelope: "#24401f",
  showGift: false,
};

const DP_BLUE_PALETTE: DpPalette = {
  assetPath: "/chungdoi/images/themes/dragon-phoenix-blue",
  gold: "#e9ce9e",
  goldMuted: "#d9bc86",
  cardBg: "#0A202F",
  btnText: "#553f18",
  envelope: "#123a52",
  showGift: true,
};

const DP_BLACK_PALETTE: DpPalette = {
  assetPath: "/chungdoi/images/themes/dragon-phoenix-black",
  gold: "#FFC662",
  goldMuted: "#e0ac52",
  cardBg: "#0a0a0a",
  btnText: "#553f18",
  envelope: "#1a1a1a",
  showGift: true,
};

/** Faithful rebuild of the Long Phụng (dragon-phoenix) opened invitation — dark base + gold, bilingual VN/中文. */
function DragonPhoenixInvitation({ content, palette = DP_RED_PALETTE }: { content: ChungDoiDemoContent; palette?: DpPalette }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const LPD = palette.assetPath;
  const GOLD = palette.gold;
  const GOLD_MUTED = palette.goldMuted;
  const CARD_BG = palette.cardBg;
  const BTN_TEXT = palette.btnText;
  const ENVELOPE = palette.envelope;
  const people = orderedCouple(content);
  const headerNames = people.map((person) => person.shortName);
  const ceremony = formatDate(couple.ceremonyDate || couple.date);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const galleryShown = gallery.slice(0, 4);
  const galleryExtra = Math.max(0, gallery.length - 4);
  const { lightbox, setLightbox } = useLightbox(gallery.length);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();

  const [bankOpen, setBankOpen] = useState(false);
  useEffect(() => {
    if (!bankOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [bankOpen]);
  const parallaxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = parallaxRef.current;
    if (!root) return;
    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-parallax]"));
    let raf = 0;
    const update = () => {
      raf = 0;
      const scrolled = -root.getBoundingClientRect().top;
      for (const el of layers) {
        const speed = Number(el.dataset.parallax) || 0;
        el.style.transform = `translateY(${(scrolled * speed).toFixed(2)}px)`;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const bankCards = orderByBrideFirst(
    { role: "Cô Dâu / 新娘", bank: content.bank.brideBankName, num: content.bank.brideAccountNumber, name: content.bank.brideAccountName },
    { role: "Chú Rể / 新郎", bank: content.bank.groomBankName, num: content.bank.groomAccountNumber, name: content.bank.groomAccountName },
    couple.brideFirst,
  ).filter((q) => q.bank);
  const familyColumns = orderByBrideFirst(
    { title: families.brideParentTitle || "Ông Bà", father: families.brideFather, mother: families.brideMother, address: families.brideAddress, translatedAddress: "台北市信義區信義路456號" },
    { title: families.groomParentTitle || "Ông Bà", father: families.groomFather, mother: families.groomMother, address: families.groomAddress, translatedAddress: "台北市大安區忠孝東路123號" },
    couple.brideFirst,
  );

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div
        ref={parallaxRef}
        className="relative isolate w-full max-w-[480px] overflow-hidden rounded md:mx-auto md:max-w-[900px] md:border md:border-[#e9ce9e22]"
        style={{ backgroundColor: CARD_BG, color: GOLD, fontFamily: LPD_BODY }}
      >
        {/* header */}
        <header className="relative z-10 flex h-[472px] flex-col items-center justify-center text-center md:h-[650px]">
          <div className="pointer-events-none absolute left-1/2 top-12 flex w-full -translate-x-1/2 justify-center gap-8 opacity-[0.15] md:top-16" aria-hidden="true">
            <img alt="" className="h-[354px] w-auto md:h-[572px]" src={`${LPD}/rong.webp`} />
            <img alt="" className="h-[354px] w-auto md:h-[572px]" src={`${LPD}/phuong.webp`} />
          </div>
          <h1 className="relative z-10 flex flex-col items-center" style={{ fontFamily: LPD_UNI, color: GOLD }}>
            <span className="whitespace-nowrap leading-[75px] md:leading-[105px]" style={{ fontSize: 70 }}>{headerNames[0]}</span>
            <span className="mt-1 text-[37px] md:text-[50px]">&amp;</span>
            <span className="whitespace-nowrap leading-[75px] md:leading-[105px]" style={{ fontSize: 70 }}>{headerNames[1]}</span>
          </h1>
        </header>

        {/* content */}
        <section className="relative z-10 px-4 pb-10 pt-4 md:px-10 md:pb-14">
          <div className="relative z-[2] flex w-full flex-col items-center gap-12 md:gap-16">
            {/* Album ảnh cưới */}
            {galleryShown.length > 0 ? (
              <div className="flex w-full max-w-[478px] flex-col items-center md:max-w-none">
                <h2 className="text-center text-[26px] font-semibold uppercase md:text-[32px]" style={{ color: GOLD, fontFamily: LPD_BODY, letterSpacing: "0.04em" }}>
                  Album Ảnh Cưới <span className="opacity-70">/ 婚禮相冊</span>
                </h2>
                <div className="mt-6 w-full max-w-[390px] md:max-w-[560px]">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {galleryShown.map((src, i) => (
                      <button key={src} type="button" onClick={() => setLightbox(i)} className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border" style={{ borderColor: hexToRgba(GOLD, 0.25) }}>
                        <img alt={`Wedding photo ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" src={src} />
                        {i === galleryShown.length - 1 && galleryExtra > 0 ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                            <span className="text-lg font-semibold text-white">+{galleryExtra}</span>
                          </div>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
                <Lightbox gallery={gallery} index={lightbox} setIndex={setLightbox} accent={GOLD} />
              </div>
            ) : null}

            {/* Thông tin lễ cưới */}
            <h2 className="text-center text-[26px] font-semibold uppercase md:text-[32px]" style={{ color: GOLD, fontFamily: LPD_BODY, letterSpacing: "0.04em" }}>
              Thông tin lễ cưới <span className="opacity-70">/ 婚禮資訊</span>
            </h2>
            <div className="grid w-full max-w-[366px] grid-cols-2 items-start gap-6 text-center md:max-w-[560px] md:gap-10" style={{ color: GOLD, fontFamily: LPD_BODY }}>
              {familyColumns.map((family) => (
                <div key={`${family.father}-${family.mother}`} className="flex flex-col items-center gap-1.5">
                  <span className="text-[15px] md:text-[18px]">{family.title} <span className="opacity-70">/ 先生與女士</span></span>
                  <span className="whitespace-nowrap text-[19px] font-semibold md:text-[21px]">{family.father}</span>
                  <span className="whitespace-nowrap text-[19px] font-semibold md:text-[21px]">{family.mother}</span>
                  <div className="mt-1 w-full max-w-[169px] whitespace-pre-line text-[13px] leading-normal opacity-90 md:max-w-[240px] md:text-[15px]">{family.address}</div>
                  <div className="text-[12px] opacity-60 md:text-[13px]">{family.translatedAddress}</div>
                </div>
              ))}
            </div>

            {/* báo tin */}
            <div className="flex flex-col items-center gap-2 text-center" style={{ color: GOLD }}>
              <div className="flex max-w-[320px] flex-col gap-1 text-[16px] font-semibold leading-snug md:max-w-[460px] md:text-[22px]" style={{ whiteSpace: "pre-line", fontFamily: LPD_BODY }}>
                {invitationOpeningMessage(content)}
              </div>
              <div className="flex flex-col gap-0.5 text-[13px] opacity-70 md:text-[15px]" style={{ whiteSpace: "pre-line" }}>
                謹此敬告{"\n"}我們子女的婚禮
              </div>
            </div>

            {/* couple full names */}
            <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="flex min-h-[80px] w-full items-center justify-center leading-[1.15] md:leading-[100px]" style={{ fontSize: "clamp(34px, 9vw, 64px)", fontFamily: LPD_UNI, color: GOLD, wordBreak: "keep-all" }}>{people[0].fullName}</h3>
              <div className="text-[13px] uppercase opacity-80 md:text-[15px]" style={{ fontFamily: LPD_BODY }}>{people[0].birthOrder}</div>
              <div className="text-[35px] md:text-[48px]" style={{ fontFamily: LPD_UNI, color: GOLD }}>&amp;</div>
              <h3 className="flex min-h-[80px] w-full items-center justify-center leading-[1.15] md:leading-[100px]" style={{ fontSize: "clamp(34px, 9vw, 64px)", fontFamily: LPD_UNI, color: GOLD, wordBreak: "keep-all" }}>{people[1].fullName}</h3>
              <div className="text-[13px] uppercase opacity-80 md:text-[15px]" style={{ fontFamily: LPD_BODY }}>{people[1].birthOrder}</div>
            </div>

            {/* ceremony */}
            <div className="flex flex-col items-center gap-4 text-center" style={{ fontFamily: LPD_BODY, color: GOLD }}>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[15px] font-semibold md:text-[19px]" style={{ whiteSpace: "pre-line" }}>{invitationCeremonyMessage(content)}</span>
                <span className="text-[13px] opacity-70 md:text-[15px]" style={{ whiteSpace: "pre-line" }}>婚禮儀式舉行地點{"\n"}自宅</span>
              </div>
              <p className="text-[15px] font-semibold uppercase md:text-[18px]">Vào lúc <span className="opacity-70">/ 時間</span></p>
              {couple.ceremonyTime ? <div className="text-[20px] md:text-[30px]">{couple.ceremonyTime}</div> : null}
              {ceremony ? (
                <>
                  <LpdDateRow vnWeekday={ceremony.weekday} cnWeekday={LPD_CN_WEEKDAY[(ceremony.dayNumber + new Date(`${couple.ceremonyDate || couple.date}T00:00:00`).getDay() - ceremony.dayNumber + 7) % 7]} day={ceremony.day} month={ceremony.month} gold={GOLD} dayClass="text-[36px] md:text-[46px]" />
                  <div className="text-[22px] font-semibold md:text-[26px]">{ceremony.yearNumber}</div>
                  <div className="text-[14px] opacity-80 md:text-[16px]">{ceremony.lunar}</div>
                </>
              ) : null}
            </div>

            {/* Thông tin tiệc cưới */}
            {reception ? (
              <div className="flex w-full flex-col items-center gap-8" style={{ fontFamily: LPD_BODY, color: GOLD }}>
                <h2 className="text-center text-[26px] font-semibold uppercase md:text-[32px]" style={{ color: GOLD, letterSpacing: "0.04em" }}>
                  Thông tin tiệc cưới <span className="opacity-70">/ 婚宴資訊</span>
                </h2>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[17px] font-semibold md:text-[22px]">Tiệc cưới sẽ diễn ra vào lúc:</span>
                  <span className="text-[13px] opacity-70 md:text-[15px]">婚宴將於以下時間舉行：</span>
                </div>
                <div className="text-[26px] md:text-[38px]">{venue.banquetTime || couple.time}</div>
                <LpdDateRow vnWeekday={reception.weekday} cnWeekday={LPD_CN_WEEKDAY[new Date(`${couple.date}T00:00:00`).getDay()]} day={reception.day} month={reception.month} gold={GOLD} dayClass="text-[38px] md:text-[50px]" />
                <div className="text-[23px] font-semibold md:text-[31px]">{reception.yearNumber}</div>
                <div className="text-[14px] opacity-80 md:text-[16px]">{reception.lunar}</div>
                <div className="flex flex-col items-center">
                  <span className="text-sm uppercase tracking-wider md:text-[15px]">Khai tiệc <span className="opacity-70">/ 開席</span></span>
                  <span className="mt-1 text-xl font-semibold md:text-2xl">{venue.banquetTime || couple.time}</span>
                </div>
                {calendar ? (
                  <div className="mx-auto mt-2 w-[296px] max-w-full md:w-[352px]">
                    <div className="mx-auto w-full overflow-hidden rounded-lg border" style={{ borderColor: hexToRgba(GOLD, 0.3), color: GOLD }}>
                      <div className="border-b py-2.5 text-center text-[13px] font-semibold tracking-wide md:text-[14px]" style={{ borderColor: hexToRgba(GOLD, 0.3) }}>Tháng {calendar.month} / {calendar.year}</div>
                      <div className="grid grid-cols-7 border-b-2" style={{ borderColor: hexToRgba(GOLD, 0.5) }}>
                        {WEEKDAY_LABELS.map((d) => (<div key={d} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{d}</div>))}
                      </div>
                      <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                        {calendar.cells.map((day, i) => (
                          <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                            {day === calendar.highlight ? (
                              <div className="relative flex h-[24px] w-[26px] items-center justify-center md:h-[28px] md:w-[30px]">
                                <svg viewBox="0 0 24 22" className="absolute inset-0 h-full w-full drop-shadow-sm" fill={GOLD}>
                                  <path d="M12 21C12 21 1.5 13.5 1.5 7.5C1.5 4.46 3.96 2 7 2C8.76 2 10.35 2.81 11.4 4.09L12 4.8L12.6 4.09C13.65 2.81 15.24 2 17 2C20.04 2 22.5 4.46 22.5 7.5C22.5 13.5 12 21 12 21Z" />
                                </svg>
                                <span className="relative z-10 text-[11px] font-bold md:text-[12px]" style={{ color: "#333333" }}>{day}</span>
                              </div>
                            ) : day ? (<span className="text-[12px] md:text-[13px]">{day}</span>) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
                <a href={googleCalendarUrl(content)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center text-sm tracking-wide underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70 md:text-base" style={{ color: GOLD }}>Thêm vào lịch <span className="opacity-70">/ 添加到日曆</span></a>
                <button type="button" className="inline-flex min-h-[44px] items-center justify-center rounded-full px-7 py-0 text-sm font-semibold leading-none tracking-wide transition-transform hover:scale-[1.03] md:text-base" style={{ backgroundColor: GOLD, color: BTN_TEXT }}>XÁC NHẬN / 確認出席</button>
              </div>
            ) : null}

            {/* map */}
            {mapQuery ? (
              <section className="relative w-full">
                <div className="text-center">
                  <h3 className="text-[26px] font-semibold uppercase md:text-[32px]" style={{ color: GOLD, letterSpacing: "0.04em" }}>Tiệc cưới sẽ tổ chức tại <span className="opacity-70">/ 婚宴地點</span></h3>
                  <div className="mx-auto mt-2 max-w-[280px] whitespace-pre-line text-center text-[15px] leading-snug opacity-90 md:max-w-md md:text-[18px]" style={{ color: GOLD }}>{venue.address}</div>
                </div>
                <div className="flex w-full flex-col items-center">
                  <InvitationMap query={mapQuery} title={mapQuery} className="mt-4 h-[280px] w-full max-w-[340px] overflow-hidden rounded-2xl md:h-[380px] md:max-w-[560px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
              </section>
            ) : null}

            {/* schedule */}
            {schedule.length > 0 ? (
              <div className="flex w-full flex-col gap-6">
                <h2 className="text-center text-[26px] font-semibold uppercase md:text-[32px]" style={{ color: GOLD, letterSpacing: "0.04em" }}>Lịch trình ngày cưới <span className="opacity-70">/ 婚禮當日流程</span></h2>
                <ol className="relative mx-auto grid w-full max-w-[460px] grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10">
                  {schedule.map((s, i) => (
                    <li key={`${s.time}-${i}`} className="contents">
                      <span className="pt-0.5 text-right text-[16px] tabular-nums leading-snug tracking-wide md:text-[17px]" style={{ color: GOLD_MUTED }}>{s.time}</span>
                      <span aria-hidden="true" className="relative flex items-center justify-center self-stretch">
                        {i > 0 ? <span className="absolute left-1/2 -top-8 h-8 w-px -translate-x-1/2 md:-top-10" style={{ backgroundColor: hexToRgba(GOLD, 0.4) }} /> : null}
                        <span className="relative block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: GOLD, boxShadow: `0 0 0 2px ${hexToRgba(GOLD, 0.2)}` }} />
                        {i < schedule.length - 1 ? <span className="absolute bottom-1/2 left-1/2 top-1/2 w-px -translate-x-1/2 md:-bottom-10" style={{ backgroundColor: hexToRgba(GOLD, 0.4) }} /> : null}
                      </span>
                      <span className="flex flex-col pt-0.5 text-left leading-snug">
                        <span className="text-[17px] font-medium md:text-[19px]" style={{ color: GOLD }}>{s.label}</span>
                        {LPD_SCHEDULE_CN[s.label] ? <span className="text-[13px] opacity-70 md:text-[14px]" style={{ color: GOLD }}>{LPD_SCHEDULE_CN[s.label]}</span> : null}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {/* guestbook */}
            <section className="mx-auto w-full max-w-[338px] md:max-w-[560px]" style={{ color: GOLD }}>
              <div className="text-center">
                <h2 className="text-[26px] font-semibold uppercase md:text-[32px]" style={{ color: GOLD, letterSpacing: "0.04em" }}>Sổ lưu bút <span className="opacity-70">/ 賓客留言</span></h2>
              </div>
              <DragonPhoenixWishForm GOLD={GOLD} BTN_TEXT={BTN_TEXT} />
              <div className="chungdoi-scroll touch-pan-y [-webkit-overflow-scrolling:touch] mx-auto mt-8 max-h-[500px] w-full space-y-3 overflow-y-auto pr-2">
                {wishes.length > 0 ? (
                  wishes.map((w, i) => (
                    <div key={`${w.name}-${i}`} className="rounded-xl border p-3 text-sm" style={{ borderColor: hexToRgba(GOLD, 0.25), backgroundColor: hexToRgba(GOLD, 0.05) }}>
                      <div className="flex items-start justify-between">
                        <span className="font-semibold" style={{ color: GOLD }}>{w.name}</span>
                        <span className="opacity-60">{formatWishTime(w.time)}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-line leading-relaxed" style={{ color: GOLD_MUTED }}>{w.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-base opacity-70 md:text-[17px]">Chưa có lời chúc nào. Hãy là người đầu tiên!</p>
                )}
              </div>
            </section>

            {/* bank envelope */}
            {palette.showGift && bankCards.length > 0 ? (
              <div className="flex w-full flex-col items-center justify-center">
                <h2 className="mb-1 text-[24px] font-semibold md:text-[30px]" style={{ color: GOLD, letterSpacing: "0.02em" }}>Phong Bao Mừng Cưới</h2>
                <p className="mb-4 text-[14px] opacity-70 md:text-[16px]" style={{ color: GOLD }}>結婚紅包</p>
                <button data-testid="gift-envelope" type="button" aria-label="Mở hộp mừng cưới" onClick={() => setBankOpen(true)} className="group relative cursor-pointer border-none bg-transparent outline-none" style={{ width: 200, height: 256 }}>
                  <div data-testid="gift-envelope-animation" className="nhat-binh-envelope-wrapper relative flex h-full w-full items-center justify-center">
                    <span aria-hidden="true" className="nhat-binh-sparkle absolute left-6 top-6 text-lg" style={{ color: GOLD }}>✦</span>
                    <span aria-hidden="true" className="nhat-binh-sparkle nhat-binh-sparkle-2 absolute right-7 top-10 text-sm" style={{ color: GOLD }}>✦</span>
                    <span aria-hidden="true" className="nhat-binh-sparkle nhat-binh-sparkle-3 absolute bottom-10 left-10 text-sm" style={{ color: GOLD }}>✦</span>
                    <div className="nhat-binh-envelope-body relative" style={{ width: 140, height: 196 }}>
                      <div className="nhat-binh-envelope-front absolute overflow-hidden rounded-lg" style={{ inset: 0, backgroundColor: "#b91c1c", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
                        <div className="absolute left-0 right-0 top-0" style={{ height: 4, backgroundColor: GOLD }} />
                        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-lg" style={{ width: 63, height: 63, background: `radial-gradient(circle, ${GOLD} 0%, #d97706 100%)`, border: "3px solid #fef3c7" }}>
                          <span className="font-bold" style={{ fontSize: 30.8, color: "#b91c1c", lineHeight: 1 }}>囍</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="nhat-binh-hint-text absolute -bottom-3 left-1/2 flex -translate-x-1/2 flex-col items-center whitespace-nowrap text-xs font-medium" style={{ color: GOLD }}>
                    <span>Nhấn để mở</span>
                    <span className="opacity-70">點擊開啟</span>
                  </p>
                </button>
                {bankOpen ? createPortal((
                  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-3 sm:p-4" onClick={() => setBankOpen(false)}>
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto sm:max-w-xl" style={{ backgroundColor: CARD_BG }} onClick={(e) => e.stopPropagation()}>
                      <div className="relative px-6 pb-4 pt-6 text-center" style={{ backgroundColor: ENVELOPE }}>
                        <button type="button" aria-label="Đóng" onClick={() => setBankOpen(false)} className="absolute right-3 top-3 text-white/80 hover:text-white">✕</button>
                        <h2 className="text-[21px] md:text-[26px]" style={{ color: GOLD, letterSpacing: "0.02em" }}>Phong Bao Mừng Cưới / 結婚紅包</h2>
                      </div>
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-row flex-wrap items-start justify-center gap-3 sm:gap-4" style={{ color: GOLD }}>
                          {bankCards.map((q) => {
                            const qr = buildVietQrImageUrl({ bank: q.bank, accountNumber: q.num, accountName: q.name });
                            return (
                              <div key={q.role} className="flex w-[42%] max-w-[180px] flex-col items-center sm:w-auto sm:max-w-none">
                                <h3 className="mb-2 flex min-h-[2rem] items-start justify-center text-center text-xs font-medium" style={{ color: GOLD }}>{q.role} - {q.name}</h3>
                                <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-white p-2 shadow-lg sm:h-40 sm:w-40" style={{ border: `2px solid ${hexToRgba(GOLD, 0.3)}` }}>
                                  <img alt={`QR - ${q.role} - ${q.name}`} className="h-full w-full object-contain" src={qr} />
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
                ), document.body) : null}
              </div>
            ) : null}

            {/* footer */}
            <footer data-template-footer className="flex w-full max-w-[329px] flex-col items-center gap-1 text-center md:max-w-2xl">
              <span className="whitespace-pre-line text-[14px] leading-normal md:text-base" style={{ color: GOLD }}>Gia đình xin chân thành cảm ơn quý khách đã đến chung vui.</span>
              <span className="text-[13px] opacity-70 md:text-[15px]" style={{ color: GOLD_MUTED }}>您的蒞臨是我們最大的榮幸！</span>
            </footer>
          </div>
        </section>

        <div className="relative z-20 flex items-center justify-center pb-3 pt-2">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-[14px] opacity-70 transition-opacity hover:opacity-90 md:text-[15px]" style={{ color: GOLD }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}

export function DragonPhoenixRedInvitation({ content }: { content: ChungDoiDemoContent }) {
  return <DragonPhoenixInvitation content={content} palette={DP_RED_PALETTE} />;
}

export function DragonPhoenixGreenInvitation({ content }: { content: ChungDoiDemoContent }) {
  return <DragonPhoenixInvitation content={content} palette={DP_GREEN_PALETTE} />;
}

export function DragonPhoenixBlueInvitation({ content }: { content: ChungDoiDemoContent }) {
  return <DragonPhoenixInvitation content={content} palette={DP_BLUE_PALETTE} />;
}

export function DragonPhoenixBlackInvitation({ content }: { content: ChungDoiDemoContent }) {
  return <DragonPhoenixInvitation content={content} palette={DP_BLACK_PALETTE} />;
}
