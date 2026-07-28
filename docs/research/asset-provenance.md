# Generated Wedding Template Asset Provenance

The generated template artwork in the first section of this document was created with OpenAI's built-in `imagegen` tool on 2026-07-28. The files are original raster artwork created for Chungdoi; no third-party reference images or web-sourced assets were used. Each source was normalized to WebP for production and saved under `public/chungdoi/images/themes/_decor/<slug>/artwork.webp`.

## Final prompt set

Every prompt requested a vertical, text-free wedding-invitation hero artwork with generous negative space, clean edges, no logos, no watermark, and no imitation of a living artist. The per-template art direction was:

| Template | Production file | Final prompt brief |
| --- | --- | --- |
| Dong Ho Folk | `dong-ho-folk/artwork.webp` | Vietnamese Đông Hồ-inspired woodblock composition on warm dó paper, paired phoenix birds, lotus and natural mineral pigments. |
| Tho Cam Highland | `tho-cam-highland/artwork.webp` | Original Vietnamese highland brocade geometry on deep indigo woven cloth, rhythmic diamonds and stepped borders. |
| Son Mai Lacquer | `son-mai-lacquer/artwork.webp` | Black and cinnabar Vietnamese lacquer panel with gold-leaf cranes, restrained clouds and handcrafted surface depth. |
| Bat Trang Blue | `bat-trang-blue/artwork.webp` | Blue-and-white Bát Tràng ceramic medallion with lotus, swallows and delicate cobalt borderwork on ivory glaze. |
| Hang Trong Folk | `hang-trong-folk/artwork.webp` | Hàng Trống-inspired folk painting with symbolic paired birds, peonies, lively hand-painted linework and traditional pigments. |
| Sen Monoline | `sen-monoline/artwork.webp` | Quiet ivory rice-paper field with elegant single-line lotus drawing, pale sage washes and a vermilion seal accent. |
| Truc Chi Minimal | `truc-chi-minimal/artwork.webp` | Minimal trúc chỉ bamboo-paper light art, translucent botanical fibers, warm backlighting and embossed organic texture. |
| Long Phung Deco | `long-phung-deco/artwork.webp` | Geometric dragon-and-phoenix Art Deco emblem in gold over deep Vietnamese red, symmetrical and ceremonial. |
| Ao Dai Hue | `ao-dai-hue/artwork.webp` | Abstract flowing áo dài silk panels in Huế purple, teal and antique rose, fine floral embroidery and graceful gold piping. |
| Art Deco Gatsby | `art-deco-gatsby/artwork.webp` | Black and champagne-gold 1920s fan architecture, precise geometric frame, polished evening glamour. |
| Celestial Map | `celestial-map/artwork.webp` | Midnight celestial chart with two intertwined constellations, fine orbital arcs, stars and subtle antique-gold ink. |
| Coastal Mediterranean | `coastal-mediterranean/artwork.webp` | Sunlit Mediterranean courtyard collage, white stucco, cobalt tiles, olive branches, sea horizon and handmade-paper texture. |
| Swiss Brutalist | `swiss-brutalist/artwork.webp` | Editorial Swiss-brutalist poster with raw black geometry, warm off-white stock, sharp red rules and asymmetric balance. |
| Riso Duotone | `riso-duotone/artwork.webp` | Playful risograph botanical celebration in fluorescent coral and ultramarine, visible ink overlap and paper grain. |
| Cinema Credit | `cinema-credit/artwork.webp` | Cinematic black field with a warm projector beam, subtle film grain, refined frame marks and dramatic negative space. |
| Aurora Glass Dark | `aurora-glass-dark/artwork.webp` | Dark glassmorphism atmosphere with translucent aurora ribbons, teal light, one warm star flare and soft optical depth. |
| Y2K Chrome | `y2k-chrome/artwork.webp` | Sculptural liquid-chrome ribbons forming an abstract heart, cool silver with cyan and magenta reflections on pearl gray. |
| Botanical Lavender | `botanical-lavender/artwork.webp` | Airy editorial lavender herbarium, pressed stems, translucent vellum layers and restrained lilac ink on warm ivory. |

## Processing

The generated originals were converted with Sharp to the production dimensions used by each theme. Preview images in `public/chungdoi/images/template-previews/en/` were then captured from the real Next.js routes in listing, portrait and landscape variants.

## Layered opening derivatives

The `opening-plate.webp`, `opening-*.webp`, and `opening-assets.json` files under each of the 18 theme directories were produced on 2026-07-28 solely as motion-layer derivatives of that theme's local `artwork.webp`. No web-sourced or third-party imagery was added.

- Textured and photographic subjects were reconstructed or isolated with OpenAI image generation, exported against a controlled chroma field, and converted to genuine transparent alpha with edge despill and a one-pixel contraction.
- Flat graphic themes were separated deterministically from their original pixels so registration stays exact; their clean plates were rebuilt from the original palette without retaining the animated shapes.
- Every foreground was trimmed losslessly with a two-pixel transparent safety border. `opening-assets.json` records its exact source-canvas rectangle so the closed and animated frames share one coordinate system.
- The asset validator requires original canvas dimensions for plates, genuine alpha for foregrounds, in-bounds rectangles, unique paths, and rejects `artwork.webp` as a foreground fallback.

## Chung Đôi source gift visuals

The 25 gift visuals newly added on 2026-07-29 and listed in [GIFT_VISUAL_SOURCE_AUDIT.md](./GIFT_VISUAL_SOURCE_AUDIT.md) were downloaded unchanged from their documented `https://chungdoi.com/images/envelope/` and `https://chungdoi.com/images/giftbox/` source URLs. The pre-existing `cherry_blossom_pink.webp` envelope and the `chateau_green.webp` and `glass_garden_green.webp` base gift boxes were re-audited on that date, not newly downloaded. All of these files are stored locally solely for source-parity reconstruction; the application does not hotlink them at runtime.
