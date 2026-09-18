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
