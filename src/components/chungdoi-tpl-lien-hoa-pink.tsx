"use client";

import type { ReactNode } from "react";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { invitationGiftAccounts, orderedCouple } from "@/lib/invitation-display";
import {
  AlbumGallery,
  buildCalendar,
  DressCode,
  formatDate,
  formatWishTime,
  GiftEnvelope,
  googleCalendarUrl,
  hexToRgba,
  InvitationMap,
  SharedCountdown,
  SharedWishForm,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";

const THEME = "/chungdoi/images/themes/lien-hoa-pink";
const DECOR = "/chungdoi/images/themes/_decor/lien-hoa-pink";

/** Hồng sen — heading, tên cô dâu chú rể, ngày, nút. */
const ACCENT = "#c9768e";
/** Nâu hồng trầm — nhãn, địa chỉ, chữ phụ. */
const INK = "#804b5b";
/** Nền giấy gần trắng, nhường chỗ cho lớp hoa sen mờ phía sau. */
const PAGE = "#fefefe";

/**
 * Medallion đặt bên trái mốc giờ, theo đúng thứ tự dòng của bản gốc: dòng đầu
 * (đón khách) và dòng cuối (kết thúc tiệc) không có huy hiệu.
 */
const SCHEDULE_MEDALLIONS = [null, "medallion-guest", "medallion-alcohol", "medallion-opening", null] as const;

/**
 * Màu sáng cần viền tóc để không biến thành khoảng trắng trên nền giấy. Bản gốc
 * viền ô kem `#f6ecd9` nhưng để trần hai ô đỏ, nên ngưỡng đo theo độ sáng cảm
 * nhận thay vì so đúng chuỗi `#ffffff`.
 */
function needsSwatchBorder(color: string) {
  const clean = color.replace("#", "");
  const value = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (value.length !== 6) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  if ([r, g, b].some(Number.isNaN)) return false;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.82;
}

function LotusHeading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={`text-center text-[20px] font-semibold uppercase tracking-[0.04em] md:text-[24px]${className ? ` ${className}` : ""}`}
      style={{ color: ACCENT }}
    >
      {children}
    </h2>
  );
}

function ParentColumn({ title, a, b, addr }: { title: string; a: string; b: string; addr: string }) {
  return (
    <div className="row-span-4 grid min-w-0 grid-rows-subgrid justify-items-center">
      <span className="mb-1 text-[12px] md:text-[14px]" style={{ color: INK }}>{title}</span>
      <span className="text-[12px] font-medium [overflow-wrap:anywhere]" style={{ color: ACCENT }}>{a}</span>
      <span className="text-[12px] font-medium [overflow-wrap:anywhere]" style={{ color: ACCENT }}>{b}</span>
      <div className="mt-1 flex flex-col whitespace-pre-line text-[11px] leading-snug md:text-[12px]" style={{ color: INK }}>{addr}</div>
    </div>
  );
}

