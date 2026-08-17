"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { invitationGiftAccounts, orderedCouple } from "@/lib/invitation-display";
import {
  buildCalendar,
  GiftEnvelope,
  FamilyColumn,
  formatDate,
  formatWishTime,
  googleCalendarUrl,
  hexToRgba,
  AlbumGallery,
  InvitationMap,
  MapDirectionsButton,
  SharedWishForm,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";

const DPV2_BASE = "/chungdoi/images/themes/_decor/longphung-v2-red";
const RED = "#8c1c1c";
const RED_DEEP = "#6a1010";
const GOLD = "#f2d09b";
const GOLD_MUTED = "#a3231f";

const nameFont = { fontFamily: '"DFVN New Eddy", "Fz Qellia", cursive' };
const ampFont = { fontFamily: '"Alex Brush", "The Nautigal", cursive' };

function Dpv2Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-[22px] font-bold uppercase tracking-wide md:text-[26px]" style={{ color: RED }}>
      {children}
    </h2>
  );
}

export function DragonPhoenixV2Invitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();

  const headerNames = people.map((person) => person.shortName);

  const groomCol = <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  const banks = invitationGiftAccounts(content).map((account) => ({
    label: `${account.birthOrder} - ${account.name}`,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div
        data-template-visual="dragon-phoenix-v2-red"
        className="relative isolate w-full max-w-[480px] overflow-hidden bg-[#fbf3e6] text-[#8c1c1c] md:mx-auto md:max-w-[900px] md:border md:border-[#8c1c1c]/20"
        style={{ backgroundImage: "url('/chungdoi/images/themes/dragon-phoenix-v2-red/bg-frame.jpg')", backgroundSize: "100% auto" }}
      >
        {/* Original V2 cover: deep-red field, cream happiness band and balanced gold long/phung. */}
        <header
          data-testid="dragon-phoenix-v2-hero"
          className="relative z-20 flex min-h-[560px] w-full flex-col items-center overflow-hidden bg-[radial-gradient(circle_at_50%_42%,#981b1c_0%,#761011_52%,#62090b_100%)] pt-12 text-[#f2d09b] md:min-h-[660px] md:pt-16"
        >
          <img src={`${DPV2_BASE}/cloud.webp`} alt="" aria-hidden className="pointer-events-none absolute inset-x-0 top-20 h-auto w-full object-cover opacity-[0.08] mix-blend-screen" />

          <div className="relative z-20 flex h-16 w-full items-center justify-center border-y border-[#f2d09b]/60 bg-[#f8dca9] md:h-20">
            <img src={`${DPV2_BASE}/chu-hy.webp`} alt="" aria-hidden className="h-12 w-12 object-contain md:h-14 md:w-14" />
          </div>

          <div className="relative z-20 mt-7 flex flex-col items-center leading-none md:mt-9">
            <span className="text-[48px] md:text-[66px]" style={ampFont}>{headerNames[0]}</span>
            <span className="my-1 text-[26px] md:text-[34px]" style={ampFont}>&amp;</span>
            <span className="text-[48px] md:text-[66px]" style={ampFont}>{headerNames[1]}</span>
          </div>

          <div className="relative z-10 mt-5 flex h-[245px] w-full max-w-[660px] items-center justify-center md:mt-7 md:h-[310px]">
            <img src={`${DPV2_BASE}/phuong.webp`} alt="" aria-hidden className="h-[220px] w-[44%] object-contain object-right md:h-[290px]" />
            <img src={`${DPV2_BASE}/rong.webp`} alt="" aria-hidden className="h-[220px] w-[44%] object-contain object-left md:h-[290px]" />
          </div>
        </header>

        <div className="relative z-10 flex w-full flex-col items-center gap-14 px-4 pb-14 pt-10 md:px-10 md:pt-12">
          {/* CEREMONY INFO */}
          <section className="relative flex w-full flex-col items-center gap-8">
            <img src={`${DPV2_BASE}/cloud.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-16 right-0 -z-10 h-auto w-[80%] max-w-none object-contain opacity-[0.1]" />
            <Dpv2Heading>Thông Tin Lễ Cưới</Dpv2Heading>
            <div className="flex w-full items-start justify-center gap-3 md:gap-10">
              {couple.brideFirst ? (<>{brideCol}{groomCol}</>) : (<>{groomCol}{brideCol}</>)}
            </div>
            <div className="whitespace-pre-line text-center text-[16px] uppercase leading-relaxed tracking-wide md:text-[20px]">
              {couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI."}
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="flex min-h-[80px] w-[80%] items-center justify-center text-[44px] leading-[1.1] md:text-[60px]" style={nameFont}>{people[0].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: GOLD_MUTED }}>{people[0].birthOrder}</div>
              <div className="text-[24px] md:text-[32px]" style={ampFont}>&amp;</div>
              <h3 className="flex min-h-[80px] w-[80%] items-center justify-center text-[44px] leading-[1.1] md:text-[60px]" style={nameFont}>{people[1].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: GOLD_MUTED }}>{people[1].birthOrder}</div>
            </div>
            {ceremony ? (
              <div className="flex flex-col items-center gap-1 text-center">
                {couple.ceremonyHeader ? <span className="whitespace-pre-line text-[16px] uppercase leading-relaxed md:text-[20px]">{couple.ceremonyHeader}</span> : null}
                {couple.ceremonyTime ? <div className="text-[20px] md:text-[30px]">{couple.ceremonyTime}</div> : null}
                <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                  <span>{ceremony.weekday}</span><span>|</span><span className="text-[28px] font-bold">{ceremony.day}</span><span>|</span><span>Tháng {ceremony.month}</span>
                </div>
                <div className="text-[18px] md:text-[24px]">{ceremony.yearNumber}</div>
                <div className="text-xs uppercase tracking-[0.25em] md:text-sm" style={{ color: GOLD_MUTED }}>{ceremony.lunar}</div>
              </div>
            ) : null}
          </section>

          {/* ALBUM */}
          {gallery.length > 0 ? (
            <section className="flex w-full flex-col items-center gap-6">
              <Dpv2Heading>Album Ảnh Cưới</Dpv2Heading>
              <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={GOLD} />
            </section>
          ) : null}

          {/* RECEPTION INFO + calendar */}
          <section className="relative flex w-full flex-col items-center gap-3">
            <img src={`${DPV2_BASE}/cloud.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-10 left-0 -z-10 h-auto w-[85%] max-w-none object-contain opacity-[0.1]" />
            <Dpv2Heading>Thông Tin Tiệc Cưới</Dpv2Heading>
            <p className="mt-2 text-center text-[16px] uppercase md:text-[20px]">Tiệc cưới sẽ diễn ra vào lúc:</p>
            <div className="text-[20px] font-semibold md:text-[30px]">{venue.banquetTime || couple.time}</div>
            {reception ? (
              <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                <span>{reception.weekday}</span><span>/</span><span>{reception.day}</span><span>/</span><span>Tháng {reception.month}</span>
              </div>
            ) : null}
            {reception ? <div className="text-[18px] md:text-[24px]">{reception.yearNumber}</div> : null}
            {reception ? <div className="text-xs uppercase tracking-[0.25em] md:text-base" style={{ color: GOLD_MUTED }}>{reception.lunar}</div> : null}

            {/* calendar — bordered box (no frame image in this set) */}
            {calendar ? (
              <div className="mx-auto mt-8 w-[300px] max-w-full md:mt-10 md:w-[360px]">
                <div className="mx-auto w-full overflow-hidden rounded-lg border" style={{ borderColor: hexToRgba(GOLD, 0.6), backgroundColor: hexToRgba(GOLD, 0.06), color: RED }}>
                  <div className="border-b py-2.5 text-center text-[13px] font-semibold tracking-wide md:text-[14px]" style={{ borderColor: hexToRgba(GOLD, 0.5) }}>Tháng {calendar.month} / {calendar.year}</div>
                  <div className="grid grid-cols-7 border-b" style={{ borderColor: hexToRgba(GOLD, 0.5) }}>
                    {WEEKDAY_LABELS.map((d) => (<div key={d} className="py-1.5 text-center text-[10px] font-medium opacity-70 md:text-[11px]">{d}</div>))}
                  </div>
                  <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                    {calendar.cells.map((day, i) => (
                      <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                        {day === calendar.highlight ? (
                          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[12px] font-bold text-white md:h-[30px] md:w-[30px] md:text-[13px]" style={{ backgroundColor: RED }}>{day}</span>
                        ) : day ? (<span className="text-[12px] md:text-[13px]">{day}</span>) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <a href={googleCalendarUrl(content)} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center rounded-full border px-6 py-2 text-sm font-semibold transition hover:opacity-80" style={{ borderColor: RED, color: RED }}>Thêm vào lịch</a>
          </section>

          {/* VENUE MAP */}
          {mapQuery ? (
            <section className="flex w-full flex-col items-center gap-3 text-center">
              <h3 className="text-[20px] font-bold uppercase md:text-[24px]" style={{ color: RED }}>Tiệc cưới sẽ tổ chức tại</h3>
              <p className="mx-auto mt-1 max-w-sm whitespace-pre-line text-sm leading-6 md:max-w-[500px]">{venue.address}</p>
              <div className="mt-4 w-full overflow-hidden rounded-2xl border" style={{ borderColor: hexToRgba(GOLD, 0.5) }}>
                <InvitationMap query={mapQuery} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <MapDirectionsButton query={mapQuery} style={{ color: RED }} />
            </section>
          ) : null}

          {/* SCHEDULE */}
          {schedule.length > 0 ? (
            <section className="flex w-full flex-col items-center gap-6">
              <Dpv2Heading>Lịch Trình Ngày Cưới</Dpv2Heading>
              <ol className="mx-auto flex w-full max-w-sm flex-col gap-4">
                {schedule.map((s, i) => (
                  <li key={`${s.time}-${i}`} className="flex items-baseline gap-4">
                    <span className="w-[64px] shrink-0 pt-0.5 text-right text-[16px] tabular-nums tracking-wide md:text-[17px]" style={{ color: GOLD_MUTED }}>{s.time}</span>
                    <span className="text-[16px] font-medium leading-tight md:text-[18px]">{s.label}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* WISHES */}
          <section className="relative w-full">
            <img src={`${DPV2_BASE}/cloud.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-10 right-0 -z-10 h-auto w-[80%] max-w-none object-contain opacity-[0.1]" />
            <div className="text-center"><Dpv2Heading>Sổ Lưu Bút</Dpv2Heading></div>
            <SharedWishForm accent={RED} />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                {wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-xs" style={{ borderColor: hexToRgba(GOLD, 0.4), backgroundColor: "#ffffff" }}>
                    <div className="flex items-start justify-between">
                      <span className="font-semibold" style={{ color: RED }}>{w.name}</span>
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
              <GiftEnvelope templateSlug={content.slug} banks={banks} accent={GOLD} dark={RED} cardBg="#fff4e3" heading="Phong Bao Mừng Cưới" />
            </section>
          ) : null}
        </div>

        {/* FOOTER */}
        <footer data-template-footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 text-center" style={{ backgroundColor: "#ffe3b1" }}>
          <span className="text-[12px] md:text-[15px] lg:text-[18px]" style={{ color: RED }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: RED }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}
