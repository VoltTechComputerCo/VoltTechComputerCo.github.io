# Step 7.3 QA — document/support closeout

Parent verified commit: `b474112941cff9a4455d719f6e6087b1e57feb6a`.

## Scope
Final Step 7 document/support consistency and legacy cleanup.

## Verified runtime boundaries
- All eight printable customer document routes use the clean generated document stack from Step 7.2.
- Customer quote decisions remain server-authoritative through `customer_quote_action`.
- Personal Data continues to reuse the hardened Step 5 privacy export.
- The production Supabase project still has no deployed `send-document-email` Edge Function.
- `create-yoco-checkout` remains test-key based, GitHub-origin-bound and outside the certified direct-payment launch path; clean documents do not expose it.
- `volttech-dialog.js` is retained because admin pages still consume it.

## UI/code consistency
Step 7.2 hid dead Email Copy buttons because their backend does not exist. Step 7.3 removes that dead email import, button markup and click-handler code from the clean customer-record controller itself.

## Legacy deletion
The deletion list contains only document-specific legacy files whose converted routes no longer load them:
- `document.css`
- `document-phase4.css`
- `phase6-customer-provenance.css`
- `quote-decision.css`
- `document-print.js`
- `document-email.js`
- `quote.js`
- `invoice.js`
- `proforma.js`
- `receipt.js`
- `order-document.js`
- `build-document.js`
- `service-record.js`
- `personal-data.js`
- `build-origin-enhancer.js`
- `customer-origin-enhancer.js`
- `assets/js/services/document-email.js`

Generic admin/portal infrastructure is not deleted here.

## Release blockers carried forward
- production Store / Builder / direct payments remain gated;
- payment certification still requires production Yoco credentials, `.co.za` CORS/redirect alignment and launch-gate enforcement;
- PAIA manual + Information Officer registration/details remain compliance blockers;
- Supabase Auth leaked-password protection remains a dashboard release action;
- Twitch creator refresh credential repair remains outstanding.

## Step 7 close condition
After upload verification and deletion verification, Step 7 is complete and Step 8 becomes current.
