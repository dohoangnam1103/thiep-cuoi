"use client";

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
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={restore}
        disabled={pending}
        className="text-sm font-bold text-primary hover:underline disabled:opacity-50"
      >
        Khôi phục
      </button>
      <button
        type="button"
        onClick={permanentlyDelete}
        disabled={pending}
        className="text-sm font-bold text-destructive hover:underline disabled:opacity-50"
      >
        Xoá vĩnh viễn
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={moveToTrash}
      disabled={pending}
      className="text-sm font-bold text-destructive hover:underline disabled:opacity-50"
    >
      Thùng rác
    </button>
  );
}
