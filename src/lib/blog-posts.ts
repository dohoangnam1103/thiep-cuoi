import "server-only";

import { prisma } from "@/lib/prisma";

export const ADMIN_BLOG_FILTERS = ["all", "draft", "published", "trash"] as const;
export type AdminBlogFilter = (typeof ADMIN_BLOG_FILTERS)[number];

export function isAdminBlogFilter(value: string | undefined): value is AdminBlogFilter {
  return ADMIN_BLOG_FILTERS.includes(value as AdminBlogFilter);
}

/**
 * `contentHtml` is 96% of a BlogPost row — 224KB across the 12 published posts —
 * and only the two functions that actually render an article body select it.
 * Every list view here renders cards, so leaving it out keeps the per-request
 * read at a few KB instead of a few hundred.
 */
const CARD_FIELDS = {
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  thumbnailUrl: true,
  publishedAt: true,
} as const;

export async function listAdminBlogPosts(filter: AdminBlogFilter) {
  return prisma.blogPost.findMany({
    where: filter === "trash"
      ? { deletedAt: { not: null } }
      : {
          deletedAt: null,
          ...(filter === "all" ? {} : { status: filter }),
        },
    // Admin rows need id (edit links), status and deletedAt on top of the card
    // fields, and this query is the widest of the three: "all" and "trash"
    // include drafts, so it reads more rows than the public list ever does.
    select: {
      ...CARD_FIELDS,
      id: true,
      status: true,
      deletedAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getAdminBlogPost(id: string) {
  return prisma.blogPost.findUnique({ where: { id } });
}

const publicWhere = {
  status: "published",
  deletedAt: null,
} as const;

export async function listPublishedBlogPosts() {
  return prisma.blogPost.findMany({
    where: publicWhere,
    // `updatedAt` is not rendered anywhere: it is here for `app/sitemap.ts`,
    // which turns it into <lastmod>. Dropping it silently strips lastmod from
    // all 13 blog URLs, and the sitemap test drives fixtures rather than this
    // query, so typecheck against BlogSitemapPost is what catches that.
    select: { ...CARD_FIELDS, updatedAt: true },
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
      { id: "asc" },
    ],
  });
}

export async function getPublishedBlogPost(slug: string) {
  return prisma.blogPost.findFirst({
    where: { ...publicWhere, slug },
  });
}

export async function getRelatedBlogPosts(post: {
  id: string;
  category: string | null;
}) {
  // `id` is selected because the second query excludes these rows by id, not
  // because the related-posts cards render it.
  const sameCategory = post.category
    ? await prisma.blogPost.findMany({
        where: {
          ...publicWhere,
          id: { not: post.id },
          category: post.category,
        },
        select: { ...CARD_FIELDS, id: true },
        orderBy: [
          { publishedAt: "desc" },
          { createdAt: "desc" },
          { id: "asc" },
        ],
        take: 3,
      })
    : [];

  if (sameCategory.length === 3) return sameCategory;

  const otherPosts = await prisma.blogPost.findMany({
    where: {
      ...publicWhere,
      id: { notIn: [post.id, ...sameCategory.map((item) => item.id)] },
    },
    select: { ...CARD_FIELDS, id: true },
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
      { id: "asc" },
    ],
    take: 3 - sameCategory.length,
  });

  return [...sameCategory, ...otherPosts];
}
