import { chungdoiDemoContent } from "@/data/chungdoi-demo-content";
import { normalizeAlbumLayout } from "@/lib/album-layout";
import { editor2SampleAlbumPhotos } from "@/lib/editor2-draft";

/** Template sample schedule, or the neutral fallback when a renderer has none. */
export function editor2StarterSchedule(templateId: string, fallback: readonly { time: string; label: string }[]) {
  const sampleSchedule = chungdoiDemoContent[templateId]?.schedule ?? [];
  return (sampleSchedule.length ? sampleSchedule : fallback).map(item => ({ ...item }));
}

export function editor2StarterCeremony(templateId: string, date: string, time: string, title: string) {
  const sample = chungdoiDemoContent[templateId];
  const sampleTime = sample?.ceremonies?.[0]?.time || sample?.couple.ceremonyTime;
  return { title, date, time: sampleTime && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(sampleTime) ? sampleTime : time };
}

/** Creation only: removing these sections later must never recreate them. */
export function editor2StarterSections(templateId: string, date: string, time: string, ceremonyTitle: string,
  fallbackSchedule: readonly { time: string; label: string }[]) {
  const sample = chungdoiDemoContent[templateId];
  if (!sample?.gallery.length) throw new Error(`Missing editor2 starter gallery: ${templateId}`);
  return {
    gallery: editor2SampleAlbumPhotos(sample),
    albumLayout: normalizeAlbumLayout(sample.albumLayout),
    schedule: editor2StarterSchedule(templateId, fallbackSchedule),
    ceremony: editor2StarterCeremony(templateId, date, time, ceremonyTitle),
  };
}
