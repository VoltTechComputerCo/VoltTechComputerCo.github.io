# VoltTech Computer Co. — Production baseline

Production release is live at `https://volttechcomputerco.co.za`.

Current work: **Phase 11.1D — Canonical URL normalization**.

Google Search Console confirmed that Cloudflare Pages redirects physical `.html`
paths to extensionless public URLs. This staging batch aligns canonical metadata,
sitemap, structured data and STATIC feed automation with the URLs Cloudflare
actually serves.

## Upload target

Upload this Step 11.1D package to **`clean-rebuild` only**.

Do not upload it to `main`.

Upload the workflow, normalizer, URL-contract test and documentation first.

Upload:

`scripts/run-step-11.1d.mjs`

**LAST** to trigger the staging workflow.

The workflow may create one GitHub Actions bot commit on `clean-rebuild` containing
the normalized SEO files. It does not promote anything to production.
