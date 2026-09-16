import { getVisibleCatalogTemplates, hasListingThumbnail, toListingItem } from "../../lib/catalog";
import { CategoryMarquee } from "../../components/marketing/category-marquee";
import { CreateSteps } from "../../components/marketing/create-steps";
import { CuratedTemplates } from "../../components/marketing/curated-templates";
import { FinalCta } from "../../components/marketing/final-cta";
import { HomeHero } from "../../components/marketing/home-hero";
import { ProductStory } from "../../components/marketing/product-story";

export default async function Site2Home() {
  const visible = await getVisibleCatalogTemplates();
  const items = visible.map(toListingItem);
  const withArt = items.filter((item) => hasListingThumbnail(item.listing));
  const pool = withArt.length >= 7 ? withArt : items;
  const cover = pool[0];
  const curated = pool.slice(1, 7);
  const styles = [...new Set(items.map((item) => item.categoryVi))].slice(0, 10);
  if (!cover) return null;
  return (
    <div className="pb-20">
      <div className="s2-marketing-container">
        <HomeHero cover={cover} totalCount={items.length} />
      </div>
      <CategoryMarquee labels={styles} />
      <div className="s2-marketing-container">
        <CuratedTemplates templates={curated} />
        <ProductStory />
        <CreateSteps />
        <FinalCta />
      </div>
    </div>
  );
}
