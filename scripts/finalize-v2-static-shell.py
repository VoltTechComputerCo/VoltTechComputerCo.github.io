#!/usr/bin/env python3
# VoltTech V2 Phase 9 — source finalizer
# Make the browser's FIRST PAINT equal the final V2 layout.
# Core rule: do not render legacy structures and then remove/rebuild them with JS.

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

SERVICES = [
    {"key":"repair","file":"pc-repair-pretoria.html","label":"Repair","identity":"REPAIR & DIAGNOSTICS","title":"PC Repair","tagline":"Find the fault. Fix the cause.","image":"vt-repair.webp","accent":"#ff6b6b","rgb":"255,107,107","crumb":"PC Repair","eyebrow":"// PC REPAIR · PRETORIA"},
    {"key":"performance","file":"pc-performance-optimisation.html","label":"Performance","identity":"PC PERFORMANCE","title":"PC Performance Optimisation","tagline":"Make the machine feel fast again.","image":"vt-performance.webp","accent":"#ffb454","rgb":"255,180,84","crumb":"PC Performance","eyebrow":"// PC PERFORMANCE · PRETORIA"},
    {"key":"upgrades","file":"pc-upgrades-pretoria.html","label":"Upgrades","identity":"PC UPGRADES","title":"PC Upgrades","tagline":"Upgrade what actually matters.","image":"vt-upgrades.webp","accent":"#62a8ff","rgb":"98,168,255","crumb":"PC Upgrades","eyebrow":"// PC UPGRADES · PRETORIA"},
    {"key":"security","file":"virus-malware-removal-pretoria.html","label":"Security","identity":"PC SECURITY","title":"PC Security & Malware Removal","tagline":"Clean it up without scare tactics.","image":"vt-malware.webp","accent":"#b779ff","rgb":"183,121,255","crumb":"PC Security","eyebrow":"// PC SECURITY · PRETORIA"},
    {"key":"windows","file":"windows-installation-pretoria.html","label":"Windows","identity":"WINDOWS","title":"Windows Installation & Setup","tagline":"A fresh start, finished properly.","image":"vt-windows.webp","accent":"#42d9ff","rgb":"66,217,255","crumb":"Windows Installation","eyebrow":"// WINDOWS INSTALLATION · PRETORIA"},
    {"key":"streaming","file":"streaming-setup-south-africa.html","label":"Streaming","identity":"CREATOR TECH","title":"Streaming Technical Support","tagline":"OBS, audio and performance without the guesswork.","image":"vt-streaming.webp","accent":"#d778ff","rgb":"215,120,255","crumb":"Streaming Support","eyebrow":"// STREAMING TECHNICAL SUPPORT · SOUTH AFRICA"},
]

def read(path):
    return (ROOT/path).read_text(encoding="utf-8")

def write(path, text):
    (ROOT/path).write_text(text, encoding="utf-8", newline="\n")

def add_body_classes(html, *classes):
    m = re.search(r'<body(?:\s+class="([^"]*)")?>', html, re.I)
    if not m:
        raise RuntimeError("Missing <body>")
    existing = (m.group(1) or "").split()
    for cls in classes:
        if cls not in existing:
            existing.append(cls)
    replacement = '<body class="' + " ".join(existing) + '">'
    return html[:m.start()] + replacement + html[m.end():]

def remove_stylesheet(html, filename):
    return re.sub(
        rf'\s*<link[^>]+href=["\'][^"\']*{re.escape(filename)}[^"\']*["\'][^>]*>',
        '',
        html,
        flags=re.I,
    )

def ensure_stylesheet(html, href, marker, after=None):
    filename = href.split("?")[0]
    html = remove_stylesheet(html, filename)
    tag = f'<link rel="stylesheet" href="{href}" {marker}>'
    if after:
        pattern = re.compile(rf'(<link[^>]+href=["\'][^"\']*{re.escape(after)}[^"\']*["\'][^>]*>)', re.I)
        if pattern.search(html):
            return pattern.sub(lambda m: m.group(1) + "\n" + tag, html, count=1)
    return html.replace("</head>", tag + "\n</head>", 1)

def update_visual_version(html):
    return re.sub(
        r'href=["\']visual-system\.css(?:\?v=[^"\']+)?["\']',
        'href="visual-system.css?v=13"',
        html,
        flags=re.I,
    )

