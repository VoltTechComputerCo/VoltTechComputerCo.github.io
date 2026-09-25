# VoltTech master roadmap

Current major Step: **Step 9 — Full QA (9.3 packaged)**.

Steps 0–8: complete through Step 8.3 historical STATIC migration and final SEO/residue cleanup.

Step 9.1: **complete — 24/24 automated full-regression gates passed**.
Step 9.2: **complete — 9/9 device/role gates passed and manual mobile visual inspection approved**.
Step 9.3: packaged — failure-state, retry, disabled-commerce/payment and release-blocker certification.

Next after verified Step 9.3: **Step 10 — Release Candidate**.

Release Candidate boundary:
- The RC is a **non-commerce release**.
- Store, Builder and direct payments remain disabled.
- Commerce launch blockers are tracked in `docs/clean-rebuild/RELEASE-BLOCKERS.md`.
- A green Step 9.3 result does not certify ecommerce launch readiness.
