"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { orderByBrideFirst, orderedCouple, orderedHeroPhotos } from "@/lib/invitation-display";
import {
  hexToRgba, formatDate, buildCalendar, formatWishTime,
  AlbumGallery, googleCalendarUrl, InvitationMap, MapDirectionsButton,
  FamilyColumn, GiftEnvelope, SharedWishForm, WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";

const BASE = "/chungdoi/images/themes/_decor/thanhdiep-green";
const GREEN = "#2f4a34";
const GREEN_MUTED = "rgba(47,74,52,0.72)";

function LeafHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-[22px] font-bold uppercase tracking-wide md:text-[28px]" style={{ color: GREEN }}>
      {children}
    </h2>
  );
}

export function ElegantLeafInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes, bank } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const [firstPhoto, secondPhoto] = orderedHeroPhotos(content, { albumFallback: true });
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const nameFont = { fontFamily: '"The Nautigal", cursive' };

  const groomCol = <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  const banks = orderByBrideFirst(
    { label: `${couple.brideBirthOrder || "Út Nữ"} - ${bank.brideAccountName}`, bank: bank.brideBankName, num: bank.brideAccountNumber, name: bank.brideAccountName },
    { label: `${couple.groomBirthOrder || "Trưởng Nam"} - ${bank.groomAccountName}`, bank: bank.groomBankName, num: bank.groomAccountNumber, name: bank.groomAccountName },
    couple.brideFirst,
  ).filter((q) => q.bank);

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div className="relative w-full max-w-[480px] overflow-hidden bg-white md:mx-auto md:max-w-[900px] md:border" style={{ color: GREEN, borderColor: hexToRgba(GREEN, 0.2) }}>
        {/* HEADER */}
        <header className="relative z-20 flex min-h-[600px] w-full flex-col items-center justify-center overflow-visible bg-white px-6 pb-[148px] pt-12 text-center md:min-h-[780px] md:px-[31px] md:pb-[192px] md:pt-[62px] lg:min-h-[900px] lg:px-[36px] lg:pb-[222px] lg:pt-[72px]">
          <div className="pointer-events-none absolute left-[-80px] top-0 z-0 w-[390px] -rotate-[30deg] md:w-[507px] lg:w-[585px]">
            <img src={`${BASE}/la2.webp`} alt="" aria-hidden className="h-auto w-full" />
          </div>
          <div className="pointer-events-none absolute bottom-[-50px] right-[-160px] z-0 w-[390px] rotate-[20deg] md:w-[507px] lg:w-[585px]">
            <img src={`${BASE}/la1.webp`} alt="" aria-hidden className="h-auto w-full" />
          </div>

          <p className="relative z-10 mb-8 mt-8 text-[14px] uppercase tracking-[0.3em] md:mb-[42px] md:mt-[42px] md:text-[18px] lg:mb-12 lg:mt-12 lg:text-[21px]" style={{ color: "#4e6439", fontFamily: 'Baskerville, "Times New Roman", serif' }}>The story of love</p>

          <div className="relative z-10 h-[420px] w-full max-w-[540px] md:h-[546px] md:max-w-[702px] lg:h-[630px] lg:max-w-[810px]">
            {firstPhoto ? (
              <figure className="absolute left-[5%] top-[5%] w-[42%] -rotate-[8deg]">
                <div className="aspect-[4/5] overflow-hidden border-[7px] border-white shadow-[0_18px_45px_rgba(31,55,33,0.22)]">
                  <img src={firstPhoto} alt={people[0].fullName} className="h-full w-full object-cover" />
                </div>
              </figure>
            ) : null}
            {secondPhoto ? (
              <figure className="absolute bottom-[2%] right-[5%] w-[42%] rotate-[8deg]">
                <div className="aspect-[4/5] overflow-hidden border-[7px] border-white shadow-[0_18px_45px_rgba(31,55,33,0.22)]">
                  <img src={secondPhoto} alt={people[1].fullName} className="h-full w-full object-cover" />
                </div>
              </figure>
            ) : null}
            <div className="absolute right-[2%] top-[18%] z-20 w-[45%] text-center">
              <span className="block text-[11px] uppercase tracking-[0.2em]">{people[0].birthOrder}</span>
              <span className="mt-2 block text-[30px] md:text-[42px]" style={nameFont}>{people[0].shortName}</span>
            </div>
            <div className="absolute bottom-[14%] left-[2%] z-20 w-[45%] text-center">
              <span className="block text-[11px] uppercase tracking-[0.2em]">{people[1].birthOrder}</span>
              <span className="mt-2 block text-[30px] md:text-[42px]" style={nameFont}>{people[1].shortName}</span>
            </div>
          </div>
        </header>

        <div className="relative z-10 flex w-full flex-col items-center gap-14 px-4 pb-14 pt-12 md:px-10">
          {/* CEREMONY INFO */}
          <section className="flex w-full flex-col items-center gap-8">
            <LeafHeading>Thông Tin Lễ Cưới</LeafHeading>
            <div className="flex w-full items-start justify-center gap-3 md:gap-10">
              {couple.brideFirst ? (<>{brideCol}{groomCol}</>) : (<>{groomCol}{brideCol}</>)}
            </div>
            <p className="whitespace-pre-line text-center text-[14px] uppercase leading-relaxed md:text-[18px]">{couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI."}</p>
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[42px] leading-[1.1] md:text-[58px]" style={nameFont}>{people[0].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: GREEN_MUTED }}>{people[0].birthOrder}</div>
              <div className="text-[24px] md:text-[32px]" style={nameFont}>&amp;</div>
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[42px] leading-[1.1] md:text-[58px]" style={nameFont}>{people[1].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: GREEN_MUTED }}>{people[1].birthOrder}</div>
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
              <LeafHeading>Album Ảnh Cưới</LeafHeading>
              <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={GREEN} />
            </section>
          ) : null}

          {/* RECEPTION + CALENDAR */}
          <section className="relative flex w-full flex-col items-center gap-3">
            <img src={`${BASE}/la3.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-16 right-0 -z-10 h-[220px] w-auto max-w-none object-contain opacity-80 md:h-[320px]" />
            <LeafHeading>Thông Tin Tiệc Cưới</LeafHeading>
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
              <div className="relative mx-auto mt-8 w-full max-w-[340px] rounded-2xl border bg-white/70 px-8 py-6 md:mt-10 md:max-w-[420px]" style={{ borderColor: hexToRgba(GREEN, 0.3) }}>
                <div className="flex h-full w-full flex-col items-center justify-center">
                  <p className="text-[12px] font-semibold uppercase tracking-wide md:text-[13px]">Tháng {calendar.month} / {calendar.year}</p>
                  <div className="mt-2 grid w-full grid-cols-7 text-[10px] font-medium opacity-70 md:text-[11px]">
                    {WEEKDAY_LABELS.map((d) => (<span key={d} className="py-0.5 text-center">{d}</span>))}
                  </div>
                  <div className="grid w-full grid-cols-7 gap-y-0.5 text-[11px] md:text-[12px]">
                    {calendar.cells.map((day, i) => (
                      <span key={i} className={`flex aspect-square items-center justify-center rounded-full ${day === calendar.highlight ? "font-bold text-white" : ""}`} style={day === calendar.highlight ? { backgroundColor: GREEN } : undefined}>{day ?? ""}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <a href={googleCalendarUrl(content)} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center rounded-full border px-6 py-2 text-sm font-semibold transition" style={{ borderColor: GREEN, color: GREEN }}>Thêm vào lịch</a>
          </section>

          {/* VENUE MAP */}
          {mapQuery ? (
            <section className="flex w-full flex-col items-center gap-3 text-center">
              <LeafHeading>Tiệc cưới sẽ tổ chức tại</LeafHeading>
              <p className="mx-auto mt-1 max-w-sm whitespace-pre-line text-sm leading-6 md:max-w-[500px]">{venue.address}</p>
              <div className="mt-4 w-full overflow-hidden rounded-2xl border" style={{ borderColor: hexToRgba(GREEN, 0.3) }}>
                <InvitationMap query={mapQuery} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <MapDirectionsButton query={mapQuery} style={{ color: GREEN }} />
            </section>
          ) : null}

          {/* SCHEDULE */}
          {schedule.length > 0 ? (
            <section className="relative flex w-full flex-col items-center gap-6">
              <img src={`${BASE}/la4.webp`} alt="" aria-hidden className="pointer-events-none absolute -left-2 top-[80px] -z-10 h-[160px] w-auto object-contain opacity-70 md:h-[220px]" />
              <LeafHeading>Lịch Trình Ngày Cưới</LeafHeading>
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
            <div className="text-center"><LeafHeading>Sổ Lưu Bút</LeafHeading></div>
            <SharedWishForm accent={GREEN} />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                {wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-xs" style={{ borderColor: hexToRgba(GREEN, 0.2), backgroundColor: "#ffffff" }}>
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
              <GiftEnvelope templateSlug={content.slug} banks={banks} accent={GREEN} dark={GREEN} cardBg="#fbfaf5" heading="Hộp Quà Mừng" labelColor={GREEN_MUTED} />
            </section>
          ) : null}
        </div>

        {/* FOOTER */}
        <footer data-template-footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 text-center">
          <span className="text-[12px] md:text-[15px] lg:text-[18px]" style={{ color: GREEN }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: GREEN }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}
