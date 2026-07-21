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
import { BankCombobox } from "@/components/ui/bank-combobox";
import { Combobox } from "@/components/ui/combobox";
import { completedTemplates } from "@/data/chungdoi";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { MusicPicker } from "@/components/music-picker";
import { BIRTH_ORDER_OPTIONS, FONT_OPTIONS, type SelectOption } from "@/data/editor-options";
import type { InvitationContent } from "@/generated/prisma/client";
import type { MusicPickerMessages } from "@/lib/music-picker";
import { trackEvent } from "@/lib/analytics";
import { saveDraft, publish, checkSlug } from "./actions";
import { type EditorState } from "./content-schema";
import {
  draftsEqual,
  readDraft,
  useFormDraft,
  type Draft,
  type DraftStatus,
  type DraftStatusMessages,
} from "@/hooks/use-form-draft";
import { slugify, slugifyInput, slugFromFormFields } from "./slug";
import { templateLabel } from "./templates";

type EditorFormProps = {
  invitationId: string;
  status: string;
  paid: boolean;
  currentSlug: string | null;
  templateId: string;
  content: InvitationContent | null;
  schedule: { time: string; label: string }[];
  gallery: string[];
  locale: string;
  musicMessages: MusicPickerMessages;
  draftMessages: DraftStatusMessages;
  initialTrack: { url: string; title: string; artist: string } | null;
  saveAction?: (id: string, prev: EditorState, formData: FormData) => Promise<EditorState>;
  adminMode?: boolean;
};

function field(content: InvitationContent | null, key: keyof InvitationContent): string {
  const v = content?.[key];
  return typeof v === "string" ? v : "";
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
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
  type?: string;
  full?: boolean;
  required?: boolean;
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
        required={required}
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
      <Combobox
        inputId={name}
        name={name}
        defaultValue={defaultValue}
        options={options}
        isSearchable
        placeholder="Chọn…"
      />
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
  const hiddenRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(false);

  const options = [
    ...BIRTH_ORDER_OPTIONS,
    { value: "__custom__", label: "Khác…" },
  ];

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    hiddenRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [value]);

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
        <>
          <input ref={hiddenRef} type="hidden" name={name} value={value} readOnly />
          <Combobox
            inputId={name}
            value={value}
            onChange={(next) => {
              if (next === "__custom__") {
                setCustom(true);
                setValue("");
              } else {
                setValue(next);
              }
            }}
            options={options}
            placeholder="— Chọn thứ bậc —"
            aria-label={label}
          />
        </>
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

