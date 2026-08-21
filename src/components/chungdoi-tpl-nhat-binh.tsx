"use client";

import { useEffect, useRef, useState } from "react";

import { TemplateGiftArtwork } from "@/components/chungdoi-gift-envelope-artwork";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { useWishFormBinding } from "@/components/chungdoi-live-forms";
import {
  buildCalendar,
  buildVietQrImageUrl,
  FamilyColumn,
  FitText,
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

const NB_PACIFICO = '"SVN-HC Pacifico", cursive';
const NB_TITLING = '"SVN-HC Built Titling", "Times New Roman", serif';
const NB_CAROSELLO = '"SVN-HC Carosello", cursive';
const NB_HELV = 'HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif';

function NhatBinhHeading({ children, red, small = false }: { children: React.ReactNode; red: string; small?: boolean }) {
  return (
    <h2
      className={`text-center uppercase ${small ? "text-[21px] md:text-[25px] lg:text-[32px]" : "text-[30px] md:text-[35px] lg:text-[45px]"}`}
      style={{ fontFamily: NB_TITLING, color: red, fontWeight: 400, letterSpacing: "0.02em" }}
    >
      {children}
    </h2>
  );
}

function NhatBinhWishForm({ red, brown }: { red: string; brown: string }) {
  const { formProps, pending, state } = useWishFormBinding();

  return (
    <form {...formProps} className="mx-auto mt-8 w-full max-w-full md:max-w-[600px]">
      <div className="flex flex-col gap-3">
        <input name="name" required maxLength={120} className="w-full rounded-[6px] border bg-white/70 px-4 py-2.5 text-[13px] outline-none" style={{ borderColor: hexToRgba(red, 0.3), color: brown }} placeholder="Nhập tên của bạn*" />
        <textarea name="text" rows={3} required maxLength={1000} className="w-full rounded-[6px] border bg-white/70 px-4 py-2.5 text-[13px] outline-none" style={{ borderColor: hexToRgba(red, 0.3), color: brown }} placeholder="Nhập lời chúc của bạn*" />
        {state?.error ? <p className="text-[12px] text-red-600">{state.error}</p> : null}
        {state?.ok ? <p className="text-[12px]" style={{ color: red }}>Cảm ơn lời chúc của bạn!</p> : null}
        <div className="mt-1 flex items-center justify-end">
          <button type="submit" disabled={pending} className="rounded-full px-5 py-2 text-[12px] font-semibold uppercase tracking-wider disabled:opacity-60" style={{ backgroundColor: red, color: "#fff" }}>{pending ? "Đang gửi..." : "Gửi lời chúc"}</button>
        </div>
      </div>
    </form>
  );
}

const NB_CORNER_W = "w-[clamp(45px,15vw,80px)] md:w-[clamp(68px,14vw,104px)] lg:w-[clamp(76px,12vw,112px)]";

function NhatBinhSectionCorners({ nb, bottomOffsetClass = "bottom-[-15px]" }: { nb: string; bottomOffsetClass?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[3]" aria-hidden="true">
      <img src={`${nb}/corner.webp`} alt="" aria-hidden="true" className={`pointer-events-none absolute left-0 top-[-10px] h-auto object-contain md:top-[-5px] ${NB_CORNER_W}`} />
      <div className={`pointer-events-none absolute right-0 top-[-10px] flex h-fit shrink-0 justify-end overflow-hidden md:top-[-5px] ${NB_CORNER_W}`}>
        <img src={`${nb}/corner.webp`} alt="" aria-hidden="true" className="pointer-events-none h-auto w-full max-w-none object-contain [transform:scaleX(-1)]" />
      </div>
      <div className={`pointer-events-none absolute ${bottomOffsetClass} left-0 flex h-fit shrink-0 items-end justify-start overflow-hidden ${NB_CORNER_W}`}>
        <img src={`${nb}/corner.webp`} alt="" aria-hidden="true" className="pointer-events-none h-auto w-full max-w-none object-contain [transform:scaleY(-1)]" />
      </div>
      <div className={`pointer-events-none absolute ${bottomOffsetClass} right-0 flex h-fit shrink-0 items-end justify-end overflow-hidden ${NB_CORNER_W}`}>
        <img src={`${nb}/corner.webp`} alt="" aria-hidden="true" className="pointer-events-none h-auto w-full max-w-none object-contain [transform:scaleX(-1)_scaleY(-1)]" />
      </div>
    </div>
  );
}

const NB_CLOUD_LAYERS = [
  { top: "8%", side: "right" as const, opacity: 0.3, speed: 0.04 },
  { top: "22%", side: "left" as const, opacity: 0.3, speed: 0.06 },
  { top: "36%", side: "right" as const, opacity: 0.3, speed: 0.05 },
  { top: "50%", side: "left" as const, opacity: 0.3, speed: 0.07 },
  { top: "64%", side: "right" as const, opacity: 0.3, speed: 0.03 },
  { top: "78%", side: "left" as const, opacity: 0.3, speed: 0.055 },
  { top: "92%", side: "right" as const, opacity: 0.8, speed: 0.045 },
];

function NhatBinhCloudBackground({ nb }: { nb: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {NB_CLOUD_LAYERS.map((c, i) => (
        <div
          key={i}
          className="pointer-events-none absolute"
          style={{ width: "168%", maxWidth: 1300, top: c.top, [c.side]: "25%", opacity: c.opacity }}
        >
          <div data-parallax={c.speed} className="will-change-transform">
            <img src={`${nb}/may.webp`} alt="" aria-hidden="true" className="block h-auto w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NhatBinhInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const NB = `/chungdoi/images/themes/${content.theme.assetFolder || "nhat-binh-red"}`;
  const RED = content.theme.primaryColor || "#c32a29";
  const BROWN = "#542E08";
  const CREAM = "#F8F3E0";
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const [giftOpen, setGiftOpen] = useState(false);
  const banks = invitationGiftAccounts(content).map((account) => ({
    title: `${account.side === "bride" ? "Cô Dâu" : "Chú Rể"} - ${account.name}`,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));
  const familyColumns = orderByBrideFirst(
    { title: families.brideParentTitle || "Ông Bà", a: families.brideFather, b: families.brideMother, addr: families.brideAddress },
    { title: families.groomParentTitle || "Ông Bà", a: families.groomFather, b: families.groomMother, addr: families.groomAddress },
    couple.brideFirst,
  );

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

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white" style={{ color: BROWN }}>
      <div ref={parallaxRef} className="relative w-full max-w-[480px] overflow-hidden pb-8 mx-auto md:max-w-[900px] md:border" style={{ backgroundColor: CREAM, borderColor: hexToRgba(RED, 0.18), fontFamily: '"HelveticaNeue", sans-serif' }}>
        {/* paper texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          aria-hidden="true"
          style={{ opacity: 0.15, backgroundImage: `url("${NB}/paper.webp")`, backgroundRepeat: "repeat-y", backgroundPosition: "center top", backgroundSize: "100%" }}
        />
        {/* header collage */}
        <header className="relative z-10 flex w-full flex-col items-center pt-[calc(clamp(75px,calc(5vw+45px),140px)+30px)] md:pt-[calc(clamp(75px,calc(5vw+45px),140px)+50px)]" aria-label="Đầu thiệp">
          {/* Mỗi tên một dòng riêng: màn hình hẹp không còn cắt tên ở vị trí bất kỳ. */}
          <p
            className="relative z-20 flex max-w-[95%] flex-col items-center text-center uppercase"
            style={{ fontFamily: NB_PACIFICO, color: RED, fontSize: "clamp(20px, 5.5vw, 40px)", lineHeight: 1.2, letterSpacing: "0.03em", WebkitTextStroke: "1px #f8c88b", paintOrder: "stroke" }}
          >
            <span className="block">{people[0].shortName}</span>
            <span className="block text-[0.7em] leading-none">&amp;</span>
            <span className="block">{people[1].shortName}</span>
          </p>
          <div className="relative z-10 mt-2 h-[min(92vw,420px)] w-full max-w-[480px] md:h-[480px] md:max-w-[769px]">
            {/* 囍 double-happiness */}
            <div data-parallax="0.12" className="pointer-events-none absolute z-[4] left-1/2 top-[calc(14%_-_35px)] w-[75%] max-w-[736px] translate-x-[calc(-50%_+_35px)] md:w-[54.6%] md:max-w-[416px] md:translate-x-[calc(-50%_+_50px)]" style={{ willChange: "transform" }}>
              <img src={`${NB}/chu-hy.webp`} alt="" aria-hidden="true" className="h-auto w-full object-contain" />
            </div>
            {/* fan */}
            <div data-parallax="0.16" className="pointer-events-none absolute z-[2] left-[calc(18%_-_65px)] top-[36%] w-[55%] max-w-[398px] md:left-[calc(18%_-_20px)] md:top-[calc(36%_+_50px)] md:w-[29.9%] md:max-w-[225px]" style={{ willChange: "transform" }}>
              <img src={`${NB}/quat.webp`} alt="" aria-hidden="true" className="h-auto w-full object-contain" />
            </div>
            {/* cloud swoosh */}
            <div data-parallax="0.08" className="pointer-events-none absolute z-[3] left-1/2 top-[calc(42%_+_100px)] w-[85%] max-w-[892px] -translate-x-1/2 md:top-[calc(42%_+_140px)] md:w-[66.3%] md:max-w-[504px]" style={{ willChange: "transform" }}>
              <img src={`${NB}/may-to.webp`} alt="" aria-hidden="true" className="h-auto w-full object-contain" />
            </div>
            {/* bride & groom illustration */}
            <div className="pointer-events-none absolute z-[9] left-1/2 top-[calc(22%_+_40px)] w-[70%] max-w-[653px] -translate-x-1/2 md:w-[48.1%] md:max-w-[369px]">
              <img src={`${NB}/dau-re.webp`} alt="" aria-hidden="true" className="h-auto w-full object-contain" />
            </div>
            {/* Nhà có hỷ */}
            <div
              data-parallax="0.1"
              className="pointer-events-none absolute z-[10] text-center left-[calc(3%_+_25px)] md:left-[calc(3%_+_100px)] [-webkit-text-stroke:3px_#FAD9B0] md:[-webkit-text-stroke:5px_#FAD9B0] [paint-order:stroke_fill]"
              style={{ top: "calc(52% + 120px)", color: "#CD211C", fontFamily: '"SVN-HC Marvin Visions", sans-serif', fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 1, willChange: "transform" }}
            >
              <div className="inline-block">
                <p className="mb-0">Nhà</p>
                <p className="mb-0">có</p>
                <p>hỷ</p>
              </div>
            </div>
            {/* peach branch — top-left, flipped */}
            <div className="pointer-events-none absolute z-[6] w-[280px] max-w-full -left-10 top-[65px] md:w-[320px] md:max-w-[min(320px,46%)] md:-left-12 md:top-[78px] lg:w-[456px] lg:max-w-[min(456px,53%)] lg:-left-14 lg:top-[calc(86px-1cm)]">
              <div className="w-full" style={{ transformOrigin: "left top", transform: "scaleY(-1) rotate(20deg)" }}>
                <img src={`${NB}/hoa.webp`} alt="" aria-hidden="true" className="h-auto w-full object-contain" />
              </div>
            </div>
            {/* lantern */}
            <div data-parallax="0.2" className="pointer-events-none absolute z-[7] w-[8%] min-w-[48px] max-w-[63px] top-[calc(4%_-_180px)] right-[calc(6%_-_15px)] md:w-[9.2%] md:min-w-[63px] md:max-w-[85px] md:top-[calc(4%_-_246px)] md:right-[calc(6%_-_24px)] lg:min-w-[67px] lg:max-w-[90px] lg:top-[calc(4%_-_276px)]" style={{ willChange: "transform" }}>
              <img src={`${NB}/long-den.webp`} alt="" aria-hidden="true" className="h-auto w-full object-contain" />
            </div>
          </div>
        </header>

        {/* body — single wrapper with scattered-cloud background */}
        <div className="relative z-10 pt-[280px] md:pt-[350px] lg:pt-[380px]">
          <NhatBinhCloudBackground nb={NB} />

        {/* Thông Tin Lễ Cưới */}
        <section className="relative z-[2] px-6 py-10 md:px-10 md:py-14">
          <NhatBinhSectionCorners nb={NB} />
          <NhatBinhHeading red={RED}>Thông Tin Lễ Cưới</NhatBinhHeading>
          {/* Mobile: hai họ xếp thành hai dòng để mỗi tên có trọn chiều rộng, không bị cắt. */}
          <div className="relative mx-auto mt-8 grid w-full max-w-[366px] grid-cols-1 items-start gap-6 text-center md:max-w-[520px] md:grid-cols-[1fr_auto_1fr] md:gap-6 lg:max-w-[600px]">
            <FamilyColumn {...familyColumns[0]} />
            <div className="flex w-full items-center justify-center self-stretch md:h-[64px] md:w-0 md:shrink-0 md:px-0">
              <div className="h-px w-16 md:h-full md:w-px" style={{ backgroundColor: BROWN }} />
            </div>
            <FamilyColumn {...familyColumns[1]} />
          </div>
          <div className="mt-10 flex w-full flex-col items-center gap-1 text-center md:gap-2">
            <p className="whitespace-pre-line text-center text-[14px] uppercase leading-relaxed md:text-[17px]" style={{ color: BROWN }}>{couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI."}</p>
            <FitText maxFontSize={82} className="flex w-[90%] items-center justify-center leading-tight md:w-[95%] md:leading-snug [-webkit-text-stroke:3px_#F8C88B] md:[-webkit-text-stroke:4px_#F8C88B] lg:[-webkit-text-stroke:5px_#F8C88B] [paint-order:stroke_fill]" style={{ fontFamily: NB_PACIFICO, color: RED, letterSpacing: "0.025em" }}>{people[0].fullName}</FitText>
            <div className="text-[14px] uppercase md:text-[17px]" style={{ fontFamily: '"HelveticaNeue", sans-serif', color: BROWN }}>{people[0].birthOrder}</div>
            <div className="text-[58px] md:text-[77px] lg:text-[86px]" style={{ fontFamily: NB_CAROSELLO, color: RED }}>&amp;</div>
            <FitText maxFontSize={82} className="flex w-[90%] items-center justify-center leading-tight md:w-[95%] md:leading-snug [-webkit-text-stroke:3px_#F8C88B] md:[-webkit-text-stroke:4px_#F8C88B] lg:[-webkit-text-stroke:5px_#F8C88B] [paint-order:stroke_fill]" style={{ fontFamily: NB_PACIFICO, color: RED, letterSpacing: "0.025em" }}>{people[1].fullName}</FitText>
            <div className="text-[14px] uppercase md:text-[17px]" style={{ fontFamily: NB_HELV, color: BROWN }}>{people[1].birthOrder}</div>
          </div>
          {ceremony ? (
            <div className="mt-10 flex flex-col items-center gap-4 text-center md:gap-5" style={{ fontFamily: NB_HELV, color: BROWN }}>
              <div className="flex flex-col items-center gap-2">
                <span className="whitespace-pre-line text-center font-bold text-[15px] md:text-[19px] lg:text-[20px]">{invitationCeremonyMessage(content)}</span>
                <p className="text-center font-bold uppercase text-[15px] md:text-[19px] lg:text-[20px]">VÀO LÚC</p>
              </div>
              <div className="text-[20px] md:text-[30px]">{couple.ceremonyTime || "09:00"}</div>
              <div className="flex items-center justify-center gap-2 md:gap-3">
                <span className="text-right font-bold text-[15px] uppercase md:text-[18px] lg:text-[19px]">{ceremony.weekday}</span>
                <div className="shrink-0" style={{ width: "30px", height: "1px", transform: "rotate(90deg)", backgroundColor: BROWN }} />
                <span className="text-[36px] font-bold leading-none md:text-[42px] lg:text-[46px]">{ceremony.day}</span>
                <div className="shrink-0" style={{ width: "30px", height: "1px", transform: "rotate(90deg)", backgroundColor: BROWN }} />
                <span className="text-left font-bold text-[15px] uppercase md:text-[18px] lg:text-[19px]">Tháng {ceremony.month}</span>
              </div>
              <div className="text-[22px] font-bold md:text-[26px] lg:text-[28px]">{ceremony.yearNumber}</div>
              <div className="font-bold text-[15px] md:text-[18px] lg:text-[19px]">{ceremony.lunar}</div>
            </div>
          ) : null}
        </section>


        {/* Album Ảnh Cưới */}
        {gallery.length > 0 ? (
          <section className="relative z-[2] flex flex-col items-center px-6 py-10 md:px-10 md:py-14">
            <NhatBinhHeading red={RED}>Album Ảnh Cưới</NhatBinhHeading>
            <div className="mt-8">
              <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={RED} gridAspect="aspect-square" />
            </div>
          </section>
        ) : null}

        {/* Thông Tin Tiệc Cưới */}
        {reception ? (
          <section className="relative z-[2] flex flex-col items-center gap-8 px-6 py-10 text-center md:gap-12 md:py-14" style={{ fontFamily: NB_HELV, color: BROWN }}>
            <NhatBinhSectionCorners nb={NB} bottomOffsetClass="bottom-[20px]" />
            <NhatBinhHeading red={RED}>Thông Tin Tiệc Cưới</NhatBinhHeading>
            <div className="flex flex-col items-center gap-4 md:gap-5">
              <h3 className="flex flex-col items-center text-center font-bold uppercase text-[19px] md:text-[33px] lg:text-[36px]" style={{ fontFamily: NB_TITLING, fontWeight: 400, letterSpacing: "0.02em" }}>Tiệc cưới sẽ diễn ra vào lúc:</h3>
              <div className="text-[26px] md:text-[38px]">{venue.banquetTime || couple.time}</div>
              <div className="flex items-center justify-center gap-6 font-bold">
                <span className="text-right text-[15px] uppercase tracking-wide md:text-[20px]">{reception.weekday}</span>
                <div className="shrink-0" style={{ width: "34px", height: "1px", transform: "rotate(90deg)", backgroundColor: BROWN }} />
                <span className="text-[38px] font-bold leading-none md:text-[50px]">{reception.day}</span>
                <div className="shrink-0" style={{ width: "34px", height: "1px", transform: "rotate(90deg)", backgroundColor: BROWN }} />
                <span className="text-left text-[15px] uppercase tracking-wide md:text-[20px]">Tháng {reception.month}</span>
              </div>
              <div className="text-[23px] font-bold md:text-[31px]">{reception.yearNumber}</div>
              <div className="text-[15px] uppercase tracking-[0.2em] md:text-[18px]">{reception.lunar}</div>
              <div className="mt-4 flex items-center justify-center gap-8">
                <div className="flex flex-col items-center">
                  <span className="text-sm uppercase tracking-wider md:text-[15px]">Đón khách</span>
                  <span className="mt-1 text-xl font-bold md:mt-1.5 md:text-2xl">{schedule[0]?.time || "17:30"}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm uppercase tracking-wider md:text-[15px]">Khai tiệc</span>
                  <span className="mt-1 text-xl font-bold md:mt-1.5 md:text-2xl">{venue.banquetTime || couple.time}</span>
                </div>
              </div>
            {calendar ? (
              <div className="mx-auto mt-2 w-[296px] max-w-full md:w-[352px]">
                <div className="mx-auto w-full overflow-hidden rounded-lg border" style={{ borderColor: hexToRgba(RED, 0.25) }}>
                  <div className="py-2.5 text-center text-[13px] font-semibold tracking-wide md:text-[14px]" style={{ backgroundColor: RED, color: "#fff" }}>Tháng {calendar.month} / {calendar.year}</div>
                  <div className="grid grid-cols-7 border-b-2" style={{ borderColor: hexToRgba(RED, 0.15) }}>
                    {WEEKDAY_LABELS.map((d) => (<div key={d} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{d}</div>))}
                  </div>
                  <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                    {calendar.cells.map((day, i) => (
                      <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                        {day === calendar.highlight ? (
                          <span className="flex size-7 items-center justify-center rounded-full text-[11px] font-bold text-white md:text-[12px]" style={{ backgroundColor: RED }}>{day}</span>
                        ) : day ? (<span className="text-[12px] md:text-[13px]">{day}</span>) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
              <a href={googleCalendarUrl(content)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center justify-center text-sm tracking-wide underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70 md:text-base" style={{ color: BROWN }}>Thêm vào lịch</a>
            </div>
            <div className="mt-2 flex w-full flex-col items-center justify-center">
              <button type="button" className="inline-flex min-h-[42px] items-center justify-center rounded-full px-6 text-sm font-semibold leading-none tracking-wide transition-transform hover:scale-[1.03] md:min-h-[46px] md:text-base" style={{ backgroundColor: RED, color: CREAM }}>XÁC NHẬN</button>
            </div>
          </section>
        ) : null}

        {mapQuery ? (
          <section className="relative z-[2] mt-6 w-full px-2 py-[10px] md:px-10 md:py-[15px] lg:py-[20px]">
            <div className="relative text-center">
              <h3 className="flex flex-col items-center text-center text-[30px] font-bold uppercase md:text-[35px] lg:text-[45px]" style={{ color: RED, fontFamily: NB_TITLING, fontWeight: 400, letterSpacing: "0.02em" }}>
                <span>Tiệc cưới sẽ tổ chức tại</span>
              </h3>
              <div className="mx-auto mt-2 max-w-[280px] whitespace-pre-line text-center text-[15px] leading-snug md:mt-3 md:max-w-md md:text-[18px] lg:max-w-lg lg:text-[20px]" style={{ color: BROWN, fontFamily: NB_HELV }}>{venue.address}</div>
            </div>
            <InvitationMap query={mapQuery} title={mapQuery} className="mx-auto mt-2 h-[240px] w-full max-w-[338px] overflow-hidden rounded-[15px] md:h-[320px] md:max-w-[560px] lg:h-[340px] lg:max-w-[600px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            <div className="mt-4 flex justify-center">
              <MapDirectionsButton query={mapQuery} style={{ color: RED }} />
            </div>
          </section>
        ) : null}


        {/* Lịch Trình Ngày Cưới */}
        {schedule.length > 0 ? (
          <>
            <section className="relative z-[2] px-6 py-10 md:px-10 md:py-14">
              <NhatBinhHeading red={RED}>Lịch Trình Ngày Cưới</NhatBinhHeading>
              <ol className="mx-auto mt-8 grid max-w-[420px] grid-cols-[1fr_auto_1fr] items-stretch gap-x-4">
                {schedule.map((s, i) => (
                  <li key={`${s.time}-${i}`} className="contents">
                    <span className="pt-0.5 text-right text-[16px] font-semibold tabular-nums md:text-[17px]" style={{ color: RED }}>{s.time}</span>
                    <span className="relative flex items-center justify-center self-stretch">
                      {i > 0 ? <span className="absolute left-1/2 top-0 -mt-4 h-4 w-px -translate-x-1/2" style={{ backgroundColor: hexToRgba(RED, 0.3) }} /> : null}
                      <span className="relative block size-2.5 rounded-full" style={{ backgroundColor: RED }} />
                      {i < schedule.length - 1 ? <span className="absolute bottom-0 left-1/2 -mb-4 h-4 w-px -translate-x-1/2" style={{ backgroundColor: hexToRgba(RED, 0.3) }} /> : null}
                    </span>
                    <span className="pb-6 pt-0.5 text-left text-[16px] leading-tight md:text-[18px]">{s.label}</span>
                  </li>
                ))}
              </ol>
            </section>
          </>
        ) : null}

        {/* Sổ lưu bút */}
        <section className="relative z-[2] px-6 py-10 md:px-10">
          <NhatBinhHeading red={RED}>Sổ lưu bút</NhatBinhHeading>
          <NhatBinhWishForm red={RED} brown={BROWN} />
          <div className="mx-auto mt-8 w-full max-w-full md:max-w-[600px]">
            {wishes.length > 0 ? (
              <div className="space-y-3">
                {wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-xs" style={{ borderColor: hexToRgba(RED, 0.2), backgroundColor: "#fff" }}>
                    <div className="flex items-start justify-between">
                      <span className="font-semibold" style={{ color: RED }}>{w.name}</span>
                      <span className="opacity-70">{formatWishTime(w.time)}</span>
                    </div>
                    <p className="mt-2 leading-relaxed">{w.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm opacity-70">Chưa có lời chúc nào. Hãy là người đầu tiên!</p>
            )}
          </div>
        </section>


        {/* Phong Bao Mừng Cưới */}
        {banks.length > 0 ? (
          <div className="relative z-[2] flex flex-col items-center justify-center px-2 py-[10px] text-center md:px-10 md:py-[15px] lg:py-[20px]">
            <h2 className="mb-4 flex flex-col items-center text-[21px] md:text-[25px] lg:text-[32px]" style={{ color: BROWN, fontFamily: NB_TITLING, fontWeight: 400, letterSpacing: "0.02em" }}>Phong Bao Mừng Cưới</h2>
            <button type="button" aria-label="Mở hộp mừng cưới" onClick={() => setGiftOpen(true)} className="group relative cursor-pointer border-none bg-transparent outline-none" style={{ width: 200, height: 256 }}>
              <TemplateGiftArtwork templateSlug={content.slug} />
              <p className="nhat-binh-hint-text absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium" style={{ color: BROWN }}>Nhấn để mở</p>
            </button>
          </div>
        ) : null}
        </div>

        {giftOpen ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setGiftOpen(false)}>
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto sm:max-w-xl" style={{ backgroundColor: CREAM }} onClick={(e) => e.stopPropagation()}>
              <div className="relative px-6 pb-4 pt-6 text-center" style={{ backgroundColor: RED }}>
                <button type="button" onClick={() => setGiftOpen(false)} aria-label="Đóng" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/20 hover:text-white">✕</button>
                <h2 className="text-[21px] text-white md:text-[25px] lg:text-[32px]" style={{ textShadow: "rgba(0, 0, 0, 0.2) 1px 1px 2px", fontFamily: NB_TITLING, fontWeight: 400, letterSpacing: "0.02em" }}>Phong Bao Mừng Cưới</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-center" style={{ color: BROWN }}>
                  {banks.map((q) => {
                    const qr = buildVietQrImageUrl({ bank: q.bank, accountNumber: q.num, accountName: q.name });
                    // An account that cannot produce a QR has nothing to show here.
                    if (!qr) return null;
                    return (
                      <div key={q.title} className="flex max-w-[180px] flex-1 flex-col items-center sm:max-w-none">
                        <h3 className="mb-2 line-clamp-2 flex min-h-[2rem] items-start justify-center text-center text-xs font-medium" style={{ color: RED }}>{q.title}</h3>
                        <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-white p-2 shadow-lg sm:h-40 sm:w-40" style={{ border: `2px solid ${hexToRgba(RED, 0.125)}` }}>
                          <img alt={`QR - ${q.title}`} className="h-full w-full object-contain" src={qr} />
                        </div>
                        <div className="mt-2 space-y-0.5 text-center">
                          <p className="text-[10px]" style={{ color: BROWN }}>{q.bank}</p>
                          <p className="tabular-nums text-[10px]" style={{ color: BROWN }}>{q.num}</p>
                          <p className="text-[10px] font-semibold" style={{ color: BROWN }}>{q.name}</p>
                        </div>
                        <a href={`${qr}&download=1`} download className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium" style={{ color: RED, backgroundColor: hexToRgba(RED, 0.082) }}>Lưu QR</a>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <footer data-template-footer className="relative z-[2] mx-auto flex w-full max-w-[329px] flex-col items-center px-4 py-[10px] text-center md:max-w-2xl md:px-10 md:py-[15px] lg:py-[20px]">
          <span className="flex flex-col items-center gap-1 whitespace-pre-line text-[14px] leading-normal md:text-base lg:text-lg" style={{ color: BROWN, fontFamily: NB_HELV }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="absolute bottom-2 left-0 right-0 z-20 flex items-center justify-center" style={{ color: BROWN, fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif' }}>
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-[14px] text-xs opacity-70 transition-opacity hover:opacity-90 md:text-[15px]" style={{ color: BROWN }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}
