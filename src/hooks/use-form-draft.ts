"use client";

import { useCallback, useEffect, useRef } from "react";

const KEY = (id: string) => `chungdoi:draft:${id}`;
const STORAGE_VERSION = 1;
const MAX_DRAFT_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const ARRAY_FIELDS = [
  "ceremonyItemTitle",
  "ceremonyItemDate",
  "ceremonyItemTime",
  "scheduleTime",
  "scheduleLabel",
  "galleryUrl",
] as const;

export type Draft = Record<string, string | boolean | string[]>;

type StoredDraft = {
  version: typeof STORAGE_VERSION;
  updatedAt: number;
  data: Draft;
};

type UseFormDraftOptions = {
  formId: string;
  invitationId: string;
  enabled: boolean;
  /** Draft thay đổi (blur/chọn mẫu/nhạc/ảnh) — dùng để debounce autosave lên server. */
  onChange?: (draft: Draft) => void;
  /** Rời trang/ẩn tab/unmount — cần lưu ngay, không chờ debounce. */
  onFlush?: (draft: Draft) => void;
};

type FormDraftController = {
  capture: () => Draft | null;
  clear: () => void;
  getLatest: () => Draft | null;
  persist: (draft: Draft) => boolean;
};

/** Đọc form thành object; field lặp → mảng, các cờ ẩn → boolean. */
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
  draft.brideFirst = String(fd.get("brideFirst") ?? "true") !== "false";
  draft.showHeroImage = String(fd.get("showHeroImage") ?? "true") !== "false";
  return draft;
}

/** Nghịch của serializeForm: dựng FormData từ draft để gửi thẳng cho server action. */
export function draftToFormData(draft: Draft): FormData {
  const fd = new FormData();
  for (const [name, value] of Object.entries(draft)) {
    if (Array.isArray(value)) {
      for (const item of value) fd.append(name, item);
    } else if (typeof value === "boolean") {
      fd.set(name, value ? "true" : "false");
    } else {
      fd.set(name, value);
    }
  }
  return fd;
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
 * - chỉ ghi localStorage sau khi người dùng rời field, không re-render khi đang gõ;
 * - nhận cả hidden input được React thêm/xoá/đổi (mẫu, nhạc, lịch, album);
 * - flush đồng bộ khi tab ẩn, reload, điều hướng hoặc component unmount.
 */
export function useFormDraft(opts: UseFormDraftOptions): FormDraftController {
  const { formId, invitationId, enabled, onChange, onFlush } = opts;
  const latestRef = useRef<Draft | null>(null);
  const onChangeRef = useRef(onChange);
  const onFlushRef = useRef(onFlush);

  useEffect(() => {
    onChangeRef.current = onChange;
    onFlushRef.current = onFlush;
  }, [onChange, onFlush]);

  const persist = useCallback(
    (draft: Draft) => {
      latestRef.current = draft;
      return writeDraft(invitationId, draft);
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
    latestRef.current = null;
    clearFormDraft(invitationId);
  }, [invitationId]);

  const getLatest = useCallback(() => latestRef.current, []);

  useEffect(() => {
    if (!enabled) return;
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    const persistCurrentForm = () => {
      const draft = serializeForm(form);
      persist(draft);
      onChangeRef.current?.(draft);
    };
    const isDraftControl = (target: EventTarget | null) => {
      if (
        !(target instanceof HTMLInputElement) &&
        !(target instanceof HTMLSelectElement) &&
        !(target instanceof HTMLTextAreaElement)
      ) {
        return false;
      }
      return Boolean(target.name && !target.closest("[data-form-draft-ignore]"));
    };
    const onProgrammaticInput = (event: Event) => {
      const target = event.target;
      // React bắn input trên hidden field khi user chọn template/nhạc/ảnh. Các
      // input gõ chữ bị bỏ qua hoàn toàn cho tới focusout.
      if (!(target instanceof HTMLInputElement) || target.type !== "hidden") return;
      if (!isDraftControl(target)) return;
      persistCurrentForm();
    };

    const flush = () => {
      const latest = latestRef.current;
      if (!latest) return;
      persist(latest);
      onFlushRef.current?.(latest);
    };

    const onFieldBlur = (event: FocusEvent) => {
      if (!isDraftControl(event.target)) return;
      persistCurrentForm();
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
      if (records.some(mutationChangesFormData)) persistCurrentForm();
    });

    form.addEventListener("input", onProgrammaticInput);
    form.addEventListener("focusout", onFieldBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    observer.observe(form, {
      childList: true,
      subtree: true,
    });

    return () => {
      form.removeEventListener("input", onProgrammaticInput);
      form.removeEventListener("focusout", onFieldBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      observer.disconnect();
      latestRef.current = serializeForm(form);
      flush();
    };
  }, [enabled, formId, persist]);

  return { capture, clear, getLatest, persist };
}
