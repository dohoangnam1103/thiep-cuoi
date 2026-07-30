"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { verifyAdmin } from "@/lib/admin-dal";
import {
  blogOwnedMediaUrls,
  removeBlogMedia,
} from "@/lib/blog-media";
import { prisma } from "@/lib/prisma";
import {
  parseBlogPostInput,
  type BlogFieldErrors,
} from "@/lib/blog-validation";
import { slugifyBlogTitle } from "@/lib/blog-slug";

export type SaveBlogPostState = {
  error?: string;
  fieldErrors?: BlogFieldErrors;
} | undefined;

async function uniqueBlogSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugifyBlogTitle(title);
  const matches = await prisma.blogPost.findMany({
    where: {
      slug: { startsWith: base },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { slug: true },
  });
  const occupied = new Set(matches.map((item) => item.slug));

  if (!occupied.has(base)) return base;

  let suffix = 2;
  while (occupied.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function revalidateBlogRoutes(slug?: string): void {
  revalidatePath("/admin/blogs");
  for (const locale of routing.locales) {
    revalidatePath(getPathname({ href: "/blog", locale }));
    if (slug) {
      revalidatePath(getPathname({
        href: { pathname: "/blog/[slug]", params: { slug } },
        locale,
      }));
    }
  }
}

async function removeUnreferencedMedia(urls: Iterable<string>): Promise<void> {
  const unreferenced: string[] = [];

  for (const url of urls) {
    const reference = await prisma.blogPost.findFirst({
      where: {
        OR: [
          { thumbnailUrl: url },
          { contentHtml: { contains: url } },
        ],
      },
      select: { id: true },
    });
    if (!reference) unreferenced.push(url);
  }

  await removeBlogMedia(unreferenced);
}

export async function saveBlogPost(
  id: string | null,
  _previousState: SaveBlogPostState,
  formData: FormData,
): Promise<SaveBlogPostState> {
  await verifyAdmin();

  const parsed = parseBlogPostInput(formData);
  if (!parsed.success) {
    return {
      error: "Vui lòng kiểm tra lại các trường được đánh dấu.",
      fieldErrors: parsed.errors,
    };
  }

  const current = id
    ? await prisma.blogPost.findUnique({ where: { id } })
    : null;
  if (id && !current) {
    return { error: "Bài viết không còn tồn tại." };
  }

  const slug = await uniqueBlogSlug(parsed.data.title, id ?? undefined);
  const publishedAt = parsed.data.status === "published"
    ? current?.publishedAt ?? new Date()
    : current?.publishedAt ?? null;

  try {
    if (current) {
      await prisma.blogPost.update({
        where: { id: current.id },
        data: {
          ...parsed.data,
          slug,
          publishedAt,
        },
      });
    } else {
      await prisma.blogPost.create({
        data: {
          ...parsed.data,
          slug,
          publishedAt,
        },
      });
    }
  } catch (error) {
    console.error("Could not save blog post", error);
    return { error: "Không thể lưu bài viết. Vui lòng thử lại." };
  }

  if (current) {
    const oldMedia = blogOwnedMediaUrls(current.thumbnailUrl, current.contentHtml);
    const newMedia = blogOwnedMediaUrls(parsed.data.thumbnailUrl, parsed.data.contentHtml);
    const removedMedia = Array.from(oldMedia).filter((url) => !newMedia.has(url));
    await removeUnreferencedMedia(removedMedia);
    if (current.slug !== slug) revalidateBlogRoutes(current.slug);
  }

  revalidateBlogRoutes(slug);
  redirect("/admin/blogs?saved=1");
}

export async function moveBlogPostToTrash(id: string): Promise<void> {
  await verifyAdmin();
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post || post.deletedAt) return;

  await prisma.blogPost.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidateBlogRoutes(post.slug);
}

export async function restoreBlogPost(id: string): Promise<void> {
  await verifyAdmin();
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post || !post.deletedAt) return;

  await prisma.blogPost.update({
    where: { id },
    data: { deletedAt: null },
  });
  revalidateBlogRoutes(post.slug);
}

export async function permanentlyDeleteBlogPost(
  id: string,
  confirmationTitle: string,
): Promise<void> {
  await verifyAdmin();
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post || !post.deletedAt || confirmationTitle !== post.title) return;

  const ownedMedia = blogOwnedMediaUrls(post.thumbnailUrl, post.contentHtml);
  await prisma.blogPost.delete({ where: { id } });
  await removeUnreferencedMedia(ownedMedia);
  revalidateBlogRoutes(post.slug);
}
