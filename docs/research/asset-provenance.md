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

## Forest Wedding Journey photoreal entry pack (2026-08-03)

The production WebPs under
`public/chungdoi/labs/forest-wedding-journey/photoreal/` combine original
built-in-image-generation outputs with 1K CC0 texture maps from Poly Haven.
The pack is fully self-hosted; no runtime request goes to Poly Haven or another
CDN. OpenAI's built-in `image_gen` tool created all three original masters and
did not expose a model name.

> reference images used for mood only; no pixels copied

### Mood-reference audit

The two local Harmony Studio photographs were passed only as mood references
for evergreen density, emerald color and natural daylight in the original
backdrop generation. People, furniture, flowers, typography, logos, framing
and all other source-image pixels were explicitly excluded. Neither image was
passed to the wildlife generation.

| Reference-only input | SHA-256 |
| --- | --- |
| `/Users/namdo/Documents/724937614_1068896902463928_5863343670164935302_n.jpeg` | `3b72ca83c6a4becb7d8c7815a08ad04a5250d18569d64fcd388925fdd6b546ae` |
| `/Users/namdo/Documents/723137482_1882634189078434_5633222113408269822_n.jpeg` | `ca11262fa6ada7386cdf477fd2de02992390d98298d7b4042a6893cd95e8996b` |

### Original generated backdrop

The accepted 1774-by-887 RGB master was saved by the built-in tool at
`/Users/namdo/.codex/generated_images/019fc46c-edee-7433-a3b2-f4b36fa31860/exec-796c3349-0bcd-4bcf-bd56-231b5de283db.png`
(SHA-256
`240c3c0981785cd2cf79fb433989a59042be371e7aa48b573cdbff1734395b9b`).
Its exact prompt was:

```text
Use case: photorealistic-natural
Asset type: original far-field forest panorama for a real-time 3D wedding journey
Input images: Image 1 and Image 2 are mood references only for the dense emerald evergreen atmosphere and bright natural daylight; do not copy, trace, composite, reproduce, or retain any source pixels, people, staging, props, text, logos, watermark, or exact composition.
Primary request: create a wholly original 2:1 photographic panorama of a dense emerald evergreen forest wall suitable as a distant curved 3D backdrop.
Scene/backdrop: continuous irregular layers of mature conifers and woodland understory, deep forest depth, moss and ferns at the base, no pale gaps and almost no visible sky.
Style/medium: convincing natural location photography, restrained cinematic realism, physically plausible botanical detail, subtle natural lens depth, no illustration or low-poly look.
Composition/framing: exact wide 2:1 landscape intent; eye-level forest view; edge-to-edge foliage; balanced density across the full width; no central landmark, no path, no symmetrical tree rows, no obvious repeating elements; safe to crop and tile as a far panorama.
Lighting/mood: warm directional morning daylight grazing selected branch tips over deep cool green ambient shade; rich but natural emerald color; controlled highlights; no artificial glow or heavy grading.
Materials/textures: real conifer needles, layered branches, bark glimpses, moss, ferns, leaf litter and soft atmospheric depth.
Constraints: entirely original output; no people, animals, wedding furniture, flowers, petals, tables, lamps, cameras, buildings, typography, letters, numbers, logos, signatures, watermarks, borders, frames, or copied pixels from either reference.
Avoid: recognizable reference composition, empty sky, manicured hedge shapes, evenly spaced rows, fantasy effects, bloom, fisheye, painterly rendering, CGI plasticity, oversharpening.
```

### Baked aerial perspective on the shipped backdrop

The shipped `backdrop.webp` is not a direct encode of that master. The
preparation script resizes it to 1024 by 512 and then blends every texel 35
percent of the way toward the scene haze colour `#8fae7f` in linear light,
converting to and from sRGB around the mix so the blend is physically correct
rather than a gamma-space average.

Two reasons, both verified by measurement. First, the backdrop cylinder stands
at radius 96 while the scene fog ends at 76 and the backdrop material sets
`fog: false`, so nothing at runtime supplies aerial perspective; the untouched
panorama arrived at full contrast and read as a flat painted wall rather than a
96-metre distance. Second, the material tints the map by `0x9fb894` and the
renderer tone-maps with ACES at exposure 1.08, a chain that resolves anything
below roughly sRGB 20 to pure black — 42.08 percent of the master's texels sat
there and punched a black void above the treeline. The bake is the correct
treatment for the distance and it lifts the tonal floor clear of the tone
curve's toe at the same time.

The blend factor is the smallest that clears the toe with headroom: 0.30
already lifted every texel above the floor against this panorama, and 0.35
keeps the margin after WebP's lossy pass. Higher values wash the treeline out.
The encode is WebP quality 82, effort 6, `preset: "picture"`, with smart
subsampling.

`validateBackdropTonalFloor` in the preparation script rejects any output
holding a texel below sRGB luminance 24, and
`forest-asset-manifest.test.ts` re-checks the shipped file plus the fact that
the baked haze colour still matches the atmosphere colour declared in
`forest-lighting.tsx`. The check is per-texel rather than a mean because a
black hole in one corner of the sky is exactly what a healthy average hides.



The accepted 1536-by-1024 RGB chroma master was saved by the built-in tool at
`/Users/namdo/.codex/generated_images/019fc46c-edee-7433-a3b2-f4b36fa31860/exec-4247d684-2def-4550-bd9b-6c0404324c21.png`
(SHA-256
`9a7f672e6f1bbc68583ab01baa7bc3790846cd0f55cc7c9c58b5b8c27e58a58b`).
Its exact prompt was:

