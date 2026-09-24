# Step 8.1B QA — generated output sync and domain crawl

Parent verified commit: `946bc651a447ffea45ea8f3f9d74a228a73b0fc2`.

## Objective
Synchronise every source-owned clean HTML output after the Step 8.1A `.co.za` source migration, migrate the three active non-generated compatibility pages, and fail if active non-STATIC output still carries the legacy `github.io` host.

## Automated sync
`.github/workflows/clean-frontend-sync.yml` runs on the initial 8.1B upload because the workflow file itself is in its trigger paths.

The workflow:
1. runs `scripts/build-clean-frontend.py`;
2. replaces the old host only in:
   - `privacy-policy.html`
   - `streaming-setup-south-africa-dynamic.html`
   - `exposure-scan.html`
3. runs the existing clean-frontend checker as an informational audit (known Step 8.2 accessibility/architecture debt does not block this domain-only sync);
4. runs the new active-domain residue crawler as a hard gate;
5. commits only changed generated HTML/compatibility output.

The bot-generated commit does not retrigger itself because root generated HTML is not in the workflow trigger paths.

## Crawl boundary
The crawler checks:
- every output declared by `src/pages/*.json`;
- the three compatibility pages above;
- robots, sitemap, RSS, STATIC hub and runtime site-config;
- other root HTML that is neither generated nor a historical STATIC article.

The 30 historical `static-*.html` article canonicals remain the one explicit old-domain exception until Step 8.3.

## Hosting
No `CNAME` file is introduced. Cloudflare remains the domain layer.

## Expected result after the action
- all source-owned generated HTML uses `.co.za`;
- Exposure Scan canonical/OG/Twitter/schema/report URL uses `.co.za`;
- redirect-page canonicals use `.co.za`;
- no active root non-STATIC page contains `https://volttechcomputerco.github.io`;
- historical STATIC article files remain unchanged until Step 8.3.

## Workflow correction after first run

The first 8.1B run proved generation and compatibility-domain replacement worked, but the existing broad frontend checker failed on already-known non-domain issues: dynamic document H1s, legacy Supabase bootstrap exceptions, image-dimension checks, a valid `tel:` link, and two page-controller purity heuristics.

Those findings are retained for Step 8.2. The checker still runs and remains visible in Actions, but only the domain residue crawler is a hard blocker for 8.1B.
