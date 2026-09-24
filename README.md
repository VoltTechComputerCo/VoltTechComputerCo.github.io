# Step 7.1 — Public legal/support foundation

Objective: migrate VoltTech's public legal/customer-information family onto the clean generated frontend while preserving cautious South African consumer-rights wording and making outstanding PAIA compliance work explicit.

Previous: Step 6 completely verified at `7d1c272beb3766ceca6d03cfacfa280c9446b762`.
Current: Step 7.1 — packaged.
Next: Step 7.2 — printable customer documents.

Branch: `clean-rebuild`.
Rollback target: `7d1c272beb3766ceca6d03cfacfa280c9446b762`.

## Upload
Upload everything inside `Step 7.1/` to matching repository paths.

Then delete exactly:
```text
legal.css
```

No folder placeholders are required.
No Supabase migration or customer-data mutation is part of this package.

## Pages
- `legal.html`
- `quote-terms.html`
- `terms.html`
- `privacy.html`
- `paia.html`
- `returns-warranty.html`
- `delivery-collection.html`
- `repair-authorisation.html`

`privacy-policy.html` remains the compatibility redirect to `privacy.html`.

## Compliance boundary
The package does not claim VoltTech is ready for production ecommerce. The PAIA page now states clearly that the website page is not the required private-body PAIA manual and that the manual plus Information Officer registration/details remain release blockers.

## Inspect
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/legal.html
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/paia.html
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/clean-rebuild/returns-warranty.html
