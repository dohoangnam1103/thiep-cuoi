import assert from "node:assert/strict";
import test from "node:test";
import { contentSchema } from "@/app/editor/[id]/content-schema";
import { cacheEditor2Basics, EDITOR2_BASICS_STORAGE_KEY, editor2BasicsDraftKey, readEditor2Basics, restoreEditor2DraftBasics, writeEditor2Basics } from "./editor2-basics-storage";
import type { Editor2Draft } from "./editor2-draft";

class MemoryStorage {
  private entries = new Map<string, string>();
  getItem(key: string) { return this.entries.get(key) ?? null; }
  setItem(key: string, value: string) { this.entries.set(key, value); }
  removeItem(key: string) { this.entries.delete(key); }
}
const original = { brideFullName: "Nguyễn Quỳnh Anh", groomFullName: "Trần Gia Khánh", date: "2026-11-29" };
const changed = { brideFullName: "Nguyễn Lan Anh", groomFullName: "Trần Minh Đức", date: "2026-12-20" };
function draft(): Editor2Draft {
  return { fields: contentSchema.parse({ templateId: "song-hy-red", ...original, brideShortName: "Quỳnh Anh", groomShortName: "Gia Khánh", brideFather: "Nguyễn Văn Thành" }), ceremonies: [], gallery: [], schedule: [] };
}

test("cross-template defaults keep exactly the three requested fields and preserve explicit clearing", () => {
  const storage = new MemoryStorage();
  const input = { ...changed, brideBankName: "ACB", brideAccountNumber: "123456789", templateId: "song-hy-red" };
  writeEditor2Basics(input, storage);
  assert.deepEqual(readEditor2Basics(storage), changed);
  assert.deepEqual(JSON.parse(storage.getItem(EDITOR2_BASICS_STORAGE_KEY)!), { version: 1, values: changed });
  writeEditor2Basics({ ...changed, groomFullName: "", date: "" }, storage);
  assert.deepEqual(readEditor2Basics(storage), { ...changed, groomFullName: "", date: "" });
});

test("refresh recovers pending basics only for their invitation and retains other server content", () => {
  const storage = new MemoryStorage();
  const server = draft();
  cacheEditor2Basics("own", changed, original, storage);
  const recovered = restoreEditor2DraftBasics("own", server, storage);
  assert.equal(recovered.fields.brideFullName, changed.brideFullName);
  assert.equal(recovered.fields.groomFullName, changed.groomFullName);
  assert.equal(recovered.fields.date, changed.date);
  assert.equal(recovered.fields.brideShortName, "Lan Anh");
  assert.equal(recovered.fields.groomShortName, "Minh Đức");
  assert.equal(recovered.fields.brideFather, "Nguyễn Văn Thành");
  writeEditor2Basics(changed, storage);
  assert.equal(restoreEditor2DraftBasics("other", server, storage), server);
  server.fields.brideShortName = "Tên riêng";
  assert.equal(restoreEditor2DraftBasics("own", server, storage).fields.brideShortName, "Tên riêng");
});

test("new server edits win over stale pending basics, and acknowledgements rebase newer local edits", () => {
  const storage = new MemoryStorage();
  const server = draft();
  cacheEditor2Basics("own", changed, original, storage);
  server.fields.brideFullName = "Nguyễn Hoàng Anh";
  assert.equal(restoreEditor2DraftBasics("own", server, storage), server);
  assert.equal(storage.getItem(editor2BasicsDraftKey("own")), null);
  // Save A completed while the user was typing B: rebase B on A, without
  // changing global defaults back to the older A snapshot.
  writeEditor2Basics(changed, storage);
  const later = { ...changed, date: "2027-01-10" };
  cacheEditor2Basics("own", later, changed, storage);
  server.fields = { ...server.fields, ...changed };
  assert.equal(restoreEditor2DraftBasics("own", server, storage).fields.date, later.date);
  assert.deepEqual(readEditor2Basics(storage), changed);
  cacheEditor2Basics("own", later, later, storage);
  assert.equal(storage.getItem(editor2BasicsDraftKey("own")), null);
  cacheEditor2Basics("own", { ...later, brideFullName: "nguyễn lan anh" }, later, storage);
  assert.equal(storage.getItem(editor2BasicsDraftKey("own")), null);
});

test("corrupt, incompatible or unavailable browser storage does not break the form", () => {
  const storage = new MemoryStorage();
  for (const raw of ["{", "null", "[]", JSON.stringify({ version: 2, values: changed }), JSON.stringify({ version: 1, values: { ...changed, date: 123 } })]) {
    storage.setItem(EDITOR2_BASICS_STORAGE_KEY, raw);
    assert.deepEqual(readEditor2Basics(storage), { brideFullName: "", groomFullName: "", date: "" });
  }
  const denied = { getItem() { throw Error("denied"); }, setItem() { throw Error("denied"); }, removeItem() { throw Error("denied"); } };
  assert.deepEqual(readEditor2Basics(denied), { brideFullName: "", groomFullName: "", date: "" });
  assert.doesNotThrow(() => writeEditor2Basics(changed, denied));
  assert.doesNotThrow(() => cacheEditor2Basics("own", changed, original, denied));
  const server = draft();
  assert.equal(restoreEditor2DraftBasics("own", server, denied), server);
});
