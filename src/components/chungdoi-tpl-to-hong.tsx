"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  AlbumGallery, buildCalendar, buildVietQrImageUrl, CopyValueButton,
  DressCode, FamilyColumn, formatDate, formatWishTime, googleCalendarUrl,
  InvitationMap, MapDirectionsButton, SharedCountdown, SharedRsvpForm,
  SharedWishForm, SharedWishList, WEEKDAY_LABELS,
} from "@/components/chungdoi-tpl-shared";
import { invitationCeremonies, invitationGiftAccounts, invitationOpeningMessage, orderByBrideFirst, orderedCouple } from "@/lib/invitation-display";
import { ToHongKnot, ToHongPortrait, ToHongThread } from "./chungdoi-to-hong-art";
import styles from "./chungdoi-to-hong.module.css";

const RED = "#780f23";
const IVORY = "#f7efdf";

function Heading({ children, note }: { children: ReactNode; note?: string }) {
  return <div className={styles.heading}>{note ? <p className={styles.eyebrow}>{note}</p> : null}<h2>{children}</h2></div>;
}

function Section({ name, children, dark = false }: { name: string; children: ReactNode; dark?: boolean }) {
  return <section data-to-hong-section={name} className={`${styles.section} ${dark ? styles.darkSection : ""}`}>
    <ToHongThread /><div data-to-hong-reveal>{children}</div>
  </section>;
}

function DateLine({ date, time }: { date: string; time?: string }) {
  const t = useTranslations("invitationTemplate");
  const parsed = formatDate(date);
  return <div className={styles.dateLine}>
    {time ? <p>{t("atTime", { time })}</p> : null}
    {parsed ? <><p className={styles.largeDate}>{parsed.dayNumber}<span>/</span>{parsed.monthNumber}<span>/</span>{parsed.yearNumber}</p><p>{parsed.weekday}</p><p className={styles.muted}>{parsed.lunar}</p></> : null}
  </div>;
}

function ToHongGift({ account }: { account: ReturnType<typeof invitationGiftAccounts>[number] }) {
  const t = useTranslations("invitationTemplate");
  const u = useTranslations("invitationTemplate.toHong");
  const qr = buildVietQrImageUrl({ bank: account.bank, accountNumber: account.num, accountName: account.name });
  if (!qr) return null;
  return <Dialog.Root>
    <div className={styles.gift}>
      <Dialog.Trigger data-testid="gift-envelope" className={styles.envelope} aria-label={t("giftOpenEnvelope", { label: account.name })}>
        <span className={styles.envelopeFlap} /><ToHongKnot /><span className={styles.envelopeLabel}>{account.name}</span>
      </Dialog.Trigger>
      <p className={styles.hint}>{t("giftEnvelopeHint")}</p>
    </div>
    <Dialog.Portal>
      <Dialog.Backdrop className={styles.backdrop} />
      <Dialog.Viewport className={styles.dialogViewport}>
        <Dialog.Popup className={styles.giftDialog}>
          <Dialog.Close aria-label={t("giftClose")} className={styles.close}><X aria-hidden="true" size={20} /></Dialog.Close>
          <div className={styles.dialogEnvelope} aria-hidden="true"><ToHongKnot /></div>
          <div className={styles.qrCard}>
            <p className={styles.eyebrow}>{u("giftCard")}</p>
            <Dialog.Title className={styles.dialogTitle}>{t("giftQrDialogTitle", { name: account.name })}</Dialog.Title>
            <Dialog.Description className={styles.muted}>{t("giftQrDialogDescription", { bank: account.bank })}</Dialog.Description>
            <img src={qr} alt={t("giftQrAlt", { label: account.name })} className={styles.qr} />
            <p><strong>{account.name}</strong></p><p className={styles.accountNumber}>{account.num}</p>
            <div className={styles.actions}><CopyValueButton testId="gift-copy-account" value={account.num} accent={RED} label={t("copyAccount")} copiedLabel={t("accountCopied")} /><a href={`${qr}&download=1`} download className={styles.button}>{t("saveQr")}</a></div>
          </div>
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog.Root>;
}

