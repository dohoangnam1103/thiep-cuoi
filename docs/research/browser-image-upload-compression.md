# Compress editor photos before sending them

## Scope and existing behavior

The editor already normalized images to WebP on the server, after receiving the
entire original file. This saved storage but did not reduce upload bandwidth.
The new browser helper runs before FormData is sent to `/api/upload` for editor2
album/cover slots, legacy editor albums/cover slots and admin mobile thumbnails.
The API, ownership checks, 50 MiB source cap, stored paths and server validation
remain unchanged. Other media endpoints retain their existing behavior.

## Compression contract

`src/lib/compress-upload-image.ts` decodes supported browser images, applies EXIF
orientation, scales inside a 1600px square without cropping or enlargement, and
encodes WebP at quality 0.82. Resolution and quality match the existing editor
storage preset in `src/lib/upload-image-limits.ts`. Alpha is preserved.

Files below 64 KiB and existing WebPs at or below 512 KiB avoid unnecessary
recompression. GIFs retain the existing server handling. The helper only uses a
nonempty WebP when it is smaller than the source. When WebP encoding is unavailable, the same resized canvas uses JPEG at quality
0.86 for opaque photos or PNG for transparency; the server still produces WebP.
Unsupported decoding or failed encoders, including HEIC on browsers without
native support, retain the original. No format is relabeled and only a smaller
file is sent.
Files over the original source cap cannot bypass the upload size guard by being
compressed first. Server image validation and sanitization still run.

Decode bitmaps, object URLs and canvases are released after each attempt. The
existing sequential album processing preserves selected order and avoids keeping
an entire album decoded at once. Editor2 remains locked during both compression
and upload and displays the catalog's optimizing status during preprocessing.

## Platform references

The bitmap decoder explicitly respects EXIF orientation using
[`createImageBitmap` with `imageOrientation: "from-image"`](https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap).
The image element decoder provides a fallback. The encoder checks the returned
MIME type because [`canvas.toBlob`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)
may return PNG when the requested encoder is unavailable, or null on failure.
No new dependencies were added.

## Verification

- Lint: zero errors; app and E2E typechecks pass.
- Existing server image normalization/upload-path unit cases: 5 pass.
- Browser compression E2E: 9 cases verified on both Chromium and WebKit/iPhone
  emulation (18 cases, including a focused orientation rerun), covering editor2 at 1440/390px, real multipart
  bytes, EXIF portrait rotation, alpha, album order, missing bitmap API, unavailable
  WebP encoder with JPEG/PNG fallback, HEIC server fallback and legacy album integration.
- Synthetic 3200x2400 JPEG fixture: 7,792,044 bytes became 958,706 bytes sent as a
  real 1600x1200 WebP, approximately 88% fewer image bytes before the request.
  This is a fixture measurement, not a guarantee of upload latency or savings
  for every photo or connection.
- WebKit fixture measurement: approximately 7.79 MB became 1.66 MB in its
  compatible JPEG fallback (79% fewer image bytes), then stored as WebP.
- EXIF orientation 6 produced 1067x1600; transparent PNG retained alpha 0/255
  on the corresponding transparent/opaque sides. Both uploaded successfully.
- Six existing upload-control/cover/album regressions passed across focused runs,
  including blocked modal dismissal until successful/failed upload completion.
- The upload regression exposed a preexisting autosave race: returning to the saved
  template while an older save was pending could retain an unsaved status or stale
  persisted template. The debounce now queues acknowledgement of the current draft
  even when it initially matches the last saved snapshot. A deterministic test
  holds the older server action, restores the previous template, and checks the
  final stored template and uploaded image after reload in both engines.
- Lint and both typechecks pass. Production build/deployment and final public
  verification are recorded in completion evidence after they finish.
