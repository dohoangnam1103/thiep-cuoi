"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
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
import { AdaptiveToaster } from "@/components/adaptive-toaster";
import { BankCombobox } from "@/components/ui/bank-combobox";
import { Combobox } from "@/components/ui/combobox";
import { completedTemplates } from "@/data/chungdoi";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { templateSupportsHeroImage } from "@/data/editor-template-capabilities";
import { MusicPicker } from "@/components/music-picker";
import { BRIDE_BIRTH_ORDER_OPTIONS, FONT_OPTIONS, GROOM_BIRTH_ORDER_OPTIONS, type SelectOption } from "@/data/editor-options";
import type { InvitationContent } from "@/generated/prisma/client";
import type { MusicPickerMessages } from "@/lib/music-picker";
import { trackEvent } from "@/lib/analytics";
import { DEFAULT_OPENING_MESSAGE, defaultCeremonyMessage, type CeremonyType } from "@/lib/invitation-display";
import { shortNameFromFullName } from "@/lib/short-name";
import { EDITOR_IMAGE_ACCEPT } from "@/lib/upload-image-formats";
import { formatVietnameseLunarDate } from "@/lib/vietnamese-lunar-date";
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

const subscribeHydration = () => () => undefined;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

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
  const brideFirst = read("brideFirst") !== "false";
  const showHeroImage = read("showHeroImage") !== "false";

  const templateId = read("templateId");
  const brideFullName = read("brideFullName");
  const groomFullName = read("groomFullName");
  const brideShortName = read("brideShortName") || shortNameFromFullName(brideFullName);
  const groomShortName = read("groomShortName") || shortNameFromFullName(groomFullName);
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
      ceremonyType: read("ceremonyType") === "vu-quy" ? "vu-quy" : "thanh-hon",
      openingMessage: read("openingMessage") || DEFAULT_OPENING_MESSAGE,
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
      banquetTime: read("time"),
    },
    schedule,
    gallery,
    heroImage: read("heroImage"),
    showHeroImage,
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
        <span className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <span className="text-primary" aria-hidden>{icon}</span>
          <span>{title}</span>
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
  requiredMark,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
  type?: string;
  full?: boolean;
  requiredMark?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label htmlFor={name} className={labelClass}>
        {label}
        {requiredMark ? <span className="ml-0.5 text-destructive" aria-hidden> *</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-required={requiredMark || undefined}
        className={inputClass}
      />
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Textarea({
  name,
  label,
  defaultValue,
  placeholder,
  hint,
  rows = 3,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
  rows?: number;
}) {
  return (
    <div className="sm:col-span-2">
      <label htmlFor={name} className={labelClass}>{label}</label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={rows}
        className={`${inputClass} resize-y leading-6`}
      />
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Ngày và giờ tách rõ; thứ và âm lịch chỉ là dữ liệu tính tự động, không cần người dùng nhập. */
function EventDateTimeField({
  dateName,
  timeName,
  label,
  dateDefault,
  timeDefault,
  hint,
  requiredMark,
}: {
  dateName: string;
  timeName: string;
  label: string;
  dateDefault?: string;
  timeDefault?: string;
  hint?: string;
  requiredMark?: boolean;
}) {
  const [date, setDate] = useState(dateDefault ?? "");
  const parsed = date ? new Date(`${date}T00:00:00`) : null;
  const weekday = parsed && !Number.isNaN(parsed.getTime())
    ? parsed.toLocaleDateString("vi-VN", { weekday: "long" })
    : "";
  const lunarDate = formatVietnameseLunarDate(date);

  return (
    <div className="sm:col-span-2">
      <span className={labelClass}>
        {label}
        {requiredMark ? <span className="ml-0.5 text-destructive" aria-hidden> *</span> : null}
      </span>
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Giờ</span>
          <input
            id={timeName}
            name={timeName}
            type="time"
            defaultValue={timeDefault}
            aria-label={`${label} - giờ`}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Ngày tháng</span>
          <input
            id={dateName}
            name={dateName}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-label={`${label} - ngày`}
            aria-required={requiredMark || undefined}
            className={inputClass}
          />
        </label>
      </div>
      {weekday || lunarDate ? (
        <div className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-xs leading-5 text-muted-foreground" aria-live="polite">
          {weekday ? <span className="font-semibold capitalize text-foreground">{weekday}</span> : null}
          {weekday && lunarDate ? <span> · </span> : null}
          {lunarDate}
        </div>
      ) : null}
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
  birthOrderOptions,
  customPlaceholder,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
  birthOrderOptions: SelectOption[];
  customPlaceholder: string;
}) {
  const known = birthOrderOptions.some((o) => o.value === defaultValue);
  const [custom, setCustom] = useState(!!defaultValue && !known);
  const [value, setValue] = useState(defaultValue);
  const hiddenRef = useRef<HTMLInputElement | null>(null);
  const customInputRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(false);

  const options = [
    ...birthOrderOptions,
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
      {/* Khi không custom: hidden input mang name (giá trị từ state combobox).
          Khi custom: ô input bên dưới mang name — chỉ 1 phần tử name tồn tại mỗi lúc. */}
      {!custom && <input ref={hiddenRef} type="hidden" name={name} value={value} readOnly />}
      <Combobox
        inputId={custom ? undefined : name}
        value={custom ? "__custom__" : value}
        onChange={(next) => {
          if (next === "__custom__") {
            // Xoá value để ô input mount rỗng (không kế thừa preset vừa chọn).
            // flushSync để ô input mount đồng bộ ngay trong handler, rồi focus liền —
            // react-select bị unmount khỏi focus trước khi kịp giành lại, tránh mất ký tự đầu.
            flushSync(() => {
              setCustom(true);
              setValue("");
            });
            customInputRef.current?.focus();
          } else {
            setCustom(false);
            setValue(next);
          }
        }}
        options={options}
        placeholder="— Chọn thứ bậc —"
        aria-label={label}
      />
      {custom ? (
        // Ô này mang name → serializeForm đọc value trực tiếp từ DOM, không qua state
        // (tránh lệch khi IME/paste). Uncontrolled nên re-render lúc gõ không xoá ký tự.
        <input
          ref={customInputRef}
          id={name}
          name={name}
          defaultValue={value}
          placeholder={customPlaceholder}
          className={`${inputClass} mt-2`}
          aria-label={`${label} (tự nhập)`}
        />
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Chọn mẫu thiệp bằng lưới thumbnail thay cho <select>. */
function TemplatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    inputRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [value]);

  return (
    <div className="sm:col-span-2">
      <span className={labelClass}>Mẫu thiệp</span>
      <input ref={inputRef} type="hidden" name="templateId" value={value} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="editor-template-picker">
        {completedTemplates.map((template) => {
          const active = value === template.slug;
          return (
            <button
              key={template.slug}
              type="button"
              onClick={() => onChange(template.slug)}
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
          accept={EDITOR_IMAGE_ACCEPT}
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

function HeroImageUploader({
  initialUrl,
  initialEnabled,
  supported,
}: {
  initialUrl: string;
  initialEnabled: boolean;
  supported: boolean;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const valueInputRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    valueInputRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [enabled, url]);

  async function uploadFile(file: File) {
    const body = new FormData();
    body.append("file", file);
    setUploading(true);
    try {
      const response = await fetch("/api/upload", { method: "POST", body });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        toast.error(data.error ?? "Tải ảnh thất bại");
        return;
      }
      setUrl(data.url);
      setEnabled(true);
      toast.success("Đã cập nhật ảnh đầu thiệp");
    } catch {
      toast.error("Tải ảnh thất bại");
    } finally {
      setUploading(false);
    }
  }

  const hiddenInputs = (
    <>
      <input ref={valueInputRef} type="hidden" name="heroImage" value={url} />
      <input type="hidden" name="showHeroImage" value={enabled ? "true" : "false"} />
    </>
  );

  if (!supported) return hiddenInputs;

  return (
    <div className="sm:col-span-2">
      {hiddenInputs}
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Ảnh đầu thiệp</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Ảnh riêng cho phần mở đầu của mẫu thiệp này.</p>
        </div>
        <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="size-4 accent-primary"
          />
          Hiển thị
        </label>
      </div>

      {url ? (
        <div className={`relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted ${enabled ? "" : "opacity-45"}`}>
          <Image src={url} alt="Ảnh đầu thiệp" fill sizes="(min-width: 640px) 720px, 100vw" className="object-cover" />
          <div className="absolute bottom-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-black/85"
            >
              Đổi ảnh
            </button>
            <button
              type="button"
              onClick={() => setUrl("")}
              className="rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-destructive"
            >
              Xoá
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border px-4 py-8 text-center transition hover:border-primary/40 hover:bg-primary/5"
        >
          <span className="text-2xl" aria-hidden>◱</span>
          <span className="mt-2 text-sm text-muted-foreground">{uploading ? "Đang tải ảnh…" : "Bấm để chọn ảnh đầu thiệp"}</span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={EDITOR_IMAGE_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadFile(file);
          event.target.value = "";
        }}
      />
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

function TierDivider() {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Tùy chỉnh thêm — không bắt buộc
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
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

function EditorFormContent({
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
  restoredDraft,
}: EditorFormProps & { restoredDraft: Draft | null }) {
  const saveAction = (saveActionProp ?? saveDraft).bind(null, invitationId);
  const publishAction = publish.bind(null, invitationId);
  const [saveState, saveFormAction, saving] = useActionState<EditorState, FormData>(saveAction, undefined);
  const [publishState, publishFormAction, publishing] = useActionState<EditorState, FormData>(
    publishAction,
    undefined,
  );

  const draft = restoredDraft;
  const [submittedDraft, setSubmittedDraft] = useState<Draft | null>(null);
  const submittedDraftRef = useRef<Draft | null>(null);
  const activeDraft = submittedDraft ?? draft;
  const seed = (key: string, fallback: string) =>
    typeof activeDraft?.[key] === "string" ? (activeDraft[key] as string) : fallback;
  const seedBool = (key: string, fallback: boolean) =>
    typeof activeDraft?.[key] === "boolean" ? (activeDraft[key] as boolean) : fallback;

  const initialBrideFullName = seed("brideFullName", field(content, "brideFullName"));
  const initialGroomFullName = seed("groomFullName", field(content, "groomFullName"));
  const storedBrideShortName = seed("brideShortName", field(content, "brideShortName"));
  const storedGroomShortName = seed("groomShortName", field(content, "groomShortName"));
  const derivedBrideShortName = shortNameFromFullName(initialBrideFullName);
  const derivedGroomShortName = shortNameFromFullName(initialGroomFullName);
  const initialCeremonyType = (seed("ceremonyType", field(content, "ceremonyType")) === "vu-quy"
    ? "vu-quy"
    : "thanh-hon") as CeremonyType;
  const storedCeremonyMessage = seed("ceremonyHeader", field(content, "ceremonyHeader"));

  const [selectedTemplateId, setSelectedTemplateId] = useState(seed("templateId", templateId));
  const [brideFullName, setBrideFullName] = useState(initialBrideFullName);
  const [groomFullName, setGroomFullName] = useState(initialGroomFullName);
  const [brideShortName, setBrideShortName] = useState(storedBrideShortName || derivedBrideShortName);
  const [groomShortName, setGroomShortName] = useState(storedGroomShortName || derivedGroomShortName);
  const [brideShortNameEdited, setBrideShortNameEdited] = useState(
    Boolean(storedBrideShortName && storedBrideShortName !== derivedBrideShortName),
  );
  const [groomShortNameEdited, setGroomShortNameEdited] = useState(
    Boolean(storedGroomShortName && storedGroomShortName !== derivedGroomShortName),
  );
  const [brideFirst, setBrideFirst] = useState(seedBool("brideFirst", content?.brideFirst ?? true));
  const [ceremonyType, setCeremonyType] = useState<CeremonyType>(initialCeremonyType);
  const [ceremonyMessage, setCeremonyMessage] = useState(
    storedCeremonyMessage || defaultCeremonyMessage(initialCeremonyType),
  );
  const [ceremonyMessageEdited, setCeremonyMessageEdited] = useState(
    Boolean(storedCeremonyMessage && storedCeremonyMessage !== defaultCeremonyMessage(initialCeremonyType)),
  );

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
    brideFullName: initialBrideFullName,
    groomFullName: initialGroomFullName,
    brideShortName: storedBrideShortName || derivedBrideShortName,
    groomShortName: storedGroomShortName || derivedGroomShortName,
    brideFirst,
  });
  const [slug, setSlug] = useState(initialSlug);
  const [slugEdited, setSlugEdited] = useState(Boolean(currentSlug));
  const [slugStatus, setSlugStatus] = useState<{ available: boolean; reason?: string } | null>(null);
  const [checking, startCheck] = useTransition();

  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [previewContent, setPreviewContent] = useState<ChungDoiDemoContent | null>(null);
  // Khởi tạo "server" (server-deterministic) để render đầu client khớp server;
  // nếu có draft localStorage thì chuyển "restored" trong useEffect bên dưới.
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("server");
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
      trackEvent("save_draft", { template_id: selectedTemplateId });
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
        template_id: selectedTemplateId,
        validation_message: publishState.error,
      });
    }
    if (publishState?.persisted) reconcilePersistedDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishState]);

  useEffect(() => {
    if (draft) setDraftStatus("restored");
  }, [draft]);

  useEffect(() => {
    if (slugEdited) return;
    setSlug(slugFromFormFields({
      brideFullName,
      groomFullName,
      brideShortName,
      groomShortName,
      brideFirst,
    }));
  }, [brideFirst, brideFullName, brideShortName, groomFullName, groomShortName, slugEdited]);

  function onShowPreview() {
    const form = document.getElementById("editor-form") as HTMLFormElement | null;
    if (!form) return;
    setPreviewContent(buildPreviewContent(form, invitationId));
    setTab("preview");
    trackEvent("preview_invitation", { template_id: selectedTemplateId });
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
      <AdaptiveToaster />
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
          previewMode
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
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Chỉnh sửa thiệp</h1>
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
        <Accordion title="Thông tin chính" icon="♡">
          <Grid>
            <div>
              <label htmlFor="brideFullName" className={labelClass}>Họ tên cô dâu<span className="ml-0.5 text-destructive" aria-hidden> *</span></label>
              <input
                id="brideFullName"
                name="brideFullName"
                value={brideFullName}
                onChange={(event) => {
                  const next = event.target.value;
                  setBrideFullName(next);
                  if (!brideShortNameEdited) setBrideShortName(shortNameFromFullName(next));
                }}
                placeholder="VD: Nguyễn Quỳnh Anh"
                aria-required="true"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-muted-foreground">Họ tên đầy đủ, hiển thị ở phần giới thiệu.</p>
            </div>
            <div>
              <label htmlFor="groomFullName" className={labelClass}>Họ tên chú rể<span className="ml-0.5 text-destructive" aria-hidden> *</span></label>
              <input
                id="groomFullName"
                name="groomFullName"
                value={groomFullName}
                onChange={(event) => {
                  const next = event.target.value;
                  setGroomFullName(next);
                  if (!groomShortNameEdited) setGroomShortName(shortNameFromFullName(next));
                }}
                placeholder="VD: Trần Gia Khánh"
                aria-required="true"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-muted-foreground">Họ tên đầy đủ, hiển thị ở phần giới thiệu.</p>
            </div>
            <div>
              <label htmlFor="brideShortName" className={labelClass}>Tên ngắn cô dâu</label>
              <input
                id="brideShortName"
                name="brideShortName"
                value={brideShortName}
                onChange={(event) => {
                  const next = event.target.value;
                  setBrideShortName(next);
                  setBrideShortNameEdited(Boolean(next.trim() && next.trim() !== shortNameFromFullName(brideFullName)));
                }}
                placeholder="VD: Quỳnh Anh"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-muted-foreground">Tự lấy 2 từ cuối của họ tên; chỉ sửa khi cần.</p>
            </div>
            <div>
              <label htmlFor="groomShortName" className={labelClass}>Tên ngắn chú rể</label>
              <input
                id="groomShortName"
                name="groomShortName"
                value={groomShortName}
                onChange={(event) => {
                  const next = event.target.value;
                  setGroomShortName(next);
                  setGroomShortNameEdited(Boolean(next.trim() && next.trim() !== shortNameFromFullName(groomFullName)));
                }}
                placeholder="VD: Gia Khánh"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-muted-foreground">Tự lấy 2 từ cuối của họ tên; chỉ sửa khi cần.</p>
            </div>
            <BirthOrderField
              name="brideBirthOrder"
              label="Thứ bậc cô dâu"
              defaultValue={seed("brideBirthOrder", field(content, "brideBirthOrder"))}
              hint="Hiển thị dưới ảnh cô dâu."
              birthOrderOptions={BRIDE_BIRTH_ORDER_OPTIONS}
              customPlaceholder="VD: Con gái thứ tư"
            />
            <BirthOrderField
              name="groomBirthOrder"
              label="Thứ bậc chú rể"
              defaultValue={seed("groomBirthOrder", field(content, "groomBirthOrder"))}
              hint="Hiển thị dưới ảnh chú rể."
              birthOrderOptions={GROOM_BIRTH_ORDER_OPTIONS}
              customPlaceholder="VD: Con trai thứ tư"
            />
            <div className="sm:col-span-2">
              <span className={labelClass}>Thứ tự hiển thị toàn thiệp</span>
              <input type="hidden" name="brideFirst" value={brideFirst ? "true" : "false"} />
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1" role="group" aria-label="Thứ tự hiển thị toàn thiệp">
                <button
                  type="button"
                  onClick={() => setBrideFirst(false)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${!brideFirst ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  aria-pressed={!brideFirst}
                >
                  Nhà trai trước
                </button>
                <button
                  type="button"
                  onClick={() => setBrideFirst(true)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${brideFirst ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  aria-pressed={brideFirst}
                >
                  Nhà gái trước
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Áp dụng cho tên, gia đình và thông tin chuyển khoản.</p>
            </div>
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
              defaultValue={seed("groomParentTitle", field(content, "groomParentTitle")) || "Ông bà"}
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
              defaultValue={seed("brideParentTitle", field(content, "brideParentTitle")) || "Ông bà"}
              placeholder="VD: Ông Bà"
              hint="Cách gọi cha mẹ trên thiệp (VD: Ông Bà, Gia đình)."
            />
            <Text name="brideAddress" label="Địa chỉ nhà gái" defaultValue={seed("brideAddress", field(content, "brideAddress"))} placeholder="Số nhà, đường, phường/xã, tỉnh/thành" full />
          </Grid>
        </Accordion>

        <Accordion title="Mở đầu thiệp" icon="◱">
          <Grid>
            <HeroImageUploader
              initialUrl={seed("heroImage", field(content, "heroImage"))}
              initialEnabled={seedBool("showHeroImage", content?.showHeroImage ?? true)}
              supported={templateSupportsHeroImage(selectedTemplateId)}
            />
            <Textarea
              name="openingMessage"
              label="Lời mở đầu thiệp"
              defaultValue={seed("openingMessage", field(content, "openingMessage")) || DEFAULT_OPENING_MESSAGE}
              hint="Nội dung mặc định đã được điền sẵn; chỉ sửa khi gia đình muốn dùng câu khác."
              rows={3}
            />
          </Grid>
        </Accordion>

        <Accordion title="Nơi tổ chức" icon="✦">
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
          </Grid>
        </Accordion>

        <Accordion title="Phần Lễ" icon="🕊">
          <Grid>
            <div className="sm:col-span-2">
              <span className={labelClass}>Loại lễ</span>
              <input type="hidden" name="ceremonyType" value={ceremonyType} />
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1" role="tablist" aria-label="Chọn loại lễ">
                {(["thanh-hon", "vu-quy"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={ceremonyType === value}
                    onClick={() => {
                      setCeremonyType(value);
                      if (!ceremonyMessageEdited) setCeremonyMessage(defaultCeremonyMessage(value));
                    }}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${ceremonyType === value ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {value === "thanh-hon" ? "Thành Hôn" : "Vu Quy"}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="ceremonyHeader" className={labelClass}>Lời thông báo Phần Lễ</label>
              <textarea
                id="ceremonyHeader"
                name="ceremonyHeader"
                value={ceremonyMessage}
                onChange={(event) => {
                  const next = event.target.value;
                  setCeremonyMessage(next);
                  setCeremonyMessageEdited(Boolean(next.trim() && next.trim() !== defaultCeremonyMessage(ceremonyType)));
                }}
                rows={3}
                className={`${inputClass} resize-y leading-6`}
              />
              <p className="mt-1 text-xs text-muted-foreground">Câu mặc định tự đổi theo Thành Hôn/Vu Quy; có thể sửa lại.</p>
            </div>
            <EventDateTimeField
              dateName="ceremonyDate"
              timeName="ceremonyTime"
              label="Thời gian Phần Lễ"
              dateDefault={seed("ceremonyDate", field(content, "ceremonyDate"))}
              timeDefault={seed("ceremonyTime", field(content, "ceremonyTime"))}
              hint="Thứ và ngày âm lịch được hệ thống tự tính từ ngày dương lịch."
            />
          </Grid>
        </Accordion>

        <Accordion title="Phần Tiệc" icon="✿">
          <Grid>
            <EventDateTimeField
              dateName="date"
              timeName="time"
              label="Tiệc cưới sẽ diễn ra vào lúc"
              dateDefault={seed("date", field(content, "date"))}
              timeDefault={seed("time", field(content, "time")) || seed("banquetTime", field(content, "banquetTime"))}
              hint="Thứ và ngày âm lịch được hệ thống tự tính từ ngày dương lịch."
              requiredMark
            />
          </Grid>
          <div className="mt-6 border-t border-border pt-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Chương trình</p>
                <p className="mt-1 text-xs text-muted-foreground">Các mốc như đón khách, khai tiệc, cắt bánh hoặc kết thúc.</p>
              </div>
              <button
                type="button"
                onClick={() => setScheduleRows((rows) => [...rows, { time: "", label: "" }])}
                className="shrink-0 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
              >
                + Thêm mốc
              </button>
            </div>
            <div className="space-y-3">
              {scheduleRows.map((row, index) => (
                <div key={index} className="flex gap-3">
                  <input name="scheduleTime" type="time" defaultValue={row.time} className={`${inputClass} w-32`} />
                  <input name="scheduleLabel" defaultValue={row.label} placeholder="VD: Đón khách" className={inputClass} />
                  <button
                    type="button"
                    onClick={() => setScheduleRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}
                    className="shrink-0 rounded-lg border border-border px-3 text-sm text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
                    aria-label={`Xoá mốc ${index + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Accordion>

        <Accordion title="Album ảnh" icon="▧">
          <GalleryUploader initial={Array.isArray(draft?.galleryUrl) ? (draft!.galleryUrl as string[]) : gallery} />
        </Accordion>

        <TierDivider />

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

        <Accordion title="Màu chủ đạo" icon="🎨" defaultOpen={false}>
          <Grid>
            <ColorField name="primaryColor" label="Màu chủ đạo" defaultValue={seed("primaryColor", field(content, "primaryColor"))} />
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

        <Accordion title="Mẫu thiệp" icon="✧" defaultOpen={false}>
          <TemplatePicker value={selectedTemplateId} onChange={setSelectedTemplateId} />
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
        <h2 className="mb-4 text-xl font-bold text-primary">Xuất bản</h2>
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
            data-ga-param-template-id={selectedTemplateId}
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

/**
 * localStorage không tồn tại ở SSR. Chờ client mount rồi mới dựng form với draft
 * đã khôi phục để markup hydrate luôn giống server và không remount khi user gõ.
 */
export function EditorForm(props: EditorFormProps) {
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const restoredDraft = useMemo(
    () => (hydrated ? readDraft(props.invitationId) : null),
    [hydrated, props.invitationId],
  );

  if (!hydrated) {
    return (
      <div
        aria-busy="true"
        className="mx-auto min-h-screen max-w-4xl animate-pulse px-4 pb-8 pt-24 sm:px-6"
      >
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="mt-6 h-64 rounded-2xl bg-muted/70" />
      </div>
    );
  }

  return <EditorFormContent {...props} restoredDraft={restoredDraft} />;
}
