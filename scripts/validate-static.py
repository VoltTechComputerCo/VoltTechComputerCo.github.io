#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import json
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://volttechcomputerco.co.za/"
OLD = "https://volttechcomputerco.github.io"

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta={}
        self.canonical=""
        self.title_count=0
        self.h1_count=0
        self.hrefs=[]
        self.stylesheets=[]
        self.style_blocks=0
        self.style_attrs=0
    def handle_starttag(self, tag, attrs):
        data={str(k).lower():(v or "") for k,v in attrs}
        tag=tag.lower()
        if tag=="meta":
            key=(data.get("name") or data.get("property") or "").strip().lower()
            if key and data.get("content"): self.meta[key]=data["content"].strip()
        elif tag=="link":
            rel={p.lower() for p in data.get("rel","").split()}
            if "canonical" in rel and data.get("href"): self.canonical=data["href"].strip()
            if "stylesheet" in rel and data.get("href"): self.stylesheets.append(data["href"].strip())
        elif tag=="title": self.title_count += 1
        elif tag=="h1": self.h1_count += 1
        elif tag=="a" and data.get("href"): self.hrefs.append(data["href"].strip())
        elif tag=="style": self.style_blocks += 1
        if "style" in data: self.style_attrs += 1

def parse(path):
    html=path.read_text(encoding="utf-8")
    p=Parser();p.feed(html)
    return html,p

def jsonld(html):
    out=[]
    for raw in re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',html,re.I|re.S):
        obj=json.loads(raw)
        out.extend(obj if isinstance(obj,list) else [obj])
    return [x for x in out if isinstance(x,dict)]

def sitemap_urls():
    root=ET.parse(ROOT/"sitemap.xml").getroot()
    ns={"s":"http://www.sitemaps.org/schemas/sitemap/0.9"}
    return {(n.text or "").strip() for n in root.findall(".//s:loc",ns)}

def rss_items():
    root=ET.parse(ROOT/"static-feed.xml").getroot()
    return [((i.findtext("link") or "").strip(),(i.findtext("description") or "").strip()) for i in root.findall("./channel/item")]

def main():
    errors=[]
    articles=sorted(ROOT.glob("static-*.html"))
    if len(articles)!=30: errors.append(f"Expected 30 STATIC articles; found {len(articles)}.")
    for path in articles:
        html,p=parse(path); rel=path.name; expected=BASE+rel
        if p.title_count!=1: errors.append(f"{rel}: title count {p.title_count}")
        if p.h1_count!=1: errors.append(f"{rel}: H1 count {p.h1_count}")
        if p.canonical!=expected: errors.append(f"{rel}: canonical mismatch")
        if OLD in html: errors.append(f"{rel}: github.io remains")
        if "fonts.googleapis.com" in html or "fonts.gstatic.com" in html: errors.append(f"{rel}: Google Fonts remain")
        if p.style_blocks or p.style_attrs: errors.append(f"{rel}: inline styles remain")
        if not p.meta.get("description"): errors.append(f"{rel}: missing description")
        if not p.meta.get("article:published_time"): errors.append(f"{rel}: missing published time")
        for key in ("og:type","og:title","og:description","og:url","og:image","twitter:card","twitter:title","twitter:description","twitter:image"):
            if not p.meta.get(key): errors.append(f"{rel}: missing {key}")
        if p.meta.get("og:url")!=expected: errors.append(f"{rel}: og:url mismatch")
        if not any(Path(urlparse(h).path).name=="static.html" for h in p.hrefs): errors.append(f"{rel}: no STATIC home link")
        names={Path(urlparse(h).path).as_posix().lstrip("/") for h in p.stylesheets}
        css=f"assets/css/static-legacy/{path.stem}.css"
        if "assets/css/base.css" not in names: errors.append(f"{rel}: base.css missing")
        if css not in names or not (ROOT/css).is_file(): errors.append(f"{rel}: migrated stylesheet missing")
        try:
            objs=jsonld(html)
        except Exception as exc:
            errors.append(f"{rel}: invalid JSON-LD {exc}")
            objs=[]
        nodes=[o for o in objs if o.get("@type") in ("NewsArticle","BlogPosting","Article")]
        if not nodes: errors.append(f"{rel}: article JSON-LD missing")
        elif nodes[0].get("mainEntityOfPage")!=expected: errors.append(f"{rel}: JSON-LD page mismatch")

    try:
        items=rss_items()
        for link,desc in items:
            if not link.startswith(BASE): errors.append(f"RSS non-canonical URL {link}")
            if len(desc)<60: errors.append(f"RSS short description {link}")
    except Exception as exc: errors.append(f"RSS parse failed: {exc}")

    try:
        listed=sitemap_urls()
        expected={BASE+"static.html",*(BASE+p.name for p in articles)}
        missing=sorted(expected-listed)
        if missing: errors.append("Sitemap missing: "+", ".join(missing))
        if any(u.startswith(OLD) for u in listed): errors.append("Sitemap github.io remains")
    except Exception as exc: errors.append(f"Sitemap parse failed: {exc}")

    print(f"STATIC QA: {len(articles)} article(s)")
    if errors:
        for e in errors: print("- "+e)
        return 1
    print("STATIC publishing guard passed with all historical articles migrated.")
    return 0

if __name__=="__main__":
    sys.exit(main())
