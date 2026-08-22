"use client";

import type { CSSProperties, ReactNode } from "react";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  hexToRgba, formatDate, buildCalendar, formatWishTime,
  googleCalendarUrl, InvitationMap, MapDirectionsButton,
  FamilyColumn, SharedWishForm, WEEKDAY_LABELS,
  GiftEnvelope, GiftQrGrid, AlbumGallery,
} from "@/components/chungdoi-tpl-shared";
import {
  invitationCeremonyMessage,
  invitationGiftAccounts,
  invitationOpeningMessage,
  orderByBrideFirst,
} from "@/lib/invitation-display";

export type FloralDecor = { src: string; className: string; flip?: boolean };

export type FloralPalette = {
  outerBg: string;
  cardBg: string;
  surfaceBg?: string;
  text: string;
  accent: string;
  headingUpper?: boolean;
  nameFont: CSSProperties;
  ampFont?: CSSProperties;
  welcome?: string;
  giftHeading?: string;
  giftMode?: "envelope" | "qr";
  giftColor?: string;
  footerBg?: string;
  footerText?: string;
};

type Props = {
  content: ChungDoiDemoContent;
  palette: FloralPalette;
  hero?: ReactNode;
  albumFirst?: boolean;
  backdrop?: FloralDecor[];
  headerDecor?: FloralDecor[];
  albumDecor?: FloralDecor[];
  lowerDecor?: FloralDecor;
  footerDecor?: FloralDecor;
  dividerSrc?: string;
};

function FloralHeading({ accent, upper, children }: { accent: string; upper: boolean; children: ReactNode }) {
  return (
    <h2 className={`text-center text-[20px] font-bold tracking-wide md:text-[26px] ${upper ? "uppercase" : ""}`} style={{ color: accent }}>{children}</h2>
  );
}

