# Step 1.2 — Asset provenance

Asset-first review covered the repository, its existing imagery, connected Drive metadata and the user-uploaded `VoltTech V3 Website images.zip`. Only images were used from that archive; no prototype implementation was inherited. Supplied manufacturer/product photos do not imply partnership, certification, stock or supply. Source filenames are retained here; rights were not independently re-licensed by this Step.

| Output | Source | Treatment |
|---|---|---|
| `assets/brand/volttech-logo.webp` | Existing `brand/VoltTech_Full_Logo_Transparent.png` | Official identity preserved; resized to 360px WebP, transparency preserved |
| `assets/brand/home-hero.webp` | Image Generation output | 2048×683, 140,788 bytes; illustrative concept, not a saleable PC |
| `assets/categories/gpu.webp` | `17_PROART-RTX5070TI-O16G_BOX & card.png` | 480px WebP; correct graphics card/packaging |
| `assets/categories/cpu.webp` | `luis-gonzalez-jgzdwJWCPDI-unsplash.jpg` | 480px WebP; AMD processor in motherboard |
| `assets/categories/motherboard.webp` | `1.ProArt Z890-CREATOR WIFI front view.png` | 480px WebP; manufacturer board image |
| `assets/categories/memory.webp` | `andrey-matveev-Mg7pduO-CHY-unsplash.jpg` | 480px WebP; desktop RAM |
| `assets/categories/storage.webp` | `samsung-memory-MJkGUYwMYr4-unsplash.jpg` | 480px WebP; installed NVMe SSD |
| `assets/categories/psu.webp` | `ROG-STRIX-1200G-AURA-GAMING_8_light.png` | 480px WebP; power supply |

Existing cooling/case and editorial/setup photos are reused in place: `vt-stock-cooling-rgb.webp`, `vt-stock-modern-build.webp`, `vt-drive-premium-pc.webp`, `vt-drive-creator-desk.webp`, `vt-px-pc-workstation.webp`, `vt-drive-rtx-interior.webp`, `vt-stock-premium-rig.webp`. The official source logo remains for other pages. No manufacturer logo was fabricated. Image elements have real intrinsic dimensions, descriptive or intentionally decorative alt text, and below-fold lazy loading.

## Hero generation record

Mode: image generation with the supplied reference as composition guidance; generated text/UI excluded. The displayed PC is not a particular product SKU. The homepage identifies the artwork as a concept visual on desktop; no product name, offer or price is attached on any viewport.

Prompt brief: create a wide 3:1 premium dark PC workshop/garage scene matching the supplied composition; black tempered-glass enthusiast tower on the right (roughly 62–85% of the frame), restrained teal-lit internal fans and reflections, left 48% kept dark and quiet for HTML headings, subtle high-performance garage atmosphere, no text, UI, logos, watermarks or identifiable manufacturer; sophisticated realism, teal rather than multicolour RGB.

Final repository asset: `assets/brand/home-hero.webp`. No generated typography, product labels, ratings or diagnostic values are baked into it. Normal encoding/resizing was used for web delivery; no product-photo identity edits were made.
