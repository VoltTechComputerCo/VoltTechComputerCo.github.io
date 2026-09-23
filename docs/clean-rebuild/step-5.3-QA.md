# Step 5.3 QA — Customer privacy, notifications and operations

## Verified base

Step 5.2 remote package verified 29/29 files at `27acc00654a2b8e3f1c1eb47efd6f9b514723336`; both accidental Python cache files are absent.

## Supabase changes already deployed

Migration: `20260923215631_customer_privacy_notifications_hardening_v1`.

- Account deletion write guard now runs BEFORE INSERT OR UPDATE.
- Customer INSERT/re-request timestamps and recovery window are generated server-side.
- Customers may cancel a requested deletion or re-request after cancellation; processing/completed/admin fields remain protected.
- Customer notification updates may not change recipient/content/action/priority/metadata/delivery timestamps.
- Existing state remained 0 deletion requests and 19 notifications after migration.

## SECURITY DEFINER audit

The Supabase adviser reports authenticated-callable SECURITY DEFINER functions. A definition scan confirmed the audited `admin_*`/admin-facing functions contain `is_volttech_admin()` checks and customer-facing functions contain ownership checks via `auth.uid()` where applicable. The warning is retained/documented rather than resolved by revoking the role required by legitimate signed-in admin/customer RPC calls.

Outstanding release action: enable Supabase Auth leaked-password protection from an auth settings surface that exposes that control. It is not available through the connected Supabase tool.

## Frontend

- `privacy-center.html` is generated, noindex and uses the clean shell.
- GitHack `?inspect=1` loads no account client or personal data.
- Customer notifications on converted pages use a clean module and do not register the legacy service worker.
- Root `notifications.js` / `notifications.css` remain for admin and other unconverted consumers.
- Old `privacy-center.css` and `privacy-center.js` are the only deletions in this step.

## Regression

`node scripts/test-clean-customer-ops.mjs` passes.
