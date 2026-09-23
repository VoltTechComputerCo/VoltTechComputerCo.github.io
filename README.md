# Step 4.1 — Signal Scan clean rebuild

Objective: migrate VoltTech Signal Scan onto the generated clean frontend, preserve the five service-page entry routes and answer-driven triage contract, align its displayed service estimates with the audited service pages, and remove the new route's dependency on legacy scan/navigation/analytics presentation layers.

Parent Step: Step 4 — Signal Scan and service pages.  
Previous major Step: Step 3 — PC Builder, fully uploaded and byte-verified at `add3637fa3872aace38d72f8a7497f4918b92933`.  
Current: Step 4.1 — packaged; repository upload and device review pending.  
Next: Step 4.2 — Repair, Performance, Upgrades, Security and Windows service-page rebuild.

Branch: `clean-rebuild`. Exact parent / rollback commit: `add3637fa3872aace38d72f8a7497f4918b92933`.

## Upload instructions

1. Extract **Step-4.1.zip** and stay on **clean-rebuild**.
2. Upload the contents inside **Step 4.1/** to matching repository paths; replace `signal-scan.html` and `README.md` when prompted.
3. There are **no deletions in Step 4.1**.
4. **No new folder placeholders are required.** Every target directory already exists in the audited branch.
5. Tell me when uploaded. I will verify the new HEAD and all delivered hashes before Step 4.2.

## Changed page

https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/signal-scan.html

Useful route checks after upload:

- Repair: `signal-scan.html?source=repair&issue=boot`
- Performance: `signal-scan.html?source=performance&issue=fps`
- Upgrades: `signal-scan.html?source=upgrades&issue=gaming`
- Security: `signal-scan.html?source=security&issue=account`
- Windows: `signal-scan.html?source=windows&issue=fresh`

## What changes

- `signal-scan.html` becomes a generated `data-vt-shell="clean"` route using the shared VoltTech header, navigation, search, footer and self-hosted fonts.
- Signal Scan presentation moves to `assets/css/pages/signal-scan.css`.
- Answer/service data and pure triage rules move to `assets/js/services/signal-scan-model.js` so they can be regression tested.
- Page interaction lives in `assets/js/pages/signal-scan.js`.
- Journey storage and optional analytics tracking live in `assets/js/services/signal-scan-handoff.js` rather than in the page controller.
- Production analytics/service-worker startup uses the same shared integration used by the clean homepage rather than the legacy `analytics.js` bootstrap.
- Existing `?source=` and `?issue=` service-page handoffs are preserved for Repair, Performance, Upgrades, Security and Windows.
- WhatsApp and email messages are generated from the visible result and are only sent when the customer chooses a contact link.
- The waveform/priority language now explicitly says it is answer-based triage and not a hardware-health reading or remote scan.
- Windows results now show `R350–R650`, matching the audited Windows service page instead of the previous contradictory `Quote after scope` label.

## What deliberately does not change yet

The five legacy service pages are not rebuilt in this ZIP. Their current symptom controls, journey context and direct-contact handoff remain intact so they can continue feeding Signal Scan until Step 4.2 replaces them together.

`scan-system.css` and `scan-handoff.js` are not deleted because Stream Scan still belongs to the later creator/streaming migration and continues to use that older scan stack. The old root `signal-scan.css` is left in place until Step 4.3 performs a final repository consumer/residue audit.

No Supabase schema, RLS, function, setting or production record is changed. No diagnostic answers are uploaded to a backend by Signal Scan.

## Tests

Package-side checks already pass:

```text
node --check assets/js/pages/signal-scan.js
node --check assets/js/services/signal-scan-model.js
node --check assets/js/services/signal-scan-handoff.js
node scripts/test-clean-signal-scan.mjs
```

After upload the normal clean-frontend checks should also be run against the authoritative branch:

```text
python scripts/build-clean-frontend.py --check
python scripts/check-clean-frontend.py
node scripts/test-clean-runtime.mjs
node scripts/test-clean-signal-scan.mjs
```

## Rollback

Repository rollback target: `add3637fa3872aace38d72f8a7497f4918b92933`.

No backend rollback is required.
