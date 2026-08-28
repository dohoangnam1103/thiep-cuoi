"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { activeAdminNavHref } from "@/lib/admin-nav-active";

export type AdminNavItem = { href: string; label: string };

type AdminNavProps = {
  items: AdminNavItem[];
  /**
   * The sidebar is hidden below `lg`, where the same list is rendered as a
   * scrollable strip instead. Both are always in the DOM, so the styling has to
   * come from a prop rather than a breakpoint inside one class string.
   */
  orientation: "vertical" | "horizontal";
};

const ITEM = {
  vertical: "block rounded-lg px-3 py-2",
  horizontal:
    "shrink-0 snap-start whitespace-nowrap rounded-full border px-3 py-1.5",
} as const;

const ITEM_STATE = {
  vertical: {
    active: "bg-primary/10 font-semibold text-primary",
    idle: "text-muted-foreground hover:bg-muted hover:text-foreground",
  },
  horizontal: {
    active: "border-primary/25 bg-primary/10 font-semibold text-primary",
    idle: "border-border/70 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground",
  },
} as const;

const LABEL = "Điều hướng quản trị";

/**
 * Client-side because the active entry depends on the current URL, which a
 * server layout has no access to. The item list stays in the layout so it is
 * still the one place the nav is defined.
 */
export function AdminNav({ items, orientation }: AdminNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeHref = activeAdminNavHref(
    items.map((item) => item.href),
    { pathname, tab: searchParams.get("tab") },
  );

  const links = items.map((item) => {
    const isActive = item.href === activeHref;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        data-active={isActive || undefined}
        className={`${ITEM[orientation]} transition ${
          ITEM_STATE[orientation][isActive ? "active" : "idle"]
        }`}
      >
        {item.label}
      </Link>
    );
  });

  if (orientation === "vertical") {
    return (
      <nav aria-label={LABEL} className="flex flex-col gap-1 text-sm">
        {links}
      </nav>
    );
  }

  return <AdminNavStrip activeHref={activeHref}>{links}</AdminNavStrip>;
}

type AdminNavStripProps = {
  children: ReactNode;
  /** Re-centres the strip when navigation changes which entry is lit. */
  activeHref: string | null;
};

/**
 * The horizontal variant, with the scrollbar hidden. Two things replace what
 * the scrollbar used to do: a fade on whichever side still has entries, and
 * scrolling the active entry into view so the strip does not open on "Tổng
 * quan" no matter which page you are on.
 */
function AdminNavStrip({ children, activeHref }: AdminNavStripProps) {
  const scrollerRef = useRef<HTMLElement | null>(null);
  const centredOnceRef = useRef(false);
  const [overflow, setOverflow] = useState({ start: false, end: false });

  const syncOverflow = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // 1px of slack: sub-pixel layout means scrollLeft rarely lands exactly on
    // 0 or on max, which would leave a fade stuck on at either end.
    const next = { start: el.scrollLeft > 1, end: el.scrollLeft < max - 1 };
    // Compared field by field: this runs on every scroll frame, and a fresh
    // object literal would re-render the whole strip each time even though the
    // answer only changes twice across a full swipe.
    setOverflow((prev) =>
      prev.start === next.start && prev.end === next.end ? prev : next,
    );
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    syncOverflow();
    el.addEventListener("scroll", syncOverflow, { passive: true });
    // Rotating the phone changes which side overflows without firing `scroll`.
    const observer = new ResizeObserver(syncOverflow);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", syncOverflow);
      observer.disconnect();
    };
  }, [syncOverflow]);

  useEffect(() => {
    const el = scrollerRef.current;
    const active = el?.querySelector<HTMLElement>("[data-active]");
    if (!el || !active) return;

    // Measured rather than `scrollIntoView`, which also scrolls ancestors and
    // would yank the page down when the strip sits under a scrolled header.
    const strip = el.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    const delta = item.left - strip.left - (strip.width - item.width) / 2;
    if (Math.abs(delta) < 1) return;

    // Instant on first paint so the strip does not animate itself on load;
    // animated afterwards, where it reads as a response to the tap.
    el.scrollBy({ left: delta, behavior: centredOnceRef.current ? "smooth" : "auto" });
    centredOnceRef.current = true;
  }, [activeHref]);

  return (
    <nav
      ref={scrollerRef}
      aria-label={LABEL}
      data-overflow-start={overflow.start}
      data-overflow-end={overflow.end}
      className="admin-nav-strip flex snap-x snap-proximity items-center gap-1.5 overflow-x-auto px-2 py-1 text-sm"
    >
      {children}
    </nav>
  );
}
