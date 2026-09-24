# Step 8.1A — Canonical source + SEO infrastructure

Objective: move VoltTech's source-of-truth public URL identity from the legacy GitHub host to the live apex domain without mixing in layout, indexing-gate or payment-launch changes.

Previous: Step 7 fully verified at `0c3501d0beefe16e5ce4e1a6d9b6ca897b515f2a`.
Current: Step 8.1A — packaged.
Next: Step 8.1B — generated output sync + domain crawl.

## Upload
Upload everything inside `Step 8.1A/` to matching repository paths.

Deletions: none.
Folder placeholders: none.
Supabase migrations: none.
Do not create a GitHub Pages `CNAME` file; Cloudflare remains the domain layer.

## Canonical host
`https://volttechcomputerco.co.za`

## Important transition
This is source-first. The clean page source heads, global SEO files, STATIC feed/sitemap pipeline and browser production-origin constant migrate now.

8.1B immediately follows by syncing generated HTML outputs and running the full active-file crawl. The 30 historical STATIC article canonicals are intentionally left for the shared-template migration in 8.3; sitemap/RSS already normalise those article URLs to `.co.za`.

## No launch-state changes
Store, Builder and direct-payment gates remain closed.
