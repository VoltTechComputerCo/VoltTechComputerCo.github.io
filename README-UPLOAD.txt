VOLTTECH V3 — CACHE-SAFE HOMEPAGE FIX

Problem fixed:
The homepage HTML and cached external stylesheet were from different V3 class systems.
That caused the near-unformatted vertical page shown in the screenshot.

This version embeds the exact matching homepage CSS and JS directly into index.html.
For the prototype homepage, RawGitHack/browser CSS caching can no longer mismatch it.

Upload to v3-prototype:

1. /index.html
   Replace the current root index.html.

2. /assets/v3/hero/reference-rig.webp
   Keep/replace the existing copy at this exact path.

You do NOT need to replace v3-prototype.css or v3-prototype.js for this fix.
Other pages may still use those files; leaving them untouched protects the rest of the prototype.

Preview:
https://raw.githack.com/VoltTechComputerCo/VoltTechComputerCo.github.io/v3-prototype/index.html?rev=cache-safe-v8
