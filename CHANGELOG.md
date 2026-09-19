# Changelog

All meaningful VoltTech website releases should be recorded here.

Versioning should follow a practical semantic pattern where possible:

- **MAJOR** — architecture or customer-flow changes
- **MINOR** — new features or substantial enhancements
- **PATCH** — fixes and small improvements

## [Unreleased] — VoltTech 2.0

### Foundation
- Established formal repository handover/documentation structure.
- Defined `main` as production and `v2-rebuild` as the VoltTech 2.0 development branch.
- Defined human contact and paid service conversion as the primary business objective.
- Classified Store and PC Builder as beta until sourcing, pricing and release checks are dependable.
- Reduced strategic emphasis on Signal Scan as a mandatory funnel.
- Deferred Privacy Lab.
- Marked Stream Scan naming and positioning for review.
- Documented current Supabase architecture and security backlog.

### Conversion-first service pass — 2026-09-18
- Made WhatsApp and email the primary contact actions across the remaining core service pages.
- Reduced Signal Scan to one optional helper link per relevant service page.
- Reduced Stream Scan to one optional streaming diagnostic-helper link.
- Removed scan tools from primary navigation and hero CTAs on the migrated pages.
- Routed service symptom cards toward direct human contact instead of requiring a tool first.
- Kept existing public URLs, SEO metadata and service-page structure intact.
- Clarified that VoltTech is not currently selling or sourcing upgrade components while supplier arrangements are still being established.
- Kept the browser privacy/security demo optional rather than a primary enquiry path.

### Security backlog identified
- Review executable permissions on Supabase `SECURITY DEFINER` functions.
- Review `admin_users` RLS policy state.
- Enable leaked-password protection if appropriate for the current Supabase plan/configuration.
- Optimise selected RLS policies and foreign-key indexes before significant scale.

## Historical note

Before VoltTech 2.0, the repository grew rapidly through iterative feature development. Many customer, commerce, admin and editorial systems already exist. VoltTech 2.0 is a consolidation and commercial-readiness programme, not a clean-slate rewrite.

### Phase 1 completion — pricing clarity — 2026-09-18
- Added direct, visible pricing guidance to the main PC service pages.
- Reused the same estimate ranges already used by VoltTech diagnostic tooling to avoid conflicting public prices.
- Kept final pricing explicitly dependent on diagnosis, scope and any additional work or parts.
- Clarified that upgrade advice can begin free over WhatsApp/email while component sales and sourcing remain paused.

### Phase 2 — shared service design system, batch 1 — 2026-09-18
- Added `service-pages.css` as the shared layout and component stylesheet for the five core PC service pages.
- Removed the duplicated embedded service CSS from Repair, Performance, Upgrades, Security and Windows pages.
- Added `service-malware.css` for the security page's unique browser-privacy demo component.
- Centralised the selected Repair, Security and Windows hero-image overrides in `visual-system.css` v12.
- Replaced one-off inline diagnostic-helper styling with a shared `.optional-helper` component.
- Preserved service copy, pricing, URLs, SEO metadata, WhatsApp/email CTAs and existing JavaScript behaviour.
- Corrected a small typo in the security page enquiry copy.

### Phase 2 — homepage and creator system, batch 2 — 2026-09-18
- Added `home.css` and removed the large embedded homepage stylesheet from `index.html`.
- Added `creator-system.css` as the shared shell for Creator Hub and Streaming Support.
- Added page-specific `creator-hub.css` and `streaming-support.css`.
- Removed duplicated Creator/Streaming navigation and footer styling from the page-specific stylesheets.
- Removed simple layout-only inline styles from the homepage, Creator Hub and Streaming Support.
- Kept diagnostic progress values such as `--fill` inline because they are component data rather than layout rules.
- Updated the migrated pages to the already-current `visual-system.css` v12.
- Preserved page content, URLs, SEO metadata, Supabase streamer behaviour, service pricing and direct-contact flows.

### Phase 2 — diagnostic scan cleanup, batch 3 — 2026-09-18
- Moved Signal Scan's existing embedded CSS into `signal-scan.css`.
- Moved Stream Scan's existing embedded CSS into `stream-scan.css`.
- Added `scan-system.css` for shared narrow-phone and keyboard-focus behaviour.
- Updated Signal Scan and Stream Scan to `visual-system.css` v12.
- Removed duplicate direct contact-icon stylesheet requests because `visual-block-fix.css` already imports the shared contact-icon system.
- Preserved all questions, pricing logic, JavaScript, result generation and WhatsApp/email message behaviour.
- Left Exposure Scan unchanged for a separate privacy-demo refactor to avoid mixing unrelated risk into the diagnostic-tool batch.

### Phase 2 — exposure scan cleanup, batch 4 — 2026-09-19
- Moved Exposure Scan's embedded stylesheet into `exposure-scan.css`.
- Kept the privacy demo, browser capability checks, fingerprint demo and optional geolocation permission flow unchanged.
- Added clearer keyboard focus states for interactive controls.
- Tightened narrow-phone spacing and made the primary scan control easier to use on small screens.
- Preserved the existing privacy-first wording: results remain local to the browser and geolocation is only requested after an explicit user action.

### Phase 2 — portal and admin cleanup, batch 5 — 2026-09-19
- Moved the Admin Hub page stylesheet into `admin-hub.css`.
- Moved PC Build Requests admin styling into `admin-builds.css`.
- Moved Privacy & Data page-specific styling into `privacy-center.css`.
- Moved quote approval/decline presentation styling into `quote-decision.css`.
- Removed simple layout-only inline styles from the Admin Hub and Privacy & Data pages.
- Preserved Supabase authentication, admin workflow logic, account deletion behaviour, quote acceptance/decline logic and document printing/email behaviour.

### Phase 2 — commerce flow cleanup, batch 6 — 2026-09-19
- Moved Checkout's embedded page styling into `checkout.css`.
- Moved Order Status page styling into `order-status.css`.
- Removed the remaining layout-only inline skeleton heights from both pages and replaced them with page-specific classes.
- Preserved Supabase access, cart/order state, checkout submission, stock/delivery confirmation messaging and private order-status behaviour.
- Left the main Store and Product catalogue pages unchanged for a separate commerce catalogue pass.

