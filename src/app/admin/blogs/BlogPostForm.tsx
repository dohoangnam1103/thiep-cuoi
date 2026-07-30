"use client";

import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useActionState,
  useRef,
  useState,
} from "react";

import { slugifyBlogTitle } from "@/lib/blog-slug";
import { EDITOR_IMAGE_ACCEPT } from "@/lib/upload-image-formats";
import { cn } from "@/lib/utils";

import { saveBlogPost } from "./actions";
import { BlogEditor } from "./BlogEditor";

export type BlogPostFormValues = {
  title: string;
  excerpt: string;
  category: string;
  contentHtml: string;
  thumbnailUrl: string;
  status: "draft" | "published";
};

type BlogPostFormProps = {
  id: string | null;
  initialValues: BlogPostFormValues;
};

type UploadResponse = {
  url?: string;
  error?: string;
};

const inputClassName =
  "mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20";

async function uploadThumbnail(file: File): Promise<string> {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("purpose", "thumbnail");

  const response = await fetch("/api/admin/blog-media", {
    method: "POST",
    body: formData,
  });
  const result = await response.json() as UploadResponse;
  if (!response.ok || !result.url) {
    throw new Error(result.error || "Không thể upload ảnh");
  }
  return result.url;
}

function FieldError({ children }: { children?: string }) {
  return children ? (
    <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">{children}</p>
  ) : null;
}

export function BlogPostForm({
  id,
  initialValues,
}: BlogPostFormProps) {
  const boundAction = saveBlogPost.bind(null, id);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initialValues.title);
  const [contentHtml, setContentHtml] = useState(initialValues.contentHtml);
  const [thumbnailUrl, setThumbnailUrl] = useState(initialValues.thumbnailUrl);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailError, setThumbnailError] = useState<string>();

  async function handleThumbnail(file: File | undefined) {
    if (!file) return;
    setUploadingThumbnail(true);
    setThumbnailError(undefined);
    try {
      setThumbnailUrl(await uploadThumbnail(file));
    } catch (uploadFailure) {
      setThumbnailError(
        uploadFailure instanceof Error
          ? uploadFailure.message
          : "Không thể upload ảnh",
      );
    } finally {
      setUploadingThumbnail(false);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error ? (
        <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-background p-5 sm:p-6">
        <div className="grid gap-6">
          <label className="block text-sm font-bold text-foreground">
            Tiêu đề <span className="text-destructive">*</span>
            <input
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={180}
              className={cn(inputClassName, state?.fieldErrors?.title && "border-destructive")}
              placeholder="Ví dụ: 7 cách chọn ngày cưới phù hợp"
            />
            <FieldError>{state?.fieldErrors?.title}</FieldError>
          </label>

          <div>
            <p className="text-sm font-bold text-foreground">Slug xem trước</p>
            <p className="mt-2 rounded-xl border border-border bg-muted/40 px-4 py-3 font-mono text-xs text-muted-foreground">
              /blog/{slugifyBlogTitle(title)}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Slug được tạo lại từ tiêu đề khi lưu và tự thêm hậu tố nếu bị trùng.
            </p>
          </div>

          <label className="block text-sm font-bold text-foreground">
            Mô tả ngắn <span className="text-destructive">*</span>
            <textarea
              name="excerpt"
              defaultValue={initialValues.excerpt}
              required
              maxLength={500}
              rows={4}
              className={cn(inputClassName, "resize-y", state?.fieldErrors?.excerpt && "border-destructive")}
              placeholder="Tóm tắt nội dung để hiển thị trên danh sách và công cụ tìm kiếm."
            />
            <FieldError>{state?.fieldErrors?.excerpt}</FieldError>
          </label>

          <label className="block text-sm font-bold text-foreground">
            Chuyên mục
            <input
              name="category"
              defaultValue={initialValues.category}
              maxLength={80}
              className={cn(inputClassName, state?.fieldErrors?.category && "border-destructive")}
              placeholder="Ví dụ: Kinh nghiệm cưới"
            />
            <FieldError>{state?.fieldErrors?.category}</FieldError>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">Ảnh đại diện</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Không bắt buộc. Ảnh được chuyển sang WebP, tối đa 1600 × 900 px.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => thumbnailInputRef.current?.click()}
              disabled={uploadingThumbnail}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-bold text-foreground transition hover:bg-muted disabled:opacity-50"
            >
              {uploadingThumbnail
                ? <LoaderCircle className="size-4 animate-spin" />
                : <ImagePlus className="size-4" />}
              {uploadingThumbnail ? "Đang xử lý…" : "Chọn ảnh"}
            </button>
            {thumbnailUrl ? (
              <button
                type="button"
                onClick={() => setThumbnailUrl("")}
                className="inline-flex items-center gap-2 rounded-full border border-destructive/30 px-4 py-2 text-sm font-bold text-destructive transition hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
                Bỏ ảnh
              </button>
            ) : null}
          </div>
        </div>

        <input
          ref={thumbnailInputRef}
          type="file"
          accept={EDITOR_IMAGE_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => void handleThumbnail(event.target.files?.[0])}
        />
        <input type="hidden" name="thumbnailUrl" value={thumbnailUrl} />

        {thumbnailUrl ? (
          <div className="relative mt-4 aspect-video max-w-2xl overflow-hidden rounded-2xl bg-muted">
            <Image src={thumbnailUrl} alt="Xem trước ảnh đại diện" fill sizes="(max-width: 768px) 100vw, 672px" className="object-cover" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => thumbnailInputRef.current?.click()}
            className="mt-4 flex aspect-video w-full max-w-2xl flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
          >
            <ImagePlus className="size-8" />
            Chọn ảnh đại diện
          </button>
        )}
        <FieldError>{thumbnailError ?? state?.fieldErrors?.thumbnailUrl}</FieldError>
      </div>

      <div className="rounded-2xl border border-border bg-background p-5 sm:p-6">
        <div className="mb-3">
          <h2 className="text-sm font-bold text-foreground">
            Nội dung <span className="text-destructive">*</span>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Có thể chèn ảnh, liên kết, YouTube hoặc video HTTPS định dạng MP4.
          </p>
        </div>
        <input type="hidden" name="contentHtml" value={contentHtml} />
        <BlogEditor initialContent={initialValues.contentHtml} error={state?.fieldErrors?.contentHtml} onChange={setContentHtml} />
        <FieldError>{state?.fieldErrors?.contentHtml}</FieldError>
      </div>

      <div className="rounded-2xl border border-border bg-background p-5 sm:p-6">
        <label className="block text-sm font-bold text-foreground">
          Trạng thái
          <select
            name="status"
            defaultValue={initialValues.status}
            className={cn(inputClassName, state?.fieldErrors?.status && "border-destructive")}
          >
            <option value="draft">Bản nháp</option>
            <option value="published">Đã xuất bản</option>
          </select>
          <FieldError>{state?.fieldErrors?.status}</FieldError>
        </label>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Link href="/admin/blogs" className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-bold text-foreground transition hover:bg-muted">
          Huỷ
        </Link>
        <button
          type="submit"
          disabled={pending || uploadingThumbnail}
          className="inline-flex min-w-36 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {pending ? "Đang lưu…" : "Lưu bài viết"}
        </button>
      </div>
    </form>
  );
}
