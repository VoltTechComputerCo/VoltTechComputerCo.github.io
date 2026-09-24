# Step 7.2 — Printable customer documents

Objective: migrate VoltTech's customer printable records to the clean generated frontend without changing RLS ownership, quote-decision authority or the meaning of commercial/service records.

Previous: Step 7.1 verified at `57a8e9f3eb61d4ee5e9d92e088e8a617b1a86de7`.
Current: Step 7.2 — packaged.
Next: Step 7.3 — document/support QA + cleanup.

Branch: `clean-rebuild`.
Rollback target: `57a8e9f3eb61d4ee5e9d92e088e8a617b1a86de7`.

## Upload
Upload everything inside `Step 7.2/` to matching repository paths.

Deletions: none.
Folder placeholders: none.
Supabase migrations: none.

## Clean document infrastructure
- `assets/css/pages/document.css`
- `assets/js/services/document-print.js`
- `assets/js/services/customer-documents.js`
- `assets/js/pages/customer-document.js`

## Routes
- `quote.html`
- `invoice.html`
- `proforma.html`
- `receipt.html`
- `order-document.html`
- `build-document.html`
- `service-record.html`
- `personal-data.html`

## Operational truth
The clean document pages intentionally do not show an email-copy action because there is no deployed `send-document-email` Edge Function in the production project. The existing clean Quotes / Builds / Documents listings also suppress those dead email-copy buttons in this package.

The clean invoice intentionally does not expose the old Yoco test checkout. The existing backend uses test credentials and GitHub-only CORS/redirect URLs and remains outside the production launch gate.

## Safe preview
Append `?inspect=1` on GitHack to inspect layout without loading a Supabase session or real customer data.
