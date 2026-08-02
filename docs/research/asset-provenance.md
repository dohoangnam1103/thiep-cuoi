# Generated Wedding Template Asset Provenance

Most artwork in this document was generated with OpenAI's built-in `imagegen` tool on 2026-07-28; the two Đông Sơn themes added on 2026-07-29 were instead hand-authored as SVG and rasterized (see the vector-authored section below). Every file is original artwork created for Chungdoi; no third-party reference images or web-sourced assets were used. Each source was normalized to WebP for production and saved under `public/chungdoi/images/themes/_decor/<slug>/artwork.webp`.

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

## Vector-authored Đông Sơn set (2026-07-29)

Two later themes were not produced with image generation at all. `trong-dong-dong-son` and
`chim-lac-ivory` were hand-authored as SVG in `scripts/generate-dong-son-artwork.mjs` and
rasterized with Sharp, so every plate and foreground layer shares one exact coordinate system.
The geometry — sun star, sawtooth ring, S-scroll spirals, ladder and triangle bands, and the
Lạc bird glyph — is drawn from the public-domain visual vocabulary of Đông Sơn bronze drums
(c. 1000 BCE – 100 CE); no third-party file, tracing or web-sourced image was used.

| Template | Production file | Composition |
| --- | --- | --- |
| Đông Sơn Bronze Drum | `trong-dong-dong-son/artwork.webp` | Patinated teal bronze drum face, fourteen-ray gold sun star, sawtooth and S-scroll rings, eight tangent ivory Lạc birds, ladder and triangle frieze bands. |
| Chim Lạc Ivory | `chim-lac-ivory/artwork.webp` | Ivory paper field, fine-line Đông Sơn drum profile with faint cinnabar fill, airy cinnabar bird flight arc, thin ladder and triangle friezes. |

Rerun with `node scripts/generate-dong-son-artwork.mjs`, then re-derive the opening layers with
`npm run templates:prepare-opening-assets` using the commands the script prints.

## Processing

The generated originals were converted with Sharp to the production dimensions used by each theme. Preview images in `public/chungdoi/images/template-previews/en/` were then captured from the real Next.js routes in listing, portrait and landscape variants.

## Nguyệt Ảnh Sleeve (2026-07-31)

`nguyet-anh-sleeve` uses one original lotus photogram generated with the built-in
`imagegen` tool. No reference image, third-party artwork, logo or web-sourced
asset was used. The prompt and exact visual constraints are stored in
`docs/research/templates/nguyet-anh-sleeve/prompts.md`.

The selected RGB master is
`public/chungdoi/templates/nguyet-anh-sleeve/source/lotus-photogram-master-v1.png`.
Sharp produced the desktop and mobile WebP variants under
`public/chungdoi/templates/nguyet-anh-sleeve/cover/`. The smoked-glass sleeve,
film perforations, aperture ring, metal rails, lighting and shadow are
procedural runtime geometry/materials rather than generated raster assets.

## Detective Conan Casebook (2026-07-31)

`detective-conan-casebook` uses five character-group illustrations generated
with the built-in `image_gen` tool: Shinichi and Ran, Conan and Kogoro, the
Detective Boys with Professor Agasa, Heiji's friend group, and Shuichi Akai with
Rei Furuya. They are user-directed fan-art depictions of existing Detective
Conan characters. No third-party raster file, web-sourced asset or reference
image was supplied to generation or compositing.

The exact prompts, accepted chroma masters and transparent-cutout workflow are
recorded in
`docs/research/templates/detective-conan-casebook/prompts.md`. Flat chroma
backgrounds were removed locally with the bundled `imagegen` helper. The five
accepted alpha PNGs are stored under
`public/chungdoi/templates/detective-conan-casebook/characters/source/`, and
Sharp produced one desktop and one mobile WebP for each group. The casebook,
paper block, evidence seal, lighting, halftone motifs and page-turn surfaces are
procedural runtime elements rather than generated raster artwork.

## Layered opening derivatives

The `opening-plate.webp`, `opening-*.webp`, and `opening-assets.json` files under each of the 20 theme directories were produced solely as motion-layer derivatives of that theme's local `artwork.webp` — the first 18 on 2026-07-28, the two Đông Sơn themes on 2026-07-29. No web-sourced or third-party imagery was added.

