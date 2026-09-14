import Link from "next/link";

import { getVisibleCatalogTemplates } from "../../lib/catalog";
import vi from "@messages/vi.json";

export default async function Site2TemplateListing() {
  const templates = await getVisibleCatalogTemplates();
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-16">
      <h1 className="text-center text-3xl font-bold">{vi.templates.title}</h1>
      <p className="mt-2 text-center opacity-70">{vi.templates.subtitle}</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <li
            key={template.slug}
            data-testid="template-card"
            className="overflow-hidden rounded-2xl border border-[#e5dcc8] bg-white/60"
          >
            {template.listing ? (
              <img
                src={template.listing}
                alt=""
                aria-hidden
                loading="lazy"
                className="block aspect-[4/3] w-full object-cover"
              />
            ) : null}
            <div className="p-6">
              <h2 className="text-xl font-bold">{template.name}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed opacity-80">
                {template.description}
              </p>
              <Link
                href={`/mau-thiep/${template.slug}/demo`}
                className="mt-4 inline-block text-sm font-semibold underline"
              >
                {vi.templates.demoCta}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