/** Dựng lại mẫu Liên Hoa - Hồng (lien-hoa-hong) đã mở thiệp. */
export function LienHoaPinkInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const banquetTime = venue.banquetTime || couple.time;
  const welcomeTime = venue.welcomeTime || schedule[0]?.time || "";
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
    label: `${account.side === "groom" ? "Chú Rể" : "Cô Dâu"} - ${account.name}`,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div
        data-testid="lien-hoa-pink-template"
        className="font-body-serif relative isolate mx-auto w-full max-w-[480px] overflow-visible md:max-w-[900px] md:overflow-hidden md:border"
        style={{ color: INK, backgroundColor: PAGE, borderColor: `${ACCENT}33` }}
      >
        {/* Hoa sen màu nước lặp mờ dưới toàn bộ trang, ô 300px như bản gốc */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-20 opacity-[0.07]"
          style={{
            backgroundImage: `url(${THEME}/hoa-sen-bg.webp)`,
            backgroundSize: "300px",
            backgroundRepeat: "repeat",
          }}
        />

        {/* HERO — khung vàng dọc 1500×2100 ôm tên đôi, hai nhánh sen tràn ra lề.
            Hai nhánh ở z-30 (trên khung z-20) nên cánh hoa nằm đè lên viền vàng,
            đúng như bản gốc. */}
        <section className="relative isolate w-full pb-[10px] pt-[56px] md:pb-[24px] md:pt-[80px]">
          <img
            src={`${DECOR}/flower3.webp`}
            alt=""
            aria-hidden
            className="pointer-events-none absolute bottom-[300px] left-[-30px] z-30 h-auto w-[55%] max-w-none -translate-x-[26%] rotate-[15deg] object-contain md:top-[-10px] md:w-[35%]"
          />
          <img
            src={`${DECOR}/flower2.webp`}
            alt=""
            aria-hidden
            className="pointer-events-none absolute bottom-[-70px] right-[-30px] z-30 h-auto w-[56%] max-w-none translate-x-[26%] rotate-[-25deg] object-contain md:bottom-[20px] md:w-[40%]"
          />
          <div className="relative z-20 mx-auto aspect-[1500/2100] w-[92%] max-w-[420px] md:max-w-[540px]">
            <img
              src={`${THEME}/framegold1.webp`}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 z-0 h-full w-full object-contain"
            />
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center" style={{ color: ACCENT }}>
              <p className="absolute left-1/2 top-[19%] -translate-x-1/2 whitespace-pre text-[13px] font-medium uppercase tracking-[0.16em] md:text-[17px]">
                The Wedding Of
              </p>
              <div className="flex w-full justify-center">
                <span data-invitation-short-name className="font-couple-viaoda whitespace-nowrap text-[58px] leading-[1.05]">{people[0].shortName}</span>
              </div>
              <span className="font-art-beau-rivage my-1 text-[36px] leading-none md:my-2">&amp;</span>
              <div className="flex w-full justify-center">
                <span data-invitation-short-name className="font-couple-viaoda whitespace-nowrap text-[58px] leading-[1.05]">{people[1].shortName}</span>
              </div>
            </div>
          </div>
        </section>

        {/* THÔNG TIN LỄ CƯỚI + ALBUM — khung vàng ngang framegold2 làm mái cho
            khối này, hai nhánh sen lật ngang trôi ở hai lề. */}
        <section className="relative isolate z-10 mt-[72px] px-[12px] pb-[16px] pt-[36px] md:mt-[110px] md:px-[24px] md:pb-[24px] md:pt-[56px]">
          <img
            src={`${THEME}/framegold2.webp`}
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[-45px] z-0 h-auto w-[92%] max-w-[420px] -translate-x-1/2 object-contain opacity-95 md:top-[-55px] md:max-w-[540px]"
          />
          <img
            src={`${DECOR}/flower4.webp`}
            alt=""
            aria-hidden
            loading="lazy"
            className="pointer-events-none absolute left-[-100px] top-[260px] z-0 h-auto w-[70%] max-w-none -translate-x-[32%] -scale-x-100 object-contain md:left-[-200px] md:top-[320px] md:w-[60%]"
          />
          <img
            src={`${DECOR}/flower4.webp`}
            alt=""
            aria-hidden
            loading="lazy"
            className="pointer-events-none absolute right-[-100px] top-[650px] z-0 h-auto w-[70%] max-w-none translate-x-[32%] -scale-x-100 object-contain md:right-[-200px] md:top-[780px] md:w-[60%]"
          />

          <div className="relative z-10 flex flex-col gap-8 md:gap-10">
            <LotusHeading>Thông Tin Lễ Cưới</LotusHeading>

            {/* grid-rows-subgrid: chức danh / tên bố / tên mẹ / địa chỉ của hai
                nhà luôn nằm đúng hàng của nhau dù tên bên nào dài hơn. */}
            <div className="mx-auto grid w-full max-w-[360px] grid-cols-[1fr_auto_1fr] grid-rows-[repeat(4,auto)] justify-center gap-x-3.5 gap-y-[3px] text-center md:max-w-[540px] md:gap-x-5">
              {couple.brideFirst ? brideCol : groomCol}
              <div className="row-span-4 h-[50px] w-[1px] self-center opacity-50 md:h-[70px]" style={{ backgroundColor: ACCENT }} />
              {couple.brideFirst ? groomCol : brideCol}
            </div>

            <div
              className="relative mx-auto flex flex-col gap-1 whitespace-pre-line text-center text-[14px] md:max-w-[560px] md:text-[17px]"
              style={{ color: ACCENT }}
            >
              {couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI"}
            </div>

            <div className="relative w-full">
              <div className="relative z-10 flex flex-col gap-8 md:gap-10">
                <div className="relative flex w-full min-w-0 flex-col items-center gap-3 text-center md:gap-4">
                  <h3 className="font-art-beau-rivage flex min-h-[80px] w-[80%] items-center justify-center whitespace-nowrap text-[43px] leading-[48px] md:leading-[64px]" style={{ color: ACCENT }}>
                    {people[0].fullName}
                  </h3>
                  <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: INK }}>{people[0].birthOrder}</div>
                  <div className="font-art-beau-rivage text-[32px] md:text-[42px]" style={{ color: ACCENT }}>&amp;</div>
                  <h3 className="font-art-beau-rivage flex min-h-[80px] w-[80%] items-center justify-center whitespace-nowrap text-[43px] leading-[48px] md:leading-[64px]" style={{ color: ACCENT }}>
                    {people[1].fullName}
                  </h3>
                  <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: INK }}>{people[1].birthOrder}</div>
                </div>

                {ceremony ? (
                  <div className="relative flex flex-col items-center gap-4 text-center md:gap-5">
                    <div className="flex flex-col items-center gap-2" style={{ color: INK }}>
                      {couple.ceremonyHeader ? (
                        <span className="whitespace-pre-line text-center text-[16px] font-normal md:text-[18px]">{couple.ceremonyHeader}</span>
                      ) : null}
                      <p className="mb-2 text-[16px] font-normal uppercase md:text-[18px]">Vào lúc</p>
                    </div>
                    {couple.ceremonyTime ? (
                      <div className="text-[20px] md:text-[30px]" style={{ color: ACCENT }}>{couple.ceremonyTime}</div>
                    ) : null}
                    <div className="flex items-center gap-6" style={{ color: ACCENT }}>
                      <span className="text-[12px] uppercase md:text-[16px]">{ceremony.weekday}</span>
                      <span className="flex items-center justify-center text-[20px] leading-none opacity-50 md:text-[28px]" style={{ color: INK }}>|</span>
                      <span className="text-[28px] md:text-[36px]">{ceremony.day}</span>
                      <span className="flex items-center justify-center text-[20px] leading-none opacity-50 md:text-[28px]" style={{ color: INK }}>|</span>
                      <span className="text-[12px] uppercase md:text-[16px]">Tháng {ceremony.month}</span>
                    </div>
                    <div className="text-[18px] md:text-[24px]" style={{ color: ACCENT }}>{ceremony.yearNumber}</div>
                    <div className="text-xs uppercase tracking-[0.12em] md:text-sm" style={{ color: INK }}>{ceremony.lunar}</div>
                  </div>
                ) : null}
              </div>
            </div>

            {gallery.length > 0 ? (
              <div className="relative w-full">
                <div className="relative z-10 flex flex-col items-center pt-[24px] md:pt-[40px]">
                  <LotusHeading className="mb-6">Album Ảnh</LotusHeading>
                  <div className="mt-6 w-full max-w-[432px] md:max-w-[600px]">
                    <AlbumGallery photos={gallery} layout={content.albumLayout ?? "coverflow"} accent={INK} />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* THÔNG TIN TIỆC CƯỚI — hai chiếc lá sen nghiêng ±12° kẹp hai lề */}
        <section className="relative isolate z-10 flex w-full flex-col items-center px-[12px] pt-[24px] md:px-[24px] md:pt-[36px]">
          <img
            src={`${DECOR}/leaf.webp`}
            alt=""
            aria-hidden
            loading="lazy"
            className="pointer-events-none absolute left-0 top-[20px] z-0 h-auto w-[36%] max-w-none -translate-x-[34%] rotate-[12deg] object-contain opacity-90 md:top-[280px] md:w-[27%]"
          />
          <img
            src={`${DECOR}/leaf.webp`}
            alt=""
            aria-hidden
            loading="lazy"
            className="pointer-events-none absolute right-0 top-[200px] z-0 h-auto w-[36%] max-w-none translate-x-[34%] rotate-[-12deg] object-contain opacity-90 md:top-[480px] md:w-[27%]"
          />

          <div className="relative z-10 flex w-full flex-col items-center">
            <LotusHeading>Thông Tin Tiệc Cưới</LotusHeading>

            <div className="relative z-10 mt-6 flex flex-col items-center text-center md:mt-8">
              <h3 className="flex flex-col items-center text-[16px] font-semibold uppercase tracking-[0.06em] md:text-[18px]" style={{ color: ACCENT }}>
                Tiệc cưới sẽ diễn ra vào lúc:
              </h3>
              <div className="mt-2 text-[20px] font-medium md:text-[24px]" style={{ color: INK }}>{banquetTime}</div>

              {reception ? (
                <>
                  <div className="mt-3 flex items-center justify-center gap-4 md:gap-6" style={{ color: INK }}>
                    <span className="text-[13px] uppercase md:text-[15px]">{reception.weekday}</span>
                    <div className="h-6 w-[1px] md:h-8" style={{ backgroundColor: INK }} />
                    <span className="text-[30px] md:text-[38px]" style={{ color: ACCENT }}>{reception.day}</span>
                    <div className="h-6 w-[1px] md:h-8" style={{ backgroundColor: INK }} />
                    <span className="text-[13px] uppercase md:text-[15px]">Tháng {reception.month}</span>
                  </div>
                  <div className="mt-2 text-[18px] font-semibold md:text-[20px]" style={{ color: ACCENT }}>{reception.yearNumber}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.12em] md:text-sm" style={{ color: ACCENT }}>{reception.lunar}</div>
                </>
              ) : null}

              {welcomeTime || banquetTime ? (
                <div className="mt-4 flex items-center justify-center gap-8">
                  {welcomeTime ? (
                    <div className="flex flex-col items-center">
                      <span className="text-xs uppercase tracking-wider" style={{ color: INK }}>Đón khách</span>
                      <span className="mt-1 text-lg font-medium md:text-xl" style={{ color: ACCENT }}>{welcomeTime}</span>
                    </div>
                  ) : null}
                  {banquetTime ? (
                    <div className="flex flex-col items-center">
                      <span className="text-xs uppercase tracking-wider" style={{ color: INK }}>Khai tiệc</span>
                      <span className="mt-1 text-lg font-medium md:text-xl" style={{ color: ACCENT }}>{banquetTime}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-4 flex flex-col items-center justify-center">
                <h2 className="flex flex-col items-center text-[15px] font-semibold uppercase tracking-[0.06em] md:text-[17px]" style={{ color: ACCENT }}>
                  Cùng đếm ngược
                </h2>
                <SharedCountdown
                  target={`${couple.date}T${banquetTime || "18:00"}`}
                  className="mt-2 text-center text-sm md:text-lg"
                  style={{ color: ACCENT }}
                />
              </div>

              {/* LỊCH — khung vàng calendar-frame rộng hơn bảng lịch 86px nên nó
                  bao ra ngoài như một tấm khay, ngày cưới đánh dấu bằng trái tim. */}
              {calendar ? (
                <div className="relative mx-auto mt-8 w-full max-w-[300px] px-6 py-6 md:mt-10 md:max-w-[380px] md:px-8 md:py-8">
                  <img
                    src={`${THEME}/calendar-frame.webp`}
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-auto w-[calc(100%+86px)] max-w-none -translate-x-1/2 -translate-y-1/2"
                  />
                  <div className="relative z-[1]">
                    <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-lg md:max-w-[310px]" style={{ color: INK }}>
                      <div className="border-b py-2.5 text-center text-[13px] font-semibold tracking-wide md:text-[14px]" style={{ borderColor: hexToRgba(ACCENT, 0.27) }}>
                        Tháng {calendar.month} / {calendar.year}
                      </div>
                      <div className="grid grid-cols-7 border-b-2" style={{ borderColor: ACCENT }}>
                        {WEEKDAY_LABELS.map((d) => (
                          <div key={d} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                        {calendar.cells.map((day, i) => (
                          <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                            {day === calendar.highlight ? (
                              <div className="relative flex h-[24px] w-[26px] items-center justify-center md:h-[28px] md:w-[30px]">
                                <svg viewBox="0 0 24 22" className="absolute inset-0 h-full w-full drop-shadow-sm" fill={ACCENT} aria-hidden>
                                  <path d="M12 21C12 21 1.5 13.5 1.5 7.5C1.5 4.46 3.96 2 7 2C8.76 2 10.35 2.81 11.4 4.09L12 4.8L12.6 4.09C13.65 2.81 15.24 2 17 2C20.04 2 22.5 4.46 22.5 7.5C22.5 13.5 12 21 12 21Z" />
                                </svg>
                                <span className="relative z-10 text-[11px] font-bold text-white md:text-[12px]">{day}</span>
                              </div>
                            ) : day ? (
                              <span className="text-[12px] md:text-[13px]">{day}</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <a
                href={googleCalendarUrl(content)}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center justify-center text-sm tracking-wider underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70"
                style={{ color: ACCENT }}
              >
                Thêm vào lịch
              </a>
            </div>
          </div>
        </section>

        {/* ĐỊA ĐIỂM + BẢN ĐỒ, đóng khối bằng dải hoa văn vàng */}
        <div className="relative pt-8 md:pt-10">
          {mapQuery ? (
            <section className="relative flex flex-col gap-6 px-6 pb-12 md:gap-8 md:px-10 md:pb-16">
              <div className="relative text-center">
                <LotusHeading>Tiệc cưới sẽ tổ chức tại</LotusHeading>
                <div className="mx-auto mt-3 flex max-w-sm flex-col items-center whitespace-pre-line pb-3 text-center text-sm tracking-wide md:max-w-[500px] md:text-base" style={{ color: INK }}>
                  {venue.address}
                </div>
              </div>
              <div className="relative flex w-full flex-col items-center gap-4 md:gap-5">
                <InvitationMap
                  query={mapQuery}
                  title={mapQuery}
                  className="h-[280px] w-full max-w-[338px] overflow-hidden rounded-2xl md:h-[380px] md:max-w-[560px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </section>
          ) : null}
          <div className="mt-2 flex justify-center">
            <img
              src={`${THEME}/golden-line.webp`}
              alt=""
              aria-hidden
              loading="lazy"
              className="h-[120px] w-auto object-contain opacity-95"
            />
          </div>
        </div>

        {/* DRESS CODE */}
        {dressColors.length > 0 ? (
          <div className="relative z-10 flex flex-col items-center gap-5 px-6 py-10 md:px-10 md:py-12">
            <DressCode
              colors={dressColors.map((color) => ({
                color,
                border: needsSwatchBorder(color) ? hexToRgba(ACCENT, 0.19) : undefined,
              }))}
              heading={<LotusHeading>Dress Code</LotusHeading>}
              subColor={ACCENT}
            />
          </div>
        ) : null}

        {/* LỊCH TRÌNH — ray dọc ở giữa, huy hiệu sen nằm bên trái mốc giờ */}
        {schedule.length > 0 ? (
          <div className="relative">
            <img
              src={`${DECOR}/flower2.webp`}
              alt=""
              aria-hidden
              loading="lazy"
              className="pointer-events-none absolute right-0 top-[-120px] z-0 h-auto w-[34%] max-w-none translate-x-[28%] rotate-[-12deg] object-contain md:top-[-50px] md:w-[26%]"
            />
            <div className="relative z-10 mb-10 mt-10 flex flex-col gap-6 px-4 md:mb-12 md:mt-12 md:gap-8">
              <LotusHeading>Lịch Trình Ngày Cưới</LotusHeading>
              <ol className="relative mx-auto grid w-full max-w-[460px] grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10">
                {schedule.map((item, i) => {
                  const medallion = SCHEDULE_MEDALLIONS[i] ?? null;
                  const isFirst = i === 0;
                  const isLast = i === schedule.length - 1;
                  return (
                    <li key={`${item.time}-${i}`} className="contents">
                      <span className="pt-0.5 text-right text-[16px] leading-snug tracking-wide tabular-nums md:text-[17px]" style={{ color: INK }}>
                        {medallion ? (
                          <span className="relative inline-block">
                            <span aria-hidden className="absolute right-full top-1/2 mr-[44px] flex -translate-y-1/2 items-center justify-center">
                              <img src={`${DECOR}/${medallion}.webp`} alt="" aria-hidden loading="lazy" className="h-[52px] w-[52px] max-w-none object-contain" />
                            </span>
                            {item.time}
                          </span>
                        ) : (
                          item.time
                        )}
                      </span>
                      <span aria-hidden className="relative flex items-center justify-center self-stretch">
                        <span
                          className={`absolute left-1/2 w-px -translate-x-1/2 ${isFirst ? "top-1/2" : "-top-8 md:-top-10"} ${isLast ? "bottom-1/2" : "-bottom-8 md:-bottom-10"}`}
                          style={{ backgroundColor: hexToRgba(INK, 0.4) }}
                        />
                        <span
                          className="relative block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: INK, boxShadow: `0 0 0 2px ${hexToRgba(INK, 0.13)}` }}
                        />
                      </span>
                      <span className="pt-0.5 text-start text-[17px] font-medium leading-snug md:text-[19px]" style={{ color: INK }}>
                        {item.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        ) : null}

        {/* SỔ LƯU BÚT */}
        <section className="relative z-10 flex flex-col items-center px-6 pb-8 pt-10 md:px-10 md:pb-10 md:pt-12">
          <div className="text-center">
            <LotusHeading className="mb-6">Sổ lưu bút</LotusHeading>
          </div>
          {/* Bản gốc bọc ô nhập lời chúc trong một thẻ viền hồng bo 16px. Bọc ở
              đây thay vì sửa SharedWishForm để ~40 mẫu khác giữ nguyên giao diện. */}
          {/* pt-0: SharedWishForm tự mang mt-6, cộng thêm pt-6 của thẻ sẽ thành
              48px đệm trên, lệch hẳn so với p-6 của bản gốc. */}
          <div className="mx-auto mt-6 w-full max-w-full rounded-2xl border px-6 pb-6 pt-0 md:max-w-[600px]" style={{ borderColor: hexToRgba(ACCENT, 0.25) }}>
            <SharedWishForm accent={ACCENT} />
          </div>
          {wishes.length > 0 ? (
            <div className="chungdoi-scroll touch-pan-y mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
              {wishes.map((w, i) => (
                <div key={`${w.name}-${i}`} className="rounded-xl border p-4 text-sm" style={{ borderColor: hexToRgba(ACCENT, 0.25) }}>
                  <div className="flex items-start justify-between">
                    <span className="font-semibold" style={{ color: ACCENT }}>{w.name}</span>
                    <span className="text-xs opacity-70">{formatWishTime(w.time)}</span>
                  </div>
                  <p className="mt-2 leading-relaxed">{w.text}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {/* HỘP QUÀ MỪNG */}
        {banks.length > 0 ? (
          <div className="relative z-10 flex flex-col items-center justify-center px-6 py-8 pb-6 md:px-10 md:pb-8">
            <GiftEnvelope
              templateSlug={content.slug}
              banks={banks}
              accent={ACCENT}
              dark={ACCENT}
              cardBg="#fffafc"
              heading="Hộp Quà Mừng"
              labelColor={INK}
            />
          </div>
        ) : null}

        {/* FOOTER — framegold2 lật dọc làm khung chữ ký, nhánh sen đáy tràn ra
            ngoài đáy thiệp bằng margin âm. */}
        <footer data-template-footer className="relative z-20 flex flex-col items-center overflow-hidden pt-4 text-center">
          <div className="flex w-full flex-col items-center px-6 md:px-10">
            <span className="relative z-20 mx-auto flex flex-col items-center gap-1 whitespace-pre-line text-sm md:max-w-[560px]" style={{ color: ACCENT }}>
              Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!
            </span>
            <div className="relative mt-4 w-[96%] max-w-[440px] md:mt-6 md:max-w-[560px]">
              <img
                src={`${THEME}/framegold2.webp`}
                alt=""
                aria-hidden
                loading="lazy"
                className="pointer-events-none h-[150px] w-full -scale-y-100 object-cover object-top opacity-95 md:h-[180px]"
              />
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <a
                  href="https://thiepmungonline.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs opacity-50 transition-opacity hover:opacity-70"
                  style={{ color: ACCENT }}
                >
                  ♡ thiepmungonline.com
                </a>
              </div>
            </div>
          </div>
          <img
            src={`${DECOR}/flower-bottom.webp`}
            alt=""
            aria-hidden
            loading="lazy"
            className="pointer-events-none -mb-[150px] mt-6 h-auto w-[112%] max-w-none object-contain md:-mb-[300px] md:mt-8 md:w-[102%]"
          />
        </footer>
      </div>
    </div>
  );
}
