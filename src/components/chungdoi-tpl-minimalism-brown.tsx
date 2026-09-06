"use client";

import type { ReactNode } from "react";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { invitationCeremonies, invitationGiftAccounts, invitationHeroImage, orderedCouple } from "@/lib/invitation-display";
import {
  buildCalendar,
  formatDate,
  formatWishTime,
  GiftEnvelope,
  googleCalendarUrl,
  hexToRgba,
  InvitationMap,
  Lightbox,
  SharedWishForm,
  useLightbox,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";

const THEME = "/chungdoi/images/themes/minimalism-brown";

/** Nâu đất — chữ chính, heading, viền, nút, nền lịch tháng. */
const INK = "#7c6a60";
/** Nâu nhạt — chữ phụ, giờ tiệc, đốm sáng hộp quà. */
const MUTED = "#918077";
/** Nâu xám — tên ngắn ở hero và dòng "The Wedding Of". */
const HERO_INK = "#827771";
/** Kem hồng — nền toàn trang. */
const PAGE = "#fff7f3";
/** Kem đậm hơn — nền ba thẻ giấy. */
const CARD = "#f6eadd";
/** Trắng ngà — chữ trên nền nâu (lịch tháng, nút RSVP, nút gửi lời chúc). */
const ON_DARK = "#ded9d7";

/**
 * Bản gốc khai 6 font stack chứ không theo hệ 2 font của repo
 * (xem src/lib/invitation-fonts.ts). Giữ đúng 6 stack và đặt thành class ở
 * `globals.css` để renderer không phải khai `fontFamily` inline. Bộ
 * `.font-mg-*` dùng chung với mẫu Minimalism Xanh; chỉ `.font-mg-msmadi` là
 * của riêng mẫu này (đúng một ký tự "&" giữa hai tên đầy đủ).
 */
const F_CORMORANT = "font-mg-cormorant";
const F_NAUTIGAL = "font-mg-nautigal";
const F_TIMES = "font-mg-times";
const F_BASKERVILLE = "font-mg-baskerville";
const F_GARAMOND = "font-mg-garamond";
const F_MSMADI = "font-mg-msmadi";
/** Bản gốc để lớp phủ "+N" của album rơi về stack sans mặc định. */
const F_SANS = "font-mg-sans";

/**
 * Icon bên trái mốc giờ, theo đúng thứ tự dòng của bản gốc: dòng đầu (đón khách)
 * và dòng cuối (kết thúc tiệc) không có icon.
 */
const SCHEDULE_ICONS = [null, "gate", "cake", "water"] as const;

/**
 * Nhánh hoa / lá bồng bềnh. Bản gốc đặt `animation` inline với 6 cặp thời
 * lượng + độ trễ khác nhau để chúng lệch pha, keyframe `mbFloat` chỉ lo phần
 * trôi dọc; xoay và lật nằm ở thẻ `<img>` con.
 */
function FloatingSprig({
  src,
  wrapperClassName,
  imageClassName = "",
  duration,
  delay,
}: {
  src: string;
  wrapperClassName: string;
  imageClassName?: string;
  duration: number;
  delay: number;
}) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute block ${wrapperClassName}`}
      style={{
        animation: `mbFloat ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        willChange: "transform",
      }}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        className={`block w-full max-w-none object-contain drop-shadow-[4px_4px_2px_rgba(0,0,0,0.25)] ${imageClassName}`}
      />
    </span>
  );
}

/** Nét lá / mái nhà mờ nằm sau nội dung, không bồng bềnh. */
function Wash({ src, className }: { src: string; className: string }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      className={`pointer-events-none absolute max-w-none object-contain ${className}`}
    />
  );
}

/**
 * Heading section: Times New Roman 20px, bold, uppercase.
 *
 * `tracking` là giá trị TUYỆT ĐỐI vì bản gốc có hai biến thể: phần lớn heading
 * khai `font-size:20px` ngay trên thẻ nên `0.03em` ra **0.6px**, còn hai heading
 * "THÔNG TIN …" để thẻ ở 16px rồi mới bọc `<span class="text-[20px]">` bên
 * trong, nên letter-spacing thừa hưởng đã tính xong là **0.48px**.
 */
