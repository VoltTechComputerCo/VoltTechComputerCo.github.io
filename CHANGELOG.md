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
- Kept the browser privacy/security demo optional rather than a primary enquiry

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

### Phase 2 — store launch gate and catalogue cleanup, batch 7 — 2026-09-19
- Restored the production `store_settings.catalogue_enabled` switch to `false` and set the public banner to `Store coming soon.` while company registration and supplier access are still unfinished.
- Added a fail-closed `store-access.js` launch gate: catalogue, product and checkout logic only loads after Supabase confirms the store is enabled.
- Added a static coming-soon surface so the catalogue does not flash briefly before the database setting is checked.
- Kept the existing server-side `submit-store-checkout` catalogue check in place, so order submission remains blocked even if the front end is bypassed.
- Removed current PC Builder promotion from the Store and Product surfaces while custom PC building remains paused.
- Removed the remaining static inline catalogue styles and moved the launch/cleanup rules into `store-gate.css`.
- Temporarily changed Store and Product pages to `noindex,follow`; restore normal indexing when the store officially launches.

### Phase 2 — customer portal and builder-pause cleanup, batch 8 — 2026-09-19
- Removed the remaining layout-only inline styles from Account, Activity and Document Vault and moved them into the shared portal shell.
- Removed active PC Builder promotion from the customer Account and Saved Builds pages while custom PC building remains paused.
- Converted Saved Builds into a history/read-only surface for existing records: customers can still view/print, email, delete eligible saved records and open any formal quote already issued.
- Removed Resume Build and Request Quote actions from `builds.js` so the paused builder cannot be re-entered from the customer portal.
- Preserved existing saved-build data, historical statuses, formal quotes, document exports, account authentication and deletion behaviour.
- Updated edited portal pages to `portal-shell.css` v5.1.0 and `builds.js` v3.3.0 for cache-safe delivery.

### Phase 2 — builder access gate and admin launch controls, batch 9 — 2026-09-19
- Added the tracked Supabase `store_settings.builder_enabled` feature flag, defaulting to `false`, matching the production migration already applied.
- Added a fail-closed PC Builder launch gate: the interactive Builder app is not loaded unless Supabase explicitly reports `builder_enabled = true`.
- Kept existing saved PC build records accessible through the customer portal while new Builder access remains paused.
- Added separate PC Parts Store and PC Builder launch switches to the Admin Parts Desk for deliberate future release control.
- Kept the existing Parts Desk workflow JavaScript untouched and added launch controls as a small isolated admin module.
- Kept direct payment settings independent from the new launch switches.
- Preserved the existing Builder application, component catalogue, compatibility logic, saved-build history, Parts Desk order workflow and shipping automation.

### Phase 2 — global commerce navigation gating, batch 10 — 2026-09-19
- Stopped the shared loader from advertising the PC Parts Store before the public `catalogue_enabled` launch flag is checked.
- Added a public fail-closed launch-state check for both `catalogue_enabled` and `builder_enabled` using the existing Supabase publishable configuration.
- Removed stale PC Builder mobile-menu entries while `builder_enabled = false`, including links injected by older cached navigation code.
- Re-adds the PC Builder mobile-menu entry only after Supabase explicitly reports `builder_enabled = true`.
- Loads the existing Store discovery/navigation module only after Supabase explicitly reports `catalogue_enabled = true`.
- Preserved customer notifications and onboarding for signed-in users.
- Updated the service worker to roll the shared loader forward to v6.0.0 so existing Android/browser sessions receive the navigation fix without editing every page individually.
