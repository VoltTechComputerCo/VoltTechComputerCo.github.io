\
#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

HEADER = ROOT / "src/templates/header.html"
CREATOR = ROOT / "src/pages/creator-hub-south-africa.html"
NAV = ROOT / "assets/css/navigation.css"
RESP = ROOT / "assets/css/responsive.css"
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
# Header / nav semantics
# ------------------------------------------------------------------
header = HEADER.read_text(encoding="utf-8")

old_nav = '''<nav class="primary-nav" id="primary-navigation" aria-label="Main navigation">
      <ul>
        <li><a href="{{ROOT}}store.html">Store</a></li>
        <li><a href="{{ROOT}}builder/index.html">PC Builder</a></li>
        <li><a href="{{ROOT}}index.html#services">Services</a></li>
        <li><a href="{{ROOT}}streaming-setup-south-africa.html">Stream Support</a></li>
        <li><a href="{{ROOT}}signal-scan.html">Signal Scan</a></li>
        <li><a href="{{ROOT}}static.html">STATIC</a></li>
        <li class="mobile-nav-cart"><a href="{{ROOT}}store.html?cart=1" data-cart-link aria-label="Open cart">Cart <span class="nav-cart-count" data-cart-count hidden></span></a></li>
      </ul>
    </nav>'''

new_nav = '''<nav class="primary-nav" id="primary-navigation" aria-label="Main navigation">
      <div class="mobile-nav-intro">
        <span class="micro">VOLTTECH / EXPLORE</span>
        <strong>Where do you want to go?</strong>
      </div>
      <ul>
        <li><a href="{{ROOT}}store.html"><span class="nav-copy"><b>Store</b><small>Components &amp; gear</small></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>
        <li><a href="{{ROOT}}builder/index.html"><span class="nav-copy"><b>PC Builder</b><small>Plan your system</small></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>
        <li><a href="{{ROOT}}index.html#services"><span class="nav-copy"><b>Services</b><small>Repair &amp; upgrades</small></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>
        <li class="nav-stream"><a href="{{ROOT}}streaming-setup-south-africa.html"><span class="nav-copy"><b>Stream Support</b><small>OBS, audio &amp; performance</small></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>
        <li><a href="{{ROOT}}signal-scan.html"><span class="nav-copy"><b>Signal Scan</b><small>Diagnose your next step</small></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>
        <li class="nav-static"><a href="{{ROOT}}static.html"><span class="nav-copy"><b>STATIC</b><small>Tech, gaming &amp; hardware</small></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>
        <li class="mobile-nav-cart"><a href="{{ROOT}}store.html?cart=1" data-cart-link aria-label="Open cart"><span class="nav-copy"><b>Cart</b><small>Your selected hardware</small></span><span class="nav-cart-count" data-cart-count hidden></span><span class="nav-arrow" aria-hidden="true">→</span></a></li>
      </ul>
    </nav>'''

header = replace_once(header, old_nav, new_nav, "premium navigation markup")
HEADER.write_text(header, encoding="utf-8")

# ------------------------------------------------------------------
# Creator Hub hero signal-stage markup
# ------------------------------------------------------------------
creator = CREATOR.read_text(encoding="utf-8")
old_hero_start = '''<section class="creator-hero" aria-labelledby="creator-title">
      <p class="eyebrow">SOUTH AFRICAN CREATOR HUB</p>
      <h1 id="creator-title">Find your next South African creator.</h1>
      <p class="lead">Browse VoltTech's curated Twitch directory and discover South African creators. Building your own channel? VoltTech Stream Support and Stream Scan are here for OBS, Streamlabs and creator-tech problems.</p>
      <div class="creator-hero-actions"><a class="button" href="streaming-setup-south-africa.html">Get Stream Support</a><a class="button button-secondary" href="stream-scan.html">Run Stream Scan</a></div>
      <div class="creator-feed-status" id="creatorFeedState" data-state="loading" role="status" aria-live="polite">'''

