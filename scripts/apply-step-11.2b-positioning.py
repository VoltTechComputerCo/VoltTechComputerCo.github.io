#!/usr/bin/env python3
# Step 11.2B — elevate VoltTech's one-stop-shop + Stream Support positioning.
# Copy/navigation/SEO presentation only. No commerce flags, pricing, or backend changes.

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
changed = []
errors = []

def edit(rel, old, new, label):
    p = ROOT / rel
    text = p.read_text(encoding="utf-8")
    if new in text:
        return
    if old not in text:
        errors.append(f"{rel}: expected pattern not found for {label}")
        return
    p.write_text(text.replace(old, new, 1), encoding="utf-8")
    changed.append(rel)

# Global navigation.
edit(
    "src/templates/header.html",
    '''        <li><a href="{{ROOT}}index.html#services">Services</a></li>
        <li><a href="{{ROOT}}signal-scan.html">Signal Scan</a></li>''',
    '''        <li><a href="{{ROOT}}index.html#services">Services</a></li>
        <li><a href="{{ROOT}}streaming-setup-south-africa.html">Stream Support</a></li>
        <li><a href="{{ROOT}}signal-scan.html">Signal Scan</a></li>''',
    "global Stream Support navigation"
)

edit(
    "src/templates/footer.html",
    '''        <p class="muted">PC hardware, practical advice and support for your next move.</p>''',
    '''        <p class="muted">PC hardware, custom builds, Stream Support and practical help for your next move.</p>''',
    "footer brand positioning"
)

edit(
    "src/templates/footer.html",
    '''        <li><a href="{{ROOT}}pc-repair-pretoria.html">PC repair</a></li>
        <li><a href="{{ROOT}}signal-scan.html">Signal Scan</a></li>
        <li><a href="{{ROOT}}account.html">Your account</a></li>''',
    '''        <li><a href="{{ROOT}}pc-repair-pretoria.html">PC repair</a></li>
        <li><a href="{{ROOT}}streaming-setup-south-africa.html">Stream Support</a></li>
        <li><a href="{{ROOT}}stream-scan.html">Stream Scan</a></li>
        <li><a href="{{ROOT}}signal-scan.html">Signal Scan</a></li>
        <li><a href="{{ROOT}}account.html">Your account</a></li>''',
    "footer Stream Support links"
)

# Homepage SEO.
edit(
    "src/pages/home.json",
    '''  "title": "PC Repair Pretoria, Upgrades & Creator Support | VoltTech Computer Co.",
  "description": "PC repair and upgrades in Pretoria, with remote PC and streaming support across South Africa. Plan your next upgrade with VoltTech Computer Co.",''',
    '''  "title": "Gaming PCs, PC Parts & Stream Support | VoltTech Pretoria",
  "description": "Custom gaming PCs, PC parts, peripherals, upgrades and repair in Pretoria, plus specialist OBS, Streamlabs and streaming support across South Africa.",''',
    "homepage title and description"
)

edit(
    "src/pages/home.head.html",
    '''  <meta property="og:title" content="Tune your ultimate rig. | VoltTech Computer Co.">
  <meta property="og:description" content="PC repair and upgrades in Pretoria. Remote PC and creator support across South Africa.">''',
    '''  <meta property="og:title" content="Build it. Tune it. Stream it. | VoltTech Computer Co.">
  <meta property="og:description" content="Gaming PCs, components, peripherals, upgrades and repairs in Pretoria, plus specialist Stream Support across South Africa.">''',
    "homepage Open Graph positioning"
)

