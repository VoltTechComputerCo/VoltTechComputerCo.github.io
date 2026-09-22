#!/usr/bin/env python3
"""Generate ready-to-upload HTML. Python standard library; no runtime build."""
import argparse
import html
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
CSS = ('tokens', 'base', 'layout', 'navigation', 'components', 'forms', 'responsive', 'print')


def render(source):
    config = json.loads(source.read_text())
    output = Path(config['output'])
    if output.is_absolute() or '..' in output.parts or output.suffix != '.html':
        raise ValueError(f'Unsafe output path: {output}')
    prefix = '../' * (len(output.parts) - 1)
    styles = [f'assets/css/{name}.css' for name in CSS] + config.get('styles', [])
    values = {
        'TITLE': html.escape(config['title']),
        'DESCRIPTION': html.escape(config['description'], quote=True),
        'ROBOTS': html.escape(config['robots'], quote=True),
        'HEADER': (ROOT / 'src/templates/header.html').read_text().strip(),
        'FOOTER': (ROOT / 'src/templates/footer.html').read_text().strip(),
        'CONTENT': source.with_suffix('.html').read_text().strip(),
        'STYLES': '\n'.join(f'  <link rel="stylesheet" href="{prefix}{path}">' for path in styles),
        'SCRIPTS': '\n'.join(f'  <script type="module" src="{prefix}{path}"></script>' for path in config.get('scripts', [])),
    }
    page = (ROOT / 'src/templates/page.html').read_text()
    for key, value in values.items():
        page = page.replace('{{' + key + '}}', value)
    page = page.replace('{{ROOT}}', prefix)
    if re.search(r'\{\{[A-Z_]+\}\}', page):
        raise ValueError(f'Unresolved template token in {source}')
    return ROOT / output, page


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail if committed HTML differs from source')
    args = parser.parse_args()
    stale = []
    for source in sorted((ROOT / 'src/pages').glob('*.json')):
        target, content = render(source)
        if args.check:
            if not target.exists() or target.read_text() != content:
                stale.append(str(target.relative_to(ROOT)))
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content)
        print(('Checked ' if args.check else 'Built ') + str(target.relative_to(ROOT)))
    if stale:
        print('Regenerate: ' + ', '.join(stale), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