new_hero_start = '''<section class="creator-hero" aria-labelledby="creator-title">
      <div class="creator-hero-grid">
        <div class="creator-hero-copy">
          <p class="eyebrow">SOUTH AFRICAN CREATOR HUB</p>
          <h1 id="creator-title">Find your next South African creator.</h1>
          <p class="lead">Browse VoltTech's curated Twitch directory and discover South African creators. Building your own channel? VoltTech Stream Support and Stream Scan are here for OBS, Streamlabs and creator-tech problems.</p>
          <div class="creator-hero-actions"><a class="button" href="streaming-setup-south-africa.html">Get Stream Support</a><a class="button button-secondary" href="stream-scan.html">Run Stream Scan</a></div>
        </div>
        <div class="creator-signal-stage" aria-hidden="true">
          <div class="creator-signal-core"><span>SA</span><small>CREATOR SIGNAL</small></div>
          <span class="creator-orbit orbit-one"></span>
          <span class="creator-orbit orbit-two"></span>
          <span class="creator-node node-one">LIVE</span>
          <span class="creator-node node-two">OBS</span>
          <span class="creator-node node-three">TWITCH</span>
          <span class="creator-node node-four">AUDIO</span>
          <span class="creator-scan-line"></span>
        </div>
      </div>
      <div class="creator-feed-status" id="creatorFeedState" data-state="loading" role="status" aria-live="polite">'''

creator = replace_once(creator, old_hero_start, new_hero_start, "Creator Hub signal-stage hero")
CREATOR.write_text(creator, encoding="utf-8")

# ------------------------------------------------------------------
# Navigation CSS appended as a scoped step block
# ------------------------------------------------------------------
nav = NAV.read_text(encoding="utf-8")
start = "/* STEP 11.2I PREMIUM NAVIGATION START */"
end = "/* STEP 11.2I PREMIUM NAVIGATION END */"

nav_block = r'''/* STEP 11.2I PREMIUM NAVIGATION START */
.mobile-nav-intro,
.nav-copy small,
.nav-arrow { display: none; }

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
    border: 1px solid rgba(91,241,226,.18);
    border-radius: calc(var(--radius) * 1.35);
    background:
      radial-gradient(circle at 12% 0%, rgba(53,234,215,.10), transparent 32%),
      radial-gradient(circle at 86% 100%, rgba(166,86,255,.08), transparent 34%),
      rgba(2,12,14,.88);
    backdrop-filter: blur(12px) saturate(125%);
    -webkit-backdrop-filter: blur(12px) saturate(125%);
    box-shadow:
      0 22px 60px rgba(0,0,0,.38),
      inset 0 1px 0 rgba(255,255,255,.045);
  }

  .primary-nav::before {
    content:"";
    position:absolute;
    inset:0;
    pointer-events:none;
    opacity:.28;
    background-image:
      linear-gradient(rgba(80,240,226,.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(80,240,226,.05) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: linear-gradient(to bottom, black, transparent 78%);
  }

  .mobile-nav-intro {
    position: relative;
    z-index: 1;
    display: grid;
    gap: .15rem;
    padding: .2rem .2rem .9rem;
  }

  .mobile-nav-intro span { color: var(--teal); }
  .mobile-nav-intro strong {
    font-size: 1rem;
    letter-spacing: -.02em;
  }

  .primary-nav ul {
    position: relative;
    z-index: 1;
  }

  .primary-nav li { min-width: 0; }

  .primary-nav a {
    position: relative;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: .75rem;
    min-height: 6.25rem;
    padding: .9rem;
    overflow: hidden;
    border: 1px solid rgba(111,191,186,.22);
    border-radius: var(--radius);
    background:
      linear-gradient(150deg, rgba(54,104,104,.15), rgba(2,14,16,.58)),
      rgba(3,16,18,.46);
    backdrop-filter: blur(7px) saturate(122%);
    -webkit-backdrop-filter: blur(7px) saturate(122%);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.035),
      0 10px 26px rgba(0,0,0,.10);
  }

  .primary-nav a::before {
    content:"";
    position:absolute;
    inset:0;
    pointer-events:none;
    background: radial-gradient(circle at 12% 12%, rgba(53,234,215,.09), transparent 42%);
    opacity:.9;
  }

  .primary-nav .nav-copy {
    position: relative;
    z-index: 1;
    display: grid;
    gap: .22rem;
    min-width: 0;
  }

  .primary-nav .nav-copy b {
    color: var(--text);
    font-size: 1rem;
    font-weight: 600;
  }

  .primary-nav .nav-copy small {
    display: block;
    color: var(--text-muted);
    font: .63rem/1.35 var(--font-mono);
    letter-spacing: .035em;
    text-transform: uppercase;
  }

  .primary-nav .nav-arrow {
    position: relative;
    z-index: 1;
    display: block;
    flex: 0 0 auto;
    color: var(--teal);
    font-size: 1.05rem;
    text-shadow: 0 0 12px rgba(53,234,215,.34);
  }

  .primary-nav .nav-stream a {
    border-color: rgba(194,140,255,.34);
    background:
      linear-gradient(150deg, rgba(166,86,255,.14), rgba(15,8,24,.62)),
      rgba(15,8,24,.48);
  }

  .primary-nav .nav-stream a::before {
    background: radial-gradient(circle at 12% 12%, rgba(194,140,255,.12), transparent 44%);
  }

  .primary-nav .nav-stream .nav-arrow {
    color: #d9bbff;
    text-shadow: 0 0 12px rgba(194,140,255,.38);
  }

  .primary-nav .nav-static a {
    border-color: rgba(220,232,232,.18);
    background:
      linear-gradient(150deg, rgba(220,232,232,.055), rgba(4,12,14,.64)),
      rgba(3,14,16,.52);
  }

  .primary-nav a:hover,
  .primary-nav a:focus-visible,
  .primary-nav a[aria-current="page"] {
    transform: translateY(-1px);
    border-color: rgba(91,241,226,.55);
    box-shadow:
      0 0 22px rgba(53,234,215,.10),
      inset 0 1px 0 rgba(255,255,255,.07);
  }

  .primary-nav .nav-stream a:hover,
  .primary-nav .nav-stream a:focus-visible {
    border-color: rgba(194,140,255,.62);
    box-shadow:
      0 0 24px rgba(166,86,255,.14),
      inset 0 1px 0 rgba(255,255,255,.07);
  }

  .menu-toggle {
    min-width: 5.2rem;
    justify-content: center;
  }
}
/* STEP 11.2I PREMIUM NAVIGATION END */'''