old_graph = '''  {"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://volttechcomputerco.co.za/#organisation","name":"VoltTech Computer Co.","url":"https://volttechcomputerco.co.za/","logo":"https://volttechcomputerco.co.za/brand/VoltTech_Full_Logo_Transparent.png","email":"volttechcomputerco@gmail.com","telephone":"+27618435775","areaServed":{"@type":"Country","name":"South Africa"}},{"@type":"Service","name":"PC repair and upgrades in Pretoria","provider":{"@id":"https://volttechcomputerco.co.za/#organisation"},"areaServed":{"@type":"City","name":"Pretoria"},"serviceType":"Computer repair and upgrades"}]}'''
new_graph = '''  {"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://volttechcomputerco.co.za/#organisation","name":"VoltTech Computer Co.","url":"https://volttechcomputerco.co.za/","logo":"https://volttechcomputerco.co.za/brand/VoltTech_Full_Logo_Transparent.png","email":"volttechcomputerco@gmail.com","telephone":"+27618435775","areaServed":{"@type":"Country","name":"South Africa"}},{"@type":"Service","name":"Gaming PCs, Components and Upgrade Support","provider":{"@id":"https://volttechcomputerco.co.za/#organisation"},"areaServed":[{"@type":"City","name":"Pretoria"},{"@type":"Country","name":"South Africa"}],"serviceType":"Custom gaming PC planning, components, peripherals, upgrades, repairs and performance support"},{"@type":"Service","name":"Stream Support","provider":{"@id":"https://volttechcomputerco.co.za/#organisation"},"areaServed":{"@type":"Country","name":"South Africa"},"serviceType":"OBS, Streamlabs, encoder, bitrate, audio, capture card and streaming performance support"}]}'''
edit("src/pages/home.head.html", old_graph, new_graph, "homepage structured data")

# Homepage visible positioning.
edit(
    "src/pages/home.html",
    '''        <p class="eyebrow hero-kicker">Performance lives here <span aria-hidden="true">/////</span></p>''',
    '''        <p class="eyebrow hero-kicker">PC HARDWARE / GAMING / CREATOR TECH <span aria-hidden="true">/////</span></p>''',
    "homepage hero kicker"
)

edit(
    "src/pages/home.html",
    '''        <p class="hero-strap">HIGH PERFORMANCE PCs. EXPERT CARE. YOUR NEXT LEVEL.</p>
        <p class="hero-description">PC upgrades, practical advice and support.<br>For a setup that never stops evolving.</p>
        <div class="actions"><a class="button" href="{{ROOT}}pc-upgrades-pretoria.html">PLAN YOUR UPGRADE <span aria-hidden="true">↗</span></a><a class="button button-secondary" href="#components">EXPLORE COMPONENTS <span aria-hidden="true">→</span></a></div>''',
    '''        <p class="hero-strap">CUSTOM PCs. COMPONENTS. STREAM SUPPORT. EXPERT CARE.</p>
        <p class="hero-description">Gaming rigs, components and peripherals, upgrades, repairs and specialist streaming support—built around what you play, create and need next.</p>
        <div class="actions"><a class="button" href="{{ROOT}}builder/index.html">PLAN YOUR BUILD <span aria-hidden="true">↗</span></a><a class="button button-secondary" href="{{ROOT}}streaming-setup-south-africa.html">STREAM SUPPORT <span aria-hidden="true">→</span></a></div>''',
    "homepage hero business positioning"
)

edit(
    "src/pages/home.html",
    '''      <div class="hero-facts"><span><b aria-hidden="true">↗</b> SOUTH AFRICAN<br>TECH SUPPORT</span><span><b aria-hidden="true">⌁</b> PRETORIA REPAIRS<br>&amp; UPGRADES</span><span><b aria-hidden="true">◎</b> REMOTE SUPPORT<br>ACROSS SA</span><span><b aria-hidden="true">+</b> BUILT AROUND<br>YOUR NEXT MOVE</span></div>''',
    '''      <div class="hero-facts"><span><b aria-hidden="true">↗</b> CUSTOM GAMING<br>PC BUILDS</span><span><b aria-hidden="true">⌁</b> COMPONENTS<br>&amp; PERIPHERALS</span><span><b aria-hidden="true">◎</b> STREAM SUPPORT<br>ACROSS SA</span><span><b aria-hidden="true">+</b> REPAIRS<br>&amp; UPGRADES</span></div>''',
    "homepage hero facts"
)

edit(
    "src/pages/home.html",
    '''<div class="tool-copy"><div class="section-heading"><h2>PC Builder</h2></div><p class="eyebrow">Your vision. Engineered.</p><p>Gaming, creating or doing more. Start with your goals, your current setup and your budget.</p>''',
    '''<div class="tool-copy"><div class="section-heading"><h2>PC Builder</h2></div><p class="eyebrow">Your vision. Engineered.</p><p>Plan a custom gaming PC, creator rig or high-performance system around your goals, your setup and your budget.</p>''',
    "PC Builder positioning"
)

edit(
    "src/pages/home.html",
    '''<h3>Streaming &amp; creators</h3><p>Create. Connect. Go live.</p>''',
    '''<h3>Stream Support</h3><p>OBS. Audio. Performance.</p>''',
    "Stream Support service card"
)

