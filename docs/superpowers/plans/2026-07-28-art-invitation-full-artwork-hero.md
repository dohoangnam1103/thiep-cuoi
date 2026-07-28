# Art Invitation Full-Artwork Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the shallow artwork strip in all 18 shared art invitation templates with a tall hero where the artwork surrounds the wedding date and couple names.

**Architecture:** Keep the change inside the shared `ArtworkHero` renderer so every manifest-backed art template receives identical structure and responsive behavior. Add one global CSS class for a readable opacity fallback and a progressive-enhancement mask that fades each artwork into its existing theme background; protect the product decision with source-invariant tests and update the project playbook.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, global CSS, Node test runner, Playwright-based preview capture.

---

## File map

- Modify `src/data/templates/template-manifest.test.ts`: protect the tall hero, remove the shallow-height regression path, and require mask/fallback styles.
- Modify `src/components/chungdoi-tpl-art-invitation.tsx`: merge the artwork strip and name block into one responsive hero stage.
- Modify `src/app/globals.css`: fade the portrait artwork into the theme background with a supported-mask enhancement and readable fallback.
- Modify `docs/research/INSPECTION_GUIDE.md`: replace the old top-strip rule with the approved full-artwork hero rule and update visual gates.
- Modify `public/chungdoi/images/template-previews/en/{listing,portrait,landscape}/*.webp`: recapture all 18 affected previews.
- Modify `src/data/template-preview-version.ts`: accept the cache-busting version written by the preview script.

### Task 1: Add failing shared-renderer invariants

**Files:**
- Modify: `src/data/templates/template-manifest.test.ts:124-152`

- [ ] **Step 1: Add assertions for the approved hero structure**

Insert these assertions after the existing `relative z-40 min-h-[100dvh]` assertion:

```ts
  assert.match(sharedRendererSource, /data-artwork-hero="true"/);
  assert.match(
    sharedRendererSource,
    /min-h-\[clamp\(760px,100svh,1080px\)\]/,
  );
  assert.doesNotMatch(
    sharedRendererSource,
    /h-\[(?:150|180|220|260)px\]/,
    "the shared hero must not regress to a shallow artwork strip",
  );
```

Insert these assertions after `assert.match(globalStyles, /invitation-parallax-drift/);`:

```ts
  assert.match(globalStyles, /\.invitation-hero-artwork\s*\{/);
  assert.match(globalStyles, /opacity:\s*0\.32/);
  assert.match(globalStyles, /mask-image:\s*linear-gradient/);
  assert.match(globalStyles, /#000 42%/);
  assert.match(globalStyles, /transparent 88%/);
```

- [ ] **Step 2: Run the focused unit test and confirm it fails for the missing hero**

Run:

```bash
npm run test:unit -- src/data/templates/template-manifest.test.ts
```

Expected: FAIL in `new art templates have localized renderers and captured preview variants` because `data-artwork-hero="true"` and `.invitation-hero-artwork` do not exist yet.

- [ ] **Step 3: Commit the red test**

```bash
git add src/data/templates/template-manifest.test.ts
git commit -m "test: protect full-artwork invitation hero"
```

### Task 2: Build the tall full-artwork hero

**Files:**
- Modify: `src/components/chungdoi-tpl-art-invitation.tsx:194-235`
- Modify: `src/app/globals.css:586-646`
- Test: `src/data/templates/template-manifest.test.ts`

- [ ] **Step 1: Add the artwork fade with an accessible fallback**

Add this block immediately before `@keyframes invitation-hero-parallax` in `src/app/globals.css`:

```css
.invitation-hero-artwork {
  opacity: 0.32;
}

@supports ((mask-image: linear-gradient(#000, #000)) or (-webkit-mask-image: linear-gradient(#000, #000))) {
  .invitation-hero-artwork {
    opacity: 1;
    -webkit-mask-image: linear-gradient(
      to bottom,
      #000 0%,
      #000 42%,
      transparent 88%,
      transparent 100%
    );
    mask-image: linear-gradient(
      to bottom,
      #000 0%,
      #000 42%,
      transparent 88%,
      transparent 100%
    );
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }
}
```

The base opacity keeps theme-colored text readable in browsers without mask support. Supported browsers restore the complete image and fade only its lower area into `config.heroClass`.

- [ ] **Step 2: Replace the shallow artwork and separate name block**

Replace the `ArtworkHero` return value with:

```tsx
  return (
    <section className="relative z-30 w-full overflow-hidden">
      <div
        data-artwork-hero="true"
        className={cn(
          "relative flex min-h-[clamp(760px,100svh,1080px)] flex-col justify-end overflow-hidden",
          config.heroClass,
        )}
      >
        <img
          src={config.artwork}
          alt=""
          aria-hidden="true"
          className={cn(
            "invitation-hero-artwork invitation-hero-parallax absolute inset-0 h-full w-full object-cover object-center",
            config.imageClass,
          )}
        />
        <div className="relative z-10 px-6 pb-14 pt-36 text-center sm:px-9 sm:pb-20">
          <span className={cn("text-xs tabular-nums tracking-[0.2em]", config.mutedClass)}>
            {dateLine}
          </span>
          <div className="mt-10">
            {names}
          </div>
          <p className={cn("mx-auto mt-8 max-w-[34ch] text-sm leading-7", config.mutedClass)}>
            {invitationOpeningMessage(content)}
          </p>
        </div>
      </div>
      <HeroPortraits config={config} content={content} people={people} t={t} />
    </section>
  );
```

This removes the `quiet` and `dark-stage` shallow height overrides because all 18 approved templates now use the same immersive height contract.

- [ ] **Step 3: Run the focused test and confirm it passes**