```text
Use case: photorealistic-natural
Asset type: original photographic wildlife texture atlas chroma master for alpha-tested impostor actors in a real-time 3D forest
Primary request: create exactly six isolated, full-body woodland-animal poses in one 3-column by 2-row atlas: top row from left to right is a small European rabbit sitting quietly in an idle pose, a white dove perched in side profile with folded wings, and a red squirrel running in side profile; bottom row from left to right is the same kind of small rabbit captured mid-hop in side profile, a white dove flying in side profile with wings fully spread, and a red squirrel climbing upward in side profile.
Scene/backdrop: one perfectly flat, exact solid #00ff00 chroma-key field from edge to edge for local background removal; uniform and unlit with no floor, horizon, shadow, gradient, texture, reflection, vignette, glow, or lighting variation.
Style/medium: convincing natural wildlife photography with realistic anatomy, fur and feather detail, restrained clean game-asset finish, consistent scale within each species.
Composition/framing: strict 3 columns by 2 rows without visible cell borders; each pose centered in its own equal cell; clearly separated and non-overlapping; generous empty #00ff00 padding around every silhouette and the outer canvas; every ear, paw, tail, wing tip, and feather fully contained; side profiles face right except the perched dove may angle slightly toward camera.
Lighting/mood: neutral soft overcast daylight on subjects only; consistent light direction, color, exposure and camera height across all six cells; no colored rim light.
Critical chroma constraints: razor-clean opaque subject boundaries with zero green reflection, spill, rim, halo, outline or embedded green gaps; preserve natural brown, red, gray and white subject edge colors; #00ff00 may occur only in removable background and nowhere in an animal.
Constraints: exactly six animal poses and no additional animals; no branch, perch, nest, ground, grass, leaves, flowers, props, people, letters, numbers, symbols, labels, text, logos, signatures, watermarks, cast shadows, contact shadows, borders, frames, grid lines, clipping or overlap.
Avoid: colored edge highlights, illustration, painting, cartoon, low-poly style, taxidermy stiffness, fantasy glow, motion blur, depth-of-field blur, aggressive sharpening, malformed anatomy, cropped extremities.
```

The bundled imagegen helper converted that master to alpha with border-key
sampling, soft matte, transparent threshold 12, opaque threshold 220, despill,
and the required one-pixel contraction after full-resolution fringe review:

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/scripts/remove_chroma_key.py" \
  --input tmp/forest-photoreal-sources/wildlife-chroma-master-v2.png \
  --out tmp/forest-photoreal-sources/wildlife-alpha-v2-contracted.png \
  --auto-key border \
  --soft-matte \
  --transparent-threshold 12 \
  --opaque-threshold 220 \
  --despill \
  --edge-contract 1
```

The accepted alpha master has SHA-256
`613852f17adb5702cf86f824c6d239d505351fb431d225c694d81808061b5c35`;
all four corners are transparent. An earlier magenta-key master at
`/Users/namdo/.codex/generated_images/019fc46c-edee-7433-a3b2-f4b36fa31860/exec-44c7f0bb-05d7-4f5f-8eba-81755591df23.png`
(SHA-256
`26daf3585267a72ed9c8ddef1dbf20e802102a514694a375c002ec42d36bcd93`)
was rejected after the same full-resolution workflow because visible magenta
fringe remained; no shipped asset was derived from it. No CLI image-generation
fallback was used.

### Original generated conifer branch cards

The built-in tool created a 1254-by-1254 RGB chroma master at
`/Users/namdo/.codex/generated_images/019fc46c-edee-7433-a3b2-f4b36fa31860/exec-9105a592-3474-404e-acf3-9be569fd37e6.png`
(SHA-256
`a4e50061766bd4c480826e976bd53ca4b3156fd35c0d863c6a82b8661913d34a`).
No input or reference image was passed to this generation. Its exact prompt
was:

```text
Use case: photorealistic-natural
Asset type: original conifer branch-card texture atlas chroma master for alpha-tested real-time 3D foliage
Primary request: create exactly four isolated dense evergreen conifer branch clusters in a strict 2-column by 2-row atlas, each a different natural silhouette suitable for a crossed billboard card: one broad horizontal fir spray, one gently upward-angled pine spray, one compact drooping spruce spray, and one irregular layered evergreen bough.
Scene/backdrop: one perfectly flat exact solid #ff00ff chroma-key field from edge to edge for local background removal; uniform and unlit with no floor, horizon, shadow, gradient, texture, reflection, vignette, glow, or lighting variation.
Style/medium: convincing botanical location photography with realistic deep-green needles, fine twig and bark detail, restrained clean game-asset finish, physically plausible anatomy.
Composition/framing: strict 2 columns by 2 rows without visible cell borders; each branch cluster centered in its own equal square cell; clearly separated and non-overlapping; generous empty #ff00ff padding of at least 8 percent of each cell around every silhouette; every needle tip and twig fully contained; no subject may cross a cell boundary or canvas edge.
Lighting/mood: neutral soft overcast daylight on branches only with restrained warm highlights and deep emerald shade; consistent light direction, color and exposure across all cells; no colored rim light.
Critical chroma constraints: crisp opaque subject boundaries with zero magenta reflection, spill, rim, halo, outline or embedded magenta gaps; natural green and brown must continue to the outermost subject pixels; #ff00ff may occur only in removable background and nowhere in a branch.
Constraints: exactly four branch clusters; no pine cones, fruit, flowers, roots, whole trees, trunk sections, animals, people, props, letters, numbers, symbols, labels, text, logos, signatures, watermarks, cast shadows, contact shadows, borders, frames, grid lines, clipping or overlap.
Avoid: UV unwraps, texture-sheet distortion, stretched strips, kaleidoscopic fragments, isolated needles, low-poly forms, illustration, painting, plastic CGI, fantasy glow, motion blur, depth-of-field blur, malformed branching.
```

The bundled helper performed the required border sampling, soft matte,
thresholds, despill and one-pixel contraction:

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/scripts/remove_chroma_key.py" \
  --input tmp/forest-photoreal-sources/conifer-branches-chroma-master.png \
  --out tmp/forest-photoreal-sources/conifer-branches-alpha-contracted.png \
  --auto-key border \
  --soft-matte \
  --transparent-threshold 12 \
  --opaque-threshold 220 \
  --despill \
  --edge-contract 1
```

The accepted alpha master has SHA-256
`ec37c286f0acb74b57d9f97cdc1621a1f83e3f92d0514893f50f8bde6b07d095`.
The preparation script splits the master into four source cells, uses alpha
greater than 8 only to find each cell's subject bounds, fits each bounded
subject independently inside a 232-by-232 box, and centers it in its own
256-by-256 destination cell. After resizing and compositing, hidden RGB is
cleared only where alpha is exactly 0; every nonzero alpha value, including
antialiased edge coverage from 1 through 8, is retained. A deterministic
residual-magenta cleanup clamps blue to green when it exceeds green and caps
only pink-biased red pixels at 1.25 times green. Separately, the final
production WebP is decoded and verified to have alpha exactly 0 in every pixel
of every cell's eight-pixel border; the current decoded borders are fully
transparent and the nearest material begins at least 12 pixels from each
relevant cell edge.

