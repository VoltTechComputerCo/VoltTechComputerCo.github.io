#!/usr/bin/env python3
"""Build the new frontend only. Route ownership is explicit; no legacy templates."""
import argparse
import html
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def render(source):
    config = json.loads(source.read_text())
    output = Path(config['output'])
    if output.is_absolute() or '..' in output.parts or output.suffix != '.html':
        raise ValueError('Unsafe output path')
    prefix = '../' * (len(output.parts)-1)
    esc = html.escape
    extra = ''
    if source.stem == 'home':
        schema = json.loads((ROOT/'frontend/pages/home.schema.json').read_text())
        extra += '<script type="application/ld+json">'+json.dumps(schema).replace('<','\\u003c')+'</script>'
    if config.get('config'):
        extra += f'<script defer src="{prefix}supabase-config.js"></script>'
    cfg_json = json.dumps(config).replace('<', '\\u003c')
    extra += '<script type="application/json" id="route-data">' + cfg_json + '</script>'
    for schema in config.get('data', {}).get('schemas', []):
        extra += '<script type="application/ld+json">' + json.dumps(schema).replace('<', '\\u003c') + '</script>'
    if config.get('family') == 'editorial':
        extra += f'<link rel="stylesheet" href="{prefix}frontend/styles/editorial.css">'
    scripts = ''.join(f'<script type="module" src="{prefix}{esc(path,quote=True)}"></script>' for path in ['frontend/shell.js']+config.get('scripts',[]))
    header=(ROOT/'frontend/components/header.html').read_text()
    footer=(ROOT/'frontend/components/footer.html').read_text()
    content=source.with_suffix('.html').read_text()
    if prefix:
        import re
        def local(match):
            attr, path = match.groups()
            if path.startswith(('#', '/')) or re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', path): return match.group(0)
            return attr + '="' + prefix + path + '"'
        header = re.sub(r'(href|src)="([^"]+)"', local, header)
        footer = re.sub(r'(href|src)="([^"]+)"', local, footer)
        content = re.sub(r'(href|src)="([^"]+)"', local, content)
    return ROOT/output, f'''<!doctype html>
<html lang="en-ZA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{esc(config['title'])}</title><meta name="description" content="{esc(config['description'],quote=True)}"><meta name="robots" content="{esc(config['robots'],quote=True)}"><link rel="canonical" href="{esc(config['canonical'],quote=True)}"><meta name="theme-color" content="#006e60"><link rel="icon" href="{prefix}icons/favicon.ico"><link rel="preload" href="{prefix}assets/fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="{prefix}frontend/styles/system.css"><link rel="stylesheet" href="{prefix}frontend/styles/experience.css"><link rel="stylesheet" href="{prefix}frontend/styles/application.css"><meta property="og:type" content="{esc(config.get('og_type', 'website'),quote=True)}"><meta property="og:title" content="{esc(config['title'],quote=True)}"><meta property="og:description" content="{esc(config['description'],quote=True)}"><meta property="og:url" content="{esc(config['canonical'],quote=True)}"><meta property="og:image" content="{esc(config.get('og_image', 'https://volttechcomputerco.co.za/vt-own-internals.webp'),quote=True)}"><meta property="og:locale" content="en_ZA"><meta name="twitter:card" content="summary_large_image">{extra}</head><body data-family="{esc(config.get('family', 'home'))}">{header}{content}{footer}{scripts}</body></html>
'''

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check',action='store_true')
    args=parser.parse_args()
    stale=[]
    for source in sorted((ROOT/'frontend/pages').glob('*.json')):
        if source.name.endswith('.schema.json'):continue
        target,content=render(source)
        if args.check:
            if not target.exists() or target.read_text()!=content:stale.append(str(target.relative_to(ROOT)))
        else:target.parent.mkdir(parents=True,exist_ok=True);target.write_text(content)
    if stale:raise SystemExit('Regenerate: '+', '.join(stale))
    print('New frontend outputs match source.' if args.check else 'New frontend outputs built.')
if __name__=='__main__':main()
