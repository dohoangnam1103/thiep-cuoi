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
  parseISODate,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";
import { invitationCeremonyMessage, invitationHeroSlots, orderedCouple, orderByBrideFirst } from "@/lib/invitation-display";

const SLX_GREEN = "#1F3A25";
const SLX_LINEN = "#ECE8D6";
const SLX_GRAY = "#464646";
const SLX_SERIF = 'Baskerville, "Times New Roman", serif';
const SLX_TNR = '"Times New Roman", serif';
const SLX_AVATARS = {
  groom: "/chungdoi/uploads/double-dragon-green/1de8aeab-1ffe-46a1-8cd6-a0752ba57b99.jpg",
  bride: "/chungdoi/uploads/double-dragon-green/d05db7ea-4eb0-4c23-96fc-89e96b693078.jpg",
};
const SLX_TEX = "/images/double-dragon.webp";
const KR_DAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
const KR_SCHEDULE: Record<string, string> = {
  "Đón khách": "하객 맞이",
  "Khai tiệc": "피로연",
  "Rót rượu, cắt bánh": "건배 및 케이크 컷팅",
  "Phục vụ món chính": "메인 요리",
  "Kết thúc tiệc": "환송",
};

function shiftTime(hhmm: string, deltaMin: number) {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const total = (h * 60 + m + deltaMin + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function SlxBand({ vi, ko }: { vi: string; ko: string }) {
  return (
    <div className="w-full py-3 md:py-4" style={{ backgroundColor: SLX_GREEN }}>
      <h2 className="flex flex-col items-center gap-0.5 text-center uppercase tracking-wide" style={{ color: SLX_LINEN, fontFamily: SLX_TNR }}>
        <span className="text-[20px] font-bold md:text-[24px]">{vi}</span>
        <span className="text-[12px] font-normal normal-case opacity-80 md:text-[13px]">{ko}</span>
      </h2>
    </div>
  );
}

function SongLongXanhWishForm() {
  const { formProps, pending, state } = useWishFormBinding();

  return (
    <form {...formProps} className="mx-auto mt-6 w-full max-w-full md:max-w-[600px]">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-4">
          <input name="name" required maxLength={120} placeholder="Nhập tên của bạn* / 이름" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-200" type="text" />
        </div>
        <textarea name="text" required maxLength={1000} placeholder="Nhập lời chúc của bạn* / 축하 메시지" rows={4} className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-200" style={{ resize: "none" }} />
        {state?.error ? <p className="mt-2 text-sm text-red-600">{state.error}</p> : null}
        {state?.ok ? <p className="mt-2 text-sm" style={{ color: SLX_GREEN }}>Cảm ơn lời chúc của bạn!</p> : null}
        <div className="mt-4 flex items-center justify-end text-xs">
          <button type="submit" disabled={pending} className="rounded-full px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-60 sm:px-8 sm:py-3 sm:text-base" style={{ backgroundColor: SLX_GREEN }}>{pending ? "Đang gửi..." : "Gửi lời chúc / 축하 보내기"}</button>
        </div>
      </div>
    </form>
  );
}

export function SongLongXanhInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const ceremony = formatDate(couple.ceremonyDate);
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const recDate = parseISODate(couple.date);
  const krWeekday = recDate ? KR_DAYS[recDate.getDay()] : "";
  const ceremonyDate = parseISODate(couple.ceremonyDate);
  const ceremonyKrWeekday = ceremonyDate ? KR_DAYS[ceremonyDate.getDay()] : "";
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const banquetTime = venue.banquetTime || couple.time || "11:00";

  const bankCards = orderByBrideFirst(
    { label: `Cô Dâu - ${content.bank.brideAccountName}`, bank: content.bank.brideBankName, num: content.bank.brideAccountNumber, name: content.bank.brideAccountName },
    { label: `Chú Rể - ${content.bank.groomAccountName}`, bank: content.bank.groomBankName, num: content.bank.groomAccountNumber, name: content.bank.groomAccountName },
    couple.brideFirst,
  ).filter((q) => q.bank);
  const familyColumns = orderByBrideFirst(
    { a: families.brideFather, b: families.brideMother, addr: families.brideAddress, title: families.brideParentTitle || "Ông bà" },
    { a: families.groomFather, b: families.groomMother, addr: families.groomAddress, title: families.groomParentTitle || "Ông bà" },
    couple.brideFirst,
  );
  const heroSlots = invitationHeroSlots(content);
  const avatarCards = people.map((person, i) => ({
    person,
    src: heroSlots[i] || (person.side === "bride" ? SLX_AVATARS.bride : SLX_AVATARS.groom),
    sideLabel: person.side === "bride" ? "신부" : "신랑",
  }));

  return (
    <div className="flex w-full justify-center overflow-x-clip bg-white">
      <div className="relative flex w-full max-w-[480px] flex-col overflow-hidden md:mx-auto md:max-w-[900px] md:border md:border-[#1F3A2522]" style={{ backgroundColor: SLX_LINEN }}>
        {/* top green band */}
        <div className="relative h-12 w-full sm:h-16 md:h-[128px]" style={{ backgroundColor: SLX_GREEN }} />

        {/* header: 囍 divider + avatars */}
        <div className="relative w-full overflow-hidden px-2 py-6 sm:py-8 md:py-10" style={{ backgroundColor: SLX_LINEN }}>
          <div className="absolute left-0 right-0 top-[66px] z-10 h-[40px] sm:top-[88px] sm:h-[50px] md:top-[125px] md:h-[70px]" style={{ backgroundColor: SLX_GREEN }}>
            <img alt="" src="/images/chu-hy.webp" className="absolute left-1/2 top-1/2 h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 sm:h-[70px] sm:w-[70px] md:h-[96px] md:w-[96px]" />
          </div>
          <div className="pointer-events-none relative z-20 flex items-start justify-center gap-2 sm:gap-4">
            <div className="pointer-events-auto flex min-w-0 flex-1 flex-col items-center">
              <img src={avatarCards[0].src} alt={avatarCards[0].person.shortName} className="h-[120px] w-[120px] rounded-full object-cover sm:h-[160px] sm:w-[160px] md:h-[240px] md:w-[240px]" />
              <div className="mt-2 text-center text-xs font-light sm:mt-3 sm:text-sm md:mt-4 md:text-base" style={{ color: SLX_GRAY }}>{avatarCards[0].person.birthOrder} / {avatarCards[0].sideLabel}</div>
              <div className="whitespace-nowrap text-2xl sm:text-3xl md:text-4xl" style={{ color: SLX_GREEN, fontFamily: '"Fz Aghita", cursive' }}>{avatarCards[0].person.shortName}</div>
            </div>
            <div className="w-[52px] shrink-0 sm:w-[70px] md:w-[96px]" />
            <div className="pointer-events-auto flex min-w-0 flex-1 flex-col items-center">
              <img src={avatarCards[1].src} alt={avatarCards[1].person.shortName} className="h-[120px] w-[120px] rounded-full object-cover sm:h-[160px] sm:w-[160px] md:h-[240px] md:w-[240px]" />
              <div className="mt-2 text-center text-xs font-light sm:mt-3 sm:text-sm md:mt-4 md:text-base" style={{ color: SLX_GRAY }}>{avatarCards[1].person.birthOrder} / {avatarCards[1].sideLabel}</div>
              <div className="whitespace-nowrap text-2xl sm:text-3xl md:text-4xl" style={{ color: SLX_GREEN, fontFamily: '"Fz Aghita", cursive' }}>{avatarCards[1].person.shortName}</div>
            </div>
          </div>
        </div>

        <SlxBand vi="Thông Tin Lễ Cưới" ko="예식 안내" />

        {/* family + báo tin + ceremony */}
        <div className="relative w-full" style={{ backgroundColor: SLX_LINEN }}>
          <div className="mt-6 flex w-full items-start justify-center gap-3 px-2 sm:px-4 md:gap-8" style={{ color: SLX_GREEN, fontFamily: SLX_SERIF }}>
            {familyColumns.map((f, i) => (
              <div key={i} className="contents">
                {i === 1 ? <div className="h-[60px] w-px self-center" style={{ backgroundColor: SLX_GREEN }} /> : null}
                <div className="flex min-w-0 max-w-[160px] flex-1 flex-col items-center gap-1 text-center md:max-w-[280px]">
                  <span className="text-[14px] md:text-[15px]" style={{ color: SLX_GRAY }}>{f.title} / 부모님</span>
                  <span className="whitespace-nowrap font-semibold" style={{ color: SLX_GREEN, fontSize: 15 }}>{f.a}</span>
                  <span className="whitespace-nowrap font-semibold" style={{ color: SLX_GREEN, fontSize: 15 }}>{f.b}</span>
                  <div className="mt-1 flex flex-col whitespace-pre-line text-[12px] leading-tight md:text-[13px]" style={{ color: SLX_GRAY }}>{f.addr}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-1 px-4 text-center" style={{ color: SLX_GREEN, fontFamily: SLX_SERIF }}>
            <span className="whitespace-pre-line text-[16px] uppercase tracking-wider md:text-[20px]">{couple.openingMessage || "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI."}</span>
            <span className="text-[13px] opacity-80 md:text-[14px]">저희 자녀의 결혼을 알려드립니다</span>
          </div>

          <div className="relative mb-6 mt-4 flex flex-col items-center gap-3 text-center md:gap-4">
            <h3 className="font-qellia flex w-full items-center justify-center leading-[1.15] md:leading-[100px]" style={{ fontSize: "clamp(34px, 9vw, 64px)", color: SLX_GREEN, wordBreak: "keep-all" }}>{people[0].fullName}</h3>
            <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: SLX_GRAY, fontFamily: SLX_SERIF }}>{people[0].birthOrder}</div>
            <div className="font-qellia text-[30px] md:text-[35px]" style={{ color: SLX_GRAY }}>&amp;</div>
            <h3 className="font-qellia flex w-full items-center justify-center leading-[1.15] md:leading-[100px]" style={{ fontSize: "clamp(34px, 9vw, 64px)", color: SLX_GREEN, wordBreak: "keep-all" }}>{people[1].fullName}</h3>
            <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: SLX_GRAY, fontFamily: SLX_SERIF }}>{people[1].birthOrder}</div>
          </div>

          <div className="flex w-full flex-col items-center justify-center px-4 py-8 sm:px-6" style={{ color: SLX_GRAY, fontFamily: SLX_SERIF }}>
            <div className="flex flex-col items-center gap-1" style={{ color: SLX_GREEN }}>
              <span className="flex flex-col items-center whitespace-pre-line text-center text-[16px] leading-relaxed md:text-[20px]">{invitationCeremonyMessage(content)}</span>
              <span className="text-[13px] opacity-80 md:text-[14px]">결혼식 장소 자택</span>
            </div>
            {couple.ceremonyTime ? <p className="mt-2 text-center text-[14px] uppercase md:text-[15px]" style={{ color: SLX_GRAY }}>Vào lúc / 시간 {couple.ceremonyTime}</p> : null}
            {ceremony ? (
              <>
                <div className="mt-5 flex items-center justify-center" style={{ color: SLX_GREEN }}>
                  <span className="flex w-[70px] flex-col items-center whitespace-nowrap text-center text-[13px] uppercase md:w-[85px] md:text-[14px]" style={{ color: SLX_GRAY }}>
                    <span>{ceremony.weekday}</span>
                    <span className="normal-case opacity-80">{ceremonyKrWeekday}</span>
                  </span>
                  <span className="mx-3 h-[34px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: SLX_GRAY }} />
                  <span className="text-[32px] md:text-[38px]" style={{ color: SLX_GREEN }}>{ceremony.day}</span>
                  <span className="mx-3 h-[34px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: SLX_GRAY }} />
                  <span className="flex w-[70px] flex-col items-center whitespace-nowrap text-center text-[13px] uppercase md:w-[85px] md:text-[14px]" style={{ color: SLX_GRAY }}>
                    <span>Tháng {ceremony.month}</span>
                    <span className="normal-case opacity-80">{ceremony.monthNumber}월</span>
                  </span>
                </div>
                <div className="mt-2 text-center text-[20px] md:text-[22px]" style={{ color: SLX_GRAY }}>{ceremony.yearNumber}</div>
                <div className="mt-2 text-center text-[13px] uppercase tracking-wide md:text-[14px]" style={{ color: SLX_GRAY }}>{ceremony.lunar}</div>
              </>
            ) : null}
          </div>
        </div>

        {gallery.length > 0 ? (
          <>
            <SlxBand vi="Album Ảnh Cưới" ko="웨딩 앨범" />
            <div className="relative w-full" style={{ backgroundColor: SLX_LINEN }}>
              <div className="mx-auto w-full max-w-lg px-2 py-4 sm:px-4">
                <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={SLX_LINEN} gridAspect="aspect-square" />
              </div>
            </div>
          </>
        ) : null}

        {reception ? (
          <>
            <SlxBand vi="Thông Tin Tiệc Cưới" ko="피로연 안내" />
            <div className="relative w-full" style={{ backgroundColor: SLX_LINEN }}>
              <div className="-mt-[1px] flex w-full flex-col items-center justify-center px-2 pb-8 pt-6 sm:px-4">
                <h3 className="flex flex-col items-center gap-0.5 text-center text-[16px] uppercase md:text-[20px]" style={{ color: SLX_GREEN, fontFamily: SLX_SERIF }}>
                  <span>Tiệc cưới sẽ diễn ra vào lúc:</span>
                  <span className="text-[13px] normal-case opacity-80 md:text-[14px]">피로연 시간:</span>
                </h3>
                <div className="mt-2 text-center text-[20px] font-semibold md:text-[24px]" style={{ color: SLX_GREEN, fontFamily: SLX_SERIF }}>{banquetTime}</div>
                <div className="mt-5 flex items-center justify-center" style={{ fontFamily: SLX_SERIF }}>
                  <span className="flex w-[70px] flex-col items-center whitespace-nowrap text-center text-[13px] uppercase md:w-[85px] md:text-[14px]" style={{ color: SLX_GRAY }}>
                    <span>{reception.weekday}</span>
                    <span className="normal-case opacity-80">{krWeekday}</span>
                  </span>
                  <span className="mx-3 h-[34px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: SLX_GRAY }} />
                  <span className="text-[32px] md:text-[38px]" style={{ color: SLX_GREEN }}>{reception.day}</span>
                  <span className="mx-3 h-[34px] w-px self-center opacity-50 md:mx-4" style={{ backgroundColor: SLX_GRAY }} />
                  <span className="flex w-[70px] flex-col items-center whitespace-nowrap text-center text-[13px] uppercase md:w-[85px] md:text-[14px]" style={{ color: SLX_GRAY }}>
                    <span>Tháng {reception.month}</span>
                    <span className="normal-case opacity-80">{reception.monthNumber}월</span>
                  </span>
                </div>
                <div className="mt-2 text-center text-[20px] md:text-[22px]" style={{ color: SLX_GRAY }}>{reception.yearNumber}</div>
                <div className="mt-2 text-center text-[13px] md:text-[14px]" style={{ color: SLX_GRAY }}>{reception.lunar}</div>
                <div className="mt-4 flex items-center justify-center gap-10">
                  {[
                    { vi: "Đón khách", ko: "하객 맞이", time: shiftTime(banquetTime, -30) },
                    { vi: "Khai tiệc", ko: "피로연", time: banquetTime },
                  ].map((r) => (
                    <div key={r.vi} className="flex flex-col items-center">
                      <span className="text-[11px] uppercase" style={{ color: SLX_GRAY, fontFamily: SLX_SERIF }}>{r.vi}</span>
                      <span className="text-[10px] opacity-70" style={{ color: SLX_GRAY }}>{r.ko}</span>
                      <span className="mt-1 text-[20px] font-semibold" style={{ color: SLX_GREEN, fontFamily: SLX_SERIF }}>{r.time}</span>
                    </div>
                  ))}
                </div>
                {calendar ? (
                  <div className="mx-auto mt-4 w-[296px] max-w-full md:w-[352px]">
                    <div className="mx-auto w-full overflow-hidden rounded-lg border" style={{ borderColor: hexToRgba(SLX_GREEN, 0.27), color: SLX_GREEN }}>
                      <div className="border-b py-2.5 text-center text-[13px] font-semibold tracking-wide md:text-[14px]" style={{ borderColor: hexToRgba(SLX_GREEN, 0.27) }}>Tháng {calendar.month} / {calendar.year}</div>
                      <div className="grid grid-cols-7 border-b-2" style={{ borderColor: SLX_GREEN }}>
                        {WEEKDAY_LABELS.map((d) => (<div key={d} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{d}</div>))}
                      </div>
                      <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                        {calendar.cells.map((day, i) => (
                          <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                            {day === calendar.highlight ? (
                              <div className="relative flex h-[24px] w-[26px] items-center justify-center md:h-[28px] md:w-[30px]">
                                <svg viewBox="0 0 24 22" className="absolute inset-0 h-full w-full drop-shadow-sm" fill={SLX_GREEN}>
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
                <a href={googleCalendarUrl(content)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center justify-center text-sm tracking-wide underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70" style={{ color: SLX_GREEN, fontFamily: SLX_SERIF }}>Thêm vào lịch / 캘린더에 추가</a>
                <button type="button" className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-full px-10 text-sm font-semibold uppercase tracking-wide" style={{ backgroundColor: SLX_GREEN, color: SLX_LINEN }}>Xác Nhận / 참석 확인</button>
              </div>
            </div>
          </>
        ) : null}

        {mapQuery ? (
          <>
            <SlxBand vi="Tiệc cưới sẽ tổ chức tại" ko="피로연 장소" />
            <div className="relative flex w-full flex-col items-center pb-10" style={{ backgroundColor: SLX_LINEN }}>
              <div className="mt-6 flex w-[92%] max-w-3xl flex-col items-center whitespace-pre-line break-words rounded-lg p-4 text-center text-sm font-medium md:text-base" style={{ color: SLX_GRAY, fontFamily: SLX_SERIF }}>{venue.address}</div>
              <InvitationMap query={mapQuery} title={mapQuery} className="mt-4 h-[350px] w-[92%] max-w-3xl rounded-xl md:h-[450px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              <MapDirectionsButton query={mapQuery} style={{ color: SLX_GREEN, fontFamily: SLX_SERIF }} />
            </div>
          </>
        ) : null}

        {schedule.length > 0 ? (
          <div className="relative w-full" style={{ backgroundColor: SLX_LINEN }}>
            <div className="mb-10 mt-10 flex flex-col gap-6 px-4 md:mb-12 md:mt-12 md:gap-8">
              <h2 className="flex flex-col items-center gap-0.5 text-center uppercase tracking-wide" style={{ color: SLX_GREEN, fontFamily: SLX_TNR }}>
                <span className="text-[20px] font-bold md:text-[24px]">Lịch Trình Ngày Cưới</span>
                <span className="text-[12px] font-normal normal-case opacity-80 md:text-[13px]">웨딩 당일 일정</span>
              </h2>
              <ol className="relative mx-auto grid w-full max-w-[460px] grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10" style={{ fontFamily: SLX_SERIF }}>
                {schedule.map((s, i) => (
                  <li key={`${s.time}-${i}`} className="contents">
                    <span className="pt-0.5 text-right text-[16px] leading-snug tabular-nums tracking-wide md:text-[17px]" style={{ color: SLX_GREEN }}>{s.time}</span>
                    <span aria-hidden="true" className="relative flex items-center justify-center self-stretch">
                      {i > 0 ? <span className="absolute left-1/2 -top-8 h-8 w-px -translate-x-1/2 md:-top-10" style={{ backgroundColor: hexToRgba(SLX_GREEN, 0.4) }} /> : null}
                      <span className="relative block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SLX_GREEN, boxShadow: `0 0 0 2px ${hexToRgba(SLX_GREEN, 0.13)}` }} />
                      {i < schedule.length - 1 ? <span className="absolute bottom-1/2 left-1/2 top-1/2 w-px -translate-x-1/2 md:-bottom-10" style={{ backgroundColor: hexToRgba(SLX_GREEN, 0.4) }} /> : null}
                    </span>
                    <span className="flex flex-col pt-0.5 text-left leading-snug" style={{ color: SLX_GRAY }}>
                      <span className="text-[17px] font-medium md:text-[19px]">{s.label}</span>
                      {KR_SCHEDULE[s.label] ? <span className="text-[12px] opacity-70 md:text-[13px]">{KR_SCHEDULE[s.label]}</span> : null}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}

        <SlxBand vi="Sổ lưu bút" ko="방명록" />
        <div className="relative w-full" style={{ backgroundColor: SLX_LINEN }}>
          <div className="px-4 py-10">
            <SongLongXanhWishForm />
            {wishes.length > 0 ? (
              <div className="chungdoi-scroll touch-pan-y [-webkit-overflow-scrolling:touch] mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
                {wishes.map((w, i) => (
                  <div key={`${w.name}-${i}`} className="rounded-lg border border-gray-100 bg-white p-4 shadow-md">
                    <div className="flex items-start justify-between">
                      <span className="text-lg" style={{ color: SLX_GREEN, fontFamily: SLX_TNR }}>{w.name}</span>
                      <span className="text-xs opacity-70" style={{ color: SLX_GRAY }}>{formatWishTime(w.time)}</span>
                    </div>
                    <p className="mt-2 leading-relaxed" style={{ color: SLX_GRAY }}>{w.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {bankCards.length > 0 ? (
          <>
            <div className="relative z-10 h-[80px] w-full" style={{ backgroundColor: SLX_GREEN }} />
            <div className="relative z-10 flex flex-col items-center justify-center px-4 py-8" style={{ backgroundColor: SLX_LINEN }}>
              <GiftEnvelope banks={bankCards} accent="#f4c76a" dark={SLX_GREEN} cardBg={SLX_LINEN} heading="Phong Bao Mừng Cưới" labelColor={SLX_GRAY} />
              <span className="mt-1 text-[12px] opacity-80 md:text-[13px]" style={{ color: SLX_GREEN, fontFamily: SLX_SERIF }}>축의금</span>
            </div>
          </>
        ) : null}

        <footer data-template-footer className="relative z-10 flex w-full flex-col items-center justify-center gap-1 px-4 py-7 text-center" style={{ backgroundColor: SLX_LINEN }}>
          <span className="text-[12px] md:text-[15px] lg:text-[18px]" style={{ fontFamily: SLX_SERIF, color: SLX_GREEN }}>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
          <span className="text-[11px] opacity-80 md:text-[13px]" style={{ fontFamily: SLX_SERIF, color: SLX_GREEN }}>여러분의 참석은 저희 가족의 큰 영광입니다!</span>
        </footer>
        <div className="relative z-10 h-12 w-full overflow-hidden" style={{ backgroundColor: SLX_GREEN }}><div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url(${SLX_TEX})`, backgroundSize: "clamp(300px, 50vw, 500px)", mixBlendMode: "color-dodge" }} /></div>
        <div className="relative z-10 flex items-center justify-center py-3" style={{ backgroundColor: SLX_LINEN }}>
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: SLX_GREEN }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}
