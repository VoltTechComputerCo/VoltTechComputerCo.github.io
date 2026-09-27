#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / "assets/css/glass-system.css"

css = CSS.read_text(encoding="utf-8")

start = "/* STEP 11.2L PROCEDURAL TECH BACKGROUND START */"
end = "/* STEP 11.2L PROCEDURAL TECH BACKGROUND END */"

block = r'''/* STEP 11.2L PROCEDURAL TECH BACKGROUND START */
/*
  Lightweight VoltTech technical canvas.
  Pure CSS: no images, animation, filters, fixed layers or backdrop blur.
  The visual language is closer to a dark PCB / engineering blueprint.
*/
body:not([data-page^="static"]):not([data-page^="admin"]) {
  --vt-tech-major: rgba(73, 222, 210, .095);
  --vt-tech-minor: rgba(116, 181, 177, .038);
  --vt-tech-node: rgba(117, 244, 232, .16);
  --vt-tech-trace: rgba(70, 210, 198, .050);

  background-color: #020b0d;
  background-image:
    radial-gradient(circle at 1px 1px, var(--vt-tech-node) 1px, transparent 1.25px),
    repeating-linear-gradient(
      135deg,
      transparent 0 138px,
      var(--vt-tech-trace) 138px 139px,
      transparent 139px 278px
    ),
    linear-gradient(var(--vt-tech-major) 1px, transparent 1px),
    linear-gradient(90deg, var(--vt-tech-major) 1px, transparent 1px),
    linear-gradient(var(--vt-tech-minor) 1px, transparent 1px),
    linear-gradient(90deg, var(--vt-tech-minor) 1px, transparent 1px),
    linear-gradient(180deg, #041012 0%, #020b0d 46%, #031012 100%);

  background-size:
    72px 72px,
    278px 278px,
    72px 72px,
    72px 72px,
    18px 18px,
    18px 18px,
    auto;

  background-position:
    0 0,
    0 0,
    0 0,
    0 0,
    0 0,
    0 0,
    0 0;
}

body:not([data-page^="static"]):not([data-page^="admin"]) :is(
  main,
  .section,
  .home-section,
  .tool-section,
  .contact-section,
  .creator-strip
) {
  background-color: transparent;
}

body:not([data-page^="static"]):not([data-page^="admin"]) :is(
  .tool-section,
  .creator-strip
) {
  background-image: linear-gradient(
    180deg,
    rgba(2, 10, 12, .46),
    rgba(2, 10, 12, .58)
  );
}

body[data-page="streaming-support"],
body[data-page="stream-scan"],
body[data-page="creator-hub-south-africa"] {
  --vt-tech-major: rgba(112, 205, 196, .085);
  --vt-tech-node: rgba(176, 225, 220, .15);
  --vt-tech-trace: rgba(127, 190, 185, .045);
}

@media (max-width: 40rem) {
  body:not([data-page^="static"]):not([data-page^="admin"]) {
    --vt-tech-major: rgba(73, 222, 210, .082);
    --vt-tech-minor: rgba(116, 181, 177, .030);
    --vt-tech-node: rgba(117, 244, 232, .13);

    background-size:
      60px 60px,
      240px 240px,
      60px 60px,
      60px 60px,
      15px 15px,
      15px 15px,
      auto;
  }
}

@media print {
  body {
    background: #fff !important;
  }
}
/* STEP 11.2L PROCEDURAL TECH BACKGROUND END */'''

if start in css:
    pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.S)
    css, n = pattern.subn(block, css, count=1)
    if n != 1:
        raise RuntimeError("Could not refresh Step 11.2L block")
else:
    css = css.rstrip() + "\n\n" + block + "\n"

CSS.write_text(css, encoding="utf-8")
print("STEP 11.2L PREPARED")
