#!/usr/bin/env python3
from pathlib import Path
import importlib.util,tempfile
SCRIPT=Path(__file__).with_name("migrate-static-history.py")
spec=importlib.util.spec_from_file_location("m",SCRIPT);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
sample='''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Test | STATIC</title><meta name="description" content="A sufficiently long STATIC test description for migration validation and metadata generation."><link rel="canonical" href="https://volttechcomputerco.github.io/static-test.html"><meta property="og:title" content="Test"><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk" rel="stylesheet"><style>body{background:#000}.hero{color:#fff}</style></head><body><a href="static.html">STATIC</a><div>5 SEP 2026</div><h1>Test</h1><p style="margin-top:2rem">Body text.</p></body></html>'''
with tempfile.TemporaryDirectory() as td:
    td=Path(td);a=td/"static-test.html";a.write_text(sample,encoding="utf-8")
    old_root,old_dir=m.ROOT,m.STYLE_DIR;m.ROOT=td;m.STYLE_DIR=td/"assets/css/static-legacy"
    try:m.migrate_article(a)
    finally:m.ROOT=old_root;m.STYLE_DIR=old_dir
    html=a.read_text(encoding="utf-8");css=(td/"assets/css/static-legacy/static-test.css").read_text(encoding="utf-8")
    assert "volttechcomputerco.github.io" not in html
    assert "fonts.googleapis.com" not in html
    assert "<style" not in html and " style=" not in html
    assert 'data-static-inline="1"' in html and '[data-static-inline="1"]{margin-top:2rem}' in css
    assert "body{background:#000}" in css
    assert "article:published_time" in html and "application/ld+json" in html
print("PASS: historical STATIC migration preserves presentation while externalising styles")
