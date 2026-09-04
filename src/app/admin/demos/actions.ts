"use server";

import { Prisma } from "@/generated/prisma/client";
import { revalidatePath, updateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import {
  parseCeremonies,
  parseGallery,
  parseSchedule,
  contentSchema,
  type EditorState,
} from "@/app/editor/[id]/content-schema";
import { TEMPLATE_LABEL_MAX_LENGTH } from "@/app/editor/[id]/templates";
import {
  completedTemplateSlugs,
  getVietnameseTemplateSlug,
  retiredTemplateSlugs,
} from "@/data/chungdoi";
import { getSourceTemplateSlug } from "@/data/template-route-slugs";
import { templateSeoFacets } from "@/data/template-seo-facets";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { verifyAdmin } from "@/lib/admin-dal";
import { isEditorUploadPublicUrl } from "@/lib/editor-uploads";
import { prisma } from "@/lib/prisma";
import { PUBLIC_DEMO_CONTENT_CACHE_TAG } from "@/lib/public-demo-content";
import { defaultTemplateLabel } from "@/lib/template-labels";
import {
  getPublicTemplateRouteOverrides,
  getTemplateRouteOverrides,
  resolvePublicTemplateRoute,
  templateRouteSlugFromMap,
} from "@/lib/template-route-aliases";
import {
  isReservedTemplateRouteSlug,
  slugifyTemplateRoute,
} from "@/lib/template-route-slug";

export async function saveDemo(id: string, _prev: EditorState, formData: FormData): Promise<EditorState> {
  await verifyAdmin();

  const invitation = await prisma.invitation.findFirst({
    where: { id, isDemo: true, templateId: { notIn: [...retiredTemplateSlugs] } },
  });
  if (!invitation) return { errorCode: "invitationNotFound" };

  const parsed = contentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errorCode: "invalidData" };
  }
  const ceremonies = parseCeremonies(formData);
  const firstCeremony = ceremonies[0];
  const { templateId, ...contentData } = {
    ...parsed.data,
    ceremonyHeader: firstCeremony?.title ?? "",
    ceremonyDate: firstCeremony?.date ?? "",
    ceremonyTime: firstCeremony?.time ?? "",
  };
  const schedule = parseSchedule(formData);
  const gallery = parseGallery(formData);

  await prisma.$transaction([
    prisma.invitation.update({ where: { id }, data: { templateId } }),
    prisma.invitationContent.upsert({
      where: { invitationId: id },
      create: { invitationId: id, ...contentData },
      update: contentData,
    }),
    prisma.ceremonyItem.deleteMany({ where: { invitationId: id } }),
    prisma.scheduleItem.deleteMany({ where: { invitationId: id } }),
    prisma.galleryPhoto.deleteMany({ where: { invitationId: id } }),
    ...(ceremonies.length
      ? [
          prisma.ceremonyItem.createMany({
            data: ceremonies.map((ceremony, i) => ({
              invitationId: id,
              title: ceremony.title,
              date: ceremony.date,
              time: ceremony.time,
              sortOrder: i,
            })),
          }),
        ]
      : []),
    ...(schedule.length
      ? [
          prisma.scheduleItem.createMany({
            data: schedule.map((s, i) => ({ invitationId: id, time: s.time, label: s.label, sortOrder: i })),
          }),
        ]
      : []),
    ...(gallery.length
      ? [
          prisma.galleryPhoto.createMany({
            data: gallery.map((url, i) => ({ invitationId: id, url, sortOrder: i })),
          }),
        ]
      : []),
  ]);

  updateTag(PUBLIC_DEMO_CONTENT_CACHE_TAG);
  revalidatePath("/admin/demos");
  const routeOverrides = await getPublicTemplateRouteOverrides();
  for (const locale of routing.locales) {
    const slug = locale === "vi"
      ? templateRouteSlugFromMap(routeOverrides, templateId)
      : templateId;
    revalidatePath(`/${locale}/templates/${slug}/demo`);
    revalidatePath(getPathname({
      href: {
        pathname: "/templates/[slug]/demo",
        params: { slug },
      },
      locale,
    }));
  }

  return { ok: true, persisted: true };
}

