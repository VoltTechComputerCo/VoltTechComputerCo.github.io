# VoltTech public catalogue focus — 2 November 2026

VoltTech builds and services PCs. The public shop concentrates on desktop PC components, gaming parts, gaming/office peripherals, selected laptops and workstations, cooling, thermal supplies, PC-relevant cables/adapters and ordinary networking or UPS accessories.

## First-pass production audit

- Before: 5,122 stored products; 4,948 publicly eligible.
- Reversibly hidden: **665** product rows.
- After: **4,283 publicly eligible** products. **5,122** product records and **5,184** supplier offers remain stored.
- Grouped exclusions: laptop accessories 201; generic cables 157; adapters 103; power-protection 78; desk accessories 61; networking 35; tablets 14; specialty embedded/signage desktops 10; household standing fans 5; misplaced laptop accessory 1.
- Retained: legitimate graphics cards, CPUs, RAM, motherboard, cases, PSUs, CPU coolers, case fans, storage, thermal paste and Thermal Grizzly products, monitors, gaming and office peripherals, laptops/workstations and selected suitable connectivity.

## How the curation works

1. The live database function `public.vt_catalogue_focus_reason(category_slug,name)` returns an exclusion reason for a clearly non-core listing, or NULL when no exclusion applies.
2. The `zz_volttech_pc_focus_guard` BEFORE INSERT OR UPDATE trigger sets out-of-scope products to `visibility='private'` and `sale_mode='hidden'`, and records `metadata.public_store_eligible=false`, `metadata.catalogue_curation`, `metadata.catalogue_curation_reason` and `metadata.catalogue_curation_original`.
3. Existing imports will therefore not republish excluded items just by updating stock or supplier prices. The supplier feed/offer rows and historical references remain intact.
4. `assets/js/services/catalogue-exclusions.js` contains the initial 665 product IDs for immediate removal from **previously published** CDN snapshots, before the next scheduled snapshot regeneration. Future snapshots pick up the database's private/hidden flags directly.
5. Only public product IDs are in the static exclusion module; no wholesale cost, supplier credential or customer information is present.

## Curator review and restoration

The rules are intentionally cautious; some edge-case accessories may need manual review. To restore an individual excluded product intentionally, an administrator can set `metadata.catalogue_curation_override='include'` and `metadata.public_store_eligible=true` while restoring the previous `visibility` and `sale_mode` captured in `metadata.catalogue_curation_original`. This must be an explicit exception; do not disable the trigger casually.

**Important:** The initial 665 product IDs also remain in the cached-snapshot exclusion module until that module is regenerated or an ID is removed. Restoring a product in the database alone won't immediately restore it to an *old* CDN snapshot. A freshly published snapshot will include restored public products, but the list should also be updated in code.

For a large reversal, review excluded product IDs and reason groups and coordinate both the database flags/override and the CDN exclusion list before deploying. Do not delete `store_products` or `store_supplier_offers` as a cleanup shortcut.

## Validation

- Confirm the public count and curated row metadata directly in Supabase.
- Verify public Store and emergency WhatsApp browsing no longer display the excluded products, including while a pre-curation CDN snapshot is still cached.
- Verify a full supplier sync cannot republish excluded rows, and legitimate PC parts remain public.
- Do not infer browser or checkout QA from successful GitHub merges alone.
