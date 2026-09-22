# Clean rebuild architecture — Step 1.2

Authoritative branch: `clean-rebuild`. Step 1.2 parent: `8c120bc74512583cfb3f4cf3be292d13368b320e`, rechecked before implementation and packaging. Step 1.1 upload was verified against all 32 delivered files and visually approved by the user. No v3-prototype code was used. User-provided V3-named image files are media sources only.

## Source ownership

`src/templates/page.html`, `header.html` and `footer.html` own the shared shell. `src/pages/*.json` supplies output path, metadata, styles and scripts; adjacent HTML supplies content. Optional `.head.html` supplies page-specific canonical/social/structured metadata. `scripts/build-clean-frontend.py` emits complete upload-ready HTML. Edit sources, then regenerate; generated HTML is never a separate implementation.

Converted routes: `index.html` and `design-system.html`. Other page families retain their working audited implementation until their own migration. Shared design changes propagate to converted routes. There is one new shell, not a second independently authored homepage shell.

| Source | Responsibility |
|---|---|
| `assets/css/tokens.css` | Exact shared palette, fonts, spacing and border tokens |
| `base.css`, `layout.css` | Reset, type, focus, containers and footer |
| `navigation.css`, `responsive.css` | Shared header, search and mobile transformations |
| `components.css`, `forms.css`, `print.css` | Shared controls and print foundations |
| `notifications.css` | Clean presentation for the preserved notifications controller |
| `pages/home.css`, `pages/design-system.css` | Page composition only |
| `assets/js/site-shell.js` | Navigation, native dialogs and public site search |
| `components/search.js` | Explicit public route index; no product or customer-data search |
| `pages/home.js` | Homepage availability and creator UI |
| `services/home-integrations.js` | Read-only launch flags/cart, account bootstrap, analytics and app registration |
| `pages/design-system.js` | Local inspection-form validation only |

No framework, package manager or runtime build is required. Native content and enquiry links work without JavaScript. Shared navigation stays visible without enhancement. Search appears only when native dialogs are supported. Page styles follow shared styles; no override/fix files are introduced.

## Migration boundary and preserved contracts

`<html data-vt-shell="clean">` tells the existing service worker to return marked HTML unchanged. It prevents legacy stylesheet/navigation/notification-loader injection. Both converted pages carry the marker. The inspection page remains backend-free. The homepage explicitly reconnects these responsibilities:

| Contract | Adapter / behaviour |
|---|---|
| Public launch flags | Anonymous GET to `store_settings`, selecting only `catalogue_enabled,builder_enabled`; strict booleans, eight-second timeout, fail closed |
| Category navigation | Existing category slugs validated against `store_categories`; enquiry links remain until catalogue is enabled |
| Builder | Existing route and gate retained; enquiry CTA until enabled; no engine/data changes |
| Cart | Read-only `vt_store_quote_cart_v1`; listens to `vt-store-cart-change` and cross-tab storage; never rewrites the cart |
| Account | Existing `VOLTTECH_SUPABASE` config and cached auth; pinned SDK 2.116.0; shared `volttechAuth` client; existing account route |
| Notifications | Existing queries, RLS, read state, realtime, role checks and sound retained; explicit header host and accessible clean dialog presentation |
| Analytics | Existing GA ID and `whatsapp_click`; existing `conversion-context.js` retains `vt_conversion_intent` and `vt_journey_context` |
| App registration | Existing manifest, icons and root service worker; one clean-page registration owner |
| Creator feed | Existing Supabase/JSON fallback adapter; added per-row `checked_at`; absent checks remain null, never replaced with the current time |
| Creator display | Twenty-minute freshness requirement; stale/missing/future data is not presented as live; only validated Twitch login strings become links |
| Signal Scan | Existing `signal-scan.html?source=home`; no fabricated telemetry |
| WhatsApp/email | Existing public contact destinations and contextual handoffs retained |

Production-only account bootstrap, analytics and service-worker registration run only on `https://volttechcomputerco.github.io`. GitHack may read public launch/creator data but cannot share production authentication or send homepage analytics. An account label is display state only; authorisation remains in the existing backend/RLS. Existing destination pages keep their original behaviour and access controls.

`notifications.js` adaptations are limited to clean host placement, delegating clean worker registration, ARIA dialog metadata, Escape/Tab/focus management. Database queries and notification actions are unchanged. `streamer-feed.js` retains its response shape and adds a timestamp; unknown `generated_at` is null rather than a fabricated fresh date.

## Cleanup ownership

Retired: root `home.css`, `service-backgrounds.css`, the V2 finaliser script/workflow, eight upload placeholders, and homepage-only selectors in retained shared legacy files. Other legacy files still have real consumers; they are not imported by converted pages. STATIC feed generation, Discord publishing and guards remain intact. No old implementation is hidden under a new CSS layer.

## Assets and typography

New images are organised under `assets/brand/` and `assets/categories/`. See `step-1.2-assets.md` for provenance. Existing photos remain in their current paths where other pages use them; global asset moves must update every consumer atomically. Fonts remain the Step 1.1 self-hosted Space Grotesk and JetBrains Mono WOFF2s with OFL licences. No additional font network requests.

## Preview, SEO and release

Both converted pages are noindex on this rebuild branch. The homepage includes production canonical, en-ZA, truthful Organization/Service structured data and social metadata. Removing noindex is an explicit Step 10 release gate, after whole-site verification. No Product, Offer, Review or AggregateRating claims are emitted.

The user uploads ZIP contents manually and reviews changed pages through GitHack. Before advancing, verify remote HEAD, hashes, removals and imports, then issue commit-pinned links. Local source/runtime checks do not claim browser, payment or accessibility certification. Browser local-file navigation is blocked by its URL policy; HTTP preview rendering and Android 360/390/412 checks happen after upload. Production auth/notification behaviour requires the intended origin and is not certified by a public GitHack preview.
