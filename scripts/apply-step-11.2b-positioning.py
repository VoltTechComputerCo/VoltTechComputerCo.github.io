# TOOL_AREA_RETRY_1
#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
home_path = ROOT / "src/pages/home.html"
css_path = ROOT / "assets/css/pages/home.css"

home = home_path.read_text(encoding="utf-8")
css = css_path.read_text(encoding="utf-8")

# Remove the standalone spotlight near the top of the page.
home = re.sub(
    r'\n  <section class="stream-support-spotlight"[\s\S]*?</section>\n\n',
    '\n',
    home,
    count=1
)

mini = '''      <a class="stream-support-mini" href="{{ROOT}}streaming-setup-south-africa.html" aria-label="Explore VoltTech Stream Support">
        <div class="stream-support-mini-media">
          <img src="{{ROOT}}vt-px-streaming-setup.webp" alt="Streaming and creator setup" width="1200" height="800" loading="lazy">
          <span>STREAM SUPPORT</span>
        </div>
        <div class="stream-support-mini-copy">
          <p class="eyebrow">OBS / STREAMLABS / CREATOR TECH</p>
          <h3>Get your stream dialled in.</h3>
          <p>Dropped frames, encoder overload, audio, capture cards and creator-PC performance.</p>
          <span class="stream-support-mini-link">EXPLORE STREAM SUPPORT <b aria-hidden="true">→</b></span>
        </div>
      </a>
'''

# Insert into the same tool area as PC Builder and Signal Scan.
if 'class="stream-support-mini"' not in home:
    marker = '''        <p class="micro">Guided by your answers. No remote hardware readings.</p>
      </article>
    </div>
  </section>'''
    replacement = '''        <p class="micro">Guided by your answers. No remote hardware readings.</p>
      </article>
''' + mini + '''    </div>
  </section>'''
    if marker not in home:
        print("STEP 11.2B TOOL CARD FAILED")
        print("- tool-section insertion marker not found")
        sys.exit(1)
    home = home.replace(marker, replacement, 1)

if 'class="stream-support-spotlight"' in home:
    print("STEP 11.2B TOOL CARD FAILED")
    print("- old standalone spotlight still exists")
    sys.exit(1)

home_path.write_text(home, encoding="utf-8")

tool_css = r'''/* Step 11.2B compact Stream Support tool card */
@media(min-width:56.01rem){
  .builder-panel{
    grid-column:1;
    grid-row:1 / span 2;
  }
  .scan-panel{
    grid-column:2;
    grid-row:1;
  }
  .stream-support-mini{
    grid-column:2;
    grid-row:2;
  }
}
.stream-support-mini{
  display:grid;
  grid-template-columns:118px minmax(0,1fr);
  min-width:0;
  min-height:126px;
  margin:0 0 1.5rem 1.5rem;
  overflow:hidden;
  border:1px solid rgba(194,140,255,.72);
  background:
    linear-gradient(100deg,rgba(194,140,255,.055),transparent 48%),
    var(--black);
  color:var(--text);
  text-decoration:none;
  transition:border-color var(--transition),background var(--transition),transform var(--transition);
}
.stream-support-mini:hover,
.stream-support-mini:focus-visible{
  color:var(--text);
  border-color:#c28cff;
  background:
    linear-gradient(100deg,rgba(194,140,255,.1),transparent 52%),
    var(--panel-raised);
  transform:translateY(-1px);
  outline:none;
}
.stream-support-mini-media{
  position:relative;
  min-width:0;
  border-right:1px solid rgba(194,140,255,.34);
}
.stream-support-mini-media img{
  width:100%;
  height:100%;
  min-height:124px;
  object-fit:cover;
  object-position:center;
  display:block;
}
.stream-support-mini-media span{
  position:absolute;
  left:.45rem;
  bottom:.45rem;
  padding:.25rem .35rem;
  border:1px solid rgba(218,187,255,.65);
  background:rgba(9,6,13,.8);
  color:#eadcff;
  font:600 .47rem/1.2 var(--font-mono);
  letter-spacing:.075em;
}
.stream-support-mini-copy{
  display:flex;
  flex-direction:column;
  justify-content:center;
  min-width:0;
  padding:.72rem .85rem;
}
.stream-support-mini-copy .eyebrow{
  margin:0 0 .28rem;
  color:#c28cff;
  font-size:.49rem;
}
.stream-support-mini-copy h3{
  margin:0 0 .28rem;
  font-size:.95rem;
  line-height:1.1;
}
.stream-support-mini-copy>p:not(.eyebrow){
  margin:0;
  color:var(--text-secondary);
  font-size:.62rem;
  line-height:1.45;
}
.stream-support-mini-link{
  margin-top:.52rem;
  color:#eadcff;
  font:600 .49rem/1.2 var(--font-mono);
  letter-spacing:.045em;
}
.stream-support-mini-link b{
  color:#c28cff;
  font-size:.72rem;
  font-weight:500;
}
@media(max-width:56rem){
  .builder-panel,
  .scan-panel,
  .stream-support-mini{
    grid-column:1;
    grid-row:auto;
  }
  .stream-support-mini{
    margin:0 0 1.5rem;
    grid-template-columns:minmax(128px,.34fr) minmax(0,1fr);
    min-height:138px;
  }
  .stream-support-mini-media img{
    min-height:136px;
  }
}
@media(max-width:40rem){
  .stream-support-mini{
    margin:0 0 1.25rem;
    grid-template-columns:34% minmax(0,1fr);
    min-height:145px;
  }
  .stream-support-mini-media img{
    min-height:143px;
  }
  .stream-support-mini-copy{
    padding:.72rem;
  }
  .stream-support-mini-copy h3{
    font-size:1rem;
  }
  .stream-support-mini-copy>p:not(.eyebrow){
    display:-webkit-box;
    -webkit-line-clamp:3;
    -webkit-box-orient:vertical;
    overflow:hidden;
    font-size:.64rem;
  }
}
'''

# Replace prior compact spotlight CSS with the tool-card CSS.
old_pattern = r'/\* Step 11\.2B compact Stream Support spotlight \*/[\s\S]*\Z'
if re.search(old_pattern, css):
    css = re.sub(old_pattern, tool_css, css, count=1)
elif '/* Step 11.2B compact Stream Support tool card */' not in css:
    css = css.rstrip() + '\n\n' + tool_css

css_path.write_text(css.rstrip() + '\n', encoding="utf-8")

print("PASS: Stream Support moved into the PC Builder / Signal Scan tool area")
print("- no new asset files")
print("- no new JavaScript files")
print("- no new CSS files")
print("- src/pages/home.html")
print("- assets/css/pages/home.css")
