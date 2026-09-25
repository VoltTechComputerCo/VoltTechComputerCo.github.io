#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD = 'https://volttechcomputerco.github.io'
NEW = 'https://volttechcomputerco.co.za'

errors = []
generated = []

for config_path in sorted((ROOT / "src/pages").glob("*.json")):
    config = json.loads(config_path.read_text(encoding="utf-8"))
    output = config.get("output")
    if not output:
        errors.append(f"{config_path.relative_to(ROOT)}: missing output")
        continue
    generated.append(output)
    target = ROOT / output
    if not target.exists():
        errors.append(f"Generated output missing: {output}")
        continue
    text = target.read_text(encoding="utf-8")
    if OLD in text:
        errors.append(f"Generated output still contains github.io: {output}")

compatibility = [
    "privacy-policy.html",
    "streaming-setup-south-africa-dynamic.html",
    "exposure-scan.html",
]
for rel in compatibility:
    target = ROOT / rel
    if not target.exists():
        errors.append(f"Compatibility page missing: {rel}")
        continue
    if OLD in target.read_text(encoding="utf-8"):
        errors.append(f"Compatibility page still contains github.io: {rel}")

global_files = [
    "robots.txt",
    "sitemap.xml",
    "static-feed.xml",
    "static.html",
    "assets/js/services/site-config.js",
]
for rel in global_files:
    target = ROOT / rel
    if not target.exists():
        errors.append(f"Global domain file missing: {rel}")
        continue
    if OLD in target.read_text(encoding="utf-8"):
        errors.append(f"Global domain file still contains github.io: {rel}")

# Catch non-generated root public HTML residue, while explicitly grandfathering
# the 30 historical STATIC articles until Step 8.3.
generated_set = set(generated)
compat_set = set(compatibility)
for target in sorted(ROOT.glob("*.html")):
    rel = target.name
    if rel.startswith("static-"):
        continue
    if rel in generated_set or rel in compat_set:
        continue
    text = target.read_text(encoding="utf-8")
    if OLD in text:
        errors.append(f"Active root HTML still contains github.io: {rel}")

# The Builder output is nested but source-owned and should be part of generated.
if "builder/index.html" not in generated_set:
    errors.append("Builder is not represented in the clean page generator outputs.")

if errors:
    print("DOMAIN RESIDUE CHECK FAILED")
    for error in errors:
        print("- " + error)
    raise SystemExit(1)

print(f"PASS: {len(generated)} generated outputs + {len(compatibility)} compatibility pages are free of active github.io metadata.")
print(f"Canonical production host: {NEW}")
print("Historical static-*.html canonicals remain explicitly deferred to Step 8.3.")
