"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { invitationHeroImage, orderedCouple, orderByBrideFirst } from "@/lib/invitation-display";
import {
  hexToRgba, formatDate, buildCalendar, formatWishTime,
  AlbumGallery, googleCalendarUrl, InvitationMap, MapDirectionsButton,
  FamilyColumn, GiftEnvelope, SharedWishForm, WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";

const BASE = "/chungdoi/images/themes/_decor/boho-floral-green";
const THEME_BASE = "/chungdoi/images/themes/boho-floral-green";
const GREEN = "#30530F";
const ACCENT = "#6B8040";
const GREEN_MUTED = "rgba(48,83,15,0.72)";
const CARD = "rgba(255, 250, 247, 0.95)";
const heroNameFont = { fontFamily: '"Fz Aghita", Baskerville, "Times New Roman", serif' };
const bodyNameFont = { fontFamily: '"Fz Qellia", Baskerville, "Times New Roman", serif' };

function BohoHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center font-['Times_New_Roman'] text-[22px] font-bold uppercase tracking-wide text-[#30530f] md:text-[24px]">
      {children}
    </h2>
  );
}

function BohoDivider() {
  return (
    <img
      src={`${BASE}/decoration_bar.webp`}
      alt=""
      aria-hidden
      className="pointer-events-none h-auto w-[220px] max-w-[70%] object-contain opacity-90 md:w-[300px]"
    />
  );
}

