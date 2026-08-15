"use client";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { useWishFormBinding } from "@/components/chungdoi-live-forms";
import {
  buildCalendar,
  formatDate,
  formatWishTime,
  googleCalendarUrl,
  hexToRgba,
  AlbumGallery,
  InvitationMap,
  MapDirectionsButton,
  GiftEnvelope,
  GiftQrGrid,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";
import { invitationCeremonyMessage, invitationCouple, orderedCouple, orderByBrideFirst } from "@/lib/invitation-display";

const DD_TEX = "/images/double-dragon.webp";
const DD_HY = "/images/chu-hy.webp";
const DD_SERIF = 'Baskerville, "Times New Roman", serif';
const DD_TNR = '"Times New Roman", serif';

interface DdPalette {
  red: string;
  linen: string;
  gray: string;
  lunar: string;
  groomLabel: string;
  brideLabel: string;
  giftHeading: string;
  giftMode: "envelope" | "qr";
  avatars: { groom: string; bride: string };
}

const DD_RED_PALETTE: DdPalette = {
  red: "#882925",
  linen: "#ECDFD6",
  gray: "#464646",
  lunar: "(Tức ngày 14/12 năm Ất Tỵ)",
  groomLabel: "Trưởng Nam",
  brideLabel: "Út Nữ",
  giftHeading: "Phong Bao Mừng Cưới",
  giftMode: "envelope",
  avatars: {
    groom: "/chungdoi/uploads/double-dragon-red/800e73ae-d21f-4bbd-8546-cd7bb9399e45.jpg",
    bride: "/chungdoi/uploads/double-dragon-red/bf33d754-3356-434c-ab17-4e0d07257698.jpg",
  },
};

const DD_BLUE_PALETTE: DdPalette = {
  red: "#253F78",
  linen: "#E8ECD6",
  gray: "#464646",
  lunar: "(Tức ngày 12/09 năm Ất Tỵ)",
  groomLabel: "Út Nam",
  brideLabel: "Thứ Nữ",
  giftHeading: "Phong Bao Mừng Cưới",
  giftMode: "envelope",
  avatars: {
    groom: "/chungdoi/uploads/double-dragon-blue/ff30b091-fbe1-4f66-8163-be41d70554d6.jpg",
    bride: "/chungdoi/uploads/double-dragon-blue/26477c03-eb5a-4486-b06b-74ea917b48e1.jpg",
  },
};

function DdTexture({ posY, opacity = 0.25 }: { posY: string; opacity?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ backgroundImage: `url("${DD_TEX}")`, backgroundSize: "clamp(300px, 50vw, 500px)", backgroundPositionY: posY, mixBlendMode: "color-dodge", opacity }}
    />
  );
}

function DdRedBand({ children, red, linen }: { children: React.ReactNode; red: string; linen: string }) {
  return (
    <div className="w-full py-3 md:py-4" style={{ backgroundColor: red }}>
      <h2 className="flex flex-col items-center text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: linen, fontFamily: DD_TNR }}>
        {children}
      </h2>
    </div>
  );
}

function DoubleDragonWishForm({ red }: { red: string }) {
  const { formProps, pending, state } = useWishFormBinding();

  return (
    <form {...formProps} className="mx-auto mt-6 w-full max-w-full md:max-w-[600px]">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-4">
          <input name="name" required maxLength={120} placeholder="Nhập tên của bạn*" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200" type="text" />
        </div>
        <textarea name="text" required maxLength={1000} placeholder="Nhập lời chúc của bạn*" rows={4} className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200" style={{ resize: "none" }} />
        {state?.error ? <p className="mt-3 text-sm text-red-600">{state.error}</p> : null}
        {state?.ok ? <p className="mt-3 text-sm" style={{ color: red }}>Cảm ơn lời chúc của bạn!</p> : null}
        <div className="mt-4 flex items-center justify-end text-xs">
          <button type="submit" disabled={pending} className="rounded-full px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-60 sm:px-8 sm:py-3 sm:text-base" style={{ backgroundColor: red }}>{pending ? "Đang gửi..." : "GỬI LỜI CHÚC"}</button>
        </div>
      </div>
    </form>
  );
}

