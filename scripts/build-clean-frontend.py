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
    glass_style = 'assets/css/glass-system.css'
    glass_version = config.get('glass_version', '20261003-site-neon1')
    if glass_version:
        glass_style += f"?v={glass_version}"
    styles = [f'assets/css/{name}.css' for name in CSS] + config.get('styles', []) + [glass_style, 'assets/css/persistent-header.css?v=20261007']
    light_sources = set(["assets/css/tokens.css","assets/css/navigation.css","assets/css/components.css","assets/css/responsive.css","assets/css/pages/home.css","assets/css/pages/error.css","assets/css/glass-system.css","assets/css/persistent-header.css","assets/css/notifications.css","assets/css/pages/account.css","assets/css/components/customer-workflow.css","assets/css/pages/customer-records.css","admin-builds.css","phase6-provenance.css","commerce-ui.css","notifications.css","portal-shell.css","customer-shell.css","v4-nav.css","commerce/store.css","admin-store.css","admin-catalogue-qa.css","admin-catalogue-qa-refinement.css","admin-catalogue-media-resilience.css","admin-catalogue-contracts.css","admin-hub.css","operations-hub.css","assets/css/pages/document.css","assets/css/pages/commerce.css","assets/css/pages/transactions.css","assets/css/pages/creator-hub.css","assets/css/pages/creator-register.css","assets/css/pages/legal.css","exposure-scan.css","assets/css/store-filters.css","assets/css/pages/services.css","assets/css/pages/privacy-center.css","assets/css/pages/signal-scan.css","assets/css/static-legacy/static-amd-ryzen-5-5500f-7500-budget-cpus.css","assets/css/pages/static-article.css","assets/css/static-legacy/static-apple-iphone-duo-first-foldable.css","assets/css/static-legacy/static-building-a-pc-2026.css","assets/css/static-legacy/static-dlss-5-nba-2k27-neural-rendering.css","assets/css/static-legacy/static-driver-crashes.css","assets/css/static-legacy/static-gpu-price-history.css","assets/css/static-legacy/static-lan-culture.css","assets/css/static-legacy/static-lego-playstation-1911-piece.css","assets/css/static-legacy/static-ltt-best-pc-2026.css","assets/css/static-legacy/static-malware-disguises.css","assets/css/static-legacy/static-metroid-ravenous-switch-2.css","assets/css/static-legacy/static-nopixel-v-rockstar-gta-rp.css","assets/css/static-legacy/static-nvidia-hugging-face.css","assets/css/static-legacy/static-pc-throttling.css","assets/css/static-legacy/static-physint-xbox-publishing.css","assets/css/static-legacy/static-ram-myth.css","assets/css/static-legacy/static-rpcs3-direct-disc-playback.css","assets/css/static-legacy/static-sa-varsity-esports-pretoria-2026.css","assets/css/static-legacy/static-scalebound-kamiya.css","assets/css/static-legacy/static-silent-pc-build.css","assets/css/static-legacy/static-south-african-counter-strike-vs-gaming-masters-2026.css","assets/css/static-legacy/static-ssd-vs-hdd-2026.css","assets/css/static-legacy/static-starcraft-open-world-shooter-2030.css","assets/css/static-legacy/static-tim-sweeney-hardware-crisis.css","assets/css/static-legacy/static-valheim-1-0-deep-north-launch.css","assets/css/static-legacy/static-white-house-tetris.css","assets/css/static-legacy/static-windows-vs-linux-gaming.css","assets/css/static-legacy/static-xbox-cloud-gaming-hour-limits.css","assets/css/static-legacy/static-xbox-game-pass-september-2026-stacked-lineup.css","assets/css/static-legacy/static-zelda-40th-anniversary-direct-today.css","assets/css/pages/static.css","assets/css/pages/stream-scan.css","assets/css/pages/streaming-support.css","assets/css/pages/builder.css","assets/css/pages/builder-foundation.css"])
    themed_styles = []
    for style in styles:
        themed_styles.append(style)
        original = style.split('?')[0]
        if original in light_sources:
            themed_styles.append(original[:-4] + '.light.css?v=20261007-white')
    styles = themed_styles
    values = {
        'PAGE': html.escape(source.stem, quote=True),
        'TITLE': html.escape(config['title']),
        'DESCRIPTION': html.escape(config['description'], quote=True),
        'ROBOTS': html.escape(config['robots'], quote=True),
        'HEADER': (ROOT / 'src/templates/header.html').read_text().strip(),
        'FOOTER': (ROOT / 'src/templates/footer.html').read_text().strip(),
        'CONTENT': source.with_suffix('.html').read_text().strip(),
        'STYLES': '\n'.join(f'  <link rel="stylesheet" href="{prefix}{path}">' for path in styles),
        'SCRIPTS': '\n'.join(f'  <script defer src="{prefix}{path}"></script>' for path in config.get('classic_scripts', [])) + '\n' + '\n'.join(f'  <script type="module" src="{prefix}{path}"></script>' for path in config.get('scripts', [])),
        'HEAD': source.with_suffix('.head.html').read_text().strip() if source.with_suffix('.head.html').exists() else '',
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
