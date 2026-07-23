"use client";

import { Check, ImagePlus, Lightbulb, Send, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { type DragEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type SessionResponse = {
  loggedIn: boolean;
  email: string | null;
};

export function TemplateSuggestionCta() {
  const t = useTranslations("listing.suggestion");
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [notifyWhenAvailable, setNotifyWhenAvailable] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    textareaRef.current?.focus();

    fetch("/api/auth/session", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() as Promise<SessionResponse> : null))
      .then((session) => {
        if (!session) return;
        setEmail(session.email);
        setNotifyWhenAvailable(Boolean(session.email));
      })
      .catch(() => undefined);

    return () => {
      controller.abort();
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, pending]);

  function closeModal() {
    if (pending) return;
    setOpen(false);
    setDescription("");
    setFile(null);
    setError(null);
  }

  function selectFile(nextFile: File | null) {
    if (!nextFile) return;
    if (!ALLOWED_IMAGE_TYPES.has(nextFile.type)) {
      setError(t("invalidImage"));
      return;
    }
    if (nextFile.size > MAX_IMAGE_BYTES) {
      setError(t("imageTooLarge"));
      return;
    }
    setFile(nextFile);
    setError(null);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    selectFile(event.dataTransfer.files[0] ?? null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanDescription = description.trim();

    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("description", cleanDescription);
    formData.set("notifyWhenAvailable", String(notifyWhenAvailable));
    if (file) formData.set("referenceImage", file);

    try {
      const response = await fetch("/api/template-suggestions", { method: "POST", body: formData });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        if (result.error === "imageTooLarge" || result.error === "requestTooLarge") {
          setError(t("imageTooLarge"));
        } else if (result.error === "unsupportedImage") {
          setError(t("invalidImage"));
        } else if (result.error === "invalidDescription") {
          setError(t("invalidDescription"));
        } else {
          setError(t("submitError"));
        }
        return;
      }

      toast.success(t("success"));
      setOpen(false);
      setDescription("");
      setFile(null);
    } catch {
      setError(t("submitError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="mt-8 rounded-[2rem] border border-border bg-card px-5 py-9 text-center shadow-sm sm:px-8">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lightbulb className="size-7" />
        </span>
        <h2 className="mt-4 font-heading text-2xl font-black text-foreground sm:text-3xl">{t("title")}</h2>
        <p className="mx-auto mt-3 max-w-2xl leading-7 text-muted-foreground">{t("description")}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary/90"
        >
          <Send className="size-5" />
          {t("button")}
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/70 p-2 backdrop-blur-sm sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-suggestion-title"
            className="max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-border bg-card p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Lightbulb className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="template-suggestion-title" className="font-heading text-2xl font-black text-foreground">
                  {t("modalTitle")}
                </h2>
                <p className="mt-0.5 text-sm leading-5 text-muted-foreground sm:text-base sm:leading-6">
                  {t("modalDescription")}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={pending}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label={t("cancel")}
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <p className="mb-2 text-sm font-bold text-foreground">{t("referenceImage")}</p>
                <input
                  id="template-suggestion-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
                />
                {previewUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-border bg-muted/40">
                    <div className="relative h-28 sm:h-32">
                      <Image src={previewUrl} alt={t("referenceImage")} fill unoptimized className="object-contain" />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2">
                      <p className="min-w-0 truncate text-sm text-muted-foreground">{file?.name}</p>
                      <div className="flex gap-3 text-sm font-bold">
                        <label htmlFor="template-suggestion-image" className="cursor-pointer text-primary hover:underline">
                          {t("changeImage")}
                        </label>
                        <button type="button" onClick={() => setFile(null)} className="text-destructive hover:underline">
                          {t("removeImage")}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="template-suggestion-image"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-4 text-left transition hover:border-primary/50 hover:bg-primary/5"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-primary shadow-sm">
                      <ImagePlus className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-foreground">{t("uploadTitle")}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{t("uploadHint")}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{t("uploadHelp")}</span>
                    </span>
                  </label>
                )}
              </div>

              <div>
                <label htmlFor="template-suggestion-description" className="mb-2 block text-sm font-bold text-foreground">
                  {t("ideaLabel")}
                </label>
                <div className="rounded-2xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                  <textarea
                    ref={textareaRef}
                    id="template-suggestion-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={800}
                    required
                    rows={4}
                    placeholder={t("ideaPlaceholder")}
                    className="block w-full resize-none rounded-2xl bg-transparent px-4 pb-1 pt-3 leading-6 text-foreground outline-none placeholder:text-muted-foreground/70"
                  />
                  <p className="px-4 pb-2 text-right text-xs font-medium text-muted-foreground">{description.length}/800</p>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-muted/50 p-3">
                <input
                  type="checkbox"
                  checked={notifyWhenAvailable}
                  disabled={!email}
                  onChange={(event) => setNotifyWhenAvailable(event.target.checked)}
                  className="peer sr-only"
                />
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-border bg-background text-transparent peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-disabled:opacity-50">
                  <Check className="size-4" />
                </span>
                <span>
                  <span className="block font-bold text-foreground">{t("notifyTitle")}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {email ? t("notifyEmail", { email }) : t("noEmail")}
                  </span>
                </span>
              </label>

              {error ? <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={pending}
                  className="flex-1 rounded-full border border-border px-5 py-2.5 font-bold text-foreground transition hover:bg-muted disabled:opacity-50"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex flex-[1.25] items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="size-5" />
                  {pending ? t("submitting") : t("submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
