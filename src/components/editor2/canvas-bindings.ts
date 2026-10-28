import { EDITOR2_FIELD_GROUPS, type Editor2Draft, type Editor2Section } from "@/lib/editor2-draft";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { heroImageCount } from "@/data/editor-template-capabilities";
import { invitationHeroImage, invitationHeroPhotos } from "@/lib/invitation-display";

const normalize = (value: string) => value.normalize("NFC").replace(/\s+/g, " ").trim().toLocaleLowerCase("vi");

/** Private canvas enhancement only. It never changes the shared/public renderers. */
export function bindEditor2Canvas(root: HTMLElement, draft: Editor2Draft, content: ChungDoiDemoContent,
  select: (section: Editor2Section, field?: string) => void, label: (section: Editor2Section) => string, sampleLabel: string) {
  const cleanup: (() => void)[] = [];
  const bound = new Set<HTMLElement>();
  const mapFrames = new WeakSet<HTMLIFrameElement>();
  // A renderer may place its reception beside ceremony cards in one grid.
  // Resolve the nearest semantic block rather than inheriting the whole grid.
  const withinCeremony = (element: HTMLElement) => Boolean(element
    .closest("[data-template-ceremonies], [data-template-ceremony-item], [data-template-reception]")
    ?.matches("[data-template-ceremonies], [data-template-ceremony-item]"));
  // The editor dialog temporarily hides its surrounding page from assistive
  // technology. Only template-owned hidden nodes should be excluded here.
  const hiddenWithinCanvas = (element: HTMLElement, selectors: string) => {
    const hidden = element.closest(selectors);
    return hidden !== null && hidden !== root && root.contains(hidden);
  };
  const texts = new Map<string, { section: Editor2Section; field?: string; sample?: boolean }>();
  // Static section headings have no field text to match, so name the section explicitly.
  const headings = new Map<string, Editor2Section>([
    ["thông tin tiệc cưới", "event"],
    ["tiệc cưới sẽ tổ chức tại", "venue"],
    ["tiệc báo hỷ sẽ tổ chức tại", "venue"],
  ]);
  const photoCount = heroImageCount(draft.fields.templateId);
  // Hoa Tinh pins its bride/groom frames to fixed sides, including album fallbacks.
  const pair = invitationHeroPhotos(content, { fixedSides: draft.fields.templateId === "hoa-tinh-red" });
  const openingPhotos = new Map<string, "heroImage" | "heroImage2">();
  if (photoCount === 1) openingPhotos.set(invitationHeroImage(content), "heroImage");
  if (photoCount === 2) { openingPhotos.set(pair.bride, "heroImage"); openingPhotos.set(pair.groom, "heroImage2"); }
  const add = (value: string, section: Editor2Section, field?: string, sample = false) => {
    if (normalize(value).length > 2) texts.set(normalize(value), { section, field, sample });
  };
  EDITOR2_FIELD_GROUPS.couple.filter(key => key !== "openingMessage").forEach(key => add(String(content.couple[key] ?? ""), "couple", key));
  [content.couple.brideFullName, content.couple.groomFullName].forEach(name => add(name.split(/\s+/).slice(-2).join(" "), "couple"));
  EDITOR2_FIELD_GROUPS.family.forEach(key => add(content.families[key], "family", key, !draft.fields[key]));
  add(content.venue.address, "venue", draft.fields.venueName ? "venueName" : "address");
  add(draft.fields.venueName, "venue", "venueName");
  add(draft.fields.address, "venue", "address");
  add(content.venue.banquetTime, "event", "time", !draft.fields.time);
  draft.ceremonies.forEach(item => add(item.title, "ceremonies"));
  draft.schedule.forEach(item => add(item.label, "schedule"));
  EDITOR2_FIELD_GROUPS.gift.forEach(key => add(content.bank[key], "gift", key));

  function bind(element: HTMLElement, section: Editor2Section, field?: string, sample = false) {
    if (bound.has(element) || hiddenWithinCanvas(element, ".sr-only, [aria-hidden=true]")) return;
    bound.add(element);
    const previous = { tabIndex: element.getAttribute("tabindex"), role: element.getAttribute("role"), label: element.getAttribute("aria-label"), title: element.getAttribute("title") };
    element.dataset.e2Section = section;
    if (field) element.dataset.e2Field = field;
    element.classList.add("e2-editable");
    if (sample) element.classList.add("e2-sample");
    // Preserve a native button/link's semantics. Other invitation text gains keyboard access.
    if (!element.matches("a,button,input,textarea,select")) { element.tabIndex = 0; element.setAttribute("role", "button"); }
    element.setAttribute("aria-label", label(section));
    element.setAttribute("title", sample ? sampleLabel : label(section));
    cleanup.push(() => {
      element.classList.remove("e2-editable", "e2-sample");
      delete element.dataset.e2Section; delete element.dataset.e2Field;
      for (const [key, value] of Object.entries({ tabindex: previous.tabIndex, role: previous.role, "aria-label": previous.label, title: previous.title })) {
        if (value === null) element.removeAttribute(key); else element.setAttribute(key, value);
      }
    });
  }

  // A map iframe swallows pointer events inside its own document. The click
  // must land on the rendered venue block around it instead.
  const mapFrameTarget = (frame: HTMLIFrameElement) => {
    for (let element = frame.parentElement; element && element !== root; element = element.parentElement) {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return element;
    }
    return frame.parentElement ?? root;
  };

  const enhance = () => {
    root.querySelectorAll<HTMLElement>("[data-invitation-family-field]").forEach(element => {
      const field = element.dataset.invitationFamilyField;
      if (EDITOR2_FIELD_GROUPS.family.some(key => key === field)) bind(element, "family", field);
    });
    root.querySelectorAll<HTMLElement>("[data-template-reception]").forEach(element => bind(element, "event"));
    root.querySelectorAll<HTMLElement>("[data-invitation-time]").forEach(element => bind(element, withinCeremony(element) ? "ceremonies" : "event", "time"));
    root.querySelectorAll<HTMLElement>('[data-invitation-calendar], [data-calendar-card], [data-testid$="-calendar"], [data-dried-calendar]').forEach(element =>
      bind(element, withinCeremony(element) ? "ceremonies" : "event", "date"));
    // Older renderers share a seven-column weekday row without a calendar marker.
    root.querySelectorAll<HTMLElement>('[class*="grid-cols-7"]').forEach(row => {
      if (row.children.length !== 7 || !Array.from(row.children).every(cell => /^(t[2-7]|cn|mon|tue|wed|thu|fri|sat|sun)$/i.test(cell.textContent?.trim() ?? ""))) return;
      const calendar = row.parentElement;
      if (calendar && !calendar.closest('[data-e2-section="event"][data-e2-field="date"]')) bind(calendar, withinCeremony(calendar) ? "ceremonies" : "event", "date");
    });
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const element = node.parentElement;
      if (!element || hiddenWithinCanvas(element, "script,style,svg,.sr-only,[aria-hidden=true]")) continue;
      const text = normalize(node.textContent ?? "");
      // A ceremony can share its date/time/title with the reception. Its native
      // containing section takes precedence over global text-value matches.
      if (text && withinCeremony(element)) {
        bind(element, "ceremonies");
        continue;
      }
      const match = texts.get(text);
      if (match) { bind(element, match.section, match.field, match.sample); continue; }
      // Some date layouts wrap a compact schedule too. A known content value
      // above must retain its own section even inside that wider date group.
      if (element.closest('[data-e2-section="event"][data-e2-field="date"]')) continue;
      const heading = headings.get(text);
      if (heading) { bind(element.closest<HTMLElement>("h1, h2, h3, h4, h5, h6") ?? element, heading); continue; }
      // Dates are split into day/month/year across designs. Bind their calendar, date labels and lunar line.
      if (/^(tháng\s+\d|thứ\s+(hai|ba|tư|năm|sáu|bảy)|chủ nhật|tức ngày\s+\d|\d{1,2}[/.]\d{1,2}[/.]\d{4})/.test(text)) {
        const section = withinCeremony(element) ? "ceremonies" : "event";
        bind(element, section, "date");
        const group = element.parentElement;
        if (group && group.children.length >= 3 && normalize(group.textContent ?? "").length < 240) bind(group, section, "date");
      }
    }
    root.querySelectorAll<HTMLElement>("[data-invitation-short-name]").forEach(element => bind(element, "couple"));
    root.querySelectorAll<HTMLElement>("[data-template-ceremonies], [data-template-ceremony-item]").forEach(element => bind(element, "ceremonies"));
    const artSections: Record<string, Editor2Section> = { album: "album", timeline: "schedule", gift: "gift", map: "venue", calendar: "event", ceremonies: "ceremonies", dress: "appearance" };
    root.querySelectorAll<HTMLElement>("[data-art-section]").forEach(element => {
      const section = artSections[element.dataset.artSection ?? ""];
      if (section) bind(element, section);
    });
    root.querySelectorAll<HTMLElement>('[data-testid="gift-envelope"], [data-testid="gift-flip-card"], [data-testid="gift-qr-grid"]').forEach(element => bind(element, "gift"));
    root.querySelectorAll<HTMLElement>("[data-invitation-music]").forEach(element => bind(element, "music"));
    root.querySelectorAll<HTMLImageElement>("img").forEach(element => {
      const renderedSrc = element.getAttribute("src") ?? "";
      let src = renderedSrc;
      try {
        const url = new URL(renderedSrc, location.origin);
        if (url.pathname === "/_next/image") src = url.searchParams.get("url") ?? renderedSrc;
      } catch { /* Leave unusual image sources untouched. */ }
      const field = src ? openingPhotos.get(src) : undefined;
      // Album buttons can reuse the same URL as a header portrait. Keep their
      // own action, while clicking the unwrapped portrait selects its slot.
      const album = element.closest<HTMLElement>('button, [data-invitation-album], [data-art-section="album"]');
      if (field && (!album || !content.gallery.includes(src))) bind(element.closest<HTMLElement>("button") ?? element, "photos", field, !draft.fields[field]);
      else if (content.gallery.includes(src)) bind(element.closest<HTMLElement>("button") ?? element, "album");
    });
    root.querySelectorAll<HTMLAnchorElement>("a[href]").forEach(element => {
      const href = element.getAttribute("href") ?? "";
      if (/maps|calendar/.test(href)) bind(element, href.includes("calendar") ? "event" : "venue", href.includes("calendar") ? "date" : draft.fields.mapAddress ? "mapAddress" : "address");
    });
    root.querySelectorAll<HTMLIFrameElement>("iframe").forEach(frame => {
      if (!mapFrames.has(frame)) {
        mapFrames.add(frame);
        const previous = frame.style.pointerEvents;
        frame.style.pointerEvents = "none";
        cleanup.push(() => { frame.style.pointerEvents = previous; });
      }
      bind(mapFrameTarget(frame), "venue", draft.fields.mapAddress ? "mapAddress" : "address");
    });
  };
  const activate = (event: Event) => {
    const element = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-e2-section]") : null;
    if (element) {
      event.preventDefault(); event.stopPropagation();
      select(element.dataset.e2Section as Editor2Section, element.dataset.e2Field);
    } else if (event.target instanceof Element && event.target.closest("a,button,input,textarea,select,form")) {
      // No map navigation, lightbox, or guest form writes while selecting content.
      event.preventDefault(); event.stopPropagation();
    }
  };
  const keyboard = (event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") activate(event); };
  const submit = (event: Event) => { event.preventDefault(); event.stopPropagation(); };
  enhance();
  let pendingFrame = 0;
  const observer = new MutationObserver(() => {
    if (!pendingFrame) pendingFrame = requestAnimationFrame(() => { pendingFrame = 0; enhance(); });
  });
  observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["src", "srcset"] });
  root.addEventListener("click", activate, true);
  root.addEventListener("keydown", keyboard, true);
  root.addEventListener("submit", submit, true);
  return () => {
    observer.disconnect();
    cancelAnimationFrame(pendingFrame);
    root.removeEventListener("click", activate, true); root.removeEventListener("keydown", keyboard, true); root.removeEventListener("submit", submit, true);
    cleanup.forEach(fn => fn());
  };
}
