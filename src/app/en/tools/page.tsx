import type { Metadata } from "next";

import { ChungDoiTools } from "@/components/chungdoi-tools";

export const metadata: Metadata = {
  title: "Free Wedding Tools | ChungDoi Clone",
  description: "Free wedding tools: Save the Date photo maker, AI message assistant, QR code generator, image and video compressor. No signup required.",
  alternates: { canonical: "/en/tools" },
};

export default function ToolsPage() {
  return <ChungDoiTools />;
}
