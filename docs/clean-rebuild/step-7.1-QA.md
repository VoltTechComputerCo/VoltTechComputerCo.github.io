# Step 7.1 QA — public legal/support foundation

Parent verified commit: `7d1c272beb3766ceca6d03cfacfa280c9446b762`.

## Scope
Clean generated migration of Legal Centre, Quote Terms, Service & Sale Terms, Privacy Notice, PAIA information, Returns & Warranty, Delivery & Collection and Repair Authorisation.

## Legal-content verification boundary
Official South African sources were checked before migration:
- South African Government — Consumer Protection Act 68 of 2008 and current public guidance on the six-month implied warranty.
- Information Regulator South Africa — PAIA manual service and Information Officer registration guidance.
- Electronic Communications and Transactions Act remains part of the future ecommerce compliance boundary.

This package is not a legal opinion and does not mark ecommerce compliant for release.

## Release blockers retained
- Production Store / Builder / direct payments remain launch-gated.
- Complete and publish the applicable private-body PAIA manual before compliance sign-off.
- Complete/publish required Information Officer registration/details before compliance sign-off.
- Final ecommerce supplier/service-address and canonical/domain disclosures are deferred to the coordinated release/SEO compliance pass.

## Regression checks
- all eight generated pages use the clean shell;
- one H1/main/site-header/site-footer per route;
- no Google Fonts or legacy root `legal.css` reference;
- all routes remain `noindex, follow`;
- current github.io canonical base remains intentionally unchanged until Step 8;
- privacy self-service continues to link to `privacy-center.html`;
- production ecommerce remains explicitly described as disabled;
- consumer-rights wording remains non-waiver/cautious rather than inventing blanket policies.

## Deletion
`legal.css` is superseded by `assets/css/pages/legal.css`.
