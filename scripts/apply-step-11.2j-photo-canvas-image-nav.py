\
#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

HEADER = ROOT / "src/templates/header.html"
CREATOR = ROOT / "src/pages/creator-hub-south-africa.html"
NAV = ROOT / "assets/css/navigation.css"
GLASS = ROOT / "assets/css/glass-system.css"
CREATOR_CSS = ROOT / "assets/css/pages/creator-hub.css"

def replace_once(text, old, new, label):
    count = text.count(old)
    if count == 1:
        print("Applying:", label)
        return text.replace(old, new, 1)
    if count == 0 and new in text:
        print("PASS already applied:", label)
        return text
    raise RuntimeError(f"{label}: expected exactly one old match, found {count}")

# ------------------------------------------------------------------
# Image-backed navigation classes + mobile Creator Hub route
# ------------------------------------------------------------------
header = HEADER.read_text(encoding="utf-8")

nav_replacements = [
    (
        '<li><a href="{{ROOT}}store.html"><span class="nav-copy"><b>Store</b><small>Components &amp; gear</small></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>',
        '<li class="nav-store"><a href="{{ROOT}}store.html"><span class="nav-copy"><b>Store</b><small>Components &amp; gear</small></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>',
        'Store nav image class'
    ),
    (
        '<li><a href="{{ROOT}}builder/index.html"><span class="nav-copy"><b>PC Builder</b><small>Plan your system</small></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>',
        '<li class="nav-builder"><a href="{{ROOT}}builder/index.html"><span class="nav-copy"><b>PC Builder</b><small>Plan your system</small></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>',
        'Builder nav image class'
    ),
    (
        '<li><a href="{{ROOT}}index.html#services"><span class="nav-copy"><b>Services</b><small>Repair &amp; upgrades</small></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>',
        '<li class="nav-services"><a href="{{ROOT}}index.html#services"><span class="nav-copy"><b>Services</b><small>Repair &amp; upgrades</small></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>',
        'Services nav image class'
    ),
    (
        '<li><a href="{{ROOT}}signal-scan.html"><span class="nav-copy"><b>Signal Scan</b><small>Diagnose your next step</small></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>',
        '<li class="nav-scan"><a href="{{ROOT}}signal-scan.html"><span class="nav-copy"><b>Signal Scan</b><small>Diagnose your next step</small></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>',
        'Signal Scan nav image class'
    ),
    (
        '<li class="nav-static"><a href="{{ROOT}}static.html"><span class="nav-copy"><b>STATIC</b><small>Tech, gaming &amp; hardware</small></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>',
        '<li class="mobile-nav-creator nav-creator"><a href="{{ROOT}}creator-hub-south-africa.html"><span class="nav-copy"><b>Creator Hub</b><small>South African creators</small></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>\n        <li class="nav-static"><a href="{{ROOT}}static.html"><span class="nav-copy"><b>STATIC</b><small>Tech, gaming &amp; hardware</small></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>',
        'Creator Hub mobile nav tile'
    ),
]

for old, new, label in nav_replacements:
    header = replace_once(header, old, new, label)

HEADER.write_text(header, encoding="utf-8")

# ------------------------------------------------------------------
# Replace synthetic Creator signal stage with real imagery
# ------------------------------------------------------------------
creator = CREATOR.read_text(encoding="utf-8")

old_stage = '''<div class="creator-signal-stage" aria-hidden="true">
          <div class="creator-signal-core"><span>SA</span><small>CREATOR SIGNAL</small></div>
          <span class="creator-orbit orbit-one"></span>
          <span class="creator-orbit orbit-two"></span>
          <span class="creator-node node-one">LIVE</span>
          <span class="creator-node node-two">OBS</span>
          <span class="creator-node node-three">TWITCH</span>
          <span class="creator-node node-four">AUDIO</span>
          <span class="creator-scan-line"></span>
        </div>'''

