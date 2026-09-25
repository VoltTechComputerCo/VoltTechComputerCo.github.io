# STATIC publishing contract

Every STATIC article uses the canonical `https://volttechcomputerco.co.za/` identity.

Article requirements:
- exactly one title and H1;
- useful description;
- index/follow with large image preview;
- `.co.za` canonical and Open Graph URL;
- complete social metadata;
- `article:published_time`;
- valid article JSON-LD;
- local fonts only;
- no inline style blocks or style attributes;
- a link back to `static.html`.

New articles use `assets/css/pages/static-article.css`.

The 30 historical articles preserve their original visual design through one extracted stylesheet each under `assets/css/static-legacy/`.

RSS, sitemap, publishing guard and Discord automation all use `.co.za`.

Public canonical URLs are extensionless even though the repository keeps physical `.html` files. Example: `static-example.html` is published/canonicalised as `https://volttechcomputerco.co.za/static-example`. Internal physical-file links may still use `.html`; Cloudflare redirects them to the canonical public URL.
