#!/usr/bin/env python3
from __future__ import annotations
from datetime import datetime, timezone, timedelta
from email.utils import format_datetime
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
import json,re,subprocess,xml.etree.ElementTree as ET

BASE="https://volttechcomputerco.co.za/"
ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/"static-feed.xml"
MAX_ITEMS=20
ZA=timezone(timedelta(hours=2))
TITLE_RE=re.compile(r"<title>(.*?)</title>",re.I|re.S)
H1_RE=re.compile(r"<h1[^>]*>(.*?)</h1>",re.I|re.S)
JSONLD_RE=re.compile(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',re.I|re.S)
TAG_RE=re.compile(r"<[^>]+>")
MONTHS={"jan":1,"january":1,"feb":2,"february":2,"mar":3,"march":3,"apr":4,"april":4,"may":5,"jun":6,"june":6,"jul":7,"july":7,"aug":8,"august":8,"sep":9,"sept":9,"september":9,"oct":10,"october":10,"nov":11,"november":11,"dec":12,"december":12}

class HeadParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True);self.meta={};self.canonical=""
    def handle_starttag(self,tag,attrs):
        data={str(k).lower():(v or "") for k,v in attrs}
        if tag.lower()=="meta":
            key=(data.get("name") or data.get("property") or "").strip().lower()
            if key and data.get("content"):self.meta[key]=data["content"].strip()
        elif tag.lower()=="link":
            rel={x.lower() for x in data.get("rel","").split()}
            if "canonical" in rel and data.get("href"):self.canonical=data["href"].strip()

def text_only(v): return re.sub(r"\s+"," ",unescape(TAG_RE.sub("",v or ""))).strip()
def parse_date(v):
    v=(v or "").strip()
    if not v:return None
    try:
        dt=datetime.fromisoformat(v.replace("Z","+00:00"))
        if dt.tzinfo is None:dt=dt.replace(tzinfo=ZA)
        return dt.astimezone(ZA)
    except Exception:pass
    m=re.search(r"\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b",v)
    if m and MONTHS.get(m.group(2).lower()):return datetime(int(m.group(3)),MONTHS[m.group(2).lower()],int(m.group(1)),9,0,tzinfo=ZA)
    return None
def dates(html):
    out=[]
    for raw in JSONLD_RE.findall(html):
        try:o=json.loads(raw)
        except Exception:continue
        for item in (o if isinstance(o,list) else [o]):
            if isinstance(item,dict) and isinstance(item.get("datePublished"),str):out.append(item["datePublished"])
    return out
def git_date(path):
    r=subprocess.run(["git","log","-1","--format=%aI","--",str(path.relative_to(ROOT))],cwd=ROOT,text=True,capture_output=True,check=False)
    return parse_date(r.stdout.strip()) or datetime.now(ZA)
def story(path):
    html=path.read_text(encoding="utf-8");p=HeadParser();p.feed(html);m=p.meta
    title=m.get("og:title") or text_only(H1_RE.search(html).group(1) if H1_RE.search(html) else TITLE_RE.search(html).group(1))
    desc=m.get("description") or m.get("og:description") or "A story from STATIC by VoltTech Computer Co."
    pub=None
    for v in [m.get("article:published_time",""),*dates(html)]:
        pub=parse_date(v)
        if pub:break
    return {"title":title,"url":p.canonical or BASE+path.stem,"description":desc,"image":m.get("og:image",""),"published":pub or git_date(path)}
def main():
    stories=[story(p) for p in sorted(ROOT.glob("static-*.html"))]
    stories.sort(key=lambda x:x["published"],reverse=True);stories=stories[:MAX_ITEMS]
    ET.register_namespace("atom","http://www.w3.org/2005/Atom");ET.register_namespace("media","http://search.yahoo.com/mrss/")
    rss=ET.Element("rss",{"version":"2.0"});ch=ET.SubElement(rss,"channel")
    ET.SubElement(ch,"title").text="STATIC — Tech, Gaming & Nerd Culture";ET.SubElement(ch,"link").text=BASE+"static"
    ET.SubElement(ch,"description").text="Breaking tech and gaming stories, PC hardware, performance, security and enthusiast culture from STATIC by VoltTech Computer Co."
    ET.SubElement(ch,"language").text="en";ET.SubElement(ch,"{http://www.w3.org/2005/Atom}link",{"href":BASE+"static-feed.xml","rel":"self","type":"application/rss+xml"})
    ET.SubElement(ch,"lastBuildDate").text=format_datetime(stories[0]["published"])
    for x in stories:
        n=ET.SubElement(ch,"item");ET.SubElement(n,"title").text=x["title"];ET.SubElement(n,"link").text=x["url"]
        g=ET.SubElement(n,"guid",{"isPermaLink":"true"});g.text=x["url"];ET.SubElement(n,"pubDate").text=format_datetime(x["published"]);ET.SubElement(n,"description").text=x["description"]
        if x["image"]:ET.SubElement(n,"{http://search.yahoo.com/mrss/}content",{"url":x["image"],"medium":"image"})
    ET.indent(rss,space="  ");OUTPUT.write_text(ET.tostring(rss,encoding="unicode",xml_declaration=True)+"\n",encoding="utf-8");ET.parse(OUTPUT)
    print(f"STATIC RSS rebuilt with {len(stories)} article(s).")
if __name__=="__main__":main()
