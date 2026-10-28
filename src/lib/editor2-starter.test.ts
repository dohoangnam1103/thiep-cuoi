import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { completedTemplates } from "@/data/chungdoi";
import { chungdoiDemoContent } from "@/data/chungdoi-demo-content";
import { editor2StarterSchedule, editor2StarterSections } from "./editor2-starter";
import messages from "../../messages/vi.json";
import { editor2SampleHeroPhotos, editor2UploadedPhotos } from "./editor2-draft";
import { heroImageCount } from "@/data/editor-template-capabilities";

const fallbackSchedule = [
  { time: "17:30", label: messages.editor2.starterSchedule.welcome },
  { time: "18:00", label: messages.editor2.starterSchedule.ceremony },
  { time: "18:30", label: messages.editor2.starterSchedule.reception },
  { time: "20:30", label: messages.editor2.starterSchedule.photos },
];

test("every completed template has a starter album, one ceremony on the user's date and an editable schedule", () => {
  for (const template of completedTemplates) {
    const starter = editor2StarterSections(template.slug, "2026-11-29", "18:00", messages.editor2.newCeremony, fallbackSchedule);
    assert.ok(starter.gallery.length > 0 && starter.gallery.length <= 6, template.slug);
    assert.deepEqual(editor2UploadedPhotos(starter.gallery), [], `${template.slug}: sample album must not appear as uploaded photos`);
    assert.equal(new Set(starter.gallery).size, starter.gallery.length, template.slug);
    for (const photo of starter.gallery) {
      assert.ok(photo.startsWith("/") && existsSync(`public${photo}`), `${template.slug}: ${photo}`);
      assert.ok(photo.length <= 300, template.slug);
    }
    assert.equal(starter.ceremony.date, "2026-11-29", template.slug);
    assert.equal(starter.ceremony.title, messages.editor2.newCeremony, template.slug);
    assert.match(starter.ceremony.time, /^(?:[01]\d|2[0-3]):[0-5]\d$/, template.slug);
    assert.ok(["grid", "mosaic", "coverflow"].includes(starter.albumLayout), template.slug);
    assert.ok(starter.schedule.length > 0, template.slug);
    for (const item of starter.schedule) {
      assert.match(item.time, /^(?:[01]\d|2[0-3]):[0-5]\d$/, template.slug);
      assert.ok(item.label.trim().length > 0 && item.label.length <= 120, template.slug);
    }
    const sample = chungdoiDemoContent[template.slug];
    if (heroImageCount(template.slug) === 2) {
      const [first, second] = editor2SampleHeroPhotos(sample);
      assert.ok(first && second && first !== second, `${template.slug}: independent fallback photos for both opening slots`);
    }
    assert.deepEqual(editor2UploadedPhotos([...sample.gallery, sample.heroImage ?? "", sample.heroImage2 ?? ""]), [], `${template.slug}: all bundled photos remain defaults`);
    assert.deepEqual(starter.schedule, sample.schedule.length ? sample.schedule : fallbackSchedule, template.slug);
    // Editing a draft must never mutate shared demo content or future invitations.
    assert.notEqual(starter.schedule[0], (sample.schedule.length ? sample.schedule : fallbackSchedule)[0], template.slug);
  }
});

test("starter schedule is copied from the template or the neutral fallback", () => {
  for (const template of completedTemplates) {
    const expected = chungdoiDemoContent[template.slug].schedule.length
      ? chungdoiDemoContent[template.slug].schedule
      : fallbackSchedule;
    const schedule = editor2StarterSchedule(template.slug, fallbackSchedule);
    assert.deepEqual(schedule, expected, template.slug);
    assert.notEqual(schedule[0], expected[0], `${template.slug}: shared array item must not be mutated`);
  }
  const unknown = editor2StarterSchedule("unknown-template", fallbackSchedule);
  assert.deepEqual(unknown, fallbackSchedule);
});

test("unknown templates do not silently borrow another template's album", () => {
  assert.throws(() => editor2StarterSections("unknown-template", "2026-11-29", "18:00", messages.editor2.newCeremony, fallbackSchedule), /Missing editor2 starter gallery/);
});
