"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  AlbumGallery,
  buildCalendar,
  buildVietQrImageUrl,
  CopyValueButton,
  DressCode,
  FAMILY_COLUMN_ROWS,
  FamilyColumn,
  formatDate,
  formatWishTime,
  googleCalendarUrl,
  hexToRgba,
  InvitationMap,
  MapDirectionsButton,
  SharedCountdown,
  SharedRsvpForm,
  SharedWishForm,
  SharedWishList,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";
import {
  invitationCeremonies,
  invitationGiftAccounts,
  invitationHeroImage,
  invitationOpeningMessage,
  orderByBrideFirst,
  orderedCouple,
} from "@/lib/invitation-display";

/** Thư mục asset của mẫu. Xem docs/research/hy-uoc-assets.md cho vai trò từng file. */
const HY = "/chungdoi/images/themes/hy-uoc";

const RED = "#990F16";
const IVORY = "#F8F0DF";
const GOLD = "#B58A4B";
const INK = "#34251F";

/** Nền giấy lặp theo TỪNG khối, không phải một tấm kéo giãn cả trang: ảnh gốc
 *  1254px vuông, kéo qua chiều cao ~8000px của thiệp là nhoè hết vân giấy. */
const IVORY_PAPER = {
  backgroundColor: IVORY,
  backgroundImage: `url(${HY}/paper-ivory.webp)`,
  backgroundSize: "420px 420px",
  backgroundRepeat: "repeat",
} as const;

const RED_PAPER = {
  backgroundColor: RED,
  backgroundImage: `url(${HY}/paper-red.webp)`,
  backgroundSize: "420px 420px",
  backgroundRepeat: "repeat",
} as const;

/** Dải đỏ ngăn giữa các phần, mang chữ Hỷ vàng ở hai đầu. */
function HyBand({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full overflow-hidden py-4 md:py-5" style={RED_PAPER}>
      <div className="relative flex items-center justify-center gap-3 px-4 md:gap-5">
        <img alt="" aria-hidden="true" src={`${HY}/double-happiness-gold.svg`} className="h-[18px] w-auto opacity-70 md:h-[22px]" />
        <h2 className="font-art-qellia text-center text-[21px] leading-tight tracking-[0.08em] md:text-[27px]" style={{ color: IVORY }}>
          {children}
        </h2>
        <img alt="" aria-hidden="true" src={`${HY}/double-happiness-gold.svg`} className="h-[18px] w-auto opacity-70 md:h-[22px]" />
      </div>
    </div>
  );
}

function GoldDivider({ className = "mt-6" }: { className?: string }) {
  return (
    <img
      alt=""
      aria-hidden="true"
      src={`${HY}/divider-gold.svg`}
      className={`mx-auto h-[14px] w-[220px] max-w-[70%] md:h-[18px] md:w-[300px] ${className}`}
    />
  );
}

/** Tên cô dâu chú rể: ba dòng riêng (tên · & · tên) để hai tên luôn cân nhau
 *  bất kể dài ngắn. Đây là yêu cầu chốt của mẫu, không đổi thành một dòng. */
function CoupleNames({ first, second, size }: { first: string; second: string; size: string }) {
  return (
    <div className="flex w-full flex-col items-center gap-1 text-center">
      <span className="font-art-qellia w-full leading-[1.15]" style={{ fontSize: size, color: RED }}>{first}</span>
      <span className="font-art-qellia leading-none" style={{ fontSize: `calc(${size} * 0.52)`, color: GOLD }}>&amp;</span>
      <span className="font-art-qellia w-full leading-[1.15]" style={{ fontSize: size, color: RED }}>{second}</span>
    </div>
  );
}

