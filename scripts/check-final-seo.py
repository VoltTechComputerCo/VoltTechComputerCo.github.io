#!/usr/bin/env python3
from pathlib import Path
import re,sys,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
OLD="https://volttechcomputerco.github.io"
NEW="https://volttechcomputerco.co.za"
errors=[]
if (ROOT/"correction-manifest.json").exists():errors.append("root correction-manifest.json remains")
readme=(ROOT/"README.md").read_text(encoding="utf-8") if (ROOT/"README.md").exists() else ""
if "Step 8.2 Correction" in readme:errors.append("README is still temporary correction note")
if (ROOT/"CNAME").exists():errors.append("Unexpected GitHub Pages CNAME exists")
for path in sorted(ROOT.glob("*.html")):
    html=path.read_text(encoding="utf-8")
    if OLD in html:errors.append(f"{path.name}: github.io remains")
    robots=re.search(r'<meta[^>]+name=["\']robots["\'][^>]+content=["\']([^"\']+)',html,re.I)
    indexable=not robots or "noindex" not in robots.group(1).lower()
    if indexable and ("fonts.googleapis.com" in html or "fonts.gstatic.com" in html):errors.append(f"{path.name}: indexable page loads Google Fonts")
for path in sorted((ROOT/"assets/js").rglob("*.js")):
    if OLD in path.read_text(encoding="utf-8"):errors.append(f"{path.relative_to(ROOT)}: runtime JS references github.io")
for rel in ("robots.txt","sitemap.xml","static-feed.xml"):
    if OLD in (ROOT/rel).read_text(encoding="utf-8"):errors.append(f"{rel}: github.io remains")
if errors:
    print("FINAL SEO / RESIDUE CHECK FAILED")
    [print("- "+e) for e in errors]
    sys.exit(1)
print("PASS: final public-domain, font and repository-residue checks")