### Poly Haven CC0 sources

Leafy Grass is documented at `https://polyhaven.com/a/leafy_grass`; Pine Tree
01 is documented at `https://polyhaven.com/a/pine_tree_01`. Only three 1K bark
maps were downloaded from Pine Tree 01; its 570 MB/949 MB-class Blender or
geometry downloads and its model-specific UV-unwrapped twig maps were never
used for the shipped pack. Poly Haven states that all assets are CC0 at
`https://polyhaven.com/license`.

| Input | Exact download URL | Poly Haven MD5 | Downloaded SHA-256 |
| --- | --- | --- | --- |
| Leafy Grass diffuse | `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/leafy_grass/leafy_grass_diff_1k.jpg` | `0dbc071e91d6905edfcfbe8eb785a1ab` | `cfa40bc9d9417d1852db8753a8d5917f110c40101179f63543c382e39bc05e4a` |
| Leafy Grass OpenGL normal | `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/leafy_grass/leafy_grass_nor_gl_1k.jpg` | `8279e096e204ea326d57a318869f99df` | `832328216adc0a7e1f70a31d5ee48c9ab7f2152d83816122736cf42ac4b2ebd6` |
| Leafy Grass ARM | `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/leafy_grass/leafy_grass_arm_1k.jpg` | `44fb4e40ef0f3425a7d1a14bc328e4d8` | `95432451cb2693794459fe7ea339ea9ffdb5959c40373740f80a4aa1703f089d` |
| Pine Tree 01 bark diffuse | `https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/pine_tree_01/pine_tree_01_bark_diff_1k.jpg` | `7d3a558ed614c7e75594c7be3bf80311` | `5c76836b01c3536fa0e24207b67bf4f3315b53ebe2b4ecc6f08dfcf3f8d74929` |
| Pine Tree 01 bark OpenGL normal | `https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/pine_tree_01/pine_tree_01_bark_nor_gl_1k.jpg` | `bb6e3a6eea777d992cef48fabfdc538c` | `05c46455531781b6cf18cae0648cf627f60ee942adaa8bcbfd1592fc2506a9e0` |
| Pine Tree 01 bark ARM | `https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/pine_tree_01/pine_tree_01_bark_arm_1k.jpg` | `21d1abd15e40951825a4f3da110b20ea` | `336a4680cd571b6076b67afee2310b290b8900d9d126eb39ec1ae92e95be2ea9` |

### Deterministic project conversion

Run `node scripts/prepare-forest-photoreal-assets.mjs` after placing the
accepted generated masters at the script's documented default temp paths, or
pass `--backdrop-source`, `--wildlife-source` and
`--conifer-branch-source`. The script verifies every Poly Haven MD5 before
processing and uses Sharp with Lanczos3 resize kernels.

- Leafy Grass color, OpenGL normal and ARM become 512-by-512 WebPs. Color is
  shifted toward the approved emerald ground with per-channel multipliers
  `[0.78, 1.04, 0.85]`, then uses quality 84, the `picture` preset, smart
  subsampling and effort 6. Both data maps use quality 90, the default preset,
  no smart subsampling and effort 6.
- Conifer outputs are 1024 by 512, with the original 2-by-2 branch-card atlas
  on the left and Poly Haven bark on the right. The color atlas keeps branch
  alpha and bark opaque, then uses quality 86, `alphaQuality: 100`, the
  `picture` preset, no smart subsampling and effort 6. The branch side uses a
  compatible flat OpenGL normal `(128, 128, 255)` and ARM default
  `(255, 190, 0)`; the bark side uses the downloaded PBR maps. Both data
  atlases use quality 90, the default preset, no smart subsampling and effort 6.
- The generated backdrop is cropped/resized to 1024 by 512 and encoded with
  quality 82, the `picture` preset, smart subsampling and effort 6.
- The accepted alpha wildlife atlas is resized to a strict 3-by-2 grid at 960
  by 640 and encoded with quality 84, `alphaQuality: 100`, the `picture` preset,
  no smart subsampling and effort 6.

| Production file | Dimensions | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `photoreal/ground-color.webp` | 512x512 | 99,956 | `4638b029cbc3b3c59aa9e19befbc5537a33ca9c4015713678fa471e026805d65` |
| `photoreal/ground-normal.webp` | 512x512 | 139,296 | `ecd5ec2089e18a458d53948034ce70f0d586aae129190388ec531d86fd70c2d2` |
| `photoreal/ground-arm.webp` | 512x512 | 84,238 | `cc24d93d9900047cb337d74bd0dacd36a64e0c5ffed3f551b5e6847d3bce1134` |
| `photoreal/conifer-color.webp` | 1024x512 | 165,896 | `76ec25516baac91d1562f9a8e8dfddd8971e627fa0b2f552151491cc9f6a3a0f` |
| `photoreal/conifer-normal.webp` | 1024x512 | 99,428 | `9bac84fbc4ac6959a9dda9d940374bed037d0d74a3a79d046db88d74b0227ca9` |
| `photoreal/conifer-arm.webp` | 1024x512 | 49,748 | `55dd8c1d36760e7f632f6b21e96fddf38261229e357dd9a98389397a2b4d1ce4` |
| `photoreal/backdrop.webp` | 1024x512 | 166,970 | `41da10c0b3e78cdca6502458700ed6a99cbdb21bac3808a8bf352dda17aa2cbb` |
| `photoreal/wildlife.webp` | 960x640 | 62,566 | `b71fa8625ff8dc2c78b34774777d9e1e1e5feb660328eefed1c246aee4f07814` |

The seven blocking files total 805,532 compressed bytes and have a conservative
RGBA-plus-mip decode estimate of 15,379,118 bytes. Including optional wildlife,
the shared pack totals 868,098 compressed bytes.

### Measured runtime budgets (2026-08-04)

The numbers above are manifest estimates. The figures below were measured from
the running lab through the on-demand runtime diagnostics reader, so they
reflect what the GPU actually holds.

