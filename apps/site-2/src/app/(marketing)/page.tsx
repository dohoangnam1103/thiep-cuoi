import { getVisibleCatalogTemplates, hasListingThumbnail, toListingItem } from "../../lib/catalog";
import { CategoryMarquee } from "../../components/marketing/category-marquee";
import { HomeHero } from "../../components/marketing/home/home-hero";
import { HomeLivePreview } from "../../components/marketing/home/home-live-preview";
import { HomeGallery } from "../../components/marketing/home/home-gallery";
import { HomeSteps } from "../../components/marketing/home/home-steps";
import { HomeStory } from "../../components/marketing/home/home-story";
import { HomeFinale } from "../../components/marketing/home/home-finale";
import { HomeMotion } from "../../components/marketing/home/home-motion";

export default async function Site2Home() {
  const visible = await getVisibleCatalogTemplates();
  const items = visible.map(toListingItem);
  const withArt = items.filter((item) => hasListingThumbnail(item.listing));
  const pool = withArt.length >= 7 ? withArt : items;
  const cover = pool[0];
  const styles = [...new Set(items.map((item) => item.categoryVi))].slice(0, 10);
  if (!cover) return null;
  return (
    <div className="pb-20">
      {/* GSAP choreography — client-only, no-op under reduced motion */}
      <HomeMotion />

      <div className="s2-marketing-container">
        <HomeHero cover={cover} totalCount={items.length} />
      </div>
      <CategoryMarquee labels={styles} />
      <div className="s2-marketing-container">
        <HomeLivePreview />
        <div data-home-gallery>
          <HomeGallery templates={pool} />
        </div>
        <div data-home-steps>
          <HomeSteps />
        </div>
        <HomeStory />
        <HomeFinale />
      </div>
    </div>
  );
}
