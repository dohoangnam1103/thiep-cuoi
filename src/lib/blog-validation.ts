import { z } from "zod";

import {
  hasMeaningfulBlogContent,
  sanitizeBlogHtml,
} from "@/lib/blog-content";

export const BLOG_STATUSES = ["draft", "published"] as const;

const blogPostInputSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập tiêu đề").max(180, "Tiêu đề tối đa 180 ký tự"),
  excerpt: z.string().trim().min(1, "Vui lòng nhập mô tả ngắn").max(500, "Mô tả tối đa 500 ký tự"),
  category: z.string().trim().max(80, "Chuyên mục tối đa 80 ký tự"),
  contentHtml: z.string(),
  thumbnailUrl: z.string().trim(),
  status: z.enum(BLOG_STATUSES, { error: "Trạng thái không hợp lệ" }),
});

export type BlogPostInput = {
  title: string;
  excerpt: string;
  category: string | null;
  contentHtml: string;
  thumbnailUrl: string | null;
  status: (typeof BLOG_STATUSES)[number];
};

export type BlogFieldErrors = Partial<Record<
  "title" | "excerpt" | "category" | "contentHtml" | "thumbnailUrl" | "status",
  string
>>;

export type BlogInputResult =
  | { success: true; data: BlogPostInput }
  | { success: false; errors: BlogFieldErrors };

export function parseBlogPostInput(formData: FormData): BlogInputResult {
  const parsed = blogPostInputSchema.safeParse({
    title: formData.get("title"),
    excerpt: formData.get("excerpt"),
    category: formData.get("category") ?? "",
    contentHtml: formData.get("contentHtml"),
    thumbnailUrl: formData.get("thumbnailUrl") ?? "",
    status: formData.get("status"),
  });

  if (!parsed.success) {
    const errors: BlogFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in errors)) {
        errors[field as keyof BlogFieldErrors] = issue.message;
      }
    }
    return { success: false, errors };
  }

  const contentHtml = sanitizeBlogHtml(parsed.data.contentHtml);
  if (!hasMeaningfulBlogContent(contentHtml)) {
    return {
      success: false,
      errors: { contentHtml: "Vui lòng nhập nội dung bài viết" },
    };
  }

  const thumbnailUrl = parsed.data.thumbnailUrl;
  if (
    thumbnailUrl
    && !/^\/blog-media\/[0-9a-f-]{36}\.webp$/.test(thumbnailUrl)
  ) {
    return {
      success: false,
      errors: { thumbnailUrl: "Ảnh đại diện không hợp lệ" },
    };
  }

  return {
    success: true,
    data: {
      title: parsed.data.title,
      excerpt: parsed.data.excerpt,
      category: parsed.data.category || null,
      contentHtml,
      thumbnailUrl: thumbnailUrl || null,
      status: parsed.data.status,
    },
  };
}
