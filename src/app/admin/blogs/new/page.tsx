import Link from "next/link";

import { BlogPostForm } from "@/app/admin/blogs/BlogPostForm";
import { verifyAdmin } from "@/lib/admin-dal";

export default async function NewBlogPostPage() {
  await verifyAdmin();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/blogs" className="text-sm font-bold text-primary hover:underline">
          ← Bài viết
        </Link>
        <h1 className="mt-3 font-heading text-2xl text-foreground">Tạo bài viết</h1>
      </div>

      <BlogPostForm
        id={null}
        initialValues={{
          title: "",
          excerpt: "",
          category: "",
          contentHtml: "<p></p>",
          thumbnailUrl: "",
          status: "draft",
        }}
      />
    </div>
  );
}
