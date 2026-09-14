"use client";

import { useActionState } from "react";

import type { EditorState } from "../actions";
import { publishEditorInvitation, saveEditorContent } from "../actions";
import vi from "@messages/vi.json";

const FIELD_GROUPS = [
  {
    title: "couple",
    fields: [
      "brideFullName",
      "groomFullName",
      "brideShortName",
      "groomShortName",
    ] as const,
  },
  {
    title: "ceremony",
    fields: [
      "date",
      "time",
      "ceremonyDate",
      "ceremonyTime",
      "ceremonyHeader",
      "openingMessage",
    ] as const,
  },
  {
    title: "family",
    fields: ["brideFather", "brideMother", "groomFather", "groomMother"] as const,
  },
  {
    title: "venue",
    fields: ["address", "banquetTime"] as const,
  },
] as const;

type FieldName =
  (typeof FIELD_GROUPS)[number]["fields"][number];

const inputClass =
  "rounded-[var(--radius-input)] border border-[var(--line)] bg-white px-4 py-2.5 text-[15px] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]";

export default function Site2EditorForm({
  invitationId,
  initial,
  publicSlug,
}: {
  invitationId: string;
  initial: Record<FieldName, string>;
  publicSlug: string | null;
}) {
  const [saveState, saveAction, savePending] = useActionState(
    saveEditorContent.bind(null, invitationId),
    undefined,
  );
  const [publishState, publishAction, publishPending] = useActionState(
    async (): Promise<EditorState> => publishEditorInvitation(invitationId),
    undefined,
  );
  const labels = vi.editor.fields as Record<FieldName, string>;
  const groups = vi.editor.groups as Record<string, string>;

  return (
    <div>
      <form action={saveAction}>
        {FIELD_GROUPS.map((group) => (
          <fieldset
            key={group.title}
            className="mb-8 rounded-[var(--radius-card)] border border-[var(--line)] bg-white p-5 sm:p-6"
          >
            <legend className="px-2 text-[15px] font-extrabold">
              {groups[group.title]}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.fields.map((name) => (
                <label key={name} className="flex flex-col gap-2 text-[14px]">
                  <span className="font-semibold">{labels[name]}</span>
                  {name === "openingMessage" || name === "ceremonyHeader" ? (
                    <textarea
                      name={name}
                      rows={2}
                      defaultValue={initial[name] ?? ""}
                      className={`${inputClass} resize-y`}
                    />
                  ) : (
                    <input
                      name={name}
                      defaultValue={initial[name] ?? ""}
                      className={inputClass}
                    />
                  )}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={savePending}
            className="rounded-[var(--radius-pill)] bg-[var(--accent)] px-7 py-3 text-[15px] font-semibold text-[var(--accent-ink)] transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {vi.editor.saveCta}
          </button>
          {saveState?.message ? (
            <p role="status" className="text-[14px] font-medium text-emerald-700">
              {saveState.message}
            </p>
          ) : null}
          {saveState?.error ? (
            <p role="alert" className="text-[14px] font-medium text-red-700">
              {saveState.error}
            </p>
          ) : null}
        </div>
      </form>

      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-white p-5 sm:p-6">
        <form action={publishAction}>
          <button
            type="submit"
            disabled={publishPending}
            className="rounded-[var(--radius-pill)] bg-[var(--ink)] px-7 py-3 text-[15px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {vi.editor.publishCta}
          </button>
        </form>
        {publishState?.message ? (
          <p role="status" className="text-[14px] font-medium text-emerald-700">
            {publishState.message}
          </p>
        ) : null}
        {publicSlug ? (
          <p className="w-full text-[14px] text-[var(--muted)]">
            {vi.editor.publicLink}:{" "}
            <a
              href={`/thiep/${publicSlug}`}
              className="font-semibold text-[var(--accent)]"
            >
              /thiep/{publicSlug}
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