if start in nav:
    nav = re.sub(re.escape(start)+r".*?"+re.escape(end), nav_block, nav, count=1, flags=re.S)
else:
    nav = nav.rstrip() + "\n\n" + nav_block + "\n"
NAV.write_text(nav, encoding="utf-8")

# ------------------------------------------------------------------
# Responsive refinements for nav
# ------------------------------------------------------------------
resp = RESP.read_text(encoding="utf-8")
resp_start = "/* STEP 11.2I NAV RESPONSIVE START */"
resp_end = "/* STEP 11.2I NAV RESPONSIVE END */"
resp_block = r'''/* STEP 11.2I NAV RESPONSIVE START */
@media (max-width: 56rem) {
  .header-inner {
    align-items: center;
  }

  .primary-nav {
    margin-top: .35rem;
    padding-top: 1rem;
  }
}

@media (max-width: 40rem) {
  .primary-nav {
    margin-inline: calc(var(--gutter) * -.15);
    padding: .8rem;
  }

  .primary-nav ul {
    gap: .55rem;
  }

  .primary-nav a {
    min-height: 6.8rem;
    padding: .85rem;
  }

  .primary-nav .nav-copy b {
    font-size: .93rem;
  }

  .primary-nav .nav-copy small {
    font-size: .57rem;
  }
}
/* STEP 11.2I NAV RESPONSIVE END */'''
if resp_start in resp:
    resp = re.sub(re.escape(resp_start)+r".*?"+re.escape(resp_end), resp_block, resp, count=1, flags=re.S)
else:
    resp = resp.rstrip() + "\n\n" + resp_block + "\n"
RESP.write_text(resp, encoding="utf-8")

