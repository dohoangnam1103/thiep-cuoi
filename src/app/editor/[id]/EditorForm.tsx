"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Toaster, toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { ChungDoiDemo } from "@/components/chungdoi-demo";
import { templates } from "@/data/chungdoi";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { BIRTH_ORDER_OPTIONS, FONT_OPTIONS, MUSIC_OPTIONS, type SelectOption } from "@/data/editor-options";
import type { InvitationContent } from "@/generated/prisma/client";
import { saveDraft, publish, checkSlug, type EditorState } from "./actions";
import { readDraft, useFormDraft, type Draft } from "@/hooks/use-form-draft";
import { VALID_TEMPLATE_IDS } from "./templates";

type EditorFormProps = {
  invitationId: string;
  status: string;
  currentSlug: string | null;
  templateId: string;
  content: InvitationContent | null;
  schedule: { time: string; label: string }[];
  gallery: string[];
};

const TEMPLATE_LABELS: Record<(typeof VALID_TEMPLATE_IDS)[number], string> = {
  "double-phoenix-red": "Song Phụng Đỏ",
  "double-phoenix-green": "Song Phụng Xanh",
  "song-hy-red": "Song Hỷ Đỏ",
  "song-hy-green": "Song Hỷ Xanh",
  "nhat-binh-red": "Nhật Bình Đỏ",
  "co-ba-red": "Cô Ba Đỏ",
  "dragon-phoenix-red": "Long Phụng Đỏ",
  "double-dragon-red": "Song Long Đỏ",
  "double-dragon-blue": "Song Long Xanh Dương",
  "double-dragon-green": "Song Long Xanh Lá",
};

function field(content: InvitationContent | null, key: keyof InvitationContent): string {
  const v = content?.[key];
  return typeof v === "string" ? v : "";
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Like slugify but keeps a trailing hyphen so the user can type multi-word slugs. */
function slugifyInput(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "");
}

function slugFromNames(content: InvitationContent | null): string {
  const bride = (content?.brideShortName || content?.brideFullName || "").trim();
  const groom = (content?.groomShortName || content?.groomFullName || "").trim();
  if (!bride && !groom) return "";
  const order = (content?.brideFirst ?? true) ? [bride, groom] : [groom, bride];
  return slugify(order.filter(Boolean).join(" "));
}

function normalizeBirthOrder(value: string): string {
  const trimmed = value.trim();
  const key = slugify(trimmed);
  const labels: Record<string, string> = {
    "ut-nu": "Út Nữ",
    "ut-nam": "Út Nam",
    "truong-nu": "Trưởng Nữ",
    "truong-nam": "Trưởng Nam",
    "thu-nu": "Thứ Nữ",
    "thu-nam": "Thứ Nam",
  };
  return labels[key] ?? trimmed;
}

function buildPreviewContent(form: HTMLFormElement, invitationId: string): ChungDoiDemoContent {
  const read = (name: string) =>
    ((form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null)?.value ?? "").trim();
  const readAll = (name: string) =>
    Array.from(form.querySelectorAll<HTMLInputElement>(`[name="${name}"]`)).map((el) => el.value);
  const brideFirst = (form.elements.namedItem("brideFirst") as HTMLInputElement | null)?.checked ?? true;

  const templateId = read("templateId");
  const brideFullName = read("brideFullName");
  const groomFullName = read("groomFullName");
  const brideShortName = read("brideShortName") || brideFullName;
  const groomShortName = read("groomShortName") || groomFullName;
  const times = readAll("scheduleTime");
  const labels = readAll("scheduleLabel");
  const schedule: { time: string; label: string }[] = [];
  for (let i = 0; i < Math.max(times.length, labels.length); i++) {
    const time = (times[i] ?? "").trim();
    const label = (labels[i] ?? "").trim();
    if (time || label) schedule.push({ time, label });
  }
  const gallery = readAll("galleryUrl")
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 30);

  return {
    slug: templateId,
    invitationId,
    theme: {
      primaryColor: read("primaryColor") || "#c8102e",
      fontFamily: read("fontFamily") || null,
      assetFolder: null,
      assets: [],
    },
    couple: {
      brideFullName,
      groomFullName,
      brideShortName,
      groomShortName,
      brideBirthOrder: normalizeBirthOrder(read("brideBirthOrder")),
      groomBirthOrder: normalizeBirthOrder(read("groomBirthOrder")),
      brideFirst,
      date: read("date"),
      time: read("time"),
      ceremonyDate: read("ceremonyDate"),
      ceremonyTime: read("ceremonyTime"),
      ceremonyHeader: read("ceremonyHeader"),
    },
    families: {
      brideFather: read("brideFather"),
      brideMother: read("brideMother"),
      brideAddress: read("brideAddress"),
      groomFather: read("groomFather"),
      groomMother: read("groomMother"),
      groomAddress: read("groomAddress"),
      brideParentTitle: read("brideParentTitle"),
      groomParentTitle: read("groomParentTitle"),
    },
    venue: {
      address: read("address"),
      mapAddress: read("mapAddress"),
      banquetTime: read("banquetTime"),
    },
    schedule,
    gallery,
    wishes: [],
    bank: {
      brideBankName: read("brideBankName"),
      brideAccountNumber: read("brideAccountNumber"),
      brideAccountName: read("brideAccountName"),
      groomBankName: read("groomBankName"),
      groomAccountNumber: read("groomAccountNumber"),
      groomAccountName: read("groomAccountName"),
    },
    music: read("music") || null,
  };
}

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-ring";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const optionClass = "bg-card text-foreground";

