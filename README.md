# VoltTech clean rebuild

Branch: `clean-rebuild`

Current phase: **Step 10.2 — controlled promotion rehearsal**.

Step 10.1 Release Candidate: **PASS**.

## Upload

Upload everything inside `Step 10.2/` to matching repository paths on `clean-rebuild`.

Delete nothing.

No folder placeholders are required.

Upload `.github/workflows/promotion-rehearsal.yml` before the script.

Upload `scripts/run-step-10.2.mjs` **LAST**.

This triggers `VoltTech Step 10.2 Promotion Rehearsal`.

## Important

This workflow **does not push to `main`**.

It locally rehearses the real merge, allows conflicts only on the eight already-reviewed legacy divergence paths, resolves those paths in favour of the certified clean rebuild, proves the resulting tree is identical to the RC, and reruns the release certification.

A PASS is the prerequisite for the explicit Step 10.3 live promotion.