# ------------------------------------------------------------------
# Global atmospheric backdrop
# ------------------------------------------------------------------
glass = GLASS.read_text(encoding="utf-8")
glass_start = "/* STEP 11.2I SITE ATMOSPHERE START */"
glass_end = "/* STEP 11.2I SITE ATMOSPHERE END */"
glass_block = r'''/* STEP 11.2I SITE ATMOSPHERE START */
/*
  The glass system needs an environment behind it. This adds quiet technical
  depth without becoming a wallpaper or compromising readability.
*/
body:not([data-page^="static"]):not([data-page^="admin"]) {
  background-color: #020b0d;
  background-image:
    radial-gradient(ellipse at 12% 8%, rgba(32,210,198,.085) 0%, rgba(32,210,198,.025) 23%, transparent 48%),
    radial-gradient(ellipse at 88% 28%, rgba(148,78,238,.055) 0%, transparent 38%),
    radial-gradient(ellipse at 38% 78%, rgba(24,129,128,.045) 0%, transparent 42%),
    linear-gradient(180deg, #020b0d 0%, #031012 48%, #02090b 100%);
  background-attachment: fixed;
}

body:not([data-page^="static"]):not([data-page^="admin"]) main {
  position: relative;
  isolation: isolate;
}

body:not([data-page^="static"]):not([data-page^="admin"]) main::before {
  content:"";
  position:absolute;
  inset:0;
  z-index:-2;
  pointer-events:none;
  opacity:.33;
  background-image:
    linear-gradient(rgba(62,197,187,.022) 1px, transparent 1px),
    linear-gradient(90deg, rgba(62,197,187,.022) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(to bottom, transparent 0%, black 8%, black 85%, transparent 100%);
}

body:not([data-page^="static"]):not([data-page^="admin"]) main::after {
  content:"";
  position:absolute;
  inset:0;
  z-index:-1;
  pointer-events:none;
  background:
    radial-gradient(circle at 18% 24%, rgba(53,234,215,.045), transparent 19rem),
    radial-gradient(circle at 81% 57%, rgba(166,86,255,.038), transparent 22rem),
    radial-gradient(circle at 42% 86%, rgba(53,234,215,.025), transparent 18rem);
}

body:not([data-page^="static"]):not([data-page^="admin"]) :is(
  .section,
  .home-section,
  .tool-section,
  .contact-section
) {
  position: relative;
  background: transparent;
}

/* Subtle depth banding helps long pages avoid featureless black gaps. */
body:not([data-page^="static"]):not([data-page^="admin"]) :is(
  .section,
  .home-section,
  .tool-section
):nth-of-type(even)::before {
  content:"";
  position:absolute;
  inset:0;
  z-index:-1;
  pointer-events:none;
  background: linear-gradient(110deg, rgba(15,61,63,.035), transparent 38%, rgba(74,38,104,.018));
}

/* Creator/streaming pages get a slightly stronger mixed accent environment. */
body[data-page="creator-hub-south-africa"],
body[data-page="streaming-support"],
body[data-page="stream-scan"] {
  background-image:
    radial-gradient(ellipse at 10% 10%, rgba(53,234,215,.09), transparent 38%),
    radial-gradient(ellipse at 88% 18%, rgba(166,86,255,.095), transparent 42%),
    radial-gradient(ellipse at 58% 72%, rgba(120,65,190,.04), transparent 44%),
    linear-gradient(180deg, #020b0d 0%, #050a0f 54%, #02090b 100%);
}

@media (max-width: 40rem) {
  body:not([data-page^="static"]):not([data-page^="admin"]) {
    background-attachment: scroll;
  }

  body:not([data-page^="static"]):not([data-page^="admin"]) main::before {
    background-size: 36px 36px;
    opacity:.24;
  }
}
/* STEP 11.2I SITE ATMOSPHERE END */'''
if glass_start in glass:
    glass = re.sub(re.escape(glass_start)+r".*?"+re.escape(glass_end), glass_block, glass, count=1, flags=re.S)
else:
    glass = glass.rstrip() + "\n\n" + glass_block + "\n"
GLASS.write_text(glass, encoding="utf-8")

