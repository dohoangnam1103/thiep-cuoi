# Doraemon wedding cast — generated asset prompts

Generation mode: built-in `imagegen`.

The images in `concepts/chroma/` are the generated source images. The images in
`concepts/cutouts/` are locally processed transparent PNGs for layout testing.

## Shared direction

```text
Use case: illustration-story
Asset type: full-body transparent character cutout for a premium Three.js wedding invitation
Style/medium: polished original Japanese family-anime fan-art, clean confident ink contours, refined cel shading, gentle modern theatrical key-visual finish, consistent line weight and proportions across a five-character set
Composition/framing: one character only, full body visible from head to shoes, centered upright three-quarter pose, generous padding on every edge, front-facing enough for a wedding group composition
Lighting/mood: soft clean studio-like cel lighting, cheerful and elegant, no dramatic rim glow
Constraints: perfectly flat single-color chroma-key background, completely uniform with no gradient, texture, floor, horizon, shadow, reflection, halo, scenery, text, logo, signature, or watermark; crisp closed silhouette; no cropped limbs; exactly one character; natural hands; wedding-safe and family-friendly
```

## Nobita — groom

```text
Background: pure chroma green #00FF00.
Subject: adult wedding-age Nobita Nobi, round glasses, black bowl-cut hair and a shy, warm expression; deep navy tuxedo, white shirt, pale-blue bow tie and yellow boutonniere; slim build; one hand adjusting his jacket.
Avoid: child version, school outfit, shorts, green clothing or accessories, muscular proportions, extra people, bouquet covering the body.
```

## Shizuka — bride, accepted v2

```text
Background: pure chroma green #00FF00.
Subject: adult wedding-age Shizuka Minamoto with dark hair and warm eyes; elegant ivory A-line wedding gown with a pale-pink ribbon; short opaque ivory cel-shaded veil that is completely solid and not transparent or see-through; small bouquet of white and pale-pink flowers held low; modest and joyful.
Avoid: child version, school outfit, translucent fabric, huge ball gown, excessive train, sexualized styling, green details, extra people, cropped veil.
```

The v1 veil was rejected because translucent pixels retained green-screen color.

## Doraemon — ring bearer

```text
Background: pure chroma green #00FF00.
Subject: recognizable blue robot cat with white face and belly, red nose and collar, and yellow bell; pale-yellow bow tie; holding a small wedding-ring cushion.
Avoid: green details, human proportions, gadgets, extra people, floating objects, cropped feet.
```

## Jaian — best man

```text
Background: pure chroma green #00FF00.
Subject: adult wedding-age Jaian, broad stocky build, short dark hair, thick brows and a warm grin; charcoal suit, burnt-orange waistcoat and cream tie; restrained thumbs-up pose.
Avoid: green details, microphone, school clothes, aggressive expression, clenched fist, extra people.
```

## Suneo — groomsman

```text
Background: pure chroma magenta #FF00FF.
Subject: adult wedding-age Suneo, slim build, sharp swept black hair, pointed profile and playful smile; warm-gray double-breasted suit, white shirt, muted-teal tie and pocket square, polished shoes; one hand at his lapel.
Avoid: magenta or hot-pink wardrobe details, school clothes, exaggerated nose, extra people, cropped hair or shoes.
```

Suneo is keyed against explicit `#FF00FF`; automatic border sampling was rejected
because the generated magenta varied enough to misclassify skin tones.

## Transparent cutout processing

Green-screen assets use the bundled chroma-key helper with a soft matte, edge
feathering and despill. Suneo uses the same helper with an explicit `#FF00FF`
key. The accepted Shizuka v2 uses:

```sh
python3 remove_chroma_key.py \
  --input shizuka-bride-v2.png \
  --out shizuka-bride-v2.png \
  --auto-key border \
  --soft-matte \
  --transparent-threshold 10 \
  --opaque-threshold 90 \
  --edge-feather 0.8 \
  --despill
```