| Measurement | Desktop 1440x900 | Mobile 390x844 |
| --- | ---: | ---: |
| Environment textures decoded (RGBA + mips) | 15,379,116 | 15,379,116 |
| Three retained gallery photos decoded | 44,649,828 | 44,649,828 |
| Peak total decoded | 60,028,944 | 60,028,944 |
| Device pixel ratio ceiling | 1.25 | 1 |
| Draw-call ceiling asserted | 120 | 80 |
| Triangle ceiling asserted | 250,000 | 150,000 |

Environment decode differs from the 15,379,118-byte manifest estimate by two
bytes: the manifest rounds each mip chain with `ceil(w * h * 4 * 4 / 3)` while
the runtime sums the exact per-level sizes. Both are recorded so a drift in
either direction is visible.

Chunk residency is what bounds alpha-foliage fill rate. At most four conifer
chunks stay mounted — the departure and arrival chunks plus their immediate
neighbours — and level of detail is measured from the arrival chunk, so a long
hop demotes the departure end to impostors. The petal field is fingerprinted by
a transform hash so a silent change to placement or aerodynamics fails a test
rather than passing unnoticed.

### Running the diagnostics and visual suites

The runtime reader is published only when the server resolves
`FOREST_RUNTIME_DIAGNOSTICS=1` per request, never by build mode, so a
production build can opt in for tests while real visitors never receive it:

```bash
FOREST_RUNTIME_DIAGNOSTICS=1 npx playwright test tests/e2e/forest-wedding-journey-lab.spec.ts --project=chromium --workers=1
npx playwright test tests/e2e/forest-wedding-journey-visual.spec.ts --project=chromium --workers=1
```

The Playwright web server is reused locally, so restart it (or free port 3100)
when toggling the flag. Running the lab suite without the flag skips the budget
tests and instead asserts the negative contract that the reader is absent.

## Beach Wedding Journey photoreal pack (2026-08-04)

Everything under `public/chungdoi/labs/beach-wedding-journey/photoreal/` is
either a derivative of a CC0 Poly Haven download or generated from code in this
repository. No pixel comes from a competitor site, and no runtime request
leaves our origin — the pack is fully self-hosted.

`scripts/prepare-beach-photoreal-assets.mjs` is the only writer of this
directory. It downloads each source, records the byte count, upstream URL,
Poly Haven MD5 and its own SHA-256 of the downloaded file into
`beach-asset-bytes.json`, then encodes the production outputs.

### Licensing

All Poly Haven downloads are CC0 1.0 (public domain dedication) — no
attribution required, commercial use permitted. Poly Haven does not name
individual authors per asset in the download endpoint used here; the asset
slug in the URL is the canonical identifier.

### Downloaded sources

Fifteen files were downloaded. The MD5 is Poly Haven's published checksum; the
SHA-256 was computed locally on the downloaded bytes.

| Source key | Upstream file | MD5 | SHA-256 |
| --- | --- | --- | --- |
| `sandColor` | `Textures/jpg/1k/sand_03/sand_03_diff_1k.jpg` | `84bde2b8bea6351805f67a15682b36b2` | `e72144f9d7b81bdb7bbdb34222b53431738dcef79346dd89412d2abd541e4d30` |
| `sandNormal` | `Textures/jpg/1k/sand_03/sand_03_nor_gl_1k.jpg` | `ad8d6ce28344b1d8f241cbd7796243dc` | `1bde5f49ea78f94bcad73592696bf3949711c4ac197133b710c0c8521b6e996b` |
| `sandArm` | `Textures/jpg/1k/sand_03/sand_03_arm_1k.jpg` | `2d69c938c9ce5d4ba41f4789eae3a9cb` | `6b497a5f4aaa6b8a6ffc35eb840c2ca3050db17eec7980426c531355a84704fa` |
| `wetSandColor` | `Textures/jpg/1k/damp_sand/damp_sand_diff_1k.jpg` | `fd55de6d79f938dbf5cc0f5e1f473c6c` | `3b26e6033205d4c774bb8c48bda8081b5a369e01ac701a0dcaa7ddc1f484f1de` |
| `wetSandArm` | `Textures/jpg/1k/damp_sand/damp_sand_arm_1k.jpg` | `c4653c6996f55d919bf89fe3f21920de` | `a54ba44a05381a87b4506c6e75d92e096b11cb45c5d7d052957b1d36eee4aef9` |
| `hdri` | `HDRIs/hdr/1k/table_mountain_1_puresky_1k.hdr` | `6c68d0e51d99c9a8a93438472ab8bc42` | `ced63bc210a2cae807dd6aa6dbad28dd754f6e7caf0b3082da05ba7620fe033a` |
| `driftwoodColor` | `Models/jpg/1k/modular_wooden_pier/modular_wooden_pier_planks_diff_1k.jpg` | `f3fef39b0ec16e4006678c846d3601ab` | `2670a7eae2a3104e8537e61d90a8d8b169c7eb0f69b51622bec10e9472dc4573` |
| `driftwoodNormal` | `Models/jpg/1k/modular_wooden_pier/modular_wooden_pier_planks_nor_gl_1k.jpg` | `b752108fe7504d5dd4ae0f4701b1218b` | `b23d7b0c23c9a41d50b7e1691e183902765aa4c21ac6ca6da678e874c4ddfb04` |
| `driftwoodArm` | `Models/jpg/1k/modular_wooden_pier/modular_wooden_pier_planks_arm_1k.jpg` | `e6ffdf7314cc015aaa5c0899326b42a7` | `4c03bcee7d0fb9708be5e5ebc4dd5fd73789f4eb24b6391dff6167f11c3ce95d` |
| `frame01Color` | `Models/jpg/1k/hanging_picture_frame_01/hanging_picture_frame_01_diff_1k.jpg` | `4311cd03620cafa59976f9e8b7b26f88` | `a6aa51141299ff7366b6e1ac1496dee2d8bd2d6fe775ea7d1fbbb299b2afb5e8` |
| `frame01Normal` | `Models/jpg/1k/hanging_picture_frame_01/hanging_picture_frame_01_nor_gl_1k.jpg` | `2ff7cca9a9b2918b5476d39c13592214` | `6f16f93ee6fcffb27dbd5ebf3de8fda71c77c7e1abd61ae9261715029be4d43e` |
| `frame01Arm` | `Models/jpg/1k/hanging_picture_frame_01/hanging_picture_frame_01_arm_1k.jpg` | `8d9dd625ec0705f3ac0a2ec2b402844e` | `aec54462e91d53610f46b2bb760cbdf453e7b87c5193efa24f995cd5bb0253bc` |
| `frame02Color` | `Models/jpg/1k/hanging_picture_frame_02/hanging_picture_frame_02_diff_1k.jpg` | `906c164baad3f02b67244998b7558a9c` | `575f2b6481b9e02474750ded776a0b490744228cb64d9b346f28bd78b9cf5897` |
| `frame02Normal` | `Models/jpg/1k/hanging_picture_frame_02/hanging_picture_frame_02_nor_gl_1k.jpg` | `bc686a415608ae66bd88f70d081fd572` | `79367cf9d7e4981263dd1439297585148d6c93500acaffa7afeb534351e68b86` |
| `frame02Arm` | `Models/jpg/1k/hanging_picture_frame_02/hanging_picture_frame_02_arm_1k.jpg` | `01e09bbe488c7a2953b5a207fdf192ca` | `67378630bc6bb69799f8ee0fde4ab11ecd9e7a43ed3dfef402fdd784d8c2cea3` |

