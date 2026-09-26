#!/usr/bin/env python3
"""Normalize VoltTech public SEO URLs to Cloudflare Pages' extensionless contract.

Physical repository files remain .html. Relative/local navigation paths are left
alone. Absolute public URLs on the canonical .co.za origin become extensionless.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://volttechcomputerco.co.za"

ABS_HTML = re.compile(
    r"(https://volttechcomputerco\.co\.za/[^\"'<>\s?#]*)\.html(?=([?#\"'<>\s]|$))"
)

changed = []
errors = []

def write_if_changed(path: Path, content: str):
    old = path.read_text(encoding="utf-8")
    if old != content:
        path.write_text(content, encoding="utf-8")
        changed.append(str(path.relative_to(ROOT)))

def normalize_absolute_urls(text: str) -> str:
    text = text.replace(f"{ORIGIN}/index.html", f"{ORIGIN}/")
    return ABS_HTML.sub(r"\1", text)

def replace_exact(path: Path, old: str, new: str, label: str):
    text = path.read_text(encoding="utf-8")
    if old in text:
        write_if_changed(path, text.replace(old, new))
        return
    if new in text:
        # Already normalized manually or by an earlier safe step.
        return
    errors.append(f"{path.relative_to(ROOT)}: neither old nor normalized {label} pattern found")

# 1) Normalize absolute public URLs in ALL root HTML files.
for path in sorted(ROOT.glob("*.html")):
    write_if_changed(path, normalize_absolute_urls(path.read_text(encoding="utf-8")))

# 2) Normalize generated-page source fragments so rebuilds preserve the contract.
for path in sorted((ROOT / "src/pages").glob("*.head.html")):
    write_if_changed(path, normalize_absolute_urls(path.read_text(encoding="utf-8")))

for path in sorted((ROOT / "src/pages").glob("*.html")):
    write_if_changed(path, normalize_absolute_urls(path.read_text(encoding="utf-8")))

# 3) Existing sitemap and future STATIC template.
for rel in (
    "sitemap.xml",
    "docs/clean-rebuild/STATIC-ARTICLE-TEMPLATE.html",
):
    path = ROOT / rel
    write_if_changed(path, normalize_absolute_urls(path.read_text(encoding="utf-8")))

# 4) Future RSS fallback/channel URLs must be extensionless.
feed_builder = ROOT / "scripts/build-static-feed.py"
replace_exact(
    feed_builder,
    'return {"title":title,"url":p.canonical or BASE+path.name,',
    'return {"title":title,"url":p.canonical or BASE+path.stem,',
    "STATIC feed fallback URL",
)
replace_exact(
    feed_builder,
    'ET.SubElement(ch,"title").text="STATIC — Tech, Gaming & Nerd Culture";ET.SubElement(ch,"link").text=BASE+"static.html"',
    'ET.SubElement(ch,"title").text="STATIC — Tech, Gaming & Nerd Culture";ET.SubElement(ch,"link").text=BASE+"static"',
    "STATIC RSS channel URL",
)

# 5) Future STATIC sitemap entries must use public stem, not physical filename.
sitemap_workflow = ROOT / ".github/workflows/static-sitemap-autopilot.yml"
replace_exact(
    sitemap_workflow,
    "              url = BASE + page.name",
    "              url = BASE + page.stem",
    "STATIC sitemap public URL construction",
)

# 6) STATIC validator must validate extensionless public URLs.
validator = ROOT / "scripts/validate-static.py"
replace_exact(
    validator,
    "        html,p=parse(path); rel=path.name; expected=BASE+rel",
    "        html,p=parse(path); rel=path.name; expected=BASE+path.stem",
    "STATIC canonical expectation",
)
replace_exact(
    validator,
    '        expected={BASE+"static.html",*(BASE+p.name for p in articles)}',
    '        expected={BASE+"static",*(BASE+p.stem for p in articles)}',
    "STATIC sitemap expectation",
)

# 7) Existing STATIC QA must compare physical lead href to public RSS URL.
static_test = ROOT / "scripts/test-clean-static.mjs"
replace_exact(
    static_test,
    "assert(links[0].link.endsWith('/' + lead), 'STATIC lead must match the newest RSS item');",
    "const publicLead = lead.replace(/\\.html(?=([?#]|$))/, '');\nassert(links[0].link.endsWith('/' + publicLead), 'STATIC lead must match the newest RSS item');",
    "STATIC lead/RSS URL comparison",
)
replace_exact(
    static_test,
    "assert((sitemap.match(/static(?:-|\\.html)/g) || []).length >= 31, 'Sitemap must retain STATIC hub plus historical articles');",
    """const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\\/loc>/g)].map(m => m[1]);
assert(sitemapUrls.includes('https://volttechcomputerco.co.za/static'), 'Sitemap must contain extensionless STATIC hub URL');
assert(sitemapUrls.filter(url => url.includes('/static-')).length >= 30, 'Sitemap must retain historical STATIC articles');
assert(!sitemapUrls.some(url => /\\.html(?:$|[?#])/.test(url)), 'Sitemap public URLs must be extensionless');""",
    "STATIC sitemap QA",
)

# 8) Document the permanent publishing rule.
publishing = ROOT / "docs/clean-rebuild/STATIC-PUBLISHING.md"
text = publishing.read_text(encoding="utf-8")
marker = "Public canonical URLs are extensionless"
if marker not in text:
    text += (
        "\nPublic canonical URLs are extensionless even though the repository keeps "
        "physical `.html` files. Example: `static-example.html` is published/canonicalised "
        "as `https://volttechcomputerco.co.za/static-example`. Internal physical-file "
        "links may still use `.html`; Cloudflare redirects them to the canonical public URL.\n"
    )
    write_if_changed(publishing, text)

# Safety scan.
scan_paths = [
    *sorted(ROOT.glob("*.html")),
    *sorted((ROOT / "src/pages").glob("*.head.html")),
    *sorted((ROOT / "src/pages").glob("*.html")),
    ROOT / "sitemap.xml",
    ROOT / "docs/clean-rebuild/STATIC-ARTICLE-TEMPLATE.html",
]
for path in scan_paths:
    text = path.read_text(encoding="utf-8")
    if ABS_HTML.search(text) or f"{ORIGIN}/index.html" in text:
        errors.append(f"{path.relative_to(ROOT)}: absolute .html public URL remains")

if errors:
    print("URL NORMALIZATION FAILED")
    for err in errors:
        print("- " + err)
    sys.exit(1)

print(f"URL normalization prepared {len(set(changed))} changed source/contract file(s).")
for rel in sorted(set(changed)):
    print("- " + rel)
