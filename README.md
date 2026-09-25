# VoltTech clean rebuild

Branch: `clean-rebuild`

Current phase: **Step 10.3 — controlled promotion to main**.

Step 10.2 promotion rehearsal: **PASS**.

## This upload can change the live branch

Upload everything inside `Step 10.3/` to matching paths on `clean-rebuild`.

Delete nothing.

No folder placeholders are required.

Upload `.github/workflows/promote-main.yml` before the script.

Upload the documentation files next.

Upload `scripts/run-step-10.3.mjs` **LAST ONLY WHEN YOU ARE READY TO PROMOTE**.

That final upload triggers `VoltTech Step 10.3 Promote Release Candidate`.

The workflow will re-run the merge rehearsal and complete release certification before any push. It will abort if `main` moved, if an unexpected conflict exists, if the resulting tree differs from the current clean branch, or if any QA gate fails.

Only after all checks pass does it push the merge commit to `main` without force.

Store, Builder and direct payments remain disabled after promotion.

Next after a successful push: Step 10.4 live `.co.za` verification.
