\
#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HOME = ROOT / "src/pages/home.html"
STORE = ROOT / "src/pages/store.html"
COMPONENTS = ROOT / "assets/css/components.css"
HOME_CSS = ROOT / "assets/css/pages/home.css"
COMMERCE_CSS = ROOT / "assets/css/pages/commerce.css"

def replace_once(text, old, new, label):
    count = text.count(old)
    if count == 1:
        print(f"Applying: {label}")
        return text.replace(old, new, 1), True
    if count == 0 and new in text:
        print(f"PASS: {label} already applied")
        return text, False
    raise RuntimeError(f"{label}: expected exactly one old match, found {count}")

# -------------------------
# Homepage semantic classes
# -------------------------
home = HOME.read_text(encoding="utf-8")
home_replacements = [
    (
        'class="button hero-build-button"',
        'class="button hero-build-button vt-image-glass vt-image-glass--teal"',
        'teal glass class on Plan Your Build',
    ),
    (
        'class="button button-secondary hero-stream-button"',
        'class="button button-secondary hero-stream-button vt-image-glass vt-image-glass--purple"',
        'purple glass class on Stream Support',
    ),
    (
        '<span class="hero-note micro">VOLTTECH / CONCEPT VISUAL</span>',
        '<span class="hero-note micro vt-image-glass vt-image-glass--neutral">VOLTTECH / CONCEPT VISUAL</span>',
        'neutral glass class on hero image note',
    ),
    (
        '<span>REMOTE ACROSS SOUTH AFRICA</span>',
        '<span class="vt-image-glass vt-image-glass--purple">REMOTE ACROSS SOUTH AFRICA</span>',
        'purple glass class on Stream Support image label',
    ),
]
for old, new, label in home_replacements:
    home, _ = replace_once(home, old, new, label)
HOME.write_text(home, encoding="utf-8")

# -------------------------
# Store hero image caption
# -------------------------
store = STORE.read_text(encoding="utf-8")
store, _ = replace_once(
    store,
    '<figcaption class="micro">THE DETAILS MAKE THE DIFFERENCE / VOLTTECH</figcaption>',
    '<figcaption class="micro vt-image-glass vt-image-glass--teal">THE DETAILS MAKE THE DIFFERENCE / VOLTTECH</figcaption>',
    'teal glass class on store hero caption',
)
STORE.write_text(store, encoding="utf-8")

# -------------------------
# Shared reusable glass UI
# -------------------------
components = COMPONENTS.read_text(encoding="utf-8")
start = "/* STEP 11.2G IMAGE OVERLAY GLASS SYSTEM START */"
end = "/* STEP 11.2G IMAGE OVERLAY GLASS SYSTEM END */"

glass_block = '''/* STEP 11.2G IMAGE OVERLAY GLASS SYSTEM START */
/*
  Use only when UI floats directly over an image.
  Do not apply to cards/panels that contain their own image within the card border.
*/
.vt-image-glass {
  --vt-glass-border: rgba(255,255,255,.20);
  --vt-glass-bg-top: rgba(255,255,255,.06);
  --vt-glass-bg-bottom: rgba(3,14,16,.22);
  --vt-glass-glow: rgba(255,255,255,.08);
  --vt-glass-glow-strong: rgba(255,255,255,.14);
  --vt-glass-text: var(--text);
  border: 1px solid var(--vt-glass-border);
  background:
    linear-gradient(180deg, var(--vt-glass-bg-top), var(--vt-glass-bg-bottom)),
    rgba(3,14,16,.18);
  color: var(--vt-glass-text);
  backdrop-filter: blur(7px) saturate(125%);
  -webkit-backdrop-filter: blur(7px) saturate(125%);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--vt-glass-border) 20%, transparent),
    0 0 16px var(--vt-glass-glow),
    inset 0 1px 0 rgba(255,255,255,.08);
}

.vt-image-glass--teal {
  --vt-glass-border: rgba(78,239,224,.82);
  --vt-glass-bg-top: rgba(92,255,241,.12);
  --vt-glass-bg-bottom: rgba(7,65,64,.20);
  --vt-glass-glow: rgba(34,224,210,.18);
  --vt-glass-glow-strong: rgba(34,224,210,.34);
  --vt-glass-text: #e5fffc;
}

.vt-image-glass--purple {
  --vt-glass-border: rgba(194,140,255,.84);
  --vt-glass-bg-top: rgba(216,187,255,.12);
  --vt-glass-bg-bottom: rgba(66,37,96,.18);
  --vt-glass-glow: rgba(166,86,255,.20);
  --vt-glass-glow-strong: rgba(166,86,255,.36);
  --vt-glass-text: #f5efff;
}

.vt-image-glass--neutral {
  --vt-glass-border: rgba(220,241,241,.22);
  --vt-glass-bg-top: rgba(226,248,248,.065);
  --vt-glass-bg-bottom: rgba(2,12,14,.24);
  --vt-glass-glow: rgba(82,225,218,.09);
  --vt-glass-glow-strong: rgba(82,225,218,.15);
  --vt-glass-text: var(--text-secondary);
}

.button.vt-image-glass:hover,
.button.vt-image-glass:focus-visible,
a.vt-image-glass:hover,
a.vt-image-glass:focus-visible {
  border-color: color-mix(in srgb, var(--vt-glass-border) 88%, white);
  color: #fff;
  transform: translateY(-1px);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--vt-glass-border) 28%, transparent),
    0 0 21px var(--vt-glass-glow-strong),
    inset 0 1px 0 rgba(255,255,255,.12);
}

@media (max-width: 40rem) {
  .vt-image-glass {
    backdrop-filter: blur(5px) saturate(120%);
    -webkit-backdrop-filter: blur(5px) saturate(120%);
  }
}
/* STEP 11.2G IMAGE OVERLAY GLASS SYSTEM END */'''