def remove_creator_top(html):
    html = re.sub(r'\s*<div class="creator-breadcrumb"[\s\S]*?</div>\s*', "\n", html, count=1, flags=re.I)
    html = re.sub(
        r'\s*<div class="creator-network"[^>]*>\s*'
        r'<div class="creator-network-head">[\s\S]*?</div>\s*'
        r'<div class="creator-network-links">[\s\S]*?</div>\s*'
        r'</div>\s*',
        "\n",
        html,
        count=1,
        flags=re.I,
    )
    return html

def remove_service_network(html):
    return re.sub(
        r'\s*<div class="service-network"[^>]*>\s*'
        r'(?:<div class="service-network-head">[\s\S]*?</div>\s*)?'
        r'<div class="service-network-links">[\s\S]*?</div>\s*'
        r'</div>\s*',
        "\n",
        html,
        count=1,
        flags=re.I,
    )

def extract_ctas(hero):
    m = re.search(r'<div class="ctas">([\s\S]*?)</div>', hero, re.I)
    return m.group(1).strip() if m else ""

def extract_lead(hero):
    m = re.search(r'<p class="lead(?: [^"]*)?">([\s\S]*?)</p>', hero, re.I)
    return m.group(1).strip() if m else ""

def build_network(active_key):
    links = []
    for s in SERVICES:
        active = s["key"] == active_key
        attrs = ' class="active" aria-current="page"' if active else ""
        links.append(
            f'<a{attrs} href="{s["file"]}" style="--network-accent:{s["accent"]}"><b>{s["label"]}</b></a>'
        )
    return '<div class="service-network" aria-label="VoltTech services">\n  <div class="service-network-links">' + "".join(links) + '</div>\n</div>'

def build_breadcrumb(s):
    return (
        '<div class="service-breadcrumb" role="navigation" aria-label="Breadcrumb">'
        '<a href="index.html">Home</a><span aria-hidden="true">›</span>'
        '<a href="index.html#services">Services</a><span aria-hidden="true">›</span>'
        f'<strong aria-current="page">{s["crumb"]}</strong></div>'
    )

def build_hero(s, old_hero):
    lead = extract_lead(old_hero)
    ctas = extract_ctas(old_hero)
    if not lead:
        raise RuntimeError(f'{s["file"]}: could not extract hero lead')
    if not ctas:
        raise RuntimeError(f'{s["file"]}: could not extract hero CTAs')
    remote = "REMOTE · SOUTH AFRICA" if s["key"] == "streaming" else "DIAGNOSTIC FIRST"
    return f'''<header class="hero vt-service-hero">
  <div class="vt-service-hero-copy">
    <div class="vt-service-identity"><small>VOLTTECH SERVICE</small><b>{s["identity"]}</b></div>
    <div class="eyebrow">{s["eyebrow"]}</div>
    <h1><span class="vt-service-heading">{s["title"]}</span><span class="vt-service-tagline">{s["tagline"]}</span></h1>
    <p class="lead vt-service-lead">{lead}</p>
    <div class="ctas">{ctas}</div>
  </div>
  <div class="vt-service-hero-media" style="--vt-hero-image:url('{s["image"]}')">
    <div class="vt-media-top"><span>{s["label"].upper()}</span><i></i></div>
    <div class="vt-media-bottom"><small>VOLTTECH COMPUTER CO.</small><b>{remote}</b></div>
  </div>
</header>'''

def add_static_dock(html):
    if 'class="vt9-wa-dock"' in html:
        return html
    dock = (
        '<a class="vt9-wa-dock" href="https://wa.me/27618435775" '
        'target="_blank" rel="noopener" aria-label="WhatsApp VoltTech">'
        '<span class="vt9-wa-icon" aria-hidden="true">WA</span><b>WhatsApp Us</b></a>\n'
    )
    if "<footer" in html:
        return html.replace("<footer", dock + "<footer", 1)
    return html.replace("</body>", dock + "</body>", 1)

def finalize_pc_service(s):
    path = s["file"]
    html = read(path)
    html = update_visual_version(html)
    html = ensure_stylesheet(html, "service-network.css?v=3", 'data-vt-service-network="1"', after="service-pages.css")
    html = ensure_stylesheet(html, "phase9-business-finish.css?v=6", 'data-vt-phase9-shell="1"', after="visual-block-fix.css")
    html = remove_service_network(html)

    hero_match = re.search(r'<header class="hero[^"]*">[\s\S]*?</header>', html, re.I)
    if not hero_match:
        raise RuntimeError(f"{path}: service hero not found")
    hero = build_hero(s, hero_match.group(0))
    html = html[:hero_match.start()] + hero + html[hero_match.end():]

    crumb_match = re.search(r'<div class="service-breadcrumb"[\s\S]*?</div>', html, re.I)
    if not crumb_match:
        raise RuntimeError(f"{path}: breadcrumb not found")
    html = html[:crumb_match.end()] + "\n" + build_network(s["key"]) + html[crumb_match.end():]

    html = add_body_classes(html, "vt9-service-page", f"vt9-{s['key']}")
    html = add_static_dock(html)
    write(path, html)

