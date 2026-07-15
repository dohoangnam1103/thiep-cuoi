"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  hexToRgba, formatDate, buildCalendar, formatWishTime,
  useLightbox, Lightbox, googleCalendarUrl, InvitationMap,
  FamilyColumn, GiftEnvelope, SharedWishForm, WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";

const BASE = "/chungdoi/images/themes/_decor/boho-floral-brown";
const BROWN = "#6b4a2e";
const BROWN_MUTED = "rgba(107,74,46,0.72)";
const heroNameFont = { fontFamily: '"Fz Aghita", Baskerville, "Times New Roman", serif' };
const bodyNameFont = { fontFamily: '"Fz Qellia", Baskerville, "Times New Roman", serif' };

function BohoHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-[22px] font-bold uppercase tracking-wide md:text-[28px]" style={{ color: BROWN }}>
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

export function BohoFloralInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes, bank } = content;
  const ceremony = formatDate(couple.ceremonyDate || couple.date);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const albumShown = gallery.slice(0, 4);
  const albumExtra = Math.max(0, gallery.length - 4);
  const { lightbox, setLightbox } = useLightbox(gallery.length);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const groomPortrait = content.portraits?.groom || gallery[0];
  const bridePortrait = content.portraits?.bride || gallery[1];

  const groomCol = <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  const banks = ([
    { label: `${couple.groomBirthOrder || "Trưởng Nam"} - ${bank.groomAccountName}`, bank: bank.groomBankName, num: bank.groomAccountNumber, name: bank.groomAccountName },
    { label: `${couple.brideBirthOrder || "Út Nữ"} - ${bank.brideAccountName}`, bank: bank.brideBankName, num: bank.brideAccountNumber, name: bank.brideAccountName },
  ] as const).filter((q) => q.bank);

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div className="relative isolate w-full max-w-[480px] overflow-hidden bg-[#fffaf7] md:mx-auto md:max-w-[900px] md:border" style={{ color: BROWN, borderColor: hexToRgba(BROWN, 0.2) }}>
        {/* fixed corner florals */}
        <img src={`${BASE}/fixed_flower.webp`} alt="" aria-hidden className="pointer-events-none absolute -left-[6%] top-[30%] -z-10 h-[220px] w-auto max-w-none object-contain opacity-[0.16] md:h-[340px]" />
        <img src={`${BASE}/fixed_flower_2.webp`} alt="" aria-hidden className="pointer-events-none absolute -right-[6%] top-[62%] -z-10 h-[220px] w-auto max-w-none object-contain opacity-[0.16] md:h-[340px]" />

        <header data-template-hero="boho-floral-brown" className="relative z-20 flex min-h-[900px] w-full flex-col items-center px-4 pt-[290px] sm:px-5 md:min-h-[1080px] md:pt-[410px]">
          <img src={`${BASE}/flower_top.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-[86px] left-[-18%] -z-10 w-[122%] max-w-none object-contain md:-top-[146px] md:left-[-40px] md:w-[1100px]" />

          <div className="relative z-10 mx-auto h-[440px] w-[320px] md:h-[640px] md:w-[500px]">
            <div className="absolute left-1/2 top-[44%] -z-10 w-screen -translate-x-1/2 -translate-y-1/2">
              <img src={`${BASE}/decoration_bar.webp`} alt="" aria-hidden className="h-auto w-full md:h-[150px] md:object-cover" />
            </div>

            {groomPortrait ? (
              <div className="absolute left-1/2 -top-[40px] z-20 flex -translate-x-[55%] items-center gap-3 md:-top-[60px] md:-translate-x-[56%] md:gap-4">
                <div className="w-[170px] shrink-0 rotate-[-17deg] max-[353px]:w-[160px] md:w-[235px]">
                  <div className="relative aspect-[2/3] overflow-hidden border-[5px] border-[#795b4a]">
                    <img src={groomPortrait} alt={couple.groomShortName || couple.groomFullName} className="h-full w-full object-cover" />
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-[12px] tracking-widest text-[#4a2816] md:text-[14px]">{couple.groomBirthOrder || "Út Nam"}</div>
                  <div className="whitespace-nowrap text-[25px] leading-[1.5] text-[#4a2816] md:text-[32px]" style={heroNameFont}>{couple.groomShortName || couple.groomFullName.split(/\s+/).slice(-2).join(" ")}</div>
                </div>
              </div>
            ) : null}

            {bridePortrait ? (
              <div className="absolute left-1/2 top-[150px] z-30 flex -translate-x-[40%] flex-row-reverse items-center gap-3 max-[353px]:top-[140px] md:top-[260px] md:-translate-x-[18%] md:gap-4">
                <div className="w-[170px] shrink-0 rotate-[13deg] max-[353px]:w-[160px] md:w-[235px]">
                  <div className="relative aspect-[2/3] overflow-hidden border-[5px] border-[#795b4a]">
                    <img src={bridePortrait} alt={couple.brideShortName || couple.brideFullName} className="h-full w-full object-cover" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] tracking-widest text-[#4a2816] md:text-[14px]">{couple.brideBirthOrder || "Thứ Nữ"}</div>
                  <div className="whitespace-nowrap text-[25px] leading-[1.5] text-[#4a2816] md:text-[32px]" style={heroNameFont}>{couple.brideShortName || couple.brideFullName.split(/\s+/).slice(-2).join(" ")}</div>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <div className="relative z-10 flex w-full flex-col items-center gap-14 px-4 pb-14 pt-10 md:px-10">
          {/* CEREMONY INFO */}
          <section className="flex w-full flex-col items-center gap-8">
            <BohoHeading>Thông Tin Lễ Cưới</BohoHeading>
            <div className="flex w-full items-start justify-center gap-3 md:gap-10">
              {couple.brideFirst ? (<>{brideCol}{groomCol}</>) : (<>{groomCol}{brideCol}</>)}
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[42px] leading-[1.1] md:text-[58px]" style={bodyNameFont}>{couple.groomFullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: BROWN_MUTED }}>{couple.groomBirthOrder || "Trưởng Nam"}</div>
              <div className="text-[24px] md:text-[32px]" style={heroNameFont}>&amp;</div>
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[42px] leading-[1.1] md:text-[58px]" style={bodyNameFont}>{couple.brideFullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: BROWN_MUTED }}>{couple.brideBirthOrder || "Út Nữ"}</div>
            </div>
            {ceremony ? (
              <div className="flex flex-col items-center gap-1 text-center">
                {couple.ceremonyHeader ? <span className="whitespace-pre-line text-[16px] uppercase leading-relaxed md:text-[20px]">{couple.ceremonyHeader}</span> : null}
                {couple.ceremonyTime ? <div className="text-[20px] md:text-[30px]">{couple.ceremonyTime}</div> : null}
                <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                  <span>{ceremony.weekday}</span><span>|</span><span className="text-[28px] font-bold">{ceremony.day}</span><span>|</span><span>Tháng {ceremony.month}</span>
                </div>
                <div className="text-[18px] md:text-[24px]">{ceremony.yearNumber}</div>
              </div>
            ) : null}
          </section>

          {/* ALBUM */}
          {albumShown.length > 0 ? (
            <section className="relative flex w-full flex-col items-center gap-6">
              <img src={`${BASE}/flower_mid.webp`} alt="" aria-hidden className="pointer-events-none absolute -right-[10%] top-[40px] -z-10 h-[240px] w-auto max-w-none object-contain opacity-[0.15] md:h-[360px]" />
              <BohoHeading>Album Ảnh Cưới</BohoHeading>
              <div className="grid w-full max-w-[400px] grid-cols-2 gap-3 md:max-w-[560px] md:gap-4">
                {albumShown.map((src, i) => (
                  <button key={src} type="button" onClick={() => setLightbox(i)} className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border" style={{ borderColor: hexToRgba(BROWN, 0.3) }}>
                    <img alt={`Ảnh cưới ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" src={src} />
                    {i === albumShown.length - 1 && albumExtra > 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/55"><span className="text-lg font-semibold text-white">+{albumExtra}</span></div>
                    ) : null}
                  </button>
                ))}
              </div>
              <Lightbox gallery={gallery} index={lightbox} setIndex={setLightbox} accent={BROWN} />
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

            {calendar ? (
              <div className="relative mx-auto mt-8 w-full max-w-[340px] rounded-2xl border px-8 py-6 md:mt-10 md:max-w-[420px]" style={{ borderColor: hexToRgba(BROWN, 0.3), backgroundColor: "#fffdfa" }}>
                <div className="relative flex h-full w-full flex-col items-center justify-center">
                  <p className="text-[12px] font-semibold uppercase tracking-wide md:text-[13px]">Tháng {calendar.month} / {calendar.year}</p>
                  <div className="mt-2 grid w-full grid-cols-7 text-[10px] font-medium opacity-70 md:text-[11px]">
                    {WEEKDAY_LABELS.map((d) => (<span key={d} className="py-0.5 text-center">{d}</span>))}
                  </div>
                  <div className="grid w-full grid-cols-7 gap-y-0.5 text-[11px] md:text-[12px]">
                    {calendar.cells.map((day, i) => (
                      <span key={i} className={`flex aspect-square items-center justify-center rounded-full ${day === calendar.highlight ? "font-bold text-white" : ""}`} style={day === calendar.highlight ? { backgroundColor: BROWN } : undefined}>{day ?? ""}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <a href={googleCalendarUrl(content)} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center rounded-full border px-6 py-2 text-sm font-semibold transition" style={{ borderColor: BROWN, color: BROWN }}>Thêm vào lịch</a>
          </section>

          {/* VENUE MAP */}
          {mapQuery ? (
            <section className="flex w-full flex-col items-center gap-3 text-center">
              <BohoHeading>Tiệc cưới sẽ tổ chức tại</BohoHeading>
              <p className="mx-auto mt-1 max-w-sm whitespace-pre-line text-sm leading-6 md:max-w-[500px]">{venue.address}</p>
              <div className="mt-4 w-full overflow-hidden rounded-2xl border" style={{ borderColor: hexToRgba(BROWN, 0.3) }}>
                <InvitationMap query={mapQuery} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
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
                    <span className="w-[64px] shrink-0 pt-0.5 text-right text-[16px] tabular-nums tracking-wide md:text-[17px]">{s.time}</span>
                    <span className="text-[16px] font-medium leading-tight md:text-[18px]">{s.label}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* WISHES */}
          <section className="relative w-full">
            <div className="text-center"><BohoHeading>Sổ Lưu Bút</BohoHeading></div>
            <SharedWishForm accent={BROWN} />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                {wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-xs" style={{ borderColor: hexToRgba(BROWN, 0.2), backgroundColor: "#fffdfa" }}>
                    <div className="flex items-start justify-between">
                      <span className="font-semibold" style={{ color: BROWN }}>{w.name}</span>
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
              <GiftEnvelope banks={banks} accent={BROWN} dark={BROWN} cardBg="#fffaf3" heading="Hộp Quà Mừng" labelColor={BROWN_MUTED} />
            </section>
          ) : null}
        </div>

        {/* FOOTER */}
        <img src={`${BASE}/flower_bottom.webp`} alt="" aria-hidden className="pointer-events-none absolute -bottom-[100px] -right-[34%] z-0 h-[660px] w-auto max-w-none object-contain opacity-[0.09] md:-right-[8%] md:h-[900px]" />
        <footer data-template-footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 text-center">
          <span className="text-[12px] md:text-[15px] lg:text-[18px]" style={{ color: BROWN }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: BROWN }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}
