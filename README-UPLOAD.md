# VoltTech V3 Rework — Batch 1

Branch: `v3-prototype` ONLY.

This package is intentionally CSS-first. It preserves the existing page HTML, IDs, JavaScript, Supabase logic, launch gates, forms, quotes, authentication, Signal Scan state and Builder logic wherever possible.

## Upload / replace these files exactly at these paths

- `/phase9-business-finish.css`
  - Restyles the five core PC service pages together.
- `/signal-scan.css`
  - Full V3 visual rebuild of Signal Scan without touching its inline triage logic.
- `/streaming-support.css`
  - V3 streaming support page.
- `/creator-hub.css`
  - V3 Creator Hub layout while keeping the streamer feed/player logic intact.
- `/account-v3.css`
  - V3 customer account/auth/dashboard visuals while keeping account.js and Supabase untouched.
- `/commerce/store.css`
  - V3 store/product/cart visual system. Existing commerce JS and launch gate stay intact.
- `/builder/phase6-unification.css`
  - Late-loading V3 Builder skin. Existing Builder base CSS and all Builder JS stay untouched.
- `/static.html`
  - Rebuilt STATIC index using the V3 design language while keeping STATIC distinct and editorial.

Do NOT delete or rename any JS files, Supabase files, service HTML pages, commerce JS files, Builder JS files or account JS files.

## Why this approach is safer

V3 is applied mostly through stylesheets already loaded by the working pages. That avoids replacing functional DOM structures and reduces the risk of breaking:
- Signal Scan
- Supabase auth
- account records
- quotes / documents
- Store cart logic
- store launch gating
- PC Builder state and compatibility logic
- streamer feed / Creator Hub functionality
- conversion tracking and WhatsApp/email handoff

## Preview after upload

Homepage:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/v3-prototype/index.html

PC Repair:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/v3-prototype/pc-repair-pretoria.html

Performance:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/v3-prototype/pc-performance-optimisation.html

Upgrades:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/v3-prototype/pc-upgrades-pretoria.html

Security:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/v3-prototype/virus-malware-removal-pretoria.html

Windows:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/v3-prototype/windows-installation-pretoria.html

Signal Scan:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/v3-prototype/signal-scan.html

Streaming:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/v3-prototype/streaming-setup-south-africa.html

Creator Hub:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/v3-prototype/creator-hub-south-africa.html

Account:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/v3-prototype/account.html

Store:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/v3-prototype/store.html

PC Builder:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/v3-prototype/builder/index.html

STATIC:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/v3-prototype/static.html

## Next batch

After this batch is visually verified, the next V3 batch should cover the transactional/customer-support surfaces:
checkout, order status, quotes, documents, build history, service records, legal/privacy centre and any remaining shared portal screens.
