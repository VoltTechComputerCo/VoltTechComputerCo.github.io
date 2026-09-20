#!/usr/bin/env python3
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from email.utils import format_datetime
from html import escape, unescape
from pathlib import Path
import json
import re
import subprocess
import xml.etree.ElementTree as ET

BASE = "https://volttechcomputerco.github.io/"
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "static-feed.xml"
MAX_ITEMS = 20
ZA = timezone(timedelta(hours=2))

META_RE = re.compile(
    r'<meta\s+[^>]*(?:name|property)=["\']([^"\']+)["\'][^>]*content=["\']([^"\']*)["\'][^>]*>',
    re.I,
)
META_RE_REVERSED = re.compile(
    r'<meta\s+[^>]*content=["\']([^"\']*)["\'][^>]*(?:name|property)=["\']([^"\']+)["\'][^>]*>',
    re.I,
)
CANONICAL_RE = re.compile(
    r'<link\s+[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)["\']',
    re.I,
)
TITLE_RE = re.compile(r'<title>(.*?)</title>', re.I | re.S)
H1_RE = re.compile(r'<h1[^>]*>(.*?)</h1>', re.I | re.S)
JSONLD_RE = re.compile(
    r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
    re.I | re.S,
)
TAG_RE = re.compile(r'<[^>]+>')

MONTHS = {
    "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
    "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6, "jul": 7, "july": 7,
    "aug": 8, "august": 8, "sep": 9, "sept": 9, "september": 9,
    "oct": 10, "october": 10, "nov": 11, "november": 11, "dec": 12, "december": 12,
}

def text_only(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(TAG_RE.sub("", value or ""))).strip()

def metas(html: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for key, value in META_RE.findall(html):
        out[key.lower()] = unescape(value.strip())
    for value, key in META_RE_REVERSED.findall(html):
        out[key.lower()] = unescape(value.strip())
    return out

def canonical(html: str, path: Path) -> str:
    m = CANONICAL_RE.search(html)
    return m.group(1).strip() if m else BASE + path.name

def title_for(html: str, meta: dict[str, str]) -> str:
    if meta.get("og:title"):
        return text_only(meta["og:title"])
    m = H1_RE.search(html)
    if m:
        return text_only(m.group(1))
    m = TITLE_RE.search(html)
    if m:
        return re.sub(r"\s*\|\s*STATIC\s*$", "", text_only(m.group(1)), flags=re.I)
    return "STATIC"

def description_for(html: str, meta: dict[str, str]) -> str:
    for key in ("description", "og:description", "twitter:description"):
        if meta.get(key):
            return text_only(meta[key])
    # Fallback to first substantial paragraph.
    for p in re.findall(r"<p[^>]*>(.*?)</p>", html, re.I | re.S):
        clean = text_only(p)
        if len(clean) >= 60:
            return clean[:280]
    return "A story from STATIC by VoltTech Computer Co."

def jsonld_dates(html: str) -> list[str]:
    found = []
    for raw in JSONLD_RE.findall(html):
        try:
            obj = json.loads(raw)
        except Exception:
            continue
        stack = obj if isinstance(obj, list) else [obj]
        for item in stack:
            if isinstance(item, dict):
                for key in ("datePublished", "dateModified"):
                    value = item.get(key)
                    if isinstance(value, str):
                        found.append(value)
    return found

def parse_date_string(value: str) -> datetime | None:
    value = (value or "").strip()
    if not value:
        return None

    # ISO first.
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=ZA)
        return dt.astimezone(ZA)
    except Exception:
        pass

    # Human dates like 16 Sep 2026 / 16 September 2026.
    m = re.search(r"\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b", value)
    if m:
        day, month_name, year = int(m.group(1)), m.group(2).lower(), int(m.group(3))
        month = MONTHS.get(month_name)
        if month:
            return datetime(year, month, day, 9, 0, tzinfo=ZA)

    # ISO date embedded in content.
    m = re.search(r"\b(20\d{2})-(\d{2})-(\d{2})\b", value)
    if m:
        return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)), 9, 0, tzinfo=ZA)

    return None


