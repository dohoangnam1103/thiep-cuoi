"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Film, ImagePlus, Images, Loader2, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";

import { useLiveForms, type PublicMediaLabels } from "@/components/chungdoi-live-forms";
import { useGuestMediaGallery } from "@/components/public-guest-moments";
import type { GuestMediaApiPayload } from "@/lib/public-guest-media";
import { GUEST_IMAGE_ACCEPT } from "@/lib/upload-image-formats";

function errorMessage(error: string | undefined, labels: PublicMediaLabels): string {
  if (error === "invalidName") return labels.errorInvalidName;
  if (error === "tooManyFiles") return labels.errorTooManyFiles;
  if (error === "imageTooLarge") return labels.errorImageTooLarge;
  if (error === "videoTooLarge" || error === "requestTooLarge") return labels.errorVideoTooLarge;
  if (error === "unsupportedType" || error === "invalidFile") return labels.errorUnsupported;
  if (error === "galleryFull") return labels.errorGalleryFull;
  return labels.errorGeneric;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function PublicGuestMediaDialog() {
  const live = useLiveForms();
  const {
    loadError,
    media,
    prependMedia,
    refresh,
    uploadOpen: open,
    setUploadOpen: setOpen,
  } = useGuestMediaGallery();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  if (!live) return null;
  const label = live.mediaLabels;
  const slug = live.slug;

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []).slice(0, 6));
    setError("");
    setSuccess(false);
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (files.length === 0) {
      inputRef.current?.click();
      return;
    }

    const form = new FormData(event.currentTarget);
    form.delete("files");
    files.forEach((file) => form.append("files", file));
    setUploading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(slug)}/contributions`, {
        method: "POST",
        body: form,
      });
      const payload = await response.json() as GuestMediaApiPayload;
      if (!response.ok || !payload.media) {
        setError(errorMessage(payload.error, label));
        return;
      }
      prependMedia(payload.media);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      setSuccess(true);
    } catch {
      setError(label.errorGeneric);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {media.length === 0 ? (
        <Dialog.Trigger className="fixed bottom-20 left-4 z-40 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-neutral-900 shadow-lg shadow-black/20 ring-1 ring-black/10 transition hover:-translate-y-0.5 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 sm:left-6">
          <Images className="size-4" aria-hidden />
          {label.uploadCta}
        </Dialog.Trigger>
      ) : null}

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[130] bg-black/65 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-[130] flex items-end justify-center overflow-y-auto sm:items-center sm:p-4">
          <Dialog.Popup className="max-h-[96dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-[#f8f7f4] text-neutral-900 shadow-2xl outline-none transition data-[ending-style]:translate-y-4 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-4 data-[starting-style]:opacity-0 sm:rounded-3xl">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-neutral-200 bg-[#f8f7f4]/95 px-5 py-5 backdrop-blur sm:px-7">
              <div>
                <Dialog.Title className="text-2xl font-bold tracking-tight">{label.title}</Dialog.Title>
                <Dialog.Description className="mt-1.5 max-w-2xl text-sm leading-6 text-neutral-600">
                  {label.description}
                </Dialog.Description>
              </div>
              <Dialog.Close aria-label={label.close} className="grid size-10 shrink-0 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
                <X className="size-5" aria-hidden />
              </Dialog.Close>
            </header>

            <div className="p-5 sm:p-7">
              <form onSubmit={submit} className="mx-auto h-fit max-w-lg rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <ImagePlus className="size-5" aria-hidden />
                  <h3 className="font-semibold">{label.chooseFiles}</h3>
                </div>
                <label className="mt-4 grid gap-2 text-sm font-medium">
                  {label.contributorName}
                  <input
                    name="contributorName"
                    required
                    maxLength={80}
                    defaultValue={live.guest?.name ?? ""}
                    placeholder={label.contributorPlaceholder}
                    className="min-h-11 rounded-xl border border-neutral-300 px-3.5 outline-none transition placeholder:text-neutral-400 focus:border-neutral-700 focus:ring-2 focus:ring-neutral-900/10"
                  />
                </label>

                <input
                  ref={inputRef}
                  type="file"
                  name="files"
                  multiple
                  accept={`${GUEST_IMAGE_ACCEPT},video/mp4,video/quicktime,video/webm`}
                  onChange={selectFiles}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="mt-4 flex min-h-28 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 text-center transition hover:border-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                >
                  <Upload className="size-6" aria-hidden />
                  <span className="mt-2 text-sm font-semibold">{label.chooseFiles}</span>
                  <span className="mt-1 text-xs leading-5 text-neutral-500">{label.fileHint}</span>
                </button>

                {files.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label.selected}</p>
                    {files.map((file, index) => (
                      <div key={`${file.name}-${file.lastModified}`} className="flex items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2">
                        {file.type.startsWith("video/") ? <Film className="size-4 shrink-0" aria-hidden /> : <Images className="size-4 shrink-0" aria-hidden />}
                        <span className="min-w-0 flex-1 truncate text-xs">{file.name}</span>
                        <span className="text-[11px] text-neutral-500">{formatSize(file.size)}</span>
                        <button type="button" onClick={() => removeFile(index)} aria-label={`${label.remove}: ${file.name}`} className="grid size-8 shrink-0 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-200 hover:text-red-600">
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {error || loadError ? <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error || loadError}</p> : null}
                {success ? <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{label.success}</p> : null}
                <button type="submit" disabled={uploading} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
                  {uploading ? label.uploading : label.upload}
                </button>
              </form>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
