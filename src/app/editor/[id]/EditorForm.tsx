"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Dialog } from "@base-ui/react/dialog";
import {
  ChevronDown,
  ExternalLink,
  MapPin,
  Plus,
  RotateCcw,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type FocusEvent as ReactFocusEvent,
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
import { templatePreviewUrl } from "@/lib/template-preview-url";

import {
  directionsUrl,
  InvitationMap,
} from "@/components/chungdoi-tpl-shared";
import { AdaptiveToaster } from "@/components/adaptive-toaster";
import { TrialCountdownBanner } from "@/components/trial-countdown-banner";
import { BankCombobox } from "@/components/ui/bank-combobox";
import { Combobox } from "@/components/ui/combobox";
import { completedTemplates } from "@/data/chungdoi";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import {
  heroImageCount,
  templateSupportsZodiac,
} from "@/data/editor-template-capabilities";
import { BRIDE_BIRTH_ORDER_OPTIONS, FONT_OPTIONS, GROOM_BIRTH_ORDER_OPTIONS, type SelectOption } from "@/data/editor-options";
import type { InvitationContent } from "@/generated/prisma/client";
import type { InvitationActivation } from "@/lib/invitation-entitlement";
import type { MusicPickerMessages } from "@/lib/music-picker";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { DEFAULT_OPENING_MESSAGE, defaultCeremonyMessage } from "@/lib/invitation-display";
import { isGoogleMapsShortUrl, isGoogleMapsUrl } from "@/lib/google-maps";
import { shortNameFromFullName } from "@/lib/short-name";
import {
  capitalizeVietnameseSentences,
  titleCaseVietnameseName,
} from "@/lib/text-case";
import { normalizeAlbumLayout, type AlbumLayout } from "@/lib/album-layout";
import { trialExpiresAt } from "@/lib/trial";
import { EDITOR_IMAGE_ACCEPT } from "@/lib/upload-image-formats";
import { formatVietnameseLunarDate } from "@/lib/vietnamese-lunar-date";
import {
  DEFAULT_ZODIAC_ART_COLOR,
  ZODIAC,
  ZODIAC_TEMPLATE_SLUG,
} from "@/lib/zodiac";
import {
  saveDraft,
  publish,
  checkSlug,
  autosaveDraft,
  resolveGoogleMapsLink,
} from "./actions";
import {
  type EditorState,
  type SlugCheckResult,
} from "./content-schema";
import {
  draftsEqual,
  draftToFormData,
  readDraft,
  useFormDraft,
  type Draft,
} from "@/hooks/use-form-draft";
import { createAutosaveController } from "@/lib/autosave-controller";
import { slugify, slugifyInput, slugFromFormFields } from "./slug";
import { templateLabel } from "./templates";
import { PublishSuccessDialog } from "./PublishSuccessDialog";
import { ShareInvitationDialog } from "./ShareInvitationDialog";

const ChungDoiDemo = dynamic(() =>
  import("@/components/chungdoi-demo").then((module) => module.ChungDoiDemo),
);
const MusicPicker = dynamic(() =>
  import("@/components/music-picker").then((module) => module.MusicPicker),
);

export type EditorMode = "owner" | "demo-admin" | "support-admin";

type EditorMutationAction = (
  id: string,
  prev: EditorState,
  formData: FormData,
) => Promise<EditorState>;
type SlugCheckAction = (
  slug: string,
  invitationId: string,
) => Promise<SlugCheckResult>;
type ResolveMapAction = (value: string) => Promise<{
  url: string;
  resolved: boolean;
  valid: boolean;
}>;

type CommonEditorFormProps = {
  invitationId: string;
  status: string;
  activation: InvitationActivation;
  publishedAt?: string | null;
  currentSlug: string | null;
  templateId: string;
  content: InvitationContent | null;
  ceremonies: { title: string; date: string; time: string }[];
  schedule: { time: string; label: string }[];
  gallery: string[];
  locale: string;
  musicMessages: MusicPickerMessages;
  initialTrack: { url: string; title: string; artist: string } | null;
  /** Admin-renamed template names, keyed by slug. Falls back to built-in names. */
  templateLabels?: Record<string, string>;
};

export type EditorFormProps = CommonEditorFormProps & (
  | {
      mode?: "owner";
      saveAction?: never;
      publishAction?: never;
      checkSlugAction?: never;
      resolveMapAction?: never;
      supportContext?: never;
    }
  | {
      mode: "demo-admin";
      saveAction: EditorMutationAction;
      publishAction?: never;
      checkSlugAction?: never;
      resolveMapAction?: never;
      supportContext?: never;
    }
  | {
      mode: "support-admin";
      saveAction: EditorMutationAction;
      publishAction: EditorMutationAction;
      checkSlugAction: SlugCheckAction;
      resolveMapAction: ResolveMapAction;
      supportContext: { userId: string; email: string };
    }
);

/** Everything the shared body needs, resolved by the mode branch above it. */
type EditorFormBodyConfig = CommonEditorFormProps & {
  ownerMode: boolean;
  supportMode: boolean;
  showSlugSection: boolean;
  supportContext: { userId: string; email: string } | null;
  saveAction: EditorMutationAction;
  publishAction: EditorMutationAction;
  checkSlugAction: SlugCheckAction;
  resolveMapAction: ResolveMapAction;
  restoredDraft: Draft | null;
};

/**
 * Demo body wires only the save action: it deliberately never declares
 * publish/slug/map action props, so `saveDemo` cannot receive a publish
 * submission or fall back to owner actions at runtime or type level.
 */
type DemoEditorFormBodyConfig = CommonEditorFormProps & {
  saveAction: EditorMutationAction;
  restoredDraft: Draft | null;
};

type CeremonyRow = {
  id: string;
  title: string;
  date: string;
  time: string;
};

const AUTOSAVE_DEBOUNCE_MS = 4000;
let ceremonyRowSequence = 0;

function newCeremonyRow(): CeremonyRow {
  ceremonyRowSequence += 1;
  return {
    id: `ceremony-new-${Date.now()}-${ceremonyRowSequence}`,
    title: "",
    date: "",
    time: "",
  };
}

const subscribeHydration = () => () => undefined;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

function field(content: InvitationContent | null, key: keyof InvitationContent): string {
  const v = content?.[key];
  return typeof v === "string" ? v : "";
}

const NAME_CASE_FIELDS = new Set([
  "brideFullName",
  "groomFullName",
  "brideShortName",
  "groomShortName",
  "brideFather",
  "brideMother",
  "groomFather",
  "groomMother",
  "brideAccountName",
  "groomAccountName",
]);

const SENTENCE_CASE_FIELDS = new Set([
  "brideBirthOrder",
  "groomBirthOrder",
  "openingMessage",
  "ceremonyItemTitle",
  "scheduleLabel",
  "brideAddress",
  "groomAddress",
  "brideParentTitle",
  "groomParentTitle",
  "address",
]);

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
  const formData = new FormData(form);
  const read = (name: string) => String(formData.get(name) ?? "").trim();
  const readAll = (name: string) => formData.getAll(name).map(String);
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
  const ceremonyTitles = readAll("ceremonyItemTitle");
  const ceremonyDates = readAll("ceremonyItemDate");
  const ceremonyTimes = readAll("ceremonyItemTime");
  const ceremonies: { title: string; date: string; time: string }[] = [];
  for (let i = 0; i < Math.max(ceremonyTitles.length, ceremonyDates.length, ceremonyTimes.length); i++) {
    const title = (ceremonyTitles[i] ?? "").trim();
    const date = (ceremonyDates[i] ?? "").trim();
    const time = (ceremonyTimes[i] ?? "").trim();
    if (title || date || time) ceremonies.push({ title, date, time });
  }
  const firstCeremony = ceremonies[0];
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
      brideZodiac: read("brideZodiac"),
      groomZodiac: read("groomZodiac"),
      brideFirst,
      date: read("date"),
      time: read("time"),
      ceremonyDate: firstCeremony?.date ?? "",
      ceremonyTime: firstCeremony?.time ?? "",
      ceremonyHeader: firstCeremony?.title ?? "",
      ceremonyType: "thanh-hon",
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
    ceremonies,
    schedule,
    gallery,
    heroImage: read("heroImage"),
    heroImage2: read("heroImage2"),
    showHeroImage,
    dressCodeColors: read("dressCodeColors"),
    albumLayout: normalizeAlbumLayout(read("albumLayout")),
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
  "w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-ring sm:text-sm";
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

function VenueLocationFields({
  initialAddress,
  initialMapAddress,
  resolveMapAction,
}: {
  initialAddress: string;
  initialMapAddress: string;
  resolveMapAction: ResolveMapAction;
}) {
  const t = useTranslations("editor.venue");
  const [address, setAddress] = useState(initialAddress);
  const [mapOverride, setMapOverride] = useState(initialMapAddress);
  const [overrideOpen, setOverrideOpen] = useState(Boolean(initialMapAddress));
  const [previewQuery, setPreviewQuery] = useState(
    initialMapAddress.trim() || initialAddress.trim(),
  );
  const [resolving, setResolving] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const mapInputRef = useRef<HTMLInputElement | null>(null);

  const overrideValue = mapOverride.trim();
  const overrideLooksLikeUrl = /^https?:\/\//i.test(overrideValue);
  const overrideUsable =
    Boolean(overrideValue) &&
    !linkError &&
    (!overrideLooksLikeUrl || isGoogleMapsUrl(overrideValue));
  const effectiveQuery = overrideUsable ? overrideValue : address.trim();
  const usingOverride = overrideUsable && Boolean(overrideValue);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreviewQuery(effectiveQuery);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [effectiveQuery]);

  async function handleMapLinkBlur() {
    const source = mapInputRef.current?.value.trim() ?? "";
    if (!source) {
      setLinkError(false);
      return;
    }
    if (!isGoogleMapsUrl(source)) {
      setLinkError(/^https?:\/\//i.test(source));
      return;
    }
    if (!isGoogleMapsShortUrl(source)) {
      setLinkError(false);
      return;
    }

    setResolving(true);
    setLinkError(false);
    try {
      const result = await resolveMapAction(source);
      if (!mapInputRef.current || mapInputRef.current.value.trim() !== source) return;
      if (!result.valid || !result.resolved) {
        setLinkError(true);
        return;
      }
      flushSync(() => setMapOverride(result.url));
      setPreviewQuery(result.url);
      mapInputRef.current.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    } catch {
      setLinkError(true);
    } finally {
      setResolving(false);
    }
  }

  function useAddressAgain() {
    flushSync(() => {
      setMapOverride("");
      setLinkError(false);
      setOverrideOpen(false);
    });
    setPreviewQuery(address.trim());
    mapInputRef.current?.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
  }

  return (
    <div className="sm:col-span-2 space-y-4">
      <div>
        <label htmlFor="address" className={labelClass}>
          {t("addressLabel")}
        </label>
        <input
          id="address"
          name="address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          onBlur={(event) => setAddress(capitalizeVietnameseSentences(event.currentTarget.value))}
          placeholder={t("addressPlaceholder")}
          className={inputClass}
        />
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {t("addressHint")}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{t("previewTitle")}</p>
              <p className="truncate text-xs text-muted-foreground">
                {usingOverride ? t("usingOverride") : t("usingAddress")}
              </p>
            </div>
          </div>
          {previewQuery ? (
            <a
              href={directionsUrl(previewQuery)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition hover:text-primary/75"
            >
              {t("openMaps")}
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : null}
        </div>
        {previewQuery ? (
          <InvitationMap
            query={previewQuery}
            title={t("previewIframeTitle")}
            className="pointer-events-none h-72 w-full border-0 bg-muted sm:h-80"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            tabIndex={-1}
          />
        ) : (
          <div className="grid h-32 place-items-center border-t border-border px-6 text-center text-sm text-muted-foreground">
            {t("emptyPreview")}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <button
          type="button"
          aria-expanded={overrideOpen}
          aria-controls="venue-map-override"
          onClick={() => setOverrideOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition hover:bg-muted/50 active:bg-muted"
        >
          <span>
            <span className="block text-sm font-semibold text-foreground">
              {t("overrideTitle")}
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
              {t("overrideDescription")}
            </span>
          </span>
          <ChevronDown
            className={`size-5 shrink-0 text-muted-foreground transition-transform ${
              overrideOpen ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>
        <div
          id="venue-map-override"
          hidden={!overrideOpen}
          className="border-t border-border bg-muted/20 p-4"
        >
          <label htmlFor="mapAddress" className={labelClass}>
            {t("mapLinkLabel")}
          </label>
          <input
            ref={mapInputRef}
            id="mapAddress"
            name="mapAddress"
            value={mapOverride}
            onChange={(event) => {
              setMapOverride(event.target.value);
              setLinkError(false);
            }}
            onBlur={() => void handleMapLinkBlur()}
            placeholder={t("mapLinkPlaceholder")}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={linkError || undefined}
            aria-describedby="map-address-hint"
            className={`${inputClass} ${linkError ? "border-destructive focus:border-destructive" : ""}`}
          />
          <p
            id="map-address-hint"
            className={`mt-1 text-xs leading-5 ${
              linkError ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {resolving
              ? t("resolving")
              : linkError
                ? t("linkError")
                : t("mapLinkHint")}
          </p>
          {mapOverride ? (
            <button
              type="button"
              onClick={useAddressAgain}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              {t("useAddressAgain")}
            </button>
          ) : null}
        </div>
      </div>
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
  value,
  onDateChange,
}: {
  dateName: string;
  timeName: string;
  label: string;
  dateDefault?: string;
  timeDefault?: string;
  hint?: string;
  requiredMark?: boolean;
  value?: string;
  onDateChange?: (value: string) => void;
}) {
  const [internalDate, setInternalDate] = useState(dateDefault ?? "");
  const date = value !== undefined ? value : internalDate;
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
            onChange={(event) => {
              setInternalDate(event.target.value);
              onDateChange?.(event.target.value);
            }}
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
  formatOptionLabel,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options: SelectOption[];
  hint?: string;
  full?: boolean;
  formatOptionLabel?: (option: SelectOption) => React.ReactNode;
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
        formatOptionLabel={formatOptionLabel}
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

function ZodiacField({
  name,
  label,
  defaultValue,
  placeholder,
  hint,
  options,
}: {
  name: "brideZodiac" | "groomZodiac";
  label: string;
  defaultValue: string;
  placeholder: string;
  hint: string;
  options: readonly SelectOption[];
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>{label}</label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className={inputClass}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

/** Chọn mẫu thiệp bằng lưới thumbnail thay cho <select>. */
function TemplatePicker({
  value,
  onChange,
  labels,
}: {
  value: string;
  onChange: (value: string) => void;
  labels?: Record<string, string>;
}) {
  const label = (slug: string) => labels?.[slug] ?? templateLabel(slug);
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
                  src={templatePreviewUrl(template.listing)}
                  alt={label(template.slug)}
                  fill
                  sizes="(min-width: 640px) 200px, 50vw"
                  className="object-cover object-top transition-[object-position,transform] duration-[9000ms] ease-in-out group-hover:object-bottom group-hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none"
                />
              </span>
              <span className="block px-2 py-1.5 text-xs font-semibold text-foreground">
                {label(template.slug)}
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

function HeroImageSlot({
  name,
  label,
  initialUrl,
  dimmed,
  onUploaded,
}: {
  name: string;
  label?: string;
  initialUrl: string;
  dimmed: boolean;
  onUploaded: () => void;
}) {
  const [url, setUrl] = useState(initialUrl);
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
  }, [url]);

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
      onUploaded();
      toast.success("Đã cập nhật ảnh đầu thiệp");
    } catch {
      toast.error("Tải ảnh thất bại");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input ref={valueInputRef} type="hidden" name={name} value={url} />
      {label ? <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p> : null}
      {url ? (
        <div className={`relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted ${dimmed ? "opacity-45" : ""}`}>
          <Image src={url} alt={label ?? "Ảnh đầu thiệp"} fill sizes="(min-width: 640px) 720px, 100vw" className="object-cover" />
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
          className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border px-4 text-center transition hover:border-primary/40 hover:bg-primary/5"
        >
          <span className="text-2xl" aria-hidden>◱</span>
          <span className="mt-2 text-sm text-muted-foreground">{uploading ? "Đang tải ảnh…" : "Bấm để chọn ảnh"}</span>
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

function HeroImageUploader({
  initialUrl,
  initialUrl2,
  initialEnabled,
  count,
}: {
  initialUrl: string;
  initialUrl2: string;
  initialEnabled: boolean;
  count: 0 | 1 | 2;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const enabledInputRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    enabledInputRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [enabled]);

  const hiddenEnabled = (
    <input ref={enabledInputRef} type="hidden" name="showHeroImage" value={enabled ? "true" : "false"} />
  );

  if (count === 0) {
    return (
      <>
        <input type="hidden" name="heroImage" value={initialUrl} />
        <input type="hidden" name="heroImage2" value={initialUrl2} />
        {hiddenEnabled}
      </>
    );
  }

  return (
    <div className="sm:col-span-2">
      {hiddenEnabled}
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Ảnh đầu thiệp</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {count === 2 ? "Hai ảnh cho phần mở đầu của mẫu thiệp này. Vị trí hiển thị theo thứ tự nhà trai/nhà gái bạn đã chọn." : "Ảnh riêng cho phần mở đầu của mẫu thiệp này."}
          </p>
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

      {count === 2 ? (
        <div className="grid grid-cols-2 gap-3">
          <HeroImageSlot name="heroImage" label="Ảnh cô dâu" initialUrl={initialUrl} dimmed={!enabled} onUploaded={() => setEnabled(true)} />
          <HeroImageSlot name="heroImage2" label="Ảnh chú rể" initialUrl={initialUrl2} dimmed={!enabled} onUploaded={() => setEnabled(true)} />
        </div>
      ) : (
        <>
          <HeroImageSlot name="heroImage" initialUrl={initialUrl} dimmed={!enabled} onUploaded={() => setEnabled(true)} />
          <input type="hidden" name="heroImage2" value={initialUrl2} />
        </>
      )}
    </div>
  );
}

function ColorField({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
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
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-input bg-background"
          aria-label={`${label} - bảng màu`}
        />
        <input
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#c8102e"
          className={inputClass}
        />
      </div>
    </div>
  );
}

const DRESS_CODE_PRESETS: { hex: string; label: string }[] = [
  { hex: "#1A1A1A", label: "Đen" },
  { hex: "#FFFFFF", label: "Trắng" },
  { hex: "#9CA3AF", label: "Xám" },
  { hex: "#D9C6A5", label: "Be" },
  { hex: "#A3B18A", label: "Xanh rêu" },
  { hex: "#A9B8CC", label: "Xanh xám" },
];

const ALBUM_LAYOUT_OPTIONS: { value: AlbumLayout; label: string }[] = [
  { value: "grid", label: "Lưới" },
  { value: "mosaic", label: "Ghép ảnh" },
  { value: "coverflow", label: "3D" },
];

/** Chọn kiểu hiển thị album; ghi giá trị vào hidden input albumLayout cho action + live preview. */
function AlbumLayoutField({ defaultValue }: { defaultValue: string }) {
  const [layout, setLayout] = useState<AlbumLayout>(() => normalizeAlbumLayout(defaultValue));
  const hiddenRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    hiddenRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [layout]);

  return (
    <div className="sm:col-span-2">
      <input ref={hiddenRef} type="hidden" name="albumLayout" value={layout} />
      <span className={labelClass}>Kiểu hiển thị album</span>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {ALBUM_LAYOUT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLayout(opt.value)}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm transition",
              layout === opt.value
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/40",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Chọn nhiều màu trang phục; xuất chuỗi hex phân tách bằng dấu phẩy vào hidden input dressCodeColors. */
function DressCodeField({ defaultValue }: { defaultValue: string }) {
  const parse = (raw: string) =>
    raw
      .split(",")
      .map((c) => c.trim())
      .filter((c) => /^#[0-9a-fA-F]{6}$/.test(c))
      .slice(0, 8);
  const [colors, setColors] = useState<string[]>(() => parse(defaultValue));
  const [custom, setCustom] = useState("#E8B7B7");
  const hiddenRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(false);

  const serialized = colors.join(",");
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    hiddenRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [serialized]);

  const addColor = (raw: string) => {
    const hex = raw.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    setColors((prev) => {
      if (prev.length >= 8) return prev;
      if (prev.some((c) => c.toLowerCase() === hex.toLowerCase())) return prev;
      return [...prev, hex];
    });
  };

  const customValid = /^#[0-9a-fA-F]{6}$/.test(custom);
  const atLimit = colors.length >= 8;

  return (
    <div className="sm:col-span-2">
      <input ref={hiddenRef} type="hidden" name="dressCodeColors" value={serialized} />
      <p className="mb-3 text-xs text-muted-foreground">
        Gợi ý màu trang phục cho khách. Để trống nếu không muốn hiển thị mục này. Tối đa 8 màu.
      </p>

      <span className={labelClass}>Màu sắc</span>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        {colors.map((color, index) => (
          <div key={index} className="group relative">
            <span
              className="block size-11 rounded-full border border-border shadow-sm"
              style={{ backgroundColor: color }}
              aria-label={`Màu ${index + 1}: ${color}`}
            />
            <button
              type="button"
              onClick={() => setColors((prev) => prev.filter((_, i) => i !== index))}
              className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border border-border bg-background text-muted-foreground opacity-0 shadow transition group-hover:opacity-100 hover:text-destructive"
              aria-label={`Xoá màu ${index + 1}`}
            >
              <X className="size-3" aria-hidden />
            </button>
          </div>
        ))}
        <label
          className={cn(
            "grid size-11 cursor-pointer place-items-center rounded-full border border-dashed border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground",
            atLimit && "pointer-events-none opacity-40",
          )}
          aria-label="Thêm màu"
        >
          <Plus className="size-4" aria-hidden />
          <input
            type="color"
            className="sr-only"
            disabled={atLimit}
            onChange={(e) => addColor(e.target.value)}
          />
        </label>
      </div>

      {!atLimit && (
        <>
          <span className={cn(labelClass, "mt-5 block")}>Chọn từ gợi ý</span>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            {DRESS_CODE_PRESETS.map((preset) => {
              const used = colors.some((c) => c.toLowerCase() === preset.hex.toLowerCase());
              return (
                <button
                  key={preset.hex}
                  type="button"
                  disabled={used}
                  onClick={() => addColor(preset.hex)}
                  title={preset.label}
                  aria-label={`Thêm màu ${preset.label}`}
                  className="size-11 rounded-full border border-border shadow-sm transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30"
                  style={{ backgroundColor: preset.hex }}
                />
              );
            })}
          </div>

          <div className="mt-5 border-t border-border pt-5">
            <span className={cn(labelClass, "block")}>Màu tùy chỉnh</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={customValid ? custom : "#E8B7B7"}
                onChange={(e) => setCustom(e.target.value)}
                className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-input bg-background"
                aria-label="Chọn màu tùy chỉnh"
              />
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addColor(custom);
                  }
                }}
                placeholder="#E8B7B7"
                className={inputClass}
                aria-label="Mã màu tùy chỉnh"
              />
              <button
                type="button"
                disabled={!customValid}
                onClick={() => addColor(custom)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-muted disabled:opacity-40"
              >
                <Plus className="size-4" aria-hidden />
                Thêm
              </button>
            </div>
          </div>
        </>
      )}
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

function PublishedShareButton({ slug, templateId }: { slug: string; templateId: string }) {
  const t = useTranslations("editor.publishSuccess");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          trackEvent("open_share_dialog", {
            source: "editor_header",
            template_id: templateId,
          });
        }}
        className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted sm:px-4 sm:text-sm"
      >
        <Share2 className="size-4" aria-hidden />
        {t("headerShare")}
      </button>
      {open ? (
        <ShareInvitationDialog
          slug={slug}
          templateId={templateId}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function TabBar({
  tab,
  onEdit,
  onPreview,
  shareSlug,
  templateId,
}: {
  tab: "edit" | "preview";
  onEdit: () => void;
  onPreview: () => void;
  shareSlug?: string;
  templateId: string;
}) {
  const base = "shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm";
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
      {shareSlug ? <PublishedShareButton slug={shareSlug} templateId={templateId} /> : null}
    </div>
  );
}

function CeremonyDeleteDialog({
  rows,
  deleteId,
  onCancel,
  onConfirm,
}: {
  rows: CeremonyRow[];
  deleteId: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ceremonyT = useTranslations("editor.ceremonies");
  return (
    <Dialog.Root
      open={deleteId !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[140] bg-black/55 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-[140] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <Dialog.Popup className="w-full max-w-md rounded-t-3xl bg-card p-5 text-card-foreground shadow-2xl outline-none transition data-[ending-style]:translate-y-4 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-4 data-[starting-style]:opacity-0 sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-xl font-semibold">
                  {ceremonyT("deleteTitle")}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
                  {ceremonyT("deleteDescription", {
                    number: Math.max(1, rows.findIndex((row) => row.id === deleteId) + 1),
                  })}
                </Dialog.Description>
              </div>
              <Dialog.Close
                aria-label={ceremonyT("cancel")}
                className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" aria-hidden />
              </Dialog.Close>
            </div>
            {deleteId ? (
              <p className="mt-4 line-clamp-2 rounded-xl bg-muted px-3 py-2 text-sm font-medium">
                {rows.find((row) => row.id === deleteId)?.title
                  || ceremonyT("itemLabel", {
                    number: Math.max(1, rows.findIndex((row) => row.id === deleteId) + 1),
                  })}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close className="min-h-11 rounded-full border border-border px-5 text-sm font-semibold transition hover:bg-muted">
                {ceremonyT("cancel")}
              </Dialog.Close>
              <button
                type="button"
                onClick={onConfirm}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <Trash2 className="size-4" aria-hidden />
                {ceremonyT("confirmDelete")}
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * The full editor for owner and support-admin modes. Every action arrives as a
 * prop already selected by the mode branch, so this component never falls back
 * to an owner action for a non-owner mode.
 */
function EditorFormBody({
  invitationId,
  status,
  activation,
  publishedAt = null,
  currentSlug,
  templateId,
  content,
  ceremonies,
  schedule,
  gallery,
  locale,
  musicMessages,
  initialTrack,
  templateLabels,
  ownerMode,
  supportMode,
  showSlugSection,
  supportContext,
  saveAction: saveActionProp,
  publishAction: publishActionProp,
  checkSlugAction: checkSlugActionProp,
  resolveMapAction: resolveMapActionProp,
  restoredDraft,
}: EditorFormBodyConfig) {
  const venueT = useTranslations("editor.venue");
  const ceremonyT = useTranslations("editor.ceremonies");
  const zodiacT = useTranslations("editor.zodiac");
  const supportT = useTranslations("editor.support");
  const errorT = useTranslations("editor.errors");
  const activated = activation !== "trial";
  const saveAction = saveActionProp.bind(null, invitationId);
  const publishAction = publishActionProp.bind(null, invitationId);
  const [saveState, saveFormAction, saving] = useActionState<EditorState, FormData>(saveAction, undefined);
  const [publishState, publishFormAction, publishing] = useActionState<EditorState, FormData>(
    publishAction,
    undefined,
  );
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [publishDialogSlug, setPublishDialogSlug] = useState<string | null>(null);
  const [activePublishedAt, setActivePublishedAt] = useState(publishedAt);

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

  const [selectedTemplateId, setSelectedTemplateId] = useState(seed("templateId", templateId));
  const [primaryColor, setPrimaryColor] = useState(
    seed("primaryColor", field(content, "primaryColor")) || "#c8102e",
  );
  const [brideFullName, setBrideFullName] = useState(initialBrideFullName);
  const [groomFullName, setGroomFullName] = useState(initialGroomFullName);
  const [weddingDate, setWeddingDate] = useState(seed("date", field(content, "date")));
  const [brideShortName, setBrideShortName] = useState(storedBrideShortName || derivedBrideShortName);
  const [groomShortName, setGroomShortName] = useState(storedGroomShortName || derivedGroomShortName);
  const [brideShortNameEdited, setBrideShortNameEdited] = useState(
    Boolean(storedBrideShortName && storedBrideShortName !== derivedBrideShortName),
  );
  const [groomShortNameEdited, setGroomShortNameEdited] = useState(
    Boolean(storedGroomShortName && storedGroomShortName !== derivedGroomShortName),
  );
  const [brideFirst, setBrideFirst] = useState(seedBool("brideFirst", content?.brideFirst ?? true));
  const zodiacOptions = ZODIAC.map((item) => ({
    value: item.id,
    label: zodiacT(`options.${item.id}`),
  }));
  const [ceremonyRows, setCeremonyRows] = useState<CeremonyRow[]>(() => {
    const draftTitles = Array.isArray(activeDraft?.ceremonyItemTitle)
      ? activeDraft.ceremonyItemTitle
      : null;
    const draftDates = Array.isArray(activeDraft?.ceremonyItemDate)
      ? activeDraft.ceremonyItemDate
      : null;
    const draftTimes = Array.isArray(activeDraft?.ceremonyItemTime)
      ? activeDraft.ceremonyItemTime
      : null;
    if (draftTitles || draftDates || draftTimes) {
      return Array.from(
        { length: Math.max(draftTitles?.length ?? 0, draftDates?.length ?? 0, draftTimes?.length ?? 0) },
        (_, index) => ({
          id: `ceremony-draft-${index}`,
          title: draftTitles?.[index] ?? "",
          date: draftDates?.[index] ?? "",
          time: draftTimes?.[index] ?? "",
        }),
      );
    }
    if (ceremonies.length) {
      return ceremonies.map((ceremony, index) => ({
        id: `ceremony-saved-${index}`,
        ...ceremony,
      }));
    }
    const legacyTitle = field(content, "ceremonyHeader");
    const legacyDate = field(content, "ceremonyDate");
    const legacyTime = field(content, "ceremonyTime");
    return [{
      id: "ceremony-initial",
      title: legacyTitle || defaultCeremonyMessage(field(content, "ceremonyType")),
      date: legacyDate,
      time: legacyTime,
    }];
  });
  const [ceremonyDeleteId, setCeremonyDeleteId] = useState<string | null>(null);

  function onTemplateChange(nextTemplateId: string) {
    if (
      nextTemplateId === ZODIAC_TEMPLATE_SLUG &&
      selectedTemplateId !== ZODIAC_TEMPLATE_SLUG &&
      primaryColor.toLowerCase() === "#c8102e"
    ) {
      setPrimaryColor(DEFAULT_ZODIAC_ART_COLOR);
    }
    setSelectedTemplateId(nextTemplateId);
  }

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
    date: weddingDate,
  });
  const [slug, setSlug] = useState(initialSlug);
  const [slugEdited, setSlugEdited] = useState(Boolean(currentSlug));
  const [slugStatus, setSlugStatus] = useState<SlugCheckResult | null>(null);
  const [checking, startCheck] = useTransition();

  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [previewContent, setPreviewContent] = useState<ChungDoiDemoContent | null>(null);

  // Autosave ngầm lên DB: debounce mỗi thay đổi, bỏ qua nếu trùng bản đã lưu,
  // và không bao giờ chạy hai request cùng lúc (xem autosave-controller).
  // Owner-only: support/demo mutations go through explicit save/publish only.
  const autosaveRef = useRef<ReturnType<typeof createAutosaveController<Draft>> | null>(null);
  if (autosaveRef.current === null && ownerMode) {
    autosaveRef.current = createAutosaveController<Draft>({
      initial: activeDraft ?? {},
      equals: draftsEqual,
      save: async (draft) => autosaveDraft(invitationId, draftToFormData(draft)),
      setTimer: (fn) => window.setTimeout(fn, AUTOSAVE_DEBOUNCE_MS),
      clearTimer: (handle) => window.clearTimeout(handle as number),
    });
  }

  const {
    capture: captureDraft,
    clear: clearDraft,
    getLatest: getLatestDraft,
    persist: persistDraft,
  } = useFormDraft({
    formId: "editor-form",
    invitationId,
    enabled: ownerMode,
    onChange: (draft) => autosaveRef.current?.schedule(draft),
    onFlush: (draft) => {
      autosaveRef.current?.schedule(draft);
      autosaveRef.current?.flush();
    },
  });

  useEffect(() => () => autosaveRef.current?.dispose(), []);

  function reconcilePersistedDraft() {
    if (!ownerMode) return;
    const submitted = submittedDraftRef.current;
    if (!submitted) return;

    const latest = getLatestDraft() ?? readDraft(invitationId) ?? submitted;
    setSubmittedDraft(latest);
    // Lưu tay/publish vừa ghi DB xong: dời baseline autosave để không lưu lại y hệt.
    autosaveRef.current?.seed(latest);
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
    else if (saveState?.errorCode) toast.error(errorT(saveState.errorCode));
    if (saveState?.persisted) reconcilePersistedDraft();
    // Mỗi object saveState tương ứng với đúng một lần Server Action hoàn tất.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveState]);

  useEffect(() => {
    if (publishState?.errorCode) {
      toast.error(errorT(publishState.errorCode));
      // Analytics chỉ nhận error code, không nhận message đã dịch.
      trackEvent("publish_invitation_error", {
        template_id: selectedTemplateId,
        error_code: publishState.errorCode,
      });
    }
    if (publishState?.focusField) {
      const el = document.getElementById(publishState.focusField);
      if (el) {
        if (el.offsetParent === null) {
          el.closest("section")?.querySelector("button")?.click();
        }
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus({ preventScroll: true });
          el.classList.add("ring-2", "ring-destructive", "ring-offset-2");
          setTimeout(() => el.classList.remove("ring-2", "ring-destructive", "ring-offset-2"), 2500);
        }, 60);
      }
    }
    if (publishState?.publishedSlug) {
      setPublishedSlug(publishState.publishedSlug);
      if (ownerMode) setPublishDialogSlug(publishState.publishedSlug);
      trackEvent("publish_invitation", { template_id: selectedTemplateId });
    }
    if (publishState?.publishedAt) {
      setActivePublishedAt(publishState.publishedAt);
    }
    if (publishState?.persisted) reconcilePersistedDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishState]);

  useEffect(() => {
    if (slugEdited) return;
    setSlug(slugFromFormFields({
      brideFullName,
      groomFullName,
      brideShortName,
      groomShortName,
      brideFirst,
      date: weddingDate,
    }));
  }, [brideFirst, brideFullName, brideShortName, groomFullName, groomShortName, weddingDate, slugEdited]);

  function handleTextCaseBlur(event: ReactFocusEvent<HTMLFormElement>) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) return;

    const formatter = NAME_CASE_FIELDS.has(target.name)
      ? titleCaseVietnameseName
      : SENTENCE_CASE_FIELDS.has(target.name)
        ? capitalizeVietnameseSentences
        : null;
    if (!formatter) return;

    const normalized = formatter(target.value);
    if (normalized === target.value) return;
    target.value = normalized;

    if (target.name === "brideFullName") {
      setBrideFullName(normalized);
      if (!brideShortNameEdited) setBrideShortName(shortNameFromFullName(normalized));
    } else if (target.name === "groomFullName") {
      setGroomFullName(normalized);
      if (!groomShortNameEdited) setGroomShortName(shortNameFromFullName(normalized));
    } else if (target.name === "brideShortName") {
      setBrideShortName(normalized);
      setBrideShortNameEdited(Boolean(normalized && normalized !== shortNameFromFullName(brideFullName)));
    } else if (target.name === "groomShortName") {
      setGroomShortName(normalized);
      setGroomShortNameEdited(Boolean(normalized && normalized !== shortNameFromFullName(groomFullName)));
    } else if (target.name === "ceremonyItemTitle") {
      const rowId = target.id.replace(/^ceremony-title-/, "");
      setCeremonyRows((rows) => rows.map((row) => (
        row.id === rowId ? { ...row, title: normalized } : row
      )));
    }
  }

  function onShowPreview() {
    const form = document.getElementById("editor-form") as HTMLFormElement | null;
    if (!form) return;
    setPreviewContent(buildPreviewContent(form, invitationId));
    setTab("preview");
    trackEvent("preview_invitation", { template_id: selectedTemplateId });
  }

  function onCheckSlug() {
    if (!slug.trim()) {
      setSlugStatus({ available: false, reasonCode: "slugMissing" });
      return;
    }
    startCheck(async () => {
      const result = await checkSlugActionProp(slug, invitationId);
      setSlugStatus(result);
    });
  }

  const isPublished = status === "published" || Boolean(publishedSlug);

  const backHref = supportMode
    ? `/admin/users/${supportContext?.userId ?? ""}`
    : ownerMode
      ? "/dashboard"
      : "/admin/demos";
  const backLabel = supportMode
    ? supportT("back")
    : ownerMode
      ? "← Bảng điều khiển"
      : "← Danh sách thiệp demo";

  return (
    <>
      <AdaptiveToaster />
      <div className="fixed left-1/2 top-4 z-[120] -translate-x-1/2">
        <TabBar
          tab={tab}
          onEdit={() => setTab("edit")}
          onPreview={onShowPreview}
          shareSlug={
            ownerMode
              ? publishedSlug ?? (status === "published" ? currentSlug ?? undefined : undefined)
              : undefined
          }
          templateId={selectedTemplateId}
        />
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
            href={backHref}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {backLabel.startsWith("←") ? backLabel : `← ${backLabel}`}
          </Link>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Chỉnh sửa thiệp</h1>
          <p className="text-sm text-muted-foreground">
            Trạng thái: {isPublished ? "Đã xuất bản" : "Bản nháp"}
          </p>
        </div>
        {supportMode && supportContext ? (
          <div
            role="status"
            className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3"
          >
            <p className="text-sm font-semibold text-primary">
              {supportT("banner", { email: supportContext.email })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {supportT("bannerDescription")}
            </p>
          </div>
        ) : null}
        {ownerMode && isPublished && activation === "trial" && activePublishedAt ? (
          <TrialCountdownBanner
            invitationId={invitationId}
            expiresAt={trialExpiresAt(new Date(activePublishedAt)).getTime()}
            source="editor"
            className="mb-6"
          />
        ) : null}

        <form
          action={saveFormAction}
          onBlurCapture={handleTextCaseBlur}
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

            const ceremonyTitles = Array.isArray(snapshot.ceremonyItemTitle)
              ? snapshot.ceremonyItemTitle
              : [];
            const ceremonyDates = Array.isArray(snapshot.ceremonyItemDate)
              ? snapshot.ceremonyItemDate
              : [];
            const ceremonyTimes = Array.isArray(snapshot.ceremonyItemTime)
              ? snapshot.ceremonyItemTime
              : [];
            setCeremonyRows(
              Array.from(
                {
                  length: Math.max(
                    ceremonyTitles.length,
                    ceremonyDates.length,
                    ceremonyTimes.length,
                  ),
                },
                (_, index) => ({
                  id: `ceremony-submitted-${index}`,
                  title: ceremonyTitles[index] ?? "",
                  date: ceremonyDates[index] ?? "",
                  time: ceremonyTimes[index] ?? "",
                }),
              ),
            );
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
            {templateSupportsZodiac(selectedTemplateId) ? (
              <>
                <ZodiacField
                  name="brideZodiac"
                  label={zodiacT("brideLabel")}
                  defaultValue={seed("brideZodiac", field(content, "brideZodiac"))}
                  placeholder={zodiacT("placeholder")}
                  hint={zodiacT("hint")}
                  options={zodiacOptions}
                />
                <ZodiacField
                  name="groomZodiac"
                  label={zodiacT("groomLabel")}
                  defaultValue={seed("groomZodiac", field(content, "groomZodiac"))}
                  placeholder={zodiacT("placeholder")}
                  hint={zodiacT("hint")}
                  options={zodiacOptions}
                />
              </>
            ) : null}
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
              initialUrl2={seed("heroImage2", field(content, "heroImage2"))}
              initialEnabled={seedBool("showHeroImage", content?.showHeroImage ?? true)}
              count={heroImageCount(selectedTemplateId)}
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

        <Accordion title={venueT("title")} icon="✦">
          <Grid>
            <VenueLocationFields
              initialAddress={seed("address", field(content, "address"))}
              initialMapAddress={seed("mapAddress", field(content, "mapAddress"))}
              resolveMapAction={resolveMapActionProp}
            />
          </Grid>
        </Accordion>

        <Accordion title={ceremonyT("sectionTitle")} icon="🕊">
          <input type="hidden" name="ceremonyType" value="thanh-hon" />
          <input type="hidden" name="ceremonyHeader" value={ceremonyRows[0]?.title ?? ""} />
          <input type="hidden" name="ceremonyDate" value={ceremonyRows[0]?.date ?? ""} />
          <input type="hidden" name="ceremonyTime" value={ceremonyRows[0]?.time ?? ""} />

          <div className="space-y-4">
            {ceremonyRows.length ? ceremonyRows.map((row, index) => {
              const parsedDate = row.date ? new Date(`${row.date}T00:00:00`) : null;
              const weekday = parsedDate && !Number.isNaN(parsedDate.getTime())
                ? parsedDate.toLocaleDateString(locale, { weekday: "long" })
                : "";
              const lunarDate = formatVietnameseLunarDate(row.date);
              return (
                <section
                  key={row.id}
                  className="relative rounded-2xl border border-border bg-background/55 p-4 sm:p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-foreground">
                      {ceremonyT("itemLabel", { number: index + 1 })}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCeremonyDeleteId(row.id)}
                      aria-label={ceremonyT("deleteLabel", { number: index + 1 })}
                      className="grid size-10 shrink-0 place-items-center rounded-full text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Trash2 className="size-4.5" aria-hidden />
                    </button>
                  </div>

                  <label htmlFor={`ceremony-title-${row.id}`} className={labelClass}>
                    {ceremonyT("titleLabel")}
                  </label>
                  <textarea
                    id={`ceremony-title-${row.id}`}
                    name="ceremonyItemTitle"
                    value={row.title}
                    onChange={(event) => {
                      const title = event.target.value;
                      setCeremonyRows((rows) => rows.map((item) => (
                        item.id === row.id ? { ...item, title } : item
                      )));
                    }}
                    placeholder={ceremonyT("titlePlaceholder")}
                    rows={3}
                    className={`${inputClass} resize-y leading-6`}
                  />

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className={labelClass}>{ceremonyT("dateLabel")}</span>
                      <input
                        name="ceremonyItemDate"
                        type="date"
                        value={row.date}
                        onChange={(event) => {
                          const date = event.target.value;
                          setCeremonyRows((rows) => rows.map((item) => (
                            item.id === row.id
                              ? { ...item, date }
                              : item.date ? item : { ...item, date }
                          )));
                          if (date) setWeddingDate((prev) => prev || date);
                        }}
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>{ceremonyT("timeLabel")}</span>
                      <input
                        name="ceremonyItemTime"
                        type="time"
                        value={row.time}
                        onChange={(event) => {
                          const time = event.target.value;
                          setCeremonyRows((rows) => rows.map((item) => (
                            item.id === row.id ? { ...item, time } : item
                          )));
                        }}
                        className={inputClass}
                      />
                    </label>
                  </div>

                  {weekday || lunarDate ? (
                    <div className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs leading-5 text-muted-foreground" aria-live="polite">
                      {weekday ? <span className="font-semibold capitalize text-foreground">{weekday}</span> : null}
                      {weekday && lunarDate ? <span> · </span> : null}
                      {lunarDate}
                    </div>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">{ceremonyT("dateHint")}</p>
                </section>
              );
            }) : (
              <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                {ceremonyT("empty")}
              </div>
            )}

            <button
              type="button"
              onClick={() => setCeremonyRows((rows) => (
                rows.length >= 20 ? rows : [...rows, newCeremonyRow()]
              ))}
              disabled={ceremonyRows.length >= 20}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4.5" aria-hidden />
              {ceremonyT("add")}
              <span className="text-xs font-normal italic text-muted-foreground">{ceremonyT("optional")}</span>
            </button>
          </div>
        </Accordion>

        <Accordion title="Phần Tiệc" icon="✿">
          <Grid>
            <EventDateTimeField
              dateName="date"
              timeName="time"
              label="Ngày cưới (tiệc cưới diễn ra vào lúc)"
              dateDefault={seed("date", field(content, "date"))}
              timeDefault={seed("time", field(content, "time")) || seed("banquetTime", field(content, "banquetTime"))}
              hint="Thứ và ngày âm lịch được hệ thống tự tính từ ngày dương lịch."
              requiredMark
              value={weddingDate}
              onDateChange={setWeddingDate}
            />
          </Grid>
          <div className="mt-6 border-t border-border pt-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Chương trình <span className="text-xs font-normal italic text-muted-foreground">(không bắt buộc)</span>
                </p>
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
                <div
                  key={index}
                  className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto]"
                >
                  <input
                    name="scheduleTime"
                    type="time"
                    defaultValue={row.time}
                    className={`${inputClass} col-start-1 row-start-1 sm:w-32`}
                  />
                  <input
                    name="scheduleLabel"
                    defaultValue={row.label}
                    placeholder="VD: Đón khách"
                    className={`${inputClass} col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1`}
                  />
                  <button
                    type="button"
                    onClick={() => setScheduleRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}
                    className="col-start-2 row-start-1 min-h-11 rounded-lg border border-border px-3 text-sm text-muted-foreground transition hover:border-destructive/40 hover:text-destructive sm:col-start-3"
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
          <AlbumLayoutField defaultValue={seed("albumLayout", field(content, "albumLayout") ?? "grid")} />
          <div className="mt-4">
            <GalleryUploader initial={Array.isArray(draft?.galleryUrl) ? (draft!.galleryUrl as string[]) : gallery} />
          </div>
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
              formatOptionLabel={(option) => (
                <span
                  style={option.value ? { fontFamily: `"${option.value}"` } : undefined}
                  className="text-base"
                >
                  {option.label}
                </span>
              )}
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
            <ColorField
              name="primaryColor"
              label="Màu chủ đạo"
              value={primaryColor}
              onChange={setPrimaryColor}
            />
          </Grid>
        </Accordion>

        <Accordion title="Dress Code" icon="👗" defaultOpen={false}>
          <DressCodeField defaultValue={seed("dressCodeColors", field(content, "dressCodeColors"))} />
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
          <TemplatePicker
            value={selectedTemplateId}
            onChange={onTemplateChange}
            labels={templateLabels}
          />
        </Accordion>

        {!ownerMode && (
          <div className="sticky bottom-0 -mx-4 mt-2 flex items-center gap-3 border-t border-border bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
            <button
              type="submit"
              formNoValidate
              disabled={saving || publishing}
              className="rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu bản nháp"}
            </button>
            {supportMode ? (
              <button
                type="submit"
                formAction={publishFormAction}
                disabled={saving || publishing}
                className="rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {publishing
                  ? isPublished
                    ? "Đang lưu..."
                    : "Đang lưu và xuất bản..."
                  : isPublished
                    ? "Lưu"
                    : "Xuất bản thiệp"}
              </button>
            ) : null}
          </div>
        )}

      {showSlugSection && (
      <section className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <h2 className="mb-4 text-xl font-bold text-primary">Xuất bản</h2>
        <div className="space-y-3">
          <label htmlFor="slug" className={labelClass}>
            Đường dẫn công khai
          </label>
          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
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
              className="col-span-2 min-h-11 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-60 sm:col-span-1"
            >
              {checking ? "..." : "Kiểm tra"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Tự tạo từ tên cô dâu/chú rể, bạn có thể sửa lại tuỳ ý.</p>
          {slugStatus ? (
            <p className={`text-sm ${slugStatus.available ? "text-emerald-700" : "text-red-700"}`}>
              {slugStatus.available
                ? "Đường dẫn khả dụng"
                : errorT(slugStatus.reasonCode)}
            </p>
          ) : null}
          {publishState?.errorCode ? (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700">
              {errorT(publishState.errorCode)}
            </p>
          ) : null}
        </div>

        {activation === "paid" ? (
          <p className="mt-4 text-sm font-semibold text-emerald-700">
            Thiệp đã được kích hoạt vĩnh viễn.
          </p>
        ) : null}
        {activation === "complimentary" ? (
          <p className="mt-4 text-sm font-semibold text-emerald-700">
            {supportT("complimentary")}
          </p>
        ) : null}

        {ownerMode && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="submit"
            formAction={publishFormAction}
            data-ga-event="publish_invitation_attempt"
            data-ga-param-template-id={selectedTemplateId}
            disabled={saving || publishing}
            className="rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-60"
          >
            {publishing
              ? isPublished
                ? "Đang lưu..."
                : "Đang lưu và xuất bản..."
              : isPublished
                ? "Lưu"
                : "Xuất bản thiệp"}
          </button>
        </div>
        )}
      </section>
      )}
      </form>
      </div>
      {ownerMode && publishDialogSlug ? (
        <PublishSuccessDialog
          invitationId={invitationId}
          activated={activated}
          slug={publishDialogSlug}
          onClose={() => setPublishDialogSlug(null)}
        />
      ) : null}
      <CeremonyDeleteDialog
        rows={ceremonyRows}
        deleteId={ceremonyDeleteId}
        onCancel={() => setCeremonyDeleteId(null)}
        onConfirm={() => {
          setCeremonyRows((rows) => rows.filter((row) => row.id !== ceremonyDeleteId));
          setCeremonyDeleteId(null);
        }}
      />
    </>
  );
}

/**
 * Demo editor body: save-only. It never declares publish/slug/map actions, so
 * a demo invitation cannot be published from this form or fall back to owner
 * actions — not at runtime, not at the type level.
 */
function DemoEditorFormBody({
  invitationId,
  status,
  templateId,
  content,
  ceremonies,
  schedule,
  gallery,
  locale,
  musicMessages,
  initialTrack,
  templateLabels,
  saveAction: saveActionProp,
  restoredDraft,
}: DemoEditorFormBodyConfig) {
  const venueT = useTranslations("editor.venue");
  const ceremonyT = useTranslations("editor.ceremonies");
  const zodiacT = useTranslations("editor.zodiac");
  const errorT = useTranslations("editor.errors");
  const saveAction = saveActionProp.bind(null, invitationId);
  const [saveState, saveFormAction, saving] = useActionState<EditorState, FormData>(saveAction, undefined);

  const draft = restoredDraft;
  const [submittedDraft, setSubmittedDraft] = useState<Draft | null>(null);
  const activeDraft = submittedDraft ?? draft;
  const seed = (key: string, fallback: string) =>
    typeof activeDraft?.[key] === "string" ? (activeDraft[key] as string) : fallback;
  const seedBool = (key: string, fallback: boolean) =>
    typeof activeDraft?.[key] === "boolean" ? (activeDraft[key] as boolean) : fallback;

  const initialBrideFullName = seed("brideFullName", field(content, "brideFullName"));
  const initialGroomFullName = seed("groomFullName", field(content, "groomFullName"));

  const [selectedTemplateId, setSelectedTemplateId] = useState(seed("templateId", templateId));
  const [primaryColor, setPrimaryColor] = useState(
    seed("primaryColor", field(content, "primaryColor")) || "#c8102e",
  );
  const [brideFullName, setBrideFullName] = useState(initialBrideFullName);
  const [groomFullName, setGroomFullName] = useState(initialGroomFullName);
  const [weddingDate, setWeddingDate] = useState(seed("date", field(content, "date")));
  const [brideShortName, setBrideShortName] = useState(
    seed("brideShortName", field(content, "brideShortName")) || shortNameFromFullName(initialBrideFullName),
  );
  const [groomShortName, setGroomShortName] = useState(
    seed("groomShortName", field(content, "groomShortName")) || shortNameFromFullName(initialGroomFullName),
  );
  const [brideFirst, setBrideFirst] = useState(seedBool("brideFirst", content?.brideFirst ?? true));
  const zodiacOptions = ZODIAC.map((item) => ({
    value: item.id,
    label: zodiacT(`options.${item.id}`),
  }));
  const [ceremonyRows, setCeremonyRows] = useState<CeremonyRow[]>(() => {
    if (ceremonies.length) {
      return ceremonies.map((ceremony, index) => ({
        id: `ceremony-saved-${index}`,
        ...ceremony,
      }));
    }
    const legacyTitle = field(content, "ceremonyHeader");
    const legacyDate = field(content, "ceremonyDate");
    const legacyTime = field(content, "ceremonyTime");
    return [{
      id: "ceremony-initial",
      title: legacyTitle || defaultCeremonyMessage(field(content, "ceremonyType")),
      date: legacyDate,
      time: legacyTime,
    }];
  });
  const [ceremonyDeleteId, setCeremonyDeleteId] = useState<string | null>(null);

  function onTemplateChange(nextTemplateId: string) {
    if (
      nextTemplateId === ZODIAC_TEMPLATE_SLUG &&
      selectedTemplateId !== ZODIAC_TEMPLATE_SLUG &&
      primaryColor.toLowerCase() === "#c8102e"
    ) {
      setPrimaryColor(DEFAULT_ZODIAC_ART_COLOR);
    }
    setSelectedTemplateId(nextTemplateId);
  }

  const [scheduleRows, setScheduleRows] = useState(() => {
    return schedule.length ? schedule : [{ time: "", label: "" }];
  });

  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [previewContent, setPreviewContent] = useState<ChungDoiDemoContent | null>(null);

  const { capture: captureDraft } = useFormDraft({
    formId: "editor-form",
    invitationId,
    enabled: false,
  });

  useEffect(() => {
    if (saveState?.ok) toast.success("Đã lưu bản nháp");
    else if (saveState?.errorCode) toast.error(errorT(saveState.errorCode));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveState]);

  function handleTextCaseBlur(event: ReactFocusEvent<HTMLFormElement>) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) return;

    const formatter = NAME_CASE_FIELDS.has(target.name)
      ? titleCaseVietnameseName
      : SENTENCE_CASE_FIELDS.has(target.name)
        ? capitalizeVietnameseSentences
        : null;
    if (!formatter) return;

    const normalized = formatter(target.value);
    if (normalized === target.value) return;
    target.value = normalized;

    if (target.name === "brideFullName") {
      setBrideFullName(normalized);
      setBrideShortName(shortNameFromFullName(normalized));
    } else if (target.name === "groomFullName") {
      setGroomFullName(normalized);
      setGroomShortName(shortNameFromFullName(normalized));
    } else if (target.name === "ceremonyItemTitle") {
      const rowId = target.id.replace(/^ceremony-title-/, "");
      setCeremonyRows((rows) => rows.map((row) => (
        row.id === rowId ? { ...row, title: normalized } : row
      )));
    }
  }

  function onShowPreview() {
    const form = document.getElementById("editor-form") as HTMLFormElement | null;
    if (!form) return;
    setPreviewContent(buildPreviewContent(form, invitationId));
    setTab("preview");
  }

  const isPublished = status === "published";

  return (
    <>
      <AdaptiveToaster />
      <div className="fixed left-1/2 top-4 z-[120] -translate-x-1/2">
        <TabBar
          tab={tab}
          onEdit={() => setTab("edit")}
          onPreview={onShowPreview}
          templateId={selectedTemplateId}
        />
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
            href="/admin/demos"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Danh sách thiệp demo
          </Link>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Chỉnh sửa thiệp</h1>
          <p className="text-sm text-muted-foreground">
            Trạng thái: {isPublished ? "Đã xuất bản" : "Bản nháp"}
          </p>
        </div>

        <form
          action={saveFormAction}
          onBlurCapture={handleTextCaseBlur}
          onReset={(event) => event.preventDefault()}
          onSubmitCapture={() => {
            const snapshot = captureDraft();
            if (!snapshot) return;
            setSubmittedDraft(snapshot);
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
                  setBrideShortName(shortNameFromFullName(next));
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
                  setGroomShortName(shortNameFromFullName(next));
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
                onChange={(event) => setBrideShortName(event.target.value)}
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
                onChange={(event) => setGroomShortName(event.target.value)}
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
            {templateSupportsZodiac(selectedTemplateId) ? (
              <>
                <ZodiacField
                  name="brideZodiac"
                  label={zodiacT("brideLabel")}
                  defaultValue={seed("brideZodiac", field(content, "brideZodiac"))}
                  placeholder={zodiacT("placeholder")}
                  hint={zodiacT("hint")}
                  options={zodiacOptions}
                />
                <ZodiacField
                  name="groomZodiac"
                  label={zodiacT("groomLabel")}
                  defaultValue={seed("groomZodiac", field(content, "groomZodiac"))}
                  placeholder={zodiacT("placeholder")}
                  hint={zodiacT("hint")}
                  options={zodiacOptions}
                />
              </>
            ) : null}
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
              initialUrl2={seed("heroImage2", field(content, "heroImage2"))}
              initialEnabled={seedBool("showHeroImage", content?.showHeroImage ?? true)}
              count={heroImageCount(selectedTemplateId)}
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

        <Accordion title={venueT("title")} icon="✦">
          <Grid>
            <VenueLocationFields
              initialAddress={seed("address", field(content, "address"))}
              initialMapAddress={seed("mapAddress", field(content, "mapAddress"))}
              resolveMapAction={resolveGoogleMapsLink}
            />
          </Grid>
        </Accordion>

        <Accordion title={ceremonyT("sectionTitle")} icon="🕊">
          <input type="hidden" name="ceremonyType" value="thanh-hon" />
          <input type="hidden" name="ceremonyHeader" value={ceremonyRows[0]?.title ?? ""} />
          <input type="hidden" name="ceremonyDate" value={ceremonyRows[0]?.date ?? ""} />
          <input type="hidden" name="ceremonyTime" value={ceremonyRows[0]?.time ?? ""} />

          <div className="space-y-4">
            {ceremonyRows.length ? ceremonyRows.map((row, index) => {
              const parsedDate = row.date ? new Date(`${row.date}T00:00:00`) : null;
              const weekday = parsedDate && !Number.isNaN(parsedDate.getTime())
                ? parsedDate.toLocaleDateString(locale, { weekday: "long" })
                : "";
              const lunarDate = formatVietnameseLunarDate(row.date);
              return (
                <section
                  key={row.id}
                  className="relative rounded-2xl border border-border bg-background/55 p-4 sm:p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-foreground">
                      {ceremonyT("itemLabel", { number: index + 1 })}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCeremonyDeleteId(row.id)}
                      aria-label={ceremonyT("deleteLabel", { number: index + 1 })}
                      className="grid size-10 shrink-0 place-items-center rounded-full text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Trash2 className="size-4.5" aria-hidden />
                    </button>
                  </div>

                  <label htmlFor={`ceremony-title-${row.id}`} className={labelClass}>
                    {ceremonyT("titleLabel")}
                  </label>
                  <textarea
                    id={`ceremony-title-${row.id}`}
                    name="ceremonyItemTitle"
                    value={row.title}
                    onChange={(event) => {
                      const title = event.target.value;
                      setCeremonyRows((rows) => rows.map((item) => (
                        item.id === row.id ? { ...item, title } : item
                      )));
                    }}
                    placeholder={ceremonyT("titlePlaceholder")}
                    rows={3}
                    className={`${inputClass} resize-y leading-6`}
                  />

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className={labelClass}>{ceremonyT("dateLabel")}</span>
                      <input
                        name="ceremonyItemDate"
                        type="date"
                        value={row.date}
                        onChange={(event) => {
                          const date = event.target.value;
                          setCeremonyRows((rows) => rows.map((item) => (
                            item.id === row.id
                              ? { ...item, date }
                              : item.date ? item : { ...item, date }
                          )));
                          if (date) setWeddingDate((prev) => prev || date);
                        }}
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>{ceremonyT("timeLabel")}</span>
                      <input
                        name="ceremonyItemTime"
                        type="time"
                        value={row.time}
                        onChange={(event) => {
                          const time = event.target.value;
                          setCeremonyRows((rows) => rows.map((item) => (
                            item.id === row.id ? { ...item, time } : item
                          )));
                        }}
                        className={inputClass}
                      />
                    </label>
                  </div>

                  {weekday || lunarDate ? (
                    <div className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs leading-5 text-muted-foreground" aria-live="polite">
                      {weekday ? <span className="font-semibold capitalize text-foreground">{weekday}</span> : null}
                      {weekday && lunarDate ? <span> · </span> : null}
                      {lunarDate}
                    </div>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">{ceremonyT("dateHint")}</p>
                </section>
              );
            }) : (
              <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                {ceremonyT("empty")}
              </div>
            )}

            <button
              type="button"
              onClick={() => setCeremonyRows((rows) => (
                rows.length >= 20 ? rows : [...rows, newCeremonyRow()]
              ))}
              disabled={ceremonyRows.length >= 20}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4.5" aria-hidden />
              {ceremonyT("add")}
              <span className="text-xs font-normal italic text-muted-foreground">{ceremonyT("optional")}</span>
            </button>
          </div>
        </Accordion>

        <Accordion title="Phần Tiệc" icon="✿">
          <Grid>
            <EventDateTimeField
              dateName="date"
              timeName="time"
              label="Ngày cưới (tiệc cưới diễn ra vào lúc)"
              dateDefault={seed("date", field(content, "date"))}
              timeDefault={seed("time", field(content, "time")) || seed("banquetTime", field(content, "banquetTime"))}
              hint="Thứ và ngày âm lịch được hệ thống tự tính từ ngày dương lịch."
              requiredMark
              value={weddingDate}
              onDateChange={setWeddingDate}
            />
          </Grid>
          <div className="mt-6 border-t border-border pt-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Chương trình <span className="text-xs font-normal italic text-muted-foreground">(không bắt buộc)</span>
                </p>
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
                <div
                  key={index}
                  className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto]"
                >
                  <input
                    name="scheduleTime"
                    type="time"
                    defaultValue={row.time}
                    className={`${inputClass} col-start-1 row-start-1 sm:w-32`}
                  />
                  <input
                    name="scheduleLabel"
                    defaultValue={row.label}
                    placeholder="VD: Đón khách"
                    className={`${inputClass} col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1`}
                  />
                  <button
                    type="button"
                    onClick={() => setScheduleRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}
                    className="col-start-2 row-start-1 min-h-11 rounded-lg border border-border px-3 text-sm text-muted-foreground transition hover:border-destructive/40 hover:text-destructive sm:col-start-3"
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
          <AlbumLayoutField defaultValue={seed("albumLayout", field(content, "albumLayout") ?? "grid")} />
          <div className="mt-4">
            <GalleryUploader initial={gallery} />
          </div>
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
              formatOptionLabel={(option) => (
                <span
                  style={option.value ? { fontFamily: `"${option.value}"` } : undefined}
                  className="text-base"
                >
                  {option.label}
                </span>
              )}
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
            <ColorField
              name="primaryColor"
              label="Màu chủ đạo"
              value={primaryColor}
              onChange={setPrimaryColor}
            />
          </Grid>
        </Accordion>

        <Accordion title="Dress Code" icon="👗" defaultOpen={false}>
          <DressCodeField defaultValue={seed("dressCodeColors", field(content, "dressCodeColors"))} />
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
          <TemplatePicker
            value={selectedTemplateId}
            onChange={onTemplateChange}
            labels={templateLabels}
          />
        </Accordion>

        <div className="sticky bottom-0 -mx-4 mt-2 flex items-center gap-3 border-t border-border bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <button
            type="submit"
            formNoValidate
            disabled={saving}
            className="rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu bản nháp"}
          </button>
        </div>
        </form>
      </div>
      <CeremonyDeleteDialog
        rows={ceremonyRows}
        deleteId={ceremonyDeleteId}
        onCancel={() => setCeremonyDeleteId(null)}
        onConfirm={() => {
          setCeremonyRows((rows) => rows.filter((row) => row.id !== ceremonyDeleteId));
          setCeremonyDeleteId(null);
        }}
      />
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

  const ownerMode = (props.mode ?? "owner") === "owner";
  // The localStorage draft is owner-only: demo/support modes seed straight from
  // the database and must never read or write it.
  const restoredDraft = ownerMode
    ? readDraft(props.invitationId)
    : null;

  if (props.mode === "support-admin") {
    return (
      <EditorFormBody
        {...props}
        ownerMode={false}
        supportMode
        showSlugSection
        supportContext={props.supportContext}
        saveAction={props.saveAction}
        publishAction={props.publishAction}
        checkSlugAction={props.checkSlugAction}
        resolveMapAction={props.resolveMapAction}
        restoredDraft={restoredDraft}
      />
    );
  }

  if (props.mode === "demo-admin") {
    return (
      <DemoEditorFormBody
        {...props}
        saveAction={props.saveAction}
        restoredDraft={restoredDraft}
      />
    );
  }

  return (
    <EditorFormBody
      {...props}
      ownerMode
      supportMode={false}
      showSlugSection
      supportContext={null}
      saveAction={saveDraft}
      publishAction={publish}
      checkSlugAction={checkSlug}
      resolveMapAction={resolveGoogleMapsLink}
      restoredDraft={restoredDraft}
    />
  );
}
