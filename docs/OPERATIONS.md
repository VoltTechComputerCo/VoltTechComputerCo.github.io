# VoltTech Website Operations

This document describes routine operating tasks. It should be expanded as VoltTech 2.0 work standardises each workflow.

## Publishing a website change

1. Work on the designated development branch where practical.
2. Verify affected links and pages.
3. Test on a mobile viewport first.
4. Test customer contact CTAs.
5. If auth/Supabase is involved, test signed-out and signed-in states.
6. Review SEO metadata for public pages.
7. Merge/deploy to `main` only after checks are complete.
8. Confirm the live GitHub Pages result.
9. Record meaningful changes in `CHANGELOG.md`.

## Adding or changing a service

Before publishing:
- use plain customer-friendly language
- make the direct contact option obvious
- include realistic price guidance only when useful
- clearly state when diagnosis can change the final price
- link to relevant existing service pages
- maintain consistent structured data where applicable
- do not expose the home address

## Handling an enquiry

The website should support the business process rather than replace a human conversation.

Recommended flow:

```text
Visitor
  -> WhatsApp / call / email / enquiry
  -> human conversation
  -> diagnosis / job scoping
  -> quote where needed
  -> acceptance
  -> service work
  -> invoice/payment
  -> service/customer history
```

Optional tools may provide context before contact.

## Store product operations

Before marking a product as commercially actionable:
- verify exact model/variant
- verify source/supplier
- verify cost
- verify retail price/margin
- verify stock state or clearly show "availability to be confirmed"
- verify warranty expectations
- verify product media rights/source
- verify shipping size/weight if used for courier rating

Mock supplier JSON is development data only.

## STATIC publishing

Current repository flow:
1. Create/update the STATIC article.
2. Update `static.html` as required.
3. Update `static-feed.xml`.
4. On a push to `main` that changes `static-feed.xml`, GitHub Actions runs the STATIC Discord Publisher workflow.
5. The workflow publishes the newest RSS item to Discord using a GitHub repository secret.

Never expose the Discord webhook in frontend code.

## Updating contact details

Search the repository for:
- telephone values
- `wa.me` links
- email addresses
- JSON-LD contact details

Update all relevant occurrences and test every channel.

## Updating public business location wording

Use service-area language.

Do not add the private residential street address to:
- HTML
- structured data
- footer
- public contact page
- sitemap
- images/screenshots
- repository documentation intended for public access

## Monthly maintenance checklist

- test homepage/contact CTAs
- test core service pages
- test account login
- review Supabase security advisors
- review Supabase performance advisors
- verify sitemap
- review Search Console for indexing/errors
- review Analytics for broken/zero-traffic critical pages
- test STATIC RSS/Discord automation
- check Store for stale prices or availability statements
- review broken links
