# Step 8.2 Correction

The Step 8.2 workflow reduced the hard accessibility checker to one remaining issue:

`account.html: image needs intrinsic width and height`

The affected image is the hidden customer avatar. Its CSS reserves a 3.5rem × 3.5rem square, so this correction adds:

`width="56" height="56"`

to `#accountAvatar`.

Upload only:

`src/pages/account.html`

to the matching path on `clean-rebuild`.

This path already exists. No folder placeholder is required.
No deletions.
No Supabase changes.

Because `src/pages/**` is watched by the clean frontend sync workflow, this upload should automatically regenerate `account.html`, rerun the hard accessibility checker, rerun the domain residue checker, and commit generated output if all checks pass.
