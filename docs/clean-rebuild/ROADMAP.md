# Current development baseline

Repository audit baseline: 30 September 2026.

`clean-rebuild` is the authoritative integration branch for ongoing site work. Production remains on `main` and is not changed by repository-cleanup work unless a separate production promotion is explicitly performed.

## Current priorities

1. Keep the source-generated frontend and committed outputs in sync.
2. Preserve working Supabase, customer, admin, commerce and STATIC contracts.
3. Use `node scripts/run-full-qa.mjs` as the regression gate before promotion.
4. Treat commerce launch blockers in `RELEASE-BLOCKERS.md` as release requirements, not frontend styling tasks.
5. Migrate the retained legacy admin family only as an atomic, tested workstream.

Completed historical step-by-step migration packages were removed from the active branch during the repository audit. Git history and the pre-audit rollback branch remain the recovery record.
