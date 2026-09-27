#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HEADER = ROOT / "src/templates/header.html"
NAV = ROOT / "assets/css/navigation.css"
GLASS = ROOT / "assets/css/glass-system.css"

def replace_once(text, old, new, label):
    count = text.count(old)
    if count == 1:
        print("Applying:", label)
        return text.replace(old, new, 1)
    if count == 0 and new in text:
        print("PASS already applied:", label)
        return text
    raise RuntimeError(f"{label}: expected one old match, found {count}")

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
        <span class="micro">VOLTTECH / SYSTEM MAP</span>
        <strong>Choose your route.</strong>
      </div>
      <ul>
        <li class="nav-tile nav-store"><a href="{{ROOT}}store.html"><span class="nav-copy"><small>HARDWARE</small><b>Store</b><em>Components &amp; gear</em></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>
        <li class="nav-tile nav-builder"><a href="{{ROOT}}builder/index.html"><span class="nav-copy"><small>BUILD</small><b>PC Builder</b><em>Plan your system</em></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>
        <li class="nav-tile nav-services"><a href="{{ROOT}}index.html#services"><span class="nav-copy"><small>SUPPORT</small><b>Services</b><em>Repair &amp; upgrades</em></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>
        <li class="nav-tile nav-stream"><a href="{{ROOT}}streaming-setup-south-africa.html"><span class="nav-copy"><small>STREAM</small><b>Stream Support</b><em>OBS, audio &amp; performance</em></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>
        <li class="nav-tile nav-scan"><a href="{{ROOT}}signal-scan.html"><span class="nav-copy"><small>DIAGNOSTICS</small><b>Signal Scan</b><em>Find your next step</em></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>
        <li class="nav-tile nav-creator mobile-nav-creator"><a href="{{ROOT}}creator-hub-south-africa.html"><span class="nav-copy"><small>CREATORS</small><b>Creator Hub</b><em>South African streams</em></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>
        <li class="nav-tile nav-static"><a href="{{ROOT}}static.html"><span class="nav-copy"><small>EDITORIAL</small><b>STATIC</b><em>Tech, gaming &amp; hardware</em></span><span class="nav-arrow" aria-hidden="true">↗</span></a></li>
        <li class="nav-tile nav-cart mobile-nav-cart"><a href="{{ROOT}}store.html?cart=1" data-cart-link aria-label="Open cart"><span class="nav-copy"><small>CHECKOUT</small><b>Cart</b><em>Your selected hardware</em></span><span class="nav-cart-count" data-cart-count hidden></span><span class="nav-arrow" aria-hidden="true">→</span></a></li>
      </ul>
    </nav>'''

header = replace_once(header, old_nav, new_nav, "rich menu markup")
HEADER.write_text(header, encoding="utf-8")

nav = NAV.read_text(encoding="utf-8")
start = "/* STEP 11.2M COLOUR IMAGE MENU START */"
end = "/* STEP 11.2M COLOUR IMAGE MENU END */"

menu_block = '''/* STEP 11.2M COLOUR IMAGE MENU START */
.mobile-nav-intro,.nav-copy small,.nav-copy em,.nav-arrow,.mobile-nav-creator{display:none}
.primary-nav .nav-copy b{font:inherit;font-weight:500}

