"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { invitationGiftAccounts, orderedCouple } from "@/lib/invitation-display";
import {
  AlbumGallery,
  buildCalendar,
  formatDate,
  formatWishTime,
  googleCalendarUrl,
  hexToRgba,
  InvitationMap,
  GiftEnvelope,
  SharedCountdown,
  SharedWishForm,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";

const PINK_BASE = "/chungdoi/images/themes/_decor/glass-garden-pink";
const BG = "/chungdoi/images/themes/glass-garden-pink/floral-background.webp";

/** Rose accent — headings, names, times. */
const ROSE = "#CB5D6C";
/** Deep wine — labels, addresses, secondary copy. */
const WINE = "#933845";

const NAME_FONT = { fontFamily: '"Viaoda Libre", "EB Garamond", cursive' };
const HERO_AMP_FONT = { fontFamily: '"Alex Brush", "The Nautigal", cursive' };
const AMP_FONT = { fontFamily: '"UNI Chu truyen thong", "Times New Roman", serif' };
const BODY_FONT = { fontFamily: '"Baskerville", "Libre Baskerville", "Times New Roman", serif' };
const HEADING_FONT = { fontFamily: '"Times New Roman", Times, serif' };
const ORDER_FONT = { fontFamily: '"Cormorant Garamond", "Times New Roman", serif' };

/** Schedule medallions, in the row order the source template uses. */
const SCHEDULE_ICONS = [null, "coming", "cake", "water", null] as const;

function PinkHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-center text-[20px] font-bold uppercase md:text-[26px]"
      style={{ ...HEADING_FONT, color: ROSE }}
    >
      {children}
    </h2>
  );
}

function ParentColumn({ title, a, b, addr }: { title: string; a: string; b: string; addr: string }) {
  return (
    <div className="row-span-4 grid min-w-0 max-w-[180px] grid-rows-subgrid justify-items-center text-center md:max-w-[280px]">
      <span className="text-[12px] md:text-[14px]" style={{ color: WINE }}>{title}</span>
      <span className="text-[12px] font-semibold [overflow-wrap:anywhere]" style={{ ...BODY_FONT, color: ROSE }}>{a}</span>
      <span className="text-[12px] font-semibold [overflow-wrap:anywhere]" style={{ ...BODY_FONT, color: ROSE }}>{b}</span>
      <div className="mt-1 flex flex-col whitespace-pre-line text-[10px] leading-snug md:text-[12px]" style={{ color: WINE }}>{addr}</div>
    </div>
  );
}

