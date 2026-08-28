"use client";

import type { CSSProperties, ReactNode } from "react";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { invitationGiftAccounts, orderedCouple } from "@/lib/invitation-display";
import {
  buildCalendar,
  formatDate,
  formatWishTime,
  GiftEnvelope,
  googleCalendarUrl,
  hexToRgba,
  InvitationMap,
  Lightbox,
  SharedCountdown,
  SharedWishForm,
  useLightbox,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";

const THEME = "/chungdoi/images/themes/minimalism-green";

/** Xanh ô liu — chữ chính, heading, viền, nút. */
const INK = "#6b7b4f";
/** Xanh lá nhạt — nền hai thẻ sáng, chữ phụ, đốm sáng hộp quà. */
const LEAF = "#87a172";
/** Xanh gần đen — địa chỉ tiệc và phụ đề dress code. */
const DEEP = "#272e13";
const PAGE = "#ffffff";

/**
 * Bản gốc khai 5 font stack chứ không theo hệ 2 font của repo
 * (xem src/lib/invitation-fonts.ts). User yêu cầu clone khớp 100% cả
 * font-family lẫn font-size, nên giữ đúng 5 stack và đặt thành class ở
 * `globals.css` để renderer không phải khai `fontFamily` inline.
 */
const F_CORMORANT = "font-mg-cormorant";
const F_NAUTIGAL = "font-mg-nautigal";
const F_TIMES = "font-mg-times";
const F_BASKERVILLE = "font-mg-baskerville";
const F_GARAMOND = "font-mg-garamond";
/** Bản gốc để vài chỗ rơi về stack sans mặc định thay vì khai font. */
const F_SANS = "font-mg-sans";

/**
 * Icon bên trái mốc giờ, theo đúng thứ tự dòng của bản gốc: dòng đầu (đón khách)
 * và dòng cuối (kết thúc tiệc) không có icon.
 */
const SCHEDULE_ICONS = [null, "cake", "home", "music"] as const;

/** Nền giấy nhàu phủ lên thẻ, tô bằng multiply đúng như bản gốc. */
function PaperOverlay({ className, cover = false }: { className: string; cover?: boolean }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage: `url(${THEME}/paper.webp)`,
        // Toàn trang trải theo bề ngang; trong thẻ bản gốc chốt cứng 666.5×1000.
        backgroundSize: cover ? "100% auto" : "666.5px 1000px",
        backgroundPosition: "top left",
        backgroundRepeat: "repeat",
        mixBlendMode: "multiply",
        opacity: 0.5,
      }}
    />
  );
}

/**
 * Heading section: Times New Roman 20px, bold, uppercase.
 *
 * `tracking` là giá trị TUYỆT ĐỐI vì bản gốc có hai biến thể: phần lớn heading
 * khai `font-size:20px` ngay trên thẻ nên `0.04em` ra **0.8px**, còn hai heading
 * "THÔNG TIN …" để thẻ ở 16px rồi mới bọc `<span class="text-[20px]">` bên trong,
 * nên letter-spacing thừa hưởng đã tính xong là **0.64px**. Dùng `em` ở đây sẽ
 * làm hai heading đó rộng hơn bản gốc.
 */