@media(max-width:56rem){
  .primary-nav{
    position:relative;width:100%;margin:0;padding:.9rem;overflow:hidden;
    border:1px solid rgba(100,170,165,.22);
    border-radius:calc(var(--radius)*1.25);
    background:linear-gradient(180deg,rgba(7,21,23,.97),rgba(2,10,12,.98));
    box-shadow:0 18px 42px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.045)
  }
  .mobile-nav-intro{display:grid;gap:.1rem;padding:.05rem .1rem .85rem}
  .mobile-nav-intro span{color:var(--teal);font-size:.55rem;letter-spacing:.13em}
  .mobile-nav-intro strong{color:var(--text);font-size:1rem;letter-spacing:-.02em}
  .mobile-nav-creator{display:list-item}
  .primary-nav ul{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem}

  .nav-tile{min-width:0;--nav-rgb:74,238,220;--nav-image:url("../../vt-own-hardware.webp")}
  .nav-store{--nav-rgb:74,238,220;--nav-image:url("../../vt-own-hardware.webp")}
  .nav-builder{--nav-rgb:86,150,255;--nav-image:url("../../vt-px-modern-pc.webp")}
  .nav-services{--nav-rgb:255,151,72;--nav-image:url("../../bg-repair.webp")}
  .nav-stream{--nav-rgb:194,140,255;--nav-image:url("../../bg-streaming.webp")}
  .nav-scan{--nav-rgb:105,255,177;--nav-image:url("../../bg-signal.webp")}
  .nav-creator{--nav-rgb:255,102,196;--nav-image:url("../../vt-px-creator-desk.webp")}
  .nav-static{--nav-rgb:255,89,89;--nav-image:url("../../vt-px-gaming-desk.webp")}
  .nav-cart{--nav-rgb:255,198,82;--nav-image:url("../../vt-own-gpu-product.webp")}

  .primary-nav .nav-tile>a{
    position:relative;isolation:isolate;display:flex;align-items:flex-end;justify-content:space-between;
    min-height:7.4rem;padding:.9rem;overflow:hidden;
    border:1px solid rgba(var(--nav-rgb),.72);border-radius:var(--radius);
    background:
      linear-gradient(90deg,rgba(3,12,14,.97) 0%,rgba(3,12,14,.91) 36%,rgba(var(--nav-rgb),.16) 66%,rgba(3,12,14,.10) 100%),
      var(--nav-image);
    background-size:cover;background-position:center;background-repeat:no-repeat;
    color:var(--text);text-decoration:none;
    box-shadow:
      0 0 0 1px rgba(var(--nav-rgb),.08),
      0 0 16px rgba(var(--nav-rgb),.16),
      inset 0 1px 0 rgba(255,255,255,.07),
      inset 0 0 24px rgba(var(--nav-rgb),.035);
    transition:transform var(--transition),border-color var(--transition),box-shadow var(--transition)
  }
  .primary-nav .nav-tile>a::after{
    content:"";position:absolute;left:.85rem;right:42%;bottom:0;height:2px;
    background:linear-gradient(90deg,rgba(var(--nav-rgb),.95),transparent);
    box-shadow:0 0 10px rgba(var(--nav-rgb),.44)
  }
  .primary-nav .nav-copy{position:relative;z-index:1;display:grid;gap:.12rem;width:62%;min-width:0;text-align:left}
  .primary-nav .nav-copy small{display:block;color:rgb(var(--nav-rgb));font:700 .5rem/1.2 var(--font-mono);letter-spacing:.12em;text-shadow:0 0 10px rgba(var(--nav-rgb),.32)}
  .primary-nav .nav-copy b{display:block;color:#f3f8f7;font:650 .95rem/1.12 var(--font-ui)}
  .primary-nav .nav-copy em{display:block;margin-top:.14rem;color:#8ea5a2;font:normal .56rem/1.28 var(--font-ui)}
  .primary-nav .nav-arrow{position:relative;z-index:1;display:block;align-self:flex-start;color:rgb(var(--nav-rgb));font-size:1rem;text-shadow:0 0 10px rgba(var(--nav-rgb),.38)}
  .primary-nav .nav-tile>a:hover,.primary-nav .nav-tile>a:focus-visible,.primary-nav .nav-tile>a[aria-current="page"]{
    border-color:rgba(var(--nav-rgb),.98);color:#fff;transform:translateY(-1px);
    box-shadow:
      0 0 0 1px rgba(var(--nav-rgb),.14),
      0 0 24px rgba(var(--nav-rgb),.30),
      inset 0 1px 0 rgba(255,255,255,.10),
      inset 0 0 28px rgba(var(--nav-rgb),.055)
  }
  .nav-cart-count{
    position:absolute;right:.65rem;bottom:.65rem;z-index:2;margin:0;padding:.12rem .3rem;
    border:1px solid rgba(var(--nav-rgb),.55);border-radius:999px;background:rgba(3,12,14,.90);color:rgb(var(--nav-rgb))
  }
}

@media(max-width:40rem){
  .primary-nav{padding:.7rem}
  .primary-nav ul{gap:.55rem}
  .primary-nav .nav-tile>a{min-height:7rem;padding:.8rem}
  .primary-nav .nav-copy{width:64%}
  .primary-nav .nav-copy b{font-size:.88rem}
  .primary-nav .nav-copy em{font-size:.52rem}
}
@media(max-width:23.75rem){
  .primary-nav ul{grid-template-columns:1fr}
  .primary-nav .nav-tile>a{min-height:6.2rem}
}
/* STEP 11.2M COLOUR IMAGE MENU END */'''

if start in nav:
    nav, n = re.subn(re.escape(start)+r".*?"+re.escape(end), menu_block, nav, count=1, flags=re.S)
    if n != 1:
        raise RuntimeError("Could not refresh menu block")
else:
    nav = nav.rstrip()+"\n\n"+menu_block+"\n"
NAV.write_text(nav, encoding="utf-8")

glass = GLASS.read_text(encoding="utf-8")
old_start = "/* STEP 11.2L PROCEDURAL TECH BACKGROUND START */"
old_end = "/* STEP 11.2L PROCEDURAL TECH BACKGROUND END */"
new_start = "/* STEP 11.2M SCHEMATIC CIRCUIT BACKGROUND START */"
new_end = "/* STEP 11.2M SCHEMATIC CIRCUIT BACKGROUND END */"

circuit_block = '''/* STEP 11.2M SCHEMATIC CIRCUIT BACKGROUND START */
/* Pure CSS schematic field: no images, animation, filters, blur or fixed layers. */
body:not([data-page^="static"]):not([data-page^="admin"]){
  background:
    repeating-linear-gradient(135deg,rgba(74,238,220,.020) 0 1px,transparent 1px 24px),
    linear-gradient(180deg,#041113 0%,#020b0d 45%,#031012 100%)
}

body:not([data-page^="static"]):not([data-page^="admin"]) main{
  background-image:
    radial-gradient(circle at 10% 10%,rgba(116,255,240,.50) 0 2px,transparent 2.7px),
    radial-gradient(circle at 34% 10%,rgba(116,255,240,.34) 0 2px,transparent 2.7px),
    radial-gradient(circle at 34% 22%,rgba(116,255,240,.28) 0 2px,transparent 2.7px),
    radial-gradient(circle at 81% 31%,rgba(116,255,240,.38) 0 2px,transparent 2.7px),
    radial-gradient(circle at 63% 55%,rgba(190,227,223,.28) 0 2px,transparent 2.7px),
    radial-gradient(circle at 18% 72%,rgba(116,255,240,.34) 0 2px,transparent 2.7px),
    radial-gradient(circle at 76% 84%,rgba(116,255,240,.30) 0 2px,transparent 2.7px),
    radial-gradient(circle at 92% 92%,rgba(190,227,223,.24) 0 2px,transparent 2.7px),
    linear-gradient(90deg,rgba(74,238,220,.22),rgba(74,238,220,.06)),
    linear-gradient(180deg,rgba(74,238,220,.18),rgba(74,238,220,.05)),
    linear-gradient(90deg,rgba(74,238,220,.16),rgba(74,238,220,.035)),
    linear-gradient(90deg,rgba(146,207,201,.14),rgba(74,238,220,.035)),
    linear-gradient(180deg,rgba(146,207,201,.14),rgba(74,238,220,.035)),
    linear-gradient(90deg,rgba(74,238,220,.18),rgba(74,238,220,.04)),
    linear-gradient(180deg,rgba(74,238,220,.15),rgba(74,238,220,.035)),
    linear-gradient(90deg,rgba(146,207,201,.13),rgba(74,238,220,.025)),
    repeating-linear-gradient(90deg,rgba(116,255,240,.14) 0 10px,transparent 10px 24px);
  background-repeat:no-repeat;
  background-size:
    100% 100%,100% 100%,100% 100%,100% 100%,100% 100%,100% 100%,100% 100%,100% 100%,
    24% 1px,1px 12%,18% 1px,19% 1px,1px 14%,28% 1px,1px 11%,16% 1px,
    22% 1px;
  background-position:
    0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,
    10% 10%,34% 10%,34% 22%,62% 31%,81% 31%,18% 72%,46% 72%,76% 84%,
    8% 92%
}

body:not([data-page^="static"]):not([data-page^="admin"]) :is(.section,.home-section,.tool-section,.contact-section,.creator-strip){
  background-color:transparent
}

body:not([data-page^="static"]):not([data-page^="admin"]) :is(.tool-section,.creator-strip){
  background-image:linear-gradient(180deg,rgba(2,10,12,.34),rgba(2,10,12,.48))
}

body:not([data-page^="static"]):not([data-page^="admin"]) .section{position:relative}
body:not([data-page^="static"]):not([data-page^="admin"]) .section::after{
  content:"";position:absolute;right:var(--gutter);top:0;width:4.5rem;height:1px;
  background:linear-gradient(90deg,transparent,rgba(116,255,240,.22));pointer-events:none
}

@media(max-width:40rem){
  body:not([data-page^="static"]):not([data-page^="admin"]){
    background:
      repeating-linear-gradient(135deg,rgba(74,238,220,.017) 0 1px,transparent 1px 20px),
      linear-gradient(180deg,#041113 0%,#020b0d 45%,#031012 100%)
  }
  body:not([data-page^="static"]):not([data-page^="admin"]) main{
    background-size:
      100% 100%,100% 100%,100% 100%,100% 100%,100% 100%,100% 100%,100% 100%,100% 100%,
      27% 1px,1px 10%,20% 1px,22% 1px,1px 12%,30% 1px,1px 9%,18% 1px,
      26% 1px
  }
}
@media print{body,body main{background:#fff!important}}
/* STEP 11.2M SCHEMATIC CIRCUIT BACKGROUND END */'''

if old_start in glass:
    glass, n = re.subn(re.escape(old_start)+r".*?"+re.escape(old_end), circuit_block, glass, count=1, flags=re.S)
    if n != 1:
        raise RuntimeError("Could not replace old background block")
elif new_start in glass:
    glass, n = re.subn(re.escape(new_start)+r".*?"+re.escape(new_end), circuit_block, glass, count=1, flags=re.S)
    if n != 1:
        raise RuntimeError("Could not refresh background block")
else:
    glass = glass.rstrip()+"\n\n"+circuit_block+"\n"

GLASS.write_text(glass, encoding="utf-8")
print("STEP 11.2M PREPARED")
