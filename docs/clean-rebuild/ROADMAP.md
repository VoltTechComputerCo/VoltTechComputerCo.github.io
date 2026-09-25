# VoltTech master roadmap

Current major Step: **Step 9 — Full QA (9.2 correction packaged)**.

Steps 0–8: complete through Step 8.3 historical STATIC migration and final SEO/residue cleanup.

Step 9.1: previously verified at **24/24 automated full-regression gates**; rerun is required after the Step 9.2 Account correction.
Step 9.2: first browser run passed all responsive matrices, Repair/Signal Scan flows and Admin boundary, but exposed an Account source/output DOM regression. Correction packaged and both automated suites will rerun.
Step 9.3: queued — failure-state, retry, disabled-commerce/payment and release-blocker certification.

Next after Step 9 verification: **Step 10 — Release Candidate**.

Release blockers carried forward:
- Store, Builder and direct payments remain disabled.
- Production Yoco path still needs production credentials plus `.co.za` CORS/redirect and launch-gate certification.
- PAIA manual and Information Officer registration/details remain outstanding.
- Supabase leaked-password protection remains a dashboard action.
- Twitch creator refresh credentials still require repair.
