"use client";

import { useEffect, useRef } from "react";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { useWishFormBinding } from "@/components/chungdoi-live-forms";
import {
  buildCalendar,
  buildVietQrImageUrl,
  FamilyColumn,
  formatDate,
  formatWishTime,
  googleCalendarUrl,
  hexToRgba,
  Lightbox,
  InvitationMap,
  useLightbox,
  WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";

function PhoenixWishForm({ M }: { M: string }) {
  const { formProps, pending, state } = useWishFormBinding();

  return (
    <form {...formProps} className="mx-auto mt-6 w-full max-w-full md:max-w-[600px]">
      <div className="flex flex-col gap-3">
        <input name="name" required maxLength={120} className="w-full rounded-[6px] border px-4 py-2 text-[13px] outline-none" style={{ borderColor: hexToRgba(M, 0.3) }} placeholder="Tên của bạn" />
        <textarea name="text" rows={3} required maxLength={1000} className="w-full rounded-[6px] border px-4 py-2 text-[13px] outline-none" style={{ borderColor: hexToRgba(M, 0.3) }} placeholder="Lời chúc của bạn" />
        {state?.error ? <p className="text-[12px]" style={{ color: "#c0392b" }}>{state.error}</p> : null}
        {state?.ok ? <p className="text-[12px]" style={{ color: M }}>Cảm ơn lời chúc của bạn!</p> : null}
        <div className="mt-2 flex items-center justify-end">
          <button type="submit" disabled={pending} className="rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase disabled:opacity-60" style={{ backgroundColor: M, color: "#fff" }}>{pending ? "Đang gửi..." : "Gửi lời chúc"}</button>
        </div>
      </div>
    </form>
  );
}

/** Faithful rebuild of the Double Phoenix Red (song-phung-do) opened invitation. */
export function PhoenixInvitation({ content }: { content: ChungDoiDemoContent }) {
  const { couple, families, venue, schedule, gallery, wishes } = content;
  const SONGPHUNG = `/chungdoi/images/themes/${content.theme.assetFolder || "songphung-red"}`;
  const M = content.theme.primaryColor || "#710001";
  const CREAM = "#ffffff";
  const brideShort = couple.brideShortName || "Ngọc Ánh";
  const groomShort = couple.groomShortName || "Thế Bảo";
  const reception = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const galleryShown = gallery.slice(0, 4);
  const galleryExtra = Math.max(0, gallery.length - 4);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const { lightbox, setLightbox } = useLightbox(gallery.length);

  const parallaxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = parallaxRef.current;
    if (!root) return;
    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-parallax]"));
    let raf = 0;
    const update = () => {
      raf = 0;
      const scrolled = -root.getBoundingClientRect().top;
      for (const el of layers) {
        const speed = Number(el.dataset.parallax) || 0;
        const flip = el.dataset.flip === "1" ? " scaleX(-1)" : "";
        el.style.transform = `translateY(${(scrolled * speed).toFixed(2)}px)${flip}`;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="flex w-full justify-center overflow-x-clip" style={{ backgroundColor: CREAM, color: M }}>
      <div ref={parallaxRef} className="relative w-full max-w-[480px] overflow-hidden md:mx-auto md:max-w-[900px] md:border" style={{ borderColor: "#71000122" }}>
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{ backgroundImage: `url("${SONGPHUNG}/NENGIAY.jpg")`, backgroundSize: "100%", backgroundRepeat: "repeat-y", backgroundPosition: "center top", opacity: 0.3 }}
        />
        <div data-parallax="0.25" className="pointer-events-none absolute right-[50%] top-[800px] z-[5] overflow-hidden opacity-10 md:top-[1150px] lg:top-[1200px]" style={{ willChange: "transform", backfaceVisibility: "hidden" }}>
          <img src={`${SONGPHUNG}/Phuong line.webp`} alt="" className="h-[850px] w-auto object-contain md:h-[1594px]" style={{ objectPosition: "right top", maxWidth: "none" }} />
        </div>
        <div data-parallax="0.25" data-flip="1" className="pointer-events-none absolute left-[50%] top-[2000px] z-[5] overflow-hidden opacity-10 md:top-[2050px] lg:top-[2100px]" style={{ willChange: "transform", backfaceVisibility: "hidden" }}>
          <img src={`${SONGPHUNG}/Phuong line.webp`} alt="" className="h-[850px] w-auto object-contain md:h-[1594px]" style={{ objectPosition: "left top", maxWidth: "none" }} />
        </div>
        <div data-parallax="0.35" data-flip="1" className="pointer-events-none absolute left-[50%] top-[1050px] z-[5] overflow-hidden opacity-10 md:top-[1200px] lg:top-[1250px]" style={{ willChange: "transform", backfaceVisibility: "hidden" }}>
          <img src={`${SONGPHUNG}/HOA.webp`} alt="" className="h-[390px] w-auto object-contain md:h-[731px]" style={{ objectPosition: "left top", maxWidth: "none" }} />
        </div>
        <div data-parallax="0.45" className="pointer-events-none absolute right-[50%] top-[1750px] z-[5] overflow-hidden opacity-10 md:top-[2900px] lg:top-[2950px]" style={{ willChange: "transform", backfaceVisibility: "hidden" }}>
          <img src={`${SONGPHUNG}/HOA.webp`} alt="" className="h-[600px] w-auto object-contain md:h-[1125px]" style={{ objectPosition: "right top", maxWidth: "none" }} />
        </div>

        <header className="relative z-10 flex flex-col items-center justify-center pb-[180px] pt-12 text-center md:pb-[220px] md:pt-16">
          <div className="mb-6 w-full pl-6 text-left text-[36px] uppercase md:mb-8 md:ml-[80px] md:pl-8 md:text-[52px]" style={{ fontFamily: '"Fz Aghita", "Pattaya", cursive' }}>
            <div className="ml-[15px]">{brideShort}</div>
            <div className="ml-[50px] mt-[10px]">{groomShort}</div>
          </div>
          <div className="relative flex h-[260px] w-full items-center justify-center md:h-[488px]">
            <div className="absolute left-0 z-0 h-[110px] w-full md:h-[206px]" style={{ backgroundColor: M, top: "50%" }} />
            <div data-parallax="-0.15" className="absolute left-[-90px] top-0 z-10 h-[480px] w-[230px] md:left-[-169px] md:h-[900px] md:w-[431px]" style={{ willChange: "transform", backfaceVisibility: "hidden" }}>
              <img src={`${SONGPHUNG}/Phuong 2.webp`} alt="Phoenix Left" className="h-full w-full object-contain" style={{ objectPosition: "left center" }} />
            </div>
            <div className="relative z-20 h-[155px] w-[155px] md:h-[291px] md:w-[291px]">
              <img src={`${SONGPHUNG}/CHU HY.webp`} alt="囍" className="h-full w-full object-contain" />
            </div>
            <div data-parallax="0.15" data-flip="1" className="absolute top-[-120px] z-10 h-[320px] w-[155px] md:top-[-225px] md:h-[600px] md:w-[291px]" style={{ left: "calc(50% + 77.5px)", transform: "scaleX(-1)", willChange: "transform", backfaceVisibility: "hidden" }}>
              <img src={`${SONGPHUNG}/Phuong.webp`} alt="Phoenix Right" className="h-full w-full object-contain" style={{ objectPosition: "right center" }} />
            </div>
          </div>
        </header>

        <section className="relative z-10 px-6 py-10 md:px-4 md:py-14">
          <div data-parallax="0.1" data-flip="1" className="pointer-events-none absolute right-0 top-[-220px] z-[5] h-auto w-[192px] opacity-100 md:top-[-270px] md:w-[360px] lg:top-[-290px]" style={{ willChange: "transform", backfaceVisibility: "hidden", transform: "scaleX(-1)" }}>
            <img src={`${SONGPHUNG}/HOA.webp`} alt="Flower Background" className="h-auto w-full object-contain" />
          </div>
          <div className="mb-12 flex flex-col items-center gap-6 text-center md:mb-16 md:gap-8">
            <h2 className="relative z-10 text-[20px] font-bold uppercase md:text-[24px]">Thông Tin Lễ Cưới</h2>
            <div className="flex w-full items-start justify-center gap-3 md:gap-8">
              <FamilyColumn title="Ông Bà" a={families.brideFather} b={families.brideMother} addr={families.brideAddress} />
              <div className="h-[60px] w-px self-center" style={{ backgroundColor: hexToRgba(M, 0.4) }} />
              <FamilyColumn title="Ông Bà" a={families.groomFather} b={families.groomMother} addr={families.groomAddress} />
            </div>
            <div className="flex w-full flex-col items-center gap-2">
              <h3 className="font-qellia flex w-full items-center justify-center whitespace-nowrap text-[40px] leading-[52px] md:text-[64px] md:leading-[100px]">{couple.brideFullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]">{couple.brideBirthOrder || "Út Nữ"}</div>
              <div className="text-[35px] md:text-[48px]">&amp;</div>
              <h3 className="font-qellia flex w-full items-center justify-center whitespace-nowrap text-[40px] leading-[52px] md:text-[64px] md:leading-[100px]">{couple.groomFullName}</h3>
              <div className="text-[12px] uppercase tracking-[0.2em] md:text-[13px]">{couple.groomBirthOrder || "Út Nam"}</div>
            </div>
            <p className="whitespace-pre-line text-center text-[14px] md:text-[15px]">{couple.ceremonyHeader || "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA"}</p>
            {couple.ceremonyTime ? <p className="text-[14px] md:text-[15px]">Vào lúc {couple.ceremonyTime}</p> : null}
          </div>
        </section>

        {galleryShown.length > 0 ? (
          <section className="relative z-10 flex flex-col items-center px-6 py-6 md:px-8 md:py-10">
            <h2 className="mb-6 text-center text-[20px] font-bold uppercase md:text-[24px]">Album Ảnh Cưới</h2>
            <div className="w-full max-w-[320px] md:max-w-[550px]">
              <div className="grid grid-cols-2 gap-3 p-4 md:gap-4 md:p-6">
                {galleryShown.map((src, i) => (
                  <button key={src} type="button" onClick={() => setLightbox(i)} className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border bg-white/50" style={{ borderColor: "#00000011" }}>
                    <img src={src} alt={`Wedding photo ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
                    {i === galleryShown.length - 1 && galleryExtra > 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-semibold text-white">+{galleryExtra}</div>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <Lightbox gallery={gallery} index={lightbox} setIndex={setLightbox} accent={CREAM} />

        {reception ? (
          <section className="relative z-10 flex flex-col items-center gap-4 px-6 py-10 text-center md:gap-6 md:py-14">
            <h3 className="flex flex-col items-center text-[18px] uppercase md:text-[20px]">Tiệc cưới sẽ diễn ra vào lúc:</h3>
            <div className="text-[18px] font-semibold md:text-[20px]">{venue.banquetTime || couple.time}</div>
            <div className="flex items-center justify-center">
              <span className="text-[18px] font-semibold uppercase md:text-[20px]">{reception.weekday}</span>
              <span className="mx-2 text-[14px] opacity-50 md:mx-3">/</span>
              <span className="text-[30px] font-semibold md:text-[36px]">{reception.day}</span>
              <span className="mx-2 text-[14px] opacity-50 md:mx-3">/</span>
              <span className="text-[18px] font-semibold uppercase md:text-[20px]">Tháng {reception.month}</span>
            </div>
            <div className="flex items-center justify-center gap-8">
              {schedule.slice(0, 2).map((s) => (
                <div key={s.label} className="flex flex-col items-center">
                  <span className="text-[11px] uppercase tracking-wider">{s.label}</span>
                  <span className="mt-1 text-[18px] font-semibold md:text-[20px]">{s.time}</span>
                </div>
              ))}
            </div>
            {calendar ? (
              <div className="mx-auto mt-2 w-[296px] max-w-full md:w-[352px]">
                <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-lg border md:max-w-[310px]" style={{ borderColor: hexToRgba(M, 0.25) }}>
                  <div className="py-2.5 text-center text-[13px] font-semibold tracking-wide md:text-[14px]" style={{ backgroundColor: M, color: "#fff" }}>Tháng {calendar.month} / {calendar.year}</div>
                  <div className="grid grid-cols-7 border-b-2" style={{ borderColor: hexToRgba(M, 0.15) }}>
                    {WEEKDAY_LABELS.map((d) => (<div key={d} className="py-1.5 text-center text-[10px] font-medium opacity-60 md:text-[11px]">{d}</div>))}
                  </div>
                  <div className="grid grid-cols-7 gap-y-0.5 px-1 py-2">
                    {calendar.cells.map((day, i) => (
                      <div key={i} className="flex h-[30px] items-center justify-center md:h-[34px]">
                        {day === calendar.highlight ? (
                          <span className="flex size-7 items-center justify-center rounded-full text-[11px] font-bold text-white md:text-[12px]" style={{ backgroundColor: M }}>{day}</span>
                        ) : day ? (<span className="text-[12px] md:text-[13px]">{day}</span>) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
            <a href={googleCalendarUrl(content)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center justify-center text-sm tracking-wider underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70" style={{ color: M, fontFamily: 'Baskerville, "Times New Roman", serif' }}>Thêm vào lịch</a>
            <button type="button" className="mt-2 rounded-full px-10 py-2.5 text-[13px] font-semibold uppercase tracking-wider" style={{ backgroundColor: M, color: "#fff" }}>Xác Nhận</button>
          </section>
        ) : null}

        {mapQuery ? (
          <section className="relative z-10 flex flex-col gap-6 px-6 pb-12 text-center md:gap-8 md:px-10 md:pb-16">
            <h3 className="text-[20px] font-bold uppercase tracking-[0.05em] md:text-[24px]">Tiệc cưới sẽ tổ chức tại</h3>
            <p className="mx-auto max-w-sm whitespace-pre-line border-b pb-3 text-[14px] leading-relaxed md:max-w-[600px] md:text-base" style={{ borderColor: "#8B000022" }}>{venue.address}</p>
            <div className="flex w-full flex-col items-center gap-4 md:gap-5">
              <InvitationMap query={mapQuery} title={mapQuery} className="h-[260px] w-full max-w-[340px] overflow-hidden rounded-2xl md:h-[360px] md:max-w-[600px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </section>
        ) : null}

        {schedule.length > 0 ? (
          <section className="relative z-10 px-6 py-10 md:px-8 md:py-12">
            <h2 className="mb-8 text-center text-[20px] font-bold uppercase md:text-[24px]">Lịch Trình Ngày Cưới</h2>
            <ol className="mx-auto grid max-w-[420px] grid-cols-[1fr_auto_1fr] items-stretch gap-x-4">
              {schedule.map((s, i) => (
                <li key={`${s.time}-${i}`} className="contents">
                  <span className="pt-0.5 text-right text-[16px] tabular-nums md:text-[17px]">{s.time}</span>
                  <span className="relative flex items-center justify-center self-stretch">
                    {i > 0 ? <span className="absolute left-1/2 top-0 -mt-4 h-4 w-px -translate-x-1/2" style={{ backgroundColor: hexToRgba(M, 0.3) }} /> : null}
                    <span className="relative block size-2.5 rounded-full" style={{ backgroundColor: M }} />
                    {i < schedule.length - 1 ? <span className="absolute bottom-0 left-1/2 -mb-4 h-4 w-px -translate-x-1/2" style={{ backgroundColor: hexToRgba(M, 0.3) }} /> : null}
                  </span>
                  <span className="pb-6 pt-0.5 text-left text-[17px] font-medium leading-tight md:text-[19px]">{s.label}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="relative z-10 px-4 py-10 md:px-8">
          <div className="text-center">
            <h2 className="font-pattaya mb-6 text-[22px] md:text-[24px]">Sổ lưu bút</h2>
          </div>
          <PhoenixWishForm M={M} />
          {wishes.length > 0 ? (
            <div className="chungdoi-scroll touch-pan-y [-webkit-overflow-scrolling:touch] mx-auto mt-8 max-h-[500px] w-full max-w-full space-y-3 overflow-y-auto pr-2 md:max-w-[600px]">
              {wishes.map((w, i) => (
                <div key={`${w.name}-${i}`} className="rounded-lg border p-3 text-xs" style={{ borderColor: hexToRgba(M, 0.2), backgroundColor: "#ffffff" }}>
                  <div className="flex items-start justify-between">
                    <span className="font-semibold" style={{ color: M }}>{w.name}</span>
                    <span className="text-xs opacity-70">{formatWishTime(w.time)}</span>
                  </div>
                  <p className="mt-2 leading-relaxed">{w.text}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {content.bank.brideBankName || content.bank.groomBankName ? (
          <section className="relative z-10 px-6 py-10 text-center md:px-8">
            <h2 className="mb-8 text-[20px] font-bold uppercase md:text-[24px]">QR Mừng Cưới</h2>
            <div className="flex flex-row flex-wrap items-start justify-center gap-4 sm:gap-8">
              {([
                { label: `Cô Dâu - ${content.bank.brideAccountName}`, bank: content.bank.brideBankName, num: content.bank.brideAccountNumber, name: content.bank.brideAccountName },
                { label: `Chú Rể - ${content.bank.groomAccountName}`, bank: content.bank.groomBankName, num: content.bank.groomAccountNumber, name: content.bank.groomAccountName },
              ] as const).filter((q) => q.bank).map((q) => {
                const qr = buildVietQrImageUrl({ bank: q.bank, accountNumber: q.num, accountName: q.name });
                return (
                  <div key={q.label} className="flex max-w-[200px] flex-1 flex-col items-center">
                    <h3 className="mb-2 flex min-h-[2rem] items-start justify-center text-xs font-semibold">{q.label}</h3>
                    <div className="size-32 rounded-xl bg-white p-2 sm:size-40">
                      <img src={qr} alt={`QR - ${q.label}`} className="h-full w-full object-contain" />
                    </div>
                    <p className="mt-2 text-[13px] font-semibold">{q.bank}</p>
                    <p className="text-[13px]">{q.num}</p>
                    <p className="text-[13px]">{q.name}</p>
                    <a href={qr} target="_blank" rel="noreferrer" className="mt-3 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase" style={{ borderColor: M, color: M }}>Lưu QR</a>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <footer className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 text-center" style={{ backgroundColor: M }}>
          <span className="flex flex-col items-center gap-1 whitespace-pre-line text-[12px] md:text-[15px] lg:text-[18px]" style={{ fontFamily: 'Baskerville, "Times New Roman", serif', color: "#fff0e7" }}>
            <span dir="auto">Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</span>
          </span>
        </footer>
        <div className="relative z-10 flex items-center justify-center py-3">
          <a href="https://thiepmungonline.com" target="_blank" rel="noopener noreferrer" className="text-xs opacity-50 transition-opacity hover:opacity-70" style={{ color: M }}>♡ thiepmungonline.com</a>
        </div>
      </div>
    </div>
  );
}
