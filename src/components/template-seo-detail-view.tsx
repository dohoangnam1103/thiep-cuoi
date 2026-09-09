import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Check } from "lucide-react";

import type { TemplateSeoDetailContent } from "@/data/template-seo-details";
import { absoluteUrl } from "@/lib/site-url";
import { TemplateFullPreview } from "@/components/template-full-preview";

export const TEMPLATE_DETAIL_PREVIEW_WIDTH = 2400;
export const TEMPLATE_DETAIL_PREVIEW_HEIGHT = 1260;

type DetailLink = { name: string; href: string; image: string; imageAlt: string };
export type TemplateDetailViewProps = {
  copy: TemplateSeoDetailContent;
  labels: Record<"breadcrumbAriaLabel" | "templateEyebrow" | "previewHint" | "aboutDesign" | "preview" | "home" | "templates" | "demo" | "highlights" | "suitableFor" | "features" | "steps" | "faq" | "relatedTemplates" | "relatedBlog", string>;
  locale: string;
  homeHref: string;
  listingHref: string;
  detailHref: string;
  demoHref: string;
  image: string;
  fullPreviewImage: string;
  createCta: ReactNode;
  relatedTemplates: DetailLink[];
  relatedBlog: Array<{ name: string; href: string }>;
};

export function templateDetailJsonLd(props: TemplateDetailViewProps) {
  const { copy, labels, locale, image, detailHref, relatedTemplates } = props;
  const url = absoluteUrl(detailHref);
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": url, name: copy.heading, description: copy.metaDescription, url, inLanguage: locale, primaryImageOfPage: { "@id": `${url}#preview` }, breadcrumb: { "@id": `${url}#breadcrumb` } },
      { "@type": "ImageObject", "@id": `${url}#preview`, url: absoluteUrl(image), contentUrl: absoluteUrl(image), caption: copy.imageAlt, width: TEMPLATE_DETAIL_PREVIEW_WIDTH, height: TEMPLATE_DETAIL_PREVIEW_HEIGHT },
      { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: [
        { "@type": "ListItem", position: 1, name: labels.home, item: absoluteUrl(props.homeHref) },
        { "@type": "ListItem", position: 2, name: labels.templates, item: absoluteUrl(props.listingHref) },
        { "@type": "ListItem", position: 3, name: copy.heading, item: url },
      ] },
      { "@type": "ItemList", name: labels.relatedTemplates, numberOfItems: relatedTemplates.length, itemListElement: relatedTemplates.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, url: absoluteUrl(item.href) })) },
      { "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: copy.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    ],
  };
}

/** Pure server HTML, also exercised without hydration in unit and browser tests. */
export function TemplateSeoDetailView(props: TemplateDetailViewProps) {
  const { copy, labels, relatedTemplates, relatedBlog } = props;
  const introParagraphs = copy.intro.split(/\n\s*\n/).filter(Boolean);
  const heroIntro = introParagraphs.length > 1 ? introParagraphs[0] : null;
  const bodyIntroParagraphs = heroIntro ? introParagraphs.slice(1) : introParagraphs;
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(templateDetailJsonLd(props)).replace(/</g, "\\u003c") }} />
      <nav aria-label={labels.breadcrumbAriaLabel} className="mb-6 flex flex-wrap gap-2 text-sm text-muted-foreground">
        <Link href={props.homeHref} className="hover:text-primary">{labels.home}</Link><span aria-hidden="true">/</span>
        <Link href={props.listingHref} className="hover:text-primary">{labels.templates}</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{copy.heading}</span>
      </nav>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:items-start lg:gap-12">
        <figure className="lg:sticky lg:top-24">
          <TemplateFullPreview src={props.fullPreviewImage} alt={copy.imageAlt} label={labels.preview} className="max-h-[68svh] lg:max-h-[760px]" />
          <figcaption className="mt-3 text-center text-xs text-muted-foreground">{labels.previewHint}</figcaption>
        </figure>
        <div className="flex flex-col">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{labels.templateEyebrow}</p>
          <h1 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{copy.heading}</h1>
          {heroIntro ? <p className="mt-5 text-base leading-7 text-muted-foreground">{heroIntro}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={props.demoHref} data-ga-event="open_template_demo" data-ga-param-source="template_detail" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 font-semibold transition-colors hover:bg-muted">{labels.demo}<ArrowUpRight aria-hidden="true" className="size-4" /></Link>
            {props.createCta}
          </div>
          <section className="mt-8 border-t border-border/70 pt-6" aria-labelledby="template-highlights">
            <h2 id="template-highlights" className="text-xl font-semibold">{labels.highlights}</h2>
            <ul className="mt-4 space-y-3 leading-6 text-muted-foreground">{copy.highlights.map((item) => <li key={item} className="flex gap-3"><Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" /><span>{item}</span></li>)}</ul>
          </section>
          <div className="mt-6 flex flex-wrap gap-2" aria-label={labels.suitableFor}>{copy.suitableFor.map((item) => <span key={item} className="rounded-full bg-primary/8 px-3 py-1.5 text-sm text-primary">{item}</span>)}</div>
        </div>
      </section>

      <section className="mt-14 border-t border-border/70 pt-10" aria-labelledby="template-about">
        <h2 id="template-about" className="text-2xl font-semibold">{labels.aboutDesign}</h2>
        <div className="mt-4 max-w-3xl space-y-4 text-base leading-8 text-muted-foreground">{bodyIntroParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      </section>

      <section className="mt-12 grid gap-10 border-t border-border/70 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <h2 className="text-2xl font-semibold">{labels.features}</h2>
          <ul className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">{copy.features.map((item) => <li key={item} className="flex gap-3 leading-6 text-muted-foreground"><Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" /><span>{item}</span></li>)}</ul>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{labels.steps}</h2>
          <ol className="mt-5 space-y-4">{copy.steps.map((item, index) => <li key={item} className="flex gap-4"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{index + 1}</span><span className="leading-6 text-muted-foreground">{item}</span></li>)}</ol>
        </div>
      </section>

      <section className="mt-12 border-t border-border/70 pt-10" id="faq" aria-labelledby="template-faq">
        <h2 id="template-faq" className="text-2xl font-semibold">{labels.faq}</h2>
        <div className="mt-5 divide-y divide-border/70 border-y border-border/70">{copy.faq.map((item, index) => <details key={item.question} open={index === 0} className="group py-4"><summary className="cursor-pointer list-none pr-8 font-semibold marker:hidden [&::-webkit-details-marker]:hidden">{item.question}</summary><p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{item.answer}</p></details>)}</div>
      </section>

      <section className="mt-12 border-t border-border/70 pt-10" aria-labelledby="related-templates">
        <h2 id="related-templates" className="text-2xl font-semibold">{labels.relatedTemplates}</h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-3">{relatedTemplates.map((item) => <li key={item.href}><Link href={item.href} className="group block overflow-hidden rounded-2xl border border-border/70 transition-shadow hover:shadow-md"><Image src={item.image} alt={item.imageAlt} width={480} height={252} sizes="(max-width: 640px) 100vw, 33vw" className="aspect-[1.9] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" /><span className="block p-4 text-sm font-semibold leading-5">{item.name}</span></Link></li>)}</ul>
      </section>
      {relatedBlog.length > 0 ? <section className="mt-12"><h2 className="text-2xl font-semibold">{labels.relatedBlog}</h2><ul className="mt-4 space-y-3">{relatedBlog.map((item) => <li key={item.href}><Link href={item.href} className="text-primary underline underline-offset-4">{item.name}</Link></li>)}</ul></section> : null}
    </main>
  );
}
