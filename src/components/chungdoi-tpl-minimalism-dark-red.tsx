"use client";

import { createContext, useContext } from "react";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { invitationGiftAccounts, invitationHeroImage, orderedCouple } from "@/lib/invitation-display";
import {
  AlbumGallery,
  buildCalendar,
  formatDate,
  formatWishTime,
  googleCalendarUrl,
  hexToRgba,
  InvitationMap,
  GiftEnvelope,
  SharedWishForm,
  SharedCountdown,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";

type MinimalismPalette = {
  decorPath: string;
  flowerSrc: string;
  themePath: string;
  primary: string;
  cream: string;
  creamSoft: string;
  pageBg: string;
  deep: string;
  houseSrc?: string;
  envelopeBackgroundSrc?: string;
  envelopeCoverSrc?: string;
  noteSrc?: string | null;
  scheduleIcons?: readonly (string | null)[];
  footerFlowerSrc?: string;
  showCountdown?: boolean;
};

const DARK_RED_PALETTE: MinimalismPalette = {
  decorPath: "/chungdoi/images/themes/_decor/minimalism-dark-red",
  flowerSrc: "/chungdoi/images/themes/_decor/minimalism-dark-red/flower2-decoration.webp",
  themePath: "/chungdoi/images/themes/minimalism-dark-red",
  primary: "#511419",
  cream: "#ece4d8",
  creamSoft: "rgba(236,228,216,0.7)",
  pageBg: "#fff7eb",
  deep: "#590310",
};

const JADE_PALETTE: MinimalismPalette = {
  decorPath: "/chungdoi/images/themes/_decor/minimalism-jade",
  flowerSrc: "/chungdoi/images/themes/_decor/minimalism-jade/flower2-decoration.webp?v=3",
  themePath: "/chungdoi/images/themes/minimalism-jade",
  primary: "#6d9f90",
  cream: "#f2faf7",
  creamSoft: "rgba(242,250,247,0.8)",
  pageBg: "#f8fcfa",
  deep: "#4d796d",
};

const SKY_BLUE_PALETTE: MinimalismPalette = {
  decorPath: "/chungdoi/images/themes/_decor/minimalism-sky-blue",
  flowerSrc: "/chungdoi/images/themes/_decor/minimalism-sky-blue/flower2-decoration.webp?v=3",
  themePath: "/chungdoi/images/themes/minimalism-sky-blue",
  primary: "#4f8fa8",
  cream: "#f1f8fb",
  creamSoft: "rgba(241,248,251,0.76)",
  pageBg: "#f7fbfd",
  deep: "#315f75",
};

const POWDER_PINK_PALETTE: MinimalismPalette = {
  decorPath: "/chungdoi/images/themes/_decor/minimalism-powder-pink",
  flowerSrc: "/chungdoi/images/themes/_decor/minimalism-powder-pink/flower2-decoration.webp?v=3",
  themePath: "/chungdoi/images/themes/minimalism-powder-pink",
  primary: "#b47787",
  cream: "#fff4f6",
  creamSoft: "rgba(255,244,246,0.78)",
  pageBg: "#fff9fa",
  deep: "#865463",
};

const PURPLE_PALETTE: MinimalismPalette = {
  decorPath: "/chungdoi/images/themes/minimalism-purple",
  flowerSrc: "/chungdoi/images/themes/minimalism-purple/flower3-decoration.webp",
  themePath: "/chungdoi/images/themes/minimalism-purple",
  primary: "#7869a0",
  cream: "#f8f4f2",
  creamSoft: "rgba(248,244,242,0.78)",
  pageBg: "#fdfdfc",
  deep: "#625382",
  houseSrc: "/chungdoi/images/themes/minimalism-purple/house-background.webp",
  envelopeBackgroundSrc: "/chungdoi/images/themes/minimalism-purple/envelope-background.webp",
  envelopeCoverSrc: "/chungdoi/images/themes/minimalism-purple/envelope-cover.webp",
  noteSrc: null,
  scheduleIcons: [
    null,
    "/chungdoi/images/themes/minimalism-purple/cake.webp",
    "/chungdoi/images/themes/minimalism-purple/music.webp",
    "/chungdoi/images/themes/minimalism-purple/church.webp",
    null,
  ],
  footerFlowerSrc: "/chungdoi/images/themes/minimalism-purple/flowerbottom-decoration.webp",
  showCountdown: true,
};

const MinimalismPaletteContext = createContext(DARK_RED_PALETTE);

function useMinimalismPalette() {
  return useContext(MinimalismPaletteContext);
}

const SERIF = { fontFamily: '"Times New Roman", serif' };
const BODY = { fontFamily: '"Baskerville", "Times New Roman", serif' };
const CORMORANT = { fontFamily: '"Cormorant Garamond", "Times New Roman", serif' };
const SCRIPT = { fontFamily: '"Viaoda Libre", "The Nautigal", cursive' };
const NAUTIGAL = { fontFamily: '"The Nautigal", cursive' };
const UCHEN = { fontFamily: '"Uchen", "Baskerville", serif' };
const AMP = { fontFamily: '"UNI Chu truyen thong", "Times New Roman", serif' };

/** Medallion chỉ xuất hiện ở 3 dòng giữa của lịch trình, như bản gốc. */
const SCHEDULE_ICONS = [null, "camera", "cake", "cook", null] as const;

/** Watermark lâu đài, mờ 10%, lặp lại ở nhiều mốc dọc trang. */
function CastleWatermark({ className }: { className: string }) {
  const { houseSrc, themePath } = useMinimalismPalette();

  return (
    <img
      src={houseSrc ?? `${themePath}/castle-background.webp`}
      alt=""
      aria-hidden
      loading="lazy"
      className={`pointer-events-none absolute max-w-none -translate-x-1/2 object-contain opacity-[0.1] ${className}`}
    />
  );
}

/** Nhánh hoa nổi, bay nhẹ bằng animation drFloat. */
function FloatingFlower({
  wrapClassName,
  duration,
  delay,
  rotate,
}: {
  wrapClassName: string;
  duration: string;
  delay: string;
  rotate?: string;
}) {
  const { flowerSrc } = useMinimalismPalette();

  return (
    <span aria-hidden className={`pointer-events-none absolute block ${wrapClassName}`}>
      <span className="block" style={{ animation: `drFloat ${duration} ease-in-out infinite`, animationDelay: delay, willChange: "transform" }}>
        <img
          src={flowerSrc}
          alt=""
          aria-hidden
          loading="lazy"
          className={`block w-full max-w-none object-contain drop-shadow-[3px_4px_3px_rgba(0,0,0,0.3)] ${rotate ?? ""}`}
        />
      </span>
    </span>
  );
}

function WineHeading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { primary } = useMinimalismPalette();

  return (
    <h2 className={`relative z-10 text-center text-[20px] font-bold uppercase ${className}`} style={{ ...SERIF, color: primary, letterSpacing: "0.03em" }}>
      {children}
    </h2>
  );
}