def finalize_streaming(s):
    path = s["file"]
    html = read(path)
    html = update_visual_version(html)
    html = remove_creator_top(html)
    html = remove_stylesheet(html, "creator-network.css")
    html = ensure_stylesheet(html, "service-network.css?v=3", 'data-vt-service-network="1"', after="streaming-support.css")
    html = ensure_stylesheet(html, "phase9-business-finish.css?v=6", 'data-vt-phase9-shell="1"', after="visual-block-fix.css")
    html = remove_service_network(html)

    hero_match = re.search(r'<header(?:\s+class="[^"]*")?>[\s\S]*?</header>', html, re.I)
    if not hero_match:
        raise RuntimeError("Streaming hero not found")
    hero = build_hero(s, hero_match.group(0))
    html = html[:hero_match.start()] + hero + html[hero_match.end():]

    marker = '<main><div class="wrap">'
    if marker not in html:
        raise RuntimeError("Streaming main wrapper not found")
    html = html.replace(marker, marker + "\n" + build_breadcrumb(s) + "\n" + build_network(s["key"]) + "\n", 1)

    html = add_body_classes(html, "vt9-service-page", "vt9-streaming")
    html = add_static_dock(html)
    write(path, html)

def finalize_creator_hub():
    path = "creator-hub-south-africa.html"
    html = read(path)
    html = update_visual_version(html)
    html = remove_creator_top(html)
    html = remove_stylesheet(html, "creator-network.css")
    write(path, html)

def finalize_home():
    path = "index.html"
    html = read(path)
    html = update_visual_version(html)
    html = ensure_stylesheet(html, "phase9-business-finish.css?v=6", 'data-vt-phase9-shell="1"', after="visual-block-fix.css")
    write(path, html)

def finalize_analytics():
    path = "analytics.js"
    js = read(path)
    js = re.sub(r'\nfunction loadPhase9Finish\(\)\{[\s\S]*?\n\}\n', "\n", js, count=1)
    js = re.sub(r'\n\s*loadPhase9Finish\(\);', "", js)
    write(path, js)

def write_phase9_js():
    write("phase9-business-finish.js", '''/* VoltTech V2 — Phase 9 v6
Structural DOM rewriting has been retired.

The final V2 layout is now present directly in source HTML before first paint.
Do not move/remove/rebuild core UI from JavaScript in this file.
*/
''')

def write_service_network_css():
    write("service-network.css", r'''/* VoltTech V2 — compact service rail v3
   First-paint component. No JavaScript required for layout. */

.service-network{margin:10px 0 16px;overflow:hidden;border:1px solid rgba(47,230,200,.18);border-radius:9px;background:#071011;box-shadow:0 10px 26px rgba(0,0,0,.14)}
.service-network-head{display:none!important}
.service-network-links{display:flex;align-items:stretch;gap:0;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x proximity;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.service-network-links::-webkit-scrollbar{display:none}
.service-network-links a{--network-accent:#2fe6c8;position:relative;flex:0 0 auto;min-width:104px;min-height:43px;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 10px;border-right:1px solid #172526;background:#081113;color:#78918d;text-decoration:none!important;scroll-snap-align:start;white-space:nowrap}
.service-network-links a:last-child{border-right:0}
.service-network-links b{margin:0!important;color:inherit!important;font:700 9px 'Space Grotesk',sans-serif!important;line-height:1!important;text-decoration:none!important}
.service-network-links a::before{content:"";position:absolute;left:10px;right:10px;bottom:0;height:2px;border-radius:4px 4px 0 0;background:var(--network-accent);opacity:.35}
.service-network-links a.active{color:var(--network-accent);background:color-mix(in srgb,var(--network-accent) 9%,#081113)}
.service-network-links a.active::before{opacity:1;box-shadow:0 0 10px color-mix(in srgb,var(--network-accent) 45%,transparent)}
.service-network-links a.active::after{content:"CURRENT";margin-left:2px;padding:2px 4px;border:1px solid color-mix(in srgb,var(--network-accent) 36%,transparent);border-radius:999px;color:var(--network-accent);font:700 5px 'JetBrains Mono',monospace;letter-spacing:.04em}
@media(hover:hover){.service-network-links a:hover{color:#e7f1ee;background:color-mix(in srgb,var(--network-accent) 6%,#081113)}}
@media(max-width:700px){.service-network-links a{min-width:98px;min-height:42px;padding:7px 9px}.service-network-links b{font-size:8.7px!important}}
''')

