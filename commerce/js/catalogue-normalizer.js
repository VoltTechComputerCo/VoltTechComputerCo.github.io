const DEFAULT_CURRENCY = "ZAR";
const FRESH_HOURS = 24;
const AGING_HOURS = 72;

export function normalizeCatalogueProducts(products = []) {
    const normalized = products
        .filter(Boolean)
        .map(normalizeProduct)
        .filter(product => !["inactive", "discontinued"].includes(product.status));

    return deduplicateProducts(normalized);
}

export function normalizeProduct(product) {
    if (!product?.id) throw new Error("Product missing id");
    if (!product?.type) throw new Error(`Product ${product.id} missing type`);
    if (!product?.name) throw new Error(`Product ${product.id} missing name`);

    const identifiers = normalizeIdentifiers(product.identifiers || {});

    return {
        ...product,
        id: String(product.id).trim(),
        type: String(product.type).trim().toLowerCase(),
        brand: cleanText(product.brand),
        manufacturer: cleanText(product.manufacturer || product.brand),
        name: cleanText(product.name),
        model: cleanText(product.model),
        status: cleanText(product.status || "active").toLowerCase(),
        identifiers,
        mpn: identifiers.mpn,
        specs: product.specs || {},
        compatibility: product.compatibility || {},
        metadata: { ...(product.metadata || {}) }
    };
}

export function normalizeSupplierFeed(feed, options = {}) {
    if (!feed || typeof feed !== "object") throw new Error("Supplier feed is not an object");

    const supplier = feed.supplier || {};
    const supplierId = cleanText(supplier.id || options.supplierId || "unknown");
    const supplierName = cleanText(supplier.name || supplierId || "Supplier");
    const defaultCurrency = cleanText(feed.currency || options.currency || DEFAULT_CURRENCY).toUpperCase();
    const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());

    const offers = (feed.offers || [])
        .filter(Boolean)
        .map((offer, index) => normalizeOffer(offer, {
            supplierId,
            supplierName,
            defaultCurrency,
            now,
            index
        }))
        .filter(Boolean);

    return {
        schemaVersion: feed.schemaVersion || "0.6.0",
        supplier: { ...supplier, id: supplierId, name: supplierName },
        generatedAt: feed.generatedAt || null,
        offers
    };
}

export function normalizeOffer(offer, context = {}) {
    const supplierId = context.supplierId || "unknown";
    const supplierName = context.supplierName || supplierId;
    const price = Number(offer.price);
    const stock = offer.stock === null || offer.stock === undefined ? null : Number(offer.stock);
    const stockStatus = normalizeStockStatus(offer.stockStatus, stock);
    const lastChecked = normalizeDateString(offer.lastChecked || offer.updatedAt || offer.generatedAt);
    const freshness = getOfferFreshness(lastChecked, context.now);

    if (!Number.isFinite(price) || price < 0) {
        console.warn(`Skipping invalid supplier price at ${supplierId} offer ${context.index ?? "?"}`);
        return null;
    }

    return {
        productId: cleanText(offer.productId) || null,
        supplier: supplierId,
        source: supplierId,
        supplierName,
        supplierSku: cleanText(offer.supplierSku) || null,
        identifiers: normalizeIdentifiers(offer.identifiers || {}),
        price,
        currency: cleanText(offer.currency || context.defaultCurrency || DEFAULT_CURRENCY).toUpperCase(),
        stock: Number.isFinite(stock) ? stock : null,
        stockStatus,
        lastChecked,
        freshness,
        stale: freshness === "stale" || freshness === "unknown",
        eligibleForBestPrice:
            !["out-of-stock", "discontinued"].includes(stockStatus) &&
            freshness !== "stale"
    };
}

export function resolveOfferProductId(offer, products, indexes = null) {
    if (offer.productId && products.some(product => product.id === offer.productId)) {
        return offer.productId;
    }

    const idx = indexes || buildProductIdentityIndexes(products);
    const ids = offer.identifiers || {};

    for (const [kind, value] of Object.entries(ids)) {
        if (!value) continue;
        const match = idx.byIdentifier.get(`${kind}:${value}`);
        if (match) return match.id;
    }

    return null;
}

