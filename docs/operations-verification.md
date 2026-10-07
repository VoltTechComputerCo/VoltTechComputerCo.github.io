# Operations verification — 7 October 2026

Baseline main: 29a69ecacd984a399dd1b06e67be4a1542286b8b.

Passed:
- Production database transaction tests: feed stock cannot substitute for reservation; prices and delivery required; approval and explicit payment release required; supplier and courier actions blocked before payment; collection blocked until waybill sent; delivery and archive recorded. Entire fixture rolled back; no test notifications/emails persisted.
- Non-admin cannot read operations records or invoke admin data retrieval. Public callers cannot invoke approval/payment readiness helpers. Customer queries cannot select quote internal notes or store operational metadata.
- Next-action unit tests for every stage, service-only completion and linked-record deduplication.
- Admin browser fixtures at 390px and 1440px: workspace, reservation form, navigation, new quotation and no document overflow.
- Customer browser fixtures at 390px and 1440px: quote approval, payment hidden before release, safe customer text and no document overflow.
- Existing transaction, customer operations, customer records and document support checks.
- Supabase migrations applied and four edge functions deployed; signed Yoco webhook preserved.

Repository-wide regression: 18/23 checks pass both on baseline main and on the updated implementation. The same five pre-existing failures remain: source/generated HTML drift, two STATIC article publication dates, outdated runtime DOM fixture, Builder robots expectation, and an undefined catalogue test helper. No newly failing gate.

Limits: no real customer payment, supplier order, courier booking or external waybill email was made during tests. Browser flows use fixtures; administrator must use their existing login on production. Bob Go and supplier operations remain manual. Waybill email opens a prepared message; attach the PDF and send before marking sent. Existing paid store requests keep their historical documents; automatic invoice snapshots apply to future verified payment transitions.