new_stage = '''<figure class="creator-hero-visual">
          <img src="{{ROOT}}vt-px-creator-desk.webp" alt="Creator desk and streaming setup" width="1600" height="1067" loading="eager" decoding="async">
          <figcaption class="vt-image-glass vt-image-glass--neutral"><span>CREATOR SETUP</span><b>OBS / AUDIO / STREAM PERFORMANCE</b></figcaption>
        </figure>'''

creator = replace_once(creator, old_stage, new_stage, "real Creator Hub hero image")
CREATOR.write_text(creator, encoding="utf-8")

# ------------------------------------------------------------------
# Replace 11.2I navigation block with image-card navigation
# ------------------------------------------------------------------
nav = NAV.read_text(encoding="utf-8")

old_start = "/* STEP 11.2I PREMIUM NAVIGATION START */"
old_end = "/* STEP 11.2I PREMIUM NAVIGATION END */"
new_start = "/* STEP 11.2J IMAGE CARD NAVIGATION START */"
new_end = "/* STEP 11.2J IMAGE CARD NAVIGATION END */"

nav_block = r'''/* STEP 11.2J IMAGE CARD NAVIGATION START */
.mobile-nav-intro,
.nav-copy small,
.nav-arrow,
.mobile-nav-creator { display: none; }

.primary-nav .nav-copy b {
  font: inherit;
  font-weight: 500;
}

@media (max-width: 56rem) {
  .site-header {
    position: sticky;
    top: 0;
    z-index: 80;
  }

  .primary-nav {
    position: relative;
    overflow: hidden;
    padding: 1rem;
    border: 1px solid rgba(111,191,186,.20);
    border-radius: calc(var(--radius) * 1.35);
    background:
      linear-gradient(180deg, rgba(4,18,20,.90), rgba(2,10,12,.96));
    backdrop-filter: blur(10px) saturate(118%);
    -webkit-backdrop-filter: blur(10px) saturate(118%);
    box-shadow:
      0 24px 64px rgba(0,0,0,.42),
      inset 0 1px 0 rgba(255,255,255,.04);
  }

  .mobile-nav-intro {
    display: grid;
    gap: .15rem;
    padding: .2rem .2rem .9rem;
  }

  .mobile-nav-intro span { color: var(--teal); }

  .mobile-nav-intro strong {
    font-size: 1rem;
    letter-spacing: -.02em;
  }

  .mobile-nav-creator { display: list-item; }

  .primary-nav ul {
    position: relative;
    z-index: 1;
  }

  .primary-nav li {
    min-width: 0;
    --nav-card-image: url('../../vt-px-pc-hardware.webp');
    --nav-card-accent: rgba(53,234,215,.48);
  }

  .primary-nav .nav-store {
    --nav-card-image: url('../../vt-own-hardware.webp');
  }

  .primary-nav .nav-builder {
    --nav-card-image: url('../../vt-stock-modern-build.webp');
  }

  .primary-nav .nav-services {
    --nav-card-image: url('../../vt-px-technician-service.webp');
  }

  .primary-nav .nav-stream {
    --nav-card-image: url('../../vt-px-streaming-setup.webp');
    --nav-card-accent: rgba(194,140,255,.54);
  }

  .primary-nav .nav-scan {
    --nav-card-image: url('../../vt-px-pc-diagnostics.webp');
  }

  .primary-nav .nav-creator {
    --nav-card-image: url('../../vt-px-creator-desk.webp');
    --nav-card-accent: rgba(194,140,255,.44);
  }

  .primary-nav .nav-static {
    --nav-card-image: url('../../STATIC-logo-master.png');
    --nav-card-accent: rgba(232,235,234,.28);
  }

  .primary-nav .mobile-nav-cart {
    --nav-card-image: url('../../vt-own-gpu-product.webp');
  }

  .primary-nav a {
    position: relative;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: .75rem;
    min-height: 7rem;
    padding: 1rem;
    overflow: hidden;
    border: 1px solid rgba(114,176,171,.20);
    border-radius: var(--radius);
    background: rgba(4,16,18,.88);
    backdrop-filter: blur(5px) saturate(112%);
    -webkit-backdrop-filter: blur(5px) saturate(112%);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.035),
      0 10px 24px rgba(0,0,0,.14);
    isolation: isolate;
  }

  .primary-nav a::before {
    content:"";
    position:absolute;
    z-index:-1;
    inset:0 0 0 38%;
    background-image:
      linear-gradient(90deg,
        rgba(4,16,18,.98) 0%,
        rgba(4,16,18,.80) 20%,
        rgba(4,16,18,.20) 72%,
        rgba(4,16,18,.06) 100%),
      var(--nav-card-image);
    background-size: cover;
    background-position: center;
    filter: saturate(.78) contrast(1.08);
    transform: scale(1.015);
    transition: transform .22s ease, filter .22s ease;
  }

  .primary-nav a::after {
    content:"";
    position:absolute;
    z-index:-1;
    left:0;
    bottom:0;
    width:62%;
    height:1px;
    background: linear-gradient(90deg, var(--nav-card-accent), transparent);
    opacity:.72;
  }

  .primary-nav .nav-copy {
    position: relative;
    z-index: 1;
    display: grid;
    gap: .22rem;
    min-width: 0;
    max-width: 61%;
  }

  .primary-nav .nav-copy b {
    color: #f2f7f6;
    font-size: 1rem;
    font-weight: 650;
  }

  .primary-nav .nav-copy small {
    display: block;
    color: #92a9a6;
    font: .62rem/1.35 var(--font-mono);
    letter-spacing: .035em;
    text-transform: uppercase;
  }

  .primary-nav .nav-arrow {
    position: relative;
    z-index: 1;
    display: block;
    align-self: flex-start;
    flex: 0 0 auto;
    color: #d8eeeb;
    font-size: 1rem;
  }

  .primary-nav .nav-stream .nav-arrow,
  .primary-nav .nav-creator .nav-arrow {
    color: #d9bbff;
  }

  .primary-nav a:hover,
  .primary-nav a:focus-visible,
  .primary-nav a[aria-current="page"] {
    border-color: var(--nav-card-accent);
    background: rgba(4,16,18,.82);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--nav-card-accent) 18%, transparent),
      0 16px 32px rgba(0,0,0,.18),
      inset 0 1px 0 rgba(255,255,255,.06);
    transform: translateY(-1px);
  }

  .primary-nav a:hover::before,
  .primary-nav a:focus-visible::before {
    transform: scale(1.055);
    filter: saturate(.92) contrast(1.11);
  }

  .menu-toggle {
    min-width: 5.2rem;
    justify-content: center;
  }
}

@media (max-width: 40rem) {
  .primary-nav {
    padding: .8rem;
  }

  .primary-nav ul {
    gap: .55rem;
  }

  .primary-nav a {
    min-height: 7.4rem;
    padding: .9rem;
  }

  .primary-nav .nav-copy b {
    font-size: .94rem;
  }

  .primary-nav .nav-copy small {
    font-size: .56rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .primary-nav a::before { transition:none; }
}
/* STEP 11.2J IMAGE CARD NAVIGATION END */'''

