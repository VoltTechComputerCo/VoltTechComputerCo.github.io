# Step 2.3 — Commerce QA and cleanup

Objective: close the clean-rebuild commerce frontend after verifying the real Step 2.2 upload/deletions, re-auditing Store → Product → Cart → Checkout → Order Status, fixing the one frontend state inconsistency found, and recording the remaining backend release gates without enabling commerce.

Parent Step: Step 2 — Core commerce.
Previous Step: Step 2.2 — Checkout and private order tracking; upload hashes verified and all 16 requested legacy deletions confirmed absent.
Current: Step 2.3 — Packaged; upload verification pending.
Next major Step: Step 3 — PC Builder.

Branch: `clean-rebuild`. Exact parent / rollback commit: `fd0a981dee1c3ddb2e4f1342dbf61858dc49cafe`. No v3-prototype code used.

## Upload instructions

1. Extract **Step-2.3.zip** and stay on **clean-rebuild**.
2. Upload the contents inside **Step 2.3/** at their matching repository paths; replace existing files where prompted. Do not upload the enclosing Step folder as a website directory.
3. **No files need to be deleted in this step.** The 16 Step 2.2 cleanup deletions are already verified complete.
4. **No new folders or placeholder paths are required.** All target directories already exist.
5. Tell me when uploaded. I will verify the new HEAD and every delivered file against the manifest before starting Step 3.

6 delivered files: 4 changed, 2 added. No deletions.

## Page changed

- [Order tracking](https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/order-status.html)

The public/private-link entry layout is intentionally unchanged. The runtime change only affects refunded and partially refunded order timelines, which cannot be demonstrated safely with a fabricated production customer link on GitHack.

## Files changed

- `README.md`
- `assets/js/components/order-view.js`
- `docs/clean-rebuild/ROADMAP.md`
- `scripts/test-clean-transactions.mjs`

## Files added

- `docs/clean-rebuild/step-2.3-QA.md`
- `docs/clean-rebuild/step-2.3-manifest.json`

## Files deleted

None.

## Runtime change

Refunded and partially refunded orders now keep the **Payment received** timeline milestone marked as recorded. The existing refund headline remains unchanged. No payment, refund, total, delivery, cart or backend behaviour is modified.

A regression assertion covers both refund states in `scripts/test-clean-transactions.mjs`.

## QA position

- Step 2.2 uploaded files and exact cleanup were independently reverified against the actual branch.
- Active commerce source was re-read from current `clean-rebuild`.
- The modified transaction contract suite passes, including the new refund timeline assertions.
- Live Supabase state was checked read-only: Store, Builder and direct payments remain off; all 15 catalogue rows remain demo data; there are zero real public products, Store requests and Store payments at audit time.
- No live transaction was submitted and no Supabase mutation occurred.

Full findings and release blockers: `docs/clean-rebuild/step-2.3-QA.md`.

## Backend / launch boundary

Step 2 frontend completion does not mean Store launch readiness. The backend still needs coordinated `.co.za` transaction-origin/Yoco return alignment, server-side demo/stock enforcement, checkout idempotency, server-side direct-payment flag enforcement, safe pending-payment reuse, delivery-selection enforcement and live Yoco/Bob Go/webhook certification before commerce is opened.

Current broader Supabase security/performance advisor findings are recorded for the later account/admin/security pass; this package does not silently modify grants, RLS or production configuration.

## Tests

The Step 2.3 transaction contract test passes locally for:

- cart shape and quantity limits;
- demo/stock exclusion;
- private access token validation;
- same-origin status destinations;
- Yoco redirect allowlisting;
- production-only ZAR delivery-rate selection;
- strict payment eligibility;
- paid/delivered/refund state derivation;
- refunded and partially refunded payment timeline completion;
- escaped order-item output;
- definitive 4xx versus ambiguous 5xx/network checkout failures.

Existing Step 2.2 responsive/browser evidence remains unchanged because this package makes no HTML/CSS/layout change.

## Rollback

**Rollback target: `fd0a981dee1c3ddb2e4f1342dbf61858dc49cafe`.**

Restore the four changed paths from that commit and remove the two added Step 2.3 documentation files. No backend rollback is required because this delivery makes no backend change.

## Next

After upload/hash verification, Step 2 is closed and work moves to **Step 3 — PC Builder**. The Builder will be re-audited from the actual branch before any visual or functional migration so its compatibility engines, saved-build behaviour, account handoff and fail-closed launch gate are preserved.
