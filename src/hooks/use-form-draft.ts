"use client";

import { useCallback, useEffect, useRef } from "react";

const KEY = (id: string) => `chungdoi:draft:${id}`;
const STORAGE_VERSION = 1;
const MAX_DRAFT_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const SAVE_DELAY_MS = 300;

const ARRAY_FIELDS = ["scheduleTime", "scheduleLabel", "galleryUrl"] as const;

export type Draft = Record<string, string | boolean | string[]>;
export type DraftStatus = "server" | "saving" | "local" | "restored" | "error";
export type DraftStatusMessages = Record<DraftStatus, string>;

type StoredDraft = {
  version: typeof STORAGE_VERSION;
  updatedAt: number;
  data: Draft;
};

type UseFormDraftOptions = {
  formId: string;
  invitationId: string;
  enabled: boolean;
  onStatusChange?: (status: DraftStatus) => void;
};

type FormDraftController = {
  capture: () => Draft | null;
  clear: () => void;
  getLatest: () => Draft | null;
  persist: (draft: Draft) => boolean;
};

/** Đọc form thành object; field lặp → mảng, brideFirst → boolean. */
export function serializeForm(form: HTMLFormElement): Draft {
  const fd = new FormData(form);
  const draft: Draft = {};
  for (const name of ARRAY_FIELDS) {
    draft[name] = fd.getAll(name).map(String);
  }
  for (const [name, value] of fd.entries()) {
    if ((ARRAY_FIELDS as readonly string[]).includes(name)) continue;
    draft[name] = String(value);
  }
  // brideFirst: checkbox không nằm trong FormData khi bỏ chọn
  draft.brideFirst = fd.get("brideFirst") != null;
  return draft;
}

function writeDraft(invitationId: string, draft: Draft): boolean {
  try {
    const stored: StoredDraft = {
      version: STORAGE_VERSION,
      updatedAt: Date.now(),
      data: draft,
    };
    window.localStorage.setItem(KEY(invitationId), JSON.stringify(stored));
    return true;
  } catch {
    return false;
  }
}

/** Ghi ngay toàn bộ form trước khi submit hoặc rời trang. */
export function persistFormDraft(invitationId: string, form: HTMLFormElement): Draft {
  const draft = serializeForm(form);
  writeDraft(invitationId, draft);
  return draft;
}

export function clearFormDraft(invitationId: string): void {
  try {
    window.localStorage.removeItem(KEY(invitationId));
  } catch {
    // localStorage có thể bị chặn; dữ liệu DB vẫn là lớp lưu chính.
  }
}

export function draftsEqual(left: Draft | null, right: Draft | null): boolean {
  if (!left || !right) return left === right;
  return JSON.stringify(left) === JSON.stringify(right);
}

function isDraft(value: unknown): value is Draft {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every(
    (entry) =>
      typeof entry === "string" ||
      typeof entry === "boolean" ||
      (Array.isArray(entry) && entry.every((item) => typeof item === "string")),
  );
}

/** Đọc draft đồng bộ (client-only), hỗ trợ cả định dạng cũ trước khi có metadata. */
export function readDraft(invitationId: string): Draft | null {
  if (typeof window === "undefined") return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY(invitationId));
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

    if ("version" in parsed && "updatedAt" in parsed && "data" in parsed) {
      if (
        parsed.version !== STORAGE_VERSION ||
        typeof parsed.updatedAt !== "number" ||
        Date.now() - parsed.updatedAt > MAX_DRAFT_AGE_MS ||
        !isDraft(parsed.data)
      ) {
        clearFormDraft(invitationId);
        return null;
      }
      return parsed.data;
    }

    return isDraft(parsed) ? parsed : null;
  } catch {
    clearFormDraft(invitationId);
    return null;
  }
}

function nodeContainsNamedControl(node: Node): boolean {
  if (!(node instanceof Element)) return false;
  return node.matches("[name]") || node.querySelector("[name]") != null;
}

function mutationChangesFormData(record: MutationRecord): boolean {
  return [...record.addedNodes, ...record.removedNodes].some(nodeContainsNamedControl);
}

/**
 * Lưới an toàn cho editor:
 * - giữ snapshot mới nhất trong bộ nhớ ngay khi form thay đổi;
 * - debounce ghi localStorage để không chặn lúc gõ;
 * - nhận cả hidden input được React thêm/xoá/đổi (mẫu, nhạc, lịch, album);
 * - flush đồng bộ khi tab ẩn, reload, điều hướng hoặc component unmount.
 */
export function useFormDraft(opts: UseFormDraftOptions): FormDraftController {
  const { formId, invitationId, enabled, onStatusChange } = opts;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<Draft | null>(null);
  const statusCallbackRef = useRef(onStatusChange);

  useEffect(() => {
    statusCallbackRef.current = onStatusChange;
  }, [onStatusChange]);

  const persist = useCallback(
    (draft: Draft) => {
      latestRef.current = draft;
      const written = writeDraft(invitationId, draft);
      statusCallbackRef.current?.(written ? "local" : "error");
      return written;
    },
    [invitationId],
  );

  const capture = useCallback(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return null;
    const draft = serializeForm(form);
    persist(draft);
    return draft;
  }, [formId, persist]);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    latestRef.current = null;
    clearFormDraft(invitationId);
    statusCallbackRef.current?.("server");
  }, [invitationId]);

  const getLatest = useCallback(() => latestRef.current, []);

  useEffect(() => {
    if (!enabled) return;
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    const scheduleWrite = () => {
      latestRef.current = serializeForm(form);
      statusCallbackRef.current?.("saving");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const latest = latestRef.current;
        if (latest) persist(latest);
        timerRef.current = null;
      }, SAVE_DELAY_MS);
    };
    const onFormFieldChange = (event: Event) => {
      const target = event.target;
      if (
        !(target instanceof HTMLInputElement) &&
        !(target instanceof HTMLSelectElement) &&
        !(target instanceof HTMLTextAreaElement)
      ) {
        return;
      }
      // Chỉ field có name mới được submit. Bỏ qua search/filter nội bộ trong dialog.
      if (!target.name || target.closest("[data-form-draft-ignore]")) return;
      scheduleWrite();
    };

    const flush = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      const latest = latestRef.current;
      if (latest) persist(latest);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        latestRef.current = serializeForm(form);
        flush();
      }
    };
    const onPageHide = () => {
      latestRef.current = serializeForm(form);
      flush();
    };
    const observer = new MutationObserver((records) => {
      if (records.some(mutationChangesFormData)) scheduleWrite();
    });

    form.addEventListener("input", onFormFieldChange);
    form.addEventListener("change", onFormFieldChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    observer.observe(form, {
      childList: true,
      subtree: true,
    });

    return () => {
      form.removeEventListener("input", onFormFieldChange);
      form.removeEventListener("change", onFormFieldChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      observer.disconnect();
      flush();
    };
  }, [enabled, formId, persist]);

  return { capture, clear, getLatest, persist };
}
