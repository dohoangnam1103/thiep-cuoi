import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { templates, vietnameseTemplateSlugs } from "@/data/chungdoi";
import { chungdoiDemoContent } from "@/data/chungdoi-demo-content";
import { chungdoiThemeConfig } from "@/data/chungdoi-theme-config";
import { AUDITED_TEMPLATE_SLUGS } from "@/lib/audited-template-renderers";

const NEW_LAYOUTS = [
  "editorial-noir",
  "ticket-terracotta",
  "zen-sand",
  "arch-sage",
] as const;

const LOCALES = ["vi", "en", "ko", "ja", "zh"] as const;
const PREVIEW_KINDS = ["listing", "portrait", "landscape"] as const;
const REQUIRED_COPY_KEYS = [
  "invitation",
  "ceremony",
  "reception",
  "album",
  "location",
  "timeline",
  "guestbook",
  "gift",
  "addToCalendar",
  "presenceHonor",
] as const;

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

test("the four layout-first invitation demos are wired through every runtime surface", () => {
  const failures: string[] = [];
  const templateSlugs = new Set(templates.map((template) => template.slug));
  const localizedRouteSlugs = new Set(vietnameseTemplateSlugs.map(([slug]) => slug));
  const auditedSlugs = new Set<string>(AUDITED_TEMPLATE_SLUGS);
  const rendererRegistry = source("src/components/chungdoi-demo.tsx");

  for (const slug of NEW_LAYOUTS) {
    if (!templateSlugs.has(slug)) failures.push(`${slug}: missing catalog metadata`);
    if (!localizedRouteSlugs.has(slug)) failures.push(`${slug}: missing Vietnamese route`);
    if (!auditedSlugs.has(slug)) failures.push(`${slug}: missing audited renderer slug`);
    if (!rendererRegistry.includes(`\"${slug}\"`)) failures.push(`${slug}: missing renderer mapping`);
    if (!chungdoiThemeConfig[slug]) failures.push(`${slug}: missing theme config`);
    if (!chungdoiDemoContent[slug]) failures.push(`${slug}: missing demo content`);

    const componentPath = `src/components/chungdoi-tpl-${slug}.tsx`;
    const componentSource = source(componentPath);
    if (componentSource.includes("style=")) failures.push(`${slug}: contains inline styles`);
    if (!componentSource.includes('useTranslations("invitationTemplate")')) {
      failures.push(`${slug}: does not read invitation copy from next-intl`);
    }

    const previewStem = slug.replaceAll("-", "_");
    for (const kind of PREVIEW_KINDS) {
      const previewPath = resolve(
        process.cwd(),
        `public/chungdoi/images/template-previews/en/${kind}/${previewStem}.webp`,
      );
      if (!existsSync(previewPath)) failures.push(`${slug}: missing ${kind} preview`);
    }
  }

  for (const locale of LOCALES) {
    const messages = JSON.parse(source(`messages/${locale}.json`)) as {
      invitationTemplate?: Record<string, string>;
      listing?: { templates?: Record<string, { name?: string; description?: string }> };
    };

    for (const key of REQUIRED_COPY_KEYS) {
      if (!messages.invitationTemplate?.[key]) {
        failures.push(`${locale}: missing invitationTemplate.${key}`);
      }
    }
    for (const slug of NEW_LAYOUTS) {
      const listing = messages.listing?.templates?.[slug];
      if (!listing?.name || !listing.description) {
        failures.push(`${locale}: missing listing.templates.${slug}`);
      }
    }
  }

  for (const providerPath of [
    "src/app/editor/layout.tsx",
    "src/app/admin/demos/[id]/page.tsx",
    "src/app/thiep/layout.tsx",
  ]) {
    if (!source(providerPath).includes("invitationTemplate")) {
      failures.push(`${providerPath}: invitationTemplate messages are not provided`);
    }
  }

  assert.deepEqual(failures, []);
});
