#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
css_path = ROOT / "assets/css/pages/services.css"
css = css_path.read_text(encoding="utf-8")

old = """.service-hero{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(20rem,.85fr);gap:clamp(1.25rem,4vw,3rem);align-items:stretch}.service-hero-copy{align-self:center;padding:clamp(.5rem,2vw,1rem) 0}.service-hero h1{max-width:13ch;margin:.7rem 0 1rem;font-size:clamp(3rem,7vw,6.3rem);line-height:.9;letter-spacing:-.055em}.service-hero h1 span{display:block;margin-top:.65rem;color:var(--service-accent);font-size:clamp(1.2rem,2.5vw,2rem);line-height:1.1;letter-spacing:-.025em}.service-lead{max-width:50rem;margin:0;color:var(--text-secondary);font-size:clamp(1rem,1.4vw,1.18rem);line-height:1.7}.service-actions{display:flex;flex-wrap:wrap;gap:.7rem;margin-top:1.5rem}.service-actions .button{min-width:11rem;text-decoration:none}.service-location{margin:1.15rem 0 0;color:var(--text-muted)}
.service-hero-media{position:relative;min-height:28rem;margin:0;overflow:hidden;border:1px solid var(--border);background:var(--black)}.service-hero-media:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(3,16,18,.03),rgba(3,16,18,.75))}.service-hero-media img{width:100%;height:100%;object-fit:cover}.service-hero-media figcaption{position:absolute;z-index:2;inset:auto 1rem 1rem;display:flex;justify-content:space-between;gap:1rem;color:var(--text);font:650 .7rem/1.3 var(--font-mono);letter-spacing:.07em}.service-hero-media figcaption span{color:var(--service-accent)}"""

new = """.service-hero{position:relative;isolation:isolate;min-height:0;overflow:hidden;border:1px solid var(--border);background:var(--black)}.service-hero-copy{position:relative;z-index:3;width:min(64%,50rem);padding:clamp(1.25rem,3vw,2rem)}.service-hero h1{max-width:13ch;margin:.7rem 0 1rem;font-size:clamp(3rem,7vw,6.3rem);line-height:.9;letter-spacing:-.055em}.service-hero h1 span{display:block;margin-top:.65rem;color:var(--service-accent);font-size:clamp(1.2rem,2.5vw,2rem);line-height:1.1;letter-spacing:-.025em}.service-lead{max-width:46rem;margin:0;color:var(--text-secondary);font-size:clamp(1rem,1.4vw,1.18rem);line-height:1.7}.service-actions{display:flex;flex-wrap:wrap;gap:.7rem;margin-top:1.5rem}.service-actions .button{min-width:11rem;text-decoration:none}.service-location{margin:1.15rem 0 0;color:var(--text-muted)}
.service-hero:after{content:"";position:absolute;z-index:2;inset:0;pointer-events:none;background:linear-gradient(90deg,var(--black) 0%,rgba(3,16,18,.97) 37%,rgba(3,16,18,.72) 57%,rgba(3,16,18,.18) 78%,rgba(3,16,18,.1) 100%)}
.service-hero-media{position:absolute;z-index:1;inset:0 0 0 auto;width:52%;min-height:0;margin:0;overflow:hidden;border:0;border-left:1px solid var(--border);background:var(--black)}.service-hero-media:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(3,16,18,.02),rgba(3,16,18,.36))}.service-hero-media img{display:block;width:100%;height:100%;object-fit:cover;object-position:center}.service-hero-media figcaption{display:none}"""

if new not in css:
    if old not in css:
        print("STEP 11.2D FAILED")
        print("- expected existing service hero CSS block was not found")
        sys.exit(1)
    css = css.replace(old, new, 1)

old_media = """@media(max-width:64rem){.service-hero{grid-template-columns:1fr}.service-hero-media{min-height:22rem}.service-grid,.service-steps{grid-template-columns:repeat(2,minmax(0,1fr))}.service-trust{grid-template-columns:1fr}.service-demo{grid-template-columns:1fr}}
@media(max-width:44rem){.service-hero h1{font-size:clamp(3rem,14vw,4.8rem)}.service-network a{min-width:7rem}.service-hero-media{min-height:17rem}.service-grid,.service-steps,.service-trust-grid{grid-template-columns:1fr}.service-detail{grid-template-columns:1fr;align-items:start}.service-detail .text-link{white-space:normal}.service-actions{display:grid}.service-actions .button{width:100%}.service-symptom-rail{grid-auto-columns:minmax(14rem,78vw)}}"""

new_media = """@media(max-width:64rem){.service-hero-copy{width:min(72%,44rem)}.service-hero-media{width:58%}.service-hero:after{background:linear-gradient(90deg,var(--black) 0%,rgba(3,16,18,.97) 43%,rgba(3,16,18,.68) 66%,rgba(3,16,18,.18) 100%)}.service-grid,.service-steps{grid-template-columns:repeat(2,minmax(0,1fr))}.service-trust{grid-template-columns:1fr}.service-demo{grid-template-columns:1fr}}
@media(max-width:44rem){.service-hero{border-left:0;border-right:0}.service-hero-copy{width:100%;padding:1.2rem 1rem 1.3rem}.service-hero h1{max-width:10ch;font-size:clamp(2.8rem,13vw,4.5rem)}.service-lead{max-width:88%;font-size:.9rem;line-height:1.62}.service-network a{min-width:7rem}.service-hero-media{width:66%;border-left:0;opacity:.7}.service-hero-media img{object-position:58% center}.service-hero:after{background:linear-gradient(90deg,var(--black) 0%,rgba(3,16,18,.98) 49%,rgba(3,16,18,.84) 66%,rgba(3,16,18,.34) 100%)}.service-grid,.service-steps,.service-trust-grid{grid-template-columns:1fr}.service-detail{grid-template-columns:1fr;align-items:start}.service-detail .text-link{white-space:normal}.service-actions{display:flex;flex-wrap:wrap}.service-actions .button{width:auto;min-width:9rem;padding-inline:.85rem}.service-symptom-rail{grid-auto-columns:minmax(14rem,78vw)}}
@media(max-width:32rem){.service-hero-copy{padding:.95rem .8rem 1.1rem}.service-hero h1{font-size:clamp(2.65rem,12.5vw,4rem)}.service-lead{max-width:92%;font-size:.86rem}.service-actions{gap:.5rem;margin-top:1rem}.service-actions .button{min-width:0;font-size:.64rem}.service-location{margin-top:.85rem;font-size:.54rem}.service-hero-media{width:70%;opacity:.64}.service-hero:after{background:linear-gradient(90deg,var(--black) 0%,rgba(3,16,18,.99) 52%,rgba(3,16,18,.86) 69%,rgba(3,16,18,.4) 100%)}}"""

if new_media not in css:
    if old_media not in css:
        print("STEP 11.2D FAILED")
        print("- expected responsive service hero CSS block was not found")
        sys.exit(1)
    css = css.replace(old_media, new_media, 1)

css_path.write_text(css, encoding="utf-8")
print("PASS: integrated all service hero images into the title block")
