#!/usr/bin/env python3
"""Read-only repository audit. Never contacts a database or records secret values."""
import json
import re
import subprocess
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/frontend-reset'

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts, self.styles, self.canonical, self.robots = [], [], '', ''
        self.ids, self.structured_data, self.inline_scripts = [], 0, 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'): self.ids.append(a['id'])
        if tag == 'script':
            if a.get('src'): self.scripts.append(a['src'])
            elif a.get('type') == 'application/ld+json': self.structured_data += 1
            else: self.inline_scripts += 1
        if tag == 'link':
            if a.get('rel') == 'stylesheet': self.styles.append(a.get('href', ''))
            if a.get('rel') == 'canonical': self.canonical = a.get('href', '')
        if tag == 'meta' and a.get('name') == 'robots': self.robots = a.get('content', '')

PATTERNS = {
    'table': r"\.from\s*\(\s*['\"]([^'\"]+)['\"]",
    'rpc': r"\.rpc\s*\(\s*['\"]([^'\"]+)['\"]",
    'edge_function': r"\.invoke\s*\(\s*['\"]([^'\"]+)['\"]",
    'rest_endpoint': r"/rest/v1/([A-Za-z_][A-Za-z0-9_]*)",
    'function_endpoint': r"/functions/v1/([A-Za-z_][A-Za-z0-9_-]*)",
    'sql_table': r'\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?([\w.]+)',
    'sql_function': r'\bcreate\s+(?:or\s+replace\s+)?function\s+([\w.]+)',
    'sql_policy': r'\bcreate\s+policy\s+("[^"]+"|[\w]+)',
    'dom_id': r"getElementById\s*\(\s*['\"]([^'\"]+)['\"]",
    'dom_selector': r"querySelector(?:All)?\s*\(\s*['\"]([^'\"]+)['\"]",
    'storage_key': r"(?:getItem|setItem|removeItem)\s*\(\s*['\"]([^'\"]+)['\"]",
    'event': r"(?:addEventListener|CustomEvent)\s*\(\s*['\"]([^'\"]+)['\"]",
    'environment_name': r"Deno\.env\.get\s*\(\s*['\"]([^'\"]+)['\"]",
}

def local_path(source, url):
    if not url or urlsplit(url).scheme or url.startswith('//'): return None
    p = (ROOT / urlsplit(url).path.lstrip('/')) if url.startswith('/') else source.parent / urlsplit(url).path
    return p.resolve()

