# Step 4.2 QA — Core service-page family

## Scope

Step 4.2 migrates the five local PC support routes to the clean generated frontend:

- PC Repair
- PC Performance
- PC Upgrades
- PC Security / Malware Removal
- Windows Installation

Streaming support remains outside this step because it belongs to the later creator/streaming ecosystem migration.

## Audit findings carried into the rebuild

The five legacy pages shared useful and internally consistent service content, but duplicated a large runtime/presentation stack:

- Google Fonts
- `analytics.js`
- `service-pages.css`
- `service-network.css`
- `service-malware.css` on Security
- `visual-system.css`
- `visual-block-fix.css`
- `phase9-business-finish.css`
- `mobile-nav.css`
- `volttech-experience.css`
- `volttech-experience.js`
- `conversion-context.js`
- per-page inline symptom JavaScript
- a second symptom/contact handoff layer

The new routes use the clean site shell, shared design tokens, one page controller and one contact/journey service.

## Preserved business truth

Pricing text remains aligned with the already-audited Signal Scan:

- Repair: R350–R650
- Performance: R350–R550
- Upgrades: compatibility advice free; hands-on work from R299
- Security: R350–R550
- Windows: R350–R650

The Upgrades page still explicitly states that VoltTech is not currently selling or sourcing components and that full custom builds are paused.

The Security page still links to Exposure Scan and does not claim that ordinary browser signals prove compromise or infection.

## Local-service positioning

The existing local language is preserved: Wonderboom, Pretoria North, Sinoville, Annlin, Montana and surrounding Pretoria suburbs. No public street address was introduced.

## Interaction contract

Each symptom button contains its own label and explanatory copy. The shared controller:

1. updates active state and accessible `aria-pressed`;
2. updates the visible symptom explanation;
3. updates WhatsApp/email text;
4. updates Signal Scan to include the page `source` and selected `issue`;
5. stores only journey context in session storage;
6. emits optional analytics events when production analytics are available.

No enquiry is sent until the customer chooses WhatsApp or email.

## Clean frontend checks

All five generated pages:

- contain the clean-shell marker;
- have one H1, one main, one clean header and one clean footer;
- reference `assets/css/pages/services.css`;
- reference `assets/js/pages/service.js`;
- contain no inline executable script;
- contain no inline style attribute;
- do not reference the legacy service/nav/Google-Fonts stack listed above;
- retain canonical and structured-data head fragments.

The Security `Unknown apps` legacy markup error is corrected.

## Automated regression result

`node scripts/test-clean-services.mjs`

PASS: clean five-page service family, SEO/pricing continuity, symptom handoff and current offer boundaries.

## Deferred to Step 4.3

- verify every Signal Scan → service → Signal Scan round trip after remote upload;
- inspect all five routes on phone;
- identify remaining consumers of retired service CSS/scripts across the whole repository;
- delete only assets proven unused;
- update the Step 4 closeout documentation and run final internal-link/residue checks.