if old_start in nav:
    nav, n = re.subn(
        re.escape(old_start) + r".*?" + re.escape(old_end),
        nav_block,
        nav,
        count=1,
        flags=re.S
    )
    if n != 1:
        raise RuntimeError("Could not replace Step 11.2I navigation block")
elif new_start in nav:
    nav, n = re.subn(
        re.escape(new_start) + r".*?" + re.escape(new_end),
        nav_block,
        nav,
        count=1,
        flags=re.S
    )
    if n != 1:
        raise RuntimeError("Could not refresh Step 11.2J navigation block")
else:
    nav = nav.rstrip() + "\n\n" + nav_block + "\n"

NAV.write_text(nav, encoding="utf-8")

# ------------------------------------------------------------------
# Replace artificial glow atmosphere with page-specific photography
# ------------------------------------------------------------------
glass = GLASS.read_text(encoding="utf-8")

old_start = "/* STEP 11.2I SITE ATMOSPHERE START */"
old_end = "/* STEP 11.2I SITE ATMOSPHERE END */"
new_start = "/* STEP 11.2J PHOTOGRAPHIC SITE CANVAS START */"
new_end = "/* STEP 11.2J PHOTOGRAPHIC SITE CANVAS END */"

photo_block = r'''/* STEP 11.2J PHOTOGRAPHIC SITE CANVAS START */
/*
  Real imagery now provides the depth behind VoltTech glass.
  Artificial radial glow fields from Step 11.2I are intentionally removed.
*/
body:not([data-page^="static"]):not([data-page^="admin"]) {
  --vt-page-art: url('../../vt-drive-workbench.webp');
  --vt-page-art-position: center;
  position: relative;
  isolation: isolate;
  background: #02090b;
}

body:not([data-page^="static"]):not([data-page^="admin"])::before {
  content:"";
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(180deg,
      rgba(1,8,10,.42) 0%,
      rgba(1,8,10,.54) 46%,
      rgba(1,8,10,.68) 100%),
    linear-gradient(90deg,
      rgba(1,8,10,.34) 0%,
      transparent 28%,
      transparent 72%,
      rgba(1,8,10,.28) 100%),
    var(--vt-page-art);
  background-size: cover;
  background-position: var(--vt-page-art-position);
  background-repeat: no-repeat;
  filter: saturate(.68) contrast(1.08) brightness(.88);
}

body:not([data-page^="static"]):not([data-page^="admin"]) > * {
  position: relative;
  z-index: 1;
}

/* Page-specific real imagery */
body[data-page="home"] {
  --vt-page-art: url('../../vt-drive-workbench.webp');
  --vt-page-art-position: center;
}

body[data-page="store"] {
  --vt-page-art: url('../../vt-own-hardware.webp');
  --vt-page-art-position: center 42%;
}

body[data-page="builder"] {
  --vt-page-art: url('../../vt-stock-modern-build.webp');
  --vt-page-art-position: center 38%;
}

body[data-page="signal-scan"] {
  --vt-page-art: url('../../vt-px-pc-diagnostics.webp');
  --vt-page-art-position: center;
}

body[data-page="streaming-support"],
body[data-page="stream-scan"] {
  --vt-page-art: url('../../vt-px-streaming-setup.webp');
  --vt-page-art-position: center 32%;
}

body[data-page="creator-hub-south-africa"] {
  --vt-page-art: url('../../vt-drive-creator-desk.webp');
  --vt-page-art-position: center 36%;
}

body[data-page="service-repair"] {
  --vt-page-art: url('../../bg-repair.webp');
}

body[data-page="service-upgrades"] {
  --vt-page-art: url('../../bg-upgrades.webp');
}

body[data-page="service-performance"] {
  --vt-page-art: url('../../bg-performance.webp');
}

body[data-page="service-security"] {
  --vt-page-art: url('../../bg-malware.webp');
}

body[data-page="service-windows"] {
  --vt-page-art: url('../../bg-windows.webp');
}

body[data-page="account"],
body[data-page="legal"],
body[data-page="privacy"],
body[data-page^="customer"],
body[data-page^="order"],
body[data-page="checkout"] {
  --vt-page-art: url('../../vt-own-desk.webp');
  --vt-page-art-position: center;
}

/* Sections stay transparent so the photographic canvas remains visible. */
body:not([data-page^="static"]):not([data-page^="admin"]) :is(
  main,
  .section,
  .home-section,
  .tool-section,
  .contact-section
) {
  background: transparent;
}

/* No ambient glow pseudo-elements over the page. */
body:not([data-page^="static"]):not([data-page^="admin"]) main::before,
body:not([data-page^="static"]):not([data-page^="admin"]) main::after,
body:not([data-page^="static"]):not([data-page^="admin"]) :is(
  .section,
  .home-section,
  .tool-section
):nth-of-type(even)::before {
  content: none;
}

@media (max-width: 56rem) {
  body:not([data-page^="static"]):not([data-page^="admin"])::before {
    background-image:
      linear-gradient(180deg,
        rgba(1,8,10,.46) 0%,
        rgba(1,8,10,.56) 48%,
        rgba(1,8,10,.68) 100%),
      linear-gradient(90deg,
        rgba(1,8,10,.22) 0%,
        transparent 26%,
        transparent 74%,
        rgba(1,8,10,.18) 100%),
      var(--vt-page-art);
    filter: saturate(.70) contrast(1.06) brightness(.90);
  }
}

@media print {
  body::before { display:none !important; }
}
/* STEP 11.2J PHOTOGRAPHIC SITE CANVAS END */'''

