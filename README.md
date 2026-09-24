# VoltTech clean rebuild

Branch: `clean-rebuild`

Current phase: **Step 9.2 — responsive/device interaction and role-flow QA**.

Verified through Step 9.1: **24/24 automated full-regression gates pass** across the clean rebuild through Step 8.3.

## Upload
Upload everything inside `Step 9.2/` to matching repository paths.

Delete nothing.

No folder placeholders are required; every destination folder already exists.

**Upload `.github/workflows/device-role-qa.yml` before `scripts/test-device-role-qa.mjs`, and upload `scripts/test-device-role-qa.mjs` LAST.** The test-script upload triggers the one-time Step 9.2 browser workflow after all support files are present.

Expected GitHub Actions workflow:
`VoltTech Device + Role QA`

Expected artifact:
`volttech-step-9.2-device-role-qa`

This package does not redesign or alter customer-facing pages. It adds browser QA infrastructure and documentation only.

After the automated workflow passes, manually inspect only the nominated Step 9.2 GitHack pages on the phone. Step 9.3 starts after automated + manual Step 9.2 approval.
