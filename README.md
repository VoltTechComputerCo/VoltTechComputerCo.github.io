# Step 8.2 — Accessibility + performance

Previous: Step 8.1B fully verified at `7087681ad359a38ae1bcaa6704c99944aab52519`.
Current: Step 8.2 — packaged.
Next: Step 8.3 — historical STATIC + final SEO/residue QA.

## Upload
Upload everything inside `Step 8.2/` to matching paths on `clean-rebuild`.

Deletions: none.
Folder placeholders: none.
Supabase migrations: none.

## Important hidden file
This package updates:

`.github/workflows/clean-frontend-sync.yml`

Make sure it is uploaded.

## What happens after upload
The existing clean frontend sync workflow regenerates the 8 printable document pages and 5 service pages from source, then runs:
1. the full clean accessibility/structure checker as a hard gate;
2. the `.co.za` domain-residue checker as a hard gate;
3. the generated-output commit only if both pass.

Expected bot commit:
`chore: sync clean frontend outputs`

No visual redesign, customer-data change or launch-state change is part of this step.