if old_start in glass:
    glass, n = re.subn(
        re.escape(old_start) + r".*?" + re.escape(old_end),
        photo_block,
        glass,
        count=1,
        flags=re.S
    )
    if n != 1:
        raise RuntimeError("Could not replace Step 11.2I atmosphere block")
elif new_start in glass:
    glass, n = re.subn(
        re.escape(new_start) + r".*?" + re.escape(new_end),
        photo_block,
        glass,
        count=1,
        flags=re.S
    )
    if n != 1:
        raise RuntimeError("Could not refresh Step 11.2J photo canvas block")
else:
    glass = glass.rstrip() + "\n\n" + photo_block + "\n"

GLASS.write_text(glass, encoding="utf-8")

# ------------------------------------------------------------------
# Replace synthetic Creator Hub visuals with photo-led design
# ------------------------------------------------------------------
ccss = CREATOR_CSS.read_text(encoding="utf-8")

old_start = "/* STEP 11.2I CREATOR HUB DEPTH START */"
old_end = "/* STEP 11.2I CREATOR HUB DEPTH END */"
new_start = "/* STEP 11.2J CREATOR HUB PHOTO DIRECTION START */"
new_end = "/* STEP 11.2J CREATOR HUB PHOTO DIRECTION END */"

creator_block = r'''/* STEP 11.2J CREATOR HUB PHOTO DIRECTION START */
.creator-hub-page {
  position: relative;
}

.creator-hub-page::before,
.creator-hub-page::after {
  content: none;
}

.creator-hero {
  position: relative;
  max-width: none;
  padding: clamp(1rem,2.4vw,1.8rem);
  overflow: hidden;
  border: 1px solid rgba(112,202,196,.18);
  border-radius: calc(var(--radius) * 1.3);
  background:
    linear-gradient(145deg, rgba(3,18,20,.54), rgba(2,10,12,.42));
  backdrop-filter: blur(7px) saturate(118%);
  -webkit-backdrop-filter: blur(7px) saturate(118%);
  box-shadow:
    0 20px 60px rgba(0,0,0,.18),
    inset 0 1px 0 rgba(255,255,255,.04);
}

.creator-hero::before { content:none; }

.creator-hero-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0,1fr) minmax(22rem,.96fr);
  gap: clamp(1.5rem,3.5vw,3.5rem);
  align-items: stretch;
  margin-bottom: 1.25rem;
}

.creator-hero-copy {
  display: grid;
  align-content: center;
  gap: 1rem;
  padding-block: clamp(.5rem,2vw,1.5rem);
}

.creator-hero-copy h1 {
  max-width: 12ch;
  margin: 0;
}

.creator-hero-copy .lead {
  max-width: 46rem;
  color: var(--text-secondary);
}

.creator-hero-visual {
  position: relative;
  min-height: 24rem;
  margin: 0;
  overflow: hidden;
  border: 1px solid rgba(126,190,185,.20);
  border-radius: var(--radius);
  background: #050b0c;
  box-shadow:
    0 16px 38px rgba(0,0,0,.24),
    inset 0 1px 0 rgba(255,255,255,.035);
}

.creator-hero-visual::after {
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    linear-gradient(90deg, rgba(2,12,14,.28), transparent 42%),
    linear-gradient(180deg, transparent 52%, rgba(2,10,12,.52));
}

.creator-hero-visual img {
  width:100%;
  height:100%;
  min-height:24rem;
  object-fit:cover;
  object-position:center;
  filter:saturate(.88) contrast(1.05);
}

.creator-hero-visual figcaption {
  position:absolute;
  z-index:2;
  left:1rem;
  right:1rem;
  bottom:1rem;
  display:grid;
  gap:.1rem;
  padding:.65rem .8rem;
}

.creator-hero-visual figcaption span {
  color:var(--teal);
  font:.58rem var(--font-mono);
  letter-spacing:.10em;
}

.creator-hero-visual figcaption b {
  color:var(--text);
  font-size:.78rem;
}

.creator-feed-status {
  position: relative;
  z-index: 2;
  border-color: rgba(101,206,199,.24);
}

.creator-panel {
  position: relative;
  overflow: hidden;
  border-color: rgba(111,191,186,.20);
}

.creator-panel::before { content:none; }

.creator-player {
  overflow: hidden;
  border-color: rgba(126,190,185,.24);
  box-shadow:
    0 14px 32px rgba(0,0,0,.16),
    inset 0 1px 0 rgba(255,255,255,.03);
}

.creator-player-video {
  background:
    linear-gradient(rgba(53,234,215,.022) 1px, transparent 1px),
    linear-gradient(90deg, rgba(53,234,215,.022) 1px, transparent 1px),
    rgba(1,8,10,.72);
  background-size: 32px 32px, 32px 32px, auto;
}

.creator-empty {
  background: rgba(3,16,18,.40);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.creator-community article:first-child,
.creator-community article:last-child {
  border-color: rgba(111,191,186,.22);
  background:
    linear-gradient(145deg, rgba(20,54,56,.18), rgba(2,13,15,.48)),
    rgba(3,16,18,.38);
}

@media(max-width:820px) {
  .creator-hero-grid {
    grid-template-columns: 1fr;
  }

  .creator-hero-visual {
    min-height: 19rem;
  }

  .creator-hero-visual img {
    min-height: 19rem;
  }
}

@media(max-width:520px) {
  .creator-hero {
    padding: 1rem;
  }

  .creator-hero-visual {
    min-height: 15rem;
  }

  .creator-hero-visual img {
    min-height: 15rem;
  }

  .creator-hero-visual figcaption {
    left:.7rem;
    right:.7rem;
    bottom:.7rem;
  }
}
/* STEP 11.2J CREATOR HUB PHOTO DIRECTION END */'''

if old_start in ccss:
    ccss, n = re.subn(
        re.escape(old_start) + r".*?" + re.escape(old_end),
        creator_block,
        ccss,
        count=1,
        flags=re.S
    )
    if n != 1:
        raise RuntimeError("Could not replace Step 11.2I Creator Hub block")
elif new_start in ccss:
    ccss, n = re.subn(
        re.escape(new_start) + r".*?" + re.escape(new_end),
        creator_block,
        ccss,
        count=1,
        flags=re.S
    )
    if n != 1:
        raise RuntimeError("Could not refresh Step 11.2J Creator Hub block")
else:
    ccss = ccss.rstrip() + "\n\n" + creator_block + "\n"

CREATOR_CSS.write_text(ccss, encoding="utf-8")

print("STEP 11.2J PREPARED")
