\
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

# Add a dedicated homepage-only class to the primary hero CTA so both buttons can share a common glass system.
replacements = [
    (
        '<a class="button" href="{{ROOT}}builder/index.html">PLAN YOUR BUILD',
        '<a class="button hero-build-button" href="{{ROOT}}builder/index.html">PLAN YOUR BUILD',
        'hero build CTA class',
    ),
]

for old, new, label in replacements:
    home, did = replace_once(home, old, new, label)
    changed = changed or did

if changed:
    HOME.write_text(home, encoding="utf-8")
    print("Updated src/pages/home.html")
else:
    print("src/pages/home.html already matches Step 11.2F")

css = CSS.read_text(encoding="utf-8")

old_start = "/* STEP 11.2E HOMEPAGE HERO REFRESH START */"
old_end = "/* STEP 11.2E HOMEPAGE HERO REFRESH END */"

new_start = "/* STEP 11.2F HERO CTA GLASS BUTTONS START */"
new_end = "/* STEP 11.2F HERO CTA GLASS BUTTONS END */"

block = '''/* STEP 11.2F HERO CTA GLASS BUTTONS START */
/* Preserve the tightened hero title scale introduced in Step 11.2E. */
.hero-copy h1 {
  font-size: clamp(2.15rem, 3.45vw, 3.55rem);
  line-height: .98;
}

/* Shared homepage-only glass CTA system. */
.hero-build-button,
.hero-stream-button {
  position: relative;
  border-width: 1.5px;
  border-style: solid;
  background-clip: padding-box;
  backdrop-filter: blur(18px) saturate(145%);
  -webkit-backdrop-filter: blur(18px) saturate(145%);
  box-shadow:
    0 0 0 1px var(--hero-cta-ring),
    0 0 18px var(--hero-cta-glow-soft),
    0 0 42px var(--hero-cta-glow-soft),
    inset 0 1px 0 rgba(255, 255, 255, .09),
    inset 0 0 22px var(--hero-cta-glow-inner);
  text-shadow: 0 0 8px rgba(255, 255, 255, .08);
}

.hero-build-button span,
.hero-stream-button span {
  filter: drop-shadow(0 0 5px currentColor);
}

.hero-build-button:hover,
.hero-build-button:focus-visible,
.hero-stream-button:hover,
.hero-stream-button:focus-visible {
  transform: translateY(-1px);
  box-shadow:
    0 0 0 1px var(--hero-cta-ring-strong),
    0 0 22px var(--hero-cta-glow-strong),
    0 0 52px var(--hero-cta-glow-soft),
    inset 0 1px 0 rgba(255, 255, 255, .14),
    inset 0 0 26px var(--hero-cta-glow-inner-strong);
}

/* Teal glass button */
.hero-build-button {
  --hero-cta-ring: rgba(95, 255, 240, .10);
  --hero-cta-ring-strong: rgba(131, 255, 243, .18);
  --hero-cta-glow-soft: rgba(34, 224, 210, .22);
  --hero-cta-glow-strong: rgba(34, 224, 210, .38);
  --hero-cta-glow-inner: rgba(70, 255, 242, .05);
  --hero-cta-glow-inner-strong: rgba(70, 255, 242, .09);
  border-color: rgba(78, 239, 224, .92);
  background:
    linear-gradient(180deg, rgba(116, 255, 244, .17), rgba(17, 89, 86, .18)),
    rgba(15, 39, 42, .18);
  color: #d7fffb;
}

.hero-build-button span {
  color: #90fff4;
}

/* Purple glass button */
.hero-stream-button {
  --hero-cta-ring: rgba(213, 171, 255, .10);
  --hero-cta-ring-strong: rgba(226, 198, 255, .18);
  --hero-cta-glow-soft: rgba(166, 86, 255, .24);
  --hero-cta-glow-strong: rgba(166, 86, 255, .42);
  --hero-cta-glow-inner: rgba(194, 140, 255, .05);
  --hero-cta-glow-inner-strong: rgba(194, 140, 255, .09);
  border-color: rgba(194, 140, 255, .92);
  background:
    linear-gradient(180deg, rgba(216, 187, 255, .15), rgba(59, 32, 89, .16)),
    rgba(24, 16, 34, .18);
  color: #f3ebff;
}

.hero-stream-button span {
  color: #d9bbff;
}

@media (max-width: 40rem) {
  .hero-copy h1 {
    font-size: clamp(2rem, 8.3vw, 2.9rem);
  }

  .hero-build-button,
  .hero-stream-button {
    backdrop-filter: blur(14px) saturate(140%);
    -webkit-backdrop-filter: blur(14px) saturate(140%);
  }
}
/* STEP 11.2F HERO CTA GLASS BUTTONS END */'''

if old_start in css:
    pattern = re.compile(re.escape(old_start) + r".*?" + re.escape(old_end), re.S)
    css2, n = pattern.subn(block, css, count=1)
    if n != 1:
        raise RuntimeError("Could not safely replace Step 11.2E CSS block")
    css = css2
    print("Replaced Step 11.2E CSS block with Step 11.2F")
elif new_start in css:
    pattern = re.compile(re.escape(new_start) + r".*?" + re.escape(new_end), re.S)
    css2, n = pattern.subn(block, css, count=1)
    if n != 1:
        raise RuntimeError("Could not safely refresh existing Step 11.2F CSS block")
    css = css2
    print("Refreshed existing Step 11.2F CSS block")
else:
    css = css.rstrip() + "\\n\\n" + block + "\\n"
    print("Added Step 11.2F CSS block")

CSS.write_text(css, encoding="utf-8")
print("STEP 11.2F PREPARED")
