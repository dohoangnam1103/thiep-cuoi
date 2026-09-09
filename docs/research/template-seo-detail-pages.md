# Template SEO detail pages

URL contract: `/mau-thiep/[slug]` is the indexable Vietnamese detail page for all 70 non-retired completed templates. `/mau-thiep/[slug]/demo` remains crawlable for its `noindex,follow` metadata and canonicalizes to the detail page. Five templates have authored catalog copy; the remaining entries use a deterministic Vietnamese resolver grounded in the cloned ChungDoi fields.

The sitemap includes all 70 detail URLs. Template aliases and old `/templates` paths redirect in one hop; `/demo` aliases preserve the demo suffix. The two retired templates are excluded.

The authored copy is stored in `messages/vi.json` under `templateSeoDetails`. The catalog now contains all 70 active template slugs: five original pilot entries, 53 entries researched from Chung Đôi detail pages, and 12 entries whose old Chung Đôi URLs no longer resolve. The crawler is kept in `scripts/crawl-template-seo-details.mjs`; its raw crawl report is written to the ignored `tmp/` directory so source HTML is not committed.

The 53 successful crawls supplied artwork descriptions, highlights, suitable-use notes, feature lists, and FAQ facts. These were edited into the Vietnamese catalog and Chung Đôi branding, trial, and free-offer claims were removed. For the 12 HTTP 404 sources (`minimalism-jade`, `minimalism-sky-blue`, `minimalism-powder-pink`, `maroon-love`, `ban-ve-to-am`, `hai-yen-thanh-thu`, `coi-trau-kham-trai`, `cong-la-dua-mien-tay`, `hy-uoc`, `nguyet-bach`, `to-hong`, and `uyen-uong`), copy uses the local template manifest and preview artwork instead of pretending that a current Chung Đôi page was crawled. The detail-content test validates every enabled slug, title/description length, internal related-template links, and absence of source-brand/trial claims.

No Search Console inspection has been run in this local implementation.
