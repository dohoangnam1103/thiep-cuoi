# Editor2 save feedback

## Problem and behavior

The published editor2 Save button previously only invoked persistence. There
was no toast host or save acknowledgement, especially when autosave had already
persisted the same draft and the manual call correctly avoided another write.

Editor2 now mounts the existing AdaptiveToaster. Manual saves show a loading
toast followed by a success acknowledgement or an error with the translated
specific reason. The button reads “Đang lưu…” while saving and prevents duplicate
requests. Clicking Save for an unchanged saved draft still confirms success.
One toast ID per invitation updates the current notice instead of stacking it.

Successful background autosaves retain the quiet status indicator. Failed
background saves show the same error toast, including server validation/session
rejections and network exceptions. Failure leaves editing and retry available.
Save-and-navigate/publish flows retain their boolean success gate and show errors
when their prerequisite save fails. The serialized queue now returns a typed
success/failure result so each notice uses its own request's outcome/reason.

Server actions, database contracts, publication checks and autosave debounce are
unchanged. Catalog copy is in editor2.saveSuccess/saveFailed and existing
editor2.saving/networkError and editor.errors keys. Legacy editor already has a
toast host and explicit save success/error notices, so its flow is unchanged.

## Verification

Ten E2E cases pass across Chromium and WebKit/iPhone emulation, covering delayed
response (no premature success),
loading/success at 1440/390px, actual database persistence and reload, quiet
background success, three unchanged manual saves without duplicate DB writes,
network failure/retry and server session rejection during autosave. Narrow toast
bounds stay inside the viewport after the opening animation. Screenshots: /tmp/editor2-evidence/save-success-1440.png
and /tmp/editor2-evidence/save-success-390.png. Lint and application/test typechecks
pass. Five additional publication/queue regression cases pass. The mobile toast
screenshot was visually inspected. Production verification is recorded separately.
