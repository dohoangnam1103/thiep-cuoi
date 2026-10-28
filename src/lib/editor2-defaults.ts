import type { Editor2Draft, Editor2Fields } from "./editor2-draft";

const groups = {
  family: ["brideParentTitle", "brideFather", "brideMother", "brideAddress", "groomParentTitle", "groomFather", "groomMother", "groomAddress"],
  event: ["time", "venueName", "address"],
} as const;
type Group = keyof typeof groups;
// Birth order is seeded only at creation. Reopening an existing draft must
// preserve custom ranks and intentional deletions, independently on each side.
const creationOnlyKeys = ["brideBirthOrder", "groomBirthOrder"] as const;
type DefaultKey = typeof groups[Group][number] | typeof creationOnlyKeys[number];
export type Editor2Defaults = Pick<Editor2Fields, DefaultKey>;
type DefaultsStorage = Pick<Storage, "getItem" | "setItem">;
export const editor2DefaultsKey = (id: string) => `chungdoi:editor2:defaults:v1:${id}`;

export function editor2DefaultFields(sample: (key: DefaultKey) => string): Editor2Defaults {
  return Object.fromEntries([...Object.values(groups).flat(), ...creationOnlyKeys].map(key => [key, sample(key)])) as Editor2Defaults;
}

function browserStorage(): DefaultsStorage | null {
  try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; }
}
function read(id: string, storage: DefaultsStorage | null): Partial<Record<Group, "pending" | "saved">> {
  try {
    const value: unknown = JSON.parse(storage?.getItem(editor2DefaultsKey(id)) ?? "null");
    if (!value || typeof value !== "object") return {};
    return Object.fromEntries(Object.keys(groups).filter(key => key in value
      && ["pending", "saved"].includes(String((value as Record<string, unknown>)[key])))
      .map(key => [key, (value as Record<string, unknown>)[key]]));
  } catch { return {}; }
}

/** Backfill untouched legacy drafts once. Partial families and saved deletions stay intact. */
export function initializeEditor2Defaults(id: string, draft: Editor2Draft, defaults: Editor2Defaults,
  published: boolean, storage: DefaultsStorage | null = browserStorage()): Editor2Draft {
  if (published) return !draft.fields.time && draft.fields.banquetTime
    ? { ...draft, fields: { ...draft.fields, time: draft.fields.banquetTime } } : draft;
  const state = read(id, storage);
  let fields = draft.fields;
  for (const group of Object.keys(groups) as Group[]) {
    const keys = groups[group];
    if (keys.some(key => draft.fields[key].trim()) || (group === "event" && draft.fields.banquetTime.trim())) {
      // Existing single-parent data is preserved, while an unset honorific
      // matches the renderer's existing default in the input as well.
      let filledTitle = false;
      if (group === "family" && state.family !== "saved") {
        for (const key of ["brideParentTitle", "groomParentTitle"] as const) {
          if (!fields[key]) { fields = { ...fields, [key]: defaults[key] }; filledTitle = true; }
        }
      }
      state[group] = filledTitle ? "pending" : "saved";
    } else if (state[group] !== "saved") {
      fields = { ...fields, ...Object.fromEntries(keys.map(key => [key, defaults[key]])) };
      state[group] = "pending";
    }
  }
  try { storage?.setItem(editor2DefaultsKey(id), JSON.stringify(state)); } catch { /* Storage may be blocked. */ }
  // Legacy banquet time must also appear in the time input, rather than only on the card.
  if (!fields.time && fields.banquetTime) fields = { ...fields, time: fields.banquetTime };
  return fields === draft.fields ? draft : { ...draft, fields };
}

export function acknowledgeEditor2Defaults(id: string, storage: DefaultsStorage | null = browserStorage()) {
  try { storage?.setItem(editor2DefaultsKey(id), JSON.stringify({ family: "saved", event: "saved" })); } catch { /* Storage may be blocked. */ }
}
