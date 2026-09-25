# VoltTech master roadmap

Current major Step: **Step 10 — Release Candidate / Promotion**.

Steps 0–9: complete.

Step 10.1: **complete — non-commerce Release Candidate locked and certified**.
Step 10.2: packaged — controlled local promotion rehearsal from current `main` to `clean-rebuild`; no live push.
Step 10.3: queued — explicit promotion of the rehearsed merge to `main`.
Step 10.4: queued — live `https://volttechcomputerco.co.za` smoke test, canonical/robots/sitemap validation and rollback check.

Promotion safety:
- `main` must remain at the reviewed head until the rehearsal/promotion pair is complete.
- Any new main commit invalidates the rehearsal.
- Store, Builder and direct payments remain disabled throughout this release.
