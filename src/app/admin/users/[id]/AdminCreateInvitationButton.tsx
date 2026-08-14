"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { templateLabel } from "@/app/editor/[id]/templates";
import { completedTemplates } from "@/data/chungdoi";
import { templatePreviewUrl } from "@/lib/template-preview-url";

import { createInvitationForUser, type CreateInvitationState } from "./actions";

export function AdminCreateInvitationButton({
  userId,
  templateLabels,
}: {
  userId: string;
  templateLabels: Record<string, string>;
}) {
  const t = useTranslations("adminSupport");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [state, formAction, pending] = useActionState<CreateInvitationState, FormData>(
    createInvitationForUser.bind(null, userId),
    undefined,
  );

  const label = (slug: string) => templateLabels[slug] ?? templateLabel(slug);
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [close, open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        {t("createInvitation")}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-card p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id={titleId} className="font-heading text-xl font-semibold text-foreground">
                {t("chooseTemplate")}
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-secondary"
              >
                {t("close")}
              </button>
            </div>

            {state && !state.ok ? (
              <p className="mt-3 text-sm text-destructive">{t(`errors.${state.errorCode}`)}</p>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {completedTemplates.map((template) => (
                <form key={template.slug} action={formAction}>
                  <input type="hidden" name="templateId" value={template.slug} />
                  <button
                    type="submit"
                    data-template-id={template.slug}
                    disabled={pending}
                    className="group relative w-full overflow-hidden rounded-xl border border-border bg-background text-left transition hover:border-primary/60 disabled:opacity-60"
                  >
                    <span className="relative block aspect-[3/4] overflow-hidden bg-muted">
                      <Image
                        src={templatePreviewUrl(template.listing)}
                        alt={label(template.slug)}
                        fill
                        sizes="(min-width: 640px) 200px, 50vw"
                        className="object-cover object-top transition duration-300 group-hover:scale-105"
                      />
                    </span>
                    <span className="block px-2 py-1.5 text-xs font-semibold text-foreground">
                      {label(template.slug)}
                    </span>
                  </button>
                </form>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
