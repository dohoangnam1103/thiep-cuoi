import { getVisibleCatalogTemplates, hasListingThumbnail, toListingItem } from "../../lib/catalog";
import vi from "@messages/vi.json";
import "../../styles/home.css";
import { HomeHero } from "../../components/marketing/home/home-hero";
import { HomeLivePreview } from "../../components/marketing/home/home-live-preview";
import { HomeGallery } from "../../components/marketing/home/home-gallery";
import { HomeSteps } from "../../components/marketing/home/home-steps";
import { HomeStory } from "../../components/marketing/home/home-story";
import { HomeFinale } from "../../components/marketing/home/home-finale";
import { HomeMotion } from "../../components/marketing/home/home-motion";
import { HomeDetails } from "../../components/marketing/home/home-details";
import artwork from "../../components/marketing/home/home-artwork.json";

export default async function Site2Home() {
  const visible = await getVisibleCatalogTemplates();
  const items = visible.map(toListingItem);
  const withArt = items.filter((item) => hasListingThumbnail(item.listing));
  const prepared = Object.keys(artwork).flatMap((listing) => items.filter((item) => item.listing === listing));
  const pool = prepared.length ? prepared : withArt;
  const styles = [...new Set(items.map((item) => item.categoryVi))].slice(0, 5);
  return (
    <HomeMotion>
      <div className="s2-home-container">
        <HomeHero />
        <ul className="s2-home-styles" aria-label={vi.home.marqueeLabel}>
          {styles.map((style) => <li key={style}>{style}</li>)}
        </ul>
        <HomeGallery templates={pool} totalCount={items.length} />
        <HomeLivePreview />
        <HomeSteps />
        <HomeStory />
        <HomeDetails />
        <HomeFinale />
      </div>
    </HomeMotion>
  );
}