function Accordion({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2 font-pattaya text-xl text-primary">
          <span aria-hidden>{icon}</span>
          {title}
        </span>
        <span className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
          ⌄
        </span>
      </button>
      <div className={open ? "px-5 pb-5" : "hidden"}>{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Text({
  name,
  label,
  defaultValue,
  placeholder,
  hint,
  type = "text",
  full,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
  type?: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={inputClass}
      />
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Select({
  name,
  label,
  defaultValue,
  options,
  hint,
  full,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options: SelectOption[];
  hint?: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <select id={name} name={name} defaultValue={defaultValue} className={inputClass}>
        {options.map((o) => (
          <option key={o.value} value={o.value} className={optionClass}>
            {o.label}
          </option>
        ))}
      </select>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Dropdown thứ bậc với lựa chọn "Khác" cho phép gõ tự do, giữ tương thích giá trị cũ. */
function BirthOrderField({
  name,
  label,
  defaultValue = "",
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
}) {
  const known = BIRTH_ORDER_OPTIONS.some((o) => o.value === defaultValue);
  const [custom, setCustom] = useState(!!defaultValue && !known);
  const [value, setValue] = useState(defaultValue);

  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      {custom ? (
        <input
          id={name}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="VD: Trưởng Nữ"
          className={inputClass}
          autoFocus
        />
      ) : (
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => {
            if (e.target.value === "__custom__") {
              setCustom(true);
              setValue("");
            } else {
              setValue(e.target.value);
            }
          }}
          className={inputClass}
        >
          <option value="" className={optionClass}>
            — Chọn thứ bậc —
          </option>
          {BIRTH_ORDER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className={optionClass}>
              {o.label}
            </option>
          ))}
          <option value="__custom__" className={optionClass}>
            Khác…
          </option>
        </select>
      )}
      {custom ? (
        <button
          type="button"
          onClick={() => {
            setCustom(false);
            setValue("");
          }}
          className="mt-1 text-xs text-primary hover:underline"
        >
          Chọn từ danh sách
        </button>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Chọn nhạc nền từ danh sách + nghe thử. */
function MusicField({ defaultValue = "" }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  function togglePlay() {
    const el = audioRef.current;
    if (!el || !value) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      void el.play();
      setPlaying(true);
    }
  }

  return (
    <div>
      <label htmlFor="music" className={labelClass}>
        Nhạc nền
      </label>
      <div className="flex items-center gap-2">
        <select
          id="music"
          name="music"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setPlaying(false);
            audioRef.current?.pause();
          }}
          className={inputClass}
        >
          {MUSIC_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className={optionClass}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={togglePlay}
          disabled={!value}
          className="shrink-0 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-40"
          aria-label={playing ? "Dừng" : "Nghe thử"}
        >
          {playing ? "⏸" : "▶"}
        </button>
      </div>
      {value ? (
        <audio ref={audioRef} src={value} onEnded={() => setPlaying(false)} preload="none" />
      ) : null}
    </div>
  );
}

/** Chọn mẫu thiệp bằng lưới thumbnail thay cho <select>. */
function TemplatePicker({ defaultValue }: { defaultValue: string }) {
  const [selected, setSelected] = useState(defaultValue);
  return (
    <div className="sm:col-span-2">
      <span className={labelClass}>Mẫu thiệp</span>
      <input type="hidden" name="templateId" value={selected} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {VALID_TEMPLATE_IDS.map((id) => {
          const tpl = templates.find((t) => t.slug === id);
          const active = selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              className={`group relative overflow-hidden rounded-xl border text-left transition ${
                active
                  ? "border-primary ring-2 ring-primary/40"
                  : "border-border hover:border-primary/40"
              }`}
              aria-pressed={active}
            >
              {tpl?.listing ? (
                <span className="block aspect-[3/4] bg-muted">
                  <Image
                    src={tpl.listing}
                    alt={TEMPLATE_LABELS[id]}
                    width={240}
                    height={320}
                    className="h-full w-full object-cover"
                  />
                </span>
              ) : (
                <span className="block aspect-[3/4] bg-muted" />
              )}
              <span className="block px-2 py-1.5 text-xs font-semibold text-foreground">
                {TEMPLATE_LABELS[id]}
              </span>
              {active ? (
                <span className="absolute right-2 top-2 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                  ✓
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SortablePhoto({ url, onRemove }: { url: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
    >
      <input type="hidden" name="galleryUrl" value={url} />
      <Image src={url} alt="Ảnh album" fill sizes="200px" className="object-cover" />
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute left-1.5 top-1.5 cursor-grab rounded-md bg-foreground/70 px-1.5 py-0.5 text-xs text-background active:cursor-grabbing"
        aria-label="Kéo để sắp xếp"
      >
        ⠿
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 rounded-md bg-foreground/70 px-1.5 py-0.5 text-xs text-background hover:bg-destructive"
        aria-label="Xoá ảnh"
      >
        ✕
      </button>
    </div>
  );
}

/** Upload + sắp xếp ảnh album. Mỗi ảnh render hidden input galleryUrl để action đọc như cũ. */
function GalleryUploader({ initial }: { initial: string[] }) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    const remaining = 30 - urls.length;
    if (remaining <= 0) {
      toast.error("Tối đa 30 ảnh");
      return;
    }
    setUploading(true);
    let added = 0;
    for (const file of list.slice(0, remaining)) {
      const body = new FormData();
      body.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          toast.error(data.error ?? "Tải ảnh thất bại");
          continue;
        }
        setUrls((prev) => [...prev, data.url!]);
        added += 1;
      } catch {
        toast.error("Tải ảnh thất bại");
      }
    }
    setUploading(false);
    if (added) toast.success(`Đã thêm ${added} ảnh`);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setUrls((prev) => {
      const from = prev.indexOf(String(active.id));
      const to = prev.indexOf(String(over.id));
      if (from === -1 || to === -1) return prev;
      return arrayMove(prev, from, to);
    });
  }

  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground">
        Tải ảnh lên để hiển thị trong album thiệp. Kéo để sắp xếp thứ tự, tối đa 30 ảnh (≤5MB mỗi ảnh).
      </p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`mb-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
        }`}
      >
        <span className="text-2xl" aria-hidden>
          ◱
        </span>
        <p className="mt-2 text-sm text-muted-foreground">
          {uploading ? "Đang tải ảnh…" : "Kéo thả ảnh vào đây hoặc bấm để chọn"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {urls.length ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={urls} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {urls.map((url) => (
                <SortablePhoto
                  key={url}
                  url={url}
                  onRemove={() => setUrls((prev) => prev.filter((u) => u !== url))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : null}
    </div>
  );
}

function ColorField({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue || "#c8102e");
  const valid = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={valid ? value : "#c8102e"}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-input bg-background"
          aria-label={`${label} - bảng màu`}
        />
        <input
          id={name}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="#c8102e"
          className={inputClass}
        />
      </div>
    </div>
  );
}

function SubHeader({ children }: { children: React.ReactNode }) {
  return <p className="sm:col-span-2 -mb-1 text-sm font-semibold text-foreground">{children}</p>;
}

function TabBar({ tab, onEdit, onPreview }: { tab: "edit" | "preview"; onEdit: () => void; onPreview: () => void }) {
  const base = "rounded-full px-4 py-2 text-sm font-semibold transition";
  const active = "bg-primary text-primary-foreground shadow-lg shadow-primary/25";
  const idle = "text-muted-foreground hover:bg-muted";
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card/80 p-1 backdrop-blur">
      <button type="button" onClick={onEdit} className={`${base} ${tab === "edit" ? active : idle}`}>
        Chỉnh sửa
      </button>
      <button type="button" onClick={onPreview} className={`${base} ${tab === "preview" ? active : idle}`}>
        Xem trước
      </button>
    </div>
  );
}

export function EditorForm({
  invitationId,
  status,
  currentSlug,
  templateId,
  content,
  schedule,
  gallery,
}: EditorFormProps) {
  const saveAction = saveDraft.bind(null, invitationId);
  const publishAction = publish.bind(null, invitationId);
  const [saveState, saveFormAction, saving] = useActionState<EditorState, FormData>(saveAction, undefined);
  const [publishState, publishFormAction, publishing] = useActionState<EditorState, FormData>(
    publishAction,
    undefined,
  );

  const serverEmpty = content == null;
  const draft = useMemo<Draft | null>(
    () => (serverEmpty ? readDraft(invitationId) : null),
    [serverEmpty, invitationId],
  );
  const seed = (key: string, fallback: string) =>
    typeof draft?.[key] === "string" ? (draft[key] as string) : fallback;
  const seedBool = (key: string, fallback: boolean) =>
    typeof draft?.[key] === "boolean" ? (draft[key] as boolean) : fallback;

  const [scheduleRows, setScheduleRows] = useState(() => {
    const dTime = Array.isArray(draft?.scheduleTime) ? (draft!.scheduleTime as string[]) : null;
    const dLabel = Array.isArray(draft?.scheduleLabel) ? (draft!.scheduleLabel as string[]) : null;
    if (dTime || dLabel) {
      const rows: { time: string; label: string }[] = [];
      const n = Math.max(dTime?.length ?? 0, dLabel?.length ?? 0);
      for (let i = 0; i < n; i++) {
        rows.push({ time: dTime?.[i] ?? "", label: dLabel?.[i] ?? "" });
      }
      if (rows.length) return rows;
    }
    return schedule.length ? schedule : [{ time: "", label: "" }];
  });

  const [slug, setSlug] = useState(currentSlug || slugFromNames(content));
  const [slugStatus, setSlugStatus] = useState<{ available: boolean; reason?: string } | null>(null);
  const [checking, startCheck] = useTransition();

  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [previewContent, setPreviewContent] = useState<ChungDoiDemoContent | null>(null);

  useEffect(() => {
    if (saveState?.ok) toast.success("Đã lưu bản nháp");
    else if (saveState?.error) toast.error(saveState.error);
  }, [saveState]);

  useEffect(() => {
    if (publishState?.error) toast.error(publishState.error);
  }, [publishState]);

  useFormDraft({
    formId: "editor-form",
    invitationId,
    enabled: serverEmpty,
    cleared: saveState?.ok === true,
  });

  function onShowPreview() {
    const form = document.getElementById("editor-form") as HTMLFormElement | null;
    if (!form) return;
    setPreviewContent(buildPreviewContent(form, invitationId));
    setTab("preview");
  }

  function onGenerateSlug() {
    const form = document.getElementById("editor-form") as HTMLFormElement | null;
    const read = (name: string) => (form?.elements.namedItem(name) as HTMLInputElement | null)?.value ?? "";
    const bride = (read("brideShortName") || read("brideFullName")).trim();
    const groom = (read("groomShortName") || read("groomFullName")).trim();
    const brideFirst = (form?.elements.namedItem("brideFirst") as HTMLInputElement | null)?.checked ?? true;
    const order = brideFirst ? [bride, groom] : [groom, bride];
    const next = slugify(order.filter(Boolean).join(" "));
    setSlug(next);
    setSlugStatus(next ? null : { available: false, reason: "Chưa có tên cô dâu/chú rể" });
  }

  function onCheckSlug() {
    if (!slug.trim()) {
      setSlugStatus({ available: false, reason: "Chưa nhập đường dẫn" });
      return;
    }
    startCheck(async () => {
      const result = await checkSlug(slug, invitationId);
      setSlugStatus(result);
    });
  }

  return (
    <>
      <Toaster position="top-center" theme="light" richColors />
      {tab === "preview" && previewContent ? (
        <>
          <div className="fixed left-1/2 top-4 z-[120] -translate-x-1/2">
            <TabBar tab={tab} onEdit={() => setTab("edit")} onPreview={onShowPreview} />
          </div>
          <ChungDoiDemo
            key={JSON.stringify(previewContent)}
            template={templates.find((t) => t.slug === previewContent.slug) ?? templates[0]}
            content={previewContent}
          />
        </>
      ) : null}

      <div className={`mx-auto max-w-4xl px-4 py-8 sm:px-6 ${tab === "preview" ? "hidden" : ""}`}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              ← Bảng điều khiển
            </Link>
            <h1 className="mt-1 font-pattaya text-3xl text-foreground">Chỉnh sửa thiệp</h1>
            <p className="text-sm text-muted-foreground">
              Trạng thái: {status === "published" ? "Đã xuất bản" : "Bản nháp"}
            </p>
          </div>
          <TabBar tab={tab} onEdit={() => setTab("edit")} onPreview={onShowPreview} />
        </div>

        <form action={saveFormAction} className="space-y-4" id="editor-form">
        <Accordion title="Mẫu thiệp" icon="✧" defaultOpen={false}>
          <TemplatePicker defaultValue={seed("templateId", templateId)} />
        </Accordion>

        <Accordion title="Thông tin cơ bản" icon="♡">
          <Grid>
            <Text
              name="brideFullName"
              label="Họ tên cô dâu"
              defaultValue={seed("brideFullName", field(content, "brideFullName"))}
              placeholder="VD: Nguyễn Quỳnh Anh"
              hint="Họ tên đầy đủ, hiển thị ở phần giới thiệu."
            />
            <Text
              name="groomFullName"
              label="Họ tên chú rể"
              defaultValue={seed("groomFullName", field(content, "groomFullName"))}
              placeholder="VD: Trần Gia Khánh"
              hint="Họ tên đầy đủ, hiển thị ở phần giới thiệu."
            />
            <Text
              name="brideShortName"
              label="Tên gọi cô dâu"
              defaultValue={seed("brideShortName", field(content, "brideShortName"))}
              placeholder="VD: Quỳnh Anh"
              hint="Tên ngắn để in to trên thiệp (VD: Quỳnh Anh & Gia Khánh)."
            />
            <Text
              name="groomShortName"
              label="Tên gọi chú rể"
              defaultValue={seed("groomShortName", field(content, "groomShortName"))}
              placeholder="VD: Gia Khánh"
              hint="Tên ngắn để in to trên thiệp."
            />
            <BirthOrderField
              name="brideBirthOrder"
              label="Thứ bậc cô dâu"
              defaultValue={seed("brideBirthOrder", field(content, "brideBirthOrder"))}
              hint="Hiển thị dưới ảnh cô dâu."
            />
            <BirthOrderField
              name="groomBirthOrder"
              label="Thứ bậc chú rể"
              defaultValue={seed("groomBirthOrder", field(content, "groomBirthOrder"))}
              hint="Hiển thị dưới ảnh chú rể."
            />
            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                id="brideFirst"
                name="brideFirst"
                type="checkbox"
                value="true"
                defaultChecked={seedBool("brideFirst", content?.brideFirst ?? true)}
                className="size-4 accent-primary"
              />
              <label htmlFor="brideFirst" className="text-sm text-foreground">
                Hiển thị cô dâu trước
              </label>
            </div>
            <Text name="date" label="Ngày cưới" type="date" defaultValue={seed("date", field(content, "date"))} hint="Ngày tổ chức chính, hiển thị nổi bật trên thiệp." />
            <Text name="time" label="Giờ cưới" type="time" defaultValue={seed("time", field(content, "time"))} />
            <Text name="ceremonyDate" label="Ngày lễ" type="date" defaultValue={seed("ceremonyDate", field(content, "ceremonyDate"))} hint="Ngày lễ vu quy/thành hôn nếu khác ngày cưới." />
            <Text name="ceremonyTime" label="Giờ lễ" type="time" defaultValue={seed("ceremonyTime", field(content, "ceremonyTime"))} />
            <Text
              name="ceremonyHeader"
              label="Tiêu đề lễ"
              defaultValue={seed("ceremonyHeader", field(content, "ceremonyHeader"))}
              placeholder="VD: Lễ Thành Hôn"
              hint="Dòng chữ đặt trên phần thông tin lễ (VD: Lễ Vu Quy, Lễ Thành Hôn)."
              full
            />
            <ColorField name="primaryColor" label="Màu chủ đạo" defaultValue={seed("primaryColor", field(content, "primaryColor"))} />
          </Grid>
        </Accordion>

        <Accordion title="Thông tin gia đình" icon="⌂">
          <Grid>
            <SubHeader>Nhà trai</SubHeader>
            <Text name="groomFather" label="Cha chú rể" defaultValue={seed("groomFather", field(content, "groomFather"))} placeholder="VD: Ông Trần Văn Minh" />
            <Text name="groomMother" label="Mẹ chú rể" defaultValue={seed("groomMother", field(content, "groomMother"))} placeholder="VD: Bà Phạm Thị Hoa" />
            <Text
              name="groomParentTitle"
              label="Danh xưng nhà trai"
              defaultValue={seed("groomParentTitle", field(content, "groomParentTitle"))}
              placeholder="VD: Ông Bà"
              hint="Cách gọi cha mẹ trên thiệp (VD: Ông Bà, Gia đình)."
            />
            <Text name="groomAddress" label="Địa chỉ nhà trai" defaultValue={seed("groomAddress", field(content, "groomAddress"))} placeholder="Số nhà, đường, phường/xã, tỉnh/thành" full />

            <SubHeader>Nhà gái</SubHeader>
            <Text name="brideFather" label="Cha cô dâu" defaultValue={seed("brideFather", field(content, "brideFather"))} placeholder="VD: Ông Nguyễn Văn Hưng" />
            <Text name="brideMother" label="Mẹ cô dâu" defaultValue={seed("brideMother", field(content, "brideMother"))} placeholder="VD: Bà Trần Thị Lan" />
            <Text
              name="brideParentTitle"
              label="Danh xưng nhà gái"
              defaultValue={seed("brideParentTitle", field(content, "brideParentTitle"))}
              placeholder="VD: Ông Bà"
              hint="Cách gọi cha mẹ trên thiệp (VD: Ông Bà, Gia đình)."
            />
            <Text name="brideAddress" label="Địa chỉ nhà gái" defaultValue={seed("brideAddress", field(content, "brideAddress"))} placeholder="Số nhà, đường, phường/xã, tỉnh/thành" full />
          </Grid>
        </Accordion>

        <Accordion title="Tiệc cưới" icon="✦">
          <Grid>
            <Text
              name="address"
              label="Địa chỉ"
              defaultValue={seed("address", field(content, "address"))}
              placeholder="VD: Trung tâm tiệc cưới ABC, 123 Lê Lợi, Q.1, TP.HCM"
              hint="Địa chỉ hiển thị trên thiệp cho khách xem."
              full
            />
            <Text
              name="mapAddress"
              label="Địa chỉ bản đồ"
              defaultValue={seed("mapAddress", field(content, "mapAddress"))}
              placeholder="Dán địa chỉ hoặc tên nơi tổ chức để tìm trên Google Maps"
              hint="Dùng để nhúng bản đồ chỉ đường. Nên dán đúng như trên Google Maps."
              full
            />
            <Text
              name="banquetTime"
              label="Giờ đãi tiệc"
              defaultValue={seed("banquetTime", field(content, "banquetTime"))}
              placeholder="VD: 18:00 Thứ Bảy, 14/06/2026"
            />
          </Grid>
        </Accordion>

        <Accordion title="Chương trình" icon="✿">
          <p className="mb-3 text-xs text-muted-foreground">
            Các mốc thời gian trong ngày cưới, ví dụ: 09:00 Lễ Vu Quy, 11:00 Đón khách, 18:00 Khai tiệc.
          </p>
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setScheduleRows((r) => [...r, { time: "", label: "" }])}
              className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted"
            >
              + Thêm mốc
            </button>
          </div>
          <div className="space-y-3">
            {scheduleRows.map((row, i) => (
              <div key={i} className="flex gap-3">
                <input
                  name="scheduleTime"
                  type="time"
                  defaultValue={row.time}
                  className={`${inputClass} w-32`}
                />
                <input name="scheduleLabel" defaultValue={row.label} placeholder="Lễ Vu Quy" className={inputClass} />
                <button
                  type="button"
                  onClick={() => setScheduleRows((r) => r.filter((_, idx) => idx !== i))}
                  className="shrink-0 rounded-lg border border-border px-3 text-sm text-muted-foreground hover:text-destructive"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </Accordion>

        <Accordion title="Album ảnh" icon="◱">
          <GalleryUploader initial={Array.isArray(draft?.galleryUrl) ? (draft!.galleryUrl as string[]) : gallery} />
        </Accordion>

        <Accordion title="Font & Nhạc" icon="♪" defaultOpen={false}>
          <Grid>
            <Select
              name="fontFamily"
              label="Font chữ"
              defaultValue={seed("fontFamily", field(content, "fontFamily"))}
              options={FONT_OPTIONS}
              hint="Font hiển thị tên cô dâu chú rể trên thiệp."
            />
            <MusicField defaultValue={seed("music", field(content, "music"))} />
          </Grid>
        </Accordion>

        <Accordion title="Thông tin chuyển khoản" icon="✉" defaultOpen={false}>
          <Grid>
            <SubHeader>Nhà trai</SubHeader>
            <Text name="groomBankName" label="Ngân hàng chú rể" defaultValue={seed("groomBankName", field(content, "groomBankName"))} />
            <Text name="groomAccountNumber" label="Số tài khoản chú rể" defaultValue={seed("groomAccountNumber", field(content, "groomAccountNumber"))} />
            <Text name="groomAccountName" label="Chủ tài khoản chú rể" defaultValue={seed("groomAccountName", field(content, "groomAccountName"))} full />

            <SubHeader>Nhà gái</SubHeader>
            <Text name="brideBankName" label="Ngân hàng cô dâu" defaultValue={seed("brideBankName", field(content, "brideBankName"))} />
            <Text name="brideAccountNumber" label="Số tài khoản cô dâu" defaultValue={seed("brideAccountNumber", field(content, "brideAccountNumber"))} />
            <Text name="brideAccountName" label="Chủ tài khoản cô dâu" defaultValue={seed("brideAccountName", field(content, "brideAccountName"))} full />
          </Grid>
        </Accordion>

        <div className="sticky bottom-0 -mx-4 mt-2 flex items-center gap-3 border-t border-border bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu bản nháp"}
          </button>
          <button
            type="button"
            onClick={onShowPreview}
            className="rounded-full border border-border bg-secondary px-6 py-2.5 font-semibold text-foreground transition hover:bg-muted"
          >
            Xem trước
          </button>
        </div>
      </form>

      <section className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <h2 className="mb-4 font-pattaya text-xl text-primary">Xuất bản</h2>
        <form
          action={publishFormAction}
          onSubmit={() => {
            try {
              window.localStorage.removeItem(`chungdoi:draft:${invitationId}`);
            } catch {}
          }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <label htmlFor="slug" className={labelClass}>
              Đường dẫn công khai
            </label>
            <button
              type="button"
              onClick={onGenerateSlug}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Tạo từ tên
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">/thiep/</span>
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(slugifyInput(e.target.value));
                setSlugStatus(null);
              }}
              placeholder="quynh-anh-gia-khanh"
              className={inputClass}
            />
            <button
              type="button"
              onClick={onCheckSlug}
              disabled={checking}
              className="shrink-0 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-60"
            >
              {checking ? "..." : "Kiểm tra"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Tự tạo từ tên cô dâu/chú rể, bạn có thể sửa lại tuỳ ý.</p>
          {slugStatus ? (
            <p className={`text-sm ${slugStatus.available ? "text-emerald-700" : "text-red-700"}`}>
              {slugStatus.available ? "Đường dẫn khả dụng" : slugStatus.reason}
            </p>
          ) : null}
          {publishState?.error ? (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700">{publishState.error}</p>
          ) : null}
          <button
            type="submit"
            disabled={publishing}
            className="rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-60"
          >
            {publishing ? "Đang xuất bản..." : "Xuất bản thiệp"}
          </button>
          <p className="text-xs text-muted-foreground">Nhớ lưu bản nháp trước khi xuất bản.</p>
        </form>
      </section>
      </div>
    </>
  );
}
