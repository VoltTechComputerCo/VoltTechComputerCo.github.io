-- Expanded curated PC store policy. Legacy GPUs and server/appliance products remain excluded.
create or replace function public.vt_gaming_product_allowed(p_type text,p_name text,p_description text default '') returns boolean language plpgsql immutable set search_path='' as $$
declare n text:=lower(coalesce(p_name,'')); t text:=lower(coalesce(p_name,'')||' '||coalesce(p_description,''));
begin
 if n~'server|poweredge|enterprise|surveillance|skyhawk|ironwolf|western digital purple|cctv|whiteboard|ps/?2|disney|zakumi|calculator|ipad|cabinet fan' then return false;end if;
 if p_type='gpu' then return n~'rtx[ -]*[3-9][0-9]{3}|rx[ -]*[6-9][0-9]{3}|arc[ -]*[ab][0-9]{3}' and n!~'quadro|rtx pro';end if;
 if p_type='cpu' then return coalesce(substring(n from 'ryzen[[:space:]]+[3579][[:space:]]+([0-9]{4,5})')::integer,0)>=5000 or coalesce(substring(n from 'core[[:space:]]+i[3579][ -]*([0-9]{4,5})')::integer,0)>=10000 or n~'core ultra';end if;
 if p_type='motherboard' then return t~'am[45]|lga[ -]*(1200|1700|1851)|[abxh][56789][0-9]{2}';end if;
 if p_type='memory' then return t~'ddr[ -]?[45]' and n!~'so[ -]?dimm|ecc|registered';end if;
 if p_type='storage' then return t~'ssd|solid state|nvme|hard (disk|drive)|hdd' and n!~'bracket';end if;
 if p_type='psu' then return t~'([3-9][0-9]{2}|[1-9][0-9]{3})[[:space:]]*w';end if;
 if p_type='case' then return t~'case|chassis|tower';end if;
 if p_type='cooler' then return t~'cooler|cooling|heatsink|liquid|aio';end if;
 if p_type='fan' then return t~'fan';end if;
 if p_type='accessory' then return t~'thermal|heatsink compound|cable|adapter|adaptor|hub|docking|enclosure|mount|arm|stand|chair|mousepad|mouse pad|mouse mat|wrist|desk|lighting|controller|bracket|keyboard';end if;
 if p_type='peripheral' then return t~'keyboard|mouse|mice|monitor|headset|headphone|microphone|gaming mic|speaker|webcam|controller|racing|wheel|pedal|flight|joystick|audio interface|capture';end if;
 return false;
end $$;
create or replace function public.vt_guard_gaming_catalogue() returns trigger language plpgsql set search_path='' as $$
begin
 if not public.vt_gaming_product_allowed(new.type,new.name,new.short_description) or coalesce(new.is_demo,false) then new.visibility:='private';new.sale_mode:='hidden';end if;
 return new;
end $$;
