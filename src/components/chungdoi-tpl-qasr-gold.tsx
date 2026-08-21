import {
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
  SharedCarousel,
  SharedCountdown,
  GiftEnvelope,
  SharedWishForm,
  WEEKDAY_LABELS,
  AlbumGallery,
} from "@/components/chungdoi-tpl-shared";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { invitationGiftAccounts, orderedCouple } from "@/lib/invitation-display";

const QASR_BASE = "/chungdoi/images/themes/_decor/qasr-gold";
const QASR_GOLD = "#a8842c";
const QASR_GOLD_DARK = "#7a5a1e";
const QASR_GOLD_MUTED = "rgba(122, 90, 30, 0.72)";

const nameFont = { fontFamily: '"DFVN New Eddy", "Fz Qellia", cursive' };
const ampFont = { fontFamily: '"Alex Brush", "The Nautigal", cursive' };

function QasrHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <h2 className="text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: QASR_GOLD_DARK }}>
        {children}
      </h2>
      <img src={`${QASR_BASE}/golden-line.webp`} alt="" aria-hidden className="h-auto w-[180px] object-contain opacity-90 md:w-[240px]" />
    </div>
  );
}

/** Faithful rebuild of the Qasr Gold (thanh cung vang) opened invitation. */
export function QasrGoldInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const { lightbox, setLightbox } = useLightbox(gallery.length);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();

  const groomCol = <FamilyColumn title={families.groomParentTitle || "Ông Bà"} a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />;
  const brideCol = <FamilyColumn title={families.brideParentTitle || "Ông Bà"} a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />;

  const banks = invitationGiftAccounts(content).map((account) => ({
    label: `${account.birthOrder} - ${account.name}`,
    bank: account.bank,
    num: account.num,
    name: account.name,
  }));

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div className="relative w-full max-w-[480px] overflow-hidden mx-auto md:max-w-[900px] md:border" style={{ color: QASR_GOLD_DARK, borderColor: hexToRgba(QASR_GOLD, 0.2) }}>
        {/* foreground greenery */}
        <img src={`${QASR_BASE}/bush5.webp`} alt="" aria-hidden className="pointer-events-none absolute bottom-0 left-0 z-20 h-auto w-[150px] max-w-none object-contain md:w-[240px]" />
        <img src={`${QASR_BASE}/bush5.webp`} alt="" aria-hidden className="pointer-events-none absolute bottom-0 right-0 z-20 h-auto w-[150px] max-w-none -scale-x-100 object-contain md:w-[240px]" />

        {/* HEADER — source-matched names + castle/couple scene */}
        <header className="relative z-10 flex w-full flex-col items-center px-4 pt-[85px] sm:px-5 md:pt-[100px]">
          <div className="relative z-10 flex w-full items-center justify-center gap-3 whitespace-nowrap leading-none md:gap-6" style={{ color: QASR_GOLD_DARK }}>
            <span className="text-[34px] md:text-[58px]" style={nameFont}>{people[0].shortName}</span>
            <span className="text-[24px] md:text-[34px]" style={{ ...ampFont, color: QASR_GOLD }}>&amp;</span>
            <span className="text-[34px] md:text-[58px]" style={nameFont}>{people[1].shortName}</span>
          </div>
          <div data-testid="qasr-gold-hero-scene" className="relative mt-4 flex min-h-[440px] w-full items-end justify-center md:mt-8 md:min-h-[620px]">
            <img src={`${QASR_BASE}/castle.webp`} alt="" aria-hidden className="absolute bottom-[80px] left-1/2 z-0 h-auto w-[720px] max-w-none -translate-x-1/2 object-contain md:bottom-0 md:w-[980px]" />
            <img data-testid="qasr-gold-hero-couple" src={`${QASR_BASE}/couple.webp`} alt="" aria-hidden className="relative z-10 h-auto w-[235px] object-contain md:w-[370px]" />
          </div>
        </header>

        <div className="relative z-10 flex w-full flex-col items-center gap-14 px-4 pb-14 md:px-10">
          {/* CEREMONY INFO */}
          <section className="flex w-full flex-col items-center gap-8">
            <QasrHeading>Thông Tin Lễ Cưới</QasrHeading>
            <div className="flex w-full flex-col items-center gap-6 md:flex-row md:items-start md:justify-center md:gap-10">
              {couple.brideFirst ? (<>{brideCol}{groomCol}</>) : (<>{groomCol}{brideCol}</>)}
            </div>
            <div className="whitespace-pre-line text-center text-[16px] uppercase leading-relaxed tracking-wide md:text-[20px]">
              {couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI."}
            </div>
            <div className="flex w-full flex-col items-center gap-2 text-center">
              <h3 className="flex min-h-[80px] w-[80%] items-center justify-center text-[44px] leading-[1.1] md:text-[60px]" style={nameFont}>{people[0].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: QASR_GOLD_MUTED }}>{people[0].birthOrder}</div>
              <div className="text-[24px] md:text-[32px]" style={{ ...ampFont, color: QASR_GOLD }}>&amp;</div>
              <h3 className="flex min-h-[80px] w-[80%] items-center justify-center text-[44px] leading-[1.1] md:text-[60px]" style={nameFont}>{people[1].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: QASR_GOLD_MUTED }}>{people[1].birthOrder}</div>
            </div>
            {ceremony ? (
              <div className="flex flex-col items-center gap-1 text-center">
                {couple.ceremonyHeader ? <span className="whitespace-pre-line text-[16px] uppercase leading-relaxed md:text-[20px]">{couple.ceremonyHeader}</span> : null}
                {couple.ceremonyTime ? <div className="text-[20px] font-semibold md:text-[30px]">{couple.ceremonyTime}</div> : null}
                <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                  <span>{ceremony.weekday}</span><span>|</span><span className="text-[28px] font-bold">{ceremony.day}</span><span>|</span><span>Tháng {ceremony.month}</span>
                </div>
                <div className="text-[18px] md:text-[24px]">{ceremony.yearNumber}</div>
                <div className="text-xs uppercase tracking-[0.25em] md:text-sm" style={{ color: QASR_GOLD_MUTED }}>{ceremony.lunar}</div>
              </div>
            ) : null}
            <img src={`${QASR_BASE}/golden-line.webp`} alt="" aria-hidden className="h-auto w-[300px] object-contain opacity-90 md:w-[460px]" />
          </section>

          {/* ALBUM */}
          {gallery.length > 0 ? (
            <section className="flex w-full flex-col items-center gap-6">
              <QasrHeading>Album Ảnh Cưới</QasrHeading>
              {(content.albumLayout ?? "grid") === "grid" ? (
                <>
                  <div className="relative mx-auto aspect-[3/4] w-full max-w-[400px] overflow-hidden rounded-xl border md:max-w-[480px]" style={{ borderColor: hexToRgba(QASR_GOLD, 0.5) }}>
                    <SharedCarousel photos={gallery} arrowColor={QASR_GOLD_DARK} />
                  </div>
                  <Lightbox gallery={gallery} index={lightbox} setIndex={setLightbox} accent={QASR_GOLD} />
                </>
              ) : (
                <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={QASR_GOLD} />
              )}
            </section>
          ) : null}

          {/* RECEPTION INFO + calendar */}
          <section className="relative flex w-full flex-col items-center gap-3">
            <QasrHeading>Thông Tin Tiệc Cưới</QasrHeading>
            <p className="mt-2 text-center text-[16px] uppercase md:text-[20px]">Tiệc cưới sẽ diễn ra vào lúc:</p>
            <div className="text-[20px] font-semibold md:text-[30px]">{venue.banquetTime || couple.time}</div>
            {reception ? (
              <div className="mt-1 flex items-center justify-center gap-3 text-[15px] font-semibold uppercase md:text-[18px]">
                <span>{reception.weekday}</span><span>/</span><span>{reception.day}</span><span>/</span><span>Tháng {reception.month}</span>
              </div>
            ) : null}
            {reception ? <div className="text-[18px] md:text-[24px]">{reception.yearNumber}</div> : null}
            {reception ? <div className="text-[10px] uppercase tracking-[0.15em] md:text-base md:tracking-[0.25em]" style={{ color: QASR_GOLD_MUTED }}>{reception.lunar}</div> : null}

            <div className="mt-4 flex flex-col items-center">
              <QasrHeading>Cùng đếm ngược</QasrHeading>
              <SharedCountdown target={`${couple.date}T${couple.time || "18:00"}`} style={{ color: QASR_GOLD_DARK }} />
            </div>

            {/* calendar framed by frame-lich */}
            {calendar ? (
              <div className="relative mx-auto mt-8 aspect-[388/332] w-full max-w-[408px] md:mt-10 md:max-w-[504px]">
                <img src={`${QASR_BASE}/frame-lich.webp`} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
                <div className="relative flex h-full w-full flex-col items-center justify-center px-20 py-18">
                  <p className="text-[12px] font-semibold uppercase tracking-wide md:text-[13px]">Tháng {calendar.month} / {calendar.year}</p>
                  <div className="mt-2 grid w-full grid-cols-7 text-[10px] font-medium opacity-70 md:text-[11px]">
                    {WEEKDAY_LABELS.map((d) => (<span key={d} className="py-0.5 text-center">{d}</span>))}
                  </div>
                  <div className="grid w-full grid-cols-7 gap-y-0.5 text-[11px] md:text-[12px]">
                    {calendar.cells.map((day, i) => (
                      <span key={i} className={`flex aspect-square items-center justify-center rounded-full ${day === calendar.highlight ? "font-bold text-white" : ""}`} style={day === calendar.highlight ? { backgroundColor: QASR_GOLD } : undefined}>{day ?? ""}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <a href={googleCalendarUrl(content)} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center rounded-full border px-6 py-2 text-sm font-semibold transition" style={{ borderColor: QASR_GOLD, color: QASR_GOLD_DARK }}>Thêm vào lịch</a>
          </section>

          {/* VENUE MAP */}
          {mapQuery ? (
            <section className="flex w-full flex-col items-center gap-3 text-center">
              <h3 className="text-[20px] font-bold uppercase md:text-[24px]" style={{ color: QASR_GOLD_DARK }}>Tiệc cưới sẽ tổ chức tại</h3>
              <p className="mx-auto mt-1 max-w-sm whitespace-pre-line text-sm leading-6 md:max-w-[500px]">{venue.address}</p>
              <div className="mt-4 w-full overflow-hidden rounded-2xl border" style={{ borderColor: hexToRgba(QASR_GOLD, 0.5) }}>
                <InvitationMap query={mapQuery} title={mapQuery} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <MapDirectionsButton query={mapQuery} style={{ color: QASR_GOLD_DARK }} />
            </section>
          ) : null}

          {/* SCHEDULE */}
          {schedule.length > 0 ? (
            <section className="relative flex w-full flex-col items-center gap-6">
              <QasrHeading>Lịch Trình Ngày Cưới</QasrHeading>
              <ol className="mx-auto flex w-full max-w-sm flex-col gap-4">
                {schedule.map((s, i) => (
                  <li key={`${s.time}-${i}`} className="flex items-baseline gap-4">
                    <span className="w-[64px] shrink-0 pt-0.5 text-right text-[16px] tabular-nums tracking-wide md:text-[17px]" style={{ color: QASR_GOLD }}>{s.time}</span>
                    <span className="text-[16px] font-medium leading-tight md:text-[18px]">{s.label}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* WISHES */}
          <section className="relative w-full">
            <div className="text-center"><QasrHeading>Sổ Lưu Bút</QasrHeading></div>
            <SharedWishForm accent={QASR_GOLD} />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                {wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-xs" style={{ borderColor: hexToRgba(QASR_GOLD, 0.2), backgroundColor: "#ffffff" }}>
                    <div className="flex items-start justify-between">
                      <span className="font-semibold" style={{ color: QASR_GOLD_DARK }}>{w.name}</span>
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
              <GiftEnvelope templateSlug={content.slug} banks={banks} accent={QASR_GOLD} dark={QASR_GOLD_DARK} cardBg="#fbf5e6" heading="Hộp Quà Mừng" labelColor={QASR_GOLD_MUTED} />
            </section>
          ) : null}
        </div>

        {/* FOOTER */}
        <footer data-template-footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 text-center">
          <span className="text-[12px] md:text-[15px] lg:text-[18px]" style={{ color: QASR_GOLD_DARK }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: QASR_GOLD_DARK }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}
