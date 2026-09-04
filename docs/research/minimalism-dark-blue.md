# Minimalism Xanh Đậm — visual clone note

- Reference: `https://chungdoi.com/vi/mau-thiep/minimalism-xanh-dam/demo`
- Inspected: 2026-09-04 (Asia/Ho_Chi_Minh)
- Reference viewports: desktop `1440×900`, mobile `390×844`
- Local acceptance viewports: `1440×900`, `390×844`, `320×700`
- Reference captures from the inspection run: `/tmp/minimalism-xanh-dam-ref/`
- Local captures from the acceptance run: `/tmp/minimalism-xanh-dam-local/`

## Structure and measurements

The opened invitation is centered in a `900px` desktop canvas and fills the
`390px` mobile viewport. Its observed reference heights were `5887px` desktop
and `4860px` mobile. The local clone measured `5624px` desktop and `4875px`
mobile; the desktop difference is mostly the map/venue whitespace and source
runtime content rather than a horizontal scale change.

Section order: opening cover, Save The Date hero, ceremony card, coverflow
album, reception/countdown/calendar card, venue/map, dress code, schedule,
guestbook, gift envelope, footer.

The source palette is navy `#00224c`, deep navy `#001531`, warm paper
`#f7f3eb`/`#ece4d8`, muted blue `#3f6ea8`, and gold `#c9a24a`. The main cards
use small rounded corners and a subtle right/down shadow. Display names use a
high-contrast calligraphic serif; secondary information is compact uppercase
serif text.

Source artwork was copied to
`public/chungdoi/images/themes/minimalism-dark-blue/`. Important native sizes:

- paper `1333×2000`; main castle watermark `1254×1254`
- envelope back `851×984`; envelope front `849×562`
- flower branches: `429×840`, `483×1011`, `599×798`, `416×624`, `446×669`
- schedule art: church `306×310`, cake `267×400`, cook `400×267`
- gift envelope `420×610`

The hero's containing block is the renderer's centered envelope frame, not the
full `900px` canvas. The two polaroids are positioned inside that frame before
the envelope front and floral foreground layers.

## Acceptance checklist

- **Đã kiểm tra — cover/effect:** source and local covers were captured at
  `390×844`; both open successfully and use the navy floral theme. The local
  shared cover includes the app's guest greeting/CTA and is consequently taller
  than the current source demo cover. This is a known shared-shell difference,
  not hidden in the acceptance capture.
- **Đã kiểm tra — hero:** paired photos, envelope layers, flower foreground,
  names and paper/castle background render on desktop/mobile/320px without
  horizontal overflow.
- **Đã kiểm tra — ceremony and reception:** content, dates, lunar labels,
  countdown and six-row-capable calendar remain inside their navy cards.
- **Đã kiểm tra — album:** nine-photo coverflow renders; clicking a gallery
  image opens the shared lightbox.
- **Đã kiểm tra — venue:** address is present. The local capture did not include
  external Google Maps tiles, so map pixel fidelity remains unverified.
- **Đã kiểm tra — guestbook:** source-specific white card styling is present;
  empty submission returns `Vui lòng nhập tên của bạn.` No test wish was sent
  to the reference site.
- **Đã kiểm tra — gift:** the exact `minimalism_darkblue.webp` artwork is
  registered. Opening the local envelope shows two QR cards and both Save QR
  actions; the reference modal was also opened and captured.
- **Đã kiểm tra — footer:** navy text and watermark scene are visible through
  the bottom of the 390px and 320px captures without clipping.
- **Đã kiểm tra — catalog/editor:** manifest registration supplies route,
  catalog, demo data, theme tokens and a two-image hero capability. Preview
  files exist at `384×4900`, `750×1333`, and `2400×1260`.
- **Đã kiểm tra — static verification:** `npm run typecheck` passes; manifest,
  renderer, editor capability and listing-thumbnail tests pass. Full lint is
  currently red from pre-existing repository-wide findings (63,117 findings),
  including `src/components/chungdoi-tpl-shared.tsx:278`, outside this clone.
