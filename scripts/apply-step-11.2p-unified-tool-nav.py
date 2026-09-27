\
#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

STREAM_SCAN = ROOT / "src/pages/stream-scan.html"
STREAM_SUPPORT = ROOT / "src/pages/streaming-support.html"
SIGNAL_SCAN = ROOT / "src/pages/signal-scan.html"
CREATOR = ROOT / "src/pages/creator-hub-south-africa.html"
GLASS = ROOT / "assets/css/glass-system.css"

def replace_once(text, old, new, label):
    count = text.count(old)
    if count == 1:
        print("Applying:", label)
        return text.replace(old, new, 1)
    if count == 0 and new in text:
        print("PASS already applied:", label)
        return text
    raise RuntimeError(f"{label}: expected exactly one old match, found {count}")

def tool_nav(active):
    items = [
        ("signal", "signal-scan.html", "Signal Scan", "PC TRIAGE"),
        ("stream-scan", "stream-scan.html", "Stream Scan", "STREAM TRIAGE"),
        ("stream-support", "streaming-setup-south-africa.html", "Stream Support", "CREATOR TECH"),
        ("creator", "creator-hub-south-africa.html", "Creator Hub", "DISCOVER"),
    ]
    parts = ['<nav class="vt-tool-switcher" aria-label="VoltTech tools">']
    for key, href, label, eyebrow in items:
        active_bits = ' class="active"' if key == active else ''
        current = ' aria-current="page"' if key == active else ''
        parts.append(
            f'<a{active_bits} data-tool="{key}" href="{href}"{current}>'
            f'<span>{eyebrow}</span><strong>{label}</strong><b aria-hidden="true">↗</b></a>'
        )
    parts.append('</nav>')
    return "".join(parts)

# Stream Scan
text = STREAM_SCAN.read_text(encoding="utf-8")
old = '<nav class="creator-tool-nav stream-tool-nav" aria-label="Creator tools"><a href="creator-hub-south-africa.html">Creator Hub</a><a href="streaming-setup-south-africa.html">Streaming Support</a><a class="active" href="stream-scan.html" aria-current="page">Stream Scan</a></nav>'
text = replace_once(text, old, tool_nav("stream-scan"), "Stream Scan shared tool switcher")
text = replace_once(
    text,
    '<a class="scan-back text-link" href="streaming-setup-south-africa.html">← BACK TO STREAMING SUPPORT</a>',
    '<a class="button button-secondary scan-back" href="streaming-setup-south-africa.html">← BACK TO STREAMING SUPPORT</a>',
    "Stream Scan back button"
)
STREAM_SCAN.write_text(text, encoding="utf-8")

# Streaming Support
text = STREAM_SUPPORT.read_text(encoding="utf-8")
old = '<div class="creator-tool-nav" aria-label="Creator tools"><a href="creator-hub-south-africa.html">Creator Hub</a><a class="active" href="streaming-setup-south-africa.html" aria-current="page">Streaming Support</a><a href="stream-scan.html">Stream Scan</a></div>'
text = replace_once(text, old, tool_nav("stream-support"), "Streaming Support shared tool switcher")
STREAM_SUPPORT.write_text(text, encoding="utf-8")

# Signal Scan
text = SIGNAL_SCAN.read_text(encoding="utf-8")
old = '''    <div class="container scan-shell">
      <a class="scan-back text-link" id="scan-back" href="index.html">← BACK TO VOLTTECH</a>'''
new = f'''    <div class="container scan-shell">
      {tool_nav("signal")}
      <a class="button button-secondary scan-back" id="scan-back" href="index.html">← BACK TO VOLTTECH</a>'''
text = replace_once(text, old, new, "Signal Scan shared tool switcher + back button")
SIGNAL_SCAN.write_text(text, encoding="utf-8")

# Creator Hub
text = CREATOR.read_text(encoding="utf-8")
old = '''<main id="main-content" class="creator-hub-page">
  <div class="container">
    <section class="creator-hero" aria-labelledby="creator-title">'''
new = f'''<main id="main-content" class="creator-hub-page">
  <div class="container">
    {tool_nav("creator")}
    <section class="creator-hero" aria-labelledby="creator-title">'''
