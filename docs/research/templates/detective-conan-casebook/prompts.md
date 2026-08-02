# Detective Conan Casebook - generated character prompts

## Generation record

- Tool: built-in `image_gen`.
- Generation mode: new image, no reference image supplied.
- Taxonomy: `illustration-story`.
- Generated: 2026-07-31.
- Delivery: flat chroma-key PNG, then local alpha extraction and WebP
  optimization.

The generated chroma masters are stored in `source-keyed/`. Accepted transparent
PNGs are stored in
`public/chungdoi/templates/detective-conan-casebook/characters/source/`.

## Shared direction

```text
Use case: illustration-story
Asset type: production character-group cutout for a premium interactive wedding invitation
Primary request: depict the named Detective Conan characters as a polished celebratory ensemble, keeping their recognizable canonical facial features, hair silhouettes and proportions
Scene/backdrop: perfectly flat pure chroma green #00FF00, edge to edge
Style/medium: refined Japanese detective-anime key visual, clean confident ink contours, controlled cel shading, consistent line weight, crisp silhouette, elegant wedding-event finish
Composition/framing: every named character fully visible, no cropped hair, hands, clothing or feet, generous padding around the complete group, no overlap that obscures faces
Lighting/mood: clean neutral cel lighting, celebratory and composed, no dramatic glow
Constraints: no scenery, floor, horizon, cast shadow, reflection, text, numbers, logo, signature or watermark; avoid clothing or accessories matching the requested key color; natural hands; family-friendly presentation
```

## Shinichi Kudo and Ran Mouri - wedding cover

Source: `source-keyed/shinichi-ran-wedding-keyed.png`.

```text
Create one portrait-format full-body couple cutout on the shared chroma field.
Shinichi Kudo is the groom in a tailored deep-navy three-piece tuxedo, white
pleated shirt, burgundy bow tie, white rose boutonniere and polished black
shoes. Ran Mouri is the bride in a refined fitted ivory wedding gown with a
delicate lace neckline, pearl hairpiece, short opaque veil, white shoes and a
small white bouquet with one burgundy-red rose. They stand close, hold hands
near the bouquet and look warmly at each other. Preserve Shinichi's pointed
hair silhouette and Ran's distinctive hair shape. Keep the entire veil, gown
hem and both pairs of shoes inside the frame.
```

## Conan Edogawa and Kogoro Mouri - opening witnesses

Source: `source-keyed/conan-kogoro-keyed.png`.

```text
Create one portrait-format two-character full-body cutout on the shared chroma
field. Conan Edogawa stands in front wearing his blue blazer, white shirt, red
bow tie, gray shorts, white socks and red sneakers, adjusting his round glasses
with one hand and holding a small closed navy casebook in the other. Kogoro
Mouri stands behind him in a blue-gray wedding-guest suit, white shirt and
burgundy tie, one hand in his pocket and the other adjusting his tie. Preserve
Kogoro's narrow moustache and distinctive upright hair. Keep both characters
fully visible and separated enough for a clean shared silhouette.
```

## Detective Boys and Professor Agasa - schedule cast

Accepted source:
`source-keyed/detective-boys-keyed-green.png`.

```text
Create one landscape-format five-character full-body group cutout on the shared
chroma field. Arrange Ayumi Yoshida in a pale-pink party dress waving, Genta
Kojima in a dark forest formal jacket with a matching bow tie, Professor Agasa
in his familiar white coat over warm neutral clothes, Ai Haibara in a refined
burgundy party dress with crossed arms, and Mitsuhiko Tsuburaya in a light-blue
formal suit raising one index finger. Preserve each character's familiar
height, face and hairstyle. Build a readable shallow group arc with Professor
Agasa behind the children and all feet visible.
```

The first `detective-boys-keyed.png` attempt was rejected because its background
was not uniform enough for a clean matte. The green retry above is the accepted
source.

## Heiji, Kazuha, Sonoko and Masumi - friends cast

Source: `source-keyed/heiji-friends-keyed.png`.

```text
Create one landscape-format four-character full-body group cutout on the shared
chroma field. Heiji Hattori wears a fitted charcoal three-piece suit and blue
tie. Kazuha Toyama wears a coral wrap-style evening dress and carries a small
neutral clutch. Sonoko Suzuki wears a warm champagne-gold party dress and
headband in a cheerful hand-on-hip pose. Masumi Sera wears a modern ivory
trouser suit over a black top with both hands relaxed at the pockets. Preserve
their canonical face shapes, hair silhouettes and relative proportions. Space
the four figures clearly with every shoe visible.
```

## Shuichi Akai and Rei Furuya - allies cast

Source: `source-keyed/akai-furuya-keyed.png`.

```text
Create one portrait-format two-character full-body cutout on the shared chroma
field. Shuichi Akai stands on the left in a precise black three-piece suit,
black open-collar shirt and black knit cap, with a calm reserved expression.
Rei Furuya stands on the right in an elegant ivory three-piece suit over a pale
blue shirt, one hand in his pocket, with his recognizable blond hair and
composed expression. Pose them back-to-back with enough separation to preserve
both silhouettes. Keep both figures and shoes fully inside the frame.
```

## Transparent cutout processing

Four accepted chroma masters were copied into the repository and processed
with the bundled `imagegen` soft-matte helper:

```sh
python "${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/scripts/remove_chroma_key.py" \
  --input <source-keyed.png> \
  --out <characters/source/name.png> \
  --auto-key border \
  --soft-matte \
  --transparent-threshold 12 \
  --opaque-threshold 220 \
  --despill
```

The Detective Boys group contains dark forest-green clothing. Soft matte
processing made that subject color partially transparent, so the accepted
green-key retry used a conservative hard key instead:

```sh
python "${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/scripts/remove_chroma_key.py" \
  --input source-keyed/detective-boys-keyed-green.png \
  --out public/chungdoi/templates/detective-conan-casebook/characters/source/detective-boys.png \
  --auto-key border \
  --tolerance 30 \
  --edge-contract 1 \
  --force
```

Transparent corners, non-empty alpha bounds and edge spill were inspected after
processing. The accepted PNGs were converted with Sharp to one desktop WebP and
one mobile WebP per group:

| Group                    |     Desktop |     Mobile |
| ------------------------ | ----------: | ---------: |
| Shinichi and Ran         |  `864x1821` | `522x1100` |
| Conan and Kogoro         |  `864x1821` | `522x1100` |
| Detective Boys and Agasa | `1536x1024` |  `900x600` |
| Heiji and friends        | `1536x1024` |  `900x600` |
| Akai and Furuya          |  `864x1821` | `522x1100` |

No third-party raster image, web-sourced asset or reference image was supplied
to generation or compositing.
