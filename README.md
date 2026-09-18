# VoltTech Computer Co. Website

**Production website:** https://volttechcomputerco.github.io  
**Repository:** `VoltTechComputerCo/VoltTechComputerCo.github.io`  
**Production branch:** `main`  
**Development branch for VoltTech 2.0:** `v2-rebuild`  
**Hosting:** GitHub Pages  
**Backend:** Supabase (`VoltTech Production`)  
**Primary market:** South Africa, with local service SEO focused on Pretoria and surrounding areas  
**Last architecture baseline:** 17 September 2026

## What this repository contains

This repository is not only a marketing website. It currently contains:

- VoltTech's public service website and local SEO service pages
- PC parts Store
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
| Store | PC component discovery and quotation/checkout groundwork | BETA |
| PC Builder | Guided and advanced compatible PC configuration | BETA / NOINDEX |
| Admin tools | Internal customer, quote, record, build and store workflows | INTERNAL |
| Signal Scan | Optional troubleshooting/estimate helper | ACTIVE, LOW EMPHASIS |
| Stream Scan | Streaming/creator tool | RENAME / REVIEW |
| Privacy Lab | Proposed privacy-awareness tool | DEFERRED |

## Start here if you are taking over the project

Read these files in order:

1. `docs/HANDOVER.md`
2. `docs/CURRENT_SYSTEM.md`
3. `docs/ARCHITECTURE.md`
4. `docs/SECURITY.md`
5. `docs/SUPABASE.md`
6. `docs/DEPLOYMENT.md`
7. `docs/SEO.md`
8. `docs/OPERATIONS.md`
9. `docs/MIGRATION_PLAN.md`

## Non-negotiable constraints

- Do not publish the owner's residential address.
- Do not casually rename or remove established public SEO URLs.
- Do not expose Supabase secret/service-role credentials in frontend files.
- Do not weaken Row Level Security to work around a frontend bug.
- Do not present estimated diagnostic pricing as a guaranteed final quotation.
- Do not present unconfirmed supplier availability as live stock.
- Do not make visual changes that reduce mobile usability, accessibility, speed or conversion.
- Do not introduce unnecessary dependencies where lightweight HTML/CSS/JS can do the job.
- Keep STATIC editorial strategy distinct from VoltTech local-service SEO.
- Treat `main` as production.
- Make major structural work on `v2-rebuild` and merge only after testing.

## Repository rule

A future maintainer should be able to answer **what a feature does, why it exists, where its data lives and how it is deployed** from the documentation in this repository without relying on undocumented tribal knowledge.
