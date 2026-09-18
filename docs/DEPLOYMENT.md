# Deployment

## Hosting

VoltTech is hosted with GitHub Pages from the repository:

`VoltTechComputerCo/VoltTechComputerCo.github.io`

The live site is:

https://volttechcomputerco.github.io

## Branch policy

### `main`
Production.

Customer-facing changes on `main` can affect the live website.

### `v2-rebuild`
VoltTech 2.0 development branch.

Use this branch for structural work before merging into production.

## Current practical workflow

The owner primarily works from Android.

At this baseline, treat external ChatGPT/GitHub integration as read/audit access only unless the owner explicitly states that a write-enabled workflow has been established.

Do not assume automated repository commits are available.

## Safe deployment process

1. Make changes on `v2-rebuild`.
2. Review changed files.
3. Test key pages using branch preview/local tooling when available.
4. Confirm no indexed URL was accidentally removed.
5. Confirm navigation and internal links.
6. Confirm mobile layout.
7. Confirm contact paths.
8. Confirm Supabase/auth operations if touched.
9. Merge the reviewed version into `main`.
10. Confirm GitHub Pages deployment.
11. Smoke-test the live site.

## Live smoke test

Minimum:
- homepage loads
- primary service pages load
- WhatsApp/call/email links work
- Store loads if enabled
- account page loads
- STATIC loads
- CSS/images are not 404ing
- no obvious JavaScript console-breaking error
- sitemap and robots remain present

## Rollback

If a production release breaks a business-critical path:
1. identify the last known-good commit
2. revert the bad commit or restore the prior file versions
3. redeploy `main`
4. confirm the live fix
5. diagnose the failed release afterwards

Do not leave a broken conversion or customer-account flow live while debugging an aesthetic or refactor issue.

## GitHub Actions

Current known workflows include:
- STATIC Discord Publisher
- South African streamer update workflow

Review `.github/workflows/` before changing file names that trigger automation.
