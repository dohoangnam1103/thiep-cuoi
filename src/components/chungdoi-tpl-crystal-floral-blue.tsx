"use client";

import {
  hexToRgba,
  formatDate,
  buildCalendar,
  formatWishTime,
  AlbumGallery,
  googleCalendarUrl,
  InvitationMap,
  MapDirectionsButton,
  FamilyColumn,
  GiftEnvelope,
  SharedWishForm,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { orderedCouple, orderByBrideFirst } from "@/lib/invitation-display";

const BLUE_BASE = "/chungdoi/images/themes/_decor/crystal-floral-blue";
const BLUE = "#2a4a7f";
const BLUE_MUTED = "rgba(42, 74, 127, 0.72)";

const nameFont = { fontFamily: '"DFVN New Eddy", "Fz Qellia", cursive' };
const ampFont = { fontFamily: '"Alex Brush", "The Nautigal", cursive' };

function BlueHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: BLUE }}>
      {children}
    </h2>
  );
}

/** Faithful rebuild of the Crystal Floral Blue (hoa-thuy-tinh-lam) opened invitation. */
export function CrystalFloralInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes, bank } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();

  const groomCol = <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  const banks = orderByBrideFirst(
    { label: `${couple.brideBirthOrder || "Út Nữ"} - ${bank.brideAccountName}`, bank: bank.brideBankName || "Ngân hàng", num: bank.brideAccountNumber, name: bank.brideAccountName },
    { label: `${couple.groomBirthOrder || "Trưởng Nam"} - ${bank.groomAccountName}`, bank: bank.groomBankName || "Ngân hàng", num: bank.groomAccountNumber, name: bank.groomAccountName },
    couple.brideFirst,
  ).filter((q) => q.num || q.name);

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div className="relative w-full max-w-[480px] overflow-hidden md:mx-auto md:max-w-[900px] md:border" style={{ color: BLUE, borderColor: hexToRgba(BLUE, 0.2) }}>
        {/* faint side flower */}
        <img src={`${BLUE_BASE}/flower1.webp`} alt="" aria-hidden className="pointer-events-none absolute top-[640px] -left-[25%] -z-10 h-[900px] w-auto max-w-none object-contain opacity-[0.15] md:top-[760px] md:-left-[15%] md:h-[1400px] lg:h-[1200px]" />

        {/* HEADER — source-specific crystal floral frame */}
        <section className="relative isolate z-20 mt-[30px] w-full md:mt-[105px]">
          <header className="relative z-20 flex w-full flex-col items-center px-4 pb-4 pt-[72px] sm:px-5 md:pb-8 md:pt-[100px]">
            <div className="relative w-[90%] max-w-[340px] md:max-w-[520px] lg:max-w-[580px]">
              <img src={`${BLUE_BASE}/flower-frame.webp`} alt="" aria-hidden className="relative z-10 block h-auto w-full object-contain" />
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center uppercase leading-none" style={{ ...nameFont, color: "#215589" }}>
                <span className="flex w-[48%] justify-center whitespace-nowrap text-[clamp(26px,5vw,42px)] leading-[1.25]">{people[0].shortName}</span>
                <span className="my-4 text-[clamp(18px,3vw,21px)] normal-case leading-none md:my-8 lg:my-10" style={ampFont}>&amp;</span>
                <span className="flex w-[48%] justify-center whitespace-nowrap text-[clamp(26px,5vw,42px)] leading-[1.25]">{people[1].shortName}</span>
              </div>
            </div>
          </header>
        </section>

        <div className="relative z-10 flex w-full flex-col items-center gap-14 px-4 pb-14 md:px-10">
          {/* CEREMONY INFO */}
          <section className="flex w-full flex-col items-center gap-8">
            <BlueHeading>Thông Tin Lễ Cưới</BlueHeading>
            <div className="flex w-full items-start justify-center gap-3 md:gap-10">
              {couple.brideFirst ? (<>{brideCol}{groomCol}</>) : (<>{groomCol}{brideCol}</>)}
            </div>
            <div className="whitespace-pre-line text-center text-[16px] uppercase leading-relaxed tracking-wide md:text-[20px]">
              {couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI."}
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="flex min-h-[80px] w-[80%] items-center justify-center text-[44px] leading-[1.1] md:text-[60px]" style={nameFont}>{people[0].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: BLUE_MUTED }}>{people[0].birthOrder}</div>
              <div className="text-[24px] md:text-[32px]" style={ampFont}>&amp;</div>
              <h3 className="flex min-h-[80px] w-[80%] items-center justify-center text-[44px] leading-[1.1] md:text-[60px]" style={nameFont}>{people[1].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: BLUE_MUTED }}>{people[1].birthOrder}</div>
            </div>
            {ceremony ? (
              <div className="flex flex-col items-center gap-1 text-center">
                {couple.ceremonyHeader ? <span className="whitespace-pre-line text-[16px] uppercase leading-relaxed md:text-[20px]">{couple.ceremonyHeader}</span> : null}
                {couple.ceremonyTime ? <div className="text-[20px] md:text-[30px]">{couple.ceremonyTime}</div> : null}
                <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                  <span>{ceremony.weekday}</span><span>|</span><span className="text-[28px] font-bold">{ceremony.day}</span><span>|</span><span>Tháng {ceremony.month}</span>
                </div>
                <div className="text-[18px] md:text-[24px]">{ceremony.yearNumber}</div>
                <div className="text-xs uppercase tracking-[0.25em] md:text-sm" style={{ color: BLUE_MUTED }}>{ceremony.lunar}</div>
              </div>
            ) : null}
            <div className="relative flex justify-center">
              <img src={`${BLUE_BASE}/filigree.webp`} alt="" aria-hidden className="h-auto w-[380px] object-contain md:w-[680px]" />
            </div>
          </section>

          {/* ALBUM */}
          {gallery.length > 0 ? (
            <section className="flex w-full flex-col items-center gap-6">
              <BlueHeading>Album Ảnh Cưới</BlueHeading>
              <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={BLUE} />
            </section>
          ) : null}

          {/* RECEPTION INFO + calendar */}
          <section className="relative flex w-full flex-col items-center gap-3">
            <img src={`${BLUE_BASE}/flower3.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-30 right-0 -z-10 h-[700px] w-auto max-w-none object-contain opacity-[0.17] md:-top-150 md:right-[20%] md:h-[900px]" />
            <BlueHeading>Thông Tin Tiệc Cưới</BlueHeading>
            <p className="mt-2 text-center text-[16px] uppercase md:text-[20px]">Tiệc cưới sẽ diễn ra vào lúc:</p>
            <div className="text-[20px] font-semibold md:text-[30px]">{venue.banquetTime || couple.time}</div>
            {reception ? (
              <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                <span>{reception.weekday}</span><span>/</span><span>{reception.day}</span><span>/</span><span>Tháng {reception.month}</span>
              </div>
            ) : null}
            {reception ? <div className="text-[18px] md:text-[24px]">{reception.yearNumber}</div> : null}
            {reception ? <div className="text-xs uppercase tracking-[0.25em] md:text-base" style={{ color: BLUE_MUTED }}>{reception.lunar}</div> : null}

            {/* calendar framed by calendar-frame */}
            {calendar ? (
              <div className="relative mx-auto mt-8 aspect-[388/332] w-full max-w-[340px] md:mt-10 md:max-w-[420px]">
                <img src={`${BLUE_BASE}/calendar-frame.webp`} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
                <div className="relative flex h-full w-full flex-col items-center justify-center px-8 py-6">
                  <p className="text-[12px] font-semibold uppercase tracking-wide md:text-[13px]">Tháng {calendar.month} / {calendar.year}</p>
                  <div className="mt-2 grid w-full grid-cols-7 text-[10px] font-medium opacity-70 md:text-[11px]">
                    {WEEKDAY_LABELS.map((d) => (<span key={d} className="py-0.5 text-center">{d}</span>))}
                  </div>
                  <div className="grid w-full grid-cols-7 gap-y-0.5 text-[11px] md:text-[12px]">
                    {calendar.cells.map((day, i) => (
                      <span key={i} className={`flex aspect-square items-center justify-center rounded-full ${day === calendar.highlight ? "font-bold text-white" : ""}`} style={day === calendar.highlight ? { backgroundColor: BLUE } : undefined}>{day ?? ""}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <a href={googleCalendarUrl(content)} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center rounded-full border px-6 py-2 text-sm font-semibold transition" style={{ borderColor: BLUE, color: BLUE }}>Thêm vào lịch</a>

            <div className="relative flex justify-center pt-6 md:pt-8">
              <img src={`${BLUE_BASE}/cake.webp`} alt="" aria-hidden className="h-auto w-[450px] object-contain md:w-[730px]" />
            </div>
          </section>

          {/* VENUE MAP */}
          {mapQuery ? (
            <section className="flex w-full flex-col items-center gap-3 text-center">
              <h3 className="text-[20px] font-bold uppercase md:text-[24px]" style={{ color: BLUE }}>Tiệc cưới sẽ tổ chức tại</h3>
              <p className="mx-auto mt-1 max-w-sm whitespace-pre-line text-sm leading-6 md:max-w-[500px]">{venue.address}</p>
              <div className="mt-4 w-full overflow-hidden rounded-2xl border" style={{ borderColor: hexToRgba(BLUE, 0.3) }}>
                <InvitationMap query={mapQuery} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <MapDirectionsButton query={mapQuery} style={{ color: BLUE }} />
            </section>
          ) : null}

          {/* SCHEDULE — with corner floral decor */}
          {schedule.length > 0 ? (
            <section className="relative flex w-full flex-col items-center gap-6">
              <div className="pointer-events-none absolute top-[90px] bottom-[20px] left-12 -z-10 flex flex-col items-center justify-between opacity-90 md:left-16">
                <img src={`${BLUE_BASE}/flower4.webp`} alt="" aria-hidden className="h-[60px] w-auto object-contain md:h-[80px]" />
                <img src={`${BLUE_BASE}/flower5.webp`} alt="" aria-hidden className="h-[120px] w-auto object-contain md:h-[160px]" />
              </div>
              <BlueHeading>Lịch Trình Ngày Cưới</BlueHeading>
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

          {/* WISHES — with faint corner flower */}
          <section className="relative w-full">
            <img src={`${BLUE_BASE}/flower1.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-82 left-0 -z-10 h-[700px] w-auto max-w-none object-contain opacity-[0.17] md:-top-120 md:left-50 md:h-[800px]" />
            <div className="text-center"><BlueHeading>Sổ Lưu Bút</BlueHeading></div>
            <SharedWishForm accent={BLUE} />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                {wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-xs" style={{ borderColor: hexToRgba(BLUE, 0.2), backgroundColor: "#ffffff" }}>
                    <div className="flex items-start justify-between">
                      <span className="font-semibold" style={{ color: BLUE }}>{w.name}</span>
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
            <section className="relative w-full text-center">
              <GiftEnvelope banks={banks} accent={BLUE} dark={BLUE} cardBg="#f8fbff" heading="Hộp Quà Mừng" labelColor={BLUE_MUTED} />
            </section>
          ) : null}
        </div>

        {/* FOOTER */}
        <footer data-template-footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 text-center">
          <span className="text-[12px] md:text-[15px] lg:text-[18px]" style={{ color: BLUE }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: BLUE }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}
