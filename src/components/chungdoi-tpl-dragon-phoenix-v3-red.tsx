"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { invitationGiftAccounts, invitationHeroImage, orderedCouple } from "@/lib/invitation-display";
import {
  WEEKDAY_LABELS,
  hexToRgba,
  formatDate,
  buildCalendar,
  formatWishTime,
  useLightbox,
  Lightbox,
  googleCalendarUrl,
  InvitationMap,
  MapDirectionsButton,
  FamilyColumn,
  AlbumGallery,
  SharedCarousel,
  SharedCountdown,
  GiftEnvelope,
  SharedWishForm,
} from "@/components/chungdoi-tpl-shared";

const RED_BASE = "/chungdoi/images/themes/_decor/longphung-v3-red";
const RED = "#8f0018";
const RED_DEEP = "#710013";
const GOLD = "#ffbe89";
const GOLD_MUTED = "rgba(255, 190, 137, 0.78)";

const ampFont = { fontFamily: '"Alex Brush", "The Nautigal", cursive' };

function RedHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: GOLD }}>
      {children}
    </h2>
  );
}

/** Faithful rebuild of the Dragon-Phoenix v3 Red (long-phung-v3-do) opened invitation. */
export function DragonPhoenixV3Invitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const { lightbox, setLightbox } = useLightbox(gallery.length);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const heroPhoto = invitationHeroImage(content);

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
        data-template-visual="dragon-phoenix-v3-red"
        className="relative w-full max-w-[480px] overflow-hidden bg-[radial-gradient(circle_at_50%_10%,#a60022_0%,#8f0018_38%,#710013_100%)] text-[#ffbe89] mx-auto md:max-w-[900px] md:border md:border-[#ffbe89]/25"
      >
        <img src={`${RED_BASE}/phung.webp`} alt="" aria-hidden className="pointer-events-none absolute -left-[32%] top-0 h-auto w-[90%] max-w-none opacity-[0.08] md:-left-[18%] md:w-[65%]" />
        <img src={`${RED_BASE}/rong.webp`} alt="" aria-hidden className="pointer-events-none absolute -right-[30%] top-[620px] h-auto w-[90%] max-w-none opacity-[0.08] md:-right-[15%] md:top-[760px] md:w-[65%]" />

        {/* Original V3 hero: compact name lockup, swallow ornaments and an arched portrait. */}
        <header data-testid="dragon-phoenix-v3-hero" className="relative z-20 flex w-full flex-col items-center px-4 pb-16 pt-14 sm:px-5 md:pb-20 md:pt-20">
          <div className="relative z-20 flex w-full items-center justify-center gap-4 md:gap-7">
            <span className="min-w-0 flex-1 text-right font-serif text-[14px] font-semibold uppercase tracking-[0.12em] md:text-[22px] md:tracking-[0.16em]">
              {people[0].shortName}
            </span>
            <img src={`${RED_BASE}/chu-hy.webp`} alt="" aria-hidden className="h-14 w-14 shrink-0 object-contain md:h-20 md:w-20" />
            <span className="min-w-0 flex-1 font-serif text-[14px] font-semibold uppercase tracking-[0.12em] md:text-[22px] md:tracking-[0.16em]">
              {people[1].shortName}
            </span>
          </div>

          <div className="relative mt-8 flex w-full max-w-[620px] justify-center md:mt-10">
            <img src={`${RED_BASE}/chim-en.webp`} alt="" aria-hidden className="absolute left-[3%] top-4 z-20 w-[76px] -rotate-[12deg] object-contain md:left-[5%] md:w-[120px]" />
            <img src={`${RED_BASE}/chim-en.webp`} alt="" aria-hidden className="absolute right-[3%] top-4 z-20 w-[76px] -scale-x-100 rotate-[12deg] object-contain md:right-[5%] md:w-[120px]" />

            <div className="absolute left-[9%] top-[12%] h-[72%] w-[34%] rounded-t-[28%] border border-[#ffbe89]/45 bg-[#dcb889]/35 md:left-[12%]" />
            <div className="absolute right-[9%] top-[12%] h-[72%] w-[34%] rounded-t-[28%] border border-[#ffbe89]/45 bg-[#f5dfbd]/35 md:right-[12%]" />

            {heroPhoto ? (
              <div
                data-testid="dragon-phoenix-v3-hero-photo"
                className="relative z-10 aspect-[3/4.65] w-[58%] overflow-hidden rounded-[18%_18%_12%_12%/10%_10%_8%_8%] border-[3px] border-[#ffbe89] bg-[#5f0011] shadow-[0_24px_60px_rgba(53,0,10,0.45)] md:w-[52%] md:border-4"
              >
                <img
                  src={heroPhoto}
                  alt={`${people[0].fullName} và ${people[1].fullName}`}
                  className="h-full w-full object-cover object-[50%_34%]"
                />
              </div>
            ) : null}
          </div>
        </header>

        <div className="relative z-10 flex w-full flex-col items-center gap-14 px-4 pb-14 md:px-10">
          {/* CEREMONY INFO */}
          <section className="flex w-full flex-col items-center gap-8">
            <div className="rounded-[14px] border-2 border-[#ffbe89] px-5 py-2 md:px-7 md:py-3">
              <RedHeading>Thông Tin Lễ Cưới</RedHeading>
            </div>
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
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: GOLD_MUTED }}>{people[0].birthOrder}</div>
              <div className="text-[24px] md:text-[32px]" style={{ ...ampFont, color: GOLD }}>&amp;</div>
              <h3 className="font-couple-garamond flex min-h-[80px] w-[80%] items-center justify-center text-[30px] leading-[1.15] md:text-[40px]">{people[1].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: GOLD_MUTED }}>{people[1].birthOrder}</div>
            </div>
            {ceremony ? (
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                  <span>{ceremony.weekday}</span><span style={{ color: GOLD }}>|</span><span className="text-[28px] font-bold">{ceremony.day}</span><span style={{ color: GOLD }}>|</span><span>Tháng {ceremony.month}</span>
                </div>
                <div className="text-[18px] md:text-[24px]">{ceremony.yearNumber}</div>
                <div className="text-xs uppercase tracking-[0.25em] md:text-sm" style={{ color: GOLD_MUTED }}>{ceremony.lunar}</div>
              </div>
            ) : null}
          </section>

          {/* ALBUM */}
          {gallery.length > 0 ? (
            <section className="flex w-full flex-col items-center gap-6">
              <RedHeading>Album Ảnh Cưới</RedHeading>
              {(content.albumLayout ?? "grid") === "grid" ? (
                <>
                  <div className="relative mx-auto aspect-[3/4] w-full max-w-[400px] overflow-hidden rounded-xl border md:max-w-[480px]" style={{ borderColor: hexToRgba(GOLD, 0.5) }}>
                    <SharedCarousel photos={gallery} arrowColor={GOLD} />
                  </div>
                  <Lightbox gallery={gallery} index={lightbox} setIndex={setLightbox} accent={GOLD} />
                </>
              ) : (
                <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={GOLD} />
              )}
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
            {reception ? <div className="text-[10px] uppercase tracking-[0.15em] md:text-base md:tracking-[0.25em]" style={{ color: GOLD_MUTED }}>{reception.lunar}</div> : null}

            <div className="mt-4 flex flex-col items-center">
              <RedHeading>Cùng đếm ngược</RedHeading>
              <SharedCountdown target={`${couple.date}T${couple.time || "18:00"}`} style={{ color: GOLD }} />
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

            <a href={googleCalendarUrl(content)} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center rounded-full border px-6 py-2 text-sm font-semibold transition hover:bg-[#ffbe89]/10 active:scale-[0.98]" style={{ borderColor: GOLD, color: GOLD }}>Thêm vào lịch</a>
          </section>

          {/* VENUE MAP */}
          {mapQuery ? (
            <section className="flex w-full flex-col items-center gap-3 text-center">
              <h3 className="text-[20px] font-bold uppercase md:text-[24px]" style={{ color: GOLD }}>Tiệc cưới sẽ tổ chức tại</h3>
              <p className="mx-auto mt-1 max-w-sm whitespace-pre-line text-sm leading-6 md:max-w-[500px]">{venue.address}</p>
              <div className="mt-4 w-full overflow-hidden rounded-2xl border" style={{ borderColor: hexToRgba(GOLD, 0.5) }}>
                <InvitationMap query={mapQuery} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <MapDirectionsButton query={mapQuery} style={{ color: GOLD }} />
            </section>
          ) : null}

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
            <SharedWishForm accent={GOLD} />
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

          {/* GIFT ENVELOPE */}
          {banks.length > 0 ? (
            <section className="w-full text-center">
              <GiftEnvelope templateSlug={content.slug} banks={banks} accent={GOLD} dark={GOLD} cardBg={RED_DEEP} heading="Hộp Quà Mừng" labelColor={GOLD} />
            </section>
          ) : null}
        </div>

        {/* FOOTER — swallow birds decor + deep-red closing */}
        <footer data-template-footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 text-center">
          <span className="text-[12px] md:text-[15px] lg:text-[18px]" style={{ color: GOLD }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: GOLD }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}
