# Clean rebuild architecture — Step 1.1

Authoritative branch: `clean-rebuild`. Parent: `a7b182af9557a4c22ce79250a8f71c6824a50cb3`, confirmed against both remote `clean-rebuild` and `v2-rebuild` immediately before this Step. No v3-prototype files were used.

## Implemented boundary

`src/templates/page.html`, `header.html` and `footer.html` own the new shared shell. `src/pages/*.json` supplies metadata and output paths; adjacent HTML supplies content. `scripts/build-clean-frontend.py` emits complete ready-to-upload HTML. No JavaScript is required to see content or navigation. Relative asset and navigation paths support commit-pinned GitHack subpaths and future nested output paths.

Only `design-system.html` uses this foundation so far. Existing customer routes retain their working audited implementation until migrated. Historical V2 documents describe those routes, not the new design or target branch. The legacy V2 finaliser workflow must not be dispatched for this rebuild; its retirement is scheduled with the homepage source migration.

## Ownership

| Source | Responsibility |
|---|---|
| `assets/css/tokens.css` | All shared colour, font, spacing, border and sizing tokens |
| `base.css` | Font loading, reset, typography, focus and reduced motion |
| `layout.css` | Containers, grids, spacing and footer |
| `navigation.css` | Shared header/navigation and preview notice |
| `components.css` | Buttons, cards, tags, notices, panels, dialogs and disclosure |
| `forms.css` | Fields, help, errors and feedback |
| `responsive.css` | Shared mobile/tablet transformations |
| `print.css` | Foundation print treatment; customer documents migrate separately |
| `pages/design-system.css` | Inspection-page composition only |
| `assets/js/site-shell.js` | Calls navigation enhancement; no HTML injection |
| `assets/js/navigation.js` | Mobile disclosure, Escape and responsive focus handling |
| `assets/js/components/dialog.js` | Native dialog enhancement with unsupported-browser fallback |
| `assets/js/pages/design-system.js` | Local example form and dialog setup |

CSS loads in the listed order, then the page composition stylesheet. Avoid override files. Edit shared tokens/components for global changes. Regenerate HTML after editing templates or page sources; never maintain generated HTML independently.

## Runtime adaptation

The root `<html data-vt-shell="clean">` marker is the deliberate service-worker boundary. `sw.js` reads a clone of a successful HTML response. Marked documents are returned unchanged before legacy version rewriting or notification injection. Unmarked documents retain the existing behaviour. Tests cover clean documents, legacy rewriting, existing loaders, failed/non-HTML responses, cross-origin and non-navigation requests.

This marker is currently for the inspection route, which needs no account/commerce/notification integration. It must NOT be added to a migrated business route until that route explicitly includes all necessary adapters. The subsequent homepage Step will separate analytics, launch access, app registration and notifications from their old visual injection responsibilities as those consumers migrate. This sequencing avoids leaving broken dependencies on unconverted routes.

No Supabase client, launch flags, account state, storage keys, cart events, payment functions, diagnostic logic or Builder engine is changed. Navigation goes to existing routes and therefore retains their access gates. No forms transmit data on the inspection page. Header Account is a link, not a representation of login state. Cart/account counters and search are deliberately deferred until connected to their actual contracts.

## Assets and fonts

The official existing logo and five existing hardware images are referenced in their current repository locations. No duplicate images, fabricated product images or new imagery were created. Root asset organisation will move atomically with all consumers when page families migrate.

Fonts are self-hosted official Google Fonts Latin variable WOFF2 files, downloaded 21 September 2026. No runtime third-party font requests. Both SIL Open Font License texts are included beside the font files.

- Space Grotesk: `https://fonts.gstatic.com/s/spacegrotesk/v22/V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.woff2`
- JetBrains Mono: `https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwg.woff2`
- Licences: `https://github.com/google/fonts/tree/main/ofl/spacegrotesk` and `https://github.com/google/fonts/tree/main/ofl/jetbrainsmono`.

The served Latin subsets support this English inspection page. Broader localisation may need additional subsets. Font binary sizes: 22,288 and 31,432 bytes respectively.

## Preview and verification

GitHack visual preview is user-approved. Deliver the branch URL before manual upload, explicitly labelled as available afterwards. After upload, retrieve remote HEAD, compare delivery hashes and imports, then supply the actual commit-pinned URL for changed pages only. Never pretend a new SHA or pre-upload URL has rendered the delivered files.

This is visual preview, not an auth/payment staging environment. Existing routes reached from the shell still have their baseline behaviour. Production sign-in, checkout and account mutations are outside the inspection-page test. Existing installed production service workers may need an update/navigation cycle before they use the new boundary; cached production transitions remain Step 1.3 QA. GitHack does not inherit the production site's service worker.

Device rendering and native dialog focus need manual browser verification after upload. Local source/behaviour checks do not certify pixel matching or accessibility compliance.
