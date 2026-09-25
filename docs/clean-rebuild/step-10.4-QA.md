# Step 10.4 production fix

First live smoke test: **15/17**.

- STATIC failure was a verifier mistake: the editorial hub intentionally does not use the generated clean-shell marker.
- Missing-route failure was real: no `404.html` existed, so production returned a soft 200 for missing URLs.

This fix adds a generated, branded, `noindex, nofollow` 404 page, corrects the STATIC live contract, re-runs the entire release certification, promotes only if `main` is still the expected SHA and the promotion tree equals `clean-rebuild`, then polls the real `.co.za` site until the custom 404 is live.

Target: **17/17 live checks**. Store, Builder and direct payments remain disabled.
