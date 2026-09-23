# Step 2.1 — QA and evidence

Base: `70ecedf7acd4f4f2042e592b882c7a3958ada9c3`; branch `clean-rebuild`.

## Completed

- Fresh clone of the actual branch; previous README, roadmap, frontend consumers, backend adapters and asset inventory inspected before edits. Remote HEAD rechecked before packaging.
- Read-only Supabase audit: catalogue false, Builder false, direct payments false; 15 products, all demo, zero real active products; nine active categories. No schema, data, permission or launch-setting changes.
- `python scripts/check-clean-frontend.py`: generated source equality; page/import/image paths; cross-page links/anchors; unique IDs; ARIA and label references; JS syntax; legacy-shell isolation.
- `node scripts/test-clean-runtime.mjs`: worker migration boundary, mobile disclosure/keyboard/resize, strict launch flags, cart badges/storage events, creator freshness, preview-origin isolation.
- `node scripts/test-clean-commerce.mjs`: public/demo separation, missing/invalid prices, unsafe URLs/HTML, filter combinations, shared client and preserved cart key/events/caps/removal; retained checkout/admin bootstrap.
- Local Chromium: closed Store at 360, 390, 412, 768, 1366 and 1920px. Product details at 360, 390, 412, 768 and desktop. No horizontal overflow or page-script errors in these checks.
- Local intercepted fixtures: public products exclude demos; search/brand/category/reset; cart add and quantity; native Escape; anonymous preview client does not persist auth; broken image falls back; product missing slug/unlisted/demo states; authorised and denied admin preview; offline gate; usable no-JavaScript category/contact content.
- Desktop and mobile screenshots inspected; category image loading verified. Attached Store screenshots show the actual closed-state design, with local responses matching current launch flags.
- Old Store/product runtime imports searched and removed; existing data, legacy checkout/admin, notifications, Builder, Signal Scan, accounts and document consumers retained.
- Exact ZIP overlay and rollback rehearsal verifies every original Git blob is recoverable.

## Limits / next verification

These are local Chromium viewport checks, not a claim of physical Android device certification. The user reviews the uploaded GitHack pages. Current public previews show the closed catalogue; private product states were tested with local fixtures, never publicly unlocked.

No live order, quote, payment, notification or authentication transaction was submitted. Existing Yoco and checkout operational issues recorded by Step 0 remain release gates. Authenticated admin preview must be checked on its intended origin with a real authorised account before release. Full RLS/payment/checkout testing belongs to the relevant operational Step.

Canonical links remain on the existing GitHub domain pending the deliberate domain migration in Step 8. Production-origin enhancement recognises the user-confirmed `.co.za` apex/www. Supabase redirect configuration and cross-origin session migration are not changed by this frontend ZIP.

## Current authoritative API references checked

- https://supabase.com/changelog.md (current change index; no relevant client breaking change for this adapter)
- https://supabase.com/docs/reference/javascript/auth-getuser
- https://supabase.com/docs/reference/javascript/rpc
- https://supabase.com/docs/reference/javascript/using-modifiers-abortsignal

No new specifications or supplier/product claims were introduced; the existing published catalogue contract remains the data source.
