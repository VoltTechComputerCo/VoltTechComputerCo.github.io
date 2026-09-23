# Step 4.2 — Core service-page family

Objective: rebuild the five local PC support pages on the clean VoltTech shell while preserving their service intent, local SEO, pricing guidance, truthful business boundaries and Signal Scan continuity.

Parent Step: Step 4 — Signal Scan and service pages.  
Previous: Step 4.1 Signal Scan uploaded and byte-verified at `4d77081f6bed0706edf22b193f30af35986ef55b`.  
Current: Step 4.2 — packaged; repository upload verification pending.  
Next: Step 4.3 — service-funnel QA, dependency audit and legacy cleanup.

Branch: `clean-rebuild`. Exact repository rollback commit: `4d77081f6bed0706edf22b193f30af35986ef55b`.

## Pages rebuilt

- `pc-repair-pretoria.html`
- `pc-performance-optimisation.html`
- `pc-upgrades-pretoria.html`
- `virus-malware-removal-pretoria.html`
- `windows-installation-pretoria.html`

## Upload instructions

1. Extract **Step-4.2.zip** and stay on **clean-rebuild**.
2. Upload everything inside **Step 4.2/** to matching repository paths, replacing existing files when prompted.
3. There are **no deletions in this step**.
4. There are **no new folder placeholders required**; every required directory already exists.
5. Inspect all five GitHack pages on mobile after upload, then report `Done`.

## What changes

- Moves all five pages onto the generated clean shell and the shared local font/design-token stack.
- Replaces five duplicated inline symptom handlers with `assets/js/pages/service.js`.
- Replaces the old separate symptom/CTA handoff layer with `assets/js/services/service-contact.js`.
- Preserves each page's current title, description, canonical URL, Open Graph media, Service structured data, breadcrumb structured data, local service areas and pricing language.
- Preserves the Security page's Exposure Scan privacy-demo link.
- Preserves the Upgrades page's current operating boundary: compatibility advice remains available, but VoltTech is not currently selling/sourcing components and full custom builds remain paused.
- Keeps Signal Scan continuity and now updates its `source` and `issue` parameters from the currently selected service symptom.
- Keeps production analytics/service-worker loading and cart-count continuity through existing clean services.
- Fixes the malformed legacy `Unknown apps` Security symptom markup.
- Does not change Supabase, customer records, commerce settings, launch flags, Store, Builder or STATIC.

## Intentionally retained until Step 4.3

No legacy shared file is deleted merely because these five pages stopped using it. Step 4.3 will re-audit remaining repository consumers first, then retire only proven-unused service assets/scripts.

## Visual inspection links

PC Repair:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/pc-repair-pretoria.html

Performance:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/pc-performance-optimisation.html

Upgrades:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/pc-upgrades-pretoria.html

Security:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/virus-malware-removal-pretoria.html

Windows:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/windows-installation-pretoria.html

## Package tests

```text
node --check assets/js/pages/service.js
node --check assets/js/services/service-contact.js
node scripts/test-clean-services.mjs
```

Result: PASS.

## Rollback

Repository rollback target: `4d77081f6bed0706edf22b193f30af35986ef55b`.

Full audit notes: `docs/clean-rebuild/step-4.2-QA.md`.
