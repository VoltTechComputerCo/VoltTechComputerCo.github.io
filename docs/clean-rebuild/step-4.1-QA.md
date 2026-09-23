# Step 4.1 QA — Signal Scan clean rebuild

Audit date: 23 September 2026  
Authoritative branch at packaging: `clean-rebuild`  
Parent / rollback commit: `add3637fa3872aace38d72f8a7497f4918b92933`

## Scope

Step 4.1 isolates Signal Scan from the old service/scan presentation stack before the five linked service pages are rebuilt together in Step 4.2.

The existing tool was audited as an answer-driven triage helper. It does not remotely scan a customer device, but the old waveform and priority treatment could visually imply a measurement. The clean rebuild keeps the useful interaction while stating the limitation explicitly in first-party copy and next to the priority display.

## Five service routes preserved

Signal Scan continues to support the existing service-page query contract:

- `source=repair` → `pc-repair-pretoria.html`
- `source=performance` → `pc-performance-optimisation.html`
- `source=upgrades` → `pc-upgrades-pretoria.html`
- `source=security` → `virus-malware-removal-pretoria.html`
- `source=windows` → `windows-installation-pretoria.html`

Each source keeps its existing six issue keys and can still receive an `issue=` query parameter from the service-page symptom selector.

## Pricing audit

The five service pages were read from the same verified branch before packaging:

- PC Repair: typical range `R350–R650`;
- PC Performance Optimisation: typical range `R350–R550`;
- PC Upgrades: `From R299` for hands-on assessment/testing, with parts separate;
- Virus & Malware Removal: typical range `R350–R550`;
- Windows Installation: typical range `R350–R650`.

The existing Signal Scan already matched the first four service-page contracts. Windows was the exception: the tool displayed `Quote after scope` while the service page published a typical `R350–R650` range. Step 4.1 aligns the Windows result to `R350–R650` and keeps scope/backup/licensing caveats in the result note.

## Clean frontend migration

The old Signal Scan route depended directly on:

- Google Fonts;
- `analytics.js` plus a direct Google Analytics script;
- `signal-scan.css`;
- `scan-system.css`;
- `visual-system.css`;
- `visual-block-fix.css`;
- a large inline application script.

The rebuilt route uses only shared clean frontend assets plus:

- `assets/css/pages/signal-scan.css`;
- `assets/js/pages/signal-scan.js`;
- `assets/js/services/signal-scan-model.js`;
- `assets/js/services/signal-scan-handoff.js`.

The page controller remains free of direct storage/analytics/backend calls. Optional journey storage and event tracking are contained in the services layer.

## Privacy / handoff behavior

Signal answers remain browser-local. The tool creates WhatsApp and email text from the visible result only when rendering the result; navigation to WhatsApp/email occurs only after the customer activates the relevant link.

The existing `vt_journey_context` / `vt_last_scan_result` continuity keys remain supported. Storage failure is non-fatal.

Signal Scan does not create customer, service, quote or diagnostic records in Supabase.

## Triage behavior

The rebuilt model retains the original categories and bounded priority heuristic. Priority remains descriptive triage only. It is not a probability, failure score or hardware measurement.

Security/account-risk wording continues to avoid claiming that malware is confirmed and advises changing potentially exposed credentials from a trusted device.

## Legacy files deliberately retained

No deletion is part of Step 4.1.

- `scan-system.css` remains because the legacy Stream Scan still uses it.
- `scan-handoff.js` remains available for Stream Scan through its older analytics bootstrap.
- root `signal-scan.css` is now superseded for Signal Scan but is left until Step 4.3 consumer/residue verification rather than being deleted on assumption.

## Package checks

- generated page has exactly one `h1`, `main`, `header` and `footer`;
- no duplicate IDs;
- no inline event handlers or inline `style` attributes;
- no old Google Fonts / analytics / visual-system / scan-system dependency in generated Signal Scan;
- JavaScript syntax checks pass;
- `test-clean-signal-scan.mjs` passes all five source routes, service-price contracts, Windows question flow, security guidance and journey/contact continuity;
- the generated source pair follows the existing `scripts/build-clean-frontend.py` contract.

## Step 4.2 carry-forward

The five service pages still use a shared legacy stack that includes Google Fonts, `analytics.js`, `service-pages.css`, `service-network.css`, visual-system patches, mobile-nav injection, experience scripts and conversion context. Step 4.2 should migrate those five pages as one family so navigation, symptom selection, local-service wording, Signal Scan handoff, CTAs and SEO metadata remain consistent.

`streaming-setup-south-africa.html` is intentionally excluded from this family; it belongs with the creator/streaming ecosystem in Step 6.
