import type { z } from "zod";
import { contentSchema } from "@/app/editor/[id]/content-schema";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { isUsableVietQrAccount } from "@/lib/vietqr";
import { shortNameFromFullName } from "@/lib/short-name";
import { venueDisplayAddress, venueMapQuery } from "@/lib/venue-address";
import { dedicatedHeroImage } from "@/lib/hero-image-source";
import { EDITOR2_LEGACY_SAMPLE_PHOTOS } from "@/data/editor2-sample-photos";
import { templateSupportsHeroImage } from "@/data/editor-template-capabilities";
import { invitationHeroImage, invitationHeroPhotos } from "@/lib/invitation-display";

export const EDITOR2_SECTIONS = ["couple", "family", "event", "venue", "ceremonies", "photos", "album", "music", "schedule", "gift", "appearance"] as const;
export type Editor2Section = typeof EDITOR2_SECTIONS[number];
export type Editor2Fields = z.infer<typeof contentSchema>;
export type Editor2Draft = {
  fields: Editor2Fields;
  ceremonies: { title: string; date: string; time: string }[];
  schedule: { time: string; label: string }[];
  gallery: string[];
};

/** Template artwork projected into the editor until the user adds their own. */
export type Editor2Samples = {
  heroPhotos: readonly [string, string];
  gallery: readonly string[];
};

export const EDITOR2_FIELD_GROUPS = {
  couple: ["brideFullName", "brideShortName", "brideBirthOrder", "groomFullName", "groomShortName", "groomBirthOrder", "openingMessage"],
  family: ["brideParentTitle", "brideFather", "brideMother", "brideAddress", "groomParentTitle", "groomFather", "groomMother", "groomAddress"],
  event: ["date", "time"],
  venue: ["venueName", "address", "mapAddress"],
  gift: ["brideBankName", "brideAccountNumber", "brideAccountName", "groomBankName", "groomAccountNumber", "groomAccountName"],
  appearance: ["primaryColor", "fontFamily", "dressCodeColors"],
} as const;

export function isEditor2Section(value: unknown): value is Editor2Section {
  return typeof value === "string" && EDITOR2_SECTIONS.some(section => section === value);
}

/** Bundled template photos stay on the card, rather than appearing as uploads. */
export function editor2UploadedPhoto(value: string | null | undefined): string {
  const photo = dedicatedHeroImage(value);
  return EDITOR2_LEGACY_SAMPLE_PHOTOS.has(photo) ? "" : photo;
}

export function editor2UploadedPhotos(gallery: readonly string[]): string[] {
  return gallery.filter(url => editor2UploadedPhoto(url));
}

/** Ordered sample photos, independent of the demo's family display order. */
export function editor2SampleHeroPhotos(content: ChungDoiDemoContent): [string, string] {
  const first = invitationHeroImage(content);
  const pair = invitationHeroPhotos({ ...content, couple: { ...content.couple, brideFirst: true } });
  const second = [pair.groom, pair.bride, ...content.gallery].find(photo => photo.trim() && photo !== first) ?? "";
  return [first, second];
}

/** Template album, deduplicated and ordered, used when the invitation has none. */
export function editor2SampleAlbumPhotos(content: ChungDoiDemoContent, limit = 6): string[] {
  return [...new Set(content.gallery.map(photo => photo.trim()).filter(Boolean))].slice(0, limit);
}

export function withEditor2ShortNames(fields: Editor2Fields): Editor2Fields {
  const brideShortName = fields.brideShortName || shortNameFromFullName(fields.brideFullName);
  const groomShortName = fields.groomShortName || shortNameFromFullName(fields.groomFullName);
  return brideShortName === fields.brideShortName && groomShortName === fields.groomShortName
    ? fields
    : { ...fields, brideShortName, groomShortName };
}

/** An explicit short name wins; otherwise track the last two words of the full name. */
export function withEditor2FullName(fields: Editor2Fields, key: "brideFullName" | "groomFullName", value: string): Editor2Fields {
  const shortKey = key === "brideFullName" ? "brideShortName" : "groomShortName";
  const next = { ...fields, [key]: value };
  if (!fields[shortKey] || fields[shortKey] === shortNameFromFullName(fields[key])) next[shortKey] = shortNameFromFullName(value);
  return next;
}

export function editor2Seed(templateId: string, content: Record<string, unknown> | null, preview: ChungDoiDemoContent): Editor2Draft {
  const strings = Object.fromEntries(Object.entries(content ?? {}).map(([key, value]) => [key, value ?? ""]));
  const fields = withEditor2ShortNames(contentSchema.parse({ ...strings, templateId }));
  const uploaded = editor2UploadedPhotos(preview.gallery);
  return {
    fields: { ...fields, heroImage: editor2UploadedPhoto(fields.heroImage), heroImage2: editor2UploadedPhoto(fields.heroImage2) },
    ceremonies: preview.ceremonies ?? (preview.couple.ceremonyDate || preview.couple.ceremonyTime || preview.couple.ceremonyHeader
      ? [{ title: preview.couple.ceremonyHeader ?? "", date: preview.couple.ceremonyDate, time: preview.couple.ceremonyTime }] : []),
    schedule: preview.schedule,
    gallery: uploaded.length ? uploaded : preview.gallery,
  };
}

