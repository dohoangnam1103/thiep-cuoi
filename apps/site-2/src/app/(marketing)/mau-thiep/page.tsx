import { getVisibleCatalogTemplates } from "../../../lib/catalog";
import { TemplateListingClient } from "../../../components/template-listing-client";
import vi from "@messages/vi.json";

export default async function Site2TemplateListing() {
  const templates = await getVisibleCatalogTemplates();
  const categories = [...new Set(templates.map((item) => item.category))];
  return (
    <div className="s2-marketing-container pb-20 pt-10 md:pt-14">
      <h1 className="max-w-[18ch] text-3xl font-extrabold tracking-tight text-[var(--s2-ink)] md:text-5xl">
        {vi.templates.title}
      </h1>
      <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-[var(--s2-muted)]">
        {vi.templates.subtitle}
      </p>
      <div className="mt-8">
        <TemplateListingClient
          items={templates.map((item) => ({
            slug: item.slug,
            name: item.name,
            description: item.description,
            category: item.category,
            listing: item.listing,
            portrait: item.portrait,
          }))}
          categories={categories}
        />
      </div>
    </div>
  );
}
