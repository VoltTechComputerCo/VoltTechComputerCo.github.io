# Full customer frontend reset

Branch: `frontend-reset-20261005`. Production is not merged or deployed.

All 80 public and customer routes now have fresh source templates under `frontend/pages`, route data, a shared experiential shell and newly written controllers. No customer route loads the previous UI renderers or styles. Existing content, metadata, real media, pure compatibility/diagnostic models and backend data contracts are preserved. The seven admin tools remain separate utilitarian back-office workflows, as scoped in the initial audit; the Google verification endpoint is unchanged.

The approved home experience retains pinned Build/Boost/Broadcast chapters, keyboard/touch component selection, floating capsule navigation and a full-screen Explore menu. Services add selectable symptoms and contextual contact handoffs. Diagnostics have fresh sequential consoles with branching, back/restart and share/export. The Builder has guided/manual planning, local components, compatibility/power review, snapshot restore, account save and quote-request contracts. Mock supplier offers are excluded.

Store includes real-product eligibility, search/categories/brand/spec facets, comparison, detail galleries/documents/related items and persistent cart controls. Checkout preserves shipping, submission uncertainty handling and cart fingerprints. Guest status validates access credentials and payment gates/provider redirects. Demo products never appear as purchasable stock.

Customer workspace covers account/auth/recovery, profile/address/security forms, saved builds, quotes, issued documents, activity and privacy/deletion/data export. Record views support printing/export, guarded quote decisions and server-authorised invoice checkout. Preview origins do not access customer records or submit commerce transactions. Notifications use owner-scoped queries and realtime updates with accessible mobile navigation placement.

Creator Hub preserves freshness-qualified live status, directory search/filter and Twitch registration/state verification/token cleanup. STATIC has a separate editorial system, 36 rebuilt article layouts with preserved content/source links, a searchable hub and the existing newsletter endpoints. Legal pages and utility aliases are recreated with fresh semantic layouts.

## Validation

- Generator output matches fresh sources; every internal dependency resolves.
- All 240 route/device checks passed: 80 routes at 360, 390 and 1440 pixels; one main, one h1, no horizontal page overflow or uncaught JS errors.
- Interaction tests passed both diagnostic journeys, back/restart, Builder catalogue selection/category/removal, authenticated customer empty states and STATIC's 36 stories/search.
- Commerce contract tests passed strict eligibility, stock/quantity limits, guest tokens, shipping environment, redirect allowlists and payment gates.
- Existing home/shell and motion suites cover additional device sizes, focus/dialog behavior, reduced motion and offline states.
- Browser tests use mocked data/auth and external image failures. These results do not certify live authentication, RLS, order submission, delivery pricing or payments. Production verification remains required before release.

No database/schema changes, provider changes, production merge, STATIC publication changes or fake Store stock are included.
