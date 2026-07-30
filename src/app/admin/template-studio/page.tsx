import { NextIntlClientProvider } from "next-intl";

import viMessages from "../../../../messages/vi.json";
import { TemplateStudio } from "@/components/template-studio/template-studio";
import { completedTemplates } from "@/data/chungdoi";
import { chungdoiDemoContent } from "@/data/chungdoi-demo-content";
import { getAiConnectionStatus } from "@/lib/ai-config";
import { verifyAdmin } from "@/lib/admin-dal";
import { createInitialStudioSpec, type StudioSource } from "@/lib/template-studio";

export default async function AdminTemplateStudioPage() {
  await verifyAdmin();
  const aiConnection = await getAiConnectionStatus();

  const sources = completedTemplates.flatMap<StudioSource>((template) => {
    const content = chungdoiDemoContent[template.slug];
    if (!content) return [];
    const gallery = content.gallery.length ? content.gallery.slice(0, 6) : [template.portrait];
    return [{
      slug: template.slug,
      name: template.name,
      heroImage: content.heroImage || gallery[0] || template.portrait,
      gallery,
      brideName: content.couple.brideShortName || content.couple.brideFullName,
      groomName: content.couple.groomShortName || content.couple.groomFullName,
      date: content.couple.date,
      time: content.couple.time,
      venue: content.venue.address,
      schedule: content.schedule,
    }];
  });

  const preferredSource = sources.find((source) => source.slug === "cherry-blossom-pink") ?? sources[0];
  if (!preferredSource) return null;

  return (
    <NextIntlClientProvider locale="vi" messages={{ templateStudio: viMessages.templateStudio }}>
      <TemplateStudio
        sources={sources}
        initialSpec={createInitialStudioSpec(preferredSource.slug, {
          eyebrow: viMessages.templateStudio.initialEyebrow,
          quote: viMessages.templateStudio.initialQuote,
          closing: viMessages.templateStudio.initialClosing,
        })}
        aiConnection={aiConnection}
      />
    </NextIntlClientProvider>
  );
}