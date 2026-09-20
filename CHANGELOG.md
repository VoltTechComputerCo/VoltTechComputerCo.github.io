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

### Phase 2 — customer portal source-version normalization, batch 11 — 2026-09-19
- Updated Account, Activity, Document Vault and Saved Builds to reference the current shared notification and portal-shell assets directly instead of relying on service-worker rewrites.
- Standardised `notifications.css` and `notifications.js` references at v5.2.0 across the four customer portal pages.
- Standardised `portal-shell.css` and `portal-shell.js` references at v5.2.0 across the same customer portal surface.
- Updated the Account dashboard loader reference to `account-dashboard.js` v5.2.0 so source HTML matches the cache-safe runtime version already used by the service worker.
- Preserved authentication, saved-build history, document access, notifications, activity search/filtering and all customer account behaviour.

### Phase 2 — admin portal source-version normalization, batch 12 — 2026-09-19
- Updated Admin Hub, Build Requests, Customer Detail, Customers, Account Deletions and Records Search to reference the current shared notification and portal-shell assets directly.
- Standardised `notifications.css` and `notifications.js` references at v5.2.0 across the six admin pages.
- Standardised `portal-shell.css` and `portal-shell.js` references at v5.2.0 across the same admin surface.
- Removed reliance on service-worker runtime rewrites for these admin asset versions, improving first-load and private-browser consistency.
- Preserved all admin authentication, work queue, quote creation, customer lookup, build-request review, deletion handling and record-search behaviour.

### Phase 2 — customer account completion, batch 13 — 2026-09-19
- Updated Quotes & Approvals and Privacy & Data to reference the current shared notification and portal-shell assets directly.
- Standardised `notifications.css` and `notifications.js` at v5.2.0 on both remaining customer-account pages.
- Standardised `portal-shell.css` and `portal-shell.js` at v5.2.0 on both pages.
- Removed the final customer-account dependency on service-worker runtime rewrites for these shared asset versions.
- Preserved quote review/approval, printable quote access, personal-data export, privacy requests and account-deletion behaviour.

### Phase 2 — Exposure Scan inline-style completion, batch 14 — 2026-09-19
- Removed the final two static inline colour declarations from Exposure Scan and replaced them with named classes.
- Removed the JavaScript-created layout margin from the location-demo clear button and moved it into a small page-specific stylesheet.
- Left runtime progress-bar width assignments intact because they represent live component state rather than static layout styling.
- Preserved Exposure Scan's local-only processing, browser capability checks, fingerprint demo, optional geolocation permission flow, report copying and privacy messaging.

### Phase 2 — shared mobile navigation source cleanup, batch 15 — 2026-09-19
- Removed the paused PC Builder card from the shared `analytics.js` mobile-navigation source instead of relying on the launch-state loader to remove it after page load.
- Kept Batch 10's Supabase-controlled Builder re-add behaviour intact, so the PC Builder returns to the mobile menu automatically only when `builder_enabled = true`.
- Added a service-worker rewrite from `analytics.js?v=5` to v6 so existing Android/browser sessions receive the cleaned navigation source without manually editing every public page.
- Preserved analytics, WhatsApp event tracking, PWA metadata, Creator Hub live-count behaviour, accessibility focus trapping and all non-commerce mobile-menu entries.
### Phase 2 — analytics cache reference normalization, batch 16 — 2026-09-19
- Updated the remaining 10 public pages that directly referenced `analytics.js?v=5` to `analytics.js?v=6`.
- Removed normal-page reliance on the service worker's v5-to-v6 compatibility rewrite.
- Preserved the service-worker compatibility rewrite as fallback protection for older cached pages and sessions.
- Made no layout, copy, SEO metadata, CTA, Supabase, Store/Builder availability or page-behaviour changes.
- Updated `index.html`, `creator-hub-south-africa.html`, `pc-performance-optimisation.html`, `pc-repair-pretoria.html`, `pc-upgrades-pretoria.html`, `virus-malware-removal-pretoria.html`, `windows-installation-pretoria.html`, `signal-scan.html`, `stream-scan.html` and `streaming-setup-south-africa.html`.

### Phase 2 — Builder loader source-version normalization, batch 17 — 2026-09-19
- Updated `builder/index.html` to reference `site-notifications-loader.js?v=6.0.0` directly instead of relying on the service worker to rewrite the older v5.0.0 source reference.
- Preserved the fail-closed Builder launch gate, `builder_enabled` control, saved-build access, catalogue logic and all Builder behaviour.
- Made no layout, copy, SEO, pricing, Supabase schema or launch-state changes.

### Phase 2 — documentation reality-sync, batch 18 — 2026-09-19
- Updated the VoltTech 2.0 start/handover documentation to reflect that Phase 1 is substantially complete and Phase 2 consolidation is actively underway.
- Documented the current fail-closed Store and PC Builder launch gates and their separate `catalogue_enabled` / `builder_enabled` controls.
- Updated current-system and file-map documentation to reflect the newer shared styles, Store/Builder gate files and current source-version cleanup state.
- Corrected automation documentation: current GitHub Actions are the STATIC Discord publisher and STATIC sitemap autopilot; South African streamer refresh is represented by Supabase backend assets rather than a GitHub Actions updater.
- Updated deployment guidance to match the current Android/manual-upload workflow and read-only GitHub integration behaviour.
- Made documentation-only changes; no runtime, SEO, layout, Supabase or customer-facing behaviour changed.