stream_feature = '''  <section class="stream-support-feature" aria-labelledby="stream-support-title">
    <div class="container stream-support-grid">
      <div class="stream-support-copy">
        <p class="eyebrow">VOLTTECH / STREAM SUPPORT</p>
        <h2 id="stream-support-title">Your stream is a system.<br><span class="accent">Dial in every part.</span></h2>
        <p>OBS, Streamlabs, encoders, bitrate, audio, capture cards, dual-PC workflows and creator-PC performance. VoltTech Stream Support is specialist remote technical support for creators across South Africa.</p>
        <div class="actions"><a class="button" href="{{ROOT}}streaming-setup-south-africa.html">GET STREAM SUPPORT <span aria-hidden="true">↗</span></a><a class="button button-secondary" href="{{ROOT}}stream-scan.html">RUN STREAM SCAN <span aria-hidden="true">→</span></a></div>
        <p class="micro">REMOTE ACROSS SOUTH AFRICA · DIAGNOSE FIRST · NO RANDOM PRESET ROULETTE</p>
      </div>
      <div class="stream-support-visual">
        <img src="{{ROOT}}vt-streaming.webp" alt="Streaming setup supported by VoltTech" width="1200" height="800" loading="lazy">
        <div class="stream-support-points">
          <div><span>01</span><strong>OBS / STREAMLABS</strong><small>Setup, scenes, output and workflow.</small></div>
          <div><span>02</span><strong>ENCODER / NETWORK</strong><small>Bitrate, dropped frames and stability.</small></div>
          <div><span>03</span><strong>AUDIO / CAPTURE</strong><small>Routing, levels and capture cards.</small></div>
          <div><span>04</span><strong>CREATOR PC</strong><small>Performance, headroom and dual-PC setups.</small></div>
        </div>
      </div>
    </div>
  </section>

'''
edit(
    "src/pages/home.html",
    '''  <section class="home-section" id="services" aria-labelledby="services-title"><div class="container">''',
    stream_feature + '''  <section class="home-section" id="services" aria-labelledby="services-title"><div class="container">''',
    "dedicated Stream Support homepage feature"
)

edit(
    "src/pages/home.html",
    '''<div class="creator-status"><p>Discover South African creators and get support for your own setup.</p>''',
    '''<div class="creator-status"><p>Discover South African creators, then get your own stream dialled in with VoltTech Stream Support.</p>''',
    "Creator Hub support positioning"
)

edit(
    "src/pages/home.html",
    '''<h2 id="contact-title">Your next move starts here.</h2><p>PC repair and upgrades in Pretoria and surrounding areas.<br>Remote PC and streaming support across South Africa.</p>''',
    '''<h2 id="contact-title">Your next move starts here.</h2><p>Custom PCs, components, upgrades and repairs in Pretoria.<br>Specialist Stream Support across South Africa.</p>''',
    "homepage contact positioning"
)