export function FloralInvitation({ content, palette, hero, albumFirst = false, backdrop = [], headerDecor = [], albumDecor = [], lowerDecor, footerDecor, dividerSrc }: Props) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const P = palette;
  const muted = hexToRgba(P.accent, 0.72);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const amp = P.ampFont || P.nameFont;

  const groomCol = <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  const orderedPeople = orderByBrideFirst(
    { fullName: couple.brideFullName, birthOrder: couple.brideBirthOrder || "Út Nữ" },
    { fullName: couple.groomFullName, birthOrder: couple.groomBirthOrder || "Trưởng Nam" },
    couple.brideFirst,
  );
  const orderedShortNames = orderByBrideFirst(
    couple.brideShortName || couple.brideFullName,
    couple.groomShortName || couple.groomFullName,
    couple.brideFirst,
  );
  const banks = invitationGiftAccounts(content).map((account) => ({
    label: `${account.birthOrder} - ${account.name}`,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));

  const albumSection = gallery.length > 0 ? (
    <section className="relative flex w-full flex-col items-center gap-6">
      {albumDecor.map((d, i) => (
        <img key={`ad-${i}`} src={d.src} alt="" aria-hidden className={`pointer-events-none absolute -z-10 h-auto w-auto max-w-none object-contain ${d.flip ? "-scale-x-100" : ""} ${d.className}`} />
      ))}
      <FloralHeading accent={P.accent} upper={P.headingUpper !== false}>Album Ảnh Cưới</FloralHeading>
      <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={P.accent} />
    </section>
  ) : null;

  return (
    <div className="flex w-full justify-center overflow-x-clip" style={{ background: P.outerBg }}>
      <div className="relative w-full max-w-[480px] overflow-hidden mx-auto md:max-w-[900px] md:border" style={{ color: P.text, borderColor: hexToRgba(P.accent, 0.2), backgroundColor: P.surfaceBg }}>
        {backdrop.map((d, i) => (
          <img key={`bd-${i}`} src={d.src} alt="" aria-hidden className={`pointer-events-none absolute -z-10 h-auto w-auto max-w-none object-contain ${d.flip ? "-scale-x-100" : ""} ${d.className}`} />
        ))}
        {lowerDecor ? (
          <img data-template-lower-decor src={lowerDecor.src} alt="" aria-hidden className={`pointer-events-none absolute z-0 h-auto w-auto max-w-none object-contain ${lowerDecor.flip ? "-scale-x-100" : ""} ${lowerDecor.className}`} />
        ) : null}

        {hero ?? (
          <header className="relative z-20 flex w-full flex-col items-center px-4 pt-[70px] sm:px-5 md:pt-[100px]">
            {headerDecor.map((d, i) => (
              <img key={`hd-${i}`} src={d.src} alt="" aria-hidden className={`pointer-events-none absolute -z-10 h-auto w-auto max-w-none object-contain ${d.flip ? "-scale-x-100" : ""} ${d.className}`} />
            ))}
            <p className="relative z-30 text-center text-[13px] uppercase tracking-[0.3em] md:text-[16px]" style={{ color: muted }}>{P.welcome || "Welcome To Our Wedding"}</p>
            <div className="relative z-30 mt-4 flex flex-col items-center leading-none" style={{ color: P.text }}>
              <span className="text-[54px] md:text-[72px]" style={P.nameFont}>{orderedShortNames[0]}</span>
              <span className="my-1 text-[34px] md:text-[42px]" style={amp}>&amp;</span>
              <span className="text-[54px] md:text-[72px]" style={P.nameFont}>{orderedShortNames[1]}</span>
            </div>
          </header>
        )}

        <div className="relative z-10 flex w-full flex-col items-center gap-14 px-4 pb-14 pt-10 md:px-10">
          {albumFirst ? albumSection : null}
          <section className="flex w-full flex-col items-center gap-8">
            <FloralHeading accent={P.accent} upper={P.headingUpper !== false}>Thông Tin Lễ Cưới</FloralHeading>
            <div className="flex w-full flex-col items-center gap-6 md:flex-row md:items-start md:justify-center md:gap-10">
              {couple.brideFirst ? (<>{brideCol}{groomCol}</>) : (<>{groomCol}{brideCol}</>)}
            </div>
            <p className="max-w-xl whitespace-pre-line text-center text-[14px] font-semibold uppercase leading-relaxed tracking-wide md:text-[17px]">
              {invitationOpeningMessage(content)}
            </p>
            <div className="flex w-full flex-col items-center gap-2 text-center">
              {/* Không khai font ở tên: để thừa hưởng font body của thẻ, đúng cái
                  tên ba mẹ đang dùng. Cỡ chữ hạ theo vì font body rộng hơn script
                  nên giữ cỡ cũ là tràn khung. */}
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[30px] leading-[1.15] md:text-[40px]">{orderedPeople[0].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: muted }}>{orderedPeople[0].birthOrder}</div>
              <div className="text-[24px] md:text-[32px]" style={amp}>&amp;</div>
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[30px] leading-[1.15] md:text-[40px]">{orderedPeople[1].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: muted }}>{orderedPeople[1].birthOrder}</div>
            </div>
            {ceremony ? (
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="whitespace-pre-line text-[16px] uppercase leading-relaxed md:text-[20px]">{invitationCeremonyMessage(content)}</span>
                {couple.ceremonyTime ? <div className="text-[20px] md:text-[30px]">{couple.ceremonyTime}</div> : null}
                <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                  <span>{ceremony.weekday}</span><span>|</span><span className="text-[28px] font-bold">{ceremony.day}</span><span>|</span><span>Tháng {ceremony.month}</span>
                </div>
                <div className="text-[18px] md:text-[24px]">{ceremony.yearNumber}</div>
                <div className="text-xs leading-relaxed opacity-75 md:text-sm">{ceremony.lunar}</div>
              </div>
            ) : null}
          </section>

          {!albumFirst ? albumSection : null}

          <section className="relative flex w-full flex-col items-center gap-3">
            <FloralHeading accent={P.accent} upper={P.headingUpper !== false}>Thông Tin Tiệc Cưới</FloralHeading>
            <p className="mt-2 text-center text-[16px] uppercase md:text-[20px]">Tiệc cưới sẽ diễn ra vào lúc:</p>
            <div className="text-[20px] font-semibold md:text-[30px]">{couple.time || venue.banquetTime}</div>
            {reception ? (
              <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                <span>{reception.weekday}</span><span>/</span><span>{reception.day}</span><span>/</span><span>Tháng {reception.month}</span>
              </div>
            ) : null}
            {reception ? <div className="text-[18px] md:text-[24px]">{reception.yearNumber}</div> : null}
            {reception ? <div className="text-xs leading-relaxed opacity-75 md:text-sm">{reception.lunar}</div> : null}
            {calendar ? (
              <div className="relative mx-auto mt-8 w-full max-w-[340px] rounded-2xl border px-8 py-6 md:mt-10 md:max-w-[420px]" style={{ borderColor: hexToRgba(P.accent, 0.3), backgroundColor: P.cardBg }}>
                <div className="relative flex h-full w-full flex-col items-center justify-center">
                  <p className="text-[12px] font-semibold uppercase tracking-wide md:text-[13px]">Tháng {calendar.month} / {calendar.year}</p>
                  <div className="mt-2 grid w-full grid-cols-7 text-[10px] font-medium opacity-70 md:text-[11px]">
                    {WEEKDAY_LABELS.map((d) => (<span key={d} className="py-0.5 text-center">{d}</span>))}
                  </div>
                  <div className="grid w-full grid-cols-7 gap-y-0.5 text-[11px] md:text-[12px]">
                    {calendar.cells.map((day, i) => (
                      <span key={i} className={`flex aspect-square items-center justify-center rounded-full ${day === calendar.highlight ? "font-bold text-white" : ""}`} style={day === calendar.highlight ? { backgroundColor: P.accent } : undefined}>{day ?? ""}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
            <a href={googleCalendarUrl(content)} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center rounded-full border px-6 py-2 text-sm font-semibold transition" style={{ borderColor: P.accent, color: P.accent }}>Thêm vào lịch</a>
          </section>

          {mapQuery ? (
            <section className="flex w-full flex-col items-center gap-3 text-center">
              <FloralHeading accent={P.accent} upper={P.headingUpper !== false}>Tiệc cưới sẽ tổ chức tại</FloralHeading>
              <p className="mx-auto mt-1 max-w-sm whitespace-pre-line text-sm leading-6 md:max-w-[500px]">{venue.address}</p>
              <div className="mt-4 w-full overflow-hidden rounded-2xl border" style={{ borderColor: hexToRgba(P.accent, 0.3) }}>
                <InvitationMap query={mapQuery} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <MapDirectionsButton query={mapQuery} style={{ color: P.accent }} />
            </section>
          ) : null}


          {schedule.length > 0 ? (
            <section className="flex w-full flex-col items-center gap-6">
              <FloralHeading accent={P.accent} upper={P.headingUpper !== false}>Lịch Trình Ngày Cưới</FloralHeading>
              {dividerSrc ? <img src={dividerSrc} alt="" aria-hidden className="pointer-events-none h-auto w-[220px] max-w-[70%] object-contain opacity-90 md:w-[300px]" /> : null}
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

          <section className="relative w-full">
            <div className="text-center"><FloralHeading accent={P.accent} upper={P.headingUpper !== false}>Sổ Lưu Bút</FloralHeading></div>
            <SharedWishForm accent={P.accent} />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                {wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-xs" style={{ borderColor: hexToRgba(P.accent, 0.2), backgroundColor: P.cardBg }}>
                    <div className="flex items-start justify-between">
                      <span className="font-semibold" style={{ color: P.accent }}>{w.name}</span>
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
              {P.giftMode === "qr" ? (
                <GiftQrGrid banks={banks} accent={P.giftColor ?? P.accent} heading={P.giftHeading || "Hộp Quà Mừng"} />
              ) : (
                <GiftEnvelope templateSlug={content.slug} banks={banks} accent={P.accent} dark={P.giftColor ?? P.accent} cardBg={P.cardBg} heading={P.giftHeading || "Phong Bao Mừng Cưới"} labelColor={muted} />
              )}
            </section>
          ) : null}
        </div>

        {footerDecor ? (
          <div className="relative flex justify-center pb-2">
            <img src={footerDecor.src} alt="" aria-hidden className={`pointer-events-none h-auto w-[360px] max-w-[90%] object-contain opacity-95 md:w-[520px] ${footerDecor.className}`} />
          </div>
        ) : null}
        <footer data-template-footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 text-center" style={{ backgroundColor: P.footerBg ?? P.accent }}>
          <span className="text-[12px] md:text-[15px] lg:text-[18px]" style={{ color: P.footerText ?? "#ffffff" }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: P.accent }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}