export function buildProductIdentityIndexes(products = []) {
    const byId = new Map();
    const byIdentifier = new Map();
    const collisions = [];

    for (const product of products) {
        byId.set(product.id, product);

        for (const [kind, value] of Object.entries(product.identifiers || {})) {
            if (!value) continue;
            const key = `${kind}:${value}`;
            const existing = byIdentifier.get(key);

            if (existing && existing.id !== product.id) {
                collisions.push({ key, productIds: [existing.id, product.id] });
            } else {
                byIdentifier.set(key, product);
            }
        }
    }

    return { byId, byIdentifier, collisions };
}

export function getOfferFreshness(lastChecked, nowInput = new Date()) {
    if (!lastChecked) return "unknown";

    const checked = new Date(lastChecked);
    const now = nowInput instanceof Date ? nowInput : new Date(nowInput);

    if (Number.isNaN(checked.getTime()) || Number.isNaN(now.getTime())) return "unknown";

    const ageHours = Math.max(0, (now.getTime() - checked.getTime()) / 36e5);

    if (ageHours <= FRESH_HOURS) return "fresh";
    if (ageHours <= AGING_HOURS) return "aging";
    return "stale";
}

export function normalizeIdentifiers(identifiers = {}) {
    return {
        mpn: normalizeIdentifier(identifiers.mpn),
        ean: normalizeIdentifier(identifiers.ean),
        upc: normalizeIdentifier(identifiers.upc),
        gtin: normalizeIdentifier(identifiers.gtin)
    };
}

function deduplicateProducts(products) {
    const result = [];
    const byStrongIdentity = new Map();
    const byId = new Set();

    for (const product of products) {
        if (byId.has(product.id)) throw new Error(`Duplicate product id: ${product.id}`);
        byId.add(product.id);

        const identity = strongestIdentity(product);

        if (!identity) {
            result.push(product);
            continue;
        }

        const existingIndex = byStrongIdentity.get(identity);

        if (existingIndex === undefined) {
            byStrongIdentity.set(identity, result.length);
            result.push(product);
            continue;
        }

        result[existingIndex] = mergeDuplicateProducts(result[existingIndex], product);
    }

    return result;
}

function strongestIdentity(product) {
    const ids = product.identifiers || {};
    if (ids.mpn) return `mpn:${ids.mpn}`;
    if (ids.gtin) return `gtin:${ids.gtin}`;
    if (ids.ean) return `ean:${ids.ean}`;
    if (ids.upc) return `upc:${ids.upc}`;
    return null;
}

function mergeDuplicateProducts(primary, duplicate) {
    return {
        ...primary,
        identifiers: mergeIdentifiers(primary.identifiers, duplicate.identifiers),
        specs: { ...(duplicate.specs || {}), ...(primary.specs || {}) },
        compatibility: { ...(duplicate.compatibility || {}), ...(primary.compatibility || {}) },
        media: mergeMedia(primary.media, duplicate.media),
        metadata: {
            ...(duplicate.metadata || {}),
            ...(primary.metadata || {}),
            mergedProductIds: Array.from(new Set([
                ...(primary.metadata?.mergedProductIds || []),
                primary.id,
                ...(duplicate.metadata?.mergedProductIds || []),
                duplicate.id
            ]))
        }
    };
}

function mergeIdentifiers(a = {}, b = {}) {
    return {
        mpn: a.mpn || b.mpn || null,
        ean: a.ean || b.ean || null,
        upc: a.upc || b.upc || null,
        gtin: a.gtin || b.gtin || null
    };
}

function mergeMedia(a = {}, b = {}) {
    const images = Array.from(new Set([
        ...(a.images || []),
        ...(b.images || [])
    ].filter(Boolean)));

    return {
        ...b,
        ...a,
        primaryImage: a.primaryImage || b.primaryImage || null,
        images
    };
}

function normalizeStockStatus(status, stock) {
    const value = cleanText(status).toLowerCase();

    const aliases = {
        instock: "in-stock",
        in_stock: "in-stock",
        available: "in-stock",
        low: "low-stock",
        outofstock: "out-of-stock",
        out_of_stock: "out-of-stock",
        backorder: "available-to-order",
        preorder: "expected-soon"
    };

    if (aliases[value]) return aliases[value];
    if (value) return value;
    if (stock === 0) return "out-of-stock";
    if (Number.isFinite(stock) && stock > 0) return stock <= 2 ? "low-stock" : "in-stock";

    return "stock-unconfirmed";
}

function normalizeDateString(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeIdentifier(value) {
    const text = cleanText(value);
    return text ? text.toUpperCase().replace(/\s+/g, "") : null;
}

function cleanText(value) {
    return value === null || value === undefined ? "" : String(value).trim();
}