const renameSchema = z.object({
  templateId: z.string().trim().min(1, "Thiếu mẫu thiệp"),
  name: z
    .string()
    .trim()
    .max(TEMPLATE_LABEL_MAX_LENGTH, `Tên tối đa ${TEMPLATE_LABEL_MAX_LENGTH} ký tự`),
});

const mobileThumbnailSchema = z.object({
  templateId: z.string().trim().min(1),
  imageUrl: z.string().trim().refine(isEditorUploadPublicUrl),
});

const mobileThumbnailClearSchema = z.object({
  templateId: z.string().trim().min(1),
});

const templateDisplayOrderSchema = z
  .array(z.string().trim().min(1))
  .min(1)
  .max(500);

const templateVisibilitySchema = z.object({
  templateId: z.string().trim().min(1),
  isVisible: z.boolean(),
});

export type TemplateMobileThumbnailState =
  | { ok: true; imageUrl?: string }
  | { ok: false; errorCode: "invalidData" | "templateNotFound" | "saveFailed" };

export type TemplateDisplayOrderState =
  | { ok: true }
  | { ok: false; errorCode: "invalidData" | "saveFailed" };

export type TemplateVisibilityState =
  | { ok: true; isVisible: boolean }
  | {
      ok: false;
      errorCode: "invalidData" | "templateNotFound" | "saveFailed";
    };

