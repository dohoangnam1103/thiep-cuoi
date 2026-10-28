# Mobile save / publish bar

Request: move Save and Publish from the Editor2 mobile header into a persistent
bottom bar. Scope is `/editor2/[id]` and its existing save/publish action group.

The same controls and single live save status remain mounted once. A scoped
class fixes that group to the viewport bottom on widths up to 767px, and on
coarse-pointer devices up to 1024px so phone landscape keeps the bar. Desktop
retains the header placement. No handlers, state, authentication, save queue,
publication flow, catalog copy or schema are changed.

The bar uses the existing warm paper, border and red primary action. Buttons
remain at least 44px high. Bottom padding includes `safe-area-inset-bottom`;
the workspace reserves 88px plus that inset so its last content can scroll clear
of the bar. The bar's z-index is 45, below the existing dialog backdrop at 50.
No new artwork or animation is introduced. The status may wrap on narrow
screens so save errors remain readable without pushing buttons off screen.

Expected files: `workspace.tsx` (action-group class), `editor2.css` (mobile bar
and reserved space), `editor2-bindings.edge.audit.ts` (responsive regression),
and this note. Existing styling and messages are reused.

PHASE: inspect
STATUS: complete
CHANGED: none
VERIFIED: attached screenshot, header controls, save/publication callbacks, modal stacking and existing responsive rules
UNVERIFIED: final mobile/footer behavior
RISKS: overlapping template artwork, insufficient bottom space, long save-error copy and phone rotation
NEXT: apply mobile-only positioning to the existing action group

PHASE: plan
STATUS: complete
CHANGED: none
VERIFIED: one set of controls; no new product flow, copy, assets or persistence contract
UNVERIFIED: viewport pinning and real pointer access
RISKS: physical mobile safe-area and keyboard behavior require device verification
NEXT: test desktop/tablet, narrow portrait and touch landscape

PHASE: implement
STATUS: complete
CHANGED: workspace.tsx, editor2.css, editor2-bindings.edge.audit.ts
VERIFIED: lint and application/test typechecks passed; desktop/tablet controls retain header position
UNVERIFIED: final phone cases and screenshots pending
RISKS: physical-device/browser behavior beyond the local Chromium checks
NEXT: verify footer at start/middle/end of the invitation, saving/error recovery and publication dialog layering
