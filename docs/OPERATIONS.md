# VoltTech Website Operations

This document describes routine operating tasks for the current VoltTech 2.0 workflow.

## Publishing a website change

1. Work on `v2-rebuild`.
2. Prepare only the files required for the batch.
3. Preserve their exact repository paths.
4. Upload the replacement files manually from Android.
5. Verify the resulting commit through the connected GitHub reader.
6. Test affected links and pages.
7. Test on a mobile viewport first.
8. Test customer contact CTAs.
9. If auth/Supabase is involved, test signed-out and signed-in states.
10. Review SEO metadata for public pages.
11. Record meaningful changes in `CHANGELOG.md`.
12. Merge/deploy to `main` only after checks are complete.
13. Confirm the live GitHub Pages result.

Direct GitHub write/commit attempts from ChatGPT currently return integration permission errors, so the Android/manual-upload route remains the working edit path unless write access is explicitly re-tested successfully.

## Adding or changing a service

Before publishing:
- use plain customer-friendly language
- make the direct contact option obvious
- include realistic price guidance only when useful
- clearly state when diagnosis can change the final price
- link to relevant existing service pages
- maintain consistent structured data where applicable
- do not expose the private home address

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

The public Store must remain disabled unless `store_settings.catalogue_enabled = true`.

Before enabling or marking a product as commercially actionable:
- verify exact model/variant
- verify source/supplier
- verify cost
- verify retail price/margin
- verify stock state or clearly show availability must be confirmed
- verify warranty expectations
- verify product media rights/source
- verify shipping size/weight if used for courier rating
- complete an end-to-end checkout/request test

Mock supplier JSON is development data only.

## PC Builder operations

The public Builder must remain disabled unless `store_settings.builder_enabled = true`.

Before enabling it:
- confirm the component catalogue is sufficiently current
- verify compatibility logic with representative builds
- verify pricing/source assumptions
- verify Store/Builder handoff behaviour
- verify saved-build/account behaviour
- verify public navigation only advertises Builder when the launch flag is enabled

## STATIC publishing

Current repository flow:
1. Create/update the STATIC article.
2. Update `static.html` as required.
3. Update `static-feed.xml`.
4. On a push to `main` that changes `static-feed.xml`, GitHub Actions runs the STATIC Discord Publisher workflow.
5. The workflow publishes the newest RSS item to Discord using a GitHub repository secret.
6. The STATIC sitemap autopilot workflow maintains STATIC discovery/sitemap behaviour according to its workflow rules.

Never expose the Discord webhook in frontend code.

## Creator streamer refresh

Streamer refresh/data logic is represented by Supabase backend assets, including:
- `Supabase/functions/refresh-sa-streamers/`
- streamer-directory migrations
- scheduled-refresh migration/configuration

Do not describe this as a GitHub Actions updater unless a workflow is actually added later.

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
- confirm Store remains correctly gated unless intentionally enabled
- confirm Builder remains correctly gated unless intentionally enabled
- review Supabase security advisors
- review Supabase performance advisors
- verify sitemap
- review Search Console for indexing/errors
- review Analytics for broken/zero-traffic critical pages
- test STATIC RSS/Discord automation
- test STATIC sitemap automation
- check Store data for stale prices or availability statements before any future enablement
- review broken links
- review service-worker compatibility rules for shims that are no longer needed