### Phase 2 — remaining documentation sync, batch 19 — 2026-09-19
- Updated architecture documentation to reflect the active Phase 2 shared frontend layers, launch-gated Store/Builder architecture and service-worker compatibility role.
- Updated operations documentation for the current Android/manual-upload workflow, Store/Builder launch checks, STATIC sitemap automation and Supabase-backed streamer refresh.
- Updated Supabase documentation with the separate `catalogue_enabled` and `builder_enabled` launch controls and clarified that the 17 September security/performance findings are baseline findings pending revalidation.
- Updated SEO documentation to reflect Store/Product restricted indexing and the Builder `noindex,nofollow` posture while launch-gated.
- Recorded the 19 September Store gate, Builder gate, compatibility-shim and Android workflow decisions in `docs/DECISIONS.md`.
- Replaced the obsolete foundation-only `PACKAGE_MANIFEST.json` description with a living VoltTech 2.0 documentation-set manifest.
- Made documentation-only changes; no runtime, database, layout, SEO directives or customer-facing behaviour changed.

### Phase 3 — service ecosystem and internal-link foundation, batch 1 — 2026-09-19
- Added a shared `service-network.css` component that connects the five core PC service pages as one VoltTech support ecosystem.
- Added an early-page service navigator to Repair, Performance, Upgrades, Security and Windows, with the current service highlighted using `aria-current`.
- Strengthened cross-service internal linking without changing established service URLs, pricing, contact flows or diagnostic behaviour.
- Kept the navigator compact on desktop and horizontally scrollable on mobile to preserve conversion-first layouts.
- Removed the launch-gated `store.html` from `sitemap.xml` while it remains `noindex`.
- Added the indexable `exposure-scan.html` to the sitemap and refreshed current VoltTech core-page modification dates.
- No Supabase, Store/Builder launch-state, customer account or admin behaviour changed.

### Phase 3 — service hierarchy and breadcrumb SEO, batch 2 — 2026-09-19
- Added a visible `Home → PC Support → Current Service` breadcrumb trail to all five core PC service pages.
- Added matching `BreadcrumbList` structured data to Repair, Performance, Upgrades, Security and Windows.
- Kept breadcrumb labels aligned with the customer-facing service hierarchy introduced in Phase 3 Batch 1.
- Used Google's currently supported breadcrumb structured-data pattern rather than adding deprecated FAQ rich-result markup.
- Extended the shared `service-network.css` component so the breadcrumb hierarchy stays consistent and mobile-safe across all five pages.
- Made no pricing, contact-flow, service-copy, diagnostic-JavaScript, Supabase, Store/Builder or customer-account changes.

### Phase 3 — sitemap preservation correction — 2026-09-19
- Preserved all currently published STATIC article URLs already present in the production sitemap while applying the Phase 3 sitemap cleanup.
- Kept the launch-gated Store excluded from the V2 sitemap and kept Exposure Scan included.
- This correction prevents the V2 sitemap from regressing editorial URL discovery when it is eventually merged to production.

### Phase 3 — VoltTech Experience System, batch 3 — 2026-09-20
- Introduced `volttech-experience.css` and `volttech-experience.js` as a shared premium interaction layer for VoltTech V2.
- Added scroll-progress telemetry, staged section reveals, subtle card depth/tilt on fine-pointer devices, animated signal accents, ambient technical grid/glow treatment and hardware-image depth.
- Added animated diagnostic telemetry and live-signal treatment to the existing homepage without changing homepage content or business logic.
- Activated the shared experience system on the homepage, all five core PC service pages, Creator Hub, Streaming Support and Stream Scan.
- Reworked the creator visual system to be teal-first and consistent with the wider VoltTech V2 identity while preserving creator-specific live/status signals.
- Preserved all SEO URLs, service pricing, WhatsApp/email flows, diagnostics, live creator data, Store/Builder gates, Supabase behaviour and customer/account logic.
- Motion is automatically reduced or disabled for `prefers-reduced-motion`, small/mobile interaction constraints and reduced-data environments.
- The shared system is intentionally lightweight and dependency-free so future V2 pages can inherit the same interaction language without adding a framework.

### Phase 3 — Experience System runtime visibility fix — 2026-09-20
- Fixed the ambient technical grid and pointer glow being layered behind page backgrounds.
- Strengthened the static mobile visual treatment so the Experience System remains visibly present even without hover interactions.
- Added an explicit `?vtmotion=full` preview override for testing full animation on devices that report reduced-motion preferences.
- Kept normal production behaviour respectful of `prefers-reduced-motion`.
- Bumped the shared Experience CSS/JS references to v2 to avoid stale branch/browser asset caches.

### Phase 3 — service search-preview media, batch 4 — 2026-09-20
- Replaced the generic VoltTech logo Open Graph/Twitter image on the five core PC service pages with the matching service-specific image already in the repository.
- Added descriptive image-alt metadata for social/search preview context.
- Added the same representative service image to each page's `Service` structured data.
- Updated robots directives on the five service pages to allow `max-image-preview:large`.
- Refreshed the five edited service-page dates in `sitemap.xml`.
- Preserved page copy, pricing, URLs, breadcrumbs, service-network navigation, contact flows, diagnostic behaviour and all backend functionality.

### Phase 3 — creator search-preview media, batch 5 — 2026-09-20
- Brought Creator Hub, Streaming Support and Stream Scan up to the same search/social preview standard as the five core PC service pages.
- Added service/creator-specific Open Graph images and descriptive image-alt metadata.
- Added complete Twitter/X large-card metadata for all three creator-facing pages.
- Added representative imagery to the relevant CollectionPage, Service and WebApplication structured data.
- Allowed `max-image-preview:large` on all three pages and marked Stream Scan as free in its WebApplication schema.
- Refreshed the three creator-page dates in `sitemap.xml`.
- Preserved creator feed behaviour, streaming pricing, Stream Scan logic, breadcrumbs, navigation and all backend functionality.
