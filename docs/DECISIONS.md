# Architectural and Business Decisions

This file records decisions that future maintainers should not have to rediscover.

## 17 September 2026 — VoltTech 2.0 starts as a consolidation
The project will not be rewritten from scratch. Existing working customer, quote, Store, Builder, STATIC and Supabase systems are assets to preserve and simplify.

## 17 September 2026 — Human contact is primary
Diagnostic tools must not be required before a visitor can speak to VoltTech.

Direct WhatsApp, phone, email and enquiry options are primary conversion paths.

## 17 September 2026 — Signal Scan is de-emphasised
Signal Scan may remain as an optional helper, but it is not the centre of the business or the mandatory enquiry funnel.

Any future rename must preserve URL/SEO continuity.

## 17 September 2026 — Privacy Lab deferred
The broader Privacy Lab concept is not part of the immediate commercial launch priority.

## 17 September 2026 — Stream Scan positioning under review
Stream Scan remains an optional creator diagnostic helper while its longer-term naming/positioning is reviewed.

## 17 September 2026 — Services before speculative commerce
The fastest legitimate path to revenue is the service business.

Store and Builder remain strategically important, but public promises must match real supplier, pricing, stock, fulfilment and warranty capability.

## 17 September 2026 — Main branch is production
Structural VoltTech 2.0 work should happen on `v2-rebuild`.

## 17 September 2026 — Preserve indexed service URLs
Do not rename core service pages for aesthetic reasons without a controlled SEO migration.

## 17 September 2026 — Private home address stays private
VoltTech may market service areas without publishing the owner's residential street address.

## 17 September 2026 — Documentation is part of the product
A competent third party must be able to operate the website from repository documentation without depending on undocumented owner knowledge.

## 19 September 2026 — Store launch is explicitly gated
The public PC Parts Store must fail closed unless Supabase explicitly reports `store_settings.catalogue_enabled = true`.

While disabled:
- public promotion should remain suppressed
- Store/Product indexing may remain restricted
- server-side/order submission controls must still enforce the disabled state

## 19 September 2026 — PC Builder launch is independently gated
The public PC Builder must fail closed unless Supabase explicitly reports `store_settings.builder_enabled = true`.

Historical saved builds may remain visible in the customer portal while new Builder access is paused.

## 19 September 2026 — Runtime rewrites are compatibility, not source truth
Service-worker version rewrites may protect older cached sessions, but source HTML should be normalised to current asset versions wherever practical.

Compatibility shims should only be removed after dependent source files and cached-session behaviour are confirmed safe.

## 19 September 2026 — Android/manual upload remains the working edit path
The connected GitHub integration is used for repository reading, auditing and verification.

Current ChatGPT GitHub write attempts are blocked by integration permissions, so exact replacement files are uploaded manually to `v2-rebuild` from Android unless write access is explicitly re-tested successfully.
