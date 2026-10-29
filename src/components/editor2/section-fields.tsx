"use client";

import { ArrowDown, ArrowUp, Check, ChevronDown, Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { completedTemplates } from "@/data/chungdoi";
import { BRIDE_BIRTH_ORDER_OPTIONS, FONT_OPTIONS, GROOM_BIRTH_ORDER_OPTIONS, type SelectOption } from "@/data/editor-options";
import { heroImageCount, templateSupportsZodiac } from "@/data/editor-template-capabilities";
import { EDITOR2_FIELD_GROUPS, editor2UploadedPhoto, editor2UploadedPhotos, withEditor2FullName, type Editor2Draft, type Editor2Fields, type Editor2Samples, type Editor2Section } from "@/lib/editor2-draft";
import { EDITOR_IMAGE_ACCEPT } from "@/lib/upload-image-formats";
import { MAX_IMAGE_UPLOAD_SOURCE_BYTES } from "@/lib/upload-image-limits";
import { VIETQR_BANKS } from "@/lib/vietqr";
import { ZODIAC } from "@/lib/zodiac";
import { AlbumLayoutPreview } from "@/components/album-layout-preview";
import { Editor2MusicFields } from "./music-fields";
import { Editor2DateField } from "./date-field";
import { Editor2VenueFields } from "./venue-fields";

type Change = (update: (previous: Editor2Draft) => Editor2Draft) => void;

export function Editor2SectionFields({ invitationId, section, draft, onChange, labels, samples, onUploading }: {
  invitationId: string; section: Editor2Section; draft: Editor2Draft; onChange: Change; labels: Record<string, string>;
  samples?: Editor2Samples; onUploading: (uploading: boolean) => void;
}) {
  const t = useTranslations("editor2");
  const zodiacT = useTranslations("editor.zodiac");
  const uploadedGallery = editor2UploadedPhotos(draft.gallery);
  const displayGallery = uploadedGallery.length ? uploadedGallery : [...(samples?.gallery ?? [])];
  const openingPhotoCount = heroImageCount(draft.fields.templateId);
  const setField = <K extends keyof Editor2Fields>(key: K, value: Editor2Fields[K]) => onChange(previous => {
    const fields = key === "brideFullName" || key === "groomFullName"
      ? withEditor2FullName(previous.fields, key, String(value))
      : { ...previous.fields, [key]: value };
    if (key === "time") fields.banquetTime = String(value);
    return { ...previous, fields };
  });
  const field = (name: Exclude<keyof Editor2Fields, "brideFirst" | "showHeroImage">) => {
    if (name === "date") return <Editor2DateField key={name} name={name} label={t("fields.date")} value={draft.fields.date} onChange={value => setField(name, value)} />;
    if (name === "brideBirthOrder" || name === "groomBirthOrder") return <Editor2BirthOrderField key={name} name={name}
      value={draft.fields[name]} options={name === "brideBirthOrder" ? BRIDE_BIRTH_ORDER_OPTIONS : GROOM_BIRTH_ORDER_OPTIONS}
      onChange={value => setField(name, value)} />;
    const multiline = /Address$|^address$|openingMessage/.test(name);
    const maxLength = name === "primaryColor" ? 32 : name === "fontFamily" ? 80 : /BirthOrder$/.test(name) ? 40 : name === "openingMessage" || name === "music" ? 300 : name === "mapAddress" ? 1200
      : /Address$|^address$|dressCodeColors/.test(name) ? 200 : /ShortName$|BirthOrder$|AccountNumber$|ParentTitle$/.test(name) ? 60 : 120;
    return <label key={name} className="e2-field"><span>{t(`fields.${name}`)}</span>
      {multiline ? <textarea aria-label={t(`fields.${name}`)} id={`e2-${name}`} name={name} value={String(draft.fields[name])} maxLength={maxLength} onChange={event => setField(name, event.target.value as Editor2Fields[typeof name])} />
        : <input aria-label={t(`fields.${name}`)} id={`e2-${name}`} name={name} type={name === "time" ? "time" : "text"} maxLength={maxLength}
          value={String(draft.fields[name])} onChange={event => setField(name, event.target.value as Editor2Fields[typeof name])} />}
    </label>;
  };

  if (section === "couple") return <div className="e2-dialog-fields">
    <div className="e2-couple-grid">
      {(["bride", "groom"] as const).map(person => {
        const zodiacField = `${person}Zodiac` as const;
        return <div key={person} className="e2-dialog-fields">
          {EDITOR2_FIELD_GROUPS.couple.filter(name => name.startsWith(person)).map(field)}
          {templateSupportsZodiac(draft.fields.templateId) && <label className="e2-field">
            <span>{t(`fields.${zodiacField}`)}</span><select value={draft.fields[zodiacField]} onChange={event => setField(zodiacField, event.target.value as Editor2Fields[typeof zodiacField])}>
              <option value="">{zodiacT("placeholder")}</option>{ZODIAC.map(option => <option key={option.id} value={option.id}>{zodiacT(`options.${option.id}`)}</option>)}
            </select>
          </label>}
        </div>;
      })}
    </div>
  </div>;
  if (section === "family") return <div className="e2-dialog-fields">
    <p className="e2-description">{t("familyHelp")}</p>
    <div className="e2-couple-grid">
      {(["bride", "groom"] as const).map(person => <div key={person} className="e2-dialog-fields">
        {EDITOR2_FIELD_GROUPS.family.filter(name => name.startsWith(person)).map(field)}
      </div>)}
    </div>
  </div>;
  if (section === "event") return <div className="e2-dialog-fields">{EDITOR2_FIELD_GROUPS.event.map(field)}</div>;
  if (section === "venue") return <Editor2VenueFields invitationId={invitationId} venueName={draft.fields.venueName} address={draft.fields.address}
    mapValue={draft.fields.mapAddress} onMapChange={value => setField("mapAddress", value)}>
    {field("venueName")}{field("address")}
  </Editor2VenueFields>;
  if (section === "gift") return <div className="e2-dialog-fields"><p className="e2-description">{t("giftHelp")}</p>
    <div className="e2-couple-grid">
      {(["bride", "groom"] as const).map(person => <div key={person} className="e2-dialog-fields">
        {EDITOR2_FIELD_GROUPS.gift.filter(name => name.startsWith(person)).map(name => name.endsWith("BankName") ? <label key={name} className="e2-field"><span>{t(`fields.${name}`)}</span>
          <span className="e2-bank-select">
            <select aria-label={t(`fields.${name}`)} id={`e2-${name}`} value={draft.fields[name]} onChange={event => setField(name, event.target.value)}>
              <option value="">{t("selectBank")}</option>
              {draft.fields[name] && !VIETQR_BANKS.some(bank => bank.shortName === draft.fields[name]) && <option value={draft.fields[name]}>{draft.fields[name]}</option>}
              {VIETQR_BANKS.map(bank => <option key={bank.bin} value={bank.shortName}>{bank.shortName}</option>)}
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </span>
        </label> : field(name))}
      </div>)}
    </div>
  </div>;
  if (section === "ceremonies") return <div className="e2-dialog-fields">
    {!draft.ceremonies.length && <p className="e2-description">{t("empty")}</p>}
    {draft.ceremonies.map((item, index) => <fieldset className="e2-repeat" key={index}>
      <legend className="e2-repeat-head">{t("ceremonyNumber", { number: index + 1 })}</legend>
      {(["title", "date", "time"] as const).map(key => key === "date" ? <Editor2DateField key={key} name={`ceremony-${index}-date`} label={t("ceremonyDate")} value={item.date} onChange={value => onChange(previous => ({ ...previous, ceremonies: previous.ceremonies.map((row, i) => i === index ? { ...row, date: value } : row) }))} /> : <label key={key} className="e2-field"><span>{t(key === "title" ? "ceremonyTitle" : "ceremonyTime")}</span>
        <input name={`ceremony-${index}-${key}`} type={key === "title" ? "text" : "time"} value={item[key]} maxLength={key === "title" ? 200 : 20}
          onChange={event => onChange(previous => ({ ...previous, ceremonies: previous.ceremonies.map((row, i) => i === index ? { ...row, [key]: event.target.value } : row) }))} />
      </label>)}
      <button type="button" className="e2-button e2-danger" aria-label={t("removeCeremony", { number: index + 1 })} onClick={() => onChange(previous => ({ ...previous, ceremonies: previous.ceremonies.filter((_, i) => i !== index) }))}><Trash2 size={15} />{t("remove")}</button>
    </fieldset>)}
    <button type="button" className="e2-button" disabled={draft.ceremonies.length >= 20} onClick={() => onChange(previous => ({ ...previous, ceremonies: [...previous.ceremonies, { title: t("newCeremony"), date: previous.fields.date, time: previous.fields.time }] }))}><Plus size={16} />{t("addCeremony")}</button>
  </div>;
  if (section === "schedule") return <div className="e2-dialog-fields e2-schedule">
    {!draft.schedule.length && <p className="e2-description">{t("empty")}</p>}
    {draft.schedule.length > 0 && <div className="e2-schedule-head" aria-hidden="true"><span>{t("scheduleTime")}</span><span>{t("scheduleLabel")}</span></div>}
    {draft.schedule.map((item, index) => <div className="e2-schedule-row" key={index}>
      <label className="e2-field"><span className="sr-only">{t("scheduleTime")}</span><input type="time" value={item.time} onChange={event => onChange(previous => ({ ...previous, schedule: previous.schedule.map((row, i) => i === index ? { ...row, time: event.target.value } : row) }))} /></label>
      <label className="e2-field"><span className="sr-only">{t("scheduleLabel")}</span><input value={item.label} maxLength={120} onChange={event => onChange(previous => ({ ...previous, schedule: previous.schedule.map((row, i) => i === index ? { ...row, label: event.target.value } : row) }))} /></label>
      <button type="button" className="e2-button e2-icon-button e2-danger" aria-label={t("removeSchedule", { number: index + 1 })} title={t("removeSchedule", { number: index + 1 })} onClick={() => onChange(previous => ({ ...previous, schedule: previous.schedule.filter((_, i) => i !== index) }))}><Trash2 size={15} aria-hidden="true" /></button>
    </div>)}
    <button type="button" className="e2-button e2-schedule-add" onClick={() => onChange(previous => ({ ...previous, schedule: [...previous.schedule, { time: "", label: t("newSchedule") }] }))}><Plus size={16} aria-hidden="true" />{t("addSchedule")}</button>
  </div>;
  if (section === "album") return <div className="e2-dialog-fields">
    <label className="e2-checkbox"><input type="checkbox" checked={draft.fields.showAlbum} onChange={event => setField("showAlbum", event.target.checked)} />{t("showAlbum")}</label>
    <p className="e2-description">{t("albumHelp")}</p>
    <fieldset className="e2-album-layouts">
      <legend>{t("albumLayout")}</legend>
      <div className="e2-album-options">
        {(["grid", "mosaic", "coverflow"] as const).map(layout => <label key={layout} className="e2-album-option" data-selected={draft.fields.albumLayout === layout}>
          <input className="sr-only" type="radio" name="albumLayout" value={layout} checked={draft.fields.albumLayout === layout} onChange={() => setField("albumLayout", layout)} />
          <AlbumLayoutPreview layout={layout} photos={displayGallery.slice(0, 6)} size="large" />
          <span className="e2-album-option-label">{t(`layouts.${layout}`)}</span>
          {draft.fields.albumLayout === layout && <Check size={14} className="e2-album-option-check" aria-hidden="true" />}
        </label>)}
      </div>
    </fieldset>
    <Editor2Upload multiple remaining={30 - uploadedGallery.length} onUploading={onUploading} onUploaded={urls => onChange(previous => ({ ...previous, fields: { ...previous.fields, showAlbum: true }, gallery: [...editor2UploadedPhotos(previous.gallery), ...urls].slice(0, 30) }))} />
    {uploadedGallery.length > 0 && <div className="e2-actions">
      <button type="button" className="e2-button e2-danger" onClick={() => onChange(previous => ({ ...previous, gallery: [] }))}>
        <Trash2 size={16} aria-hidden="true" />{t("removeAllPhotos")}
      </button>
    </div>}
    {uploadedGallery.map((url, index) => <div className="e2-photo-row" key={`${url}-${index}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={t("photoAlt", { number: index + 1 })} width={64} height={76} />
      <div className="e2-actions">
        {([-1, 1] as const).map(direction => <button type="button" className="e2-button e2-icon-button" key={direction} aria-label={t(direction === -1 ? "moveUp" : "moveDown")} disabled={index + direction < 0 || index + direction >= uploadedGallery.length}
          onClick={() => onChange(previous => { const gallery = editor2UploadedPhotos(previous.gallery); [gallery[index], gallery[index + direction]] = [gallery[index + direction], gallery[index]]; return { ...previous, gallery }; })}>{direction === -1 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}</button>)}
        <button type="button" className="e2-button e2-icon-button e2-danger" aria-label={t("removePhoto", { number: index + 1 })} onClick={() => onChange(previous => ({ ...previous, gallery: editor2UploadedPhotos(previous.gallery).filter((_, i) => i !== index) }))}><Trash2 size={16} /></button>
      </div>
    </div>)}
  </div>;
  if (section === "music") return <div className="e2-dialog-fields">
    <Editor2MusicFields value={draft.fields.music} title={draft.fields.musicTitle} artist={draft.fields.musicArtist}
      startAt={draft.fields.musicStartAt} enabled={draft.fields.musicEnabled}
      onChange={patch => onChange(previous => ({ ...previous, fields: { ...previous.fields, ...patch } }))} />
  </div>;
  if (section === "photos" && openingPhotoCount === 0) return null;
  if (section === "photos") return <div className="e2-dialog-fields">
    <label className="e2-checkbox"><input type="checkbox" checked={draft.fields.showHeroImage} onChange={event => setField("showHeroImage", event.target.checked)} />{t("showHeroImage")}</label>
    <p className="e2-description">{t("photoHelp")}</p>
    <div className={openingPhotoCount === 2 ? "e2-couple-grid" : "e2-dialog-fields"}>
      {Array.from({ length: openingPhotoCount }, (_, index) => {
        const name = index === 0 ? "heroImage" : "heroImage2";
        const title = openingPhotoCount === 1 ? t("sections.photos") : t(index === 0 ? "brideHeroPhoto" : "groomHeroPhoto");
        return <section key={name} className="e2-repeat" data-e2-hero-slot={name}><h3>{title}</h3>
          {editor2UploadedPhoto(draft.fields[name]) && <div className="e2-photo-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={draft.fields[name]} alt={title} width={64} height={76} />
            <button type="button" className="e2-button e2-danger" onClick={() => setField(name, "")}>{t("remove")}</button>
          </div>}
          <Editor2Upload inputId={`e2-${name}`} uploadLabel={t("uploadPhotoSlot", { slot: title })} onUploading={onUploading} onUploaded={urls => onChange(previous => ({ ...previous, fields: { ...previous.fields, [name]: urls[0], showHeroImage: true } }))} />
        </section>;
      })}
    </div>
  </div>;
  return <div className="e2-dialog-fields">
    <label className="e2-field"><span>{t("chooseTemplate")}</span><select aria-label={t("chooseTemplate")} value={draft.fields.templateId} onChange={event => setField("templateId", event.target.value)}>
      {completedTemplates.map(template => <option key={template.slug} value={template.slug}>{labels[template.slug] ?? template.name}</option>)}
    </select></label>
    {field("primaryColor")}
    <label className="e2-field"><span>{t("fields.fontFamily")}</span><select aria-label={t("fields.fontFamily")} value={draft.fields.fontFamily} onChange={event => setField("fontFamily", event.target.value)}>
      {draft.fields.fontFamily && !FONT_OPTIONS.some(option => option.value === draft.fields.fontFamily) && <option value={draft.fields.fontFamily}>{draft.fields.fontFamily}</option>}
      {FONT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.value ? option.label : t("defaultFont")}</option>)}
    </select></label>
    {field("dressCodeColors")}
  </div>;
}

function Editor2BirthOrderField({ name, value, options, onChange }: {
  name: "brideBirthOrder" | "groomBirthOrder"; value: string; options: SelectOption[]; onChange: (value: string) => void;
}) {
  const t = useTranslations("editor2");
  const [customRequested, setCustomRequested] = useState(false);
  const known = options.some(option => option.value === value);
  const custom = Boolean(value && !known) || (customRequested && !value);
  return <div className="e2-dialog-fields">
    <label className="e2-field"><span>{t(`fields.${name}`)}</span>
      <select id={`e2-${name}`} aria-label={t(`fields.${name}`)} value={custom ? "__custom__" : value} onChange={event => {
        const next = event.target.value;
        setCustomRequested(next === "__custom__");
        onChange(next === "__custom__" ? "" : next);
      }}>
        <option value="">{t("selectBirthOrder")}</option>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        <option value="__custom__">{t("customBirthOrder")}</option>
      </select>
    </label>
    {custom && <label className="e2-field"><span>{t("customBirthOrderLabel", { field: t(`fields.${name}`) })}</span>
      <input aria-label={t("customBirthOrderLabel", { field: t(`fields.${name}`) })} value={value} maxLength={40} onChange={event => onChange(event.target.value)} />
    </label>}
  </div>;
}

function Editor2Upload({ multiple = false, remaining = 1, inputId, uploadLabel, onUploaded, onUploading }: {
  multiple?: boolean; remaining?: number; inputId?: string; uploadLabel?: string; onUploaded: (urls: string[]) => void; onUploading: (uploading: boolean) => void;
}) {
  const t = useTranslations("editor2");
  const uploadT = useTranslations("editor.upload");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(files: File[]) {
    setError(""); setBusy(true); onUploading(true);
    const urls: string[] = [];
    try {
      for (const file of files.slice(0, remaining)) {
        if (file.size > MAX_IMAGE_UPLOAD_SOURCE_BYTES) { setError(uploadT("sourceTooLarge")); continue; }
        const body = new FormData(); body.set("file", file);
        const response = await fetch("/api/upload", { method: "POST", body });
        const result: unknown = await response.json();
        if (!response.ok || !result || typeof result !== "object" || !("url" in result) || typeof result.url !== "string") {
          setError(t("uploadError")); continue;
        }
        urls.push(result.url);
      }
      if (urls.length) onUploaded(urls);
    } catch { setError(t("uploadError")); }
    finally { setBusy(false); onUploading(false); }
  }
  return <div>
    <label className="e2-upload"><Upload size={22} aria-hidden /><span>{t(busy ? "uploading" : "upload")}</span>
      <input id={inputId} type="file" accept={EDITOR_IMAGE_ACCEPT} multiple={multiple} disabled={busy || remaining <= 0} aria-label={uploadLabel ?? t("upload")} onChange={event => {
        const files = Array.from(event.target.files ?? []); event.target.value = ""; if (files.length) void upload(files);
      }} />
    </label>
    <p className="e2-description">{remaining <= 0 ? t("imageLimit") : multiple ? uploadT("galleryHelp") : t("singlePhotoUploadHelp")}</p>
    {error && <p className="e2-error" role="alert">{error}</p>}
  </div>;
}
