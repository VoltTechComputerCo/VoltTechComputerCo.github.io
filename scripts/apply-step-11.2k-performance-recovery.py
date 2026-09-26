#!/usr/bin/env python3
from pathlib import Path
import subprocess
import re

ROOT = Path(__file__).resolve().parents[1]
BASE = "8afcec8f450c9dbe06d8e351cbfa61a0327890be"

restore_paths = [
    "src/templates/header.html",
    "src/pages/creator-hub-south-africa.html",
    "assets/css/navigation.css",
    "assets/css/responsive.css",
    "assets/css/glass-system.css",
    "assets/css/pages/creator-hub.css",
]

for rel in restore_paths:
    data = subprocess.check_output(["git", "show", f"{BASE}:{rel}"], cwd=ROOT)
    path = ROOT / rel
    path.write_bytes(data)
    print("Restored", rel, "from certified Step 11.2H")

glass_path = ROOT / "assets/css/glass-system.css"
glass = glass_path.read_text(encoding="utf-8")

glass = re.sub(r"^\s*-webkit-backdrop-filter:[^;]+;\s*$", "", glass, flags=re.M)
glass = re.sub(r"^\s*backdrop-filter:[^;]+;\s*$", "", glass, flags=re.M)

glass = glass.replace(
    "background: rgba(2, 9, 10, .82);",
    "background: rgba(2, 9, 10, .96);"
)

glass = glass.replace(
    "--vt-glass-panel-top: rgba(28, 55, 58, .24);",
    "--vt-glass-panel-top: rgba(28, 55, 58, .30);"
)
glass = glass.replace(
    "--vt-glass-panel-bottom: rgba(2, 13, 15, .48);",
    "--vt-glass-panel-bottom: rgba(2, 13, 15, .66);"
)
glass = glass.replace(
    "--vt-glass-panel-solid: rgba(3, 16, 18, .48);",
    "--vt-glass-panel-solid: rgba(3, 16, 18, .60);"
)

marker = (
    "/* STEP 11.2K PERFORMANCE RECOVERY\n"
    "   Global glass uses colour/alpha/borders instead of backdrop blur.\n"
    "   Real backdrop blur remains only on the small image-overlay glass system\n"
    "   defined in components.css.\n"
    "*/"
)
glass = marker + "\n\n" + glass
glass_path.write_text(glass, encoding="utf-8")

print("Removed sitewide backdrop-filter composition from glass-system.css")
print("STEP 11.2K PREPARED")
