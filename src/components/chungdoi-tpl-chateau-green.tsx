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

const GREEN_BASE = "/chungdoi/images/themes/_decor/chateau-green";
const GREEN = "#1f4034";
const GREEN_MUTED = "rgba(31, 64, 52, 0.72)";

const nameFont = { fontFamily: '"DFVN New Eddy", "Fz Qellia", cursive' };
const ampFont = { fontFamily: '"Alex Brush", "The Nautigal", cursive' };

function GreenHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: GREEN }}>
      {children}
    </h2>
  );
}

/** Faithful rebuild of the Chateau Green (lau-dai-xanh) opened invitation. */
export function ChateauGreenInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes, bank } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();

  const groomCol = <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  const banks = orderByBrideFirst(
    { label: `${couple.brideBirthOrder || "Út Nữ"} - ${bank.brideAccountName}`, bank: bank.brideBankName, num: bank.brideAccountNumber, name: bank.brideAccountName },
    { label: `${couple.groomBirthOrder || "Trưởng Nam"} - ${bank.groomAccountName}`, bank: bank.groomBankName, num: bank.groomAccountNumber, name: bank.groomAccountName },
    couple.brideFirst,
  ).filter((q) => q.bank);

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div className="relative w-full max-w-[480px] overflow-hidden md:mx-auto md:max-w-[900px] md:border" style={{ color: GREEN, borderColor: hexToRgba(GREEN, 0.2) }}>
        {/* faint side tree */}
        <img src={`${GREEN_BASE}/cay2-1.webp`} alt="" aria-hidden className="pointer-events-none absolute top-[640px] -left-[25%] -z-10 h-[900px] w-auto max-w-none object-contain opacity-[0.12] md:top-[760px] md:-left-[15%] md:h-[1400px] lg:h-[1200px]" />

        {/* HEADER — castle + clouds + names + foreground scenery */}
        <header className="relative z-20 flex w-full flex-col items-center px-4 pt-[110px] sm:px-5 md:pt-[110px]">
          <img src={`${GREEN_BASE}/ornament.webp`} alt="" aria-hidden className="relative z-30 mb-3 h-[32px] w-auto object-contain opacity-95 md:mb-4 md:h-[38px]" />
          <div className="relative z-30 flex items-center justify-center gap-3 md:gap-4">
            <img src={`${GREEN_BASE}/divider-arrow.webp`} alt="" aria-hidden className="h-auto w-[56px] object-contain opacity-90 md:w-[80px]" />
            <p className="whitespace-nowrap text-center text-[13px] uppercase tracking-[0.12em] md:text-[20px] md:tracking-[0.2em]">Welcome To Our Wedding</p>
            <img src={`${GREEN_BASE}/divider-arrow.webp`} alt="" aria-hidden className="h-auto w-[56px] scale-x-[-1] object-contain opacity-90 md:w-[80px]" />
          </div>
          <div className="relative z-30 mt-14 flex flex-col items-center leading-none md:mt-16" style={{ color: GREEN }}>
            <span className="text-[42px] md:text-[64px]" style={nameFont}>{people[0].shortName}</span>
            <span className="my-8 text-[25px] md:my-10 md:text-[34px]" style={ampFont}>&amp;</span>
            <span className="text-[42px] md:text-[64px]" style={nameFont}>{people[1].shortName}</span>
          </div>
          <div data-testid="chateau-green-hero-scene" className="relative -mt-16 mb-20 flex min-h-[420px] w-full shrink-0 items-end justify-center md:mb-0 md:min-h-[650px]">
            {/* clouds behind castle */}
            <img src={`${GREEN_BASE}/cloud-1.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-[14%] right-[-28%] z-0 h-auto w-[135%] max-w-none object-contain opacity-90" />
            <img src={`${GREEN_BASE}/cloud-3.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-[2%] left-[-25%] z-0 h-auto w-[125%] max-w-none object-contain opacity-70" />
            <img src={`${GREEN_BASE}/cloud-2.webp`} alt="" aria-hidden className="pointer-events-none absolute top-[12%] -left-[18%] z-0 h-auto w-[105%] max-w-none object-contain opacity-90" />
            {/* castle centerpiece */}
            <img src={`${GREEN_BASE}/chateau.webp`} alt="" aria-hidden className="relative z-10 block h-auto w-[520px] max-w-none object-contain md:w-[900px]" />
          </div>
        </header>

        <div className="relative z-10 flex w-full flex-col items-center gap-14 px-4 pb-14 md:px-10">
          {/* CEREMONY INFO */}
          <section className="flex w-full flex-col items-center gap-8">
            <GreenHeading>Thông Tin Lễ Cưới</GreenHeading>
            <div className="flex w-full items-start justify-center gap-3 md:gap-10">
              {couple.brideFirst ? (<>{brideCol}{groomCol}</>) : (<>{groomCol}{brideCol}</>)}
            </div>
            <div className="whitespace-pre-line text-center text-[16px] uppercase leading-relaxed tracking-wide md:text-[20px]">
              {couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI."}
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="flex min-h-[80px] w-[80%] items-center justify-center text-[44px] leading-[1.1] md:text-[60px]" style={nameFont}>{people[0].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: GREEN_MUTED }}>{people[0].birthOrder}</div>
              <div className="text-[24px] md:text-[32px]" style={ampFont}>&amp;</div>
              <h3 className="flex min-h-[80px] w-[80%] items-center justify-center text-[44px] leading-[1.1] md:text-[60px]" style={nameFont}>{people[1].fullName}</h3>
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
                <div className="text-xs uppercase tracking-[0.25em] md:text-sm" style={{ color: GREEN_MUTED }}>{ceremony.lunar}</div>
              </div>
            ) : null}
            <div className="relative flex justify-center">
              <img src={`${GREEN_BASE}/ornament.webp`} alt="" aria-hidden className="h-auto w-[280px] object-contain opacity-90 md:w-[420px]" />
            </div>
          </section>

          {/* ALBUM */}
          {gallery.length > 0 ? (
            <section className="flex w-full flex-col items-center gap-6">
              <GreenHeading>Album Ảnh Cưới</GreenHeading>
              <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={GREEN} />
            </section>
          ) : null}

          {/* RECEPTION INFO + calendar */}
          <section className="relative flex w-full flex-col items-center gap-3">
            <img src={`${GREEN_BASE}/cay2-2.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-30 right-0 -z-10 h-[700px] w-auto max-w-none object-contain opacity-[0.12] md:-top-150 md:right-[20%] md:h-[900px]" />
            <GreenHeading>Thông Tin Tiệc Cưới</GreenHeading>
            <p className="mt-2 text-center text-[16px] uppercase md:text-[20px]">Tiệc cưới sẽ diễn ra vào lúc:</p>
            <div className="text-[20px] font-semibold md:text-[30px]">{venue.banquetTime || couple.time}</div>
            {reception ? (
              <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                <span>{reception.weekday}</span><span>/</span><span>{reception.day}</span><span>/</span><span>Tháng {reception.month}</span>
              </div>
            ) : null}
            {reception ? <div className="text-[18px] md:text-[24px]">{reception.yearNumber}</div> : null}
            {reception ? <div className="text-xs uppercase tracking-[0.25em] md:text-base" style={{ color: GREEN_MUTED }}>{reception.lunar}</div> : null}

            {/* calendar framed by frame-lich */}
            {calendar ? (
              <div className="relative mx-auto mt-8 aspect-[388/332] w-full max-w-[340px] md:mt-10 md:max-w-[420px]">
                <img src={`${GREEN_BASE}/frame-lich.webp`} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
                <div className="relative flex h-full w-full flex-col items-center justify-center px-8 py-6">
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

            <div className="relative flex justify-center pt-6 md:pt-8">
              <img src={`${GREEN_BASE}/hoanho2-1.webp`} alt="" aria-hidden className="h-auto w-[420px] object-contain md:w-[680px]" />
            </div>
          </section>

          {/* VENUE MAP */}
          {mapQuery ? (
            <section className="flex w-full flex-col items-center gap-3 text-center">
              <h3 className="text-[20px] font-bold uppercase md:text-[24px]" style={{ color: GREEN }}>Tiệc cưới sẽ tổ chức tại</h3>
              <p className="mx-auto mt-1 max-w-sm whitespace-pre-line text-sm leading-6 md:max-w-[500px]">{venue.address}</p>
              <div className="mt-4 w-full overflow-hidden rounded-2xl border" style={{ borderColor: hexToRgba(GREEN, 0.3) }}>
                <InvitationMap query={mapQuery} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <MapDirectionsButton query={mapQuery} style={{ color: GREEN }} />
            </section>
          ) : null}

          {/* SCHEDULE — with tree decor */}
          {schedule.length > 0 ? (
            <section className="relative flex w-full flex-col items-center gap-6">
              <div className="pointer-events-none absolute top-[90px] bottom-[20px] left-8 -z-10 flex flex-col items-center justify-between opacity-80 md:left-12">
                <img src={`${GREEN_BASE}/cay1-1.webp`} alt="" aria-hidden className="h-[120px] w-auto object-contain md:h-[160px]" />
                <img src={`${GREEN_BASE}/cay2-1.webp`} alt="" aria-hidden className="h-[120px] w-auto object-contain md:h-[160px]" />
              </div>
              <GreenHeading>Lịch Trình Ngày Cưới</GreenHeading>
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

          {/* WISHES — with faint corner tree */}
          <section className="relative w-full">
            <img src={`${GREEN_BASE}/cay2-1.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-82 left-0 -z-10 h-[700px] w-auto max-w-none object-contain opacity-[0.12] md:-top-120 md:left-50 md:h-[800px]" />
            <div className="text-center"><GreenHeading>Sổ Lưu Bút</GreenHeading></div>
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

          {/* ANIMATED GIFT BOX */}
          {banks.length > 0 ? (
            <section className="w-full text-center">
              <GiftEnvelope templateSlug={content.slug} banks={banks} accent="#e7b849" dark={GREEN} cardBg="#eef6f0" heading="Hộp Quà Mừng" labelColor={GREEN_MUTED} />
            </section>
          ) : null}
        </div>

        {/* FOOTER — celebration scenery */}
        <div className="pointer-events-none relative h-32 overflow-hidden md:h-44">
          <img src={`${GREEN_BASE}/hoanho3-1.webp`} alt="" aria-hidden className="absolute left-1/2 top-1/2 h-auto w-[520px] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.1] md:w-[760px]" />
        </div>
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
