"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  WEEKDAY_LABELS,
  hexToRgba,
  formatDate,
  buildCalendar,
  formatWishTime,
  useLightbox,
  Lightbox,
  googleCalendarUrl,
  mapEmbedUrl,
  FamilyColumn,
  SharedCarousel,
  SharedCountdown,
  DressCode,
  SharedWishForm,
} from "@/components/chungdoi-tpl-shared";

const RED_BASE = "/chungdoi/images/themes/_decor/longphung-v3-red";
const RED = "#8f1d1d";
const GOLD = "#c9a227";
const RED_MUTED = "rgba(143,29,29,0.72)";
const RED_LUNAR = "( Tức ngày 10/03 năm Bính Ngọ )";

const nameFont = { fontFamily: '"Alex Brush", "The Nautigal", cursive' };
const ampFont = { fontFamily: '"Alex Brush", "The Nautigal", cursive' };

function RedHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: RED }}>
      {children}
    </h2>
  );
}

/** Faithful rebuild of the Dragon-Phoenix v3 Red (long-phung-v3-do) opened invitation. */
export function DragonPhoenixV3Invitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes, bank } = content;
  const ceremony = formatDate(couple.ceremonyDate || couple.date);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const { lightbox, setLightbox } = useLightbox(gallery.length);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();

  const groomCol = <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  const banks = ([
    { label: `${couple.groomBirthOrder || "Trưởng Nam"} - ${bank.groomAccountName}`, bank: bank.groomBankName, num: bank.groomAccountNumber, name: bank.groomAccountName },
    { label: `${couple.brideBirthOrder || "Út Nữ"} - ${bank.brideAccountName}`, bank: bank.brideBankName, num: bank.brideAccountNumber, name: bank.brideAccountName },
  ] as const).filter((q) => q.bank);

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div className="relative w-full max-w-[480px] overflow-hidden md:mx-auto md:max-w-[900px] md:border" style={{ color: RED, borderColor: hexToRgba(RED, 0.2), backgroundColor: "#fffdf8" }}>
        {/* HEADER — dragon + phoenix flanking, chu-hy emblem, names */}
        <header className="relative z-20 flex w-full flex-col items-center px-4 pt-[80px] sm:px-5 md:pt-[110px]">
          {/* dragon (left) + phoenix (right) flanking decor */}
          <img src={`${RED_BASE}/rong.webp`} alt="" aria-hidden className="pointer-events-none absolute top-[60px] -left-[6%] -z-10 h-auto w-[46%] max-w-none object-contain opacity-90 md:top-[80px] md:-left-[2%] md:w-[38%]" />
          <img src={`${RED_BASE}/phung.webp`} alt="" aria-hidden className="pointer-events-none absolute top-[60px] -right-[6%] -z-10 h-auto w-[46%] max-w-none object-contain opacity-90 md:top-[80px] md:-right-[2%] md:w-[38%]" />

          {/* chu-hy 囍 emblem */}
          <img src={`${RED_BASE}/chu-hy.webp`} alt="" aria-hidden className="pointer-events-none relative z-30 mb-3 h-[80px] w-auto object-contain md:mb-4 md:h-[110px]" />

          <p className="relative z-30 text-center text-[15px] uppercase tracking-[0.2em] md:text-[20px]">Welcome To Our Wedding</p>

          <h1 className="relative z-30 mt-4 flex flex-col items-center leading-none" style={{ color: RED }}>
            <span className="text-[56px] md:text-[72px]" style={nameFont}>{couple.groomShortName || couple.groomFullName}</span>
            <span className="my-2 text-[32px] md:text-[40px]" style={{ ...ampFont, color: GOLD }}>&amp;</span>
            <span className="text-[56px] md:text-[72px]" style={nameFont}>{couple.brideShortName || couple.brideFullName}</span>
          </h1>
        </header>

        <div className="relative z-10 mt-10 flex w-full flex-col items-center gap-14 px-4 pb-14 md:mt-14 md:px-10">
          {/* CEREMONY INFO */}
          <section className="flex w-full flex-col items-center gap-8">
            <RedHeading>Thông Tin Lễ Cưới</RedHeading>
            <div className="flex w-full items-start justify-center gap-3 md:gap-10">
              {couple.brideFirst ? (<>{brideCol}{groomCol}</>) : (<>{groomCol}{brideCol}</>)}
            </div>
            <div className="whitespace-pre-line text-center text-[16px] uppercase leading-relaxed tracking-wide md:text-[20px]">
              {"TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI"}
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="flex min-h-[80px] w-[80%] items-center justify-center text-[44px] leading-[1.1] md:text-[60px]" style={nameFont}>{couple.groomFullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: RED_MUTED }}>{couple.groomBirthOrder || "Trưởng Nam"}</div>
              <div className="text-[24px] md:text-[32px]" style={{ ...ampFont, color: GOLD }}>&amp;</div>
              <h3 className="flex min-h-[80px] w-[80%] items-center justify-center text-[44px] leading-[1.1] md:text-[60px]" style={nameFont}>{couple.brideFullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: RED_MUTED }}>{couple.brideBirthOrder || "Út Nữ"}</div>
            </div>
            {ceremony ? (
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                  <span>{ceremony.weekday}</span><span style={{ color: GOLD }}>|</span><span className="text-[28px] font-bold">{ceremony.day}</span><span style={{ color: GOLD }}>|</span><span>Tháng {ceremony.month}</span>
                </div>
                <div className="text-[18px] md:text-[24px]">{ceremony.yearNumber}</div>
                <div className="text-xs uppercase tracking-[0.25em] md:text-sm" style={{ color: RED_MUTED }}>{RED_LUNAR}</div>
              </div>
            ) : null}
          </section>

          {/* ALBUM */}
          {gallery.length > 0 ? (
            <section className="flex w-full flex-col items-center gap-6">
              <RedHeading>Album Ảnh Cưới</RedHeading>
              <div className="relative mx-auto aspect-[3/4] w-full max-w-[400px] overflow-hidden rounded-xl border md:max-w-[480px]" style={{ borderColor: hexToRgba(GOLD, 0.5) }}>
                <SharedCarousel photos={gallery} arrowColor={RED} />
              </div>
              <Lightbox gallery={gallery} index={lightbox} setIndex={setLightbox} accent={RED} />
            </section>
          ) : null}

          {/* RECEPTION INFO + calendar */}
          <section className="relative flex w-full flex-col items-center gap-3">
            <RedHeading>Thông Tin Tiệc Cưới</RedHeading>
            <p className="mt-2 text-center text-[16px] uppercase md:text-[20px]">Tiệc cưới sẽ diễn ra vào lúc:</p>
            <div className="text-[20px] font-semibold md:text-[30px]">{venue.banquetTime || couple.time}</div>
            {reception ? (
              <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                <span>{reception.weekday}</span><span style={{ color: GOLD }}>/</span><span>{reception.day}</span><span style={{ color: GOLD }}>/</span><span>Tháng {reception.month}</span>
              </div>
            ) : null}
            {reception ? <div className="text-[18px] md:text-[24px]">{reception.yearNumber}</div> : null}
            <div className="text-xs uppercase tracking-[0.25em] md:text-base" style={{ color: RED_MUTED }}>{RED_LUNAR}</div>

            <div className="mt-4 flex flex-col items-center">
              <RedHeading>Cùng đếm ngược</RedHeading>
              <SharedCountdown target={`${couple.date}T${couple.time || "18:00"}`} style={{ color: RED }} />
            </div>

            {calendar ? (
              <div className="relative mx-auto mt-8 w-full max-w-[340px] rounded-2xl border p-6 md:mt-10 md:max-w-[420px]" style={{ borderColor: hexToRgba(GOLD, 0.5), backgroundColor: hexToRgba(GOLD, 0.06) }}>
                <p className="text-center text-[12px] font-semibold uppercase tracking-wide md:text-[13px]">Tháng {calendar.month} / {calendar.year}</p>
                <div className="mt-2 grid w-full grid-cols-7 text-[10px] font-medium opacity-70 md:text-[11px]">
                  {WEEKDAY_LABELS.map((d) => (<span key={d} className="py-0.5 text-center">{d}</span>))}
                </div>
                <div className="grid w-full grid-cols-7 gap-y-0.5 text-[11px] md:text-[12px]">
                  {calendar.cells.map((day, i) => (
                    <span key={i} className={`flex aspect-square items-center justify-center rounded-full ${day === calendar.highlight ? "font-bold text-white" : ""}`} style={day === calendar.highlight ? { backgroundColor: GOLD } : undefined}>{day ?? ""}</span>
                  ))}
                </div>
              </div>
            ) : null}

            <a href={googleCalendarUrl(content)} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center rounded-full border px-6 py-2 text-sm font-semibold transition" style={{ borderColor: GOLD, color: RED }}>Thêm vào lịch</a>
          </section>

          {/* VENUE MAP */}
          {mapQuery ? (
            <section className="flex w-full flex-col items-center gap-3 text-center">
              <h3 className="text-[20px] font-bold uppercase md:text-[24px]" style={{ color: RED }}>Tiệc cưới sẽ tổ chức tại</h3>
              <p className="mx-auto mt-1 max-w-sm whitespace-pre-line text-sm leading-6 md:max-w-[500px]">{venue.address}</p>
              <div className="mt-4 w-full overflow-hidden rounded-2xl border" style={{ borderColor: hexToRgba(GOLD, 0.5) }}>
                <iframe src={mapEmbedUrl(mapQuery)} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            </section>
          ) : null}

          <DressCode headingColor={RED} subColor={RED_MUTED} colors={[{ color: RED }, { color: "#fffdf8", border: RED }, { color: GOLD }]} />

          {/* SCHEDULE */}
          {schedule.length > 0 ? (
            <section className="relative flex w-full flex-col items-center gap-6">
              <RedHeading>Lịch Trình Ngày Cưới</RedHeading>
              <ol className="mx-auto flex w-full max-w-sm flex-col gap-4">
                {schedule.map((s, i) => (
                  <li key={`${s.time}-${i}`} className="flex items-baseline gap-4">
                    <span className="w-[64px] shrink-0 pt-0.5 text-right text-[16px] tabular-nums tracking-wide md:text-[17px]" style={{ color: GOLD }}>{s.time}</span>
                    <span className="text-[16px] font-medium leading-tight md:text-[18px]">{s.label}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* WISHES */}
          <section className="relative w-full">
            <div className="text-center"><RedHeading>Sổ Lưu Bút</RedHeading></div>
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

          {/* QR GIFT */}
          {banks.length > 0 ? (
            <section className="w-full text-center">
              <h2 className="mb-6 text-[20px] font-bold uppercase md:text-[24px]" style={{ color: RED }}>Phong Bao Mừng Cưới</h2>
              <div className="flex flex-row flex-wrap items-start justify-center gap-4 sm:gap-8">
                {banks.map((q) => {
                  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${q.bank} ${q.num} ${q.name}`)}`;
                  return (
                    <div key={q.label} className="flex max-w-[200px] flex-1 flex-col items-center">
                      <h3 className="mb-2 flex min-h-[2rem] items-start justify-center text-xs font-semibold">{q.label}</h3>
                      <div className="size-32 rounded-xl border bg-white p-2 sm:size-40" style={{ borderColor: hexToRgba(GOLD, 0.5) }}><img src={qr} alt={`QR - ${q.label}`} className="h-full w-full object-contain" /></div>
                      <p className="mt-2 text-[13px] font-semibold">{q.bank}</p>
                      <p className="text-[13px] font-mono">{q.num}</p>
                      <p className="text-[13px]">{q.name}</p>
                      <a href={qr} target="_blank" rel="noreferrer" className="mt-3 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase" style={{ borderColor: GOLD, color: RED }}>Lưu QR</a>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        {/* FOOTER — swallow birds decor + deep-red closing */}
        <div className="relative flex justify-center pb-2">
          <img src={`${RED_BASE}/chim-en.webp`} alt="" aria-hidden className="pointer-events-none h-auto w-[220px] object-contain opacity-90 md:w-[320px]" />
        </div>
        <footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 text-center" style={{ backgroundColor: RED }}>
          <span className="text-[12px] md:text-[15px] lg:text-[18px]" style={{ color: "#fdf3e3" }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: RED }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}
