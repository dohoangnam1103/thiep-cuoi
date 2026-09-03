"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { invitationGiftAccounts, orderedCouple } from "@/lib/invitation-display";
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
  SharedWishForm,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";

const GREEN_BASE = "/chungdoi/images/themes/_decor/glass-garden-green";
const GREEN = "#47613e";
const GREEN_MUTED = hexToRgba(GREEN, 0.72);

function GreenHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: GREEN }}>
      {children}
    </h2>
  );
}

/** Faithful rebuild of the Glass Garden Green (vuonkinh-xanh) opened invitation. */
export function GlassGardenInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const nameFont = { fontFamily: '"DFVN New Eddy", "Fz Qellia", cursive' };
  const ampFont = { fontFamily: '"Alex Brush", "The Nautigal", cursive' };

  const groomCol = <FamilyColumn sideBySideOnMobile title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn sideBySideOnMobile title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  const banks = invitationGiftAccounts(content).map((account) => ({
    label: `${account.birthOrder} - ${account.name}`,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div
        className="relative isolate w-full max-w-[480px] overflow-visible bg-[url('/chungdoi/images/themes/glass-garden-green/floral-background.webp')] bg-[length:180%] bg-left-top mx-auto md:max-w-[900px] md:overflow-hidden md:border"
        style={{ color: GREEN, borderColor: hexToRgba(GREEN, 0.2) }}
      >
        {/* HEADER — source-specific translucent garden capsule */}
        <section className="relative isolate z-20 flex w-full flex-col items-center pb-[110px] pt-16 md:pb-[150px] md:pt-[88px]">
          <div className="relative w-[62%] max-w-[250px]">
            <div className="relative z-20 flex aspect-[239/368] w-full flex-col items-center justify-center gap-3 rounded-[500px] border border-white/35 bg-white/40 px-5 text-center shadow-[inset_1.5px_1.5px_2px_rgba(255,255,255,0.45),inset_-1.5px_-1.5px_3px_rgba(120,140,110,0.12),0_18px_50px_-6px_rgba(53,69,47,0.3),0_6px_20px_2px_rgba(53,69,47,0.14)] backdrop-blur-[7px] md:gap-4" style={{ color: GREEN }}>
              <span data-invitation-short-name className="w-full text-[clamp(26px,7.4vw,38px)] leading-none" style={nameFont}>{people[0].shortName}</span>
              <span className="text-[clamp(22px,6vw,32px)] leading-none opacity-90" style={ampFont}>&amp;</span>
              <span data-invitation-short-name className="w-full text-[clamp(26px,7.4vw,38px)] leading-none" style={nameFont}>{people[1].shortName}</span>
            </div>
            <img src={`${GREEN_BASE}/flower1-decoration.webp`} alt="" aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 z-30 h-auto w-[135%] max-w-none -translate-x-1/2 translate-y-[46%] object-contain" />
          </div>
        </section>

        <div
          data-glass-garden-surface
          className="relative isolate z-10 mx-6 mb-2.5 flex flex-col items-center gap-5 rounded-[30px] bg-[rgba(255,255,255,0.4)] pb-[42%] pt-[30px] backdrop-blur-[7px] backdrop-saturate-[1.08] md:mx-[26px] md:gap-7 md:pt-10"
        >
          <img
            src={`${GREEN_BASE}/flower2-decoration.webp`}
            alt=""
            aria-hidden
            data-glass-garden-background-flower
            className="pointer-events-none absolute -right-10 -top-[58px] z-0 h-auto w-[44%] max-w-[210px] rotate-[-15.78deg] object-contain md:-right-16 md:-top-[78px] md:max-w-[244px]"
          />

          {/* CEREMONY INFO */}
          <section className="relative isolate flex w-full flex-col items-center gap-8 px-5 py-8 [&>:not(img)]:relative [&>:not(img)]:z-10 md:px-10 md:py-10">
            <img
              src={`${GREEN_BASE}/flower3-decoration.webp`}
              alt=""
              aria-hidden
              data-glass-garden-background-flower
              className="pointer-events-none absolute -bottom-[2%] -left-[12%] z-0 h-auto w-[46%] max-w-none object-contain"
            />
            <GreenHeading>Thông Tin Lễ Cưới</GreenHeading>
            {/* Nhà gái và nhà trai luôn chung một dòng, kể cả mobile. 4 hàng khai
                tường minh để FamilyColumn mượn qua grid-rows-subgrid, nên chức danh /
                tên bố / tên mẹ / địa chỉ của hai nhà thẳng hàng nhau dù một tên phải
                xuống dòng. md:gap-x-10 giữ đúng bề rộng cột như bản flex trước đây. */}
            <div className="grid w-full grid-cols-2 grid-rows-[auto_auto_auto_auto] items-start gap-x-3 gap-y-1.5 md:gap-x-10">
              {couple.brideFirst ? (<>{brideCol}{groomCol}</>) : (<>{groomCol}{brideCol}</>)}
            </div>
            <div className="whitespace-pre-line text-center text-[16px] uppercase leading-relaxed tracking-wide md:text-[20px]">
              {couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI."}
            </div>
            <div className="flex w-full flex-col items-center gap-2 text-center">
              {/* Không khai font ở tên: để thừa hưởng font body của thẻ, đúng cái
                  tên ba mẹ đang dùng. Cỡ chữ hạ theo vì font body rộng hơn script
                  nên giữ cỡ cũ là tràn khung. */}
              <h3 className="font-couple-garamond flex min-h-[80px] w-[80%] items-center justify-center text-[30px] leading-[1.15] md:text-[40px]">{people[0].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: GREEN_MUTED }}>{people[0].birthOrder}</div>
              <div className="text-[24px] md:text-[32px]" style={ampFont}>&amp;</div>
              <h3 className="font-couple-garamond flex min-h-[80px] w-[80%] items-center justify-center text-[30px] leading-[1.15] md:text-[40px]">{people[1].fullName}</h3>
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
            <section className="relative z-10 flex w-full flex-col items-center gap-6 px-4 md:px-8">
              <GreenHeading>Album Ảnh Cưới</GreenHeading>
              <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={GREEN} />
            </section>
          ) : null}

          {/* RECEPTION INFO + calendar */}
          <section className="relative isolate flex w-full flex-col items-center gap-3 px-5 py-8 [&>:not(img)]:relative [&>:not(img)]:z-10 md:px-10 md:py-10">
            <img
              src={`${GREEN_BASE}/flower3-decoration.webp`}
              alt=""
              aria-hidden
              data-glass-garden-background-flower
              className="pointer-events-none absolute right-[-10%] top-[48%] z-0 h-auto w-[46%] max-w-none object-contain"
            />
            <GreenHeading>Thông Tin Tiệc Cưới</GreenHeading>
            <p className="mt-2 text-center text-[16px] uppercase md:text-[20px]">Tiệc cưới sẽ diễn ra vào lúc:</p>
            <div className="text-[20px] font-semibold md:text-[30px]">{venue.banquetTime || couple.time}</div>
            {reception ? (
              <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                <span>{reception.weekday}</span><span>/</span><span>{reception.day}</span><span>/</span><span>Tháng {reception.month}</span>
              </div>
            ) : null}
            {reception ? <div className="text-[18px] md:text-[24px]">{reception.yearNumber}</div> : null}
            {reception ? <div className="text-[10px] uppercase tracking-[0.15em] md:text-base md:tracking-[0.25em]" style={{ color: GREEN_MUTED }}>{reception.lunar}</div> : null}

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
            <section className="relative z-10 flex w-full flex-col items-center gap-3 px-5 py-8 text-center md:px-10 md:py-10">
              <h3
                className="text-[20px] font-bold uppercase md:text-[24px]"
                style={{ color: GREEN }}
              >
                Tiệc cưới sẽ tổ chức tại
              </h3>
              <p className="mx-auto mt-1 max-w-sm whitespace-pre-line text-sm leading-6 md:max-w-[500px]">
                {venue.address}
              </p>
              <div
                className="mt-4 w-full overflow-hidden rounded-2xl border"
                style={{ borderColor: hexToRgba(GREEN, 0.3) }}
              >
                <InvitationMap
                  query={mapQuery}
                  title={mapQuery}
                  className="h-64 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <MapDirectionsButton query={mapQuery} style={{ color: GREEN }} />
            </section>
          ) : null}

          {/* SCHEDULE */}
          {schedule.length > 0 ? (
            <section className="relative isolate flex w-full flex-col items-center gap-6 px-5 py-8 [&>:not(img)]:relative [&>:not(img)]:z-10 md:px-10 md:py-10">
              <img
                src={`${GREEN_BASE}/flower4-decoration.webp`}
                alt=""
                aria-hidden
                data-glass-garden-background-flower
                className="pointer-events-none absolute -bottom-[15%] -left-[14%] z-0 h-auto w-[42%] max-w-none scale-x-[-1] object-contain"
              />
              <GreenHeading>Lịch Trình Ngày Cưới</GreenHeading>
              <ol className="relative z-10 mx-auto flex w-full max-w-sm flex-col gap-4">
                {schedule.map((s, i) => (
                  <li
                    key={`${s.time}-${i}`}
                    className="flex items-baseline gap-4"
                  >
                    <img
                      src={`${GREEN_BASE}/${i === 0 ? "welcome" : i === 1 ? "cake" : "dish"}.webp`}
                      alt=""
                      aria-hidden
                      className="h-10 w-9 shrink-0 object-contain"
                    />
                    <span className="w-[64px] shrink-0 pt-0.5 text-right text-[16px] tabular-nums tracking-wide md:text-[17px]">
                      {s.time}
                    </span>
                    <span className="text-[16px] font-medium leading-tight md:text-[18px]">
                      {s.label}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* WISHES */}
          <section className="relative z-10 w-full px-5 py-8 md:px-10 md:py-10">
            <div className="text-center">
              <GreenHeading>Sổ Lưu Bút</GreenHeading>
            </div>
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
            <section className="relative z-10 w-full px-5 py-8 text-center md:px-10 md:py-10">
              <GiftEnvelope templateSlug={content.slug}
                banks={banks}
                accent="#e7b849"
                dark={GREEN}
                cardBg="#eef7f0"
                heading="Hộp Quà Mừng"
                labelColor={GREEN_MUTED}
              />
            </section>
          ) : null}

          {/* FOOTER — part of the same continuous glass surface */}
          <footer
            data-template-footer
            className="relative z-20 flex flex-col items-center px-6 py-8 text-center md:px-10 md:py-10"
          >
            <span
              className="max-w-[560px] text-[13px] leading-relaxed md:text-[16px] lg:text-[18px]"
              style={{ color: GREEN }}
            >
              Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng
              tôi!
            </span>
            <a
              href="https://thiepmungonline.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 text-xs opacity-50 transition-opacity hover:opacity-70 md:mt-6"
              style={{ color: GREEN }}
            >
              ♡ thiepmungonline.com
            </a>
          </footer>
          <img
            src={`${GREEN_BASE}/flower5-bottom.webp`}
            alt=""
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-1/2 z-10 h-auto w-[150%] max-w-none -translate-x-1/2 translate-y-1/2 object-contain"
          />
        </div>
      </div>
    </div>
  );
}
