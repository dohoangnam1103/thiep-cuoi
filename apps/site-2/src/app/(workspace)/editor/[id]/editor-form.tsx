"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  publishEditorInvitation,
  saveEditorContent,
} from "../actions";
import { EditorActionBar, type EditorSaveState } from "../../../../components/workspace/editor-action-bar";
import { S2Field } from "../../../../components/ui/field";
import vi from "@messages/vi.json";

const AUTOSAVE_DELAY_MS = 1200;

const FIELD_GROUPS = [
  { title: "couple", fields: ["brideFullName", "groomFullName", "brideShortName", "groomShortName"] as const },
  { title: "ceremony", fields: ["date", "time", "ceremonyDate", "ceremonyTime", "ceremonyHeader", "openingMessage"] as const },
  { title: "family", fields: ["brideFather", "brideMother", "groomFather", "groomMother"] as const },
  { title: "venue", fields: ["address", "banquetTime"] as const },
] as const;

type FieldName = (typeof FIELD_GROUPS)[number]["fields"][number];

const MULTILINE_FIELDS: readonly FieldName[] = ["ceremonyHeader", "openingMessage"];

function snapshot(values: Record<FieldName, string>): string {
  return JSON.stringify(values);
}

export default function Site2EditorForm({
  invitationId,
  initial,
  publicSlug,
  previewAction,
}: {
  invitationId: string;
  initial: Record<FieldName, string>;
  publicSlug: string | null;
  previewAction?: ReactNode;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saveState, setSaveState] = useState<EditorSaveState>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [published, setPublished] = useState(publicSlug !== null);
  const [justPublished, setJustPublished] = useState(false);
  const lastSavedRef = useRef(snapshot(initial));
  const seqRef = useRef(0);
  const chainRef = useRef(Promise.resolve(true));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const labels = vi.editor.fields as Record<FieldName, string>;
  const groups = vi.editor.groups as Record<string, string>;

  /* Serialized saves: overlapping autosaves and the publish flush never
   * interleave, and only the latest response touches visible state. Transport
   * failures keep the draft in memory and surface a retry instead of throwing. */
  function saveNow(): Promise<boolean> {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const run = chainRef.current.then(async () => {
      const seq = ++seqRef.current;
      if (snapshot(values) === lastSavedRef.current) return true;
      setSaveState("saving");
      let result: Awaited<ReturnType<typeof saveEditorContent>>;
      try {
        result = await saveEditorContent(invitationId, { ...values });
      } catch {
        if (seq === seqRef.current) {
          setSaveState("error");
          setFormError(vi.editor.saveError);
        }
        return false;
      }
      if (seq !== seqRef.current) return false;
      if (result.ok) {
        lastSavedRef.current = snapshot(values);
        setSaveState("saved");
        setFormError(null);
        router.refresh();
        return true;
      }
      setSaveState("error");
      setFormError(result.formError);
      return false;
    });
    chainRef.current = run.catch(() => false);
    return run;
  }

  useEffect(() => {
    if (snapshot(values) === lastSavedRef.current) return;
    setJustPublished(false);
    setSaveState((current) => (current === "saving" ? current : "dirty"));
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void saveNow();
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  async function handlePublish() {
    setFieldErrors({});
    setFormError(null);
    /* Flush first so server-side validation sees the latest keystrokes.
     * Publish still runs when the flush reports failure: validation then
     * answers from the last persisted draft instead of failing silently. */
    await saveNow().catch(() => false);
    setSaveState("saving");
    let result: Awaited<ReturnType<typeof publishEditorInvitation>>;
    try {
      result = await publishEditorInvitation(invitationId);
    } catch {
      setSaveState("error");
      setFormError(vi.editor.saveError);
      return;
    }
    if (result.ok) {
      setPublished(true);
      setJustPublished(true);
      setFieldErrors({});
      setFormError(null);
      setSaveState("saved");
      router.refresh();
      return;
    }
    setSaveState("error");
    if (result.fieldErrors) setFieldErrors(result.fieldErrors);
    setFormError(result.formError);
  }

  const busy = saveState === "saving";
  const bar = (action?: ReactNode) => (
    <EditorActionBar
      saveState={saveState}
      onSave={() => void saveNow()}
      onPublish={() => void handlePublish()}
      busy={busy}
      previewAction={
        action ? (
          <span className="contents xl:hidden">{action}</span>
        ) : undefined
      }
    />
  );

  return (
    <div className="flex flex-col">
      {FIELD_GROUPS.map((group) => (
        <fieldset
          key={group.title}
          id={`editor-section-${group.title}`}
          className="mb-8 scroll-mt-32 rounded-2xl border border-[var(--s2-line)] bg-[var(--s2-surface)] p-5 sm:p-6"
        >
          <legend className="px-2 text-[15px] font-extrabold text-[var(--s2-ink)]">
            {groups[group.title]}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {group.fields.map((name) => (
              <div
                key={name}
                className={
                  MULTILINE_FIELDS.includes(name) ? "sm:col-span-2" : undefined
                }
              >
                <S2Field
                  id={`editor-${name}`}
                  name={name}
                  label={labels[name]}
                  value={values[name] ?? ""}
                  onChange={(event) => {
                    const next = event.target.value;
                    setValues((current) => ({
                      ...current,
                      [name]: next,
                    }));
                    if (next.trim() !== "") {
                      setFieldErrors((current) => {
                        if (!current[name]) return current;
                        const rest = { ...current };
                        delete rest[name];
                        return rest;
                      });
                    }
                  }}
                  error={fieldErrors[name]}
                  multiline={MULTILINE_FIELDS.includes(name)}
                />
              </div>
            ))}
          </div>
        </fieldset>
      ))}
      {published && publicSlug ? (
        <p className="mb-8 text-[14px] text-[var(--s2-muted)]">
          {vi.editor.publicLink}:{" "}
          <a
            href={`/thiep/${publicSlug}`}
            className="font-semibold text-[var(--s2-accent)]"
          >
            /thiep/{publicSlug}
          </a>
        </p>
      ) : null}
      {formError ? (
        <p
          role="alert"
          className="mb-4 text-[14px] font-medium text-[var(--s2-danger)]"
        >
          {formError}
        </p>
      ) : null}
      {justPublished ? (
        <p role="status" className="mb-4 text-[14px] font-medium text-[var(--s2-success)]">
          {vi.editor.published}
        </p>
      ) : null}
      <div className="sticky bottom-0 z-20 order-last -mx-4 border-t border-[var(--s2-line)] bg-[var(--s2-canvas)]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 xl:order-first xl:mx-0 xl:mb-6 xl:border xl:border-[var(--s2-line)] xl:bg-[var(--s2-surface)] xl:px-5 xl:rounded-2xl xl:top-6">
        {bar(previewAction)}
      </div>
    </div>
  );
}
