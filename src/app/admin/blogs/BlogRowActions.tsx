"use client";

import { LoaderCircle, RotateCcw, Trash2 } from "lucide-react";
import { useTransition } from "react";

import {
  moveBlogPostToTrash,
  permanentlyDeleteBlogPost,
  restoreBlogPost,
} from "./actions";

type BlogRowActionsProps = {
  id: string;
  title: string;
  trashed: boolean;
};

export function BlogRowActions({ id, title, trashed }: BlogRowActionsProps) {
  const [pending, startTransition] = useTransition();

  function moveToTrash() {
    if (!window.confirm(`Chuyển “${title}” vào thùng rác?`)) return;
    startTransition(async () => {
      await moveBlogPostToTrash(id);
    });
  }

  function restore() {
    startTransition(async () => {
      await restoreBlogPost(id);
    });
  }

  function permanentlyDelete() {
    const confirmation = window.prompt(
      `Nhập chính xác tên bài viết để xoá vĩnh viễn:\n${title}`,
    );
    if (confirmation !== title) return;
    startTransition(async () => {
      await permanentlyDeleteBlogPost(id, confirmation);
    });
  }

  return trashed ? (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={restore}
        disabled={pending}
        aria-label={`Khôi phục bài viết ${title}`}
        title="Khôi phục"
        className="inline-flex size-9 items-center justify-center rounded-full border border-primary/20 text-primary transition hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <LoaderCircle className="size-[18px] animate-spin" aria-hidden="true" />
        ) : (
          <RotateCcw className="size-[18px]" aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        onClick={permanentlyDelete}
        disabled={pending}
        aria-label={`Xoá vĩnh viễn bài viết ${title}`}
        title="Xoá vĩnh viễn"
        className="inline-flex size-9 items-center justify-center rounded-full border border-destructive/20 text-destructive transition hover:border-destructive/40 hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 className="size-[18px]" aria-hidden="true" />
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={moveToTrash}
      disabled={pending}
      aria-label={`Chuyển bài viết ${title} vào thùng rác`}
      title="Chuyển vào thùng rác"
      className="inline-flex size-9 items-center justify-center rounded-full border border-destructive/20 text-destructive transition hover:border-destructive/40 hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? (
        <LoaderCircle className="size-[18px] animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 className="size-[18px]" aria-hidden="true" />
      )}
    </button>
  );
}