function CreamHeading({ children }: { children: React.ReactNode }) {
  const { cream } = useMinimalismPalette();

  return (
    <h2 className="relative z-10 text-center text-[20px] font-bold uppercase" style={{ ...SERIF, color: cream, letterSpacing: "0.03em" }}>
      {children}
    </h2>
  );
}

/** Card đỏ đô có lớp giấy nhân chồng lên, dùng cho mọi khối nội dung chính. */
function WineCard({
  children,
  radius,
  padding,
}: {
  children: React.ReactNode;
  radius: "13" | "10";
  padding: string;
}) {
  const { primary, themePath } = useMinimalismPalette();
  const rounded = radius === "13" ? "rounded-[13px]" : "rounded-[10px]";
  return (
    <div className={`relative overflow-hidden ${rounded} ${padding} shadow-[4px_4px_10px_rgba(0,0,0,0.25)]`}>
      <div aria-hidden className={`absolute inset-0 ${rounded}`} style={{ backgroundColor: primary }} />
      <img
        src={`${themePath}/paper.webp`}
        alt=""
        aria-hidden
        loading="lazy"
        className={`pointer-events-none absolute inset-0 size-full max-w-none object-cover mix-blend-multiply opacity-40 ${rounded}`}
      />
      {children}
    </div>
  );
}

