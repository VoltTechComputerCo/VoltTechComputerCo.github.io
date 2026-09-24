# Step 8.2 QA — accessibility and performance

Parent verified commit: `7087681ad359a38ae1bcaa6704c99944aab52519`.

## Scope
Resolve every known clean-frontend checker failure exposed during Step 8.1B and restore that checker as a hard workflow gate.

## Accessibility fixes
- all eight printable customer document source pages now contain exactly one static, visually hidden H1;
- the document controller updates that H1 to the real document type before async loading;
- the runtime document brand no longer inserts a second H1;
- `tel:` links are recognised as valid external-action URLs by the checker;
- ARIA, labels, duplicate IDs, anchors and one-main/header/footer/H1 contracts remain hard checks.

## Image / performance fixes
The five service hero images already render inside a fixed-height cover container that reserves layout space. They are explicitly marked `data-layout-stable="cover"` so the checker does not demand meaningless intrinsic dimensions for that fixed-cover case.

Because they are above-the-fold/LCP candidates, each hero image now uses:
- `fetchpriority="high"`
- `decoding="async"`

All other clean-page images still require `alt`, `width` and `height`.

## Script / font performance checks
The checker now fails if:
- a classic external script blocks parsing without `defer` or `async`;
- a generated clean page introduces Google Fonts again.

## Intentional runtime dependencies
The eight authenticated document routes legitimately preserve `supabase-config.js`, matching the already-approved account/records architecture. This is a tiny configuration bootstrap, not the Supabase SDK itself; the SDK remains dynamically loaded only when authenticated account functionality is needed.

`creator-hub.js` and `service.js` are recognised as integration-aware page controllers rather than incorrectly treated as pure inspection shells.

## Workflow
`.github/workflows/clean-frontend-sync.yml` makes the full frontend checker a hard gate again. Uploading these `src/pages/**` changes triggers regeneration and commits affected generated HTML only if both the frontend checker and domain-residue checker pass.

## Expected generated outputs
- 8 printable document routes
- 5 service routes

No Supabase migration, customer-data mutation or launch-gate change is included.