Fifteen sources become fourteen shipped files: `wetSandColor` and `wetSandArm`
are not shipped on their own. They are composited into `sand-color.webp` and
`sand-arm.webp` as the damp band, so the count differs by design.

### Encode settings

Every LDR output is WebP at `effort: 6`, and every resize is Lanczos-3 with
`fit: "fill"`. Beyond that the pipeline splits three ways.

**Colour maps** other than the sand (`quality: 88`, lossy) are resized and
encoded with no grade at all. The `GOLDEN_HOUR_TINT = [1.04, 1.0, 0.94]` warm-up
that shipped with the previous coastal HDRI is gone: the sky is now a bright
sunrise rather than a low golden hour, and warming every albedo toward orange
fought the white sand it sits on.

**Data maps** — every `*-normal` and `*-arm` output — take the same
`quality: 88` encode and are never graded. Scaling a normal or an ARM channel
would corrupt the vector or the roughness it encodes.

**The two sand maps** are composites rather than plain resizes, and both grades
below are applied on raw pixel buffers rather than through Sharp's `linear`.
That is deliberate: Sharp applies its operations in a fixed internal order, not
call order, so a `linear` on the dry base landed *after* the `composite` and
graded the damp band a second time — measured L\* 71.7 for fully-wet sand
against dry sand's 58.5, i.e. wet sand brighter than dry.

`sand_03` is the dry base, chosen for grain: its high-frequency grain RMS is
10.33 against `coast_sand_01`'s 30.93, so it reads as fine sand rather than
gravel. Ungraded it is too dark and too warm (L\* 41.4 at 27.1% mean
saturation), so `WHITE_SAND_GAIN = [1.38, 1.44, 1.6]` lifts it to **L\* 58.0 at
15.5% saturation** with no clipped pixels — bright and near-neutral. The blue
channel is lifted hardest because the residual cast is yellow; a uniform gain
would raise lightness and leave saturation untouched, since saturation is a
ratio.

`damp_sand` is layered over it with a smoothstep alpha ramp starting at
`WET_BAND_START_V = 0.62` and feathering over `WET_BAND_FEATHER_V = 0.30`.
Before compositing, the damp colour is pulled toward its own luminance by
`WET_SAND_CHROMA_KEEP = 0.35` and lifted by `WET_SAND_GAIN = 1.25`. This is the
fix for the waterline reading as a *different colour* of sand: raw `damp_sand`
measures 55.6% mean saturation against the graded dry sand's 15.5%, an 86%
relative chroma jump at comparable lightness, so the band was not darker sand
but oranger sand. Graded, it measures **L\* 51.6 at 22.9% saturation** — still
visibly damper and darker than the dry sand, which is what wet sand does, but
inside the same colour family. `validateSandBands` asserts all three properties
after every run: wet darker than dry, dry above L\* 55, and no row-to-row
saturation step above 2 points (measured: 0.41).

The ARM map takes the same composite with neither grade. Its channels are
ambient occlusion, roughness and metalness, so "saturation" there is not a
colour and desaturating it would corrupt the material data. `sand-normal.webp`
skips the composite path entirely: Poly Haven publishes `damp_sand` as colour
and ARM only, and inventing a damp normal would put fabricated slopes under a
measured albedo.

`sky.hdr` is a **verbatim byte copy** of `table_mountain_1_puresky_1k.hdr` — its
shipped SHA-256 equals the downloaded SHA-256 above. Sharp is deliberately
absent from that path and the script asserts the copy is bit-identical,
because the sun's above-1.0 radiance values only survive in the original float
encoding and a future "just resize it" edit must fail the pipeline rather than
silently ship LDR.

`water-normal.webp` has **no third-party source at all**. It is generated from
seeded tiling value noise (`WATER_NOISE_SEED = 0x5eab1234`,
`WATER_NORMAL_STRENGTH = 10`), converted to a normal map by central
differences on a wrapping lattice, and encoded **lossless** so the asserted
buffer and the written file agree byte for byte. The generator refuses to
write a tile whose opposite-edge delta exceeds `WATER_SEAM_TOLERANCE = 12`,
naming the failing axis, so a non-wrapping tile cannot reach the output
directory.

### Shipped files

Measured from disk on 2026-08-05.

