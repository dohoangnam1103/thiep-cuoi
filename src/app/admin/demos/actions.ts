"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin-dal";
import { completedTemplateSlugs, getVietnameseTemplateSlug } from "@/data/chungdoi";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { templateSeoFacets } from "@/data/template-seo-facets";
import { TEMPLATE_LABEL_MAX_LENGTH } from "@/app/editor/[id]/templates";
import { isEditorUploadPublicUrl } from "@/lib/editor-uploads";
import { defaultTemplateLabel } from "@/lib/template-labels";
import {
  parseCeremonies,
  parseSchedule,
  parseGallery,
  contentSchema,
  type EditorState,
} from "@/app/editor/[id]/content-schema";

export async function saveDemo(id: string, _prev: EditorState, formData: FormData): Promise<EditorState> {
  await verifyAdmin();

  const invitation = await prisma.invitation.findFirst({ where: { id, isDemo: true } });
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

  revalidatePath("/admin/demos");
  for (const locale of routing.locales) {
    const slug = locale === "vi" ? getVietnameseTemplateSlug(templateId) : templateId;
    revalidatePath(`/${locale}/templates/${slug}/demo`);
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

export type TemplateMobileThumbnailState =
  | { ok: true; imageUrl?: string }
  | { ok: false; errorCode: "invalidData" | "templateNotFound" | "saveFailed" };

function revalidatePublicTemplatePresentation() {
  // Invalidate both the internal App Router paths and the externally visible
  // localized paths. With next-intl rewrites, invalidating only
  // `/{locale}/templates` does not evict the `/mau-thiep` route cache.
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/templates`);
    revalidatePath(getPathname({ href: "/", locale }));
    revalidatePath(getPathname({ href: "/templates", locale }));
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

export type RenameTemplateState = { error?: string; ok?: boolean; name?: string } | undefined;

/**
 * Renames a template's display name. An empty name clears the override so the
 * built-in name is used again.
 */
export async function renameTemplate(
  _prev: RenameTemplateState,
  formData: FormData,
): Promise<RenameTemplateState> {
  await verifyAdmin();

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

  if (name) {
    await prisma.templateLabel.upsert({
      where: { slug: templateId },
      create: { slug: templateId, name },
      update: { name },
    });
  } else {
    await prisma.templateLabel.deleteMany({ where: { slug: templateId } });
  }

  revalidatePath("/admin/demos");
  revalidatePath("/dashboard");
  revalidatePath("/editor", "layout");
  revalidatePublicTemplatePresentation();

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
