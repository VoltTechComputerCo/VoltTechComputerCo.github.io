# Frontend reset progress

Branch: `frontend-reset-20261005`, directly from main.

## Creative direction revision — 7 October 2026 (South Africa)

The first homepage was rejected as too close to the main site. The new preview replaces its composition and navigation with an experiential direction: oversized hardware opening, floating global control bar, full-screen navigation worlds, homepage chapter dock, scroll-pinned Build/Boost/Broadcast scenes, interactive component selector, support console, immersive creator scene and STATIC portal. White/graphite/teal remain.

Native scrolling drives frame-batched image transforms and chapter states. Touch/keyboard buttons also select scenes and components. Reduced-motion and short-height phones retain a regular-flow/manual experience. No video assets exist in the repository; this revision uses real repository imagery with CSS/JavaScript motion, not video footage.

Validated: 13 existing UI scenarios plus six new motion-device scenarios, including scroll-driven state changes, manual scene selection, category link updates, keyboard selection, navigation and reduced motion. `browser-motion.json` records the new results.

## Implemented in this stage

- New `frontend/` source root, global tokens/base/components/layouts and isolated build entrypoint.
- Fresh header/footer, grouped mobile modal navigation, search sheet and cart-count contract.
- New homepage composed around build, upgrade, repair and streaming intent.
- Internal component reference with buttons, forms, statuses, error/empty/loading states, keyboard tabs, table, disclosure and modal examples.
- Read-only catalogue adapter: strict non-demo/public/active/not-hidden query, launch gate, honest empty/closed/error states.
- Production-only analytics using the existing measurement ID and WhatsApp event contract.
- Preserved organisation/service structured data, canonical domain and customer route destinations.
- Explicit generated-route ownership: the old generator skips outputs claimed by the new frontend.
- Branch-specific CI for generated output, adapter/route tests and browser interaction/viewport checks.

## Route migration checklist

| Family | Status |
|---|---|
| Homepage | New frontend implemented |
| Design-system reference | New frontend implemented |
| Shared shell | Implemented on migrated routes; remaining routes migrate with their controllers |
| Store, product, cart, checkout, guest order status | Pending Phase 5 |
| PC Builder | Pending Phase 6 |
| Services | Pending Phase 7 |
| Diagnostics / Creator tools | Pending Phase 8 |
| Account / quotes / builds / documents / privacy | Pending Phase 9 |
| Legal / utility | Pending Phase 10 |
| STATIC | Pending Phase 11 |
| Full-site responsive/accessibility release gate | Pending Phase 12 |

Commerce filters/product presentation and account/checkout components extend the same global system as those route families are implemented. No legacy customer renderer is loaded by the migrated pages. Remaining routes retain their baseline until their full functional replacement is ready. This branch is a staged preview, not a complete release candidate.

## Validation

- Source/output generation matches.
- Catalogue adapter tests cover empty, available, closed, unavailable, malformed response and strict eligibility query.
- Migrated-page dependency, internal route, duplicate-ID and landmark checks pass.
- All 13 browser scenarios passed; evidence is in `browser-phase-2-4.json`. Screenshots at 360px and 1440px were visually reviewed.
- Browser tests exercise 360, 390, 768, 1024, 1440 and 1920px; dialogs, focus trap/restoration, scroll lock, search payload, persisted cart badge, keyboard tabs, forms and offline catalogue messaging.
- Browser tests stub the public REST responses; these are UI/contract tests, not live customer, authorisation or payment certification.
- Homepage images reuse existing repository media as permitted assets. They do not represent purchasable catalogue listings or supplier relationships.

No production merge, database/schema mutation, payment/provider reconfiguration or STATIC publishing change is part of this stage. Authenticated notification presentation and remaining account/commerce integration belong to the pending route migrations.