export function BohoFloralGreenInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes, bank } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const groomPortrait = content.portraits?.groom || invitationHeroImage(content);
  const bridePortrait = content.portraits?.bride || (content.heroImage ? gallery[0] : gallery[1]);

  const groomCol = <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  const banks = orderByBrideFirst(
    { label: `${couple.brideBirthOrder || "Út Nữ"} - ${bank.brideAccountName}`, bank: bank.brideBankName, num: bank.brideAccountNumber, name: bank.brideAccountName },
    { label: `${couple.groomBirthOrder || "Trưởng Nam"} - ${bank.groomAccountName}`, bank: bank.groomBankName, num: bank.groomAccountNumber, name: bank.groomAccountName },
    couple.brideFirst,
  ).filter((q) => q.bank);
  const heroCards = people.map((person) => ({ person, portrait: person.side === "bride" ? bridePortrait : groomPortrait }));

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div className="relative isolate w-full max-w-[480px] overflow-hidden bg-[#fffaf7] font-[Baskerville,'Times_New_Roman',serif] font-light text-[#30530f] md:mx-auto md:max-w-[900px] md:border md:border-[#30530f22]">
        <img src={`${THEME_BASE}/flower.webp`} alt="" aria-hidden className="pointer-events-none absolute -left-[42%] top-[500px] -z-10 w-[100%] max-w-none rotate-[-61deg] md:-left-[23%] md:w-[70%]" />
        <img src={`${THEME_BASE}/flower.webp`} alt="" aria-hidden className="pointer-events-none absolute -right-[65%] top-[300px] -z-10 w-[135%] max-w-none rotate-[152deg] opacity-[0.15] md:-right-[40%] md:w-[108%]" />

        <header data-template-hero="boho-floral-green" className="relative z-10 flex min-h-[840px] flex-col items-center justify-start overflow-visible px-6 pb-4 pt-[210px] text-center md:min-h-[900px] md:px-8 md:pb-8 md:pt-[330px]">
          <div className="pointer-events-none absolute left-[26%] top-[-327px] -z-10 w-[147%] rotate-[-0.76deg] md:left-[14%] md:top-[-390px] md:w-[85%] lg:left-[19%] lg:top-[-470px] lg:w-full">
            <img src={`${THEME_BASE}/flower.webp`} alt="" aria-hidden className="h-auto w-full" />
          </div>
          <div className="pointer-events-none absolute left-[-83px] top-[5px] -z-10 w-[450px] -scale-x-100 rotate-[142deg] opacity-20 md:left-[-66px] md:top-[18px] md:w-[507px] lg:left-[-44px] lg:top-[24px] lg:w-[608px]">
            <img src={`${THEME_BASE}/flower.webp`} alt="" aria-hidden className="h-auto w-full" />
          </div>

          <div className="relative z-10 mx-auto h-[440px] w-[320px] md:h-[640px] md:w-[500px]">
            <div className="absolute left-1/2 top-[39%] -z-10 w-screen -translate-x-1/2 -translate-y-1/2 md:top-[44%]">
              <img src={`${BASE}/decoration_bar.webp`} alt="" aria-hidden className="h-auto w-full md:h-[150px] md:object-cover" />
            </div>

            {heroCards[0].portrait ? (
              <div className="absolute -top-[40px] left-[20px] z-20 flex items-center gap-3 md:-top-[60px] md:left-[25px] md:gap-4">
                <div className="w-[155px] shrink-0 rotate-[-17deg] md:w-[235px]">
                  <div className="relative aspect-[2/3] overflow-hidden border-[5px] border-[#b28e72]">
                    <img src={heroCards[0].portrait} alt={heroCards[0].person.shortName} className="h-full w-full object-cover" />
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-[12px] tracking-widest text-[#464646] md:text-[14px]">{heroCards[0].person.birthOrder}</div>
                  <div className="whitespace-nowrap text-[25px] leading-[1.5] text-[#30530f] md:text-[32px]" style={heroNameFont}>{heroCards[0].person.shortName}</div>
                </div>
              </div>
            ) : null}

            {heroCards[1].portrait ? (
              <div className="absolute left-[55px] top-[165px] z-30 flex flex-row-reverse items-center gap-3 md:left-[115px] md:top-[260px] md:gap-4">
                <div className="w-[155px] shrink-0 rotate-[13deg] md:w-[235px]">
                  <div className="relative aspect-[2/3] overflow-hidden border-[5px] border-[#b28e72]">
                    <img src={heroCards[1].portrait} alt={heroCards[1].person.shortName} className="h-full w-full object-cover" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] tracking-widest text-[#464646] md:text-[14px]">{heroCards[1].person.birthOrder}</div>
                  <div className="whitespace-nowrap text-[25px] leading-[1.5] text-[#30530f] md:text-[32px]" style={heroNameFont}>{heroCards[1].person.shortName}</div>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <div className="relative z-10 flex w-full flex-col items-center gap-16 px-4 pb-14 pt-28 md:gap-20 md:px-10 md:pt-32">
          {/* CEREMONY INFO */}
          <section className="flex w-full flex-col items-center gap-8">
            <BohoHeading>Thông Tin Lễ Cưới</BohoHeading>
            <div className="flex w-full items-start justify-center gap-3 md:gap-10">
              {couple.brideFirst ? (<>{brideCol}{groomCol}</>) : (<>{groomCol}{brideCol}</>)}
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="mb-3 whitespace-pre-line text-center text-[13px] uppercase leading-relaxed md:text-[16px]">{couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI."}</p>
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[42px] leading-[1.1] md:text-[64px]" style={bodyNameFont}>{people[0].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: GREEN_MUTED }}>{people[0].birthOrder}</div>
              <div className="text-[24px] md:text-[32px]" style={{ ...heroNameFont, color: ACCENT }}>&amp;</div>
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[42px] leading-[1.1] md:text-[64px]" style={bodyNameFont}>{people[1].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: GREEN_MUTED }}>{people[1].birthOrder}</div>
            </div>
            {ceremony ? (
              <div className="flex flex-col items-center gap-1 text-center">
                {couple.ceremonyHeader ? <span className="whitespace-pre-line text-[16px] uppercase leading-relaxed md:text-[20px]">{couple.ceremonyHeader}</span> : null}
                <span className="mt-2 text-[13px] uppercase md:text-[16px]">Vào lúc</span>
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
            <section className="relative flex w-full flex-col items-center gap-6">
              <img src={`${BASE}/flower.webp`} alt="" aria-hidden className="pointer-events-none absolute -right-[10%] top-[40px] -z-10 h-[240px] w-auto max-w-none object-contain opacity-[0.15] md:h-[360px]" />
              <BohoHeading>Album Ảnh Cưới</BohoHeading>
              <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={ACCENT} gridAspect="aspect-square" />
            </section>
          ) : null}

          {/* RECEPTION + CALENDAR */}
          <section className="relative flex w-full flex-col items-center gap-3">
            <BohoHeading>Thông Tin Tiệc Cưới</BohoHeading>
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
              <div className="relative mx-auto mt-8 w-full max-w-[340px] rounded-2xl border px-8 py-6 md:mt-10 md:max-w-[420px]" style={{ borderColor: hexToRgba(ACCENT, 0.35), backgroundColor: "#fffdfa" }}>
                <div className="relative flex h-full w-full flex-col items-center justify-center">
                  <p className="text-[12px] font-semibold uppercase tracking-wide md:text-[13px]">Tháng {calendar.month} / {calendar.year}</p>
                  <div className="mt-2 grid w-full grid-cols-7 text-[10px] font-medium opacity-70 md:text-[11px]">
                    {WEEKDAY_LABELS.map((d) => (<span key={d} className="py-0.5 text-center">{d}</span>))}
                  </div>
                  <div className="grid w-full grid-cols-7 gap-y-0.5 text-[11px] md:text-[12px]">
                    {calendar.cells.map((day, i) => (
                      <span key={i} className={`flex aspect-square items-center justify-center rounded-full ${day === calendar.highlight ? "font-bold text-white" : ""}`} style={day === calendar.highlight ? { backgroundColor: ACCENT } : undefined}>{day ?? ""}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <a href={googleCalendarUrl(content)} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center rounded-full border px-6 py-2 text-sm font-semibold transition" style={{ borderColor: ACCENT, color: GREEN }}>Thêm vào lịch</a>
          </section>

          {/* VENUE MAP */}
          {mapQuery ? (
            <section className="flex w-full flex-col items-center gap-3 text-center">
              <BohoHeading>Tiệc cưới sẽ tổ chức tại</BohoHeading>
              <p className="mx-auto mt-1 max-w-sm whitespace-pre-line text-sm leading-6 md:max-w-[500px]">{venue.address}</p>
              <div className="mt-4 w-full overflow-hidden rounded-2xl border" style={{ borderColor: hexToRgba(ACCENT, 0.35) }}>
                <InvitationMap query={mapQuery} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <MapDirectionsButton query={mapQuery} style={{ color: GREEN }} />
            </section>
          ) : null}

          {/* SCHEDULE */}
          {schedule.length > 0 ? (
            <section className="flex w-full flex-col items-center gap-6">
              <BohoHeading>Lịch Trình Ngày Cưới</BohoHeading>
              <BohoDivider />
              <ol className="mx-auto flex w-full max-w-sm flex-col gap-4">
                {schedule.map((s, i) => (
                  <li key={`${s.time}-${i}`} className="flex items-baseline gap-4">
                    <span className="w-[64px] shrink-0 pt-0.5 text-right text-[16px] tabular-nums tracking-wide md:text-[17px]" style={{ color: ACCENT }}>{s.time}</span>
                    <span className="text-[16px] font-medium leading-tight md:text-[18px]">{s.label}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* WISHES */}
          <section className="relative w-full">
            <div className="text-center"><BohoHeading>Sổ Lưu Bút</BohoHeading></div>
            <SharedWishForm accent={ACCENT} />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                {wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-xs" style={{ borderColor: hexToRgba(ACCENT, 0.25), backgroundColor: "#fffdfa" }}>
                    <div className="flex items-start justify-between">
                      <span className="font-semibold" style={{ color: GREEN }}>{w.name}</span>
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
              <GiftEnvelope banks={banks} accent={ACCENT} dark={GREEN} cardBg={CARD} heading="Hộp Quà Mừng" labelColor={GREEN_MUTED} />
            </section>
          ) : null}
        </div>

        {/* FOOTER */}
        <img src={`${BASE}/flower.webp`} alt="" aria-hidden className="pointer-events-none absolute -bottom-[80px] -right-[36%] z-0 h-[620px] w-auto max-w-none object-contain opacity-[0.08] md:-right-[10%] md:h-[820px]" />
        <footer data-template-footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 text-center">
          <span className="text-[12px] md:text-[15px] lg:text-[18px]" style={{ color: GREEN }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3" style={{ backgroundColor: CARD }}>
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: GREEN }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}
