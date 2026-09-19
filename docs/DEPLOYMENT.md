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

The connected GitHub integration is currently reliable for reading and auditing repository state, but write/commit attempts from ChatGPT are blocked by GitHub integration permissions.

The practical edit workflow is therefore:
1. prepare exact replacement files
2. preserve their repository paths
3. upload them manually from Android to `v2-rebuild`
4. verify the resulting commit through the connected GitHub reader

Do not assume automated repository commits are available unless that capability is explicitly re-tested successfully.

## Safe deployment process

1. Make changes on `v2-rebuild`.
2. Review changed files.
3. Test key pages using available branch-preview/local tooling.
4. Confirm no indexed URL was accidentally removed.
5. Confirm navigation and internal links.
6. Confirm mobile layout.
7. Confirm contact paths.
8. Confirm Supabase/auth operations if touched.
9. Confirm Store/Builder launch gates if commerce code was touched.
10. Merge the reviewed version into `main`.
11. Confirm GitHub Pages deployment.
12. Smoke-test the live site.

## Live smoke test

Minimum:
- homepage loads
- primary service pages load
- WhatsApp/call/email links work
- Store stays gated unless explicitly enabled
- Builder stays gated unless explicitly enabled
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

Current workflows under `.github/workflows/` are:
- `static-discord-publisher.yml`
- `static-sitemap-autopilot.yml`

Streamer-directory refresh is not currently represented by a GitHub Actions workflow in the repository. Its backend refresh implementation lives under Supabase function/migration assets.

Review `.github/workflows/` before changing file names that trigger automation.