- Textured and photographic subjects were reconstructed or isolated with OpenAI image generation, exported against a controlled chroma field, and converted to genuine transparent alpha with edge despill and a one-pixel contraction.
- Flat graphic themes were separated deterministically from their original pixels so registration stays exact; their clean plates were rebuilt from the original palette without retaining the animated shapes.
- Every foreground was trimmed losslessly with a two-pixel transparent safety border. `opening-assets.json` records its exact source-canvas rectangle so the closed and animated frames share one coordinate system.
- The asset validator requires original canvas dimensions for plates, genuine alpha for foregrounds, in-bounds rectangles, unique paths, and rejects `artwork.webp` as a foreground fallback.

## Chung Đôi wedding gift visuals (2026-07-29)

The wedding-envelope and gift-box assets under `public/chungdoi/images/giftbox/` are first-party presentation assets downloaded from the matching public template demos at `https://chungdoi.com/vi/mau-thiep/<route>/demo`. Original files came from `https://chungdoi.com/images/envelope/` and `https://chungdoi.com/images/giftbox/`; they are stored locally without modification and are not hotlinked.

The complete template-to-source audit, shared-source exceptions, and exact gift-box mini sets are documented in `docs/research/GIFT_VISUAL_SOURCE_AUDIT.md`. The raw browser network capture is `docs/research/gift-visual-audit.json`, and `scripts/download-gift-visuals.mjs` records the deterministic source URL to local path mapping.

These downloaded clone assets are separate from the original/generated template artwork documented above. Confirm deployment rights for the Chung Đôi source assets before distributing this repository outside the Chung Đôi/Thiệp Mừng Online product context.

## Dấu Ấn Ngọc Ngà / Ivory Signature (2026-07-29)

`ivory-signature` is original vector-authored artwork generated locally by
`scripts/generate-ivory-signature-artwork.mjs`. The warm-ivory paper, navy liner,
olive pocket, champagne seal, blank stationery card, and matching olive gift
envelope are SVG geometry created for this repository and rasterized with Sharp;
no external artwork, tracing, logo, or web-sourced image was used.

The four opening WebPs and `opening-assets.json` are deterministic derivatives of
that source composition. The template reuses the repository's existing local
`zen-sand` demo gallery and music as fallback content; it adds no third-party
photography. User-published invitations replace the fallback hero and gallery
through the editor.

## Đà Lạt First-Person Journey Lab (2026-08-01)

The seven original raster assets under
`public/chungdoi/labs/dalat-journey/` were created for the private journey lab
with the built-in `image_gen` tool. No reference photograph, third-party
artwork, logo, or web-sourced file was used. The five fallback panoramas share
this art bible:

> First-person cinematic environment for a premium interactive Vietnamese
> invitation journey; magical-realist Đà Lạt highlands; 70 percent recognizable
> real landscape and 30 percent restrained magic; simplified low-poly forms
> with premium painterly materials; level eye-height camera and a 50-degree-FOV
> feeling; center-safe 4:3 composition for a portrait mobile crop; muted pine
> green, cream, amber, and cool blue; no people, typography, logos, interface,
> floating cards, bloom, fisheye, or watermark.

The scene directives and production paths are:

| Checkpoint | Scene directive | Production path |
| --- | --- | --- |
| Cổng sương | Pre-dawn pine-and-weathered-stone arch, low threshold, mist opening around one central path. | `fallback/mist-gate.webp` |
| Rừng ký ức | Morning pine grove with exactly three blank translucent glass panes physically suspended between trees. | `fallback/memory-pines.webp` |
| Nhà kính thời gian | Daylight Đà Lạt glasshouse, botanical brass clock rings without numerals, and one blank frosted-glass display set into stone. | `fallback/time-glasshouse.webp` |
| Pavilion bên hồ | Golden-hour timber pavilion, physical brass route inlay, calm lake, and reflected route toward pine hills. | `fallback/lake-pavilion.webp` |
| Thung lũng nguyện ước | Blue-hour flower valley with restrained glowing blossoms and one grounded stone guestbook desk with a blank inset surface. | `fallback/wish-valley.webp` |

The Wish Valley image received two constrained `image_gen` placement edits
after portrait-crop inspection: only the stone desk moved left, farther from the
camera, and slightly smaller until its complete body and writing surface had
clear margin inside the centered mobile crop. The landscape, camera, lighting,
path, and distant landmarks were explicitly held invariant.

The material prompts were:

- `materials/foliage-atlas.webp`: a square 2-by-2 atlas containing two isolated
  Đà Lạt pine clusters, one blue-white hydrangea cluster, and one cream/amber
  highland wildflower cluster. It was generated on a perfectly flat `#ff00ff`
  chroma field with no shadows, labels, or grid lines.
- `materials/fog-noise.webp`: a square, low-contrast, monochrome organic fog
  density pattern with two scales of soft variation, no horizon or focal point.

