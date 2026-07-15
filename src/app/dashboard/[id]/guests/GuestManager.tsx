"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
  CheckCircle2,
  Clipboard,
  Download,
  FileDown,
  FileUp,
  Gift,
  Link2,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  QrCode,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { guestsToCsv, guestCsvTemplate, parseGuestCsv } from "@/lib/guest-csv";
import type { GuestImportRow, GuestRow } from "@/lib/guest-manager";
import { trackEvent } from "@/lib/analytics";
import {
  addGuest,
  deleteGuests,
  importGuests,
  updateGuest,
  type GuestActionError,
  type GuestState,
} from "./actions";

export type { GuestRow } from "@/lib/guest-manager";

type Props = {
  invitationId: string;
  slug: string | null;
  guests: GuestRow[];
  accessToken?: string | null;
};

const FIELD_CLASS =
  "min-h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15";

function guestLink(slug: string, token: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/thiep/${slug}?g=${token}`;
}

function zaloShareUrl(url: string) {
  return `https://sp.zalo.me/plugins/share?url=${encodeURIComponent(url)}`;
}

function messengerShareUrl(url: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function formatCurrency(value: number | null) {
  if (value === null) return null;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-foreground">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-normal text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function ModalFrame({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = "max-w-2xl",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  const t = useTranslations("guestManager");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-4">
          <Dialog.Popup
            className={`w-full ${maxWidth} max-h-[94dvh] overflow-y-auto rounded-t-3xl border border-border bg-card p-5 text-foreground shadow-2xl shadow-primary/10 outline-none transition data-[ending-style]:translate-y-4 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-4 data-[starting-style]:opacity-0 sm:rounded-3xl sm:p-6`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="font-heading text-xl font-semibold">{title}</Dialog.Title>
                {description ? (
                  <Dialog.Description className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {description}
                  </Dialog.Description>
                ) : null}
              </div>
              <Dialog.Close
                aria-label={t("actions.close")}
                className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="size-5" aria-hidden />
              </Dialog.Close>
            </div>
            {children}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function GuestFields({ guest }: { guest?: GuestRow }) {
  const t = useTranslations("guestManager");
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t("fields.name")}>
        <input
          name="name"
          required
          maxLength={120}
          defaultValue={guest?.name}
          className={FIELD_CLASS}
          autoComplete="name"
        />
      </Field>
      <Field label={t("fields.role")}>
        <input name="role" maxLength={60} defaultValue={guest?.role} className={FIELD_CLASS} />
      </Field>
      <Field label={t("fields.side")}>
        <select name="side" defaultValue={guest?.side ?? ""} className={FIELD_CLASS}>
          <option value="">{t("fields.sideEmpty")}</option>
          <option value="Nhà trai">{t("sides.groom")}</option>
          <option value="Nhà gái">{t("sides.bride")}</option>
        </select>
      </Field>
      <Field label={t("fields.groupName")}>
        <input
          name="groupName"
          maxLength={100}
          defaultValue={guest?.groupName}
          className={FIELD_CLASS}
        />
      </Field>
      <Field label={t("fields.tableName")}>
        <input
          name="tableName"
          maxLength={60}
          defaultValue={guest?.tableName}
          className={FIELD_CLASS}
        />
      </Field>
      <Field label={t("fields.maxGuests")} hint={t("fields.maxGuestsHint")}>
        <input
          name="maxGuests"
          type="number"
          min={1}
          max={20}
          defaultValue={guest?.maxGuests ?? 1}
          className={FIELD_CLASS}
        />
      </Field>
      <Field label={t("fields.phone")}>
        <input
          name="phone"
          type="tel"
          maxLength={30}
          defaultValue={guest?.phone}
          className={FIELD_CLASS}
          autoComplete="tel"
        />
      </Field>
      <Field label={t("fields.email")}>
        <input
          name="email"
          type="email"
          maxLength={160}
          defaultValue={guest?.email}
          className={FIELD_CLASS}
          autoComplete="email"
        />
      </Field>
      <Field label={t("fields.greeting")} hint={t("fields.greetingHint")}>
        <input
          name="greeting"
          maxLength={160}
          defaultValue={guest?.greeting}
          className={FIELD_CLASS}
        />
      </Field>
      <Field label={t("fields.giftAmount")} hint={t("fields.giftAmountHint")}>
        <input
          name="giftAmount"
          type="number"
          min={0}
          step={1000}
          defaultValue={guest?.giftAmount ?? ""}
          className={FIELD_CLASS}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label={t("fields.note")}>
          <textarea
            name="note"
            rows={3}
            maxLength={500}
            defaultValue={guest?.note}
            className={FIELD_CLASS}
          />
        </Field>
      </div>
    </div>
  );
}

function guestWithFormData(guest: GuestRow, formData: FormData): GuestRow {
  const text = (name: string) => String(formData.get(name) ?? "").trim();
  const giftAmount = text("giftAmount");

  return {
    ...guest,
    name: text("name"),
    side: text("side"),
    role: text("role"),
    groupName: text("groupName"),
    tableName: text("tableName"),
    phone: text("phone"),
    email: text("email"),
    greeting: text("greeting"),
    maxGuests: Number(text("maxGuests")),
    giftAmount: giftAmount ? Number(giftAmount) : null,
    note: text("note"),
  };
}

function ActionError({ error }: { error?: GuestActionError }) {
  const t = useTranslations("guestManager");
  if (!error) return null;
  return (
    <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {t(`errors.${error}`)}
    </p>
  );
}

function AddGuestModal({
  invitationId,
  accessToken,
  onClose,
}: {
  invitationId: string;
  accessToken: string | null;
  onClose: () => void;
}) {
  const t = useTranslations("guestManager");
  const router = useRouter();
  const [state, setState] = useState<GuestState>();
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const response = await addGuest(invitationId, accessToken, undefined, formData);
      setState(response);
      if (response?.ok) {
        router.refresh();
        onClose();
      }
    });
  }

  return (
    <ModalFrame
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("add.title")}
      description={t("add.description")}
    >
      <form onSubmit={submit} className="mt-6 space-y-5">
        <GuestFields />
        <ActionError error={state?.error} />
        <div className="flex justify-end gap-3 border-t border-border pt-5">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
            {pending ? t("actions.saving") : t("actions.add")}
          </Button>
        </div>
      </form>
    </ModalFrame>
  );
}

