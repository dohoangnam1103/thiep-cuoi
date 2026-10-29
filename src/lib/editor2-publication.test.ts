import assert from "node:assert/strict";
import test from "node:test";
import { contentSchema } from "@/app/editor/[id]/content-schema";
import messages from "../../messages/vi.json";
import { editor2PublicationIssue } from "./editor2-publication";

test("publication walks through missing names, date, time and venue using the latest values", () => {
  const fields = contentSchema.parse({ templateId: "song-hy-red" });
  assert.deepEqual(editor2PublicationIssue(fields, messages.editor2.samples), { errorCode: "coupleRequired", focusField: "brideFullName", section: "couple" });
  fields.brideFullName = "Nguyễn Mai";
  fields.groomFullName = "   ";
  assert.deepEqual(editor2PublicationIssue(fields, messages.editor2.samples), { errorCode: "coupleRequired", focusField: "groomFullName", section: "couple" });
  fields.groomFullName = "Trần Nam";
  assert.deepEqual(editor2PublicationIssue(fields, messages.editor2.samples), { errorCode: "dateRequired", focusField: "date", section: "event" });
  fields.date = "2026-11-29";
  assert.deepEqual(editor2PublicationIssue(fields, messages.editor2.samples), { errorCode: "timeRequired", focusField: "time", section: "event" });
  fields.time = "18:30";
  assert.deepEqual(editor2PublicationIssue(fields, messages.editor2.samples), { errorCode: "venueRequired", focusField: "venueName", section: "venue" });
  fields.venueName = "Nhà hàng Hoa Mai";
  fields.address = "   ";
  assert.deepEqual(editor2PublicationIssue(fields, messages.editor2.samples), { errorCode: "venueRequired", focusField: "address", section: "venue" });
  fields.address = "123 Nguyễn Huệ";
  assert.equal(editor2PublicationIssue(fields, messages.editor2.samples), null);
  // Previously completed sections are checked again rather than skipped by an index.
  fields.brideFullName = "";
  assert.equal(editor2PublicationIssue(fields, messages.editor2.samples)?.section, "couple");
});

test("optional photos, family, ceremonies and gifts do not block publication", () => {
  const fields = contentSchema.parse({ templateId: "song-hy-red", brideFullName: "Nguyễn Mai", groomFullName: "Trần Nam",
    date: "2026-11-29", time: "18:30", venueName: "Nhà gái", address: "123 Nguyễn Huệ" });
  assert.equal(editor2PublicationIssue(fields, messages.editor2.samples), null);
});

test("sample venue content remains incomplete after autosave and title casing", () => {
  const samples = messages.editor2.samples;
  const fields = contentSchema.parse({ templateId: "song-hy-red", brideFullName: "Nguyễn Mai", groomFullName: "Trần Nam",
    date: "2026-11-29", time: "18:30", venueName: samples.venueName.toLocaleUpperCase("vi-VN"), address: ` ${samples.address} ` });
  assert.equal(editor2PublicationIssue(fields, samples)?.focusField, "venueName");
  fields.venueName = "Nhà hàng Hoa Mai";
  assert.equal(editor2PublicationIssue(fields, samples)?.focusField, "address");
  fields.address = "123 Nguyễn Huệ";
  assert.equal(editor2PublicationIssue(fields, samples), null);
});
