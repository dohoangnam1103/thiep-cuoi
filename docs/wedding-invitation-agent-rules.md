# Wedding Invitation Implementation Rules for AI Agents

## 0. Purpose

This document is the execution contract for creating or redesigning a wedding invitation template.

The visual direction MAY change completely. Product behavior MUST NOT change unless the task explicitly authorizes a behavior change.

## 1. Normative language

- `MUST`: required for completion.
- `MUST NOT`: prohibited.
- `SHOULD`: recommended unless a documented constraint prevents it.
- `MAY`: optional.

## 2. Inputs required before implementation

The agent MUST identify and record:

1. Target template, route, owning components, data types, and message keys.
2. Existing user flows: edit, save, preview, publish, share, authentication, permissions, and media handling.
3. Existing section inventory, including conditional and optional sections.
4. Reference screenshots or source pages for every required viewport and interaction state.
5. Asset inventory: exact file path, purpose, dimensions, format, license/provenance, and section assignment.
6. Explicit design tokens: colors, typography, spacing, borders, radii, shadows, motion, and breakpoints.
7. Acceptance criteria and known limitations.

If a required input is missing or ambiguous, the agent MUST stop and ask for it. It MUST NOT invent a visual asset, content structure, data field, or behavior.

## 3. Non-negotiable invariants

The agent MUST preserve:

- Existing data contracts, database fields, API behavior, and server/client boundaries.
- Editor state, autosave/manual save, draft, preview, publish, unpublish, and share flows.
- Authentication, authorization, ownership checks, and privacy boundaries.
- Existing invitation URLs and compatibility with already-published invitations.
- Existing message-catalog/i18n architecture; user-facing copy MUST NOT be hardcoded.
- Core section behavior and the rule that optional sections hide cleanly when data is absent.
- Form validation, error handling, loading states, empty states, and success feedback.

The agent MUST NOT refactor unrelated code, rename public data fields, remove existing functionality, or replace real assets with generic placeholders without explicit approval.

## 4. Required workflow

### Phase A — Inspect

1. Read the relevant project instructions and template-clone quality rules.
2. Inspect the target route, components, data, styles, assets, and tests without editing.
3. Produce an inventory of dependencies and a list of files expected to change.
4. Confirm which behavior is protected and which UI surface is in scope.

Completion condition: the agent can explain where every visible section gets its data and behavior.

### Phase B — Plan

1. Map each section to its component, data source, asset set, and responsive layout.
2. Define desktop, tablet, and mobile behavior before implementation.
3. Define loading, error, empty, disabled, modal, and success states.
4. Define the verification method for each section.

The agent MUST get clarification before implementation when a decision would alter logic, data, public URLs, or user workflow.

### Phase C — Implement

1. Implement one section or one coherent UI unit at a time.
2. Reuse existing shared behavior and primitives where compatible.
3. Keep presentation changes separate from data and business logic changes.
4. Use assigned assets exactly as mapped. Do not redraw artwork with CSS, SVG, canvas, or generated gradients when real artwork is required.
5. Keep animations purposeful, interruptible, and disabled or reduced when the user prefers reduced motion.
6. Optimize images and fonts without changing their intended appearance.

### Phase D — Verify each section

For every section, the agent MUST verify:

- Correct data rendering with realistic and missing data.
- Desktop, tablet, and mobile layout.
- Keyboard and screen-reader basics.
- Interaction states, validation, modal open/close, and navigation.
- Asset loading, aspect ratio, cropping, and fallback behavior.
- No console errors, hydration errors, broken links, or unintended layout shifts.

The agent MUST NOT proceed to the next section if the current section has an unresolved blocking defect.

### Phase E — Regression verification

The agent MUST run the cheapest relevant checks first, then broader checks:

1. Lint.
2. Typecheck.
3. Targeted unit and end-to-end tests.
4. Build or project-specific final gate.
5. Visual comparison at matching viewport, zoom, scroll position, and interaction state.

Passing lint or typecheck alone MUST NOT be reported as visual completion.

## 5. Section contract

Each section specification MUST contain:

- `id` and user-visible purpose;
- required and optional data fields;
- component/route owner;
- assigned assets and exact paths;
- desktop/tablet/mobile rules;
- interaction and accessibility rules;
- loading/error/empty behavior;
- verification evidence;
- known unverified differences.

Typical invitation sections MAY include cover/opening, couple, families, date/countdown, ceremony, reception, map, dress code, timeline, album, story/video, RSVP, wishes, gift/QR/bank details, add-to-calendar, music controls, thank-you, and back-to-top controls. The actual list MUST come from the existing product and task scope.

## 6. Asset rules

- Every non-trivial visual asset MUST have an explicit section assignment.
- The agent MUST record source, format, dimensions, and intended crop or containing block.
- The agent MUST preserve the asset's aspect ratio unless the reference explicitly requires cropping.
- The agent MUST NOT use percentage offsets without checking the actual containing block.
- Missing assets MUST be reported; they MUST NOT be silently replaced with generic artwork.
- Decorative assets MUST NOT reduce text contrast, cover controls, or block interaction.

## 7. Accessibility, performance, and safety

The implementation MUST provide meaningful alternative text or mark purely decorative artwork as decorative, usable focus states, keyboard access, sufficient contrast, labeled controls, and reduced-motion support.

The implementation SHOULD lazy-load below-the-fold media, use appropriate image formats and dimensions, avoid autoplay with sound, prevent layout shift, and avoid loading unused assets.

RSVP and gift/payment sections MUST preserve existing privacy, validation, authorization, and sensitive-data handling. QR and bank details MUST NOT be logged or exposed in unintended contexts.

## 8. Stop and escalation rules

The agent MUST stop and ask the user when:

- a required asset, reference, data field, or behavior is unavailable;
- the requested visual change conflicts with existing logic or accessibility;
- a proposed fix requires a schema, API, route, or public URL change;
- visual fidelity cannot be verified because the reference or viewport is unavailable;
- tests reveal an unrelated pre-existing failure that affects confidence.

The agent MUST NOT hide uncertainty with a placeholder, broad refactor, or unsupported claim.

## 9. Definition of done

A template or section is complete only when all are true:

- Required behavior is unchanged and tested.
- Required data and optional-data states render correctly.
- Assigned assets are present, mapped, optimized, and visually verified.
- Desktop, tablet, and mobile layouts have been checked.
- Accessibility and interaction states have been checked.
- Relevant lint, typecheck, tests, and build checks pass, or failures are documented.
- Visual differences are either resolved or explicitly listed as unverified.
- The final report names changed files, checks run, evidence location, remaining risks, and follow-up work.

## 10. Required agent report

After each phase, the agent MUST report using this format:

```text
PHASE: <inspect|plan|implement|verify|regression>
STATUS: <complete|blocked|needs-decision>
CHANGED: <files or none>
VERIFIED: <specific checks and viewport/state evidence>
UNVERIFIED: <specific gaps or none>
RISKS: <remaining risks or none>
NEXT: <next phase or exact question>
```

The agent MUST distinguish facts, assumptions, and unverified observations. It MUST NOT claim the whole invitation is complete when only one section has been verified.
