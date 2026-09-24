# Step 9.1 QA

Step 9.1 is the automated full-regression gate for the completed clean rebuild through Step 8.3.

It is intentionally read-only and makes no customer-facing design, commerce, payment, Supabase or content changes.

The runner executes every existing clean-rebuild contract suite plus the current Python source/domain/SEO/STATIC validators. It then runs a repo-wide built/public HTML scan for local target integrity, path escape attempts, legacy `.github.io` canonical/OG identity and remote Google Fonts residue.

The workflow stores its evidence in the `volttech-step-9.1-qa` GitHub Actions artifact. A failing gate must be corrected before Step 9.2 begins.

Manual/visual responsive interaction testing is deliberately reserved for Step 9.2; launch blockers and failure-mode certification remain Step 9.3/Step 10 work.
