import { completedTemplates } from "@/data/chungdoi";
import { getAccountSessionUserId } from "@/lib/auth/anonymous-account";
import { getTemplateLabels } from "@/lib/template-labels";
import { Editor2Start } from "@/components/editor2/start";

export default async function Editor2StartPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const { template } = await searchParams;
  const templateId = completedTemplates.find(item => item.slug === template)?.slug ?? "song-hy-red";
  const labels = await getTemplateLabels();
  return <Editor2Start templateId={templateId} templateLabel={labels[templateId] ?? templateId} isAccount={Boolean(await getAccountSessionUserId())} />;
}
