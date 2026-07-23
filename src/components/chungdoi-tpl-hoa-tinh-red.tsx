"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { invitationHeroImage, orderedCouple, orderByBrideFirst } from "@/lib/invitation-display";
import {
  hexToRgba, formatDate, buildCalendar, formatWishTime,
  useLightbox, Lightbox, googleCalendarUrl, InvitationMap, MapDirectionsButton,
  FamilyColumn, GiftEnvelope, SharedCarousel, SharedCountdown, SharedWishForm, WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";

const BASE = "/chungdoi/images/themes/_decor/love-art";
const PURPLE = "#d70c1b";
const PURPLE_MUTED = "rgba(215,12,27,0.72)";

function HoaTinhHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-[22px] font-bold uppercase tracking-wide md:text-[28px]" style={{ color: PURPLE }}>
      {children}
    </h2>
  );
}

export function HoaTinhInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes, bank } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const firstPhoto = invitationHeroImage(content);
  const secondPhoto = content.heroImage ? gallery[0] : gallery[1];
  const { lightbox, setLightbox } = useLightbox(gallery.length);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const nameFont = { fontFamily: '"Alex Brush", cursive' };

  const groomCol = <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  const banks = orderByBrideFirst(
    { label: `${couple.brideBirthOrder || "Út Nữ"} - ${bank.brideAccountName}`, bank: bank.brideBankName, num: bank.brideAccountNumber, name: bank.brideAccountName },
    { label: `${couple.groomBirthOrder || "Trưởng Nam"} - ${bank.groomAccountName}`, bank: bank.groomBankName, num: bank.groomAccountNumber, name: bank.groomAccountName },
    couple.brideFirst,
  ).filter((q) => q.bank);

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div className="relative w-full max-w-[480px] overflow-hidden md:mx-auto md:max-w-[900px] md:border" style={{ color: PURPLE, borderColor: hexToRgba(PURPLE, 0.2) }}>
        {/* HEADER */}
        <header className="relative z-20 w-full overflow-hidden" aria-label="Đầu thiệp">
          <div className="absolute left-1/2 top-[44px] z-[5] w-[82%] max-w-[340px] -translate-x-1/2 md:top-[50px] md:w-[90%] md:max-w-[510px]">
            <div className="relative pb-[115%]">
              <div className="absolute left-0 top-0 z-[5] w-[57%] -rotate-[4deg]">
                <div className="relative pb-[133.33%]">
                  {firstPhoto ? <img src={firstPhoto} alt={people[0].fullName} className="absolute left-[2%] top-[2%] h-[96%] w-[96%] rounded-[6px] object-cover shadow-md" /> : null}
                  <img src={`${BASE}/bride frame.webp`} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
                </div>
              </div>
              <div className="absolute bottom-[-50px] right-0 z-[6] w-[55%] rotate-[3deg]">
                <div className="relative pb-[133.33%]">
                  {secondPhoto ? <img src={secondPhoto} alt={people[1].fullName} className="absolute left-[2%] top-[2%] h-[96%] w-[96%] rounded-[6px] object-cover shadow-md" /> : null}
                  <img src={`${BASE}/groom frame.webp`} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
                </div>
              </div>
              <img src={`${BASE}/hy.webp`} alt="" aria-hidden className="pointer-events-none absolute right-[calc(-16%+80px)] top-[2%] z-[4] w-[26%] md:right-[calc(-16%+40px)] lg:right-[calc(-16%+50px)]" />
              <img src={`${BASE}/hoa tim.webp`} alt="" aria-hidden className="pointer-events-none absolute right-[calc(-16%+80px)] top-[34%] z-[4] w-[18%] md:right-[calc(-16%+90px)] md:top-[31%] lg:right-[calc(-16%+100px)]" />
            </div>
          </div>
          <div className="absolute bottom-[calc(27%-70px)] left-[5%] z-[7] flex flex-col items-center text-center md:bottom-[calc(27%-125px)] md:left-[calc(5%+150px)]">
            <p className="text-[13px] md:text-[15px]">{people[0].birthOrder}</p>
            <p className="text-[19px] font-bold uppercase md:text-[23px]">{people[0].shortName}</p>
            <img src={`${BASE}/dau.webp`} alt="" aria-hidden className="mt-[15px] w-[70px] md:mt-[25px] md:w-[85px]" />
          </div>
          <img src={`${BASE}/tim.webp`} alt="" aria-hidden className="pointer-events-none absolute bottom-[calc(10%-20px)] left-[calc(42%-100px)] z-[6] w-[11%] max-w-[48px] md:bottom-[calc(10%-50px)] md:max-w-[58px]" />
          <div className="absolute bottom-[5%] right-[5%] z-[7] flex items-center md:right-[calc(5%+130px)]">
            <img src={`${BASE}/re.webp`} alt="" aria-hidden className="mr-[15px] w-[113px] md:mr-[25px] md:w-[135px]" />
            <div className="text-center">
              <p className="text-[13px] md:text-[15px]">{people[1].birthOrder}</p>
              <p className="text-[19px] font-bold uppercase md:text-[23px]">{people[1].shortName}</p>
            </div>
          </div>
          <div className="h-[600px] w-full md:h-[840px]" />
        </header>

        <div className="relative z-10 flex w-full flex-col items-center gap-14 px-4 pb-14 pt-10 md:px-10">
          {/* CEREMONY INFO */}
          <section className="flex w-full flex-col items-center gap-8">
            <HoaTinhHeading>Thông Tin Lễ Cưới</HoaTinhHeading>
            <div className="flex w-full items-start justify-center gap-3 md:gap-10">
              {couple.brideFirst ? (<>{brideCol}{groomCol}</>) : (<>{groomCol}{brideCol}</>)}
            </div>
            <p className="whitespace-pre-line text-center text-[14px] uppercase leading-relaxed md:text-[18px]">{couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI."}</p>
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[42px] leading-[1.1] md:text-[58px]" style={nameFont}>{people[0].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: PURPLE_MUTED }}>{people[0].birthOrder}</div>
              <div className="text-[24px] md:text-[32px]" style={nameFont}>&amp;</div>
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[42px] leading-[1.1] md:text-[58px]" style={nameFont}>{people[1].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: PURPLE_MUTED }}>{people[1].birthOrder}</div>
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

          {/* ALBUM */}
          {gallery.length > 0 ? (
            <section className="flex w-full flex-col items-center gap-6">
              <HoaTinhHeading>Album Ảnh Cưới</HoaTinhHeading>
              <div className="relative mx-auto aspect-[3/4] w-full max-w-[400px] overflow-hidden rounded-xl border md:max-w-[480px]" style={{ borderColor: hexToRgba(PURPLE, 0.3) }}>
                <SharedCarousel photos={gallery} arrowColor={PURPLE} />
              </div>
              <Lightbox gallery={gallery} index={lightbox} setIndex={setLightbox} accent={PURPLE} />
            </section>
          ) : null}

          {/* RECEPTION + CALENDAR */}
          <section className="relative flex w-full flex-col items-center gap-3">
            <img src={`${BASE}/hoa tim.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-20 right-0 -z-10 h-[300px] w-auto max-w-none object-contain opacity-[0.15] md:h-[420px]" />
            <HoaTinhHeading>Thông Tin Tiệc Cưới</HoaTinhHeading>
            <p className="mt-2 text-center text-[16px] uppercase md:text-[20px]">Tiệc cưới sẽ diễn ra vào lúc:</p>
            <div className="text-[20px] font-semibold md:text-[30px]">{venue.banquetTime || couple.time}</div>
            {reception ? (
              <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                <span>{reception.weekday}</span><span>/</span><span>{reception.day}</span><span>/</span><span>Tháng {reception.month}</span>
              </div>
            ) : null}
            {reception ? <div className="text-[18px] md:text-[24px]">{reception.yearNumber}</div> : null}
            {reception ? <div className="text-xs opacity-75 md:text-sm">{reception.lunar}</div> : null}

            <div className="mt-4 flex flex-col items-center">
              <HoaTinhHeading>Cùng đếm ngược</HoaTinhHeading>
              <SharedCountdown target={`${couple.date}T${couple.time || "18:00"}`} style={{ color: PURPLE }} />
            </div>

            {calendar ? (
              <div className="relative mx-auto mt-8 aspect-[388/332] w-full max-w-[340px] md:mt-10 md:max-w-[420px]">
                <img src={`${BASE}/lich.webp`} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
                <div className="relative flex h-full w-full flex-col items-center justify-center px-8 py-6">
                  <p className="text-[12px] font-semibold uppercase tracking-wide md:text-[13px]">Tháng {calendar.month} / {calendar.year}</p>
                  <div className="mt-2 grid w-full grid-cols-7 text-[10px] font-medium opacity-70 md:text-[11px]">
                    {WEEKDAY_LABELS.map((d) => (<span key={d} className="py-0.5 text-center">{d}</span>))}
                  </div>
                  <div className="grid w-full grid-cols-7 gap-y-0.5 text-[11px] md:text-[12px]">
                    {calendar.cells.map((day, i) => (
                      <span key={i} className={`flex aspect-square items-center justify-center rounded-full ${day === calendar.highlight ? "font-bold text-white" : ""}`} style={day === calendar.highlight ? { backgroundColor: PURPLE } : undefined}>{day ?? ""}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <a href={googleCalendarUrl(content)} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center rounded-full border px-6 py-2 text-sm font-semibold transition" style={{ borderColor: PURPLE, color: PURPLE }}>Thêm vào lịch</a>
          </section>

          {/* VENUE MAP */}
          {mapQuery ? (
            <section className="flex w-full flex-col items-center gap-3 text-center">
              <HoaTinhHeading>Tiệc cưới sẽ tổ chức tại</HoaTinhHeading>
              <p className="mx-auto mt-1 max-w-sm whitespace-pre-line text-sm leading-6 md:max-w-[500px]">{venue.address}</p>
              <div className="mt-4 w-full overflow-hidden rounded-2xl border" style={{ borderColor: hexToRgba(PURPLE, 0.3) }}>
                <InvitationMap query={mapQuery} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <MapDirectionsButton query={mapQuery} style={{ color: PURPLE }} />
            </section>
          ) : null}

          {/* SCHEDULE */}
          {schedule.length > 0 ? (
            <section className="relative flex w-full flex-col items-center gap-6">
              <img src={`${BASE}/re ly.webp`} alt="" aria-hidden className="pointer-events-none absolute -left-2 top-[80px] -z-10 h-[160px] w-auto object-contain opacity-20 md:h-[220px]" />
              <img src={`${BASE}/dau ly.webp`} alt="" aria-hidden className="pointer-events-none absolute -right-2 top-[80px] -z-10 h-[160px] w-auto object-contain opacity-20 md:h-[220px]" />
              <HoaTinhHeading>Lịch Trình Ngày Cưới</HoaTinhHeading>
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
            <div className="text-center"><HoaTinhHeading>Sổ Lưu Bút</HoaTinhHeading></div>
            <SharedWishForm accent={PURPLE} />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                {wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-xs" style={{ borderColor: hexToRgba(PURPLE, 0.2), backgroundColor: "#ffffff" }}>
                    <div className="flex items-start justify-between">
                      <span className="font-semibold" style={{ color: PURPLE }}>{w.name}</span>
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
              <GiftEnvelope banks={banks} accent={PURPLE} dark="#111111" cardBg="#fffaf7" heading="Hộp Quà Mừng" labelColor={PURPLE_MUTED} />
            </section>
          ) : null}
        </div>

        {/* FOOTER */}
        <div className="relative flex justify-center pb-2">
          <img src={`${BASE}/thanks.webp`} alt="" aria-hidden className="h-auto w-[170px] object-contain opacity-90 md:w-[220px]" />
        </div>
        <footer data-template-footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 text-center">
          <span className="text-[12px] md:text-[15px] lg:text-[18px]" style={{ color: "#111111" }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: PURPLE }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}
