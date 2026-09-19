# VoltTech Computer Co. Website

**Production website:** https://volttechcomputerco.github.io  
**Repository:** `VoltTechComputerCo/VoltTechComputerCo.github.io`  
**Production branch:** `main`  
**Development branch for VoltTech 2.0:** `v2-rebuild`  
**Hosting:** GitHub Pages  
**Backend:** Supabase (`VoltTech Production`)  
**Primary market:** South Africa, with local service SEO focused on Pretoria and surrounding areas  
**Current VoltTech 2.0 status:** Phase 2 consolidation in progress as of 19 September 2026

## What this repository contains

This repository is not only a marketing website. It currently contains:

- VoltTech's public service website and local SEO service pages
- PC parts Store infrastructure
- PC Builder and compatibility logic
- Customer accounts
- Quotes, invoices, pro formas, payments and documents
- Service records and job tracking
- Admin/customer/store tooling
- Notifications
- STATIC editorial publication and RSS/Discord publishing workflow
- Creator/streaming-related pages and tools
- Supabase frontend integration
- GitHub Actions automations

## Business priority

VoltTech 2.0 must support a legitimate operating business first.

The highest-priority customer journey is:

1. Customer discovers VoltTech.
2. Customer immediately understands what VoltTech can help with.
3. Customer can contact a human with as little friction as possible.
4. VoltTech converts the enquiry into paid service work.
5. Customer can later receive quotes, records, invoices and follow-up through the VoltTech system.

Interactive tools are secondary. They must never prevent or unnecessarily delay direct human contact.

## Current product areas

| Area | Purpose | Current status |
|---|---|---|
| Public website | Explain VoltTech and convert visitors into enquiries | PRODUCTION |
| Service SEO pages | Capture high-intent service searches | PRODUCTION |
| STATIC | Editorial traffic and wider brand reach | PRODUCTION |
| Customer account | Quotes, activity, documents and account data | BETA / ACTIVE |
| Store | PC component commerce infrastructure | PAUSED / LAUNCH-GATED |
| PC Builder | Guided and advanced compatible PC configuration | PAUSED / LAUNCH-GATED / NOINDEX |
| Admin tools | Internal customer, quote, record, build and store workflows | INTERNAL |
| Signal Scan | Optional troubleshooting/estimate helper | ACTIVE, LOW EMPHASIS |
| Stream Scan | Streaming/creator diagnostic helper | ACTIVE, POSITIONING REVIEW |
| Exposure Scan | Browser privacy/security demonstration | ACTIVE, OPTIONAL |
| Privacy Lab | Proposed broader privacy-awareness concept | DEFERRED |

The Store and Builder are controlled by Supabase-backed launch flags and fail closed when not explicitly enabled.

## VoltTech 2.0 progress

Completed or substantially completed work includes:

- baseline repository documentation and migration planning
- conversion-first service-page pass
- pricing clarity
- shared service design system cleanup
- homepage / creator-system cleanup
- Signal Scan / Stream Scan cleanup
- Exposure Scan cleanup
- customer and admin portal cleanup
- checkout / order-status cleanup
- Store and Builder launch gating
- global commerce navigation gating
- shared portal/notification source-version normalisation
- public analytics source-version normalisation
- Builder notification-loader source-version normalisation

See `CHANGELOG.md` for the batch-by-batch record.

## Start here if you are taking over the project

Read these files in order:

1. `V2_START_HERE.md`
2. `docs/HANDOVER.md`
3. `docs/CURRENT_SYSTEM.md`
4. `docs/ARCHITECTURE.md`
5. `docs/SECURITY.md`
6. `docs/SUPABASE.md`
7. `docs/DEPLOYMENT.md`
8. `docs/SEO.md`
9. `docs/OPERATIONS.md`
10. `docs/MIGRATION_PLAN.md`

## Non-negotiable constraints

- Do not publish the owner's residential address.
- Do not casually rename or remove established public SEO URLs.
- Do not expose Supabase secret/service-role credentials in frontend files.
- Do not weaken Row Level Security to work around a frontend bug.
- Do not present estimated diagnostic pricing as a guaranteed final quotation.
- Do not present unconfirmed supplier availability as live stock.
- Do not bypass Store or Builder launch gates from public navigation.
- Do not make visual changes that reduce mobile usability, accessibility, speed or conversion.
- Do not introduce unnecessary dependencies where lightweight HTML/CSS/JS can do the job.
- Keep STATIC editorial strategy distinct from VoltTech local-service SEO.
- Treat `main` as production.
- Make major structural work on `v2-rebuild` and merge only after testing.

## Repository rule

A future maintainer should be able to answer **what a feature does, why it exists, where its data lives and how it is deployed** from the documentation in this repository without relying on undocumented tribal knowledge.