/** Một dòng ngày: THỨ · ngày · THÁNG, ngăn bằng vạch dọc mảnh. */
function HyDateRow({ weekday, day, month }: { weekday: string; day: string; month: string }) {
  return (
    <div className="mt-4 flex items-center justify-center">
      <span className="w-[74px] whitespace-nowrap text-right text-[13px] uppercase tracking-wide md:w-[92px] md:text-[15px]" style={{ color: hexToRgba(INK, 0.75) }}>{weekday}</span>
      <span className="mx-3 h-[26px] w-px self-center md:mx-4" style={{ backgroundColor: hexToRgba(GOLD, 0.6) }} />
      <span className="font-art-qellia text-[34px] leading-none md:text-[42px]" style={{ color: RED }}>{day}</span>
      <span className="mx-3 h-[26px] w-px self-center md:mx-4" style={{ backgroundColor: hexToRgba(GOLD, 0.6) }} />
      <span className="w-[74px] whitespace-nowrap text-left text-[13px] uppercase tracking-wide md:w-[92px] md:text-[15px]" style={{ color: hexToRgba(INK, 0.75) }}>Tháng {month}</span>
    </div>
  );
}

type HyGiftAccount = {
  label: string;
  holder: string;
  bank: string;
  num: string;
  qr: string;
};

/**
 * Phong bao mừng cưới: MẶT TRƯỚC là trạng thái mặc định (yêu cầu chốt của mẫu).
 * Thẻ QR nằm sau phong bao và chỉ trượt ra khi khách chủ động bấm — không tự
 * hiện, không lật sang mặt sau.
 *
 * Xếp lớp: lót phong bao (z0) → thẻ QR (z1) → mặt trước (z2) → chữ Hỷ + bảng tên (z3).
 */
type HyGiftCopy = {
  openLabel: string;
  openingLabel: string;
  hint: string;
  dialogTitle: string;
  dialogDescription: string;
  closeLabel: string;
  qrAlt: string;
  copyLabel: string;
  copiedLabel: string;
  saveLabel: string;
};

