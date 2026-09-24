# VoltTech clean rebuild

Branch: `clean-rebuild`

Current phase: **Step 8.3 — historical STATIC + final SEO/residue cleanup**.

Verified through Step 8.2: clean frontend foundation, commerce foundation, PC Builder, services/Signal Scan, customer accounts/records/documents, Creator Hub/streaming, STATIC hub, legal/support, `.co.za` canonical migration and hard accessibility/domain gates.

## Upload
Upload everything inside `Step 8.3/` to matching repository paths.

Delete exactly:
`correction-manifest.json`

No folder placeholders are required. The migration workflow creates `assets/css/static-legacy/` itself.

**Upload `.github/workflows/static-history-migration.yml` before `scripts/migrate-static-history.py`.** The script upload triggers the migration automatically. If your phone uploads them in the opposite order, simply upload `scripts/migrate-static-history.py` one more time after the workflow exists.

Expected bot commit:
`chore: migrate historical STATIC articles`

Next after verification: Step 9 — full responsive, role, payment, retry and regression QA.
