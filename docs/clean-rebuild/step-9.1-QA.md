# Step 9.1 QA

Step 9.1 is the automated full-regression gate for the completed clean rebuild through Step 8.3.

## First workflow run

GitHub Actions run `36071256137` executed all 24 gates. Result: **19 passed / 5 failed**.

The failures were traced to:
1. `assets/js/pages/product.js` still writing a legacy `github.io` runtime canonical/OG URL.
2. Six noindex admin HTML surfaces still loading Space Grotesk / JetBrains Mono from Google Fonts.
3. The customer records stylesheet no longer hiding email controls whose backend action is intentionally unavailable.
4. `test-clean-domain.mjs` still expecting the pre-Step-8.3 feed legacy-normalisation allowance.
5. `test-clean-static.mjs` still naming the old feed parser; deeper inspection also showed `validate-static.py` was hard-coded to exactly 30 articles, which would block the next newly published STATIC article.

## Correction contract

This package:
- moves the affected admin surfaces to a tiny local-font bridge using the font files already present under `assets/fonts/`;
- restores the `.co.za` runtime product identity;
- restores the dead-email-action CSS guard;
- updates post-migration QA assertions without weakening canonical/domain checks;
- makes the STATIC validator explicitly distinguish the 30 migrated historical articles from future clean articles using `assets/css/pages/static-article.css`;
- keeps the full regression runner behaviour unchanged except for a rerun marker used to trigger the workflow after upload.

No launch flags, commerce/payment state, Supabase data, customer records or STATIC editorial copy are modified.

A fresh Step 9.1 run must reach **24/24 PASS** before Step 9.2 begins.
