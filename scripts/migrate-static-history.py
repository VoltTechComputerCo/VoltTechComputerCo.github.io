#!/usr/bin/env python3
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from html import escape, unescape
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://volttechcomputerco.co.za/"
OLD = "https://volttechcomputerco.github.io"
STYLE_DIR = ROOT / "assets/css/static-legacy"
ZA = timezone(timedelta(hours=2))

TITLE_RE = re.compile(r"<title>(.*?)</title>", re.I | re.S)
H1_RE = re.compile(r"<h1[^>]*>(.*?)</h1>", re.I | re.S)
TAG_RE = re.compile(r"<[^>]+>")
JSONLD_RE = re.compile(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>.*?</script>\s*', re.I | re.S)
STYLE_BLOCK_RE = re.compile(r"<style\b[^>]*>(.*?)</style>\s*", re.I | re.S)
STYLE_ATTR_RE = re.compile(r'(<[A-Za-z][^<>]*?)\s+style=(["\'])(.*?)\2([^<>]*>)', re.I | re.S)
GOOGLE_LINK_RE = re.compile(r'<link\b[^>]*(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^>]*>\s*', re.I | re.S)
CANONICAL_RE = re.compile(r'<link\b(?=[^>]*\brel=["\'][^"\']*\bcanonical\b[^"\']*["\'])[^>]*>\s*', re.I | re.S)
SOCIAL_META_RE = re.compile(r'<meta\b[^>]*(?:name|property)=["\'](?:robots|article:published_time|og:[^"\']+|twitter:[^"\']+)["\'][^>]*>\s*', re.I | re.S)
LOCAL_FONT_PRELOAD_RE = re.compile(r'<link\b[^>]*rel=["\']preload["\'][^>]*assets/fonts/(?:space-grotesk|jetbrains-mono)-latin\.woff2[^>]*>\s*', re.I | re.S)
LOCAL_BASE_RE = re.compile(r'<link\b[^>]*rel=["\']stylesheet["\'][^>]*href=["\']assets/css/base\.css["\'][^>]*>\s*', re.I | re.S)
LEGACY_CSS_RE = re.compile(r'<link\b[^>]*rel=["\']stylesheet["\'][^>]*href=["\']assets/css/static-legacy/[^"\']+["\'][^>]*>\s*', re.I | re.S)

MONTHS = {
    "jan":1,"january":1,"feb":2,"february":2,"mar":3,"march":3,
    "apr":4,"april":4,"may":5,"jun":6,"june":6,"jul":7,"july":7,
    "aug":8,"august":8,"sep":9,"sept":9,"september":9,
    "oct":10,"october":10,"nov":11,"november":11,"dec":12,"december":12,
}

class HeadParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta = {}
        self.canonical = ""
    def handle_starttag(self, tag, attrs):
        data = {str(k).lower():(v or "") for k,v in attrs}
        if tag.lower() == "meta":
            key = (data.get("name") or data.get("property") or "").strip().lower()
            if key and data.get("content"):
                self.meta[key] = data["content"].strip()
        elif tag.lower() == "link":
            rel = {part.lower() for part in data.get("rel","").split()}
            if "canonical" in rel and data.get("href"):
                self.canonical = data["href"].strip()

def text_only(value):
    return re.sub(r"\s+", " ", unescape(TAG_RE.sub("", value or ""))).strip()

def page_title(html, meta):
    if meta.get("og:title"):
        return text_only(meta["og:title"])
    m = H1_RE.search(html)
    if m:
        return text_only(m.group(1))
    m = TITLE_RE.search(html)
    if m:
        return re.sub(r"\s*\|\s*STATIC\s*$", "", text_only(m.group(1)), flags=re.I)
    return "STATIC"

def page_description(html, meta):
    for key in ("description","og:description","twitter:description"):
        if meta.get(key):
            return text_only(meta[key])
    for p in re.findall(r"<p[^>]*>(.*?)</p>", html, re.I | re.S):
        clean = text_only(p)
        if len(clean) >= 60:
            return clean[:280]
    return "A story from STATIC by VoltTech Computer Co."

def parse_date_string(value):
    value = (value or "").strip()
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z","+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=ZA)
        return dt.astimezone(ZA)
    except Exception:
        pass
    m = re.search(r"\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b", value)
    if m:
        month = MONTHS.get(m.group(2).lower())
        if month:
            return datetime(int(m.group(3)), month, int(m.group(1)), 9, 0, tzinfo=ZA)
    m = re.search(r"\b(20\d{2})-(\d{2})-(\d{2})\b", value)
    if m:
        return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)), 9, 0, tzinfo=ZA)
    return None

