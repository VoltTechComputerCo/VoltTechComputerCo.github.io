create or replace function public.vt_gaming_product_allowed(p_type text,p_name text,p_description text default '') returns boolean language plpgsql immutable set search_path='' as $$
declare n text:=lower(coalesce(p_name,'')); t text:=lower(coalesce(p_name,'')||' '||coalesce(p_description,'')); watts integer;
begin
 if n~'server|poweredge|xeon|enterprise|enterprice|surveillance|skyhawk|ironwolf|\mnas\M|\mn300\M|\ms300\M|western digital purple|cctv|whiteboard|ps/?2|disney|zakumi|calculator|ipad|professional desktop|cabinet fan|rack' then return false;end if;
 if p_type='gpu' then return n~'\mrtx[ -]*[3-9][0-9]{3}(ti|super)?\M|\mrx[ -]*[6-9][0-9]{3}(xt|xtx)?\M|\marc[ -]*[ab][0-9]{3}\M' and n!~'quadro|workstation|rtx pro';end if;
 if p_type='cpu' then return coalesce(substring(n from 'ryzen[[:space:]]+[3579][[:space:]]+([0-9]{4,5})')::integer,0)>=5000 or coalesce(substring(n from 'core[[:space:]]+i[3579][ -]*([0-9]{4,5})')::integer,0)>=10000 or n~'core ultra';end if;
 if p_type='motherboard' then return t~'\mam[45]\M|lga[ -]*(1200|1700|1851)|\m[abxh][56789][0-9]{2}';end if;
 if p_type='memory' then return t~'\mddr[ -]?[45]\M' and n!~'so[ -]?dimm|\mecc\M|registered' and not (n~'\m4gb\M' and n!~'\m(8|16|24|32|48|64|96|128)gb\M');end if;
 if p_type='storage' then return t~'ssd|solid state|nvme' and n!~'external|portable|usb|bracket';end if;
 if p_type='psu' then watts:=substring(t from '([0-9]{3,4})[[:space:]]*w(?:att)?')::integer;return coalesce(watts,0)>=500 and t~'80[ -]*(plus|[+])|bronze|silver|gold|platinum|titanium';end if;
 if p_type='case' then return n~'case|chassis';end if;
 if p_type='cooler' then return n!~'p4|freezer a30' and t~'\mam[45]\M|lga[ -]*(1200|1700|1851)|liquid|aio|crater m1|[1234][0-9]0mm';end if;
 if p_type='fan' then return t~'120|140|gemini m1|pacelight';end if;
 if p_type='accessory' then return n~'thermal.*(paste|compound)|heatsink compound';end if;
 if p_type='peripheral' then return n~'gaming|gamer|trust.*gxt|ultragear|odyssey|hyperx|roccat kain|logitech.*(\mg[0-9]|pro x|c92[02]|z[0-9])|mechanical.*keyboard|thronmax|wrist rest|sharkoon.*(mat|purewriter|pacelight)|kwg orion' or (n~'monitor' and t~'\m(1[2-9][0-9]|[2-9][0-9]{2})[[:space:]]*hz');end if;
 return false;
end $$;
revoke all on function public.vt_gaming_product_allowed(text,text,text) from public;
grant execute on function public.vt_gaming_product_allowed(text,text,text) to anon,authenticated,service_role;

create or replace function public.vt_guard_gaming_catalogue() returns trigger language plpgsql set search_path='' as $$
begin
 if not public.vt_gaming_product_allowed(new.type,new.name,new.short_description) or coalesce(new.is_demo,false) then new.visibility:='hidden';new.sale_mode:='hidden';end if;
 return new;
end $$;
revoke all on function public.vt_guard_gaming_catalogue() from public,anon,authenticated;
drop trigger if exists guard_gaming_catalogue on public.store_products;
create trigger guard_gaming_catalogue before insert or update on public.store_products for each row execute function public.vt_guard_gaming_catalogue();
drop policy if exists "Public can browse supplier-backed store products" on public.store_products;
create policy "Public can browse supplier-backed store products" on public.store_products for select to anon,authenticated using (status='active' and visibility='public' and sale_mode<>'hidden' and not coalesce(is_demo,false) and public.vt_has_real_supplier_offer(id) and public.vt_gaming_product_allowed(type,name,short_description));
