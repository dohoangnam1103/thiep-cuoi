# Responsive couple names in Elegant Leaf Green

**Date:** 2026-08-20

## Goal

Keep couple full names on one line on desktop in Elegant Leaf Green. Avoid false wrapping when content column has ample width. Preserve current safe wrapping behavior on mobile.

## Scope

- `src/components/chungdoi-tpl-elegant-leaf-green.tsx`
- Focus only full-name headings in opened invitation.
- No changes to Song Hỷ, other floral templates, editor inputs, content data, or global typography.

## Current cause

Each full-name heading occupies `w-[80%]` of an inner column roughly 293px wide. Desktop width becomes about 235px. At `md:text-[58px]`, names such as `Đỗ Hoàng Nam` and `Phan Cẩm Hân` wrap even though parent invitation is 900px wide.

## Design

Add a local pure helper that selects desktop name-size class from trimmed name length:

| Name length | Desktop font size |
| --- | --- |
| 14 characters or fewer | 58px |
| 15–20 characters | 52px |
| More than 20 characters | 46px |

Apply to each full-name heading:

- Mobile remains `w-[80%]`, `text-[42px]`, wrapping permitted.
- At `md`, heading becomes `w-full whitespace-nowrap`.
- Desktop size comes from helper instead of fixed `md:text-[58px]`.
- Existing display font, centering, line-height, birth-order placement, and colors remain unchanged.

## Behavior

- `Đỗ Hoàng Nam` and `Phan Cẩm Hân` render on one line at desktop sizes.
- Longer Vietnamese names remain one line on desktop by reducing only desktop font size.
- Mobile can wrap instead of overflow or clipping.
- No client measurement, layout effect, or runtime resize listener.

## Test

Add source-level unit regression test in adjacent `chungdoi-tpl-elegant-leaf-green.test.ts`:

- Name helper exposes all three length bands.
- Desktop class includes `md:w-full` and `md:whitespace-nowrap`.
- Mobile base keeps `w-[80%]` and does not apply global `whitespace-nowrap`.

## Verification

- Run targeted test, typecheck, targeted lint, and `git diff --check`.
- Open published invitation at desktop width. Inspect name text client rects: each baseline name has one client rect.
- Resize to 390px and confirm no horizontal overflow; long names may wrap.
