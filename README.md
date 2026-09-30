# VoltTech Computer Co. website

Production: https://volttechcomputerco.co.za
Production branch: `main`
Development / integration branch: `clean-rebuild`

## Source of truth

The clean frontend is source-generated.

- Shared HTML shell: `src/templates/`
- Page content/config: `src/pages/`
- Shared presentation: `assets/css/`
- Shared/browser controllers: `assets/js/`
- Generator: `scripts/build-clean-frontend.py`

When changing a generated page, change its source and regenerate the output. Do not create a second hand-authored implementation of the same route.

The retained root-level admin pages are still a deliberate legacy boundary. Their root admin/auth CSS and JavaScript must remain until that admin family is migrated as one controlled change.

STATIC publishing is documented in `docs/clean-rebuild/STATIC-PUBLISHING.md`. Historical STATIC articles keep their dedicated `assets/css/static-legacy/` styles; new articles use the clean STATIC article system.

## Required checks

```bash
python3 scripts/build-clean-frontend.py --check
node scripts/run-full-qa.mjs
```

The full QA runner writes evidence under `qa-results/`; that directory is intentionally ignored by Git.

## Active GitHub workflows

Only current recurring/source-of-truth workflows are retained:

- `clean-frontend-sync.yml`
- `device-role-qa.yml`
- `full-qa.yml`
- `static-discord-publisher.yml`
- `static-feed-autopilot.yml`
- `static-publishing-guard.yml`
- `static-sitemap-autopilot.yml`

## Repository cleanup — 30 September 2026

A site-wide audit removed completed migration/release runners, old QA screenshots/manifests, compiled cache, an unused 5 MB logo ZIP and root runtime files superseded by the clean frontend.

The service worker now leaves clean pages and public non-admin legacy pages untouched. Its compatibility injection remains only for legacy admin routes.

Asset provenance is deliberately retained at `docs/clean-rebuild/step-1.2-assets.md`.
