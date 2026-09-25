# VoltTech clean rebuild

Branch: `clean-rebuild`

Current phase: **Step 10.1 — Release Candidate lock**.

Step 9 is fully verified:
- Full QA: **24/24**
- Release source: **15/15**
- Device + Role: **9/9**
- Release browser: **11/11**
- Manual mobile visual approval: **approved**

## Upload

Upload everything inside `Step 10.1/` to matching repository paths on `clean-rebuild`.

Delete nothing.

No folder placeholders are required.

Upload `.github/workflows/release-candidate.yml` before the scripts.

Upload `src/pages/home.json` before `scripts/run-step-10.1.mjs`.

Upload `scripts/run-step-10.1.mjs` **LAST**.

That final upload triggers `VoltTech Step 10.1 Release Candidate`.

The workflow may create one bot commit for regenerated `index.html`. This is expected: the homepage release metadata is generated from the clean source.

## Release mode

This RC is non-commerce:
- Store OFF
- Builder OFF
- Direct payments OFF

A Step 10.1 PASS means the branch is ready for Step 10.2 promotion planning. It does not enable ecommerce.