The foliage master was converted to real alpha with the bundled `imagegen`
chroma-removal helper using border key sampling, soft matte, despill, and a
one-pixel edge contraction. Sharp then produced the 1024-by-1024 alpha WebP.
Sharp resized the panoramas to 1600 by 1200 and encoded them at WebP quality
78-80. The 512-by-512 fog texture uses one mirrored source patch and lossless
WebP encoding so opposing edges are byte-identical and tile without a seam.
The complete production pack is below 3 MB.

## Forest Wedding Journey material atlas pack (2026-08-02)

The four original material assets under
`public/chungdoi/labs/forest-wedding-journey/materials/` were generated with the
built-in `image_gen` tool. The tool did not report a model name. No input image
was passed to any generation call. Two initial foliage/wildflower chroma masters
and one second wildflower master were rejected after original-resolution alpha
inspection because they retained visible chroma fringe; no project asset was
derived from those rejected masters. No third-party or web input was used.

The exact accepted generation prompts were:

### `foliage-atlas.webp`

```text
Use case: stylized-concept
Asset type: original game material texture atlas chroma master
Primary request: A 1024 by 1024 transparent texture atlas containing eight isolated realistic-but-gently-stylized dark evergreen and broadleaf foliage clusters for a premium outdoor forest wedding, soft overcast daylight, natural irregular silhouettes, no branches cut by the cell edge, no flowers, no people, no text, no logo, transparent background.
Output intent: generate a clean chroma source on a perfectly flat solid #ff00ff backdrop for local alpha removal.
Scene/backdrop: exact uniform #ff00ff RGB background from edge to edge, completely flat and unlit; absolutely no cast shadow, contact shadow, gradient, texture, reflection, floor plane, grid line, vignette, glow, or lighting variation.
Composition/framing: exactly eight separate compact foliage cluster cutouts, four rows of two, with no drawn grid; clearly separated and non-overlapping; generous empty #ff00ff padding around every cluster and canvas edge; every silhouette fully contained with no clipping.
Style/medium: restrained botanical realism with gentle premium game-material stylization; simplify microscopic leaf-tip detail just enough to create clean, solid cutout silhouettes while preserving natural irregularity.
Lighting/mood: neutral soft overcast daylight on the foliage only, consistent across all eight clusters; no colored rim light.
Critical chroma constraints: render razor-clean subject/background boundaries with zero magenta reflection, zero magenta color spill, zero magenta rim, zero pink or purple highlights, and no magenta-colored gaps embedded in the foliage. #ff00ff must appear only in the removable background and nowhere in any subject pixel.
Constraints: no flowers, people, letters, numbers, symbols, labels, text, logo, watermark, shadow, halo, border, frame, or grid line. No input images or reference images.
```

### `wildflower-atlas.webp`

```text
Use case: stylized-concept
Asset type: original game material texture atlas chroma master
Primary request: A 1024 by 1024 transparent texture atlas containing twelve isolated small white, ivory and very pale green woodland wedding wildflower heads and leaf sprigs, restrained botanical realism, soft overcast daylight, no bouquet wrapping, no people, no text, no logo, transparent background.
Output intent: make a production-clean chroma source on one perfectly flat solid #ff00ff field for local alpha removal.
Scene/backdrop: a single exact uniform #ff00ff RGB color across the complete canvas, entirely flat and unlit, with no shadow, gradient, texture, reflection, floor, grid, vignette, glow, or variation.
Composition/framing: exactly twelve separate compact botanical cutouts arranged as three rows of four without any drawn grid; combine individual white or ivory woodland flower heads and separate very pale green leaf sprigs; no overlaps; ample #ff00ff gaps and canvas-edge padding; nothing clipped.
Style/medium: clean botanical game-material cutout render with restrained realism; natural forms but solid simple silhouettes; avoid hair-thin stems, fuzzy edges, microscopic serrations, and translucent petal edges.
Lighting/mood: neutral soft overcast daylight on each botanical, consistent exposure, no colored rim lighting.
Critical boundary treatment: each flower must remain white or ivory all the way to its outermost silhouette pixels, and each leaf or stem must remain pale natural green all the way to its outermost silhouette pixels. Use crisp opaque subject-colored boundaries. Absolutely zero magenta, pink, purple, chroma reflection, chroma spill, rim, halo, outline, or embedded chroma gaps on or inside the subjects. #ff00ff exists only as removable empty background.
Constraints: no bouquet wrapping, vase, ribbon, people, letters, numbers, symbols, labels, text, logo, watermark, cast shadow, contact shadow, halo, border, frame, or grid line. No input images or reference images.
```

