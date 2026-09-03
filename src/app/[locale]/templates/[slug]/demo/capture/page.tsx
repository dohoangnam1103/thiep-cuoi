import { PublicTemplateDemo } from "@/components/public-template-demo";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default function CapturePage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  return <PublicTemplateDemo params={params} captureMode />;
}
