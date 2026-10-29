# Full-resolution WebP upload compression

## Current contract

The user's correction is explicit: only compress to WebP and preserve the
original image dimensions. Editor2 album/cover, legacy editor album/cover and
admin mobile thumbnail uploads share `src/lib/compress-upload-image.ts`.

The browser decodes the image with EXIF orientation, draws it at its original
oriented pixel dimensions and encodes WebP at quality 0.82. It uses that file
only when it is smaller than the source. There is no 1600px edge limit, scaling,
cropping or enlargement. Transparency is preserved.

Unsupported WebP encoders, including the tested WebKit build, send the untouched
original file. JPEG/PNG fallback recompression has been removed. The server
converts uploads to WebP at the original oriented resolution too; no resize
preset is supplied by `/api/upload`. Other media endpoints keep their own
existing resize presets.

Files below 64 KiB and WebPs at or below 512 KiB avoid redundant recompression.
GIF and undecodable HEIC retain the existing server conversion. Browser buffers,
object URLs and canvas memory are released after each attempt. Sequential album
processing preserves file order and avoids decoding the full album at once.

The 50 MiB source cap, 60-million-pixel decoder guard, request/auth validation,
WebP output limit and upload URL contracts remain. When output is too large,
server quality retries may reduce file size but cannot reduce pixel dimensions
in this full-resolution mode. If no quality fits, the existing output-too-large
error is returned. Server validation and metadata stripping still run.

## Existing autosave correction

Returning to a saved template while an older save was pending could retain an
unsaved status or stale persisted template. The debounce queues acknowledgement
of the current draft even when it initially matches the last saved snapshot.
A deterministic browser test holds the older action, restores the old template,
and checks the stored template and image after reload.

## Platform references

[`createImageBitmap`](https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap)
uses `imageOrientation: "from-image"`. An image-element decoder is available as
a fallback. [`canvas.toBlob`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)
may return PNG when WebP encoding is unavailable; the actual MIME type is checked
and that PNG is discarded. No new dependencies were added.

## Verification contract

- Unit cases cover full-resolution storage (3600x2400) and rejection when the
  byte limit cannot be met without resizing. Other endpoint presets are tested.
- Browser cases assert a 3200x2400 JPEG remains 3200x2400 in the transmitted
  WebP (or unchanged original) and the stored WebP.
- EXIF portrait orientation is applied once: 2400x1600/orientation 6 becomes
  1600x2400 in storage. A 2200x1800 transparent PNG keeps its dimensions/alpha.
- Tests cover Chromium and WebKit, unsupported encoders, missing bitmap API,
  HEIC fallback, album order, legacy integration and serialized autosave.
- Previous 79–88% savings measurements used the removed 1600px resize policy;
  they do not describe this full-resolution implementation. Current transfer
  measurements and deployment results are recorded in completion evidence.

## Verified results

Lint: zero errors (402 existing warnings); application/test typechecks passed.
Seven targeted server/upload unit tests passed. All 18 browser cases passed in
Chromium and WebKit, including original transmission on unsupported WebP,
full-resolution stored dimensions, EXIF and alpha checks, reload and autosave.
The full-resolution synthetic JPEG fixture went from 7,793,023 to 5,055,354
bytes in Chromium (35% less), retaining 3200x2400 pixels. Tested WebKit sent its
original unchanged and stored a full-resolution WebP on the server.
