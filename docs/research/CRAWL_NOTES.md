# Crawl Notes — chungdoi.com Template Cloning

Hard-won gotchas from crawling and cloning chungdoi.com demo templates (first done for
`song-phung-do` / `double-phoenix-red`). Read this before crawling the next template so we
don't re-solve the same problems. Each entry is **symptom → cause → fix**.

The pipeline, stage by stage:
1. `scripts/crawl-chungdoi.mjs` — listing pages + preview images → `src/data/chungdoi.ts`
2. `scripts/crawl-chungdoi-demo-content.mjs` — per-template demo content (couple, families,
   schedule, gallery, wishes, bank, music) → `src/data/chungdoi-demo-content.ts`
3. `scripts/extract-theme-configs.mjs` — visual design tokens from the minified JS bundle →
   `src/data/chungdoi-theme-config.ts`
4. `scripts/extract-original-dom.mjs` — rendered DOM + computed CSS vars → `docs/research/original-dom/<slug>/`
5. `scripts/capture-original.mjs` / `compare-layout.mjs` — screenshots + layout measurements
6. `scripts/download-assets.mjs` — per-template asset allowlist (currently hand-maintained)

---

## Slugs & identifiers

- **The Vietnamese URL slug is NOT the internal slug.** `song-phung-do` (URL) maps to
  `double-phoenix-red` (internal), and the theme asset folder is a THIRD name: `songphung-red`.
  There are three naming spaces — route slug, internal slug, and asset folder — and they rarely
  match. The `vietnameseTemplateSlugs` map in `src/data/chungdoi.ts` is the source of truth for
  route↔internal; the asset folder must be discovered from the HTML (see below).
- **`invitationId` appears in two escaped shapes** in the demo HTML. The regex must try both:
  `invitationId\":\"([a-z0-9-]+)\"` (JSON-in-string escaped) and `"invitationId":"([a-z0-9-]+)"`
  (plain). Missing one shape makes the whole content crawl throw for that template.

## Content API (stage 2)

- **Real content lives behind `api.chungdoi.com`, not in the HTML.** Flow: HTML → `invitationId`
  → `GET api.chungdoi.com/api/invite/{id}` for the structured `invitation.data`, then separate
  calls for `/comments` (wishes) and `/music-tracks/{musicTrackId}` (audio URL). Comments and
  music are optional — wrap them in try/catch and degrade to empty/null, don't let them fail the
  whole template.
- **Localized fields can be a string OR a `{vi, en}` object.** Always run them through a `pick()`
  helper (`vi ?? en ?? first value`). Fields affected: names, addresses, parent titles, ceremony
  header, timeline labels.
- **Gallery is capped at 8 and music is one track** — deliberate, to avoid bloating `public/`.
  Revisit if a template genuinely needs more.

## Theme tokens from the JS bundle (stage 3) — the hardest stage

The per-template visual tokens (background gradient, cardBg, accent, particle colors/type, couple
font, decoration `cardImages`) are **not in the DOM or the API** — they're baked into a minified
webpack chunk. `extract-theme-configs.mjs` parses that chunk. Expect friction:

- **Input is a downloaded JS chunk** (e.g. `/tmp/chunk-*.js`), passed as argv. You must first grab
  the right chunk from the network tab / `_next/static/chunks/`. The config objects start at
  `{theme:{background:` and are extracted by brace-balancing.
- **Configs reference unresolvable asset variables.** Decoration `src` is sometimes a literal
  string, but often a webpack asset-module var like `m.flower`. The script evals config literals in
  a Proxy sandbox that resolves every unknown identifier to a sentinel, then drops srcs that don't
  start with `/images/themes/`. When a decoration goes missing in the clone, this is the first
  suspect — the src was a var that didn't resolve.
- **Not every template has a `themeId` default in its module.** Primary mapping is by
  `themeId:X="slug"`; the fallback maps a config to a slug by matching its decoration **asset
  folder** against `assetFolder` in `chungdoi-demo-content.ts`. Run stage 2 BEFORE stage 3 so that
  fallback map exists.
- **Some modules are merged in the bundle and can't be auto-isolated.** `co-ba-red` shares a module
  with others, so its config is a hand-written entry in `MANUAL_OVERRIDES`. Budget for 1–2 manual
  overrides per crawl batch; the script logs `missing:` slugs — those need manual token extraction
  by reading the bundle.

## Asset downloads (all stages)

- **Always send `User-Agent` + `Referer: https://chungdoi.com/` headers.** Bare fetches get
  blocked/403'd. Every downloader in the pipeline sets these.
- **Assets are split across two origins.** Theme graphics + fonts live on `chungdoi.com`; user
  uploads (wedding photos) and music live on `cdn.chungdoi.com`. Don't assume one host.
- **Filenames contain spaces and must be URL-encoded on fetch.** e.g. `Phuong 2.webp`,
  `CHU HY.webp`, `Phuong line.webp`. The decoration downloader normalizes spaces to `-` for the
  LOCAL path but fetches the REMOTE with the original (encoded) name. Screenshot/measure scripts
  that match `img.src` must check both `CHU%20HY` and `CHU HY`.
- **Fonts are easy to miss.** The wedding display font (`Fz_Qellia_Fix.ttf` for song-phung) wasn't
  in the auto-crawl and had to be added to `download-assets.mjs` by hand. When couple names render
  in the wrong typeface, a font asset is missing.
