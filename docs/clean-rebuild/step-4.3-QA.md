# Step 4.3 QA — Service funnel closeout

## Verified base

Step 4.2 was uploaded to `clean-rebuild` and independently compared to the delivered ZIP. All 28 packaged files, including the manifest itself, matched the remote Git blobs exactly. The authoritative Step 4.3 base is:

`8532030b7a11d79850b7cd1ffa672be233cea57e`

## Funnel regression

The Step 4.1 Signal Scan package and Step 4.2 service-family package were overlaid into one local verification tree. These tests pass together:

- `scripts/test-clean-signal-scan.mjs`
- `scripts/test-clean-services.mjs`
- `scripts/test-clean-service-funnel.mjs`

The final cross-funnel test checks all five service sources: Repair, Performance, Upgrades, Security and Windows.

For each source it verifies that the service-page issue keys and Signal Scan issue keys are identical and ordered consistently, that the selected issue is retained in the generated enquiry message, that the Signal Scan service destination is correct, and that pricing remains aligned.

## Pricing / business truth

Verified service and Signal Scan guidance remains:

- Repair: R350–R650
- Performance: R350–R550
- Upgrades: compatibility advice free; hands-on work from R299
- Security: R350–R550
- Windows: R350–R650

The Upgrades page still states that VoltTech is not currently selling or sourcing components. The Security page still exposes the separate browser-privacy Exposure Scan demo. Signal Scan still clearly states that it is answer-based triage and does not remotely scan the customer's PC.

## Legacy dependency audit

The following files are safe to delete because the rebuilt Signal Scan and five rebuilt service routes no longer reference them, and no remaining audited consumer requires them:

- `service-pages.css`
- `service-malware.css`
- `signal-scan.css`

The audit deliberately does **not** delete these files:

- `service-network.css`: `streaming-setup-south-africa.html` still references it.
- `scan-system.css`: `stream-scan.html` still references it.
- `scan-handoff.js`: the legacy analytics path still uses it for Stream Scan.
- `symptom-handoff.js`: `analytics.js` still contains a loader reference. It is dormant for the rebuilt service pages because those pages no longer load `analytics.js`, but deletion is deferred until that older shared bootstrap is migrated.

`sw.js`, the current homepage, Exposure Scan, core account/admin routes and the checked creator/streaming entry points do not reference the three deletion candidates.

## Scope boundary

Streaming support remains intentionally outside Step 4. Its shared service rail and Stream Scan dependencies belong to the later creator/streaming migration. Step 4.3 therefore avoids deleting files merely because they look old.

No Supabase schema/data, launch flag, Store/Builder state, payment flow or customer record changes in Step 4.3.

## Completion gate

After the Step 4.3 files are uploaded and the three deletions are remotely verified, Step 4 — Signal Scan and service pages is complete. The next major roadmap area is Step 5 — Customer accounts and operations.
