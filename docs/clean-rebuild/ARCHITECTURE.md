# Clean rebuild architecture

Authoritative development branch: `clean-rebuild`.

## Frontend ownership

The public/customer clean frontend is generated from `src/templates/` and `src/pages/` by `scripts/build-clean-frontend.py`. Generated HTML carries `data-vt-shell="clean"` and must stay consistent with its source.

Shared CSS lives under `assets/css/`; shared modules and page controllers live under `assets/js/`. Converted routes load the shared foundation plus only their page-specific modules. This separation is intentional and should not be flattened merely to reduce file count.

## Runtime boundaries

- Clean generated pages: complete source-owned shell and runtime.
- Admin family: retained root-level legacy admin/auth implementation until migrated atomically.
- STATIC hub: clean `static.html` implementation.
- Historical STATIC articles: `static-*.html` plus `assets/css/static-legacy/`.
- Exposure Scan: standalone public tool using its dedicated root CSS.
- Compatibility routes: retained only where they redirect or preserve an existing public contract.

The service worker does not modify clean pages or public non-admin legacy pages. Compatibility loader injection is restricted to legacy admin HTML.

## Backend contracts

Supabase remains authoritative for account/admin/customer operations and gated commerce data. Store, Builder, checkout/payment and launch-state behavior must continue to fail closed where configured. Backend/RLS changes are outside a cosmetic or repository cleanup and must be reviewed separately.

## Publishing / automation

Current persistent automation covers generated frontend sync, regression QA and STATIC publishing. Completed one-shot release/migration workflows are intentionally not retained.

See:

- `RELEASE-BLOCKERS.md`
- `STATIC-PUBLISHING.md`
- `step-1.2-assets.md` for media provenance