- **`download-assets.mjs` is a hand-maintained allowlist**, not auto-generated. For a new template,
  add its theme graphics / photos / music / fonts explicitly. This is the manual bottleneck — a
  future improvement is generating it from the stage-2/3 output.

## Rendering & verification with Playwright (stages 4–6)

- **Playwright uses the system Chrome via an explicit `executablePath`**
  (`/Applications/Google Chrome.app/...`), not a bundled browser. If Chrome moves/updates, these
  scripts break.
- **The invitation is behind an "open" gate.** You must click the open button before any content
  renders. Its label varies: `Mở thiệp` / `Open Invitation`. Match with the regex
  `/Mở thiệp|Open Invitation/i` and `click({ force: true })`, with a fallback to "click the first
  button." **Do NOT include `Xác nhận` in the regex** — it also matches the RSVP confirm button
  further down the page, so the matcher can grab the wrong button and never actually open the card.
- **Wait `networkidle` + an extra fixed delay (~1.2–3.5s)** after navigation and after opening.
  The reveal animation and lazy assets need settle time or you screenshot a half-rendered card.

### Verifying scroll-driven parallax — the trap that ate a session

The demo uses **scroll-driven parallax** (decorations, hero phoenixes, flowers translate on
scroll via a `requestAnimationFrame` hook reading `-root.getBoundingClientRect().top`). Two traps:

1. **`scroll-behavior: smooth` defeats programmatic scroll.** Before scrolling in Playwright, set
   `document.documentElement.style.scrollBehavior = 'auto'`. Then set BOTH `window.scrollTo(0,N)`
   and `document.documentElement.scrollTop = N`.
2. **Transforms are stale unless a scroll event fires.** The rAF hook only recomputes on `scroll`.
   After moving the scroll position, `window.dispatchEvent(new Event('scroll'))` and wait ~2 rAF
   frames, THEN read `el.style.transform`. Skip this and you read transforms from an old scroll
   offset (we once decoded a bogus `scrolled≈4901`).

3. **Never claim a visual feature works from computed values alone.** A changing transform matrix
   is not proof the user can see the effect (layers can be `opacity:0.1` or off-screen). Take a
   real screenshot at the target scroll position and LOOK at it. See
   `memory/feedback_verify_visually.md`. For parallax specifically: capture at scroll 0 and at a
   scrolled position and confirm layers actually moved relative to content.

### Legible per-region verification — element-scoped screenshots (nhat-binh-do)

Full-page screenshots at mobile width (~420px) render text too small to read, and
device-resolution full-page captures are too cluttered to judge a single section. Programmatic
scroll-to-section is also unreliable (repeatedly captured the header instead of the target). The
technique that works:

1. `browser_snapshot` (depth ~12) to get element refs for the regions you care about.
2. `browser_take_screenshot` with `element` + `target` (the ref, e.g. `f120e26`) and
   `scale:'device'` to capture just that region at legible resolution.

This gave clean, readable per-section captures (header region, "Thông Tin Lễ Cưới" info section)
and is the reliable way to verify a specific block instead of fighting scroll position.

## Known visual discrepancies to check on every template

These bit us on song-phung-do and are easy to miss because computed values look "fine":
- **Footer closing message** should sit inside a full-width dark banner using the template's accent
  color (`#710001` for song-phung), not plain text on the page background.
- **Hero decorations have parallax too**, not just body decorations — the two hero phoenixes
  counter-move (negative speed on one side, positive + `scaleX(-1)` flip on the other).
- **Background is base color + a paper texture** (`NENGIAY.jpg` at ~0.3 opacity), not a flat fill.
  Perceived background color can look "off" if the texture layer is missing or wrong opacity.
- **The base card background can be pure white (`#ffffff`), not a warm/cream tint.** We spent a
  session convinced song-phung-do's card was cream (`#fff0e7`); it is actually white. The paper
  texture layer adds the only warmth. Sample the base color from a SETTLED, fully-opened screenshot
  (post reveal animation) — an early capture mid-animation reads the wrong color.

## Workflow / process notes

- **On simple, well-scoped changes, act directly — don't over-investigate.** For a change like
  "swap the card background color", edit the constant and take ONE confirmation screenshot. Do not
  launch a lengthy pixel-sampling investigation; the user called this out explicitly ("sao mày chậm
  thế chỉ là thay background color thôi mà"). Reserve deep investigation for genuinely ambiguous
  fidelity problems.

## Suggested run order for a new template

1. Ensure the route↔internal slug pair is in `src/data/chungdoi.ts` (`vietnameseTemplateSlugs`).
2. `node scripts/crawl-chungdoi-demo-content.mjs` (writes content + downloads theme/gallery/music).
3. Grab the JS chunk, then `node scripts/extract-theme-configs.mjs /tmp/<chunk>.js`; resolve any
   `missing:` slugs manually.
4. Add any missing fonts / hand-picked assets to `scripts/download-assets.mjs` and run it.
5. `node scripts/extract-original-dom.mjs <vnSlug> <internalSlug>` for ground-truth DOM + CSS vars.
6. Build the component, then verify 1:1 with real screenshots (open the invitation, scroll, and
   look — don't trust computed values). Check the three discrepancies above.
