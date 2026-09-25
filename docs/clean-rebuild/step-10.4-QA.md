# Step 10.4 — Live .co.za verification

Step 10.3 successfully promoted the certified clean rebuild to `main`.

Production `main` SHA:

`3eba58456b4a93477f90b1d1fb9673877e0a3479`

The promotion workflow verified immediately before push:

- promotion tree matched the certified clean branch;
- Full QA: 24/24;
- Release source: 15/15;
- Device + Role: 9/9;
- Release browser: 11/11;
- `main` was unchanged immediately before push;
- remote `main` was re-fetched after push and matched the promoted SHA.

GitHub Pages also completed a successful deployment for the promoted SHA.

## Step 10.4 purpose

This final gate verifies the **public production origin** rather than repository files.

It checks:

- HTTP → HTTPS redirect;
- HTTPS homepage reachability;
- clean-shell homepage markers;
- homepage production indexing and `.co.za` canonical;
- PC Repair / Signal Scan live surfaces;
- STATIC hub and RSS discovery;
- Store remains noindex and launch-gated;
- Builder remains noindex and launch-gated;
- Account remains noindex/private and contains the corrected DOM;
- `robots.txt`;
- `.co.za` sitemap;
- `.co.za` STATIC RSS;
- core CSS, JavaScript and hero image assets;
- real 404 response;
- production `main` still equals the promoted release SHA.

A PASS closes the automated clean-rebuild release. Final manual visual inspection of the live `.co.za` pages is still required before declaring the project fully released.