function ParentColumn({ title, a, b, addr }: { title: string; a: string; b: string; addr: string }) {
  const { cream, creamSoft } = useMinimalismPalette();

  return (
    <div className="row-span-4 grid min-w-0 grid-rows-subgrid justify-items-center">
      <span className="text-[12px]" style={{ color: creamSoft }}>{title}</span>
      <span className="text-[12px] font-semibold [overflow-wrap:anywhere]" style={{ color: cream }}>{a}</span>
      <span className="text-[12px] font-semibold [overflow-wrap:anywhere]" style={{ color: cream }}>{b}</span>
      <div className="mt-1 flex w-full flex-col whitespace-pre-line text-[10px] leading-tight" style={{ color: creamSoft }}>{addr}</div>
    </div>
  );
}

function MinimalismInvitation({
  content,
  palette,
  testId,
}: {
  content: ChungDoiDemoContent;
  palette: MinimalismPalette;
  testId: string;
}) {
  const {
    decorPath: DECOR,
    themePath: THEME,
    primary: WINE,
    cream: CREAM,
    creamSoft: CREAM_SOFT,
    pageBg: PAGE_BG,
    deep: WINE_DEEP,
  } = palette;
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const banquetTime = venue.banquetTime || couple.time;
  const welcomeTime = venue.welcomeTime ?? "";
  const heroPhoto = invitationHeroImage(content);
  const dressColors = (content.dressCodeColors ?? "")
    .split(",")
    .map((color) => color.trim())
    .filter(Boolean);

  const groomCol = (
    <ParentColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />
  );
  const brideCol = (
    <ParentColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />
  );

  const banks = invitationGiftAccounts(content).map((account) => ({
    label: `${account.birthOrder} - ${account.name}`,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));

  return (
    <MinimalismPaletteContext.Provider value={palette}>
      <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div
        data-testid={testId}
        className="relative isolate mx-auto w-full max-w-[480px] overflow-hidden md:max-w-[900px] md:border"
        style={{ backgroundColor: PAGE_BG, color: WINE, borderColor: `${WINE}22` }}
      >
        <style>{"@keyframes drFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}"}</style>

        {/* Vân giấy phủ toàn trang, nhân với nền cream cho ra sắc ngà */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${THEME}/paper.webp)`,
            backgroundSize: "100% auto",
            backgroundPosition: "top center",
            mixBlendMode: "multiply",
            opacity: 0.5,
          }}
        />

        {/* HERO — thư nằm trong phong bì, ảnh cưới nghiêng và nhánh hoa bay */}
        <header className="relative z-10 flex flex-col items-center overflow-x-clip px-9 pb-14 pt-15 text-center">
          <CastleWatermark className="left-1/2 top-[26%] w-[170%]" />
          <p className="relative z-10 whitespace-pre-line text-[15px] font-semibold uppercase md:text-[18px]" style={{ ...CORMORANT, color: WINE_DEEP, letterSpacing: "0.16em" }}>
            Save The Date
          </p>

          <div className="relative z-10 mt-24 w-[82%] max-w-[330px] md:mt-28 md:max-w-[420px]">
            <div className="relative aspect-[333/384]">
              <img src={palette.envelopeBackgroundSrc ?? `${DECOR}/envelope-background.webp`} alt="" aria-hidden className="pointer-events-none absolute inset-0 z-10 w-full max-w-none" />
              {heroPhoto ? (
                <div
                  className="absolute left-[33%] top-[-2%] z-20 w-[64%]"
                  style={{ animation: "drFloat 6.5s ease-in-out infinite", animationDelay: "0.4s", willChange: "transform" }}
                >
                  <div className="aspect-[221/309] rotate-[12deg] border-[7px] border-white bg-white shadow-[2px_2px_4px_rgba(0,0,0,0.25)]">
                    <img src={heroPhoto} alt="" className="h-full w-full object-cover" />
                  </div>
                </div>
              ) : null}
              <FloatingFlower wrapClassName="-left-[2%] -top-[12%] z-[25] w-[42%]" duration="5s" delay="0s" rotate="rotate-[-17deg]" />
              <img src={palette.envelopeCoverSrc ?? `${DECOR}/envelope-cover.webp`} alt="" aria-hidden className="pointer-events-none absolute bottom-0 left-0 z-30 w-full max-w-none" />
            </div>
          </div>

          <div className="relative z-10 mt-16 flex flex-col items-center gap-[22px] md:mt-20">
            <p data-invitation-short-name className="text-[clamp(38px,11vw,46px)] leading-none md:text-[58px]" style={{ ...SCRIPT, color: WINE }}>{people[0].shortName}</p>
            <span aria-hidden className="pointer-events-none absolute top-[37%] -translate-y-1/2 text-[92px] leading-none md:text-[120px]" style={{ ...NAUTIGAL, color: hexToRgba(WINE, 0.15) }}>&amp;</span>
            <p data-invitation-short-name className="text-[clamp(38px,11vw,46px)] leading-none md:text-[58px]" style={{ ...SCRIPT, color: WINE }}>{people[1].shortName}</p>
          </div>
        </header>

        {/* CEREMONY INFO */}
        <section className="relative z-10 mx-auto w-[88%] max-w-[420px] md:max-w-[560px]">
          <FloatingFlower wrapClassName="-right-[20%] bottom-[45%] z-20 w-[40%]" duration="5.5s" delay="0.6s" />
          <WineCard radius="13" padding="px-5 pb-10 pt-9 text-center">
            <div className="relative z-10 flex flex-col items-center gap-6">
              <CreamHeading>Thông Tin Lễ Cưới</CreamHeading>

              <div className="relative grid grid-cols-[1fr_auto_1fr] grid-rows-[repeat(4,auto)] justify-center gap-x-8 gap-y-[3px] text-center" style={{ ...BODY, color: CREAM }}>
                {couple.brideFirst ? brideCol : groomCol}
                <div className="row-span-4 h-[50px] w-[1px] shrink-0 self-center" style={{ backgroundColor: "rgba(236,228,216,0.4)" }} />
                {couple.brideFirst ? groomCol : brideCol}
              </div>

              <div className="relative mx-auto flex flex-col gap-1 whitespace-pre-line text-center text-[12px] md:max-w-[560px] md:text-[13px]" style={{ ...BODY, color: CREAM }}>
                {couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI"}
              </div>

              <div className="relative flex w-full min-w-0 flex-col items-center gap-3 text-center md:gap-4">
                {/* Dùng BODY thay GARAMOND cho khớp tên ba mẹ. Mẫu này tự khai BODY
                    cho khối hai họ nên xoá trắng sẽ rơi về font mặc định của app và
                    vẫn lệch. Bỏ whitespace-nowrap và hạ cỡ vì Baskerville rộng hơn
                    Garamond, tên 4 từ sẽ tràn ngang. */}
                <h3 className="font-couple-garamond flex min-h-[80px] w-[80%] items-center justify-center text-[30px] leading-[1.15] md:text-[40px]" style={{ color: CREAM }}>{people[0].fullName}</h3>
                <div className="text-[10px] uppercase" style={{ ...UCHEN, color: CREAM_SOFT, letterSpacing: "0.14em" }}>{people[0].birthOrder}</div>
                <div className="text-[35px]" style={{ ...AMP, color: CREAM }}>&amp;</div>
                <h3 className="font-couple-garamond flex min-h-[80px] w-[80%] items-center justify-center text-[30px] leading-[1.15] md:text-[40px]" style={{ color: CREAM }}>{people[1].fullName}</h3>
                <div className="text-[10px] uppercase" style={{ ...UCHEN, color: CREAM_SOFT, letterSpacing: "0.14em" }}>{people[1].birthOrder}</div>
              </div>

              {ceremony ? (
                <div className="relative flex flex-col items-center gap-4 text-center md:gap-5" style={BODY}>
                  {couple.ceremonyHeader ? (
                    <div style={{ color: CREAM_SOFT }}>
                      <span className="whitespace-pre-line text-center text-[16px] font-normal md:text-[18px]">{couple.ceremonyHeader}</span>
                    </div>
                  ) : null}
                  <div className="flex w-full max-w-[180px] items-center justify-between px-0 text-[13px] uppercase md:max-w-[210px] md:text-[15px]" style={{ color: CREAM_SOFT }}>
                    <span>Vào lúc {couple.ceremonyTime}</span>
                    <span>{ceremony.weekday}</span>
                  </div>
                  <div className="flex items-center justify-center gap-4" style={{ color: CREAM }}>
                    <span className="text-[40px] leading-none md:text-[46px]" style={{ ...SERIF, color: CREAM }}>{ceremony.day}</span>
                    <div className="h-[46px] w-px" style={{ backgroundColor: "rgba(236,228,216,0.45)" }} />
                    <div className="flex flex-col items-start justify-center gap-1 text-left">
                      <span className="text-[14px] uppercase md:text-[18px]" style={{ ...SERIF, color: CREAM }}>Tháng {ceremony.month}</span>
                      <span className="text-[14px] uppercase md:text-[18px]" style={{ ...SERIF, color: CREAM }}>{ceremony.yearNumber}</span>
                    </div>
                  </div>
                  <div className="px-0 text-xs uppercase tracking-[0.12em] md:text-sm" style={{ ...BODY, color: CREAM_SOFT }}>{ceremony.lunar}</div>
                </div>
              ) : null}
            </div>
          </WineCard>
        </section>

        {/* ALBUM */}
        {gallery.length > 0 ? (
          <div className="relative z-10 overflow-x-clip">
            <CastleWatermark className="left-1/2 top-[-6%] w-[150%]" />
            <div className="relative z-10 flex flex-col items-center px-6 pb-10 pt-10">
              <WineHeading>Album Ảnh</WineHeading>
              <div className="relative z-10 mt-5 w-full max-w-[380px] md:max-w-[600px]">
                <AlbumGallery
                  photos={gallery}
                  layout={content.albumLayout ?? "coverflow"}
                  accent={WINE}
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* RECEPTION INFO + calendar */}
        <section className="relative z-10 mx-auto mb-4 w-[88%] max-w-[420px] md:max-w-[560px]">
          <FloatingFlower wrapClassName="-left-[16%] top-[10%] z-20 w-[32%]" duration="6s" delay="0.3s" />
          <WineCard radius="10" padding="px-5 py-9 text-center">
            <div className="relative z-10 flex flex-col items-center gap-6">
              <CreamHeading>Thông Tin Tiệc Cưới</CreamHeading>

              <div className="flex flex-col items-center gap-4 text-center md:gap-5" style={{ ...BODY, color: CREAM }}>
                <h3 className="flex flex-col items-center text-[20px] font-normal uppercase md:text-[26px]" style={{ ...BODY, color: CREAM }}>
                  Tiệc cưới sẽ diễn ra vào lúc:
                </h3>

                {reception ? (
                  <>
                    <div className="flex w-full max-w-[130px] items-center justify-between px-0 text-[13px] uppercase md:text-[15px]" style={{ ...BODY, color: CREAM_SOFT }}>
                      <span>{reception.weekday}</span>
                      <span>{banquetTime}</span>
                    </div>
                    <div className="flex items-center justify-center gap-4" style={{ ...SERIF, color: CREAM }}>
                      <span className="text-[40px] leading-none md:text-[46px]" style={{ ...SERIF, color: CREAM }}>{reception.day}</span>
                      <div className="h-[46px] w-px" style={{ backgroundColor: "rgba(236,228,216,0.45)" }} />
                      <div className="flex flex-col items-start justify-center gap-1 text-left">
                        <span className="text-[12px] uppercase md:text-[16px]" style={{ ...SERIF, color: CREAM }}>Tháng {reception.month}</span>
                        <span className="text-[18px] md:text-[24px]" style={{ ...SERIF, color: CREAM }}>{reception.yearNumber}</span>
                      </div>
                    </div>
                    <div className="px-0 text-xs uppercase tracking-[0.12em] md:text-base" style={{ ...BODY, color: CREAM_SOFT }}>{reception.lunar}</div>
                  </>
                ) : null}

                {welcomeTime || banquetTime ? (
                  <div className="mt-4 flex items-center justify-center gap-8">
                    {welcomeTime ? (
                      <div className="flex flex-col items-center">
                        <span className="text-xs uppercase tracking-wider" style={{ ...BODY, color: CREAM_SOFT }}>Đón khách</span>
                        <span className="mt-1 text-lg font-medium md:text-xl" style={{ ...BODY, color: CREAM }}>{welcomeTime}</span>
                      </div>
                    ) : null}
                    {banquetTime ? (
                      <div className="flex flex-col items-center">
                        <span className="text-xs uppercase tracking-wider" style={{ ...BODY, color: CREAM_SOFT }}>Khai tiệc</span>
                        <span className="mt-1 text-lg font-medium md:text-xl" style={{ ...BODY, color: CREAM }}>{banquetTime}</span>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {palette.showCountdown ? (
                  <div className="mt-2 flex flex-col items-center">
                    <h3 className="text-[15px] font-semibold uppercase tracking-[0.06em] md:text-[17px]" style={{ ...SERIF, color: CREAM }}>
                      Cùng đếm ngược
                    </h3>
                    <SharedCountdown
                      target={`${couple.date}T${banquetTime || "18:00"}`}
                      className="mt-2 text-center text-sm md:text-base"
                      style={{ ...BODY, color: CREAM_SOFT }}
                    />
                  </div>
                ) : null}

                {/* Lịch nằm trên miếng cream, đảo ngược tương phản so với card */}
                {calendar ? (
                  <div className="mx-auto mt-3 w-fit max-w-full overflow-hidden rounded-[10px] px-4 pb-4 pt-2" style={{ backgroundColor: CREAM }}>
                    <div className="mx-auto w-[280px] max-w-none overflow-hidden md:w-[330px]" style={{ color: WINE }}>
                      <div className="border-b py-2.5 text-center text-[25px] font-normal tracking-wide" style={{ ...NAUTIGAL, borderColor: hexToRgba(WINE, 0.27), color: WINE }}>
                        Tháng {calendar.month} / {calendar.year}
                      </div>
                      <div className="grid grid-cols-7 border-b-2" style={{ borderColor: WINE }}>
                        {WEEKDAY_LABELS.map((d) => (
                          <div key={d} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                        {calendar.cells.map((day, i) => (
                          <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                            {day ? (
                              <span
                                className={`flex h-[26px] w-[26px] items-center justify-center rounded-full text-[12px] md:text-[13px] ${day === calendar.highlight ? "font-bold" : ""}`}
                                style={day === calendar.highlight ? { backgroundColor: WINE, color: CREAM } : undefined}
                              >
                                {day}
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                <a
                  href={googleCalendarUrl(content)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center justify-center text-sm underline underline-offset-4"
                  style={{ ...SERIF, color: CREAM }}
                >
                  Thêm vào lịch
                </a>
              </div>
            </div>
          </WineCard>
        </section>

        {/* VENUE MAP */}
        {mapQuery ? (
          <div className="relative z-10 overflow-x-clip">
            <CastleWatermark className="left-1/2 top-[-1%] w-[158%]" />
            <section className="relative z-10 flex w-full flex-col items-center px-6 pb-8 pt-8">
              <div className="relative text-center">
                <h3 className="text-center font-bold uppercase" style={{ ...SERIF, color: WINE, letterSpacing: "0.03em" }}>
                  Tiệc cưới sẽ tổ chức tại
                </h3>
                <div className="mx-auto mt-2 max-w-[260px] text-center text-[12px] leading-relaxed md:max-w-[440px] md:text-[14px]" style={{ ...BODY, color: hexToRgba(WINE, 0.8) }}>
                  {venue.address}
                </div>
              </div>
              <div className="relative mt-4 flex w-full flex-col items-center gap-4 md:gap-5">
                <InvitationMap
                  query={mapQuery}
                  title={mapQuery}
                  className="h-[240px] w-full max-w-[340px] overflow-hidden rounded-[10px] md:h-[300px] md:max-w-[480px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </section>
          </div>
        ) : null}

        {/* DRESS CODE */}
        {dressColors.length > 0 ? (
          <div className="relative z-10 flex flex-col items-center gap-5 px-6 py-10 md:px-10 md:py-12">
            <div className="flex flex-col items-center gap-1">
              <WineHeading>Dress Code</WineHeading>
              <p className="whitespace-pre-line text-center text-sm md:text-base" style={{ ...SERIF, color: hexToRgba(WINE, 0.8) }}>
                Trang phục dự tiệc
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {dressColors.map((color) => (
                <div
                  key={color}
                  className="h-10 w-10 rounded-full shadow-md md:h-12 md:w-12"
                  style={{
                    backgroundColor: color,
                    border: color.toUpperCase() === CREAM.toUpperCase() ? `1.5px solid ${hexToRgba(WINE, 0.19)}` : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* SCHEDULE */}
        {schedule.length > 0 ? (
          <section className="relative z-10 mx-auto my-4 w-[88%] max-w-[420px] md:max-w-[560px]">
            <FloatingFlower wrapClassName="-right-[16%] -top-[12%] z-20 w-[30%]" duration="5.2s" delay="0.9s" />
            <WineCard radius="10" padding="px-6 py-9">
              <div className="relative z-10 flex flex-col gap-4 px-2">
                <CreamHeading>Lịch Trình Ngày Cưới</CreamHeading>
                <ol className="relative mx-auto grid w-full max-w-[460px] grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10" style={SERIF}>
                  {schedule.map((s, i) => {
                    const icon = palette.scheduleIcons?.[i] ?? SCHEDULE_ICONS[i] ?? null;
                    const isFirst = i === 0;
                    const isLast = i === schedule.length - 1;
                    return (
                      <li key={`${s.time}-${i}`} className="contents">
                        <span className="pt-0.5 text-right text-[16px] leading-snug tracking-wide tabular-nums md:text-[17px]" style={{ ...SERIF, color: CREAM }}>
                          {icon ? (
                            <span className="relative inline-block">
                              <span aria-hidden className="absolute right-full top-1/2 flex -translate-y-1/2 items-center justify-center" style={{ marginRight: 30 }}>
                                <img src={icon.startsWith("/") ? icon : `${DECOR}/${icon}.webp`} alt="" aria-hidden loading="lazy" className="block h-10 w-10 shrink-0 object-contain" />
                              </span>
                              {s.time}
                            </span>
                          ) : (
                            s.time
                          )}
                        </span>
                        <span aria-hidden className="relative flex items-center justify-center self-stretch">
                          <span
                            className={`absolute left-1/2 w-px -translate-x-1/2 ${isFirst ? "top-1/2" : "-top-8 md:-top-10"} ${isLast ? "bottom-1/2" : "-bottom-8 md:-bottom-10"}`}
                            style={{ backgroundColor: "rgba(236,228,216,0.4)" }}
                          />
                          <span className="relative block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CREAM, boxShadow: "0 0 0 2px rgba(236,228,216,0.13)" }} />
                        </span>
                        <span className="text-[13px] md:text-[15px]" style={{ ...SERIF, color: CREAM_SOFT }}>{s.label}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </WineCard>
          </section>
        ) : null}

        {/* WISHES — nằm trên tờ giấy note */}
        <div className="relative z-10 overflow-x-clip">
          {palette.noteSrc !== null ? (
            <img
              src={palette.noteSrc ?? `${THEME}/papernote-background.webp`}
              alt=""
              aria-hidden
              loading="lazy"
              className="pointer-events-none absolute left-1/2 top-[-15px] w-[120%] max-w-[650px] -translate-x-1/2 object-contain opacity-95 drop-shadow-[4px_4px_4px_rgba(0,0,0,0.25)] md:top-[-30px]"
            />
          ) : null}
          <section
            className={`relative z-10 px-6 pb-8 [&_form]:max-w-[280px] md:[&_form]:max-w-[380px] [&_textarea]:h-[56px] md:[&_textarea]:h-[110px] ${palette.noteSrc === null ? "mx-auto my-12 w-[88%] max-w-[560px] rounded-[10px] bg-white pt-9 shadow-[4px_4px_10px_rgba(0,0,0,0.2)]" : "pt-[74px] md:pt-[120px]"}`}
            style={{ ...SERIF, color: WINE }}
          >
            <div className="text-center">
              <WineHeading className="md:text-[24px]">Sổ Lưu Bút</WineHeading>
            </div>
            <SharedWishForm accent={WINE} />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                {wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-[8px] border p-4 text-sm" style={{ borderColor: hexToRgba(WINE, 0.33), backgroundColor: "rgba(255,255,255,0.55)" }}>
                    <div className="flex items-start justify-between">
                      <span className="font-semibold" style={{ color: WINE }}>{w.name}</span>
                      <span className="text-xs opacity-70">{formatWishTime(w.time)}</span>
                    </div>
                    <p className="mt-2 leading-relaxed">{w.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </div>

        {/* GIFT */}
        {banks.length > 0 ? (
          <div className="relative z-10 overflow-x-clip">
            <CastleWatermark className="left-1/2 top-[6%] w-[155%]" />
            {/* pt lớn: tờ giấy note ở khối WISHES là ảnh absolute cao ~0.91× bề
                rộng (120% khung), nên khi ít lời chúc nó tràn xuống dưới section
                đó — chừa chỗ để khối quà không bị đè. */}
            <section className="relative z-10 flex flex-col items-center px-6 pb-10 pt-28 text-center md:pt-36">
              <GiftEnvelope
                templateSlug={content.slug}
                banks={banks}
                accent={WINE}
                dark={WINE}
                cardBg={CREAM}
                heading="Hộp Quà Mừng"
                labelColor={WINE}
              />
            </section>
          </div>
        ) : null}

        {/* FOOTER — giữ trong card nhưng padding đủ lớn để tránh hoa decoration ở
            bottom[-5%], và z-10 cao hơn vân giấy (z-0). */}
        <footer data-template-footer className="relative z-10 overflow-hidden px-6 pb-12 pt-16 text-center">
          <p className="mx-auto max-w-[280px] text-[13px] leading-relaxed md:max-w-[400px] md:text-[14px]" style={{ ...SERIF, color: WINE, opacity: 0.65 }}>
            Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!
          </p>
          <a
            href="https://thiepmungonline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block text-xs opacity-40 transition-opacity hover:opacity-70"
            style={{ color: WINE }}
          >
            ♡ thiepmungonline.com
          </a>
          {palette.footerFlowerSrc ? (
            <img
              src={palette.footerFlowerSrc}
              alt=""
              aria-hidden
              loading="lazy"
              className="pointer-events-none -mb-16 mt-10 w-[170%] max-w-none -translate-x-[31%] object-contain"
            />
          ) : null}
        </footer>
        </div>
      </div>
    </MinimalismPaletteContext.Provider>
  );
}

/** Faithful rebuild of the Minimalism Đỏ Đô (minimalism-do-do) opened invitation. */
export function MinimalismDarkRedInvitation({ content }: { content: ChungDoiDemoContent }) {
  return (
    <MinimalismInvitation
      content={content}
      palette={DARK_RED_PALETTE}
      testId="minimalism-dark-red-template"
    />
  );
}

/** Jade-teal variation with the same layout and interaction contract. */
export function MinimalismJadeInvitation({ content }: { content: ChungDoiDemoContent }) {
  return (
    <MinimalismInvitation
      content={content}
      palette={JADE_PALETTE}
      testId="minimalism-jade-template"
    />
  );
}

/** Soft sky-blue variation with low saturation and cloud-white surfaces. */
export function MinimalismSkyBlueInvitation({ content }: { content: ChungDoiDemoContent }) {
  return (
    <MinimalismInvitation
      content={content}
      palette={SKY_BLUE_PALETTE}
      testId="minimalism-sky-blue-template"
    />
  );
}

/** Gentle powder-pink variation with blush florals and warm ivory surfaces. */
export function MinimalismPowderPinkInvitation({ content }: { content: ChungDoiDemoContent }) {
  return (
    <MinimalismInvitation
      content={content}
      palette={POWDER_PINK_PALETTE}
      testId="minimalism-powder-pink-template"
    />
  );
}

/** Lavender-purple source variation, rebuilt from the original demo and assets. */
export function MinimalismPurpleInvitation({ content }: { content: ChungDoiDemoContent }) {
  return (
    <MinimalismInvitation
      content={content}
      palette={PURPLE_PALETTE}
      testId="minimalism-purple-template"
    />
  );
}
