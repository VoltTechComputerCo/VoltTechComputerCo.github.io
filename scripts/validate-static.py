#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
BASE="https://volttechcomputerco.github.io/"

CANONICAL_RE=re.compile(
    r'<link\s+[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)["\']',
    re.I,
)
DESCRIPTION_RE=re.compile(
    r'<meta\s+[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)["\']',
    re.I,
)
DESCRIPTION_RE_REVERSED=re.compile(
    r'<meta\s+[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']description["\']',
    re.I,
)
ROBOTS_RE=re.compile(
    r'<meta\s+[^>]*name=["\']robots["\'][^>]*content=["\']([^"\']+)["\']',
    re.I,
)
H1_RE=re.compile(r"<h1[^>]*>.*?</h1>",re.I|re.S)
TITLE_RE=re.compile(r"<title>.*?</title>",re.I|re.S)

DANGEROUS_PATTERNS=[
    ("paused custom-build service", re.compile(r'custom-gaming-pc-builds-pretoria\.html',re.I)),
]

def description(html:str)->str:
    m=DESCRIPTION_RE.search(html) or DESCRIPTION_RE_REVERSED.search(html)
    return m.group(1).strip() if m else ""

def main()->int:
    errors=[]
    warnings=[]
    articles=sorted(ROOT.glob("static-*.html"))

    if not articles:
        errors.append("No STATIC article files found.")

    for path in articles:
        html=path.read_text(encoding="utf-8")
        rel=path.name
        expected=BASE+rel

        if not TITLE_RE.search(html):
            errors.append(f"{rel}: missing <title>.")

        if not H1_RE.search(html):
            errors.append(f"{rel}: missing H1.")

        canonical=CANONICAL_RE.search(html)
        if not canonical:
            errors.append(f"{rel}: missing canonical URL.")
        elif canonical.group(1).strip()!=expected:
            errors.append(
                f"{rel}: canonical mismatch. Expected {expected}, got {canonical.group(1).strip()}."
            )

        desc=description(html)
        if not desc:
            errors.append(f"{rel}: missing meta description.")
        elif len(desc)<70:
            warnings.append(f"{rel}: meta description is short ({len(desc)} chars).")

        robots=ROBOTS_RE.search(html)
        if robots and "noindex" in robots.group(1).lower():
            errors.append(f"{rel}: article is marked noindex.")

        for label,pattern in DANGEROUS_PATTERNS:
            if pattern.search(html):
                errors.append(f"{rel}: links to {label}.")

        if 'property="og:image"' not in html and "property='og:image'" not in html:
            warnings.append(f"{rel}: no og:image.")
        if 'application/ld+json' not in html:
            warnings.append(f"{rel}: no JSON-LD article metadata.")
        if 'twitter:card' not in html:
            warnings.append(f"{rel}: no Twitter/X card metadata.")

    # Hub checks.
    hub=ROOT/"static.html"
    if not hub.exists():
        errors.append("static.html is missing.")
    else:
        html=hub.read_text(encoding="utf-8")
        if 'static-feed.xml' not in html:
            warnings.append("static.html: RSS discovery link is missing.")
        if 'Editorial coverage is global' not in html:
            warnings.append("static.html: global editorial / SA services boundary note is missing.")

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

if __name__=="__main__":
    sys.exit(main())
