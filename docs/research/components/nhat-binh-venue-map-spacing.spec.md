# Nhat Binh Venue Map Spacing Specification

## Overview
- **Target file:** `src/components/chungdoi-demo.tsx`
- **Section:** Nhat Binh invitation, venue/map block after RSVP confirm button
- **Interaction model:** Static venue information and embedded Google map

## Original Measurements
- Confirm button bottom to venue title top: about `94px` at `1000px` viewport.
- Venue section class from original: `py-[10px] md:py-[15px] lg:py-[20px] relative w-full px-2 md:px-10`.
- Bottom corner decorations around the RSVP section:
  - Original bottom corner rect at `1000px` viewport: top about `191px`, bottom about `295px`.
  - Original spacing from confirm button bottom to corner bottom: about `35px`.
  - Original spacing from corner bottom to venue title top: about `59px`.
  - Local RSVP section needs `bottom-[20px]` for these two bottom corner wrappers to match that visual position.
- Venue title:
  - tag: `h3`
  - font: `SVN-HC Built Titling`
  - size: `30px` mobile, `35px` desktop md, `45px` lg
  - color: `rgb(195, 42, 41)`
  - text transform: uppercase
  - letter spacing: `0.02em`
- Address:
  - class: `mx-auto mt-2 max-w-[280px] whitespace-pre-line text-center text-[15px] md:mt-3 md:max-w-md md:text-[18px] lg:max-w-lg lg:text-[20px] leading-snug`
  - color: `rgb(84, 46, 8)`
  - font: `HelveticaNeue`
- Map iframe:
  - margin-top: `8px`
  - size: `h-[240px] max-w-[338px]`, `md:h-[320px] md:max-w-[560px]`, `lg:h-[340px] lg:max-w-[600px]`
  - border radius: `15px`

## Clone Rule
- Do not render this title as a small brown generic `h3`.
- Keep a top spacer before this section so the title does not visually collide with the RSVP/corner block above.
- At desktop, use `mt-6` plus the original section vertical padding to match the observed distance from the confirm button to the venue heading.
