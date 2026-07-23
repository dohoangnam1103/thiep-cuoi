import assert from "node:assert/strict";
import test from "node:test";

import {
  contentSchema,
  parseCeremonies,
  parseGallery,
  parseSchedule,
} from "@/app/editor/[id]/content-schema";
import { draftToFormData } from "./use-form-draft";
import type { Draft } from "./use-form-draft";

test("draftToFormData round-trips scalar, boolean and array fields into FormData the server can parse", () => {
  const draft: Draft = {
    templateId: "song-hy-red",
    brideFullName: "Nguyễn Quỳnh Anh",
    groomFullName: "Trần Gia Khánh",
    brideFirst: false,
    showHeroImage: true,
    ceremonyItemTitle: ["Lễ vu quy", "Lễ thành hôn"],
    ceremonyItemDate: ["2026-08-28", "2026-08-29"],
    ceremonyItemTime: ["09:00", "10:30"],
    scheduleTime: ["18:00", "19:30"],
    scheduleLabel: ["Đón khách", "Khai tiệc"],
    galleryUrl: ["/a.jpg", "/b.jpg"],
  };

  const fd = draftToFormData(draft);

  const parsed = contentSchema.safeParse(Object.fromEntries(fd));
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.templateId, "song-hy-red");
    assert.equal(parsed.data.brideFullName, "Nguyễn Quỳnh Anh");
    assert.equal(parsed.data.brideFirst, false);
    assert.equal(parsed.data.showHeroImage, true);
  }

  assert.deepEqual(parseSchedule(fd), [
    { time: "18:00", label: "Đón khách" },
    { time: "19:30", label: "Khai tiệc" },
  ]);
  assert.deepEqual(parseCeremonies(fd), [
    { title: "Lễ vu quy", date: "2026-08-28", time: "09:00" },
    { title: "Lễ thành hôn", date: "2026-08-29", time: "10:30" },
  ]);
  assert.deepEqual(parseGallery(fd), ["/a.jpg", "/b.jpg"]);
});

test("draftToFormData omits empty array fields", () => {
  const draft: Draft = {
    templateId: "song-hy-red",
    ceremonyItemTitle: [],
    ceremonyItemDate: [],
    ceremonyItemTime: [],
    scheduleTime: [],
    scheduleLabel: [],
    galleryUrl: [],
  };
  const fd = draftToFormData(draft);
  assert.equal(fd.getAll("scheduleTime").length, 0);
  assert.equal(fd.getAll("ceremonyItemTitle").length, 0);
  assert.equal(fd.getAll("galleryUrl").length, 0);
  assert.deepEqual(parseCeremonies(fd), []);
  assert.deepEqual(parseSchedule(fd), []);
  assert.deepEqual(parseGallery(fd), []);
});