# Home CSS.
home_css = ROOT / "assets/css/pages/home.css"
css = home_css.read_text(encoding="utf-8")
marker = "/* Step 11.2B Stream Support feature */"
if marker not in css:
    css += r'''

/* Step 11.2B Stream Support feature */
.stream-support-feature{border-bottom:1px solid var(--border-strong);background:linear-gradient(120deg,rgba(53,234,215,.055),transparent 42%),var(--bg-secondary);padding-block:clamp(2rem,4vw,3.5rem)}
.stream-support-grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(1.5rem,4vw,4rem);align-items:center}
.stream-support-copy h2{font-size:clamp(1.8rem,3vw,3rem);line-height:1.02;letter-spacing:-.035em;margin:.5rem 0 1rem}
.stream-support-copy>p:not(.eyebrow):not(.micro){max-width:52ch;color:var(--text-secondary);font-size:.9rem;line-height:1.65}
.stream-support-copy .actions{display:flex;flex-wrap:wrap;gap:.65rem;margin-top:1.25rem}
.stream-support-copy .button{font-size:.7rem}
.stream-support-copy .micro{margin:1rem 0 0;font-size:.58rem;line-height:1.7;color:var(--text-muted)}
.stream-support-visual{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(13rem,.7fr);border:1px solid var(--border-strong);background:var(--panel);min-width:0}
.stream-support-visual>img{width:100%;height:100%;min-height:300px;object-fit:cover}
.stream-support-points{display:grid;align-content:stretch}
.stream-support-points>div{display:grid;grid-template-columns:2.2rem 1fr;gap:.15rem .65rem;align-content:center;padding:.9rem;border-left:1px solid var(--border);border-bottom:1px solid var(--border)}
.stream-support-points>div:last-child{border-bottom:0}
.stream-support-points span{grid-row:1/3;color:var(--teal);font:600 .72rem/1 var(--font-mono);padding-top:.15rem}
.stream-support-points strong{font-size:.68rem;letter-spacing:.04em}
.stream-support-points small{color:var(--text-secondary);font-size:.62rem;line-height:1.4}
@media(max-width:56rem){.stream-support-grid{grid-template-columns:1fr}.stream-support-visual{grid-template-columns:1fr 1fr}.stream-support-points>div:first-child{border-top:1px solid var(--border)}}
@media(max-width:40rem){.stream-support-feature{padding-block:2rem}.stream-support-copy .actions{display:grid;grid-template-columns:1fr 1fr}.stream-support-copy .button{padding-inline:.65rem;font-size:.625rem}.stream-support-visual{grid-template-columns:1fr}.stream-support-visual>img{min-height:220px}.stream-support-points{grid-template-columns:1fr 1fr}.stream-support-points>div{border-top:1px solid var(--border);border-left:0}.stream-support-points>div:nth-child(odd){border-right:1px solid var(--border)}}
'''
    home_css.write_text(css, encoding="utf-8")
    changed.append("assets/css/pages/home.css")

# Streaming Support SEO and content.
edit(
    "src/pages/streaming-support.json",
    '''  "title": "Streaming & Creator Technical Support South Africa | OBS Help | VoltTech",
  "description": "Remote streaming and creator technical support across South Africa. OBS diagnostics, dropped frames, encoder tuning, audio, recording and creator-PC optimisation from VoltTech.",''',
    '''  "title": "OBS & Stream Support South Africa | Streamlabs Help | VoltTech",
  "description": "Specialist remote OBS and Streamlabs support across South Africa: encoder tuning, dropped frames, audio, capture cards, dual-PC setups and creator-PC performance.",''',
    "Streaming Support SEO"
)

edit(
    "src/pages/streaming-support.head.html",
    '''<meta property="og:title" content="Streaming & Creator Technical Support South Africa | VoltTech">
<meta property="og:description" content="Remote OBS, streaming, audio and creator-system support across South Africa.">''',
    '''<meta property="og:title" content="OBS & Stream Support South Africa | VoltTech">
<meta property="og:description" content="Specialist OBS, Streamlabs, encoder, audio, capture-card and creator-PC support across South Africa.">''',
    "Streaming Support Open Graph"
)

edit(
    "src/pages/streaming-support.head.html",
    '''"serviceType":"OBS Setup, Streaming Diagnostics, Audio and Creator PC Optimisation","provider":{"@id":"https://volttechcomputerco.co.za/#organization"}''',
    '''"serviceType":"OBS and Streamlabs Setup, Streaming Diagnostics, Encoder Tuning, Audio, Capture Cards and Creator PC Optimisation","provider":{"@id":"https://volttechcomputerco.co.za/#organisation"}''',
    "Streaming Support structured data service/provider"
)

edit(
    "src/pages/streaming-support.head.html",
    '''"description":"Remote streaming and creator technical support including OBS setup, stream diagnostics, encoder tuning, audio optimisation, recording and creator PC performance support across South Africa."''',
    '''"description":"Specialist remote streaming and creator technical support including OBS and Streamlabs setup, stream diagnostics, encoder and bitrate tuning, audio optimisation, capture cards, dual-PC workflows and creator PC performance support across South Africa."''',
    "Streaming Support structured data description"
)

edit(
    "src/pages/streaming-support.html",
    '''          <h1>Streaming Support<span>OBS, audio and performance without the guesswork.</span></h1>
          <p class="service-lead">Remote help for OBS problems, encoder overload, dropped frames, blurry output, audio issues and creator-PC performance. Start with the symptom; VoltTech helps narrow the technical cause before changing random presets.</p>''',
    '''          <h1>Stream Support<span>OBS, Streamlabs, audio and performance—dialled in.</span></h1>
          <p class="service-lead">Specialist remote support for OBS and Streamlabs, encoder overload, dropped frames, blurry output, audio routing, capture cards, dual-PC workflows and creator-PC performance. Start with the symptom; VoltTech tunes the whole stream path instead of changing random presets.</p>''',
    "Streaming Support hero"
)

