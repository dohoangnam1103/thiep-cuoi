"use client";

import Image from "next/image";
import { useState } from "react";

import { completedTemplates } from "@/data/chungdoi";
import { templateLabel } from "@/app/editor/[id]/templates";
import { templatePreviewUrl } from "@/lib/template-preview-url";
import { bodyClass, ctaSecondaryClass, panelTitleClass, pillClass } from "@/lib/typography";
import { createInvitation } from "./actions";

export function NewInvitationButton({
  templateLabels,
  mobileThumbnailOverrides,
}: {
  templateLabels?: Record<string, string>;
  mobileThumbnailOverrides?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const label = (slug: string) => templateLabels?.[slug] ?? templateLabel(slug);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-ga-event="open_template_picker"
        data-ga-param-source="dashboard"
        className={`rounded-full bg-primary px-5 py-2.5 ${ctaSecondaryClass} text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90`}
      >
        + Tạo thiệp mới
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className={`${panelTitleClass} text-foreground`}>Chọn mẫu thiệp</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`rounded-full border border-border px-3 py-1 ${bodyClass} text-muted-foreground transition hover:bg-secondary`}
              >
                Đóng
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {completedTemplates.map((template) => {
                const mobileThumbnailUrl = mobileThumbnailOverrides?.[template.slug];
                return (
                  <form
                    key={template.slug}
                    action={createInvitation}
                    data-ga-event="select_template"
                    data-ga-param-template-id={template.slug}
                    data-ga-param-source="dashboard_picker"
                  >
                    <input type="hidden" name="templateId" value={template.slug} />
                    <button
                      type="submit"
                      className="group relative w-full overflow-hidden rounded-xl border border-border text-left transition hover:border-primary/40 hover:ring-2 hover:ring-primary/30"
                      data-template-id={template.slug}
                    >
                      <span className="relative block aspect-[3/4] overflow-hidden bg-muted">
                        {mobileThumbnailUrl ? (
                          <>
                            <Image
                              src={mobileThumbnailUrl}
                              alt={label(template.slug)}
                              fill
                              sizes="(max-width: 639px) 50vw, 1px"
                              className="object-cover object-center sm:hidden"
                            />
                            <Image
                              src={templatePreviewUrl(template.listing)}
                              alt={label(template.slug)}
                              fill
                              sizes="(min-width: 640px) 200px, 1px"
                              className="hidden object-cover object-top transition-[object-position,transform] duration-[9000ms] ease-in-out group-hover:object-bottom group-hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none sm:block"
                            />
                          </>
                        ) : (
                          <Image
                            src={templatePreviewUrl(template.listing)}
                            alt={label(template.slug)}
                            fill
                            sizes="(min-width: 640px) 200px, 50vw"
                            className="object-cover object-top transition-[object-position,transform] duration-[9000ms] ease-in-out group-hover:object-bottom group-hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none"
                          />
                        )}
                      </span>
                      <span className={`block px-2 py-1.5 ${pillClass} text-foreground`}>
                        {label(template.slug)}
                      </span>
                    </button>
                  </form>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
