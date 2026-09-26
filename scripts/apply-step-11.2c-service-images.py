#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

MAPPING = {
    "vt-repair.webp": "vt-service-repair-hands-on-motherboard.webp",
    "vt-performance.webp": "vt-service-performance-nzxt-build.webp",
    "vt-upgrades.webp": "vt-service-upgrades-components-flatlay.webp",
    "vt-windows.webp": "vt-service-windows-install.webp",
    "vt-malware.webp": "vt-service-security-motherboard-cpu.webp",
    "vt-streaming.webp": "vt-service-stream-support-showcase-build.webp",
}

NEW_ASSETS = set(MAPPING.values()) | {
    "vt-alt-upgrades-zotac-gpu.webp",
    "vt-alt-performance-air-cooler.webp",
    "vt-alt-performance-rog-gpu.webp",
}

for name in sorted(NEW_ASSETS):
    if not (ROOT / name).exists():
        print("STEP 11.2C RETRY FAILED")
        print(f"- required uploaded asset missing: {name}")
        sys.exit(1)

# Canonical source files: visible service bodies + social/SEO metadata heads.
source_files = [
    "src/pages/service-repair.html",
    "src/pages/service-repair.head.html",
    "src/pages/service-performance.html",
    "src/pages/service-performance.head.html",
    "src/pages/service-upgrades.html",
    "src/pages/service-upgrades.head.html",
    "src/pages/service-windows.html",
    "src/pages/service-windows.head.html",
    "src/pages/service-security.html",
    "src/pages/service-security.head.html",
    "src/pages/streaming-support.html",
    "src/pages/streaming-support.head.html",
]

changed = []

def replace_in(path):
    text = path.read_text(encoding="utf-8")
    original = text
    for old, new in MAPPING.items():
        text = text.replace(old, new)
    if text != original:
        path.write_text(text, encoding="utf-8")
        changed.append(path.relative_to(ROOT).as_posix())

for rel in source_files:
    p = ROOT / rel
    if not p.exists():
        print("STEP 11.2C RETRY FAILED")
        print(f"- expected source file missing: {rel}")
        sys.exit(1)
    replace_in(p)

# Also remove any retained reference from generated/compatibility root HTML.
# The build will regenerate canonical pages afterwards, but this prevents a
# compatibility page from keeping a deleted asset alive.
for p in sorted(ROOT.glob("*.html")):
    replace_in(p)

# Hard-delete the retired assets only after all references are switched.
for old in MAPPING:
    p = ROOT / old
    if p.exists():
        p.unlink()
        changed.append(old)

print(f"PASS: Step 11.2C retry prepared {len(set(changed))} changed path(s).")
for rel in sorted(set(changed)):
    print("-", rel)
