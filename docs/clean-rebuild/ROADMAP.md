# VoltTech master roadmap

Current major Step: **Step 9 — Full QA (9.1 correction packaged)**.

Steps 0–8: complete through Step 8.3 historical STATIC migration and final SEO/residue cleanup.

Step 9.1: first automated full-regression run completed at **19/24 gates**. Correction packaged for the five failing gate groups: runtime canonical residue, admin remote fonts, unavailable document email actions, post-migration domain assertions and STATIC publishing/parser validation. The correction also restores future STATIC publishing beyond the 30 migrated historical articles.
Step 9.2: next after a 24/24 Step 9.1 rerun — responsive/device interaction and role-flow QA.
Step 9.3: queued — failure-state, retry, disabled-commerce/payment and release-blocker certification.

Next after Step 9 verification: **Step 10 — Release Candidate**.

Release blockers carried forward:
- Store, Builder and direct payments remain disabled.
- Production Yoco path still needs production credentials plus `.co.za` CORS/redirect and launch-gate certification.
- PAIA manual and Information Officer registration/details remain outstanding.
- Supabase leaked-password protection remains a dashboard action.
- Twitch creator refresh credentials still require repair.
