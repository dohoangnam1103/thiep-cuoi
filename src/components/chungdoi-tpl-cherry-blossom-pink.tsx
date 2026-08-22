"use client";

import { useEffect, useRef } from "react";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { invitationGiftAccounts, invitationHeroImage, orderedCouple } from "@/lib/invitation-display";
import {
  hexToRgba, formatDate, buildCalendar, formatWishTime,
  AlbumGallery, googleCalendarUrl, InvitationMap, MapDirectionsButton,
  FamilyColumn, GiftEnvelope, SharedWishForm, WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";

const BASE = "/chungdoi/images/themes/_decor/anhdao-pink";
const PINK = "#b03a5b";
const PINK_MUTED = "rgba(176,58,91,0.72)";
const BLUSH = "#fdf3f6";

function CherryHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-[22px] font-bold uppercase tracking-wide md:text-[28px]" style={{ color: PINK }}>
      {children}
    </h2>
  );
}

export function CherryBlossomInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const heroImage = invitationHeroImage(content);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const nameFont = { fontFamily: '"The Nautigal", cursive' };

  const groomCol = <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  const banks = invitationGiftAccounts(content).map((account) => ({
    label: `${account.birthOrder} - ${account.name}`,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));

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
        const flip = el.dataset.flip === "1" ? " scaleX(-1)" : "";
        el.style.transform = `translateY(${(scrolled * speed).toFixed(2)}px)${flip}`;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="flex w-full justify-center overflow-x-clip" style={{ backgroundColor: BLUSH }}>
      <div ref={parallaxRef} className="relative w-full max-w-[480px] overflow-hidden rounded mx-auto md:max-w-[900px] md:border" style={{ color: PINK, borderColor: hexToRgba(PINK, 0.2) }}>
        {/* BACKGROUND — dải watermark cành đào (900×6000) phủ full chiều rộng, lặp dọc suốt trang */}
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-[url('/chungdoi/images/themes/_decor/anhdao-pink/bg-full.jpg')] bg-[length:100%_auto] bg-top bg-repeat-y"
          aria-hidden
        />
        {/* HEADER */}
        <div className="relative z-10 w-full">
          <img src={`${BASE}/1.webp`} alt="" aria-hidden className="block h-auto w-full" />
        </div>
        <header className="relative z-10 flex flex-col items-center justify-center px-6 pb-12 pt-0 text-center md:-mt-[200px] md:px-10 md:pb-16 lg:-mt-[200px]">
          {/* cành đào lớn mờ, lệch phải + chéo, phủ sau tên cặp đôi (giống bản gốc) + parallax. Header ở z-10 nên album (z-10, sau trong DOM) vẽ đè lên cành — cành hiện ở khoảng trống, không che ảnh. Mask fade đáy để cành tan dần thay vì bị album cắt ngang */}
          <img src={`${BASE}/3.webp`} alt="" aria-hidden data-parallax="0.18" data-flip="1" className="pointer-events-none absolute left-[-8%] top-[-28%] -z-10 h-[250%] w-[150%] max-w-none object-contain opacity-50" style={{ willChange: "transform", backfaceVisibility: "hidden", maskImage: "linear-gradient(to bottom, #000 55%, transparent 82%)", WebkitMaskImage: "linear-gradient(to bottom, #000 55%, transparent 82%)" }} />
          {heroImage ? (
            <div className="absolute right-[8.5vw] top-[-400px] z-20 rotate-[11.447deg] md:right-[5vw] md:top-[-896px] lg:right-8 lg:top-[-896px]">
              <div className="h-[88vw] w-[66vw] overflow-hidden border-[2.8vw] border-white bg-white shadow-2xl md:h-[62vw] md:w-[47vw] md:border-[2vw] lg:h-[448px] lg:w-[340px] lg:border-[14px]">
                <img src={heroImage} alt="Wedding photo" className="h-full w-full object-cover" />
              </div>
            </div>
          ) : null}
          <div className="relative z-10 flex flex-col items-center gap-0 text-[65px] leading-[98px] md:text-[91px] md:leading-[137px]" style={{ color: "#ba4a59", ...nameFont }}>
            <span>{people[0].shortName}</span>
            <span className="mt-1 text-[48px] leading-[72px] md:text-[65px] md:leading-[98px]">&amp;</span>
            <span>{people[1].shortName}</span>
          </div>
        </header>

        {gallery.length > 0 ? (
          <section className="relative z-10 flex flex-col items-center px-6 pb-12 md:px-10 md:pb-16">
            <h2 className="text-[20px] font-normal uppercase tracking-[0.05em]" style={{ fontFamily: 'Baskerville, "Times New Roman", serif', color: "#ae4c51" }}>Album Ảnh Cưới</h2>
            <div className="mt-6 w-full max-w-[432px] md:max-w-[600px]">
              <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={PINK} gridAspect="aspect-square" />
            </div>
          </section>
        ) : null}

        <div className="relative z-10 flex w-full flex-col items-center gap-14 px-4 pb-14 pt-10 md:px-10">
          {/* CEREMONY INFO */}
          <section className="flex w-full flex-col items-center gap-8">
            <CherryHeading>Thông Tin Lễ Cưới</CherryHeading>
            <div className="flex w-full flex-col items-center gap-6 md:flex-row md:items-start md:justify-center md:gap-10">
              {couple.brideFirst ? (<>{brideCol}{groomCol}</>) : (<>{groomCol}{brideCol}</>)}
            </div>
            <p className="whitespace-pre-line text-center text-[15px] uppercase tracking-wide md:text-[18px]" style={{ color: PINK_MUTED }}>{couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI."}</p>
            <div className="flex w-full flex-col items-center gap-2 text-center">
              {/* Không khai font ở tên: để thừa hưởng font body của thẻ, đúng cái
                  tên ba mẹ đang dùng. Giữ giống nhau bằng cơ chế thừa hưởng thay
                  vì trùng khớp bằng tay ở hai chỗ. */}
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[30px] leading-[1.15] md:text-[40px]">{people[0].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: PINK_MUTED }}>{people[0].birthOrder}</div>
              <div className="text-[24px] md:text-[32px]" style={nameFont}>&amp;</div>
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[30px] leading-[1.15] md:text-[40px]">{people[1].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: PINK_MUTED }}>{people[1].birthOrder}</div>
            </div>
            {ceremony ? (
              <div className="flex flex-col items-center gap-1 text-center">
                {couple.ceremonyHeader ? <span className="whitespace-pre-line text-[16px] uppercase leading-relaxed md:text-[20px]">{couple.ceremonyHeader}</span> : null}
                {couple.ceremonyTime ? <div className="text-[20px] md:text-[30px]">{couple.ceremonyTime}</div> : null}
                <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                  <span>{ceremony.weekday}</span><span>|</span><span className="text-[28px] font-bold">{ceremony.day}</span><span>|</span><span>Tháng {ceremony.month}</span>
                </div>
                <div className="text-[18px] md:text-[24px]">{ceremony.yearNumber}</div>
                <div className="text-xs opacity-75 md:text-sm">{ceremony.lunar}</div>
              </div>
            ) : null}
          </section>

          {/* RECEPTION + CALENDAR */}
          <section className="relative flex w-full flex-col items-center gap-3">
            <img src={`${BASE}/3.webp`} alt="" aria-hidden data-parallax="0.12" className="pointer-events-none absolute -top-24 right-[-12%] -z-10 h-[420px] w-auto max-w-none object-contain opacity-[0.22] md:-top-32 md:right-[-8%] md:h-[620px]" style={{ willChange: "transform", backfaceVisibility: "hidden" }} />
            <CherryHeading>Thông Tin Tiệc Cưới</CherryHeading>
            <p className="mt-2 text-center text-[16px] uppercase md:text-[20px]">Tiệc cưới sẽ diễn ra vào lúc:</p>
            <div className="text-[20px] font-semibold md:text-[30px]">{venue.banquetTime || couple.time}</div>
            {reception ? (
              <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                <span>{reception.weekday}</span><span>/</span><span>{reception.day}</span><span>/</span><span>Tháng {reception.month}</span>
              </div>
            ) : null}
            {reception ? <div className="text-[18px] md:text-[24px]">{reception.yearNumber}</div> : null}
            {reception ? <div className="text-xs opacity-75 md:text-sm">{reception.lunar}</div> : null}

            {calendar ? (
              <div className="relative mx-auto mt-8 w-full max-w-[340px] rounded-2xl border-2 px-6 py-6 md:mt-10 md:max-w-[420px]" style={{ borderColor: hexToRgba(PINK, 0.35), backgroundColor: BLUSH }}>
                <div className="flex h-full w-full flex-col items-center justify-center">
                  <p className="text-[12px] font-semibold uppercase tracking-wide md:text-[13px]">Tháng {calendar.month} / {calendar.year}</p>
                  <div className="mt-2 grid w-full grid-cols-7 text-[10px] font-medium opacity-70 md:text-[11px]">
                    {WEEKDAY_LABELS.map((d) => (<span key={d} className="py-0.5 text-center">{d}</span>))}
                  </div>
                  <div className="grid w-full grid-cols-7 gap-y-0.5 text-[11px] md:text-[12px]">
                    {calendar.cells.map((day, i) => (
                      <span key={i} className={`flex aspect-square items-center justify-center rounded-full ${day === calendar.highlight ? "font-bold text-white" : ""}`} style={day === calendar.highlight ? { backgroundColor: PINK } : undefined}>{day ?? ""}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <a href={googleCalendarUrl(content)} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center rounded-full border px-6 py-2 text-sm font-semibold transition" style={{ borderColor: PINK, color: PINK }}>Thêm vào lịch</a>
          </section>

          {/* VENUE MAP */}
          {mapQuery ? (
            <section className="flex w-full flex-col items-center gap-3 text-center">
              <CherryHeading>Tiệc cưới sẽ tổ chức tại</CherryHeading>
              <p className="mx-auto mt-1 max-w-sm whitespace-pre-line text-sm leading-6 md:max-w-[500px]">{venue.address}</p>
              <div className="mt-4 w-full overflow-hidden rounded-2xl border" style={{ borderColor: hexToRgba(PINK, 0.3) }}>
                <InvitationMap query={mapQuery} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <MapDirectionsButton query={mapQuery} style={{ color: PINK }} />
            </section>
          ) : null}

          {/* SCHEDULE */}
          {schedule.length > 0 ? (
            <section className="relative flex w-full flex-col items-center gap-6">
              <img src={`${BASE}/1.webp`} alt="" aria-hidden data-parallax="0.14" className="pointer-events-none absolute -left-6 top-[70px] -z-10 h-[130px] w-auto object-contain opacity-[0.15] md:h-[190px]" style={{ willChange: "transform", backfaceVisibility: "hidden" }} />
              <img src={`${BASE}/2.webp`} alt="" aria-hidden data-parallax="0.1" className="pointer-events-none absolute -right-6 top-[70px] -z-10 h-[130px] w-auto object-contain opacity-[0.15] md:h-[190px]" style={{ willChange: "transform", backfaceVisibility: "hidden" }} />
              <CherryHeading>Lịch Trình Ngày Cưới</CherryHeading>
              <ol className="mx-auto flex w-full max-w-sm flex-col gap-4">
                {schedule.map((s, i) => (
                  <li key={`${s.time}-${i}`} className="flex items-baseline gap-4">
                    <span className="w-[64px] shrink-0 pt-0.5 text-right text-[16px] tabular-nums tracking-wide md:text-[17px]">{s.time}</span>
                    <span className="text-[16px] font-medium leading-tight md:text-[18px]">{s.label}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* WISHES */}
          <section className="relative w-full">
            <div className="text-center"><CherryHeading>Sổ Lưu Bút</CherryHeading></div>
            <SharedWishForm accent={PINK} />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                {wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-xs" style={{ borderColor: hexToRgba(PINK, 0.2), backgroundColor: "#ffffff" }}>
                    <div className="flex items-start justify-between">
                      <span className="font-semibold" style={{ color: PINK }}>{w.name}</span>
                      <span className="text-xs opacity-70">{formatWishTime(w.time)}</span>
                    </div>
                    <p className="mt-2 leading-relaxed">{w.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          {/* GIFT ENVELOPE */}
          {banks.length > 0 ? (
            <section className="w-full text-center">
              <GiftEnvelope templateSlug={content.slug} banks={banks} accent={PINK} dark={PINK} cardBg={BLUSH} heading="Hộp Quà Mừng" labelColor={PINK_MUTED} />
            </section>
          ) : null}
        </div>

        {/* FOOTER */}
        <img src={`${BASE}/1.webp`} alt="" aria-hidden className="pointer-events-none absolute -bottom-4 left-0 z-0 h-[360px] w-auto max-w-none object-contain opacity-[0.11] md:h-[520px]" />
        <img src={`${BASE}/2.webp`} alt="" aria-hidden className="pointer-events-none absolute -bottom-4 right-0 z-0 h-[360px] w-auto max-w-none object-contain opacity-[0.11] md:h-[520px]" />
        <footer data-template-footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 text-center">
          <span className="text-[12px] md:text-[15px] lg:text-[18px]" style={{ color: PINK }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: PINK }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}
