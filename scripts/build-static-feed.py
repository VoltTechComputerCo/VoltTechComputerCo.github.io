#!/usr/bin/env python3
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from email.utils import format_datetime
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import subprocess
import xml.etree.ElementTree as ET

BASE = "https://volttechcomputerco.co.za/"
LEGACY_BASE = "https://volttechcomputerco.github.io/"
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "static-feed.xml"
MAX_ITEMS = 20
ZA = timezone(timedelta(hours=2))

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


class HeadMetadataParser(HTMLParser):
    """Read head metadata without regex-breaking on apostrophes in content."""
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.meta: dict[str, str] = {}
        self.canonical = ""

    def handle_starttag(self, tag: str, attrs) -> None:
        data = {str(k).lower(): (v or "") for k, v in attrs}
        if tag.lower() == "meta":
            key = (data.get("name") or data.get("property") or "").strip().lower()
            content = data.get("content", "").strip()
            if key and content:
                self.meta[key] = content
        elif tag.lower() == "link":
            rel = {part.lower() for part in data.get("rel", "").split()}
            if "canonical" in rel and data.get("href"):
                self.canonical = data["href"].strip()


def page_metadata(html: str) -> HeadMetadataParser:
    parser = HeadMetadataParser()
    parser.feed(html)
    return parser


def text_only(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(TAG_RE.sub("", value or ""))).strip()


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
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=ZA)
        return dt.astimezone(ZA)
    except Exception:
        pass

    m = re.search(r"\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b", value)
    if m:
        day, month_name, year = int(m.group(1)), m.group(2).lower(), int(m.group(3))
        month = MONTHS.get(month_name)
        if month:
            return datetime(year, month, day, 9, 0, tzinfo=ZA)

    m = re.search(r"\b(20\d{2})-(\d{2})-(\d{2})\b", value)
    if m:
        return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)), 9, 0, tzinfo=ZA)
    return None


def visible_publish_date(html: str) -> datetime | None:
    h1 = H1_RE.search(html)
    if not h1:
        return None
    before = text_only(html[max(0, h1.start() - 900):h1.start()])
    dates = list(re.finditer(r"\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b", before, re.I))
    if dates:
        parsed = parse_date_string(dates[-1].group(0))
        if parsed:
            return parsed
    after = text_only(html[h1.end():min(len(html), h1.end() + 700)])
    m = re.search(r"\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b", after, re.I)
    return parse_date_string(m.group(0)) if m else None


def git_date(path: Path) -> datetime:
    result = subprocess.run(
        ["git", "log", "-1", "--format=%aI", "--", str(path.relative_to(ROOT))],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    parsed = parse_date_string(result.stdout.strip())
    return parsed or datetime.now(ZA)


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
    return visible_publish_date(html) or git_date(path)


def story(path: Path) -> dict:
    html = path.read_text(encoding="utf-8")
    parsed = page_metadata(html)
    meta = parsed.meta
    return {
        "title": title_for(html, meta),
        "url": (BASE + path.name) if parsed.canonical.startswith(LEGACY_BASE) else (parsed.canonical or BASE + path.name),
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
    ET.SubElement(channel, "{http://www.w3.org/2005/Atom}link", {
        "href": BASE + "static-feed.xml",
        "rel": "self",
        "type": "application/rss+xml",
    })
    ET.SubElement(channel, "lastBuildDate").text = format_datetime(stories[0]["published"])

    for item in stories:
        node = ET.SubElement(channel, "item")
        ET.SubElement(node, "title").text = item["title"]
        ET.SubElement(node, "link").text = item["url"]
        guid = ET.SubElement(node, "guid", {"isPermaLink": "true"})
        guid.text = item["url"]
        ET.SubElement(node, "pubDate").text = format_datetime(item["published"])
        ET.SubElement(node, "description").text = item["description"]
        if item["image"]:
            ET.SubElement(node, "{http://search.yahoo.com/mrss/}content", {
                "url": item["image"], "medium": "image"
            })

    ET.indent(rss, space="  ")
    OUTPUT.write_text(ET.tostring(rss, encoding="unicode", xml_declaration=True) + "\n", encoding="utf-8")
    ET.parse(OUTPUT)
    print(f"STATIC RSS rebuilt with {len(stories)} article(s). Newest: {stories[0]['title']}")


if __name__ == "__main__":
    main()
