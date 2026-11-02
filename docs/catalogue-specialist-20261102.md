# VoltTech Specialist Store — Gaming PC Catalogue, 2 November 2026

The owner directed that VoltTech sell **gaming PC components and peripherals**, with only a **very limited, curated** selection of office-type PC gear. VoltTech is not a household appliance, general office supply or broad consumer electronics store.

## Result

- Initially publicly eligible: 4,948 products.
- First-pass hide: 665 publicly active products.
- Second-pass hide: **2,285 additional publicly active products**, preserving records.
- Public Store after both: **1,998 products**, including all genuine core PC component listings that passed the earlier guard.
- Full product database remains **5,122 rows**; 5,184 supplier offers remained untouched at the cleanup.
- The static CDN exclusion list currently contains **2,966 IDs**, including some entries that were already private before the second pass. This is deliberately conservative for older snapshot caches.

## Category policy

**Keep the entire genuine hardware range:** CPU, GPU, motherboard, memory, storage, case, PSU, CPU cooler, PC fans, thermal paste and upgrade kits. Non-PC items misclassified into these categories remain disallowed by the earlier product guard and the second-stage classifier.

**Curate gaming peripherals:** up to 110 gaming keyboards, 85 gaming mice, 63 gaming headsets, 85 gaming monitors, 29 creator/gaming audio items, 29 compatible game controllers and 15 webcams. Selected gaming keyboards include mainstream mechanical, Hall-effect and enthusiast models; accessories and switch sets rank below working keyboards.

**Keep compact, useful office choices:** up to 8 office laptops, 10 office desktops/workstations, 10 office monitors, 8 basic keyboards, 8 basic mice and 6 office headsets, plus selected common PC utility accessories.

**Keep a limited practical PC accessory range:** up to 55 cables, 50 adapters, 18 networking products, 16 relevant power-protection items, 85 desk/thermal accessories and 6 laptop accessories. Ranking prefers availability, relevance to PC builds and gaming, supplier product imagery and valid prices.

**Hide** unrelated portable Bluetooth speakers, conference controllers, surveillance monitor lines, embedded signage equipment, unnecessary business workstation variants, handheld consoles, phone accessories and bulk generic connectivity products.

## Guardrail implementation

1. `public.vt_store_focus2_group` classifies core, gaming, office, accessory and unrelated products.
2. `public.vt_specialist_selection_20261102` generated the one-time priority-based shortlist. Its selection was applied and **frozen** in metadata; it should not be rerun on a later narrowed public catalogue expecting identical ranks.
3. Every retained non-core product stores `metadata.focus2_approved=true`, plus `metadata.focus2_group` and `metadata.focus2_selection`. Existing core PC products do not need explicit approval.
4. `zzzz_volttech_specialist_guard` protects the public catalogue on supplier INSERT and UPDATE. It preserves `focus2_approved` and restoration metadata when supplier upserts omit them. New non-core products are hidden until manually reviewed.
5. Hidden products retain `metadata.catalogue_focus2_original` (prior visibility/sale mode) and `metadata.catalogue_focus2_reason`; no product or supplier-offer deletion occurred.
6. `assets/js/services/catalogue-exclusions.js` filters rejected IDs from preexisting CDN snapshots during the transition and from offline/WhatsApp fallback. Update this exclusion list alongside any manual product restoration.

## Manual exceptions

Admin can explicitly reintroduce a listing by setting `metadata.catalogue_curation_override='include'` or `focus2_approved=true` for permitted non-core products, restoring the previous `visibility='public'` and `sale_mode` as appropriate, confirming supplier stock/pricing, **and regenerating the static CDN exclusion list** to prevent an old snapshot from continuing to hide it. Do not allow unvetted or expired supplier inventory to republish itself.

Only the owner/admin should change these approvals. The import guard is not a replacement for the seller's normal stock, pricing, checkout or payment verification.

## Validation and caveats

- Verify counts and guards in Supabase after importing feeds and after scheduled catalogue publication.
- Spot-check storefront and product details on mobile and desktop; no browser-based live QA is implied by GitHub merge.
- Customer saved carts containing now-private products may need manual support; no records are deleted.
- The static 2,966-ID exclusion file is a transitional hard filter. Keep it synchronised on future product restores.
- Existing operations, quotes, invoices, costs, supplier offers, Supabase login and emergency WhatsApp ordering remain unchanged.
