# Step 9.2 QA — Account correction

Step 9.1 previously passed **24/24 gates**.

The first Step 9.2 browser run passed:
- all four viewport matrices (360, 768, 1024 and 1440 px);
- PC Repair → Signal Scan handoff;
- complete Signal Scan result flow;
- Admin preview fail-closed boundary.

It failed only the two Account-role checks. Investigation found a real source/output regression: `account.html` and `src/pages/account.html` had been regenerated with an older Account DOM, while `assets/js/pages/account.js` and `assets/css/pages/account.css` remained on the newer Account implementation.

This correction:
- restores the last known-good Account main-content DOM from branch history;
- keeps the current `.co.za` canonical metadata and current clean templates;
- restores the expected authentication, recovery, overview, profile, address, security and tour targets;
- adds a source + generated DOM/controller contract to `scripts/test-clean-account.mjs`;
- retriggers both the Step 9.1 full regression suite and Step 9.2 browser QA.

No Supabase schema/data, account records, customer data, auth service logic, commerce flags, payment gates or other customer-facing pages are changed.

Step 9.2 remains open until both reruns pass and the nominated pages receive manual visual approval.
