"use client";

import { useEffect, useRef } from "react";

const KEY = (id: string) => `chungdoi:draft:${id}`;

const ARRAY_FIELDS = ["scheduleTime", "scheduleLabel", "galleryUrl"] as const;

export type Draft = Record<string, string | boolean | string[]>;

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

/** Đọc draft đồng bộ (client-only). Lỗi parse → xoá key hỏng, trả null. */
export function readDraft(invitationId: string): Draft | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY(invitationId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Draft) : null;
  } catch {
    window.localStorage.removeItem(KEY(invitationId));
    return null;
  }
}

/** Gắn listener ghi draft có debounce; clear khi cleared=true. */
export function useFormDraft(opts: {
  formId: string;
  invitationId: string;
  enabled: boolean;
  cleared: boolean;
}): void {
  const { formId, invitationId, enabled, cleared } = opts;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (cleared) {
      window.localStorage.removeItem(KEY(invitationId));
    }
  }, [cleared, invitationId]);

  useEffect(() => {
    if (!enabled) return;
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    const write = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        try {
          window.localStorage.setItem(KEY(invitationId), JSON.stringify(serializeForm(form)));
        } catch {
          // localStorage đầy hoặc bị chặn — bỏ qua, đây chỉ là lưới an toàn
        }
      }, 500);
    };

    form.addEventListener("input", write);
    form.addEventListener("change", write);
    return () => {
      form.removeEventListener("input", write);
      form.removeEventListener("change", write);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [formId, invitationId, enabled]);
}
