import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogPostForm } from "@/app/admin/blogs/BlogPostForm";
import { verifyAdmin } from "@/lib/admin-dal";
import { getAdminBlogPost } from "@/lib/blog-posts";
import { formatVietnamDateTime } from "@/lib/datetime";

type EditBlogPostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  await verifyAdmin();
  const { id } = await params;
  const post = await getAdminBlogPost(id);
  if (!post || post.deletedAt) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/blogs" className="text-sm font-bold text-primary hover:underline">
          ← Bài viết
        </Link>
        <h1 className="mt-3 font-heading text-2xl text-foreground">Sửa bài viết</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cập nhật lần cuối {formatVietnamDateTime(post.updatedAt)}
        </p>
      </div>

      <BlogPostForm
        id={post.id}
        initialValues={{
          title: post.title,
          excerpt: post.excerpt,
          category: post.category ?? "",
          contentHtml: post.contentHtml,
          thumbnailUrl: post.thumbnailUrl ?? "",
          status: post.status === "published" ? "published" : "draft",
        }}
      />
    </div>
  );
}
