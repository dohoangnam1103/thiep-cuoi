"use server";

import { revalidatePath, updateTag } from "next/cache";

import { completedTemplateSlugs, retiredTemplateSlugs } from "@/data/chungdoi";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { verifyAdmin } from "@/lib/admin-dal";
import { prisma } from "@/lib/prisma";
import {
  TEMPLATE_SEO_OVERRIDE_TAG,
  sanitizeRelatedSlugs,
  templateSeoOverrideSchema,
} from "@/lib/template-seo-overrides";
import { resolvePublicTemplateRoute } from "@/lib/template-route-aliases";

export type TemplateSeoFormState =
  | { ok: true }
  | {
      ok: false;
      errorCode: "invalidData" | "templateNotFound";
      /** Field path -> message, so the form can mark the exact inputs. */
      fieldErrors?: Record<string, string>;
    };

function isEditableTemplate(slug: string): boolean {
  return completedTemplateSlugs.has(slug) && !retiredTemplateSlugs.has(slug);
}

/**
 * Re-derives every public URL that renders this template's SEO copy. The
 * landing page is reachable both through the next-intl path and through its
 * public Vietnamese alias, and the alias is itself admin-editable, so both are
 * invalidated from the freshly resolved route.
 */
async function revalidateTemplateSeoPages(sourceSlug: string): Promise<void> {
  const resolved = await resolvePublicTemplateRoute(sourceSlug);
  const canonicalSlug = resolved?.canonicalSlug ?? sourceSlug;
  const routeSlugs = new Set([sourceSlug, canonicalSlug]);

  for (const locale of routing.locales) {
    for (const routeSlug of routeSlugs) {
      revalidatePath(`/${locale}/templates/${routeSlug}`);
      revalidatePath(getPathname({
        href: { pathname: "/templates/[slug]", params: { slug: routeSlug } },
        locale,
      }));
    }
  }
  revalidatePath("/admin/demos");
}

/**
 * Stores marketing-authored copy for a template landing page. An empty string
 * field is not a partial update: the whole content object is replaced, and the
 * built-in catalog copy is restored by {@link resetTemplateSeo}.
 *
 * `robots` is deliberately NOT read from the form. A landing page that silently
 * flips to `noindex` drops out of Google for days before anyone notices, and
 * the ranking loss outlasts the mistake, so indexing stays a code-level
 * decision. The column is preserved as-is on every save.
 */
export async function saveTemplateSeo(
  sourceSlug: string,
  _prev: TemplateSeoFormState | undefined,
  formData: FormData,
): Promise<TemplateSeoFormState> {
  const { adminEmail } = await verifyAdmin();

  if (!isEditableTemplate(sourceSlug)) return { ok: false, errorCode: "templateNotFound" };

  const parsed = templateSeoOverrideSchema.safeParse({
    slug: sourceSlug,
    robots: "index,follow",
    content: {
      metaTitle: String(formData.get("metaTitle") ?? ""),
      metaDescription: String(formData.get("metaDescription") ?? ""),
      heading: String(formData.get("heading") ?? ""),
      intro: String(formData.get("intro") ?? ""),
      highlights: formData.getAll("highlights").map(String),
      suitableFor: formData.getAll("suitableFor").map(String),
      features: formData.getAll("features").map(String),
      steps: formData.getAll("steps").map(String),
      faq: formData.getAll("faqQuestion").map((question, index) => ({
        question: String(question),
        answer: String(formData.getAll("faqAnswer")[index] ?? ""),
      })),
      imageAlt: String(formData.get("imageAlt") ?? ""),
      relatedSlugs: formData.getAll("relatedSlugs").map(String),
      relatedBlogSlugs: formData.getAll("relatedBlogSlugs").map(String),
    },
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.filter((segment) => segment !== "content").join(".") || "content";
      fieldErrors[path] ??= issue.message;
    }
    return { ok: false, errorCode: "invalidData", fieldErrors };
  }

  // Drop related slugs that point at a retired or unknown template, so the
  // page never renders a link to a route that would 404.
  const { relatedSlugs, relatedBlogSlugs } = sanitizeRelatedSlugs(
    sourceSlug,
    parsed.data.content.relatedSlugs,
    parsed.data.content.relatedBlogSlugs,
  );
  const content = { ...parsed.data.content, relatedSlugs, relatedBlogSlugs };
  const payload = JSON.stringify(content);

  await prisma.templateSeoOverride.upsert({
    where: { slug: sourceSlug },
    // `update` omits robots so a value set outside this form (a migration, a
    // deliberate code change) survives an ordinary copy edit.
    create: { slug: sourceSlug, content: payload, robots: "index,follow", updatedBy: adminEmail },
    update: { content: payload, updatedBy: adminEmail },
  });

  updateTag(TEMPLATE_SEO_OVERRIDE_TAG);
  await revalidateTemplateSeoPages(sourceSlug);
  return { ok: true };
}

/** Deletes the override row; the landing page returns to the built-in copy. */
export async function resetTemplateSeo(sourceSlug: string): Promise<TemplateSeoFormState> {
  await verifyAdmin();

  if (!isEditableTemplate(sourceSlug)) return { ok: false, errorCode: "templateNotFound" };

  await prisma.templateSeoOverride.deleteMany({ where: { slug: sourceSlug } });

  updateTag(TEMPLATE_SEO_OVERRIDE_TAG);
  await revalidateTemplateSeoPages(sourceSlug);
  return { ok: true };
}
