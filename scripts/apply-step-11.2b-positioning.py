#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
home_path = ROOT / "src/pages/home.html"
css_path = ROOT / "assets/css/pages/home.css"

home = home_path.read_text(encoding="utf-8")
css = css_path.read_text(encoding="utf-8")

old_stream = '''      <a class="stream-support-mini" href="{{ROOT}}streaming-setup-south-africa.html" aria-label="Explore VoltTech Stream Support">
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
      </a>'''

new_stream = '''      <a class="stream-support-panel" href="{{ROOT}}streaming-setup-south-africa.html" aria-label="Explore VoltTech Stream Support">
        <div class="section-heading"><h2>Stream Support</h2></div>
        <p class="eyebrow">OBS / Streamlabs / Creator Tech</p>
        <p class="stream-support-intro">Dropped frames, encoder overload, audio routing, capture cards or creator-PC performance. Get the whole stream path dialled in.</p>
        <div class="stream-support-image">
          <img src="{{ROOT}}vt-px-streaming-setup.webp" alt="Streaming and creator setup" width="1200" height="800" loading="lazy">
          <span>REMOTE ACROSS SOUTH AFRICA</span>
        </div>
        <div class="stream-support-tags"><span>OBS</span><span>STREAMLABS</span><span>AUDIO</span><span>PERFORMANCE</span></div>
        <span class="stream-support-link">EXPLORE STREAM SUPPORT <b aria-hidden="true">→</b></span>
      </a>'''

if old_stream in home:
    home = home.replace(old_stream, new_stream, 1)
elif 'class="stream-support-panel"' not in home:
    print("STEP 11.2B THREE-TOOL LAYOUT FAILED")
    print("- existing Stream Support tool markup not found")
    sys.exit(1)

home_path.write_text(home, encoding="utf-8")

