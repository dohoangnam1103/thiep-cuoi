import { Eye, FilePenLine, ImageIcon, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AdminTableScroller } from "@/components/admin-table-scroller";
import { verifyAdmin } from "@/lib/admin-dal";
import {
  isAdminBlogFilter,
  listAdminBlogPosts,
  type AdminBlogFilter,
} from "@/lib/blog-posts";
import { formatVietnamDateTime } from "@/lib/datetime";
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
  { value: "published", label: "Xuất bản" },
  { value: "trash", label: "Thùng rác" },
];

const emptyMessages: Record<AdminBlogFilter, string> = {
  all: "Chưa có bài viết nào. Hãy tạo bài viết đầu tiên.",
  draft: "Không có bản nháp nào.",
  published: "Chưa có bài viết đã xuất bản.",
  trash: "Thùng rác đang trống.",
};

const formatDate = formatVietnamDateTime;

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

      <AdminTableScroller>
        <table className="w-full min-w-[960px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="w-24 px-4 py-3 font-medium">Ảnh</th>
              <th className="px-4 py-3 font-medium">Bài viết</th>
              <th className="w-40 px-4 py-3 font-medium">Chuyên mục</th>
              <th className="w-28 px-4 py-3 font-medium">Trạng thái</th>
              <th className="w-44 px-4 py-3 font-medium">Cập nhật</th>
              <th className="w-36 px-4 py-3 font-medium">Thao tác</th>
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
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {post.category ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold",
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
                          ? "Xuất bản"
                          : "Bản nháp"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDate(post.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      {!trashed ? (
                        <Link
                          href={`/admin/blogs/${post.id}`}
                          aria-label={`Sửa bài viết ${post.title}`}
                          title="Sửa bài viết"
                          className="inline-flex size-9 items-center justify-center rounded-full border border-primary/20 text-primary transition hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <FilePenLine className="size-[18px]" aria-hidden="true" />
                        </Link>
                      ) : null}
                      {!trashed && post.status === "published" ? (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Xem bài viết ${post.title}`}
                          title="Xem bài viết"
                          className="inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground transition hover:border-foreground/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Eye className="size-[18px]" aria-hidden="true" />
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
      </AdminTableScroller>
    </div>
  );
}
