-- Expanded PC and upgrade range. No generation floor; complete systems stay separate.
create or replace function public.vt_gaming_product_allowed(p_type text,p_name text,p_description text default '') returns boolean language plpgsql immutable set search_path='' as $$
declare n text:=lower(coalesce(p_name,'')); t text:=lower(coalesce(p_name,'')||' '||coalesce(p_description,''));
begin
 if n~'server|poweredge|enterprise|enterprice|surveillance|skyhawk|western digital purple|cctv|whiteboard|ps/?2|disney|zakumi|calculator|ipad|cabinet fan|food processor|microprocessor control|blender|kettle|toaster|air fryer|coffee maker|vacuum|heater|hair dryer|shaver|hair clipper|pedestal fan|desk fan|ceiling fan|mellerware|russell hobbs|taurus |feelive' then return false;end if;
 if p_type='laptop' then return n!~'notebook memory|laptop memory|memory module|cable lock|lock plate|backpack|laptop bag|notebook case|laptop sleeve';end if;
 if p_type='peripheral' and n~'mini[- ]?pc|mini desktop|desktop[[:space:]]+pc|professional desktop|gaming pc|creator pc|^giada[[:space:]]' then return true;end if;
 if p_type='peripheral' and n~'desktop|tower|thinkcentre|prodesk|elitedesk|proone|prostudio|precision|mini[- ]?pc|gaming pc' and n~'ssd|nvme|emmc' then return true;end if;
 if p_type='gpu' then return n~'geforce|\m(rtx|gtx|gt)[ -]*[0-9]{3,4}|radeon|\mrx[ -]*[0-9]{3,4}|arc[ -]*[ab][0-9]{3}' and n!~'quadro|rtx pro|tesla';end if;
 if p_type='cpu' then return n~'ryzen|core[[:space:]]+(i[3579]|ultra)|athlon|pentium|celeron|processor';end if;
 if p_type='motherboard' then return t~'motherboard|mainboard|am[345]|lga[ -]*[0-9]{3,4}|[abxh][1-9][0-9]{2}';end if;
 if p_type='memory' then return t~'ddr[ -]?[2345]\M|memory module' and n!~'ecc|registered';end if;
 if p_type='storage' then return t~'ssd|solid state|nvme|hard (disk|drive)|hdd|flash drive|usb drive' and n!~'bracket';end if;
 if p_type='psu' then return t~'power supply|psu|[0-9]{3,4}[[:space:]]*w';end if;
 if p_type='case' then return t~'case|chassis|tower';end if;
 if p_type='cooler' then return t~'cooler|cooling|heatsink|liquid|aio';end if;
 if p_type='fan' then return t~'fan|pacelight';end if;
 if p_type='accessory' then return t~'thermal|heatsink compound|cable|adapter|adaptor|hub|docking|enclosure|mount|arm|stand|chair|mousepad|mouse pad|mouse mat|wrist|desk|lighting|controller|bracket|keyboard|bag|sleeve|backpack|lock|charger|router|network|wi.fi|access point|\mups\M|surge|power strip|power bank|power station|inverter|card reader';end if;
 if p_type='peripheral' then return t~'galaxy tab|tablet|keyboard|mouse|mice|monitor|headset|headphone|earphone|earbud|microphone|gaming mic|speaker|soundbar|pop filter|shock mount|webcam|controller|racing|wheel|pedal|flight|joystick|audio interface|capture';end if;
 return false;
end $$;
-- Repair existing missing categories and notebook accessories before publishing eligible rows.
update public.store_products set type='memory',category_slug='memory',specs=specs||jsonb_build_object('productKind','Notebook memory'),metadata=metadata||jsonb_build_object('identity_curated',false)
where is_demo=false and name~*'(notebook|laptop).*(memory|ram)|so[- ]?dimm' and type='laptop';
update public.store_products set type='accessory',category_slug='laptop-accessories',metadata=metadata||jsonb_build_object('identity_curated',false)
where is_demo=false and type='laptop' and name~*'cable lock|lock plate|backpack|laptop bag|notebook case|laptop sleeve';
update public.store_products set type='laptop',category_slug='laptops',metadata=metadata||jsonb_build_object('identity_curated',false)
where id='tarsus-e51a95f2a2a90482';
update public.store_products set type='case',category_slug='case' where type='gpu' and name~*'chassis|computer case|mid[- ]?tower';
update public.store_products set category_slug=case
 when name~*'thermal.*(paste|compound)|heatsink compound' then 'thermal-paste'
 when name~*'mousepad|mouse pad|mouse mat|wrist rest|gaming mat|round mat' then 'desk-accessories'
 when name~*'headset|headphone|heatset' then 'headsets'
 when name~*'keyboard|gaming combo|gaming.*combo' then 'keyboards'
 when name~*'mouse|mice' then 'mice'
 when name~*'monitor' then 'monitors'
 when name~*'webcam' then 'webcams'
 when name~*'microphone|speaker|pop filter|mdrill|thronmax' and name!~*'cable' then 'audio'
 when name~*'cable' then 'cables'
 when name~*'controller|racing|wheel|pedal' then 'controllers'
 else 'desk-accessories' end
where is_demo=false and category_slug is null and type in ('accessory','peripheral');
update public.store_products set visibility='public',sale_mode='quote'
where is_demo=false and status='active' and visibility='private' and public.vt_gaming_product_allowed(type,name,short_description)
and coalesce((metadata->>'public_store_eligible')::boolean,true) and name!~*'healthcare|surveillance';