new_css = r'''/* Step 11.2B three connected tool panels */
@media(min-width:56.01rem){
  .tool-grid{
    grid-template-columns:repeat(3,minmax(0,1fr));
    gap:0;
    align-items:stretch;
  }
  .builder-panel,
  .scan-panel,
  .stream-support-panel{
    min-width:0;
    min-height:480px;
    margin:0;
    padding:1.6rem;
    border:0;
    border-left:1px solid var(--border-strong);
    background:var(--black);
  }
  .builder-panel{
    display:flex;
    flex-direction:column;
    grid-column:auto;
    grid-row:auto;
    padding-left:0;
    border-left:0;
    padding-right:1.6rem;
  }
  .scan-panel{
    display:flex;
    flex-direction:column;
    grid-column:auto;
    grid-row:auto;
    padding:1.6rem;
    border-left:1px solid var(--border-strong);
  }
  .stream-support-panel{
    display:flex;
    flex-direction:column;
    grid-column:auto;
    grid-row:auto;
    padding-right:0;
    color:var(--text);
    text-decoration:none;
    border-left:1px solid var(--border-strong);
    border-right:0;
  }
  .builder-panel .tool-copy{
    display:flex;
    flex-direction:column;
  }
  .builder-panel .tool-copy>.button{
    align-self:flex-start;
  }
  .builder-art{
    order:2;
    width:100%;
    height:205px;
    margin-top:1rem;
    object-fit:cover;
    object-position:50% 46%;
    border:1px solid var(--border);
  }
  .build-steps{
    order:3;
    display:grid;
    grid-template-columns:repeat(3,minmax(0,1fr));
    gap:.5rem;
    width:100%;
    margin-top:auto;
    padding-top:.75rem;
    border-top:1px solid var(--border);
  }
  .build-steps li{
    display:block;
    padding:.45rem 0 0;
    border:0;
    font-size:.49rem;
    text-align:center;
  }
  .build-steps span{
    display:block;
    margin-bottom:.2rem;
    font-size:.8rem;
  }
  .scan-panel>.micro{
    margin-top:auto;
  }
  .scan-steps{
    margin-top:auto;
  }
}
.stream-support-panel{
  color:var(--text);
  text-decoration:none;
  transition:background var(--transition);
}
.stream-support-panel:hover,
.stream-support-panel:focus-visible{
  color:var(--text);
  background:rgba(194,140,255,.035);
  outline:none;
}
.stream-support-panel .section-heading{
  margin-bottom:.45rem;
}
.stream-support-panel .eyebrow{
  margin:0 0 .75rem;
  color:#c28cff;
  font-size:.58rem;
}
.stream-support-intro{
  margin:0;
  color:var(--text-secondary);
  font-size:.76rem;
  line-height:1.5;
}
.stream-support-image{
  position:relative;
  width:100%;
  margin-top:1rem;
  border:1px solid rgba(194,140,255,.72);
  overflow:hidden;
}
.stream-support-image img{
  display:block;
  width:100%;
  height:205px;
  object-fit:cover;
  object-position:center;
}
.stream-support-image span{
  position:absolute;
  left:.55rem;
  bottom:.5rem;
  padding:.26rem .38rem;
  border:1px solid rgba(218,187,255,.7);
  background:rgba(8,7,11,.82);
  color:#eadcff;
  font:600 .48rem/1.2 var(--font-mono);
  letter-spacing:.06em;
}
.stream-support-tags{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:.35rem;
  margin-top:.7rem;
}
.stream-support-tags span{
  padding:.32rem .38rem;
  border:1px solid rgba(194,140,255,.28);
  color:#d9bbff;
  text-align:center;
  font:500 .48rem/1 var(--font-mono);
  letter-spacing:.04em;
}
.stream-support-link{
  margin-top:auto;
  padding-top:.75rem;
  color:#eadcff;
  font:600 .52rem/1.3 var(--font-mono);
  letter-spacing:.045em;
}
.stream-support-link b{
  color:#c28cff;
  font-size:.8rem;
  font-weight:500;
}
@media(max-width:56rem){
  .tool-grid{
    grid-template-columns:1fr;
  }
  .builder-panel,
  .scan-panel,
  .stream-support-panel{
    grid-column:1;
    grid-row:auto;
    margin:0;
    padding:1.5rem 0;
    min-height:0;
    border-left:0;
    border-right:0;
    border-top:1px solid var(--border);
    background:var(--black);
  }
  .builder-panel{
    border-top:0;
    grid-template-columns:1.2fr 1fr .75fr;
  }
  .scan-panel{
    border-top:1px solid var(--border-strong);
  }
  .stream-support-panel{
    border-top:1px solid rgba(194,140,255,.6);
  }
  .stream-support-image img{
    height:220px;
  }
  .stream-support-link{
    margin-top:.75rem;
  }
}
@media(max-width:40rem){
  .builder-panel{
    grid-template-columns:1.2fr 1fr;
  }
  .builder-art{
    height:210px;
    margin-top:0;
  }
  .stream-support-panel{
    padding-block:1.25rem;
  }
  .stream-support-image img{
    height:180px;
  }
  .stream-support-tags{
    grid-template-columns:repeat(4,minmax(0,1fr));
  }
  .stream-support-tags span{
    padding:.28rem .2rem;
    font-size:.43rem;
  }
}
'''

old_pattern = r'/\* Step 11\.2B compact Stream Support tool card \*/[\s\S]*\Z'
if re.search(old_pattern, css):
    css = re.sub(old_pattern, new_css, css, count=1)
elif '/* Step 11.2B three connected tool panels */' not in css:
    css = css.rstrip() + '\n\n' + new_css

css_path.write_text(css.rstrip() + '\n', encoding="utf-8")

print("PASS: PC Builder, Signal Scan and Stream Support are now three connected tool panels")
print("- desktop order: PC Builder | Signal Scan | Stream Support")
print("- PC Builder image restored as a large panel image")
print("- Stream Support uses a purple border/accent only")
print("- no new image, JavaScript or CSS files")
