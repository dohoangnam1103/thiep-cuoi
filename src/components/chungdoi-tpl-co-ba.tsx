"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

const COBA_MARVIN = '"SVN-HC Marvin Visions", sans-serif';
const COBA_HAYDON = '"SVN-HC Haydon Brush", cursive';
const COBA_HELV = 'HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif';

function CoBaHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="w-full text-center uppercase text-[30px] md:text-[35px] lg:text-[45px]"
      style={{ color: "#2F6982", fontFamily: COBA_MARVIN, fontWeight: 400, letterSpacing: "0.02em" }}
    >
      {children}
    </h2>
  );
}

/** THỨ HAI | 11 | THÁNG 05 date row used in the ceremony and reception blocks. */
function CoBaDateRow({ weekday, day, month, dayFontClass, gap, dividerLen }: {
  weekday: string;
  day: string;
  month: string;
  dayFontClass: string;
  gap: string;
  dividerLen: number;
}) {
  return (
    <div className={`flex items-center justify-center ${gap}`} style={{ color: "#542E08" }}>
      <span className="text-[15px] font-bold uppercase md:text-[18px] lg:text-[19px]" style={{ fontFamily: COBA_HELV, textAlign: "right" }}>{weekday}</span>
      <div className="shrink-0 bg-[#542e08]" style={{ width: dividerLen, height: 1, transform: "rotate(90deg)" }} />
      <span className={`font-bold leading-none ${dayFontClass}`} style={{ fontFamily: COBA_HELV }}>{day}</span>
      <div className="shrink-0 bg-[#542e08]" style={{ width: dividerLen, height: 1, transform: "rotate(90deg)" }} />
      <span className="text-[15px] font-bold uppercase md:text-[18px] lg:text-[19px]" style={{ fontFamily: COBA_HELV, textAlign: "left" }}>Tháng {month}</span>
    </div>
  );
}

function CoBaWishForm({ BROWN, CREAM }: { BROWN: string; CREAM: string }) {
  const { formProps, pending, state } = useWishFormBinding();

  return (
    <form {...formProps} className="mx-auto mt-6 w-full max-w-full md:max-w-[600px]">
      <div className="rounded-md border border-solid p-4 md:p-5" style={{ borderColor: BROWN, backgroundColor: hexToRgba(CREAM, 0.35) }}>
        <div className="mb-4">
          <input name="name" required maxLength={120} placeholder="Nhập tên của bạn*" className="w-full rounded-lg border px-4 py-3 text-base focus:outline-none md:py-3.5 md:text-[17px]" type="text" style={{ borderColor: BROWN, color: BROWN, backgroundColor: hexToRgba(CREAM, 0.5) }} />
        </div>
        <textarea name="text" required maxLength={1000} placeholder="Nhập lời chúc của bạn*" className="w-full rounded-lg border px-4 py-3 text-base focus:outline-none md:py-3.5 md:text-[17px]" rows={4} style={{ borderColor: BROWN, color: BROWN, backgroundColor: hexToRgba(CREAM, 0.5), resize: "none" }} />
        {state?.error ? <p className="mt-3 text-sm" style={{ color: "#c0392b" }}>{state.error}</p> : null}
        {state?.ok ? <p className="mt-3 text-sm" style={{ color: BROWN }}>Cảm ơn lời chúc của bạn!</p> : null}
        <div className="mt-4 flex items-center justify-between text-sm md:text-[15px]">
          <div />
          <button type="submit" disabled={pending} className="rounded-full px-6 py-2.5 text-base font-semibold transition-transform hover:scale-105 disabled:opacity-60 md:px-7 md:text-[17px]" style={{ backgroundColor: BROWN, color: CREAM }}>{pending ? "ĐANG GỬI..." : "GỬI LỜI CHÚC"}</button>
        </div>
      </div>
    </form>
  );
}

