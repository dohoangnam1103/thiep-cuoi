import assert from "node:assert/strict";
import test from "node:test";
import { contentSchema } from "@/app/editor/[id]/content-schema";
import messages from "../../messages/vi.json";
import type { Editor2Draft } from "./editor2-draft";
import { acknowledgeEditor2Defaults, editor2DefaultFields, initializeEditor2Defaults } from "./editor2-defaults";
import { editor2Preview, editor2Seed } from "./editor2-draft";
import { chungdoiDemoContent } from "@/data/chungdoi-demo-content";
import { BRIDE_BIRTH_ORDER_OPTIONS, GROOM_BIRTH_ORDER_OPTIONS } from "@/data/editor-options";

const defaults = editor2DefaultFields(key => messages.editor2.samples[key]);
const draft = (): Editor2Draft => ({ fields: contentSchema.parse({ templateId: "song-hy-red", date: "2026-11-29" }), ceremonies: [], schedule: [], gallery: [] });
function memory() {
  const map = new Map<string, string>();
  return { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value); } };
}

test("new invitation defaults survive editor parsing and appear on the invitation", () => {
  const base = chungdoiDemoContent["song-hy-red"];
  const created = editor2Seed("song-hy-red", { ...defaults }, base);
  const preview = editor2Preview(created, base);
  assert.equal(preview.couple.brideBirthOrder, "Trưởng Nữ");
  assert.equal(preview.couple.groomBirthOrder, "Trưởng Nam");
  assert.ok(BRIDE_BIRTH_ORDER_OPTIONS.some(option => option.value === created.fields.brideBirthOrder));
  assert.ok(GROOM_BIRTH_ORDER_OPTIONS.some(option => option.value === created.fields.groomBirthOrder));
  assert.equal(preview.families.brideFather, "Tên Cha Cô Dâu");
  assert.equal(preview.families.brideMother, "Tên Mẹ Cô Dâu");
  assert.equal(preview.families.groomFather, "Tên Cha Chú Rể");
  assert.equal(preview.families.groomMother, "Tên Mẹ Chú Rể");
});

test("existing ranks and cleared ranks are preserved when reopening drafts", () => {
  const existing = draft();
  existing.fields.brideBirthOrder = "Con gái út";
  const restored = initializeEditor2Defaults("ranks", existing, defaults, false, memory());
  assert.equal(restored.fields.brideBirthOrder, "Con gái út");
  assert.equal(restored.fields.groomBirthOrder, "");
});

test("untouched drafts receive real editable defaults, including time and honorifics", () => {
  const storage = memory();
  const result = initializeEditor2Defaults("new", draft(), defaults, false, storage);
  assert.equal(result.fields.brideFather, "Tên Cha Cô Dâu");
  assert.equal(result.fields.groomParentTitle, "Ông Bà");
  assert.equal(result.fields.time, "18:00");
  assert.equal(result.fields.date, "2026-11-29");
  assert.equal(result.fields.groomAccountNumber, "");
  // A refresh before autosave can recover the default initialization.
  assert.deepEqual(initializeEditor2Defaults("new", draft(), defaults, false, storage), result);
});

test("single-parent families and published invitations never receive replacement names", () => {
  const partial = draft(); partial.fields.groomMother = "Trần Thị Hoa";
  const restored = initializeEditor2Defaults("partial", partial, defaults, false, memory());
  assert.equal(restored.fields.groomFather, "");
  assert.equal(restored.fields.groomParentTitle, "Ông Bà");
  const published = draft();
  assert.equal(initializeEditor2Defaults("published", published, defaults, true, memory()), published);
});

test("saved intentional deletions remain empty when all defaults have been cleared", () => {
  const storage = memory();
  initializeEditor2Defaults("cleared", draft(), defaults, false, storage);
  acknowledgeEditor2Defaults("cleared", storage);
  const empty = draft();
  assert.equal(initializeEditor2Defaults("cleared", empty, defaults, false, storage), empty);
});

test("legacy banquet time populates its input without replacing the existing address", () => {
  const legacy = draft(); legacy.fields.banquetTime = "19:30"; legacy.fields.address = "Nhà hàng Hoa Mai";
  const result = initializeEditor2Defaults("legacy", legacy, defaults, false, memory());
  assert.equal(result.fields.time, "19:30");
  assert.equal(result.fields.address, "Nhà hàng Hoa Mai");
  assert.equal(initializeEditor2Defaults("live", legacy, defaults, true, memory()).fields.time, "19:30");
});