if start in components:
    pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.S)
    components, n = pattern.subn(glass_block, components, count=1)
    if n != 1:
        raise RuntimeError("Could not refresh Step 11.2G glass system")
else:
    components = components.rstrip() + "\n\n" + glass_block + "\n"
COMPONENTS.write_text(components, encoding="utf-8")

# -------------------------
# Homepage-specific mapping
# -------------------------
home_css = HOME_CSS.read_text(encoding="utf-8")

old_start = "/* STEP 11.2F HERO CTA GLASS BUTTONS START */"
old_end = "/* STEP 11.2F HERO CTA GLASS BUTTONS END */"
new_start = "/* STEP 11.2G HOMEPAGE IMAGE GLASS MAPPING START */"
new_end = "/* STEP 11.2G HOMEPAGE IMAGE GLASS MAPPING END */"

home_block = '''/* STEP 11.2G HOMEPAGE IMAGE GLASS MAPPING START */
/* Preserve the Step 11.2E headline scale. */
.hero-copy h1 {
  font-size: clamp(2.15rem, 3.45vw, 3.55rem);
  line-height: .98;
}

/* Hero CTAs now inherit the lighter shared image-glass blur. */
.hero-build-button,
.hero-stream-button {
  border-width: 1.5px;
  background-clip: padding-box;
  text-shadow: 0 0 8px rgba(255,255,255,.07);
}

.hero-build-button span {
  color: #90fff4;
  filter: drop-shadow(0 0 4px rgba(78,239,224,.34));
}

.hero-stream-button span {
  color: #d9bbff;
  filter: drop-shadow(0 0 4px rgba(194,140,255,.34));
}

/* Small labels that sit directly on imagery share the same glass language. */
.hero-note.vt-image-glass {
  padding: .3rem .45rem;
}

.stream-support-image span.vt-image-glass {
  padding: .26rem .38rem;
  background:
    linear-gradient(180deg, rgba(216,187,255,.12), rgba(66,37,96,.18)),
    rgba(12,8,18,.22);
  border-color: rgba(194,140,255,.72);
}

/* On mobile these facts sit on the hero artwork, so give them restrained glass separation. */
@media (max-width: 40rem) {
  .hero-copy h1 {
    font-size: clamp(2rem, 8.3vw, 2.9rem);
  }

  .hero-facts > span {
    padding: .46rem .52rem;
    border: 1px solid rgba(78,239,224,.26);
    background:
      linear-gradient(180deg, rgba(78,239,224,.055), rgba(3,32,33,.16)),
      rgba(2,12,14,.20);
    backdrop-filter: blur(5px) saturate(120%);
    -webkit-backdrop-filter: blur(5px) saturate(120%);
    box-shadow:
      0 0 12px rgba(34,224,210,.07),
      inset 0 1px 0 rgba(255,255,255,.045);
  }
}
/* STEP 11.2G HOMEPAGE IMAGE GLASS MAPPING END */'''

if old_start in home_css:
    pattern = re.compile(re.escape(old_start) + r".*?" + re.escape(old_end), re.S)
    home_css, n = pattern.subn(home_block, home_css, count=1)
    if n != 1:
        raise RuntimeError("Could not replace Step 11.2F homepage glass block")
elif new_start in home_css:
    pattern = re.compile(re.escape(new_start) + r".*?" + re.escape(new_end), re.S)
    home_css, n = pattern.subn(home_block, home_css, count=1)
    if n != 1:
        raise RuntimeError("Could not refresh Step 11.2G homepage mapping")
else:
    home_css = home_css.rstrip() + "\n\n" + home_block + "\n"
HOME_CSS.write_text(home_css, encoding="utf-8")

# -------------------------
# Store hero image caption
# -------------------------
commerce = COMMERCE_CSS.read_text(encoding="utf-8")
commerce_start = "/* STEP 11.2G STORE IMAGE GLASS MAPPING START */"
commerce_end = "/* STEP 11.2G STORE IMAGE GLASS MAPPING END */"

commerce_block = '''/* STEP 11.2G STORE IMAGE GLASS MAPPING START */
/* The store hero caption floats directly over the hero photograph. */
.store-hero-visual figcaption.vt-image-glass {
  background:
    linear-gradient(180deg, rgba(78,239,224,.075), rgba(3,34,35,.18)),
    rgba(2,12,14,.24);
  border-top-color: rgba(78,239,224,.52);
  color: #d9f4f1;
  box-shadow:
    0 -8px 24px rgba(34,224,210,.055),
    inset 0 1px 0 rgba(255,255,255,.055);
}

/*
  Catalogue/product card captions intentionally stay unchanged:
  their images live inside the card/media boundary, so they are excluded
  from the direct-image-overlay glass rule.
*/
/* STEP 11.2G STORE IMAGE GLASS MAPPING END */'''

if commerce_start in commerce:
    pattern = re.compile(re.escape(commerce_start) + r".*?" + re.escape(commerce_end), re.S)
    commerce, n = pattern.subn(commerce_block, commerce, count=1)
    if n != 1:
        raise RuntimeError("Could not refresh Step 11.2G store mapping")
else:
    commerce = commerce.rstrip() + "\n\n" + commerce_block + "\n"
COMMERCE_CSS.write_text(commerce, encoding="utf-8")

print("STEP 11.2G PREPARED")
