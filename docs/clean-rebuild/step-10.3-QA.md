# Step 10.3 — Controlled promotion to main

Step 10.2 passed:

- local merge from reviewed `main` succeeded;
- all 8 reviewed main-only paths were normalized to the certified clean state;
- promotion rehearsal tree was identical to `clean-rebuild`;
- Full QA: 24/24;
- Release source: 15/15;
- Device + Role: 9/9;
- Release browser: 11/11;
- nothing was pushed to `main`.

Step 10.3 is the **live repository promotion**.

## Important

Uploading `scripts/run-step-10.3.mjs` last triggers a workflow that is authorized to push to `main`.

The workflow does not push immediately. Before the push it:

1. Confirms `main` is still exactly `12079c9d873cc1601581354829193a322f81d874`.
2. Builds a fresh merge from current `clean-rebuild`.
3. Allows only the eight reviewed legacy divergence paths.
4. Normalizes all eight reviewed paths to the current clean branch.
5. Requires the promotion Git tree to equal the current clean branch tree exactly.
6. Checks generated frontend consistency.
7. Runs Full QA (24/24 target).
8. Runs the complete non-commerce release certification (15/15 + 9/9 + 11/11 target).
9. Fetches `main` again immediately before pushing and aborts if it moved.
10. Pushes the certified merge commit to `main` without force.
11. Re-fetches `main` and verifies the remote SHA equals the promoted SHA.

Store, Builder and direct payments remain disabled. This step promotes the website rebuild; it does not launch ecommerce.

After a successful Step 10.3 push, Step 10.4 verifies the live `.co.za` deployment before the release is considered closed.
