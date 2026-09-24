# Step 7.2 QA — printable customer documents

Parent verified commit: `57a8e9f3eb61d4ee5e9d92e088e8a617b1a86de7`.

## Scope
Clean generated migration of:
- Quotation
- Invoice
- Proforma
- Receipt
- Order record
- PC Build specification
- Service record
- Personal Data report

## Data and action contracts
- Customer authentication uses the Step 5 clean account-session service and existing RLS.
- Quote accept/decline remains server-authoritative through `customer_quote_action`; no browser-only state transition was introduced.
- Personal Data reuses the hardened `collectPersonalData` service from Step 5.
- Print/save-to-PDF remains local browser printing with deterministic safe filenames.
- No document email button is exposed in the clean document pages because the production Supabase project currently has no deployed `send-document-email` Edge Function.
- Existing clean Quotes / Builds / Documents record cards also suppress their dead email-copy buttons until that backend exists.
- Invoice test checkout is not exposed from the clean document view. The existing `create-yoco-checkout` function is test-key based, still hard-codes the GitHub origin for CORS/redirects, and does not consult the public direct-payment launch gate. Production payment remains a later certification item.

## Preview
`?inspect=1` on a non-production host renders a read-only placeholder layout with no Supabase session and no customer data.

## Regression
- all eight routes use the clean generated shell;
- `noindex, nofollow` preserved;
- no unversioned Supabase CDN include;
- no legacy document CSS/JS references or inline onclick handlers;
- quote RPC string remains in the service layer;
- personal-data service is reused;
- no fake email or test-payment actions are present.

## Cleanup
No legacy root document files are deleted in 7.2. Step 7.3 will prove remaining consumers before removing them.
