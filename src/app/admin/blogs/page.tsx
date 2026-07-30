import { Eye, FilePenLine, ImageIcon, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { verifyAdmin } from "@/lib/admin-dal";
import {
  isAdminBlogFilter,
  listAdminBlogPosts,
  type AdminBlogFilter,
} from "@/lib/blog-posts";
import { cn } from "@/lib/utils";

import { BlogRowActions } from "./BlogRowActions";

type AdminBlogsPageProps = {
  searchParams: Promise<{
    filter?: string;
    saved?: string;
  }>;
};

const filters: Array<{ value: AdminBlogFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "draft", label: "Bản nháp" },
  { value: "published", label: "Đã xuất bản" },
  { value: "trash", label: "Thùng rác" },
];

const emptyMessages: Record<AdminBlogFilter, string> = {
  all: "Chưa có bài viết nào. Hãy tạo bài viết đầu tiên.",
  draft: "Không có bản nháp nào.",
  published: "Chưa có bài viết đã xuất bản.",
  trash: "Thùng rác đang trống.",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminBlogsPage({
  searchParams,
}: AdminBlogsPageProps) {
  await verifyAdmin();
  const query = await searchParams;
  const filter = isAdminBlogFilter(query.filter) ? query.filter : "all";
  const posts = await listAdminBlogPosts(filter);

  return (
    <div className="space-y-6">
      {query.saved === "1" ? (
        <div
          role="status"
          className="rounded-2xl border border-emerald-600/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          Đã lưu bài viết thành công.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-foreground">
            Bài viết ({posts.length})
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Soạn, xuất bản và quản lý nội dung blog.
          </p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Tạo bài viết
        </Link>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Lọc bài viết">
        {filters.map((item) => (
          <Link
            key={item.value}
            href={item.value === "all" ? "/admin/blogs" : `/admin/blogs?filter=${item.value}`}
            aria-current={filter === item.value ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-bold transition",
              filter === item.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="w-24 px-4 py-3 font-medium">Ảnh</th>
              <th className="px-4 py-3 font-medium">Bài viết</th>
              <th className="px-4 py-3 font-medium">Chuyên mục</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Cập nhật</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  {emptyMessages[filter]}
                </td>
              </tr>
            ) : posts.map((post) => {
              const trashed = Boolean(post.deletedAt);
              return (
                <tr key={post.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="relative flex size-16 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
                      {post.thumbnailUrl ? (
                        <Image
                          src={post.thumbnailUrl}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <ImageIcon className="size-5" aria-hidden="true" />
                      )}
                    </div>
                  </td>
                  <td className="max-w-sm px-4 py-3">
                    <p className="font-bold text-foreground">{post.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {post.excerpt}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {post.category ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold",
                        trashed
                          ? "bg-destructive/10 text-destructive"
                          : post.status === "published"
                            ? "bg-emerald-500/15 text-emerald-700"
                            : "bg-amber-500/15 text-amber-700",
                      )}
                    >
                      {trashed
                        ? "Thùng rác"
                        : post.status === "published"
                          ? "Đã xuất bản"
                          : "Bản nháp"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDate(post.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {!trashed ? (
                        <Link
                          href={`/admin/blogs/${post.id}`}
                          className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline"
                        >
                          <FilePenLine className="size-4" />
                          Sửa
                        </Link>
                      ) : null}
                      {!trashed && post.status === "published" ? (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 font-bold text-foreground hover:underline"
                        >
                          <Eye className="size-4" />
                          Xem
                        </Link>
                      ) : null}
                      <BlogRowActions id={post.id} title={post.title} trashed={trashed} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
