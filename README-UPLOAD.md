# VoltTech V3 Homepage Master

Upload these three files to the **root of the `v3-prototype` branch** and replace the existing versions:

- `index.html`
- `v3-prototype.css`
- `v3-prototype.js`

You can leave `v3-category-fix.css` in the repository, but the new homepage no longer loads it. The new category image paths are defined directly in the homepage markup, which avoids the old CSS-background confusion.

This homepage intentionally preserves the existing working routes:
- Store -> `store.html`
- Builder -> `builder/index.html`
- Signal Scan -> `signal-scan.html`
- Account -> `account.html`
- Services -> existing service pages
- Creator Hub -> `creator-hub-south-africa.html`
- STATIC -> `static.html`

No Supabase, commerce, Builder, Signal Scan, account, analytics or service JavaScript has been replaced.

Preview after upload:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/v3-prototype/index.html

If RawGitHack is stale, append a cache-buster such as:
?rev=homepage-master-v4