export function editor2FormData(draft: Editor2Draft): FormData {
  const form = new FormData();
  Object.entries(draft.fields).forEach(([key, value]) => form.set(key, String(value)));
  draft.ceremonies.forEach(item => {
    form.append("ceremonyItemTitle", item.title);
    form.append("ceremonyItemDate", item.date);
    form.append("ceremonyItemTime", item.time);
  });
  draft.schedule.forEach(item => {
    form.append("scheduleTime", item.time);
    form.append("scheduleLabel", item.label);
  });
  draft.gallery.forEach(url => form.append("galleryUrl", url));
  return form;
}

/** Text comes from the actual draft. Only template photos and album can be projected. */
export function editor2Preview(draft: Editor2Draft, base: ChungDoiDemoContent,
  samples: { heroImage?: string; heroImage2?: string; gallery?: readonly string[] } = {}): ChungDoiDemoContent {
  const fields = draft.fields;
  const read = (key: keyof Editor2Fields) => String(fields[key] ?? "");
  const first = draft.ceremonies[0];
  const gallery = fields.showAlbum === false ? [] : draft.gallery.length ? draft.gallery : [...(samples.gallery ?? [])];
  return {
    ...base,
    slug: fields.templateId,
    theme: { ...base.theme, primaryColor: fields.primaryColor || base.theme.primaryColor, fontFamily: fields.fontFamily || null, userFontFamily: fields.fontFamily || null },
    couple: {
      ...base.couple,
      ...Object.fromEntries(EDITOR2_FIELD_GROUPS.couple.map(key => [key, read(key)])),
      brideFullName: read("brideFullName"), groomFullName: read("groomFullName"),
      brideShortName: fields.brideShortName || shortNameFromFullName(read("brideFullName")),
      groomShortName: fields.groomShortName || shortNameFromFullName(read("groomFullName")),
      brideFirst: fields.brideFirst, brideZodiac: fields.brideZodiac, groomZodiac: fields.groomZodiac,
      date: fields.date, time: read("time"), ceremonyType: fields.ceremonyType,
      ceremonyHeader: first?.title ?? "", ceremonyDate: first?.date ?? "", ceremonyTime: first?.time ?? "",
      openingMessage: read("openingMessage") || base.couple.openingMessage,
    },
    families: Object.fromEntries(EDITOR2_FIELD_GROUPS.family.map(key => [key, read(key)])) as ChungDoiDemoContent["families"],
    venue: { address: venueDisplayAddress(fields.venueName, fields.address), mapAddress: venueMapQuery(fields.venueName, fields.address, fields.mapAddress), banquetTime: read("time") || fields.banquetTime },
    ceremonies: draft.ceremonies,
    schedule: draft.schedule,
    gallery,
    heroImage: fields.heroImage || (samples.heroImage ?? ""), heroImage2: fields.heroImage2 || (samples.heroImage2 ?? ""),
    showHeroImage: fields.showHeroImage,
    showAlbum: fields.showAlbum,
    albumLayout: fields.albumLayout,
    dressCodeColors: fields.dressCodeColors,
    bank: Object.fromEntries(EDITOR2_FIELD_GROUPS.gift.map(key => [key, fields[key]])) as ChungDoiDemoContent["bank"],
    music: fields.music || null,
    musicEnabled: fields.musicEnabled,
    musicStartAt: fields.musicStartAt,
    musicTitle: fields.musicTitle,
    musicArtist: fields.musicArtist,
    wishes: [],
  };
}

export function editor2MissingSections(draft: Editor2Draft): Editor2Section[] {
  return [
    ...(!draft.ceremonies.length ? ["ceremonies" as const] : []),
    ...(!draft.fields.showAlbum ? ["album" as const] : []),
    ...(!draft.fields.music ? ["music" as const] : []),
    ...(!isUsableVietQrAccount({ bank: draft.fields.brideBankName, accountNumber: draft.fields.brideAccountNumber })
      && !isUsableVietQrAccount({ bank: draft.fields.groomBankName, accountNumber: draft.fields.groomAccountNumber }) ? ["gift" as const] : []),
    ...(!draft.schedule.length ? ["schedule" as const] : []),
    ...(templateSupportsHeroImage(draft.fields.templateId) && !draft.fields.showHeroImage ? ["photos" as const] : []),
  ];
}
