"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { orderedCouple, orderByBrideFirst } from "@/lib/invitation-display";
import {
  buildCalendar,
  FamilyColumn,
  formatDate,
  formatWishTime,
  googleCalendarUrl,
  hexToRgba,
  AlbumGallery,
  InvitationMap,
  MapDirectionsButton,
  GiftEnvelope,
  GIFTBOX_MINI_DECORS,
  SharedWishForm,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";

const GREEN_BASE = "/chungdoi/images/themes/_decor/glass-garden-green";
const GREEN = "#47613e";
const GREEN_MUTED = hexToRgba(GREEN, 0.72);

const GLASS_PANEL =
  "rounded-3xl border border-white/40 bg-white/45 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4),0_18px_50px_-12px_rgba(53,69,47,0.25)] backdrop-blur-[7px]";

function GreenHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: GREEN }}>
      {children}
    </h2>
  );
}

/** Faithful rebuild of the Glass Garden Green (vuonkinh-xanh) opened invitation. */
export function GlassGardenInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes, bank } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const nameFont = { fontFamily: '"DFVN New Eddy", "Fz Qellia", cursive' };
  const ampFont = { fontFamily: '"Alex Brush", "The Nautigal", cursive' };

  const groomCol = <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  const banks = orderByBrideFirst(
    { label: `${couple.brideBirthOrder || "Út Nữ"} - ${bank.brideAccountName}`, bank: bank.brideBankName, num: bank.brideAccountNumber, name: bank.brideAccountName },
    { label: `${couple.groomBirthOrder || "Trưởng Nam"} - ${bank.groomAccountName}`, bank: bank.groomBankName, num: bank.groomAccountNumber, name: bank.groomAccountName },
    couple.brideFirst,
  ).filter((q) => q.bank);

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div className="relative w-full max-w-[480px] overflow-hidden bg-[url('/chungdoi/images/themes/glass-garden-green/floral-background.webp')] bg-[length:180%] bg-left-top md:mx-auto md:max-w-[900px] md:border" style={{ color: GREEN, borderColor: hexToRgba(GREEN, 0.2) }}>
        {/* faint side flower */}
        <img src={`${GREEN_BASE}/flower3-decoration.webp`} alt="" aria-hidden className="pointer-events-none absolute top-[640px] -left-[22%] -z-10 h-[820px] w-auto max-w-none object-contain opacity-[0.15] md:top-[760px] md:-left-[12%] md:h-[1300px] lg:h-[1150px]" />

        {/* HEADER — source-specific translucent garden capsule */}
        <section className="relative isolate z-20 flex w-full flex-col items-center pb-[110px] pt-16 md:pb-[150px] md:pt-[88px]">
          <div className="relative w-[62%] max-w-[250px]">
            <h1 className="relative z-20 flex aspect-[239/368] w-full flex-col items-center justify-center gap-3 rounded-[500px] border border-white/35 bg-white/40 px-5 text-center shadow-[inset_1.5px_1.5px_2px_rgba(255,255,255,0.45),inset_-1.5px_-1.5px_3px_rgba(120,140,110,0.12),0_18px_50px_-6px_rgba(53,69,47,0.3),0_6px_20px_2px_rgba(53,69,47,0.14)] backdrop-blur-[7px] md:gap-4" style={{ color: GREEN }}>
              <span className="w-full text-[clamp(26px,7.4vw,38px)] leading-none" style={nameFont}>{people[0].shortName}</span>
              <span className="text-[clamp(22px,6vw,32px)] leading-none opacity-90" style={ampFont}>&amp;</span>
              <span className="w-full text-[clamp(26px,7.4vw,38px)] leading-none" style={nameFont}>{people[1].shortName}</span>
            </h1>
            <img src={`${GREEN_BASE}/flower1-decoration.webp`} alt="" aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 z-30 h-auto w-[135%] max-w-none -translate-x-1/2 translate-y-[46%] object-contain" />
          </div>
        </section>

        <div className="relative z-10 flex w-full flex-col items-center gap-14 px-4 pb-14 md:px-10">
          {/* CEREMONY INFO — frosted glass panel */}
          <section className={`relative flex w-full flex-col items-center gap-8 px-5 py-8 md:px-10 md:py-10 ${GLASS_PANEL}`}>
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
          </section>

          {/* ALBUM */}
          {gallery.length > 0 ? (
            <section className="flex w-full flex-col items-center gap-6">
              <GreenHeading>Album Ảnh Cưới</GreenHeading>
              <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={GREEN} />
            </section>
          ) : null}

          {/* RECEPTION INFO + calendar */}
          <section className={`relative flex w-full flex-col items-center gap-3 px-5 py-8 md:px-10 md:py-10 ${GLASS_PANEL}`}>
            <img src={`${GREEN_BASE}/dish.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-16 -left-[18%] -z-10 h-[220px] w-auto max-w-none object-contain opacity-90 md:-left-[6%] md:h-[300px]" />
            <img src={`${GREEN_BASE}/cake.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-10 -right-[16%] -z-10 h-[220px] w-auto max-w-none object-contain opacity-90 md:-right-[4%] md:h-[300px]" />
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

            {/* calendar — CSS bordered box (no frame image), heart marker */}
            {calendar ? (
              <div className="relative mx-auto mt-8 w-full max-w-[340px] rounded-2xl border bg-white/70 px-6 py-6 shadow-sm md:mt-10 md:max-w-[420px]" style={{ borderColor: hexToRgba(GREEN, 0.3) }}>
                <img src={`${GREEN_BASE}/calendar-heart.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-6 -right-4 z-10 h-[56px] w-auto object-contain md:h-[68px]" />
                <div className="relative flex w-full flex-col items-center justify-center">
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
            <section className={`flex w-full flex-col items-center gap-3 px-5 py-8 text-center md:px-10 md:py-10 ${GLASS_PANEL}`}>
              <h3 className="text-[20px] font-bold uppercase md:text-[24px]" style={{ color: GREEN }}>Tiệc cưới sẽ tổ chức tại</h3>
              <p className="mx-auto mt-1 max-w-sm whitespace-pre-line text-sm leading-6 md:max-w-[500px]">{venue.address}</p>
              <div className="mt-4 w-full overflow-hidden rounded-2xl border" style={{ borderColor: hexToRgba(GREEN, 0.3) }}>
                <InvitationMap query={mapQuery} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <MapDirectionsButton query={mapQuery} style={{ color: GREEN }} />
            </section>
          ) : null}

          {/* SCHEDULE */}
          {schedule.length > 0 ? (
            <section className={`relative flex w-full flex-col items-center gap-6 px-5 py-8 md:px-10 md:py-10 ${GLASS_PANEL}`}>
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

          {/* WISHES — with faint corner flower */}
          <section className={`relative w-full px-5 py-8 md:px-10 md:py-10 ${GLASS_PANEL}`}>
            <img src={`${GREEN_BASE}/flower4-decoration.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-24 left-0 -z-10 h-[560px] w-auto max-w-none object-contain opacity-[0.15] md:-top-32 md:left-40 md:h-[680px]" />
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
            <section className={`w-full px-5 py-8 text-center md:px-10 md:py-10 ${GLASS_PANEL}`}>
              <GiftEnvelope banks={banks} accent="#e7b849" dark={GREEN} cardBg="#eef7f0" heading="Hộp Quà Mừng" labelColor={GREEN_MUTED} variant="giftbox" boxImage="/chungdoi/images/giftbox/glass_garden_green.webp" decorImages={GIFTBOX_MINI_DECORS} />
            </section>
          ) : null}
        </div>

        {/* FOOTER — compact glass message with source floral layered underneath */}
        <footer data-template-footer className="relative isolate z-10 mx-4 mt-2 pb-[46%] md:mx-10 md:pb-[38%]">
          <div className={`relative z-20 flex flex-col items-center px-6 py-8 text-center md:px-10 md:py-10 ${GLASS_PANEL}`}>
            <span className="max-w-[560px] text-[13px] leading-relaxed md:text-[16px] lg:text-[18px]" style={{ color: GREEN }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
            <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="mt-4 text-xs opacity-50 transition-opacity hover:opacity-70 md:mt-6" style={{ color: GREEN }}>♡ thiepmungonline.com</a>
          </div>
          <img src={`${GREEN_BASE}/flower5-bottom.webp`} alt="" aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 z-10 h-auto w-[150%] max-w-none -translate-x-1/2 translate-y-[8%] object-contain" />
        </footer>
      </div>
    </div>
  );
}
