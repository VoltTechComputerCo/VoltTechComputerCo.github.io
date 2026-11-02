-- VoltTech Gaming PC Specialist Store - 2026-11-02
-- Sourced from the live Supabase production database after second-pass curation.
-- RLS, account/auth, order, supplier offer and pricing schemas remain unchanged.
-- Do not run this blindly as a migration: keep approval metadata and static snapshot exclusions coordinated.

CREATE OR REPLACE FUNCTION public.vt_store_focus2_group(p_category text, p_type text, p_name text, p_brand text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
SELECT CASE
 WHEN p_category='gpu' AND p_type IS DISTINCT FROM 'gpu' THEN 'discard'
 WHEN p_category='gpu' AND coalesce(p_name,'') ~* '(^|[^[:alnum:]])(GT[[:space:]-]*(710|730|1030)|GTX[[:space:]-]*[0-9]{3,4}|RTX[[:space:]-]*20[0-9]{2})([^[:digit:]]|$)' THEN 'discard'
 WHEN p_category IN ('gpu','cpu','motherboard','memory','storage','case','psu','cooler','fan','thermal-paste','upgrade-kits') THEN 'core'
 WHEN p_category='handhelds' THEN 'discard'
 WHEN p_category='monitors' AND (p_name||' '||p_brand) ~* '(Dahua|Hikvision|CCTV|surveillance)' THEN 'discard'
 WHEN p_category='desktops' AND (p_name||' '||p_brand) ~* '(Giada|Vesa Mount for|media signage|digital signage)' THEN 'discard'
 WHEN p_category='desktops' AND p_name ~* '(\\mAIO\\M|all.in.one|all in one)' THEN 'office'
 WHEN p_category='laptops' AND p_name ~* '(ZBook|RTX[ -]?[0-9]{3} ?Ada|Precision Workstation)' THEN 'office'
 WHEN p_category='keyboards' THEN CASE WHEN (p_name||' '||p_brand) ~* '(gaming|mechanical|magnetic|hall.?effect|rapid trigger|qmk|keychron|redragon|corsair|rog|tuf|razer|hyperx|steelseries|gateron|keycap|switch(es)?|hot.?swap|rgb|80%|75%|60%)' THEN 'gaming' ELSE 'office' END
 WHEN p_category='mice' THEN CASE WHEN (p_name||' '||p_brand) ~* '(gaming|redragon|corsair|keychron|logitech g[0-9]|logitech pro|hyperx|rog|tuf|razer|steelseries|8k|[0-9]{4,5}dpi|sensor|paw[0-9]+|rgb|fps)' THEN 'gaming' ELSE 'office' END
 WHEN p_category='headsets' THEN CASE WHEN (p_name||' '||p_brand) ~* '(gaming|redragon|corsair|logitech g[0-9]|logitech pro|hyperx|razer|rog|tuf|steelseries|7[.]1|surround|esports|astro)' THEN 'gaming' ELSE 'office' END
 WHEN p_category='monitors' THEN CASE WHEN p_name ~* '(gaming|1[2468][0450] ?hz|2[0478][0450] ?hz|3[46][0-9] ?hz|500 ?hz|oled|qhd|wqhd|ultrawide|rog|tuf|predator|odyssey|freesync|g-sync|mini.?led|240hz)' THEN 'gaming' ELSE 'office' END
 WHEN p_category='laptops' THEN CASE WHEN p_name ~* '(rtx|geforce|gaming|legion|loq|rog|tuf|victus|omen|nitro|predator|alienware|katana|strix|zephyrus|raider|msi pulse|msi cyborg)' THEN 'gaming' ELSE 'office' END
 WHEN p_category='desktops' THEN CASE WHEN p_name ~* '(gaming|rtx|geforce|radeon rx|pcbuilder|rog|tuf|nitro|predator|alienware)' THEN 'gaming' ELSE 'office' END
 WHEN p_category='audio' THEN CASE WHEN p_name ~* '(microphone|audio interface|xlr|boom arm|stream|capture|studio|gaming|usb mic|pc speaker|sound card|mixer|audio mixer|headphone amp|logitech z|creative pebble)' THEN 'gaming' ELSE 'discard' END
 WHEN p_category='controllers' THEN CASE WHEN p_name ~* '(gamepad|game controller|racing|wheel|pedal|shifter|handbrake|joystick|flight sim|steering|pc controller|xbox controller)' THEN 'gaming' ELSE 'discard' END
 WHEN p_category='webcams' THEN CASE WHEN p_name ~* '(webcam|web cam|web camera|streaming|camera)' THEN 'gaming' ELSE 'discard' END
 WHEN p_category IN ('cables','adapters','networking','power-protection','desk-accessories','laptop-accessories') THEN 'aux'
 ELSE 'discard' END
$function$


CREATE OR REPLACE FUNCTION public.vt_specialist_selection_20261102()
 RETURNS TABLE(product_id text, category text, group_type text, ranking bigint, quota integer, quality_score integer)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
WITH base AS(
 SELECT p.id,p.category_slug,p.name,p.brand,p.stock_qty,p.retail_price,p.featured,p.media,
 public.vt_store_focus2_group(p.category_slug,p.type,p.name,p.brand) AS tier
 FROM public.store_products p
 WHERE p.status='active' AND p.visibility='public' AND p.sale_mode<>'hidden' AND p.is_demo=false
), scored AS(
 SELECT *,
 (CASE WHEN stock_qty>0 THEN 85 ELSE 0 END +
 CASE WHEN retail_price>0 THEN 20 ELSE 0 END +
 CASE WHEN coalesce(media->>'primaryImage','')<>'' THEN 15 ELSE 0 END +
 CASE WHEN featured THEN 8 ELSE 0 END +
 CASE WHEN name ~* '(gaming|rtx[ -]?(3|4|5)[0-9]{3}|geforce|166|180|200|240|360|500 ?hz|oled|magnetic|hall.?effect|rapid trigger|qmk|mechanical|streaming|creator|xlr|mousepad|8k)' THEN 120 ELSE 0 END +
 CASE WHEN name ~* '(rtx[ -]?[0-9]{3} ?ada|zbook|workstation|digital signage|home master)' THEN -90 ELSE 0 END +
 CASE WHEN category_slug='keyboards' AND name ~* '(keyboard|keychron k[0-9]|redragon)' THEN 45 ELSE 0 END +
 CASE WHEN category_slug='keyboards' AND name ~* '(switch(es)?|keycap)' AND name !~* 'keyboard' THEN -75 ELSE 0 END +
 CASE WHEN category_slug='laptops' AND name ~* '(rtx[ -]?([45][0-9]{3}|30[0-9]{2})|gaming|legion|loq|tuf|rog|nitro|predator|alienware|victus|omen)' THEN 130 ELSE 0 END +
 CASE WHEN category_slug='desktops' AND name ~* '(gaming|rtx[ -]?([345][0-9]{3})|geforce|prebuilt)' THEN 130 ELSE 0 END +
 CASE WHEN tier='office' AND name ~* '(prodesk|optiplex|thinkcentre|thinkpad|latitude|probook|elitebook|vostro|business|office|pro slim)' THEN 45 ELSE 0 END +
 CASE WHEN category_slug='desk-accessories' AND name ~* '(Thermal Grizzly|ARCTIC|mouse.?pad|mouse.?mat|ESD|thermal|fan)' THEN 100 ELSE 0 END +
 CASE WHEN category_slug IN ('cables','adapters') AND name ~* '(DisplayPort|HDMI|PCIE|SATA|USB ?3|USB-C|USB 3|type-C|CAT6|ethernet|DP to|adapter|docking)' THEN 70 ELSE 0 END +
 CASE WHEN category_slug='networking' AND name ~* '(wi.?fi ?6|wi.?fi ?7|router|mesh|gigabit)' THEN 80 ELSE 0 END +
 CASE WHEN category_slug='power-protection' AND name ~* '(UPS|600va|850va|1000va|1200va|surge protector)' THEN 80 ELSE 0 END
 ) AS pts
 FROM base
), ranked AS (
 SELECT id,category_slug,tier,pts,
 row_number() OVER(PARTITION BY category_slug,tier ORDER BY pts DESC,coalesce(stock_qty,0) DESC,id) AS rn,
 CASE
 WHEN tier='core' THEN 9999 WHEN tier='discard' THEN 0
 WHEN category_slug='laptops' THEN CASE WHEN tier='gaming' THEN 24 ELSE 8 END
 WHEN category_slug='desktops' THEN CASE WHEN tier='gaming' THEN 28 ELSE 10 END
 WHEN category_slug='keyboards' THEN CASE WHEN tier='gaming' THEN 110 ELSE 8 END
 WHEN category_slug='mice' THEN CASE WHEN tier='gaming' THEN 85 ELSE 8 END
 WHEN category_slug='headsets' THEN CASE WHEN tier='gaming' THEN 63 ELSE 6 END
 WHEN category_slug='monitors' THEN CASE WHEN tier='gaming' THEN 85 ELSE 10 END
 WHEN category_slug='audio' THEN 29
 WHEN category_slug='controllers' THEN 29
 WHEN category_slug='webcams' THEN 15
 WHEN category_slug='cables' THEN 55
 WHEN category_slug='adapters' THEN 50
 WHEN category_slug='networking' THEN 18
 WHEN category_slug='power-protection' THEN 16
 WHEN category_slug='desk-accessories' THEN 85
 WHEN category_slug='laptop-accessories' THEN 6
 ELSE 0 END AS limit_per_group
 FROM scored
)
SELECT id,category_slug,tier,rn,limit_per_group,pts FROM ranked;
$function$


CREATE OR REPLACE FUNCTION public.vt_guard_specialist_catalogue()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE tier text; previous_visibility text; previous_sale_mode text;
BEGIN
 NEW.metadata:=coalesce(NEW.metadata,'{}'::jsonb);
 -- Supplier upserts may replace metadata. Persist manual curation across those updates.
 IF TG_OP='UPDATE' THEN
   IF OLD.metadata ? 'focus2_approved' AND NOT NEW.metadata ? 'focus2_approved' THEN
     NEW.metadata:=NEW.metadata||jsonb_build_object('focus2_approved',OLD.metadata->'focus2_approved');
   END IF;
   IF OLD.metadata ? 'catalogue_focus2_original' AND NOT NEW.metadata ? 'catalogue_focus2_original' THEN
     NEW.metadata:=NEW.metadata||jsonb_build_object('catalogue_focus2_original',OLD.metadata->'catalogue_focus2_original');
   END IF;
   IF OLD.metadata ? 'catalogue_curation_original' AND NOT NEW.metadata ? 'catalogue_curation_original' THEN
     NEW.metadata:=NEW.metadata||jsonb_build_object('catalogue_curation_original',OLD.metadata->'catalogue_curation_original');
   END IF;
   IF OLD.metadata ? 'catalogue_curation_override' AND NOT NEW.metadata ? 'catalogue_curation_override' THEN
     NEW.metadata:=NEW.metadata||jsonb_build_object('catalogue_curation_override',OLD.metadata->'catalogue_curation_override');
   END IF;
 END IF;
 IF NEW.metadata->>'catalogue_curation_override'='include' THEN RETURN NEW; END IF;
 tier:=public.vt_store_focus2_group(NEW.category_slug,NEW.type,NEW.name,NEW.brand);
 IF tier='core' OR (tier<>'discard' AND NEW.metadata->>'focus2_approved'='true') THEN
   RETURN NEW;
 END IF;
 IF NOT (NEW.metadata ? 'catalogue_focus2_original') THEN
   IF TG_OP='UPDATE' THEN
     previous_visibility:=OLD.visibility;
     previous_sale_mode:=OLD.sale_mode;
   ELSE
     previous_visibility:=NEW.visibility;
     previous_sale_mode:=NEW.sale_mode;
   END IF;
   NEW.metadata:=NEW.metadata||jsonb_build_object(
    'catalogue_focus2_original',
    jsonb_build_object('visibility',previous_visibility,'sale_mode',previous_sale_mode,
      'public_store_eligible',NEW.metadata->'public_store_eligible')
   );
 END IF;
 NEW.metadata:=NEW.metadata||jsonb_build_object(
  'catalogue_focus2_reason',case when tier='discard' then 'out_of_scope' else 'not_in_selected_range' end,
  'catalogue_focus2','gaming-pc-specialist-20261102',
  'public_store_eligible',false
 );
 NEW.visibility:='private';
 NEW.sale_mode:='hidden';
 RETURN NEW;
END;
$function$


CREATE TRIGGER zzzz_volttech_specialist_guard BEFORE INSERT OR UPDATE ON public.store_products FOR EACH ROW EXECUTE FUNCTION vt_guard_specialist_catalogue();