/** Faithful rebuild of the Glass Garden Pink (vuonkinh-hong) opened invitation. */
export function GlassGardenPinkInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const banquetTime = venue.banquetTime || couple.time;
  const welcomeTime = couple.ceremonyTime || banquetTime;
  const dressColors = (content.dressCodeColors ?? "")
    .split(",")
    .map((color) => color.trim())
    .filter(Boolean);

  const groomCol = (
    <ParentColumn
      title={families.groomParentTitle || "Ông Bà"}
      a={families.groomFather}
      b={families.groomMother}
      addr={families.groomAddress}
    />
  );
  const brideCol = (
    <ParentColumn
      title={families.brideParentTitle || "Ông Bà"}
      a={families.brideFather}
      b={families.brideMother}
      addr={families.brideAddress}
    />
  );

  const banks = invitationGiftAccounts(content).map((account) => ({
    label: `${account.birthOrder} - ${account.name}`,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div
        data-testid="glass-garden-pink-template"
        className="relative isolate mx-auto w-full max-w-[480px] overflow-visible md:max-w-[900px] md:overflow-hidden md:border"
        style={{
          color: WINE,
          borderColor: `${ROSE}22`,
          backgroundColor: "#ffffff",
          backgroundImage: `linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url(${BG})`,
          backgroundRepeat: "repeat",
          backgroundSize: "180% auto",
          backgroundPosition: "top left",
        }}
      >
        {/* HERO — translucent oval capsule floating over gold-veined pink leaves.
            KHÔNG đặt z-index lên section này: hai chiếc lá trong hero cao 647px,
            tràn xuống quá mép trên của tấm kính. Để section ở z-auto thì phần
            tràn đó nằm DƯỚI tấm kính (z-10) nên bị blur + phủ mờ, chữ "Thông tin
            lễ cưới" đọc được. Nâng section lên z-20 là lá phủ lên trên chữ. */}
        <section className="relative isolate flex w-full flex-col items-center pb-[110px] pt-16 md:pb-[150px] md:pt-[88px]">
          <div className="relative w-[62%] max-w-[250px] md:w-[43.4%] md:max-w-none">
            <img src={`${PINK_BASE}/leaf1-bloom.webp`} alt="" aria-hidden className="pointer-events-none absolute left-[-82%] top-[-52%] z-0 h-auto w-[166%] max-w-none rotate-180 object-contain opacity-90" />
            <img src={`${PINK_BASE}/leaf1-bloom.webp`} alt="" aria-hidden className="pointer-events-none absolute left-[14%] top-[35%] z-0 h-auto w-[166%] max-w-none object-contain opacity-90" />
            <div
              className="relative z-20 flex aspect-[239/368] w-full flex-col items-center justify-center gap-3 rounded-[500px] px-2 text-center md:gap-4"
              style={{
                color: ROSE,
                backgroundColor: "rgba(255, 255, 255, 0.16)",
                backdropFilter: "blur(7px) saturate(1.08)",
                WebkitBackdropFilter: "blur(7px) saturate(1.08)",
                border: "1px solid rgba(255, 255, 255, 0.35)",
                boxShadow:
                  "inset 1.5px 1.5px 2px rgba(255,255,255,0.45), inset -1.5px -1.5px 3px rgba(180,120,130,0.12), 0 18px 50px -6px rgba(147,56,69,0.3), 0 6px 20px 2px rgba(147,56,69,0.14)",
              }}
            >
              <span data-invitation-short-name className="w-full text-[clamp(26px,7.7vw,40px)] leading-none" style={NAME_FONT}>{people[0].shortName}</span>
              <span className="text-[clamp(19px,5.4vw,28px)] leading-none opacity-90" style={HERO_AMP_FONT}>&amp;</span>
              <span data-invitation-short-name className="w-full text-[clamp(26px,7.7vw,40px)] leading-none" style={NAME_FONT}>{people[1].shortName}</span>
            </div>
            <img src={`${PINK_BASE}/flower1-decoration.webp`} alt="" aria-hidden className="pointer-events-none absolute bottom-[60px] left-[calc(50%-57px)] z-30 h-auto w-[77%] max-w-none -translate-x-1/2 translate-y-[46%] rotate-[-36deg] object-contain md:bottom-[15.6%] md:left-[27.2%]" />
          </div>
        </section>

        <div className="relative isolate mx-[24px] md:mx-[26px]">
          {/* Ambient blooms drifting down the page margins, alternating leaf and flower */}
          <img src={`${PINK_BASE}/flower2-decoration.webp`} alt="" aria-hidden loading="lazy" className="pointer-events-none absolute right-[-125px] top-[calc(-2%+150px)] z-0 h-auto w-[280px] max-w-none rotate-[-25deg] object-contain md:right-[-190px] md:w-[520px]" />
          <img src={`${PINK_BASE}/leaf1-bloom.webp`} alt="" aria-hidden loading="lazy" className="pointer-events-none absolute left-[-125px] top-[calc(-2%+330px)] z-0 h-auto w-[280px] max-w-none -scale-x-100 -scale-y-100 rotate-[-25deg] object-contain md:left-[-190px] md:top-[calc(-2%+510px)] md:w-[520px] lg:top-[calc(-2%+600px)]" />
          <img src={`${PINK_BASE}/leaf1-bloom.webp`} alt="" aria-hidden loading="lazy" className="pointer-events-none absolute right-[-125px] top-[1180px] z-0 h-auto w-[280px] max-w-none rotate-[-25deg] object-contain md:right-[-190px] md:top-[1560px] md:w-[520px]" />
          <img src={`${PINK_BASE}/flower2-decoration.webp`} alt="" aria-hidden loading="lazy" className="pointer-events-none absolute left-[-155px] top-[1780px] z-0 h-auto w-[280px] max-w-none -scale-y-100 rotate-[-25deg] object-contain md:left-[-246px] md:top-[2104px] md:w-[520px]" />
          <img src={`${PINK_BASE}/flower2-decoration.webp`} alt="" aria-hidden loading="lazy" className="pointer-events-none absolute right-[-125px] top-[2600px] z-0 h-auto w-[280px] max-w-none rotate-[-25deg] object-contain md:right-[-190px] md:top-[3200px] md:w-[520px]" />
          <img src={`${PINK_BASE}/leaf1-bloom.webp`} alt="" aria-hidden loading="lazy" className="pointer-events-none absolute left-[-125px] top-[3420px] z-0 h-auto w-[280px] max-w-none -scale-x-100 -scale-y-100 rotate-[-25deg] object-contain md:left-[-190px] md:top-[4050px] md:w-[520px]" />
          <img src={`${PINK_BASE}/flower4-decoration.webp`} alt="" aria-hidden loading="lazy" className="pointer-events-none absolute -left-[32px] -top-[30px] z-20 h-auto w-[44%] max-w-[210px] object-contain md:-left-[49px] md:-top-[58px] md:max-w-[244px]" />

          {/* One continuous glass surface holding every section below the hero */}
          <div
            data-glass-garden-surface
            className="relative z-10 flex flex-col items-center gap-[20px] rounded-t-[30px] pb-[42%] pt-[30px] md:gap-[28px] md:pt-[40px]"
            style={{
              backgroundColor: "rgba(239, 192, 189, 0.1)",
              backdropFilter: "blur(7px) saturate(1.08)",
              WebkitBackdropFilter: "blur(7px) saturate(1.08)",
              border: "1px solid rgba(255, 255, 255, 0.35)",
              boxShadow:
                "inset 1.5px 1.5px 2px rgba(255,255,255,0.45), inset -1.5px -1.5px 3px rgba(180,120,130,0.12), 0 18px 50px -6px rgba(147,56,69,0.3), 0 6px 20px 2px rgba(147,56,69,0.14)",
            }}
          >
            {/* CEREMONY INFO */}
            <section className="relative isolate w-full px-[16px] md:px-[32px]">
              {/* z-0, KHÔNG z-20: hoa là lớp nền nên phải nằm dưới nội dung z-10.
                  Ở z-20 nó phủ lên dòng ceremonyHeader ("LỄ THÀNH HÔN...") vì hoa
                  bản md rộng 300px, tràn từ mép phải vào giữa cột chữ. */}
              <img src={`${PINK_BASE}/flower2-decoration.webp`} alt="" aria-hidden loading="lazy" className="pointer-events-none absolute bottom-[-52px] right-[-40px] z-0 h-auto w-[96px] max-w-none rotate-[-36deg] object-contain md:bottom-[27px] md:right-[-35px] md:w-[300px]" />
              <div className="relative z-10 flex flex-col items-center gap-5 md:gap-7">
                <PinkHeading>Thông Tin Lễ Cưới</PinkHeading>

                <div className="grid w-full grid-cols-[1fr_auto_1fr] grid-rows-[repeat(4,auto)] justify-center gap-x-3 gap-y-1 md:gap-x-8" style={{ ...BODY_FONT, color: ROSE }}>
                  {couple.brideFirst ? brideCol : groomCol}
                  <div className="row-span-4 h-[60px] w-px self-center md:h-[80px]" style={{ backgroundColor: WINE, opacity: 0.5 }} />
                  {couple.brideFirst ? groomCol : brideCol}
                </div>

                <div className="relative mx-auto flex flex-col gap-1 whitespace-pre-line text-center text-[15px] md:max-w-[560px] md:text-[17px]" style={{ ...BODY_FONT, color: ROSE }}>
                  {couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI"}
                </div>

                <div className="relative flex w-full min-w-0 flex-col items-center gap-3 text-center md:gap-4">
                  {/* Dùng BODY_FONT thay FULLNAME_FONT cho khớp tên ba mẹ. Mẫu này tự
                      khai BODY_FONT cho khối hai họ nên xoá trắng sẽ rơi về font mặc
                      định của app và vẫn lệch. Bỏ whitespace-nowrap và hạ cỡ vì
                      Baskerville rộng hơn Garamond, tên 4 từ sẽ tràn ngang. */}
                  <h3 className="font-couple-garamond flex min-h-[80px] w-[80%] items-center justify-center text-[30px] leading-[1.15] md:text-[40px]" style={{ color: ROSE }}>{people[0].fullName}</h3>
                  <div className="text-[10px] uppercase tracking-[0.1em]" style={{ ...ORDER_FONT, color: WINE }}>{people[0].birthOrder}</div>
                  <div className="text-[30px] leading-none md:text-[40px]" style={{ ...AMP_FONT, color: ROSE }}>&amp;</div>
                  <h3 className="font-couple-garamond flex min-h-[80px] w-[80%] items-center justify-center text-[30px] leading-[1.15] md:text-[40px]" style={{ color: ROSE }}>{people[1].fullName}</h3>
                  <div className="text-[10px] uppercase tracking-[0.1em]" style={{ ...ORDER_FONT, color: WINE }}>{people[1].birthOrder}</div>
                </div>

                {ceremony ? (
                  <div className="relative flex w-full flex-col items-center">
                    <div className="relative flex flex-col items-center gap-4 text-center md:gap-5" style={BODY_FONT}>
                      <div className="flex flex-col items-center gap-2" style={{ color: WINE }}>
                        {couple.ceremonyHeader ? (
                          <span className="whitespace-pre-line text-center text-[16px] font-normal md:text-[18px]">{couple.ceremonyHeader}</span>
                        ) : null}
                        <p className="mb-2 text-[16px] font-normal uppercase md:text-[18px]">Vào lúc</p>
                      </div>
                      {couple.ceremonyTime ? (
                        <div className="text-[20px] md:text-[30px]" style={{ color: ROSE }}>{couple.ceremonyTime}</div>
                      ) : null}
                      <div className="flex items-center gap-6" style={{ color: ROSE }}>
                        <span className="text-right text-[12px] uppercase md:text-[16px]">{ceremony.weekday}</span>
                        <span className="flex items-center justify-center text-[20px] leading-none md:text-[28px]" style={{ color: WINE, opacity: 0.5 }}>|</span>
                        <span className="text-[30px] md:text-[40px]">{ceremony.day}</span>
                        <span className="flex items-center justify-center text-[20px] leading-none md:text-[28px]" style={{ color: WINE, opacity: 0.5 }}>|</span>
                        <span className="text-left text-[12px] uppercase md:text-[16px]">Tháng {ceremony.month}</span>
                      </div>
                      <div className="text-[18px] md:text-[24px]" style={{ color: ROSE }}>{ceremony.yearNumber}</div>
                      {/* Không bọc ngoặc: formatVietnameseLunarDate() trả về chuỗi
                          trần "Tức ngày ... âm lịch", các template render nguyên văn. */}
                      <div className="text-[clamp(8px,2.5vw,9px)] uppercase tracking-[0.14em] md:text-sm md:tracking-[0.25em]" style={{ color: WINE }}>{ceremony.lunar}</div>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            {/* ALBUM — 3D coverflow */}
            {gallery.length > 0 ? (
              <section className="relative isolate w-full px-[16px] md:px-[32px]">
                <div className="relative z-10 flex w-full flex-col items-center">
                  <div className="mb-5">
                    <PinkHeading>Album Ảnh Cưới</PinkHeading>
                  </div>
                  <div className="mx-auto mt-6 w-full max-w-[432px] overflow-hidden px-2 md:max-w-[800px]">
                    <AlbumGallery
                      photos={gallery}
                      layout={content.albumLayout ?? "coverflow"}
                      accent={ROSE}
                    />
                  </div>
                </div>
              </section>
            ) : null}

            {/* RECEPTION INFO + countdown + calendar */}
            <section className="relative isolate w-full px-[16px] md:px-[32px]">
              {/* cùng lý do như hoa ở khối Thông Tin Lễ Cưới: nền thì phải ở z-0 */}
              <img src={`${PINK_BASE}/flower2-decoration.webp`} alt="" aria-hidden loading="lazy" className="pointer-events-none absolute left-[-30px] top-[206px] z-0 h-auto w-[110px] max-w-none -scale-x-100 rotate-[64deg] object-contain md:left-[-50px] md:top-[170px] md:w-[300px]" />
              <div className="relative z-10 flex w-full flex-col items-center">
                <PinkHeading>Thông Tin Tiệc Cưới</PinkHeading>

                <div className="flex flex-col items-center gap-4 text-center md:gap-5" style={{ ...BODY_FONT, color: WINE }}>
                  <h3 className="mt-4 flex flex-col items-center text-[15px] font-semibold uppercase tracking-[0.04em] md:text-[18px]" style={{ color: ROSE }}>
                    Tiệc cưới sẽ diễn ra vào lúc:
                  </h3>
                  <div className="text-[20px] md:text-[30px]" style={{ color: ROSE }}>{banquetTime}</div>

                  {reception ? (
                    <>
                      <div className="flex items-center gap-6">
                        <span className="text-right text-[12px] uppercase md:text-[16px]">{reception.weekday}</span>
                        <div className="h-6 w-px md:h-8" style={{ backgroundColor: WINE, opacity: 0.6 }} />
                        <span className="text-[30px] md:text-[40px]" style={{ color: ROSE }}>{reception.day}</span>
                        <div className="h-6 w-px md:h-8" style={{ backgroundColor: WINE, opacity: 0.6 }} />
                        <span className="text-left text-[12px] uppercase md:text-[16px]">Tháng {reception.month}</span>
                      </div>
                      <div className="text-[18px] md:text-[24px]">{reception.yearNumber}</div>
                      <div className="text-[clamp(8px,2.5vw,9px)] uppercase tracking-[0.14em] md:text-base md:tracking-[0.25em]">{reception.lunar}</div>
                    </>
                  ) : null}

                  {/* Source template shows a welcome/banquet time pair; our schema has no
                      separate welcome field, so the ceremony time stands in for it. */}
                  {welcomeTime || banquetTime ? (
                    <div className="mt-4 flex items-center justify-center gap-8">
                      {welcomeTime ? (
                        <div className="flex flex-col items-center">
                          <span className="text-xs uppercase tracking-wider">Đón khách</span>
                          <span className="mt-1 text-lg font-medium md:text-xl" style={{ color: ROSE }}>{welcomeTime}</span>
                        </div>
                      ) : null}
                      {banquetTime ? (
                        <div className="flex flex-col items-center">
                          <span className="text-xs uppercase tracking-wider">Khai tiệc</span>
                          <span className="mt-1 text-lg font-medium md:text-xl" style={{ color: ROSE }}>{banquetTime}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-col items-center justify-center">
                    <h2 className="flex flex-col items-center text-[15px] font-semibold uppercase tracking-[0.04em] md:text-[18px]" style={{ ...BODY_FONT, color: ROSE }}>
                      Cùng đếm ngược
                    </h2>
                    <SharedCountdown
                      target={`${couple.date}T${banquetTime || "18:00"}`}
                      className="mt-2 text-center text-sm md:text-lg"
                      style={{ color: WINE }}
                    />
                  </div>
                </div>

                {/* Calendar — rounded wine frame, heart marking the wedding day */}
                {calendar ? (
                  <div className="relative mx-auto mt-8 w-full max-w-[330px] rounded-[28px] border px-5 py-5 md:mt-10 md:max-w-[400px] md:px-7 md:py-7" style={{ borderColor: WINE }}>
                    <div className="mx-auto w-full overflow-hidden" style={{ color: ROSE }}>
                      <div className="border-b py-2.5 text-center text-[13px] font-semibold tracking-wide md:text-[14px]" style={{ borderColor: hexToRgba(ROSE, 0.27) }}>
                        Tháng {calendar.month} / {calendar.year}
                      </div>
                      <div className="grid grid-cols-7 border-b-2" style={{ borderColor: ROSE }}>
                        {WEEKDAY_LABELS.map((d) => (
                          <div key={d} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                        {calendar.cells.map((day, i) => (
                          <div key={i} className="relative flex h-[30px] items-center justify-center md:h-[34px]">
                            {day === calendar.highlight ? (
                              <img src={`${PINK_BASE}/calendar-heart.webp`} alt="" aria-hidden className="absolute inset-0 h-full w-full object-contain" />
                            ) : null}
                            {day ? (
                              <span className={`relative text-[12px] md:text-[13px] ${day === calendar.highlight ? "font-bold text-white" : ""}`}>{day}</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 flex justify-center">
                  <a
                    href={googleCalendarUrl(content)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center text-sm underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70"
                    style={{ ...HEADING_FONT, color: WINE }}
                  >
                    Thêm vào lịch
                  </a>
                </div>
              </div>
            </section>

            {/* VENUE MAP */}
            {mapQuery ? (
              <section className="relative isolate flex w-full flex-col items-center gap-3 px-6 pb-2 md:gap-4 md:px-10">
                <h3 className="text-center text-[20px] font-bold uppercase md:text-[26px]" style={{ ...HEADING_FONT, color: ROSE }}>
                  Tiệc cưới sẽ tổ chức tại
                </h3>
                <div className="mx-auto flex max-w-sm flex-col items-center whitespace-pre-line text-center text-[12px] md:max-w-[420px] md:text-sm" style={{ ...BODY_FONT, color: WINE }}>
                  {venue.address}
                </div>
                <InvitationMap
                  query={mapQuery}
                  title={mapQuery}
                  className="mt-2 h-[240px] w-full max-w-[340px] overflow-hidden rounded-[15px] md:h-[300px] md:max-w-[480px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </section>
            ) : null}

            {/* DRESS CODE */}
            {dressColors.length > 0 ? (
              <div className="relative isolate w-full">
                <img src={`${PINK_BASE}/flower2-decoration.webp`} alt="" aria-hidden loading="lazy" className="pointer-events-none absolute left-[-45px] top-[-52px] z-0 h-auto w-[110px] max-w-none -scale-x-100 rotate-[64deg] object-contain md:left-[-80px] md:top-[-127px] md:w-[300px]" />
                <div className="relative z-10 flex flex-col items-center gap-5 px-6 py-10 md:px-10 md:py-12">
                  <PinkHeading>Dress Code</PinkHeading>
                  <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                    {dressColors.map((color) => (
                      <div
                        key={color}
                        className="h-10 w-10 rounded-full shadow-md md:h-12 md:w-12"
                        style={{
                          backgroundColor: color,
                          border: color.toUpperCase() === "#FFFFFF" ? `1.5px solid ${hexToRgba(ROSE, 0.19)}` : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* SCHEDULE — centre rail timeline with medallions beside the times */}
            {schedule.length > 0 ? (
              <div className="relative isolate w-full">
                <div className="relative z-10 mb-2 mt-2 flex flex-col gap-5 px-4 md:gap-7">
                  <PinkHeading>Lịch Trình Ngày Cưới</PinkHeading>
                  <ol className="relative mx-auto grid w-full max-w-[460px] grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10" style={HEADING_FONT}>
                    {schedule.map((s, i) => {
                      const icon = SCHEDULE_ICONS[i] ?? null;
                      const isFirst = i === 0;
                      const isLast = i === schedule.length - 1;
                      return (
                        <li key={`${s.time}-${i}`} className="contents">
                          <span className="pt-0.5 text-right text-[16px] leading-snug tracking-wide tabular-nums md:text-[17px]" style={{ ...HEADING_FONT, color: ROSE }}>
                            {icon ? (
                              <span className="relative inline-block">
                                <span aria-hidden className="absolute right-full top-1/2 flex -translate-y-1/2 items-center justify-center" style={{ marginRight: 20 }}>
                                  <img src={`${PINK_BASE}/${icon}.webp`} alt="" aria-hidden loading="lazy" className="block h-10 w-9 shrink-0 object-contain" />
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
                              style={{ backgroundColor: hexToRgba(ROSE, 0.4) }}
                            />
                            <span
                              className="relative block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: ROSE, boxShadow: `0 0 0 2px ${hexToRgba(ROSE, 0.13)}` }}
                            />
                          </span>
                          <span className="pt-0.5 text-left text-[17px] font-medium leading-snug md:text-[19px]" style={{ ...HEADING_FONT, color: WINE }}>
                            {s.label}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            ) : null}

            {/* WISHES */}
            <section className="relative z-10 w-full px-6 pb-2 pt-2 md:px-10" style={{ ...BODY_FONT, color: WINE }}>
              <div className="text-center">
                <PinkHeading>Sổ Lưu Bút</PinkHeading>
              </div>
              <SharedWishForm accent={ROSE} />
              {wishes.length > 0 ? (
                <div className="chungdoi-scroll touch-pan-y mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                  {wishes.map((w, i) => (
                    <div key={`${w.name}-${i}`} className="rounded-xl border p-4 text-sm" style={{ borderColor: hexToRgba(ROSE, 0.35), backgroundColor: "rgba(255,255,255,0.8)" }}>
                      <div className="flex items-start justify-between">
                        <span className="font-semibold" style={{ color: ROSE }}>{w.name}</span>
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
              <div className="relative isolate w-full">
                <img src={`${PINK_BASE}/flower2-decoration.webp`} alt="" aria-hidden loading="lazy" className="pointer-events-none absolute right-[-40px] top-[-153px] z-0 h-auto w-[96px] max-w-none rotate-[-36deg] object-contain md:right-[-35px] md:top-[-200px] md:w-[300px]" />
                <section className="relative z-10 w-full px-6 pb-2 pt-2 text-center md:px-10">
                  <GiftEnvelope
                    templateSlug={content.slug}
                    banks={banks}
                    accent={ROSE}
                    dark={WINE}
                    cardBg="#fdf6f8"
                    heading="Hộp Quà Mừng"
                    labelColor={ROSE}
                  />
                </section>
              </div>
            ) : null}

            {/* FOOTER — part of the same continuous glass surface */}
            <footer data-template-footer className="relative z-20 flex flex-col items-center px-6 text-center md:px-10">
              <span className="mx-auto flex flex-col items-center gap-1 whitespace-pre-line text-sm md:max-w-[560px] md:text-base" style={{ ...BODY_FONT, color: ROSE }}>
                Cảm ơn quý khách đã dành thời gian đến chung vui cùng gia đình chúng tôi. Kính chúc mọi người thật nhiều sức khỏe và hạnh phúc!
              </span>
              <a
                href="https://thiepmungonline.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-xs opacity-50 transition-opacity hover:opacity-70 md:mt-6"
                style={{ color: ROSE }}
              >
                ♡ thiepmungonline.com
              </a>
            </footer>

            <img src={`${PINK_BASE}/flower5-bottom.webp`} alt="" aria-hidden loading="lazy" className="pointer-events-none absolute bottom-0 left-1/2 z-[5] h-auto w-[150%] max-w-none -translate-x-1/2 translate-y-1/2 object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
}