text = replace_once(text, old, new, "Creator Hub shared tool switcher")
CREATOR.write_text(text, encoding="utf-8")

# Unified CSS + persistent mobile Menu glow.
css = GLASS.read_text(encoding="utf-8")
start = "/* STEP 11.2P UNIFIED TOOL NAV START */"
end = "/* STEP 11.2P UNIFIED TOOL NAV END */"

block = r'''/* STEP 11.2P UNIFIED TOOL NAV START */
/*
  One control language across Signal Scan, Stream Scan, Stream Support and
  Creator Hub. These are navigation controls, so they render as proper
  coloured faux-glass buttons rather than plain text links.
*/
.vt-tool-switcher {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .65rem;
  margin: 0 0 clamp(1.35rem, 3vw, 2.25rem);
}

.vt-tool-switcher a {
  --tool-rgb: 74, 238, 220;
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    "meta arrow"
    "name arrow";
  align-items: center;
  gap: .12rem .6rem;
  min-height: 4.7rem;
  padding: .72rem .8rem;
  overflow: hidden;
  border: 1px solid rgba(var(--tool-rgb), .46);
  border-radius: var(--radius);
  background:
    linear-gradient(145deg, rgba(var(--tool-rgb), .105), rgba(3, 16, 18, .62)),
    rgba(3, 16, 18, .64);
  color: var(--text);
  text-decoration: none;
  box-shadow:
    0 0 0 1px rgba(var(--tool-rgb), .035),
    0 0 13px rgba(var(--tool-rgb), .085),
    inset 0 1px 0 rgba(255, 255, 255, .055);
  transition:
    transform var(--transition),
    border-color var(--transition),
    background var(--transition),
    box-shadow var(--transition);
}

.vt-tool-switcher a[data-tool="signal"] { --tool-rgb: 74, 238, 220; }
.vt-tool-switcher a[data-tool="stream-scan"] { --tool-rgb: 194, 140, 255; }
.vt-tool-switcher a[data-tool="stream-support"] { --tool-rgb: 120, 146, 255; }
.vt-tool-switcher a[data-tool="creator"] { --tool-rgb: 255, 102, 196; }

.vt-tool-switcher a::after {
  content:"";
  position:absolute;
  left:.75rem;
  right:48%;
  bottom:0;
  height:1px;
  background:linear-gradient(90deg, rgba(var(--tool-rgb), .86), transparent);
  box-shadow:0 0 8px rgba(var(--tool-rgb), .28);
}

.vt-tool-switcher a > span {
  grid-area: meta;
  color: rgb(var(--tool-rgb));
  font: 700 .48rem/1.2 var(--font-mono);
  letter-spacing: .10em;
}

.vt-tool-switcher a > strong {
  grid-area: name;
  color: #f1f8f7;
  font: 650 .78rem/1.18 var(--font-ui);
}

.vt-tool-switcher a > b {
  grid-area: arrow;
  color: rgb(var(--tool-rgb));
  font: 500 .9rem/1 var(--font-ui);
  text-shadow: 0 0 9px rgba(var(--tool-rgb), .28);
}

.vt-tool-switcher a:hover,
.vt-tool-switcher a:focus-visible,
.vt-tool-switcher a.active,
.vt-tool-switcher a[aria-current="page"] {
  border-color: rgba(var(--tool-rgb), .92);
  background:
    linear-gradient(145deg, rgba(var(--tool-rgb), .18), rgba(3, 16, 18, .68)),
    rgba(3, 16, 18, .68);
  box-shadow:
    0 0 0 1px rgba(var(--tool-rgb), .08),
    0 0 20px rgba(var(--tool-rgb), .22),
    inset 0 1px 0 rgba(255, 255, 255, .085);
  transform: translateY(-1px);
  outline: none;
}

.vt-tool-switcher a.active::before,
.vt-tool-switcher a[aria-current="page"]::before {
  content:"ACTIVE";
  position:absolute;
  top:.4rem;
  right:.45rem;
  color:rgba(var(--tool-rgb), .78);
  font:700 .38rem/1 var(--font-mono);
  letter-spacing:.09em;
}

/* Scan back links are controls, not leftover text links. */
.signal-scan-page .scan-back.button {
  width: fit-content;
  min-height: 2.7rem;
  margin-bottom: clamp(1.5rem, 3vw, 2.5rem);
  padding: .55rem .75rem;
  font: 650 .62rem/1.2 var(--font-mono);
  letter-spacing: .06em;
  text-decoration: none;
}

/* Streaming Support related destinations also read as clickable controls. */
.streaming-support-page .service-related {
  display: flex;
  flex-wrap: wrap;
  gap: .55rem;
  margin-top: .9rem;
}

.streaming-support-page .service-related a,
.streaming-support-page .service-helper a {
  display: inline-flex;
  align-items: center;
  min-height: 2.45rem;
  padding: .48rem .68rem;
  border: 1px solid rgba(194, 140, 255, .34);
  border-radius: var(--radius);
  background:
    linear-gradient(180deg, rgba(194, 140, 255, .08), rgba(3, 16, 18, .42)),
    rgba(3, 16, 18, .50);
  color: var(--text);
  text-decoration: none;
  box-shadow:
    0 0 11px rgba(194, 140, 255, .07),
    inset 0 1px 0 rgba(255, 255, 255, .045);
}

.streaming-support-page .service-related a:hover,
.streaming-support-page .service-related a:focus-visible,
.streaming-support-page .service-helper a:hover,
.streaming-support-page .service-helper a:focus-visible {
  border-color: rgba(194, 140, 255, .74);
  box-shadow:
    0 0 17px rgba(194, 140, 255, .18),
    inset 0 1px 0 rgba(255, 255, 255, .075);
}

/* Creator player outbound link should also look actionable. */
.creator-player-meta #playerLink {
  display:inline-flex;
  align-items:center;
  min-height:2.35rem;
  padding:.42rem .62rem;
  border:1px solid rgba(255,102,196,.34);
  border-radius:var(--radius);
  background:rgba(3,16,18,.52);
  color:#ffd8ef;
  text-decoration:none;
  box-shadow:0 0 11px rgba(255,102,196,.07);
}

/* The mobile Menu control is always visibly glassy before interaction. */
@media (max-width: 56rem) {
  body:not([data-page^="static"]):not([data-page^="admin"]) .menu-toggle:not([hidden]) {
    border: 1px solid rgba(53, 234, 215, .68);
    background:
      linear-gradient(180deg, rgba(53, 234, 215, .14), rgba(3, 18, 20, .34)),
      rgba(3, 16, 18, .52);
    color: #effffd;
    box-shadow:
      0 0 0 1px rgba(53, 234, 215, .06),
      0 0 16px rgba(53, 234, 215, .20),
      inset 0 1px 0 rgba(255, 255, 255, .08);
    text-shadow: 0 0 8px rgba(53, 234, 215, .16);
  }

  body:not([data-page^="static"]):not([data-page^="admin"]) .menu-toggle:not([hidden]):hover,
  body:not([data-page^="static"]):not([data-page^="admin"]) .menu-toggle:not([hidden]):focus-visible,
  body:not([data-page^="static"]):not([data-page^="admin"]) .menu-toggle:not([hidden])[aria-expanded="true"] {
    border-color: rgba(113, 255, 241, .96);
    box-shadow:
      0 0 0 1px rgba(53, 234, 215, .12),
      0 0 23px rgba(53, 234, 215, .32),
      inset 0 1px 0 rgba(255, 255, 255, .11);
  }
}

@media (max-width: 46rem) {
  .vt-tool-switcher {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: .55rem;
  }

  .vt-tool-switcher a {
    min-height: 4.35rem;
    padding: .65rem .7rem;
  }
}

@media (max-width: 24rem) {
  .vt-tool-switcher {
    grid-template-columns: 1fr;
  }
}
/* STEP 11.2P UNIFIED TOOL NAV END */'''

if start in css:
    css, n = re.subn(re.escape(start) + r".*?" + re.escape(end), block, css, count=1, flags=re.S)
    if n != 1:
        raise RuntimeError("Could not refresh Step 11.2P CSS block")
else:
    css = css.rstrip() + "\n\n" + block + "\n"

GLASS.write_text(css, encoding="utf-8")
print("STEP 11.2P PREPARED")
