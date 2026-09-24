#!/usr/bin/env python3
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://volttechcomputerco.github.io/"
LEGACY_ARTICLES = {
    "static-amd-ryzen-5-5500f-7500-budget-cpus.html",
    "static-apple-iphone-duo-first-foldable.html",
    "static-building-a-pc-2026.html",
    "static-dlss-5-nba-2k27-neural-rendering.html",
    "static-driver-crashes.html",
    "static-gpu-price-history.html",
    "static-lan-culture.html",
    "static-lego-playstation-1911-piece.html",
    "static-ltt-best-pc-2026.html",
    "static-malware-disguises.html",
    "static-metroid-ravenous-switch-2.html",
    "static-nopixel-v-rockstar-gta-rp.html",
    "static-nvidia-hugging-face.html",
    "static-pc-throttling.html",
    "static-physint-xbox-publishing.html",
    "static-ram-myth.html",
    "static-rpcs3-direct-disc-playback.html",
    "static-sa-varsity-esports-pretoria-2026.html",
    "static-scalebound-kamiya.html",
    "static-silent-pc-build.html",
    "static-south-african-counter-strike-vs-gaming-masters-2026.html",
    "static-ssd-vs-hdd-2026.html",
    "static-starcraft-open-world-shooter-2030.html",
    "static-tim-sweeney-hardware-crisis.html",
    "static-valheim-1-0-deep-north-launch.html",
    "static-white-house-tetris.html",
    "static-windows-vs-linux-gaming.html",
    "static-xbox-cloud-gaming-hour-limits.html",
    "static-xbox-game-pass-september-2026-stacked-lineup.html",
    "static-zelda-40th-anniversary-direct-today.html",
}
DANGEROUS_PATTERNS = [
    ("paused custom-build service", re.compile(r"custom-gaming-pc-builds-pretoria\.html", re.I)),
]


class MetadataParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.meta: dict[str, str] = {}
        self.canonical = ""
        self.title_count = 0
        self.h1_count = 0
        self.hrefs: list[str] = []
        self.stylesheets: list[str] = []
        self.inline_style_blocks = 0
        self.inline_style_attrs = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        data = {str(k).lower(): (v or "") for k, v in attrs}
        tag = tag.lower()
        if tag == "meta":
            key = (data.get("name") or data.get("property") or "").strip().lower()
            if key and data.get("content"):
                self.meta[key] = data["content"].strip()
        elif tag == "link":
            rel = {part.lower() for part in data.get("rel", "").split()}
            if "canonical" in rel and data.get("href"):
                self.canonical = data["href"].strip()
            if "stylesheet" in rel and data.get("href"):
                self.stylesheets.append(data["href"].strip())
        elif tag == "title":
            self.title_count += 1
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "a" and data.get("href"):
            self.hrefs.append(data["href"].strip())
        elif tag == "style":
            self.inline_style_blocks += 1
        if "style" in data:
            self.inline_style_attrs += 1


def parse_html(path: Path) -> tuple[str, MetadataParser]:
    html = path.read_text(encoding="utf-8")
    parser = MetadataParser()
    parser.feed(html)
    return html, parser


def rss_items() -> list[tuple[str, str]]:
    feed = ROOT / "static-feed.xml"
    root = ET.parse(feed).getroot()
    items = root.findall("./channel/item")
    if not items:
        raise ValueError("static-feed.xml has no items")
    return [((item.findtext("link") or "").strip(), (item.findtext("description") or "").strip()) for item in items]