def existing_jsonld_dates(html):
    found = []
    for raw in re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, re.I | re.S):
        try:
            obj = json.loads(raw)
        except Exception:
            continue
        stack = obj if isinstance(obj, list) else [obj]
        for item in stack:
            if isinstance(item, dict):
                for key in ("datePublished","dateModified"):
                    if isinstance(item.get(key), str):
                        found.append(item[key])
    return found

def visible_publish_date(html):
    h1 = H1_RE.search(html)
    if not h1:
        return None
    before = text_only(html[max(0, h1.start()-900):h1.start()])
    dates = list(re.finditer(r"\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b", before, re.I))
    if dates:
        parsed = parse_date_string(dates[-1].group(0))
        if parsed:
            return parsed
    after = text_only(html[h1.end():min(len(html), h1.end()+900)])
    m = re.search(r"\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b", after, re.I)
    return parse_date_string(m.group(0)) if m else None

def git_date(path):
    result = subprocess.run(
        ["git","log","-1","--format=%aI","--",str(path.relative_to(ROOT))],
        cwd=ROOT, text=True, capture_output=True, check=False,
    )
    return parse_date_string(result.stdout.strip()) or datetime.now(ZA)

def published_at(html, meta, path):
    for value in [
        meta.get("article:published_time",""),
        meta.get("date",""),
        meta.get("datepublished",""),
        *existing_jsonld_dates(html),
    ]:
        parsed = parse_date_string(value)
        if parsed:
            return parsed
    return visible_publish_date(html) or git_date(path)

def replace_inline_style_attrs(html, rules):
    counter = 0
    def repl(match):
        nonlocal counter
        counter += 1
        rules.append(f'[data-static-inline="{counter}"]{{{match.group(3).strip()}}}')
        return f'{match.group(1)} data-static-inline="{counter}"{match.group(4)}'
    return STYLE_ATTR_RE.sub(repl, html)