function HyGiftEnvelope({ account, copy }: { account: HyGiftAccount; copy: HyGiftCopy }) {
  const [revealed, setRevealed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const revealTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => () => {
    if (revealTimerRef.current !== null) window.clearTimeout(revealTimerRef.current);
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      if (revealTimerRef.current !== null) window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
      setDialogOpen(false);
      setRevealed(false);
      return;
    }

    setRevealed(true);
    if (reducedMotion) {
      setDialogOpen(true);
      return;
    }
    revealTimerRef.current = window.setTimeout(() => {
      revealTimerRef.current = null;
      setDialogOpen(true);
    }, 320);
  }

  return (
    <Dialog.Root open={dialogOpen} onOpenChange={handleOpenChange}>
      <div className="flex w-full max-w-[230px] flex-col items-center justify-self-center">
        <div className="relative w-full" style={{ aspectRatio: "300 / 600" }}>
          <div className="absolute inset-x-0 bottom-0" style={{ aspectRatio: "971 / 1619" }}>
            <img alt="" aria-hidden="true" src={`${HY}/envelope-liner.svg`} className="absolute inset-0 h-full w-full rounded-[4px] object-cover" />
          </div>

          <div
            className="hy-uoc-qr-card pointer-events-none absolute inset-x-[7%] bottom-[46%] z-[1] transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none"
            style={{
              transform: revealed ? "translateY(0)" : "translateY(46%)",
              opacity: revealed ? 1 : 0,
            }}
          >
            <div className="relative w-full" style={{ aspectRatio: "300 / 420" }}>
              <img alt="" aria-hidden="true" src={`${HY}/qr-card-ivory.svg`} className="absolute inset-0 h-full w-full" />
              <div className="absolute left-1/2 top-[12%] w-[62%] -translate-x-1/2 bg-white p-[3%]">
                <img alt={copy.qrAlt} src={account.qr} className="h-full w-full object-contain" />
              </div>
            </div>
          </div>

          <Dialog.Trigger
            data-testid="gift-envelope"
            disabled={revealed && !dialogOpen}
            aria-expanded={revealed || dialogOpen}
            aria-label={revealed ? copy.openingLabel : copy.openLabel}
            className="absolute inset-x-0 bottom-0 z-[2] block w-full cursor-pointer border-none bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait"
            style={{ aspectRatio: "971 / 1619" }}
          >
            <img alt="" aria-hidden="true" src={`${HY}/envelope-front.webp`} className="h-full w-full rounded-[4px] object-cover shadow-[0_14px_30px_-14px_rgba(0,0,0,0.45)]" />
            <img alt="" aria-hidden="true" src={`${HY}/double-happiness-gold.svg`} className="absolute left-1/2 top-[13%] z-[3] w-[22%] -translate-x-1/2" />
            <span className="absolute inset-x-[14%] top-[77%] z-[3] block">
              <span className="relative block w-full" style={{ aspectRatio: "320 / 88" }}>
                <img alt="" aria-hidden="true" src={`${HY}/nameplate-ivory.svg`} className="absolute inset-0 h-full w-full" />
                <span className="absolute inset-0 flex items-center justify-center px-1.5 text-center text-[9px] font-semibold leading-tight sm:text-[11px] md:text-[12px]" style={{ color: RED }}>
                  {account.holder}
                </span>
              </span>
            </span>
          </Dialog.Trigger>
        </div>
        <p className="mt-2 text-center text-[11px] tracking-wide" style={{ color: hexToRgba(INK, 0.72) }}>{copy.hint}</p>
      </div>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[130] bg-black/65 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto p-3 sm:p-5">
          <Dialog.Popup className="max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-[#F8F0DF] text-[#34251F] shadow-2xl outline-none transition data-[ending-style]:translate-y-3 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-3 data-[starting-style]:opacity-0 motion-reduce:transition-none">
            <div className="relative px-12 pb-5 pt-6 text-center" style={RED_PAPER}>
              <Dialog.Title className="font-art-qellia text-[25px] tracking-[0.05em]" style={{ color: IVORY }}>{copy.dialogTitle}</Dialog.Title>
              <Dialog.Description className="mt-1 text-[12px] leading-relaxed" style={{ color: hexToRgba(IVORY, 0.82) }}>{copy.dialogDescription}</Dialog.Description>
              <Dialog.Close aria-label={copy.closeLabel} className="absolute right-3 top-3 grid size-10 place-items-center rounded-full text-[#F8F0DF] transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8F0DF]">
                <X aria-hidden className="size-5" />
              </Dialog.Close>
            </div>
            <div className="flex flex-col items-center px-5 py-6 sm:px-7">
              <div className="w-[min(88vw,320px)] rounded-[6px] bg-white p-3 shadow-[0_12px_35px_-18px_rgba(52,37,31,0.55)]" style={{ border: `1px solid ${hexToRgba(GOLD, 0.55)}` }}>
                <img alt={copy.qrAlt} src={account.qr} className="aspect-square w-full object-contain" />
              </div>
              <p className="mt-5 text-[12px] uppercase tracking-[0.12em]" style={{ color: hexToRgba(INK, 0.7) }}>{account.bank}</p>
              <p className="mt-1 text-center text-sm font-semibold" style={{ color: RED }}>{account.holder}</p>
              <p className="mt-1 text-base font-semibold tabular-nums" style={{ color: INK }}>{account.num}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <CopyValueButton testId="gift-copy-account" value={account.num} accent={RED} label={copy.copyLabel} copiedLabel={copy.copiedLabel} />
                <a href={`${account.qr}&download=1`} download className="rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ borderColor: hexToRgba(GOLD, 0.7), color: RED }}>{copy.saveLabel}</a>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Hỷ Ước — thiệp đỏ son trên giấy ngà, chữ Hỷ làm mô-típ xuyên suốt.
 *
 * Bìa (một mặt liền, trượt lên) do `EnvelopeCover` dựng từ theme tokens; xem
 * `chungdoi-cover-variant-policy.ts`. File này là phần thân thiệp sau khi mở.
 */
export function HyUocInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const people = orderedCouple(content);
  const wedding = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const hero = invitationHeroImage(content);
  const ceremonies = invitationCeremonies(content);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const dressCodeColors = (content.dressCodeColors ?? "")
    .split(",")
    .map((color) => color.trim())
    .filter(Boolean)
    .map((color) => ({ color, border: hexToRgba(GOLD, 0.5) }));

  const familyColumns = orderByBrideFirst(
    { title: families.brideParentTitle || "Ông Bà", a: families.brideFather, b: families.brideMother, addr: families.brideAddress },
    { title: families.groomParentTitle || "Ông Bà", a: families.groomFather, b: families.groomMother, addr: families.groomAddress },
    couple.brideFirst,
  );

  const giftAccounts: HyGiftAccount[] = invitationGiftAccounts(content).flatMap((account) => {
    const qr = buildVietQrImageUrl({ bank: account.bank, accountNumber: account.num, accountName: account.name });
    // Tài khoản không dựng được QR thì không có gì để mở ra.
    if (!qr) return [];
    return [{
      label: account.birthOrder,
      holder: account.name,
      bank: account.bank,
      num: account.num,
      qr,
    }];
  });

  return (
    <div
      className="font-body-serif relative isolate mx-auto flex w-full max-w-[480px] flex-col overflow-hidden md:max-w-[900px] md:border"
      style={{ ...IVORY_PAPER, borderColor: hexToRgba(GOLD, 0.35) }}
    >
      <header className="relative w-full overflow-hidden px-4 pb-10 pt-24 md:px-10 md:pb-14 md:pt-12" style={IVORY_PAPER}>
        <img alt="" aria-hidden="true" src={`${HY}/double-happiness-red.svg`} className="mx-auto h-[46px] w-auto md:h-[58px]" />
        <p className="mt-4 text-center text-[11px] uppercase tracking-[0.34em] md:text-[13px]" style={{ color: hexToRgba(INK, 0.62) }}>
          Save the date
        </p>

        <div className="mx-auto mt-5 w-full max-w-[420px]">
          <CoupleNames first={people[0].fullName} second={people[1].fullName} size="clamp(28px, 8vw, 46px)" />
        </div>

        <div className="relative mx-auto mt-6 w-[74%] max-w-[300px]">
          <img alt="" aria-hidden="true" src={`${HY}/date-band-red.svg`} className="h-auto w-full" />
          <span className="absolute inset-0 flex items-center justify-center text-center text-[13px] font-semibold uppercase tracking-[0.2em] md:text-[15px]" style={{ color: IVORY }}>
            {wedding ? `${wedding.dayNumber}.${wedding.monthNumber}.${wedding.yearNumber}` : ""}
          </span>
        </div>

        {hero ? (
          <div className="relative mx-auto mt-8 w-[72%] max-w-[300px]">
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: "300 / 330", borderRadius: "150px 150px 4px 4px" }}>
              <img alt={`Ảnh cưới của ${people[0].shortName} và ${people[1].shortName}`} src={hero} className="h-full w-full object-cover" />
            </div>
            <img alt="" aria-hidden="true" src={`${HY}/photo-arch-frame.svg`} className="pointer-events-none absolute inset-0 h-full w-full" />
            <img alt="" aria-hidden="true" src={`${HY}/peony-sprig-gold.webp`} className="pointer-events-none absolute -bottom-5 -right-6 w-[78px] md:w-[100px]" />
          </div>
        ) : null}
      </header>

      <HyBand>Thông tin lễ cưới</HyBand>
      <section className="relative w-full overflow-hidden px-3 py-8 sm:px-5 md:px-10" style={IVORY_PAPER}>
        <div className="flex w-full flex-col items-center gap-6 sm:hidden" style={{ color: INK }}>
          <FamilyColumn {...familyColumns[0]} />
          <div className="h-px w-16" style={{ backgroundColor: hexToRgba(GOLD, 0.55) }} />
          <FamilyColumn {...familyColumns[1]} />
        </div>
        <div
          className="hidden w-full grid-cols-[1fr_auto_1fr] items-start gap-x-6 gap-y-1.5 sm:grid md:gap-x-10"
          style={{ gridTemplateRows: `repeat(${FAMILY_COLUMN_ROWS}, auto)`, color: INK }}
        >
          <FamilyColumn {...familyColumns[0]} sideBySideOnMobile />
          <div className="row-span-4 w-px self-stretch justify-self-center" style={{ backgroundColor: hexToRgba(GOLD, 0.55) }} />
          <FamilyColumn {...familyColumns[1]} sideBySideOnMobile />
        </div>

        <GoldDivider className="mt-8" />

        <p className="mt-6 whitespace-pre-line text-center text-[15px] uppercase leading-relaxed tracking-[0.08em] md:text-[19px]" style={{ color: RED }}>
          {invitationOpeningMessage(content)}
        </p>

        <div data-template-ceremonies>
          {ceremonies.map((ceremony, index) => {
            const ceremonyDate = formatDate(ceremony.date);
            return (
              <div data-template-ceremony-item key={`${ceremony.title}-${ceremony.date}-${ceremony.time}-${index}`} className="mt-8 flex flex-col items-center text-center">
                {ceremony.title ? (
                  <p className="font-art-qellia whitespace-pre-line text-[19px] leading-snug md:text-[24px]" style={{ color: RED }}>{ceremony.title}</p>
                ) : null}
                {ceremony.time ? (
                  <p className="mt-2 text-[13px] uppercase tracking-wide md:text-[15px]" style={{ color: hexToRgba(INK, 0.75) }}>Vào lúc {ceremony.time}</p>
                ) : null}
                {ceremonyDate ? <HyDateRow weekday={ceremonyDate.weekday.toUpperCase()} day={ceremonyDate.day} month={ceremonyDate.month} /> : null}
                {ceremonyDate ? <p className="mt-2 text-[13px] uppercase tracking-wide md:text-[14px]" style={{ color: hexToRgba(INK, 0.62) }}>{ceremonyDate.lunar}</p> : null}
              </div>
            );
          })}
        </div>
      </section>

      <HyBand>Thông tin tiệc cưới</HyBand>
      <section className="relative w-full overflow-hidden px-4 py-8 md:px-10" style={IVORY_PAPER}>
        <p className="text-center text-[15px] uppercase tracking-[0.08em] md:text-[19px]" style={{ color: RED }}>Tiệc cưới sẽ diễn ra vào lúc</p>
        <p className="font-art-qellia mt-2 text-center text-[30px] leading-none md:text-[38px]" style={{ color: RED }}>{venue.banquetTime || couple.time}</p>
        {wedding ? <HyDateRow weekday={wedding.weekday.toUpperCase()} day={wedding.day} month={wedding.month} /> : null}
        {wedding ? <p className="mt-2 text-center text-[13px] uppercase tracking-wide md:text-[14px]" style={{ color: hexToRgba(INK, 0.62) }}>{wedding.lunar}</p> : null}

        <p className="mt-8 text-center text-[13px] uppercase tracking-[0.2em]" style={{ color: hexToRgba(INK, 0.62) }}>Cùng đếm ngược</p>
        <SharedCountdown
          target={`${couple.date}T${couple.time || "18:00"}`}
          className="mt-2 text-center text-[17px] font-semibold tabular-nums md:text-[20px]"
          style={{ color: RED }}
        />

        {calendar ? (
          <div className="mx-auto mt-7 w-[300px] max-w-full md:w-[356px]">
            <div className="overflow-hidden rounded-[4px] border" style={{ borderColor: hexToRgba(GOLD, 0.55), color: RED }}>
              <div className="border-b py-2.5 text-center text-[13px] font-semibold tracking-wide md:text-[14px]" style={{ borderColor: hexToRgba(GOLD, 0.4) }}>
                Tháng {calendar.month} / {calendar.year}
              </div>
              <div className="grid grid-cols-7 border-b" style={{ borderColor: hexToRgba(GOLD, 0.4) }}>
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="py-1.5 text-center text-[10px] font-medium opacity-70 md:text-[11px]">{label}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                {calendar.cells.map((day, index) => (
                  <div key={index} className="flex h-[30px] items-center justify-center md:h-[34px]">
                    {day === calendar.highlight ? (
                      <span className="flex size-[26px] items-center justify-center rounded-full text-[12px] font-bold md:size-[30px]" style={{ backgroundColor: RED, color: IVORY }}>{day}</span>
                    ) : day ? (
                      <span className="text-[12px] md:text-[13px]" style={{ color: hexToRgba(INK, 0.8) }}>{day}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex justify-center">
          <a href={googleCalendarUrl(content)} target="_blank" rel="noopener noreferrer" className="text-[13px] tracking-wide underline decoration-1 underline-offset-4" style={{ color: RED }}>
            Thêm vào lịch
          </a>
        </div>
      </section>

      {gallery.length > 0 ? (
        <>
          <HyBand>Album ảnh cưới</HyBand>
          <section className="relative w-full overflow-hidden px-4 py-8 md:px-10" style={IVORY_PAPER}>
            <div className="mx-auto w-full max-w-[560px]">
              <AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={RED} gridAspect="aspect-[3/4]" radiusClass="rounded-[4px]" gridVariant="feature" modalLightbox />
            </div>
          </section>
        </>
      ) : null}

      {schedule.length > 0 ? (
        <>
          <HyBand>Lịch trình ngày cưới</HyBand>
          <section className="relative w-full overflow-hidden px-4 py-8 md:px-10" style={IVORY_PAPER}>
            <ol className="mx-auto grid w-full max-w-[440px] grid-cols-[minmax(0,1fr)_14px_minmax(0,1fr)] items-center gap-x-5 gap-y-7">
              {schedule.map((item, index) => (
                <li key={`${item.time}-${index}`} className="contents">
                  <span className="text-right text-[15px] tabular-nums tracking-wide md:text-[17px]" style={{ color: RED }}>{item.time}</span>
                  <span aria-hidden="true" className="flex items-center justify-center">
                    <span className="block size-2 rotate-45" style={{ backgroundColor: GOLD }} />
                  </span>
                  <span className="text-left text-[15px] leading-snug md:text-[17px]" style={{ color: hexToRgba(INK, 0.82) }}>{item.label}</span>
                </li>
              ))}
            </ol>
          </section>
        </>
      ) : null}

      {mapQuery ? (
        <>
          <HyBand>Tiệc cưới tổ chức tại</HyBand>
          <section className="relative w-full overflow-hidden px-4 py-8 md:px-10" style={IVORY_PAPER}>
            <p className="whitespace-pre-line text-center text-[14px] font-medium leading-relaxed md:text-[16px]" style={{ color: hexToRgba(INK, 0.82) }}>{venue.address}</p>
            <InvitationMap query={mapQuery} title={mapQuery} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" className="mx-auto mt-5 h-[330px] w-full max-w-[620px] rounded-[4px] md:h-[430px]" />
            <div className="mt-4 flex justify-center">
              <MapDirectionsButton query={mapQuery} style={{ color: RED }} />
            </div>
          </section>
        </>
      ) : null}

      {dressCodeColors.length > 0 ? (
        <section className="relative w-full overflow-hidden px-4 py-9 md:px-10" style={IVORY_PAPER}>
          <DressCode
            colors={dressCodeColors}
            heading={<h2 className="font-art-qellia text-center text-[22px] tracking-[0.06em] md:text-[27px]" style={{ color: RED }}>Trang phục</h2>}
            headingColor={RED}
            subColor={hexToRgba(INK, 0.66)}
          />
        </section>
      ) : null}

      <HyBand>Sổ lưu bút</HyBand>
      <section className="relative w-full overflow-hidden px-4 py-8 md:px-10" style={IVORY_PAPER}>
        <div className="mx-auto w-full max-w-[600px]">
          <SharedWishForm
            accent={RED}
            centered
            fieldBorderColor={hexToRgba(GOLD, 0.6)}
            submitTextColor={IVORY}
            previewNotice={t("formPreviewNotice")}
          />
          <SharedRsvpForm
            accent={RED}
            centered
            className="mt-8"
            heading={<h3 className="font-art-qellia mb-3 text-center text-[20px] tracking-[0.06em] md:text-[24px]" style={{ color: RED }}>{t("rsvpHeading")}</h3>}
            previewFallback={(
              <div className="mt-7 rounded-[4px] border px-4 py-4 text-center" style={{ borderColor: hexToRgba(GOLD, 0.45) }}>
                <h3 className="font-art-qellia text-[20px] tracking-[0.06em]" style={{ color: RED }}>{t("rsvpHeading")}</h3>
                <p className="mt-2 text-[12px] leading-relaxed" style={{ color: hexToRgba(INK, 0.7) }}>{t("rsvpPreviewNotice")}</p>
              </div>
            )}
          />
          <SharedWishList
            wishes={wishes}
            accent={RED}
            className="mt-8"
            showAllLabel="Xem tất cả"
            collapseLabel="Thu gọn"
            renderWish={(wish) => (
              <div className="rounded-[4px] border bg-white/70 p-3 text-[13px]" style={{ borderColor: hexToRgba(GOLD, 0.45), color: hexToRgba(INK, 0.85) }}>
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold" style={{ color: RED }}>{wish.name}</span>
                  <span className="text-[11px] opacity-70">{formatWishTime(wish.time)}</span>
                </div>
                <p className="mt-2 leading-relaxed">{wish.text}</p>
              </div>
            )}
          />
        </div>
      </section>

      {giftAccounts.length > 0 ? (
        <>
          <HyBand>Phong bao mừng cưới</HyBand>
          <section className="relative w-full overflow-hidden px-3 py-8 sm:px-5 md:px-10 md:py-9" style={IVORY_PAPER}>
            <div className={`mx-auto grid w-full max-w-[500px] items-start justify-items-center gap-3 sm:gap-8 ${giftAccounts.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {giftAccounts.map((account) => (
                <HyGiftEnvelope
                  key={`${account.bank}-${account.num}`}
                  account={account}
                  copy={{
                    openLabel: t("giftOpenEnvelope", { label: account.label }),
                    openingLabel: t("giftOpeningEnvelope", { label: account.label }),
                    hint: t("giftEnvelopeHint"),
                    dialogTitle: t("giftQrDialogTitle", { name: account.holder }),
                    dialogDescription: t("giftQrDialogDescription", { bank: account.bank }),
                    closeLabel: t("giftClose"),
                    qrAlt: t("giftQrAlt", { label: account.label }),
                    copyLabel: t("copyAccount"),
                    copiedLabel: t("accountCopied"),
                    saveLabel: t("saveQr"),
                  }}
                />
              ))}
            </div>
          </section>
        </>
      ) : null}

      <footer className="relative w-full overflow-hidden px-4 py-12 text-center md:px-10 md:py-14" style={IVORY_PAPER}>
        <img alt="" aria-hidden="true" src={`${HY}/peony-corner-gold.webp`} className="pointer-events-none absolute -bottom-8 -left-8 w-[150px] opacity-20 md:w-[220px]" />
        <img alt="" aria-hidden="true" src={`${HY}/peony-corner-gold.webp`} className="pointer-events-none absolute -right-8 -top-8 w-[150px] rotate-180 opacity-20 md:w-[220px]" />
        <img alt="" aria-hidden="true" src={`${HY}/double-happiness-red.svg`} className="relative z-10 mx-auto h-[34px] w-auto opacity-80 md:h-[42px]" />
        <div className="relative z-10 mx-auto mt-5 w-full max-w-[380px]">
          <CoupleNames first={people[0].fullName} second={people[1].fullName} size="clamp(22px, 6vw, 34px)" />
        </div>
        <GoldDivider className="mt-6" />
        <p data-template-footer className="mt-6 whitespace-pre-line text-[15px] leading-relaxed md:text-[17px]" style={{ color: hexToRgba(INK, 0.8) }}>
          Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!
        </p>
        <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="mt-6 inline-block text-[11px] opacity-60" style={{ color: INK }}>
          ♡ thiepmungonline.com
        </a>
      </footer>
    </div>
  );
}