function DoubleDragonInvitation({ content, palette = DD_RED_PALETTE }: { content: ChungDoiDemoContent; palette?: DdPalette }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const DD_RED = palette.red;
  const DD_LINEN = palette.linen;
  const DD_GRAY = palette.gray;
  const DD_AVATARS = palette.avatars;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();

  const bankCards = orderByBrideFirst(
    { label: `Cô Dâu - ${content.bank.brideAccountName}`, bank: content.bank.brideBankName, num: content.bank.brideAccountNumber, name: content.bank.brideAccountName },
    { label: `Chú Rể - ${content.bank.groomAccountName}`, bank: content.bank.groomBankName, num: content.bank.groomAccountNumber, name: content.bank.groomAccountName },
    couple.brideFirst,
  ).filter((q) => q.bank);
  const { bride, groom } = invitationCouple(content);
  const avatarCards = orderByBrideFirst(
    { src: DD_AVATARS.bride, person: bride, label: couple.brideBirthOrder || palette.brideLabel },
    { src: DD_AVATARS.groom, person: groom, label: couple.groomBirthOrder || palette.groomLabel },
    couple.brideFirst,
  ).map((card) => ({
    ...card,
    src: card.person.heroPhoto || card.src,
  }));
  const familyColumns = orderByBrideFirst(
    { title: families.brideParentTitle || "Ông bà", a: families.brideFather, b: families.brideMother, addr: families.brideAddress },
    { title: families.groomParentTitle || "Ông bà", a: families.groomFather, b: families.groomMother, addr: families.groomAddress },
    couple.brideFirst,
  );

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div className="relative flex w-full max-w-[480px] flex-col overflow-hidden md:mx-auto md:max-w-[900px] md:border md:border-[#88292522]" style={{ backgroundColor: DD_LINEN }}>
        {/* top red band */}
        <div className="relative h-12 w-full sm:h-16 md:h-[128px]" style={{ backgroundColor: DD_RED }}>
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `url("${DD_TEX}")`, backgroundSize: "clamp(300px, 50vw, 500px)" }} />
        </div>

        {/* header: 囍 divider + avatars */}
        <div className="relative w-full overflow-hidden px-2 py-6 sm:py-8 md:py-10" style={{ backgroundColor: DD_LINEN }}>
          <DdTexture posY="50%" />
          <div className="absolute left-0 right-0 top-[66px] z-10 h-[40px] sm:top-[88px] sm:h-[50px] md:top-[125px] md:h-[70px]" style={{ backgroundColor: DD_RED }}>
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `url("${DD_TEX}")`, backgroundSize: "clamp(300px, 50vw, 500px)", backgroundPositionY: "30%" }} />
            <img alt="" src={DD_HY} className="absolute left-1/2 top-1/2 h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 sm:h-[70px] sm:w-[70px] md:h-[96px] md:w-[96px]" />
          </div>
          <div className="pointer-events-none relative z-20 flex items-start justify-center gap-2 sm:gap-4">
            <div className="pointer-events-auto flex min-w-0 flex-1 flex-col items-center">
              <img src={avatarCards[0].src} alt={avatarCards[0].person.shortName} className="h-[120px] w-[120px] rounded-full object-cover sm:h-[160px] sm:w-[160px] md:h-[240px] md:w-[240px]" />
              <div className="mt-2 text-xs font-light sm:mt-3 sm:text-sm md:mt-4 md:text-base" style={{ color: DD_GRAY }}>{avatarCards[0].label}</div>
              <div className="whitespace-nowrap text-2xl sm:text-3xl md:text-4xl" style={{ color: DD_RED, fontFamily: '"Fz Aghita", cursive' }}>{avatarCards[0].person.shortName}</div>
            </div>
            <div className="w-[52px] shrink-0 sm:w-[70px] md:w-[96px]" />
            <div className="pointer-events-auto flex min-w-0 flex-1 flex-col items-center">
              <img src={avatarCards[1].src} alt={avatarCards[1].person.shortName} className="h-[120px] w-[120px] rounded-full object-cover sm:h-[160px] sm:w-[160px] md:h-[240px] md:w-[240px]" />
              <div className="mt-2 text-xs font-light sm:mt-3 sm:text-sm md:mt-4 md:text-base" style={{ color: DD_GRAY }}>{avatarCards[1].label}</div>
              <div className="whitespace-nowrap text-2xl sm:text-3xl md:text-4xl" style={{ color: DD_RED, fontFamily: '"Fz Aghita", cursive' }}>{avatarCards[1].person.shortName}</div>
            </div>
          </div>
        </div>

        <DdRedBand red={DD_RED} linen={DD_LINEN}>THÔNG TIN LỄ CƯỚI</DdRedBand>

        {/* family + báo tin + ceremony */}
        <div className="relative w-full overflow-hidden" style={{ backgroundColor: DD_LINEN }}>
          <DdTexture posY="10%" />
          <div className="relative z-10">
            {/* Mobile: hai họ xếp thành hai dòng để mỗi tên có trọn chiều rộng thẻ,
                không bị cắt bởi overflow-hidden của khung ngoài. */}
            <div className="mt-6 flex w-full flex-col items-center gap-6 px-2 sm:px-4 md:flex-row md:items-start md:justify-center md:gap-8" style={{ color: DD_RED, fontFamily: DD_SERIF }}>
              {familyColumns.map((f, i) => (
                <div key={i} className="contents">
                  {i === 1 ? <div className="h-px w-16 self-center md:h-[60px] md:w-px" style={{ backgroundColor: DD_RED }} /> : null}
                  <div className="flex min-w-0 max-w-[160px] flex-1 flex-col items-center gap-1 text-center md:max-w-[280px]">
                    <span className="text-[14px] md:text-[15px]" style={{ color: DD_GRAY }}>{f.title}</span>
                    <span className="font-semibold" style={{ color: DD_RED, fontSize: 15 }}>{f.a}</span>
                    <span className="font-semibold" style={{ color: DD_RED, fontSize: 15 }}>{f.b}</span>
                    <div className="mt-1 flex flex-col whitespace-pre-line text-[12px] leading-tight md:text-[13px]" style={{ color: DD_GRAY }}>{f.addr}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-2 whitespace-pre-line px-4 text-center text-[16px] uppercase tracking-wider md:text-[20px]" style={{ color: DD_RED, fontFamily: DD_SERIF }}>
              {couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI."}
            </div>

            <div className="relative mb-6 mt-4 flex flex-col items-center gap-3 text-center md:gap-4">
              <h3 className="font-qellia flex w-full items-center justify-center leading-[1.15] md:leading-[100px]" style={{ fontSize: "clamp(34px, 9vw, 64px)", color: DD_RED, wordBreak: "keep-all" }}>{people[0].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: DD_GRAY, fontFamily: DD_SERIF }}>{people[0].birthOrder}</div>
              <div className="font-qellia text-[30px] md:text-[35px]" style={{ color: DD_GRAY }}>&amp;</div>
              <h3 className="font-qellia flex w-full items-center justify-center leading-[1.15] md:leading-[100px]" style={{ fontSize: "clamp(34px, 9vw, 64px)", color: DD_RED, wordBreak: "keep-all" }}>{people[1].fullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: DD_GRAY, fontFamily: DD_SERIF }}>{people[1].birthOrder}</div>
            </div>

            <div className="flex w-full flex-col items-center justify-center px-4 py-8 sm:px-6" style={{ color: DD_GRAY, fontFamily: DD_SERIF }}>
              <div style={{ color: DD_RED }}>
                <span className="flex flex-col items-center whitespace-pre-line text-center text-[16px] leading-relaxed md:text-[20px]">{invitationCeremonyMessage(content)}</span>
              </div>
              {couple.ceremonyTime ? <p className="mt-2 text-center text-[14px] uppercase md:text-[15px]" style={{ color: DD_GRAY }}>Vào lúc {couple.ceremonyTime}</p> : null}
              {ceremony ? (
                <>
                  <div className="mt-5 flex items-center justify-center" style={{ color: DD_RED }}>
                    <span className="w-[70px] whitespace-nowrap text-right text-[14px] uppercase md:w-[85px] md:text-[15px]" style={{ color: DD_GRAY }}>{ceremony.weekday}</span>
                    <span className="mx-3 h-[25px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: DD_GRAY }} />
                    <span className="text-[32px] md:text-[38px]" style={{ color: DD_RED }}>{ceremony.day}</span>
                    <span className="mx-3 h-[25px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: DD_GRAY }} />
                    <span className="w-[70px] whitespace-nowrap text-left text-[14px] uppercase md:w-[85px] md:text-[15px]" style={{ color: DD_GRAY }}>Tháng {ceremony.month}</span>
                  </div>
                  <div className="mt-2 text-center text-[20px] md:text-[22px]" style={{ color: DD_GRAY }}>{ceremony.yearNumber}</div>
                  <div className="mt-2 text-center text-[13px] uppercase tracking-wide md:text-[14px]" style={{ color: DD_GRAY }}>{ceremony.lunar}</div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {gallery.length > 0 ? (
          <>
            <DdRedBand red={DD_RED} linen={DD_LINEN}>Album Ảnh Cưới</DdRedBand>
            <div className="relative w-full overflow-hidden" style={{ backgroundColor: DD_LINEN }}>
              <DdTexture posY="40%" />
              <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center px-2 py-4 sm:px-4">
                <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={DD_RED} gridAspect="aspect-square" />
              </div>
            </div>
          </>
        ) : null}

        {reception ? (
          <>
            <DdRedBand red={DD_RED} linen={DD_LINEN}>THÔNG TIN TIỆC CƯỚI</DdRedBand>
            <div className="relative w-full overflow-hidden" style={{ backgroundColor: DD_LINEN }}>
              <DdTexture posY="60%" />
              <div className="relative z-10 -mt-[1px] flex w-full flex-col items-center justify-center px-2 pb-8 pt-6 sm:px-4">
                <h3 className="flex flex-col items-center text-center text-[16px] uppercase md:text-[20px]" style={{ color: DD_RED, fontFamily: DD_SERIF }}>Tiệc cưới sẽ diễn ra vào lúc:</h3>
                <div className="mt-2 text-center text-[20px] font-semibold md:text-[24px]" style={{ color: DD_RED, fontFamily: DD_SERIF }}>{venue.banquetTime || couple.time}</div>
                <div className="mt-5 flex items-center justify-center" style={{ fontFamily: DD_SERIF }}>
                  <span className="w-[70px] whitespace-nowrap text-right text-[14px] uppercase md:w-[85px] md:text-[15px]" style={{ color: DD_GRAY }}>{reception.weekday}</span>
                  <span className="mx-3 h-[25px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: DD_GRAY }} />
                  <span className="text-[32px] md:text-[38px]" style={{ color: DD_RED }}>{reception.day}</span>
                  <span className="mx-3 h-[25px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: DD_GRAY }} />
                  <span className="w-[70px] whitespace-nowrap text-left text-[14px] uppercase md:w-[85px] md:text-[15px]" style={{ color: DD_GRAY }}>Tháng {reception.month}</span>
                </div>
                <div className="mt-2 text-center text-[20px] md:text-[22px]" style={{ color: DD_GRAY }}>{reception.yearNumber}</div>
                <div className="mt-2 text-center text-[13px] md:text-[14px]" style={{ color: DD_GRAY }}>{reception.lunar}</div>
                {schedule.length > 0 ? (
                  <div className="mt-4 flex items-center justify-center gap-8">
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] uppercase" style={{ color: DD_GRAY, fontFamily: DD_SERIF }}>{schedule[1]?.label || schedule[0].label}</span>
                      <span className="mt-1 text-[20px] font-semibold" style={{ color: DD_RED, fontFamily: DD_SERIF }}>{venue.banquetTime || couple.time}</span>
                    </div>
                  </div>
                ) : null}
                {calendar ? (
                  <div className="mx-auto mt-2 w-[296px] max-w-full md:w-[352px]">
                    <div className="mx-auto w-full overflow-hidden rounded-lg border" style={{ borderColor: hexToRgba(DD_RED, 0.27), color: DD_RED }}>
                      <div className="border-b py-2.5 text-center text-[13px] font-semibold tracking-wide md:text-[14px]" style={{ borderColor: hexToRgba(DD_RED, 0.27) }}>Tháng {calendar.month} / {calendar.year}</div>
                      <div className="grid grid-cols-7 border-b-2" style={{ borderColor: DD_RED }}>
                        {WEEKDAY_LABELS.map((d) => (<div key={d} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{d}</div>))}
                      </div>
                      <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                        {calendar.cells.map((day, i) => (
                          <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                            {day === calendar.highlight ? (
                              <div className="relative flex h-[24px] w-[26px] items-center justify-center md:h-[28px] md:w-[30px]">
                                <svg viewBox="0 0 24 22" className="absolute inset-0 h-full w-full drop-shadow-sm" fill={DD_RED}>
                                  <path d="M12 21C12 21 1.5 13.5 1.5 7.5C1.5 4.46 3.96 2 7 2C8.76 2 10.35 2.81 11.4 4.09L12 4.8L12.6 4.09C13.65 2.81 15.24 2 17 2C20.04 2 22.5 4.46 22.5 7.5C22.5 13.5 12 21 12 21Z" />
                                </svg>
                                <span className="relative z-10 text-[11px] font-bold md:text-[12px]" style={{ color: "#fff" }}>{day}</span>
                              </div>
                            ) : day ? (<span className="text-[12px] md:text-[13px]">{day}</span>) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
                <a href={googleCalendarUrl(content)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center justify-center text-sm tracking-wide underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70" style={{ color: DD_RED, fontFamily: DD_SERIF }}>Thêm vào lịch</a>
                <button type="button" className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-full px-10 text-sm font-semibold uppercase tracking-wide" style={{ backgroundColor: DD_RED, color: DD_LINEN }}>Xác Nhận</button>
              </div>
            </div>
          </>
        ) : null}

        {mapQuery ? (
          <>
            <DdRedBand red={DD_RED} linen={DD_LINEN}>Tiệc cưới sẽ tổ chức tại</DdRedBand>
            <div className="relative flex w-full flex-col items-center overflow-hidden pb-10" style={{ backgroundColor: DD_LINEN }}>
              <DdTexture posY="70%" />
              <div className="relative z-10 flex w-full flex-col items-center">
                <div className="mt-6 flex w-[92%] max-w-3xl flex-col items-center whitespace-pre-line break-words rounded-lg p-4 text-center text-sm font-medium md:text-base" style={{ backgroundColor: DD_LINEN, color: DD_GRAY, fontFamily: DD_SERIF }}>{venue.address}</div>
                <InvitationMap query={mapQuery} title={mapQuery} className="mt-4 h-[350px] w-[92%] max-w-3xl rounded-xl md:h-[450px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                <MapDirectionsButton query={mapQuery} style={{ color: DD_RED, fontFamily: DD_SERIF }} />
              </div>
            </div>
          </>
        ) : null}

        {schedule.length > 0 ? (
          <div className="relative w-full overflow-hidden" style={{ backgroundColor: DD_LINEN }}>
            <DdTexture posY="75%" />
            <div className="relative z-10 mb-10 mt-10 flex flex-col gap-6 px-4 md:mb-12 md:mt-12 md:gap-8">
              <h2 className="flex flex-col items-center text-center text-[20px] font-bold uppercase tracking-wide md:text-[24px]" style={{ color: DD_RED, fontFamily: DD_TNR }}>LỊCH TRÌNH NGÀY CƯỚI</h2>
              <ol className="relative mx-auto grid w-full max-w-[460px] grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10" style={{ fontFamily: DD_SERIF }}>
                {schedule.map((s, i) => (
                  <li key={`${s.time}-${i}`} className="contents">
                    <span className="pt-0.5 text-right text-[16px] leading-snug tabular-nums tracking-wide md:text-[17px]" style={{ color: DD_RED }}>{s.time}</span>
                    <span aria-hidden="true" className="relative flex items-center justify-center self-stretch">
                      {i > 0 ? <span className="absolute left-1/2 -top-8 h-8 w-px -translate-x-1/2 md:-top-10" style={{ backgroundColor: hexToRgba(DD_RED, 0.4) }} /> : null}
                      <span className="relative block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DD_RED, boxShadow: `0 0 0 2px ${hexToRgba(DD_RED, 0.13)}` }} />
                      {i < schedule.length - 1 ? <span className="absolute bottom-1/2 left-1/2 top-1/2 w-px -translate-x-1/2 md:-bottom-10" style={{ backgroundColor: hexToRgba(DD_RED, 0.4) }} /> : null}
                    </span>
                    <span className="pt-0.5 text-left text-[17px] font-medium leading-snug md:text-[19px]" style={{ color: DD_GRAY }}>{s.label}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}

        <DdRedBand red={DD_RED} linen={DD_LINEN}>Sổ lưu bút</DdRedBand>
        <div className="relative w-full overflow-hidden" style={{ backgroundColor: DD_LINEN }}>
          <DdTexture posY="85%" />
          <div className="relative z-10 px-4 py-10">
            <DoubleDragonWishForm red={DD_RED} />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y [-webkit-overflow-scrolling:touch] mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                {wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-lg border border-gray-100 bg-white p-4 shadow-md">
                    <div className="flex items-start justify-between">
                      <span className="text-lg" style={{ color: DD_RED, fontFamily: DD_TNR }}>{w.name}</span>
                      <span className="text-xs opacity-70" style={{ color: DD_GRAY }}>{formatWishTime(w.time)}</span>
                    </div>
                    <p className="mt-2 leading-relaxed" style={{ color: DD_GRAY }}>{w.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {bankCards.length > 0 ? (
          <>
            <div className="relative z-10 h-[80px] w-full" style={{ backgroundColor: DD_RED }}>
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `url("${DD_TEX}")`, backgroundSize: "clamp(300px, 50vw, 500px)" }} />
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center px-4 py-8" style={{ backgroundColor: DD_LINEN }}>
              {palette.giftMode === "envelope" ? (
                <GiftEnvelope templateSlug={content.slug} banks={bankCards} accent="#f4c76a" dark={DD_RED} cardBg={DD_LINEN} heading={palette.giftHeading} labelColor={DD_GRAY} />
              ) : (
                <GiftQrGrid banks={bankCards} heading={palette.giftHeading} accent={DD_RED} />
              )}
            </div>
          </>
        ) : null}

        <footer data-template-footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-7 text-center" style={{ backgroundColor: DD_LINEN }}>
          <span className="whitespace-pre-line text-[12px] md:text-[15px] lg:text-[18px]" style={{ fontFamily: DD_SERIF, color: DD_RED }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
        </footer>
        <div className="relative z-10 h-12 w-full overflow-hidden" style={{ backgroundColor: DD_RED }}><DdTexture posY="bottom" opacity={0.32} /></div>
        <div className="relative z-10 flex items-center justify-center py-3" style={{ backgroundColor: DD_LINEN }}>
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: DD_RED }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}

export function DoubleDragonRedInvitation({ content }: { content: ChungDoiDemoContent }) {
  return <DoubleDragonInvitation content={content} palette={DD_RED_PALETTE} />;
}

export function DoubleDragonBlueInvitation({ content }: { content: ChungDoiDemoContent }) {
  return <DoubleDragonInvitation content={content} palette={DD_BLUE_PALETTE} />;
}
