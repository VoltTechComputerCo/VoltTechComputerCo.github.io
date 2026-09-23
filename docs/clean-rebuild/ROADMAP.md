# VoltTech master roadmap

Current major Step: **Step 5 — Customer accounts and operations (Step 5.3 packaged; upload verification pending)**. Next major Step: **Step 6 — Creator ecosystem and STATIC**.

| Step | Scope | Status / completion gate |
|---|---|---|
| 0 | Repository and system audit | Complete |
| 1 | Shared frontend foundation and homepage | Complete; clean shell established |
| 2 | Core commerce | Complete and verified at `70691bb5d3a390a185210bdd7c1d188f6f014546`; launch gates remain closed |
| 3 | PC Builder | Complete and verified at `add3637fa3872aace38d72f8a7497f4918b92933`; Builder remains launch-gated |
| 4 | Signal Scan and service pages | Complete and verified at `a8a76ddcc1b3c93fc9407e285e04c5e331f36cd5` |
| 5 | Customer accounts and operations | Active. 5.1 foundation verified, 5.2 records verified at `27acc00654a2b8e3f1c1eb47efd6f9b514723336`, 5.3 packaged |
| 6 | Creator ecosystem and STATIC | Next; creator freshness and editorial publishing continuity |
| 7 | Legal, support and customer documents | Pending; policies, customer documents and print layouts |
| 8 | SEO, accessibility and performance | Pending; canonical/domain migration, accessibility, performance and residue closure |
| 9 | Full QA | Pending; responsive, customer roles, payments, retries and regression |
| 10 | Release candidate | Pending; verified release package and operational readiness |

## Step 5 sequence

- **5.1 — Account foundation:** generated clean account shell, pinned session bootstrap, profile/address/security controls, overview and safe non-production inspection. Supabase migration `20260923210205_customer_address_atomic_v1` fixed atomic default-address switching.
- **5.2 — Customer records:** Activity, Saved Builds, Quotes and Documents moved onto the clean shell and shared records service. Verified at `27acc00654a2b8e3f1c1eb47efd6f9b514723336`.
- **5.3 — Privacy, notifications and operations QA:** Privacy & Data clean migration, customer-only clean notifications module, server-authoritative deletion fields, notification protected-field guard and SECURITY DEFINER classification. Supabase migration `20260923215631_customer_privacy_notifications_hardening_v1` is already deployed.

## Operational boundaries carried forward

- Store catalogue, Builder and direct payment launch gates remain disabled until their release blockers are certified.
- Supabase Auth leaked-password protection remains a release/dashboard action because the connected Supabase tool does not expose that setting.
- Authenticated-callable SECURITY DEFINER admin functions remain intentionally callable by the authenticated role because their definitions enforce `is_volttech_admin()` internally. Customer SECURITY DEFINER functions audited in Step 5 enforce `auth.uid()` ownership.
- Root legacy notification/portal assets remain only where unconverted admin/document/creator consumers still require them; broad residue deletion waits for the relevant later step.

## Every delivery

Re-inspect branch HEAD and dependencies, package exact repository paths with README/checksums/deletions/rollback details, use folder placeholders only when genuinely required, and verify the uploaded remote files before beginning the next substep.