function EditGuestModal({
  invitationId,
  accessToken,
  guest,
  onSaved,
  onClose,
}: {
  invitationId: string;
  accessToken: string | null;
  guest: GuestRow;
  onSaved: (guest: GuestRow) => void;
  onClose: () => void;
}) {
  const t = useTranslations("guestManager");
  const [state, setState] = useState<GuestState>();
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const response = await updateGuest(invitationId, accessToken, guest.id, undefined, formData);
      setState(response);
      if (response?.ok) {
        onSaved(guestWithFormData(guest, formData));
        onClose();
      }
    });
  }

  return (
    <ModalFrame
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("edit.title")}
      description={t("edit.description", { name: guest.name })}
    >
      <form onSubmit={submit} className="mt-6 space-y-5">
        <GuestFields guest={guest} />
        <ActionError error={state?.error} />
        <div className="flex justify-end gap-3 border-t border-border pt-5">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <CheckCircle2 aria-hidden />}
            {pending ? t("actions.saving") : t("actions.save")}
          </Button>
        </div>
      </form>
    </ModalFrame>
  );
}

function ImportGuestsModal({
  invitationId,
  accessToken,
  onClose,
}: {
  invitationId: string;
  accessToken: string | null;
  onClose: () => void;
}) {
  const t = useTranslations("guestManager");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<GuestImportRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [actionError, setActionError] = useState<GuestActionError>();
  const [filename, setFilename] = useState("");
  const [pending, startTransition] = useTransition();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const result = parseGuestCsv(await file.text());
    setFilename(file.name);
    setRows(result.rows);
    setParseErrors(result.errors);
    setActionError(undefined);
  }

  function handleImport() {
    startTransition(async () => {
      const result = await importGuests(invitationId, accessToken, rows);
      if (result?.error) {
        setActionError(result.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  function parseErrorLabel(error: string) {
    if (error === "emptyImport") return t("import.errors.emptyImport");
    if (error === "missingNameColumn") return t("import.errors.missingNameColumn");
    if (error.startsWith("missingName:")) {
      return t("import.errors.missingName", { row: error.split(":")[1] ?? "" });
    }
    return t("errors.invalidData");
  }

  return (
    <ModalFrame
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("import.title")}
      description={t("import.description")}
      maxWidth="max-w-3xl"
    >
      <div className="mt-6 space-y-5">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-primary/40 bg-primary/[0.035] px-5 text-center transition hover:border-primary hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <FileUp className="size-6" aria-hidden />
          </span>
          <span className="mt-3 text-sm font-semibold text-foreground">
            {filename || t("import.chooseFile")}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">{t("import.limit")}</span>
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3">
          <p className="text-sm text-muted-foreground">{t("import.templateHint")}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => downloadTextFile(guestCsvTemplate(), "mau-khach-moi.csv")}
          >
            <FileDown aria-hidden />
            {t("import.downloadTemplate")}
          </Button>
        </div>

        {parseErrors.length > 0 ? (
          <div role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            <p className="font-semibold">{t("import.errors.title")}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {parseErrors.slice(0, 6).map((error) => (
                <li key={error}>{parseErrorLabel(error)}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {rows.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="flex items-center justify-between bg-secondary px-4 py-3">
              <p className="text-sm font-semibold text-secondary-foreground">
                {t("import.preview", { count: rows.length })}
              </p>
              <span className="text-xs text-muted-foreground">{t("import.previewLimit")}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("columns.guest")}</th>
                    <th className="px-4 py-3 font-medium">{t("columns.group")}</th>
                    <th className="px-4 py-3 font-medium">{t("columns.table")}</th>
                    <th className="px-4 py-3 font-medium">{t("fields.maxGuests")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((guest, index) => (
                    <tr key={`${guest.name}-${index}`} className="border-t border-border">
                      <td className="px-4 py-3 font-medium text-foreground">{guest.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{guest.groupName || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{guest.tableName || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{guest.maxGuests}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <ActionError error={actionError} />
        <div className="flex justify-end gap-3 border-t border-border pt-5">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={pending || rows.length === 0 || parseErrors.length > 0}
            onClick={handleImport}
          >
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <FileUp aria-hidden />}
            {pending ? t("import.importing") : t("import.confirm", { count: rows.length })}
          </Button>
        </div>
      </div>
    </ModalFrame>
  );
}

function ShareGuestModal({ slug, guest, onClose }: { slug: string; guest: GuestRow; onClose: () => void }) {
  const t = useTranslations("guestManager");
  const url = guestLink(slug, guest.token);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    trackEvent("share_invitation", { method: "copy_link" });
    setCopied(true);
  }

  async function shareLink() {
    if (!navigator.share) return copyLink();
    try {
      await navigator.share({ title: t("share.invitationTitle"), text: t("share.text", { name: guest.name }), url });
      trackEvent("share_invitation", { method: "native_share" });
    } catch {
      return;
    }
  }

  return (
    <ModalFrame
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("share.title")}
      description={t("share.description", { name: guest.name })}
      maxWidth="max-w-lg"
    >
      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-2">
          <p className="min-w-0 flex-1 truncate px-2 text-sm text-muted-foreground">{url}</p>
          <Button type="button" variant="secondary" onClick={copyLink}>
            <Clipboard aria-hidden />
            {copied ? t("share.copied") : t("share.copy")}
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button type="button" size="lg" onClick={shareLink}>
            <Send aria-hidden />
            {t("share.system")}
          </Button>
          <a
            href={zaloShareUrl(url)}
            target="_blank"
            rel="noopener noreferrer"
            data-ga-event="share_invitation"
            data-ga-param-method="zalo"
            className="inline-flex min-h-9 items-center justify-center rounded-lg bg-[#0068ff] px-3 text-sm font-semibold text-white transition hover:bg-[#0059db] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0068ff] focus-visible:ring-offset-2"
          >
            Zalo
          </a>
          <a
            href={messengerShareUrl(url)}
            target="_blank"
            rel="noopener noreferrer"
            data-ga-event="share_invitation"
            data-ga-param-method="facebook"
            className="inline-flex min-h-9 items-center justify-center rounded-lg bg-[#0866ff] px-3 text-sm font-semibold text-white transition hover:bg-[#0759dc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866ff] focus-visible:ring-offset-2"
          >
            Messenger
          </a>
        </div>
      </div>
    </ModalFrame>
  );
}

function QrDialog({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  const t = useTranslations("guestManager");
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    QRCode.toDataURL(url, { width: 640, margin: 2 }).then(setDataUrl).catch(() => setDataUrl(""));
  }, [url]);

  return (
    <ModalFrame
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("qr.title")}
      description={t("qr.description", { name })}
      maxWidth="max-w-sm"
    >
      <div className="mt-5 text-center">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt={t("qr.alt", { name })} className="mx-auto size-64 rounded-2xl" />
        ) : (
          <div className="mx-auto grid size-64 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <Loader2 className="size-7 animate-spin" aria-hidden />
          </div>
        )}
        <div className="mt-5 flex justify-center gap-3">
          {dataUrl ? (
            <a
              href={dataUrl}
              download={`qr-${name}.png`}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Download className="size-4" aria-hidden />
              {t("qr.download")}
            </a>
          ) : null}
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            {t("actions.close")}
          </Button>
        </div>
      </div>
    </ModalFrame>
  );
}

function DeleteConfirmModal({
  count,
  pending,
  onConfirm,
  onClose,
}: {
  count: number;
  pending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("guestManager");
  return (
    <ModalFrame
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("delete.title")}
      description={t("delete.description", { count })}
      maxWidth="max-w-md"
    >
      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="outline" size="lg" onClick={onClose}>
          {t("actions.cancel")}
        </Button>
        <Button type="button" variant="destructive" size="lg" disabled={pending} onClick={onConfirm}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />}
          {pending ? t("actions.deleting") : t("actions.delete")}
        </Button>
      </div>
    </ModalFrame>
  );
}

function GuestIdentity({ guest }: { guest: GuestRow }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-semibold text-foreground">{guest.name}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {[guest.role, guest.side].filter(Boolean).join(" - ") || "-"}
      </p>
      {guest.phone || guest.email ? (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {guest.phone ? (
            <span className="inline-flex items-center gap-1"><Phone className="size-3" aria-hidden />{guest.phone}</span>
          ) : null}
          {guest.email ? (
            <span className="inline-flex items-center gap-1"><Mail className="size-3" aria-hidden />{guest.email}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function RsvpStatus({ guest }: { guest: GuestRow }) {
  const t = useTranslations("guestManager");
  if (!guest.latestRsvp) {
    return <span className="text-sm text-muted-foreground">{t("status.pending")}</span>;
  }
  return guest.latestRsvp.attending ? (
    <div>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
        <CheckCircle2 className="size-4" aria-hidden />
        {t("status.attending")}
      </span>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("status.guestCount", { count: guest.latestRsvp.guests })}
      </p>
    </div>
  ) : (
    <span className="text-sm font-medium text-destructive">{t("status.declined")}</span>
  );
}

export function GuestManager({ invitationId, slug, guests: serverGuests, accessToken = null }: Props) {
  const t = useTranslations("guestManager");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sideFilter, setSideFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [responseFilter, setResponseFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestRow | null>(null);
  const [sharingGuest, setSharingGuest] = useState<GuestRow | null>(null);
  const [qrGuest, setQrGuest] = useState<GuestRow | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [guestOverrides, setGuestOverrides] = useState<Record<string, GuestRow>>({});
  const [deleting, startDelete] = useTransition();

  const guests = useMemo(
    () => serverGuests.map((guest) => guestOverrides[guest.id] ?? guest),
    [guestOverrides, serverGuests],
  );

  const groups = useMemo(
    () => Array.from(new Set(guests.map((guest) => guest.groupName).filter(Boolean))).sort(),
    [guests],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    return guests.filter((guest) => {
      const searchable = [guest.name, guest.role, guest.phone, guest.email, guest.groupName, guest.tableName]
        .join(" ")
        .toLocaleLowerCase("vi");
      if (query && !searchable.includes(query)) return false;
      if (sideFilter && guest.side !== sideFilter) return false;
      if (groupFilter && guest.groupName !== groupFilter) return false;
      if (responseFilter === "attending" && !guest.latestRsvp?.attending) return false;
      if (responseFilter === "declined" && guest.latestRsvp?.attending !== false) return false;
      if (responseFilter === "pending" && guest.responded) return false;
      return true;
    });
  }, [groupFilter, guests, responseFilter, search, sideFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((guest) => selectedIds.has(guest.id));

  function toggleAllFiltered() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allFilteredSelected) filtered.forEach((guest) => next.delete(guest.id));
      else filtered.forEach((guest) => next.add(guest.id));
      return next;
    });
  }

  function toggleGuest(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function confirmDelete() {
    startDelete(async () => {
      const result = await deleteGuests(invitationId, accessToken, deleteIds);
      if (!result?.error) {
        setSelectedIds((current) => {
          const next = new Set(current);
          deleteIds.forEach((id) => next.delete(id));
          return next;
        });
        setDeleteIds([]);
        router.refresh();
      }
    });
  }

  function exportGuests() {
    downloadTextFile(guestsToCsv(guests), `danh-sach-khach-moi-${invitationId}.csv`);
  }

  if (!slug) {
    return (
      <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
        <p className="font-semibold text-amber-800">{t("unpublished.title")}</p>
        <p className="mt-1 text-sm leading-6 text-amber-700">{t("unpublished.description")}</p>
      </div>
    );
  }

  return (
    <div className="mt-7 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">{t("listTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("count", { shown: filtered.length, total: guests.length })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="lg" onClick={exportGuests} disabled={guests.length === 0}>
            <Download aria-hidden />
            {t("actions.export")}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => setImportOpen(true)}>
            <FileUp aria-hidden />
            {t("actions.import")}
          </Button>
          <Button type="button" size="lg" onClick={() => setAddOpen(true)}>
            <Plus aria-hidden />
            {t("actions.add")}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="relative md:col-span-2 xl:col-span-1">
          <span className="sr-only">{t("filters.search")}</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("filters.search")}
            className={`${FIELD_CLASS} pl-10`}
          />
        </label>
        <select value={sideFilter} onChange={(event) => setSideFilter(event.target.value)} className={FIELD_CLASS} aria-label={t("filters.side")}>
          <option value="">{t("filters.allSides")}</option>
          <option value="Nhà trai">{t("sides.groom")}</option>
          <option value="Nhà gái">{t("sides.bride")}</option>
        </select>
        <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)} className={FIELD_CLASS} aria-label={t("filters.group")}>
          <option value="">{t("filters.allGroups")}</option>
          {groups.map((group) => <option key={group} value={group}>{group}</option>)}
        </select>
        <select value={responseFilter} onChange={(event) => setResponseFilter(event.target.value)} className={FIELD_CLASS} aria-label={t("filters.response")}>
          <option value="">{t("filters.allResponses")}</option>
          <option value="attending">{t("status.attending")}</option>
          <option value="declined">{t("status.declined")}</option>
          <option value="pending">{t("status.pending")}</option>
        </select>
      </div>

      {selectedIds.size > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/[0.05] px-4 py-3">
          <p className="text-sm font-medium text-foreground">{t("selection.count", { count: selectedIds.size })}</p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setSelectedIds(new Set())}>{t("selection.clear")}</Button>
            <Button type="button" variant="destructive" onClick={() => setDeleteIds([...selectedIds])}>
              <Trash2 aria-hidden />{t("selection.delete")}
            </Button>
          </div>
        </div>
      ) : null}

      {guests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Users className="size-7" aria-hidden /></span>
          <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">{t("empty.title")}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{t("empty.description")}</p>
          <Button type="button" size="lg" className="mt-5" onClick={() => setAddOpen(true)}><Plus aria-hidden />{t("actions.add")}</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">{t("empty.filtered")}</div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary text-secondary-foreground">
                <tr>
                  <th className="w-12 px-4 py-3.5">
                    <input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} aria-label={t("selection.all")} className="size-4 rounded border-border accent-primary" />
                  </th>
                  <th className="px-3 py-3.5 font-medium">{t("columns.guest")}</th>
                  <th className="px-3 py-3.5 font-medium">{t("columns.group")}</th>
                  <th className="px-3 py-3.5 font-medium">{t("columns.rsvp")}</th>
                  <th className="px-3 py-3.5 font-medium">{t("columns.private")}</th>
                  <th className="px-4 py-3.5 text-right font-medium">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((guest) => (
                  <tr key={guest.id} className="border-t border-border transition hover:bg-muted/50">
                    <td className="px-4 py-4 align-top"><input type="checkbox" checked={selectedIds.has(guest.id)} onChange={() => toggleGuest(guest.id)} aria-label={t("selection.guest", { name: guest.name })} className="size-4 rounded border-border accent-primary" /></td>
                    <td className="max-w-60 px-3 py-4 align-top"><GuestIdentity guest={guest} /></td>
                    <td className="px-3 py-4 align-top">
                      <p className="text-foreground">{guest.groupName || "-"}</p>
                      {guest.tableName ? <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" aria-hidden />{guest.tableName}</p> : null}
                    </td>
                    <td className="px-3 py-4 align-top"><RsvpStatus guest={guest} /></td>
                    <td className="px-3 py-4 align-top">
                      <p className="text-sm text-foreground">{t("status.maxGuests", { count: guest.maxGuests })}</p>
                      {guest.giftAmount !== null ? <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><Gift className="size-3" aria-hidden />{formatCurrency(guest.giftAmount)}</p> : null}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon" aria-label={t("actions.shareGuest", { name: guest.name })} onClick={() => setSharingGuest(guest)}><Link2 aria-hidden /></Button>
                        <Button type="button" variant="ghost" size="icon" aria-label={t("actions.qrGuest", { name: guest.name })} onClick={() => setQrGuest(guest)}><QrCode aria-hidden /></Button>
                        <Button type="button" variant="ghost" size="icon" aria-label={t("actions.editGuest", { name: guest.name })} onClick={() => setEditingGuest(guest)}><Pencil aria-hidden /></Button>
                        <Button type="button" variant="destructive" size="icon" aria-label={t("actions.deleteGuest", { name: guest.name })} onClick={() => setDeleteIds([guest.id])}><Trash2 aria-hidden /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 lg:hidden">
            {filtered.map((guest) => (
              <article key={guest.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={selectedIds.has(guest.id)} onChange={() => toggleGuest(guest.id)} aria-label={t("selection.guest", { name: guest.name })} className="mt-1 size-4 rounded border-border accent-primary" />
                  <div className="min-w-0 flex-1"><GuestIdentity guest={guest} /></div>
                  <RsvpStatus guest={guest} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">{t("columns.group")}</p><p className="mt-1 text-foreground">{guest.groupName || "-"}</p></div>
                  <div><p className="text-xs text-muted-foreground">{t("columns.table")}</p><p className="mt-1 text-foreground">{guest.tableName || "-"}</p></div>
                </div>
                <div className="mt-3 flex flex-wrap justify-end gap-1 border-t border-border pt-3">
                  <Button type="button" variant="ghost" onClick={() => setSharingGuest(guest)}><Link2 aria-hidden />{t("actions.share")}</Button>
                  <Button type="button" variant="ghost" onClick={() => setQrGuest(guest)}><QrCode aria-hidden />QR</Button>
                  <Button type="button" variant="ghost" onClick={() => setEditingGuest(guest)}><Pencil aria-hidden />{t("actions.edit")}</Button>
                  <Button type="button" variant="destructive" onClick={() => setDeleteIds([guest.id])}><Trash2 aria-hidden />{t("actions.delete")}</Button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {addOpen ? <AddGuestModal invitationId={invitationId} accessToken={accessToken} onClose={() => setAddOpen(false)} /> : null}
      {importOpen ? <ImportGuestsModal invitationId={invitationId} accessToken={accessToken} onClose={() => setImportOpen(false)} /> : null}
      {editingGuest ? (
        <EditGuestModal
          invitationId={invitationId}
          accessToken={accessToken}
          guest={editingGuest}
          onSaved={(guest) => setGuestOverrides((current) => ({ ...current, [guest.id]: guest }))}
          onClose={() => setEditingGuest(null)}
        />
      ) : null}
      {sharingGuest ? <ShareGuestModal slug={slug} guest={sharingGuest} onClose={() => setSharingGuest(null)} /> : null}
      {qrGuest ? <QrDialog url={guestLink(slug, qrGuest.token)} name={qrGuest.name} onClose={() => setQrGuest(null)} /> : null}
      {deleteIds.length > 0 ? <DeleteConfirmModal count={deleteIds.length} pending={deleting} onConfirm={confirmDelete} onClose={() => setDeleteIds([])} /> : null}
    </div>
  );
}
