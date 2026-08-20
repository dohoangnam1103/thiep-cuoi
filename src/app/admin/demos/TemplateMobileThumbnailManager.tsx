"use client";

import { ImageUp, LoaderCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { EDITOR_IMAGE_ACCEPT } from "@/lib/upload-image-formats";
import { templatePreviewUrl } from "@/lib/template-preview-url";

import {
  clearTemplateMobileThumbnail,
  saveTemplateMobileThumbnail,
  type TemplateMobileThumbnailState,
} from "./actions";

type MobileThumbnailTemplate = {
  slug: string;
  name: string;
  listing: string;
};

type UploadResponse = {
  url?: string;
  error?: string;
};

type ErrorCode = Extract<TemplateMobileThumbnailState, { ok: false }>["errorCode"]
  | "upload"
  | "sourceTooLarge"
  | "outputTooLarge";

async function uploadMobileThumbnail(file: File): Promise<string> {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  const result = await response.json() as UploadResponse;
  if (!response.ok || !result.url) {
    throw new Error(result.error || "upload");
  }

  return result.url;
}

function errorCodeFrom(error: unknown): ErrorCode {
  if (!(error instanceof Error)) return "upload";
  if (error.message === "sourceTooLarge") return "sourceTooLarge";
  if (error.message === "outputTooLarge") return "outputTooLarge";
  return "upload";
}

export function TemplateMobileThumbnailManager({
  templates,
  initialThumbnailUrls,
}: {
  templates: MobileThumbnailTemplate[];
  initialThumbnailUrls: Record<string, string>;
}) {
  const t = useTranslations("adminDemos");

  return (
    <section aria-labelledby="mobile-thumbnail-title" className="space-y-5">
      <div>
        <h2 id="mobile-thumbnail-title" className="font-heading text-2xl text-foreground">
          {t("mobileTitle")}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {t("mobileDescription")}
        </p>
        <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">{t("mobileHelp")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <TemplateMobileThumbnailCard
            key={template.slug}
            template={template}
            initialUrl={initialThumbnailUrls[template.slug]}
          />
        ))}
      </div>
    </section>
  );
}

function TemplateMobileThumbnailCard({
  template,
  initialUrl,
}: {
  template: MobileThumbnailTemplate;
  initialUrl: string | undefined;
}) {
  const t = useTranslations("adminDemos");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [success, setSuccess] = useState<"saved" | "removed" | null>(null);
  const busy = uploading || saving;

  async function handleFile(file: File | undefined) {
    if (!file || busy) return;

    setErrorCode(null);
    setSuccess(null);
    setUploading(true);
    try {
      const imageUrl = await uploadMobileThumbnail(file);
      setSaving(true);
      const result = await saveTemplateMobileThumbnail({
        templateId: template.slug,
        imageUrl,
      });
      if (!result.ok) {
        setErrorCode(result.errorCode);
        return;
      }

      setUrl(result.imageUrl);
      setSuccess("saved");
    } catch (error) {
      setErrorCode(errorCodeFrom(error));
    } finally {
      setUploading(false);
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!url || busy) return;

    setErrorCode(null);
    setSuccess(null);
    setSaving(true);
    try {
      const result = await clearTemplateMobileThumbnail({ templateId: template.slug });
      if (!result.ok) {
        setErrorCode(result.errorCode);
        return;
      }

      setUrl(undefined);
      setSuccess("removed");
    } catch {
      setErrorCode("saveFailed");
    } finally {
      setSaving(false);
    }
  }

  const previewUrl = url ?? templatePreviewUrl(template.listing);
  const previewAlt = url
    ? t("customPreviewAlt", { name: template.name })
    : t("fallbackPreviewAlt", { name: template.name });

  return (
    <article
      data-template-mobile-thumbnail={template.slug}
      className="overflow-hidden rounded-2xl border border-border bg-background"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <Image
          src={previewUrl}
          alt={previewAlt}
          fill
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
          className="object-cover object-top"
        />
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-bold text-foreground shadow-sm backdrop-blur">
          {url ? t("custom") : t("fallback")}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-semibold text-foreground">{template.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{template.slug}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <label
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
          >
            {busy ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : <ImageUp className="size-3.5" aria-hidden />}
            {uploading ? t("uploading") : saving ? t("saving") : url ? t("replace") : t("upload")}
            <input
              ref={fileInputRef}
              data-testid={`mobile-thumbnail-upload-${template.slug}`}
              type="file"
              accept={EDITOR_IMAGE_ACCEPT}
              disabled={busy}
              className="sr-only"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
          </label>
          {url ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleRemove()}
              className="inline-flex items-center gap-2 rounded-full border border-destructive/30 px-3 py-2 text-xs font-bold text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="size-3.5" aria-hidden />
              {t("remove")}
            </button>
          ) : null}
        </div>

        {errorCode ? <p role="alert" className="text-xs font-medium text-destructive">{t(`errors.${errorCode}`)}</p> : null}
        {success ? <p role="status" className="text-xs font-medium text-emerald-700">{t(success)}</p> : null}
      </div>
    </article>
  );
}