def visible_publish_date(html: str) -> datetime | None:
    """
    Older STATIC articles keep the publication date in visible copy near the H1
    rather than JSON-LD/meta. Search a tight window around the first H1 so event
    dates later in the article cannot be mistaken for the publish date.
    """
    h1 = H1_RE.search(html)
    if not h1:
        return None

    start = max(0, h1.start() - 1200)
    end = min(len(html), h1.end() + 1200)
    window = text_only(html[start:end])
    return parse_date_string(window)

def git_date(path: Path) -> datetime:
    result = subprocess.run(
        ["git", "log", "-1", "--format=%aI", "--", str(path.relative_to(ROOT))],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    raw = result.stdout.strip()
    parsed = parse_date_string(raw)
    if parsed:
        return parsed
    return datetime.now(ZA)

def published_at(html: str, meta: dict[str, str], path: Path) -> datetime:
    candidates = [
        meta.get("article:published_time", ""),
        meta.get("date", ""),
        meta.get("datepublished", ""),
        *jsonld_dates(html),
    ]
    for value in candidates:
        parsed = parse_date_string(value)
        if parsed:
            return parsed

    visible = visible_publish_date(html)
    if visible:
        return visible

    return git_date(path)

def story(path: Path) -> dict:
    html = path.read_text(encoding="utf-8")
    meta = metas(html)
    return {
        "title": title_for(html, meta),
        "url": canonical(html, path),
        "description": description_for(html, meta),
        "image": meta.get("og:image", "").strip(),
        "published": published_at(html, meta, path),
    }

def main() -> None:
    files = sorted(ROOT.glob("static-*.html"))
    stories = [story(path) for path in files]
    stories.sort(key=lambda x: x["published"], reverse=True)
    stories = stories[:MAX_ITEMS]

    if not stories:
        raise SystemExit("No STATIC articles found.")

    ET.register_namespace("atom", "http://www.w3.org/2005/Atom")
    ET.register_namespace("media", "http://search.yahoo.com/mrss/")
    rss = ET.Element("rss", {"version": "2.0"})
    channel = ET.SubElement(rss, "channel")
    ET.SubElement(channel, "title").text = "STATIC — Tech, Gaming & Nerd Culture"
    ET.SubElement(channel, "link").text = BASE + "static.html"
    ET.SubElement(channel, "description").text = (
        "Breaking tech and gaming stories, PC hardware, performance, security "
        "and enthusiast culture from STATIC by VoltTech Computer Co."
    )
    ET.SubElement(channel, "language").text = "en"
    atom = ET.SubElement(
        channel,
        "{http://www.w3.org/2005/Atom}link",
        {
            "href": BASE + "static-feed.xml",
            "rel": "self",
            "type": "application/rss+xml",
        },
    )
    latest = stories[0]["published"]
    ET.SubElement(channel, "lastBuildDate").text = format_datetime(latest)

    for item in stories:
        node = ET.SubElement(channel, "item")
        ET.SubElement(node, "title").text = item["title"]
        ET.SubElement(node, "link").text = item["url"]
        guid = ET.SubElement(node, "guid", {"isPermaLink": "true"})
        guid.text = item["url"]
        ET.SubElement(node, "pubDate").text = format_datetime(item["published"])
        ET.SubElement(node, "description").text = item["description"]
        if item["image"]:
            ET.SubElement(
                node,
                "{http://search.yahoo.com/mrss/}content",
                {"url": item["image"], "medium": "image"},
            )

    ET.indent(rss, space="  ")
    xml = ET.tostring(rss, encoding="unicode", xml_declaration=True)
    OUTPUT.write_text(xml + "\n", encoding="utf-8")

    # Parse our own output as a hard validation step.
    ET.parse(OUTPUT)
    print(f"STATIC RSS rebuilt with {len(stories)} article(s). Newest: {stories[0]['title']}")

if __name__ == "__main__":
    main()