# ------------------------------------------------------------------
# Creator Hub visual redesign
# ------------------------------------------------------------------
ccss = CREATOR_CSS.read_text(encoding="utf-8")
cstart = "/* STEP 11.2I CREATOR HUB DEPTH START */"
cend = "/* STEP 11.2I CREATOR HUB DEPTH END */"
cblock = r'''/* STEP 11.2I CREATOR HUB DEPTH START */
.creator-hub-page {
  position: relative;
  overflow: hidden;
}

.creator-hub-page::before {
  content:"";
  position:absolute;
  width:38rem;
  height:38rem;
  right:-12rem;
  top:-10rem;
  border-radius:50%;
  pointer-events:none;
  background: radial-gradient(circle, rgba(166,86,255,.12), rgba(53,234,215,.03) 42%, transparent 68%);
  filter: blur(10px);
}

.creator-hub-page::after {
  content:"";
  position:absolute;
  width:34rem;
  height:34rem;
  left:-15rem;
  top:28rem;
  border-radius:50%;
  pointer-events:none;
  background: radial-gradient(circle, rgba(53,234,215,.08), transparent 66%);
  filter: blur(12px);
}

.creator-hero {
  position:relative;
  max-width:none;
  padding: clamp(1rem,2.4vw,1.8rem);
  overflow:hidden;
  border:1px solid rgba(112,202,196,.16);
  border-radius:calc(var(--radius) * 1.3);
  background:
    linear-gradient(145deg, rgba(10,42,44,.22), rgba(9,5,16,.28)),
    rgba(2,13,15,.32);
  backdrop-filter: blur(7px) saturate(122%);
  -webkit-backdrop-filter: blur(7px) saturate(122%);
  box-shadow:
    0 20px 60px rgba(0,0,0,.16),
    inset 0 1px 0 rgba(255,255,255,.035);
}

.creator-hero::before {
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    radial-gradient(circle at 78% 20%, rgba(194,140,255,.10), transparent 31%),
    radial-gradient(circle at 15% 80%, rgba(53,234,215,.07), transparent 34%);
}

.creator-hero-grid {
  position:relative;
  z-index:1;
  display:grid;
  grid-template-columns:minmax(0,1.12fr) minmax(20rem,.88fr);
  gap:clamp(2rem,4vw,4.5rem);
  align-items:center;
  margin-bottom:1.25rem;
}

.creator-hero-copy {
  display:grid;
  gap:1rem;
}

.creator-hero-copy h1 {
  max-width:12ch;
  margin:0;
}

.creator-hero-copy .lead {
  max-width:48rem;
  color:var(--text-secondary);
}

.creator-signal-stage {
  position:relative;
  min-height:23rem;
  display:grid;
  place-items:center;
  overflow:hidden;
  border:1px solid rgba(194,140,255,.16);
  border-radius:50%;
  background:
    radial-gradient(circle at center, rgba(14,50,52,.20), rgba(10,7,16,.20) 50%, transparent 72%);
  box-shadow:
    inset 0 0 50px rgba(166,86,255,.035),
    0 0 42px rgba(53,234,215,.035);
}

.creator-signal-stage::before,
.creator-signal-stage::after {
  content:"";
  position:absolute;
  border-radius:50%;
  border:1px solid rgba(85,229,218,.16);
}

.creator-signal-stage::before { inset:14%; }
.creator-signal-stage::after {
  inset:29%;
  border-color:rgba(194,140,255,.22);
}

.creator-signal-core {
  position:relative;
  z-index:4;
  width:7rem;
  aspect-ratio:1;
  display:grid;
  place-items:center;
  align-content:center;
  gap:.15rem;
  border:1px solid rgba(89,241,226,.54);
  border-radius:50%;
  background:
    radial-gradient(circle at 35% 30%, rgba(53,234,215,.20), rgba(5,24,27,.74));
  box-shadow:
    0 0 30px rgba(53,234,215,.13),
    inset 0 0 18px rgba(53,234,215,.08);
}

.creator-signal-core span {
  color:#dffffb;
  font:700 1.8rem/1 var(--font-ui);
  letter-spacing:-.05em;
}

.creator-signal-core small {
  color:var(--teal);
  font:.48rem/1.2 var(--font-mono);
  letter-spacing:.12em;
}

.creator-orbit {
  position:absolute;
  border-radius:50%;
  border:1px dashed rgba(150,213,209,.13);
}

.orbit-one {
  inset:7%;
  transform:rotate(12deg);
}

.orbit-two {
  inset:21%;
  border-color:rgba(194,140,255,.14);
  transform:rotate(-18deg);
}

.creator-node {
  position:absolute;
  z-index:5;
  padding:.35rem .48rem;
  border:1px solid rgba(122,203,198,.20);
  border-radius:999px;
  background:rgba(3,17,19,.66);
  color:var(--text-muted);
  font:.52rem/1 var(--font-mono);
  letter-spacing:.08em;
  backdrop-filter:blur(5px);
  -webkit-backdrop-filter:blur(5px);
}

.node-one { top:14%; left:26%; color:#8bfff3; }
.node-two { top:31%; right:11%; color:#d9bbff; border-color:rgba(194,140,255,.30); }
.node-three { bottom:17%; right:24%; color:#d9bbff; border-color:rgba(194,140,255,.30); }
.node-four { bottom:26%; left:10%; color:#8bfff3; }

.creator-scan-line {
  position:absolute;
  z-index:2;
  left:50%;
  top:50%;
  width:44%;
  height:1px;
  transform-origin:left center;
  background:linear-gradient(90deg, rgba(53,234,215,.62), transparent);
  box-shadow:0 0 12px rgba(53,234,215,.22);
  animation:creator-scan 10s linear infinite;
}

@keyframes creator-scan {
  to { transform:rotate(360deg); }
}

.creator-feed-status {
  position:relative;
  z-index:2;
  border-color:rgba(101,206,199,.24);
}

.creator-panel {
  position:relative;
  overflow:hidden;
  border-color:rgba(111,191,186,.20);
}

.creator-panel::before {
  content:"";
  position:absolute;
  width:22rem;
  height:22rem;
  right:-11rem;
  top:-12rem;
  border-radius:50%;
  pointer-events:none;
  background:radial-gradient(circle, rgba(53,234,215,.055), transparent 68%);
}

.creator-player {
  overflow:hidden;
  border-color:rgba(194,140,255,.22);
  box-shadow:
    0 0 26px rgba(166,86,255,.045),
    inset 0 1px 0 rgba(255,255,255,.03);
}

.creator-player-video {
  background:
    linear-gradient(rgba(53,234,215,.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(53,234,215,.025) 1px, transparent 1px),
    radial-gradient(circle at 50% 50%, rgba(166,86,255,.045), transparent 55%),
    var(--black);
  background-size:32px 32px,32px 32px,auto,auto;
}

.creator-empty {
  background:rgba(3,16,18,.32);
  backdrop-filter:blur(5px);
  -webkit-backdrop-filter:blur(5px);
}

.creator-community article:first-child {
  border-color:rgba(53,234,215,.28);
  background:
    radial-gradient(circle at 90% 10%, rgba(53,234,215,.075), transparent 35%),
    rgba(3,16,18,.42);
}

.creator-community article:last-child {
  border-color:rgba(194,140,255,.26);
  background:
    radial-gradient(circle at 90% 10%, rgba(166,86,255,.08), transparent 35%),
    rgba(10,7,16,.42);
}

@media(max-width:820px){
  .creator-hero-grid {
    grid-template-columns:1fr;
  }

  .creator-signal-stage {
    min-height:19rem;
    max-width:32rem;
    width:100%;
    margin-inline:auto;
  }
}

@media(max-width:520px){
  .creator-hero {
    padding:1rem;
  }

  .creator-signal-stage {
    min-height:15rem;
  }

  .creator-signal-core {
    width:5.5rem;
  }

  .creator-node {
    font-size:.45rem;
    padding:.3rem .4rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .creator-scan-line { animation:none; transform:rotate(28deg); }
}
/* STEP 11.2I CREATOR HUB DEPTH END */'''

if cstart in ccss:
    ccss = re.sub(re.escape(cstart)+r".*?"+re.escape(cend), cblock, ccss, count=1, flags=re.S)
else:
    ccss = ccss.rstrip() + "\n\n" + cblock + "\n"
CREATOR_CSS.write_text(ccss, encoding="utf-8")

print("STEP 11.2I PREPARED")