function revalidatePublicTemplatePresentation() {
  // Invalidate both the internal App Router paths and the externally visible
  // localized paths. With next-intl rewrites, invalidating only
  // `/{locale}/templates` does not evict the `/mau-thiep` route cache.
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/templates`);
    revalidatePath(`/${locale}/create-wedding-invitation-online`);
    revalidatePath(getPathname({ href: "/", locale }));
    revalidatePath(getPathname({ href: "/templates", locale }));
    revalidatePath(getPathname({
      href: "/create-wedding-invitation-online",
      locale,
    }));
    for (const facet of templateSeoFacets) {
      if (facet.kind === "style") {
        revalidatePath(`/${locale}/templates/style/${facet.slug}`);
        revalidatePath(getPathname({
          href: {
            pathname: "/templates/style/[slug]",
            params: { slug: facet.slug },
          },
          locale,
        }));
      } else {
        revalidatePath(`/${locale}/templates/color/${facet.slug}`);
        revalidatePath(getPathname({
          href: {
            pathname: "/templates/color/[slug]",
            params: { slug: facet.slug },
          },
          locale,
        }));
      }
    }
  }
}

/** Persists the exact drag-and-drop order shown in the demo manager. */
export async function saveTemplateDisplayOrder(
  input: unknown,
): Promise<TemplateDisplayOrderState> {
  await verifyAdmin();

  const parsed = templateDisplayOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorCode: "invalidData" };

  const slugs = parsed.data;
  if (new Set(slugs).size !== slugs.length) {
    return { ok: false, errorCode: "invalidData" };
  }

  const demos = await prisma.invitation.findMany({
    // Validate the same demo set rendered by the manager; retired demos can
    // remain in the database but are never included in its reorder payload.
    where: { isDemo: true, templateId: { notIn: [...retiredTemplateSlugs] } },
    select: { templateId: true },
  });
  const demoSlugs = new Set(demos.map((demo) => demo.templateId));
  if (
    demoSlugs.size !== slugs.length ||
    slugs.some((slug) => !demoSlugs.has(slug))
  ) {
    return { ok: false, errorCode: "invalidData" };
  }

  try {
    await prisma.$transaction(
      slugs.map((slug, sortOrder) =>
        prisma.templateDisplayOrder.upsert({
          where: { slug },
          create: { slug, sortOrder },
          update: { sortOrder },
        }),
      ),
    );
  } catch {
    return { ok: false, errorCode: "saveFailed" };
  }

  revalidatePath("/admin/demos");
  revalidatePublicTemplatePresentation();

  return { ok: true };
}

/** Shows or hides one demo template from the public template listing. */
export async function saveTemplateVisibility(
  input: unknown,
): Promise<TemplateVisibilityState> {
  await verifyAdmin();

  const parsed = templateVisibilitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorCode: "invalidData" };

  const { templateId, isVisible } = parsed.data;
  const demo = await prisma.invitation.findFirst({
    where: { isDemo: true, templateId },
    select: { id: true },
  });
  if (!demo) return { ok: false, errorCode: "templateNotFound" };

  try {
    await prisma.templateVisibility.upsert({
      where: { slug: templateId },
      create: { slug: templateId, isVisible },
      update: { isVisible },
    });
  } catch {
    return { ok: false, errorCode: "saveFailed" };
  }

  revalidatePath("/admin/demos");
  revalidatePublicTemplatePresentation();

  return { ok: true, isVisible };
}

export type RenameTemplateState = { error?: string; ok?: boolean; name?: string } | undefined;

class TemplateRouteConflictError extends Error {}

/**
 * Renames a template and moves its canonical public URL to the slug generated
 * from that name. Previous URLs remain persisted as aliases.
 */
export async function renameTemplate(
  _prev: RenameTemplateState,
  formData: FormData,
): Promise<RenameTemplateState> {
  await verifyAdmin();
  const t = await getTranslations("adminDemos");

  const parsed = renameSchema.safeParse({
    templateId: formData.get("templateId"),
    name: formData.get("name") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }
  const { templateId, name } = parsed.data;

  if (!completedTemplateSlugs.has(templateId)) {
    return { error: "Mẫu thiệp không tồn tại" };
  }

  const defaultRouteSlug = getVietnameseTemplateSlug(templateId);
  const nextRouteSlug = name ? slugifyTemplateRoute(name) : defaultRouteSlug;
  if (!nextRouteSlug || isReservedTemplateRouteSlug(nextRouteSlug)) {
    return { error: t("renameErrors.invalidUrl") };
  }

  const staticOwner = getSourceTemplateSlug(nextRouteSlug);
  if (
    name
    && staticOwner
    && (staticOwner !== templateId || nextRouteSlug !== defaultRouteSlug)
  ) {
    return { error: t("renameErrors.routeInUse") };
  }

  const resolvedExistingRoute = name
    ? await resolvePublicTemplateRoute(nextRouteSlug)
    : null;
  if (
    resolvedExistingRoute
    && resolvedExistingRoute.sourceSlug !== templateId
  ) {
    return { error: t("renameErrors.routeInUse") };
  }

  const currentRouteOverrides = await getTemplateRouteOverrides();
  const oldRouteSlug = templateRouteSlugFromMap(
    currentRouteOverrides,
    templateId,
  );

  let persistedRouteSlugs: string[];
  try {
    persistedRouteSlugs = await prisma.$transaction(async (db) => {
      // Make the first statement a write so concurrent renames serialize before
      // checking alias ownership (important for SQLite's transaction model).
      await db.templateRouteAlias.updateMany({
        where: { templateSlug: templateId, canonical: true },
        data: { canonical: null },
      });

      const requestedAlias = name
        ? await db.templateRouteAlias.findUnique({
            where: { routeSlug: nextRouteSlug },
            select: { templateSlug: true },
          })
        : null;
      if (requestedAlias && requestedAlias.templateSlug !== templateId) {
        throw new TemplateRouteConflictError();
      }

      // Existing TemplateLabel rows predate this table. Preserve their derived
      // URL as a real historical alias before replacing the label.
      if (oldRouteSlug !== defaultRouteSlug && oldRouteSlug !== nextRouteSlug) {
        const oldAlias = await db.templateRouteAlias.findUnique({
          where: { routeSlug: oldRouteSlug },
          select: { templateSlug: true },
        });
        if (oldAlias && oldAlias.templateSlug !== templateId) {
          throw new TemplateRouteConflictError();
        }
        if (!oldAlias) {
          await db.templateRouteAlias.create({
            data: {
              routeSlug: oldRouteSlug,
              templateSlug: templateId,
              canonical: null,
            },
          });
        }
      }

      if (name) {
        await db.templateLabel.upsert({
          where: { slug: templateId },
          create: { slug: templateId, name },
          update: { name },
        });
        if (requestedAlias) {
          await db.templateRouteAlias.update({
            where: { routeSlug: nextRouteSlug },
            data: { canonical: true },
          });
        } else {
          await db.templateRouteAlias.create({
            data: {
              routeSlug: nextRouteSlug,
              templateSlug: templateId,
              canonical: true,
            },
          });
        }
      } else {
        await db.templateLabel.deleteMany({ where: { slug: templateId } });
      }

      const aliases = await db.templateRouteAlias.findMany({
        where: { templateSlug: templateId },
        orderBy: { routeSlug: "asc" },
        select: { routeSlug: true },
      });
      return aliases.map((alias) => alias.routeSlug);
    });
  } catch (error) {
    if (
      error instanceof TemplateRouteConflictError
      || (
        error instanceof Prisma.PrismaClientKnownRequestError
        && error.code === "P2002"
      )
    ) {
      return { error: t("renameErrors.routeInUse") };
    }
    console.error("Không thể đổi tên và URL mẫu thiệp", {
      templateId,
      error: error instanceof Error ? error.message : "unknown",
    });
    return { error: t("renameErrors.saveFailed") };
  }

  revalidatePath("/admin/demos");
  revalidatePath("/dashboard");
  revalidatePath("/editor", "layout");
  revalidatePublicTemplatePresentation();

  for (const routeSlug of new Set([
    templateId,
    defaultRouteSlug,
    oldRouteSlug,
    nextRouteSlug,
    ...persistedRouteSlugs,
  ])) {
    revalidatePath(`/vi/templates/${routeSlug}`);
    revalidatePath(`/vi/templates/${routeSlug}/demo`);
    revalidatePath(`/mau-thiep/${routeSlug}`);
    revalidatePath(`/mau-thiep/${routeSlug}/demo`);
  }

  return { ok: true, name: name || defaultTemplateLabel(templateId) };
}

/** Saves an uploaded WebP as the template's mobile-only card thumbnail. */
export async function saveTemplateMobileThumbnail(
  input: unknown,
): Promise<TemplateMobileThumbnailState> {
  await verifyAdmin();

  const parsed = mobileThumbnailSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorCode: "invalidData" };

  const { templateId, imageUrl } = parsed.data;
  if (!completedTemplateSlugs.has(templateId)) {
    return { ok: false, errorCode: "templateNotFound" };
  }

  try {
    await prisma.templateMobileThumbnail.upsert({
      where: { slug: templateId },
      create: { slug: templateId, imageUrl },
      update: { imageUrl },
    });
  } catch {
    return { ok: false, errorCode: "saveFailed" };
  }

  revalidatePath("/admin/demos");
  revalidatePath("/dashboard");
  revalidatePath("/editor", "layout");
  revalidatePublicTemplatePresentation();

  return { ok: true, imageUrl };
}

/** Removes the override so all small-screen cards fall back to their old image. */
export async function clearTemplateMobileThumbnail(
  input: unknown,
): Promise<TemplateMobileThumbnailState> {
  await verifyAdmin();

  const parsed = mobileThumbnailClearSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorCode: "invalidData" };

  const { templateId } = parsed.data;
  if (!completedTemplateSlugs.has(templateId)) {
    return { ok: false, errorCode: "templateNotFound" };
  }

  try {
    await prisma.templateMobileThumbnail.deleteMany({ where: { slug: templateId } });
  } catch {
    return { ok: false, errorCode: "saveFailed" };
  }

  revalidatePath("/admin/demos");
  revalidatePath("/dashboard");
  revalidatePath("/editor", "layout");
  revalidatePublicTemplatePresentation();

  return { ok: true };
}