def family(name):
    if name.startswith('admin'): return 'admin'
    if name.startswith('static-') or name == 'static.html': return 'STATIC'
    if name.startswith('google'): return 'verification'
    if name in {'account.html','quotes.html','builds.html','documents.html','activity.html','privacy-center.html','personal-data.html'}: return 'customer'
    if name in {'quote.html','invoice.html','proforma.html','receipt.html','order-document.html','build-document.html','service-record.html'}: return 'document'
    if name in {'checkout.html','store.html','product.html','order-status.html'}: return 'commerce'
    if name in {'signal-scan.html','stream-scan.html','exposure-scan.html'}: return 'diagnostics'
    if name.startswith('creator-'): return 'creator'
    if name in {'legal.html','terms.html','privacy.html','privacy-policy.html','paia.html','returns-warranty.html','delivery-collection.html','quote-terms.html','repair-authorisation.html'}: return 'legal'
    if name.startswith(('pc-','windows-','virus-','streaming-')) or name == 'repair.html': return 'service'
    if name == 'builder/index.html': return 'Builder'
    return 'utility' if name != 'index.html' else 'home'

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    files = subprocess.check_output(['git','ls-files'], cwd=ROOT, text=True).splitlines()
    modules, contracts = {}, []
    for name in files:
        source = ROOT / name
        if source.suffix not in {'.js','.mjs','.ts','.sql','.html','.py'}: continue
        text = source.read_text(errors='replace')
        for kind, pattern in PATTERNS.items():
            for match in re.finditer(pattern, text, re.I):
                contracts.append({'kind':kind,'name':match.group(1),'file':name,'line':text.count('\n',0,match.start())+1})
        if source.suffix in {'.js','.mjs','.ts'}:
            imports = []
            for match in re.finditer(r"(?:\bfrom\s*|\bimport\s*\(?\s*)['\"]([^'\"]+)['\"]", text):
                target = local_path(source, match.group(1))
                if target and target.is_relative_to(ROOT) and target.exists(): imports.append(str(target.relative_to(ROOT)))
            modules[name] = sorted(set(imports))
    def closure(names):
        seen, pending = set(), list(names)
        while pending:
            name = pending.pop()
            if name in seen: continue
            seen.add(name)
            pending.extend(modules.get(name, []))
        return sorted(seen)
    routes = []
    for name in files:
        if not name.endswith('.html') or ('/' in name and name != 'builder/index.html'): continue
        source = ROOT / name
        page = Page(); page.feed(source.read_text(errors='replace'))
        entries = []
        for url in page.scripts:
            target = local_path(source,url)
            if target and target.is_relative_to(ROOT): entries.append(str(target.relative_to(ROOT)))
        deps = closure(entries)
        relevant = [c for c in contracts if c['file'] in deps or c['file'] == name]
        routes.append({'route':name,'family':family(name),'canonical':page.canonical,'robots':page.robots,
                       'scripts':page.scripts,'styles':page.styles,'module_dependencies':deps,
                       'dom_ids':page.ids,'structured_data_blocks':page.structured_data,
                       'inline_script_blocks':page.inline_scripts,
                       'backend_contracts':[c for c in relevant if c['kind'] not in {'dom_id','dom_selector','event','environment_name'}]})
    payload = {'baseline':'cf5999d06b4934b7a83ab104cb20b06377ea74e7','method':'Source inventory; literal references and static import closure. Dynamic imports, variable table names and hosted infrastructure require manual review.',
               'routes':routes,'contracts':contracts,'module_imports':modules,
               'edge_functions':sorted(p.name for p in (ROOT/'Supabase/functions').iterdir() if p.is_dir()),
               'migrations':sorted(p.name for p in (ROOT/'Supabase/migrations').glob('*.sql'))}
    (OUT/'repository-map.json').write_text(json.dumps(payload,indent=2)+'\n')
    rows = ['# Customer and utility route inventory','',f'Baseline: `{payload["baseline"]}`. {len(routes)} deployed HTML files. Source templates and documentation are excluded.','',
            '| Route | Family | Scripts | JSON-LD |','|---|---|---|---|']
    for r in routes:
        rows.append(f'| `{r["route"]}` | {r["family"]} | {len(r["scripts"])} external / {r["inline_script_blocks"]} inline | {r["structured_data_blocks"]} |')
    rows += ['','## Counts','']+[f'- {k}: {v}' for k,v in sorted(Counter(r['family'] for r in routes).items())]
    (OUT/'route-inventory.md').write_text('\n'.join(rows)+'\n')
    rows = ['# Backend contract index','','Literal source references, with file and line. These are repository evidence, not a claim about the deployed schema.','']
    for kind in ('table','rest_endpoint','rpc','edge_function','function_endpoint','sql_table','sql_function','sql_policy','storage_key','environment_name'):
        rows += [f'## {kind}','','| Name | Source references |','|---|---|']
        names = sorted({c['name'] for c in contracts if c['kind']==kind})
        for name in names:
            refs = sorted({f'`{c["file"]}:{c["line"]}`' for c in contracts if c['kind']==kind and c['name']==name})
            rows.append(f'| `{name}` | '+', '.join(refs)+' |')
        rows.append('')
    (OUT/'backend-contracts.md').write_text('\n'.join(rows)+'\n')
    print(json.dumps({'routes':len(routes),'families':dict(Counter(r['family'] for r in routes)),'literal_contract_references':len(contracts),'edge_functions':len(payload['edge_functions']),'migrations':len(payload['migrations'])},indent=2))

if __name__ == '__main__': main()
