#!/usr/bin/env python3
"""Check generated clean pages, local dependencies and shell isolation."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
errors = []


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


def check_reference(source, ref, ids=None):
    url = urlsplit(ref)
    if url.scheme or url.netloc:
        if url.scheme not in ('https', 'mailto'):
            errors.append(f'{source}: unsupported URL scheme {ref}')
        return
    target = ROOT / unquote(url.path.lstrip('/')) if url.path.startswith('/') else source.parent / unquote(url.path)
    if not url.path:
        target = source
    if target.is_dir():
        target = target / 'index.html'
    if not target.is_file():
        errors.append(f'{source.relative_to(ROOT)}: missing {ref}')
    if not url.path and url.fragment and ids is not None and unquote(url.fragment) not in ids:
        errors.append(f'Missing anchor: {ref}')
    if url.path and url.fragment and target.is_file() and target.suffix == '.html':
        linked = Page()
        linked.feed(target.read_text())
        target_ids = {attrs.get('id') for _, attrs in linked.tags}
        if unquote(url.fragment) not in target_ids:
            errors.append(f'Missing destination anchor: {ref}')


def dependency_path(output, ref):
    url = urlsplit(ref)
    if url.scheme or url.netloc or not url.path:
        return None
    target = (ROOT / unquote(url.path.lstrip('/')) if url.path.startswith('/') else output.parent / unquote(url.path)).resolve()
    try:
        return target.relative_to(ROOT.resolve()).as_posix()
    except ValueError:
        return ref


subprocess.run([sys.executable, str(ROOT / 'scripts/build-clean-frontend.py'), '--check'], check=True)
for source in (ROOT / 'src/pages').glob('*.json'):
    import json
    output = ROOT / json.loads(source.read_text())['output']
    parser = Page()
    text = output.read_text()
    parser.feed(text)
    ids = [attrs['id'] for _, attrs in parser.tags if 'id' in attrs]
    duplicates = [name for name, count in Counter(ids).items() if count > 1]
    if duplicates:
        errors.append(f'Duplicate IDs: {duplicates}')
    for tag, attrs in parser.tags:
        for key in ('href', 'src'):
            if key in attrs:
                check_reference(output, attrs[key], ids)
        if tag == 'img' and not {'alt', 'width', 'height'} <= attrs.keys():
            errors.append('Image needs alt and dimensions')
        if 'style' in attrs or any(key.startswith('on') for key in attrs):
            errors.append('Inline styling/handler in generated page')
        for key in ('aria-controls', 'aria-labelledby', 'aria-describedby'):
            for ref in attrs.get(key, '').split():
                if ref not in ids:
                    errors.append(f'Missing ARIA target: {ref}')
        if tag == 'label' and attrs.get('for') not in ids:
            errors.append(f'Missing label target: {attrs}')
    for tag, count in [('h1', 1), ('main', 1), ('header', 1), ('footer', 1)]:
        if sum(t == tag for t, _ in parser.tags) != count:
            errors.append(f'Expected one {tag}')
    if 'data-vt-shell="clean"' not in text:
        errors.append('Missing service-worker isolation marker')
    if output.name == 'design-system.html' and 'content="noindex, nofollow"' not in text:
        errors.append('Inspection page must stay noindex')

    output_key = output.relative_to(ROOT).as_posix()
    preserved = {
        'index.html': {'supabase-config.js', 'streamer-feed.js', 'conversion-context.js'},
        'store.html': {'supabase-config.js', 'conversion-context.js'},
        'product.html': {'supabase-config.js', 'conversion-context.js'},
        'checkout.html': {'supabase-config.js'},
        'order-status.html': {'supabase-config.js'},
        # Transitional Step 3.1 dependency: Builder engines are preserved while Step 3.2 owns presentation migration.
        'builder/index.html': {'supabase-config.js', 'builder/styles.css'},
    }.get(output_key, set())
    for tag, attrs in parser.tags:
        ref = attrs.get('src', '') if tag == 'script' else attrs.get('href', '') if tag == 'link' and attrs.get('rel') == 'stylesheet' else ''
        dep = dependency_path(output, ref) if ref else None
        if dep and not dep.startswith('assets/') and dep not in preserved:
            errors.append(f'Legacy runtime dependency on converted page: {ref}')

for css in (ROOT / 'assets/css').rglob('*.css'):
    for ref in re.findall(r'url\([\'\"]?([^\)\'\"]+)', css.read_text()):
        check_reference(css, ref)
for js in (ROOT / 'assets/js').rglob('*.js'):
    code = js.read_text()
    for ref in re.findall(r'from\s+[\'\"]([^\'\"]+)', code):
        check_reference(js, ref)
    pure = js.parent.name != 'services' and js.name != 'home.js'
    if pure and re.search(r'\b(fetch|localStorage|sessionStorage|supabase|gtag)\b', code):
        errors.append(f'Unexpected integration in pure inspection shell: {js}')
    subprocess.run(['node', '--input-type=module', '--check'], input=code, text=True, check=True)
subprocess.run(['node', '--check', str(ROOT / 'sw.js')], check=True)
for name in ('notifications.js', 'streamer-feed.js', 'analytics.js', 'volttech-experience.js'):
    subprocess.run(['node', '--check', str(ROOT / name)], check=True)
if errors:
    print('\n'.join(errors), file=sys.stderr)
    sys.exit(1)
print('PASS: generated HTML, paths, anchors, ARIA references, module syntax and legacy isolation')
