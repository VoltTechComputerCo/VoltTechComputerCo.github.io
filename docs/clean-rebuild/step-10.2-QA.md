# Step 10.2 — Controlled promotion rehearsal

Step 10.1 is complete. The non-commerce Release Candidate passed against:

- RC head `45acf215eef38172e2f601f64f4143cb3479422c`
- reviewed `main` head `12079c9d873cc1601581354829193a322f81d874`
- 24/24 full regression
- 15/15 release-source certification
- 9/9 device/role QA
- 11/11 release failure-state browser QA
- production homepage indexing
- Store/Builder noindex launch gates
- reviewed main divergence only

Step 10.2 does **not** deploy or push to `main`.

It performs the actual Git merge in a temporary GitHub Actions working branch starting from `origin/main`.

## Conflict policy

Only these already-reviewed main-only paths are allowed to conflict:

- `.github/workflows/static-sitemap-autopilot.yml`
- `.github/workflows/update-sa-streamers.yml`
- `creator-hub-south-africa.html`
- `index.html`
- `sa-streamers-live.json`
- `sitemap.xml`
- `store.html`
- `streamer-feed.js`

If any other path conflicts, the rehearsal fails.

For reviewed conflicts, the rehearsal chooses the certified `clean-rebuild` version because Step 10.1 already documented why each main-only implementation is legacy/superseded.

After merge resolution, the resulting Git tree must be **identical to the current clean-rebuild tree**. This is stronger than simply requiring a conflict-free merge.

The merged tree then receives the complete full regression and Step 9.3 release certification.

A PASS means we have proved the exact promotion merge locally. It still pushes **nothing** to `main`.
