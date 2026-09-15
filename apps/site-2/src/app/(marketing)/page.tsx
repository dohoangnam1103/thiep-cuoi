import { getVisibleCatalogTemplates } from "../../lib/catalog";
import { CreateSteps } from "../../components/marketing/create-steps";
import { CuratedTemplates } from "../../components/marketing/curated-templates";
import { FinalCta } from "../../components/marketing/final-cta";
import { HomeHero } from "../../components/marketing/home-hero";
import { ProductStory } from "../../components/marketing/product-story";

export default async function Site2Home() {
  const visible = await getVisibleCatalogTemplates();
  const curated = visible.slice(0, 7);
  return (
    <div className="s2-marketing-container pb-20">
      <HomeHero templates={curated.slice(0, 2)} totalCount={visible.length} />
      <CuratedTemplates templates={curated.slice(2)} />
      <ProductStory />
      <CreateSteps />
      <FinalCta />
    </div>
  );
}
