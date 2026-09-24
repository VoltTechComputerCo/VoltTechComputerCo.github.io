# Step 7.3 — Document/support QA + legacy cleanup

Objective: close Step 7 by making the clean customer record actions consistent with deployed backends and removing the proven-unused legacy document stack.

Previous: Step 7.2 verified at `b474112941cff9a4455d719f6e6087b1e57feb6a`.
Current: Step 7.3 — packaged.
Next after verification: Step 8 — SEO, accessibility and performance.

Branch: `clean-rebuild`.
Rollback target: `b474112941cff9a4455d719f6e6087b1e57feb6a`.

## Upload
Upload everything inside `Step 7.3/` to matching repository paths.

Then delete exactly:
```text
document.css
document-phase4.css
phase6-customer-provenance.css
quote-decision.css
document-print.js
document-email.js
quote.js
invoice.js
proforma.js
receipt.js
order-document.js
build-document.js
service-record.js
personal-data.js
build-origin-enhancer.js
customer-origin-enhancer.js
assets/js/services/document-email.js
```

No folder placeholders are required.
No Supabase migration or customer-data mutation is part of this package.

## What changes
- Quotes / Builds / Documents clean record cards no longer contain dead Email Copy buttons or document-email event code.
- Legacy document CSS, old per-document controllers, old print/email helpers and old origin-enhancer scripts are retired.
- `volttech-dialog.js` is intentionally retained because admin pages still use it.

## Operational truth
`send-document-email` is not deployed in Supabase, so email-copy actions stay unavailable.
The old Yoco invoice checkout remains test-only and is not exposed from the clean customer documents.