| File | Dimensions | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `sand-color.webp` | 1024×1024 | 284,316 | `7d7b83dc129e3aa1a4930a40dc7e1f9f268408ed149dc9770c1f247306a8f3f8` |
| `sand-normal.webp` | 1024×1024 | 218,418 | `3a94745b40c78a970c186c1f9e9bbca607430fa5f123a8da1e2b63c7c4149428` |
| `sand-arm.webp` | 1024×1024 | 63,890 | `bed78ab66af912c468e3752a79c0320685d24f70303035fc8de38d0fc319ff67` |
| `water-normal.webp` | 512×512 | 113,206 | `ed2e2cf9f5c7f4a54c5cf318b64996ee100e621a4f3f6829b9fda6ee645f9864` |
| `sky.hdr` | 1024×512 | 1,381,374 | `ced63bc210a2cae807dd6aa6dbad28dd754f6e7caf0b3082da05ba7620fe033a` |
| `driftwood-color.webp` | 512×512 | 64,118 | `15bb1848c280927bf3033136c5e5cce6e3ca99a76cb2bcc79120cc3539e5c5c5` |
| `driftwood-normal.webp` | 512×512 | 85,528 | `aadf676e9d7d0f43daa58565c4d6c6a35a1911375bed7dcc35cac08ce41b082f` |
| `driftwood-arm.webp` | 512×512 | 38,236 | `2f43c4e50609f750d641f016353df7da4c2c88b6aa316dee853bc413593fb631` |
| `frame-01-color.webp` | 512×512 | 12,426 | `10dcc8f0b469747917fc3c61ebbfe409b2dbdd8df6655ff79a91f6af810fd876` |
| `frame-01-normal.webp` | 512×512 | 4,630 | `0a3e01a821f8d2f581e9c33e20156b0fd2890a2f0f1f095c02dd790cc0389d1f` |
| `frame-01-arm.webp` | 512×512 | 13,518 | `f8d6ad9a06b0d7fb1eee5811940ad5e3ca355b68e46537e55ebcd52ba7f48c8d` |
| `frame-02-color.webp` | 512×512 | 24,326 | `ac940461b83d1c82213408b99fb48942c06bcb067e7b78658e3ca1b201c173e1` |
| `frame-02-normal.webp` | 512×512 | 6,598 | `5bce1b61e83ebb0c59e887534174e7d717ac31052ab06f410ef4415e7796b9ef` |
| `frame-02-arm.webp` | 512×512 | 14,638 | `12e467f4929468d35b440eb8bef43c8cbad1959b6a885a247421237c69a8bd48` |

The five entry-blocking assets (the three sand maps, the water normal and the
sky) total 2,061,204 bytes; all fourteen total 2,325,222 bytes. Both sit well
under the delivery budgets of 4 MB entry-required and 12 MB shared.

Decoded, the shared pack is 32.0 MiB, down from 44.0 MiB: removing the pier left
the `modular_wooden_pier` maps dressing only the driftwood posts, which are
0.15m-wide cylinders seen from 2m and up, so all three dropped from 1024² to
512². With three live 1k gallery photos the decoded total is **48.0 MiB of the
64 MiB ceiling**, leaving 16.0 MiB of headroom rather than the 4.2 MiB that
forced the frame maps down to 512² in the first place.

### Geometry is procedural, not downloaded

No `.glb` ships with this lab. The Poly Haven pier and picture-frame downloads
supplied **textures only** — the driftwood posts and the three hanging photo
frames are generated geometry in `src/components/beach-wedding-journey/`, and the
white-clothed reception tables and their flower centrepieces carry no maps at
all: linen has no pattern to sample, and the blooms are too small on screen to
resolve a petal texture, so both are geometry plus vertex colour. The visible sun
and its rays are likewise a shader on one additive billboard — the HDRI's sun disk
measures 2 pixels above 5% of peak luminance at 1k, so the environment is what
lights the beach, not what shows a sunrise.

### Running the diagnostics and visual suites

The beach reader is published only when the server resolves
`BEACH_RUNTIME_DIAGNOSTICS=1` per request, so a production build can opt in for
tests while real visitors never receive it. The lab itself is behind
`BEACH_WEDDING_JOURNEY_LAB_ENABLED=1`; both are set by the `beach` Playwright
project, which pins `workers: 1` because a shared GPU breaks the frame budget.

```bash
E2E_PORT=3131 BEACH_RUNTIME_DIAGNOSTICS=1 npx playwright test --project=beach
```

The Playwright web server is reused locally, so restart it when toggling either
flag or after changing server-side code.

## Thập Nhị Chi Đỏ zodiac artwork (2026-08-05)

The twelve animal masters in
`public/chungdoi/images/themes/_decor/thap-nhi-chi-do/source/` were generated
with the built-in ImageGen tool specifically for this repository. Each animal
was generated separately while visually referencing the in-repo Song Phụng
artwork (`songphung-red/Phuong 2.webp` and the accepted dragon master) so the
set shares the invitation's tall Vietnamese lacquer and paper-cut silhouette.

Prompt family: one full-body animal in a narrow vertical composition; flat
Vietnamese lacquer/paper-cut ornament; ivory subject with crisp internal
cut-outs on a uniform `#00ff00` chroma background; generous edge padding; no
text, watermark, frame, flowers, clouds, ground, shadow, gradient, crop, or
additional creature. Species-specific anatomy was reinforced for every prompt,
including Vietnamese water-buffalo horns, a cat rather than a rabbit for Mão,
and a legless python for Tỵ.

`scripts/generate-zodiac-artwork.mjs` keys those accepted local PNG masters,
normalizes them to the two legacy Song Phụng canvas sizes, and writes 24 alpha
WebP masks. The same script derives the Rồng/Phượng fallback pair and both line
variants, yielding 26 masks in total. RGB is normalized to `#d4a24a`, but the
runtime uses the alpha as a CSS mask so `--zodiac-art-color` can recolor every
animal without regenerating files.

The fallback phoenix alpha comes from the existing self-hosted
`public/chungdoi/images/themes/songphung-red/Phuong.webp` and
`Phuong line.webp`. The flower copied by the generator comes from
`public/chungdoi/images/themes/_decor/songphung-red/HOA.webp`; opened-invitation
paper, flower, and happiness artwork remain the existing self-hosted Song Phụng
assets. No runtime request leaves the application origin.

## Hải Yến Thanh Thư sea photography

The hero band and the four scrolling decor dividers under
`public/chungdoi/images/themes/_decor/hai-yen-thanh-thu/photo/` are real sea
photographs, not generated imagery. Both sources are Poly Haven tonemapped
HDRI panoramas released CC0 1.0 (`https://polyhaven.com/license`).

