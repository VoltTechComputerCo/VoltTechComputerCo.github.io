# Step 8.1B — Generated output sync + active-domain crawl

Previous: Step 8.1A verified at `946bc651a447ffea45ea8f3f9d74a228a73b0fc2`.
Current: Step 8.1B — packaged.
Next: Step 8.2 — accessibility + performance.

## Upload
Upload everything inside `Step 8.1B/` to matching paths on `clean-rebuild`.

Deletions: none.
Folder placeholders: none.
Supabase migrations: none.

## Important
This package includes a hidden GitHub Actions file:

`.github/workflows/clean-frontend-sync.yml`

Make sure that file is uploaded too.

Once the package lands on `clean-rebuild`, the action regenerates every clean page from `src/pages/`, migrates the three compatibility outputs, runs the clean frontend checker and runs the old-domain crawler. If generated HTML changed, the action commits those outputs back to `clean-rebuild`.

Do not manually edit generated HTML during this sync.

## No historical STATIC rewrite yet
The 30 historical `static-*.html` article files remain unchanged until Step 8.3.

## Workflow note

The broad clean-frontend checker remains visible as an informational audit. Its existing Step 8.2 findings do not block the domain migration. `scripts/check-domain-residue.py` remains the hard gate for this step.
