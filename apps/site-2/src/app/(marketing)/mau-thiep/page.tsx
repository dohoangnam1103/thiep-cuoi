import { getVisibleCatalogTemplates, toListingItem } from "../../../lib/catalog";
import { TemplateListingClient } from "../../../components/template-listing-client";
import vi from "@messages/vi.json";

export default async function Site2TemplateListing() {
  const templates = await getVisibleCatalogTemplates();
  const items = templates.map(toListingItem);
  const categories = [
    ...new Map(items.map((item) => [item.category, item.categoryVi])).entries(),
  ].map(([value, label]) => ({ value, label }));
  return (
    <div className="s2-marketing-container pb-20 pt-10 md:pt-14">
      <h1 className="s2-display max-w-[18ch] text-4xl font-semibold leading-[1.08] tracking-tight text-[var(--s2-ink)] md:text-6xl">
        {vi.templates.title}
      </h1>
      <p className="mt-4 max-w-[56ch] text-[15px] leading-relaxed text-[var(--s2-muted)]">
        {vi.templates.subtitle}
      </p>
      <div className="mt-8">
        <TemplateListingClient items={items} categories={categories} />
      </div>
    </div>
  );
}