### `petal-atlas.webp`

```text
Use case: stylized-concept
Asset type: original game material texture atlas chroma master
Primary request: A 512 by 512 transparent texture atlas containing sixteen isolated white and ivory rose-like petals seen at varied rotations and slight curls, soft daylight, clean alpha edges, no flower heads, no text, no logo, transparent background.
Output intent: generate the source on a perfectly flat solid #00ff00 chroma-key backdrop so the final transparent alpha atlas can be made locally.
Scene/backdrop: the entire background must be exactly one perfectly uniform flat #00ff00 color, edge to edge, with no cast shadow, no contact shadow, no gradient, no texture, no reflections, no floor plane, no grid lines, and no lighting variation.
Composition/framing: exactly sixteen individual rose-like petals, evenly distributed as clearly separated silhouettes without visible cell borders; varied rotations and restrained slight curls; crisp isolated edges; generous padding around every petal and around the canvas edge; no overlaps; no petal clipped by any edge.
Style/medium: realistic-but-gently-stylized premium game material, delicate natural petal texture.
Lighting/mood: soft, even daylight on the petals only; consistent light direction and exposure across all sixteen petals.
Constraints: #00ff00 must appear nowhere inside any petal; only white and ivory individual petals; no flower heads, stems, leaves, sepals, people, letters, numbers, symbols, labels, text, logo, watermark, shadows, halos, border, frame, or grid lines. No input images or reference images.
```

### `ground-detail.webp`

```text
Use case: stylized-concept
Asset type: original tileable game material texture
Primary request: A seamless 1024 by 1024 subtle forest lawn albedo detail, fine dark green grass, moss and tiny soil variation, evenly lit overcast daylight, no stones, no flowers, no shadows, no text, no logo, tileable in both axes.
Scene/backdrop: orthographic top-down material surface only, filling the entire square canvas.
Style/medium: restrained realistic-but-gently-stylized premium game material albedo; subtle fine-scale forest lawn detail.
Composition/framing: seamless repeat in both horizontal and vertical axes; opposing borders must visually continue; uniform density and scale; no horizon, border, frame, central composition, path, patch-shaped focal point, large blade, distinctive clump, or repeated landmark.
Lighting/mood: perfectly even diffuse overcast illumination; color-only albedo appearance; no directional light, cast shadows, contact shadows, highlights, ambient occlusion baking, vignette, or exposure falloff.
Color palette: fine dark forest greens with restrained moss greens and tiny muted brown soil variation.
Constraints: opaque square texture; no stones, flowers, fallen leaves, twigs, insects, people, letters, numbers, symbols, labels, text, logo, watermark, seams, grid lines, border, or frame. No input images or reference images.
```

For all three alpha atlases, the bundled chroma helper used border key
sampling, `--soft-matte`, `--transparent-threshold 12`,
`--opaque-threshold 220`, and `--despill`. The petal master additionally used
`--edge-contract 1` after the required fringe inspection. Sharp composited the
accepted alpha images over transparent black to sanitize hidden RGB without
changing alpha. The 8, 12, and 16 accepted connected subjects were then kept in
row-major order, uniformly fitted and centered in strict 2-by-4, 4-by-3, and
4-by-4 cells. Decoded alpha has minimum cell-edge gutters of 13, 11, and 9
pixels respectively, exceeding the required 12, 10, and 8 pixels. Before
encoding, Sharp cleared inherited RGB from fully transparent pixels, propagated
the nearest subject-edge RGB outward by four pixels only inside each cell's
inner gutter boundary, and kept the propagated alpha at zero. The final sizes
are 1024 by 1024, 1024 by 1024, and 512 by 512. Their WebP settings remain
quality 80, 82, and 82 respectively, `alphaQuality: 100`, effort 6, the
`drawing` preset, and chroma smart-subsampling disabled.

For `ground-detail.webp`, Sharp extracted the 1024-by-1024 center area of the
accepted generated master and built a normalized stochastic blend of five
toroidal source offsets. Each offset uses a fourth-power periodic sine mask
that falls to zero at that offset's source-wrap boundary, so another continuous
offset repairs the join without mirror axes or rosette symmetry. Sharp removed
alpha and encoded opaque WebP at quality 80 and effort 6. Original-resolution
and four-by-four tile previews showed no visible join or repeated focal element.
Decoded opposing-edge MAE is 12.08 horizontally and 10.50 vertically; full
horizontal/vertical flip MAE is 14.42/14.40, close to unrelated toroidal shifts
at 14.50/14.46. The four final files total 845,260 bytes.

“user reference used for mood only; no pixels copied”
