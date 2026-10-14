# Expanded storefront — 14 October 2026

The catalogue accepts previous-generation PC hardware, notebook RAM, PC peripherals, cabling, networking, UPS equipment and relevant accessories. Complete desktops and laptops are identified before components; stationery, household appliances, surveillance and server products remain outside this range. Shared classification and policy modules are deployed with both supplier importers.

Syntech's full feed now imports eligible previously unselected SKUs. Existing explicitly curated identity, media, descriptions and markups are retained. The Esquire file available in Drive is dated 5 October: newly recovered products use its supplied descriptions, exact images and prices, but stock is unknown until confirmation. No feed credentials or source cost files are committed.

Recommended order prioritises available products, core hardware and category picks. Picks are editorial recommendations based on relevant models, specs, image coverage and availability, not claimed sales rankings. Name, brand and explicit price sorting remain independent. Missing images and failed image URLs show the VoltTech logo with “Product image not available”.

Selected available category picks use a 15% markup. Comparison prices are the previously public selling prices captured immediately before an actual reduction, with a provenance flag and a 30-day expiry. The frontend suppresses unverified anchors, expired discounts, sold-out offers and references below the current price. The server preserves reduced markups through feed refreshes, restores the regular markup when a managed deal expires, and clears invalid comparison prices. Cost increases still flow into the current price.

Apply `scripts/supplier-imports/expanded-catalogue-policy.sql` and `store-merchandising.sql` before deploying the sync/import functions. `vt_refresh_store_merchandising()` is executable by the server role only and runs after supplier updates. Existing quote, payment and shipping contracts are retained.

Validation: catalogue-load, departments, gaming-catalogue and Syntech normalization tests; store-selection and store-merchandising browser tests at 320, 390 and 1440 pixels, including both themes, filtering, sorting, genuine discounts, failed image fallback and category isolation.
