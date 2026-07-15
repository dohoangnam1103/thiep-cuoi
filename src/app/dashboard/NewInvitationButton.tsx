"use client";

import Image from "next/image";
import { useState } from "react";

import { completedTemplates } from "@/data/chungdoi";
import { templateLabel } from "@/app/editor/[id]/templates";
import { createInvitation } from "./actions";

export function NewInvitationButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-ga-event="open_template_picker"
        data-ga-param-source="dashboard"
        className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90"
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
              <h2 className="font-heading text-xl font-semibold text-foreground">Chọn mẫu thiệp</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition hover:bg-secondary"
              >
                Đóng
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {completedTemplates.map((template) => {
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
                        <Image
                          src={template.listing}
                          alt={templateLabel(template.slug)}
                          fill
                          sizes="(min-width: 640px) 200px, 50vw"
                          className="object-cover object-top transition-[object-position,transform] duration-[9000ms] ease-in-out group-hover:object-bottom group-hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none"
                        />
                      </span>
                      <span className="block px-2 py-1.5 text-xs font-semibold text-foreground">
                        {templateLabel(template.slug)}
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
