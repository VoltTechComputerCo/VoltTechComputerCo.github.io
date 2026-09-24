#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD = 'https://volttechcomputerco.github.io'
NEW = 'https://volttechcomputerco.co.za'

FILES = [
    "privacy-policy.html",
    "streaming-setup-south-africa-dynamic.html",
    "exposure-scan.html",
]

changed = []
for rel in FILES:
    path = ROOT / rel
    if not path.exists():
        raise SystemExit(f"Missing compatibility page: {rel}")
    before = path.read_text(encoding="utf-8")
    after = before.replace(OLD, NEW)
    if after != before:
        path.write_text(after, encoding="utf-8")
        changed.append(rel)
    if OLD in after:
        raise SystemExit(f"Old canonical host remains in {rel}")

print("Compatibility domain sync complete.")
if changed:
    print("Updated: " + ", ".join(changed))
else:
    print("No compatibility-page changes required.")