/** Chọn mẫu thiệp bằng lưới thumbnail thay cho <select>. */
function TemplatePicker({ defaultValue }: { defaultValue: string }) {
  const [selected, setSelected] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    inputRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [selected]);

  return (
    <div className="sm:col-span-2">
      <span className={labelClass}>Mẫu thiệp</span>
      <input ref={inputRef} type="hidden" name="templateId" value={selected} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="editor-template-picker">
        {completedTemplates.map((template) => {
          const active = selected === template.slug;
          return (
            <button
              key={template.slug}
              type="button"
              onClick={() => setSelected(template.slug)}
              className={`group relative overflow-hidden rounded-xl border text-left transition ${
                active
                  ? "border-primary ring-2 ring-primary/40"
                  : "border-border hover:border-primary/40"
              }`}
              aria-pressed={active}
              data-template-id={template.slug}
            >
              <span className="relative block aspect-[3/4] overflow-hidden bg-muted">
                <Image
                  src={template.listing}
                  alt={templateLabel(template.slug)}
                  fill
                  sizes="(min-width: 640px) 200px, 50vw"
                  className="object-cover object-top transition-[object-position,transform] duration-[9000ms] ease-in-out group-hover:object-bottom group-hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none"
                />
              </span>
              <span className="block px-2 py-1.5 text-xs font-semibold text-foreground">
                {templateLabel(template.slug)}
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
  paid,
  currentSlug,
  templateId,
  content,
  schedule,
  gallery,
  locale,
  musicMessages,
  draftMessages,
  initialTrack,
  saveAction: saveActionProp,
  adminMode = false,
}: EditorFormProps) {
  const saveAction = (saveActionProp ?? saveDraft).bind(null, invitationId);
  const publishAction = publish.bind(null, invitationId);
  const [saveState, saveFormAction, saving] = useActionState<EditorState, FormData>(saveAction, undefined);
  const [publishState, publishFormAction, publishing] = useActionState<EditorState, FormData>(
    publishAction,
    undefined,
  );

  const draft = useMemo<Draft | null>(
    () => readDraft(invitationId),
    [invitationId],
  );
  const [submittedDraft, setSubmittedDraft] = useState<Draft | null>(null);
  const submittedDraftRef = useRef<Draft | null>(null);
  const activeDraft = submittedDraft ?? draft;
  const seed = (key: string, fallback: string) =>
    typeof activeDraft?.[key] === "string" ? (activeDraft[key] as string) : fallback;
  const seedBool = (key: string, fallback: boolean) =>
    typeof activeDraft?.[key] === "boolean" ? (activeDraft[key] as boolean) : fallback;

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

  const initialSlug = currentSlug || slugFromFormFields({
    brideFullName: seed("brideFullName", field(content, "brideFullName")),
    groomFullName: seed("groomFullName", field(content, "groomFullName")),
    brideShortName: seed("brideShortName", field(content, "brideShortName")),
    groomShortName: seed("groomShortName", field(content, "groomShortName")),
    brideFirst: seedBool("brideFirst", content?.brideFirst ?? true),
  });
  const [slug, setSlug] = useState(initialSlug);
  const [slugEdited, setSlugEdited] = useState(Boolean(currentSlug));
  const [slugStatus, setSlugStatus] = useState<{ available: boolean; reason?: string } | null>(null);
  const [checking, startCheck] = useTransition();

  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [previewContent, setPreviewContent] = useState<ChungDoiDemoContent | null>(null);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>(draft ? "restored" : "server");
  const {
    capture: captureDraft,
    clear: clearDraft,
    getLatest: getLatestDraft,
    persist: persistDraft,
  } = useFormDraft({
    formId: "editor-form",
    invitationId,
    enabled: true,
    onStatusChange: setDraftStatus,
  });

  function reconcilePersistedDraft() {
    const submitted = submittedDraftRef.current;
    if (!submitted) return;

    const latest = getLatestDraft() ?? readDraft(invitationId) ?? submitted;
    setSubmittedDraft(latest);
    if (draftsEqual(latest, submitted)) {
      clearDraft();
    } else {
      // Người dùng đã gõ thêm trong lúc request đang chạy: giữ snapshot mới hơn.
      persistDraft(latest);
    }
  }

  useEffect(() => {
    if (saveState?.ok) {
      toast.success("Đã lưu bản nháp");
      trackEvent("save_draft", { template_id: templateId });
    }
    else if (saveState?.error) toast.error(saveState.error);
    if (saveState?.persisted) reconcilePersistedDraft();
    // Mỗi object saveState tương ứng với đúng một lần Server Action hoàn tất.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveState]);

  useEffect(() => {
    if (publishState?.error) {
      toast.error(publishState.error);
      trackEvent("publish_invitation_error", {
        template_id: templateId,
        validation_message: publishState.error,
      });
    }
    if (publishState?.persisted) reconcilePersistedDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishState]);

  function onShowPreview() {
    const form = document.getElementById("editor-form") as HTMLFormElement | null;
    if (!form) return;
    setPreviewContent(buildPreviewContent(form, invitationId));
    setTab("preview");
    trackEvent("preview_invitation", { template_id: templateId });
  }

  function nextSlugFromForm() {
    const form = document.getElementById("editor-form") as HTMLFormElement | null;
    const read = (name: string) => (form?.elements.namedItem(name) as HTMLInputElement | null)?.value ?? "";
    return slugFromFormFields({
      brideFullName: read("brideFullName"),
      groomFullName: read("groomFullName"),
      brideShortName: read("brideShortName"),
      groomShortName: read("groomShortName"),
      brideFirst: (form?.elements.namedItem("brideFirst") as HTMLInputElement | null)?.checked ?? true,
    });
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

  function onEditorInput(event: React.FormEvent<HTMLFormElement>) {
    const target = event.target as HTMLInputElement | HTMLSelectElement | null;
    if (!target?.name || target.name === "slug" || slugEdited) return;
    const next = nextSlugFromForm();
    setSlug(next);
    setSlugStatus(null);
  }

  return (
    <>
      <Toaster position="top-center" theme="light" richColors />
      <div className="fixed left-1/2 top-4 z-[120] -translate-x-1/2">
        <TabBar tab={tab} onEdit={() => setTab("edit")} onPreview={onShowPreview} />
      </div>
      {tab === "preview" && previewContent ? (
        <ChungDoiDemo
          key={JSON.stringify(previewContent)}
          template={
            completedTemplates.find((template) => template.slug === previewContent.slug) ??
            completedTemplates[0]
          }
          content={previewContent}
        />
      ) : null}

      <div className={`mx-auto max-w-4xl px-4 pb-8 pt-24 sm:px-6 ${tab === "preview" ? "hidden" : ""}`}>
        <div className="mb-6">
          <Link
            href={adminMode ? "/admin/demos" : "/dashboard"}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {adminMode ? "← Danh sách thiệp demo" : "← Bảng điều khiển"}
          </Link>
          <h1 className="mt-1 font-pattaya text-3xl text-foreground">Chỉnh sửa thiệp</h1>
          <p className="text-sm text-muted-foreground">
            Trạng thái: {status === "published" ? "Đã xuất bản" : "Bản nháp"}
          </p>
          <p
            aria-live="polite"
            data-testid="draft-status"
            className={`mt-1 flex items-center gap-1.5 text-xs ${
              draftStatus === "error" ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                draftStatus === "error"
                  ? "bg-destructive"
                  : draftStatus === "saving"
                    ? "animate-pulse bg-amber-500"
                    : draftStatus === "server"
                      ? "bg-emerald-500"
                      : "bg-primary"
              }`}
              aria-hidden
            />
            {draftMessages[draftStatus]}
          </p>
        </div>

        <form
          action={saveFormAction}
          onInput={onEditorInput}
          onReset={(event) => event.preventDefault()}
          onSubmitCapture={() => {
            const snapshot = captureDraft();
            if (!snapshot) return;
            submittedDraftRef.current = snapshot;
            setSubmittedDraft(snapshot);

            const times = Array.isArray(snapshot.scheduleTime) ? snapshot.scheduleTime : [];
            const labels = Array.isArray(snapshot.scheduleLabel) ? snapshot.scheduleLabel : [];
            if (times.length || labels.length) {
              setScheduleRows(
                Array.from({ length: Math.max(times.length, labels.length) }, (_, index) => ({
                  time: times[index] ?? "",
                  label: labels[index] ?? "",
                })),
              );
            }
          }}
          className="space-y-4"
          id="editor-form"
        >
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
              required
            />
            <Text
              name="groomFullName"
              label="Họ tên chú rể"
              defaultValue={seed("groomFullName", field(content, "groomFullName"))}
              placeholder="VD: Trần Gia Khánh"
              hint="Họ tên đầy đủ, hiển thị ở phần giới thiệu."
              required
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
            <Text name="date" label="Ngày cưới" type="date" defaultValue={seed("date", field(content, "date"))} hint="Ngày tổ chức chính, hiển thị nổi bật trên thiệp." required />
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
              placeholder="Dán link Google Maps (có ghim vị trí) hoặc địa chỉ nơi tổ chức"
              hint="Mở Google Maps, tìm nhà hàng rồi lấy link: trên điện thoại bấm Chia sẻ > Sao chép liên kết; trên máy tính copy link ở thanh địa chỉ (có @toạ-độ). Dán vào đây để bản đồ hiện đúng ghim. Hoặc dán địa chỉ/tên nơi tổ chức để tìm gần đúng."
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
            <MusicPicker
              defaultValue={seed("music", field(content, "music"))}
              initialTrack={initialTrack}
              locale={locale}
              messages={musicMessages}
            />
          </Grid>
        </Accordion>

        <Accordion title="Thông tin chuyển khoản" icon="✉" defaultOpen={false}>
          <Grid>
            <SubHeader>Nhà trai</SubHeader>
            <BankCombobox
              name="groomBankName"
              label="Ngân hàng chú rể"
              defaultValue={seed("groomBankName", field(content, "groomBankName"))}
            />
            <Text name="groomAccountNumber" label="Số tài khoản chú rể" defaultValue={seed("groomAccountNumber", field(content, "groomAccountNumber"))} />
            <Text name="groomAccountName" label="Chủ tài khoản chú rể" defaultValue={seed("groomAccountName", field(content, "groomAccountName"))} full />

            <SubHeader>Nhà gái</SubHeader>
            <BankCombobox
              name="brideBankName"
              label="Ngân hàng cô dâu"
              defaultValue={seed("brideBankName", field(content, "brideBankName"))}
            />
            <Text name="brideAccountNumber" label="Số tài khoản cô dâu" defaultValue={seed("brideAccountNumber", field(content, "brideAccountNumber"))} />
            <Text name="brideAccountName" label="Chủ tài khoản cô dâu" defaultValue={seed("brideAccountName", field(content, "brideAccountName"))} full />
          </Grid>
        </Accordion>

        <div className="sticky bottom-0 -mx-4 mt-2 flex items-center gap-3 border-t border-border bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <button
            type="submit"
            formNoValidate
            disabled={saving || publishing}
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

      {!adminMode && (
      <section className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <h2 className="mb-4 font-pattaya text-xl text-primary">Xuất bản</h2>
        <div className="space-y-3">
          <label htmlFor="slug" className={labelClass}>
            Đường dẫn công khai
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">/thiep/</span>
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(slugifyInput(e.target.value));
                setSlugStatus(null);
              }}
              placeholder="quynh-anh-gia-khanh"
              className={inputClass}
            />
            <button
              type="button"
              onClick={onCheckSlug}
              disabled={checking || saving || publishing}
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
            formAction={publishFormAction}
            data-ga-event="publish_invitation_attempt"
            data-ga-param-template-id={templateId}
            disabled={saving || publishing}
            className="rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-60"
          >
            {publishing ? "Đang lưu và xuất bản..." : "Xuất bản thiệp"}
          </button>
          <p className="text-xs text-muted-foreground">Hệ thống sẽ tự lưu nội dung mới nhất trước khi xuất bản.</p>
        </div>

        {paid ? (
          <p className="mt-4 text-sm font-semibold text-emerald-700">
            Thiệp đã được kích hoạt vĩnh viễn.
          </p>
        ) : (
          <div className="mt-4 border-t border-primary/20 pt-4">
            <p className="text-sm text-muted-foreground">
              Thiệp dùng thử miễn phí 7 ngày. Thanh toán để kích hoạt vĩnh viễn.
            </p>
            <Link
              href={`/dashboard/${invitationId}/thanh-toan`}
              data-ga-event="checkout_click"
              data-ga-param-source="editor"
              className="mt-3 inline-block rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90"
            >
              Thanh toán để kích hoạt vĩnh viễn
            </Link>
          </div>
        )}
      </section>
      )}
      </form>
      </div>
    </>
  );
}
