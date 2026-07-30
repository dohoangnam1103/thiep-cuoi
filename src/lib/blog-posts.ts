import "server-only";

import { prisma } from "@/lib/prisma";

export const ADMIN_BLOG_FILTERS = ["all", "draft", "published", "trash"] as const;
export type AdminBlogFilter = (typeof ADMIN_BLOG_FILTERS)[number];

export function isAdminBlogFilter(value: string | undefined): value is AdminBlogFilter {
  return ADMIN_BLOG_FILTERS.includes(value as AdminBlogFilter);
}

export async function listAdminBlogPosts(filter: AdminBlogFilter) {
  return prisma.blogPost.findMany({
    where: filter === "trash"
      ? { deletedAt: { not: null } }
      : {
          deletedAt: null,
          ...(filter === "all" ? {} : { status: filter }),
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
  const sameCategory = post.category
    ? await prisma.blogPost.findMany({
        where: {
          ...publicWhere,
          id: { not: post.id },
          category: post.category,
        },
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
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
      { id: "asc" },
    ],
    take: 3 - sameCategory.length,
  });

  return [...sameCategory, ...otherPosts];
}