old_help = '''      <div class="service-grid streaming-help-grid">
        <article class="service-card"><h3>OBS setup &amp; scenes</h3><p>Capture method, canvas/output choices, source structure and sensible scene configuration.</p></article>
        <article class="service-card"><h3>Encoder overload</h3><p>NVENC, AMF, Quick Sync and x264 tuning when the encoding workload is too high.</p></article>
        <article class="service-card"><h3>Dropped frames</h3><p>Bitrate, connection stability and the upload path when the stream cannot hold a clean connection.</p></article>
        <article class="service-card"><h3>Audio cleanup</h3><p>Mic levels, noise control, compression, limiting, routing and source balance.</p></article>
        <article class="service-card"><h3>Creator-PC performance</h3><p>Game-versus-stream resource contention, GPU headroom, thermals and background load.</p></article>
        <article class="service-card"><h3>Capture &amp; recording</h3><p>Capture-card setups, recording quality and combined streaming/recording workflows.</p></article>
      </div>'''
new_help = '''      <div class="service-grid streaming-help-grid">
        <article class="service-card"><h3>OBS &amp; Streamlabs</h3><p>Scenes, sources, capture methods, canvas/output choices, profiles and a workflow that makes sense.</p></article>
        <article class="service-card"><h3>Encoder &amp; output tuning</h3><p>NVENC, AMF, Quick Sync and x264 tuning for the quality your hardware can actually sustain.</p></article>
        <article class="service-card"><h3>Dropped frames &amp; network</h3><p>Bitrate, connection stability and upload-path troubleshooting when the stream cannot hold clean delivery.</p></article>
        <article class="service-card"><h3>Audio &amp; routing</h3><p>Mic levels, filters, compression, limiting, monitoring, application routing and source balance.</p></article>
        <article class="service-card"><h3>Creator-PC performance</h3><p>Game-versus-stream resource contention, GPU headroom, thermals, frame pacing and background load.</p></article>
        <article class="service-card"><h3>Capture cards &amp; dual-PC</h3><p>Capture chains, passthrough, recording workflows and dual-PC streaming setups without unnecessary complexity.</p></article>
      </div>'''
edit("src/pages/streaming-support.html", old_help, new_help, "Streaming Support capability grid")

edit(
    "src/pages/streaming-support.html",
    '''<li>OBS and output tuning</li>''',
    '''<li>OBS / Streamlabs and output tuning</li>''',
    "Stream Tune package wording"
)

edit(
    "src/pages/streaming-support.html",
    '''<li>OBS and output configuration</li>''',
    '''<li>OBS / Streamlabs configuration</li>''',
    "Stream Setup package wording"
)

# Stream Scan.
edit(
    "src/pages/stream-scan.json",
    '''  "title": "Free Stream Diagnostic Tool South Africa | Stream Scan | VoltTech",
  "description": "Use VoltTech Stream Scan to narrow OBS encoding overload, rendering lag, dropped frames, blurry streams, game FPS loss and creator audio problems with answer-based triage.",''',
    '''  "title": "OBS & Streamlabs Diagnostic Tool South Africa | Stream Scan | VoltTech",
  "description": "Use VoltTech Stream Scan to narrow OBS or Streamlabs encoding overload, rendering lag, dropped frames, blurry output, FPS loss and creator-audio problems.",''',
    "Stream Scan SEO"
)

edit(
    "src/pages/stream-scan.head.html",
    '''<meta property="og:description" content="Free answer-based streaming diagnostics for South African creators.">''',
    '''<meta property="og:description" content="Free answer-based OBS and Streamlabs diagnostics for South African creators.">''',
    "Stream Scan Open Graph description"
)

edit(
    "src/pages/stream-scan.head.html",
    '''"provider":{"@id":"https://volttechcomputerco.co.za/#organization"}''',
    '''"provider":{"@id":"https://volttechcomputerco.co.za/#organisation"}''',
    "Stream Scan provider identifier"
)

