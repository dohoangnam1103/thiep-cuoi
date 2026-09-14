"use client";

import { useActionState } from "react";

import type { EditorState } from "../actions";
import { publishEditorInvitation, saveEditorContent } from "../actions";
import vi from "@messages/vi.json";

const FIELD_NAMES = [
  "brideFullName",
  "groomFullName",
  "brideShortName",
  "groomShortName",
  "date",
  "time",
  "ceremonyDate",
  "ceremonyTime",
  "ceremonyHeader",
  "openingMessage",
  "brideFather",
  "brideMother",
  "groomFather",
  "groomMother",
  "address",
  "banquetTime",
] as const;

type FieldName = (typeof FIELD_NAMES)[number];

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

  return (
    <div>
      <form action={saveAction} className="grid gap-4 md:grid-cols-2">
        {FIELD_NAMES.map((name) => (
          <label key={name} className="flex flex-col gap-1 text-sm">
            {labels[name]}
            <input
              name={name}
              defaultValue={initial[name] ?? ""}
              className="rounded-lg border border-[#e5dcc8] bg-white px-3 py-2"
            />
          </label>
        ))}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={savePending}
            className="rounded-full bg-[#9a6a42] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {vi.editor.saveCta}
          </button>
          {saveState?.message ? (
            <p role="status" className="mt-2 text-sm">
              {saveState.message}
            </p>
          ) : null}
          {saveState?.error ? (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {saveState.error}
            </p>
          ) : null}
        </div>
      </form>

      <form action={publishAction} className="mt-8">
        <button
          type="submit"
          disabled={publishPending}
          className="rounded-full border border-[#9a6a42] px-6 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {vi.editor.publishCta}
        </button>
        {publishState?.message ? (
          <p role="status" className="mt-2 text-sm">
            {publishState.message}
          </p>
        ) : null}
      </form>

      {publicSlug ? (
        <p className="mt-4 text-sm">
          {vi.editor.publicLink}:{" "}
          <a href={`/thiep/${publicSlug}`} className="font-semibold underline">
            /thiep/{publicSlug}
          </a>
        </p>
      ) : null}
    </div>
  );
}
