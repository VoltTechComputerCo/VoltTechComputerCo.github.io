# VoltTech Architecture

## High-level architecture

```text
Customer browser
      |
      v
GitHub Pages
(static HTML / CSS / JavaScript)
      |
      +--------------------+
      |                    |
      v                    v
Supabase              External services
Auth / Database       Analytics / Discord / future payments/shipping
      |
      v
Customer, service, quote, document,
build, creator and commerce data
```

## Architectural principle for VoltTech 2.0

VoltTech 2.0 is a **consolidation**, not a clean-slate rewrite.

Existing working business data and backend workflows should be preserved unless there is a documented reason to replace them.

## Current frontend direction

Phase 2 is consolidating the existing frontend incrementally rather than moving everything into a new directory structure at once.

Current shared/runtime layers include:
- `visual-system.css`
- `visual-block-fix.css`
- `mobile-nav.css`
- `service-pages.css`
- `creator-system.css`
- `scan-system.css`
- `portal-shell.css`
- `commerce-ui.css`
- `site-notifications-loader.js`
- `analytics.js`
- `sw.js`

New shared files should be introduced only when they reduce real duplication or improve maintainability without breaking established URLs and customer flows.

## Product domains

### Public services
Purpose: explain services and convert visitors into enquiries.

Priority: highest.

### Customer account
Purpose: give customers useful access to their own business relationship with VoltTech.

Includes:
- profile
- quotes
- invoices/documents
- saved builds/history
- service activity
- privacy/deletion requests
- notifications

### Commerce
Purpose: component discovery, quotation and eventual direct sales.

Current public Store access is controlled by the Supabase `catalogue_enabled` launch flag and must fail closed when not enabled.

Reliable supplier/stock/pricing information is required before direct-sale promises are enabled.

### PC Builder
Purpose: help customers construct compatible systems and feed useful structured build information into VoltTech quotes/store journeys.

Current public Builder access is controlled by the Supabase `builder_enabled` launch flag and must fail closed when not enabled.

Historical saved builds remain accessible through the customer portal.

### Admin / VoltTech HQ
Purpose: internal operating interface for customers, quotes, jobs, builds, Store and records.

### Creator systems
Purpose: creator discovery and streaming technical support.

Includes:
- Creator Hub
- streaming support page
- Stream Scan
- Supabase-backed South African streamer refresh/data

### STATIC
Purpose: editorial traffic, brand authority, audience growth and future monetisation.

STATIC should share selected brand foundations but remain editorially and visually recognisable.

## Data ownership

The frontend must never be treated as the authoritative source for:
- private customer records
- quote state
- invoice state
- payment state
- administrative authorization
- order status
- Store/Builder launch state

Those belong in Supabase/backend-controlled data.

Product catalogue data is still split between Supabase and Builder JSON datasets. VoltTech 2.0 should progressively move toward one canonical product model, but only when doing so does not destabilise the existing Store/Builder systems.

## Service worker and compatibility layer

`sw.js` currently:
- rewrites selected old asset-version references for cached/legacy pages
- injects the current site notification loader into same-origin HTML navigation when absent

These rewrites are compatibility shims, not the preferred source state.

Source HTML should be normalised first. Compatibility rules should only be removed after dependent pages and cached-session behaviour are confirmed safe.

## Naming direction

Current naming decisions:

- `Signal Scan`: retained for URL continuity and de-emphasised as an optional helper.
- `Stream Scan`: active as an optional creator diagnostic helper while positioning remains under review.
- `Exposure Scan`: active optional browser privacy/security demonstration.
- `Privacy Lab`: broader concept deferred and not part of the current commercial launch priority.

## Direct-contact architecture

Direct contact must be available independently of diagnostic tools.

Every major service journey should allow a visitor to:
- WhatsApp
- call where appropriate
- email
- explain/request help without completing a tool first

Tools may enrich the enquiry; they must not be required to reach a human.
