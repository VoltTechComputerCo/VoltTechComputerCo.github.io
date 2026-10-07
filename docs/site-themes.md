# Site appearance

White is the default across all public, account, operational, Builder and STATIC pages. The header toggle stores an explicit light/dark preference in volttech-appearance. Initial HTML applies that preference before styles load. Blocked local storage still permits toggling for the current page. Same-origin embedded tools follow the parent appearance. Dark mode retains the original source styles; colour-only *.light.css variants adapt surfaces and text without changing layout or backend behavior. Product imagery stays on white in both modes.

Regenerate colour adaptations with node scripts/build-light-styles.mjs after editing original styles. Generate clean-shell pages with python scripts/build-clean-frontend.py. The shared site-theme.css provides curated accessible colours and controls. GitHub theme appearance QA checks white default, dark preference, mobile widths, persistent headers and captures screenshots without invoking accounts, emails or payments.