def write_phase9_css():
    write("phase9-business-finish.css", r'''/* VoltTech V2 — Phase 9 v6
   Static first-paint shell. Core layout must not depend on JavaScript. */

:root{--vt-service-accent:#2fe6c8;--vt-service-rgb:47,230,200}
body.vt9-repair{--vt-service-accent:#ff6b6b;--vt-service-rgb:255,107,107}
body.vt9-performance{--vt-service-accent:#ffb454;--vt-service-rgb:255,180,84}
body.vt9-upgrades{--vt-service-accent:#62a8ff;--vt-service-rgb:98,168,255}
body.vt9-security{--vt-service-accent:#b779ff;--vt-service-rgb:183,121,255}
body.vt9-windows{--vt-service-accent:#42d9ff;--vt-service-rgb:66,217,255}
body.vt9-streaming{--vt-service-accent:#d778ff;--vt-service-rgb:215,120,255}

body.vt9-service-page main>.wrap{max-width:1080px!important;padding-left:20px!important;padding-right:20px!important}
.vt-service-hero{display:grid!important;grid-template-columns:minmax(0,1.1fr) minmax(300px,.9fr)!important;grid-template-areas:"copy media";min-height:410px!important;margin:0 0 34px!important;padding:0!important;overflow:hidden!important;border:1px solid rgba(var(--vt-service-rgb),.28)!important;border-radius:14px!important;background:#071011!important;box-shadow:0 26px 62px rgba(0,0,0,.30)!important}
.vt-service-hero-copy{grid-area:copy;position:relative;z-index:3;display:flex;flex-direction:column;justify-content:center;min-width:0;padding:42px 40px 38px;background:radial-gradient(circle at 12% 10%,rgba(var(--vt-service-rgb),.11),transparent 34%),linear-gradient(145deg,#071011 0%,#081113 72%,#091315 100%)}
.vt-service-hero-media{grid-area:media;position:relative;min-height:410px;background:var(--vt-hero-image) center/cover no-repeat!important;filter:brightness(1.24) saturate(1.10) contrast(1.02)!important}
.vt-service-hero-media::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,10,11,.08),transparent 28%),linear-gradient(0deg,rgba(5,8,10,.17),transparent 32%);pointer-events:none}
.vt-service-identity{display:flex;align-items:center;gap:10px;margin-bottom:14px;color:#6f8984;font:700 8px 'JetBrains Mono',monospace;letter-spacing:.11em;text-transform:uppercase}
.vt-service-identity small{color:#53706b}
.vt-service-identity b{padding:5px 8px;border:1px solid rgba(var(--vt-service-rgb),.28);border-radius:999px;color:var(--vt-service-accent);background:rgba(var(--vt-service-rgb),.055);font:700 7px 'JetBrains Mono',monospace}
.vt-service-hero .eyebrow{margin-bottom:10px!important;color:#6f8984!important}
.vt-service-hero h1{margin:0 0 18px!important;font-size:clamp(34px,4.8vw,58px)!important;line-height:.98!important;letter-spacing:-.045em!important}
.vt-service-heading{display:block;color:#f0f7f5!important}
.vt-service-tagline{display:block;margin-top:9px;color:var(--vt-service-accent)!important;font-size:.58em;line-height:1.1}
.vt-service-lead{max-width:600px!important;color:#a7bcb7!important;font-size:14px!important;line-height:1.7!important}
.vt-service-hero .ctas{margin-top:22px!important}
.vt-media-top,.vt-media-bottom{position:absolute;z-index:2;left:16px;right:16px;display:flex;align-items:center;justify-content:space-between;gap:10px}
.vt-media-top{top:15px}.vt-media-bottom{bottom:15px}
.vt-media-top span,.vt-media-bottom small,.vt-media-bottom b{padding:6px 8px;border:1px solid rgba(255,255,255,.18);border-radius:4px;background:rgba(4,8,9,.58);backdrop-filter:blur(8px);color:#e2efec;font:700 7px 'JetBrains Mono',monospace;letter-spacing:.08em}
.vt-media-top span,.vt-media-bottom b{color:var(--vt-service-accent);border-color:rgba(var(--vt-service-rgb),.42)}
.vt-media-top i{width:34px;height:2px;background:var(--vt-service-accent)}
.vt-all-services{display:none!important}

.vt9-wa-dock{display:none}
@media(max-width:700px){
  body.vt9-service-page{padding-bottom:max(70px,calc(56px + env(safe-area-inset-bottom)))}
  .vt9-wa-dock{position:fixed;z-index:88;right:12px;bottom:max(12px,env(safe-area-inset-bottom));display:flex;align-items:center;gap:8px;min-height:44px;padding:7px 13px 7px 9px;border:1px solid rgba(47,230,200,.9);border-radius:999px;background:#2fe6c8;color:#03120f!important;text-decoration:none!important;box-shadow:0 14px 34px rgba(0,0,0,.38)}
  .vt9-wa-icon{width:27px;height:27px;display:grid;place-items:center;border-radius:50%;background:#25d366;color:#fff;font:800 8px 'Space Grotesk',sans-serif;box-shadow:inset 0 0 0 2px rgba(255,255,255,.72)}
  .vt9-wa-dock b{font:700 10.5px 'Space Grotesk',sans-serif;white-space:nowrap}
}

@media(max-width:820px){
  body.vt9-service-page main>.wrap{padding-left:14px!important;padding-right:14px!important}
  .vt-service-hero{display:flex!important;flex-direction:column!important;min-height:0!important}
  .vt-service-hero-copy{order:1!important;padding:26px 21px 25px!important}
  .vt-service-hero-media{order:2!important;min-height:185px!important;border-top:1px solid rgba(var(--vt-service-rgb),.22);background-position:center 42%!important;filter:brightness(1.31) saturate(1.12) contrast(1.01)!important}
  .vt-service-hero h1{font-size:clamp(34px,9vw,46px)!important}
}

/* Homepage mobile rail: compact, inset and swipeable from first paint. */
@media(max-width:700px){
  body.vt-page-home #services{overflow:hidden!important}
  body.vt-page-home #services .services{display:flex!important;gap:9px!important;overflow-x:auto!important;overflow-y:hidden!important;scroll-snap-type:x mandatory!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:none!important;margin:0!important;padding:2px 18px 10px 0!important}
  body.vt-page-home #services .services::-webkit-scrollbar{display:none!important}
  body.vt-page-home #services .service{flex:0 0 min(62vw,220px)!important;width:auto!important;min-height:150px!important;padding:14px 13px 13px!important;scroll-snap-align:start!important}
  body.vt-page-home #services .service h3{margin-top:8px!important;margin-bottom:5px!important;font-size:15px!important}
  body.vt-page-home #services .service p{font-size:10.5px!important;line-height:1.42!important;-webkit-line-clamp:3!important}
  body.vt-page-home #services .service .card-link{padding-top:8px!important;font-size:8px!important}
}
@media(max-width:390px){body.vt-page-home #services .service{flex-basis:64vw!important;min-height:146px!important}}
''')

