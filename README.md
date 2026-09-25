# VoltTech clean rebuild

Branch: `clean-rebuild`

Current phase: **Step 9.3 — Failure, retry and release-blocker certification**.

Verified before this package:
- Step 9.1 Full QA: **24/24**
- Step 9.2 Device + Role QA: **9/9**
- Step 9.2 manual mobile visual inspection: **approved**

## Upload

Upload everything inside `Step 9.3/` to matching repository paths.

Delete nothing.

No folder placeholders are required.

Upload `.github/workflows/release-certification.yml` before the test scripts.

Upload `scripts/run-step-9.3.mjs` **LAST**. That single upload triggers the complete Step 9.3 certification after all support files and blocker documentation are already present.

Expected workflow:
`VoltTech Step 9.3 Release Certification`

Expected artifact:
`volttech-step-9.3-release-certification`

## What a PASS means

A green Step 9.3 result means the clean rebuild may proceed to **Step 10 — Release Candidate in non-commerce mode**.

It does **not** mean Store, Builder, shipping or Yoco are ready for customer launch. Those features remain disabled and their blockers are explicitly carried in `docs/clean-rebuild/RELEASE-BLOCKERS.md`.

This package changes no customer-facing page or launch setting.