Run:

```bash
npm run test:unit -- src/data/templates/template-manifest.test.ts
```

Expected: all tests in `template-manifest.test.ts` PASS.

- [ ] **Step 4: Run TypeScript and lint checks for the implementation**

Run:

```bash
npm run typecheck
npm run typecheck:tests
npm run lint
```

Expected: both TypeScript commands exit 0; ESLint exits 0 with no new errors.

- [ ] **Step 5: Commit the shared implementation**

```bash
git add src/components/chungdoi-tpl-art-invitation.tsx src/app/globals.css
git commit -m "feat: expand artwork across invitation hero"
```

### Task 3: Update the invitation template playbook

**Files:**
- Modify: `docs/research/INSPECTION_GUIDE.md:194-205`
- Modify: `docs/research/INSPECTION_GUIDE.md:329-366`

- [ ] **Step 1: Replace the old top-strip guidance**

In “Trật tự layer chuẩn”, replace the sentence about `heroClass` being used only for a top artwork strip with:

```markdown
- Hero artwork và cụm ngày/tên dùng chung một stage cao `clamp(760px, 100svh, 1080px)`; `heroClass` cung cấp màu nền để artwork fade vào đúng palette của từng theme.
- Artwork hero giữ nguyên chi tiết ở phần trên, bắt đầu fade từ `42%` và trong suốt tại `88%` để tên và lời mời luôn dễ đọc.
```

Keep the rule that the name and portrait wrappers must not receive `surfaceClass`.

- [ ] **Step 2: Update the regression table and visual definition of done**

Replace the “Một đoạn đầu thiệp nền đặc” row with:

```markdown
| Artwork chỉ hiện thành dải mỏng | Hero dùng height cố định `150px` đến `260px` với asset dọc | Dùng stage cao `clamp(760px, 100svh, 1080px)`, đặt ngày và tên trong artwork, rồi fade ảnh vào nền theme |
```

Add this checklist item under “Definition of Done cho mẫu mới”:

```markdown
- [ ] Hero artwork cao gần một viewport, ôm cụm ngày và tên; không quay lại dải ảnh cố định `150px` đến `260px`.
```

Add this bullet under “Test bảo vệ các quyết định này”:

```markdown
- Hero artwork có marker `data-artwork-hero`, chiều cao responsive và CSS mask/fallback bảo vệ độ đọc.
```

- [ ] **Step 3: Check documentation formatting and commit**

Run:

```bash
git diff --check -- docs/research/INSPECTION_GUIDE.md
```

Expected: exit 0 with no whitespace errors.

Then commit only the playbook:

```bash
git add docs/research/INSPECTION_GUIDE.md
git commit -m "docs: record immersive artwork hero rules"
```

### Task 4: Verify themes and regenerate previews

**Files:**
- Modify: `public/chungdoi/images/template-previews/en/listing/*.webp`
- Modify: `public/chungdoi/images/template-previews/en/portrait/*.webp`
- Modify: `public/chungdoi/images/template-previews/en/landscape/*.webp`
- Modify: `src/data/template-preview-version.ts`

- [ ] **Step 1: Start the development server**

Run:

```bash
npm run dev
```

Expected: Next.js reports a ready local URL and `http://localhost:3000` responds.

- [ ] **Step 2: Inspect the reference dark theme on desktop and mobile**

Open `/mau-thiep/tho-cam-vung-cao/demo` at desktop 1440×1000 and mobile 390×844. Verify:

- the hero is at least the viewport height until reaching its `1080px` cap;
- artwork surrounds the date and both names;
- both names and the opening message remain readable;
- the uploaded couple portrait begins after the hero;
- `document.documentElement.scrollWidth <= innerWidth` evaluates to `true` on mobile.

- [ ] **Step 3: Inspect one light theme and reduced motion**

Open `/mau-thiep/truc-chi-toa-sang/demo` at desktop 1440×1000 and mobile 390×844. Emulate `prefers-reduced-motion: reduce` and verify the hero artwork does not transform, text remains readable, and the fixed parallax layer does not animate.

- [ ] **Step 4: Capture all 18 preview sets without production sync**

Run:

```bash
npm run screenshots:templates -- --slug dong-ho-folk,tho-cam-highland,son-mai-lacquer,bat-trang-blue,hang-trong-folk,sen-monoline,truc-chi-minimal,long-phung-deco,ao-dai-hue,art-deco-gatsby,celestial-map,coastal-mediterranean,swiss-brutalist,riso-duotone,cinema-credit,aurora-glass-dark,y2k-chrome,botanical-lavender --no-sync-production
```

Expected: the script reports successful listing, portrait, and landscape captures for all 18 slugs and updates `src/data/template-preview-version.ts`.

- [ ] **Step 5: Run the complete verification gate**

Stop the development server, then run:

```bash
npm run typecheck
npm run typecheck:tests
npm run test:unit
npm run lint
NEXT_PUBLIC_SITE_URL=https://thiepmungonline.com SITE_URL=https://thiepmungonline.com npm run build
git diff --check
```

Expected: every command exits 0. Existing lint warnings may remain, but there must be no new errors or warnings attributable to the changed files.

- [ ] **Step 6: Review the generated preview diff**

Confirm there are exactly 54 regenerated WebP files (18 templates × 3 variants), each remains above the existing minimum-size gates, and no envelope asset or unrelated preview changed.

- [ ] **Step 7: Commit verified previews and cache version**

```bash
git add public/chungdoi/images/template-previews/en/listing public/chungdoi/images/template-previews/en/portrait public/chungdoi/images/template-previews/en/landscape src/data/template-preview-version.ts
git commit -m "chore: refresh full-artwork invitation previews"
```
