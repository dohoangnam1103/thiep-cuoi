import type { Editor2Draft } from "@/lib/editor2-draft";
import { titleCaseVietnameseName } from "@/lib/text-case";
import { shortNameFromFullName } from "@/lib/short-name";

export const EDITOR2_BASICS_STORAGE_KEY = "chungdoi:editor2:basics:v1";
export const editor2BasicsDraftKey = (id: string) => `chungdoi:editor2:basics-draft:v1:${id}`;
export const EDITOR2_BASIC_FIELDS = ["brideFullName", "groomFullName", "date"] as const;
export type Editor2Basics = Pick<Editor2Draft["fields"], typeof EDITOR2_BASIC_FIELDS[number]>;
type BasicsStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const emptyBasics = (): Editor2Basics => ({ brideFullName: "", groomFullName: "", date: "" });

function browserStorage(): BasicsStorage | null {
  try { return typeof window === "undefined" ? null : window.localStorage; }
  catch { return null; }
}

/** Only these three strings may enter this cache, including intentional blanks. */
export function editor2Basics(fields: Editor2Basics): Editor2Basics {
  return { brideFullName: fields.brideFullName, groomFullName: fields.groomFullName, date: fields.date };
}
function parseBasics(value: unknown): Editor2Basics | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const fields = value as Record<string, unknown>;
  if (!EDITOR2_BASIC_FIELDS.every(key => typeof fields[key] === "string" && fields[key].length <= (key === "date" ? 20 : 120))) return null;
  return editor2Basics(fields as Editor2Basics);
}
function readEntry(key: string, storage: BasicsStorage | null): Record<string, unknown> | null {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return null;
    const entry: unknown = JSON.parse(raw);
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || !("version" in entry) || entry.version !== 1) return null;
    return entry as Record<string, unknown>;
  } catch { return null; }
}
const equal = (left: Editor2Basics, right: Editor2Basics) => EDITOR2_BASIC_FIELDS.every(key => left[key] === right[key]);

export function readEditor2Basics(storage: BasicsStorage | null = browserStorage()): Editor2Basics {
  return parseBasics(readEntry(EDITOR2_BASICS_STORAGE_KEY, storage)?.values) ?? emptyBasics();
}
export function writeEditor2Basics(fields: Editor2Basics, storage: BasicsStorage | null = browserStorage()): void {
  try { storage?.setItem(EDITOR2_BASICS_STORAGE_KEY, JSON.stringify({ version: 1, values: editor2Basics(fields) })); }
  catch { /* The form remains usable when browser storage is unavailable. */ }
}

/** Keep only unsaved basics for this invitation, separate from cross-template defaults. */
export function cacheEditor2Basics(id: string, current: Editor2Basics, baseline: Editor2Basics, storage: BasicsStorage | null = browserStorage()): void {
  try {
    const key = editor2BasicsDraftKey(id);
    const canonical = { ...current, brideFullName: titleCaseVietnameseName(current.brideFullName), groomFullName: titleCaseVietnameseName(current.groomFullName) };
    if (equal(current, baseline) || equal(canonical, baseline)) storage?.removeItem(key);
    else storage?.setItem(key, JSON.stringify({ version: 1, values: editor2Basics(current), baseline: editor2Basics(baseline) }));
  } catch { /* Server autosave remains available. */ }
}

export function restoreEditor2DraftBasics(id: string, server: Editor2Draft, storage: BasicsStorage | null = browserStorage()): Editor2Draft {
  const key = editor2BasicsDraftKey(id);
  const entry = readEntry(key, storage);
  const values = parseBasics(entry?.values);
  const baseline = parseBasics(entry?.baseline);
  // A newer server edit wins over a cache based on an older server version.
  // Global defaults never overwrite any existing invitation.
  if (!values || !baseline || !equal(baseline, editor2Basics(server.fields))) {
    try { storage?.removeItem(key); } catch { /* Storage may be blocked. */ }
    return server;
  }
  const fields = { ...server.fields, ...values };
  for (const person of ["bride", "groom"] as const) {
    const full = `${person}FullName` as const;
    const short = `${person}ShortName` as const;
    if (!server.fields[short] || server.fields[short] === shortNameFromFullName(server.fields[full])) fields[short] = shortNameFromFullName(fields[full]);
  }
  return { ...server, fields };
}
