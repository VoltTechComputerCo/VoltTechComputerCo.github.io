"""Refresh approved LunaTech products in the public catalogue snapshot."""
import gzip
import json
import os
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

MAX_BYTES = 4 * 1024 * 1024


def supplier_url(value):
    url = urlsplit(value)
    return url.scheme == 'https' and url.netloc in {'lunatechit.co.za', 'www.lunatechit.co.za'}


class SupplierRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not supplier_url(newurl):
            raise ValueError('Unexpected supplier redirect')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def fetch_feed(url):
    if not supplier_url(url):
        raise ValueError('Expected an HTTPS LunaTech feed URL')
    request = Request(url, headers={'Accept': 'application/xml', 'User-Agent': 'VoltTechCatalogue/1.0'})
    with build_opener(SupplierRedirect()).open(request, timeout=25) as response:
        content = response.read(MAX_BYTES + 1)
    if len(content) > MAX_BYTES or b'<!DOCTYPE' in content.upper():
        raise ValueError('Unsupported XML document')
    return content


def parse_feed(content):
    root = ET.fromstring(content)
    items = root.findall('product')
    if root.tag != 'products' or len(items) < 200 or len(items) != len(root):
        raise ValueError('Unexpected or incomplete XML feed')
    rows = {}
    for item in items:
        sku = item.findtext('Model', '').strip().lower()
        qty = item.findtext('Qty', '').strip()
        if not re.fullmatch(r'[a-z0-9][a-z0-9._-]{0,99}', sku) or sku in rows or not re.fullmatch(r'-?[0-9]{1,9}', qty):
            raise ValueError('Invalid or duplicate SKU or stock quantity')
        images = [url.strip() for url in item.findtext('image_link', '').split(',')]
        image = next((url for url in images if supplier_url(url)), None)
        # A negative supplier balance means zero sellable units.
        rows[sku] = (max(0, int(qty)), image)
    return rows


def refresh(payload, rows):
    products = [p for p in payload['products'] if p['id'].startswith('lunatech-')]
    matched = pictures = 0
    for product in products:
        sku = product['id'].removeprefix('lunatech-')
        qty, image = rows.get(sku, (None, None))
        product['stock_qty'] = qty
        product['stock_status'] = 'unknown' if qty is None else 'in-stock' if qty else 'out-of-stock'
        if qty is not None:
            product['supplier_stock_checked_at'] = payload['generatedAt']
            matched += 1
        if image:
            product.update(primary_image=image, direct_image=image)
            pictures += 1
    return matched, pictures, len(products)


def main():
    path = Path('assets/data/catalogue.json.gz')
    payload = json.loads(gzip.decompress(path.read_bytes()))
    try:
        rows = parse_feed(fetch_feed(os.environ.get('LUNATECH_FEED_URL', '')))
    except (OSError, ValueError, ET.ParseError) as error:
        print(f'::warning::LunaTech refresh unavailable ({type(error).__name__}). Availability will be marked unconfirmed.')
        rows = {}
    matched, images, total = refresh(payload, rows)
    path.write_bytes(gzip.compress(json.dumps(payload, ensure_ascii=False, separators=(',', ':')).encode(), mtime=0))
    print(f'LunaTech: matched {matched}/{total} approved products from {len(rows)} feed SKUs; applied {images} supplier images')


if __name__ == '__main__':
    main()
