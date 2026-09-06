import {
  createTemplateDemoContent,
  defineTemplateManifest,
  type TemplateListingMessage,
  type TemplateManifestLocale,
} from "./template-manifest";
import type { ArtOpeningEffect } from "./opening-effect";

type ArtTemplateManifestInput<TSlug extends string> = {
  slug: TSlug;
  viRouteSlug: string;
  rendererExport: string;
  heroImageCount: 1 | 2;
  name: string;
  title: string;
  description: string;
  category: string;
  color: string;
  highlights: [string, string, string];
  artwork: string;
  openingEffect: ArtOpeningEffect;
  outer: string;
  card: string;
  ink: string;
  muted: string;
  accent: string;
  buttonText: string;
  fontFamily: string;
  particleType: string;
  gallerySlug: "arch-sage" | "editorial-noir" | "ticket-terracotta" | "zen-sand";
  music: string;
  i18n: Record<TemplateManifestLocale, TemplateListingMessage>;
};

export function createArtTemplateManifest<const TSlug extends string>(
  input: ArtTemplateManifestInput<TSlug>,
) {
  return defineTemplateManifest({
    slug: input.slug,
    viRouteSlug: input.viRouteSlug,
    rendererExport: input.rendererExport,
    ceremonyRendering: "inline-all",
    heroImageCount: input.heroImageCount,
    catalog: {
      name: input.name,
      title: input.title,
      description: input.description,
      category: input.category,
      color: input.color,
      isNew: true,
      highlights: input.highlights,
    },
    theme: {
      theme: {
        background: input.outer,
        cardBg: input.card,
        textPrimary: input.ink,
        textSecondary: input.muted,
        accent: input.accent,
        dividerFrom: "transparent",
        dividerTo: input.muted,
        buttonBg: input.accent,
        buttonText: input.buttonText,
        guestBoxBg: input.card,
        guestBoxBorder: input.muted,
        particleColors: [input.accent, input.ink, input.card],
        particleType: input.particleType,
      },
      fonts: {
        couple: input.fontFamily,
        ampersand: null,
      },
      sealType: "heart",
      decorations: {
        cardImages: [
          {
            src: input.openingEffect.plateSrc,
            className: "h-full w-full inset-0 object-cover opacity-20",
            flyOnOpen: false,
          },
        ],
      },
      openingEffect: input.openingEffect,
    },
    demoContent: createTemplateDemoContent({
      slug: input.slug,
      primaryColor: input.accent,
      fontFamily: input.fontFamily,
      gallerySlug: input.gallerySlug,
      music: input.music,
    }),
    i18n: input.i18n,
    assets: [
      input.artwork,
      input.openingEffect.plateSrc,
      ...input.openingEffect.layers.map((layer) => layer.src),
      input.music,
    ],
  });
}
