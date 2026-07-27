"use client";

import { useState, useTransition } from "react";

import { TEMPLATE_LABEL_MAX_LENGTH } from "@/app/editor/[id]/templates";
import { renameTemplate } from "./actions";

export function TemplateNameForm({
  templateId,
  name,
  defaultName,
  isRenamed,
}: {
  templateId: string;
  name: string;
  defaultName: string;
  isRenamed: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await renameTemplate(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">{name}</span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-primary hover:underline"
          >
            Đổi tên
          </button>
        </div>
        <span className="text-xs text-muted-foreground">
          {templateId}
          {isRenamed ? ` · mặc định: ${defaultName}` : null}
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input type="hidden" name="templateId" value={templateId} />
      <label htmlFor={`template-name-${templateId}`} className="sr-only">
        Tên mẫu thiệp {templateId}
      </label>
      <input
        id={`template-name-${templateId}`}
        name="name"
        defaultValue={name}
        maxLength={TEMPLATE_LABEL_MAX_LENGTH}
        placeholder={defaultName}
        className="w-48 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "Đang lưu..." : "Lưu"}
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setEditing(false);
          }}
          className="text-xs text-muted-foreground hover:underline"
        >
          Hủy
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Để trống để dùng lại tên mặc định “{defaultName}”.
      </p>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </form>
  );
}
