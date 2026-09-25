# Step 8.3 QA

Parent branch head: `7d21bd710fb8cb1cefa9a35e900589ab87fb9281`.

The 30 historical STATIC articles are migrated without rewriting editorial copy or flattening their designs.

The migration extracts each article's style block into `assets/css/static-legacy/<slug>.css`. Seven inline style attributes across two articles are converted to `data-static-inline` selectors in the corresponding extracted CSS.

Every article receives `.co.za` canonical/OG identity, local fonts, complete social metadata, valid NewsArticle JSON-LD and a machine-readable publication time derived from existing article metadata/visible dates/git history.

Delete root `correction-manifest.json`.
This package restores the real project README over the temporary Step 8.2 correction note.

No Store, Builder, payment, Supabase or customer-data state changes are included.
