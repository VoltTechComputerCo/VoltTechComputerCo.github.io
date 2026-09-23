# Step 4.3 — Service funnel QA and legacy cleanup

Objective: close Step 4 by regression-testing the full service-page ↔ Signal Scan funnel, documenting retained legacy dependencies, and removing only service/Signal assets proven unused by the audited clean-rebuild branch.

Parent Step: Step 4 — Signal Scan and service pages.  
Previous: Step 4.2 uploaded and byte-verified at `8532030b7a11d79850b7cd1ffa672be233cea57e`.  
Current: Step 4.3 — packaged; repository upload/deletion verification pending.  
Next major Step after verification: Step 5 — Customer accounts and operations.

Branch: `clean-rebuild`. Exact repository rollback commit: `8532030b7a11d79850b7cd1ffa672be233cea57e`.

## Upload instructions

1. Extract **Step-4.3.zip** and stay on **clean-rebuild**.
2. Upload everything inside **Step 4.3/** to matching repository paths, replacing `README.md` when prompted.
3. Delete the three proven-unused files listed below after upload. ZIP upload does not remove files.
4. No new folder placeholders are required.
5. Report `Done`; the remote HEAD, every delivered file and all three deletions will be verified before Step 4 is closed.

## Delete separately

- `service-pages.css`
- `service-malware.css`
- `signal-scan.css`

## Intentionally retained

- `service-network.css` — still used by `streaming-setup-south-africa.html`.
- `scan-system.css` — still used by `stream-scan.html`.
- `scan-handoff.js` — still used by the legacy Stream Scan path through `analytics.js`.
- `symptom-handoff.js` — retained because the still-live legacy `analytics.js` contains a loader reference. The five rebuilt service pages do not load that legacy analytics bootstrap, but the referenced file is not deleted until that older layer is migrated safely.

## Final Step 4 QA

The new cross-funnel test verifies:

- each service page stays on the clean shell;
- every service-page `data-issue` key exactly matches the matching Signal Scan issue set;
- Signal Scan sends each source back to the correct service route;
- selected issue labels survive into WhatsApp/email enquiry text;
- Repair, Performance, Upgrades, Security and Windows price guidance remains aligned;
- Signal Scan keeps the visible statement that it does not remotely scan the PC;
- the Upgrades page still says VoltTech is not currently selling/sourcing components;
- the Security page still links to Exposure Scan;
- the rebuilt six-page funnel contains no references to the three files being deleted.

Package-side tests:

```text
node scripts/test-clean-signal-scan.mjs
node scripts/test-clean-services.mjs
node scripts/test-clean-service-funnel.mjs
```

All pass before packaging.

## Backend / operations

Step 4.3 changes no Supabase schema, data, launch flag, payment setting, customer record or commerce state.

## Rollback

Repository rollback target: `8532030b7a11d79850b7cd1ffa672be233cea57e`.

The cleanup deletes only superseded frontend assets. If a repository rollback is needed, restore those three files from the rollback commit together with the older frontend state.

Full audit notes: `docs/clean-rebuild/step-4.3-QA.md`.
