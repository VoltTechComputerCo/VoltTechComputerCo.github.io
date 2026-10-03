-- Backfill durable product-media provenance without changing curated product imagery.
-- Exact directImage/primaryImage mappings remain authoritative.
with src(id, source_page) as (
  values
    ('vt-mem-corsair-dominator-32-ddr5-6400', 'https://www.newegg.com/corsair-dominator-titanium-32gb-ddr5-6400-cas-latency-cl32-desktop-memory-black/p/N82E16820982090?Item=N82E16820982090'),
    ('vt-mem-corsair-vengeance-32-ddr5-6000', 'https://www.mindfactory.de/product_info.php/32GB-Corsair-Vengeance-schwarz-DDR5-6000-DIMM-CL36-Dual-Kit_1456999.html'),
    ('vt-mem-corsair-vengeance-64-ddr5-6000', 'https://www.corsair.com/us/en/c/memory?filter-memory-series=vengeance-ddr5'),
    ('vt-mem-corsair-vengeance-96-ddr5-6000', 'https://brain.com.ua/Modul_pamyati_dlya_kompyutera_DDR5_96GB_2x48GB_6000_MHz_Vengeance_Black_Corsair_CMK96GX5M2B6000C30-p1078253.html'),
    ('vt-mem-corsair-vengeance-lpx-32-ddr4-3200', 'https://www.corsair.com/us/en/c/memory?filter-memory-series=vengeance-lpx'),
    ('vt-mem-gskill-flare-x5-64-ddr5-6000', 'https://www.gskill.com/products/1/165/396/Flare-X5-DDR5-AMD-EXPO'),
    ('vt-mem-gskill-trident-z5-128-ddr5-6000', 'https://www.ldlc.com/en/product/PB00707526.html'),
    ('vt-mem-gskill-trident-z5-32-ddr5-7200', 'https://www.gskill.com/products/1/165/374/Trident-Z5-RGB-DDR5-Intel-XMP'),
    ('vt-mem-kingston-fury-beast-32-ddr5-6000', 'https://shop.kingston.com/products/beast-ddr5-desktop-memory'),
    ('vt-mem-kingston-fury-beast-48-ddr5-6000', 'https://www.kingston.com/en/memory/gaming/kingston-fury-beast-ddr5-memory?kit=kit+of+2&speed=6000mt%2Fs'),
    ('vt-mem-kingston-fury-renegade-64-ddr5-6400', 'https://www.kingston.com/en/memory/gaming/fury-renegade-ddr5')
)
update public.store_products p
set media = jsonb_set(coalesce(p.media, '{}'::jsonb), '{sourcePage}', to_jsonb(src.source_page), true)
from src
where p.id = src.id
  and p.status = 'active'
  and p.visibility = 'public'
  and coalesce(p.media->>'sourcePage', '') = '';
