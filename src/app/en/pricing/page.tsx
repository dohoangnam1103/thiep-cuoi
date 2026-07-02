import type { Metadata } from "next";

import { ChungDoiPricing } from "@/components/chungdoi-pricing";

export const metadata: Metadata = {
  title: "Pricing | ChungDoi Clone",
  description: "ChungDoi online wedding invitation pricing: one-time payment, no hidden fees, free 3-day trial.",
  alternates: { canonical: "/en/pricing" },
};

export default function EnglishPricingPage() {
  return <ChungDoiPricing />;
}
