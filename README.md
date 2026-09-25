# VoltTech clean rebuild

Current phase: **Step 10.4 — live `.co.za` verification**.

The certified clean rebuild has been promoted to production `main`.

Promoted main:
`3eba58456b4a93477f90b1d1fb9673877e0a3479`

GitHub Pages deployment for that SHA completed successfully.

## Upload

Upload everything inside `Step 10.4/` to matching paths on `clean-rebuild`.

Do **not** upload this package to `main`.

Delete nothing.

No folder placeholders are required.

Upload `.github/workflows/live-verification.yml` before the script.

Upload the documentation next.

Upload `scripts/run-step-10.4.mjs` **LAST**.

That triggers `VoltTech Step 10.4 Live Verification`.

The workflow makes no repository or backend changes. It only fetches the public production website and records pass/fail evidence.

After an automated PASS, perform the final phone visual inspection on the real `.co.za` pages.

Store, Builder and direct payments remain disabled.
