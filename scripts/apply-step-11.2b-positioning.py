#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
home_path = ROOT / "src/pages/home.html"
css_path = ROOT / "assets/css/pages/home.css"

home = home_path.read_text(encoding="utf-8")
css = css_path.read_text(encoding="utf-8")

compact = '''  <section class="stream-support-spotlight" aria-label="VoltTech Stream Support">
    <div class="container">
      <a class="stream-support-card" href="{{ROOT}}streaming-setup-south-africa.html">
        <div class="stream-support-card-media">
          <img src="{{ROOT}}vt-px-streaming-setup.webp" alt="Streaming and creator setup" width="1200" height="800" loading="lazy">
          <span class="stream-support-card-badge">STREAM SUPPORT</span>
        </div>
        <div class="stream-support-card-copy">
          <p class="eyebrow">OBS / STREAMLABS / CREATOR TECH</p>
          <h2>Get your stream dialled in.</h2>
          <p>Dropped frames, encoder overload, audio routing, capture cards or a full setup—VoltTech helps creators get the whole stream path working properly.</p>
          <div class="stream-support-card-meta"><span>OBS</span><span>STREAMLABS</span><span>AUDIO</span><span>PERFORMANCE</span></div>
          <span class="stream-support-card-cta">EXPLORE STREAM SUPPORT <b aria-hidden="true">→</b></span>
        </div>
      </a>
    </div>
  </section>

'''

# Remove previous oversized feature if it exists.
home = re.sub(
    r'\n  <section class="stream-support-feature"[\s\S]*?</section>\n\n',
    '\n',
    home,
    count=1
)

# Insert compact card immediately after hero, before components.
if 'class="stream-support-spotlight"' not in home:
    marker = '  <section class="home-section" id="components"'
    if marker not in home:
        print("STEP 11.2B COMPACT CARD FAILED")
        print("- homepage components marker not found")
        sys.exit(1)
    home = home.replace(marker, compact + marker, 1)

if 'class="stream-support-feature"' in home:
    print("STEP 11.2B COMPACT CARD FAILED")
    print("- oversized Stream Support feature still remains")
    sys.exit(1)

home_path.write_text(home, encoding="utf-8")

compact_css = r'''/* Step 11.2B compact Stream Support spotlight */
.stream-support-spotlight{
  padding-block:.85rem;
  border-bottom:1px solid var(--border-strong);
  background:var(--black);
}
.stream-support-card{
  position:relative;
  display:grid;
  grid-template-columns:minmax(180px,.42fr) minmax(0,1fr);
  min-height:172px;
  overflow:hidden;
  border:1px solid rgba(194,140,255,.42);
  background:linear-gradient(110deg,rgba(96,42,145,.9),rgba(38,20,59,.96) 44%,rgba(10,18,21,.98));
  color:var(--text);
  text-decoration:none;
  transition:border-color var(--transition),transform var(--transition),background var(--transition);
}
.stream-support-card:hover,
.stream-support-card:focus-visible{
  color:var(--text);
  border-color:#c28cff;
  transform:translateY(-1px);
  outline:none;
  background:linear-gradient(110deg,rgba(110,47,166,.95),rgba(45,22,70,.98) 44%,rgba(10,18,21,.98));
}
.stream-support-card-media{
  position:relative;
  min-width:0;
  overflow:hidden;
  border-right:1px solid rgba(194,140,255,.28);
}
.stream-support-card-media::after{
  content:"";
  position:absolute;
  inset:0;
  background:linear-gradient(90deg,transparent 50%,rgba(42,20,64,.38));
  pointer-events:none;
}
.stream-support-card-media img{
  width:100%;
  height:100%;
  min-height:172px;
  object-fit:cover;
  object-position:center;
  display:block;
}
.stream-support-card-badge{
  position:absolute;
  left:.7rem;
  bottom:.65rem;
  z-index:1;
  padding:.32rem .48rem;
  border:1px solid rgba(255,255,255,.35);
  background:rgba(12,7,18,.78);
  color:#eadcff;
  font:600 .56rem/1.2 var(--font-mono);
  letter-spacing:.09em;
}
.stream-support-card-copy{
  display:flex;
  flex-direction:column;
  justify-content:center;
  min-width:0;
  padding:1.05rem 1.25rem;
}
.stream-support-card-copy .eyebrow{
  margin:0 0 .45rem;
  color:#c28cff;
  font-size:.58rem;
}
.stream-support-card-copy h2{
  margin:0 0 .5rem;
  font-size:clamp(1.15rem,2vw,1.8rem);
  line-height:1.02;
  letter-spacing:-.025em;
}
.stream-support-card-copy>p:not(.eyebrow){
  max-width:64ch;
  margin:0;
  color:rgba(245,241,250,.78);
  font-size:.76rem;
  line-height:1.5;
}
.stream-support-card-meta{
  display:flex;
  flex-wrap:wrap;
  gap:.35rem;
  margin-top:.75rem;
}
.stream-support-card-meta span{
  padding:.25rem .4rem;
  border:1px solid rgba(194,140,255,.25);
  color:#d9bbff;
  font:500 .51rem/1 var(--font-mono);
  letter-spacing:.055em;
}
.stream-support-card-cta{
  align-self:flex-end;
  margin-top:-1.3rem;
  color:#eadcff;
  font:600 .58rem/1.3 var(--font-mono);
  letter-spacing:.055em;
}
.stream-support-card-cta b{
  color:#c28cff;
  font-size:.85rem;
  font-weight:500;
}
@media(max-width:56rem){
  .stream-support-card{grid-template-columns:minmax(150px,.38fr) minmax(0,1fr)}
  .stream-support-card-copy{padding:.9rem 1rem}
  .stream-support-card-cta{margin-top:.65rem;align-self:flex-start}
}
@media(max-width:40rem){
  .stream-support-spotlight{padding-block:.65rem}
  .stream-support-card{grid-template-columns:34% minmax(0,1fr);min-height:154px}
  .stream-support-card-media img{min-height:154px}
  .stream-support-card-badge{left:.45rem;bottom:.45rem;padding:.25rem .35rem;font-size:.48rem}
  .stream-support-card-copy{padding:.72rem .75rem}
  .stream-support-card-copy .eyebrow{font-size:.49rem;margin-bottom:.28rem}
  .stream-support-card-copy h2{font-size:1.05rem;margin-bottom:.35rem}
  .stream-support-card-copy>p:not(.eyebrow){
    display:-webkit-box;
    -webkit-line-clamp:3;
    -webkit-box-orient:vertical;
    overflow:hidden;
    font-size:.66rem;
    line-height:1.4;
  }
  .stream-support-card-meta{gap:.25rem;margin-top:.5rem}
  .stream-support-card-meta span{font-size:.45rem;padding:.2rem .28rem}
  .stream-support-card-meta span:nth-child(n+4){display:none}
  .stream-support-card-cta{margin-top:.5rem;font-size:.5rem}
}
'''

old_pattern = r'/\* Step 11\.2B Stream Support feature \*/[\s\S]*\Z'
if re.search(old_pattern, css):
    css = re.sub(old_pattern, compact_css, css, count=1)
elif '/* Step 11.2B compact Stream Support spotlight */' not in css:
    css = css.rstrip() + '\n\n' + compact_css

css_path.write_text(css.rstrip() + '\n', encoding="utf-8")

print("PASS: compact Stream Support spotlight prepared")
print("- src/pages/home.html")
print("- assets/css/pages/home.css")
