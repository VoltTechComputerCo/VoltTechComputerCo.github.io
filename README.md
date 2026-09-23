# Step 5.3 — Privacy, Notifications and Customer Operations QA

Objective: close the customer-account migration by moving Privacy & Data onto the clean VoltTech frontend, replacing clean-page notification bootstrap with a customer-only module, hardening deletion/notification write integrity, and recording the Supabase security-advisor boundary.

Previous: Step 5.2 verified at `27acc00654a2b8e3f1c1eb47efd6f9b514723336`.
Current: Step 5.3 — packaged; upload verification pending.
Next: Step 6 — Creator ecosystem and STATIC.

Branch: `clean-rebuild`. Rollback target before this repository delivery: `27acc00654a2b8e3f1c1eb47efd6f9b514723336`.

## Upload

1. Extract `Step-5.3.zip` and stay on `clean-rebuild`.
2. Upload everything inside `Step 5.3/` to matching repository paths.
3. Delete exactly:

```text
privacy-center.css
privacy-center.js
```

4. No folder placeholders are required.
5. **Do not run the SQL manually.** Supabase migration `20260923215631_customer_privacy_notifications_hardening_v1` is already deployed and verified. The SQL file records the live schema state.
6. Inspect `privacy-center.html?inspect=1` on mobile. Inspection mode loads no session, customer data or executable privacy actions.

## What changes

- Converts Privacy & Data to the generated clean shell.
- Keeps profile correction, printable-data report, JSON export and seven-day deletion recovery workflow.
- Expands the JSON export to include customer-visible payments, quote decisions/events, document snapshots, notifications and email-delivery records where RLS allows them.
- Makes deletion timestamps/status/admin fields server-authoritative on INSERT as well as UPDATE and supports a safe cancelled → requested re-request.
- Adds a notification write guard so customers can change read/archive state but not notification content, routing, priority or delivery metadata.
- Replaces root `notifications.js` on converted customer pages with `assets/js/services/customer-notifications.js`; legacy root notifications remain for unconverted admin/legacy consumers.
- Keeps same-origin notification navigation, realtime refresh, read state, mark-all-read and optional notification sound.
- Does not change any customer row during packaging. At migration verification there were 0 deletion requests and 19 notification rows before and after.

## Security-advisor boundary

All audited authenticated-callable admin SECURITY DEFINER functions contain `is_volttech_admin()` checks. Customer SECURITY DEFINER functions audited here contain `auth.uid()` ownership checks. Those warnings therefore remain accepted architecture until a future API-role redesign; revoking `authenticated` globally would break legitimate admin/customer RPC calls.

Supabase Auth leaked-password protection remains disabled. There is no auth-settings mutation tool available in this environment, so enabling it is an explicit release/dashboard action, not falsely marked complete here.

## Inspect

Privacy & Data:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/privacy-center.html?inspect=1

## Tests

```text
node --check assets/js/pages/privacy-center.js
node --check assets/js/services/privacy-data.js
node --check assets/js/services/customer-notifications.js
node scripts/test-clean-customer-ops.mjs
python scripts/build-clean-frontend.py --check
```
