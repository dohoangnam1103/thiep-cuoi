import vi from "@messages/vi.json";

export type Site2PricingMode = "contact" | "fixed";

export type Site2Pricing = {
  mode: Site2PricingMode;
  planName: string;
  priceLabel: string;
  periodLabel: string;
  ctaHref: string;
  features: readonly string[];
};

/* Single server-owned source of truth for the site-2 plan card. Until a paid
 * plan config lands, the plan stays contact-sales: the page shows the contact
 * label and never an invented numeric price. */
export function getSite2Pricing(input: {
  templateCount: number;
  ctaHref: string;
}): Site2Pricing {
  return {
    mode: "contact",
    planName: vi.pricing.planName,
    priceLabel: vi.pricing.planPrice,
    periodLabel: vi.pricing.planPeriod,
    ctaHref: input.ctaHref,
    features: vi.pricing.features.map((feature) =>
      feature.replace("{count}", String(input.templateCount)),
    ),
  };
}
