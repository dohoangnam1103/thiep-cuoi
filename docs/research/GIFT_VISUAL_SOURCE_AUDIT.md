# Wedding Gift Visual Source Audit

Audit date: 2026-07-29. Source demos were opened in Chromium, the invitation cover was dismissed, and each page was scrolled so lazy-loaded gift assets appeared in the network log. Raw results are stored in `gift-visual-audit.json`; the repeatable crawler is `scripts/crawl-gift-visuals.mjs`.

## Result

The 40 legacy templates contain 39 source-backed gift presentations. `maroon-love` is the only local template without a matching Chung Đôi asset and intentionally retains the procedural envelope. All remote assets are stored locally; the UI does not hotlink them.

### Paired envelope artwork

These templates use two mirrored/rotated instances of their local `envelope.webp`:

- `song-hy-red`, `song-hy-green`
- `double-dragon-red`, `double-dragon-green`, `double-dragon-blue`
- `double-phoenix-red`, `double-phoenix-green`
- `dragon-phoenix-red`, `dragon-phoenix-green`, `dragon-phoenix-blue`, `dragon-phoenix-black`
- `dragon-phoenix-v2-red`, `dragon-phoenix-v3-red`
- `elegant-leaf-green`, `boho-floral-green`, `boho-floral-pink`, `boho-floral-brown`
- `jasmine-white`, `silk-flora-brown`, `crystal-floral-blue`
- `chateau-blue`, `brocade-flower-red`, `baroque-gold`
- `qasr-green`, `qasr-gold`
- `royal-red`, `royal-blue`, `royal-green`
- `nhat-binh-red`, `hoa-tinh-red`, `co-ba-red`, `chibi-red`
- `spring-garden-red`, `spring-garden-green`, `spring-garden-blue`
- `minimalism-red`, `cherry-blossom-pink`

Local path convention: `public/chungdoi/images/giftbox/<template-slug>/envelope.webp`.

Remote path convention: `https://chungdoi.com/images/envelope/<asset-stem>.webp`. Exceptions intentionally shared by the source are `dragon_phoenix.webp` for the four Dragon Phoenix color variants and `royal.webp` for the three Royal variants. V2 and V3 use `dragon_phoenix_v2.webp` and `dragon_phoenix_v3.webp`.
## Gift-box artwork

- `chateau-green`: `giftbox/chateau_green.webp` plus mini assets `dragon_phoenix_v2`, `glass_garden_green`, `saraya_gold`, `qasr_gold`, `chateau_blue`, `spring_garden_red`, and `spring_garden_green`.
- `glass-garden-green`: `giftbox/glass_garden_green.webp` plus mini assets `saraya_gold`, `jasmine_white`, `double_phoenix_red`, `baroque_gold`, `boho_floral_pink`, `brocade_flower_red`, and `chateau_green`.

Main local path: `public/chungdoi/images/giftbox/<template-slug>/box.webp`. Mini assets are stored under `public/chungdoi/images/giftbox/mini/`.

## Validation notes

The live network audit observed gift assets on 28 demos. Some demos did not request their artwork because their sample bank block was disabled or rendered as direct QR; the corresponding first-party asset URLs were then checked directly and returned HTTP 200 before download. `royal-red` timed out during the broad crawl, but the shared first-party `royal.webp` used by Royal Blue and Royal Green returned HTTP 200 and is the source-family asset.

The registry in `src/data/chungdoi-gift-visuals.ts` gives every source-backed template an explicit entry. Local/generated templates resolve to the procedural fallback because they do not have Chung Đôi source artwork.