| Panorama | Page | Download URL | Downloaded SHA-256 |
|---|---|---|---|
| Umhlanga Sunrise | `https://polyhaven.com/a/umhlanga_sunrise` | `https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/umhlanga_sunrise.jpg` | `eca284ee49844eadc13c594afbd34931516116a6434181de8496b86ec79f4a1f` |
| Blouberg Sunrise 1 | `https://polyhaven.com/a/blouberg_sunrise_1` | `https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/blouberg_sunrise_1.jpg` | `5153523ca5108c29c678e0477258c943c99c871e4e0cd9e88fec32e2da944c5f` |

`scripts/prepare-hai-yen-sea-photos.mjs` reprojects each 8192x4096
equirectangular panorama to a flat perspective crop with ffmpeg's `v360`
filter, then grades it toward the template's cerulean palette with Sharp
(desaturate, lift, pale-cerulean veil) so the photograph sits naturally on
cream paper. Panoramas are cached in the gitignored `tmp/sea-src/`; only the
graded WebP crops are committed.

| Output | Source panorama | Camera (yaw / pitch / hFov / vFov) | Size |
|---|---|---|---|
| `sea-hero.webp` | Umhlanga Sunrise | 36 / 2 / 92 / 52 | 1024x580 |
| `sea-band-waves.webp` | Umhlanga Sunrise | 78 / -4 / 78 / 15 | 1280x280 |
| `sea-band-foam.webp` | Umhlanga Sunrise | 88 / -2 / 72 / 14 | 1280x280 |
| `sea-band-horizon.webp` | Umhlanga Sunrise | 10 / 0 / 90 / 12 | 1280x220 |
| `sea-band-shore.webp` | Blouberg Sunrise 1 | 8 / -6 / 84 / 16 | 1280x250 |

CC0 requires no attribution and permits commercial use; Poly Haven does not
name individual photographers for these panoramas. No runtime request leaves
the application origin — every crop is self-hosted.

## Minimalism Xanh Ngọc derivative asset pack

The assets under `public/chungdoi/images/themes/_decor/minimalism-jade/` and
`public/chungdoi/images/giftbox/minimalism-jade/` are project-local derivatives
of the existing self-hosted `minimalism-dark-red` asset pack. ImageGen was used
to establish the jade/seafoam/antique-gold art direction; the production WebP
files were then recolored from the local originals while retaining their exact
dimensions, silhouettes, and alpha channels. Neutral paper and castle textures
were copied unchanged into `public/chungdoi/images/themes/minimalism-jade/`.
The palette was softened in August 2026 at the user's request. ImageGen
`precise-object-edit` references established a pale mint-jade direction
(`#CDE7DE`, `#A9D8C8`, `#7FB7A7`); the production WebP assets were regenerated
deterministically from the local dark-red originals so dimensions and alpha
channels remain identical while avoiding the earlier saturated teal treatment.
No competitor asset was downloaded and no runtime request leaves the app.

## Minimalism Xanh Bầu Trời derivative asset pack

The assets under `public/chungdoi/images/themes/_decor/minimalism-sky-blue/`
and `public/chungdoi/images/giftbox/minimalism-sky-blue/` are project-local
derivatives of the existing self-hosted `minimalism-dark-red` pack. ImageGen
established the low-saturation powder-blue, cloud-white, silver-sage and
antique-gold direction; production WebP files were recolored from the local
originals to retain exact dimensions, silhouettes and alpha. Neutral paper and
castle textures were copied unchanged. No competitor asset was downloaded and
no runtime request leaves the app.
### Minimalism Hồng Phấn derivative asset pack

- Project paths: `public/chungdoi/images/themes/_decor/minimalism-powder-pink/`, `public/chungdoi/images/themes/minimalism-powder-pink/`, and `public/chungdoi/images/giftbox/minimalism-powder-pink/`.
- Source: project-local `minimalism-dark-red` artwork. ImageGen `precise-object-edit` references established the blush-pink art direction; production WebP files were recolored deterministically from the local originals to preserve exact dimensions and alpha channels.
- Palette: powder pink, dusty rose, warm ivory, muted foliage, and antique champagne gold. No additional competitor assets were downloaded.

## Hoa Thủy Tinh Đỏ clone assets (2026-08-28)

`crystal-floral-red` reproduces the public Chung Đôi demo at
`https://chungdoi.com/vi/mau-thiep/hoa-thuy-tinh-do/demo`. The eleven decorative
WebPs under `public/chungdoi/images/themes/crystal-floral-red/` were downloaded
without modification from `https://chungdoi.com/images/themes/crystal-floral-red/`.
The gift envelope at
`public/chungdoi/images/envelope/crystal_floral_red.webp` came from the matching
`https://chungdoi.com/images/envelope/` path. The seven gallery WebPs under
`public/chungdoi/images/gallery/crystal-floral-red/` are local copies of the CDN
images requested by that public demo, and
`public/chungdoi/music/crystal-floral-red.mp3` is a local copy of
`https://cdn.chungdoi.com/music/la-anh.mp3`. No runtime request to those source
hosts is required. Confirm redistribution rights before using these downloaded
clone assets outside the Chung Đôi/Thiệp Mừng Online product context.

## Bạch Sứ Lam (`porcelain-blue`) — 2026-09-04

Theo yêu cầu clone trực tiếp từ `https://chungdoi.com/vi/mau-thiep/bach-su-lam/demo`, artwork theme (`floral-tile.webp`, `frame-decoration.webp`, `cake.webp`, `home.webp`, `music.webp`), hộp quà `porcelain_blue.webp`, bảy mini gift decor và chín ảnh demo từ `cdn.chungdoi.com/uploads/` được lưu cục bộ dưới `public/chungdoi/images/themes/porcelain-blue/`, `public/chungdoi/images/giftbox/` và `public/chungdoi/images/gallery/porcelain-blue/`. URL nguồn, kích thước, vai trò và bằng chứng viewport được ghi chi tiết tại `docs/research/porcelain-blue.md`. Không sao chép API key hay cấu hình dịch vụ của trang nguồn.
## Bốn biến thể Bạch Sứ (`porcelain-red`, `porcelain-brown`, `porcelain-v2-red`, `porcelain-v2-green`) — 2026-09-04