function BrownHeading({
  children,
  color = INK,
  className,
  tracking = "0.6px",
}: {
  children: ReactNode;
  color?: string;
  className?: string;
  tracking?: string;
}) {
  return (
    <h2
      className={`${F_TIMES} text-center text-[20px] font-bold uppercase${className ? ` ${className}` : ""}`}
      style={{ color, letterSpacing: tracking }}
    >
      {children}
    </h2>
  );
}

/** Thẻ giấy kem: nền phẳng + ảnh giấy nhàu tô multiply, đúng như bản gốc. */
function PaperCard({
  radius,
  className,
  children,
}: {
  radius: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden shadow-[4px_4px_8px_rgba(0,0,0,0.18)] ${radius} ${className}`}>
      <div aria-hidden className={`absolute inset-0 ${radius}`} style={{ backgroundColor: CARD }} />
      <img
        src={`${THEME}/paper.webp`}
        alt=""
        aria-hidden
        loading="lazy"
        className={`pointer-events-none absolute inset-0 size-full max-w-none object-cover opacity-50 mix-blend-multiply ${radius}`}
      />
      {children}
    </div>
  );
}

/** Một cột "Ông Bà + tên bố + tên mẹ + địa chỉ", mượn lưới hàng của khung cha. */
function ParentColumn({ title, a, b, addr }: { title: string; a: string; b: string; addr: string }) {
  return (
    <div className="row-span-4 grid min-w-0 grid-rows-subgrid justify-items-center">
      <span className="text-[12px]" style={{ color: MUTED }}>{title}</span>
      <span className="text-[12px] font-semibold [overflow-wrap:anywhere]" style={{ color: INK }}>{a}</span>
      <span className="text-[12px] font-semibold [overflow-wrap:anywhere]" style={{ color: INK }}>{b}</span>
      <div
        className="mt-1 flex w-full flex-col whitespace-pre-line text-[10px] leading-tight"
        style={{ color: MUTED }}
      >
        {addr}
      </div>
    </div>
  );
}

/** Dựng lại mẫu Minimalism Nâu (minimalism-nau) đã mở thiệp. */
export function MinimalismBrownInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const ceremonies = invitationCeremonies(content);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const banquetTime = venue.banquetTime || couple.time;
  const welcomeTime = venue.welcomeTime;
  const heroPhoto = invitationHeroImage(content);
  const { lightbox, setLightbox } = useLightbox(gallery.length);
  const albumTiles = gallery.slice(0, 4);
  const albumExtra = Math.max(0, gallery.length - 4);
  const dressColors = (content.dressCodeColors ?? "")
    .split(",")
    .map((color) => color.trim())
    .filter(Boolean);

  const banks = invitationGiftAccounts(content).map((account) => ({
    label: account.name,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));

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

  const dateStrip = (date: NonNullable<typeof reception>, dividerAsRule: boolean) => (
    <>
      <div className="flex items-center gap-6" style={{ color: INK }}>
        <span
          className={`${dividerAsRule ? F_TIMES : F_BASKERVILLE} text-right text-[12px] uppercase md:text-[16px]`}
        >
          {date.weekday}
        </span>
        {dividerAsRule ? (
          <div className="h-6 w-[2px]" style={{ backgroundColor: INK }} />
        ) : (
          <span
            className={`${F_BASKERVILLE} flex items-center justify-center text-[24px] leading-none`}
            style={{ color: `${INK}66` }}
          >
            |
          </span>
        )}
        {/* `day` chứ không phải `dayNumber`: bản gốc đệm 0 ("03"). */}
        <span className={`${F_BASKERVILLE} text-[30px] md:text-[40px]`}>{date.day}</span>
        {dividerAsRule ? (
          <div className="h-6 w-[2px]" style={{ backgroundColor: INK }} />
        ) : (
          <span
            className={`${F_BASKERVILLE} flex items-center justify-center text-[24px] leading-none`}
            style={{ color: `${INK}66` }}
          >
            |
          </span>
        )}
        <span
          className={`${dividerAsRule ? F_TIMES : F_BASKERVILLE} text-left text-[12px] uppercase md:text-[16px]`}
        >
          Tháng {date.month}
        </span>
      </div>
      <div
        className={`${dividerAsRule ? F_TIMES : F_BASKERVILLE} text-[18px] md:text-[24px]`}
        style={{ color: INK }}
      >
        {date.yearNumber}
      </div>
      <div
        className={`${F_BASKERVILLE} text-xs uppercase tracking-[0.25em] ${dividerAsRule ? "md:text-base" : "md:text-sm"}`}
        style={{ color: MUTED }}
      >
        {date.lunar}
      </div>
    </>
  );

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div
        data-testid="minimalism-brown-template"
        className={`${F_TIMES} relative isolate w-full max-w-[480px] overflow-hidden md:mx-auto md:max-w-[900px] md:border`}
        // fontWeight 300: bản gốc đặt `font-weight:300` ở `body` nên mọi chữ không
        // tự khai weight đều là 300. Times New Roman / Baskerville không có face
        // Light nên trông y hệt 400, nhưng giữ cho computed style khớp bản gốc.
        style={{ backgroundColor: PAGE, color: INK, borderColor: `${INK}22`, fontWeight: 300 }}
      >
        {/* Giấy nhàu phủ toàn trang, trải theo bề ngang */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${THEME}/paper.webp)`,
            backgroundSize: "100% auto",
            backgroundPosition: "top center",
            mixBlendMode: "multiply",
            opacity: 0.4,
          }}
        />

        {/* ── HERO ────────────────────────────────────────────────────────────
            "The Wedding Of" → tên ngắn kèm "&" viết tay → ảnh cưới lồng trong
            khung gỗ, nhánh hoa bồng bềnh ở góc dưới trái. */}
        <header className="relative z-10 flex flex-col items-center px-4 pb-20 pt-12 text-center md:pb-32">
          <Wash src={`${THEME}/leaf-background.webp`} className="left-[-24%] top-[2%] w-[52%] opacity-[0.12]" />
          <Wash
            src={`${THEME}/house-background.webp`}
            className="left-1/2 top-[30%] w-[130%] -translate-x-1/2 opacity-[0.08] mix-blend-multiply"
          />

          <p
            className={`${F_CORMORANT} relative z-10 whitespace-pre-line text-[13px] font-semibold uppercase md:text-[16px]`}
            style={{ color: HERO_INK, letterSpacing: "0.16em" }}
          >
            The Wedding Of
          </p>

          <div className="relative z-10 mt-3 flex items-center justify-center gap-2 md:mt-4 md:gap-3">
            <span data-invitation-short-name className="text-[clamp(30px,8.4vw,37px)] italic md:text-[46px]" style={{ color: HERO_INK }}>
              {people[0].shortName}
            </span>
            <span className={`${F_NAUTIGAL} text-[42px] leading-none md:text-[54px]`} style={{ color: MUTED }}>
              &amp;
            </span>
            <span data-invitation-short-name className="text-[clamp(30px,8.4vw,37px)] italic md:text-[46px]" style={{ color: HERO_INK }}>
              {people[1].shortName}
            </span>
          </div>

          {/* Khung gỗ chồng lên ảnh: ảnh nghiêng -4.78° nằm dưới (z10), khung
              frame-avatar phủ kín khít viền (z20), nhánh hoa ra ngoài mép (z30). */}
          <div className="relative z-10 mt-6 aspect-[1094/1554] w-[88%] max-w-[400px] md:mt-8 md:max-w-[520px]">
            {heroPhoto ? (
              <div className="absolute left-[11.5%] top-[8%] z-10 h-[77%] w-[72%] rotate-[-4.78deg] overflow-hidden bg-white">
                <img src={heroPhoto} alt="" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <img
              src={`${THEME}/frame-avatar.webp`}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20 size-full max-w-none drop-shadow-[4px_4px_4px_rgba(0,0,0,0.2)]"
            />
            <FloatingSprig
              src={`${THEME}/flower2-decoration.webp`}
              wrapperClassName="bottom-[-6%] left-[-5%] z-30 w-[34%]"
              duration={5}
              delay={0}
            />
          </div>
        </header>

        {/* ── THÔNG TIN LỄ CƯỚI ─────────────────────────────────────────────── */}
        <section className="relative z-10 mx-auto w-[88%] max-w-[420px] md:max-w-[560px]">
          <FloatingSprig
            src={`${THEME}/flower2-decoration.webp`}
            wrapperClassName="bottom-[-6%] right-[-17%] z-20 w-[32%]"
            imageClassName="-scale-x-100"
            duration={5.5}
            delay={0.6}
          />
          <FloatingSprig
            src={`${THEME}/leaf-background.webp`}
            wrapperClassName="left-[-16%] top-[33%] z-20 w-[28%]"
            imageClassName="rotate-[10.57deg]"
            duration={6}
            delay={0.3}
          />

          <PaperCard radius="rounded-[13px]" className="px-5 pb-10 pt-9 text-center">
            <div className="relative z-10 flex flex-col items-center gap-6">
              <BrownHeading tracking="0.48px">THÔNG TIN LỄ CƯỚI</BrownHeading>

              <div
                className={`${F_BASKERVILLE} relative grid grid-cols-[1fr_auto_1fr] grid-rows-[repeat(4,auto)] justify-center gap-x-3.5 gap-y-[3px] text-center`}
                style={{ color: INK }}
              >
                {couple.brideFirst ? brideCol : groomCol}
                <div className="row-span-4 h-[50px] w-[1px] shrink-0 self-center" style={{ backgroundColor: `${INK}55` }} />
                {couple.brideFirst ? groomCol : brideCol}
              </div>

              {couple.openingMessage ? (
                <div
                  className={`${F_BASKERVILLE} relative mx-auto flex flex-col gap-1 whitespace-pre-line text-center text-[12px] md:max-w-[560px] md:text-[13px]`}
                  style={{ color: INK }}
                >
                  {couple.openingMessage}
                </div>
              ) : null}

              <div className="relative flex w-full min-w-0 flex-col items-center gap-3 text-center md:gap-4">
                {/* font-normal: bản gốc cho h3 weight 400 chứ không thừa hưởng 300 của body. */}
                <h3
                  className={`${F_GARAMOND} flex min-h-[80px] w-[80%] items-center justify-center whitespace-nowrap text-[32px] font-normal leading-[52px] md:leading-[60px]`}
                  style={{ color: INK }}
                >
                  {people[0].fullName}
                </h3>
                <div
                  className={`${F_CORMORANT} text-[10px] uppercase`}
                  style={{ color: MUTED, letterSpacing: "0.14em" }}
                >
                  {people[0].birthOrder}
                </div>
                <div className={`${F_MSMADI} text-[35px]`} style={{ color: INK }}>&amp;</div>
                <h3
                  className={`${F_GARAMOND} flex min-h-[80px] w-[80%] items-center justify-center whitespace-nowrap text-[32px] font-normal leading-[52px] md:leading-[60px]`}
                  style={{ color: INK }}
                >
                  {people[1].fullName}
                </h3>
                <div
                  className={`${F_CORMORANT} text-[10px] uppercase`}
                  style={{ color: MUTED, letterSpacing: "0.14em" }}
                >
                  {people[1].birthOrder}
                </div>
              </div>

              <div data-template-ceremonies data-minimalism-brown-ceremonies className={`${F_BASKERVILLE} relative flex flex-col items-center gap-8 text-center md:gap-10`}>
                {ceremonies.map((ceremony, index) => {
                  const ceremonyDate = formatDate(ceremony.date);
                  return (
                    <div data-template-ceremony-item key={`${ceremony.title}-${ceremony.date}-${ceremony.time}-${index}`} className="flex flex-col items-center gap-4 md:gap-5">
                      <div className="flex flex-col items-center gap-2" style={{ color: MUTED }}>
                        <span className="whitespace-pre-line text-center text-[16px] font-normal md:text-[18px]">
                          {ceremony.title}
                        </span>
                        <p className="mb-2 text-[16px] font-normal uppercase md:text-[18px]">VÀO LÚC</p>
                      </div>
                      <div className="text-[20px] md:text-[30px]" style={{ color: INK }}>{ceremony.time}</div>
                      {ceremonyDate ? dateStrip(ceremonyDate, false) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </PaperCard>
        </section>

        {/* ── ALBUM — lưới 2×2, ô thứ 4 phủ đen kèm "+N" ─────────────────────── */}
        {gallery.length > 0 ? (
          <div className="relative z-10 overflow-x-clip">
            <Wash
              src={`${THEME}/leaf-background.webp`}
              className="right-[-18%] top-[-6%] -z-0 w-[46%] rotate-[38deg] opacity-[0.1]"
            />
            <div className="relative z-10 flex flex-col items-center px-6 pb-10 pt-10">
              <BrownHeading className="relative z-10">Album Ảnh</BrownHeading>
              <div className="relative z-10 mt-5 w-full max-w-[380px] md:max-w-[600px]">
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  {albumTiles.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setLightbox(i)}
                      className="group relative aspect-square cursor-pointer overflow-hidden"
                      style={{ backgroundColor: hexToRgba(INK, 0.05) }}
                    >
                      <img
                        src={src}
                        alt={`Ảnh cưới ${i + 1}`}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                      />
                      {i === albumTiles.length - 1 && albumExtra > 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                          <span className={`${F_SANS} text-lg font-semibold text-white`}>+{albumExtra}</span>
                        </div>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
              <Lightbox gallery={gallery} index={lightbox} setIndex={setLightbox} accent={INK} />
            </div>
          </div>
        ) : null}

        {/* ── THÔNG TIN TIỆC CƯỚI ─────────────────────────────────────────────
            Giờ tiệc, cặp "Đón khách / Khai tiệc", lịch tháng nền nâu và RSVP. */}
        <section className="relative z-10 mx-auto mb-4 w-[88%] max-w-[420px] md:max-w-[560px]">
          <FloatingSprig
            src={`${THEME}/leaf-background.webp`}
            wrapperClassName="right-[-16%] top-[15%] z-20 w-[28%]"
            imageClassName="-scale-y-100 rotate-[169.43deg]"
            duration={5.5}
            delay={0.9}
          />
          <FloatingSprig
            src={`${THEME}/flower2-decoration.webp`}
            wrapperClassName="bottom-[-6%] left-[-21%] z-20 w-[32%]"
            duration={6}
            delay={0.2}
          />

          <PaperCard radius="rounded-[10px]" className="px-5 py-9 text-center">
            <div className="relative z-10 flex flex-col items-center gap-6">
              <BrownHeading tracking="0.48px">THÔNG TIN TIỆC CƯỚI</BrownHeading>

              <div className={`${F_BASKERVILLE} flex flex-col items-center gap-4 text-center md:gap-5`} style={{ color: INK }}>
                <h3 className="flex flex-col items-center text-[20px] font-normal uppercase md:text-[26px]" style={{ color: INK }}>
                  Tiệc cưới sẽ diễn ra vào lúc:
                </h3>
                <div className="text-[20px] md:text-[30px]" style={{ color: MUTED }}>{banquetTime}</div>

                {reception ? dateStrip(reception, true) : null}

                <div className="mt-4 flex items-center justify-center gap-8">
                  {welcomeTime ? (
                    <div className="flex flex-col items-center">
                      <span className="text-xs uppercase tracking-wider" style={{ color: MUTED }}>Đón khách</span>
                      <span className="mt-1 text-lg font-medium md:text-xl" style={{ color: INK }}>{welcomeTime}</span>
                    </div>
                  ) : null}
                  <div className="flex flex-col items-center">
                    <span className="text-xs uppercase tracking-wider" style={{ color: MUTED }}>Khai tiệc</span>
                    <span className="mt-1 text-lg font-medium md:text-xl" style={{ color: INK }}>{banquetTime}</span>
                  </div>
                </div>

                {/* LỊCH THÁNG — nền nâu, ngày cưới là một trái tim trắng ngà */}
                {calendar ? (
                  <div
                    className="mx-auto mt-3 w-fit max-w-full overflow-hidden rounded-[10px] px-4 pb-4 pt-2"
                    style={{ backgroundColor: INK }}
                  >
                    <div
                      className={`${F_BASKERVILLE} mx-auto w-[280px] overflow-hidden rounded-lg md:w-[330px]`}
                      style={{ color: ON_DARK }}
                    >
                      <div
                        className={`${F_NAUTIGAL} border-b py-2.5 text-center text-[24px] font-normal tracking-wide`}
                        style={{ borderColor: hexToRgba(ON_DARK, 0.27) }}
                      >
                        Tháng {calendar.month} / {calendar.year}
                      </div>
                      <div className="grid grid-cols-7 border-b-2" style={{ borderColor: ON_DARK }}>
                        {WEEKDAY_LABELS.map((day) => (
                          <div key={day} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{day}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                        {calendar.cells.map((day, i) => (
                          <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                            {day === calendar.highlight ? (
                              <div className="relative flex h-[24px] w-[26px] items-center justify-center md:h-[28px] md:w-[30px]">
                                <svg viewBox="0 0 24 22" className="absolute inset-0 h-full w-full drop-shadow-sm" fill={ON_DARK} aria-hidden>
                                  <path d="M12 21C12 21 1.5 13.5 1.5 7.5C1.5 4.46 3.96 2 7 2C8.76 2 10.35 2.81 11.4 4.09L12 4.8L12.6 4.09C13.65 2.81 15.24 2 17 2C20.04 2 22.5 4.46 22.5 7.5C22.5 13.5 12 21 12 21Z" />
                                </svg>
                                <span className="relative z-10 text-[11px] font-bold md:text-[12px]" style={{ color: "#333" }}>{day}</span>
                              </div>
                            ) : day ? (
                              <span className="text-[12px] md:text-[13px]">{day}</span>
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
                  className={`${F_TIMES} mt-3 inline-flex items-center justify-center text-sm underline underline-offset-4`}
                  style={{ color: INK }}
                >
                  Thêm vào lịch
                </a>
              </div>

              {/* Mở hộp thoại RSVP nổi có sẵn của trang thiệp thay vì dựng form thứ hai. */}
              <div className="relative z-10 mt-1 flex w-full flex-col items-center justify-center">
                <button
                  type="button"
                  onClick={() => document.querySelector<HTMLButtonElement>('[data-testid="public-rsvp-trigger"]')?.click()}
                  className={`${F_BASKERVILLE} inline-flex items-center justify-center rounded-full px-6 py-2 text-sm tracking-wide transition-transform hover:scale-[1.03]`}
                  style={{ backgroundColor: INK, color: ON_DARK }}
                >
                  XÁC NHẬN THAM DỰ
                </button>
              </div>
            </div>
          </PaperCard>
        </section>

        {/* ── ĐỊA ĐIỂM + BẢN ĐỒ ──────────────────────────────────────────────── */}
        <div className="relative z-10 overflow-x-clip">
          <Wash
            src={`${THEME}/house-background.webp`}
            className="left-1/2 top-[-10%] w-[135%] -translate-x-1/2 opacity-[0.08] mix-blend-multiply"
          />
          <section className="relative z-10 flex w-full flex-col items-center px-6 pb-8 pt-8">
            <div className="relative text-center">
              <h3
                className={`${F_TIMES} text-center text-[16px] font-bold uppercase`}
                style={{ color: INK, letterSpacing: "0.48px" }}
              >
                Tiệc cưới sẽ tổ chức tại
              </h3>
              <div
                className={`${F_BASKERVILLE} mx-auto mt-2 max-w-[280px] whitespace-pre-line text-center text-[12px] leading-relaxed md:max-w-[440px] md:text-[14px]`}
                style={{ color: MUTED }}
              >
                {venue.address}
              </div>
            </div>
            {mapQuery ? (
              <div className="relative flex w-full flex-col items-center gap-4 md:gap-5">
                <InvitationMap
                  query={mapQuery}
                  title={mapQuery}
                  className="mt-3 h-[268px] w-full max-w-[338px] overflow-hidden rounded-[15px] md:h-[380px] md:max-w-[560px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : null}
          </section>
        </div>

        {/* ── DRESS CODE — 4 ô tròn, chỉ ô kem nhạt nhất thêm viền tóc ────────── */}
        {dressColors.length > 0 ? (
          <div className="relative z-10 flex flex-col items-center gap-5 px-6 py-10 md:px-10 md:py-12">
            <div className="flex flex-col items-center gap-1">
              <BrownHeading>DRESS CODE</BrownHeading>
              <p className={`${F_TIMES} whitespace-pre-line text-center text-sm md:text-base`} style={{ color: MUTED }}>
                Trang phục dự tiệc
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {dressColors.map((color, i) => (
                <div
                  key={`${color}-${i}`}
                  className="h-10 w-10 rounded-full shadow-md md:h-12 md:w-12"
                  style={{
                    backgroundColor: color,
                    border: needsSwatchBorder(color) ? `1.5px solid ${INK}30` : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* ── LỊCH TRÌNH — thẻ giấy, ray dọc giữa, icon bên trái giờ ──────────── */}
        {schedule.length > 0 ? (
          <section className="relative z-10 mx-auto my-4 w-[88%] max-w-[420px] md:max-w-[560px]">
            <FloatingSprig
              src={`${THEME}/flower2-decoration.webp`}
              wrapperClassName="right-[-17%] top-[-13%] z-20 w-[27%]"
              imageClassName="-scale-x-100 rotate-[-6.94deg]"
              duration={5}
              delay={0.7}
            />

            <PaperCard radius="rounded-[10px]" className="px-6 py-9">
              <div className="relative z-10 flex flex-col gap-4 px-2">
                <BrownHeading>LỊCH TRÌNH NGÀY CƯỚI</BrownHeading>
                <ol className={`${F_TIMES} relative mx-auto grid w-full max-w-[460px] grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10`}>
                  {schedule.map((item, i) => {
                    const icon = SCHEDULE_ICONS[i] ?? null;
                    const isFirst = i === 0;
                    const isLast = i === schedule.length - 1;
                    return (
                      <li key={`${item.time}-${i}`} className="contents">
                        <span className="pt-0.5 text-right text-[16px] leading-snug tracking-wide tabular-nums md:text-[17px]" style={{ color: INK }}>
                          {icon ? (
                            <span className="relative inline-block">
                              <span aria-hidden className="absolute right-full top-1/2 mr-[30px] flex -translate-y-1/2 items-center justify-center">
                                <img src={`${THEME}/${icon}.webp`} alt="" aria-hidden loading="lazy" className="block h-9 w-9 shrink-0 object-contain" />
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
                        <span className="text-[13px] md:text-[15px]" style={{ color: MUTED }}>{item.label}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </PaperCard>
          </section>
        ) : null}

        {/* ── SỔ LƯU BÚT — nền là tờ giấy note treo phía trên ─────────────────── */}
        <div className="relative z-10 overflow-x-clip">
          <Wash
            src={`${THEME}/leaf-background.webp`}
            className="left-[-14%] top-[-8%] -z-0 w-[44%] rotate-[38deg] opacity-[0.1]"
          />
          <img
            src={`${THEME}/paper-note.webp`}
            alt=""
            aria-hidden
            loading="lazy"
            className="pointer-events-none absolute left-1/2 top-[70px] w-full max-w-[650px] -translate-x-1/2 object-contain opacity-95 drop-shadow-[4px_4px_4px_rgba(0,0,0,0.25)] md:top-[85px]"
          />
          {/* Ô nhập của bản gốc cao hơn và bo 8px; ghi đè qua biến thể tuỳ ý thay
              vì sửa SharedWishForm để hơn 40 mẫu khác giữ nguyên giao diện. Bản
              gốc bọc ô nhập trong `div.p-4` bên trong form max-w-[300px] nên ô
              nhập rộng 268px — dồn phần đệm đó lên chính form để khỏi sửa markup
              dùng chung. */}
          <section
            className={`${F_TIMES} relative z-10 px-6 pb-8 pt-[68px] [&_button[type=submit]]:px-6 [&_button[type=submit]]:py-2 [&_button[type=submit]]:text-sm [&_button[type=submit]]:normal-case [&_form]:max-w-[300px] [&_form]:p-4 [&_input]:rounded-[8px] [&_input]:px-4 [&_input]:py-3 [&_input]:text-sm [&_textarea]:h-[60px] [&_textarea]:rounded-[8px] [&_textarea]:px-4 [&_textarea]:py-3 [&_textarea]:text-sm md:pt-[130px] md:[&_form]:max-w-[400px] md:[&_textarea]:h-[130px] lg:[&_textarea]:h-[150px]`}
            style={{ color: INK }}
          >
            <div className="text-center">
              {/* Bản gốc đẩy heading xuống 18px để nó rơi vào giữa tờ giấy nền. */}
              <BrownHeading className="relative translate-y-[18px]">Sổ lưu bút</BrownHeading>
            </div>
            {/* Placeholder và nhãn nút lấy đúng chữ của bản gốc; thông báo lỗi vẫn
                dùng catalog dùng chung. */}
            <SharedWishForm
              accent={INK}
              fieldBorderColor={INK}
              submitTextColor={ON_DARK}
              labels={{
                namePlaceholder: "Nhập tên*",
                textPlaceholder: "Nhập lời chúc*",
                submit: "GỬI LỜI CHÚC",
              }}
            />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y mx-auto mt-[65px] max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:mt-[130px] md:max-w-[600px]">
                {wishes.map((w, i) => (
                  <div
                    key={`${w.name}-${i}`}
                    className="rounded-[8px] border p-4 text-sm"
                    style={{ borderColor: hexToRgba(INK, 0.33), backgroundColor: "rgba(255,255,255,0.55)" }}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-semibold" style={{ color: INK }}>{w.name}</span>
                      <span className="text-xs opacity-70">{formatWishTime(w.time)}</span>
                    </div>
                    <p className="mt-2 leading-relaxed">{w.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </div>

        {/* ── HỘP QUÀ MỪNG ───────────────────────────────────────────────────── */}
        {banks.length > 0 ? (
          <div className="relative z-10 overflow-x-clip">
            <Wash
              src={`${THEME}/house-background.webp`}
              className="left-1/2 top-[8%] w-[140%] -translate-x-1/2 opacity-[0.08] mix-blend-multiply"
            />
            {/* F_SANS ở khung ngoài: bản gốc để đốm sáng ✦ và dòng "Nhấn để mở"
                rơi về stack sans mặc định. Heading vẫn là Times vì
                `headingClassName` tự khai lại. */}
            <div className={`${F_SANS} relative z-10 flex flex-col items-center px-6 pb-10 pt-8`}>
              <GiftEnvelope
                templateSlug={content.slug}
                banks={banks}
                accent={INK}
                dark={INK}
                cardBg={PAGE}
                heading="Hộp Quà Mừng"
                labelColor={INK}
                artworkVariant="source"
                sparkleColor={MUTED}
                headingClassName={`${F_TIMES} mb-4 text-center text-[20px] font-bold uppercase tracking-[0.03em]`}
              />
            </div>
          </div>
        ) : null}

        <footer data-template-footer className="relative z-10 flex flex-col items-center px-6 pb-10 text-center">
          <span
            className={`${F_TIMES} mx-auto flex flex-col items-center gap-1 whitespace-pre-line text-[12px] md:max-w-[560px] md:text-[13px]`}
            style={{ color: INK }}
          >
            Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!
          </span>
        </footer>

        <div className="relative z-20 flex items-center justify-center pb-3">
          <a
            href="https://thiepmungonline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs opacity-50 transition-opacity hover:opacity-70"
            style={{ color: INK }}
          >
            ♡ thiepmungonline.com
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Màu sáng cần viền tóc để không tan vào nền kem. Bản gốc chỉ viền ô kem nhạt
 * nhất (`#F5E6C8`, luminance 0.91) và để trần ô vàng cát (`#E1BC7C`, 0.75), nên
 * ngưỡng phải cao hơn ngưỡng 0.72 của mẫu Minimalism Xanh.
 */
function needsSwatchBorder(color: string) {
  const clean = color.replace("#", "");
  const value = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (value.length !== 6) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  if ([r, g, b].some(Number.isNaN)) return false;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.8;
}
