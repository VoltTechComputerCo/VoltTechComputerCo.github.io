# Security

Security is a release requirement, not a polish item.

## Critical rules

### Never expose secrets
Public repository/frontend code may contain only credentials explicitly designed for client-side use, such as a Supabase publishable key.

Never expose:
- Supabase service-role or secret keys
- database credentials
- payment-provider secrets
- courier/shipping API secrets
- Discord webhook URLs
- email-provider secrets

Use protected backend configuration or GitHub repository secrets as appropriate.

### Keep RLS
Do not disable Row Level Security to solve an application bug.

Customer tables must enforce ownership/authorization at the database layer.

### Do not trust client-side admin UI
Hiding an admin button is not authorization.

Admin authorization must be enforced by Supabase policies/functions/backend checks.

### Customer isolation
A signed-in customer must never be able to read or mutate another customer's:
- profile
- address
- quote
- invoice
- payment
- saved build
- service job
- Store request/order
- private notification/document

## Baseline security findings — 17 September 2026

Supabase Security Advisor currently reports:

### 1. Admin table policy
`public.admin_users` has RLS enabled but no policy.

Review whether this is intentionally inaccessible directly and whether all admin checks use a safe database function. Document the final intended model.

### 2. SECURITY DEFINER executable permissions
Supabase warns that a number of `SECURITY DEFINER` RPC functions can be executed by the general `authenticated` role.

This includes admin-oriented quote, invoice, customer and Store functions.

Required review:
- inspect every flagged function body
- verify the function independently proves the caller is an authorised VoltTech admin
- revoke `EXECUTE` from roles that do not need it where appropriate
- consider moving privileged RPCs out of exposed API schemas where appropriate
- rerun the advisor after changes

This should be resolved before enabling high-trust commerce operations.

### 3. Leaked-password protection
Supabase reports leaked-password protection disabled.

Review and enable if supported/appropriate for the project's Auth configuration.

## Frontend security

- escape/sanitise untrusted content before rendering HTML
- avoid storing sensitive business information in `localStorage`
- do not log tokens or private records to analytics
- validate important values server/database-side
- do not trust cart totals or prices sent from a browser as authoritative
- re-check current product price/stock before payment
- use HTTPS-only external endpoints

## Commerce

The browser must not be authoritative for:
- product cost
- final sale price
- stock quantity
- delivery price
- order payment status
- refunds
- admin confirmation

## GitHub Actions

Secrets referenced in Actions workflows must remain in GitHub Secrets.

Never replace `${{ secrets.X }}` with a literal secret in workflow YAML.

## Private business location

The owner's private residential address is sensitive business/personal information.

Do not publish it in:
- source code
- structured data
- screenshots
- contact pages
- customer-facing documentation
- public repo docs

Use service areas instead.
