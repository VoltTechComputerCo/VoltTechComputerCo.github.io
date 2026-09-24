# VoltTech clean rebuild

Branch: `clean-rebuild`

Current phase: **Step 9.1 — automated full regression QA**.

Verified through Step 8.3: clean frontend foundation, commerce foundation, PC Builder, services/Signal Scan, customer accounts/records/documents, Creator Hub/streaming, STATIC hub + 30 historical articles, legal/support, `.co.za` canonical migration, hard accessibility/domain gates and final SEO/residue cleanup.

## Upload
Upload everything inside `Step 9.1/` to matching repository paths.

Delete nothing.

No folder placeholders are required; every destination folder already exists.

**Upload `.github/workflows/full-qa.yml` before `scripts/run-full-qa.mjs`, and upload `scripts/run-full-qa.mjs` last.** The runner upload is the one-time push trigger for the Step 9.1 workflow.

Expected GitHub Actions workflow:
`VoltTech Full QA`

Expected artifact:
`volttech-step-9.1-qa`

This batch changes no visible page, so no visual preview is required for Step 9.1.

Next after verification: **Step 9.2 — responsive/device interaction and role-flow QA**.
