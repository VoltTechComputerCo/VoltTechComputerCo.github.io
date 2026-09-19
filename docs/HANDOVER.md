# VoltTech Website Handover Guide

## Purpose

This document is the first file a new developer, IT company or technical contractor should read when taking responsibility for VoltTech Computer Co.'s website.

The project is a lightweight GitHub Pages frontend connected to a Supabase backend. It has evolved beyond a simple brochure website and includes customer, commerce, service, quote/document, creator and editorial systems.

## Business context

VoltTech Computer Co. is an early-stage South African PC and technology service business.

The website must help the business make money through legitimate services and, later, hardware commerce. The priority is trust, enquiry conversion, paid service work, repeat customers and maintainable operations.

### Primary commercial priorities

1. PC diagnostics and repair
2. PC upgrades
3. Performance troubleshooting/optimisation
4. Malware/security and Windows support
5. Remote/courier-in support where suitable
6. Store and PC hardware commerce once sourcing/stock/pricing are dependable
7. PC Builder as a future commerce and quotation aid

### Customer-contact principle

Direct human contact is a primary conversion route.

Do not force customers through a diagnostic tool before they can:
- WhatsApp VoltTech
- call VoltTech
- email VoltTech
- request a quote
- explain their problem in plain language

Signal Scan and Stream Scan may remain optional helpers, but must not become gatekeepers.

## Ownership and access

### GitHub
Repository: `VoltTechComputerCo/VoltTechComputerCo.github.io`

`main` is production.

Structural development for VoltTech 2.0 takes place on `v2-rebuild`.

The owner primarily works from an Android phone. The connected GitHub integration is useful for read/audit/verification, but current write attempts from ChatGPT return permission errors. Manual Android uploads are therefore the working edit path unless write access is explicitly re-tested and confirmed.

### Supabase
Project name: `VoltTech Production`

The public frontend uses the Supabase publishable client configuration. Secret/service-role credentials must never be stored in public repository files.

Store and Builder availability are controlled independently through Supabase-backed launch settings:
- `catalogue_enabled`
- `builder_enabled`

Both public experiences should fail closed unless explicitly enabled.

### Google / analytics
The site includes Google Analytics and Search Console verification. Preserve measurement and verification when redesigning public pages.

### GitHub Actions
Current repository workflows are:
- STATIC Discord Publisher
- STATIC sitemap autopilot

Creator/streamer refresh logic currently lives in Supabase backend assets rather than a GitHub Actions streamer-update workflow.

## Privacy

VoltTech operates from a home office.

**Never publish the private residential street address.**

Location/service-area marketing may reference public service areas such as Pretoria and surrounding areas without exposing the private residence.

## Current release maturity — 19 September 2026

### Production
- Homepage
- Core service pages
- Local SEO pages
- STATIC publication
- sitemap/robots/search discovery infrastructure

### Active / beta
- Customer account and document flows
- Creator Hub
- Signal Scan
- Stream Scan
- Exposure Scan

### Paused / launch-gated
- PC parts Store
- PC Builder
- new public commerce promotion tied to those systems

### Internal
- Admin dashboard and customer/store/build/record tooling

### Deferred
- broader Privacy Lab concept

## VoltTech 2.0 progress

Phase 0 and the conversion-first Phase 1 work are substantially complete.

Phase 2 consolidation is active and has already covered:
- shared service styling
- homepage/creator styling
- scan-page styling
- portal/admin styling
- checkout/order status
- Store and Builder launch gates
- navigation gating
- source-version normalisation for major shared assets
- public analytics loader references

Use `CHANGELOG.md` as the authoritative implementation record.

## Before making a major change

1. Identify whether the URL is indexed or in `sitemap.xml`.
2. Identify whether another page links to it.
3. Identify whether JavaScript, Supabase or admin workflows depend on it.
4. Check whether Store/Builder launch flags are involved.
5. Test mobile first.
6. Test keyboard/accessibility basics.
7. Check analytics and SEO metadata.
8. Check account/auth behaviour when relevant.
9. Check that direct customer-contact paths still work.
10. Avoid changing multiple critical systems in one unreviewable release.

## Emergency rule

If a release breaks customer enquiries, authentication, quotes, checkout, service pages or indexed URLs, prioritise rollback over aesthetic repair.

See `DEPLOYMENT.md` for rollback principles.
