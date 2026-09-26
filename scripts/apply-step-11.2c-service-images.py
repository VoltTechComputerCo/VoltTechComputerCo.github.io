#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

PRIMARY_MAP = {
    'vt-repair.webp': 'vt-service-repair-hands-on-motherboard.webp',
    'vt-performance.webp': 'vt-service-performance-nzxt-build.webp',
    'vt-upgrades.webp': 'vt-service-upgrades-components-flatlay.webp',
    'vt-windows.webp': 'vt-service-windows-install.webp',
    'vt-malware.webp': 'vt-service-security-motherboard-cpu.webp',
    'vt-streaming.webp': 'vt-service-stream-support-showcase-build.webp',
}

required_new = set(PRIMARY_MAP.values()) | {
    'vt-alt-upgrades-zotac-gpu.webp',
    'vt-alt-performance-air-cooler.webp',
    'vt-alt-performance-rog-gpu.webp',
}

for name in required_new:
    if not (ROOT / name).exists():
        print('STEP 11.2C FAILED')
        print(f'- required uploaded asset missing: {name}')
        sys.exit(1)

candidate_suffixes = {'.html', '.json'}
changed = []
for path in sorted((ROOT/'src/pages').rglob('*')):
    if path.is_file() and path.suffix.lower() in candidate_suffixes:
        text = path.read_text(encoding='utf-8')
        original = text
        for old, new in PRIMARY_MAP.items():
            text = text.replace(old, new)
        if text != original:
            path.write_text(text, encoding='utf-8')
            changed.append(path.relative_to(ROOT).as_posix())

# Remove the retired root-level assets once references are switched.
for old in PRIMARY_MAP:
    old_path = ROOT / old
    if old_path.exists():
        old_path.unlink()
        changed.append(old)

print(f'Step 11.2C prepared {len(changed)} changed path(s).')
for rel in changed:
    print('-', rel)