edit(
    "src/pages/stream-scan.head.html",
    '''"description":"Answer-based streaming diagnostic helper for OBS, encoder, rendering, network, video quality and audio problems."''',
    '''"description":"Answer-based streaming diagnostic helper for OBS, Streamlabs, encoder, rendering, network, video quality and audio problems."''',
    "Stream Scan structured description"
)

# Creator Hub.
edit(
    "src/pages/creator-hub-south-africa.html",
    '''      <p class="lead">Browse VoltTech's curated Twitch directory, discover recently active local channels and watch a featured stream when the live feed has a fresh status check.</p>''',
    '''      <p class="lead">Browse VoltTech's curated Twitch directory and discover South African creators. Building your own channel? VoltTech Stream Support and Stream Scan are here for OBS, Streamlabs and creator-tech problems.</p>
      <div class="creator-hero-actions"><a class="button" href="streaming-setup-south-africa.html">Get Stream Support</a><a class="button button-secondary" href="stream-scan.html">Run Stream Scan</a></div>''',
    "Creator Hub hero support routes"
)

edit(
    "src/pages/creator-hub-south-africa.json",
    '''  "title": "South African Creator Hub | Live Twitch Streamers | VoltTech",
  "description": "Discover South African Twitch creators through VoltTech's creator directory, with live status shown only when the feed has a fresh backend check.",''',
    '''  "title": "South African Creator Hub | Streamers & Creator Tech | VoltTech",
  "description": "Discover South African Twitch creators through VoltTech, with direct routes to specialist OBS, Streamlabs and streaming technical support.",''',
    "Creator Hub SEO positioning"
)

edit(
    "src/pages/creator-hub-south-africa.head.html",
    '''<meta property="og:title" content="South African Creator Hub | VoltTech">
<meta property="og:description" content="Discover South African Twitch creators. Live status is shown only when VoltTech has a fresh backend check.">''',
    '''<meta property="og:title" content="South African Creator Hub & Creator Tech | VoltTech">
<meta property="og:description" content="Discover South African Twitch creators and get direct access to VoltTech Stream Support and Stream Scan.">''',
    "Creator Hub Open Graph"
)

edit(
    "src/pages/creator-hub-south-africa.head.html",
    '''"description":"A discovery page for South African Twitch creators. Live status is presented only from a fresh backend check."''',
    '''"description":"A discovery page for South African Twitch creators with direct routes to VoltTech Stream Support and Stream Scan for OBS, Streamlabs and creator-tech help."''',
    "Creator Hub structured description"
)

creator_css = ROOT / "assets/css/pages/creator-hub.css"
css = creator_css.read_text(encoding="utf-8")
marker = "/* Step 11.2B creator support routes */"
if marker not in css:
    css += r'''

/* Step 11.2B creator support routes */
.creator-hero-actions{display:flex;flex-wrap:wrap;gap:.65rem;align-items:center}
.creator-hero-actions .button{font-size:.7rem}
@media(max-width:520px){.creator-hero-actions{display:grid;grid-template-columns:1fr 1fr}.creator-hero-actions .button{padding-inline:.65rem;font-size:.625rem}}
'''
    creator_css.write_text(css, encoding="utf-8")
    changed.append("assets/css/pages/creator-hub.css")

# Search.
edit(
    "assets/js/components/search.js",
    '''  ['Streaming support', 'OBS, audio, video and creator setups', 'streaming-setup-south-africa.html'],
  ['Signal Scan', 'Guided PC diagnostic and estimate', 'signal-scan.html'],''',
    '''  ['Stream Support', 'OBS, Streamlabs, audio, capture, dropped frames and creator PCs', 'streaming-setup-south-africa.html'],
  ['Stream Scan', 'Guided OBS and Streamlabs diagnostic and estimate', 'stream-scan.html'],
  ['Signal Scan', 'Guided PC diagnostic and estimate', 'signal-scan.html'],''',
    "site search Stream Support and Stream Scan"
)

edit(
    "assets/js/components/search.js",
    "'No matching pages. Try repair, upgrades or streaming.';",
    "'No matching pages. Try builds, repair, OBS or streaming.';",
    "site search fallback"
)

if errors:
    print("STEP 11.2B PATCH FAILED")
    for err in errors:
        print("-", err)
    sys.exit(1)

print(f"Step 11.2B prepared {len(set(changed))} source/style file(s).")
for rel in sorted(set(changed)):
    print("-", rel)
