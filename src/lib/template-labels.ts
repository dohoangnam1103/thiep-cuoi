import { cache } from "react";

import { TEMPLATE_LABELS } from "@/app/editor/[id]/templates";
import { prisma } from "@/lib/prisma";

/** slug -> display name. Built-in names merged with admin overrides. */
export type TemplateLabelMap = Record<string, string>;

/**
 * Resolved template names for the current request: built-in defaults with any
 * admin rename applied on top. Memoised per request so multiple components can
 * call it without extra queries.
 */
export const getTemplateLabels = cache(async (): Promise<TemplateLabelMap> => {
  const rows = await prisma.templateLabel.findMany({ select: { slug: true, name: true } });
  const labels: TemplateLabelMap = { ...TEMPLATE_LABELS };
  for (const row of rows) {
    const name = row.name.trim();
    if (name) labels[row.slug] = name;
  }
  return labels;
});

/** Only the rows an admin has renamed, keyed by slug. */
export const getTemplateLabelOverrides = cache(async (): Promise<TemplateLabelMap> => {
  const rows = await prisma.templateLabel.findMany({ select: { slug: true, name: true } });
  return Object.fromEntries(rows.map((row) => [row.slug, row.name]));
});

/**
 * Same as {@link getTemplateLabelOverrides} but never throws, so statically
 * prerendered marketing pages can be built without a database. Those pages use
 * ISR, so the real names land on the first revalidation after deploy and
 * immediately after a rename (the action revalidates the tree).
 */
export const getPublicTemplateNameOverrides = cache(async (): Promise<TemplateLabelMap> => {
  try {
    return await getTemplateLabelOverrides();
  } catch {
    return {};
  }
});

/** Built-in name, ignoring any admin rename. */
export function defaultTemplateLabel(slug: string): string {
  return TEMPLATE_LABELS[slug] ?? slug;
}

export function labelFromMap(labels: TemplateLabelMap, slug: string): string {
  return labels[slug] ?? slug;
}
