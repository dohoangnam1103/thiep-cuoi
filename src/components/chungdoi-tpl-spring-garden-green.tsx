"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  buildCalendar,
  FamilyColumn,
  formatDate,
  formatWishTime,
  googleCalendarUrl,
  hexToRgba,
  Lightbox,
  mapEmbedUrl,
  SharedWishForm,
  useLightbox,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";

const BASE = "/chungdoi/images/themes/_decor/nature";
const TEXT = "#5d6a57";
const ACCENT = "#697a62";
const ACCENT_MUTED = hexToRgba(ACCENT, 0.72);

function GardenHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: ACCENT }}>
      {children}
    </h2>
  );
}

export function SpringGardenGreenInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes, bank } = content;
  const ceremony = formatDate(couple.ceremonyDate || couple.date);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const albumShown = gallery.slice(0, 4);
  const albumExtra = Math.max(0, gallery.length - 4);
  const { lightbox, setLightbox } = useLightbox(gallery.length);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const nameFont = { fontFamily: '"Playfair Display", "Cormorant Garamond", serif' };
  const ampFont = { fontFamily: '"Alex Brush", "The Nautigal", cursive' };

  const groomCol = <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  const banks = ([
    { label: `${couple.groomBirthOrder || "Trưởng Nam"} - ${bank.groomAccountName}`, bank: bank.groomBankName, num: bank.groomAccountNumber, name: bank.groomAccountName },
    { label: `${couple.brideBirthOrder || "Út Nữ"} - ${bank.brideAccountName}`, bank: bank.brideBankName, num: bank.brideAccountNumber, name: bank.brideAccountName },
  ] as const).filter((q) => q.bank);

  return (
    <div className="flex w-full justify-center overflow-x-clip" style={{ background: "linear-gradient(180deg,#f0f4ef 0%,#e8ede6 55%,#dfe5dd 100%)" }}>
      <div className="relative w-full max-w-[480px] overflow-hidden md:mx-auto md:max-w-[900px] md:border" style={{ color: TEXT, borderColor: hexToRgba(ACCENT, 0.2) }}>
        {/* parallax side floral */}
        <img src={`${BASE}/flower_paralax.webp`} alt="" aria-hidden className="pointer-events-none absolute top-[620px] -right-[24%] -z-10 h-[820px] w-auto max-w-none object-contain opacity-[0.16] md:top-[760px] md:-right-[12%] md:h-[1240px]" />
        <img src={`${BASE}/flower_paralax.webp`} alt="" aria-hidden className="pointer-events-none absolute top-[1500px] -left-[24%] -z-10 h-[820px] w-auto max-w-none -scale-x-100 object-contain opacity-[0.14] md:top-[1700px] md:-left-[12%] md:h-[1240px]" />

        {/* HEADER */}
        <header className="relative z-20 flex w-full flex-col items-center px-4 pt-[80px] sm:px-5 md:pt-[110px]">
          <img src={`${BASE}/flower_top.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-2 right-0 -z-10 h-[210px] w-auto max-w-none object-contain opacity-95 md:h-[320px]" />
          <img src={`${BASE}/flower_top.webp`} alt="" aria-hidden className="pointer-events-none absolute -top-2 left-0 -z-10 h-[210px] w-auto max-w-none -scale-x-100 object-contain opacity-95 md:h-[320px]" />

          <p className="relative z-30 text-center text-[13px] uppercase tracking-[0.3em] md:text-[16px]" style={{ color: ACCENT_MUTED }}>Welcome To Our Wedding</p>

          <h1 className="relative z-30 mt-4 flex flex-col items-center leading-none" style={{ color: TEXT }}>
            <span className="text-[52px] md:text-[70px]" style={nameFont}>{couple.groomShortName || couple.groomFullName}</span>
            <span className="my-2 text-[34px] md:text-[42px]" style={ampFont}>&amp;</span>
            <span className="text-[52px] md:text-[70px]" style={nameFont}>{couple.brideShortName || couple.brideFullName}</span>
          </h1>

          {albumShown.length > 0 ? (
            <div className="relative z-30 mt-8 flex w-full items-start justify-center gap-4 md:gap-10">
              <div className="relative aspect-[3/4] w-[42%] max-w-[200px] overflow-hidden rounded-lg border bg-white/60" style={{ borderColor: hexToRgba(ACCENT, 0.3) }}>
                {gallery[0] ? <img src={gallery[0]} alt="Chú rể" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="relative aspect-[3/4] w-[42%] max-w-[200px] overflow-hidden rounded-lg border bg-white/60" style={{ borderColor: hexToRgba(ACCENT, 0.3) }}>
                {gallery[1] ? <img src={gallery[1]} alt="Cô dâu" className="h-full w-full object-cover" /> : null}
              </div>
            </div>
          ) : null}
        </header>

        <div className="relative z-10 flex w-full flex-col items-center gap-14 px-4 pb-14 pt-10 md:px-10">
          {/* CEREMONY INFO */}
          <section className="flex w-full flex-col items-center gap-8">
            <GardenHeading>Thông Tin Lễ Cưới</GardenHeading>
            <div className="flex w-full items-start justify-center gap-3 md:gap-10">
              {couple.brideFirst ? (<>{brideCol}{groomCol}</>) : (<>{groomCol}{brideCol}</>)}
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[40px] leading-[1.1] md:text-[54px]" style={nameFont}>{couple.groomFullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: ACCENT_MUTED }}>{couple.groomBirthOrder || "Trưởng Nam"}</div>
              <div className="text-[24px] md:text-[32px]" style={ampFont}>&amp;</div>
              <h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[40px] leading-[1.1] md:text-[54px]" style={nameFont}>{couple.brideFullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: ACCENT_MUTED }}>{couple.brideBirthOrder || "Út Nữ"}</div>
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
              <GardenHeading>Album Ảnh Cưới</GardenHeading>
              <div className="grid w-full max-w-[400px] grid-cols-2 gap-3 md:max-w-[560px] md:gap-4">
                {albumShown.map((src, i) => (
                  <button key={src} type="button" onClick={() => setLightbox(i)} className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border" style={{ borderColor: hexToRgba(ACCENT, 0.3) }}>
                    <img alt={`Ảnh cưới ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" src={src} />
                    {i === albumShown.length - 1 && albumExtra > 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/55"><span className="text-lg font-semibold text-white">+{albumExtra}</span></div>
                    ) : null}
                  </button>
                ))}
              </div>
              <Lightbox gallery={gallery} index={lightbox} setIndex={setLightbox} accent={ACCENT} />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
