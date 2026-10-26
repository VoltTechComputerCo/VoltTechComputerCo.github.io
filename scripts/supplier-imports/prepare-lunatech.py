"""Prepare private SQL batches from LunaTech XML. Never commit the output.

Usage: python prepare-lunatech.py downloaded-feed.xml /tmp/lunatech-import
Wholesale excludes VAT; RRP includes VAT (official LunaTech price list).
"""
import json
import re
import sys
import xml.etree.ElementTree as ET
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

def money(value):
    return Decimal((value or '0').replace(',', '').strip())

def classify(sku, title):
    title = title.lower()
    if sku.startswith('ACPCC') or 'der8enchtable' in title:
        return 'case', 'case'
    if sku.startswith(('ACFRE', 'ACALP')) or 'ssd cooler' in title:
        return 'cooler', 'cooler'
    if sku.startswith('ACFAN') and not any(x in title for x in ['hub', 'grill', 'controller']):
        return 'fan', 'fan'
    if any(x in title for x in ['aeronaut', 'hydronaut', 'kryonaut', 'conductonaut', 'duronaut', 'minus pad', 'carbonaut', 'kryosheet', 'phasesheet', 'putty', 'polartherm', 'arctic mx-', 'arctic tp-']):
        return 'accessory', 'thermal-paste'
    if 'splitter cable' in title:
        return 'accessory', 'cables'
    return 'accessory', 'desk-accessories'

rows = []
for p in ET.parse(sys.argv[1]).getroot():
    sku = p.findtext('Model', '').strip()
    title = p.findtext('title', '').strip()
    cost = money(p.findtext('price'))
    assert sku and title and cost > 0
    brand = 'Thermal Grizzly' if sku.startswith('TG-') else 'Polartherm' if sku.startswith('PT-') else 'ARCTIC'
    name = title if brand.lower() in title.lower() else brand + ' ' + title
    kind, category = classify(sku, title)
    qty = int(p.findtext('Qty') or '0')
    assert qty >= 0
    images = [u.strip() for u in p.findtext('image_link', '').split(',') if u.strip()]
    assert all(u.startswith('https://lunatechit.co.za/') for u in images)
    cost_incl = (cost * Decimal('1.15')).quantize(Decimal('.01'), rounding=ROUND_HALF_UP)
    retail = (cost_incl * Decimal('1.20')).quantize(Decimal('.01'), rounding=ROUND_HALF_UP)
    rows.append(dict(sku=sku, name=name, brand=brand, kind=kind, category=category,
                     cost=float(cost_incl), retail=float(retail), rrp=float(money(p.findtext('RRP'))),
                     qty=qty, stock='in-stock' if qty else 'out-of-stock',
                     description=p.findtext('description', ''), images=images))
assert len(rows) >= 200 and len({r['sku'] for r in rows}) == len(rows)
output = Path(sys.argv[2]); output.mkdir(parents=True, exist_ok=True)
for index in range(0, len(rows), 25):
    payload = json.dumps(rows[index:index+25], ensure_ascii=False).replace("'", "''")
    sql = """begin;
insert into public.store_suppliers(id,name,priority,feed_mode,feed_status,feed_last_synced_at,portal_url,metadata)
values ('lunatech','LunaTech IT',30,'xml','snapshot',now(),'https://lunatechit.co.za/',
'{"markup_percent":20,"cost_vat_basis":"inclusive-normalized","automatic_sync":false}'::jsonb)
on conflict(id) do update set feed_last_synced_at=now(),updated_at=now();
create temporary table luna_import on commit drop as
select * from jsonb_to_recordset('PAYLOAD'::jsonb) as r(sku text,name text,brand text,kind text,category text,cost numeric,retail numeric,rrp numeric,qty integer,stock text,description text,images jsonb);
insert into public.store_products(id,slug,type,brand,manufacturer,name,model,status,visibility,sale_mode,retail_price,currency,stock_qty,stock_status,price_checked_at,short_description,identifiers,media,category_slug,metadata)
select 'lunatech-'||lower(sku),'lunatech-'||lower(sku),kind,brand,brand,name,sku,'active','public','quote',retail,'ZAR',qty,stock,now(),description,
jsonb_build_object('sku',sku,'mpn',sku,'supplier','lunatech','supplierSku',sku),
jsonb_build_object('primaryImage',images->>0,'directImage',images->>0,'images',images),category,
jsonb_build_object('supplier','lunatech','preferred_supplier','lunatech','preferred_supplier_name','LunaTech IT','connected_suppliers',jsonb_build_array('lunatech'),'stock_connected',true,'pricing_state','priced','markup_percent',20,'regular_markup_percent',20,'pricing_policy','lunatech-20','rrp_inclusive',rrp,'public_store_eligible',true,'auto_markup_disabled',false,'last_supplier_sync',now())
from luna_import
on conflict(id) do update set name=excluded.name,retail_price=excluded.retail_price,stock_qty=excluded.stock_qty,stock_status=excluded.stock_status,price_checked_at=now(),media=excluded.media,short_description=excluded.short_description,metadata=public.store_products.metadata||excluded.metadata,updated_at=now();
insert into public.store_supplier_offers(product_id,supplier_id,supplier_name,supplier_sku,cost_price,stock_qty,stock_status,last_checked,metadata)
select 'lunatech-'||lower(sku),'lunatech','LunaTech IT',sku,cost,qty,stock,now(),jsonb_build_object('cost_vat_basis','inclusive-normalized','supplier_vat_rate',15,'rrp_inclusive',rrp,'source','lunatech-xml') from luna_import
on conflict(product_id,supplier_id,supplier_sku) do update set cost_price=excluded.cost_price,stock_qty=excluded.stock_qty,stock_status=excluded.stock_status,last_checked=now(),metadata=excluded.metadata,updated_at=now();
update public.store_products p set visibility='public',sale_mode='quote',metadata=p.metadata||'{"catalogue_approval":"lunatech-full-range-20261026"}'::jsonb
where p.id in(select 'lunatech-'||lower(sku) from luna_import);
commit;
""".replace('PAYLOAD', payload)
    (output / f'batch-{index//25:02}.sql').write_text(sql)
print(json.dumps({'products':len(rows),'batches':(len(rows)+24)//25,'brands':{b:sum(r['brand']==b for r in rows) for b in sorted({r['brand'] for r in rows})}}))
