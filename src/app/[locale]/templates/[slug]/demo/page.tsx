import { PublicTemplateDemo, publicDemoMetadata } from "@/components/public-template-demo";
import type { Locale } from "@/i18n/routing";

// No demo content from the build database is shipped as public HTML.
export function generateStaticParams() { return []; }
export const revalidate = 300;
export const generateMetadata = publicDemoMetadata;

export default function DemoPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  return <PublicTemplateDemo params={params} />;
}
