# VoltTech clean rebuild

Current phase: **Step 10.4 production 404 fix + final live verification**.

Upload everything in this package to `clean-rebuild`, not `main`. Delete nothing. No placeholder folders required.

Upload workflow/source/CSS/docs first, then `scripts/run-step-10.4.mjs`, and upload `scripts/run-step-10.4-hotfix.mjs` **LAST**.

The final upload triggers a certified non-force production hotfix. It generates `404.html`, runs Full QA and the full non-commerce certification, verifies `main` is unchanged, pushes the exact clean tree, then checks the real `.co.za` site.

Target: **17/17 live checks PASS**.
