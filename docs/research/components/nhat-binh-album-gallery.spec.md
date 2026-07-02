# Nhat Binh Album Gallery Specification

## Overview
- **Target file:** `src/components/chungdoi-demo.tsx`
- **Section:** Nhat Binh invitation, "Album Ảnh Cưới"
- **Interaction model:** Static gallery preview with hover image scale

## DOM Structure
- Section wrapper inside the centered Nhat Binh card.
- Heading: `Album Ảnh Cưới`.
- Gallery grid: 2 columns.
- Gallery item: square image card with rounded corners and thin brown border.
- Last visible gallery item receives an overlay when hidden images remain.

## Content Rule
- Show exactly the first 4 gallery images.
- Hide all remaining images from the preview grid.
- If the total gallery length is greater than 4, render `+N` on the fourth image, where `N = gallery.length - 4`.

## Computed/Implementation Styles
- Grid max width: `560px`.
- Grid columns: `repeat(2, minmax(0, 1fr))`.
- Gap: `12px` mobile, `16px` at `md`.
- Card aspect ratio: `1 / 1`.
- Card border radius: `12px`.
- Card image fit: `object-cover`.
- Hover behavior: image scales to `1.03` over `200ms`.
- Overlay: absolute inset, black at 55% opacity, centered white bold count text.

## Original Behavior
- The live original shows a 2x2 preview only.
- The fourth image is darkened and displays the count of additional hidden images, for example `+6`.

## Verification
- At desktop width, the section should show 4 image cards before "Thông Tin Tiệc Cưới".
- No fifth or sixth visible card should appear in the album preview.
