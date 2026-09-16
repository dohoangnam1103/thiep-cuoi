import type { ReactNode } from "react";

import vi from "@messages/vi.json";

export type EditorSaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const SAVE_LABEL: Record<EditorSaveState, string> = {
  idle: "",
  dirty: vi.editor.saveDirty,
  saving: vi.editor.saveSaving,
  saved: vi.editor.saved,
  error: vi.editor.saveError,
};

/* Single editor action bar. Flex order moves it above the form on wide
 * screens and below it on narrow ones, so the save and publish intents stay
 * unique to assistive tech. The save state crossfades in place through a
 * remount keyframe; the optional preview slot holds the mobile sheet
 * trigger. */
export function EditorActionBar({
  saveState,
  onSave,
  onPublish,
  busy,
  previewAction,
}: {
  saveState: EditorSaveState;
  onSave: () => void;
  onPublish: () => void;
  busy: boolean;
  previewAction?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <p
        role="status"
        className="min-w-0 flex-1 basis-32 truncate text-[13px] text-[var(--s2-muted)]"
      >
        <span key={saveState} className="s2-save-flip block truncate">
          {SAVE_LABEL[saveState]}
        </span>
      </p>
      <div className="flex shrink-0 items-center gap-2">
        {previewAction}
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          className="rounded-full border border-[var(--s2-line)] bg-[var(--s2-surface)] px-5 py-2 text-[14px] font-semibold text-[var(--s2-ink)] transition-colors hover:border-[var(--s2-accent)] active:scale-[0.98] disabled:opacity-60"
        >
          {vi.editor.saveCta}
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={busy}
          className="rounded-full bg-[var(--s2-accent)] px-5 py-2 text-[14px] font-semibold text-[var(--s2-accent-ink)] transition-all duration-300 hover:bg-[color-mix(in_oklab,var(--s2-accent)_88%,#0e1a12)] active:scale-[0.98] disabled:opacity-60"
        >
          {vi.editor.publishCta}
        </button>
      </div>
    </div>
  );
}
