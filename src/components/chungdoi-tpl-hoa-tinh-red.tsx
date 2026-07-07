"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  hexToRgba, formatDate, buildCalendar, formatWishTime,
  useLightbox, Lightbox, googleCalendarUrl, mapEmbedUrl,
  FamilyColumn, SharedWishForm, WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";

const BASE = "/chungdoi/images/themes/_decor/love-art";
const PURPLE = "#6b3fa0";
const PURPLE_MUTED = "rgba(107,63,160,0.72)";

function HoaTinhHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-[22px] font-bold uppercase tracking-wide md:text-[28px]" style={{ color: PURPLE }}>
      {children}
    </h2>
  );
}

export function HoaTinhInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes, bank } = content;
  const ceremony = formatDate(couple.ceremonyDate || couple.date);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const albumShown = gallery.slice(0, 4);
  const albumExtra = Math.max(0, gallery.length - 4);
  const { lightbox, setLightbox } = useLightbox(gallery.length);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const nameFont = { fontFamily: '"Alex Brush", cursive' };

  const groomCol = <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  const banks = ([
    { label: `${couple.groomBirthOrder || "Trưởng Nam"} - ${bank.groomAccountName}`, bank: bank.groomBankName, num: bank.groomAccountNumber, name: bank.groomAccountName },
    { label: `${couple.brideBirthOrder || "Út Nữ"} - ${bank.brideAccountName}`, bank: bank.brideBankName, num: bank.brideAccountNumber, name: bank.brideAccountName },
  ] as const).filter((q) => q.bank);

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div className="relative w-full max-w-[480px] overflow-hidden md:mx-auto md:max-w-[900px] md:border" style={{ color: PURPLE, borderColor: hexToRgba(PURPLE, 0.2) }}>
        {/* HEADER */}
        <header className="relative z-20 flex w-full flex-col items-center px-4 pt-[70px] sm:px-5 md:pt-[100px]">
          {/* scattered purple-flower decor */}
          <img src={`${BASE}/hoa tim.webp`} alt="" aria-hidden className="pointer-events-none absolute -left-[15%] top-[40px] -z-10 h-[260px] w-auto max-w-none object-contain opacity-[0.18] md:h-[420px]" />
          <img src={`${BASE}/3 tim.webp`} alt="" aria-hidden className="pointer-events-none absolute -right-[12%] top-[120px] -z-10 h-[240px] w-auto max-w-none object-contain opacity-[0.18] md:h-[380px]" />
          <img src={`${BASE}/tim.webp`} alt="" aria-hidden className="pointer-events-none absolute right-[4%] top-[10px] -z-10 h-[90px] w-auto object-contain opacity-[0.2] md:h-[140px]" />

          <img src={`${BASE}/title.webp`} alt="" aria-hidden className="relative z-30 mb-4 h-auto w-[280px] max-w-[80%] object-contain md:w-[440px]" />

          <div className="relative z-30 my-2 flex justify-center">
            <img src={`${BASE}/hy.webp`} alt="" aria-hidden className="h-[70px] w-auto object-contain opacity-90 md:h-[100px]" />
          </div>

          <h1 className="relative z-30 mt-2 flex flex-col items-center leading-none" style={{ color: PURPLE }}>
            <span className="text-[58px] md:text-[76px]" style={nameFont}>{couple.groomShortName || couple.groomFullName}</span>
            <span className="my-1 text-[34px] md:text-[42px]" style={nameFont}>&amp;</span>
            <span className="text-[58px] md:text-[76px]" style={nameFont}>{couple.brideShortName || couple.brideFullName}</span>
          </h1>

          {/* portraits inside frames */}
          {albumShown.length > 0 ? (
            <div className="relative z-30 mt-8 flex w-full items-start justify-center gap-4 md:gap-10">
              <div className="relative aspect-[3/4] w-[42%] max-w-[200px]">
                {gallery[0] ? <img src={gallery[0]} alt="Chú rể" className="h-full w-full rounded-lg object-cover" /> : null}
                <img src={`${BASE}/groom frame.webp`} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
              </div>
              <div className="relative aspect-[3/4] w-[42%] max-w-[200px]">
                {gallery[1] ? <img src={gallery[1]} alt="Cô dâu" className="h-full w-full rounded-lg object-cover" /> : null}
                <img src={`${BASE}/bride frame.webp`} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
              </div>
            </div>
          ) : null}

          <img src={`${BASE}/love.webp`} alt="" aria-hidden className="relative z-30 mt-8 h-auto w-[200px] object-contain opacity-90 md:w-[300px]" />
        </header>

        <div className="relative z-10 flex w-full flex-col items-center gap-14 px-4 pb-14 pt-10 md:px-10">
          {/* CEREMONY INFO */}
          <section className="flex w-full flex-col items-center gap-8">
            <HoaTinhHeading>Thông Tin Lễ Cưới</HoaTinhHeading>
            <div className="flex w-full items-start justify-center gap-3 md:gap-10">
              {couple.brideFirst ? (<>{brideCol}{groomCol}</>) : (<>{groomCol}{brideCol}</>)}
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[42px] leading-[1.1] md:text-[58px]" style={nameFont}>{couple.groomFullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: PURPLE_MUTED }}>{couple.groomBirthOrder || "Trưởng Nam"}</div>
              <div className="text-[24px] md:text-[32px]" style={nameFont}>&amp;</div>
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[42px] leading-[1.1] md:text-[58px]" style={nameFont}>{couple.brideFullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: PURPLE_MUTED }}>{couple.brideBirthOrder || "Út Nữ"}</div>
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
            <section className="flex w-full flex-col items-center gap-6">
              <HoaTinhHeading>Album Ảnh Cưới</HoaTinhHeading>
              <div className="grid w-full max-w-[400px] grid-cols-2 gap-3 md:max-w-[560px] md:gap-4">
                {albumShown.map((src, i) => (
                  <button key={src} type="button" onClick={() => setLightbox(i)} className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border" style={{ borderColor: hexToRgba(PURPLE, 0.3) }}>
                    <img alt={`Ảnh cưới ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" src={src} />
                    {i === albumShown.length - 1 && albumExtra > 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/55"><span className="text-lg font-semibold text-white">+{albumExtra}</span></div>
                    ) : null}
                  </button>
                ))}
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
                <iframe src={mapEmbedUrl(mapQuery)} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
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

          {/* QR GIFT */}
          {banks.length > 0 ? (
            <section className="w-full text-center">
              <HoaTinhHeading>QR Mừng Cưới</HoaTinhHeading>
              <div className="mt-6 flex flex-row flex-wrap items-start justify-center gap-4 sm:gap-8">
                {banks.map((q) => {
                  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${q.bank} ${q.num} ${q.name}`)}`;
                  return (
                    <div key={q.label} className="flex max-w-[200px] flex-1 flex-col items-center">
                      <h3 className="mb-2 flex min-h-[2rem] items-start justify-center text-xs font-semibold">{q.label}</h3>
                      <div className="size-32 rounded-xl bg-white p-2 sm:size-40"><img src={qr} alt={`QR - ${q.label}`} className="h-full w-full object-contain" /></div>
                      <p className="mt-2 text-[13px] font-semibold">{q.bank}</p>
                      <p className="text-[13px] font-mono">{q.num}</p>
                      <p className="text-[13px]">{q.name}</p>
                      <a href={qr} target="_blank" rel="noreferrer" className="mt-3 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase" style={{ borderColor: PURPLE, color: PURPLE }}>Lưu QR</a>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        {/* FOOTER */}
        <div className="relative flex justify-center pb-4">
          <img src={`${BASE}/thanks.webp`} alt="" aria-hidden className="h-auto w-[320px] object-contain opacity-95 md:w-[460px]" />
        </div>
        <footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 text-center" style={{ backgroundColor: PURPLE }}>
          <span className="text-[12px] md:text-[15px] lg:text-[18px]" style={{ color: "#f4eefb" }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: PURPLE }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}