def migrate_article(path):
    original = path.read_text(encoding="utf-8")
    parser = HeadParser()
    parser.feed(original)
    meta = parser.meta

    title = page_title(original, meta)
    description = page_description(original, meta)
    published = published_at(original, meta, path)
    published_iso = published.replace(microsecond=0).isoformat()
    canonical = BASE + path.name
    image = meta.get("og:image","").strip() or BASE + "brand/VoltTech_Full_Logo_Transparent.png"
    image = image.replace(OLD, BASE.rstrip("/"))

    style_blocks = [s.strip() for s in STYLE_BLOCK_RE.findall(original) if s.strip()]
    html = STYLE_BLOCK_RE.sub("", original)
    inline_rules = []
    html = replace_inline_style_attrs(html, inline_rules)

    css_path = STYLE_DIR / f"{path.stem}.css"
    if style_blocks or inline_rules:
        STYLE_DIR.mkdir(parents=True, exist_ok=True)
        parts = [f"/* Extracted from {path.name}; presentation preserved during Step 8.3 migration. */"]
        parts.extend(style_blocks)
        if inline_rules:
            parts.extend(["", "/* Former inline style attributes. */"])
            parts.extend(inline_rules)
        css_path.write_text("\n\n".join(parts).rstrip() + "\n", encoding="utf-8")
    elif not css_path.exists():
        raise RuntimeError(f"{path.name}: no style source and no migrated stylesheet")

    html = html.replace(OLD, BASE.rstrip("/"))
    html = re.sub(r'<html\b([^>]*)\blang=["\'][^"\']*["\']([^>]*)>', r'<html\1lang="en-ZA"\2>', html, count=1, flags=re.I)
    if not re.search(r'<html\b[^>]*\blang=', html, re.I):
        html = re.sub(r"<html\b([^>]*)>", r'<html\1 lang="en-ZA">', html, count=1, flags=re.I)

    head_match = re.search(r"<head\b[^>]*>(.*?)</head>", html, re.I | re.S)
    if not head_match:
        raise RuntimeError(f"{path.name}: missing head")

    head = head_match.group(1)
    head = GOOGLE_LINK_RE.sub("", head)
    head = CANONICAL_RE.sub("", head)
    head = SOCIAL_META_RE.sub("", head)
    head = JSONLD_RE.sub("", head)
    head = LOCAL_FONT_PRELOAD_RE.sub("", head)
    head = LOCAL_BASE_RE.sub("", head)
    head = LEGACY_CSS_RE.sub("", head)

    structured = {
        "@context":"https://schema.org",
        "@type":"NewsArticle",
        "headline":title,
        "description":description,
        "datePublished":published_iso,
        "dateModified":published_iso,
        "mainEntityOfPage":canonical,
        "image":image,
        "author":{"@type":"Organization","name":"STATIC by VoltTech Computer Co."},
        "publisher":{
            "@type":"Organization",
            "name":"VoltTech Computer Co.",
            "url":BASE,
            "logo":{"@type":"ImageObject","url":BASE+"brand/VoltTech_Full_Logo_Transparent.png"},
        },
        "isPartOf":{"@type":"Blog","name":"STATIC","url":BASE+"static.html"},
    }

    block_lines = [
        '  <meta name="robots" content="index, follow, max-image-preview:large">',
        f'  <meta property="article:published_time" content="{escape(published_iso, quote=True)}">',
        f'  <link rel="canonical" href="{canonical}">',
        '  <link rel="preload" href="assets/fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin>',
        '  <link rel="preload" href="assets/fonts/jetbrains-mono-latin.woff2" as="font" type="font/woff2" crossorigin>',
        '  <link rel="stylesheet" href="assets/css/base.css">',
        f'  <link rel="stylesheet" href="assets/css/static-legacy/{path.stem}.css">',
        '  <meta property="og:type" content="article">',
        '  <meta property="og:site_name" content="STATIC">',
        f'  <meta property="og:title" content="{escape(title, quote=True)}">',
        f'  <meta property="og:description" content="{escape(description, quote=True)}">',
        f'  <meta property="og:url" content="{canonical}">',
        f'  <meta property="og:image" content="{escape(image, quote=True)}">',
        '  <meta name="twitter:card" content="summary_large_image">',
        f'  <meta name="twitter:title" content="{escape(title, quote=True)}">',
        f'  <meta name="twitter:description" content="{escape(description, quote=True)}">',
        f'  <meta name="twitter:image" content="{escape(image, quote=True)}">',
        '  <script type="application/ld+json">' + json.dumps(structured, ensure_ascii=False, separators=(",",":")) + '</script>',
    ]
    new_head = head.rstrip() + "\n" + "\n".join(block_lines) + "\n"
    html = html[:head_match.start(1)] + new_head + html[head_match.end(1):]
    path.write_text(html.rstrip() + "\n", encoding="utf-8")

def main():
    articles = sorted(ROOT.glob("static-*.html"))
    if len(articles) != 30:
        raise SystemExit(f"Expected 30 historical STATIC articles; found {len(articles)}")
    for path in articles:
        migrate_article(path)
    print(f"Migrated {len(articles)} historical STATIC articles.")

if __name__ == "__main__":
    main()