def validate():
    errors = []
    for s in SERVICES:
        html = read(s["file"])
        if 'phase9-business-finish.css?v=6' not in html:
            errors.append(f'{s["file"]}: Phase 9 CSS not direct-linked')
        if 'vt-service-hero-copy' not in html:
            errors.append(f'{s["file"]}: final hero not present in source')
        if 'class="service-network"' not in html:
            errors.append(f'{s["file"]}: compact service rail missing')
        if 'class="vt9-wa-dock"' not in html:
            errors.append(f'{s["file"]}: static WhatsApp CTA missing')
        if 'service-network-head' in html:
            errors.append(f'{s["file"]}: retired service-network head remains')
        if 'creator-network' in html:
            errors.append(f'{s["file"]}: retired creator network remains')

    creator = read("creator-hub-south-africa.html")
    if 'creator-network' in creator:
        errors.append("creator-hub-south-africa.html: retired creator network remains")
    if 'creator-breadcrumb' in creator:
        errors.append("creator-hub-south-africa.html: retired creator breadcrumb remains")

    analytics = read("analytics.js")
    if 'loadPhase9Finish' in analytics:
        errors.append("analytics.js: dynamic Phase 9 structural loader remains")

    home = read("index.html")
    if 'phase9-business-finish.css?v=6' not in home:
        errors.append("index.html: Phase 9 CSS not direct-linked")

    if errors:
        raise SystemExit("\n".join(errors))

    print("V2 source-first shell validation passed.")
    print("Core layout no longer depends on post-paint DOM rewriting.")

def main():
    write_service_network_css()
    write_phase9_css()
    write_phase9_js()
    finalize_analytics()
    finalize_home()

    for s in SERVICES:
        if s["key"] == "streaming":
            finalize_streaming(s)
        else:
            finalize_pc_service(s)

    finalize_creator_hub()
    validate()

if __name__ == "__main__":
    main()
