# Wedding Editor UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the wedding invitation editor so users can create invitations faster with polished controls for date/time, image upload, font/music selection, live preview, and publishing guidance.

**Architecture:** Keep the existing server action and Prisma data model unchanged. Improve `EditorForm.tsx` with focused client-side UI helpers that still submit plain form fields to `saveDraft`, preserving current storage formats and preview content mapping. Use existing `/api/upload` for gallery uploads and existing files in `public/chungdoi/fonts` and `public/chungdoi/music` as curated selectable assets.

**Tech Stack:** Next.js 16 App Router, React 19 client component, TypeScript strict, Tailwind CSS v4, lucide-react already installed, native browser file upload APIs, existing server actions.

---

## File Map

- Modify: `src/app/editor/[id]/EditorForm.tsx`
  - Add editor asset constants for fonts/music.
  - Add polished input helpers: date field, time field, select field, quick-choice chips, upload gallery manager, publishing checklist, sticky action bar, desktop preview panel.
  - Keep submitted field names identical to existing `actions.ts` schema.
- Read-only reference: `src/app/editor/[id]/actions.ts`
  - Confirm `saveDraft` still receives `galleryUrl`, `fontFamily`, `music`, `date`, `time`, `ceremonyDate`, `ceremonyTime`.
- Read-only reference: `src/app/api/upload/route.ts`
  - Use `POST /api/upload` with `FormData` key `file`, response `{ url }`.
- Verification:
  - `npm run typecheck`
  - `npm run build`
  - If possible, run `npm run dev` and manually test editor after login.

## Task 1: Add asset/select UI foundation

**Files:**
- Modify: `src/app/editor/[id]/EditorForm.tsx`

- [ ] **Step 1: Add constants**

Add `FONT_OPTIONS`, `MUSIC_OPTIONS`, `BIRTH_ORDER_OPTIONS`, `CEREMONY_HEADER_OPTIONS`, `PARENT_TITLE_OPTIONS`, and `TIME_OPTIONS` near `TEMPLATE_LABELS`.

- [ ] **Step 2: Add select and chip components**

Add `SelectField` and `QuickChoices` helper components. They render form-compatible controls and update associated inputs by name.

- [ ] **Step 3: Replace font/music text inputs**

Replace the existing Font & Nhạc section with selects. Music select should include a preview audio control for the selected value.

- [ ] **Step 4: Verify**

Run: `npm run typecheck`
Expected: no TypeScript errors.

## Task 2: Improve date/time fields

**Files:**
- Modify: `src/app/editor/[id]/EditorForm.tsx`

- [ ] **Step 1: Add date/time helper components**

Add `DateField` and `TimeField` wrapping native controls with clearer visual affordance and helper summary text.

- [ ] **Step 2: Replace date/time Text usage**

Replace `date`, `time`, `ceremonyDate`, `ceremonyTime`, schedule time, and banquet time inputs with clearer controls where appropriate.

- [ ] **Step 3: Add convenience copy action**

Add a button near ceremony date/time to copy wedding date/time into ceremony date/time.

- [ ] **Step 4: Verify**

Run: `npm run typecheck`
Expected: no TypeScript errors.

## Task 3: Add upload-based gallery editor

**Files:**
- Modify: `src/app/editor/[id]/EditorForm.tsx`

- [ ] **Step 1: Add gallery upload state**

Track `galleryRows`, `uploading`, and `uploadError` in the editor component.

- [ ] **Step 2: Add `uploadGalleryFiles` function**

For each selected file, POST to `/api/upload` with `FormData` key `file`. Append returned URLs to `galleryRows`. Show upload errors inline.

- [ ] **Step 3: Replace album section**

Render a dropzone/file input, thumbnail grid, URL fallback inputs, remove buttons, and hidden `galleryUrl` inputs for submission.

- [ ] **Step 4: Verify**

Run: `npm run typecheck`
Expected: no TypeScript errors.

## Task 4: Add publishing checklist and live preview layout

**Files:**
- Modify: `src/app/editor/[id]/EditorForm.tsx`

- [ ] **Step 1: Add `buildCompletionItems` helper**

Read the current form and gallery state to show completion status for required publishing information.

- [ ] **Step 2: Add desktop preview panel**

On large screens, show a sticky phone-like preview placeholder/action panel beside the form. Keep the existing full-screen preview tab for exact rendering.

- [ ] **Step 3: Add sticky bottom action bar**

Add mobile-friendly sticky Save and Preview actions. Keep publish in the publish section.

- [ ] **Step 4: Verify**

Run: `npm run typecheck`
Expected: no TypeScript errors.

## Task 5: Final verification

**Files:**
- Modified files from previous tasks.

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`
Expected: no TypeScript errors.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: successful production build.

- [ ] **Step 3: Manual UI note**

If login credentials are not available, state that browser verification of the authenticated editor could not be completed and list exact manual checks for the user.