/** Faithful rebuild of the Cô Ba Đỏ (co-ba-red) opened invitation. */
export function CoBaInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const COBA = "/chungdoi/images/themes/co-ba-red";
  const RED = "#C32A29";
  const BROWN = "#542E08";
  const CREAM = "#F8F3E0";
  const names = people.map((person) => person.shortName);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
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

  const bankCards = invitationGiftAccounts(content).map((account) => ({
    role: account.side === "bride" ? "Cô Dâu" : "Chú Rể",
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));
  const familyColumns = orderByBrideFirst(
    { title: families.brideParentTitle || "Ông Bà", father: families.brideFather, mother: families.brideMother, address: families.brideAddress },
    { title: families.groomParentTitle || "Ông Bà", father: families.groomFather, mother: families.groomMother, address: families.groomAddress },
    couple.brideFirst,
  );

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white" style={{ color: BROWN }}>
      <div
        ref={parallaxRef}
        className="relative isolate w-full max-w-[480px] overflow-hidden mx-auto md:max-w-[900px] md:border md:border-[#542e0822]"
        style={{ backgroundColor: CREAM, color: BROWN, fontFamily: COBA_HELV }}
      >
        {/* paper texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          aria-hidden="true"
          style={{ opacity: 0.18, backgroundImage: `url("${COBA}/paper.webp")`, backgroundRepeat: "repeat-y", backgroundPosition: "center top", backgroundSize: "100%" }}
        />

        {/* header */}
        <header className="relative z-10 flex w-full flex-col items-center pt-[calc(clamp(75px,calc(5vw+45px),140px)+30px)] md:pt-[calc(clamp(75px,calc(5vw+45px),140px)+50px)]">
          <div className="pointer-events-none absolute left-1/2 top-[50px] z-[20] -translate-x-1/2 text-center md:top-[100px] lg:top-[120px]" aria-hidden="true">
            <div className="inline-flex flex-col items-center">
              <p className="whitespace-nowrap" style={{ color: "#CD211C", fontFamily: COBA_MARVIN, fontSize: "clamp(31px, 5.5vw, 47px)", lineHeight: 1 }}>Thiệp mời</p>
              {/* Trên mobile căn giữa dưới "Thiệp mời"; từ md mới lệch phải như thiết kế gốc.
                  Phải để bằng class vì inline style không có breakpoint. */}
              <p className="ml-0 mt-1 whitespace-nowrap md:ml-[70%]" style={{ color: "#2F6982", fontFamily: COBA_HAYDON, fontSize: "clamp(25px, 4.5vw, 40px)", lineHeight: 1 }}>Đám Cưới</p>
            </div>
          </div>
          {/* Mỗi tên một dòng riêng: màn hình hẹp không còn cắt tên ở vị trí bất kỳ. */}
          <p
            className="relative z-20 mt-[50px] flex max-w-[95%] flex-col items-center text-center uppercase md:mt-[100px] lg:mt-[100px]"
            style={{ fontFamily: COBA_MARVIN, color: RED, fontSize: "clamp(20px, 5.5vw, 40px)", lineHeight: 1.2, letterSpacing: "0.03em" }}
          >
            <span className="block">{names[0]}</span>
            <span className="block text-[0.7em] leading-none">&amp;</span>
            <span className="block">{names[1]}</span>
          </p>
          <div className="relative z-10 mt-2 h-[min(92vw,420px)] w-full max-w-[480px] md:h-[480px] md:max-w-[769px]">
            <div className="pointer-events-none absolute left-1/2 top-[calc(14%_-_115px)] z-[4] w-[130%] max-w-none -translate-x-1/2 md:top-[calc(14%_-_245px)] md:w-[140%] lg:top-[calc(14%_-_245px)] lg:w-[140%]">
              <div data-parallax="0.03" className="will-change-transform">
                <img alt="" aria-hidden="true" className="h-auto w-full object-contain" src={`${COBA}/cho-ben-thanh.webp`} />
              </div>
            </div>
            <div className="pointer-events-none absolute left-1/2 top-[calc(22%_+_40px)] z-[9] w-[70%] max-w-[653px] -translate-x-1/2 md:w-[48.1%] md:max-w-[369px]">
              <div className="will-change-transform">
                <img alt="" aria-hidden="true" className="h-auto w-full object-contain" src={`${COBA}/dau-re.webp`} />
              </div>
            </div>
          </div>
        </header>

        {/* content */}
        <section className="relative z-10 px-4 pb-8 pt-[210px] md:px-10 md:pb-12 md:pt-[262px] lg:pt-[285px]">
          <div className="relative z-[2] flex w-full flex-col items-center gap-10 md:gap-16 lg:gap-20">
            {/* Thông tin lễ cưới */}
            <CoBaHeading>Thông tin lễ cưới</CoBaHeading>

            {/* Mobile: hai họ xếp thành hai dòng nên mỗi tên có trọn chiều rộng thẻ,
                không còn bị cắt. Từ md trở lên mới về lại hai cột như thiết kế gốc. */}
            {/* Nhà gái và nhà trai luôn chung một dòng, kể cả mobile: cỡ chữ dải mobile
                hạ xuống thay vì xếp dọc. 4 hàng khai tường minh, mỗi cột mượn lại bằng
                grid-rows-subgrid nên chức danh / tên bố / tên mẹ / địa chỉ của hai nhà
                thẳng hàng nhau dù một tên phải xuống dòng. Vạch phân cách thành đường
                dọc trải hết khối ở mọi bề rộng. */}
            <div className="relative grid w-full max-w-[366px] grid-cols-[1fr_auto_1fr] grid-rows-[auto_auto_auto_auto] items-start gap-x-3 gap-y-1.5 py-[10px] text-center md:max-w-[520px] md:gap-x-6 md:py-[15px] lg:max-w-[600px] lg:py-[20px]" style={{ color: BROWN, fontFamily: COBA_HELV }}>
              <div className="row-span-4 grid min-h-0 w-full min-w-0 grid-rows-subgrid items-start justify-items-center">
                <span className="text-[12px] font-normal md:text-[18px] lg:text-[19px]">{familyColumns[0].title}</span>
                <span className="text-[15px] font-bold md:text-[20px]">{familyColumns[0].father}</span>
                <span className="text-[15px] font-bold md:text-[20px]">{familyColumns[0].mother}</span>
                <div className="mt-1 w-full max-w-full whitespace-pre-line text-[11px] font-normal leading-normal md:max-w-[260px] md:text-[15px] lg:max-w-[300px] lg:text-[16px]">{familyColumns[0].address}</div>
              </div>
              <div className="row-span-4 w-px self-stretch justify-self-center bg-[#542e08]" />
              <div className="row-span-4 grid min-h-0 w-full min-w-0 grid-rows-subgrid items-start justify-items-center">
                <span className="text-[12px] font-normal md:text-[18px] lg:text-[19px]">{familyColumns[1].title}</span>
                <span className="text-[15px] font-bold md:text-[20px]">{familyColumns[1].father}</span>
                <span className="text-[15px] font-bold md:text-[20px]">{familyColumns[1].mother}</span>
                <div className="mt-1 w-full max-w-full whitespace-pre-line text-[11px] font-normal leading-normal md:max-w-[260px] md:text-[15px] lg:max-w-[300px] lg:text-[16px]">{familyColumns[1].address}</div>
              </div>
            </div>

            <div className="flex max-w-[320px] flex-col gap-1 py-[10px] text-center text-[16px] leading-snug md:max-w-[460px] md:py-[15px] md:text-[22px] lg:max-w-[560px] lg:py-[20px] lg:text-[23px]" style={{ whiteSpace: "pre-line", fontFamily: COBA_HELV, color: BROWN, fontWeight: 700 }}>
              {couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI."}
            </div>

            <div className="relative flex flex-col items-center gap-1 py-[10px] text-center md:gap-2 md:py-[15px] lg:py-[20px]">
              {/* Tên cô dâu chú rể giữ COBA_HAYDON đúng như thẻ gốc trên chungdoi.com
                  (SVN-HC Haydon Brush, weight 400, letter-spacing 0.025em, không viền).
                  Trước đây đổi sang COBA_HELV cho khớp font tên ba mẹ, nhưng đó là sans
                  thường nên mất hẳn nét chữ đặc trưng của mẫu. Trần cỡ chữ nâng lại vì
                  brush hẹp hơn sans. */}
              <h3 className="flex w-full items-center justify-center leading-tight md:leading-snug" style={{ fontSize: "clamp(28px, 7vw, 56px)", fontFamily: COBA_HAYDON, color: RED, fontWeight: 400, letterSpacing: "0.025em" }}>{people[0].fullName}</h3>
              <div className="text-[14px] uppercase md:text-[17px]" style={{ color: BROWN, fontFamily: COBA_HELV }}>{people[0].birthOrder}</div>
              <div className="text-[58px] md:text-[77px] lg:text-[86px]" style={{ fontFamily: COBA_HAYDON, color: RED, fontWeight: 300 }}>&amp;</div>
              <h3 className="flex w-full items-center justify-center leading-tight md:leading-snug" style={{ fontSize: "clamp(28px, 7vw, 56px)", fontFamily: COBA_HAYDON, color: RED, fontWeight: 400, letterSpacing: "0.025em" }}>{people[1].fullName}</h3>
              <div className="text-[14px] uppercase md:text-[17px]" style={{ color: BROWN, fontFamily: COBA_HELV }}>{people[1].birthOrder}</div>
            </div>

            {/* ceremony */}
            <div className="relative flex flex-col items-center gap-4 py-[10px] text-center md:gap-5 md:py-[15px] lg:py-[20px]" style={{ fontFamily: COBA_HELV }}>
              <div className="flex flex-col items-center gap-2" style={{ color: BROWN }}>
                <span className="text-center text-[15px] font-bold md:text-[19px] lg:text-[20px]" style={{ whiteSpace: "pre-line" }}>{invitationCeremonyMessage(content)}</span>
                <p className="text-center text-[15px] font-bold uppercase md:text-[19px] lg:text-[20px]">Vào lúc</p>
              </div>
              {couple.ceremonyTime ? <div className="text-[20px] md:text-[30px]">{couple.ceremonyTime}</div> : null}
              {ceremony ? (
                <>
                  <CoBaDateRow weekday={ceremony.weekday} day={ceremony.day} month={ceremony.month} dayFontClass="text-[36px] md:text-[42px] lg:text-[46px]" gap="gap-2 md:gap-3" dividerLen={30} />
                  <div className="text-[22px] font-bold md:text-[26px] lg:text-[28px]">{ceremony.yearNumber}</div>
                  <div className="text-[15px] font-bold md:text-[18px] lg:text-[19px]">{ceremony.lunar}</div>
                </>
              ) : null}
            </div>

            {/* Album ảnh cưới */}
            {gallery.length > 0 ? (
              <div className="relative flex w-full max-w-[478px] flex-col items-center px-2 py-[10px] md:max-w-none md:px-10 md:py-[15px] lg:px-10 lg:py-[20px]">
                <CoBaHeading>Album Ảnh Cưới</CoBaHeading>
                <div className="mt-6 w-full max-w-[390px] md:max-w-[560px] lg:max-w-[600px]">
                  <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={RED} gridAspect="aspect-square" />
                </div>
              </div>
            ) : null}

            {/* Thông tin tiệc cưới */}
            {reception ? (
              <div className="relative z-[1] flex w-full flex-col items-center gap-8 py-[10px] md:gap-12 md:py-[15px] lg:gap-14 lg:py-[20px]">
                <CoBaHeading>Thông tin tiệc cưới</CoBaHeading>
                <div className="flex flex-col items-center gap-4 text-center md:gap-5" style={{ fontFamily: COBA_HELV, color: BROWN }}>
                  <h3 className="flex flex-col items-center text-center text-[19px] font-bold uppercase md:text-[33px] lg:text-[36px]" style={{ color: BROWN, fontFamily: COBA_MARVIN, fontWeight: 400, letterSpacing: "0.02em" }}>Tiệc cưới sẽ diễn ra vào lúc:</h3>
                  <div className="text-center text-[26px] md:text-[38px]">{venue.banquetTime || couple.time}</div>
                  <CoBaDateRow weekday={reception.weekday} day={reception.day} month={reception.month} dayFontClass="text-[38px] md:text-[50px]" gap="gap-6" dividerLen={34} />
                  <div className="text-[23px] font-bold md:text-[31px]">{reception.yearNumber}</div>
                  <div className="text-[15px] uppercase tracking-[0.2em] md:text-[18px]">{reception.lunar}</div>
                  <div className="mt-4 flex items-center justify-center gap-8">
                    <div className="flex flex-col items-center">
                      <span className="text-sm uppercase tracking-wider md:text-[15px]">Đón khách</span>
                      <span className="mt-1 text-xl font-bold md:mt-1.5 md:text-2xl">17:00</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-sm uppercase tracking-wider md:text-[15px]">Khai tiệc</span>
                      <span className="mt-1 text-xl font-bold md:mt-1.5 md:text-2xl">{venue.banquetTime || couple.time}</span>
                    </div>
                  </div>
                  {calendar ? (
                    <div className="mx-auto mt-2 w-[296px] max-w-full md:w-[352px]">
                      <div className="mx-auto w-full overflow-hidden rounded-lg border" style={{ borderColor: hexToRgba(BROWN, 0.27), color: BROWN }}>
                        <div className="border-b py-2.5 text-center text-[13px] font-semibold tracking-wide md:text-[14px]" style={{ borderColor: hexToRgba(BROWN, 0.27) }}>Tháng {calendar.month} / {calendar.year}</div>
                        <div className="grid grid-cols-7 border-b-2" style={{ borderColor: BROWN }}>
                          {WEEKDAY_LABELS.map((d) => (<div key={d} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{d}</div>))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                          {calendar.cells.map((day, i) => (
                            <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                              {day === calendar.highlight ? (
                                <div className="relative flex h-[24px] w-[26px] items-center justify-center md:h-[28px] md:w-[30px]">
                                  <svg viewBox="0 0 24 22" className="absolute inset-0 h-full w-full drop-shadow-sm" fill={BROWN}>
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
                  <a href={googleCalendarUrl(content)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center justify-center text-sm tracking-wide underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70 md:text-base" style={{ color: BROWN, fontFamily: COBA_HELV }}>Thêm vào lịch</a>
                </div>
                <div className="mt-2 flex w-full flex-col items-center justify-center">
                  <button type="button" className="inline-flex min-h-[42px] items-center justify-center rounded-full px-6 py-0 text-sm font-semibold leading-none tracking-wide transition-transform hover:scale-[1.03] md:min-h-[46px] md:text-base" style={{ backgroundColor: BROWN, color: CREAM, fontFamily: COBA_HELV }}>XÁC NHẬN</button>
                </div>
              </div>
            ) : null}

            {/* map */}
            {mapQuery ? (
              <section className="relative w-full px-2 py-[10px] md:px-10 md:py-[15px] lg:py-[20px]">
                <div className="relative text-center">
                  <h3 className="flex flex-col items-center text-center text-[30px] font-bold uppercase md:text-[35px] lg:text-[45px]" style={{ color: "#2F6982", fontFamily: COBA_MARVIN, fontWeight: 400, letterSpacing: "0.02em" }}>Tiệc cưới sẽ tổ chức tại</h3>
                  <div className="mx-auto mt-2 max-w-[280px] whitespace-pre-line text-center text-[15px] leading-snug md:mt-3 md:max-w-md md:text-[18px] lg:max-w-lg lg:text-[20px]" style={{ color: BROWN, fontFamily: COBA_HELV }}>{venue.address}</div>
                </div>
                <div className="relative flex w-full flex-col items-center gap-4 md:gap-5">
                  <InvitationMap query={mapQuery} title={mapQuery} className="mt-2 h-[240px] w-full max-w-[338px] overflow-hidden rounded-[15px] md:h-[320px] md:max-w-[560px] lg:h-[340px] lg:max-w-[600px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  <MapDirectionsButton query={mapQuery} style={{ color: "#2F6982", fontFamily: COBA_HELV }} />
                </div>
              </section>
            ) : null}

            {/* schedule */}
            {schedule.length > 0 ? (
              <div className="relative flex w-full flex-col gap-6 px-4 md:gap-8">
                <h2 className="flex flex-col items-center text-center text-[30px] font-bold uppercase md:text-[35px] lg:text-[45px]" style={{ color: "#2F6982", fontFamily: COBA_MARVIN, fontWeight: 400, letterSpacing: "0.02em" }}>Lịch trình ngày cưới</h2>
                <ol className="relative mx-auto grid w-full max-w-[460px] grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10" style={{ fontFamily: COBA_HELV }}>
                  {schedule.map((s, i) => (
                    <li key={`${s.time}-${i}`} className="contents">
                      <span className="pt-0.5 text-right text-[16px] tabular-nums leading-snug tracking-wide md:text-[17px]" style={{ color: RED, fontFamily: COBA_HELV }}>{s.time}</span>
                      <span aria-hidden="true" className="relative flex items-center justify-center self-stretch">
                        {i > 0 ? <span className="absolute left-1/2 -top-8 h-8 w-px -translate-x-1/2 md:-top-10" style={{ backgroundColor: hexToRgba(RED, 0.4) }} /> : null}
                        <span className="relative block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RED, boxShadow: `0 0 0 2px ${hexToRgba(RED, 0.13)}` }} />
                        {i < schedule.length - 1 ? <span className="absolute bottom-1/2 left-1/2 top-1/2 w-px -translate-x-1/2 md:-bottom-10" style={{ backgroundColor: hexToRgba(RED, 0.4) }} /> : null}
                      </span>
                      <span className="pt-0.5 text-left text-[17px] font-medium leading-snug md:text-[19px]" style={{ color: BROWN, fontFamily: COBA_HELV }}>{s.label}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {/* guestbook */}
            <section className="relative mx-auto w-full max-w-[338px] px-2 py-[10px] md:max-w-[560px] md:px-10 md:py-[15px] lg:max-w-[600px] lg:py-[20px]" style={{ color: BROWN, fontFamily: COBA_HELV }}>
              <div className="text-center">
                <h2 className="text-[30px] font-bold uppercase md:text-[35px] lg:text-[45px]" style={{ color: "#2F6982", fontFamily: COBA_MARVIN, fontWeight: 400, letterSpacing: "0.02em" }}>Sổ lưu bút</h2>
              </div>
              <CoBaWishForm BROWN={BROWN} CREAM={CREAM} />
              <div className="chungdoi-scroll touch-pan-y [-webkit-overflow-scrolling:touch] mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                {wishes.length > 0 ? (
                  wishes.map((w, i) => (
                    <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-sm" style={{ borderColor: hexToRgba(BROWN, 0.2), backgroundColor: "#fff" }}>
                      <div className="flex items-start justify-between">
                        <span className="font-semibold" style={{ color: RED }}>{w.name}</span>
                        <span className="opacity-70">{formatWishTime(w.time)}</span>
                      </div>
                      <p className="mt-2 leading-relaxed">{w.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="flex flex-col items-center text-center text-base opacity-70 md:text-[17px]">Chưa có lời chúc nào. Hãy là người đầu tiên!</p>
                )}
              </div>
            </section>

            {/* bank envelope */}
            {bankCards.length > 0 ? (
              <div className="relative flex w-full max-w-[248px] flex-col items-center justify-center px-2 py-[10px] md:max-w-none md:px-10 md:py-[15px] lg:py-[20px]">
                <h2 className="mb-4 flex flex-col items-center text-[21px] md:text-[25px] lg:text-[32px]" style={{ color: BROWN, fontFamily: COBA_MARVIN, fontWeight: 400, letterSpacing: "0.02em" }}>Phong Bao Mừng Cưới</h2>
                <button data-testid="gift-envelope" type="button" aria-label="Mở hộp mừng cưới" onClick={() => setBankOpen(true)} className="group relative cursor-pointer border-none bg-transparent outline-none" style={{ width: 200, height: 256 }}>
                  <TemplateGiftArtwork templateSlug={content.slug} />
                  <p className="nhat-binh-hint-text absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium" style={{ color: BROWN }}>Nhấn để mở</p>
                </button>
                {bankOpen ? createPortal((
                  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-3 sm:p-4" onClick={() => setBankOpen(false)}>
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto sm:max-w-xl" style={{ backgroundColor: CREAM }} onClick={(e) => e.stopPropagation()}>
                      <div className="relative px-6 pb-4 pt-6 text-center" style={{ backgroundColor: RED }}>
                        <button type="button" aria-label="Đóng" onClick={() => setBankOpen(false)} className="absolute right-3 top-3 text-white/80 hover:text-white">✕</button>
                        <h2 className="text-[21px] text-white md:text-[25px] lg:text-[32px]" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.2)", fontFamily: COBA_MARVIN, fontWeight: 400, letterSpacing: "0.02em" }}>Phong Bao Mừng Cưới</h2>
                      </div>
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-row flex-wrap items-start justify-center gap-3 sm:gap-4" style={{ color: BROWN }}>
                          {bankCards.map((q) => {
                            const qr = buildVietQrImageUrl({ bank: q.bank, accountNumber: q.num, accountName: q.name });
                            // An account that cannot produce a QR has nothing to show here.
                            if (!qr) return null;
                            return (
                              <div key={q.role} className="flex w-[42%] max-w-[180px] flex-col items-center sm:w-auto sm:max-w-none">
                                <h3 className="mb-2 flex min-h-[2rem] items-start justify-center text-center text-xs font-medium" style={{ color: RED }}>{q.role} - {q.name}</h3>
                                <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-white p-2 shadow-lg sm:h-40 sm:w-40" style={{ border: `2px solid ${hexToRgba(RED, 0.125)}` }}>
                                  <img alt={`QR - ${q.role} - ${q.name}`} className="h-full w-full object-contain" src={qr} />
                                </div>
                                <div className="mt-2 space-y-0.5 text-center">
                                  <p className="text-[10px]">{q.bank}</p>
                                  <p className="tabular-nums text-[10px]">{q.num}</p>
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
            <footer data-template-footer className="flex w-full max-w-[329px] flex-col items-center px-4 py-[10px] text-center md:max-w-2xl md:px-10 md:py-[15px] lg:py-[20px]">
              <span className="flex flex-col items-center gap-1 whitespace-pre-line text-[14px] leading-normal md:text-base lg:text-lg" style={{ color: BROWN, fontFamily: COBA_HELV }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
            </footer>
          </div>
        </section>

        <div className="relative z-20 flex items-center justify-center pb-3 pt-2">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-[14px] opacity-70 transition-opacity hover:opacity-90 md:text-[15px]" style={{ color: BROWN, fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif' }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}
