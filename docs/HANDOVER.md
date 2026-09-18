# VoltTech Website Handover Guide

## Purpose

This document is the first file a new developer, IT company or technical contractor should read when taking responsibility for VoltTech Computer Co.'s website.

The project is a lightweight GitHub Pages frontend connected to a Supabase backend. It has evolved beyond a simple brochure website and includes customer, commerce, service, quote/document and editorial systems.

## Business context

VoltTech Computer Co. is an early-stage South African PC and technology service business.

The website must help the business make money through legitimate services and, later, hardware commerce. The priority is not novelty. The priority is trust, enquiry conversion, paid service work, repeat customers and maintainable operations.

### Primary commercial priorities

1. PC diagnostics and repair
2. PC upgrades
3. Performance troubleshooting/optimisation
4. Malware/security and Windows support
5. Remote/courier-in support where suitable
6. Store and PC hardware commerce once sourcing/stock/pricing are dependable
7. PC Builder as a commerce and quotation aid

### Customer-contact principle

Direct human contact is a primary conversion route.

Do not force customers through a diagnostic tool before they can:
- WhatsApp VoltTech
- call VoltTech
- email VoltTech
- request a quote
- explain their problem in plain language

Signal Scan may remain as an optional helper, but must not become a gatekeeper.

## Ownership and access

### GitHub
Repository: `VoltTechComputerCo/VoltTechComputerCo.github.io`

`main` is production.

Structural development for VoltTech 2.0 should take place on `v2-rebuild`.

At the time of this baseline, the owner primarily works from an Android phone. Repository modifications are therefore handled manually/mobile-first. External assistants or connectors should be treated as read/audit tools unless the owner explicitly confirms a future write-enabled workflow.

### Supabase
Project name: `VoltTech Production`

The public frontend uses the Supabase publishable client configuration. Secret/service-role credentials must never be stored in public repository files.

### Google / analytics
The site includes Google Analytics and Search Console verification. Preserve measurement and verification when redesigning public pages.

### GitHub Actions
The repository includes automation for STATIC Discord publishing and South African streamer data updates.

## Privacy

VoltTech operates from a home office.

**Never publish the private residential street address.**

Location/service-area marketing may reference public service areas such as Pretoria and surrounding areas without exposing the private residence.

## Current release maturity

### Production
- Homepage
- Core service pages
- Local SEO pages
- STATIC publication
- Sitemap/robots/search discovery infrastructure

### Beta / active development
- Store
- PC Builder
- Account/customer portal
- Commerce checkout flow
- Creator/streaming tools

### Internal
- Admin dashboard and customer/store/build/record tooling

### Deferred
- Privacy Lab

## Before making a major change

1. Identify whether the URL is indexed or in `sitemap.xml`.
2. Identify whether another page links to it.
3. Identify whether JavaScript, Supabase or admin workflows depend on it.
4. Test mobile first.
5. Test keyboard/accessibility basics.
6. Check analytics and SEO metadata.
7. Check account/auth behaviour when relevant.
8. Check that direct customer-contact paths still work.
9. Avoid changing multiple critical systems in one unreviewable release.

## Emergency rule

If a release breaks customer enquiries, authentication, quotes, checkout, service pages or indexed URLs, prioritise rollback over aesthetic repair.

See `DEPLOYMENT.md` for rollback principles.
