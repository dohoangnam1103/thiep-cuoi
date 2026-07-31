# Long Phụng Gatefold — mini asset production prompts

## Status

These are production prompt drafts. Do not generate all assets in one composite
image and do not promote any output directly to runtime.

Required visual reference:

```text
concepts/selected-a-engraved-restraint-v2.png
```

The concept board controls:

- sparse engraved linework;
- dragon/phoenix proportion and center-facing gesture;
- lacquer crimson and restrained antique gold;
- negative-space density;
- material restraint.

It does not control exact anatomy, alpha, masks or PBR data. Those require
separate validation.

## Shared constraints

```text
Use case: stylized-concept
Asset type: layered production artwork for an interactive 3D wedding invitation
Input images: Image 1 is the selected visual-direction reference, not an edit target
Style/medium: sparse antique-gold engraved linework and shallow relief, matching Image 1
Lighting: no baked highlight; material light will be rendered in Three.js
Palette: antique gold artwork only; no red lacquer background inside the asset
Constraints: no text, letters, characters, monograms, logos, signatures or watermark; anatomically coherent; generous safe padding; no clipped whiskers, claws, wings, crest or feathers
Avoid: full-cover composite, background scene, cast shadow, contact shadow, glow, plastic, fantasy redesign, mirrored anatomy
```

## Dragon master and layers

### `dragon-left-master`

```text
Primary request: isolate the full slender center-facing serpentine dragon from the selected direction as a clean master composition for the left gatefold wing
Pose/composition: tall portrait silhouette; head in the upper third facing right toward the center seam; body creates one controlled S curve; readable claws; whiskers have generous padding; balanced empty space around the silhouette
Must preserve: restrained engraving density, center-facing gaze, long vertical rhythm
Required future layers: body; whiskers; front cloud accent
```

### `dragon-body-left`

```text
Primary request: dragon body layer only
Constraints: omit both long whiskers and omit detached cloud accents; preserve the exact master silhouette and registration; complete anatomy where the removed layers overlap
```

### `dragon-whiskers-left`

```text
Primary request: only the two long whiskers and their small root attachment region from the approved dragon master
Constraints: exact full-canvas registration with dragon-left-master; no head, body, claws, clouds or shadow
```

## Phoenix master and layers

### `phoenix-right-master`

```text
Primary request: isolate the full center-facing phoenix from the selected direction as a clean master composition for the right gatefold wing
Pose/composition: tall portrait silhouette; head in the upper third facing left toward the center seam; crest, near wing and long layered tail remain identifiable at mobile scale; generous padding around all feathers
Must preserve: restrained engraving density, elegant vertical posture, clear separation of body, front wing and front tail group
Required future layers: body; front wing; front tail group
```

### `phoenix-body-right`

```text
Primary request: phoenix body layer only
Constraints: omit the near/front wing and omit the front tail-feather group; preserve exact master registration; complete the underlying body where moving layers overlap
```

### `phoenix-wing-front-right`

```text
Primary request: only the near/front phoenix wing plus a minimal hidden root attachment region
Constraints: exact full-canvas registration with phoenix-right-master; no body, head, legs, tail, clouds or shadow
```

### `phoenix-tail-front-right`

```text
Primary request: only the front-most grouped tail feathers plus a minimal hidden root attachment region
Constraints: exact full-canvas registration with phoenix-right-master; no body, wing, head, legs, clouds or shadow
```

## Cloud layers

### `cloud-back`

```text
Primary request: sparse engraved auspicious cloud curves that sit behind both animals and never enter the center text safe zone
Composition: full gatefold coordinate system; low density; wider shapes that survive mobile reduction
Constraints: no animals, border, text, lacquer background or shadow
```

### `cloud-front`

```text
Primary request: two or three small foreground cloud accents designed to cross in front of the lower animal silhouettes during opening
Composition: full gatefold coordinate system with clear separation between cloud groups
Constraints: no animals, border, text, lacquer background or shadow
```

## Material masks

Material masks must be derived from the approved masters after cleanup. They are
not independent creative generations.

### Foil mask

```text
Binary or antialiased grayscale data map matching the cleaned approved color master exactly.
White means foil; black means no foil.
No color, lighting, texture, drop shadow or background.
Foil coverage must remain selective rather than filling the entire silhouette.
```

### Emboss mask

```text
Grayscale height-source map matching the approved engraved relief exactly.
No color, lighting, shadow, metallic highlight or background.
Use smooth height transitions and avoid hard plateaus around thin engraving.
```

### Shadow pass

```text
Do not ask the image model to invent scene lighting.
Generate only if an illustration AO pass is still needed after the Three.js
lighting test; otherwise use real-time contact/occlusion shadow.
```

## Surface sources

- `paper-color` starts from a licensed/scanned cotton-paper source or a
  procedurally generated neutral surface.
- `paper-normal` is derived from a cleaned height source, not from an AI color
  image.
- `foil-roughness` is a neutral material-data texture with no decorative motif.
- All three textures must tile without a visible seam.

## Required review after each master

1. Anatomy and number of limbs/feathers.
2. Silhouette at projected widths `320px` and `390px`.
3. Alpha on light, dark, red and green diagnostic backgrounds.
4. Exact registration between master and animation layers.
5. Pivot placement and occlusion at `0%`, `50%` and `100%` opening.
6. Mask alignment and absence of baked lighting.
7. Runtime byte size and whether a mobile variant is necessary.