export function ToHongInvitation({ content }: { content: ChungDoiDemoContent }) {
  const t = useTranslations("invitationTemplate");
  const u = useTranslations("invitationTemplate.toHong");
  const root = useRef<HTMLElement>(null);
  const people = orderedCouple(content);
  const { couple, families, venue, gallery, schedule, wishes } = content;
  const wedding = formatDate(couple.date);
  const calendar = buildCalendar(couple.date);
  const ceremonies = invitationCeremonies(content);
  const accounts = invitationGiftAccounts(content);
  const mapQuery = venue.mapAddress || venue.address.replace(/\n+/g, ", ").trim();
  const columns = orderByBrideFirst(
    { title: families.brideParentTitle || t("parents"), a: families.brideFather, b: families.brideMother, addr: families.brideAddress },
    { title: families.groomParentTitle || t("parents"), a: families.groomFather, b: families.groomMother, addr: families.groomAddress },
    couple.brideFirst,
  );
  const colors = (content.dressCodeColors ?? "").split(",").map((color) => color.trim()).filter(Boolean).map((color) => ({ color, border: "#780f2340" }));

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const paths = Array.from(element.querySelectorAll<SVGPathElement>("[data-to-hong-thread] path"));
    let frame = 0;
    // Content is visible without JS. Reveal only animates sections upon entry.
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.setAttribute("data-entered", "true");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08 });
    element.querySelectorAll("[data-to-hong-reveal]").forEach((node) => observer.observe(node));
    function paint() {
      frame = 0;
      for (const path of paths) {
        const rect = path.parentElement!.getBoundingClientRect();
        const progress = media.matches ? 1 : Math.max(0, Math.min(1, (window.innerHeight * 0.9 - rect.top) / (rect.height + window.innerHeight * 0.2)));
        path.style.strokeDashoffset = String(1 - progress);
      }
    }
    const update = () => { if (!frame) frame = requestAnimationFrame(paint); };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    media.addEventListener("change", update);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); media.removeEventListener("change", update); };
  }, []);

  return <article ref={root} data-template="to-hong" className={styles.invitation}>
    <header data-to-hong-section="hero" className={styles.hero}>
      <p className={styles.eyebrow}>{u("name")}</p><p className={styles.heroVerse}>{u("tagline")}</p>
      <ToHongPortrait content={content} priority />
      <ToHongKnot className={styles.heroKnot} />
      <h1 className={styles.names} tabIndex={-1} data-to-hong-focus><span data-invitation-short-name>{people[0].shortName}</span><em>&amp;</em><span data-invitation-short-name>{people[1].shortName}</span></h1>
      {wedding ? <p className={styles.date}>{wedding.dayNumber}.{wedding.monthNumber}.{wedding.yearNumber}</p> : null}
      <p className={styles.heroFootnote}>{u("heroNote")}</p>
      <a href="#to-hong-reception" className={styles.heroLink}>{u("viewDate")}<span aria-hidden="true">↓</span></a>
    </header>

    <Section name="family">
      <Heading note={u("chapterOne")}>{u("familiesHeading")}</Heading>
      <div className={styles.familyGrid}>{columns.map((column, index) => <FamilyColumn key={index} {...column} />)}</div>
      <p className={styles.openingMessage}>{invitationOpeningMessage(content)}</p>
      <div className={styles.fullNames}>{people.map((person) => <div key={person.side}><p className={styles.muted}>{person.birthOrder}</p><h3>{person.fullName}</h3></div>)}</div>
    </Section>

    {ceremonies.length ? <Section name="ceremony"><Heading>{t("ceremony")}</Heading><div data-template-ceremonies className={styles.ceremonies}>{ceremonies.map((ceremony, index) => <div data-template-ceremony-item key={index}><h3 className={styles.ceremonyTitle}>{ceremony.title}</h3><DateLine date={ceremony.date} time={ceremony.time} /></div>)}</div></Section> : null}

    {gallery.length ? <Section name="album" dark><Heading note={u("chapterTwo")}>{u("albumHeading")}</Heading><p className={styles.sectionIntro}>{u("albumNote")}</p><div className={styles.album}><AlbumGallery photos={gallery} layout={content.albumLayout ?? "grid"} accent={RED} radiusClass="rounded-none" gridVariant="feature" modalLightbox /></div></Section> : null}

    <Section name="reception">
      <div id="to-hong-reception" className={styles.anchor} />
      <Heading note={u("chapterThree")}>{u("receptionHeading")}</Heading>
      <DateLine date={couple.date} time={venue.banquetTime || couple.time} />
      <div className={styles.receptionGrid}>
        {calendar ? <div data-testid="to-hong-calendar" className={styles.calendar}>
          <h3>{t("month", { month: calendar.month })} / {calendar.year}</h3>
          <div className={styles.calendarGrid}>{WEEKDAY_LABELS.map((day) => <span key={day} className={styles.weekday}>{day}</span>)}{calendar.cells.map((day, index) => <span key={index} className={day === calendar.highlight ? styles.selectedDay : undefined}>{day || ""}{day === calendar.highlight ? <svg aria-hidden="true" viewBox="0 0 44 44"><path pathLength="1" d="M22 3C-5 3 0 41 22 39S46 3 22 3C18 4 16 8 23 10" /></svg> : null}</span>)}</div>
        </div> : null}
        <div className={styles.countdown}><ToHongKnot /><p>{u("countdownHeading")}</p>{couple.date ? <SharedCountdown target={`${couple.date}T${venue.banquetTime || couple.time || "18:00"}`} /> : null}<a href={googleCalendarUrl(content)} target="_blank" rel="noopener noreferrer" className={styles.button}>{t("addToCalendar")}</a></div>
      </div>
    </Section>

    {schedule.length ? <Section name="schedule"><Heading>{t("timeline")}</Heading><ol className={styles.schedule}>{schedule.map((item, index) => <li key={index}><time>{item.time}</time><span className={styles.scheduleDot} aria-hidden="true" /><p>{item.label}</p></li>)}</ol></Section> : null}

    {mapQuery ? <Section name="location"><Heading>{u("locationHeading")}</Heading><p className={styles.address}>{venue.address}</p><InvitationMap query={mapQuery} title={t("map")} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" className={styles.map} /><div className={styles.actions}><MapDirectionsButton query={mapQuery} label={t("directions")} className={styles.button} /></div></Section> : null}

    {colors.length ? <Section name="dress"><DressCode colors={colors} heading={<Heading>{t("dressCode")}</Heading>} subLabel={u("dressNote")} headingColor={RED} subColor="#755c55" /></Section> : null}

    <Section name="guestbook"><Heading note={u("chapterFour")}>{u("wishesHeading")}</Heading><div className={styles.forms}>
      <SharedWishForm accent={RED} fieldBorderColor="#c5ad9b" submitTextColor={IVORY} previewNotice={t("formPreviewNotice")} />
      <SharedWishList wishes={wishes} accent={RED} className="mt-8" showAllLabel={t("showAllWishes")} collapseLabel={t("collapseWishes")} renderWish={(wish) => <div className={styles.wish}><strong>{wish.name}</strong><p>{wish.text}</p><time>{formatWishTime(wish.time)}</time></div>} />
      <div className={styles.rsvp}><SharedRsvpForm accent={RED} successContent={<div data-testid="to-hong-rsvp-knot" className={styles.successKnot}><ToHongKnot /></div>} heading={<Heading>{t("rsvpHeading")}</Heading>} previewFallback={<><Heading>{t("rsvpHeading")}</Heading><p className={styles.sectionIntro}>{t("rsvpPreviewNotice")}</p></>} /></div>
    </div></Section>

    {accounts.length ? <Section name="gifts"><Heading>{t("gift")}</Heading><p className={styles.sectionIntro}>{u("giftNote")}</p><div className={styles.gifts}>{accounts.map((account) => <ToHongGift key={`${account.bank}-${account.num}-${account.name}`} account={account} />)}</div></Section> : null}

    <footer data-to-hong-section="footer" className={styles.footer}><ToHongThread /><ToHongKnot /><p className={styles.eyebrow}>{u("endNote")}</p><h2>{u("thanks")}</h2><p data-template-footer>{t("presenceHonor")}</p><p className={styles.footerNames}>{people[0].shortName} &amp; {people[1].shortName}</p><Link href="/">{t("brandDomain")}</Link></footer>
  </article>;
}
