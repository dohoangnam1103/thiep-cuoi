"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import vi from "@messages/vi.json";

/* Full-screen preview sheet for narrow viewports. Escape closes and returns
 * focus to the trigger; the renderer inside is untouched. */
export function EditorPreviewSheet({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
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
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="rounded-full border border-[var(--s2-line)] bg-[var(--s2-surface)] px-5 py-2 text-[14px] font-semibold text-[var(--s2-ink)]"
      >
        {vi.editor.previewCta}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={vi.editor.previewCta}
          className="fixed inset-0 z-50 flex flex-col bg-[var(--s2-canvas)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--s2-line)] px-4 py-3">
            <p className="text-[15px] font-bold text-[var(--s2-ink)]">
              {vi.editor.previewTitle}
            </p>
            <button
              type="button"
              aria-label={vi.editor.closePreview}
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus({ preventScroll: true });
              }}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-[var(--s2-input-radius)] text-[var(--s2-ink)] transition-colors hover:bg-[var(--s2-accent-soft)]"
            >
              <X size={20} aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      ) : null}
    </>
  );
}