function GreenHeading({
  children,
  color = INK,
  className,
  tracking = "0.8px",
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

/** Một cột "Ông Bà + tên bố + tên mẹ + địa chỉ", mượn lưới hàng của khung cha. */
function ParentColumn({ title, a, b, addr }: { title: string; a: string; b: string; addr: string }) {
  return (
    <div className="row-span-4 grid min-w-0 grid-rows-subgrid justify-items-center">
      <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.7)" }}>{title}</span>
      <span className="text-[12px] font-semibold [overflow-wrap:anywhere]" style={{ color: "#ffffff" }}>{a}</span>
      <span className="text-[12px] font-semibold [overflow-wrap:anywhere]" style={{ color: "#ffffff" }}>{b}</span>
      <div
        className="mt-1 flex w-full flex-col whitespace-pre-line text-[10px] leading-tight"
        style={{ color: "rgba(255,255,255,0.7)" }}
      >
        {addr}
      </div>
    </div>
  );
}

/**
 * Nhánh hoa mờ dùng lại 4 lần ở các góc khác nhau. Bản gốc chèn ảnh qua một lớp
 * parallax (`transform: translateY(...)` đổi theo scroll); ở đây chỉ giữ vị trí
 * gốc (parallax = 0) vì animate transform theo scroll là nguồn jank đã biết —
 * xem .claude/memory/project_scroll_jank_animation_tax.md.
 */
function FlowerWash({
  wrapperClassName,
  wrapperStyle,
  flip,
  rotate,
  width,
  height,
  opacity,
}: {
  wrapperClassName: string;
  wrapperStyle?: CSSProperties;
  flip?: boolean;
  rotate: number;
  width: number;
  height: number;
  opacity: string;
}) {
  const art = (
    <div style={{ transform: `rotate(${rotate}deg)` }}>
      <img
        src={`${THEME}/flower-background.webp`}
        alt=""
        aria-hidden
        loading="lazy"
        className={`max-w-none object-cover ${opacity}`}
        style={{ width, height }}
      />
    </div>
  );
  return (
    <div aria-hidden className={`pointer-events-none absolute ${wrapperClassName}`} style={wrapperStyle}>
      {flip ? <div style={{ transform: "scaleY(-1) rotate(180deg)" }}>{art}</div> : art}
    </div>
  );
}

/** Dựng lại mẫu Minimalism Xanh (minimalism-xanh) đã mở thiệp. */
export function MinimalismGreenInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const banquetTime = venue.banquetTime || couple.time;
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

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div
        data-testid="minimalism-green-template"
        className={`${F_TIMES} relative isolate w-full max-w-[480px] overflow-hidden md:mx-auto md:max-w-[900px] md:border`}
        // fontWeight 300: bản gốc đặt `font-weight:300` ở `body` nên mọi chữ không
        // tự khai weight đều là 300. Times New Roman / Baskerville không có face
        // Light nên trông y hệt 400, nhưng giữ cho computed style khớp bản gốc.
        style={{ backgroundColor: PAGE, color: INK, borderColor: `${INK}22`, fontWeight: 300 }}
      >
        {/* Giấy nhàu phủ toàn trang, trải theo bề ngang */}
        <PaperOverlay className="z-0" cover />

        {/* ── HERO ────────────────────────────────────────────────────────────
            "Save The Date" → nhánh hoa → cụm phong bì lồng 2 ảnh nghiêng →
            tên đôi với chữ "&" khổng lồ mờ phía sau → nhánh hoa lần hai. */}
        <header className="relative z-10 flex flex-col items-center px-6 pb-6 pt-10 text-center">
          <img
            src={`${THEME}/flower-background.webp`}
            alt=""
            aria-hidden
            className="pointer-events-none absolute max-w-none object-cover opacity-20"
            style={{ left: -335.5, top: -52, width: 784, height: 845 }}
          />
          <p
            className={`${F_CORMORANT} relative z-10 whitespace-pre-line text-[18px] font-semibold uppercase tracking-[0.14em] md:text-[24px]`}
            style={{ color: INK }}
          >
            Save The Date
          </p>
          <img
            src={`${THEME}/flower-line.webp`}
            alt=""
            aria-hidden
            className="relative z-10 mt-3 h-auto w-[124px] max-w-[45%] md:mt-4 md:w-[161px]"
          />

          <div className="relative z-10 mt-4 aspect-[268/317] w-[77%] max-w-[326px] md:mt-6 md:max-w-[425px]">
            <img
              src={`${THEME}/envelope.webp`}
              alt=""
              aria-hidden
              className="pointer-events-none absolute left-0 top-[7.9%] z-10 w-full max-w-none"
            />
            {/* Hai ảnh nghiêng ngược chiều nhau, viền trắng 6px, tự bồng bềnh.
                Keyframes mgFloatG/mgFloatB đã gộp translate(-50%) nên phải để
                animation lo cả việc canh giữa theo `left`. */}
            {people[0].heroPhoto ? (
              <div className="mg-float-g absolute left-[72%] top-[3%] z-20 w-[56%]">
                <div className="aspect-[150/180] border-[6px] border-white bg-white shadow-[2px_2px_6px_rgba(0,0,0,0.25)]">
                  <img src={people[0].heroPhoto} alt={people[0].shortName} className="h-full w-full object-cover" />
                </div>
              </div>
            ) : null}
            {people[1].heroPhoto ? (
              <div className="mg-float-b absolute left-[31.7%] top-[20%] z-20 w-[56%]">
                <div className="aspect-[150/180] border-[6px] border-white bg-white shadow-[2px_2px_6px_rgba(0,0,0,0.25)]">
                  <img src={people[1].heroPhoto} alt={people[1].shortName} className="h-full w-full object-cover" />
                </div>
              </div>
            ) : null}
            <img
              src={`${THEME}/envelope-cut.webp`}
              alt=""
              aria-hidden
              className="pointer-events-none absolute left-0 top-[45.4%] z-30 w-full max-w-none"
            />
          </div>

          <div className="relative z-10 mt-6 flex flex-col items-center gap-1 md:mt-8 md:gap-2">
            <p className="text-[clamp(41px,12vw,54px)] italic md:text-[70px]" style={{ color: INK }}>
              {people[0].shortName}
            </p>
            <span
              aria-hidden
              className={`${F_NAUTIGAL} pointer-events-none absolute top-1/2 -translate-y-1/2 text-[120px] leading-none md:text-[156px]`}
              style={{ color: hexToRgba(INK, 0.15) }}
            >
              &amp;
            </span>
            <p className="text-[clamp(41px,12vw,54px)] italic md:text-[70px]" style={{ color: INK }}>
              {people[1].shortName}
            </p>
          </div>

          <img
            src={`${THEME}/flower-line.webp`}
            alt=""
            aria-hidden
            className="relative z-10 mt-4 h-auto w-[124px] max-w-[45%] md:mt-5 md:w-[161px]"
          />
        </header>

        {/* ── THÔNG TIN LỄ CƯỚI ───────────────────────────────────────────────
            Thẻ xanh lá bo vòm trên 200px (tròn hẳn từ md), chữ trắng. */}
        <section className="relative z-10 mx-auto w-[88%] max-w-[420px] md:max-w-[560px]">
          <div className="relative overflow-hidden rounded-b-[10px] rounded-t-[200px] px-4 pb-10 pt-14 text-center md:rounded-t-full">
            <div aria-hidden className="absolute inset-0 rounded-b-[10px] rounded-t-[200px]" style={{ backgroundColor: LEAF }} />
            <PaperOverlay className="rounded-b-[10px] rounded-t-[200px]" />

            <div className="relative z-10 flex flex-col items-center gap-6 md:[zoom:1.2]">
              <GreenHeading color="#ffffff" tracking="0.64px" className="mx-auto max-w-[240px]">THÔNG TIN LỄ CƯỚI</GreenHeading>

              <div
                className={`${F_BASKERVILLE} relative grid grid-cols-[1fr_auto_1fr] grid-rows-[repeat(4,auto)] justify-center gap-x-3.5 gap-y-[3px] text-center`}
                style={{ color: "#ffffff" }}
              >
                {couple.brideFirst ? brideCol : groomCol}
                <div className="row-span-4 h-[50px] w-[1px] shrink-0 self-center" style={{ backgroundColor: "rgba(255,255,255,0.4)" }} />
                {couple.brideFirst ? groomCol : brideCol}
              </div>

              {couple.openingMessage ? (
                <div
                  className={`${F_BASKERVILLE} relative mx-auto flex flex-col gap-1 whitespace-pre-line text-center text-[12px] md:max-w-[560px] md:text-[13px]`}
                  style={{ color: "#ffffff" }}
                >
                  {couple.openingMessage}
                </div>
              ) : null}

              <div className="relative flex w-full min-w-0 flex-col items-center gap-3 text-center md:gap-4">
                {/* font-normal: bản gốc cho h3 weight 400 chứ không thừa hưởng 300 của body. */}
                <h3
                  className={`${F_GARAMOND} flex min-h-[80px] w-[80%] items-center justify-center whitespace-nowrap text-[36px] font-normal leading-[52px] md:leading-[60px]`}
                  style={{ color: "#ffffff" }}
                >
                  {people[0].fullName}
                </h3>
                <div
                  className={`${F_BASKERVILLE} text-[10px] uppercase tracking-[0.1em]`}
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  {people[0].birthOrder}
                </div>
                <div className="text-[30px]" style={{ color: "#ffffff" }}>&amp;</div>
                <h3
                  className={`${F_GARAMOND} flex min-h-[80px] w-[80%] items-center justify-center whitespace-nowrap text-[36px] font-normal leading-[52px] md:leading-[60px]`}
                  style={{ color: "#ffffff" }}
                >
                  {people[1].fullName}
                </h3>
                <div
                  className={`${F_BASKERVILLE} text-[10px] uppercase tracking-[0.1em]`}
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  {people[1].birthOrder}
                </div>
              </div>

              <div className={`${F_BASKERVILLE} relative flex flex-col items-center gap-4 text-center md:gap-5`}>
                <div className="flex flex-col items-center gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <span className="whitespace-pre-line text-center text-[16px] font-normal md:text-[18px]">
                    {couple.ceremonyHeader}
                  </span>
                  <p className="mb-2 text-[16px] font-normal uppercase md:text-[18px]">VÀO LÚC</p>
                </div>
                <div className="text-[20px] md:text-[30px]" style={{ color: "#ffffff" }}>{couple.ceremonyTime}</div>
                {ceremony ? (
                  <>
                    <div className="flex items-center gap-6" style={{ color: "#ffffff" }}>
                      <span className="text-right text-[12px] uppercase md:text-[16px]">{ceremony.weekday}</span>
                      <span className="flex items-center justify-center text-[24px] leading-none" style={{ color: "rgba(255,255,255,0.5)" }}>|</span>
                      <span className="text-[30px] md:text-[40px]">{ceremony.dayNumber}</span>
                      <span className="flex items-center justify-center text-[24px] leading-none" style={{ color: "rgba(255,255,255,0.5)" }}>|</span>
                      <span className="text-left text-[12px] uppercase md:text-[16px]">Tháng {ceremony.monthNumber}</span>
                    </div>
                    <div className="text-[18px] md:text-[24px]" style={{ color: "#ffffff" }}>{ceremony.yearNumber}</div>
                    <div className="text-xs uppercase tracking-[0.25em] md:text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                      {ceremony.lunar}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* ── ALBUM — lưới 2×2, ô thứ 4 phủ đen kèm "+N" ─────────────────────── */}
        {gallery.length > 0 ? (
          <div className="relative z-10 flex flex-col items-center px-6 pb-10 pt-10">
            <GreenHeading className="relative z-10">Album Ảnh</GreenHeading>
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
        ) : null}

        {/* ── THÔNG TIN TIỆC CƯỚI ─────────────────────────────────────────────
            Thẻ trắng viền 3px, chứa giờ tiệc, lịch tháng, đếm ngược và RSVP. */}
        <section className="relative z-10 mx-auto mb-2 w-[88%] max-w-[420px] md:max-w-[560px]">
          <div className="relative rounded-[10px] border-[3px] px-4 py-8" style={{ borderColor: INK }}>
            <div aria-hidden className="absolute inset-0 rounded-[10px]" style={{ backgroundColor: PAGE }} />
            <PaperOverlay className="rounded-[10px]" />
            <FlowerWash
              wrapperClassName="flex items-center justify-center"
              wrapperStyle={{ left: -351.49, top: -239.99, width: 1064.98, height: 1094.98 }}
              rotate={24.65}
              width={784}
              height={845}
              opacity="opacity-10"
            />

            <div className="relative z-10 flex flex-col items-center gap-6">
              <GreenHeading tracking="0.64px" className="relative z-10">THÔNG TIN TIỆC CƯỚI</GreenHeading>

              <div className={`${F_BASKERVILLE} flex flex-col items-center gap-4 text-center md:gap-5`} style={{ color: INK }}>
                <h3 className="flex flex-col items-center text-[20px] font-normal uppercase md:text-[26px]" style={{ color: INK }}>
                  Tiệc cưới sẽ diễn ra vào lúc:
                </h3>
                <div className="text-[20px] md:text-[30px]" style={{ color: LEAF }}>{banquetTime}</div>

                {reception ? (
                  <>
                    <div className="flex items-center gap-6">
                      <span className={`${F_TIMES} text-right text-[12px] uppercase md:text-[16px]`} style={{ color: INK }}>{reception.weekday}</span>
                      <div className="h-6 w-[2px]" style={{ backgroundColor: INK }} />
                      <span className="text-[30px] md:text-[40px]" style={{ color: INK }}>{reception.dayNumber}</span>
                      <div className="h-6 w-[2px]" style={{ backgroundColor: INK }} />
                      <span className={`${F_TIMES} text-left text-[12px] uppercase md:text-[16px]`} style={{ color: INK }}>Tháng {reception.monthNumber}</span>
                    </div>
                    <div className={`${F_TIMES} text-[18px] md:text-[24px]`} style={{ color: INK }}>{reception.yearNumber}</div>
                    <div className="text-xs uppercase tracking-[0.25em] md:text-base" style={{ color: LEAF }}>{reception.lunar}</div>
                  </>
                ) : null}

                <div className="mt-4 flex items-center justify-center gap-8">
                  <div className="flex flex-col items-center">
                    <span className="text-xs uppercase tracking-wider" style={{ color: LEAF }}>Khai tiệc</span>
                    <span className="mt-1 text-lg font-medium md:text-xl" style={{ color: INK }}>{banquetTime}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col items-center justify-center">
                  {/* font-normal: bản gốc cho h2 weight 400, không thừa hưởng 300 của body. */}
                  <h2 className="font-normal" style={{ color: LEAF }}>Cùng đếm ngược</h2>
                  <SharedCountdown
                    target={`${couple.date}T${banquetTime || "18:00"}`}
                    className="mt-2 text-center text-sm md:text-lg"
                    style={{ color: LEAF }}
                  />
                </div>

                {/* LỊCH THÁNG — nền xanh lá, ngày cưới là một trái tim trắng */}
                {calendar ? (
                  <div className="mx-auto mt-3 w-fit max-w-full overflow-hidden rounded-[10px] px-3 pb-3 pt-1" style={{ backgroundColor: LEAF }}>
                    <div className="mx-auto w-[296px] overflow-hidden rounded-lg md:w-[352px]" style={{ color: "#ffffff" }}>
                      <div
                        className={`${F_NAUTIGAL} border-b py-2.5 text-center text-[22px] font-normal tracking-wide`}
                        style={{ borderColor: "rgba(255,255,255,0.27)" }}
                      >
                        Tháng {calendar.month} / {calendar.year}
                      </div>
                      <div className={`${F_BASKERVILLE} grid grid-cols-7 border-b-2`} style={{ borderColor: "#ffffff" }}>
                        {WEEKDAY_LABELS.map((day) => (
                          <div key={day} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{day}</div>
                        ))}
                      </div>
                      <div className={`${F_BASKERVILLE} grid grid-cols-7 gap-y-0.5 px-1 py-2`}>
                        {calendar.cells.map((day, i) => (
                          <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                            {day === calendar.highlight ? (
                              <div className="relative flex h-[24px] w-[26px] items-center justify-center md:h-[28px] md:w-[30px]">
                                <svg viewBox="0 0 24 22" className="absolute inset-0 h-full w-full drop-shadow-sm" fill="#ffffff" aria-hidden>
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
                  className={`${F_BASKERVILLE} inline-flex items-center justify-center rounded-full px-6 py-2 text-sm tracking-wider transition-transform hover:scale-[1.03]`}
                  style={{ backgroundColor: INK, color: "#ffffff" }}
                >
                  XÁC NHẬN THAM DỰ
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── ĐỊA ĐIỂM + BẢN ĐỒ ──────────────────────────────────────────────── */}
        <div className="relative z-10 overflow-x-clip">
          <FlowerWash
            wrapperClassName="bottom-[-463px] left-1/2 flex -translate-x-1/2 items-center justify-center"
            wrapperStyle={{ width: 1064.98, height: 1094.98 }}
            flip
            rotate={24.65}
            width={784}
            height={845}
            opacity="opacity-10"
          />
          <section className="relative z-10 flex flex-col items-center px-6 pb-8 pt-8">
            <div className="relative text-center">
              <h3
                className={`${F_TIMES} text-center text-[16px] font-bold uppercase`}
                style={{ color: INK, letterSpacing: "0.64px" }}
              >
                Tiệc cưới sẽ tổ chức tại
              </h3>
              <div
                className={`${F_BASKERVILLE} mx-auto mt-2 max-w-[280px] whitespace-pre-line text-center text-[12px] leading-relaxed md:max-w-[440px] md:text-[14px]`}
                style={{ color: DEEP }}
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

        {/* ── DRESS CODE — 4 ô tròn, hai ô nhạt thêm viền tóc ──────────────────── */}
        {dressColors.length > 0 ? (
          <div className="relative z-10 flex flex-col items-center gap-5 px-6 py-10 md:px-10 md:py-12">
            <div className="flex flex-col items-center gap-1">
              <GreenHeading>DRESS CODE</GreenHeading>
              <p className={`${F_TIMES} whitespace-pre-line text-center text-sm md:text-base`} style={{ color: DEEP }}>
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
                    // Bản gốc chỉ viền hai ô nhạt nhất để chúng không tan vào nền trắng.
                    border: needsSwatchBorder(color) ? `1.5px solid ${INK}30` : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* ── LỊCH TRÌNH — thẻ xanh lá bo lệch, ray dọc giữa, icon bên trái giờ ── */}
        {schedule.length > 0 ? (
          <section className="relative z-10 mx-auto my-4 w-[88%] max-w-[420px] md:max-w-[560px]">
            <div className="relative overflow-hidden rounded-bl-[100px] rounded-br-[10px] rounded-tl-[10px] rounded-tr-[100px] px-6 py-9">
              <div
                aria-hidden
                className="absolute inset-0 rounded-bl-[100px] rounded-br-[10px] rounded-tl-[10px] rounded-tr-[100px]"
                style={{ backgroundColor: LEAF }}
              />
              <PaperOverlay className="rounded-bl-[100px] rounded-br-[10px] rounded-tl-[10px] rounded-tr-[100px]" />

              <div className="relative z-10 flex flex-col gap-4 px-2">
                <GreenHeading color="#ffffff">LỊCH TRÌNH NGÀY CƯỚI</GreenHeading>
                <ol className="relative mx-auto grid w-full max-w-[460px] grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10">
                  {schedule.map((item, i) => {
                    const icon = SCHEDULE_ICONS[i] ?? null;
                    const isFirst = i === 0;
                    const isLast = i === schedule.length - 1;
                    return (
                      <li key={`${item.time}-${i}`} className="contents">
                        <span className="pt-0.5 text-right text-[16px] leading-snug tracking-wide tabular-nums md:text-[17px]" style={{ color: "#ffffff" }}>
                          {icon ? (
                            <span className="relative inline-block">
                              <span aria-hidden className="absolute right-full top-1/2 mr-[24px] flex -translate-y-1/2 items-center justify-center">
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
                            style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
                          />
                          <span
                            className="relative block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: "#ffffff", boxShadow: "0 0 0 2px rgba(255,255,255,0.13)" }}
                          />
                        </span>
                        <span className="text-[13px] md:text-[15px]" style={{ color: "#ffffff" }}>{item.label}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </section>
        ) : null}

        {/* ── SỔ LƯU BÚT — nền là bức guestbook-background treo phía trên ─────── */}
        <div className="relative z-10">
          <img
            src={`${THEME}/guestbook-background.webp`}
            alt=""
            aria-hidden
            loading="lazy"
            className="pointer-events-none absolute left-1/2 top-[6px] w-[96%] max-w-[530px] -translate-x-1/2 opacity-90"
          />
          {/* Ô nhập của bản gốc cao hơn và bo 8px; ghi đè qua biến thể tuỳ ý
              thay vì sửa SharedWishForm để ~40 mẫu khác giữ nguyên giao diện. */}
          <section
            // Bản gốc bọc ô nhập trong `div.p-4` bên trong form max-w-[300px], nên
            // ô nhập rộng 268px chứ không phải 300px. Dồn phần đệm đó lên chính
            // form để khỏi phải sửa markup của SharedWishForm.
            className="relative z-10 px-6 pb-8 pt-[68px] [&_button[type=submit]]:px-6 [&_button[type=submit]]:py-2 [&_button[type=submit]]:text-sm [&_form]:max-w-[300px] [&_form]:p-4 [&_input]:rounded-[8px] [&_input]:px-4 [&_input]:py-3 [&_input]:text-sm [&_textarea]:h-[50px] [&_textarea]:rounded-[8px] [&_textarea]:px-4 [&_textarea]:py-3 [&_textarea]:text-sm md:pt-[130px] md:[&_form]:max-w-[450px] md:[&_textarea]:h-[90px]"
            style={{ color: INK }}
          >
            <div className="text-center">
              {/* Bản gốc đẩy heading xuống 25px để nó rơi vào giữa bức tranh nền. */}
              <GreenHeading className="relative translate-y-[25px]">Sổ lưu bút</GreenHeading>
            </div>
            {/* Placeholder và nhãn nút lấy đúng chữ của bản gốc; thông báo lỗi vẫn
                dùng catalog dùng chung. */}
            <SharedWishForm
              accent={INK}
              fieldBorderColor={INK}
              labels={{
                namePlaceholder: "Nhập tên*",
                textPlaceholder: "Nhập lời chúc*",
                submit: "GỬI LỜI CHÚC",
              }}
            />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y mx-auto mt-[55px] max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:mt-[100px] md:max-w-[600px]">
                {wishes.map((w, i) => (
                  <div
                    key={`${w.name}-${i}`}
                    className="rounded-[8px] border p-4 text-sm"
                    style={{ borderColor: hexToRgba(INK, 0.4), backgroundColor: "rgba(255,255,255,0.6)" }}
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
            <FlowerWash
              wrapperClassName="left-[-204.99px] top-[-190px] flex items-center md:left-[160px] md:top-[-120px]"
              wrapperStyle={{ width: 1016.897, height: 935.835 }}
              flip
              rotate={165.75}
              width={724.801}
              height={781.426}
              opacity="opacity-10"
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
                sparkleColor={LEAF}
                headingClassName={`${F_TIMES} mb-4 text-center text-[20px] font-bold uppercase tracking-[0.04em]`}
              />
            </div>
          </div>
        ) : null}

        <footer data-template-footer className="relative z-10 flex flex-col items-center px-6 pb-12 text-center">
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
 * Màu sáng cần viền tóc để không tan vào nền trắng. Bản gốc viền hai ô nhạt
 * (`#cdd9bd`, `#e9efe1`) và để trần hai ô đậm, nên ngưỡng đo theo độ sáng cảm
 * nhận thay vì so đúng một chuỗi hex.
 */
function needsSwatchBorder(color: string) {
  const clean = color.replace("#", "");
  const value = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (value.length !== 6) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  if ([r, g, b].some(Number.isNaN)) return false;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.72;
}
