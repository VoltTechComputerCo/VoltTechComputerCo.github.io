# Frontend reset progress

Branch: `frontend-reset-20261005`, directly from main.

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
