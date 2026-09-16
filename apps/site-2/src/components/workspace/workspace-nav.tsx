"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import vi from "@messages/vi.json";
import { site2Logout } from "../../app/auth-actions";
import type { WorkspaceUser } from "./workspace-shell";

const links = [
  { href: "/dashboard", label: vi.dashboard.title },
  { href: "/mau-thiep", label: vi.site.navTemplates },
];

/* Single workspace navigation landmark. Desktop shows a persistent sidebar;
 * below 768px the same landmark collapses to a compact header with a drawer.
 * Escape closes the drawer and returns focus to the menu trigger. */
export function WorkspaceNav({ user }: { user: WorkspaceUser }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current
      ?.querySelector("a")
      ?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open ]);

  return (
    <nav
      data-testid="workspace-nav"
      aria-label={vi.workspace.navLabel}
      className="md:sticky md:top-0 md:flex md:h-dvh md:w-60 md:shrink-0 md:flex-col"
    >
      <div className="sticky top-0 z-30 border-b border-[var(--s2-line)] bg-[var(--s2-canvas)] md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link
            href="/dashboard"
            className="s2-display text-[20px] font-semibold tracking-tight text-[var(--s2-ink)]"
          >
            {vi.site.name}
          </Link>
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={open}
            aria-controls="s2-workspace-menu"
            aria-label={open ? vi.site.navClose : vi.site.navOpen}
            onClick={() => setOpen((value) => !value)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-[var(--s2-input-radius)] text-[var(--s2-ink)]"
          >
            {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>
        {open ? (
          <div
            ref={panelRef}
            id="s2-workspace-menu"
            className="border-t border-[var(--s2-line)] px-4 py-3"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-[var(--s2-input-radius)] px-2 py-2.5 text-[15px] font-medium text-[var(--s2-ink)]"
              >
                {link.label}
              </Link>
            ))}
            <form action={site2Logout} className="mt-2 border-t border-[var(--s2-line)] pt-2">
              <button
                type="submit"
                className="block w-full rounded-[var(--s2-input-radius)] px-2 py-2.5 text-left text-[15px] font-semibold text-[var(--s2-muted)]"
              >
                {vi.dashboard.logout}
              </button>
            </form>
          </div>
        ) : null}
      </div>

      <div className="hidden border-r border-[var(--s2-line)] bg-[var(--s2-surface)] p-5 md:flex md:flex-1 md:flex-col">
        <Link
          href="/dashboard"
            className="s2-display text-[22px] font-semibold tracking-tight text-[var(--s2-ink)]"
        >
          {vi.site.name}
        </Link>
        <ul className="mt-8 flex flex-col gap-1">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-[var(--s2-input-radius)] px-3 py-2.5 text-[15px] font-medium text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto border-t border-[var(--s2-line)] pt-4">
          {user.email ? (
            <p className="truncate px-3 text-[13px] text-[var(--s2-muted)]">
              {user.email}
            </p>
          ) : null}
          <form action={site2Logout} className="mt-1">
            <button
              type="submit"
              className="block w-full rounded-[var(--s2-input-radius)] px-3 py-2.5 text-left text-[14px] font-semibold text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
            >
              {vi.dashboard.logout}
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
