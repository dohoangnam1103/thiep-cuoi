import vi from "@messages/vi.json";

import { getSite2PlanAmount } from "../features/payment/dal";

export type Site2PricingMode = "contact" | "fixed";

export type Site2Pricing = {
  mode: Site2PricingMode;
  planName: string;
  priceLabel: string;
  periodLabel: string;
  ctaHref: string;
  features: readonly string[];
};

const amountFormatter = new Intl.NumberFormat("vi-VN");

/* Single server-owned source of truth for the site-2 plan card. The plan is
 * fixed-price: the amount comes from the SITE2_PLAN_PRICE config shared with
 * the payment flow, never invented in copy. The 99000 fallback mirrors the
 * documented plan price so local previews without payment env still show the
 * real number. */
export function getSite2Pricing(input: {
  templateCount: number;
  ctaHref: string;
  planAmount?: number | null;
}): Site2Pricing {
  const amount = input.planAmount ?? getSite2PlanAmount() ?? 99000;
  return {
    mode: "fixed",
    planName: vi.pricing.planName,
    priceLabel: `${amountFormatter.format(amount)} ₫`,
    periodLabel: vi.pricing.planPeriod,
    ctaHref: input.ctaHref,
    features: vi.pricing.features.map((feature) =>
      feature.replace("{count}", String(input.templateCount)),
    ),
  };
}
