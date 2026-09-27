#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HOME = ROOT / "src/pages/home.html"
CSS = ROOT / "assets/css/pages/home.css"

def replace_once(text, old, new, label):
    count = text.count(old)
    if count == 1:
        print(f"Applying: {label}")
        return text.replace(old, new, 1), True
    if count == 0 and new in text:
        print(f"PASS: {label} already applied")
        return text, False
    raise RuntimeError(f"{label}: expected exactly one old match, found {count}")

home = HOME.read_text(encoding="utf-8")
changed = False

replacements = [
    (
        'PC HARDWARE / GAMING / CREATOR TECH',
        'PC HARDWARE / GAMING / STREAM SUPPORT',
        'hero kicker',
    ),
    (
        '<h1 id="hero-title">TUNE YOUR<br><span>ULTIMATE RIG.</span></h1>',
        '<h1 id="hero-title">BUILT FOR PERFORMANCE.<br><span>READY FOR ANYTHING.</span></h1>',
        'hero title',
    ),
    (
        '<p class="hero-strap">CUSTOM PCs. COMPONENTS. STREAM SUPPORT. EXPERT CARE.</p>',
        '<p class="hero-strap">CUSTOM PCs. COMPONENTS. UPGRADES. REPAIRS. STREAM SUPPORT.</p>',
        'hero strap',
    ),
    (
        '<a class="button button-secondary" href="{{ROOT}}streaming-setup-south-africa.html">STREAM SUPPORT',
        '<a class="button button-secondary hero-stream-button" href="{{ROOT}}streaming-setup-south-africa.html">STREAM SUPPORT',
        'hero Stream Support CTA class',
    ),
]

for old, new, label in replacements:
    home, did = replace_once(home, old, new, label)
    changed = changed or did

if changed:
    HOME.write_text(home, encoding="utf-8")
    print("Updated src/pages/home.html")
else:
    print("src/pages/home.html already matches Step 11.2E")

css = CSS.read_text(encoding="utf-8")
start = "/* STEP 11.2E HOMEPAGE HERO REFRESH START */"
end = "/* STEP 11.2E HOMEPAGE HERO REFRESH END */"

block = '''/* STEP 11.2E HOMEPAGE HERO REFRESH START */
/* The longer brand statement keeps the same two-line hierarchy without crowding the product collage. */
.hero-copy h1 {
  font-size: clamp(2.15rem, 3.45vw, 3.55rem);
  line-height: .98;
}

/* Homepage-only Stream Support CTA: transparent purple neon treatment. */
.hero-stream-button {
  border-color: rgba(194, 140, 255, .92);
  background: rgba(194, 140, 255, .025);
  color: #eadcff;
  box-shadow:
    0 0 0 1px rgba(194, 140, 255, .08),
    0 0 14px rgba(166, 86, 255, .24),
    0 0 28px rgba(166, 86, 255, .10),
    inset 0 0 12px rgba(194, 140, 255, .035);
  text-shadow: 0 0 10px rgba(218, 187, 255, .18);
}

.hero-stream-button span {
  color: #d9bbff;
  filter: drop-shadow(0 0 4px rgba(194, 140, 255, .35));
}

.hero-stream-button:hover,
.hero-stream-button:focus-visible {
  border-color: #d9bbff;
  background: rgba(194, 140, 255, .085);
  color: #fff;
  box-shadow:
    0 0 0 1px rgba(218, 187, 255, .16),
    0 0 18px rgba(166, 86, 255, .42),
    0 0 38px rgba(166, 86, 255, .20),
    inset 0 0 16px rgba(194, 140, 255, .07);
}

.hero-stream-button:hover span,
.hero-stream-button:focus-visible span {
  color: #fff;
  filter: drop-shadow(0 0 7px rgba(218, 187, 255, .65));
}

@media (max-width: 40rem) {
  .hero-copy h1 {
    font-size: clamp(2rem, 8.3vw, 2.9rem);
  }
}
/* STEP 11.2E HOMEPAGE HERO REFRESH END */'''

if start in css:
    pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.S)
    css2, n = pattern.subn(block, css, count=1)
    if n != 1:
        raise RuntimeError("Could not safely replace existing Step 11.2E CSS block")
    css = css2
    print("Refreshed existing Step 11.2E CSS block")
else:
    css = css.rstrip() + "\n\n" + block + "\n"
    print("Added Step 11.2E CSS block")

CSS.write_text(css, encoding="utf-8")
print("STEP 11.2E PREPARED")