Theo yêu cầu clone trực tiếp từ bốn demo công khai của Chung Đôi, các artwork dưới đây được lưu cục bộ; runtime không cần gọi `chungdoi.com` hay `cdn.chungdoi.com`. Không sao chép Google Maps API key, canary hoặc tracking pixel. Kiểm tra quyền phân phối lại trước khi dùng các clone asset ngoài ngữ cảnh sản phẩm Chung Đôi/Thiệp Mừng Online.

### Bạch Sứ Đỏ

- Theme `https://chungdoi.com/images/themes/porcelain-red/{frame-decoration,floral-tile,cake,home,music}.webp` → `public/chungdoi/images/themes/porcelain-red/`.
- Gift `https://chungdoi.com/images/envelope/porcelain_red.webp` → `public/chungdoi/images/envelope/porcelain_red.webp`.
- Gallery theo thứ tự local `01.webp` … `07.webp`: `https://cdn.chungdoi.com/uploads/b6df2634-2079-42b3-a2d1-936701deba2a.webp`, `https://cdn.chungdoi.com/uploads/d455d6e8-19ba-4c10-a991-7995235f9fba.webp`, `https://cdn.chungdoi.com/uploads/e09d3883-3b29-48b8-931e-1b49d614daa1.webp`, `https://cdn.chungdoi.com/uploads/5b624f5e-0d4c-46b9-9fde-4e33ccf7d504.webp`, `https://cdn.chungdoi.com/uploads/c723b909-d399-4cf1-99a3-3f13c2aebc96.webp`, `https://cdn.chungdoi.com/uploads/80e87f37-77d1-41b0-b6e7-8361959cd88e.webp`, `https://cdn.chungdoi.com/uploads/6741a834-8163-4ae0-b7f8-08eba96c674e.webp` → `public/chungdoi/images/gallery/porcelain-red/`.

### Bạch Sứ Nâu

- Theme `https://chungdoi.com/images/themes/porcelain-brown/{frame-background,floral-tile,calendar-texture,cake,home,music}.webp` → `public/chungdoi/images/themes/porcelain-brown/`.
- Gift `https://chungdoi.com/images/envelope/porcelain_brown.webp` → `public/chungdoi/images/envelope/porcelain_brown.webp`.
- Gallery theo thứ tự local `01.jpg` … `06.jpg`: `https://cdn.chungdoi.com/uploads/d30fe2fc-7c30-4c1c-8515-83142e714040.jpg`, `https://cdn.chungdoi.com/uploads/869c2794-6378-4981-a7cb-045489cbc84f.jpg`, `https://cdn.chungdoi.com/uploads/d797b1a8-d52e-49a7-9f4f-c6688dd86f98.jpg`, `https://cdn.chungdoi.com/uploads/14435a15-ded0-4efd-881d-f274554b148d.jpg`, `https://cdn.chungdoi.com/uploads/3a42f7f7-4f7f-4a62-a65c-5da28d132114.jpg`, `https://cdn.chungdoi.com/uploads/8b354eab-5468-4b35-b061-efd15a560a42.jpg` → `public/chungdoi/images/gallery/porcelain-brown/`.

### Bạch Sứ V2 Đỏ

- Theme `https://chungdoi.com/images/themes/porcelain-v2-red/{hero-frame,floral-tile,flower,ring,cake,lamp}.webp` → `public/chungdoi/images/themes/porcelain-v2-red/`.
- Gift `https://chungdoi.com/images/envelope/porcelain_v2_red.webp` → `public/chungdoi/images/envelope/porcelain_v2_red.webp`.
- Gallery theo thứ tự local `01.webp` … `08.webp`: `https://cdn.chungdoi.com/uploads/17ce84ea-7751-42ce-ad5b-cf58325ac9da.webp`, `https://cdn.chungdoi.com/uploads/ec7dbf4a-464b-4ce8-acf9-31b17e2c02a2.webp`, `https://cdn.chungdoi.com/uploads/afc8a84d-bae9-4cf8-9c47-c11802512685.webp`, `https://cdn.chungdoi.com/uploads/c12286e4-d5c9-4505-a039-59db5e2b8639.webp`, `https://cdn.chungdoi.com/uploads/cec35085-eef7-46eb-a3d5-a52923d917d6.webp`, `https://cdn.chungdoi.com/uploads/6a5e8ee4-9fc5-4ac5-a262-ad285cab00b4.webp`, `https://cdn.chungdoi.com/uploads/6be91e7d-803c-4f23-aff6-f949b40b965f.webp`, `https://cdn.chungdoi.com/uploads/d2bd604d-b841-4afc-bcd7-f6d11ee59dfc.webp` → `public/chungdoi/images/gallery/porcelain-v2-red/`.

### Bạch Sứ V2 Xanh

- Theme `https://chungdoi.com/images/themes/porcelain-v2-green/{hero-frame,floral-tile,flower,ring,alcohol,heart}.webp` → `public/chungdoi/images/themes/porcelain-v2-green/`.
- Gift `https://chungdoi.com/images/envelope/porcelain_v2_green.webp` → `public/chungdoi/images/envelope/porcelain_v2_green.webp`.
- Gallery theo thứ tự local `01.webp` … `08.webp`: `https://cdn.chungdoi.com/uploads/1174458a-fd65-41ed-b86c-626e9366faa2.webp`, `https://cdn.chungdoi.com/uploads/46095f86-8b18-45e5-a976-29bca1a0e81e.webp`, `https://cdn.chungdoi.com/uploads/9c3474ac-7901-4a12-ae86-a25d5c9f19e9.webp`, `https://cdn.chungdoi.com/uploads/6e886222-ae30-4a61-aa29-6a516fe20973.webp`, `https://cdn.chungdoi.com/uploads/1ab169c9-002e-4823-b565-88098c57e4d9.webp`, `https://cdn.chungdoi.com/uploads/069d9196-89c0-46cd-909d-e639c4bedfed.webp`, `https://cdn.chungdoi.com/uploads/51b92bed-5553-4fd0-833f-80eafebedf91.webp`, `https://cdn.chungdoi.com/uploads/3d851ee4-2624-4e33-9c00-e82ae1507c91.webp` → `public/chungdoi/images/gallery/porcelain-v2-green/`.

Chi tiết viewport, geometry, interaction state, broken-resource audit và các giới hạn xác minh nằm trong bốn thư mục `docs/research/porcelain-*` tương ứng.
