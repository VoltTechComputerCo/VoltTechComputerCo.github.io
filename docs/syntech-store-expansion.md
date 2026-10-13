# Syntech store expansion — 13 October 2026

Source: Syntech_Pricelist_9_October_2026.xlsx, dated 9 October, supplied through the connected Drive. Private source costs and account-key feed URLs are never committed to the public repository.

Selected 1,628 rows, with three surveillance SSDs and one healthcare monitor kept private. 1,624 Syntech listings plus 122 Esquire listings are public. Around 16% of the Syntech range is tagged Office; shared accessories remain useful to both audiences. Kept modern desktop components, peripherals, cables, adapters, cooling supplies and creator audio. Excluded appliances, server items and GPUs older than the established generation floor. No dedicated professional audio interface was identified; USB audio adapters are labelled as adapters.

Prices use the source's explicitly VAT-exclusive cost, multiplied by 1.15 and then the existing 30% markup. They are provisional until quote confirmation. Stock quantities are absent from this spreadsheet and remain unknown until feed activation. Product images are matched to exact supplier product-page URLs using Syntech's public product API; missing images use the existing unavailable-image fallback.

Store categories and category-specific filters include monitor Hz/size/panel, cable connector/length, audio product type/connection, brand, use case, availability and price bands. All catalogue pages are fetched in bounded server ranges; the browser renders only the selected page.

## Short checkout

Customer submits contact/delivery details once. Admin records reservation evidence, selling prices, labour, delivery and discounts together, then sends the final quote in one transaction. Accept & pay records the exact approved total and releases payment automatically for these quotes. No feed availability is treated as reserved stock. Quotes expire at the end of the preparation day in South African time. Supplier ordering and manual Bob Go fulfilment remain after verified payment. Internal milestones and history remain available; the customer progress display has four stages.

## Feed activation

Operations Hub → Suppliers → Connect Syntech automatic stock feeds. Enter the account's ZAR JSON Full and Update links from Syntech My Account → Stock Feeds. HTTPS Syntech hosts only. Vault stores the URLs; clients cannot read them. Scheduled sync requires a private token, and manual sync requires admin authentication. Hourly update at minute 13; daily full at 01:43 UTC. No requests run until feed links exist. A 20-minute lock prevents concurrent/manual duplicate downloads. HTTP 429 pauses downloads; HTTP 403 requires account intervention. Parse count and ZAR currency must match before updates. Only already-curated Syntech SKUs are synced; supplier delisting removes Syntech stock availability while preserving any other supplier offer.

Reference: https://developer.syntech.co.za/docs/fair-usage-policy and https://developer.syntech.co.za/docs/field-reference

Backend rollback verification: scripts/verify-short-checkout.sql. Pure normalization tests: scripts/test-syntech-feed.mjs. Browser fixtures cover monitor filters, price sorting, cart subtotal, combined admin preparation and direct accept/pay redirection, without real orders or charges.