def sitemap_urls() -> set[str]:
    root = ET.parse(ROOT / "sitemap.xml").getroot()
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return {(node.text or "").strip() for node in root.findall(".//s:loc", ns)}


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []
    articles = sorted(ROOT.glob("static-*.html"))
    if not articles:
        errors.append("No STATIC article files found.")

    for path in articles:
        html, parsed = parse_html(path)
        rel = path.name
        expected = BASE + rel
        legacy = rel in LEGACY_ARTICLES
        if parsed.title_count != 1:
            errors.append(f"{rel}: expected exactly one <title>.")
        if parsed.h1_count != 1:
            errors.append(f"{rel}: expected exactly one H1.")
        if not parsed.canonical:
            errors.append(f"{rel}: missing canonical URL.")
        elif parsed.canonical != expected:
            errors.append(f"{rel}: canonical mismatch. Expected {expected}, got {parsed.canonical}.")
        desc = parsed.meta.get("description", "")
        if not desc:
            errors.append(f"{rel}: missing meta description.")
        elif len(desc) < 70:
            warnings.append(f"{rel}: meta description is short ({len(desc)} chars).")
        if "noindex" in parsed.meta.get("robots", "").lower():
            errors.append(f"{rel}: article is marked noindex.")
        if not any(Path(urlparse(href).path).name == "static.html" for href in parsed.hrefs):
            errors.append(f"{rel}: no link back to static.html.")
        for label, pattern in DANGEROUS_PATTERNS:
            if pattern.search(html):
                errors.append(f"{rel}: links to {label}.")

        has_jsonld = "application/ld+json" in html
        has_published = bool(parsed.meta.get("article:published_time")) or '"datePublished"' in html
        has_static_css = any(Path(urlparse(href).path).name == "static-article.css" for href in parsed.stylesheets)
        if legacy:
            if not parsed.meta.get("og:image"):
                warnings.append(f"{rel}: no og:image.")
            if not has_jsonld:
                warnings.append(f"{rel}: no JSON-LD article metadata (historical template debt).")
            if not parsed.meta.get("twitter:card"):
                warnings.append(f"{rel}: no Twitter/X card metadata.")
            if parsed.inline_style_blocks or parsed.inline_style_attrs or "fonts.googleapis.com" in html:
                warnings.append(f"{rel}: historical inline/remote-font presentation remains for Step 8 migration.")
        else:
            if not has_static_css:
                errors.append(f"{rel}: new article must use assets/css/pages/static-article.css.")
            if parsed.inline_style_blocks or parsed.inline_style_attrs:
                errors.append(f"{rel}: new article must not use inline styling.")
            if "fonts.googleapis.com" in html or "fonts.gstatic.com" in html:
                errors.append(f"{rel}: new article must use local fonts only.")
            if not has_jsonld or not has_published:
                errors.append(f"{rel}: new article requires JSON-LD and a machine-readable publish date.")
            for key in ("og:type", "og:title", "og:description", "og:url", "og:image", "twitter:card"):
                if not parsed.meta.get(key):
                    errors.append(f"{rel}: new article missing {key} metadata.")

    hub = ROOT / "static.html"
    if not hub.exists():
        errors.append("static.html is missing.")
    else:
        html, parsed = parse_html(hub)
        if parsed.title_count != 1 or parsed.h1_count != 1:
            errors.append("static.html: expected one title and one H1.")
        if 'static-feed.xml' not in html:
            errors.append("static.html: RSS discovery link is missing.")
        if 'Editorial coverage is global' not in html:
            errors.append("static.html: global editorial / SA services boundary note is missing.")
        if not any(Path(urlparse(href).path).name == "static.css" for href in parsed.stylesheets):
            errors.append("static.html: clean STATIC stylesheet is missing.")
        if parsed.inline_style_blocks or parsed.inline_style_attrs:
            errors.append("static.html: inline styling is not allowed after Step 6.3.")
        if "fonts.googleapis.com" in html or "fonts.gstatic.com" in html:
            errors.append("static.html: remote Google Fonts are not allowed after Step 6.3.")
        lead = re.search(r'<a\s+[^>]*data-static-lead[^>]*href=["\']([^"\']+)', html, re.I)
        try:
            feed_items = rss_items()
            if not lead:
                errors.append("static.html: lead story is missing data-static-lead.")
            elif Path(urlparse(feed_items[0][0]).path).name != Path(urlparse(lead.group(1)).path).name:
                errors.append("static.html: lead story does not match the newest RSS item.")
            for link, desc in feed_items:
                if len(desc) < 60:
                    errors.append(f"static-feed.xml: description too short for {Path(urlparse(link).path).name} ({len(desc)} chars).")
        except Exception as exc:
            errors.append(f"static-feed.xml: {exc}")

    try:
        listed = sitemap_urls()
        expected = {BASE + "static.html", *(BASE + p.name for p in articles)}
        missing = sorted(expected - listed)
        if missing:
            errors.append("sitemap.xml: missing STATIC URLs: " + ", ".join(missing))
    except Exception as exc:
        errors.append(f"sitemap.xml: {exc}")

    print(f"STATIC QA: {len(articles)} article(s)")
    if warnings:
        print("\nWARNINGS")
        for item in warnings:
            print(f"  - {item}")
    if errors:
        print("\nERRORS")
        for item in errors:
            print(f"  - {item}")
        return 1
    print("\nSTATIC publishing guard passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
