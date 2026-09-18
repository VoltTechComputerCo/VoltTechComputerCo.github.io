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
build and commerce data
```

## Architectural principle for VoltTech 2.0

VoltTech 2.0 is a **consolidation**, not a clean-slate rewrite.

Existing working business data and backend workflows should be preserved unless there is a documented reason to replace them.

## Target frontend layers

New code should gradually converge toward:

```text
assets/
  brand/
  images/
    shared/
    services/
    commerce/
    static/
  icons/

css/
  vt-tokens.css
  vt-base.css
  vt-components.css
  vt-navigation.css
  vt-services.css
  vt-commerce.css
  vt-account.css

js/
  core/
    config.js
    auth.js
    analytics.js
    navigation.js
    ui.js
  services/
  commerce/
  account/
  admin/

docs/
```

This is a target structure, not an instruction to move all legacy files at once.

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
- saved builds
- service activity
- privacy/deletion requests
- notifications

### Commerce
Purpose: component discovery, quotation and eventual direct sales.

Must use reliable supplier/stock/pricing information before direct-sale claims are enabled.

### PC Builder
Purpose: help customers construct compatible systems and feed useful structured build information into VoltTech quotes/store journeys.

### Admin / VoltTech HQ
Purpose: internal operating interface for customers, quotes, jobs, builds, store and records.

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

Those belong in Supabase/backend-controlled data.

Product catalogue data is currently split between Supabase and Builder JSON datasets. VoltTech 2.0 should progressively move toward one canonical product model, but only when doing so does not destabilise the working Builder/Store.

## Naming direction

Current naming decisions:

- `Signal Scan`: remains temporarily for URL continuity but should be de-emphasised and renamed in a controlled future migration.
- `Stream Scan`: rename/positioning pending.
- `Privacy Lab`: deferred and not part of the current commercial launch priority.

## Direct-contact architecture

Direct contact must be available independently of diagnostic tools.

Every major service journey should allow a visitor to:
- WhatsApp
- call
- email
- send/request an enquiry

Tools may enrich the enquiry; they must not be required to reach a human.
